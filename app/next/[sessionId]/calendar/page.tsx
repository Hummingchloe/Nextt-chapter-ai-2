"use client";

import { use, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Wordmark } from "../../../components/Logo";
import NotesSubNav from "../../../components/NotesSubNav";
import { MOOD_OPTIONS } from "@/lib/note";
import { track } from "@/lib/track";
import type { DailyNote, MoodTag } from "@/lib/types";

const moodEmoji = Object.fromEntries(
  MOOD_OPTIONS.map((m) => [m.id, m.emoji]),
) as Record<MoodTag, string>;
const WEEK = ["일", "월", "화", "수", "목", "금", "토"];

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export default function CalendarPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = use(params);
  const [notes, setNotes] = useState<DailyNote[] | null>(null);
  const [offset, setOffset] = useState(0); // month offset from current
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    track("calendar_viewed", undefined, sessionId);
    fetch(`/api/note?sessionId=${encodeURIComponent(sessionId)}`)
      .then((r) => r.json())
      .then((d) => setNotes(d.notes ?? []))
      .catch(() => setNotes([]));
  }, [sessionId]);

  // date string → strongest note that day
  const byDate = useMemo(() => {
    const map = new Map<string, DailyNote>();
    for (const n of notes ?? []) {
      const prev = map.get(n.date);
      const lvl = n.reflection?.feedback ? 2 : 1;
      const prevLvl = prev?.reflection?.feedback ? 2 : prev ? 1 : 0;
      if (!prev || lvl >= prevLvl) map.set(n.date, n);
    }
    return map;
  }, [notes]);

  const now = new Date();
  const view = new Date(now.getFullYear(), now.getMonth() + offset, 1);
  const year = view.getFullYear();
  const month = view.getMonth();
  const todayStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;

  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (string | null)[] = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++)
    cells.push(`${year}-${pad(month + 1)}-${pad(d)}`);

  const selectedNote = selected ? byDate.get(selected) : undefined;

  return (
    <main className="bg-cream min-h-dvh pb-10">
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
            Calendar
          </p>
          <h1 className="mt-2 font-display text-[1.7rem] font-bold leading-snug text-ink sm:text-[2rem]">
            흔적 캘린더
          </h1>
          <p className="mt-2 text-ink-soft">
            당신이 움직였던 날들이 여기 남아 있어요.
          </p>
          <p className="mt-1 text-sm text-ink-faint">
            이건 성과표가 아니라, 다시 연결된 날들의 지도예요.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-2xl px-6 pt-6">
        <NotesSubNav sessionId={sessionId} />

        {/* Month nav */}
        <div className="mt-7 flex items-center justify-between">
          <button
            onClick={() => setOffset((o) => o - 1)}
            className="rounded-full border border-line px-3 py-1.5 text-ink-soft transition hover:border-clay hover:text-clay"
            aria-label="이전 달"
          >
            ←
          </button>
          <p className="font-display text-lg font-bold text-ink">
            {year}년 {month + 1}월
          </p>
          <button
            onClick={() => setOffset((o) => Math.min(0, o + 1))}
            disabled={offset >= 0}
            className="rounded-full border border-line px-3 py-1.5 text-ink-soft transition hover:border-clay hover:text-clay disabled:opacity-30"
            aria-label="다음 달"
          >
            →
          </button>
        </div>

        {/* Grid */}
        <div className="mt-5 rounded-3xl border border-line bg-surface p-4 shadow-sm">
          <div className="mb-2 grid grid-cols-7 text-center text-xs text-ink-faint">
            {WEEK.map((w) => (
              <span key={w} className="py-1">
                {w}
              </span>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {cells.map((date, i) => {
              if (!date) return <span key={i} />;
              const note = byDate.get(date);
              const level = note ? (note.reflection?.feedback ? 2 : 1) : 0;
              const isToday = date === todayStr;
              const day = Number(date.slice(8));
              return (
                <button
                  key={i}
                  onClick={() => note && setSelected(date)}
                  disabled={!note}
                  className={`relative flex aspect-square items-center justify-center rounded-xl text-sm transition ${
                    note ? "cursor-pointer hover:ring-2 hover:ring-clay/40" : "cursor-default"
                  } ${
                    level === 2
                      ? "bg-clay text-white"
                      : level === 1
                        ? "bg-clay/30 text-clay-deep"
                        : "text-ink-faint"
                  } ${isToday && level === 0 ? "ring-1 ring-clay/50" : ""}`}
                >
                  {note?.moodTag ? (
                    <span className="text-base">{moodEmoji[note.moodTag]}</span>
                  ) : (
                    day
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="mt-5 rounded-2xl bg-cream-2 p-4">
          <p className="mb-2 text-sm font-semibold text-ink-soft">
            이 표시들은 이런 뜻이에요
          </p>
          <ul className="space-y-1.5 text-sm text-ink-soft">
            <li className="flex items-center gap-2">
              <span className="inline-block h-3.5 w-3.5 rounded bg-clay/30" />
              Daily Note를 남겼어요
            </li>
            <li className="flex items-center gap-2">
              <span className="inline-block h-3.5 w-3.5 rounded bg-clay" />
              기록과 Reflection이 함께 있었어요
            </li>
          </ul>
          <p className="mt-3 text-xs text-ink-faint">
            빈 날은 실패가 아니에요. 그냥 비어 있던 날일 뿐이에요.
          </p>
        </div>
      </div>

      {/* Day detail */}
      {selected && selectedNote && (
        <div className="fixed inset-0 z-40 flex items-end justify-center sm:items-center">
          <button
            className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
            aria-label="닫기"
            onClick={() => setSelected(null)}
          />
          <div className="animate-fade-up relative z-10 w-full max-w-md rounded-t-3xl border border-line bg-surface p-6 shadow-lift sm:rounded-3xl">
            <div className="flex items-center justify-between">
              <p className="font-display text-lg font-bold text-ink">
                이날의 작은 움직임
              </p>
              <span className="text-sm text-ink-faint">{selected}</span>
            </div>
            <div className="mt-4 space-y-3 text-sm">
              {selectedNote.todayAction && (
                <Detail label="오늘 한 행동" value={selectedNote.todayAction} />
              )}
              {selectedNote.moodTag && (
                <Detail
                  label="그날의 기분"
                  value={`${moodEmoji[selectedNote.moodTag]} ${
                    MOOD_OPTIONS.find((m) => m.id === selectedNote.moodTag)?.label ?? ""
                  }`}
                />
              )}
              {selectedNote.insight && (
                <Detail label="남겨둔 한 줄" value={selectedNote.insight} />
              )}
              {selectedNote.nextStep && (
                <Detail label="다음 행동" value={selectedNote.nextStep} />
              )}
              {selectedNote.reflection?.feedback && (
                <div className="rounded-2xl bg-sage-tint/60 p-3">
                  <p className="text-xs font-semibold text-sage">
                    오늘의 한 줄 피드백
                  </p>
                  <p className="mt-1 leading-relaxed text-ink">
                    {selectedNote.reflection.feedback}
                  </p>
                </div>
              )}
            </div>
            <button
              onClick={() => setSelected(null)}
              className="mt-5 w-full rounded-full border border-line py-3 text-ink-soft transition hover:border-clay hover:text-clay"
            >
              닫기
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-ink-faint">
        {label}
      </p>
      <p className="mt-0.5 leading-relaxed text-ink">{value}</p>
    </div>
  );
}
