// app/dashboard/page.tsx
"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import UploadPDF from "@/components/UploadPDF";
import ChatHistory from "@/components/ChatHistory";
import BookmarkCard from "@/components/BookmarkCard";
import LoadingSpinner from "@/components/LoadingSpinner";
import { getBookmarks, getHistory, removeBookmark } from "@/services/api";
import { Bookmark, DashboardStats } from "@/types/chat";

type Tab = "overview" | "upload" | "history" | "bookmarks";

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = (searchParams.get("tab") as Tab) ?? "overview";

  const [stats, setStats] = useState<DashboardStats>({
    totalChats: 0,
    pdfsUploaded: 0,
    bookmarksCount: 0,
  });
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = window.localStorage.getItem("medrag_token");
    if (!token) {
      router.replace("/login");
    }
  }, [router]);

  async function loadStats() {
    setIsLoading(true);
    try {
      const [history, bookmarkList] = await Promise.all([
        getHistory(),
        getBookmarks(),
      ]);
      setBookmarks(bookmarkList);
      setStats({
        totalChats: history.length,
        pdfsUploaded: Number(
          window.localStorage.getItem("medrag_pdf_count") ?? "0"
        ),
        bookmarksCount: bookmarkList.length,
      });
    } catch {
      setStats((prev) => ({
        ...prev,
        pdfsUploaded: Number(
          window.localStorage.getItem("medrag_pdf_count") ?? "0"
        ),
      }));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadStats();
    const handler = () => loadStats();
    window.addEventListener("medrag:pdf-uploaded", handler);
    return () => window.removeEventListener("medrag:pdf-uploaded", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleRemoveBookmark(id: string) {
    const prev = bookmarks;
    setBookmarks((b) => b.filter((item) => item.id !== id));
    try {
      await removeBookmark(id);
    } catch {
      setBookmarks(prev);
    }
  }

  const cards = [
    {
      label: "Total Chats",
      value: stats.totalChats,
      icon: "💬",
      href: "/chat",
    },
    {
      label: "PDFs Uploaded",
      value: stats.pdfsUploaded,
      icon: "📄",
      href: "/dashboard?tab=upload",
    },
    {
      label: "Bookmarks",
      value: stats.bookmarksCount,
      icon: "⭐",
      href: "/dashboard?tab=bookmarks",
    },
  ];

  return (
    <div className="flex h-screen flex-col">
      <Navbar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto bg-gray-50 px-6 py-8 sm:px-10">
          <div className="mx-auto max-w-5xl">
            <div className="mb-8 flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">
                  Dashboard
                </h1>
                <p className="mt-1 text-sm text-gray-500">
                  Overview of your medical Q&A activity.
                </p>
              </div>
              <Link
                href="/chat"
                className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700"
              >
                + New chat
              </Link>
            </div>

            {isLoading ? (
              <div className="py-16">
                <LoadingSpinner size="lg" label="Loading dashboard…" />
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  {cards.map((card) => (
                    <Link
                      key={card.label}
                      href={card.href}
                      className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-2xl">{card.icon}</span>
                        <span className="text-3xl font-semibold text-gray-900">
                          {card.value}
                        </span>
                      </div>
                      <p className="mt-3 text-sm font-medium text-gray-500">
                        {card.label}
                      </p>
                    </Link>
                  ))}
                </div>

                <div className="mt-6 flex gap-2 border-b border-gray-200">
                  {(
                    [
                      { key: "overview", label: "Recent Activity" },
                      { key: "upload", label: "Upload PDF" },
                      { key: "history", label: "Chat History" },
                      { key: "bookmarks", label: "Bookmarks" },
                    ] as { key: Tab; label: string }[]
                  ).map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() =>
                        router.push(
                          tab.key === "overview"
                            ? "/dashboard"
                            : `/dashboard?tab=${tab.key}`
                        )
                      }
                      className={`px-4 py-2.5 text-sm font-medium transition ${
                        tabParam === tab.key
                          ? "border-b-2 border-blue-600 text-blue-700"
                          : "text-gray-500 hover:text-gray-800"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <div className="mt-6">
                  {tabParam === "overview" && (
                    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                      <h3 className="text-base font-semibold text-gray-900">
                        Recent Activity
                      </h3>
                      {stats.totalChats === 0 && stats.pdfsUploaded === 0 ? (
                        <p className="mt-3 text-sm text-gray-400">
                          Nothing here yet. Start a chat or upload a PDF to
                          get going.
                        </p>
                      ) : (
                        <ul className="mt-4 space-y-2 text-sm text-gray-600">
                          <li>
                            You have {stats.totalChats} saved conversation
                            {stats.totalChats === 1 ? "" : "s"}.
                          </li>
                          <li>
                            You have uploaded {stats.pdfsUploaded} PDF
                            {stats.pdfsUploaded === 1 ? "" : "s"} to the
                            knowledge base.
                          </li>
                          <li>
                            You have bookmarked {stats.bookmarksCount} answer
                            {stats.bookmarksCount === 1 ? "" : "s"}.
                          </li>
                        </ul>
                      )}
                    </div>
                  )}

                  {tabParam === "upload" && <UploadPDF />}

                  {tabParam === "history" && <ChatHistory />}

                  {tabParam === "bookmarks" && (
                    <div>
                      {bookmarks.length === 0 ? (
                        <div className="rounded-2xl border border-gray-200 bg-white p-6 text-center text-sm text-gray-400 shadow-sm">
                          No bookmarks yet. Star an answer in chat to save it
                          here.
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                          {bookmarks.map((bookmark) => (
                            <BookmarkCard
                              key={bookmark.id}
                              bookmark={bookmark}
                              onRemove={handleRemoveBookmark}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center bg-gray-50">
          <LoadingSpinner size="lg" />
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
