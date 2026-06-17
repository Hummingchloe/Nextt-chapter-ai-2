// ─────────────────────────────────────────────────────────────
// Product-local Identity Compass Engine
// Adapted for My Next Chapter from https://github.com/ico1036/identity-compass
// without touching any existing local compass vaults/repos.
//
// Goal:
// - Context-first: questions are only one possible input source.
// - Extract decision/emotion/pattern unit signals from current answers + notes.
// - Compute evolving H direction, M alignment, confidence, one-liner.
// - Feed Offer Direction only when compass is stable enough.
//
// This is deterministic and side-effect free so existing product flows keep
// working and tests can lock behavior down.
// ─────────────────────────────────────────────────────────────

import type { DailyNote, DiagnosticSession, QuestionResponseMap } from "./types";

export type CompassSignalType = "decision" | "emotion" | "pattern";
export type CompassDomain = "work" | "offer" | "relationship" | "life" | "growth";

export type Vector3 = [number, number, number]; // [autonomy, depth, innovation]

export interface CompassSignal {
  id: string;
  type: CompassSignalType;
  domain: CompassDomain;
  what: string;
  whySurface: string;
  whyEssence: string;
  direction: Vector3;
  intensity: number; // 0..1
  confidence: number; // 0..1
  weight: number; // 1..10
  source: "diagnostic" | "daily_note" | "imported_context";
  timestamp?: string;
}

export interface CompassH {
  direction: Vector3;
  magnitude: number;
  confidence: number;
  oneLiner: string;
  coreValues: string[];
  antiValues: string[];
}

export interface OfferDirection {
  readiness: "not_ready" | "explore" | "recommend";
  confidence: number;
  targetHypothesis: string;
  blocker: string;
  promise: string;
  nextQuestion?: string;
  rationale: string;
}

export interface CompassAnalysis {
  signals: CompassSignal[];
  h: CompassH;
  alignment: number; // M, 0..1 for UI friendliness
  clarity: number; // 0..95
  blockers: string[];
  timeline: string[];
  adaptiveQuestions: string[];
  offer: OfferDirection;
}

const ZERO: Vector3 = [0, 0, 0];

function clamp(x: number, lo = 0, hi = 1): number {
  return Math.max(lo, Math.min(hi, x));
}

function len(v: Vector3): number {
  return Math.sqrt(v.reduce((s, x) => s + x * x, 0));
}

function normalize(v: Vector3): Vector3 {
  const l = len(v);
  if (!l) return ZERO;
  return [v[0] / l, v[1] / l, v[2] / l];
}

function dot(a: Vector3, b: Vector3): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

function cos(a: Vector3, b: Vector3): number {
  const d = len(a) * len(b);
  return d ? dot(a, b) / d : 0;
}

function add(a: Vector3, b: Vector3): Vector3 {
  return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
}

function scale(v: Vector3, k: number): Vector3 {
  return [v[0] * k, v[1] * k, v[2] * k];
}

function clean(s?: string): string {
  return (s ?? "").trim().replace(/\s+/g, " ");
}

function clip(s?: string, n = 34): string {
  const t = clean(s);
  return t.length <= n ? t : `${t.slice(0, n).trim()}…`;
}

function has(text: string, words: string[]): boolean {
  const t = text.toLowerCase();
  return words.some((w) => t.includes(w.toLowerCase()));
}

function signal(
  id: string,
  type: CompassSignalType,
  what: string,
  whySurface: string,
  whyEssence: string,
  direction: Vector3,
  opts: Partial<CompassSignal> = {},
): CompassSignal {
  const intensity = clamp(opts.intensity ?? (type === "emotion" ? 0.72 : 0.62));
  const confidence = clamp(opts.confidence ?? 0.72);
  return {
    id,
    type,
    domain: opts.domain ?? "work",
    what,
    whySurface,
    whyEssence,
    direction: normalize(direction),
    intensity,
    confidence,
    weight: Math.max(1, Math.min(10, Math.round(opts.weight ?? intensity * confidence * 10))),
    source: opts.source ?? "diagnostic",
    timestamp: opts.timestamp,
  };
}

