"use client";

// Browser persistence for the local-first ontology MVP.
// The server never imports this file.

import { createEmptyOntology, normalizeOntology, type UserOntology } from "./ontology";
import { createEmptyCompass, recompute, type CompassState } from "./compass-engine";
import type { ProposalDashboard, ProposalGenerationDiagnostics } from "./proposal";

const DB_NAME = "my-next-chapter-local";
const DB_VERSION = 1;
const STORE = "ontology";
const ACTIVE_KEY = "active";
const PROPOSAL_KEY = "proposal";
const COMPASS_KEY = "compass-v2";

export interface CachedProposal {
  ontologyUpdatedAt: string;
  dashboard: ProposalDashboard;
  diagnostics: ProposalGenerationDiagnostics;
}

export async function loadLocalOntology(): Promise<UserOntology> {
  const db = await openDb();
  const stored = await request<Partial<UserOntology> | undefined>(
    db.transaction(STORE, "readonly").objectStore(STORE).get(ACTIVE_KEY),
  );
  return normalizeOntology(stored);
}

export async function saveLocalOntology(ontology: UserOntology): Promise<void> {
  const db = await openDb();
  await request(
    db.transaction(STORE, "readwrite").objectStore(STORE).put(ontology, ACTIVE_KEY),
  );
}

export async function resetLocalOntology(): Promise<UserOntology> {
  const ontology = createEmptyOntology();
  const db = await openDb();
  const store = db.transaction(STORE, "readwrite").objectStore(STORE);
  await request(store.put(ontology, ACTIVE_KEY));
  await request(store.delete(PROPOSAL_KEY));
  return ontology;
}

// ── Vector compass state (the new engine) ───────────────────────
// Source of truth lives here in IndexedDB; the server only computes and returns.
export async function loadCompassState(nowISO: string): Promise<CompassState> {
  const db = await openDb();
  const stored = await request<CompassState | undefined>(
    db.transaction(STORE, "readonly").objectStore(STORE).get(COMPASS_KEY),
  );
  if (stored && Array.isArray(stored.beads) && Array.isArray(stored.axes)) {
    // Recompute on load so derived fields (M, status) reflect current decay.
    return recompute(stored, nowISO);
  }
  return createEmptyCompass(nowISO);
}

export async function saveCompassState(state: CompassState): Promise<void> {
  const db = await openDb();
  await request(
    db.transaction(STORE, "readwrite").objectStore(STORE).put(state, COMPASS_KEY),
  );
}

export async function resetCompassState(nowISO: string): Promise<CompassState> {
  const fresh = createEmptyCompass(nowISO);
  const db = await openDb();
  await request(db.transaction(STORE, "readwrite").objectStore(STORE).put(fresh, COMPASS_KEY));
  return fresh;
}

export async function loadCachedProposal(): Promise<CachedProposal | null> {
  const db = await openDb();
  const stored = await request<CachedProposal | undefined>(
    db.transaction(STORE, "readonly").objectStore(STORE).get(PROPOSAL_KEY),
  );
  return stored?.dashboard ? stored : null;
}

export async function saveCachedProposal(proposal: CachedProposal): Promise<void> {
  const db = await openDb();
  await request(
    db.transaction(STORE, "readwrite").objectStore(STORE).put(proposal, PROPOSAL_KEY),
  );
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB is not available"));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error("Failed to open IndexedDB"));
  });
}

function request<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error("IndexedDB request failed"));
  });
}
