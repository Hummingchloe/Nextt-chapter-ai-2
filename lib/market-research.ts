import { anthropicApiKey, anthropicModel } from "./ai-env";
import type {
  QuestionResponseMap,
  RecommendationOutput,
  ReportSection,
} from "./types";

type EvidenceType = "problem" | "search" | "payment" | "competition";

interface ResearchPayload {
  signals?: { type?: EvidenceType; text?: string }[];
  unknowns?: string[];
}

interface WebSource {
  title: string;
  url: string;
}

interface WebResearchResult {
  searchCount: number;
  payload: ResearchPayload | null;
  sources: WebSource[];
}

function clean(value: unknown, max = 180): string {
  return typeof value === "string"
    ? value.trim().replace(/\s+/g, " ").slice(0, max)
    : "";
}

function extractJson(text: string): ResearchPayload | null {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try {
    return JSON.parse(text.slice(start, end + 1)) as ResearchPayload;
  } catch {
    return null;
  }
}

function uniqueSources(content: unknown[]): WebSource[] {
  const sources = new Map<string, WebSource>();
  for (const block of content) {
    if (!block || typeof block !== "object") continue;
    const citations = (block as { citations?: unknown[] }).citations;
    if (!Array.isArray(citations)) continue;
    for (const citation of citations) {
      if (!citation || typeof citation !== "object") continue;
      const url = clean((citation as { url?: unknown }).url, 500);
      const title = clean((citation as { title?: unknown }).title, 120);
      if (url.startsWith("http") && title && !sources.has(url)) {
        sources.set(url, { title, url });
      }
    }
  }
  return [...sources.values()];
}

function evidenceScore(types: Set<EvidenceType>, sourceCount: number): number {
  let score = 20;
  if (types.has("problem")) score += 18;
  if (types.has("search")) score += 14;
  if (types.has("payment")) score += 22;
  if (types.has("competition")) score += 12;
  score += Math.min(10, Math.max(0, sourceCount - 2) * 5);
  return Math.min(88, score);
}

export function applyWebResearch(
  report: ReportSection,
  result: WebResearchResult | null,
): ReportSection {
  const market = report.marketCheck;
  if (!market) return report;

  if (!result) {
    return {
      ...report,
      marketCheck: {
        ...market,
        researchStatus: "unavailable",
        score: Math.min(market.score, 49),
        verdict: "needs_evidence",
        demandSignals: ["현재 웹 조사를 완료하지 못해 시장 근거 판단을 보류했어요."],
        riskSignals: [
          "공개 근거를 다시 확인하기 전에는 실제 수요가 확인됐다고 보기 어려워요.",
        ],
        coaching:
          "리포트의 방향은 참고하되, 시장 점수는 웹 근거가 확보될 때 다시 확인해 주세요.",
        sources: [],
      },
    };
  }

  const rawSignals = Array.isArray(result.payload?.signals)
    ? result.payload!.signals!
    : [];
  const signals = rawSignals
    .map((signal) => ({
      type: signal?.type,
      text: clean(signal?.text),
    }))
    .filter(
      (signal): signal is { type: EvidenceType; text: string } =>
        ["problem", "search", "payment", "competition"].includes(
          signal.type ?? "",
        ) && Boolean(signal.text),
    );
  const types = new Set(signals.map((signal) => signal.type));
  const unknowns = Array.isArray(result.payload?.unknowns)
    ? result.payload!.unknowns!.map((item) => clean(item)).filter(Boolean)
    : [];
  const supported =
    result.searchCount === 2 &&
    result.sources.length >= 3 &&
    signals.length >= 2 &&
    types.size >= 2;

  if (!supported) {
    return {
      ...report,
      marketCheck: {
        ...market,
        researchStatus: "insufficient",
        score: Math.min(market.score, 49),
        verdict: "needs_evidence",
        demandSignals: [
          "서로 다른 공개 출처 3개 이상에서 시장 근거를 교차 확인하지 못했어요.",
        ],
        riskSignals: unknowns.length
          ? unknowns.slice(0, 3)
          : ["정확한 고객 문제·지불 의사·기존 대안을 더 확인해야 해요."],
        coaching:
          "근거가 부족한 상태에서는 긍정적으로 추정하지 않고 시장 판단을 보류하는 편이 안전해요.",
        sources: result.sources.slice(0, 3).map((source) => ({
          label: source.title,
          kind: "web_evidence" as const,
          url: source.url,
          why: "이번 조사에서 확인했지만 교차 검증 기준에는 부족했던 공개 근거예요.",
        })),
      },
    };
  }

  const webScore = evidenceScore(types, result.sources.length);
  const score = Math.min(88, Math.round(market.score * 0.4 + webScore * 0.6));
  const riskSignals = unknowns.length
    ? unknowns.slice(0, 3)
    : ["정확한 고객군의 지불 의사는 직접 대화나 사전 신청으로 확인해야 해요."];
  const verdict =
    score >= 70 && riskSignals.length <= 2
      ? "ready_to_test"
      : score >= 52
        ? "needs_narrowing"
        : "needs_evidence";

  return {
    ...report,
    marketCheck: {
      ...market,
      researchStatus: "supported",
      score,
      verdict,
      demandSignals: signals.slice(0, 4).map((signal) => signal.text),
      riskSignals,
      coaching:
        verdict === "ready_to_test"
          ? "공개 시장 근거가 확인됐어요. 이제 작은 유료 제안으로 직접 검증할 차례예요."
          : "시장 단서는 확인됐지만, 고객과 오퍼를 더 좁혀 직접 검증해야 해요.",
      sources: result.sources.slice(0, 5).map((source) => ({
        label: source.title,
        kind: "web_evidence" as const,
        url: source.url,
        why: "시장 수요·유료 대안·경쟁 상황을 확인한 공개 근거예요.",
      })),
    },
  };
}

