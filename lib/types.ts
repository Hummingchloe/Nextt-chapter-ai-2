// ─────────────────────────────────────────────────────────────
// Core domain types for My Next Chapter AI (MVP1)
// ─────────────────────────────────────────────────────────────

export type AnswerType = "single" | "text";

export type AnswerValue = string; // single → option id, text → raw string

export type QuestionResponseMap = Record<string, AnswerValue>;

export type AssetType =
  | "professional" // 전문성 자산
  | "life" // 생활 경험 자산
  | "ai" // AI/디지털 자산
  | "community"; // 관계/커뮤니티 자산

export type UserType =
  | "career_reboot"
  | "expert"
  | "ai_curious"
  | "community_connector";

export type WorkStyle =
  | "one_on_one"
  | "small_group"
  | "make_alone"
  | "teach"
  | "connect";

export interface DirectionScore {
  id: string;
  label: string;
  total: number;
  breakdown: {
    experienceFit: number;
    workStyleFit: number;
    timeFit: number;
    startEase: number;
    customerAccess: number;
  };
}

export interface RecommendationOutput {
  predictedUserTypes: UserType[];
  primaryUserType: UserType;
  assetTypes: AssetType[];
  scores: DirectionScore[]; // sorted desc, full list
  candidateDirections: DirectionScore[]; // top 3
  topDirection: DirectionScore; // top 1
}

export interface ReportSection {
  summary: string;
  strengths: string[];
  directions: { label: string; why: string }[];
  topRecommendation: { label: string; reasons: string[] };
  offerDraft: string;
  customerChannels: string[];
  firstAction: string;
  closing: string;
}

export interface DiagnosticSession {
  id: string;
  name?: string;
  email?: string;
  locale: string;
  status: "started" | "completed";
  startedAt: string;
  completedAt?: string;
  completionTimeSeconds?: number;
  predictedUserType?: UserType;
  topRecommendedDirection?: string;
  answers: QuestionResponseMap;
  recommendation?: RecommendationOutput;
  report?: ReportSection;
  device?: "mobile" | "desktop";
}

export interface AnalyticsEvent {
  id: string;
  sessionId?: string;
  type: string;
  meta?: Record<string, unknown>;
  at: string;
}

export interface DB {
  sessions: DiagnosticSession[];
  events: AnalyticsEvent[];
}
