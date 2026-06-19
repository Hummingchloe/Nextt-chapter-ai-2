"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Wordmark } from "../components/Logo";
import RoadmapPath from "../components/RoadmapPath";
import { loadCompassState } from "@/lib/local-ontology-store";
import { getLocalSession, type LocalSession } from "@/lib/session-client";
import { deriveReadOnlyJourney } from "@/lib/compass-roadmap";
import type { CompassState } from "@/lib/compass-engine";

export default function RoadmapPage() {
  const [compass, setCompass] = useState<CompassState | null | undefined>(undefined);
  const [report, setReport] = useState<LocalSession | null | undefined>(undefined);

  useEffect(() => {
    const now = new Date().toISOString();
    setReport(getLocalSession());
    loadCompassState(now).then(setCompass).catch(() => setCompass(null));
  }, []);

  const journey = useMemo(() => {
    if (!compass || !report) return null;
    return deriveReadOnlyJourney(
      compass,
      {
        sessionId: report.sessionId,
        label: report.direction ?? "나의 첫 방향",
        createdAt: new Date(report.at).toISOString(),
      },
      new Date().toISOString(),
    );
  }, [compass, report]);

  const clarity = compass ? Math.round(compass.displayAlignment * 100) : 0;

  return (
    <main className="min-h-dvh bg-cream pb-8">
      <header className="mx-auto flex max-w-3xl items-center justify-between px-5 py-5 sm:px-6">
        <Link href="/">
          <Wordmark />
        </Link>
        <span className="rounded-full border border-line bg-surface px-3 py-1.5 text-xs font-semibold text-ink-soft">
          나의 여정
        </span>
      </header>

      <div className="mx-auto max-w-3xl px-5 pb-10 sm:px-6">
        {report === undefined || compass === undefined ? (
          <div className="rounded-3xl border border-line bg-surface px-6 py-16 text-center text-sm text-ink-soft">
            여정을 불러오는 중…
          </div>
        ) : compass === null ? (
          <div className="rounded-3xl border border-line bg-surface px-6 py-16 text-center">
            <p className="font-semibold text-ink">여정을 불러오지 못했어요.</p>
            <p className="mt-2 text-sm text-ink-soft">잠시 후 다시 열어주세요.</p>
          </div>
        ) : !report ? (
          <section className="rounded-3xl border border-dashed border-line bg-surface px-6 py-16 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-clay-tint text-2xl">
              ◇
            </div>
            <h1 className="mt-5 text-2xl font-extrabold tracking-[-0.04em] text-ink">
              여정이 곧 시작돼요
            </h1>
            <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-ink-soft">
              온보딩을 마치면 첫 방향 리포트가 이곳의 첫 마일스톤이 됩니다.
            </p>
            <Link
              href="/start"
              className="mt-6 inline-flex min-h-11 items-center justify-center rounded-xl bg-clay px-6 py-3 text-sm font-bold text-white"
            >
              내 방향 찾아보기 →
            </Link>
          </section>
        ) : journey ? (
          <>
            <section className="grid grid-cols-2 gap-3">
              <Stat label="방향 선명도" value={`${clarity}%`} />
              <Stat label="마일스톤" value="1" />
            </section>

            <section className="mt-5 rounded-3xl bg-ink px-6 py-7 text-white sm:px-8">
              <p className="text-xs font-semibold tracking-[0.14em] text-white/55">
                여정 · {journey.chapter}장
              </p>
              <h1 className="mt-3 text-[1.55rem] font-extrabold leading-[1.4] tracking-[-0.04em] sm:text-[1.8rem]">
                {journey.essence}
              </h1>
              <p className="mt-3 text-sm leading-6 text-white/65">
                완료한 행동과 지금의 방향을 한눈에 이어봅니다.
              </p>
            </section>

            <section className="mt-8">
              <RoadmapPath nodes={journey.nodes} />
            </section>
          </>
        ) : null}
      </div>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-4 text-center shadow-sm">
      <p className="text-xs text-ink-faint">{label}</p>
      <p className="mt-1 text-2xl font-extrabold tracking-[-0.04em] text-ink">{value}</p>
    </div>
  );
}
