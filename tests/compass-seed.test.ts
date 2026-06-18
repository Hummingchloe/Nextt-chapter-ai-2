import test from "node:test";
import assert from "node:assert/strict";

import { addBeads, readyForOffer, recompute } from "../lib/compass-engine.ts";
import { seedCompass } from "../lib/compass-seed.ts";
import { deriveContent } from "../lib/compass-content.ts";
import { activeActions, completeAction } from "../lib/compass-actions.ts";

const NOW = "2026-06-18T12:00:00.000Z";

test("seed builds a real, coherent compass (engine-computed, not faked)", () => {
  const s = seedCompass(NOW);
  assert.equal(s.beads.length, 7);
  assert.equal(s.axes.length, 3);
  assert.ok(s.alignment > 0.85, `coherent seed M=${s.alignment}`);
  assert.ok(readyForOffer(s), "seed should be offer-ready");
  assert.ok(["confirming", "executing"].includes(s.status));
  // Direction matches the persona: 1:N(+) / 전문성(-) / 입문자(+).
  assert.ok(s.compass.dir[0] > 0 && s.compass.dir[1] < 0 && s.compass.dir[2] > 0);
  // The rich essence (LLM/seed sentence) persists separately from the template.
  assert.ok((s.compass.essence ?? "").includes("교육"));
});

test("essence survives recompute and addBeads (not clobbered by the template)", () => {
  const s = seedCompass(NOW);
  const essence = s.compass.essence;
  assert.ok(essence);
  // recompute (what loadCompassState does on every dashboard load) must keep it.
  assert.equal(recompute(s, NOW).compass.essence, essence);
  // adding a new bead recomputes the template one-liner but keeps the essence.
  const grown = addBeads(s, [
    { id: "x", source: "record", what: "y", why: "", direction: [0.8, -0.3, 0.6], intensity: 0.8, confidence: 0.8, weight: 7, createdAt: NOW },
  ], NOW);
  assert.equal(grown.compass.essence, essence);
});

test("dashboard reads the seed → content + actions appear", () => {
  const s = seedCompass(NOW);
  const content = deriveContent(s);
  assert.equal(content.length, 3);
  assert.ok(content.every((c) => c.url.startsWith("https://www.youtube.com/results?")));
  // Theme is driven by bead tags (AI/교육/...), not a fixed template.
  assert.ok(content[0].title.includes("AI") || content[0].title.includes("교육"));
  assert.ok(activeActions(s, NOW).length >= 1);
});

test("completing an action marks it done, hides it, and moves the needle", () => {
  const s = seedCompass(NOW);
  const before = s.displayAlignment;
  const action = activeActions(s, NOW)[0];
  assert.ok(action, "an action should be offered");

  const after = completeAction(s, action, NOW, "t1");
  assert.equal(after.doneActions.length, 1);
  assert.equal(after.doneActions[0].id, action.id);
  assert.ok(after.beads.some((b) => b.source === "action" && b.id.startsWith("done-")));
  // The completed action is no longer offered as active.
  assert.ok(!activeActions(after, NOW).some((a) => a.id === action.id));
  // The needle moved (reinforcing/probing changes the displayed alignment or evidence).
  assert.notEqual(after.displayAlignment, before);
});
