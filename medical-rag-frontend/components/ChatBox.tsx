// components/ChatBox.tsx
"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { askQuestion, addBookmark } from "@/services/api";
import { ChatMessage } from "@/types/chat";
import Message from "./Message";

function makeId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export default function ChatBox() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: makeId(),
      role: "assistant",
      content:
        "Hi, I'm your Medical RAG assistant. Ask a clinical or medical question and I'll answer using cited, trust-scored sources.",
      timestamp: new Date().toISOString(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, isSending]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const question = input.trim();
    if (!question || isSending) return;

    const userMessage: ChatMessage = {
      id: makeId(),
      role: "user",
      content: question,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsSending(true);
    setError(null);

    try {
      const response = await askQuestion(question);
      const assistantMessage: ChatMessage = {
        id: makeId(),
        role: "assistant",
        content: response.answer,
        citations: response.citations,
        trustScore: response.trust_score,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      setError("Something went wrong while fetching the answer. Please try again.");
    } finally {
      setIsSending(false);
    }
  }

  async function handleToggleBookmark(message: ChatMessage) {
    const userQuestion =
      [...messages]
        .slice(0, messages.findIndex((m) => m.id === message.id))
        .reverse()
        .find((m) => m.role === "user")?.content ?? "";

    setMessages((prev) =>
      prev.map((m) =>
        m.id === message.id ? { ...m, bookmarked: !m.bookmarked } : m
      )
    );

    if (!message.bookmarked) {
      try {
        await addBookmark({
          question: userQuestion,
          answer: message.content,
          citations: message.citations ?? [],
          trustScore: message.trustScore ?? 0,
        });
      } catch {
        // Revert on failure
        setMessages((prev) =>
          prev.map((m) =>
            m.id === message.id ? { ...m, bookmarked: false } : m
          )
        );
      }
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div
        ref={scrollRef}
        className="flex-1 space-y-4 overflow-y-auto px-4 py-6 sm:px-8"
      >
        {messages.map((message) => (
          <Message
            key={message.id}
            message={message}
            onToggleBookmark={handleToggleBookmark}
          />
        ))}

        {isSending && (
          <div className="flex justify-start">
            <div className="flex items-center gap-1.5 rounded-2xl rounded-tl-sm border border-gray-200 bg-white px-4 py-3 shadow-sm">
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400 [animation-delay:-0.3s]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400 [animation-delay:-0.15s]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400" />
            </div>
          </div>
        )}

        {error && (
          <p className="text-center text-sm text-red-600">{error}</p>
        )}
      </div>

      <form
        onSubmit={handleSubmit}
        className="border-t border-gray-200 bg-white px-4 py-4 sm:px-8"
      >
        <div className="flex items-end gap-3">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
            placeholder="Ask a medical question, e.g. What are the symptoms of diabetes?"
            rows={1}
            className="max-h-32 flex-1 resize-none rounded-xl border border-gray-300 px-4 py-3 text-sm text-gray-800 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
          <button
            type="submit"
            disabled={isSending || !input.trim()}
            className="shrink-0 rounded-xl bg-blue-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
          >
            Send
          </button>
        </div>
        <p className="mt-2 text-xs text-gray-400">
          Answers are AI-generated from uploaded medical literature and may not be complete. Always confirm with a qualified professional.
        </p>
      </form>
    </div>
  );
}
