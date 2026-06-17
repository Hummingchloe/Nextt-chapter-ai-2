import { NextResponse } from "next/server";
import { getSession, listNotes, logEvent } from "@/lib/store";
import { weeklyReflectionAI } from "@/lib/ai";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get("sessionId");
  if (!sessionId) {
    return NextResponse.json({ error: "missing sessionId" }, { status: 400 });
  }

  const session = await getSession(sessionId);
  if (!session) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const periodParam = searchParams.get("period");
  const period =
    periodParam === "month" || periodParam === "quarter" ? periodParam : "week";

  const notes = await listNotes(sessionId);
  const direction = session.report?.topRecommendation.label;
  const weekly = await weeklyReflectionAI(notes, direction, period);

  await logEvent({
    id: `e_${Date.now()}_${Math.round(Math.random() * 1e6)}`,
    sessionId,
    type: "weekly_viewed",
    meta: { noteCount: notes.length, period },
    at: new Date().toISOString(),
  });

  return NextResponse.json({ weekly, noteCount: notes.length, period });
}
