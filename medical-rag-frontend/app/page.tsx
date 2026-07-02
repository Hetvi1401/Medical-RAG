// app/page.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import LoadingSpinner from "@/components/LoadingSpinner";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const token = window.localStorage.getItem("medrag_token");
    router.replace(token ? "/dashboard" : "/login");
  }, [router]);

  return (
    <main className="flex h-screen w-full items-center justify-center bg-gray-50">
      <LoadingSpinner size="lg" label="Loading Medical RAG…" />
    </main>
  );
}
