"use client";

import { Sparkles } from "lucide-react";
import { GeminiChat } from "@/components/gemini-chat";

export default function HomePage() {
  return (
    <main className="flex flex-1 flex-col min-h-0 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors">
      <div className="max-w-lg mx-auto px-4 py-6 flex flex-col flex-1 min-h-0 w-full">
        <header className="text-center mb-4">
          <div className="inline-flex items-center justify-center gap-2 mb-1">
            <Sparkles className="text-violet-500" size={28} aria-hidden />
            <h2 className="text-2xl font-bold tracking-tight">Gemini 채팅</h2>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Google Gemini 와 자유롭게 대화합니다. 서버에 GEMINI_API_KEY 를 설정하세요.
          </p>
        </header>

        <GeminiChat />
      </div>
    </main>
  );
}
