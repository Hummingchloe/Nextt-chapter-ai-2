// ─────────────────────────────────────────────────────────────
// Optional AI narrative layer.
// The rule-based engine (lib/engine.ts) and deterministic report
// (lib/report.ts) ALWAYS run and are the source of truth for QA.
// If ANTHROPIC_API_KEY is present, we ask Claude to gently rewrite the
// final report copy to feel more personal — without changing the
// recommended direction, offer, channels, or action.
//
// No SDK dependency: uses the Messages REST API via fetch.
// Safe fallback: any error returns the deterministic report unchanged.
// ─────────────────────────────────────────────────────────────

import { reportToText } from "./report";
import type { QuestionResponseMap, ReportSection } from "./types";

// Sonnet 4.6 is the default: excellent Korean prose, fast + affordable,
// and comfortably within Vercel function time limits. Override with
// ANTHROPIC_MODEL (e.g. claude-opus-4-8 for max quality).
const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6";

export function aiEnabled(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

interface WarmFields {
  summary?: string;
  strengths?: string[];
  closing?: string;
}

export async function warmUpReport(
  report: ReportSection,
  answers: QuestionResponseMap,
): Promise<ReportSection> {
  if (!aiEnabled()) return report;

  const system = [
    "당신은 미국에 사는 한인 이민자 엄마를 돕는 따뜻하고 현실적인 진단 코치입니다.",
    "이미 만들어진 진단 리포트의 일부 문장을 더 자연스럽고 따뜻하게 다듬는 역할만 합니다.",
    "규칙: 추천 방향/오퍼/채널/행동의 '내용'은 절대 바꾸지 마세요. 빈말·과장 칭찬 금지.",
    "창업 용어 대신 생활 언어를 쓰고, 짧고 다정하게. 반드시 한국어.",
    "출력은 JSON만: {\"summary\": string, \"strengths\": string[], \"closing\": string}",
  ].join("\n");

  const user = [
    "아래는 사용자의 답변 요약과 현재 리포트입니다.",
    "summary, strengths(3~4개), closing 세 부분만 더 따뜻하게 다듬어 JSON으로 주세요.",
    "",
    "[사용자 답변]",
    JSON.stringify(answers, null, 2),
    "",
    "[현재 리포트 텍스트]",
    reportToText(report),
  ].join("\n");

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY as string,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1200,
        system,
        messages: [{ role: "user", content: user }],
      }),
      // Keep well under Vercel's function limit; fall back to the
      // deterministic report if the model is slow.
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) return report;
    const data = await res.json();
    const text: string =
      data?.content?.map((c: { text?: string }) => c.text ?? "").join("") ?? "";
    const json = extractJson(text);
    if (!json) return report;

    const warm = json as WarmFields;
    return {
      ...report,
      summary: warm.summary?.trim() || report.summary,
      strengths:
        Array.isArray(warm.strengths) && warm.strengths.length >= 3
          ? warm.strengths.slice(0, 4)
          : report.strengths,
      closing: warm.closing?.trim() || report.closing,
    };
  } catch {
    return report;
  }
}

function extractJson(text: string): unknown | null {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  try {
    return JSON.parse(text.slice(start, end + 1));
  } catch {
    return null;
  }
}
