import test from "node:test";
import assert from "node:assert/strict";

import {
  addBeads,
  axisUncertainty,
  cosine,
  createEmptyCompass,
  effectiveWeight,
  mostUncertainAxis,
  readyForOffer,
  setAxes,
  simulate,
  type Axis,
  type Bead,
} from "../lib/compass-engine.ts";

// Three learned axes (the engine is axis-agnostic; these are just labels).
const AXES: Axis[] = [
  { id: "delivery", name: "전달 방식", posPole: "1:N 규모", negPole: "1:1 깊은 도움" },
  { id: "asset", name: "자산 원천", posPole: "새 AI/도구", negPole: "쌓아온 전문성" },
  { id: "market", name: "시장 접근", posPole: "새 시장 개척", negPole: "기존 관계" },
];

let SEQ = 0;
function bead(direction: number[], opts: Partial<Bead> = {}): Bead {
  SEQ += 1;
  return {
    id: opts.id ?? `b${SEQ}`,
    source: opts.source ?? "record",
    what: opts.what ?? "test",
    why: opts.why ?? "test",
    direction,
    intensity: opts.intensity ?? 0.8,
    confidence: opts.confidence ?? 0.8,
    weight: opts.weight ?? 7,
    createdAt: opts.createdAt ?? "2026-06-18T00:00:00.000Z",
    status: opts.status,
    tags: opts.tags,
  };
}

const NOW = "2026-06-18T00:00:00.000Z";

test("empty compass starts in listening with zero alignment and evidence", () => {
  const s = createEmptyCompass(NOW, AXES);
  assert.equal(s.status, "listening");
  assert.equal(s.alignment, 0);
  assert.equal(s.evidence, 0);
  assert.equal(s.compass.perAxis.length, AXES.length);
});

test("coherent beads yield high magnetization; dispersed beads yield low", () => {
  const coherent = addBeads(
    createEmptyCompass(NOW, AXES),
    [bead([0.9, 0.2, -0.8]), bead([0.8, 0.3, -0.7]), bead([0.85, 0.25, -0.75])],
    NOW,
  );
  const dispersed = addBeads(
    createEmptyCompass(NOW, AXES),
    [bead([0.9, 0, 0]), bead([-0.9, 0, 0]), bead([0, 0.9, 0]), bead([0, -0.9, 0])],
    NOW,
  );
  assert.ok(coherent.alignment > 0.9, `coherent M=${coherent.alignment}`);
  assert.ok(dispersed.alignment < 0.2, `dispersed M=${dispersed.alignment}`);
});

test("H direction points toward the dominant bead direction", () => {
  const s = addBeads(
    createEmptyCompass(NOW, AXES),
    [bead([0.9, 0.2, -0.8]), bead([0.8, 0.1, -0.9])],
    NOW,
  );
  // cosine of derived H with the input direction should be near 1.
  assert.ok(cosine(s.compass.dir, [0.85, 0.15, -0.85]) > 0.98);
});

test("time decay: a stale bead contributes less effective mass than a fresh one", () => {
  const fresh = bead([1, 0, 0], { createdAt: NOW });
  const stale = bead([1, 0, 0], { createdAt: "2026-01-18T00:00:00.000Z" }); // ~5 months
  assert.ok(effectiveWeight(stale, NOW) < effectiveWeight(fresh, NOW) * 0.85);
});

test("confidence gate: a sub-0.3 confidence bead is treated as noise (zero mass)", () => {
  const noise = bead([1, 0, 0], { confidence: 0.2 });
  assert.equal(effectiveWeight(noise, NOW), 0);
  const s = addBeads(createEmptyCompass(NOW, AXES), [noise], NOW);
  assert.equal(s.evidence, 0);
  assert.equal(s.status, "listening");
});

test("confidence rises and status advances as coherent evidence accumulates", () => {
  let s = createEmptyCompass(NOW, AXES);
  const c0 = s.compass.confidence;
  s = addBeads(s, [bead([0.9, 0.2, -0.8]), bead([0.85, 0.25, -0.75])], NOW);
  const c1 = s.compass.confidence;
  s = addBeads(
    s,
    [bead([0.88, 0.22, -0.78], { weight: 9 }), bead([0.9, 0.2, -0.8], { weight: 9 })],
    NOW,
  );
  const c2 = s.compass.confidence;
  assert.ok(c1 > c0 && c2 > c1, `confidence should rise: ${c0} -> ${c1} -> ${c2}`);
  assert.notEqual(s.status, "listening");
});

