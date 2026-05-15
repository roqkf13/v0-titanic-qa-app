import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

type ChatTurn = { role: "user" | "assistant"; text: string };

function toGeminiHistory(prior: ChatTurn[]) {
  return prior.map((m) => ({
    role: m.role === "assistant" ? ("model" as const) : ("user" as const),
    parts: [{ text: m.text }],
  }));
}

export async function POST(req: Request) {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    return NextResponse.json(
      { error: "서버에 GEMINI_API_KEY 가 설정되지 않았습니다. .env.local 을 확인하세요." },
      { status: 503 }
    );
  }

  let body: { messages?: ChatTurn[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "잘못된 JSON 입니다." }, { status: 400 });
  }

  const messages = body.messages;
  if (!Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: "messages 가 필요합니다." }, { status: 400 });
  }

  const last = messages[messages.length - 1];
  if (last.role !== "user" || typeof last.text !== "string" || !last.text.trim()) {
    return NextResponse.json(
      { error: "마지막 메시지는 사용자(user) 텍스트여야 합니다." },
      { status: 400 }
    );
  }

  const prior = messages.slice(0, -1);
  for (let i = 0; i < prior.length; i++) {
    const expected: "user" | "assistant" = i % 2 === 0 ? "user" : "assistant";
    if (prior[i].role !== expected) {
      return NextResponse.json(
        { error: "대화 순서는 user → assistant 가 반복되어야 합니다." },
        { status: 400 }
      );
    }
  }

  const modelName = process.env.GEMINI_MODEL?.trim() || "gemini-2.0-flash";

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: modelName });
    const history = toGeminiHistory(prior);
    const chat = model.startChat({ history });
    const result = await chat.sendMessage(last.text.trim());
    const text = result.response.text();
    return NextResponse.json({ text });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Gemini 요청 실패";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
