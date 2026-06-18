import test from "node:test";
import assert from "node:assert/strict";

import { addBeads, createEmptyCompass, type Axis } from "../lib/compass-engine.ts";
import { extractBeadsHeuristic } from "../lib/compass-fallback.ts";
import {
  actionToBead,
  activeActions,
  completeAction,
  deriveActions,
  findCompletedActionFromText,
} from "../lib/compass-actions.ts";

const AXES: Axis[] = [
  { id: "delivery", name: "전달 방식", posPole: "1:N 규모", negPole: "1:1 깊은 도움" },
  { id: "asset", name: "자산 원천", posPole: "새 AI/도구", negPole: "쌓아온 전문성" },
  { id: "market", name: "시장 접근", posPole: "새 시장 개척", negPole: "기존 관계" },
];
const NOW = "2026-06-18T00:00:00.000Z";

test("fallback extractor projects keywords onto axes and detects source", () => {
  const beads = extractBeadsHeuristic(
    "지인이 챗GPT로 안내문 만드는 걸 1:1로 도와달라고 물어봤어요",
    AXES,
    NOW,
    "x",
  );
  assert.equal(beads.length, 1);
  const b = beads[0];
  assert.equal(b.source, "market"); // "물어"/"도와달"
  assert.ok(b.direction[0] < 0, "delivery → 1:1 (negative)"); // "1:1"
  assert.ok(b.direction[1] > 0, "asset → AI (positive)"); // "챗gpt"
  assert.ok(b.direction[2] < 0, "market → 기존 관계 (negative)"); // "지인"
});

test("fallback returns nothing for an empty/neutral message", () => {
  assert.equal(extractBeadsHeuristic("음...", AXES, NOW, "x").length, 0);
});

test("derived actions carry a candidate and a finite ΔM; probe targets an axis", () => {
  const state = addBeads(
    createEmptyCompass(NOW, AXES),
    [
      extractBeadsHeuristic("AI로 콘텐츠를 만들어서 많은 사람에게 팔고 싶어요", AXES, NOW, "a")[0],
      extractBeadsHeuristic("유튜브 클래스를 자동화로 올렸어요", AXES, NOW, "b")[0],
    ],
    NOW,
  );
  const actions = deriveActions(state, NOW);
  assert.ok(actions.length >= 1);
  assert.ok(actions.some((a) => a.kind === "probe" && a.axisId));
  assert.ok(actions.every((a) => Number.isFinite(a.expectedDelta)));
});

test("completing a reinforce action moves the compass (alignment changes)", () => {
  let state = addBeads(
    createEmptyCompass(NOW, AXES),
    [
      { id: "s1", source: "record", what: "x", why: "", direction: [0.8, 0.6, -0.7], intensity: 0.8, confidence: 0.8, weight: 7, createdAt: NOW },
      { id: "s2", source: "record", what: "y", why: "", direction: [0.7, 0.7, -0.6], intensity: 0.8, confidence: 0.8, weight: 7, createdAt: NOW },
    ],
    NOW,
  );
  const before = state.alignment;
  const reinforce = deriveActions(state, NOW).find((a) => a.kind === "reinforce");
  assert.ok(reinforce, "should offer a reinforce action");
  state = addBeads(state, [actionToBead(reinforce!, NOW, "done1")], NOW);
  assert.notEqual(state.alignment, before); // the needle actually moved
  assert.ok(state.beads.some((b) => b.source === "action"));
});

test("typed completion can resolve an active action and remove it from the next list", () => {
  let state = addBeads(
    createEmptyCompass(NOW, AXES),
    [
      { id: "s1", source: "record", what: "x", why: "", direction: [0.8, 0.6, -0.7], intensity: 0.8, confidence: 0.8, weight: 7, createdAt: NOW },
      { id: "s2", source: "record", what: "y", why: "", direction: [0.7, 0.7, -0.6], intensity: 0.8, confidence: 0.8, weight: 7, createdAt: NOW },
    ],
    NOW,
  );
  const before = activeActions(state, NOW);
  assert.ok(before.length > 0);

  const matched = findCompletedActionFromText("액션 아이템 1개 해결했어요", before);
  assert.equal(matched?.id, before[0].id);
  state = completeAction(state, matched!, NOW, "typed1", "보냈어요 · 반응 기다리는 중");

  assert.ok(state.doneActions.some((done) => done.id === before[0].id));
  assert.equal(state.doneActions.at(-1)?.note, "보냈어요 · 반응 기다리는 중");
  assert.ok(!activeActions(state, NOW).some((action) => action.id === before[0].id));
});
