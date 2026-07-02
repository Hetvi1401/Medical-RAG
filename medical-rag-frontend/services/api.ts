// services/api.ts
// Central Axios instance and typed API calls for the Medical RAG backend.
// Update NEXT_PUBLIC_API_URL in .env.local to point at your FastAPI backend.

import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import {
  AskRequest,
  AskResponse,
  AuthResponse,
  Bookmark,
  ChatHistoryItem,
  LoginRequest,
  RegisterRequest,
  UploadResponse,
} from "@/types/chat";

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach the auth token (if present) to every outgoing request.
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (typeof window !== "undefined") {
    const token = window.localStorage.getItem("medrag_token");
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Redirect to login on 401 responses.
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (
      error.response?.status === 401 &&
      typeof window !== "undefined" &&
      window.location.pathname !== "/login"
    ) {
      window.localStorage.removeItem("medrag_token");
      window.localStorage.removeItem("medrag_user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// ---------- Auth ----------

export async function loginUser(payload: LoginRequest): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>("/login", payload);
  return data;
}

export async function registerUser(
  payload: RegisterRequest
): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>("/register", payload);
  return data;
}

// ---------- Chat ----------

export async function askQuestion(question: string): Promise<AskResponse> {
  const { data } = await api.post<AskResponse>("/ask", {
    question,
  } satisfies AskRequest);
  return data;
}

// ---------- Upload ----------

export async function uploadPDF(
  file: File,
  onProgress?: (percent: number) => void
): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const { data } = await api.post<UploadResponse>("/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress: (evt) => {
      if (onProgress && evt.total) {
        onProgress(Math.round((evt.loaded * 100) / evt.total));
      }
    },
  });
  return data;
}

// ---------- History ----------

export async function getHistory(): Promise<ChatHistoryItem[]> {
  const { data } = await api.get<ChatHistoryItem[]>("/history");
  return data;
}

export async function deleteHistory(id: string): Promise<void> {
  await api.delete(`/history/${id}`);
}

// ---------- Bookmarks ----------

export async function getBookmarks(): Promise<Bookmark[]> {
  const { data } = await api.get<Bookmark[]>("/bookmarks");
  return data;
}

export async function addBookmark(
  bookmark: Omit<Bookmark, "id" | "createdAt">
): Promise<Bookmark> {
  const { data } = await api.post<Bookmark>("/bookmark", bookmark);
  return data;
}

export async function removeBookmark(id: string): Promise<void> {
  await api.delete(`/bookmark/${id}`);
}

export default api;
