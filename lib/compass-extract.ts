import "server-only";

// ─────────────────────────────────────────────────────────────
// Compass extraction — the "intelligence half" of the engine.
//
// This is the only place an LLM enters the vector model. It turns free text
// into structured beads (the hard part the math half can't do), and induces
// the LEARNED axis space from a corpus. Everything here is server-only (the
// API key lives on the server) and returns plain data the client persists.
//
// Boundaries (locked in design):
//   • Claude does extraction + axis induction ONLY. It never computes M,
//     posteriors, or decay — that stays in the deterministic `compass-engine`.
//   • Structured output via forced tool_use (not prose + regex), so results are
//     schema-validated, not best-effort parsed.
//   • Graceful degradation: no key / failure → null. Callers fall back to a
//     default axis set and skip bead extraction rather than crashing.
// ─────────────────────────────────────────────────────────────

import { anthropicApiKey, anthropicModel } from "./ai-env";
import type { Axis, Bead, BeadSource } from "./compass-engine";
import type { ContentLink } from "./compass-content";

const API_URL = "https://api.anthropic.com/v1/messages";
const TIMEOUT_MS = 12000;

// Used when there is no API key yet or induction hasn't run. The product still
// works (deterministic math on these axes); the LLM just makes them personal.
export const DEFAULT_AXES: Axis[] = [
  { id: "delivery", name: "전달 방식", posPole: "1:N 규모(콘텐츠/제품)", negPole: "1:1 깊은 도움" },
  { id: "asset", name: "자산 원천", posPole: "새 AI/도구 레버리지", negPole: "쌓아온 전문성" },
  { id: "market", name: "시장 접근", posPole: "낯선 시장 개척", negPole: "기존 관계/커뮤니티" },
];

export interface ExtractResult {
  beads: Bead[];
  model: string;
}

export interface InduceResult {
  axes: Axis[];
  model: string;
}

interface RawBead {
  source?: string;
  what?: string;
  why?: string;
  direction?: number[];
  intensity?: number;
  confidence?: number;
  weight?: number;
}

const BEAD_TOOL = {
  name: "record_beads",
  description:
    "Record the decision/value/market signals (beads) extracted from the user's text as vectors in the current axis space.",
  input_schema: {
    type: "object",
    properties: {
      beads: {
        type: "array",
        items: {
          type: "object",
          properties: {
            source: {
              type: "string",
              enum: ["record", "market", "action"],
              description:
                "record = the user's own words/preference; market = an external signal (someone asked/needed something); action = something the user actually did.",
            },
            what: { type: "string", description: "Short phrase: what was chosen/rejected/observed." },
            why: { type: "string", description: "The underlying reason you infer (essence, not surface)." },
            direction: {
              type: "array",
              items: { type: "number" },
              description:
                "One number per axis, in [-1,1]. +1 = toward that axis's positive pole, -1 = negative pole, 0 = irrelevant. Length MUST equal the number of axes given.",
            },
            intensity: { type: "number", description: "0..1 reaction strength." },
            confidence: { type: "number", description: "0..1 how sure you are about this extraction." },
            weight: {
              type: "number",
              description:
                "1..10 importance. Rubric: financial stake, time commitment, irreversibility, emotional intensity, repetition. Actually-done actions and real market signals weigh more than casual remarks.",
            },
          },
          required: ["source", "what", "why", "direction", "intensity", "confidence", "weight"],
        },
      },
    },
    required: ["beads"],
  },
} as const;

const ESSENCE_TOOL = {
  name: "write_essence",
  description:
    "Compress the person's beads into ONE high-abstraction sentence that captures the essence of their work direction — not a list of values.",
  input_schema: {
    type: "object",
    properties: {
      sentence: {
        type: "string",
        description:
          "그 사람의 본질을 포착하는 단 한 문장. 직업명이나 명사 하나로 규정하지 말 것. 서로 다르거나 흩어진 관심·페르소나를 가로질러 그 밑에 흐르는 공통의 본질을 뽑아, '~하는 사람' 또는 '~하는 자' 형태로. 예: 플로리스트와 테일러숍을 함께 꿈꾸는 사람 → '누군가만을 위한 특별한 순간을 디자인해주는 자'.",
      },
    },
    required: ["sentence"],
  },
} as const;

const AXIS_TOOL = {
  name: "define_axes",
  description:
    "Define 3-5 latent axes that best separate this person's work-direction signals. Axes are LEARNED from their text, not a fixed template.",
  input_schema: {
    type: "object",
    properties: {
      axes: {
        type: "array",
        items: {
          type: "object",
          properties: {
            id: { type: "string", description: "short stable slug, e.g. 'delivery'." },
            name: { type: "string", description: "human-readable axis name in Korean." },
            posPole: { type: "string", description: "what the +1 end means, in Korean." },
            negPole: { type: "string", description: "what the -1 end means, in Korean." },
          },
          required: ["id", "name", "posPole", "negPole"],
        },
      },
    },
    required: ["axes"],
  },
} as const;

