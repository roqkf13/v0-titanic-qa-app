"use client";

import { useState, useRef, useEffect, FormEvent, KeyboardEvent } from "react";
import { Send, Loader2, AlertCircle, RefreshCw, Database, MessageSquare } from "lucide-react";

/* ──────────────────────────────────────────────────────────────────────────
   Constants & Types
────────────────────────────────────────────────────────────────────────── */
const apiBaseUrl =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000";

interface Message {
  role: "user" | "assistant";
  text: string;
  ts: string;
  confidence?: number;
  sources?: string[];
}

interface QaResponse {
  answer: string;
  confidence: number;
  sources: string[];
}

type SampleData = Record<string, unknown>;

type View = "qa" | "sample";

/* ──────────────────────────────────────────────────────────────────────────
   Main Component
────────────────────────────────────────────────────────────────────────── */
export default function TitanicQaApp() {
  const [view, setView] = useState<View>("qa");

  return (
    <main className="flex flex-1 flex-col min-h-0 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors">
      <div className="max-w-lg mx-auto px-4 py-6 flex flex-col flex-1 min-h-0 w-full">
        {/* Header */}
        <header className="text-center mb-4">
          <h2 className="text-2xl font-bold tracking-tight">Titanic QA Assistant</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            타이타닉 데이터 기반 질의응답
          </p>
        </header>

        {/* View Toggle */}
        <nav className="flex justify-center gap-2 mb-4">
          <button
            type="button"
            onClick={() => setView("qa")}
            aria-label="QA 페이지로 이동"
            className={`inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg border transition-colors
              ${
                view === "qa"
                  ? "border-gray-900 dark:border-gray-100 bg-white dark:bg-gray-800"
                  : "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-gray-400 dark:hover:border-gray-500"
              }`}
          >
            <MessageSquare size={16} aria-hidden="true" />
            QA
          </button>
          <button
            type="button"
            onClick={() => setView("sample")}
            aria-label="샘플 데이터 페이지로 이동"
            className={`inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg border transition-colors
              ${
                view === "sample"
                  ? "border-gray-900 dark:border-gray-100 bg-white dark:bg-gray-800"
                  : "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-gray-400 dark:hover:border-gray-500"
              }`}
          >
            <Database size={16} aria-hidden="true" />
            샘플 데이터
          </button>
        </nav>

        {/* Views */}
        {view === "qa" ? <TitanicQAPage /> : <TitanicSampleDataPage />}
      </div>
    </main>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
   QA Page
────────────────────────────────────────────────────────────────────────── */
function TitanicQAPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const lastQuestionRef = useRef<string>("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendQuestion = async (question: string) => {
    if (!question.trim()) return;

    lastQuestionRef.current = question;
    setErrorMessage(null);
    setIsLoading(true);

    // Add user message
    const userMsg: Message = {
      role: "user",
      text: question,
      ts: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");

    try {
      const res = await fetch(`${apiBaseUrl}/titanic/qa`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });

      if (!res.ok) {
        throw new Error(`서버 오류: ${res.status}`);
      }

      const data: QaResponse = await res.json();

      const assistantMsg: Message = {
        role: "assistant",
        text: data.answer,
        ts: new Date().toISOString(),
        confidence: data.confidence,
        sources: data.sources,
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      const message = err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.";
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    sendQuestion(input);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendQuestion(input);
    }
  };

  const handleRetry = () => {
    if (lastQuestionRef.current) {
      // Remove the last user message before retrying
      setMessages((prev) => prev.slice(0, -1));
      sendQuestion(lastQuestionRef.current);
    }
  };

  return (
    <div className="flex flex-col flex-1 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 dark:text-gray-400 py-12">
            <MessageSquare size={40} className="mx-auto mb-3 opacity-50" aria-hidden="true" />
            <p className="text-sm">질문을 입력하여 대화를 시작하세요.</p>
          </div>
        )}

        {messages.map((msg, idx) => (
          <div
            key={`${msg.ts}-${idx}`}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${
                msg.role === "user"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              }`}
            >
              <p className="text-sm whitespace-pre-wrap break-words">{msg.text}</p>

              {msg.role === "assistant" && msg.confidence !== undefined && (
                <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-600 text-xs text-gray-600 dark:text-gray-400 space-y-1">
                  <p>
                    <span className="font-medium">신뢰도:</span>{" "}
                    {(msg.confidence * 100).toFixed(1)}%
                  </p>
                  {msg.sources && msg.sources.length > 0 && (
                    <p>
                      <span className="font-medium">출처:</span> {msg.sources.join(", ")}
                    </p>
                  )}
                </div>
              )}

              <time
                dateTime={msg.ts}
                className={`block text-[10px] mt-1 ${
                  msg.role === "user"
                    ? "text-blue-200"
                    : "text-gray-500 dark:text-gray-400"
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
              <Loader2 size={20} className="animate-spin text-gray-500 dark:text-gray-400" aria-label="응답 로딩 중" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div className="mx-4 mb-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-red-700 dark:text-red-400 text-sm">
            <AlertCircle size={16} aria-hidden="true" />
            <span>{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={handleRetry}
            aria-label="질문 재시도"
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-md border border-red-300 dark:border-red-700 bg-white dark:bg-gray-800 text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
          >
            <RefreshCw size={14} aria-hidden="true" />
            재시도
          </button>
        </div>
      )}

      {/* Input Area */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex gap-2">
          <label htmlFor="qa-input" className="sr-only">
            질문 입력
          </label>
          <textarea
            id="qa-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="예: 25세 남성 3등석 생존 가능성은?"
            maxLength={500}
            rows={1}
            disabled={isLoading}
            className="flex-1 resize-none rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent disabled:opacity-50 transition-colors"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            aria-label="질문 전송"
            className="inline-flex items-center justify-center w-10 h-10 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? (
              <Loader2 size={18} className="animate-spin" aria-hidden="true" />
            ) : (
              <Send size={18} aria-hidden="true" />
            )}
          </button>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          Enter로 전송, Shift+Enter로 줄바꿈
        </p>
      </form>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
   Sample Data Page
────────────────────────────────────────────────────────────────────────── */
function TitanicSampleDataPage() {
  const [data, setData] = useState<SampleData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch(`${apiBaseUrl}/titanic/data`);
      if (!res.ok) {
        throw new Error(`서버 오류: ${res.status}`);
      }
      const result: SampleData[] = await res.json();
      setData(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : "데이터를 불러오지 못했습니다.";
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="flex-1 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <h2 className="font-semibold text-lg">샘플 데이터</h2>
        <button
          type="button"
          onClick={fetchData}
          disabled={isLoading}
          aria-label="데이터 새로고침"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500 disabled:opacity-50 transition-colors"
        >
          <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} aria-hidden="true" />
          새로고침
        </button>
      </div>

      <div className="p-4 overflow-y-auto max-h-[calc(100vh-280px)]">
        {isLoading && data.length === 0 && (
          <div className="flex justify-center py-12">
            <Loader2 size={32} className="animate-spin text-gray-400" aria-label="데이터 로딩 중" />
          </div>
        )}

        {errorMessage && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-red-700 dark:text-red-400 text-sm">
              <AlertCircle size={16} aria-hidden="true" />
              <span>{errorMessage}</span>
            </div>
            <button
              type="button"
              onClick={fetchData}
              aria-label="데이터 다시 불러오기"
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-md border border-red-300 dark:border-red-700 bg-white dark:bg-gray-800 text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
            >
              <RefreshCw size={14} aria-hidden="true" />
              재시도
            </button>
          </div>
        )}

        {!isLoading && !errorMessage && data.length === 0 && (
          <div className="text-center text-gray-500 dark:text-gray-400 py-12">
            <Database size={40} className="mx-auto mb-3 opacity-50" aria-hidden="true" />
            <p className="text-sm">데이터가 없습니다.</p>
          </div>
        )}

        {data.length > 0 && (
          <div className="space-y-3">
            {data.map((row, idx) => (
              <article
                key={idx}
                className="border border-gray-200 dark:border-gray-600 rounded-xl p-4 bg-gray-50 dark:bg-gray-700/50"
              >
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  {Object.entries(row).map(([key, value]) => (
                    <div key={key} className="flex flex-col">
                      <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                        {key}
                      </span>
                      <span className="text-gray-900 dark:text-gray-100 break-words">
                        {value === null || value === undefined ? "-" : String(value)}
                      </span>
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
