// ─────────────────────────────────────────────────────────────
// Proposal engine.
// Pure logic: turns a UserOntology into next actions and content links.
// ─────────────────────────────────────────────────────────────

import { signalsByKind, type UserOntology } from "./ontology";

export interface ProposalAction {
  id: string;
  dateLabel: string;
  title: string;
  detail: string;
}

export interface ProposalLink {
  id: string;
  title: string;
  url: string;
  why: string;
  channel?: string;
}

export interface ProposalDashboard {
  ready: boolean;
  gateMessage: string;
  actions: ProposalAction[];
  youtubeLinks: ProposalLink[];
  userSummary: string;
  recordLog: { id: string; dateLabel: string; text: string }[];
  source?: "deterministic" | "claude";
  generatedAt?: string;
}

export interface ProposalGenerationDiagnostics {
  aiUsed: boolean;
  provider: "anthropic" | "deterministic";
  model?: string;
  webSearchUsed: boolean;
  webSearchRequests: number;
  fallbackReason?: string;
}

export function buildProposalDashboard(ontology: UserOntology): ProposalDashboard {
  const ready = ontology.compass.alignment >= 50;
  return {
    ready,
    gateMessage: ready
      ? "정렬도 50%를 넘어서 작은 실행과 콘텐츠 추천을 시작할 수 있어요."
      : `아직 정렬도 ${ontology.compass.alignment}%예요. 추천보다 질문이 먼저입니다: ${ontology.compass.nextQuestion}`,
    actions: ready ? buildActions(ontology) : [],
    youtubeLinks: ready ? buildYoutubeLinks(ontology) : [],
    userSummary: buildUserSummary(ontology),
    recordLog: ontology.messages
      .filter((m) => m.role === "user")
      .slice(-8)
      .reverse()
      .map((m) => ({
        id: m.id,
        dateLabel: shortDate(m.createdAt),
        text: m.text.length > 92 ? `${m.text.slice(0, 92)}...` : m.text,
      })),
    source: "deterministic",
    generatedAt: new Date().toISOString(),
  };
}

function buildActions(ontology: UserOntology): ProposalAction[] {
  const hasMarket = signalsByKind(ontology, "market").length > 0;
  const hasAi = ontology.signals.some((s) => s.id === "asset_ai");
  const hasCommunity = ontology.signals.some((s) => s.id === "asset_community");
  const base = hasMarket
    ? "최근 도움을 요청한 사람 1명에게 같은 문제를 다시 물어보기"
    : "주변 사람 1명에게 요즘 막힌 문제를 10분만 물어보기";
  const offer = hasAi
    ? "AI로 줄여줄 수 있는 반복 업무 하나를 한 문장 오퍼로 적기"
    : "내가 도와줄 수 있는 문제 하나를 20자 안팎으로 적기";
  const channel = hasCommunity
    ? "내가 이미 속한 모임에 질문 하나 올려보기"
    : "카톡/문자 1명에게 오퍼 문장을 보여주고 반응 받기";

  return [
    {
      id: "today",
      dateLabel: "오늘",
      title: base,
      detail: "목표는 판매가 아니라 문제 언어를 얻는 것입니다.",
    },
    {
      id: "tomorrow",
      dateLabel: "내일",
      title: offer,
      detail: "누구를, 어떤 문제에서, 어떻게 가볍게 도울지 한 문장으로 좁힙니다.",
    },
    {
      id: "day3",
      dateLabel: "3일차",
      title: channel,
      detail: "좋다/싫다보다 어떤 단어에서 반응했는지만 기록합니다.",
    },
  ];
}

function buildYoutubeLinks(ontology: UserOntology): ProposalLink[] {
  const query = primaryQuery(ontology);
  return [
    {
      id: "offer",
      title: `${query} 첫 오퍼 만들기`,
      url: youtubeSearchUrl(`${query} first offer validation`),
      why: "정렬도가 생긴 뒤에는 긴 공부보다 첫 제안 문장이 먼저입니다.",
    },
    {
      id: "customer",
      title: `${query} 고객 인터뷰`,
      url: youtubeSearchUrl(`${query} customer interview problem discovery`),
      why: "시장 반응은 추측보다 실제 대화에서 가장 빨리 쌓입니다.",
    },
    {
      id: "small-business",
      title: `${query} 1인 비즈니스 실행`,
      url: youtubeSearchUrl(`${query} solopreneur small business korea`),
      why: "큰 창업보다 작은 검증과 반복 행동에 맞춘 콘텐츠가 필요합니다.",
    },
  ];
}

function buildUserSummary(ontology: UserOntology): string {
  const assets = signalsByKind(ontology, "asset").slice(0, 2).map((s) => s.label);
  const market = signalsByKind(ontology, "market")[0]?.label;
  const blocker = signalsByKind(ontology, "blocker")[0]?.label;
  if (!assets.length && !market) return "아직은 유저의 자산과 시장 신호를 듣는 중입니다.";
  return [
    assets.length ? `강점은 ${assets.join(", ")}입니다.` : "",
    market ? `시장 쪽으로는 ${market}가 보입니다.` : "",
    blocker ? `다만 ${blocker}라서 행동은 작아야 합니다.` : "",
  ].filter(Boolean).join(" ");
}

function primaryQuery(ontology: UserOntology): string {
  if (ontology.signals.some((s) => s.id === "asset_ai")) return "AI consulting for beginners";
  if (ontology.signals.some((s) => s.id === "asset_expert")) return "expert service business";
  if (ontology.signals.some((s) => s.id === "asset_community")) return "community based business";
  return "small service business validation";
}

function youtubeSearchUrl(query: string): string {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
}

function shortDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("ko-KR", { month: "short", day: "numeric" }).format(new Date(iso));
  } catch {
    return "기록";
  }
}
