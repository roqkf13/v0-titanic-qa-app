"use client";

import { useState, useRef, useEffect, FormEvent, KeyboardEvent } from "react";
import { Send, Loader2, AlertCircle, RefreshCw, Sparkles } from "lucide-react";

interface GeminiMessage {
  role: "user" | "assistant";
  text: string;
  ts: string;
}

export function GeminiChat() {
  const [messages, setMessages] = useState<GeminiMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const lastUserRef = useRef<string>("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    lastUserRef.current = trimmed;
    setErrorMessage(null);
    setIsLoading(true);

    const userMsg: GeminiMessage = {
      role: "user",
      text: trimmed,
      ts: new Date().toISOString(),
    };
    const nextThread = [...messages, userMsg];
    setMessages(nextThread);
    setInput("");

    try {
      const res = await fetch("/api/gemini/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextThread.map((m) => ({ role: m.role, text: m.text })),
        }),
      });

      const data = (await res.json()) as { text?: string; error?: string };
      if (!res.ok) {
        throw new Error(data.error ?? `HTTP ${res.status}`);
      }
      if (!data.text?.trim()) {
        throw new Error("빈 응답입니다.");
      }

      const assistantMsg: GeminiMessage = {
        role: "assistant",
        text: data.text,
        ts: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      setMessages((prev) => prev.slice(0, -1));
      setInput(trimmed);
      setErrorMessage(err instanceof Error ? err.message : "요청에 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    send(input);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  };

  const handleRetry = () => {
    if (lastUserRef.current) {
      setErrorMessage(null);
      send(lastUserRef.current);
    }
  };

  return (
    <div className="flex flex-col flex-1 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden min-h-[420px]">
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 dark:text-gray-400 py-10 px-2">
            <Sparkles size={36} className="mx-auto mb-3 text-violet-500 opacity-80" aria-hidden />
            <p className="text-sm font-medium text-gray-700 dark:text-gray-200">Gemini 와 대화</p>
            <p className="text-xs mt-2 leading-relaxed">
              서버 환경 변수 <code className="text-[11px] bg-gray-100 dark:bg-gray-700 px-1 rounded">GEMINI_API_KEY</code>
              를 설정하세요. (선택) <code className="text-[11px] bg-gray-100 dark:bg-gray-700 px-1 rounded">GEMINI_MODEL</code>
              예: gemini-2.0-flash, gemini-1.5-flash
            </p>
          </div>
        )}

        {messages.map((msg, idx) => (
          <div
            key={`${msg.ts}-${idx}`}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[88%] rounded-2xl px-4 py-2.5 ${
                msg.role === "user"
                  ? "bg-violet-600 text-white"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              }`}
            >
              <p className="text-sm whitespace-pre-wrap break-words">{msg.text}</p>
              <time
                dateTime={msg.ts}
                className={`block text-[10px] mt-1 ${
                  msg.role === "user" ? "text-violet-200" : "text-gray-500 dark:text-gray-400"
                }`}
              >
                {new Date(msg.ts).toLocaleTimeString("ko-KR", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </time>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 dark:bg-gray-700 rounded-2xl px-4 py-3">
              <Loader2
                size={20}
                className="animate-spin text-violet-500 dark:text-violet-400"
                aria-label="Gemini 응답 대기 중"
              />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {errorMessage && (
        <div className="mx-4 mb-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-red-700 dark:text-red-400 text-sm min-w-0">
            <AlertCircle size={16} className="shrink-0" aria-hidden />
            <span className="break-words">{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={handleRetry}
            className="shrink-0 inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-md border border-red-300 dark:border-red-700 bg-white dark:bg-gray-800 text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
          >
            <RefreshCw size={14} aria-hidden />
            재시도
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex gap-2">
          <label htmlFor="gemini-input" className="sr-only">
            Gemini 에게 메시지
          </label>
          <textarea
            id="gemini-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Gemini 에게 물어보세요…"
            maxLength={4000}
            rows={2}
            disabled={isLoading}
            className="flex-1 resize-none rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 dark:focus:ring-violet-400 focus:border-transparent disabled:opacity-50 transition-colors"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            aria-label="전송"
            className="inline-flex items-center justify-center w-10 h-10 self-end rounded-lg border border-violet-300 dark:border-violet-600 bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? (
              <Loader2 size={18} className="animate-spin" aria-hidden />
            ) : (
              <Send size={18} aria-hidden />
            )}
          </button>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          Enter 로 전송 · Shift+Enter 로 줄바꿈
        </p>
      </form>
    </div>
  );
}
