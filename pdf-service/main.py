"""
SmartLearning PDF/AI microservice
----------------------------------
Handles the parts of the pipeline that are genuinely Python-native:
  1. PDF text extraction with PyMuPDF (page-aware)
  2. Structure-aware, token-budgeted chunking with page citations
  3. Embedding generation (sentence-transformers, runs locally, no API key needed)
  4. Per-document FAISS index build + persistence
  5. Document-local expansion, candidate search and passage ranking

The Spring Boot backend calls this service over HTTP; it never touches
PyMuPDF/FAISS directly. Each document gets its own FAISS index file plus a
JSON sidecar with the chunk text/page metadata (FAISS itself only stores
vectors + integer ids).
"""
import json
import os
import re
import uuid
from pathlib import Path
from typing import List, Optional

import fitz  # PyMuPDF
import numpy as np
import faiss
from fastapi import FastAPI, UploadFile, File, HTTPException
from pydantic import BaseModel, Field
from pipeline import chunk_pages, terminology, expand, units, duplicate
from sentence_transformers import SentenceTransformer

UPLOAD_DIR = Path(os.getenv("UPLOAD_DIR", "./data/uploads"))
FAISS_DIR = Path(os.getenv("FAISS_DIR", "./data/faiss"))
EMBEDDING_MODEL_NAME = os.getenv("EMBEDDING_MODEL", "all-MiniLM-L6-v2")
CHUNK_SIZE_CHARS = 900
CHUNK_OVERLAP_CHARS = 150
CANDIDATE_MULTIPLIER = 4
PASSAGE_CHARS = 420
MAX_QUERY_VARIANTS = 4
INDEX_VERSION = 2

UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
FAISS_DIR.mkdir(parents=True, exist_ok=True)

app = FastAPI(title="SmartLearning PDF/AI Service")

# Loaded lazily on first use so the container starts fast even before the
# model weights have been downloaded.
_model: Optional[SentenceTransformer] = None


def get_model() -> SentenceTransformer:
    global _model
    if _model is None:
        _model = SentenceTransformer(EMBEDDING_MODEL_NAME)
    return _model


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class ProcessResponse(BaseModel):
    document_id: str
    page_count: int
    chunk_count: int


class SearchRequest(BaseModel):
    query: str = Field(min_length=1, max_length=2000, pattern=r"\S")
    top_k: int = Field(default=5, ge=1, le=50)
    context: bool = False


class SearchHit(BaseModel):
    text: str
    page: int
    score: float


class SearchResponse(BaseModel):
    document_id: str
    hits: List[SearchHit]


class ContentHit(SearchHit):
    heading: str = ""
    section_id: str = "0"


class FullTextResponse(BaseModel):
    document_id: str
    page_count: int
    chunks: List[ContentHit]


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def index_paths(document_id: str):
    base = FAISS_DIR / document_id
    return base.with_suffix(".index"), base.with_suffix(".json")


def chunk_page_text(page_num: int, text: str) -> List[dict]:
    return chunk_pages([(page_num, text)], CHUNK_SIZE_CHARS, CHUNK_OVERLAP_CHARS)


def extract_chunks(doc):
    model = get_model()
    def fits(text):
        return len(model.tokenizer.encode(text, add_special_tokens=True)) <= model.max_seq_length
    pages = [(i + 1, page.get_text("text", sort=True)) for i, page in enumerate(doc)]
    return chunk_pages(pages, CHUNK_SIZE_CHARS, CHUNK_OVERLAP_CHARS, fits)


def build_index(document_id: str, chunks: List[dict], page_count=None) -> None:
    model = get_model()
    texts = [c["text"] for c in chunks]
    embeddings = model.encode(texts, normalize_embeddings=True)
    embeddings = np.array(embeddings, dtype="float32")

    dim = embeddings.shape[1]
    index = faiss.IndexFlatIP(dim)  # inner product on normalized vecs = cosine sim
    index.add(embeddings)

    index_path, meta_path = index_paths(document_id)
    faiss.write_index(index, str(index_path))
    meta_path.write_text(json.dumps({"version": INDEX_VERSION, "model": EMBEDDING_MODEL_NAME,
        "page_count": page_count or max(c["page"] for c in chunks),
        "chunks": chunks, "aliases": terminology(chunks)}, ensure_ascii=False), encoding="utf-8")


