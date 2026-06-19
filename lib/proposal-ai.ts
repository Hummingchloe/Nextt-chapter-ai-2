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

interface ProposalCallAttempt {
  result: ProposalAIResult | null;
  error?: string;
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

  const claudeAttempt = await callProposalClaude(ontology, apiKey, false);
  const claudeOnly = claudeAttempt.result;
  if (claudeOnly) return claudeOnly;

  return {
    dashboard: fallback,
    diagnostics: {
      aiUsed: false,
      provider: "deterministic",
      webSearchUsed: false,
      webSearchRequests: 0,
      fallbackReason: `anthropic_request_failed:${claudeAttempt.error ?? "unknown"}`,
    },
  };
}

export async function searchProposalContentWithAI(
  ontology: UserOntology,
): Promise<ProposalAIResult> {
  const apiKey = anthropicApiKey();
  const fallback = buildProposalDashboard(ontology);
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

  const attempt = await callProposalClaude(ontology, apiKey, true);
  if (attempt.result) return attempt.result;
  return {
    dashboard: fallback,
    diagnostics: {
      aiUsed: false,
      provider: "deterministic",
      webSearchUsed: false,
      webSearchRequests: 0,
      fallbackReason: `web_search_failed:${attempt.error ?? "unknown"}`,
    },
  };
}

async function callProposalClaude(
  ontology: UserOntology,
  apiKey: string,
  withWebSearch: boolean,
): Promise<ProposalCallAttempt> {
  const model = anthropicModel();
  const deterministic = buildProposalDashboard(ontology);
  const context = buildContext(ontology);
  const system = withWebSearch
    ? [
        "당신은 My Life Compass의 콘텐츠 리서처입니다.",
        "사용자 온톨로지에 맞는 실용적인 YouTube 영상 페이지를 찾습니다.",
        "web_search를 정확히 한 번 사용하세요. 검색 결과에 없는 URL은 만들지 마세요.",
        "검색이 끝나면 JSON 한 줄만 출력하세요.",
        '{"userSummary":"","actions":[],"youtubeLinks":[]}',
      ].join("\n")
    : [
        "당신은 My Life Compass의 Proposal Engine입니다.",
        "사용자의 개인 온톨로지와 Compass 방향 선명도를 읽고, 지금 당장 할 수 있는 작은 행동을 제안합니다.",
        "액션은 오늘/내일/3일차로 나누고 각 행동은 15분 안에 시작 가능해야 합니다.",
        "사용자의 실제 자산, 시장 신호, 제약을 구체적으로 반영하세요. 일반적인 자기계발 문구를 금지합니다.",
        "userSummary는 2문장 이내, 각 title은 30자 이내, detail은 60자 이내로 간결하게 작성하세요.",
        "youtubeLinks는 빈 배열로 두세요. 한국어로 작성하세요.",
        '최종 출력은 JSON만: {"userSummary":string,"actions":[{"dateLabel":"오늘|내일|3일차","title":string,"detail":string}],"youtubeLinks":[]}',
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
        max_tokens: withWebSearch ? 350 : 1600,
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
            max_uses: 1,
            allowed_domains: ["youtube.com"],
            user_location: {
              type: "approximate",
              country: "KR",
              timezone: "Asia/Seoul",
            },
          }],
        } : {
          output_config: {
            format: {
              type: "json_schema",
              schema: {
                type: "object",
                properties: {
                  userSummary: { type: "string" },
                  actions: {
                    type: "array",
                    minItems: 1,
                    items: {
                      type: "object",
                      properties: {
                        dateLabel: { type: "string" },
                        title: { type: "string" },
                        detail: { type: "string" },
                      },
                      required: ["dateLabel", "title", "detail"],
                      additionalProperties: false,
                    },
                  },
                  youtubeLinks: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string" },
                        url: { type: "string" },
                        why: { type: "string" },
                        channel: { type: "string" },
                      },
                      required: ["title", "url", "why", "channel"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["userSummary", "actions", "youtubeLinks"],
                additionalProperties: false,
              },
            },
          },
        }),
      }),
      signal: AbortSignal.timeout(withWebSearch ? 18000 : 32000),
    });
    if (!response.ok) {
      const errorBody = await response.json().catch(() => null);
      const errorType =
        typeof errorBody?.error?.type === "string" ? errorBody.error.type : "unknown";
      const errorMessage =
        typeof errorBody?.error?.message === "string"
          ? errorBody.error.message.replace(/\s+/g, "_").slice(0, 180)
          : "no_message";
      return {
        result: null,
        error: `http_${response.status}_${errorType}:${errorMessage}`,
      };
    }

    const data = await response.json();
    const text = collectText(data?.content);
    const webResults = collectWebResults(data?.content);
    const parsed = extractJson(text) as RawProposal | null;
    if (!parsed && !(withWebSearch && webResults.length)) {
      return {
        result: null,
        error: `json_parse_failed_stop_${String(data?.stop_reason ?? "unknown")}_chars_${text.length}`,
      };
    }
    const proposal = parsed ?? {};
    const actions = parseActions(proposal.actions);
    const youtubeLinks = withWebSearch
      ? parseYoutubeLinks(proposal.youtubeLinks, webResults)
      : [];
    const userSummary =
      typeof proposal.userSummary === "string" && proposal.userSummary.trim()
        ? proposal.userSummary.trim()
        : deterministic.userSummary;
    const webSearchRequests = Number(data?.usage?.server_tool_use?.web_search_requests ?? 0);

    return {
      result: {
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
      },
    };
  } catch (error) {
    const name = error instanceof Error ? error.name : "unknown";
    return { result: null, error: `exception_${name}` };
  }
}

function buildContext(ontology: UserOntology): string {
  const signals = ontology.signals
    .slice(0, 8)
    .map((signal) => `- ${signal.kind}: ${signal.label} / 근거: ${signal.evidence}`)
    .join("\n");
  const records = ontology.messages
    .filter((message) => message.role === "user")
    .slice(-5)
    .map((message) => `- ${message.text}`)
    .join("\n");
  return [
    `[방향 선명도] ${ontology.compass.alignment}%`,
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
