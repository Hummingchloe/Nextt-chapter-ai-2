// ─────────────────────────────────────────────────────────────
// Storage dispatcher.
//   • DATABASE_URL / POSTGRES_URL set  → Postgres (production / Vercel)
//   • otherwise                        → local JSON file (dev)
// Route handlers import only from here and never know the difference.
// ─────────────────────────────────────────────────────────────

import * as fileStore from "./store-file";
import * as pgStore from "./store-pg";
import { hasDb } from "./db-url";

const usePostgres = hasDb();

const impl = usePostgres ? pgStore : fileStore;

export const createSession = impl.createSession;
export const getSession = impl.getSession;
export const updateSession = impl.updateSession;
export const saveAnswer = impl.saveAnswer;
export const listSessions = impl.listSessions;
export const logEvent = impl.logEvent;
export const listEvents = impl.listEvents;

export const storageBackend = usePostgres ? "postgres" : "file";
