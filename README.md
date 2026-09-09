# SmartLearning — prototype

A working RAG-based PDF study assistant: upload a PDF, chat with it (with page
citations), get AI summaries, and generate MCQ quizzes.

## Architecture

Two services, on purpose:

```
┌─────────────┐  REST/JWT   ┌──────────────────────┐  REST   ┌───────────────────────┐
│   Frontend   │────────────▶│  Spring Boot backend  │────────▶│  Python pdf-service    │
│ (bring your  │             │  - Auth (Google OAuth2│         │  (FastAPI)             │
│  own; not    │             │    + JWT, admin login)│         │  - PyMuPDF extraction  │
│  built here) │             │  - users/documents/   │         │  - chunking            │
└─────────────┘             │    conversations/      │         │  - sentence-transformers│
                             │    messages/quizzes    │         │    embeddings          │
                             │    (MySQL via JPA)     │         │  - FAISS index/search  │
                             │  - RAG orchestration    │         └───────────────────────┘
                             │  - LLM client (OpenAI-  │
                             │    compatible, pluggable)│
                             └──────────────────────┘
                                        │
                                   ┌────▼────┐
                                   │  MySQL  │
                                   └─────────┘
```

**Why split it this way:** PyMuPDF and FAISS are Python-native — trying to
reimplement them in Java would mean losing real libraries for something
worse. Spring Boot owns everything relational, auth, and orchestration; the
Python service is a stateless "PDF → vectors" worker it calls over HTTP. This
is the same shape you'd use in production, just without a message queue in
front of the Python service yet (see "extend first" below).

**LLM calls** (chat answers, summaries, quiz questions) go through a small
`LlmClient` interface in the backend, implemented against any
OpenAI-compatible `/chat/completions` endpoint — OpenAI itself, Azure OpenAI,
or a local Ollama/vLLM server. **No API key is required to run the
prototype**: with `OPENAI_API_KEY` unset, `LlmClient` falls back to an
extractive stub (clearly labeled in the output) so upload → search → chat →
summary → quiz all work end-to-end and you can see the real plumbing (FAISS
retrieval, page citations, DB writes) before spending any money on a model.

## Project layout

```
smartlearning/
├── docker-compose.yml
├── schema-reference.sql        # what Hibernate auto-creates — for review only
├── pdf-service/                # Python/FastAPI
│   ├── main.py
│   ├── requirements.txt
│   └── Dockerfile
└── backend/                    # Spring Boot
    ├── pom.xml
    ├── Dockerfile
    └── src/main/
        ├── resources/application.yml
        └── java/com/smartlearning/
            ├── SmartLearningApplication.java
            ├── entity/          # User, Document, Conversation, Message, Quiz, QuizQuestion + enums
            ├── repository/      # Spring Data JPA interfaces
            ├── dto/             # request/response shapes
            ├── config/          # JWT, security, OAuth2 success handler, admin seeder
            ├── client/          # PdfServiceClient (→Python), LlmClient (→OpenAI-compatible)
            ├── service/         # UserService, DocumentService, SearchService, ChatService,
            │                    # SummaryService, QuizService, DashboardService
            └── controller/      # Auth, Admin, Document, Search, Chat, Summary, Quiz
```

## Running it

**Prerequisites:** Docker + Docker Compose. That's it — MySQL, both services,
and all dependencies run in containers.

```bash
cd smartlearning
docker compose up --build
```

First boot takes a few minutes: Maven downloads dependencies, pip installs
`sentence-transformers`/`faiss-cpu`/`pymupdf`, and the embedding model
(~90MB) downloads on the pdf-service's first request. Once up:

- Backend: `http://localhost:8080`
- pdf-service: `http://localhost:8001` (interactive docs at `/docs`)
- MySQL: `localhost:3306` (db `smartlearning`, user/pass `smartlearning`)

**Default admin login:** `admin` / `admin123` (seeded on first startup —
change `ADMIN_DEFAULT_USERNAME`/`ADMIN_DEFAULT_PASSWORD` in
`docker-compose.yml` before any real deployment).

