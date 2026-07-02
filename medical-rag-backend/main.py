"""
Medical RAG backend — FastAPI reference implementation.

This implements every endpoint the Next.js frontend expects, using simple
in-memory storage so the whole system runs end-to-end with zero external
services. It is a STARTER/DEMO backend, not production RAG:

  - Auth uses a plain in-memory token store (swap for real JWT + a DB).
  - /ask returns a mocked answer/citations/trust_score. Replace
    `run_agentic_rag()` with your actual retrieval + LLM + trust-scoring
    pipeline — that's the only function you need to change to plug in
    real Agentic RAG logic.
  - Uploaded PDFs are saved to ./uploads and page count is read with
    pypdf; wire them into your vector store inside `run_agentic_rag()`.

Run:
    pip install -r requirements.txt
    uvicorn main:app --reload --port 8000
"""

import hashlib
import os
import secrets
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import List, Optional

from fastapi import Depends, FastAPI, File, Header, HTTPException, UploadFile, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr, Field

# --------------------------------------------------------------------------
# App setup
# --------------------------------------------------------------------------

app = FastAPI(title="Medical RAG API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = Path(__file__).parent / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)

# --------------------------------------------------------------------------
# "Database" — in-memory. Restarting the server clears all data.
# Swap these dicts for a real database (Postgres, SQLite, etc.) later.
# --------------------------------------------------------------------------

users_by_email: dict[str, dict] = {}          # email -> user record (incl. password hash)
tokens: dict[str, str] = {}                    # token -> user_id
history_store: dict[str, list] = {}            # user_id -> list of history items
bookmark_store: dict[str, list] = {}           # user_id -> list of bookmarks
uploaded_pdfs: dict[str, list] = {}             # user_id -> list of filenames


# --------------------------------------------------------------------------
# Schemas (mirrors frontend/types/chat.ts exactly)
# --------------------------------------------------------------------------

class RegisterRequest(BaseModel):
    name: str
    email: EmailStr
    password: str = Field(min_length=6)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: str
    name: str
    email: str


class AuthResponse(BaseModel):
    token: str
    user: UserOut


class AskRequest(BaseModel):
    question: str


class Citation(BaseModel):
    pdf: str
    page: int
    text: str


class AskResponse(BaseModel):
    answer: str
    citations: List[Citation]
    trust_score: int


class UploadResponse(BaseModel):
    filename: str
    pages: int
    message: str


class ChatMessageOut(BaseModel):
    id: str
    role: str
    content: str
    citations: Optional[List[Citation]] = None
    trustScore: Optional[int] = None
    timestamp: str


class ChatHistoryItem(BaseModel):
    id: str
    title: str
    updatedAt: str
    messages: List[ChatMessageOut]


class BookmarkCreate(BaseModel):
    question: str
    answer: str
    citations: List[Citation]
    trustScore: int


class BookmarkOut(BaseModel):
    id: str
    question: str
    answer: str
    citations: List[Citation]
    trustScore: int
    createdAt: str


# --------------------------------------------------------------------------
# Helpers
# --------------------------------------------------------------------------

def hash_password(password: str, salt: str) -> str:
    return hashlib.sha256(f"{salt}{password}".encode()).hexdigest()


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def get_current_user(authorization: Optional[str] = Header(default=None)) -> dict:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Missing or invalid token")
    token = authorization.removeprefix("Bearer ").strip()
    user_id = tokens.get(token)
    if not user_id:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid or expired token")
    for user in users_by_email.values():
        if user["id"] == user_id:
            return user
    raise HTTPException(status.HTTP_401_UNAUTHORIZED, "User not found")


def issue_token(user_id: str) -> str:
    token = secrets.token_hex(32)
    tokens[token] = user_id
    return token


# --------------------------------------------------------------------------
# Auth
# --------------------------------------------------------------------------

@app.post("/register", response_model=AuthResponse)
def register(payload: RegisterRequest):
    if payload.email in users_by_email:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Email already registered")

    salt = secrets.token_hex(8)
    user = {
        "id": str(uuid.uuid4()),
        "name": payload.name,
        "email": payload.email,
        "salt": salt,
        "password_hash": hash_password(payload.password, salt),
    }
    users_by_email[payload.email] = user
    history_store[user["id"]] = []
    bookmark_store[user["id"]] = []
    uploaded_pdfs[user["id"]] = []

    token = issue_token(user["id"])
    return AuthResponse(
        token=token,
        user=UserOut(id=user["id"], name=user["name"], email=user["email"]),
    )


@app.post("/login", response_model=AuthResponse)
def login(payload: LoginRequest):
    user = users_by_email.get(payload.email)
    if not user or hash_password(payload.password, user["salt"]) != user["password_hash"]:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid email or password")

    token = issue_token(user["id"])
    return AuthResponse(
        token=token,
        user=UserOut(id=user["id"], name=user["name"], email=user["email"]),
    )


# --------------------------------------------------------------------------
# Chat / Agentic RAG
# --------------------------------------------------------------------------

def run_agentic_rag(question: str, user_id: str) -> AskResponse:
    """
    Replace this function with your real Agentic RAG pipeline:
    retrieval over the user's uploaded PDFs, agent reasoning/tool use,
    answer generation, and trust scoring.

    This mock version returns a plausible answer so the frontend can be
    fully tested without a real model or vector store wired up yet.
    """
    pdfs = uploaded_pdfs.get(user_id, [])
    source_pdf = pdfs[0] if pdfs else "Demo_Medical_Guide.pdf"

    answer = (
        f"Based on the available medical literature, here is a general answer "
        f'to "{question}". This is placeholder output from the mock RAG '
        f"pipeline — replace `run_agentic_rag()` in main.py with your real "
        f"retrieval and generation logic to produce grounded, clinically "
        f"reviewed answers."
    )

    citations = [
        Citation(
            pdf=source_pdf,
            page=2,
            text="Relevant excerpt retrieved from the knowledge base would appear here.",
        )
    ]

    trust_score = 87

    return AskResponse(answer=answer, citations=citations, trust_score=trust_score)


@app.post("/ask", response_model=AskResponse)
def ask(payload: AskRequest, user: dict = Depends(get_current_user)):
    if not payload.question.strip():
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Question cannot be empty")

    result = run_agentic_rag(payload.question, user["id"])

    # Log this Q&A into the user's chat history so /history and the
    # dashboard's "Total Chats" stat reflect real activity.
    timestamp = now_iso()
    history = history_store.setdefault(user["id"], [])
    history.append(
        {
            "id": str(uuid.uuid4()),
            "title": payload.question[:60],
            "updatedAt": timestamp,
            "messages": [
                {
                    "id": str(uuid.uuid4()),
                    "role": "user",
                    "content": payload.question,
                    "timestamp": timestamp,
                },
                {
                    "id": str(uuid.uuid4()),
                    "role": "assistant",
                    "content": result.answer,
                    "citations": [c.model_dump() for c in result.citations],
                    "trustScore": result.trust_score,
                    "timestamp": timestamp,
                },
            ],
        }
    )

    return result


# --------------------------------------------------------------------------
# Upload
# --------------------------------------------------------------------------

@app.post("/upload", response_model=UploadResponse)
async def upload_pdf(file: UploadFile = File(...), user: dict = Depends(get_current_user)):
    if file.content_type != "application/pdf":
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Only PDF files are supported")

    dest_path = UPLOAD_DIR / f"{uuid.uuid4()}_{file.filename}"
    contents = await file.read()
    dest_path.write_bytes(contents)

    page_count = 0
    try:
        from pypdf import PdfReader

        page_count = len(PdfReader(str(dest_path)).pages)
    except Exception:
        # pypdf not installed or unreadable PDF — page count stays 0.
        # Install with: pip install pypdf
        pass

    uploaded_pdfs.setdefault(user["id"], []).append(file.filename)

    return UploadResponse(
        filename=file.filename,
        pages=page_count,
        message=f"{file.filename} uploaded and indexed successfully.",
    )


# --------------------------------------------------------------------------
# History
# --------------------------------------------------------------------------

@app.get("/history", response_model=List[ChatHistoryItem])
def get_history(user: dict = Depends(get_current_user)):
    items = history_store.get(user["id"], [])
    return list(reversed(items))


@app.delete("/history/{history_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_history(history_id: str, user: dict = Depends(get_current_user)):
    items = history_store.get(user["id"], [])
    filtered = [item for item in items if item["id"] != history_id]
    if len(filtered) == len(items):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "History item not found")
    history_store[user["id"]] = filtered


# --------------------------------------------------------------------------
# Bookmarks
# --------------------------------------------------------------------------

@app.get("/bookmarks", response_model=List[BookmarkOut])
def get_bookmarks(user: dict = Depends(get_current_user)):
    return list(reversed(bookmark_store.get(user["id"], [])))


@app.post("/bookmark", response_model=BookmarkOut)
def add_bookmark(payload: BookmarkCreate, user: dict = Depends(get_current_user)):
    bookmark = {
        "id": str(uuid.uuid4()),
        "question": payload.question,
        "answer": payload.answer,
        "citations": [c.model_dump() for c in payload.citations],
        "trustScore": payload.trustScore,
        "createdAt": now_iso(),
    }
    bookmark_store.setdefault(user["id"], []).append(bookmark)
    return bookmark


@app.delete("/bookmark/{bookmark_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_bookmark(bookmark_id: str, user: dict = Depends(get_current_user)):
    items = bookmark_store.get(user["id"], [])
    filtered = [item for item in items if item["id"] != bookmark_id]
    if len(filtered) == len(items):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Bookmark not found")
    bookmark_store[user["id"]] = filtered


# --------------------------------------------------------------------------
# Health check
# --------------------------------------------------------------------------

@app.get("/")
def health():
    return {"status": "ok", "service": "medical-rag-backend"}
