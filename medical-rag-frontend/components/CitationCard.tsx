// components/CitationCard.tsx
"use client";

import { useState } from "react";
import { Citation } from "@/types/chat";

interface CitationCardProps {
  citation: Citation;
}

export default function CitationCard({ citation }: CitationCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <button
      type="button"
      onClick={() => setExpanded((v) => !v)}
      className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-left transition hover:border-blue-300 hover:bg-blue-50/40"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-blue-100 text-[11px] font-semibold text-blue-700">
            PDF
          </span>
          <span className="truncate text-sm font-medium text-gray-800">
            {citation.pdf}
          </span>
        </div>
        <span className="shrink-0 text-xs text-gray-500">
          Page {citation.page}
        </span>
      </div>
      <p
        className={`mt-2 text-xs leading-relaxed text-gray-600 ${
          expanded ? "" : "line-clamp-2"
        }`}
      >
        {citation.text}
      </p>
      <span className="mt-1 inline-block text-[11px] font-medium text-blue-600">
        {expanded ? "Show less" : "Show more"}
      </span>
    </button>
  );
}
