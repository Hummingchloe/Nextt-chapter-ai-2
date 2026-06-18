// ─────────────────────────────────────────────────────────────
// Test seed: a pre-built, COHERENT bead set for the persona
//   "AI 관련 교육 창업 희망자 · 전직 AI 엔지니어".
//
// These are real beads run through the real engine (recompute) — not faked
// numbers. The compass, M, status, actions, and content all derive from them.
// Used by the "테스트 먹이기" button to demo the full loop.
// ─────────────────────────────────────────────────────────────

import { recompute, type Axis, type Bead, type CompassState } from "./compass-engine";

// Learned-style axes for this persona (3-dim).
//   axis0 전달 방식: +1 = 1:N 강의·콘텐츠      / -1 = 1:1 멘토링
//   axis1 자산 원천: +1 = 새로 배우는 도구       / -1 = 쌓아온 AI 엔지니어링 전문성
//   axis2 대상 시장: +1 = 비개발자 입문자         / -1 = 현업 개발자
const AXES: Axis[] = [
  { id: "delivery", name: "전달 방식", posPole: "1:N 강의·콘텐츠", negPole: "1:1 멘토링" },
  { id: "asset", name: "자산 원천", posPole: "새로 배우는 도구", negPole: "쌓아온 AI 엔지니어링 전문성" },
  { id: "market", name: "대상 시장", posPole: "비개발자 입문자", negPole: "현업 개발자" },
];

function bead(
  id: string,
  source: Bead["source"],
  what: string,
  why: string,
  direction: number[],
  weight: number,
  tags: string[],
  intensity = 0.78,
  confidence = 0.82,
): Bead {
  return {
    id,
    source,
    what,
    why,
    direction,
    intensity,
    confidence,
    weight,
    createdAt: "2026-06-18T00:00:00.000Z",
    tags,
  };
}

// All beads coherently point to (1:N 콘텐츠 / 엔지니어링 전문성 / 입문자) ≈ [+, -, +].
const BEADS: Bead[] = [
  bead("seed-1", "record", "AI를 쉽게 가르치는 온라인 강의를 만들고 싶다", "교육을 규모 있게 전달하려는 방향", [0.85, -0.4, 0.7], 8, ["AI", "교육", "강의"]),
  bead("seed-2", "record", "나는 전직 AI 엔지니어라 실무 깊이가 있다", "쌓아온 전문성을 자산으로", [0.2, -0.95, -0.25], 8, ["AI", "전문성"]),
  bead("seed-3", "market", "비개발자 친구들이 AI를 어떻게 배우냐고 자주 물어본다", "외부 수요 신호 — 입문자 시장", [0.5, -0.25, 0.95], 9, ["AI", "입문", "교육"]),
  bead("seed-4", "record", "1:1 과외보다 많은 사람에게 닿는 콘텐츠가 맞는 것 같다", "1:N 전달 선호", [0.95, -0.2, 0.4], 7, ["콘텐츠", "규모"]),
  bead("seed-5", "action", "유튜브에 AI 입문 영상 하나를 올렸다", "실제 행동 — 콘텐츠 발행", [0.9, -0.3, 0.75], 8, ["유튜브", "콘텐츠", "AI"]),
  bead("seed-6", "market", "지난주에 수강 문의가 두 건 들어왔다", "수요 검증 신호", [0.65, -0.2, 0.6], 8, ["수요", "교육"]),
  bead("seed-7", "record", "코딩 모르는 사람도 따라올 수 있게 눈높이를 낮추고 싶다", "입문자 대상 명확화", [0.6, -0.15, 0.95], 7, ["입문", "교육"]),
];

const ESSENCE =
  "쌓아온 AI 엔지니어링 깊이로, 코딩 모르는 사람도 따라오는 1:N 입문 교육을 만들려는 사람";

export function seedCompass(now: string): CompassState {
  const base: CompassState = {
    version: 2,
    createdAt: "2026-06-18T00:00:00.000Z",
    updatedAt: now,
    axes: AXES,
    beads: BEADS,
    compass: {
      dir: [],
      magnitude: 0,
      confidence: 0,
      oneLiner: "",
      perAxis: [],
    },
    alignment: 0,
    displayAlignment: 0,
    evidence: 0,
    status: "listening",
    doneActions: [],
  };
  const computed = recompute(base, now);
  // Override the templated one-liner with the demo essence (what the LLM would write).
  return { ...computed, compass: { ...computed.compass, oneLiner: ESSENCE } };
}
