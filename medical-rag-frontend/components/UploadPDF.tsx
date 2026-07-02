// components/UploadPDF.tsx
"use client";

import { ChangeEvent, useRef, useState } from "react";
import { uploadPDF } from "@/services/api";

type UploadStatus = "idle" | "uploading" | "success" | "error";

export default function UploadPDF() {
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [message, setMessage] = useState<string>("");
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0] ?? null;
    setFile(selected);
    setStatus("idle");
    setMessage("");
    setProgress(0);
  }

  async function handleUpload() {
    if (!file) return;
    setStatus("uploading");
    setProgress(0);
    setMessage("");

    try {
      const result = await uploadPDF(file, (percent) => setProgress(percent));
      setStatus("success");
      setMessage(result.message || `${result.filename} uploaded successfully.`);
      setFile(null);
      if (inputRef.current) inputRef.current.value = "";

      const current = Number(window.localStorage.getItem("medrag_pdf_count") ?? "0");
      window.localStorage.setItem("medrag_pdf_count", String(current + 1));
      window.dispatchEvent(new CustomEvent("medrag:pdf-uploaded"));
    } catch (err) {
      setStatus("error");
      setMessage("Upload failed. Please check the file and try again.");
    }
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <h3 className="text-base font-semibold text-gray-900">Upload a PDF</h3>
      <p className="mt-1 text-sm text-gray-500">
        Add medical literature to the knowledge base used for answering questions.
      </p>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <label className="flex-1 cursor-pointer rounded-xl border border-dashed border-gray-300 px-4 py-3 text-center text-sm text-gray-500 transition hover:border-blue-400 hover:bg-blue-50/40">
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf"
            onChange={handleFileChange}
            className="hidden"
          />
          {file ? (
            <span className="font-medium text-gray-700">{file.name}</span>
          ) : (
            "Choose PDF"
          )}
        </label>

        <button
          type="button"
          onClick={handleUpload}
          disabled={!file || status === "uploading"}
          className="shrink-0 rounded-xl bg-blue-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
        >
          {status === "uploading" ? "Uploading…" : "Upload"}
        </button>
      </div>

      {status === "uploading" && (
        <div className="mt-4">
          <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
            <div
              className="h-full rounded-full bg-blue-600 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="mt-1 text-xs text-gray-500">{progress}% uploaded</p>
        </div>
      )}

      {status === "success" && (
        <p className="mt-3 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
          {message}
        </p>
      )}

      {status === "error" && (
        <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {message}
        </p>
      )}
    </div>
  );
}
