"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Wordmark } from "../components/Logo";
import { loadCompassState, saveCompassState } from "@/lib/local-ontology-store";
import { type CompassState } from "@/lib/compass-engine";
import { activeActions, completeAction, type CompassAction } from "@/lib/compass-actions";
import { deriveContent } from "@/lib/compass-content";
import { seedCompass } from "@/lib/compass-seed";

const STATUS_LABEL: Record<CompassState["status"], string> = {
  listening: "듣는 중",
  narrowing: "좁히는 중",
  confirming: "확인하는 중",
  executing: "실행 단계",
};

export default function DashboardPage() {
  const [compass, setCompass] = useState<CompassState | null>(null);
  const [justMoved, setJustMoved] = useState<string>("");

  useEffect(() => {
    loadCompassState(new Date().toISOString()).then(setCompass).catch(() => setCompass(null));
  }, []);

  const actions = useMemo(
    () => (compass ? activeActions(compass, new Date().toISOString()) : []),
    [compass],
  );
  const content = useMemo(() => (compass ? deriveContent(compass) : []), [compass]);

  function complete(action: CompassAction) {
    if (!compass) return;
    const now = new Date().toISOString();
    const before = compass.displayAlignment;
    const next = completeAction(compass, action, now, Date.now().toString(36));
    setCompass(next);
    void saveCompassState(next);
    const delta = Math.round((next.displayAlignment - before) * 100);
    setJustMoved(`‘${action.title}’ 완료 · 정렬도 ${delta >= 0 ? "+" : ""}${delta}%`);
  }

  function feed() {
    const seeded = seedCompass(new Date().toISOString());
    setCompass(seeded);
    void saveCompassState(seeded);
    setJustMoved("테스트 온톨로지(전직 AI 엔지니어 · AI 교육 창업)를 불러왔어요.");
  }

  const pct = compass ? Math.round(compass.displayAlignment * 100) : 0;
  const records = useMemo(
    () => (compass ? [...compass.beads].reverse().slice(0, 8) : []),
    [compass],
  );

  return (
    <main className="min-h-dvh bg-cream">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
        <Link href="/">
          <Wordmark />
        </Link>
        <nav className="flex items-center gap-2 text-sm">
          <button
            onClick={feed}
            className="rounded-full border border-gold bg-cream-2 px-3 py-2 text-xs font-semibold text-clay-deep transition hover:bg-sand"
            title="전직 AI 엔지니어 · AI 교육 창업 페르소나 구슬을 주입"
          >
            🧪 테스트 먹이기
          </button>
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
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-clay">Compass</p>
                {compass && (
                  <span className="rounded-full bg-cream-2 px-2.5 py-1 text-xs font-medium text-ink-soft">
                    {STATUS_LABEL[compass.status]}
                  </span>
                )}
              </div>
              <h1 className="mt-2 font-display text-3xl font-bold text-ink">살아있는 나침반</h1>
              <p className="mt-3 text-sm leading-relaxed text-ink-soft">
                채팅 기록이 벡터 구슬로 쌓이고, 코사인 정렬도가 실시간으로 방향을 가리킵니다.
              </p>
              <div className="mt-6">
                <div className="flex items-end gap-2">
                  <span className="font-display text-6xl font-bold text-clay">{pct}</span>
                  <span className="pb-2 text-ink-soft">%</span>
                </div>
                <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-cream-2">
                  <div className="h-full rounded-full bg-clay transition-all duration-500" style={{ width: `${pct}%` }} />
                </div>
              </div>
              <p className="mt-5 text-sm leading-relaxed text-ink-soft">
                {compass?.compass.oneLiner ?? "아직 기록이 없습니다. 채팅에서 첫 문장을 남겨주세요."}
              </p>
              {justMoved && (
                <p className="mt-3 rounded-xl bg-sage-tint px-3 py-2 text-xs font-medium text-sage">{justMoved}</p>
              )}
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
            <Section title="학습된 축 (페르소나 아님 · 기록에서 도출)">
              {compass?.axes.length ? (
                <div className="space-y-3">
                  {compass.axes.map((axis, i) => (
                    <AxisRow
                      key={axis.id}
                      name={axis.name}
                      posPole={axis.posPole}
                      negPole={axis.negPole}
                      value={compass.compass.dir[i] ?? 0}
                    />
                  ))}
                </div>
              ) : (
                <Gate message="첫 기록이 들어오면 이 사람만의 방향 축을 도출합니다." />
              )}
            </Section>

            <Section title="날짜별 액션 아이템 (완료하면 나침반이 움직입니다)">
              {actions.length ? (
                <div className="grid gap-3 md:grid-cols-2">
                  {actions.map((a) => (
                    <div key={a.id} className="flex flex-col rounded-2xl border border-line bg-cream p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-clay">
                          {a.kind === "probe" ? "검증 실험" : "방향 강화"}
                        </span>
                        <span className="text-xs font-medium text-sage">
                          예상 {a.expectedDelta >= 0 ? "+" : ""}
                          {Math.round(a.expectedDelta * 100)}%
                        </span>
                      </div>
                      <p className="mt-2 font-semibold leading-snug text-ink">{a.title}</p>
                      <p className="mt-2 flex-1 text-xs leading-relaxed text-ink-soft">{a.detail}</p>
                      <button
                        onClick={() => complete(a)}
                        className="mt-3 rounded-full bg-clay px-3 py-2 text-xs font-semibold text-white transition hover:bg-clay-deep"
                      >
                        완료로 표시
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <Gate message="기록이 더 쌓이면 검증·강화 액션이 열립니다." />
              )}
              {compass && compass.doneActions.length > 0 && (
                <div className="mt-4 border-t border-line pt-4">
                  <p className="text-xs font-semibold text-ink-faint">완료한 액션</p>
                  <ul className="mt-2 space-y-1.5">
                    {compass.doneActions
                      .slice()
                      .reverse()
                      .map((d) => (
                        <li key={`${d.id}-${d.completedAt}`} className="flex items-center gap-2 text-sm text-ink-soft">
                          <span className="text-sage">✓</span>
                          <span className="line-through decoration-ink-faint/50">{d.title}</span>
                        </li>
                      ))}
                  </ul>
                </div>
              )}
            </Section>

            <Section title="추천 유튜브 콘텐츠">
              {content.length ? (
                <div className="grid gap-3 md:grid-cols-3">
                  {content.map((link) => (
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
                <Gate message="방향이 충분히 또렷해지면 추천 콘텐츠가 열립니다." />
              )}
            </Section>

            <Section title="나의 기록 로그 (구슬)">
              {records.length ? (
                <div className="space-y-3">
                  {records.map((b) => (
                    <div key={b.id} className="flex gap-3 rounded-2xl bg-cream px-4 py-3">
                      <span className="w-12 shrink-0 text-xs font-semibold text-clay">
                        {b.source === "market" ? "시장" : b.source === "action" ? "행동" : "기록"}
                      </span>
                      <p className="text-sm leading-relaxed text-ink-soft">{b.what}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-ink-soft">아직 기록이 없습니다.</p>
              )}
            </Section>
          </div>
        </div>
      </section>
    </main>
  );
}

function AxisRow({
  name,
  posPole,
  negPole,
  value,
}: {
  name: string;
  posPole: string;
  negPole: string;
  value: number;
}) {
  const pct = Math.round(((value + 1) / 2) * 100); // -1..1 → 0..100
  return (
    <div className="rounded-2xl bg-cream p-4">
      <p className="text-sm font-semibold text-ink">{name}</p>
      <div className="mt-2 flex items-center justify-between text-xs text-ink-faint">
        <span>{negPole}</span>
        <span>{posPole}</span>
      </div>
      <div className="relative mt-1.5 h-2 rounded-full bg-cream-2">
        <div className="absolute inset-y-0 left-1/2 w-px bg-line" />
        <div
          className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-clay shadow-sm"
          style={{ left: `${pct}%` }}
        />
      </div>
    </div>
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

function Gate({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-line bg-cream px-4 py-4 text-sm leading-relaxed text-ink-soft">
      {message}
    </div>
  );
}

function MetricGrid({ compass }: { compass: CompassState | null }) {
  const items = [
    ["확신도", compass ? Math.round(compass.compass.confidence * 100) : 0],
    ["방향 강도", compass ? Math.round(compass.compass.magnitude * 100) : 0],
    ["구슬", compass ? compass.beads.length : 0],
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