def load_index(document_id: str):
    index_path, meta_path = index_paths(document_id)
    if not index_path.exists() or not meta_path.exists():
        raise HTTPException(status_code=404, detail="No index found for this document")
    index = faiss.read_index(str(index_path))
    metadata = json.loads(meta_path.read_text(encoding="utf-8"))
    if isinstance(metadata, list):
        # Explicit migration through /process is required to repair old word boundaries.
        metadata = {"chunks": metadata, "aliases": terminology(metadata), "legacy": True}
    elif metadata.get("model") != EMBEDDING_MODEL_NAME or metadata.get("version") != INDEX_VERSION:
        raise HTTPException(status_code=409, detail="Reprocess PDF: embedding model or index version changed")
    if index.ntotal != len(metadata["chunks"]) or index.d != get_model().get_sentence_embedding_dimension():
        raise HTTPException(status_code=409, detail="Reprocess PDF: incompatible index")
    return index, metadata


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/process", response_model=ProcessResponse)
async def process_pdf(file: UploadFile = File(...), document_id: Optional[str] = None):
    """
    Extract text page-by-page with PyMuPDF, chunk it, embed the chunks,
    and persist a FAISS index for later semantic search / RAG chat.
    """
    document_id = document_id or str(uuid.uuid4())

    saved_path = UPLOAD_DIR / f"{document_id}.pdf"
    content = await file.read()
    saved_path.write_bytes(content)

    try:
        doc = fitz.open(str(saved_path))
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Could not read PDF: {exc}")

    try:
        all_chunks = extract_chunks(doc)
        page_count = len(doc)
    finally:
        doc.close()

    if not all_chunks:
        raise HTTPException(status_code=422, detail="No extractable text found in PDF (scanned image PDF?)")

    build_index(document_id, all_chunks, page_count)

    return ProcessResponse(document_id=document_id, page_count=page_count, chunk_count=len(all_chunks))


@app.post("/search/{document_id}", response_model=SearchResponse)
def search(document_id: str, req: SearchRequest):
    index, metadata = load_index(document_id)
    chunks = metadata["chunks"]
    if not chunks:
        return SearchResponse(document_id=document_id, hits=[])
    model = get_model()
    variants, evidence = expand(req.query.strip(), metadata["aliases"], MAX_QUERY_VARIANTS)
    vectors = np.asarray(model.encode(variants, normalize_embeddings=True), dtype="float32")
    candidate_k = min(max(req.top_k * CANDIDATE_MULTIPLIER, 20), len(chunks))
    scores, ids = index.search(vectors, candidate_k)
    candidates = {}
    for row_scores, row_ids in zip(scores, ids):
        for score, idx in zip(row_scores, row_ids):
            if idx >= 0:
                candidates[int(idx)] = max(float(score), candidates.get(int(idx), -1.0))

    # Rerank sentence/word-bounded passages from the larger candidate pool.
    passages = [(idx, text) for idx in candidates
                for text in units(chunks[idx]["text"], PASSAGE_CHARS)]
    if not passages:
        return SearchResponse(document_id=document_id, hits=[])
    passage_vectors = np.asarray(model.encode([p[1] for p in passages],
                                normalize_embeddings=True), dtype="float32")
    relevance = (passage_vectors @ vectors.T).max(axis=1)
    ranked = sorted(zip(passages, relevance), key=lambda item: (-float(item[1]), item[0][0]))
    hits, selected, used = [], [], set()
    for (idx, passage), score in ranked:
        if idx in used or duplicate(passage, selected):
            continue
        c = chunks[idx]
        text = c["text"] if req.context else passage
        if req.context and duplicate(text, [h.text for h in hits]):
            continue
        hits.append(SearchHit(text=text, page=c["page"], score=float(score)))
        selected.append(passage)
        used.add(idx)
        if len(hits) == req.top_k:
            break
    # Include the source definition with its own page, never attach invented aliases.
    if req.context:
        for alias in evidence[:MAX_QUERY_VARIANTS]:
            proof = alias.get("evidence")
            if proof and not any(h.text == proof and h.page == alias["page"] for h in hits):
                hits.append(SearchHit(text=proof, page=alias["page"], score=0.0))
    return SearchResponse(document_id=document_id, hits=hits)


@app.get("/fulltext/{document_id}", response_model=FullTextResponse)
def fulltext(document_id: str):
    """Return every chunk in order — used by the summary/quiz generation pipeline."""
    _, metadata = load_index(document_id)
    chunks = metadata["chunks"]
    page_count = metadata.get("page_count", max((c["page"] for c in chunks), default=0))
    ordered = [ContentHit(text=c.get("source_text", c["text"]), page=c["page"], score=0.0,
                          heading=c.get("heading", ""), section_id=c.get("section_id", "0"))
               for c in chunks]
    return FullTextResponse(document_id=document_id, page_count=page_count, chunks=ordered)


@app.delete("/index/{document_id}")
def delete_index(document_id: str):
    index_path, meta_path = index_paths(document_id)
    pdf_path = UPLOAD_DIR / f"{document_id}.pdf"
    for p in (index_path, meta_path, pdf_path):
        if p.exists():
            p.unlink()
    return {"deleted": True}
