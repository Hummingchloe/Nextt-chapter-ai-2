// ─────────────────────────────────────────────────────────────
// Candidate direction pool. Each direction carries profile weights
// the rule-based engine scores against. Editable & inspectable.
// ─────────────────────────────────────────────────────────────

import type { AssetType, WorkStyle } from "./types";

export interface DirectionProfile {
  id: string;
  label: string; // user-facing Korean label
  blurb: string; // one-line description
  // Which work styles this direction fits best
  styles: WorkStyle[];
  // Which asset types this direction draws on
  assets: AssetType[];
  // Lower = needs less time. 1 (very light) .. 3 (heavier)
  timeNeed: 1 | 2 | 3;
  // How easy to start from zero. 2 = very easy, 1 = some setup, 0 = heavy
  startEase: 0 | 1 | 2;
  // How reachable the first customers are. 2 = easy, 1 = medium, 0 = hard
  customerAccess: 0 | 1 | 2;
  // Format fit
  formats: ("online" | "offline" | "both")[];
  // Maps to the "direction_interest" question option ids it aligns with
  interestTags: string[];
}

export const DIRECTIONS: DirectionProfile[] = [
  {
    id: "one_on_one_guide",
    label: "1:1 가이드 서비스",
    blurb: "한 사람의 상황에 맞춰 곁에서 차근차근 도와주는 일",
    styles: ["one_on_one"],
    assets: ["life", "professional", "community"],
    timeNeed: 1,
    startEase: 2,
    customerAccess: 2,
    formats: ["online", "offline", "both"],
    interestTags: ["guide"],
  },
  {
    id: "one_on_one_consulting",
    label: "1:1 컨설팅 / 경험 상담",
    blurb: "내 전문성과 경험으로 한 사람의 고민에 구체적 조언을 주는 일",
    styles: ["one_on_one", "teach"],
    assets: ["professional", "life"],
    timeNeed: 1,
    startEase: 2,
    customerAccess: 1,
    formats: ["online", "both"],
    interestTags: ["consult"],
  },
  {
    id: "small_class",
    label: "소규모 실전 클래스",
    blurb: "내가 잘하는 걸 작은 그룹에게 직접 가르치는 일",
    styles: ["teach", "small_group"],
    assets: ["professional", "life"],
    timeNeed: 2,
    startEase: 1,
    customerAccess: 1,
    formats: ["online", "offline", "both"],
    interestTags: ["class"],
  },
  {
    id: "digital_guide",
    label: "정보 정리형 디지털 가이드",
    blurb: "내 경험을 정리해 누구나 따라 할 수 있는 자료로 만드는 일",
    styles: ["make_alone"],
    assets: ["life", "professional", "ai"],
    timeNeed: 2,
    startEase: 1,
    customerAccess: 1,
    formats: ["online"],
    interestTags: ["digital"],
  },
  {
    id: "ai_beginner_help",
    label: "AI 초보자 도움 서비스",
    blurb: "AI를 어려워하는 사람들을 옆에서 쉽게 도와주는 일",
    styles: ["one_on_one", "teach"],
    assets: ["ai", "life"],
    timeNeed: 1,
    startEase: 2,
    customerAccess: 2,
    formats: ["online", "both"],
    interestTags: ["ai_help"],
  },
  {
    id: "community_program",
    label: "커뮤니티 연결형 프로그램",
    blurb: "비슷한 처지의 사람들을 모으고 연결해주는 일",
    styles: ["connect", "small_group"],
    assets: ["community", "life"],
    timeNeed: 2,
    startEase: 1,
    customerAccess: 2,
    formats: ["offline", "both", "online"],
    interestTags: ["community"],
  },
  {
    id: "local_life_guide",
    label: "전환기 동행 가이드",
    blurb: "직무·산업·환경 전환을 먼저 겪어본 경험으로, 같은 길을 걷는 사람을 돕는 일",
    styles: ["one_on_one", "connect"],
    assets: ["life", "community"],
    timeNeed: 1,
    startEase: 2,
    customerAccess: 2,
    formats: ["offline", "both"],
    interestTags: ["guide", "community"],
  },
  {
    id: "experience_support",
    label: "경험 기반 상담형 서비스",
    blurb: "내가 먼저 겪어본 일을 바탕으로 마음과 방향을 잡아주는 일",
    styles: ["one_on_one", "teach"],
    assets: ["life", "community"],
    timeNeed: 1,
    startEase: 2,
    customerAccess: 1,
    formats: ["online", "offline", "both"],
    interestTags: ["consult", "guide"],
  },
];

export const DIRECTION_BY_ID: Record<string, DirectionProfile> =
  Object.fromEntries(DIRECTIONS.map((d) => [d.id, d]));
