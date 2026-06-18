import { NextResponse } from "next/server";
import { generateCoachReply, type CoachTurn } from "@/lib/compass-reply";
import { recompute, type CompassState } from "@/lib/compass-engine";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

// Conversational coach reply. Its own request, called in parallel with /compute
// from the client — never chained, so no timeout risk. Returns { reply: null }
// on no-key/failure; the client then shows a simple human acknowledgment.
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }
  const b = (body ?? {}) as { compass?: CompassState; input?: unknown; history?: unknown };

  const input = typeof b.input === "string" ? b.input.trim() : "";
  if (!input) return NextResponse.json({ error: "missing input" }, { status: 400 });
  if (!b.compass || !Array.isArray(b.compass.beads) || !Array.isArray(b.compass.axes)) {
    return NextResponse.json({ error: "missing compass" }, { status: 400 });
  }

  const history: CoachTurn[] = Array.isArray(b.history)
    ? (b.history as unknown[])
        .filter(
          (t): t is CoachTurn =>
            !!t &&
            typeof t === "object" &&
            (((t as CoachTurn).role === "user") || ((t as CoachTurn).role === "assistant")) &&
            typeof (t as CoachTurn).text === "string" &&
            (t as CoachTurn).text.trim().length > 0,
        )
        .slice(-8)
    : [];

  const compass = recompute(b.compass, new Date().toISOString());
  const reply = await generateCoachReply({ input, history, compass });
  return NextResponse.json({ reply });
}
