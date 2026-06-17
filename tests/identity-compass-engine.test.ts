import test from 'node:test';
import assert from 'node:assert/strict';
import { analyzeIdentityCompass, extractCompassSignals, simulateOfferAlignment } from '../lib/identity-compass-engine.ts';
import type { DiagnosticSession, DailyNote } from '../lib/types.ts';

const baseSession: DiagnosticSession = {
  id: 's1',
  locale: 'ko',
  status: 'completed',
  startedAt: '2026-06-17T00:00:00.000Z',
  completedAt: '2026-06-17T00:10:00.000Z',
  answers: {
    current_state: 'good_cant_offer',
    work_style: 'one_on_one',
    want_most: 'grow_my_work',
    direction_interest: 'ai_help',
    good_at_unpaid: '복잡한 내용을 쉽게 정리하고 설명해요',
    often_asked: 'AI를 어떻게 내 일에 쓰는지 자주 물어봐요',
    energy_giving: '누군가 막힌 부분을 이해하고 다음 행동을 찾을 때 에너지가 나요',
    dont_want: '정해진 매뉴얼만 반복하는 일',
    biggest_blocker: 'cant_describe',
  },
};

const notes: DailyNote[] = [
  {
    id: 'n1',
    sessionId: 's1',
    createdAt: '2026-06-17T01:00:00.000Z',
    date: '2026-06-17',
    todayAction: '지인에게 AI 활용에서 가장 막히는 점을 물었다',
    moodTag: 'hopeful',
    customerVoice: 'AI는 배웠는데 내 사업에 어떻게 붙일지 모르겠다고 했다',
    insight: '사람들은 도구보다 자기 상황에 맞는 첫 행동을 원한다',
    nextStep: '오퍼 한 문장 써보기',
  },
];

test('extracts decision emotion pattern signals from context-first inputs', () => {
  const signals = extractCompassSignals(baseSession, notes);
  assert.ok(signals.length >= 8);
  assert.ok(signals.some((s) => s.type === 'decision'));
  assert.ok(signals.some((s) => s.type === 'emotion'));
  assert.ok(signals.some((s) => s.type === 'pattern'));
  assert.ok(signals.every((s) => s.direction.length === 3));
});

test('computes evolving H one-liner, alignment, clarity, and offer readiness', () => {
  const analysis = analyzeIdentityCompass(baseSession, notes);
  assert.ok(analysis.h.oneLiner.includes('사람'));
  assert.ok(analysis.h.confidence > 0.5);
  assert.ok(analysis.alignment >= 0 && analysis.alignment <= 1);
  assert.ok(analysis.clarity > 50);
  assert.notEqual(analysis.offer.readiness, 'not_ready');
  assert.ok(analysis.offer.confidence > 0.4);
});

test('low-context user falls back to adaptive questions before strong offer recommendation', () => {
  const sparse: DiagnosticSession = {
    ...baseSession,
    id: 's2',
    answers: { current_state: 'no_idea' },
  };
  const analysis = analyzeIdentityCompass(sparse, []);
  assert.equal(analysis.offer.readiness, 'not_ready');
  assert.ok(analysis.adaptiveQuestions.length >= 1);
  assert.ok(analysis.h.confidence < 0.55);
});

test('simulates whether a candidate offer aligns with current H', () => {
  const analysis = analyzeIdentityCompass(baseSession, notes);
  const sim = simulateOfferAlignment(analysis, [0.6, 0.5, 0.8]);
  assert.ok(sim.after >= 0 && sim.after <= 1);
  assert.ok(Number.isFinite(sim.delta));
});
