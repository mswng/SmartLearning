"""
SmartLearning PDF/AI microservice
----------------------------------
Handles the parts of the pipeline that are genuinely Python-native:
  1. PDF text extraction with PyMuPDF (page-aware)
  2. Chunking (page-aware, overlapping windows)
  3. Embedding generation (sentence-transformers, runs locally, no API key needed)
  4. Per-document FAISS index build + persistence
  5. Semantic search (top-K similar chunks, with page numbers for citation)

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
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer

UPLOAD_DIR = Path(os.getenv("UPLOAD_DIR", "./data/uploads"))
FAISS_DIR = Path(os.getenv("FAISS_DIR", "./data/faiss"))
EMBEDDING_MODEL_NAME = os.getenv("EMBEDDING_MODEL", "all-MiniLM-L6-v2")
CHUNK_SIZE_CHARS = 900
CHUNK_OVERLAP_CHARS = 150

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
    query: str
    top_k: int = 5


class SearchHit(BaseModel):
    text: str
    page: int
    score: float


class SearchResponse(BaseModel):
    document_id: str
    hits: List[SearchHit]


class FullTextResponse(BaseModel):
    document_id: str
    page_count: int
    chunks: List[SearchHit]  # score is unused (0.0) here, reused for shape


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def index_paths(document_id: str):
    base = FAISS_DIR / document_id
    return base.with_suffix(".index"), base.with_suffix(".json")


def chunk_page_text(page_num: int, text: str) -> List[dict]:
    """Split one page's text into overlapping chunks, tagging each with its page."""
    text = re.sub(r"\s+", " ", text).strip()
    if not text:
        return []
    chunks = []
    start = 0
    while start < len(text):
        end = min(start + CHUNK_SIZE_CHARS, len(text))
        chunk = text[start:end]
        chunks.append({"page": page_num, "text": chunk})
        if end == len(text):
            break
        start = end - CHUNK_OVERLAP_CHARS
    return chunks


def build_index(document_id: str, chunks: List[dict]) -> None:
    model = get_model()
    texts = [c["text"] for c in chunks]
    embeddings = model.encode(texts, normalize_embeddings=True)
    embeddings = np.array(embeddings, dtype="float32")

    dim = embeddings.shape[1]
    index = faiss.IndexFlatIP(dim)  # inner product on normalized vecs = cosine sim
    index.add(embeddings)

    index_path, meta_path = index_paths(document_id)
    faiss.write_index(index, str(index_path))
    meta_path.write_text(json.dumps(chunks, ensure_ascii=False), encoding="utf-8")


def load_index(document_id: str):
    index_path, meta_path = index_paths(document_id)
    if not index_path.exists() or not meta_path.exists():
        raise HTTPException(status_code=404, detail="No index found for this document")
    index = faiss.read_index(str(index_path))
    chunks = json.loads(meta_path.read_text(encoding="utf-8"))
    return index, chunks


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

    all_chunks: List[dict] = []
    for page_index in range(len(doc)):
        page = doc[page_index]
        page_text = page.get_text("text")
        all_chunks.extend(chunk_page_text(page_index + 1, page_text))  # 1-indexed pages

    page_count = len(doc)
    doc.close()

    if not all_chunks:
        raise HTTPException(status_code=422, detail="No extractable text found in PDF (scanned image PDF?)")

    build_index(document_id, all_chunks)

    return ProcessResponse(document_id=document_id, page_count=page_count, chunk_count=len(all_chunks))


@app.post("/search/{document_id}", response_model=SearchResponse)
def search(document_id: str, req: SearchRequest):
    index, chunks = load_index(document_id)
    model = get_model()

    query_vec = model.encode([req.query], normalize_embeddings=True)
    query_vec = np.array(query_vec, dtype="float32")

    k = min(req.top_k, len(chunks))
    scores, ids = index.search(query_vec, k)

    hits = []
    for score, idx in zip(scores[0], ids[0]):
        if idx == -1:
            continue
        c = chunks[idx]
        hits.append(SearchHit(text=c["text"], page=c["page"], score=float(score)))

    return SearchResponse(document_id=document_id, hits=hits)


@app.get("/fulltext/{document_id}", response_model=FullTextResponse)
def fulltext(document_id: str):
    """Return every chunk in order — used by the summary/quiz generation pipeline."""
    _, chunks = load_index(document_id)
    index_path, _ = index_paths(document_id)
    # page_count isn't stored separately; derive from max page seen
    page_count = max((c["page"] for c in chunks), default=0)
    ordered = [SearchHit(text=c["text"], page=c["page"], score=0.0) for c in chunks]
    return FullTextResponse(document_id=document_id, page_count=page_count, chunks=ordered)


@app.delete("/index/{document_id}")
def delete_index(document_id: str):
    index_path, meta_path = index_paths(document_id)
    pdf_path = UPLOAD_DIR / f"{document_id}.pdf"
    for p in (index_path, meta_path, pdf_path):
        if p.exists():
            p.unlink()
    return {"deleted": True}
