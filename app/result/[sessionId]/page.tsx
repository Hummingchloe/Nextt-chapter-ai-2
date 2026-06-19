import Link from "next/link";
import { notFound } from "next/navigation";
import { getSession } from "@/lib/store";
import { reportToText } from "@/lib/report";
import { ASSET_LABEL, USER_TYPE_LABEL } from "@/lib/engine";
import { BRAND } from "@/lib/brand";
import { Wordmark } from "../../components/Logo";
import TrackView from "../../components/TrackView";
import RememberSession from "../../components/RememberSession";
import ExpertLensCard from "../../components/ExpertLensCard";
import { buildExpertLens } from "@/lib/expert-lens";
import ResultActions, { FollowUpCTA } from "./ResultActions";

export const dynamic = "force-dynamic";

const MARKET_STAGE = {
  ready_to_test: {
    label: "시험해볼 단계",
    description: "작은 제안을 실제 사람에게 보여주며 반응을 확인해볼 수 있어요.",
  },
  needs_narrowing: {
    label: "좁혀가는 중",
    description: "누구의 어떤 문제를 풀지 한 번 더 좁히면 검증이 쉬워져요.",
  },
  needs_evidence: {
    label: "신호를 모으는 중",
    description: "가격보다 먼저, 이 문제를 가진 사람의 말을 더 들어볼 때예요.",
  },
} as const;

