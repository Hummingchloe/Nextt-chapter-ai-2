import type { RecommendationOutput, ReportSection } from "./types";

// Keep the first Compass input compact and explicitly labelled so both the
// LLM extractor and deterministic fallback can distinguish records, market
// signals, and actions without importing the full onboarding report.
export function buildOnboardingCompassInput(
  report: ReportSection,
  recommendation: RecommendationOutput,
): string {
  const lines = [
    "[온보딩 리포트에서 가져온 초기 방향]",
    `요약: ${report.summary}`,
    ...report.strengths.slice(0, 3).map((item) => `경험과 강점: ${item}`),
    `추천 방향: ${report.topRecommendation.label}`,
    ...report.topRecommendation.reasons.slice(0, 3).map((item) => `추천 근거: ${item}`),
    `추천 사용자 유형: ${recommendation.primaryUserType}`,
    `첫 오퍼 가설: ${report.offerDraft}`,
    ...(report.marketCheck?.demandSignals ?? [])
      .slice(0, 3)
      .map((item) => `시장 신호: ${item}`),
    `이번 주 첫 행동: ${report.firstAction}`,
  ];

  return lines
    .map((line) => line.trim())
    .filter((line) => !line.endsWith(":"))
    .join("\n")
    .slice(0, 4000);
}