function axisBlock(axes: Axis[]): string {
  return axes
    .map((a, i) => `${i}: ${a.name} (+1=${a.posPole} / -1=${a.negPole})`)
    .join("\n");
}

async function callTool(
  system: string,
  userText: string,
  tool: typeof BEAD_TOOL | typeof AXIS_TOOL | typeof ESSENCE_TOOL,
): Promise<Record<string, unknown> | null> {
  const apiKey = anthropicApiKey();
  if (!apiKey) return null;
  const model = anthropicModel();
  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model,
        max_tokens: 1024,
        temperature: 0.2,
        system,
        tools: [tool],
        tool_choice: { type: "tool", name: tool.name },
        messages: [{ role: "user", content: userText }],
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const block = (data?.content ?? []).find(
      (p: { type?: string; name?: string }) => p.type === "tool_use" && p.name === tool.name,
    );
    const input = block?.input;
    return input && typeof input === "object" ? (input as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

function num(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function clamp(x: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, x));
}

function conformDirection(direction: unknown, dims: number): number[] {
  const out = new Array(dims).fill(0);
  if (Array.isArray(direction)) {
    for (let i = 0; i < dims; i++) {
      const v = direction[i];
      if (typeof v === "number" && Number.isFinite(v)) out[i] = clamp(v, -1, 1);
    }
  }
  return out;
}

function toBead(raw: RawBead, axes: Axis[], now: string, id: string): Bead | null {
  const what = typeof raw.what === "string" ? raw.what.trim() : "";
  if (!what) return null;
  const source: BeadSource =
    raw.source === "market" || raw.source === "action" ? raw.source : "record";
  return {
    id,
    source,
    what: what.length > 96 ? `${what.slice(0, 96)}…` : what,
    why: typeof raw.why === "string" ? raw.why.trim() : "",
    direction: conformDirection(raw.direction, axes.length),
    intensity: clamp(num(raw.intensity, 0.6), 0, 1),
    confidence: clamp(num(raw.confidence, 0.6), 0, 1),
    weight: Math.round(clamp(num(raw.weight, 5), 1, 10)),
    createdAt: now,
  };
}

// text → beads, projected into the supplied (learned) axis space.
// `idSeed` makes bead ids deterministic for the caller (no Date.now here).
export async function extractBeads(
  text: string,
  axes: Axis[],
  now: string,
  idSeed: string,
): Promise<ExtractResult | null> {
  const trimmed = text.trim();
  if (!trimmed) return null;

  const system = [
    "당신은 사용자의 글에서 '일의 방향' 신호를 벡터로 추출하는 분석기입니다.",
    "직접 묻지 말고, 선택·거부·선호·감정 반응·반복 주제에서 신호(구슬)를 역추론하세요.",
    "각 구슬의 direction은 아래 축 순서대로, 각 성분 [-1,1]. 관련 없는 축은 0.",
    "행동(실제 한 일)과 시장 신호(누가 무엇을 요청/필요로 함)는 단순 발화보다 weight를 높게.",
    "확신이 약하면 confidence를 낮추세요(억지 추출 금지). 신호가 없으면 빈 배열.",
    "",
    "[축]",
    axisBlock(axes),
  ].join("\n");

  const input = await callTool(system, trimmed, BEAD_TOOL);
  if (!input) return null;
  const rawBeads = Array.isArray(input.beads) ? (input.beads as RawBead[]) : [];
  const beads = rawBeads
    .map((raw, i) => toBead(raw, axes, now, `bead-${idSeed}-${i}`))
    .filter((b): b is Bead => b !== null);
  return { beads, model: anthropicModel() };
}

// beads → one high-abstraction essence sentence (the H one-liner). Returns null
// on no-key/failure so the caller keeps the deterministic templated one-liner.
export async function synthesizeEssence(
  beads: Bead[],
  axes: Axis[],
  hDir: number[],
): Promise<string | null> {
  if (beads.length < 2) return null;
  const beadLines = beads
    .slice(-16)
    .map((b) => `- [${b.source}] ${b.what} (w${b.weight})`)
    .join("\n");
  const hLine = axes
    .map((a, i) => `${a.name}: ${(hDir[i] ?? 0) > 0 ? a.posPole : a.negPole} (${(hDir[i] ?? 0).toFixed(2)})`)
    .join(" / ");

  const system = [
    "당신은 한 사람의 의사결정 구슬들을 읽고, 그 사람의 '일의 방향'을 단 한 문장으로 압축합니다.",
    "",
    "핵심 원칙:",
    "- 직업명이나 명사 하나로 규정하지 마세요(예: '플로리스트', '강사', '개발자' ❌).",
    "- 서로 다르거나 흩어진 관심·페르소나를 가로질러, 그 밑에 흐르는 '공통의 본질'을 뽑아내세요.",
    "- 추상도를 한 단계 올려, '~하는 사람' 또는 '~하는 자' 형태의 한 문장으로 쓰세요.",
    "- 가치를 나열하지 말고, 하나의 문장으로 압축하세요.",
    "",
    "예시: 플로리스트와 테일러숍을 함께 꿈꾸는 멀티페르소나 → '누군가만을 위한 특별한 순간을 디자인해주는 자'",
    "",
    "단정·과장 금지. 잠정적이되 선명하게. 한국어. 문장 하나만 출력.",
  ].join("\n");
  const input = await callTool(system, `[현재 방향]\n${hLine}\n\n[구슬]\n${beadLines}`, ESSENCE_TOOL);
  const sentence = typeof input?.sentence === "string" ? input.sentence.trim() : "";
  return sentence || null;
}

// Real YouTube recommendations via Anthropic's built-in web_search — one search
// only, scoped to youtube.com. Following the Vercel-timeout lesson: this is its
// OWN endpoint (never chained into /compute), lightweight, and URLs are
// validated against the actual web_search_tool_result blocks, not trusted from
// the model's prose. Returns null on no-key/failure → caller uses the
// deterministic deriveContent() fallback.
const YT_DIRECT = /(youtube\.com\/(watch\?v=|shorts\/)|youtu\.be\/)/i;

function youtubeThumbnail(url: string): string | undefined {
  const match =
    url.match(/[?&]v=([^&]+)/) ??
    url.match(/youtu\.be\/([^?&/]+)/) ??
    url.match(/youtube\.com\/shorts\/([^?&/]+)/);
  const id = match?.[1];
  return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : undefined;
}

export async function searchYoutubeContent(theme: string): Promise<ContentLink[] | null> {
  const apiKey = anthropicApiKey();
  if (!apiKey) return null;
  const model = anthropicModel();
  const prompt =
    `"${theme}" 주제로, 막 시작하는 1인 창업자에게 실질적으로 도움이 될 한국어 유튜브 영상을 검색해 3개만 추천해줘. 첫 오퍼 만들기/고객 검증/작은 실행 위주로.`;
  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model,
        max_tokens: 350,
        tools: [
          {
            type: "web_search_20250305",
            name: "web_search",
            max_uses: 1,
            allowed_domains: ["youtube.com"],
          },
        ],
        messages: [{ role: "user", content: prompt }],
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) return null;
    const data = await res.json();

    // Pull URLs straight from the search tool results — never from prose.
    const found: { url: string; title: string }[] = [];
    for (const block of data?.content ?? []) {
      if (block?.type !== "web_search_tool_result") continue;
      const items = Array.isArray(block.content) ? block.content : [];
      for (const it of items) {
        if (
          it?.type === "web_search_result" &&
          typeof it.url === "string" &&
          YT_DIRECT.test(it.url)
        ) {
          found.push({ url: it.url, title: typeof it.title === "string" ? it.title : it.url });
        }
      }
    }
    const links: ContentLink[] = found.slice(0, 3).map((r, i) => ({
      id: `yt-${i}`,
      title: r.title.length > 80 ? `${r.title.slice(0, 80)}…` : r.title,
      url: r.url,
      why: "실제 웹검색으로 찾은 영상이에요.",
      imageUrl: youtubeThumbnail(r.url),
    }));
    return links.length ? links : null;
  } catch {
    return null;
  }
}

