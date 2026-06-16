// ─────────────────────────────────────────────────────────────
// Gentle Momentum — return-based metrics, NOT a productivity streak.
// Philosophy: show traces & the power to come back, never guilt.
//   • activeDaysLast7 / 30  — days with any record
//   • currentStreak         — consecutive days (only "ongoing" if today/yday)
//   • returnCount           — times she came back after a gap (celebrated!)
//   • gapDays               — days since last record (for re-entry warmth)
// ─────────────────────────────────────────────────────────────

import type { DailyNote } from "./types";

export interface Momentum {
  totalNotes: number;
  hasActivity: boolean;
  activeDaysLast7: number;
  activeDaysLast30: number;
  currentStreak: number;
  streakOngoing: boolean;
  returnCount: number;
  gapDays: number; // 0 = recorded today; large/negative-safe when none
  last7: { dayOffset: number; level: 0 | 1 | 2 }[]; // oldest→today dot preview
}

function dayNumFromDate(date: string): number {
  // date is YYYY-MM-DD (UTC, from todayDateString)
  return Math.floor(new Date(`${date}T00:00:00Z`).getTime() / 86_400_000);
}

export function computeMomentum(
  notes: DailyNote[],
  now: Date = new Date(),
): Momentum {
  const today = Math.floor(now.getTime() / 86_400_000);

  // intensity per active day: 1 = note only, 2 = note + reflection
  const levelByDay = new Map<number, 1 | 2>();
  for (const n of notes) {
    if (!n.date) continue;
    const d = dayNumFromDate(n.date);
    const lvl: 1 | 2 = n.reflection?.feedback ? 2 : 1;
    const prev = levelByDay.get(d);
    if (!prev || lvl > prev) levelByDay.set(d, lvl);
  }

  const dayNums = Array.from(levelByDay.keys()).sort((a, b) => a - b);

  const activeDaysLast7 = dayNums.filter(
    (d) => d > today - 7 && d <= today,
  ).length;
  const activeDaysLast30 = dayNums.filter(
    (d) => d > today - 30 && d <= today,
  ).length;

  // current streak (consecutive days), only "ongoing" if last record is
  // today or yesterday — a missed day doesn't shatter it loudly.
  let currentStreak = 0;
  let streakOngoing = false;
  if (dayNums.length) {
    const last = dayNums[dayNums.length - 1];
    if (today - last <= 1) {
      streakOngoing = true;
      currentStreak = 1;
      let prev = last;
      for (let i = dayNums.length - 2; i >= 0; i--) {
        if (prev - dayNums[i] === 1) {
          currentStreak++;
          prev = dayNums[i];
        } else break;
      }
    }
  }

  // returns: how many times a record followed a gap of ≥2 days
  let returnCount = 0;
  for (let i = 1; i < dayNums.length; i++) {
    if (dayNums[i] - dayNums[i - 1] >= 2) returnCount++;
  }

  const gapDays = dayNums.length ? today - dayNums[dayNums.length - 1] : 9999;

  // 7-day dot preview (oldest → today)
  const last7: { dayOffset: number; level: 0 | 1 | 2 }[] = [];
  for (let off = 6; off >= 0; off--) {
    const d = today - off;
    last7.push({ dayOffset: off, level: (levelByDay.get(d) ?? 0) as 0 | 1 | 2 });
  }

  return {
    totalNotes: notes.length,
    hasActivity: dayNums.length > 0,
    activeDaysLast7,
    activeDaysLast30,
    currentStreak,
    streakOngoing,
    returnCount,
    gapDays,
    last7,
  };
}

// Gentle headline/subcopy for the momentum widget — return-based, warm,
// no failure language. Picks the most encouraging true statement.
export function momentumCopy(m: Momentum): {
  headline: string;
  subcopy: string;
} {
  if (!m.hasActivity) {
    return {
      headline: "아직 흔적이 많지 않아도 괜찮아요",
      subcopy: "처음엔 한 줄 기록만 있어도 충분해요. 흐름은 그렇게 시작돼요.",
    };
  }
  if (m.gapDays >= 3) {
    return {
      headline: "다시 돌아오면 괜찮아요",
      subcopy: "며칠 비어도 괜찮아요. 이곳은 연속보다 다시 연결되는 걸 더 봐요.",
    };
  }
  if (m.streakOngoing && m.currentStreak >= 2) {
    return {
      headline: `${m.currentStreak}일째 흐름이 이어지고 있어요`,
      subcopy: "작은 연결이 계속 쌓이고 있어요.",
    };
  }
  if (m.returnCount >= 1) {
    return {
      headline: `이번 주, ${m.activeDaysLast7}번 돌아왔어요`,
      subcopy: "완벽하지 않아도 괜찮아요. 다시 연결된 날들이 쌓이고 있어요.",
    };
  }
  return {
    headline: `최근 7일 중 ${m.activeDaysLast7}일, 작은 움직임이 있었어요`,
    subcopy: "크게 하지 않아도 괜찮아요. 이어져 온 흔적이 더 중요해요.",
  };
}
