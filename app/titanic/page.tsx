"use client";

import { useCallback, useRef, useState, type DragEvent, type ChangeEvent } from "react";
import { Upload, FolderOpen, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

const apiBaseUrl =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000";

function isTitanicCsv(file: File): boolean {
  return file.name.toLowerCase() === "titanic.csv";
}

export default function TitanicHomePage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [feedback, setFeedback] = useState<{
    kind: "success" | "error" | "info";
    text: string;
  } | null>(null);

  const pickFile = useCallback((f: File | null) => {
    setFeedback(null);
    if (!f) {
      setFile(null);
      return;
    }
    if (!f.name.toLowerCase().endsWith(".csv")) {
      setFile(null);
      setFeedback({ kind: "error", text: "CSV 파일만 선택할 수 있습니다." });
      return;
    }
    if (!isTitanicCsv(f)) {
      setFile(null);
      setFeedback({
        kind: "error",
        text: "파일 이름은 titanic.csv 여야 합니다.",
      });
      return;
    }
    setFile(f);
    setFeedback({
      kind: "info",
      text: `선택됨: ${f.name} (${(f.size / 1024).toFixed(1)} KB)`,
    });
  }, []);

  const onInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    pickFile(f);
    e.target.value = "";
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    pickFile(e.dataTransfer.files?.[0] ?? null);
  };

  const onDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(true);
  };

  const onDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
  };

  const openFilePicker = () => inputRef.current?.click();

  const upload = async () => {
    if (!file) return;
    setUploading(true);
    setFeedback(null);
    const body = new FormData();
    body.append("file", file);

    try {
      const res = await fetch(`${apiBaseUrl}/titanic/upload`, {
        method: "POST",
        body,
      });
      if (!res.ok) {
        const msg = await res.text().catch(() => "");
        throw new Error(msg || `HTTP ${res.status}`);
      }
      setFeedback({ kind: "success", text: "서버에 업로드되었습니다." });
      setFile(null);
    } catch {
      setFeedback({
        kind: "error",
        text: "서버 업로드에 실패했습니다. 백엔드에 POST /titanic/upload 를 연결하면 전송됩니다.",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <main className="flex-1 flex flex-col items-center min-h-0 bg-white text-gray-900 px-4 py-10 overflow-y-auto">
      <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-center mb-2">
        타이타닉 홈
      </h1>
      <p className="text-sm text-gray-500 text-center mb-10 max-w-md">
        titanic.csv 파일만 업로드할 수 있습니다. 아래 영역에 놓거나, 버튼으로 선택한 뒤 업로드하세요.
      </p>

      <input
        ref={inputRef}
        type="file"
        accept=".csv,text/csv"
        className="sr-only"
        aria-hidden
        onChange={onInputChange}
      />

      {/* ① 업로드 창: 드래그 앤 드롭 + 클릭으로 파일 선택 */}
      <div
        role="button"
        tabIndex={0}
        aria-label="titanic.csv 파일을 끌어다 놓거나 클릭하여 선택"
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            openFilePicker();
          }
        }}
        onClick={openFilePicker}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        className={[
          "w-full max-w-md rounded-2xl border-2 border-dashed px-6 py-14 text-center cursor-pointer transition-colors outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2",
          dragOver
            ? "border-blue-500 bg-blue-50/80"
            : "border-gray-300 bg-gray-50/80 hover:border-gray-400 hover:bg-gray-50",
        ].join(" ")}
      >
        <Upload
          className="mx-auto mb-4 text-gray-400"
          size={40}
          strokeWidth={1.5}
          aria-hidden
        />
        <p className="text-base font-medium text-gray-800 mb-1">
          업로드 창
        </p>
        <p className="text-sm text-gray-500">
          titanic.csv 를 여기에 끌어다 놓거나, 이 영역을 클릭해 선택하세요.
        </p>
      </div>

      <p className="text-xs text-gray-400 my-6">또는</p>

      {/* ② 버튼 방식: 파일 선택 + 업로드 */}
      <div className="flex flex-wrap items-center justify-center gap-3 w-full max-w-md">
        <button
          type="button"
          onClick={openFilePicker}
          className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-xl border border-gray-300 bg-white text-gray-800 hover:bg-gray-50 transition-colors"
        >
          <FolderOpen size={18} aria-hidden />
          파일 선택
        </button>
        <button
          type="button"
          disabled={!file || uploading}
          onClick={upload}
          className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-xl border border-blue-600 bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {uploading ? (
            <Loader2 size={18} className="animate-spin" aria-hidden />
          ) : (
            <Upload size={18} aria-hidden />
          )}
          업로드
        </button>
      </div>

      {feedback && (
        <div
          role="status"
          className={[
            "mt-8 flex max-w-md items-start gap-2 rounded-xl border px-4 py-3 text-sm",
            feedback.kind === "success" &&
              "border-green-200 bg-green-50 text-green-900",
            feedback.kind === "error" &&
              "border-red-200 bg-red-50 text-red-900",
            feedback.kind === "info" &&
              "border-gray-200 bg-gray-50 text-gray-800",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          {feedback.kind === "success" && (
            <CheckCircle2 className="shrink-0 text-green-600" size={18} aria-hidden />
          )}
          {feedback.kind === "error" && (
            <AlertCircle className="shrink-0 text-red-600" size={18} aria-hidden />
          )}
          {feedback.kind === "info" && (
            <CheckCircle2 className="shrink-0 text-gray-500" size={18} aria-hidden />
          )}
          <span>{feedback.text}</span>
        </div>
      )}
    </main>
  );
}
