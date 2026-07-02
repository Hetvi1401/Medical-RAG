# Medical RAG Frontend

A ChatGPT-style frontend for a Trustworthy Medical Question Answering System, built with Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, and Axios.

## Setup

```bash
npm install
cp .env.local.example .env.local
```

Edit `.env.local` and set `NEXT_PUBLIC_API_URL` to your FastAPI backend URL (default expects `http://localhost:8000`).

## Run

```bash
npm run dev
```

Visit `http://localhost:3000`.

## Backend endpoints expected

- `POST /login` → `{ email, password }` → `{ token, user }`
- `POST /register` → `{ name, email, password }` → `{ token, user }`
- `POST /ask` → `{ question }` → `{ answer, citations: [{ pdf, page, text }], trust_score }`
- `POST /upload` → multipart `file` → `{ filename, pages, message }`
- `GET /history` → `ChatHistoryItem[]`
- `DELETE /history/:id`
- `GET /bookmarks` → `Bookmark[]`
- `POST /bookmark` → `{ question, answer, citations, trustScore }` → `Bookmark`
- `DELETE /bookmark/:id`

## Folder structure

```
app/            Routes (login, dashboard, chat)
components/     Reusable UI components
services/       Axios API client
types/          Shared TypeScript types
```

## Notes

- Auth token is stored in `localStorage` under `medrag_token`; the Axios instance in `services/api.ts` attaches it to every request and redirects to `/login` on a 401.
- The trust score color bands are green (80–100), yellow (60–79), red (below 60), matching the spec.
