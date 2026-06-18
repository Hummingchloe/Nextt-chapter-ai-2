// ─────────────────────────────────────────────────────────────
// Local-first user ontology.
// Pure domain logic only: no browser API, no server persistence, no UI.
// ─────────────────────────────────────────────────────────────

export type OntologySignalKind =
  | "asset"
  | "need"
  | "blocker"
  | "market"
  | "action"
  | "content";

export type OntologyRole = "user" | "assistant";

export interface OntologyMessage {
  id: string;
  role: OntologyRole;
  text: string;
  createdAt: string;
}

export interface OntologySignal {
  id: string;
  kind: OntologySignalKind;
  label: string;
  evidence: string;
  confidence: number;
  weight: number;
  updatedAt: string;
}

export interface CompassSnapshot {
  alignment: number;
  clarity: number;
  confidence: number;
  status: "listening" | "forming" | "ready";
  oneLine: string;
  nextQuestion: string;
  evidenceCount: number;
}

export interface UserOntology {
  id: string;
  version: 1;
  createdAt: string;
  updatedAt: string;
  messages: OntologyMessage[];
  signals: OntologySignal[];
  summary: string;
  compass: CompassSnapshot;
}

export interface OntologyUpdateResult {
  ontology: UserOntology;
  assistantMessage: OntologyMessage;
}

const SIGNAL_RULES: {
  id: string;
  kind: OntologySignalKind;
  label: string;
  hints: string[];
  weight: number;
}[] = [
  {
    id: "asset_ai",
    kind: "asset",
    label: "AI와 디지털 도구를 내 일에 연결하려는 자산",
    hints: ["ai", "챗gpt", "chatgpt", "자동화", "프롬프트", "노션", "canva", "캔바"],
    weight: 10,
  },
  {
    id: "asset_expert",
    kind: "asset",
    label: "전문 경험을 다시 팔 수 있는 언어로 바꾸는 자산",
    hints: ["마케팅", "금융", "상담", "교육", "강의", "개발", "디자인", "회계", "기획", "컨설"],
    weight: 9,
  },
  {
    id: "asset_community",
    kind: "asset",
    label: "사람을 연결하고 커뮤니티를 만드는 관계 자산",
    hints: ["모임", "커뮤니티", "소개", "연결", "네트워크", "교회", "봉사", "행사"],
    weight: 8,
  },
  {
    id: "need_offer",
    kind: "need",
    label: "내 경험을 첫 오퍼 문장으로 좁혀야 하는 상태",
    hints: ["오퍼", "상품", "서비스", "팔", "수익", "가격", "고객", "돈"],
    weight: 9,
  },
  {
    id: "blocker_clarity",
    kind: "blocker",
    label: "방향이 넓고 아직 설명 문장이 흐린 상태",
    hints: ["모르겠", "막막", "헷갈", "애매", "불안", "어렵", "정리"],
    weight: 8,
  },
  {
    id: "blocker_time",
    kind: "blocker",
    label: "시간과 에너지 제약 안에서 작게 움직여야 하는 상태",
    hints: ["시간", "바빠", "육아", "가족", "피곤", "주말", "퇴근"],
    weight: 6,
  },
  {
    id: "market_voice",
    kind: "market",
    label: "주변 사람의 반복 질문이나 고객 반응이 있는 상태",
    hints: ["물어봐", "요청", "고객", "반응", "필요", "문제", "불편", "도와"],
    weight: 11,
  },
  {
    id: "action_test",
    kind: "action",
    label: "작은 테스트와 직접 대화를 통해 검증해야 하는 상태",
    hints: ["테스트", "실험", "물어보기", "인터뷰", "해보기", "보여주", "검증"],
    weight: 8,
  },
];

export function createEmptyOntology(now = new Date()): UserOntology {
  const iso = now.toISOString();
  return {
    id: `local-${now.getTime().toString(36)}`,
    version: 1,
    createdAt: iso,
    updatedAt: iso,
    messages: [],
    signals: [],
    summary: "아직 충분한 기록이 없어 방향을 듣는 중이에요.",
    compass: {
      alignment: 0,
      clarity: 0,
      confidence: 0,
      status: "listening",
      oneLine: "아직은 판단보다 질문이 필요한 단계예요.",
      nextQuestion: "요즘 가장 자주 떠오르는 고민이나 질문을 한 문장으로 적어볼까요?",
      evidenceCount: 0,
    },
  };
}

