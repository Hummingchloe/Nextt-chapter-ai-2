// ─────────────────────────────────────────────────────────────
// Test personas — realistic sample inputs matching the target user:
// 35-55 experienced professionals who want to turn experience, skills,
// and networks into new income opportunities in the AI era.
//
// Flip TEST_TOOLS_ENABLED to false before a public launch to hide the
// example helpers from real users.
// ─────────────────────────────────────────────────────────────

import type { QuestionResponseMap } from "./types";

export const TEST_TOOLS_ENABLED = true;

export interface Persona {
  id: string;
  name: string;
  emoji: string;
  type: string; // user-type label for the picker
  summary: string; // one-line who-she-is
  answers: QuestionResponseMap; // full 14-question answer set
}

export const PERSONAS: Persona[] = [
  {
    id: "career_reboot",
    name: "민서",
    emoji: "🌱",
    type: "전환을 준비하는 경험자",
    summary: "금융 운영 15년차. 자동화와 정리 역량을 새 수익으로 연결하고 싶음",
    answers: {
      current_thought: "dont_know",
      current_state: "no_idea",
      korea_experience:
        "금융권 운영팀에서 15년 일했어요. 리스크 체크와 보고서 정리를 오래 했습니다.",
      us_experience:
        "최근에는 팀 안에서 반복 업무를 줄이는 자동화 아이디어를 자주 제안하고 있어요.",
      often_asked: "엑셀 정리나 반복 업무 자동화를 어떻게 시작하냐고 자주 물어봐요.",
      good_at_unpaid:
        "복잡한 숫자나 프로세스를 꼼꼼하게 정리하는 거요. 표와 체크리스트로 만들면 마음이 편해져요.",
      work_style: "one_on_one",
      energy_giving: "누군가의 복잡한 문제가 깔끔하게 정리됐을 때요.",
      dont_want: "사람들 앞에서 발표하거나 영업 전화를 돌리는 일이요.",
      time_available: "about_1h",
      format: "online",
      want_most: "find_direction",
      direction_interest: "guide",
      biggest_blocker: "not_good_enough",
    },
  },
  {
    id: "expert",
    name: "정아",
    emoji: "📚",
    type: "이미 자산이 있는 전문가",
    summary: "교육/코칭 10년. 쉽게 설명하는 데 강점",
    answers: {
      current_thought: "is_it_valuable",
      current_state: "good_cant_offer",
      korea_experience: "한국에서 교육 콘텐츠와 강의를 10년 했어요.",
      us_experience:
        "요즘은 직장인들이 AI 도구를 업무에 붙이는 방법을 알려주고 있어요.",
      often_asked:
        "AI를 어디서부터 배워야 하는지, 내 업무에 어떻게 써야 하는지 자주 물어봐요.",
      good_at_unpaid:
        "어려운 걸 아주 쉽게 풀어 설명하는 거요. 못 따라오던 아이도 제 설명은 이해해요.",
      work_style: "teach",
      energy_giving: "막막해하던 사람이 ‘아, 이제 알겠어요’ 할 때요.",
      dont_want: "행정 서류 작업이나 똑같은 걸 반복하는 일이요.",
      time_available: "about_2h",
      format: "both",
      want_most: "grow_my_work",
      direction_interest: "class",
      biggest_blocker: "cant_describe",
    },
  },
  {
    id: "ai_curious",
    name: "보라",
    emoji: "✨",
    type: "AI를 연결하려는 전문가",
    summary: "전직 마케터. 챗GPT·캔바를 빨리 익혀 알려주는 걸 좋아함",
    answers: {
      current_thought: "connect_ai",
      current_state: "vague_ideas",
      korea_experience: "브랜드 마케팅과 콘텐츠 기획을 12년 했어요. 디자인도 조금 했고요.",
      us_experience:
        "요즘 챗GPT랑 캔바로 제안서와 안내문을 빠르게 만드는 걸 자주 도와줘요.",
      often_asked: "AI 어떻게 쓰는지, 챗GPT로 뭘 할 수 있는지 물어봐요.",
      good_at_unpaid:
        "새로운 앱이나 AI 도구를 빨리 익혀서 쉽게 알려주는 거요.",
      work_style: "teach",
      energy_giving: "AI를 무서워하던 분이 직접 해보고 신기해할 때요.",
      dont_want: "혼자 종일 컴퓨터만 붙잡고 있는 일이요.",
      time_available: "about_1h",
      format: "online",
      want_most: "test_small",
      direction_interest: "ai_help",
      biggest_blocker: "would_anyone_pay",
    },
  },
  {
    id: "community_connector",
    name: "은영",
    emoji: "🤝",
    type: "사람을 잇는 커넥터",
    summary: "커뮤니티 운영과 소개 연결에 강점. 전환기 사람들을 많이 도와옴",
    answers: {
      current_thought: "alongside_family",
      current_state: "can_do_no_income",
      korea_experience:
        "여러 프로젝트에서 사람을 모으고 행사와 커뮤니티를 운영하는 일을 많이 했어요.",
      us_experience:
        "새 분야로 넘어가려는 사람들에게 필요한 사람과 정보를 연결해주는 일을 자주 해요.",
      often_asked:
        "이직이나 새 프로젝트를 시작할 때 누구를 만나야 하냐고 자주 물어봐요.",
      good_at_unpaid:
        "사람들을 연결해주고, 필요한 정보를 모아서 알려주는 거요.",
      work_style: "connect",
      energy_giving: "내가 소개해준 사람들이 서로 도움이 됐다고 할 때요.",
      dont_want: "혼자 책상에 앉아 문서만 만드는 일이요.",
      time_available: "weekends",
      format: "offline",
      want_most: "quick_small",
      direction_interest: "community",
      biggest_blocker: "need_more_ready",
    },
  },
  {
    id: "life_experience",
    name: "수진",
    emoji: "🌷",
    type: "삶의 경험이 자산인 전문가",
    summary: "운영과 고객 응대 경험이 깊고, 같은 전환을 겪는 사람을 잘 도와옴",
    answers: {
      current_thought: "earn_again",
      current_state: "vague_ideas",
      korea_experience: "작은 매장을 운영했고 고객 응대와 서비스 운영을 오래 했어요.",
      us_experience:
        "최근에는 오프라인 서비스를 온라인 예약과 콘텐츠로 바꾸는 방법을 고민하고 있어요.",
      often_asked:
        "작은 서비스를 어떻게 다시 포장하고 고객에게 알려야 하냐고 자주 물어봐요.",
      good_at_unpaid:
        "내가 먼저 겪어본 걸 바탕으로, 막막한 사람의 마음을 편하게 해주는 거요.",
      work_style: "one_on_one",
      energy_giving: "나처럼 헤매던 사람이 안심하고 방향을 잡을 때요.",
      dont_want: "감정 없이 사무적으로만 처리하는 일이요.",
      time_available: "under_30",
      format: "both",
      want_most: "find_direction",
      direction_interest: "consult",
      biggest_blocker: "no_time",
    },
  },
  {
    id: "aspiring_youth",
    name: "준호",
    emoji: "🚀",
    type: "새 수익 실험을 준비하는 직장인",
    summary: "IT PM 출신, 사이드 프로젝트 경험. 무엇을 팔 수 있을지 실험하고 싶음",
    answers: {
      current_thought: "dont_know",
      current_state: "vague_ideas",
      korea_experience:
        "IT 회사에서 PM으로 일했고 작은 사이드 프로젝트를 몇 개 만들어봤어요. 코딩도 조금 해요.",
      us_experience:
        "글로벌 커뮤니티와 해커톤에서 사람들을 만나며 AI 서비스 아이디어를 시험하고 있어요.",
      often_asked: "AI 툴 어떻게 쓰는지, 사이드 프로젝트 어떻게 시작하는지 물어봐요.",
      good_at_unpaid: "새로운 걸 빨리 배워서 일단 만들어보는 거요.",
      work_style: "make_alone",
      energy_giving: "내가 만든 걸 누군가 실제로 써줄 때요.",
      dont_want: "반복적인 사무 작업이요.",
      time_available: "about_2h",
      format: "online",
      want_most: "grow_my_work",
      direction_interest: "digital",
      biggest_blocker: "would_anyone_pay",
    },
  },
];

export const PERSONA_BY_ID: Record<string, Persona> = Object.fromEntries(
  PERSONAS.map((p) => [p.id, p]),
);
