import test from "node:test";
import assert from "node:assert/strict";

import { createEmptyOntology, updateOntologyFromInput } from "../lib/ontology.ts";
import { buildProposalDashboard } from "../lib/proposal.ts";

test("local-first ontology accumulates signals without requiring server persistence", () => {
  let ontology = createEmptyOntology(new Date("2026-06-18T00:00:00.000Z"));

  ontology = updateOntologyFromInput(
    ontology,
    "요즘 주변 사람들이 챗GPT로 안내문을 어떻게 만드는지 자주 물어봐요. 이걸 작은 서비스로 팔 수 있을지 궁금해요.",
    new Date("2026-06-18T01:00:00.000Z"),
  ).ontology;
  ontology = updateOntologyFromInput(
    ontology,
    "오늘은 지인 한 명에게 문제를 물어보기로 했고, 다음에는 오퍼 문장을 보여주고 반응을 보려고 해요.",
    new Date("2026-06-18T02:00:00.000Z"),
  ).ontology;

  assert.ok(ontology.signals.some((s) => s.id === "asset_ai"));
  assert.ok(ontology.signals.some((s) => s.kind === "market"));
  assert.ok(ontology.compass.alignment >= 50);

  const dashboard = buildProposalDashboard(ontology);
  assert.equal(dashboard.ready, true);
  assert.equal(dashboard.actions.length, 3);
  assert.ok(dashboard.youtubeLinks.every((l) => l.url.startsWith("https://www.youtube.com/results?")));
});

test("proposal engine gates recommendations until alignment is high enough", () => {
  const ontology = updateOntologyFromInput(
    createEmptyOntology(new Date("2026-06-18T00:00:00.000Z")),
    "막막하고 아직 잘 모르겠어요.",
    new Date("2026-06-18T01:00:00.000Z"),
  ).ontology;

  const dashboard = buildProposalDashboard(ontology);
  assert.equal(dashboard.ready, false);
  assert.equal(dashboard.actions.length, 0);
  assert.match(dashboard.gateMessage, /추천보다 질문/);
});
