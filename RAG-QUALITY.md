# AI/RAG: audit, changes and validation

## Before: source-code findings

- `pdf-service/main.py`: PyMuPDF `get_text("text")` per page; whitespace flattened; 900-character windows, 150-character overlap, arbitrary substring boundaries. This creates partial words at chunk starts and destroys headings/paragraphs. No OCR.
- Default embedding is **all-MiniLM-L6-v2**, overridable with `EMBEDDING_MODEL`. Both index and query vectors were already normalized; `IndexFlatIP` correctly computes cosine similarity. No evidence of a metric mismatch. Input length was not checked against the tokenizer, so model truncation was possible.
- `/search`: raw top-K chunks (default 5), no expansion, passage extraction or deduplication. Java/React preserve the returned order.
- `SummaryService`: actually batches **six chunks**, not one page. These batches do not represent sections; overlapping source text is repeated, prompts add page-range prefixes, and UI emphasizes page ranges. Final reduction has no input budget.
- `ChatService`: question -> single embedding -> five chunks -> LLM. No terminology map, query rewriting or reranking. Context-only answering cannot recover evidence absent from retrieval.
- Generation lives in Spring Boot (`OpenAiLlmClient`), not FastAPI. It calls the configured compatible completion endpoint; without a key its response is a labeled extractive demo, not an AI summary. Secret configuration was not read or changed.

## After: minimal architecture

1. Sorted PDF extraction -> Unicode NFC cleanup -> join soft line wraps -> detect explicit numbered/chapter/uppercase headings. Section identity continues across pages. With no detected headings, content belongs to one logical section and the summarizer groups topics.
2. Sentence-first, whitespace-safe splitting, bounded by 900 characters and the active model tokenizer. Overlap uses a complete unit of at most 150 characters. Chunks remain page-local for accurate citations; section IDs cross pages. Sidecar stores non-overlapping `source_text`, heading and section ID.
3. Ingestion extracts document-local, initial-aligned abbreviation definitions in both parenthesis orientations and colon/equal/dash forms. Quoted explicit synonyms (`"A" also known as "B"`, Vietnamese equivalent) are supported. Each relation retains original evidence and its page. No example-specific vocabulary or external alias dictionary.
4. Original query plus at most three substitutions -> normalized vectors -> FAISS candidate pool -> passage cosine ranking (maximum over accepted variants) -> near-duplicate removal -> top-K. Equal passage scores use document order. Search returns a whole-word passage up to 420 characters for ordinary text, not the raw chunk.
5. Chat uses the same retrieval with `context=true`, returning full chunks and up to four definition-evidence excerpts. These have their own source pages. Expansion preserves the original question; generation still uses only retrieved evidence.
6. Fulltext exposes non-overlapping source and internal section metadata. Summary groups by section, summarizes bounded batches, then recursively merges section summaries. Page ranges are source references, not grouping keys or summary headings. The API retains optional section page ranges; the document UI requests only the overall summary.

## Changed files

| File | Purpose |
|---|---|
| `pdf-service/pipeline.py` | Pure structure, token-aware boundaries, alias extraction/expansion, dedup helpers |
| `pdf-service/main.py` | Ingestion, versioned metadata, retrieval/ranking, internal context option, structured fulltext |
| `pdf-service/test_pipeline.py` | Offline unit/integration regressions using real PDF/FAISS and deterministic fake embeddings |
| `backend/.../client/PdfServiceClient.java` | Internal context flag and fulltext metadata mapping |
| `backend/.../dto/SearchResultDto.java` | Internal heading/section fields excluded from public JSON |
| `backend/.../service/ChatService.java` | Full-context retrieval and document-grounded alias instructions |
| `backend/.../service/SummaryService.java` | Section grouping, deduplication and bounded hierarchical summarization |
| `frontend-tttn/src/page/DocumentDetailPage.jsx` | Mount one document-keyed Summary component |
| `frontend-tttn/src/components/summary/DocumentSummary.jsx` | Request and render only the overall summary, guard concurrent requests and ignore stale responses |
| `backend/src/test/java/.../SummaryServiceTest.java` | Cross-page sections, output contract and bounded large summaries |
| `backend/src/test/java/.../PdfServiceClientTest.java` | Internal request/response mapping and unchanged public search JSON |
| `RAG-QUALITY.md` | Audit, migration, parameters, tests and limitations |

