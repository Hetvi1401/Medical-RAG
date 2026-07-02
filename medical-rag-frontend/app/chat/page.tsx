// app/chat/page.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import ChatBox from "@/components/ChatBox";

export default function ChatPage() {
  const router = useRouter();

  useEffect(() => {
    const token = window.localStorage.getItem("medrag_token");
    if (!token) {
      router.replace("/login");
    }
  }, [router]);

  return (
    <div className="flex h-screen flex-col">
      <Navbar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-hidden bg-gray-50">
          <ChatBox />
        </main>
      </div>
    </div>
  );
}