const WORK_STYLE_VECTOR: Record<string, Vector3> = {
  one_on_one: [0.45, 0.75, 0.2],
  small_group: [0.2, 0.55, 0.45],
  make_alone: [0.85, 0.7, 0.35],
  teach: [0.35, 0.65, 0.35],
  connect: [0.35, 0.25, 0.75],
};

const WANT_VECTOR: Record<string, Vector3> = {
  quick_small: [0.15, -0.15, -0.2],
  find_direction: [0.35, 0.8, 0.15],
  grow_my_work: [0.75, 0.55, 0.65],
  test_small: [0.55, 0.35, 0.75],
};

const BLOCKER_TEXT: Record<string, string> = {
  not_good_enough: "내가 충분히 잘하는지 확신이 없음",
  would_anyone_pay: "누가 돈을 낼지 모르겠음",
  no_time: "시간이 부족함",
  cant_describe: "어떻게 설명할지 모르겠음",
  need_more_ready: "더 준비된 다음에 해야 할 것 같음",
};

const BLOCKER_VECTOR: Record<string, Vector3> = {
  not_good_enough: [-0.15, 0.55, -0.2],
  would_anyone_pay: [0.15, 0.35, 0.25],
  no_time: [-0.35, -0.15, -0.2],
  cant_describe: [0.25, 0.65, 0.25],
  need_more_ready: [-0.25, 0.35, -0.3],
};

