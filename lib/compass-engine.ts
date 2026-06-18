// ─────────────────────────────────────────────────────────────
// Compass Engine — learned-axis vector model for the local-first product.
//
// This is the NEW core engine. It is intentionally separate from the older
// `identity-compass-engine.ts` (which is bolted to the legacy diagnostic/
// Postgres flow and hardcodes a fixed [autonomy, depth, innovation] axis space).
//
// Design decisions locked in conversation:
//   • Axes are LEARNED, not hardcoded → the space is N-dimensional. Beads carry
//     a `direction: number[]` whose length matches the current axis list. The
//     LLM induces axes + projects text into this space; this module never calls
//     an LLM and never touches storage.
//   • Pure + deterministic + side-effect free → fully unit-testable and runs
//     identically in the browser (IndexedDB source of truth) or a stateless
//     Vercel function. No Date.now()/Math.random(): callers pass `now`/ids.
//   • The "math half" of the engine: cosine magnetization (M), Bayesian Beta
//     posteriors per axis, time decay, and ΔM decision simulation.
//
// Faithful to ico1036/identity-compass references/bayesian-update.md and
// scripts/calculate_magnetization.py, adapted to a dynamic axis space.
// ─────────────────────────────────────────────────────────────

export interface Axis {
  id: string;
  name: string; // human-readable, LLM-induced (e.g. "전달 방식")
  posPole: string; // what direction +1 means (e.g. "1:N 규모")
  negPole: string; // what direction -1 means (e.g. "1:1 깊은 도움")
}

export type BeadSource = "record" | "market" | "action";

export interface Bead {
  id: string;
  source: BeadSource;
  what: string; // short description of the decision/signal
  why: string; // essence (LLM's read of the underlying reason)
  direction: number[]; // length === axes.length, each component in [-1, 1]
  intensity: number; // 0..1 reaction strength
  confidence: number; // 0..1 extraction confidence
  weight: number; // 1..10 importance
  createdAt: string; // ISO timestamp
  status?: string;
  tags?: string[];
}

export interface AxisPosterior {
  alpha: number; // evidence toward + pole
  beta: number; // evidence toward - pole
}

export interface WorkCompass {
  dir: number[]; // unit vector: the magnetization (H) direction
  magnitude: number; // 0..1 coherence of H itself (how polarized the posteriors are)
  confidence: number; // 0..1 evidence-based confidence
  oneLiner: string; // deterministic templated fallback (recomputed each time)
  essence?: string; // LLM/seed-written compression; persists across recompute
  perAxis: AxisPosterior[]; // Bayesian uncertainty model, one per axis
}

export type CompassStatus = "listening" | "narrowing" | "confirming" | "executing";

export interface CompletedAction {
  id: string;
  title: string;
  kind: "probe" | "reinforce";
  completedAt: string;
}

export interface CompassState {
  version: 2;
  createdAt: string;
  updatedAt: string;
  axes: Axis[];
  beads: Bead[];
  compass: WorkCompass;
  alignment: number; // raw M, 0..1 (1 = beads fully coherent, 0 = fully dispersed)
  displayAlignment: number; // M shrunk toward 0 when evidence is thin (honest headline %)
  evidence: number; // total effective evidence mass (decayed, confidence-weighted)
  status: CompassStatus;
  doneActions: CompletedAction[]; // actions the user has marked complete
}

export interface SimulationResult {
  before: number;
  after: number;
  delta: number;
}

// Tunables ----------------------------------------------------------------
const DECAY_PER_MONTH = 0.95; // monthly decay factor (≈ bayesian-update.md)
const DAYS_PER_DECAY_STEP = 30;
const PRIOR = 1; // Beta(1,1) uniform prior per axis pole
const EVIDENCE_SATURATION = 18; // effective mass at which evidence term saturates
const READY_M = 0.5; // coherence gate for offering recommendations
const NARROW_M = 0.45;
const EXECUTE_M = 0.7;
const MIN_EVIDENCE = 3; // below this we stay in "listening"
const SHRINK_K = 6; // evidence half-saturation for the displayed (honest) alignment

// Vector helpers ----------------------------------------------------------
export function clamp(x: number, lo = 0, hi = 1): number {
  return Math.max(lo, Math.min(hi, x));
}

function norm(v: number[]): number {
  return Math.sqrt(v.reduce((s, x) => s + x * x, 0));
}

function normalize(v: number[]): number[] {
  const l = norm(v);
  return l ? v.map((x) => x / l) : v.map(() => 0);
}

