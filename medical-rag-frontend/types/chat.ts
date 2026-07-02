// types/chat.ts
// Shared type definitions for the Medical RAG frontend.

export interface Citation {
  pdf: string;
  page: number;
  text: string;
}

export type MessageRole = "user" | "assistant";

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  citations?: Citation[];
  trustScore?: number;
  timestamp: string;
  bookmarked?: boolean;
}

export interface AskRequest {
  question: string;
}

export interface AskResponse {
  answer: string;
  citations: Citation[];
  trust_score: number;
}

export interface ChatHistoryItem {
  id: string;
  title: string;
  updatedAt: string;
  messages: ChatMessage[];
}

export interface Bookmark {
  id: string;
  question: string;
  answer: string;
  citations: Citation[];
  trustScore: number;
  createdAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface UploadResponse {
  filename: string;
  pages: number;
  message: string;
}

export interface DashboardStats {
  totalChats: number;
  pdfsUploaded: number;
  bookmarksCount: number;
}