## Compatibility and index migration

Public Spring routes and response fields remain unchanged: search `{text,page,score}`, summary `{overallSummary,sections:[{fromPage,toPage,summary}]}`, chat answer/history and source-page list. Ownership checks, persistence, quiz sampling and delete semantics are retained. Fulltext now removes ingestion overlap, improving input to quiz as well as summary. Existing citationPages continues to mean retrieved source pages; it is not a verified list of claims cited by the LLM.

FastAPI adds optional `context=false` to search, and heading/section_id to fulltext. Sidecars change from a list to a versioned object with model, page count, chunks and aliases. Old list sidecars remain readable, deriving aliases at load time, but cannot recover headings or previously split words. Reprocess them to obtain all improvements. New sidecars reject a different configured model or version with HTTP 409; legacy sidecars have no model identity, so their same-dimensional model identity cannot be verified.

Reprocess through the existing endpoint **with the original vector document ID**, using the retained uploaded PDF. Example from `pdf-service` (replace the ID with the document's actual vector ID):

```powershell
curl.exe -X POST "http://localhost:8001/process?document_id=doc-16" -F "file=@data/uploads/doc-16.pdf"
```

This replaces that document's index without deleting backend rows or conversation history. Rebuild during a maintenance window, with no simultaneous search/reindex of that document; persistence still uses separate index/metadata files. Existing PDFs/indexes were not rewritten as part of this change. Switching embedding models requires reprocessing every document.

## Parameters

No new dependency or external reranker. Existing `EMBEDDING_MODEL`, `UPLOAD_DIR`, `FAISS_DIR` environment variables are unchanged. New internal constants:

| Parameter | Default | Meaning |
|---|---:|---|
| `CANDIDATE_MULTIPLIER` | 4 | Candidates per requested hit, minimum 20, capped by document size |
| `PASSAGE_CHARS` | 420 | Passage budget, with whitespace boundaries |
| `MAX_QUERY_VARIANTS` | 4 | Original plus up to three document-grounded substitutions |
| `INDEX_VERSION` | 2 | Version of persisted processing metadata |
| `duplicate` threshold | 0.88 | Normalized-text SequenceMatcher similarity |
| `SummaryService.INPUT_CHARS` | 6000 | Maximum source characters per generation request |

Summary requests ask for at most 1500 output characters; this is an instruction, not a guaranteed provider token limit. Reduction has a 12-level safety cap. Search validates a nonblank query of at most 2000 characters and top_k from 1 to 50. Chat retrieves five full chunks plus bounded definition evidence.

## Before/after regression cases

| Case | Before | Expected after |
|---|---|---|
| Long paragraph crossing a window | Possible partial first word | Every original word retained in source chunks |
| Heading on page 1, continuation on page 2 | Arbitrary six-chunk batch | Same section with page range 1–2 |
| Full name -> explicit abbreviation | Only original query searched | Both forms searched, definition source available to Chat |
| Abbreviation -> full name | No expansion | Document-grounded inverse substitution |
| Abbreviation substring/unrelated document | No dedicated guard | Whole-term matching, per-document isolation |
| Repeated overlapping passage | Repeated search hits | One representative, descending passage scores |
| Long section/document | Unbounded final merge | Bounded requests through all reduction stages |
| Last PDF page blank | Fulltext undercounts pages | Stored original PDF page count |
| Different embedding model | May silently reuse incompatible index | Versioned metadata rejects and requests reprocessing |

Run from repository root:

```powershell
Push-Location pdf-service
.\venv\Scripts\python.exe -B -m unittest -v test_pipeline
Pop-Location
Push-Location backend
mvn -q test
Pop-Location
Push-Location frontend-tttn
npm run build
Pop-Location
```

Python tests use temporary storage and do not call a hosted LLM or download model weights. Java tests mock the LLM and PDF service. These validate mechanics and contracts, not semantic recall on a representative corpus or factuality of live generated answers.

## Remaining trade-offs

- Heading detection is conservative text heuristics, not a complete layout parser; numbered lists, uppercase slide titles, tables, multi-column layouts and repeated headers can still confuse it. Sorted extraction does not universally fix reading order. Scanned PDFs still require OCR outside this scope.
- Alias detection deliberately rejects uncertain initials and only handles explicit quoted synonyms. Non-initial acronyms, stopword-heavy abbreviations, implicit aliases and ambiguous definitions may need richer document-specific parsing. It never guesses a missing expansion from the question alone.
- Keeping the existing embedding model avoids an unrequested model migration; multilingual recall still requires evaluation on Vietnamese PDFs. Token limits are checked during ingestion; an exceptionally long single unbroken word can exceed the budget because splitting it would violate whole-word preservation.
- Passage vectors are computed at query time, increasing CPU latency. Candidate expansion and source evidence increase work. There is no cross-encoder, embedding cache or universal relevance threshold.
- Passage scores are cosine similarity against the best query variant, not probability/confidence. Lexically similar but semantically different passages may survive. Near-duplicate detection can also suppress similar passages with small meaningful differences.
- LLM summaries/answers remain probabilistic. Live provider evaluation is needed for formula retention, deduplication, factuality and concise Vietnamese output. No-key fallback remains a demo; it cannot satisfy real summary quality criteria.

References: [Sentence Transformers token limits](https://sbert.net/examples/sentence_transformer/applications/computing-embeddings/README.html), [PyMuPDF extraction/reading order](https://pymupdf.readthedocs.io/en/latest/recipes-text.html).

## Validation performed (2026-09-28)

- Python: **13 tests passed**, including real PDF extraction/FAISS persistence with deterministic fake embeddings.
- Java: **4 tests passed** via `mvn -q test` (3 summary tests, 1 client/JSON contract test).
- Frontend: `npm run build` passed; Vite retains a warning about a bundle larger than 500 kB.
- Cached real model verified offline: `all-MiniLM-L6-v2`, 256-token limit, 384 dimensions. Two synthetic English query directions (full term and abbreviation) both retrieved the definition page and substantive content page with the real embeddings and FAISS in memory.
- Read-only corpus check: extracted **13 existing PDFs**, generated **1057 prospective chunks**, detected **5 alias relations**, and measured **zero chunks exceeding the actual tokenizer limit**. This checks ingestion mechanics, not relevance labels or live LLM quality. No existing PDFs/indexes were changed.
- No hosted generation calls were made. Factuality, Vietnamese semantic recall and final summary quality remain to be evaluated with representative questions and the configured provider.

## Duplicate Summary display fix

Root cause: `DocumentDetailPage.jsx` requested `sections=true` and rendered both `overallSummary` and every `sections[].summary`. In `SummaryService`, a single logical section intentionally becomes the overall summary, so these two response fields contain identical content. This was two render paths for one response, not two generation requests.

Flow audit from source:
- Summary generation was called only in the click handler, not mount or any effect. React StrictMode does not introduce another Summary call through the existing effects.
- `apiFetch` contains one fetch and no retry loop. State already replaced with `setSummary(res)`, not appended.
- Spring controller invokes the service once; service requests `/fulltext` once. FastAPI supplies chunks and does not generate summaries. The Java LLM client produces intermediate section summaries and a final reduction as needed. These necessary hierarchical LLM calls are not duplicate user requests.
- Response fields overlap intentionally when sections are requested. Public API compatibility is retained.

Fix: `DocumentSummary.jsx` requests `sections=false` and renders `overallSummary` once. A synchronous request ref prevents overlapping clicks; loading disables regeneration. The component remains mounted across tabs, so tab changes neither regenerate nor discard the result. Its document key resets only Summary state when changing documents; cleanup ignores pending responses after unmount. Regeneration uses `setSummary(newSummary)`. No CSS workaround, text deduplication or changes to Chat/Quiz/Search/backend generation.

Manual browser acceptance checks (requires the running app/backend and an authenticated user):
1. Open Summary: no summary request until clicking Generate. One click should show one `/summary?sections=false` request and one result.
2. Click rapidly or while regenerating: no concurrent extra Summary request; loading clears on success/failure.
3. Generate again: one new request, previous content replaced in the same result area.
4. Switch tabs and return: existing result stays; no extra Summary request.
5. Change documents, including while a request is pending: previous result disappears and its late response cannot populate the new document. Refresh should not auto-generate.
6. Keep StrictMode enabled and repeat the checks; verify Chat, Quiz and Search independently.