**Google OAuth2:** put real credentials in `GOOGLE_CLIENT_ID` /
`GOOGLE_CLIENT_SECRET` in `docker-compose.yml` (create them in Google Cloud
Console, authorized redirect URI
`http://localhost:8080/login/oauth2/code/google`). Without real credentials
the rest of the app still works — just log in as admin, or hit the API with
a JWT you mint by temporarily calling `JwtUtil` in a test, since there's no
UI here yet.

### Try it with curl

```bash
# 1. Admin login
curl -X POST localhost:8080/api/auth/admin/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"admin","password":"admin123"}'
# → { "token": "eyJ...", ... }  copy the token

TOKEN="paste-token-here"

# 2. Upload a PDF (as that admin user, acting like any user)
curl -X POST localhost:8080/api/documents \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@/path/to/some.pdf"
# → { "id": 1, "status": "READY", "pageCount": 12, ... }

# 3. Semantic search
curl "localhost:8080/api/documents/1/search?query=what is this document about" \
  -H "Authorization: Bearer $TOKEN"

# 4. RAG chat (page citations included)
curl -X POST localhost:8080/api/documents/1/chat \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"message":"What are the main conclusions?"}'

# 5. Summary
curl "localhost:8080/api/documents/1/summary" -H "Authorization: Bearer $TOKEN"

# 6. Quiz
curl -X POST localhost:8080/api/quizzes/generate \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"documentId":1,"numQuestions":5}'
```

### Turning on real AI answers

Set `OPENAI_API_KEY` (and optionally `OPENAI_MODEL`, default
`gpt-4o-mini`) in `docker-compose.yml` under the `backend` service, then
`docker compose up -d --build backend`. No code changes needed — chat,
summary, and quiz generation all switch from the extractive stub to real
model output immediately.

## What to extend first

Roughly in the order I'd tackle them:

1. **Make PDF processing async.** Right now `DocumentService.upload()` calls
   the Python service synchronously inside the HTTP request — fine for a
   demo PDF, painful for a 300-page one. Swap it for a message queue
   (RabbitMQ/SQS) or at minimum `@Async` + polling, with `status` going
   `UPLOADED → PROCESSING → READY/FAILED` as it already does, just
   non-blocking.

2. **Real migrations.** `ddl-auto=update` is a prototype convenience.
   Introduce Flyway (there's already `schema-reference.sql` to start from)
   before you touch a schema anyone depends on.

3. **A frontend.** Everything here is API-only. React/Vue talking to these
   endpoints, with the Google button hitting
   `GET /oauth2/authorization/google` and reading `?token=` off the redirect,
   is the natural next piece — probably the highest-value next step overall.

4. **Streaming chat responses.** `ChatService.ask()` waits for the full LLM
   response before returning. For a chat UI you'll want SSE or
   WebSocket streaming — the OpenAI-compatible API supports `stream: true`
   already, `OpenAiLlmClient` just isn't wired for it yet.

5. **Chunk-level source tracking for quizzes/summaries at scale.** The
   summary/quiz pipelines pull *all* chunks via `/fulltext` and either batch
   or sample them — fine up to maybe a few hundred pages, but a
   very large PDF will want smarter section detection (e.g. using PDF
   bookmarks/outline via `fitz`) instead of fixed chunk-count batching.

6. **Auth hardening.** Token refresh/expiry handling on the frontend, a
   proper logout (blacklist or short-lived tokens + refresh tokens instead
   of one long-lived JWT), and rate limiting on `/api/auth/admin/login`.

7. **Vector store choice at scale.** FAISS indices here are one file per
   document on local disk — simple and fast for a prototype. If you outgrow
   that (many users, many documents, need for filtering/metadata queries),
   look at pgvector or a managed vector DB (Pinecone/Qdrant/Weaviate) instead
   of hand-rolling FAISS file management.