// corpus (recent user texts) → 3-5 learned axes. Run on a trigger (enough new
// beads / drift), not every message. Returns null on no-key/failure so the
// caller keeps the previous axes (or DEFAULT_AXES).
export async function induceAxes(corpus: string[], now: string): Promise<InduceResult | null> {
  const joined = corpus.map((t) => t.trim()).filter(Boolean).join("\n---\n");
  if (!joined) return null;

  const system = [
    "당신은 한 사람의 기록에서 '일의 방향'을 가장 잘 가르는 잠재 축 3~5개를 귀납합니다.",
    "고정 템플릿(자율/깊이/혁신 등)을 쓰지 말고, 이 사람의 글에서 실제로 드러나는 대조축을 뽑으세요.",
    "각 축은 양극(+1)과 음극(-1)이 명확한 하나의 대조여야 합니다. 한국어로.",
    "겹치는 축은 합치고, 서로 독립적인 축이 되게 하세요.",
  ].join("\n");

  const input = await callTool(system, `[기록]\n${joined}`, AXIS_TOOL);
  if (!input) return null;
  const rawAxes = Array.isArray(input.axes) ? input.axes : [];
  const axes: Axis[] = rawAxes
    .map((a: Record<string, unknown>, i: number): Axis | null => {
      const name = typeof a?.name === "string" ? a.name.trim() : "";
      if (!name) return null;
      return {
        id: typeof a?.id === "string" && a.id.trim() ? a.id.trim() : `axis-${i}`,
        name,
        posPole: typeof a?.posPole === "string" ? a.posPole.trim() : "",
        negPole: typeof a?.negPole === "string" ? a.negPole.trim() : "",
      };
    })
    .filter((a): a is Axis => a !== null)
    .slice(0, 5);
  if (axes.length < 2) return null; // need a real space
  return { axes, model: anthropicModel() };
}
