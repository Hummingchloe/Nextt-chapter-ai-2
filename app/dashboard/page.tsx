"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Wordmark } from "../components/Logo";
import BeadCompass from "../components/BeadCompass";
import { loadCompassState, saveCompassState } from "@/lib/local-ontology-store";
import { readyForOffer, type CompassState } from "@/lib/compass-engine";
import { activeActions, completeAction, type CompassAction } from "@/lib/compass-actions";
import { deriveContent, type ContentLink } from "@/lib/compass-content";
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
  const [actionNotes, setActionNotes] = useState<Record<string, string>>({});

  useEffect(() => {
    loadCompassState(new Date().toISOString()).then(setCompass).catch(() => setCompass(null));
  }, []);

  const actions = useMemo(
    () => (compass ? activeActions(compass, new Date().toISOString()) : []),
    [compass],
  );

  // Show deterministic content immediately, then swap in real searched videos
  // when the deferred search endpoint responds (the show-actions-first pattern).
  const [content, setContent] = useState<ContentLink[]>([]);
  const [contentSearching, setContentSearching] = useState(false);
  const beadCount = compass?.beads.length ?? 0;
  useEffect(() => {
    if (!compass) return setContent([]);
    setContent(deriveContent(compass));
    if (!readyForOffer(compass)) return;
    let cancelled = false;
    setContentSearching(true);
    fetch("/api/compass/content", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ compass }),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!cancelled && Array.isArray(d?.links) && d.links.length) setContent(d.links);
      })
      .catch(() => {})
      .finally(() => !cancelled && setContentSearching(false));
    return () => {
      cancelled = true;
    };
    // Re-search only when the body of evidence changes, not on every re-render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [beadCount]);

  function complete(action: CompassAction) {
    if (!compass) return;
    const now = new Date().toISOString();
    const next = completeAction(compass, action, now, Date.now().toString(36), actionNotes[action.id]);
    setCompass(next);
    void saveCompassState(next);
    setActionNotes((prev) => ({ ...prev, [action.id]: "" }));
    setJustMoved(`‘${action.title}’ 완료했어요. 방향이 조금 더 선명해졌어요.`);
  }

  function feed() {
    const seeded = seedCompass(new Date().toISOString());
    setCompass(seeded);
    void saveCompassState(seeded);
    setJustMoved("테스트 데이터(전직 AI 엔지니어 · AI 교육 창업)를 불러왔어요.");
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
            title="전직 AI 엔지니어 · AI 교육 창업 샘플 기록 불러오기"
          >
            샘플 보기
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
                매일 남긴 기록이 한 방향으로 모이는지 보여줍니다.
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
                {compass?.compass.essence ?? compass?.compass.oneLiner ?? "아직 기록이 없습니다. 채팅에서 첫 문장을 남겨주세요."}
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

            <div className="rounded-[1.25rem] border border-line bg-surface p-5 shadow-sm">
              <p className="text-sm font-semibold text-ink">방향 변화</p>
              <p className="mt-1 text-xs leading-relaxed text-ink-soft">
                기록이 쌓일수록 지금 방향이 얼마나 선명한지 보여줍니다.
              </p>
              <div className="mt-3">
                <BeadCompass state={compass} />
              </div>
            </div>

            <MetricGrid compass={compass} />
          </aside>

          <div className="space-y-5">
            <Section title="오늘의 액션 아이템">
              {actions.length ? (
                <div className="grid gap-3 md:grid-cols-2">
                  {actions.map((a) => (
                    <div key={a.id} className="flex flex-col rounded-2xl border border-line bg-cream p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-clay">
                          {a.kind === "probe" ? "작게 확인하기" : "한 걸음 실행"}
                        </span>
                        <span className="text-xs font-medium text-sage">
                          {a.kind === "probe" ? "반응 보기" : "추천 행동"}
                        </span>
                      </div>
                      <p className="mt-2 font-semibold leading-snug text-ink">{a.title}</p>
                      <p className="mt-2 flex-1 text-xs leading-relaxed text-ink-soft">{a.detail}</p>
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {["보냈어요", "만났어요", "작성했어요"].map((tag) => (
                          <button
                            key={tag}
                            type="button"
                            onClick={() =>
                              setActionNotes((prev) => ({
                                ...prev,
                                [a.id]: prev[a.id] ? `${prev[a.id]} · ${tag}` : tag,
                              }))
                            }
                            className="rounded-full border border-line bg-surface px-2.5 py-1 text-[11px] font-medium text-ink-soft transition hover:border-clay hover:text-clay"
                          >
                            {tag}
                          </button>
                        ))}
                      </div>
                      <textarea
                        value={actionNotes[a.id] ?? ""}
                        onChange={(e) => setActionNotes((prev) => ({ ...prev, [a.id]: e.target.value }))}
                        placeholder="실행 결과를 짧게 남겨주세요"
                        maxLength={240}
                        className="mt-2 min-h-16 resize-none rounded-xl border border-line bg-surface px-3 py-2 text-xs leading-relaxed text-ink outline-none placeholder:text-ink-faint focus:border-clay"
                      />
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
                <Gate message="기록이 더 쌓이면 오늘 해볼 작은 행동을 제안할게요." />
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
                          {d.note && <span className="text-xs text-ink-faint">· {d.note}</span>}
                        </li>
                      ))}
                  </ul>
                </div>
              )}
            </Section>

            <Section title="콘텐츠 추천">
              {contentSearching && content.length > 0 && (
                <p className="mb-2 text-xs font-medium text-sage">지금 방향에 맞는 콘텐츠를 검색하는 중… (도착하면 교체됩니다)</p>
              )}
              {content.length ? (
                <div className="grid gap-3 md:grid-cols-3">
                  {content.map((link) => (
                    <a
                      key={link.id}
                      href={link.url}
                      target="_blank"
                      rel="noreferrer"
                      className="overflow-hidden rounded-2xl border border-line bg-surface transition hover:border-clay hover:shadow-soft"
                    >
                      {link.imageUrl ? (
                        <img src={link.imageUrl} alt="" className="aspect-video w-full bg-cream object-cover" loading="lazy" />
                      ) : (
                        <div className="flex aspect-video items-center justify-center bg-cream-2 px-4 text-center text-xs font-semibold text-clay">
                          콘텐츠 추천
                        </div>
                      )}
                      <div className="p-4">
                        <p className="font-semibold leading-snug text-ink">{link.title}</p>
                        <p className="mt-2 text-xs leading-relaxed text-ink-soft">{link.why}</p>
                      </div>
                    </a>
                  ))}
                </div>
              ) : (
                <Gate message="기록이 조금 더 쌓이면 지금 방향에 맞는 콘텐츠를 보여드릴게요." />
              )}
            </Section>

            <Section title="최근 기록">
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
    ["방향 선명도", compass ? Math.round(compass.compass.confidence * 100) : 0],
    ["방향 힘", compass ? Math.round(compass.compass.magnitude * 100) : 0],
    ["쌓인 기록", compass ? compass.beads.length : 0],
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
