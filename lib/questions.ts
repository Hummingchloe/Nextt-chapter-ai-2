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
      { id: "earn_again", label: "지금 일 말고, 내 경험으로 새로운 수익을 만들고 싶어요" },
      { id: "connect_ai", label: "배운/관심 있는 AI를 내 일·경험과 연결해 기회로 만들고 싶어요" },
      { id: "alongside_family", label: "AI 시대에 뒤처질까 좀 불안해요" },
      { id: "is_it_valuable", label: "내 경험·기술이 지금도 가치가 있는지 확인하고 싶어요" },
      { id: "dont_know", label: "뭔가 바꾸고 싶은데, 뭘 할 수 있을지 모르겠어요" },
    ],
  },
  {
    key: "current_state",
    type: "single",
    section: "지금의 마음",
    prompt: "지금 상태는 무엇에 더 가깝나요?",
    options: [
      { id: "no_idea", label: "어디서부터 시작해야 할지 막막해요" },
      { id: "vague_ideas", label: "어렴풋한 아이디어는 있는데 확신이 없어요" },
      { id: "can_do_no_income", label: "할 수 있는 건 있는데, 어떻게 수익으로 연결할지 모르겠어요" },
      { id: "good_cant_offer", label: "전문성은 있는데, 어떻게 상품·서비스로 만들지 막혔어요" },
    ],
  },
  {
    key: "korea_experience",
    type: "text",
    section: "나의 경험·전문성",
    prompt: "지금까지 가장 오래 해왔거나 남보다 익숙한 일·전문성은 무엇인가요?",
    helper: "직함이 아니어도 좋아요. 오래 해온 거라면 무엇이든요.",
    placeholder: "예) 15년 회계 / 브랜드 마케팅 / 학생 가르치기 / 팀·매장 운영",
    optional: true,
  },
  {
    key: "us_experience",
    type: "text",
    section: "나의 경험·전문성",
    prompt: "지금 또는 최근에 주로 맡고 있는 역할은 무엇인가요?",
    helper: "회사 안이든 밖이든, 자연스럽게 맡게 되는 것.",
    placeholder: "예) 프로덕트 매니저 / 프리랜서 디자인 / 자영업 운영 / 일과 생활 병행",
    optional: true,
  },
  {
    key: "often_asked",
    type: "text",
    section: "나의 경험",
    prompt: "주변 사람들이 자주 부탁하거나 물어보는 건 무엇인가요?",
    helper: "사람들이 당신을 어떤 일로 찾는지 떠올려 보세요.",
    placeholder: "예) 이직·커리어 조언 / 엑셀·자동화 / 투자 이야기 / 교육 / 인테리어",
    optional: true,
  },
  {
    key: "good_at_unpaid",
    type: "text",
    section: "나의 강점",
    prompt: "돈을 받지 않아도, 시간 가는 줄 모르고 잘 해내는 건 무엇인가요?",
    helper: "작은 거라도 좋아요. 자연스럽게 잘 되는 것.",
    placeholder: "예) 복잡한 걸 쉽게 설명하기 / 사람 이야기 깊이 듣기 / 데이터로 정리하기",
    optional: true,
  },
  {
    key: "work_style",
    type: "single",
    section: "나에게 맞는 방식",
    prompt: "어떤 방식의 일이 더 잘 맞나요?",
    options: [
      { id: "one_on_one", label: "한 사람을 1:1로 깊이 돕는 일" },
      { id: "small_group", label: "작은 그룹을 이끌고 가르치는 일" },
      { id: "make_alone", label: "혼자 무언가를 만들고 정리하는 일" },
      { id: "teach", label: "설명하고 가르치고 콘텐츠로 풀어내는 일" },
      { id: "connect", label: "사람과 기회를 연결하는 일" },
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
    prompt: "잘할 수 있어도, 더는 하고 싶지 않은 일은 무엇인가요?",
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
      { id: "offline", label: "오프라인 / 내 지역에서" },
      { id: "both", label: "둘 다 괜찮아요" },
    ],
  },
  {
    key: "want_most",
    type: "single",
    section: "지금 원하는 것",
    prompt: "지금 가장 원하는 것은 무엇인가요?",
    options: [
      { id: "quick_small", label: "작더라도 빨리 첫 수익을 내고 싶어요" },
      { id: "find_direction", label: "먼저 방향부터 분명히 하고 싶어요" },
      { id: "grow_my_work", label: "장기적으로 내 일·사업으로 키우고 싶어요" },
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
      { id: "guide", label: "한 사람을 곁에서 돕는 1:1 서비스" },
      { id: "consult", label: "내 전문성으로 컨설팅·자문" },
      { id: "class", label: "작게 가르치는 클래스·워크숍" },
      { id: "digital", label: "지식을 정리한 디지털 콘텐츠·제품" },
      { id: "ai_help", label: "AI를 활용/도와주는 서비스" },
      { id: "community", label: "사람을 모으고 연결하는 커뮤니티" },
    ],
  },
  {
    key: "biggest_blocker",
    type: "single",
    section: "마지막 한 가지",
    prompt: "시작을 가장 망설이게 하는 건 무엇인가요?",
    options: [
      { id: "not_good_enough", label: "내가 충분히 전문가인지 확신이 없어요" },
      { id: "would_anyone_pay", label: "누가 돈을 낼지 모르겠어요" },
      { id: "no_time", label: "시간이 부족해요" },
      { id: "cant_describe", label: "어떻게 설명·포지셔닝할지 모르겠어요" },
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