export default async function ResultPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  const session = await getSession(sessionId);

  if (!session) notFound();
  if (session.status !== "completed" || !session.report || !session.recommendation) {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="font-display text-xl text-ink">아직 결과가 준비되지 않았어요.</p>
        <Link href="/start" className="text-clay underline">
          진단을 다시 시작하기
        </Link>
      </main>
    );
  }

  const r = session.report;
  const rec = session.recommendation;
  const name = session.name;
  const reportText = reportToText(r, name);
  const lens = buildExpertLens(session, session.notes ?? []);
  const topDirection = r.directions.find(
    (direction) => direction.label === r.topRecommendation.label,
  );
  const otherDirections = r.directions.filter(
    (direction) => direction.label !== r.topRecommendation.label,
  );
  const marketStage = r.marketCheck ? MARKET_STAGE[r.marketCheck.verdict] : null;

  return (
    <main className="min-h-dvh overflow-x-hidden bg-cream pb-24">
      <TrackView event="result_viewed" meta={{ topDirection: rec.topDirection.label }} />
      <RememberSession
        sessionId={sessionId}
        name={name}
        direction={r.topRecommendation.label}
      />

      <header className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-5 py-5 sm:px-6">
        <Link href="/" aria-label={`${BRAND.name} 홈으로`}>
          <Wordmark />
        </Link>
        <span className="max-w-[46%] truncate rounded-full bg-clay-tint px-3 py-1.5 text-center text-xs font-semibold text-clay-deep sm:max-w-none">
          {USER_TYPE_LABEL[rec.primaryUserType]}
        </span>
      </header>

      <div className="mx-auto max-w-[620px] px-5 pt-5 sm:px-6 sm:pt-8">
        <section className="text-center">
          <p className="text-xs font-semibold tracking-[0.16em] text-ink-faint">
            {BRAND.name.toUpperCase()} · 첫 방향 리포트
          </p>
          <h1 className="mt-4 text-[1.8rem] font-extrabold leading-[1.3] tracking-[-0.04em] text-ink sm:text-[2.25rem]">
            흩어져 있던 경험에서,
            <br />
            방향 하나가 보여요.
          </h1>
          <p className="mx-auto mt-5 max-w-[52ch] text-[0.98rem] leading-7 text-ink-soft">
            {r.summary}
          </p>
        </section>

        <div className="mt-12 space-y-10">
          <ReportSection index="01" title="당신의 강점">
            <div className="space-y-3">
              {r.strengths.map((strength, index) => (
                <div
                  key={index}
                  className="rounded-2xl border border-line bg-surface px-5 py-4 text-[0.96rem] leading-7 text-ink"
                >
                  {strength}
                </div>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {rec.assetTypes.map((asset) => (
                <span
                  key={asset}
                  className="rounded-full bg-clay-tint px-3 py-1.5 text-xs font-semibold text-clay-deep"
                >
                  {ASSET_LABEL[asset]}
                </span>
              ))}
            </div>
          </ReportSection>

          <ReportSection index="02" title="지금 가장 맞는 방향">
            <div className="rounded-3xl bg-ink px-6 py-7 text-white sm:px-7">
              <p className="text-xs font-semibold tracking-[0.12em] text-white/60">
                1순위 · 가장 현실적인 첫 시작
              </p>
              <h2 className="mt-2 text-[1.45rem] font-extrabold tracking-[-0.035em]">
                {r.topRecommendation.label}
              </h2>
              {topDirection?.why && (
                <p className="mt-2 text-sm leading-6 text-white/70">{topDirection.why}</p>
              )}
              <ul className="mt-5 space-y-3">
                {r.topRecommendation.reasons.map((reason) => (
                  <li key={reason} className="flex items-start gap-3 text-sm leading-6 text-white/90">
                    <span
                      aria-hidden="true"
                      className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-clay"
                    />
                    {reason}
                  </li>
                ))}
              </ul>
            </div>
            {otherDirections.length > 0 && (
              <p className="mt-3 text-center text-xs leading-5 text-ink-faint">
                맞는 방향이 {otherDirections.length}개 더 있어요. 지금은 이 하나에
                집중해도 충분해요.
              </p>
            )}
          </ReportSection>

          {r.marketCheck && marketStage && (
            <ReportSection index="03" title="이 방향, 시장에서 통할까?">
              <div className="rounded-2xl border border-line bg-surface p-5 sm:p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold text-ink-soft">시장 확인 단계</p>
                    <p className="mt-1 text-lg font-extrabold tracking-[-0.025em] text-ink">
                      {marketStage.label}
                    </p>
                  </div>
                  <span className="rounded-lg bg-sage-tint px-3 py-1.5 text-xs font-semibold text-sage">
                    검증 점수 {r.marketCheck.score}
                  </span>
                </div>

                <div
                  className="mt-5 h-2 overflow-hidden rounded-full bg-sand"
                  role="progressbar"
                  aria-label="시장 검증 점수"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={r.marketCheck.score}
                >
                  <div
                    className="h-full rounded-full bg-clay"
                    style={{ width: `${Math.max(4, Math.min(100, r.marketCheck.score))}%` }}
                  />
                </div>

                <p className="mt-4 text-sm leading-6 text-ink-soft">
                  {marketStage.description}
                </p>
                <p className="mt-3 text-[0.96rem] font-semibold leading-7 text-ink">
                  {r.marketCheck.coaching}
                </p>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <SignalList title="확인된 수요 신호" items={r.marketCheck.demandSignals} />
                  <SignalList title="더 확인할 것" items={r.marketCheck.riskSignals} />
                </div>

                <div className="mt-5 rounded-2xl bg-cream-2 p-5">
                  <p className="text-xs font-semibold text-clay-deep">먼저 물어볼 질문</p>
                  <p className="mt-2 text-sm leading-6 text-ink">
                    {r.marketCheck.validationQuestion}
                  </p>
                </div>
              </div>
            </ReportSection>
          )}

          <ReportSection index="04" title="이번 주, 가장 작은 첫 행동">
            <div className="rounded-2xl border border-sage/30 bg-sage-tint p-5 sm:p-6">
              <p className="text-xs font-semibold text-sage">방향을 검증으로</p>
              <p className="mt-2 text-[1rem] font-semibold leading-7 text-ink">
                {r.firstAction}
              </p>
              {r.marketCheck?.firstExperiment && (
                <p className="mt-4 border-t border-sage/20 pt-4 text-sm leading-6 text-ink-soft">
                  {r.marketCheck.firstExperiment}
                </p>
              )}
            </div>
          </ReportSection>
        </div>

        <section className="mt-12 rounded-3xl bg-ink px-6 py-9 text-center sm:px-8">
          <p className="text-lg font-extrabold leading-8 tracking-[-0.03em] text-white sm:text-xl">
            {r.closing}
          </p>
          <p className="mx-auto mt-3 max-w-[42ch] text-sm leading-6 text-white/60">
            첫 리포트는 출발점이에요. 오늘 느낀 점을 남기면 방향이 조금씩 더
            또렷해집니다.
          </p>
          <Link
            href="/chat"
            className="mt-6 inline-flex min-h-11 items-center justify-center rounded-xl bg-clay px-6 py-3 text-sm font-bold text-white transition hover:bg-clay-deep active:scale-[0.99]"
          >
            채팅으로 이어가기 →
          </Link>
        </section>

        <details className="group mt-8 rounded-2xl border border-line bg-surface">
          <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 font-semibold text-ink">
            리포트 자세히 보기
            <span
              aria-hidden="true"
              className="text-xl font-normal text-ink-faint transition group-open:rotate-45"
            >
              +
            </span>
          </summary>
          <div className="space-y-8 border-t border-line px-5 py-6">
            {otherDirections.length > 0 && (
              <DetailBlock title="함께 나온 다른 방향">
                <div className="space-y-3">
                  {otherDirections.map((direction) => (
                    <div key={direction.label} className="rounded-xl bg-cream-2 p-4">
                      <p className="font-semibold text-ink">{direction.label}</p>
                      <p className="mt-1 text-sm leading-6 text-ink-soft">{direction.why}</p>
                    </div>
                  ))}
                </div>
              </DetailBlock>
            )}

            <DetailBlock title="첫 오퍼 가설">
              <div className="rounded-xl bg-cream-2 p-4 text-sm leading-7 text-ink">
                {r.offerDraft}
              </div>
            </DetailBlock>

            <DetailList title="첫 고객을 만날 곳" items={r.customerChannels} />

            {r.marketCheck?.sources?.length ? (
              <DetailBlock title="시장 확인 근거">
                <div className="space-y-3">
                  {r.marketCheck.sources.map((source) => (
                    <div key={source.label} className="rounded-xl border border-line p-4">
                      <p className="text-sm font-semibold text-ink">{source.label}</p>
                      <p className="mt-1 text-sm leading-6 text-ink-soft">{source.why}</p>
                      {source.url && (
                        <a
                          href={source.url}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-2 inline-flex min-h-11 items-center text-sm font-semibold text-clay underline"
                        >
                          공개 검색으로 확인하기
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </DetailBlock>
            ) : null}

            {(r.whatToLearn?.length ||
              r.peopleToReach?.length ||
              r.toolsToTry?.length) && (
              <DetailBlock title="다음으로 해볼 것들">
                <div className="grid gap-4 sm:grid-cols-3">
                  <CompactList title="공부할 것" items={r.whatToLearn} />
                  <CompactList title="만나볼 사람" items={r.peopleToReach} />
                  <CompactList title="써볼 도구" items={r.toolsToTry} />
                </div>
              </DetailBlock>
            )}

            <DetailBlock title="전문가 렌즈">
              <ExpertLensCard lens={lens} sessionId={sessionId} />
            </DetailBlock>
          </div>
        </details>

        <section className="mt-10 space-y-5 border-t border-line pt-8">
          <p className="text-center text-sm font-semibold text-ink-soft">
            결과를 보관하거나 나눠보세요
          </p>
          <ResultActions sessionId={sessionId} reportText={reportText} name={name} />
        </section>

        <section className="mt-10 space-y-4">
          <p className="text-center text-lg font-extrabold tracking-[-0.03em] text-ink">
            다음 걸음도 함께할까요?
          </p>
          <FollowUpCTA sessionId={sessionId} />
        </section>

        <div className="mt-10 text-center">
          <Link
            href="/start"
            className="inline-flex min-h-11 items-center text-sm text-ink-soft underline transition hover:text-clay"
          >
            다시 진단하기
          </Link>
        </div>
      </div>
    </main>
  );
}

function ReportSection({
  index,
  title,
  children,
}: {
  index: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-4 flex items-center gap-3">
        <span className="text-xs font-semibold text-ink-faint">{index}</span>
        <h2 className="text-[1.12rem] font-extrabold tracking-[-0.03em] text-ink">
          {title}
        </h2>
      </div>
      {children}
    </section>
  );
}

function SignalList({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-xl border border-line bg-cream/70 p-4">
      <p className="text-xs font-semibold text-ink-soft">{title}</p>
      <ul className="mt-3 space-y-2">
        {items.map((item) => (
          <li key={item} className="flex items-start gap-2 text-sm leading-6 text-ink">
            <span aria-hidden="true" className="mt-2.5 h-1 w-1 shrink-0 rounded-full bg-clay" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function DetailBlock({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h3 className="mb-3 text-sm font-extrabold text-ink">{title}</h3>
      {children}
    </section>
  );
}

function DetailList({ title, items }: { title: string; items?: string[] }) {
  if (!items?.length) return null;
  return (
    <DetailBlock title={title}>
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item} className="rounded-xl bg-cream-2 px-4 py-3 text-sm leading-6 text-ink">
            {item}
          </li>
        ))}
      </ul>
    </DetailBlock>
  );
}

function CompactList({ title, items }: { title: string; items?: string[] }) {
  if (!items?.length) return null;
  return (
    <div className="rounded-xl bg-cream-2 p-4">
      <p className="text-xs font-semibold text-ink-soft">{title}</p>
      <ul className="mt-2 space-y-2">
        {items.map((item) => (
          <li key={item} className="text-sm leading-6 text-ink">
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
