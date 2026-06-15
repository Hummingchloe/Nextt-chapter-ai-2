import { NextResponse } from "next/server";
import { listEvents, listSessions } from "@/lib/store";
import { QUESTIONS } from "@/lib/questions";

export const runtime = "nodejs";

export async function GET() {
  const [sessions, events] = await Promise.all([listSessions(), listEvents()]);

  const total = sessions.length;
  const completed = sessions.filter((s) => s.status === "completed").length;
  const completionRate = total ? Math.round((completed / total) * 100) : 0;

  // Direction distribution
  const directionCounts: Record<string, number> = {};
  for (const s of sessions) {
    if (s.topRecommendedDirection) {
      directionCounts[s.topRecommendedDirection] =
        (directionCounts[s.topRecommendedDirection] ?? 0) + 1;
    }
  }

  // Drop-off: how far each session got through the question set
  const questionKeys = QUESTIONS.map((q) => q.key);
  const reachedCount: Record<string, number> = {};
  for (const key of questionKeys) reachedCount[key] = 0;
  for (const s of sessions) {
    for (const key of questionKeys) {
      if (s.answers[key] !== undefined && s.answers[key] !== "") {
        reachedCount[key] += 1;
      }
    }
  }
  const dropOff = questionKeys.map((key, i) => ({
    key,
    index: i + 1,
    answered: reachedCount[key],
  }));

  // Average completion time (completed only)
  const times = sessions
    .filter((s) => s.completionTimeSeconds != null)
    .map((s) => s.completionTimeSeconds as number);
  const avgCompletionSeconds = times.length
    ? Math.round(times.reduce((a, b) => a + b, 0) / times.length)
    : 0;

  const device = { mobile: 0, desktop: 0 };
  for (const s of sessions) {
    if (s.device === "mobile") device.mobile += 1;
    else device.desktop += 1;
  }

  return NextResponse.json({
    summary: {
      total,
      completed,
      completionRate,
      avgCompletionSeconds,
      device,
      eventCount: events.length,
    },
    directionCounts,
    dropOff,
    sessions,
  });
}
