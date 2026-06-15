// ─────────────────────────────────────────────────────────────
// Diagnostic question set — config-driven, editable.
// Korean, everyday language (no startup jargon). Mobile-first.
// Preserve intent from PRD; wording softened for warmth.
// ─────────────────────────────────────────────────────────────

import type { AnswerType } from "./types";

export interface QuestionOption {
  id: string;
  label: string;
}

export interface Question {
  key: string;
  type: AnswerType;
  // Short section label shown above the question
  section: string;
  prompt: string;
  helper?: string;
  placeholder?: string; // for text type
  optional?: boolean; // text answers can be skippable
  options?: QuestionOption[];
}

// A gentle mid-flow reflection is shown after this question key.
export const MID_SUMMARY_AFTER_KEY = "good_at_unpaid";

export const QUESTIONS: Question[] = [
  {
    key: "current_thought",
    type: "single",
    section: "지금의 마음",
    prompt: "요즘 가장 자주 드는 생각은 무엇에 가까운가요?",
    helper: "가장 가까운 하나만 골라주세요.",
    options: [
      { id: "earn_again", label: "다시 내 힘으로 돈을 벌고 싶어요" },
      { id: "dont_know", label: "내가 뭘 할 수 있을지 잘 모르겠어요" },
      { id: "is_it_valuable", label: "내 경험이 정말 가치가 있는지 궁금해요" },
      { id: "connect_ai", label: "배운 AI를 내 일과 연결해보고 싶어요" },
      { id: "alongside_family", label: "집과 육아와 함께 할 수 있는 일을 찾고 있어요" },
    ],
  },
  {
    key: "current_state",
    type: "single",
    section: "지금의 마음",
    prompt: "지금 상태는 무엇에 더 가깝나요?",
    options: [
      { id: "no_idea", label: "어디서부터 시작해야 할지 막막해요" },
      { id: "vague_ideas", label: "어렴풋한 생각은 있는데 확신이 없어요" },
      { id: "can_do_no_income", label: "할 수 있는 건 있는데, 어떻게 수입으로 만들지 모르겠어요" },
      { id: "good_cant_offer", label: "잘하는 게 있는데, 어떻게 설명하고 제안할지 모르겠어요" },
    ],
  },
  {
    key: "korea_experience",
    type: "text",
    section: "나의 경험",
    prompt: "한국에서 했던 일이나, 오래 해본 일은 무엇인가요?",
    helper: "직업이 아니어도 괜찮아요. 오래 해본 거라면 무엇이든요.",
    placeholder: "예) 학원에서 영어를 가르쳤어요 / 회사에서 회계 일을 오래 했어요",
    optional: true,
  },
  {
    key: "us_experience",
    type: "text",
    section: "나의 경험",
    prompt: "미국에서 자주 맡게 되는 역할은 무엇인가요?",
    helper: "공식적인 일이 아니어도 좋아요.",
    placeholder: "예) 새로 온 분들 정착을 도와줘요 / 아이 학교 일을 자주 맡아요",
    optional: true,
  },
  {
    key: "often_asked",
    type: "text",
    section: "나의 경험",
    prompt: "주변 사람들이 자주 부탁하거나 물어보는 건 무엇인가요?",
    helper: "사람들이 당신을 어떤 일로 찾는지 떠올려 보세요.",
    placeholder: "예) 서류 정리, 통역, 아이 교육 상담, 살림 노하우…",
    optional: true,
  },
  {
    key: "good_at_unpaid",
    type: "text",
    section: "나의 강점",
    prompt: "돈을 받지 않아도, 내가 잘한다고 느끼는 건 무엇인가요?",
    helper: "작은 거라도 좋아요. 자연스럽게 잘 되는 것.",
    placeholder: "예) 사람 이야기를 잘 들어줘요 / 복잡한 걸 쉽게 정리해요",
    optional: true,
  },
  {
    key: "work_style",
    type: "single",
    section: "나에게 맞는 방식",
    prompt: "어떤 방식의 일이 더 잘 맞나요?",
    options: [
      { id: "one_on_one", label: "한 사람을 1:1로 돕는 일" },
      { id: "small_group", label: "작은 그룹을 이끄는 일" },
      { id: "make_alone", label: "혼자 무언가를 만들고 정리하는 일" },
      { id: "teach", label: "설명하고 가르치는 일" },
      { id: "connect", label: "사람과 사람을 연결하는 일" },
    ],
  },
  {
    key: "energy_giving",
    type: "text",
    section: "나에게 맞는 방식",
    prompt: "어떤 일을 할 때 오히려 에너지가 차오르나요?",
    placeholder: "예) 누군가의 고민이 풀릴 때 / 무언가를 깔끔하게 정리했을 때",
    optional: true,
  },
  {
    key: "dont_want",
    type: "text",
    section: "나에게 맞는 방식",
    prompt: "잘할 수 있어도, 오래 하기는 싫은 일은 무엇인가요?",
    helper: "피하고 싶은 걸 알면 방향이 더 선명해져요.",
    placeholder: "예) 계속 영업 전화 돌리는 일 / 종일 혼자 있는 일",
    optional: true,
  },
  {
    key: "time_available",
    type: "single",
    section: "나의 현실",
    prompt: "지금 일에 쓸 수 있는 시간은 어느 정도인가요?",
    options: [
      { id: "under_30", label: "하루 30분 이하" },
      { id: "about_1h", label: "하루 1시간 정도" },
      { id: "about_2h", label: "하루 2시간 정도" },
      { id: "weekends", label: "주로 주말에" },
      { id: "irregular", label: "불규칙해요" },
    ],
  },
  {
    key: "format",
    type: "single",
    section: "나의 현실",
    prompt: "지금은 어떤 형태가 더 현실적인가요?",
    options: [
      { id: "online", label: "온라인" },
      { id: "offline", label: "오프라인 / 동네에서" },
      { id: "both", label: "둘 다 괜찮아요" },
    ],
  },
  {
    key: "want_most",
    type: "single",
    section: "지금 원하는 것",
    prompt: "지금 가장 원하는 것은 무엇인가요?",
    options: [
      { id: "quick_small", label: "작더라도 빨리 수입을 만들고 싶어요" },
      { id: "find_direction", label: "먼저 방향부터 정하고 싶어요" },
      { id: "grow_my_work", label: "내 일로 키울 수 있는 걸 만들고 싶어요" },
      { id: "test_small", label: "부담 없이 작게 한번 시험해보고 싶어요" },
    ],
  },
  {
    key: "direction_interest",
    type: "single",
    section: "끌리는 방향",
    prompt: "다음 중 지금 가장 끌리거나, 부담이 가장 적어 보이는 건 무엇인가요?",
    helper: "직감으로 골라도 좋아요.",
    options: [
      { id: "guide", label: "한 사람을 곁에서 도와주는 일" },
      { id: "consult", label: "내 경험으로 조언해주는 일" },
      { id: "class", label: "작게 가르치는 클래스" },
      { id: "digital", label: "정보를 정리한 디지털 가이드 만들기" },
      { id: "ai_help", label: "AI를 어려워하는 사람 돕기" },
      { id: "community", label: "사람들을 모으고 연결하기" },
    ],
  },
  {
    key: "biggest_blocker",
    type: "single",
    section: "마지막 한 가지",
    prompt: "시작을 가장 망설이게 하는 건 무엇인가요?",
    options: [
      { id: "not_good_enough", label: "내가 충분히 잘하는 건지 확신이 없어요" },
      { id: "would_anyone_pay", label: "누가 돈을 낼지 모르겠어요" },
      { id: "no_time", label: "시간이 부족해요" },
      { id: "cant_describe", label: "어떻게 설명해야 할지 모르겠어요" },
      { id: "need_more_ready", label: "더 준비가 된 다음에 해야 할 것 같아요" },
    ],
  },
];

export const QUESTION_BY_KEY: Record<string, Question> = Object.fromEntries(
  QUESTIONS.map((q) => [q.key, q]),
);

export function optionLabel(key: string, optionId?: string): string {
  if (!optionId) return "";
  const q = QUESTION_BY_KEY[key];
  return q?.options?.find((o) => o.id === optionId)?.label ?? optionId;
}
