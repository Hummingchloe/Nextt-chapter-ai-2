import { NextResponse } from "next/server";
import { presentDbVars, resolveDbUrl } from "@/lib/db-url";
import { listSessions, storageBackend } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Diagnostic endpoint — confirms env wiring + DB connectivity on the
// live deployment without needing access to server logs.
export async function GET() {
  const url = resolveDbUrl();
  let host: string | null = null;
  try {
    if (url) host = new URL(url).host;
  } catch {
    /* ignore */
  }

  const env = {
    backend: storageBackend,
    dbVarsPresent: presentDbVars(),
    dbHost: host, // host only — never the password
    anthropicKey: Boolean(process.env.ANTHROPIC_API_KEY),
    anthropicModel: process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6",
  };

  let db: string;
  let error: string | null = null;
  try {
    const sessions = await listSessions();
    db = `ok (${sessions.length} sessions)`;
  } catch (e) {
    db = "error";
    error = e instanceof Error ? `${e.name}: ${e.message}` : String(e);
  }

  return NextResponse.json({ ok: error === null, env, db, error });
}
