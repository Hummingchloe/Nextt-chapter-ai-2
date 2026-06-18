"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Wordmark } from "../components/Logo";
import { loadLocalOntology } from "@/lib/local-ontology-store";
import { buildProposalDashboard } from "@/lib/proposal";
import { signalsByKind, type UserOntology } from "@/lib/ontology";

export default function DashboardPage() {
  const [ontology, setOntology] = useState<UserOntology | null>(null);

  useEffect(() => {
    loadLocalOntology().then(setOntology).catch(() => setOntology(null));
  }, []);

  const dashboard = useMemo(
    () => (ontology ? buildProposalDashboard(ontology) : null),
    [ontology],
  );
  const compass = ontology?.compass;

  return (
    <main className="min-h-dvh bg-cream">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
        <Link href="/">
          <Wordmark />
        </Link>
        <nav className="flex items-center gap-2 text-sm">
          <Link className="rounded-full border border-line bg-surface px-4 py-2 text-ink-soft" href="/chat">
            채팅
          </Link>
          <Link className="rounded-full bg-clay px-4 py-2 font-semibold text-white" href="/dashboard">
            대시보드
          </Link>
        </nav>
      </header>

      <section className="mx-auto max-w-6xl px-5 pb-10">
        <div className="grid gap-5 lg:grid-cols-[24rem_minmax(0,1fr)]">
          <aside className="space-y-5">
            <div className="rounded-[1.25rem] border border-line bg-surface p-6 shadow-soft">
              <p className="text-sm font-semibold text-clay">Compass</p>
              <h1 className="mt-2 font-display text-3xl font-bold text-ink">살아있는 대시보드</h1>
              <p className="mt-3 text-sm leading-relaxed text-ink-soft">
                채팅 기록이 로컬 온톨로지로 쌓이고, 정렬도 50% 이상부터 액션과 콘텐츠 추천이 열립니다.
              </p>
              <div className="mt-6">
                <div className="flex items-end gap-2">
                  <span className="font-display text-6xl font-bold text-clay">{compass?.alignment ?? 0}</span>
                  <span className="pb-2 text-ink-soft">%</span>
                </div>
                <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-cream-2">
                  <div className="h-full rounded-full bg-clay" style={{ width: `${compass?.alignment ?? 0}%` }} />
                </div>
              </div>
              <p className="mt-5 text-sm leading-relaxed text-ink-soft">
                {compass?.oneLine ?? "아직 기록이 없습니다. 채팅에서 첫 문장을 남겨주세요."}
              </p>
              <Link
                href="/chat"
                className="mt-5 flex w-full items-center justify-center rounded-full bg-clay px-5 py-3 text-sm font-semibold text-white"
              >
                채팅으로 기록하기
              </Link>
            </div>

            <MetricGrid compass={compass} />
          </aside>

          <div className="space-y-5">
            <Section title="짧은 유저 써머리">
              <p className="text-sm leading-relaxed text-ink-soft">
                {dashboard?.userSummary ?? "아직 요약할 기록이 없습니다."}
              </p>
            </Section>

            <Section title="날짜별 액션 아이템">
              {dashboard?.ready ? (
                <div className="grid gap-3 md:grid-cols-3">
                  {dashboard.actions.map((a) => (
                    <div key={a.id} className="rounded-2xl border border-line bg-cream p-4">
                      <p className="text-xs font-semibold text-clay">{a.dateLabel}</p>
                      <p className="mt-2 font-semibold leading-snug text-ink">{a.title}</p>
                      <p className="mt-2 text-xs leading-relaxed text-ink-soft">{a.detail}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <Gate message={dashboard?.gateMessage} />
              )}
            </Section>

            <Section title="추천 유튜브 링크">
              {dashboard?.ready ? (
                <div className="grid gap-3 md:grid-cols-3">
                  {dashboard.youtubeLinks.map((link) => (
                    <a
                      key={link.id}
                      href={link.url}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-2xl border border-line bg-surface p-4 transition hover:border-clay hover:shadow-soft"
                    >
                      <p className="font-semibold leading-snug text-ink">{link.title}</p>
                      <p className="mt-2 text-xs leading-relaxed text-ink-soft">{link.why}</p>
                    </a>
                  ))}
                </div>
              ) : (
                <Gate message={dashboard?.gateMessage} />
              )}
            </Section>

            <Section title="나의 기록 로그">
              {dashboard?.recordLog.length ? (
                <div className="space-y-3">
                  {dashboard.recordLog.map((log) => (
                    <div key={log.id} className="flex gap-3 rounded-2xl bg-cream px-4 py-3">
                      <span className="w-14 shrink-0 text-xs font-semibold text-clay">{log.dateLabel}</span>
                      <p className="text-sm leading-relaxed text-ink-soft">{log.text}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-ink-soft">아직 기록이 없습니다.</p>
              )}
            </Section>

            <Section title="온톨로지 신호">
              <div className="grid gap-3 md:grid-cols-2">
                <SignalList title="자산" signals={ontology ? signalsByKind(ontology, "asset") : []} />
                <SignalList title="시장/행동" signals={ontology ? [
                  ...signalsByKind(ontology, "market"),
                  ...signalsByKind(ontology, "action"),
                ] : []} />
                <SignalList title="니즈" signals={ontology ? signalsByKind(ontology, "need") : []} />
                <SignalList title="주의점" signals={ontology ? signalsByKind(ontology, "blocker") : []} />
              </div>
            </Section>
          </div>
        </div>
      </section>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-[1.25rem] border border-line bg-surface p-5 shadow-sm">
      <h2 className="font-display text-xl font-bold text-ink">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Gate({ message }: { message?: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-line bg-cream px-4 py-4 text-sm leading-relaxed text-ink-soft">
      {message ?? "정렬도가 50%를 넘으면 추천이 열립니다."}
    </div>
  );
}

function MetricGrid({ compass }: { compass: UserOntology["compass"] | undefined }) {
  const items = [
    ["명료도", compass?.clarity ?? 0],
    ["확신도", compass?.confidence ?? 0],
    ["근거", compass?.evidenceCount ?? 0],
  ] as const;
  return (
    <div className="grid grid-cols-3 gap-2">
      {items.map(([label, value]) => (
        <div key={label} className="rounded-2xl border border-line bg-surface p-4 text-center shadow-sm">
          <p className="text-xs text-ink-faint">{label}</p>
          <p className="mt-1 font-display text-2xl font-bold text-ink">{value}</p>
        </div>
      ))}
    </div>
  );
}

function SignalList({
  title,
  signals,
}: {
  title: string;
  signals: ReturnType<typeof signalsByKind>;
}) {
  return (
    <div className="rounded-2xl bg-cream p-4">
      <p className="text-sm font-semibold text-ink">{title}</p>
      {signals.length ? (
        <ul className="mt-3 space-y-2">
          {signals.slice(0, 3).map((s) => (
            <li key={s.id} className="text-sm leading-relaxed text-ink-soft">
              {s.label}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-ink-faint">아직 신호 없음</p>
      )}
    </div>
  );
}
