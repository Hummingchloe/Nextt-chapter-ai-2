import Link from "next/link";
import { notFound } from "next/navigation";
import { getSession, listNotes } from "@/lib/store";
import { deriveTodayAction, MOOD_OPTIONS } from "@/lib/note";
import { Wordmark } from "../../components/Logo";
import TrackView from "../../components/TrackView";
import RememberSession from "../../components/RememberSession";
import type { MoodTag } from "@/lib/types";

export const dynamic = "force-dynamic";

const moodEmoji = Object.fromEntries(
  MOOD_OPTIONS.map((m) => [m.id, m.emoji]),
) as Record<MoodTag, string>;

export default async function HomeDashboard({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  const session = await getSession(sessionId);
  if (!session) notFound();

  const notes = await listNotes(sessionId);
  const name = session.name;
  const direction = session.report?.topRecommendation.label;
  const { action } = deriveTodayAction(session.report?.firstAction, notes);
  const weekCount = notes.filter((n) => {
    const days = (Date.now() - new Date(n.createdAt).getTime()) / 86400000;
    return days <= 7;
  }).length;
  const recentMoods = notes.slice(-5).map((n) => n.moodTag).filter(Boolean) as MoodTag[];

  return (
    <main className="bg-cream min-h-dvh pb-10">
      <TrackView event="home_viewed" />
      <RememberSession sessionId={sessionId} name={name} direction={direction} />

      <div className="bg-warm-glow border-b border-line">
        <header className="mx-auto max-w-2xl px-6 py-5">
          <Link href="/">
            <Wordmark />
          </Link>
        </header>
        <div className="mx-auto max-w-2xl px-6 pb-8 pt-1">
          <p className="text-sm font-semibold uppercase tracking-wider text-clay">
            오늘도, 한 걸음
          </p>
          <h1 className="mt-2 font-display text-[1.8rem] font-bold leading-snug text-ink sm:text-[2.1rem]">
            {name ? `${name}님, ` : ""}안녕하세요.
          </h1>
        </div>
      </div>

      <div className="mx-auto max-w-2xl space-y-5 px-6 pt-8">
        {/* Direction */}
        {direction && (
          <Link
            href={`/result/${sessionId}`}
            className="block rounded-3xl border border-line bg-surface p-6 shadow-sm transition hover:shadow-soft"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-clay">
              지금 향하는 방향
            </p>
            <p className="mt-2 font-display text-xl font-bold text-ink">
              {direction}
            </p>
            <p className="mt-1 text-sm text-ink-soft">진단 리포트 다시 보기 →</p>
          </Link>
        )}

        {/* Today's action */}
        <div className="overflow-hidden rounded-3xl border border-clay/30 bg-surface shadow-soft">
          <div className="bg-clay px-6 py-4 text-white">
            <p className="text-sm opacity-90">오늘의 작은 행동</p>
          </div>
          <div className="px-6 py-5">
            <p className="text-[1.05rem] font-medium leading-relaxed text-ink">
              {action}
            </p>
            <Link
              href={`/next/${sessionId}`}
              className="mt-5 inline-flex items-center gap-2 rounded-full bg-clay px-6 py-3 text-sm font-semibold text-white shadow-soft transition hover:bg-clay-deep"
            >
              오늘 기록하러 가기 →
            </Link>
          </div>
        </div>

        {/* This week */}
        <div className="grid grid-cols-2 gap-4">
          <Link
            href={`/next/${sessionId}/week`}
            className="rounded-3xl border border-line bg-surface p-5 shadow-sm transition hover:shadow-soft"
          >
            <p className="text-sm text-ink-soft">이번 주 기록</p>
            <p className="mt-1 font-display text-3xl font-bold text-ink">
              {weekCount}
              <span className="ml-1 text-base font-medium text-ink-faint">개</span>
            </p>
            <p className="mt-2 text-sm text-clay">주간 회고 보기 →</p>
          </Link>
          <div className="rounded-3xl border border-line bg-surface p-5 shadow-sm">
            <p className="text-sm text-ink-soft">최근 마음</p>
            <div className="mt-2 flex gap-1 text-2xl">
              {recentMoods.length ? (
                recentMoods.map((m, i) => <span key={i}>{moodEmoji[m]}</span>)
              ) : (
                <span className="text-base text-ink-faint">아직 없어요</span>
              )}
            </div>
            <p className="mt-2 text-sm text-ink-faint">
              감정도 방향의 일부예요.
            </p>
          </div>
        </div>

        {/* Recent note */}
        {notes.length > 0 && (
          <Link
            href={`/next/${sessionId}`}
            className="block rounded-3xl border border-line bg-surface p-6 shadow-sm transition hover:shadow-soft"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-sage">
              가장 최근 기록
            </p>
            {notes[notes.length - 1].reflection?.feedback ? (
              <p className="mt-2 leading-relaxed text-ink">
                {notes[notes.length - 1].reflection!.feedback}
              </p>
            ) : (
              <p className="mt-2 text-ink">
                {notes[notes.length - 1].todayAction || "기록을 남겼어요."}
              </p>
            )}
          </Link>
        )}

        <p className="pt-2 text-center text-sm text-ink-faint">
          크게 하지 않아도 괜찮아요. 멈추지만 않으면 돼요.
        </p>
      </div>
    </main>
  );
}
