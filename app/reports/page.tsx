"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Wordmark } from "../components/Logo";
import { listLocalSessions, type LocalSession } from "@/lib/session-client";
import { track } from "@/lib/track";

export default function ReportsPage() {
  const [sessions, setSessions] = useState<LocalSession[] | null>(null);

  useEffect(() => {
    track("reports_viewed");
    setSessions(listLocalSessions());
  }, []);

  return (
    <main className="bg-cream min-h-dvh pb-10">
      <div className="bg-warm-glow border-b border-line">
        <header className="mx-auto max-w-2xl px-6 py-5">
          <Link href="/">
            <Wordmark />
          </Link>
        </header>
        <div className="mx-auto max-w-2xl px-6 pb-8 pt-1">
          <p className="text-sm font-semibold uppercase tracking-wider text-clay">
            Reports
          </p>
          <h1 className="mt-2 font-display text-[1.7rem] font-bold leading-snug text-ink sm:text-[2rem]">
            내 진단 리포트
          </h1>
          <p className="mt-2 text-ink-soft">
            지금까지 받은 방향들을 모아서 볼 수 있어요.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-2xl space-y-4 px-6 pt-8">
        {sessions === null ? (
          <p className="py-12 text-center text-ink-soft">불러오는 중…</p>
        ) : sessions.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-line bg-surface/60 px-6 py-14 text-center">
            <p className="font-medium text-ink">아직 받은 리포트가 없어요.</p>
            <p className="mt-1 text-sm text-ink-soft">
              15분 진단으로 첫 방향을 찾아볼까요?
            </p>
            <Link
              href="/start"
              className="mt-5 inline-block rounded-full bg-clay px-6 py-3 font-semibold text-white shadow-soft transition hover:bg-clay-deep"
            >
              진단 시작하기 →
            </Link>
          </div>
        ) : (
          sessions.map((s, i) => (
            <Link
              key={s.sessionId}
              href={`/result/${s.sessionId}`}
              onClick={() => track("report_opened", undefined, s.sessionId)}
              className="block rounded-3xl border border-line bg-surface p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-soft"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wide text-clay">
                  {i === 0 ? "가장 최근 진단" : "지난 진단"}
                </span>
                <span className="text-xs text-ink-faint">
                  {new Date(s.at).toLocaleDateString("ko-KR")}
                </span>
              </div>
              <p className="mt-2 font-display text-xl font-bold text-ink">
                {s.direction ?? "진단 리포트"}
              </p>
              <p className="mt-1 text-sm text-ink-soft">
                {s.name ? `${s.name}님의 ` : ""}1순위 방향 · 리포트 열기 →
              </p>
            </Link>
          ))
        )}

        <div className="pt-4 text-center">
          <Link
            href="/start"
            className="text-sm text-ink-soft underline-offset-2 transition hover:text-clay hover:underline"
          >
            + 새로 진단하기
          </Link>
        </div>
      </div>
    </main>
  );
}
