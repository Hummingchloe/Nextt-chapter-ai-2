// ─────────────────────────────────────────────────────────────
// 내 컴퍼스 (EN1·EN2·EN3 of the v3 spec, web-app form).
// "입력할수록 또렷해짐" — a structured, *updating* summary of who the
// user is / wants / situation / blockers / direction, recomputed from
// the session + accumulated notes. Deterministic; no vector DB.
//
// Also: growth roadmap (S3.2) and a daily rotating pick (S5 #1~4),
// both reusing the report we already generate.
// ─────────────────────────────────────────────────────────────

import { computeMomentum } from "./momentum";
import { analyzeIdentityCompass, type CompassAnalysis } from "./identity-compass-engine";
import type {
  DailyNote,
  DiagnosticSession,
  ReportSection,
} from "./types";

export interface Compass {
  identity: string; // 정체성
  wants: string; // 원하는 것
  situation: string; // 지금 상황
  blockers: string[]; // 막힌 지점
  direction?: string; // 방향
  clarity: number; // 선명도 %
  oneLine: string; // 한 문장 요약
  alignment: number; // M 정렬도, 0..1
  confidence: number; // H confidence, 0..1
  coreValues: string[];
  antiValues: string[];
  offerReadiness: CompassAnalysis["offer"]["readiness"];
  offerConfidence: number;
  offerQuestion?: string;
  adaptiveQuestions: string[];
}

const STYLE: Record<string, string> = {
  one_on_one: "한 사람을 깊이 돕는",
  small_group: "작은 그룹을 이끄는",
  make_alone: "혼자 만들어내는",
  teach: "쉽게 설명하고 가르치는",
  connect: "사람과 사람을 잇는",
};
const WANT: Record<string, string> = {
  quick_small: "작더라도 곧 손에 잡히는 수입",
  find_direction: "흔들리지 않을 하나의 방향",
  grow_my_work: "내 일로 키워갈 씨앗",
  test_small: "부담 없이 가볍게 해볼 시도",
};
const STATE: Record<string, string> = {
  no_idea: "어디서 시작할지 막막한",
  vague_ideas: "어렴풋한 생각은 있는",
  can_do_no_income: "할 수 있는 건 있는",
  good_cant_offer: "잘하는 건 있는데 표현이 막힌",
};
const BLOCKER: Record<string, string> = {
  not_good_enough: "내가 충분히 잘하는지 확신이 없음",
  would_anyone_pay: "누가 돈을 낼지 모르겠음",
  no_time: "시간이 부족함",
  cant_describe: "어떻게 설명할지 모르겠음",
  need_more_ready: "더 준비된 다음에 해야 할 것 같음",
};

function clip(s?: string, n = 22): string {
  const t = (s ?? "").trim().replace(/\s+/g, " ");
  return t.length <= n ? t : t.slice(0, n).trim() + "…";
}

export function buildCompass(
  session: DiagnosticSession,
  notes: DailyNote[],
): Compass {
  const a = session.answers;
  const m = computeMomentum(notes);
  const analysis = analyzeIdentityCompass(session, notes);

  // 정체성: Identity Compass H one-liner가 source of truth.
  const style = STYLE[a.work_style] ?? "당신만의 방식으로 일하는";
  const strength = clip(a.good_at_unpaid || a.often_asked);
  const fallbackIdentity = strength
    ? `‘${strength}’을(를) 잘하는, ${style} 사람`
    : `${style} 사람`;
  const identity = analysis.h.coreValues[0]
    ? `${analysis.h.coreValues[0]}을(를) 중심에 둔 사람`
    : fallbackIdentity;

  const wants = WANT[a.want_most] ?? "작게 시작할 방향";

  const statePart = STATE[a.current_state] ?? "다시 시작하려는";
  const flow = !m.hasActivity
    ? "이제 막 첫 걸음을 떼는 중"
    : m.gapDays >= 3
      ? "잠시 멈췄다가 다시 돌아온"
      : m.streakOngoing && m.currentStreak >= 2
        ? "흐름을 이어가는 중"
        : "작게 이어가고 있는";
  const situation = `${statePart} 상태에서, ${flow}`;

  const legacyBlockers: string[] = [];
  if (BLOCKER[a.biggest_blocker]) legacyBlockers.push(BLOCKER[a.biggest_blocker]);
  const blockers = (analysis.blockers.length ? analysis.blockers : legacyBlockers).slice(0, 3);
  const direction = session.report?.topRecommendation.label;

  const oneLine = `${analysis.h.oneLiner}${
    direction ? ` 지금의 1순위 방향은 ‘${direction}’입니다.` : ""
  }`;

  return {
    identity,
    wants,
    situation,
    blockers,
    direction,
    clarity: analysis.clarity,
    oneLine,
    alignment: analysis.alignment,
    confidence: analysis.h.confidence,
    coreValues: analysis.h.coreValues,
    antiValues: analysis.h.antiValues,
    offerReadiness: analysis.offer.readiness,
    offerConfidence: analysis.offer.confidence,
    offerQuestion: analysis.offer.nextQuestion,
    adaptiveQuestions: analysis.adaptiveQuestions,
  };
}

// ── 성장 로드맵 (S3.2) ───────────────────────────────────────
export interface Roadmap {
  shortTerm: string[]; // 이번 주 ~ 한 달
  midTerm: string[]; // 이번 분기
}

export function buildRoadmap(directionId?: string): Roadmap {
  const shortByDir: Record<string, string> = {
    small_class: "작은 클래스 ‘열어볼까?’를 단톡방에 한 번 물어보기",
    community_program: "비슷한 고민의 3명에게 첫 모임을 제안하기",
    ai_beginner_help: "AI를 어려워하는 1명을 30분 옆에서 도와보기",
    digital_guide: "자주 받는 질문 1개를 ‘한 장 가이드’로 만들기",
  };
  const short = [
    shortByDir[directionId ?? ""] ??
      "가장 편한 1명에게 작은 오퍼를 보내보기 (모집 아니라 ‘의견 듣기’)",
    "고객의 말 3개를 모아 진짜 문제를 한 줄로 좁히기",
  ];
  const mid = [
    "작게라도 첫 수익을 한 번 내보기",
    "반복되는 문제 1개로 오퍼를 다듬어 고정하기",
  ];
  return { shortTerm: short, midTerm: mid };
}

// ── 오늘의 추천 (S5 #1~4, 매일 회전) ─────────────────────────
export interface TodaysPick {
  category: string;
  icon: string;
  text: string;
}

export function todaysPick(
  report: ReportSection | undefined,
  now: Date = new Date(),
): TodaysPick | null {
  if (!report) return null;
  const pool: TodaysPick[] = [];
  if (report.firstAction)
    pool.push({ category: "오늘의 행동", icon: "✅", text: report.firstAction });
  if (report.whatToLearn?.[0])
    pool.push({ category: "오늘 공부할 것", icon: "📚", text: report.whatToLearn[0] });
  if (report.peopleToReach?.[0])
    pool.push({ category: "오늘 연결해볼 것", icon: "🤝", text: report.peopleToReach[0] });
  if (report.toolsToTry?.[0])
    pool.push({ category: "오늘 써볼 도구", icon: "🛠", text: report.toolsToTry[0] });
  if (pool.length === 0) return null;
  const dayIndex = Math.floor(now.getTime() / 86_400_000);
  return pool[dayIndex % pool.length];
}
