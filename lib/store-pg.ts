// ─────────────────────────────────────────────────────────────
// Postgres persistence (production / Vercel).
// Used automatically when DATABASE_URL (or POSTGRES_URL) is set.
// Works with Neon, Vercel Postgres, and Supabase connection strings.
//
// The whole DiagnosticSession is stored as a jsonb `data` column —
// matches PRD's "JSON fields are acceptable for MVP1". Swap to fully
// normalized columns later without touching route handlers.
// ─────────────────────────────────────────────────────────────

import postgres from "postgres";
import type { AnalyticsEvent, DiagnosticSession } from "./types";

const CONN =
  process.env.DATABASE_URL || process.env.POSTGRES_URL || "";

// Lazy singleton — never connects at import time (so the file store
// can stay the default when no DB is configured).
let _sql: ReturnType<typeof postgres> | null = null;
function sql() {
  if (!_sql) {
    _sql = postgres(CONN, {
      // Neon/Vercel poolers (pgbouncer) don't support prepared statements.
      prepare: false,
      max: 1,
      idle_timeout: 20,
    });
  }
  return _sql;
}

// postgres.js `json()` has a strict JSONValue type; our domain objects are
// typed interfaces. Round-trip to a plain JSON value to satisfy it safely.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function plain(v: unknown): any {
  return JSON.parse(JSON.stringify(v ?? null));
}

let schemaReady: Promise<void> | null = null;
function ensureSchema(): Promise<void> {
  if (!schemaReady) {
    const db = sql();
    schemaReady = (async () => {
      await db`
        CREATE TABLE IF NOT EXISTS sessions (
          id text PRIMARY KEY,
          data jsonb NOT NULL,
          started_at timestamptz NOT NULL DEFAULT now()
        )
      `;
      await db`
        CREATE TABLE IF NOT EXISTS events (
          id text PRIMARY KEY,
          session_id text,
          type text NOT NULL,
          meta jsonb,
          at timestamptz NOT NULL DEFAULT now()
        )
      `;
    })();
  }
  return schemaReady;
}

export async function createSession(
  partial: Partial<DiagnosticSession> & { id: string },
): Promise<DiagnosticSession> {
  await ensureSchema();
  const session: DiagnosticSession = {
    id: partial.id,
    name: partial.name,
    email: partial.email,
    locale: partial.locale ?? "ko-KR",
    status: "started",
    startedAt: partial.startedAt ?? new Date().toISOString(),
    answers: partial.answers ?? {},
    device: partial.device,
  };
  const db = sql();
  await db`
    INSERT INTO sessions (id, data, started_at)
    VALUES (${session.id}, ${db.json(plain(session))}, ${session.startedAt})
    ON CONFLICT (id) DO NOTHING
  `;
  return session;
}

export async function getSession(
  id: string,
): Promise<DiagnosticSession | undefined> {
  await ensureSchema();
  const db = sql();
  const rows = await db<{ data: DiagnosticSession }[]>`
    SELECT data FROM sessions WHERE id = ${id} LIMIT 1
  `;
  return rows[0]?.data;
}

export async function updateSession(
  id: string,
  patch: Partial<DiagnosticSession>,
): Promise<void> {
  await ensureSchema();
  const current = await getSession(id);
  if (!current) return;
  const next = { ...current, ...patch };
  const db = sql();
  await db`UPDATE sessions SET data = ${db.json(plain(next))} WHERE id = ${id}`;
}

export async function saveAnswer(
  id: string,
  key: string,
  value: string,
): Promise<void> {
  await ensureSchema();
  const current = await getSession(id);
  if (!current) return;
  const next = {
    ...current,
    answers: { ...current.answers, [key]: value },
  };
  const db = sql();
  await db`UPDATE sessions SET data = ${db.json(plain(next))} WHERE id = ${id}`;
}

export async function listSessions(): Promise<DiagnosticSession[]> {
  await ensureSchema();
  const db = sql();
  const rows = await db<{ data: DiagnosticSession }[]>`
    SELECT data FROM sessions ORDER BY started_at DESC
  `;
  return rows.map((r) => r.data);
}

export async function logEvent(ev: AnalyticsEvent): Promise<void> {
  await ensureSchema();
  const db = sql();
  await db`
    INSERT INTO events (id, session_id, type, meta, at)
    VALUES (${ev.id}, ${ev.sessionId ?? null}, ${ev.type}, ${
      ev.meta ? db.json(plain(ev.meta)) : null
    }, ${ev.at})
    ON CONFLICT (id) DO NOTHING
  `;
}

export async function listEvents(): Promise<AnalyticsEvent[]> {
  await ensureSchema();
  const db = sql();
  const rows = await db<
    { id: string; session_id: string | null; type: string; meta: unknown; at: string }[]
  >`SELECT id, session_id, type, meta, at FROM events ORDER BY at ASC`;
  return rows.map((r) => ({
    id: r.id,
    sessionId: r.session_id ?? undefined,
    type: r.type,
    meta: (r.meta as Record<string, unknown>) ?? undefined,
    at: typeof r.at === "string" ? r.at : new Date(r.at).toISOString(),
  }));
}
