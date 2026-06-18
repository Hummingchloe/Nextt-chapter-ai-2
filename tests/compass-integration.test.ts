import test from "node:test";
import assert from "node:assert/strict";

import {
  addBeads,
  createEmptyCompass,
  readyForOffer,
  type Axis,
  type CompassState,
} from "../lib/compass-engine.ts";
import { extractBeadsHeuristic } from "../lib/compass-fallback.ts";
import { actionToBead, deriveActions } from "../lib/compass-actions.ts";

// Mirrors DEFAULT_AXES (kept inline so we don't import the server-only module).
const AXES: Axis[] = [
  { id: "delivery", name: "전달 방식", posPole: "1:N 규모", negPole: "1:1 깊은 도움" },
  { id: "asset", name: "자산 원천", posPole: "새 AI/도구", negPole: "쌓아온 전문성" },
  { id: "market", name: "시장 접근", posPole: "새 시장 개척", negPole: "기존 관계" },
];

const NOW = "2026-06-18T00:00:00.000Z";

// A coherent journey toward (1:1 / 전문성 / 기존 관계) — all negative poles.
const JOURNEY = [
  "지인이 내 상담 경험을 보고 1:1로 도와달라고 물어봤어요",
  "나는 오래 해온 전문 상담을 아는 사람들에게 직접 맞춤으로 해주는 게 맞아요",
  "어제 지인 한 명에게 1:1 상담 오퍼를 보냈어요",
  "친구 소개로 또 다른 분이 상담을 요청했어요",
];

// Replays exactly what the route does for the no-key path.
function ingest(state: CompassState, text: string, seed: string): CompassState {
  return addBeads(state, extractBeadsHeuristic(text, state.axes, NOW, seed), NOW);
}

test("full journey: thin evidence is honest, then alignment ramps and actions open", () => {
  let state = createEmptyCompass(NOW, AXES);
  const trail: { m: number; disp: number; status: string }[] = [];

  JOURNEY.forEach((text, i) => {
    state = ingest(state, text, `r${i}`);
    trail.push({ m: state.alignment, disp: state.displayAlignment, status: state.status });
    // displayed headline must never exceed raw coherence, and never go negative.
    assert.ok(state.displayAlignment <= state.alignment + 1e-9);
    assert.ok(state.displayAlignment >= 0);
  });

  // Round 1: a single coherent bead has trivially high raw M, but the honest
  // displayed alignment must be meaningfully lower (the bug we fixed).
  assert.ok(trail[0].m > 0.9, `raw M after 1 bead = ${trail[0].m}`);
  assert.ok(trail[0].disp < 0.6, `displayed after 1 bead = ${trail[0].disp} (should be tempered)`);
  assert.equal(trail[0].status, "listening");

  // Displayed alignment is monotonically non-decreasing across the coherent journey.
  for (let i = 1; i < trail.length; i++) {
    assert.ok(trail[i].disp >= trail[i - 1].disp - 1e-9, `disp dropped at round ${i}`);
  }

  // By the end: out of listening, offer-ready, actions available.
  assert.notEqual(state.status, "listening");
  assert.equal(readyForOffer(state), true);
  assert.ok(deriveActions(state, NOW).length >= 1);
});

test("completing an action registers a real bead and moves the needle", () => {
  let state = createEmptyCompass(NOW, AXES);
  JOURNEY.forEach((text, i) => (state = ingest(state, text, `r${i}`)));

  const before = state.displayAlignment;
  const beadsBefore = state.beads.length;
  const reinforce = deriveActions(state, NOW).find((a) => a.kind === "reinforce");
  assert.ok(reinforce, "a reinforce action should be offered once a direction exists");

  state = addBeads(state, [actionToBead(reinforce!, NOW, "done")], NOW);
  assert.equal(state.beads.length, beadsBefore + 1);
  assert.ok(state.beads.some((b) => b.source === "action" && b.id.startsWith("done-")));
  assert.ok(state.displayAlignment >= before - 1e-9); // reinforcing never lowers it
});

test("a conflicting later signal lowers coherence (compass can disagree with itself)", () => {
  let state = createEmptyCompass(NOW, AXES);
  JOURNEY.forEach((text, i) => (state = ingest(state, text, `r${i}`)));
  const coherent = state.alignment;

  // Now the user pivots hard the other way (1:N / AI / new market).
  state = ingest(state, "이제 AI 자동화로 콘텐츠 제품을 만들어 낯선 새 시장에 팔고 싶어요", "pivot");
  assert.ok(state.alignment < coherent, `M should drop after a pivot: ${coherent} -> ${state.alignment}`);
});
