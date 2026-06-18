// ─────────────────────────────────────────────────────────────
// Deterministic fallback extractor.
//
// The vector engine needs beads with directions; only the LLM can really
// produce those. But the product must still run with no API key (local dev,
// this sandbox, key outage). This module is a degraded, keyword-based extractor
// that projects text onto the DEFAULT axis space so the compass keeps moving.
//
// Pure + deterministic + isomorphic (no server-only, no LLM, no storage), so it
// runs on client or server and is unit-testable. The LLM path supersedes it
// whenever a key is present.
// ─────────────────────────────────────────────────────────────

import type { Axis, Bead, BeadSource } from "./compass-engine";

// Per-axis keyword contributions, keyed by axis id (matches DEFAULT_AXES ids).
const HINTS: Record<string, { pos: string[]; neg: string[] }> = {
  delivery: {
    pos: ["제품", "콘텐츠", "유튜브", "강의", "클래스", "온라인", "규모", "많은 사람", "구독"],
    neg: ["1:1", "코칭", "상담", "컨설", "직접", "맞춤", "대행", "한 명"],
  },
  asset: {
    pos: ["ai", "챗gpt", "gpt", "자동화", "노션", "도구", "프롬프트", "디지털", "코딩"],
    neg: ["경력", "경험", "전문", "자격", "수년", "오래", "해온", "베테랑"],
  },
  market: {
    pos: ["새 시장", "모르는", "낯선", "광고", "마케팅", "콜드", "신규"],
    neg: ["지인", "친구", "모임", "커뮤니티", "교회", "소개", "아는 사람", "이웃", "동네"],
  },
};

const ACTION_HINTS = ["했어", "했고", "완료", "끝냈", "보냈", "만들었", "올렸", "해봤", "시도"];
const MARKET_HINTS = ["물어", "요청", "필요", "고객", "반응", "불편", "도와달", "문의"];

function clamp(x: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, x));
}

function detectSource(lower: string): BeadSource {
  if (ACTION_HINTS.some((h) => lower.includes(h))) return "action";
  if (MARKET_HINTS.some((h) => lower.includes(h))) return "market";
  return "record";
}

// One bead per message, projected onto the given axes by keyword presence.
// Returns [] when nothing meaningful is detected (compass stays in listening).
export function extractBeadsHeuristic(
  text: string,
  axes: Axis[],
  now: string,
  idSeed: string,
): Bead[] {
  const trimmed = text.trim();
  if (trimmed.length < 2) return [];
  const lower = trimmed.toLowerCase();

  const direction = axes.map((axis) => {
    const h = HINTS[axis.id];
    if (!h) return 0;
    const pos = h.pos.filter((w) => lower.includes(w.toLowerCase())).length;
    const neg = h.neg.filter((w) => lower.includes(w.toLowerCase())).length;
    if (pos === 0 && neg === 0) return 0;
    return clamp((pos - neg) / Math.max(1, pos + neg), -1, 1);
  });

  const source = detectSource(lower);
  const hasSignal = direction.some((c) => c !== 0) || source !== "record";
  if (!hasSignal) return [];

  const weight = source === "action" ? 8 : source === "market" ? 8 : 6;
  return [
    {
      id: `bead-${idSeed}-0`,
      source,
      what: trimmed.length > 80 ? `${trimmed.slice(0, 80)}…` : trimmed,
      why: "키워드 기반 추정(폴백) — LLM 키가 있으면 더 정확해집니다.",
      direction,
      intensity: 0.7,
      confidence: 0.6,
      weight,
      createdAt: now,
    },
  ];
}