export function extractCompassSignals(
  session: DiagnosticSession,
  notes: DailyNote[] = [],
): CompassSignal[] {
  const a: QuestionResponseMap = session.answers ?? {};
  const out: CompassSignal[] = [];

  if (a.work_style) {
    out.push(signal(
      "work_style",
      "decision",
      `선호하는 일 방식: ${a.work_style}`,
      a.work_style,
      "일하는 방식 선호는 실행 가능한 offer 형태의 직접 신호",
      WORK_STYLE_VECTOR[a.work_style] ?? [0.4, 0.4, 0.2],
      { domain: "offer", intensity: 0.72, confidence: 0.82, weight: 7 },
    ));
  }

  if (a.want_most) {
    out.push(signal(
      "want_most",
      "decision",
      `지금 원하는 것: ${a.want_most}`,
      a.want_most,
      "현재 욕구는 offer 속도와 위험 선호의 방향 신호",
      WANT_VECTOR[a.want_most] ?? [0.4, 0.4, 0.2],
      { domain: "life", intensity: 0.7, confidence: 0.78, weight: 7 },
    ));
  }

  if (a.direction_interest) {
    const map: Record<string, Vector3> = {
      guide: [0.45, 0.75, 0.25],
      consult: [0.5, 0.8, 0.25],
      class: [0.25, 0.55, 0.35],
      digital: [0.75, 0.55, 0.6],
      ai_help: [0.55, 0.45, 0.85],
      community: [0.35, 0.3, 0.8],
    };
    out.push(signal(
      "direction_interest",
      "emotion",
      `끌리는 방향: ${a.direction_interest}`,
      a.direction_interest,
      "부담이 적거나 끌리는 방향은 aspirational offer 후보",
      map[a.direction_interest] ?? [0.4, 0.4, 0.4],
      { domain: "offer", intensity: 0.8, confidence: 0.75, weight: 7 },
    ));
  }

  const positiveTexts = [
    ["good_at_unpaid", a.good_at_unpaid],
    ["often_asked", a.often_asked],
    ["energy_giving", a.energy_giving],
    ["korea_experience", a.korea_experience],
    ["us_experience", a.us_experience],
  ] as const;

  for (const [key, value] of positiveTexts) {
    const t = clean(value);
    if (!t) continue;
    const vector: Vector3 = has(t, ["연결", "소개", "모임", "커뮤니티", "사람"])
      ? [0.4, 0.3, 0.75]
      : has(t, ["정리", "분석", "연구", "기획", "설명", "가르"])
        ? [0.45, 0.85, 0.35]
        : has(t, ["ai", "AI", "자동화", "디지털", "코딩", "챗gpt", "GPT"])
          ? [0.65, 0.45, 0.85]
          : [0.45, 0.55, 0.35];
    out.push(signal(
      key,
      key === "energy_giving" ? "emotion" : "pattern",
      clip(t, 42),
      t,
      key === "energy_giving"
        ? "에너지가 차오르는 활동은 core value 강화 신호"
        : "반복 경험/요청은 이미 시장이 인식한 자산 신호",
      vector,
      { domain: key === "energy_giving" ? "growth" : "offer", intensity: 0.66, confidence: 0.68, weight: 6 },
    ));
  }

  if (clean(a.dont_want)) {
    out.push(signal(
      "dont_want",
      "emotion",
      clip(a.dont_want, 42),
      clean(a.dont_want),
      "오래 하기 싫은 일은 anti-value이자 offer boundary",
      [-0.45, 0.15, -0.25],
      { domain: "work", intensity: 0.76, confidence: 0.72, weight: 7 },
    ));
  }

  if (a.biggest_blocker) {
    out.push(signal(
      "biggest_blocker",
      "pattern",
      BLOCKER_TEXT[a.biggest_blocker] ?? a.biggest_blocker,
      a.biggest_blocker,
      "현재 blocker는 offer 질문이 보강해야 할 빈칸",
      BLOCKER_VECTOR[a.biggest_blocker] ?? [0.1, 0.3, 0.1],
      { domain: "offer", intensity: 0.78, confidence: 0.78, weight: 8 },
    ));
  }

  notes.forEach((n, i) => {
    const stamp = n.createdAt || n.date;
    if (clean(n.todayAction)) {
      out.push(signal(
        `note_${i}_action`,
        "decision",
        clip(n.todayAction, 42),
        n.todayAction,
        "실제 행동은 말보다 강한 방향 증거",
        [0.65, 0.35, 0.55],
        { domain: "offer", source: "daily_note", timestamp: stamp, intensity: 0.7, confidence: 0.8, weight: 8 },
      ));
    }
    if (clean(n.customerVoice)) {
      out.push(signal(
        `note_${i}_customer_voice`,
        "pattern",
        clip(n.customerVoice, 42),
        n.customerVoice,
        "고객의 말은 offer-market 접점의 직접 증거",
        [0.45, 0.65, 0.6],
        { domain: "offer", source: "daily_note", timestamp: stamp, intensity: 0.82, confidence: 0.86, weight: 9 },
      ));
    }
    if (clean(n.insight)) {
      out.push(signal(
        `note_${i}_insight`,
        "pattern",
        clip(n.insight, 42),
        n.insight,
        "반복 인사이트는 추상화된 H를 업데이트하는 신호",
        [0.45, 0.78, 0.5],
        { domain: "growth", source: "daily_note", timestamp: stamp, intensity: 0.68, confidence: 0.74, weight: 7 },
      ));
    }
    if (n.moodTag === "tired" || n.moodTag === "anxious") {
      out.push(signal(
        `note_${i}_mood`,
        "emotion",
        n.moodTag === "tired" ? "피곤함" : "불안함",
        n.moodTag,
        "낮은 에너지는 offer 크기를 더 작게 쪼개야 한다는 신호",
        [-0.25, 0.05, -0.2],
        { domain: "life", source: "daily_note", timestamp: stamp, intensity: 0.62, confidence: 0.7, weight: 5 },
      ));
    }
  });

  return out;
}

function computeH(signals: CompassSignal[]): Pick<CompassH, "direction" | "magnitude" | "confidence"> {
  if (!signals.length) return { direction: ZERO, magnitude: 0, confidence: 0 };
  let sum: Vector3 = ZERO;
  let totalWeight = 0;
  for (const s of signals) {
    const effective = s.weight * s.intensity * s.confidence;
    sum = add(sum, scale(s.direction, effective));
    totalWeight += effective;
  }
  const rawMagnitude = totalWeight ? len(sum) / totalWeight : 0;
  const evidence = Math.min(1, signals.length / 10);
  const avgConfidence = signals.reduce((acc, s) => acc + s.confidence, 0) / signals.length;
  return {
    direction: normalize(sum),
    magnitude: clamp(rawMagnitude),
    confidence: clamp(0.18 + evidence * 0.42 + avgConfidence * 0.4),
  };
}

