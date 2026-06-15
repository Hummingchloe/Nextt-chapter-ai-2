// ─────────────────────────────────────────────────────────────
// Local file persistence (development / no-DB fallback).
// Used automatically when DATABASE_URL is NOT set.
// Writes to data/db.json. Not used on Vercel (read-only FS).
// ─────────────────────────────────────────────────────────────

import { promises as fs } from "fs";
import path from "path";
import type { AnalyticsEvent, DB, DiagnosticSession } from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "db.json");

const EMPTY_DB: DB = { sessions: [], events: [] };

// Serialize writes so concurrent requests don't clobber the file.
let writeChain: Promise<void> = Promise.resolve();

async function ensureFile(): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(DB_PATH);
  } catch {
    await fs.writeFile(DB_PATH, JSON.stringify(EMPTY_DB, null, 2), "utf-8");
  }
}

async function readDB(): Promise<DB> {
  await ensureFile();
  try {
    const raw = await fs.readFile(DB_PATH, "utf-8");
    const parsed = JSON.parse(raw) as DB;
    return {
      sessions: parsed.sessions ?? [],
      events: parsed.events ?? [],
    };
  } catch {
    return { ...EMPTY_DB };
  }
}

async function writeDB(db: DB): Promise<void> {
  await ensureFile();
  const tmp = DB_PATH + ".tmp";
  await fs.writeFile(tmp, JSON.stringify(db, null, 2), "utf-8");
  await fs.rename(tmp, DB_PATH);
}

function mutate(fn: (db: DB) => void | Promise<void>): Promise<void> {
  writeChain = writeChain.then(async () => {
    const db = await readDB();
    await fn(db);
    await writeDB(db);
  });
  return writeChain;
}

export async function createSession(
  partial: Partial<DiagnosticSession> & { id: string },
): Promise<DiagnosticSession> {
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
  await mutate((db) => {
    if (!db.sessions.find((s) => s.id === session.id)) {
      db.sessions.push(session);
    }
  });
  return session;
}

export async function getSession(
  id: string,
): Promise<DiagnosticSession | undefined> {
  const db = await readDB();
  return db.sessions.find((s) => s.id === id);
}

export async function updateSession(
  id: string,
  patch: Partial<DiagnosticSession>,
): Promise<void> {
  await mutate((db) => {
    const s = db.sessions.find((x) => x.id === id);
    if (s) Object.assign(s, patch);
  });
}

export async function saveAnswer(
  id: string,
  key: string,
  value: string,
): Promise<void> {
  await mutate((db) => {
    const s = db.sessions.find((x) => x.id === id);
    if (s) s.answers[key] = value;
  });
}

export async function listSessions(): Promise<DiagnosticSession[]> {
  const db = await readDB();
  return [...db.sessions].sort((a, b) =>
    b.startedAt.localeCompare(a.startedAt),
  );
}

export async function logEvent(ev: AnalyticsEvent): Promise<void> {
  await mutate((db) => {
    db.events.push(ev);
  });
}

export async function listEvents(): Promise<AnalyticsEvent[]> {
  const db = await readDB();
  return db.events;
}
