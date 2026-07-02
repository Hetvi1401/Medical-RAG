// components/ChatHistory.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { deleteHistory, getHistory } from "@/services/api";
import { ChatHistoryItem } from "@/types/chat";
import LoadingSpinner from "./LoadingSpinner";

export default function ChatHistory() {
  const router = useRouter();
  const [history, setHistory] = useState<ChatHistoryItem[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    getHistory()
      .then((data) => {
        if (mounted) setHistory(data);
      })
      .catch(() => {
        if (mounted) setError("Could not load chat history.");
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return history;
    const q = search.toLowerCase();
    return history.filter((item) => item.title.toLowerCase().includes(q));
  }, [history, search]);

  async function handleDelete(id: string) {
    const prev = history;
    setHistory((h) => h.filter((item) => item.id !== id));
    try {
      await deleteHistory(id);
    } catch {
      setHistory(prev);
      setError("Could not delete this conversation.");
    }
  }

  function handleOpen(item: ChatHistoryItem) {
    router.push(`/chat?history=${item.id}`);
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-base font-semibold text-gray-900">Chat History</h3>
      </div>

      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search history…"
        className="mt-4 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
      />

      <div className="mt-4">
        {isLoading && <LoadingSpinner size="sm" label="Loading history" />}
        {error && <p className="text-sm text-red-600">{error}</p>}

        {!isLoading && !error && filtered.length === 0 && (
          <p className="py-6 text-center text-sm text-gray-400">
            No conversations found.
          </p>
        )}

        <ul className="divide-y divide-gray-100">
          {filtered.map((item) => (
            <li
              key={item.id}
              className="flex items-center justify-between gap-3 py-3"
            >
              <button
                type="button"
                onClick={() => handleOpen(item)}
                className="min-w-0 flex-1 text-left"
              >
                <p className="truncate text-sm font-medium text-gray-800">
                  {item.title}
                </p>
                <p className="text-xs text-gray-400">
                  {new Date(item.updatedAt).toLocaleString()}
                </p>
              </button>
              <button
                type="button"
                onClick={() => handleDelete(item.id)}
                className="shrink-0 rounded-lg px-2 py-1 text-xs font-medium text-red-500 transition hover:bg-red-50"
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