export function normalizeOntology(input: Partial<UserOntology> | null | undefined): UserOntology {
  if (!input?.id) return createEmptyOntology();
  const base = createEmptyOntology(new Date(input.createdAt ?? Date.now()));
  const ontology: UserOntology = {
    ...base,
    ...input,
    version: 1,
    messages: Array.isArray(input.messages) ? input.messages.filter(isMessage) : [],
    signals: Array.isArray(input.signals) ? input.signals.filter(isSignal) : [],
  };
  return recomputeOntology(ontology);
}

export function updateOntologyFromInput(
  current: UserOntology,
  input: string,
  now = new Date(),
): OntologyUpdateResult {
  const text = input.trim();
  const iso = now.toISOString();
  const userMessage: OntologyMessage = {
    id: `msg-${now.getTime().toString(36)}-u`,
    role: "user",
    text,
    createdAt: iso,
  };

  const signals = mergeSignals(current.signals, extractSignals(text, iso));
  const draft: UserOntology = {
    ...current,
    updatedAt: iso,
    messages: [...current.messages, userMessage],
    signals,
  };
  const ontology = recomputeOntology(draft);
  const assistantMessage: OntologyMessage = {
    id: `msg-${now.getTime().toString(36)}-a`,
    role: "assistant",
    text: buildAssistantReply(ontology),
    createdAt: iso,
  };

  return {
    ontology: recomputeOntology({
      ...ontology,
      messages: [...ontology.messages, assistantMessage],
    }),
    assistantMessage,
  };
}

export function recomputeOntology(ontology: UserOntology): UserOntology {
  const compass = computeCompass(ontology.signals, ontology.messages.length);
  return {
    ...ontology,
    summary: buildSummary(ontology.signals, compass),
    compass,
  };
}

export function signalsByKind(
  ontology: UserOntology,
  kind: OntologySignalKind,
): OntologySignal[] {
  return ontology.signals
    .filter((s) => s.kind === kind)
    .sort((a, b) => b.weight * b.confidence - a.weight * a.confidence);
}

function extractSignals(text: string, now: string): OntologySignal[] {
  const lower = text.toLowerCase();
  return SIGNAL_RULES.filter((rule) =>
    rule.hints.some((hint) => lower.includes(hint.toLowerCase())),
  ).map((rule) => ({
    id: rule.id,
    kind: rule.kind,
    label: rule.label,
    evidence: clipEvidence(text),
    confidence: confidenceFor(text, rule.hints),
    weight: rule.weight,
    updatedAt: now,
  }));
}

function mergeSignals(current: OntologySignal[], incoming: OntologySignal[]): OntologySignal[] {
  const byId = new Map(current.map((s) => [s.id, s]));
  for (const next of incoming) {
    const prev = byId.get(next.id);
    byId.set(next.id, prev ? {
      ...prev,
      evidence: next.evidence,
      confidence: Math.min(0.96, Math.max(prev.confidence, next.confidence) + 0.04),
      weight: Math.max(prev.weight, next.weight),
      updatedAt: next.updatedAt,
    } : next);
  }
  return Array.from(byId.values()).sort((a, b) => b.weight * b.confidence - a.weight * a.confidence);
}

function computeCompass(signals: OntologySignal[], messageCount: number): CompassSnapshot {
  const weighted = signals.reduce((sum, s) => sum + s.weight * s.confidence, 0);
  const kindCount = new Set(signals.map((s) => s.kind)).size;
  const alignment = clamp(Math.round(weighted * 3.8 + Math.min(messageCount, 12) * 2 + kindCount * 4), 0, 92);
  const clarity = clamp(Math.round(alignment * 0.78 + signalsByKinds(signals, ["market", "action"]).length * 6), 0, 95);
  const confidence = clamp(Math.round(alignment * 0.68 + kindCount * 5), 0, 95);
  const status = alignment >= 50 ? "ready" : alignment >= 25 ? "forming" : "listening";
  return {
    alignment,
    clarity,
    confidence,
    status,
    oneLine: oneLineFor(status, signals),
    nextQuestion: nextQuestionFor(signals, status),
    evidenceCount: signals.length,
  };
}

