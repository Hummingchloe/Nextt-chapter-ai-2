import assert from "node:assert/strict";
import test from "node:test";
import { buildOnboardingCompassInput } from "../lib/onboarding-compass-bridge";
import type { RecommendationOutput, ReportSection } from "../lib/types";

const report: ReportSection = {
  summary: "금융권 운영 경험을 바탕으로 반복 업무를 쉽게 풀어줄 수 있어요.",
  strengths: ["금융권 운영 15년", "반복 업무 자동화 요청을 자주 받음"],
  directions: [{ label: "1:1 가이드", why: "깊은 실무 경험을 바로 활용할 수 있어서" }],
  topRecommendation: {
    label: "1:1 가이드",
    reasons: ["기존 전문성과 고객 접점이 잘 맞음"],
  },
  offerDraft: "금융 실무자를 위한 자동화 첫걸음 상담",
  marketCheck: {
    verdict: "ready_to_test",
    score: 80,
    demandSignals: ["동료들이 자동화 방법을 반복해서 물어봄"],
    riskSignals: [],
    coaching: "작게 제안해보세요.",
    validationQuestion: "가장 오래 걸리는 반복 업무는 무엇인가요?",
    firstExperiment: "동료 한 명에게 상담을 제안합니다.",
    sources: [],
  },
  customerChannels: ["기존 동료"],
  firstAction: "이번 주 한 사람에게 안내문 보내기",
  closing: "작게 시작해도 충분합니다.",
};

const recommendation: RecommendationOutput = {
  predictedUserTypes: ["expert"],
  primaryUserType: "expert",
  assetTypes: ["professional"],
  scores: [],
  candidateDirections: [],
  topDirection: {
    id: "one-on-one",
    label: "1:1 가이드",
    total: 90,
    breakdown: {
      experienceFit: 20,
      workStyleFit: 20,
      timeFit: 20,
      startEase: 15,
      customerAccess: 15,
    },
  },
};

test("builds a compact, labelled Compass seed from onboarding results", () => {
  const input = buildOnboardingCompassInput(report, recommendation);

  assert.match(input, /경험과 강점: 금융권 운영 15년/);
  assert.match(input, /시장 신호: 동료들이 자동화 방법을 반복해서 물어봄/);
  assert.match(input, /이번 주 첫 행동: 이번 주 한 사람에게 안내문 보내기/);
  assert.ok(input.length <= 4000);
});
