// ─────────────────────────────────────────────────────────────
// Expert Lens v0 (전문가 렌즈).
// Translates the user's *blocker* into: an expert perspective, what to
// search for, how to apply it to her situation, today's tiny action, and
// a ready-to-send outreach draft.
//
// v0 is deterministic + curated. To avoid the "전문가 환각" risk the spec
// warns about, it does NOT fabricate specific article/video links — it
// gives honest search hints. When a search API key is added later, EX-A
// can replace searchHints with real, dated, sourced resources.
// LinkedIn is never scraped — only an outreach draft the user sends herself.
// ─────────────────────────────────────────────────────────────

import { DIRECTION_BY_ID } from "./directions";
import type { DailyNote, DiagnosticSession } from "./types";

export interface ExpertLens {
  blocker: string; // 지금 막힌 지점
  perspective: string; // 참고하면 좋은 관점
  searchHints: string[]; // 찾아보면 좋은 것 (정직한 검색어)
  apply: string; // 내 상황에 적용하면
  action: string; // 오늘의 작은 행동
  outreachDraft: string; // 보낼 수 있는 메시지 초안
}

function clip(s?: string, n = 22): string {
  const t = (s ?? "").trim().replace(/\s+/g, " ");
  return t.length <= n ? t : t.slice(0, n).trim() + "…";
}

interface LensTemplate {
  blocker: string;
  perspective: string;
  searchHints: string[];
  apply: (topic: string, direction?: string) => string;
  action: (topic: string) => string;
}

const TEMPLATES: Record<string, LensTemplate> = {
  not_good_enough: {
    blocker: "내가 충분히 잘하는지 확신이 없음",
    perspective:
      "전문성은 ‘많이 아는 것’이 아니라 ‘한 사람의 다음 한 걸음을 풀어주는 것’이에요. 첫 고객에게는 지금의 당신으로 충분해요.",
    searchHints: ["‘작게 시작한 1인 창업’ 인터뷰", "‘imposter syndrome 극복’ 이야기"],
    apply: (t) =>
      `‘완벽한 전문가가 된 다음’이 아니라, ‘${t}로 지금 바로 도울 수 있는 1명’부터 정해보세요.`,
    action: () => "지금 바로 도울 수 있는 사람 1명을 떠올려 이름을 적어보세요.",
  },
  would_anyone_pay: {
    blocker: "누가 돈을 낼지 모르겠음",
    perspective:
      "수요는 ‘시장’이 아니라 ‘반복되는 불편’에서 나와요. 사람들이 이미 시간이나 돈을 쓰고 있는 문제를 찾으면 돼요.",
    searchHints: ["‘첫 유료 고객 찾기’ 사례", "‘마이크로 오퍼 가격 책정’ 글"],
    apply: (t) =>
      `‘${t}’를 무료로 한 번 해주고, 끝나고 “도움이 됐다면 얼마면 적당할까요?”라고 물어보세요.`,
    action: () => "지인 1명에게 작은 유료 테스트(‘유료라면 얼마?’)를 제안해보세요.",
  },
  no_time: {
    blocker: "시간이 부족함",
    perspective:
      "시간이 없을수록 ‘완성’이 아니라 ‘15분 실험’으로 쪼개야 해요. 큰 덩어리가 아니라 한 번의 대화면 충분해요.",
    searchHints: ["‘바쁜 사람 사이드 프로젝트’ 사례", "‘15분 단위로 일하기’ 글"],
    apply: () =>
      "이번 일을 ‘오늘 15분 안에 할 수 있는 한 조각’으로 잘라보세요. 완성이 아니라 시작만.",
    action: () => "오늘 딱 한 사람에게 한 가지 질문만 보내보세요.",
  },
  cant_describe: {
    blocker: "어떻게 설명할지 모르겠음",
    perspective:
      "좋은 오퍼는 ‘나는 [누구]가 [무엇]을 하도록 돕는다’ 한 줄이에요. 완벽하지 않아도 말해보면서 다듬어져요.",
    searchHints: ["‘한 줄 오퍼 만들기’ 글", "‘value proposition 예시’ 영상"],
    apply: (t, d) =>
      `‘${d ?? t}’를 “나는 ○○한 사람이 ○○하도록 돕는다” 한 줄로 써보세요.`,
    action: () => "오퍼를 한 문장으로 써서 지인에게 “이거 무슨 뜻 같아요?” 물어보세요.",
  },
  need_more_ready: {
    blocker: "더 준비된 다음에 해야 할 것 같음",
    perspective:
      "준비가 끝나는 날은 오지 않아요. 시작이 당신을 준비시켜요. 가장 작은 실험 1개가 다음에 뭘 준비할지 알려줘요.",
    searchHints: ["‘일단 시작한 사람’ 인터뷰", "‘MVP 작게 출시’ 사례"],
    apply: () =>
      "‘준비’ 대신 ‘이번 주에 할 수 있는 가장 작은 실험 1개’를 정해보세요.",
    action: () => "오늘 1명에게 가볍게 의견을 묻는 메시지를 보내보세요.",
  },
};

const DEFAULT_TEMPLATE = TEMPLATES.cant_describe;

export function buildExpertLens(
  session: DiagnosticSession,
  notes: DailyNote[],
): ExpertLens {
  const a = session.answers;
  const tpl = TEMPLATES[a.biggest_blocker] ?? DEFAULT_TEMPLATE;

  const direction = session.report?.topRecommendation.label;
  const dirId = session.recommendation?.topDirection.id;
  const dirBlurbTopic =
    dirId && DIRECTION_BY_ID[dirId] ? DIRECTION_BY_ID[dirId].label : direction;
  const topic =
    clip(a.good_at_unpaid) || clip(a.often_asked) || dirBlurbTopic || "내가 잘하는 것";

  // Recent friction softens the action a touch (no-guilt).
  const recentMoods = notes.slice(-4).map((n) => n.moodTag);
  const lowEnergy =
    recentMoods.includes("tired") || recentMoods.includes("anxious");

  const action = lowEnergy
    ? `${tpl.action(topic)} (오늘 부담되면, 머릿속으로 한 명만 떠올려도 충분해요.)`
    : tpl.action(topic);

  const outreachDraft = `안녕하세요 :) 제가 요즘 ‘${topic}’로 작게 도와드리는 걸 시작해보려고 해요. 혹시 30분만, 이걸 시작하면서 가장 막히는 점이 뭔지 의견 들려주실 수 있을까요? 부담 없이 편하게요!`;

  return {
    blocker: tpl.blocker,
    perspective: tpl.perspective,
    searchHints: tpl.searchHints,
    apply: tpl.apply(topic, direction),
    action,
    outreachDraft,
  };
}