function signalsByKinds(signals: OntologySignal[], kinds: OntologySignalKind[]): OntologySignal[] {
  return signals.filter((s) => kinds.includes(s.kind));
}

function oneLineFor(status: CompassSnapshot["status"], signals: OntologySignal[]): string {
  const top = signals[0]?.label;
  if (status === "ready") return top ? `${top}이 중심축으로 잡히고 있어요.` : "첫 제안을 만들 수 있는 신호가 모였어요.";
  if (status === "forming") return top ? `${top}은 보이지만, 아직 시장 반응이나 행동 기록이 더 필요해요.` : "방향의 윤곽이 생기는 중이에요.";
  return "아직은 추천보다 이야기를 더 듣는 게 맞아요.";
}

function nextQuestionFor(signals: OntologySignal[], status: CompassSnapshot["status"]): string {
  const hasMarket = signals.some((s) => s.kind === "market");
  const hasAction = signals.some((s) => s.kind === "action");
  const hasOffer = signals.some((s) => s.id === "need_offer");
  if (!hasMarket) return "최근 누가 어떤 문제로 당신에게 도움을 요청했나요?";
  if (!hasOffer) return "그 문제를 돈을 받고 도와준다면 첫 오퍼 문장은 어떻게 말할 수 있을까요?";
  if (!hasAction) return "이번 주에 15분 안에 해볼 수 있는 가장 작은 검증 행동은 무엇인가요?";
  if (status === "ready") return "이 방향으로 오늘 바로 실행할 수 있는 작은 행동을 하나 적어볼까요?";
  return "이 방향이 맞다고 느낀 근거 하나와 아직 불안한 점 하나를 적어볼까요?";
}

function buildSummary(signals: OntologySignal[], compass: CompassSnapshot): string {
  if (!signals.length) return "아직 충분한 기록이 없어 방향을 듣는 중이에요.";
  const assets = signals.filter((s) => s.kind === "asset").slice(0, 2).map((s) => s.label);
  const market = signals.find((s) => s.kind === "market")?.label;
  const blocker = signals.find((s) => s.kind === "blocker")?.label;
  const pieces = [
    assets.length ? `자산: ${assets.join(" / ")}` : "",
    market ? `시장 신호: ${market}` : "",
    blocker ? `주의점: ${blocker}` : "",
    `현재 정렬도 ${compass.alignment}%`,
  ].filter(Boolean);
  return pieces.join(" · ");
}

function buildAssistantReply(ontology: UserOntology): string {
  const { compass } = ontology;
  if (compass.status === "ready") {
    return `좋아요. 지금 정렬도는 ${compass.alignment}%예요. 이제 추천을 시작해도 되는 신호가 있습니다. 대시보드에서 오늘의 액션과 추천 링크를 확인할 수 있어요.`;
  }
  if (compass.status === "forming") {
    return `조금 선명해졌어요. 현재 정렬도는 ${compass.alignment}%예요. 아직은 강한 추천보다 질문이 더 유효합니다. ${compass.nextQuestion}`;
  }
  return `기록했어요. 현재는 정렬도 ${compass.alignment}%라서 판단보다 맥락 수집 단계예요. ${compass.nextQuestion}`;
}

function confidenceFor(text: string, hints: string[]): number {
  const lower = text.toLowerCase();
  const hits = hints.filter((hint) => lower.includes(hint.toLowerCase())).length;
  return clampFloat(0.58 + hits * 0.08 + Math.min(text.length, 420) / 2400, 0.58, 0.94);
}

function clipEvidence(text: string): string {
  const compact = text.trim().replace(/\s+/g, " ");
  return compact.length > 96 ? `${compact.slice(0, 96)}...` : compact;
}

function isMessage(value: unknown): value is OntologyMessage {
  const v = value as OntologyMessage;
  return typeof v?.id === "string" && (v.role === "user" || v.role === "assistant") && typeof v.text === "string";
}

function isSignal(value: unknown): value is OntologySignal {
  const v = value as OntologySignal;
  return typeof v?.id === "string" && typeof v.label === "string" && typeof v.confidence === "number";
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function clampFloat(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, Number(n.toFixed(2))));
}