export function cosine(a: number[], b: number[]): number {
  const n = Math.min(a.length, b.length);
  let dot = 0;
  let la = 0;
  let lb = 0;
  for (let i = 0; i < n; i++) {
    dot += a[i] * b[i];
    la += a[i] * a[i];
    lb += b[i] * b[i];
  }
  const d = Math.sqrt(la) * Math.sqrt(lb);
  return d ? dot / d : 0;
}

// Coerce a direction to the current axis count: truncate extras, pad with 0.
// Used when beads predate an axis re-induction and haven't been reprojected yet.
function conform(direction: number[], dims: number): number[] {
  if (direction.length === dims) return direction;
  const out = new Array(dims).fill(0);
  for (let i = 0; i < Math.min(dims, direction.length); i++) out[i] = direction[i];
  return out;
}

// Confidence gate (bayesian-update.md): noise below 0.3 is ignored, mid is
// half-weighted, strong is full-weighted.
function confidenceWeight(confidence: number): number {
  if (confidence < 0.3) return 0;
  if (confidence < 0.7) return 0.5;
  return 1;
}

function daysBetween(fromISO: string, toISO: string): number {
  const from = Date.parse(fromISO);
  const to = Date.parse(toISO);
  if (!Number.isFinite(from) || !Number.isFinite(to)) return 0;
  return Math.max(0, (to - from) / (1000 * 60 * 60 * 24));
}

function decayFactor(createdAt: string, now: string): number {
  const days = daysBetween(createdAt, now);
  return Math.pow(DECAY_PER_MONTH, days / DAYS_PER_DECAY_STEP);
}

// The effective mass a bead contributes: importance × reaction × confidence-gate
// × time-decay. A stale, low-confidence bead barely moves the compass.
export function effectiveWeight(bead: Bead, now: string): number {
  return (
    bead.weight *
    bead.intensity *
    confidenceWeight(bead.confidence) *
    decayFactor(bead.createdAt, now)
  );
}

// Bayesian Beta posteriors, one per axis. Each bead nudges α (toward +pole) or
// β (toward -pole) per axis, scaled by |component| and the bead's effective mass.
function computePosteriors(dims: number, beads: Bead[], now: string): AxisPosterior[] {
  const post: AxisPosterior[] = Array.from({ length: dims }, () => ({
    alpha: PRIOR,
    beta: PRIOR,
  }));
  for (const bead of beads) {
    const dir = conform(bead.direction, dims);
    const mass = effectiveWeight(bead, now);
    if (mass <= 0) continue;
    for (let i = 0; i < dims; i++) {
      const c = dir[i];
      const amount = mass * Math.abs(c);
      if (c > 0) post[i].alpha += amount;
      else if (c < 0) post[i].beta += amount;
    }
  }
  return post;
}

// Variance of Beta(α,β): higher = the axis is still uncertain → probing it
// (via an action) yields the most information.
export function axisUncertainty(p: AxisPosterior): number {
  const a = p.alpha;
  const b = p.beta;
  const s = a + b;
  return (a * b) / (s * s * (s + 1));
}

// Index of the axis we know least about. Useful for "which experiment next".
export function mostUncertainAxis(state: CompassState): number {
  if (!state.compass.perAxis.length) return -1;
  let best = 0;
  let bestVar = -1;
  state.compass.perAxis.forEach((p, i) => {
    const v = axisUncertainty(p);
    if (v > bestVar) {
      bestVar = v;
      best = i;
    }
  });
  return best;
}

// Magnetization magnitude (calculate_magnetization.py, weighted): the resultant
// length of the weighted unit directions over total mass. 1 = all beads point
// the same way (coherent), 0 = they cancel out (dispersed). Returns the
// resultant direction too so H and M come from one pass.
function magnetization(
  dims: number,
  beads: Bead[],
  now: string,
): { dir: number[]; m: number; mass: number } {
  const resultant = new Array(dims).fill(0);
  let totalMass = 0;
  for (const bead of beads) {
    const mass = effectiveWeight(bead, now);
    if (mass <= 0) continue;
    const unit = normalize(conform(bead.direction, dims));
    for (let i = 0; i < dims; i++) resultant[i] += unit[i] * mass;
    totalMass += mass;
  }
  const m = totalMass ? norm(resultant) / totalMass : 0;
  return { dir: normalize(resultant), m: clamp(m), mass: totalMass };
}

function posteriorMagnitude(perAxis: AxisPosterior[]): number {
  if (!perAxis.length) return 0;
  // mean direction per axis = (α-β)/(α+β) ∈ [-1,1]; magnitude normalized by √dims.
  const means = perAxis.map((p) => (p.alpha - p.beta) / (p.alpha + p.beta));
  return clamp(norm(means) / Math.sqrt(perAxis.length));
}

