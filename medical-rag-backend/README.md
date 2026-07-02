# Medical RAG Backend

A FastAPI reference backend that implements every endpoint the Next.js
frontend expects, so you can run the full system end-to-end immediately.

Auth, history, and bookmarks use simple **in-memory storage** — all data
resets when you restart the server. `/ask` returns a **mocked** answer so
you can test the UI before your real Agentic RAG pipeline is wired up.

## Setup (Windows PowerShell)

```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

## Setup (macOS/Linux)

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

## Run

```bash
uvicorn main:app --reload --port 8000
```

Visit `http://localhost:8000/docs` to see the interactive Swagger UI and
confirm it's running. The frontend's `.env.local` should point
`NEXT_PUBLIC_API_URL` at `http://localhost:8000`.

## Where to plug in real Agentic RAG

Open `main.py` and edit **`run_agentic_rag()`** — that's the only function
you need to replace. Everything else (auth, routing, history, bookmarks,
upload storage) already works and doesn't need to change.

```python
def run_agentic_rag(question: str, user_id: str) -> AskResponse:
    # 1. Retrieve relevant chunks from the user's uploaded PDFs
    #    (vector store: FAISS, Chroma, pgvector, etc.)
    # 2. Run your agent (tool use, multi-step reasoning, re-ranking)
    # 3. Generate the answer with citations
    # 4. Compute a trust score (e.g. based on retrieval confidence,
    #    source agreement, or a separate verifier model)
    ...
```

## Endpoints

| Method | Path | Auth required |
|---|---|---|
| POST | `/register` | No |
| POST | `/login` | No |
| POST | `/ask` | Yes |
| POST | `/upload` | Yes |
| GET | `/history` | Yes |
| DELETE | `/history/{id}` | Yes |
| GET | `/bookmarks` | Yes |
| POST | `/bookmark` | Yes |
| DELETE | `/bookmark/{id}` | Yes |

Authenticated requests need an `Authorization: Bearer <token>` header —
the frontend's Axios instance already adds this automatically after login.

## Production notes

Before using this for anything real:
- Replace the in-memory dicts with a real database.
- Replace the token scheme with proper JWT (expiry, refresh tokens).
- Hash passwords with bcrypt/argon2 instead of the simple SHA-256 used here.
- Add rate limiting and input validation on `/ask` and `/upload`.
