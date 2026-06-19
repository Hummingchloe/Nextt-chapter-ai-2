import test from "node:test";
import assert from "node:assert/strict";

import { deriveReadOnlyJourney } from "../lib/compass-roadmap";
import { seedCompass } from "../lib/compass-seed";

test("read-only roadmap keeps the first report, at most two completed actions, current action, one lock, and current essence", () => {
  const state = seedCompass("2026-06-19T00:00:00.000Z");
  state.doneActions = [
    { id: "old", title: "오래된 행동", kind: "probe", completedAt: "2026-06-16T00:00:00.000Z" },
    { id: "middle", title: "두 번째 행동", kind: "probe", completedAt: "2026-06-17T00:00:00.000Z" },
    { id: "new", title: "최근 행동", kind: "reinforce", completedAt: "2026-06-18T00:00:00.000Z" },
  ];

  const journey = deriveReadOnlyJourney(
    state,
    {
      sessionId: "report-1",
      label: "AI 경험 연결",
      createdAt: "2026-06-15T00:00:00.000Z",
    },
    "2026-06-19T00:00:00.000Z",
  );

  assert.equal(journey.nodes.filter((node) => node.kind === "milestone").length, 1);
  assert.equal(journey.nodes.filter((node) => node.kind === "step").length, 2);
  assert.equal(journey.nodes.filter((node) => node.kind === "current").length, 1);
  assert.equal(journey.nodes.filter((node) => node.kind === "locked").length, 1);
  assert.equal(journey.nodes.at(-1)?.kind, "destination");
  assert.equal(journey.nodes.at(-1)?.sublabel, state.compass.essence);
  assert.equal(journey.nodes[0].href, "/result/report-1");
});
