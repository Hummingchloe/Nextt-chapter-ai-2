import { NextResponse } from "next/server";
import { searchYoutubeContent } from "@/lib/compass-extract";
import { contentTheme, deriveContent } from "@/lib/compass-content";
import { recompute, type CompassState } from "@/lib/compass-engine";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

// Deferred, search-only endpoint (the /api/proposal/search split). One web
// search, scoped to youtube.com, URLs validated from the tool result. Always
// returns *something*: real videos if found, else the deterministic
// deriveContent() URLs — so the dashboard never blocks or breaks on search.
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }
  const raw = (body as { compass?: CompassState } | null)?.compass;
  if (!raw || !Array.isArray(raw.beads) || !Array.isArray(raw.axes)) {
    return NextResponse.json({ error: "missing compass" }, { status: 400 });
  }
  const now = new Date().toISOString();
  const state = recompute(raw, now);

  const fallback = deriveContent(state);
  const real = await searchYoutubeContent(contentTheme(state));

  return NextResponse.json({
    links: real ?? fallback,
    source: real ? "web_search" : "fallback",
  });
}
