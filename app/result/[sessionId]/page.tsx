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
import ResultActions from "./ResultActions";

export const dynamic = "force-dynamic";

function marketEvidenceStage(
  score: number,
  status?: "supported" | "insufficient" | "unavailable",
) {
  if (status !== "supported") {
    return {
      label: "확인 보류",
      description: "공개 근거가 충분하지 않아 시장 판단을 보류했어요.",
    };
  }
  if (score >= 70) {
    return {
      label: "근거 충분",
      description: "여러 공개 근거가 확인됐어요. 이제 실제 고객 반응으로 검증할 차례예요.",
    };
  }
  if (score >= 50) {
    return {
      label: "형성 중",
      description: "시장 단서는 보이지만 고객과 오퍼를 조금 더 좁혀야 해요.",
    };
  }
  return {
    label: "씨앗",
    description: "아직 시장을 단정하기보다 반복되는 고객 문제부터 확인할 때예요.",
  };
}

function nextStepCopy(status?: "supported" | "insufficient" | "unavailable") {
  if (status === "supported") {
    return {
      title: "확인된 시장 단서를 고객 반응으로",
      description:
        "공개 근거는 출발점이에요. 이제 실제 사람에게 질문하고 작은 제안을 보여주며 이 방향이 통하는지 확인해보세요.",
    };
  }
  return {
    title: "시장 판단보다 먼저, 고객 확인으로",
    description:
      "아직 시장을 단정하기에는 근거가 부족해요. 고객 문제와 지불 의사를 작은 대화로 확인하는 것이 다음 단계예요.",
  };
}

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
  const marketDisplayScore = r.marketCheck
    ? r.marketCheck.researchStatus === "supported"
      ? r.marketCheck.score
      : Math.min(r.marketCheck.score, 49)
    : null;
  const displayMarketScore = marketDisplayScore ?? 0;
  const marketStage = r.marketCheck && marketDisplayScore !== null
    ? marketEvidenceStage(displayMarketScore, r.marketCheck.researchStatus)
    : null;
  const marketSummary = r.marketCheck
    ? {
        paidMarket:
          r.marketCheck.marketSummary?.paidMarket ?? "유료 대안 확인 보류",
        seekingPeople:
          r.marketCheck.marketSummary?.seekingPeople ?? "수요 근거 확인 보류",
        firstTestDifficulty:
          r.marketCheck.marketSummary?.firstTestDifficulty ??
          "첫 검증 난이도 확인 보류",
      }
    : null;
  const nextStep = nextStepCopy(r.marketCheck?.researchStatus);

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

          {r.marketCheck && marketStage && marketSummary && (
            <ReportSection index="03" title="지금 시장은 얼마나 있나">
              <div className="rounded-2xl border border-line bg-surface p-5 sm:p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold text-ink-soft">시장 근거 형성도</p>
                    <p className="mt-1 text-lg font-extrabold tracking-[-0.025em] text-ink">
                      {marketStage.label}
                    </p>
                  </div>
                  <span className="rounded-lg bg-sage-tint px-3 py-1.5 text-xs font-semibold text-sage">
                    시장 점수 {displayMarketScore}
                  </span>
                </div>

                <div
                  className="relative mt-6 h-2 rounded-full bg-sand"
                  role="progressbar"
                  aria-label="시장 근거 형성도"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={displayMarketScore}
                >
                  <div
                    className="h-full rounded-full bg-clay"
                    style={{ width: `${Math.max(4, Math.min(100, displayMarketScore))}%` }}
                  />
                  <span
                    aria-hidden="true"
                    className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-clay shadow-sm"
                    style={{ left: `${Math.max(4, Math.min(96, displayMarketScore))}%` }}
                  />
                </div>
                <div className="mt-2 flex justify-between text-[0.7rem] text-ink-faint">
                  <span>씨앗</span>
                  <span>형성 중</span>
                  <span>근거 충분</span>
                </div>

                <p className="mt-4 text-sm leading-6 text-ink-soft">
                  {marketStage.description}
                </p>

                <div className="mt-6 divide-y divide-line border-y border-line">
                  <MarketSummaryRow label="유료 대안" value={marketSummary.paidMarket} />
                  <MarketSummaryRow label="찾는 사람" value={marketSummary.seekingPeople} />
                  <MarketSummaryRow
                    label="첫 검증 난이도"
                    value={marketSummary.firstTestDifficulty}
                  />
                </div>

                <details className="group mt-5 rounded-xl border border-line bg-cream/60">
                  <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-semibold text-ink">
                    상세 시장 근거 보기
                    <span
                      aria-hidden="true"
                      className="text-lg font-normal text-ink-faint transition group-open:rotate-45"
                    >
                      +
                    </span>
                  </summary>
                  <div className="space-y-4 border-t border-line px-4 py-4">
                    <p className="text-sm font-semibold leading-6 text-ink">
                      {r.marketCheck.coaching}
                    </p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <SignalList
                        title="웹에서 확인된 시장 단서"
                        items={r.marketCheck.demandSignals}
                      />
                      <SignalList title="더 확인할 것" items={r.marketCheck.riskSignals} />
                    </div>
                    {r.marketCheck.sources.some((source) => source.url) && (
                      <div>
                        <p className="text-xs font-semibold text-ink-soft">
                          확인한 공개 출처
                        </p>
                        <ul className="mt-3 space-y-2">
                          {r.marketCheck.sources
                            .filter((source) => source.url)
                            .map((source) => (
                              <li key={source.url}>
                                <a
                                  href={source.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-sm font-semibold leading-6 text-clay-deep underline decoration-clay/30 underline-offset-4"
                                >
                                  {source.label}
                                </a>
                              </li>
                            ))}
                        </ul>
                      </div>
                    )}
                    <div className="rounded-xl bg-cream-2 p-4">
                      <p className="text-xs font-semibold text-clay-deep">
                        먼저 물어볼 질문
                      </p>
                      <p className="mt-2 text-sm leading-6 text-ink">
                        {r.marketCheck.validationQuestion}
                      </p>
                    </div>
                  </div>
                </details>
              </div>
            </ReportSection>
          )}

          <ReportSection index="04" title="다음 단계 제안">
            <div className="rounded-2xl border border-sage/30 bg-sage-tint p-5 sm:p-6">
              <p className="text-xs font-semibold text-sage">방향을 검증으로</p>
              <h3 className="mt-2 text-[1.05rem] font-extrabold leading-7 text-ink">
                {nextStep.title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-ink-soft">
                {nextStep.description}
              </p>
              <p className="mt-5 border-t border-sage/20 pt-4 text-[1rem] font-semibold leading-7 text-ink">
                {r.firstAction}
              </p>
              {r.marketCheck?.firstExperiment && (
                <p className="mt-3 text-sm leading-6 text-ink-soft">
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

function MarketSummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1 py-4 sm:grid-cols-[8rem_1fr] sm:items-start sm:gap-4">
      <p className="text-sm text-ink-soft">{label}</p>
      <p className="text-sm font-semibold leading-6 text-ink sm:text-right">{value}</p>
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
