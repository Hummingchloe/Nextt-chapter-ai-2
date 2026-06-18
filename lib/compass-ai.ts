import "server-only";

import { anthropicApiKey, anthropicModel } from "./ai-env";
import type { UserOntology } from "./ontology";

export interface CompassAIReply {
  text: string;
  provider: "anthropic";
  model: string;
}

export async function generateCompassAIReply(
  ontology: UserOntology,
): Promise<CompassAIReply | null> {
  const apiKey = anthropicApiKey();
  if (!apiKey) return null;

  const recentMessages = ontology.messages
    .slice(-10)
    .map((message) => `${message.role === "user" ? "사용자" : "Compass"}: ${message.text}`)
    .join("\n");
  const signals = ontology.signals
    .slice(0, 10)
    .map((signal) => `- ${signal.kind}: ${signal.label}`)
    .join("\n");

  const system = [
    "당신은 My Next Chapter의 Compass Chat 코치입니다.",
    "사용자의 채팅을 바탕으로 개인 온톨로지를 선명하게 만들고, 다음 한 번의 대화를 자연스럽게 이어갑니다.",
    "반드시 한국어로 2~4문장만 답하세요.",
    "최근 대화에서 이미 물었던 질문을 그대로 또는 비슷하게 반복하지 마세요.",
    "사용자가 방금 답한 내용을 한 문장으로 구체적으로 반영한 뒤 다음으로 넘어가세요.",
    "정렬도 50% 미만이면 아직 부족한 차원 중 하나만 골라 새로운 질문을 정확히 하나 하세요.",
    "정렬도 50% 이상이면 현재 보이는 패턴을 짚고 대시보드에서 액션을 확인할 수 있다고 알려주세요. 필요할 때만 질문 하나를 덧붙이세요.",
    "과장, 진단 확정, 성공 보장, 빈 칭찬은 금지합니다.",
    '출력은 JSON만: {"reply": string}',
  ].join("\n");

  const user = [
    `[현재 정렬도] ${ontology.compass.alignment}%`,
    `[명료도] ${ontology.compass.clarity}%`,
    `[확신도] ${ontology.compass.confidence}%`,
    `[현재 요약] ${ontology.summary}`,
    `[규칙 기반 다음 질문 후보] ${ontology.compass.nextQuestion}`,
    "",
    "[온톨로지 신호]",
    signals || "- 아직 없음",
    "",
    "[최근 대화]",
    recentMessages,
  ].join("\n");

  try {
    const model = anthropicModel();
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model,
        max_tokens: 500,
        temperature: 0.35,
        system,
        messages: [{ role: "user", content: user }],
      }),
      signal: AbortSignal.timeout(12000),
    });
    if (!response.ok) return null;

    const data = await response.json();
    const text: string =
      data?.content?.map((part: { text?: string }) => part.text ?? "").join("") ?? "";
    const parsed = extractJson(text) as { reply?: unknown } | null;
    const reply = typeof parsed?.reply === "string" ? parsed.reply.trim() : "";
    if (!reply) return null;
    return { text: reply, provider: "anthropic", model };
  } catch {
    return null;
  }
}

function extractJson(text: string): unknown | null {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try {
    return JSON.parse(text.slice(start, end + 1));
  } catch {
    return null;
  }
}