test("ΔM simulation: aligned candidate raises M, conflicting candidate lowers it", () => {
  const s = addBeads(
    createEmptyCompass(NOW, AXES),
    [bead([0.9, 0.2, -0.8]), bead([0.85, 0.25, -0.75])],
    NOW,
  );
  const aligned = simulate(s, bead([0.9, 0.2, -0.8]), NOW);
  const conflicting = simulate(s, bead([-0.9, -0.2, 0.8]), NOW);
  assert.ok(aligned.delta > 0, `aligned delta=${aligned.delta}`);
  assert.ok(conflicting.delta < 0, `conflicting delta=${conflicting.delta}`);
});

test("learned axes: engine works with an arbitrary number of dimensions", () => {
  const fourAxes: Axis[] = [
    ...AXES,
    { id: "risk", name: "리스크", posPole: "크게 투자", negPole: "작게 검증" },
  ];
  const s = addBeads(
    createEmptyCompass(NOW, fourAxes),
    [bead([0.8, 0.2, -0.7, -0.6]), bead([0.7, 0.3, -0.8, -0.5])],
    NOW,
  );
  assert.equal(s.compass.dir.length, 4);
  assert.equal(s.compass.perAxis.length, 4);
  assert.ok(s.alignment > 0.9);
});

test("axis-count mismatch is conformed (legacy bead padded/truncated, no crash)", () => {
  const s = addBeads(
    createEmptyCompass(NOW, AXES),
    [bead([0.9]), bead([0.8, 0.2, -0.7, 0.9, 0.9])],
    NOW,
  );
  assert.equal(s.compass.dir.length, 3);
  assert.ok(Number.isFinite(s.alignment));
});

test("mostUncertainAxis points at the dimension with least polarized evidence", () => {
  // Strong, consistent signal on axes 0 and 2; axis 1 left untouched.
  const s = addBeads(
    createEmptyCompass(NOW, AXES),
    [bead([0.95, 0, -0.95], { weight: 10 }), bead([0.95, 0, -0.95], { weight: 10 })],
    NOW,
  );
  assert.equal(mostUncertainAxis(s), 1);
  // The untouched axis keeps the flat prior → maximal Beta variance.
  assert.ok(axisUncertainty(s.compass.perAxis[1]) > axisUncertainty(s.compass.perAxis[0]));
});

test("offer gate stays closed until coherent evidence crosses the threshold", () => {
  let s = createEmptyCompass(NOW, AXES);
  assert.equal(readyForOffer(s), false);
  s = addBeads(s, [bead([0.9, 0.2, -0.8], { weight: 3, intensity: 0.5 })], NOW);
  assert.equal(readyForOffer(s), false); // not enough mass yet
  s = addBeads(
    s,
    [
      bead([0.9, 0.2, -0.8], { weight: 9 }),
      bead([0.88, 0.22, -0.78], { weight: 9 }),
      bead([0.9, 0.18, -0.82], { weight: 9, source: "action" }),
    ],
    NOW,
  );
  assert.equal(readyForOffer(s), true);
  assert.ok(["confirming", "executing"].includes(s.status));
});

test("setAxes swaps the space and recomputes from reprojected beads", () => {
  const start = addBeads(createEmptyCompass(NOW, AXES), [bead([0.9, 0.2, -0.8])], NOW);
  const newAxes: Axis[] = [
    { id: "tempo", name: "속도", posPole: "빠르게", negPole: "깊게" },
    { id: "scope", name: "범위", posPole: "넓게", negPole: "좁게" },
  ];
  const reprojected: Bead[] = start.beads.map((b) => ({ ...b, direction: [0.8, -0.6] }));
  const s = setAxes(start, newAxes, reprojected, NOW);
  assert.equal(s.axes.length, 2);
  assert.equal(s.compass.dir.length, 2);
  assert.ok(s.alignment > 0.9);
});
