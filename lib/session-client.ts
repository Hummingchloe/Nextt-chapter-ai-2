"use client";

// Browser-remembered sessions. No login — we keep the user's past
// diagnoses in localStorage so she can return to any report, and jump
// straight into her daily log / weekly reflection. Most recent = active.

const KEY = "mnc_sessions";
const LEGACY_KEY = "mnc_session";

export interface LocalSession {
  sessionId: string;
  name?: string;
  direction?: string; // top recommended direction label (for the report list)
  at: number;
}

function readAll(): LocalSession[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) return arr.filter((s) => s?.sessionId);
    }
    // migrate a legacy single-session entry
    const old = window.localStorage.getItem(LEGACY_KEY);
    if (old) {
      const o = JSON.parse(old);
      if (o?.sessionId) {
        const list = [o as LocalSession];
        writeAll(list);
        return list;
      }
    }
  } catch {
    /* ignore */
  }
  return [];
}

function writeAll(list: LocalSession[]): void {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    /* storage may be unavailable (private mode) */
  }
}

export function saveLocalSession(
  sessionId: string,
  name?: string,
  direction?: string,
): void {
  if (typeof window === "undefined") return;
  const list = readAll();
  const i = list.findIndex((s) => s.sessionId === sessionId);
  const prev = i >= 0 ? list[i] : undefined;
  const entry: LocalSession = {
    sessionId,
    name: name ?? prev?.name,
    direction: direction ?? prev?.direction,
    at: Date.now(),
  };
  if (i >= 0) list[i] = entry;
  else list.push(entry);
  writeAll(list);
}

export function getLocalSession(): LocalSession | null {
  const list = readAll().sort((a, b) => b.at - a.at);
  return list[0] ?? null;
}

export function listLocalSessions(): LocalSession[] {
  return readAll().sort((a, b) => b.at - a.at);
}

export function clearLocalSessions(): void {
  try {
    window.localStorage.removeItem(KEY);
    window.localStorage.removeItem(LEGACY_KEY);
  } catch {
    /* ignore */
  }
}
