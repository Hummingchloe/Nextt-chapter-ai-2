// ─────────────────────────────────────────────────────────────
// Action layer (Layer 2). Pure logic that turns a CompassState into next
// actions, each carrying a CANDIDATE bead + its expected ΔM. Completing an
// action just registers its candidate as a real (source:"action") bead, which
// moves the compass — the whole point.
//
// Two kinds of action:
//   • probe     → targets the most uncertain axis (max information gain)
//   • reinforce → points along current H (commit to the emerging direction)
//
// Isomorphic + deterministic. No LLM, no storage. The LLM may later rewrite the
// human-facing `title`, but direction/ΔM stay computed here.
// ─────────────────────────────────────────────────────────────

import {
  addBeads,
  mostUncertainAxis,
  readyForOffer,
  simulate,
  type Bead,
  type CompassState,
} from "./compass-engine";

export interface CompassAction {
  id: string;
  kind: "probe" | "reinforce";
  title: string;
  detail: string;
  axisId?: string;
  candidate: Bead; // the virtual bead this action would add
  expectedDelta: number; // ΔM if completed
}

const COMPLETION_HINTS = [
  "완료",
  "해결",
  "끝냈",
  "했어",
  "했어요",
  "했습니다",
  "보냈",
  "작성했",
  "만들었",
  "실행",
];

const FIRST_ACTION_HINTS = [
  "액션아이템1",
  "액션 아이템 1",
  "액션 1",
  "1번",
  "첫번째",
  "첫 번째",
  "첫 액션",
  "하나",
  "1개",
];

function candidate(
  id: string,
  source: Bead["source"],
  what: string,
  direction: number[],
  now: string,
): Bead {
  return {
    id,
    source,
    what,
    why: "액션 후보(가상 구슬)",
    direction,
    intensity: 0.8,
    confidence: 0.85,
    weight: 8,
    createdAt: now,
  };
}

function unit(axisIndex: number, dims: number, value: number): number[] {
  const v = new Array(dims).fill(0);
  if (axisIndex >= 0 && axisIndex < dims) v[axisIndex] = value;
  return v;
}

export function deriveActions(state: CompassState, now: string): CompassAction[] {
  const dims = state.axes.length;
  if (!dims) return [];
  const out: CompassAction[] = [];

  // 1) Probe the least-certain axis — the experiment that sharpens fastest.
  const probeIdx = mostUncertainAxis(state);
  const probeAxis = state.axes[probeIdx];
  if (probeAxis) {
    const dir = unit(probeIdx, dims, 1);
    const cand = candidate(`act-probe-${probeAxis.id}`, "action", `${probeAxis.name} 검증`, dir, now);
    out.push({
      id: `probe-${probeAxis.id}`,
      kind: "probe",
      title: `‘${probeAxis.name}’을(를) 작게 시험해보기`,
      detail: `${probeAxis.posPole} 쪽으로 한 번 움직여 보고, ${probeAxis.negPole}와 어느 쪽이 맞는지 반응을 보세요.`,
      axisId: probeAxis.id,
      candidate: cand,
      expectedDelta: simulate(state, cand, now).delta,
    });
  }

  // 2) Reinforce the current direction (only once there's a direction to commit to).
  if (state.compass.dir.some((c) => Math.abs(c) > 0.15)) {
    const cand = candidate("act-reinforce", "action", "현재 방향으로 한 걸음", state.compass.dir, now);
    out.push({
      id: "reinforce",
      kind: "reinforce",
      title: readyForOffer(state)
        ? "지금 방향으로 첫 오퍼 한 문장 보내기"
        : "지금 방향으로 가장 작은 한 걸음 실행하기",
      detail: state.compass.oneLiner,
      candidate: cand,
      expectedDelta: simulate(state, cand, now).delta,
    });
  }

  return out;
}

// Turn a completed action into a real bead the engine will absorb.
export function actionToBead(action: CompassAction, now: string, idSeed: string): Bead {
  return {
    ...action.candidate,
    id: `done-${action.id}-${idSeed}`,
    source: "action",
    what: action.title,
    why: "사용자가 실제로 완료한 행동",
    createdAt: now,
  };
}

// Active actions = freshly derived ones minus the ones already completed.
export function activeActions(state: CompassState, now: string): CompassAction[] {
  const done = new Set(state.doneActions.map((d) => d.id));
  return deriveActions(state, now).filter((a) => !done.has(a.id));
}

export function findCompletedActionFromText(
  text: string,
  actions: CompassAction[],
): CompassAction | null {
  const normalized = text.replace(/\s+/g, " ").trim().toLowerCase();
  if (!normalized || !COMPLETION_HINTS.some((hint) => normalized.includes(hint))) {
    return null;
  }

  const ranked = actions
    .map((action) => ({
      action,
      score: overlapScore(normalized, `${action.title} ${action.detail}`),
    }))
    .sort((a, b) => b.score - a.score);

  if (ranked[0]?.score > 0) return ranked[0].action;
  if (FIRST_ACTION_HINTS.some((hint) => normalized.includes(hint))) return actions[0] ?? null;
  return null;
}

// Complete an action: register its candidate as a real bead (moving the
// compass) AND record it as done so it stops being re-offered.
export function completeAction(
  state: CompassState,
  action: CompassAction,
  now: string,
  idSeed: string,
): CompassState {
  const moved = addBeads(state, [actionToBead(action, now, idSeed)], now);
  return {
    ...moved,
    doneActions: [
      ...moved.doneActions,
      { id: action.id, title: action.title, kind: action.kind, completedAt: now },
    ],
  };
}

function overlapScore(input: string, actionText: string): number {
  return actionText
    .replace(/[‘’"'(),.·]/g, " ")
    .split(/\s+/)
    .map((token) => token.trim().toLowerCase())
    .filter((token) => token.length >= 2)
    .reduce((score, token) => score + (input.includes(token) ? 1 : 0), 0);
}
