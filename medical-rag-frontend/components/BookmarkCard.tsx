// components/BookmarkCard.tsx
"use client";

import { Bookmark } from "@/types/chat";
import CitationCard from "./CitationCard";
import TrustScore from "./TrustScore";

interface BookmarkCardProps {
  bookmark: Bookmark;
  onRemove: (id: string) => void;
}

export default function BookmarkCard({ bookmark, onRemove }: BookmarkCardProps) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-semibold text-gray-900">
          {bookmark.question}
        </p>
        <button
          type="button"
          onClick={() => onRemove(bookmark.id)}
          title="Remove bookmark"
          className="shrink-0 rounded-full p-1.5 text-lg leading-none text-yellow-500 transition hover:bg-gray-100"
        >
          ★
        </button>
      </div>

      <p className="mt-2 text-sm leading-relaxed text-gray-600">
        {bookmark.answer}
      </p>

      <div className="mt-3">
        <TrustScore score={bookmark.trustScore} />
      </div>

      {bookmark.citations.length > 0 && (
        <div className="mt-3 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
            Citations
          </p>
          {bookmark.citations.map((citation, idx) => (
            <CitationCard key={`${citation.pdf}-${citation.page}-${idx}`} citation={citation} />
          ))}
        </div>
      )}

      <p className="mt-3 text-xs text-gray-400">
        Saved {new Date(bookmark.createdAt).toLocaleString()}
      </p>
    </div>
  );
}
