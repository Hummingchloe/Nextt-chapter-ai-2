import { NextResponse } from "next/server";
import { synthesizeEssence } from "@/lib/compass-extract";
import type { CompassState } from "@/lib/compass-engine";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

// Deferred enrichment: compress the beads into one essence sentence. Split out
// of /compute so the chat round-trip stays fast; the client fires this after
// compute returns and updates only the one-liner.
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }
  const compass = (body as { compass?: CompassState } | null)?.compass;
  if (!compass || !Array.isArray(compass.beads) || !Array.isArray(compass.axes)) {
    return NextResponse.json({ error: "missing compass" }, { status: 400 });
  }
  const oneLiner = await synthesizeEssence(compass.beads, compass.axes, compass.compass?.dir ?? []);
  return NextResponse.json({ oneLiner });
}