function deriveConfidence(mass: number, perAxis: AxisPosterior[]): number {
  const evidenceTerm = clamp(mass / EVIDENCE_SATURATION); // grows with data, saturates
  const sharpness = posteriorMagnitude(perAxis); // grows as axes polarize
  return clamp(0.1 + evidenceTerm * 0.55 + sharpness * 0.35);
}

function deriveStatus(m: number, mass: number, confidence: number): CompassStatus {
  if (mass < MIN_EVIDENCE) return "listening";
  if (m < NARROW_M) return "narrowing";
  if (m < EXECUTE_M || confidence < 0.6) return "confirming";
  return "executing";
}

function fallbackOneLiner(
  axes: Axis[],
  dir: number[],
  status: CompassStatus,
): string {
  if (status === "listening" || !axes.length) {
    return "아직 방향을 판단하기엔 기록이 부족해요. 조금 더 들어볼게요.";
  }
  // Name the two strongest axes by |component| and the pole each points to.
  const ranked = dir
    .map((c, i) => ({ i, c, mag: Math.abs(c) }))
    .filter((x) => x.mag > 0.15 && axes[x.i])
    .sort((a, b) => b.mag - a.mag)
    .slice(0, 2);
  if (!ranked.length) {
    return "여러 방향이 섞여 있어요. 한 축으로 좁혀가는 중이에요.";
  }
  const phrase = ranked
    .map(({ i, c }) => (c > 0 ? axes[i].posPole : axes[i].negPole))
    .join(" · ");
  const tail =
    status === "executing"
      ? "쪽으로 방향이 또렷해졌어요."
      : "쪽으로 기울고 있어요. 조금 더 또렷해질 수 있어요.";
  return `${phrase} ${tail}`;
}

// Core recompute: derive H, M, evidence, confidence, status from the beads.
export function recompute(state: CompassState, now: string): CompassState {
  const dims = state.axes.length;
  const perAxis = computePosteriors(dims, state.beads, now);
  const { dir, m, mass } = magnetization(dims, state.beads, now);
  const confidence = deriveConfidence(mass, perAxis);
  const status = deriveStatus(m, mass, confidence);
  const compass: WorkCompass = {
    dir,
    magnitude: posteriorMagnitude(perAxis),
    confidence,
    oneLiner: fallbackOneLiner(state.axes, dir, status),
    essence: state.compass?.essence, // preserve the LLM/seed sentence across recompute
    perAxis,
  };
  return {
    ...state,
    updatedAt: now,
    compass,
    alignment: m,
    displayAlignment: m * (mass / (mass + SHRINK_K)),
    evidence: mass,
    status,
    doneActions: state.doneActions ?? [],
  };
}

export function createEmptyCompass(now: string, axes: Axis[] = []): CompassState {
  const base: CompassState = {
    version: 2,
    createdAt: now,
    updatedAt: now,
    axes,
    beads: [],
    compass: {
      dir: new Array(axes.length).fill(0),
      magnitude: 0,
      confidence: 0,
      oneLiner: "아직 방향을 판단하기엔 기록이 부족해요. 조금 더 들어볼게요.",
      perAxis: axes.map(() => ({ alpha: PRIOR, beta: PRIOR })),
    },
    alignment: 0,
    displayAlignment: 0,
    evidence: 0,
    status: "listening",
    doneActions: [],
  };
  return base;
}

// Add freshly-extracted beads and recompute. Beads with the same id replace
// older ones (so re-extraction of the same record updates in place).
export function addBeads(state: CompassState, incoming: Bead[], now: string): CompassState {
  const byId = new Map(state.beads.map((b) => [b.id, b]));
  for (const bead of incoming) {
    byId.set(bead.id, { ...bead, direction: conform(bead.direction, state.axes.length) });
  }
  return recompute({ ...state, beads: Array.from(byId.values()) }, now);
}

// Replace the axis space (after LLM re-induction) and reproject beads. The
// caller supplies the reprojected beads (LLM output); we just swap + recompute.
export function setAxes(
  state: CompassState,
  axes: Axis[],
  reprojected: Bead[],
  now: string,
): CompassState {
  return recompute({ ...state, axes, beads: reprojected }, now);
}

// Decision simulation (Phase 3): what does adding this candidate bead do to the
// coherence M? Aligned candidate → M rises (delta > 0); conflicting → M falls.
export function simulate(state: CompassState, candidate: Bead, now: string): SimulationResult {
  const before = state.alignment;
  const after = magnetization(
    state.axes.length,
    [...state.beads, { ...candidate, direction: conform(candidate.direction, state.axes.length) }],
    now,
  ).m;
  return { before, after, delta: after - before };
}

export function readyForOffer(state: CompassState): boolean {
  return state.evidence >= MIN_EVIDENCE && state.alignment >= READY_M;
}
