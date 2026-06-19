"use client";

import { useEffect } from "react";
import {
  loadCompassState,
  saveCompassState,
} from "@/lib/local-ontology-store";
import type { CompassState } from "@/lib/compass-engine";

const APPLIED_KEY_PREFIX = "compass-onboarding-applied:";
const initializing = new Set<string>();

export default function CompassOnboardingBridge({
  sessionId,
  input,
}: {
  sessionId: string;
  input: string;
}) {
  useEffect(() => {
    if (!input || initializing.has(sessionId)) return;

    const appliedKey = `${APPLIED_KEY_PREFIX}${sessionId}`;
    try {
      if (window.localStorage.getItem(appliedKey) === "1") return;
    } catch {
      // IndexedDB remains the source of truth when localStorage is unavailable.
    }

    initializing.add(sessionId);

    void initializeCompass(sessionId, input, appliedKey).finally(() => {
      initializing.delete(sessionId);
    });
  }, [input, sessionId]);

  return null;
}

async function initializeCompass(
  sessionId: string,
  input: string,
  appliedKey: string,
): Promise<void> {
  try {
    const current = await loadCompassState(new Date().toISOString());

    // Existing chat/dashboard signals always win. Never merge or overwrite them
    // with an onboarding report.
    if (current.beads.length > 0) return;

    const response = await fetch("/api/compass/compute", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ compass: current, input }),
    });
    if (!response.ok) return;

    const data = (await response.json()) as { compass?: CompassState };
    const next = data.compass;
    if (!next || !Array.isArray(next.beads) || next.beads.length === 0) return;

    // Re-check immediately before writing in case another tab or the chat page
    // added a real signal while the compute request was in flight.
    const latest = await loadCompassState(new Date().toISOString());
    if (latest.beads.length > 0) return;

    await saveCompassState(next);
    try {
      window.localStorage.setItem(appliedKey, "1");
    } catch {
      // The persisted Compass still makes this safe: future runs see beads.
    }
  } catch {
    // Onboarding results must stay usable even if Compass initialization fails.
  }
}
