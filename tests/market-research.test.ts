import test from "node:test";
import assert from "node:assert/strict";

import {
  applyWebResearch,
  researchMarket,
} from "../lib/market-research.ts";
import { buildReport } from "../lib/report.ts";
import { runRecommendation } from "../lib/engine.ts";
import { PERSONA_BY_ID } from "../lib/personas.ts";

function baseReport() {
  const answers = PERSONA_BY_ID.ai_curious.answers;
  return buildReport(answers, runRecommendation(answers));
}

test("web market research replaces inferred demand with sourced evidence", () => {
  const report = applyWebResearch(baseReport(), {
    searchCount: 2,
    payload: {
      signals: [
        { type: "problem", text: "비개발자의 업무 자동화 설정 어려움이 반복적으로 언급돼요." },
        { type: "payment", text: "유사 자동화 지원 서비스가 실제 가격과 함께 판매되고 있어요." },
        { type: "competition", text: "교육과 구축 대행이라는 기존 대안이 함께 존재해요." },
      ],
      unknowns: ["정확한 고객군의 지불 의사는 아직 직접 확인되지 않았어요."],
    },
    sources: [
      { title: "문제 조사", url: "https://example.com/problem" },
      { title: "가격 조사", url: "https://example.org/price" },
      { title: "경쟁 조사", url: "https://example.net/competition" },
    ],
  });

  assert.equal(report.marketCheck?.researchStatus, "supported");
  assert.equal(report.marketCheck?.sources.length, 3);
  assert.match(report.marketCheck?.demandSignals[0] ?? "", /비개발자/);
  assert.doesNotMatch(
    report.marketCheck?.demandSignals.join("\n") ?? "",
    /첫 고객 후보에게 닿는 경로/,
  );
});

test("fewer than two searches or three sources makes the market decision wait", () => {
  const original = baseReport();
  const report = applyWebResearch(original, {
    searchCount: 1,
    payload: {
      signals: [
        { type: "problem", text: "문제 표현 한 건" },
        { type: "payment", text: "가격 사례 한 건" },
      ],
      unknowns: [],
    },
    sources: [
      { title: "근거 1", url: "https://example.com/1" },
      { title: "근거 2", url: "https://example.com/2" },
    ],
  });

  assert.equal(report.marketCheck?.researchStatus, "insufficient");
  assert.equal(report.marketCheck?.verdict, "needs_evidence");
  assert.ok((report.marketCheck?.score ?? 100) <= 49);
  assert.match(report.marketCheck?.demandSignals[0] ?? "", /교차 확인하지 못했어요/);
});

test("search failure keeps report delivery honest instead of failing completion", () => {
  const report = applyWebResearch(baseReport(), null);

  assert.equal(report.marketCheck?.researchStatus, "unavailable");
  assert.equal(report.marketCheck?.verdict, "needs_evidence");
  assert.ok((report.marketCheck?.score ?? 100) <= 49);
  assert.match(report.marketCheck?.demandSignals[0] ?? "", /판단을 보류/);
});

test("market research requests exactly two searches and keeps cited source URLs", async () => {
  const originalFetch = globalThis.fetch;
  const originalKey = process.env.ANTHROPIC_API_KEY;
  let requestBody: Record<string, unknown> | undefined;
  process.env.ANTHROPIC_API_KEY = "test-key";

  globalThis.fetch = (async (_input, init) => {
    requestBody = JSON.parse(String(init?.body));
    return new Response(
      JSON.stringify({
        content: [
          { type: "server_tool_use", name: "web_search", input: { query: "problem" } },
          { type: "web_search_tool_result", content: [] },
          { type: "server_tool_use", name: "web_search", input: { query: "price" } },
          { type: "web_search_tool_result", content: [] },
          {
            type: "text",
            text: JSON.stringify({
              signals: [
                { type: "problem", text: "반복 문제 근거" },
                { type: "payment", text: "유료 대안 근거" },
              ],
              unknowns: ["직접 지불 의사"],
            }),
            citations: [
              { url: "https://a.example/evidence", title: "근거 A" },
              { url: "https://b.example/evidence", title: "근거 B" },
              { url: "https://c.example/evidence", title: "근거 C" },
            ],
          },
        ],
        usage: { server_tool_use: { web_search_requests: 2 } },
      }),
      { status: 200, headers: { "content-type": "application/json" } },
    );
  }) as typeof fetch;

  try {
    const answers = PERSONA_BY_ID.ai_curious.answers;
    const recommendation = runRecommendation(answers);
    const report = await researchMarket(
      buildReport(answers, recommendation),
      answers,
      recommendation,
    );
    const tools = requestBody?.tools as { max_uses?: number }[] | undefined;

    assert.equal(tools?.[0]?.max_uses, 2);
    assert.equal(report.marketCheck?.researchStatus, "supported");
    assert.equal(report.marketCheck?.sources.length, 3);
  } finally {
    globalThis.fetch = originalFetch;
    if (originalKey === undefined) delete process.env.ANTHROPIC_API_KEY;
    else process.env.ANTHROPIC_API_KEY = originalKey;
  }
});
