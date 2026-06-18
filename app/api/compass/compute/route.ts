import { NextResponse } from "next/server";
import {
  addBeads,
  createEmptyCompass,
  recompute,
  type CompassState,
} from "@/lib/compass-engine";
import { DEFAULT_AXES, extractBeads, induceAxes } from "@/lib/compass-extract";
import { extractBeadsHeuristic } from "@/lib/compass-fallback";
import { deriveActions } from "@/lib/compass-actions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Keep this endpoint on a short, predictable critical path. The essence
// one-liner and YouTube search are split into their own deferred endpoints
// (/api/compass/essence, /api/compass/content) so we never chain heavy LLM
// work in one request — the Vercel-timeout lesson.
export const maxDuration = 30;

// Stateless calculator: text in → updated CompassState + actions out. The
// client persists the state to IndexedDB (source of truth); we store nothing.
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const input = readString(body, "input").trim();
  if (!input) return NextResponse.json({ error: "missing input" }, { status: 400 });
  if (input.length > 4000) return NextResponse.json({ error: "input too long" }, { status: 413 });

  const now = new Date().toISOString();
  const seed = Date.now().toString(36);

  // Load incoming state (or start fresh). Learn the axis space once, on the
  // first message, then keep it stable so beads never need reprojection.
  let state = normalizeCompass(readObject(body, "compass"), now);
  let inducedAxes = false;
  if (state.axes.length === 0) {
    const induced = await induceAxes([input], now);
    const axes = induced?.axes ?? DEFAULT_AXES;
    inducedAxes = Boolean(induced);
    state = createEmptyCompass(now, axes);
  }

  // Extract beads: LLM if a key is set, deterministic heuristic otherwise.
  const llm = await extractBeads(input, state.axes, now, seed);
  const aiUsed = Boolean(llm);
  const beads = llm?.beads ?? extractBeadsHeuristic(input, state.axes, now, seed);

  const next = addBeads(state, beads, now);
  const actions = deriveActions(next, now);

  return NextResponse.json({
    compass: next,
    actions,
    persistence: "local-first-no-server-write",
    ai: {
      used: aiUsed,
      provider: aiUsed ? "anthropic" : "deterministic-fallback",
      model: llm?.model,
      axisInduced: inducedAxes,
      beadCount: beads.length,
    },
  });
}

function normalizeCompass(raw: Record<string, unknown> | null, now: string): CompassState {
  if (raw && Array.isArray(raw.beads) && Array.isArray(raw.axes)) {
    return recompute(raw as unknown as CompassState, now);
  }
  return createEmptyCompass(now);
}

function readString(body: unknown, key: string): string {
  if (!body || typeof body !== "object") return "";
  const value = (body as Record<string, unknown>)[key];
  return typeof value === "string" ? value : "";
}

function readObject(body: unknown, key: string): Record<string, unknown> | null {
  if (!body || typeof body !== "object") return null;
  const value = (body as Record<string, unknown>)[key];
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
}
