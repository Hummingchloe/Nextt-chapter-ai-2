// ─────────────────────────────────────────────────────────────
// Content layer (Layer 3). Turns the compass into recommended YouTube content,
// driven by the LEARNED direction — the strongest axis poles + bead themes —
// not a fixed template. Pure + deterministic; the LLM/web-search can later
// replace the search URLs with real videos.
// ─────────────────────────────────────────────────────────────

import { readyForOffer, type CompassState } from "./compass-engine";

export interface ContentLink {
  id: string;
  title: string;
  url: string;
  why: string;
}

function youtube(query: string): string {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
}

// Build a theme phrase from bead tags (most frequent first), falling back to the
// dominant axis pole labels, then a generic phrase.
export function contentTheme(state: CompassState): string {
  const counts = new Map<string, number>();
  for (const b of state.beads) {
    for (const tag of b.tags ?? []) {
      const t = tag.trim();
      if (t) counts.set(t, (counts.get(t) ?? 0) + 1);
    }
  }
  const topTags = [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([t]) => t);
  if (topTags.length) return topTags.join(" ");

  // Fallback: strongest axis poles by |H component|.
  const poles = state.compass.dir
    .map((c, i) => ({ c, mag: Math.abs(c), axis: state.axes[i] }))
    .filter((x) => x.axis && x.mag > 0.2)
    .sort((a, b) => b.mag - a.mag)
    .slice(0, 2)
    .map((x) => (x.c > 0 ? x.axis.posPole : x.axis.negPole));
  return poles.length ? poles.join(" ") : "1인 비즈니스 검증";
}

export function deriveContent(state: CompassState): ContentLink[] {
  if (!readyForOffer(state)) return [];
  const q = contentTheme(state);
  return [
    {
      id: "offer",
      title: `${q} — 첫 오퍼 만들기`,
      url: youtube(`${q} 첫 오퍼 만들기`),
      why: "방향이 생긴 뒤에는 긴 공부보다 첫 제안 문장이 먼저예요.",
    },
    {
      id: "customer",
      title: `${q} — 고객·수요 검증`,
      url: youtube(`${q} 고객 인터뷰 수요 검증`),
      why: "시장 반응은 추측보다 실제 대화에서 가장 빨리 쌓입니다.",
    },
    {
      id: "build",
      title: `${q} — 1인 창업 실행`,
      url: youtube(`${q} 1인 창업 실행 사례`),
      why: "큰 창업보다 작은 검증과 반복 행동에 맞춘 콘텐츠가 필요해요.",
    },
  ];
}
