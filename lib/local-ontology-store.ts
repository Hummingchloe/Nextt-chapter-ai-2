"use client";

// Browser persistence for the local-first ontology MVP.
// The server never imports this file.

import { createEmptyOntology, normalizeOntology, type UserOntology } from "./ontology";

const DB_NAME = "my-next-chapter-local";
const DB_VERSION = 1;
const STORE = "ontology";
const ACTIVE_KEY = "active";

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
  await saveLocalOntology(ontology);
  return ontology;
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
