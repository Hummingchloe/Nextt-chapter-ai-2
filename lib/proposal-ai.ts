import "server-only";

import { anthropicApiKey, anthropicModel } from "./ai-env";
import type { UserOntology } from "./ontology";
import {
  buildProposalDashboard,
  type ProposalAction,
  type ProposalDashboard,
  type ProposalGenerationDiagnostics,
  type ProposalLink,
} from "./proposal";

interface RawProposal {
  userSummary?: unknown;
  actions?: unknown;
  youtubeLinks?: unknown;
}

interface WebResult {
  title: string;
  url: string;
}

export interface ProposalAIResult {
  dashboard: ProposalDashboard;
  diagnostics: ProposalGenerationDiagnostics;
}

export async function generateProposalWithAI(
  ontology: UserOntology,
): Promise<ProposalAIResult> {
  const fallback = buildProposalDashboard(ontology);
  const apiKey = anthropicApiKey();
  if (!apiKey) {
    return {
      dashboard: fallback,
      diagnostics: {
        aiUsed: false,
        provider: "deterministic",
        webSearchUsed: false,
        webSearchRequests: 0,
        fallbackReason: "missing_anthropic_key",
      },
    };
  }

  const claudeOnly = await callProposalClaude(ontology, apiKey, false);
  if (claudeOnly) {
    const searched = await callProposalClaude(ontology, apiKey, true);
    if (searched?.diagnostics.webSearchUsed) {
      return {
        dashboard: {
          ...claudeOnly.dashboard,
          youtubeLinks: searched.dashboard.youtubeLinks,
          generatedAt: new Date().toISOString(),
        },
        diagnostics: searched.diagnostics,
      };
    }
    return {
      ...claudeOnly,
      diagnostics: {
        ...claudeOnly.diagnostics,
        fallbackReason: searched ? "web_search_no_results" : "web_search_unavailable",
      },
    };
  }

  return {
    dashboard: fallback,
    diagnostics: {
      aiUsed: false,
      provider: "deterministic",
      webSearchUsed: false,
      webSearchRequests: 0,
      fallbackReason: "anthropic_request_failed",
    },
  };
}

async function callProposalClaude(
  ontology: UserOntology,
  apiKey: string,
  withWebSearch: boolean,
): Promise<ProposalAIResult | null> {
  const model = anthropicModel();
  const deterministic = buildProposalDashboard(ontology);
  const context = buildContext(ontology);
  const system = [
    "당신은 My Next Chapter의 Proposal Engine입니다.",
    "사용자의 개인 온톨로지와 Compass 정렬도를 읽고, 지금 당장 할 수 있는 작은 행동과 실제 학습 콘텐츠를 제안합니다.",
    "액션은 오늘/내일/3일차로 나누고 각 행동은 15분 안에 시작 가능해야 합니다.",
    "사용자의 실제 자산, 시장 신호, 제약을 구체적으로 반영하세요. 일반적인 자기계발 문구를 금지합니다.",
    withWebSearch
      ? "웹서치를 반드시 사용해 YouTube의 실제 영상 페이지를 찾으세요. 검색 결과에 없는 URL은 만들지 마세요."
      : "웹서치를 사용할 수 없습니다. youtubeLinks는 빈 배열로 두세요.",
    "한국어로 작성하세요.",
    '최종 출력은 JSON만: {"userSummary":string,"actions":[{"dateLabel":"오늘|내일|3일차","title":string,"detail":string}],"youtubeLinks":[{"title":string,"url":string,"why":string,"channel":string}]}',
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
        model,
        max_tokens: withWebSearch ? 1100 : 800,
        temperature: 0.25,
        system,
        messages: [{
          role: "user",
          content: [
            context,
            "",
            withWebSearch
              ? "이 사용자에게 맞는 한국어 또는 영어 YouTube 영상 3개를 실제로 검색한 뒤 제안 JSON을 작성하세요."
              : "웹 링크 없이 액션과 사용자 요약만 제안 JSON으로 작성하세요.",
          ].join("\n"),
        }],
        ...(withWebSearch ? {
          tools: [{
            type: "web_search_20250305",
            name: "web_search",
            max_uses: 3,
            allowed_domains: ["youtube.com"],
            user_location: {
              type: "approximate",
              country: "KR",
              timezone: "Asia/Seoul",
            },
          }],
        } : {}),
      }),
      signal: AbortSignal.timeout(withWebSearch ? 12000 : 14000),
    });
    if (!response.ok) return null;

    const data = await response.json();
    const text = collectText(data?.content);
    const parsed = extractJson(text) as RawProposal | null;
    if (!parsed) return null;

    const webResults = collectWebResults(data?.content);
    const actions = parseActions(parsed.actions);
    const youtubeLinks = withWebSearch
      ? parseYoutubeLinks(parsed.youtubeLinks, webResults)
      : [];
    const userSummary =
      typeof parsed.userSummary === "string" && parsed.userSummary.trim()
        ? parsed.userSummary.trim()
        : deterministic.userSummary;
    const webSearchRequests = Number(data?.usage?.server_tool_use?.web_search_requests ?? 0);

    return {
      dashboard: {
        ...deterministic,
        actions: actions.length ? actions : deterministic.actions,
        youtubeLinks,
        userSummary,
        source: "claude",
        generatedAt: new Date().toISOString(),
      },
      diagnostics: {
        aiUsed: true,
        provider: "anthropic",
        model,
        webSearchUsed: webSearchRequests > 0 && webResults.length > 0,
        webSearchRequests,
      },
    };
  } catch {
    return null;
  }
}