function valuesForDirection(h: Vector3): { core: string[]; anti: string[] } {
  const core: string[] = [];
  const anti: string[] = [];
  if (h[0] >= 0.2) core.push("스스로 방향을 정하는 자율성");
  if (h[0] <= -0.2) core.push("안전한 구조와 검증된 절차");
  if (h[1] >= 0.2) core.push("깊이 있게 이해하고 정리하는 힘");
  if (h[1] <= -0.2) core.push("넓게 시도하며 빠르게 배우는 방식");
  if (h[2] >= 0.2) core.push("새로운 방식으로 문제를 푸는 감각");
  if (h[2] <= -0.2) core.push("무리하지 않는 안정적 실행");
  if (h[0] > 0.15) anti.push("남이 정한 방식만 따라가는 일");
  if (h[1] > 0.15) anti.push("얕게 훑고 끝나는 조언");
  if (h[2] > 0.15) anti.push("기존 방식만 반복하는 일");
  return { core: core.slice(0, 3), anti: anti.slice(0, 3) };
}

function oneLiner(h: Vector3, core: string[], signals: CompassSignal[]): string {
  if (signals.length === 0) return "아직 방향을 판단하기엔 입력이 부족해요.";
  const main = core[0] ?? "자기만의 방식";
  const second = core[1] ?? "작은 실행";
  const offerSignals = signals.filter((s) => s.domain === "offer").length;
  const suffix = offerSignals >= 3
    ? "그 방향을 실제 오퍼로 번역하려는 사람"
    : "아직 자기 방향을 더 선명하게 만들어가는 사람";
  return `${main}을 중심에 두고, ${second}을 통해 ${suffix}`;
}

function computeAlignment(signals: CompassSignal[], h: Vector3): number {
  if (!signals.length || len(h) === 0) return 0;
  let weighted = 0;
  let total = 0;
  for (const s of signals) {
    const w = s.weight * s.intensity * s.confidence;
    weighted += ((cos(s.direction, h) + 1) / 2) * w;
    total += w;
  }
  return total ? clamp(weighted / total) : 0;
}

function timelineSummary(signals: CompassSignal[]): string[] {
  const imported = signals.filter((s) => s.source === "imported_context").length;
  const notes = signals.filter((s) => s.source === "daily_note");
  const out: string[] = [];
  if (imported) out.push("가져온 과거 자료에서 초기 방향 신호를 추출했어요.");
  if (signals.some((s) => s.source === "diagnostic")) out.push("진단 답변에서 현재 욕구와 일 방식의 기준점을 잡았어요.");
  if (notes.length) out.push("Daily Note가 쌓이며 행동·고객 목소리·인사이트가 방향을 보강하고 있어요.");
  if (notes.length >= 4) out.push("최근 기록이 반복되면서 offer-market 접점이 더 선명해지는 중이에요.");
  return out.slice(0, 4);
}

function adaptiveQuestions(blockers: string[], offerConfidence: number, signals: CompassSignal[]): string[] {
  const qs: string[] = [];
  if (offerConfidence < 0.45) {
    qs.push("지금 가장 돕고 싶은 사람은 누구인가요? 한 사람만 떠올려도 좋아요.");
  }
  if (blockers.some((b) => b.includes("돈") || b.includes("누가"))) {
    qs.push("그 사람이 이미 시간이나 돈을 쓰고 있는 불편은 무엇인가요?");
  }
  if (!signals.some((s) => s.id.includes("customer_voice"))) {
    qs.push("최근 누군가가 실제로 말한 고민 한 문장을 그대로 적어볼 수 있나요?");
  }
  if (blockers.some((b) => b.includes("설명"))) {
    qs.push("오퍼를 ‘나는 ○○한 사람이 ○○하도록 돕는다’로 쓰면 무엇이 들어가나요?");
  }
  if (qs.length === 0) qs.push("이 방향으로 이번 주 가장 작게 검증할 수 있는 행동은 무엇인가요?");
  return qs.slice(0, 3);
}