async function runWebResearch(
  report: ReportSection,
  answers: QuestionResponseMap,
  recommendation: RecommendationOutput,
): Promise<WebResearchResult | null> {
  const apiKey = anthropicApiKey();
  if (!apiKey || !report.marketCheck) return null;

  const system = [
    "당신은 시장성 성공을 예언하지 않고 공개 웹 근거만 검증하는 리서처입니다.",
    "반드시 웹검색을 정확히 2회 수행하세요.",
    "첫 검색은 고객 문제·반복 수요·검색 관심을, 두 번째 검색은 유료 대안·가격·경쟁을 조사하세요.",
    "서로 다른 URL 3개 이상, 가능하면 서로 다른 유형의 출처를 사용하세요.",
    "검색 결과가 약하거나 정확한 고객군과 맞지 않으면 근거가 부족하다고 명시하세요.",
    "검색으로 뒷받침되지 않은 문장은 쓰지 마세요.",
    '마지막 답변은 JSON만 작성하세요: {"signals":[{"type":"problem|search|payment|competition","text":"출처로 확인한 짧은 한국어 문장"}],"unknowns":["아직 확인되지 않은 것"]}',
  ].join("\n");

  const user = [
    "[사용자 입력]",
    JSON.stringify(answers),
    "",
    `[추천 방향] ${recommendation.topDirection.label}`,
    `[첫 오퍼] ${report.offerDraft}`,
    "",
    "한국어와 영어 검색어를 적절히 사용해 현재 공개 시장 근거를 조사하세요.",
  ].join("\n");

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: anthropicModel(),
        max_tokens: 1200,
        temperature: 0,
        system,
        messages: [{ role: "user", content: user }],
        tools: [
          {
            type: "web_search_20250305",
            name: "web_search",
            max_uses: 2,
          },
        ],
      }),
      signal: AbortSignal.timeout(16000),
    });
    if (!response.ok) return null;

    const data = await response.json();
    const content = Array.isArray(data?.content) ? data.content : [];
    const text = content
      .filter((block: { type?: string }) => block?.type === "text")
      .map((block: { text?: string }) => block.text ?? "")
      .join("");
    const countedUses = content.filter(
      (block: { type?: string; name?: string }) =>
        block?.type === "server_tool_use" && block?.name === "web_search",
    ).length;
    const usageCount = data?.usage?.server_tool_use?.web_search_requests;

    return {
      searchCount:
        typeof usageCount === "number" ? usageCount : countedUses,
      payload: extractJson(text),
      sources: uniqueSources(content),
    };
  } catch {
    return null;
  }
}

export async function researchMarket(
  report: ReportSection,
  answers: QuestionResponseMap,
  recommendation: RecommendationOutput,
): Promise<ReportSection> {
  return applyWebResearch(
    report,
    await runWebResearch(report, answers, recommendation),
  );
}