function buildContext(ontology: UserOntology): string {
  const signals = ontology.signals
    .slice(0, 12)
    .map((signal) => `- ${signal.kind}: ${signal.label} / 근거: ${signal.evidence}`)
    .join("\n");
  const records = ontology.messages
    .filter((message) => message.role === "user")
    .slice(-8)
    .map((message) => `- ${message.text}`)
    .join("\n");
  return [
    `[정렬도] ${ontology.compass.alignment}%`,
    `[명료도] ${ontology.compass.clarity}%`,
    `[확신도] ${ontology.compass.confidence}%`,
    `[현재 요약] ${ontology.summary}`,
    "",
    "[온톨로지 신호]",
    signals || "- 없음",
    "",
    "[최근 사용자 기록]",
    records || "- 없음",
  ].join("\n");
}

function collectText(content: unknown): string {
  if (!Array.isArray(content)) return "";
  return content
    .filter((block) => block && typeof block === "object" && (block as { type?: string }).type === "text")
    .map((block) => String((block as { text?: string }).text ?? ""))
    .join("\n");
}

function collectWebResults(content: unknown): WebResult[] {
  if (!Array.isArray(content)) return [];
  const results: WebResult[] = [];
  for (const block of content) {
    if (!block || typeof block !== "object") continue;
    const typed = block as { type?: string; content?: unknown };
    if (typed.type !== "web_search_tool_result" || !Array.isArray(typed.content)) continue;
    for (const item of typed.content) {
      if (!item || typeof item !== "object") continue;
      const result = item as { type?: string; title?: unknown; url?: unknown };
      if (result.type !== "web_search_result") continue;
      if (typeof result.title !== "string" || typeof result.url !== "string") continue;
      if (!isYoutubeUrl(result.url)) continue;
      results.push({ title: result.title, url: result.url });
    }
  }
  return uniqueByUrl(results).slice(0, 6);
}

function parseActions(value: unknown): ProposalAction[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item, index) => {
      if (!item || typeof item !== "object") return null;
      const row = item as Record<string, unknown>;
      const title = stringValue(row.title);
      const detail = stringValue(row.detail);
      const dateLabel = stringValue(row.dateLabel);
      if (!title || !detail || !dateLabel) return null;
      return { id: `ai-action-${index + 1}`, dateLabel, title, detail };
    })
    .filter((item): item is ProposalAction => Boolean(item))
    .slice(0, 3);
}

function parseYoutubeLinks(value: unknown, webResults: WebResult[]): ProposalLink[] {
  const resultByUrl = new Map(webResults.map((result) => [normalizeUrl(result.url), result]));
  const links: ProposalLink[] = [];
  if (Array.isArray(value)) {
    for (const item of value) {
      if (!item || typeof item !== "object") continue;
      const row = item as Record<string, unknown>;
      const url = stringValue(row.url);
      const result = resultByUrl.get(normalizeUrl(url));
      if (!result) continue;
      links.push({
        id: `ai-video-${links.length + 1}`,
        title: stringValue(row.title) || result.title,
        url: result.url,
        why: stringValue(row.why) || "현재 온톨로지 신호와 직접 연결되는 실제 검색 결과입니다.",
        channel: stringValue(row.channel) || undefined,
      });
    }
  }
  if (links.length < 3) {
    for (const result of webResults) {
      if (links.some((link) => normalizeUrl(link.url) === normalizeUrl(result.url))) continue;
      links.push({
        id: `web-video-${links.length + 1}`,
        title: result.title,
        url: result.url,
        why: "현재 방향과 관련해 Claude가 실제 YouTube 검색에서 찾은 콘텐츠입니다.",
      });
      if (links.length >= 3) break;
    }
  }
  return links.slice(0, 3);
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

function stringValue(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function isYoutubeUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return (
      parsed.protocol === "https:" &&
      ((parsed.hostname === "www.youtube.com" || parsed.hostname === "youtube.com") &&
        (parsed.pathname === "/watch" || parsed.pathname.startsWith("/shorts/")) ||
        (parsed.hostname === "youtu.be" && parsed.pathname.length > 1))
    );
  } catch {
    return false;
  }
}

function normalizeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    parsed.hash = "";
    return parsed.toString();
  } catch {
    return url;
  }
}

function uniqueByUrl(results: WebResult[]): WebResult[] {
  const seen = new Set<string>();
  return results.filter((result) => {
    const key = normalizeUrl(result.url);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