function buildOffer(signals: CompassSignal[], h: CompassH, blockers: string[]): OfferDirection {
  const offerSignals = signals.filter((s) => s.domain === "offer");
  const evidence = Math.min(1, offerSignals.length / 6);
  const customerEvidence = signals.some((s) => s.id.includes("customer_voice")) ? 0.18 : 0;
  const confidence = clamp(h.confidence * 0.45 + evidence * 0.37 + customerEvidence);
  const readiness: OfferDirection["readiness"] = confidence >= 0.68 ? "recommend" : confidence >= 0.42 ? "explore" : "not_ready";
  const blocker = blockers[0] ?? "누구를 어떤 변화로 도울지 아직 흐림";
  const targetHypothesis = offerSignals.some((s) => s.what.includes("연결") || s.what.includes("커뮤니티"))
    ? "비슷한 고민을 가진 사람들을 연결하고 싶은 사람들"
    : offerSignals.some((s) => s.what.toLowerCase().includes("ai"))
      ? "AI를 배우고 싶지만 자기 일에 연결하지 못한 사람들"
      : "지금 가진 경험을 수익/일의 언어로 바꾸고 싶은 사람들";
  const promise = readiness === "not_ready"
    ? "아직 오퍼를 확정하기보다, 누구를 도울지 좁히는 단계"
    : "흩어진 경험을 한 사람이 바로 실행할 수 있는 다음 행동으로 바꿔주는 것";
  return {
    readiness,
    confidence,
    targetHypothesis,
    blocker,
    promise,
    nextQuestion: readiness === "recommend" ? undefined : adaptiveQuestions(blockers, confidence, signals)[0],
    rationale: readiness === "recommend"
      ? "Compass 신호와 offer 관련 증거가 충분히 쌓여 초기 추천이 가능해요."
      : "Compass 방향은 보이지만 offer-market 증거가 더 필요해요.",
  };
}

export function analyzeIdentityCompass(
  session: DiagnosticSession,
  notes: DailyNote[] = [],
): CompassAnalysis {
  const signals = extractCompassSignals(session, notes);
  const hBase = computeH(signals);
  const { core, anti } = valuesForDirection(hBase.direction);
  const h: CompassH = {
    ...hBase,
    coreValues: core,
    antiValues: anti,
    oneLiner: oneLiner(hBase.direction, core, signals),
  };
  const alignment = computeAlignment(signals, h.direction);
  const blockers = Array.from(new Set(signals
    .filter((s) => s.id === "biggest_blocker" || s.id === "dont_want" || s.id.includes("mood"))
    .map((s) => s.what)))
    .slice(0, 3);
  const offer = buildOffer(signals, h, blockers);
  return {
    signals,
    h,
    alignment,
    clarity: Math.min(95, Math.round((h.confidence * 0.55 + alignment * 0.3 + Math.min(1, signals.length / 12) * 0.15) * 100)),
    blockers,
    timeline: timelineSummary(signals),
    adaptiveQuestions: adaptiveQuestions(blockers, offer.confidence, signals),
    offer,
  };
}

export function simulateOfferAlignment(
  analysis: CompassAnalysis,
  offerVector: Vector3,
): { before: number; after: number; delta: number } {
  const virtual = signal(
    "virtual_offer",
    "decision",
    "가상 오퍼",
    "offer simulation",
    "새 오퍼가 현재 H와 얼마나 맞는지 가상 구슬로 시뮬레이션",
    offerVector,
    { domain: "offer", intensity: 0.8, confidence: 0.7, weight: 7 },
  );
  const before = analysis.alignment;
  const after = computeAlignment([...analysis.signals, virtual], analysis.h.direction);
  return { before, after, delta: after - before };
}
