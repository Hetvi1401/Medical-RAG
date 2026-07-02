// components/Message.tsx
"use client";

import { ChatMessage } from "@/types/chat";
import CitationCard from "./CitationCard";
import TrustScore from "./TrustScore";

interface MessageProps {
  message: ChatMessage;
  onToggleBookmark?: (message: ChatMessage) => void;
}

export default function Message({ message, onToggleBookmark }: MessageProps) {
  const isUser = message.role === "user";

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] rounded-2xl rounded-tr-sm bg-blue-600 px-4 py-3 text-sm text-white shadow-sm">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start">
      <div className="max-w-[85%] rounded-2xl rounded-tl-sm border border-gray-200 bg-white px-4 py-4 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-800">
            {message.content}
          </p>
          {onToggleBookmark && (
            <button
              type="button"
              onClick={() => onToggleBookmark(message)}
              title={message.bookmarked ? "Remove bookmark" : "Bookmark answer"}
              className="shrink-0 rounded-full p-1.5 text-lg leading-none transition hover:bg-gray-100"
            >
              {message.bookmarked ? "★" : "☆"}
            </button>
          )}
        </div>

        {message.trustScore !== undefined && (
          <div className="mt-3">
            <TrustScore score={message.trustScore} />
          </div>
        )}

        {message.citations && message.citations.length > 0 && (
          <div className="mt-3 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
              Citations
            </p>
            {message.citations.map((citation, idx) => (
              <CitationCard key={`${citation.pdf}-${citation.page}-${idx}`} citation={citation} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
