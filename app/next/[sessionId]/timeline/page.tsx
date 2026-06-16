import Link from "next/link";
import { notFound } from "next/navigation";
import { getSession, listNotes } from "@/lib/store";
import { buildTimeline } from "@/lib/timeline";
import { Wordmark } from "../../../components/Logo";
import TrackView from "../../../components/TrackView";
import NotesSubNav from "../../../components/NotesSubNav";

export const dynamic = "force-dynamic";

function fmt(date: string): string {
  try {
    return new Date(date).toLocaleDateString("ko-KR", {
      month: "long",
      day: "numeric",
    });
  } catch {
    return date.slice(0, 10);
  }
}

export default async function TimelinePage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  const session = await getSession(sessionId);
  if (!session) notFound();

  const notes = await listNotes(sessionId);
  const events = buildTimeline(session, notes);

  return (
    <main className="bg-cream min-h-dvh pb-10">
      <TrackView event="timeline_viewed" meta={{ events: events.length }} />

      <div className="bg-warm-glow border-b border-line">
        <header className="mx-auto flex max-w-2xl items-center justify-between px-6 py-5">
          <Link href="/">
            <Wordmark />
          </Link>
          <Link
            href={`/next/${sessionId}`}
            className="text-sm text-ink-soft transition hover:text-clay"
          >
            내 기록
          </Link>
        </header>
        <div className="mx-auto max-w-2xl px-6 pb-8 pt-1">
          <p className="text-sm font-semibold uppercase tracking-wider text-clay">
            Timeline
          </p>
          <h1 className="mt-2 font-display text-[1.7rem] font-bold leading-snug text-ink sm:text-[2rem]">
            나의 타임라인
          </h1>
          <p className="mt-2 text-ink-soft">
            어떻게 여기까지 왔는지, 작은 전환점들을 따라가볼게요.
          </p>
          <p className="mt-1 text-sm text-ink-faint">
            완벽한 성취보다, 방향이 선명해진 순간들이 더 중요해요.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-2xl px-6 pt-6">
        <NotesSubNav sessionId={sessionId} />

        {events.length === 0 ? (
          <div className="mt-8 rounded-3xl border border-dashed border-line bg-surface/60 px-6 py-14 text-center">
            <p className="font-medium text-ink">아직 타임라인이 비어 있어요.</p>
            <p className="mt-1 text-sm text-ink-soft">
              작은 기록들이 쌓이면, 생각보다 분명한 변화가 보여요.
            </p>
            <Link
              href={`/next/${sessionId}/note`}
              className="mt-5 inline-block rounded-full bg-clay px-6 py-3 font-semibold text-white"
            >
              오늘 기록 남기기 →
            </Link>
          </div>
        ) : (
          <ol className="relative mt-8 space-y-6 border-l-2 border-line pl-7">
            {events.map((e, i) => (
              <li key={i} className="relative">
                <span className="absolute -left-[2.45rem] flex h-9 w-9 items-center justify-center rounded-full border border-line bg-surface text-sm shadow-sm">
                  {e.icon}
                </span>
                <div className="rounded-2xl border border-line bg-surface p-5 shadow-sm">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-display text-base font-bold text-ink">
                      {e.title}
                    </p>
                    <span className="shrink-0 text-xs text-ink-faint">
                      {fmt(e.date)}
                    </span>
                  </div>
                  <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
                    {e.summary}
                  </p>
                  {e.href && (
                    <Link
                      href={e.href}
                      className="mt-2 inline-block text-sm text-clay"
                    >
                      이 기록 보기 →
                    </Link>
                  )}
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>
    </main>
  );
}
