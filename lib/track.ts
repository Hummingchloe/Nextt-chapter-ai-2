// Client-side analytics helper — fire-and-forget event logging.
"use client";

export function track(
  type: string,
  meta?: Record<string, unknown>,
  sessionId?: string,
): void {
  try {
    const body = JSON.stringify({ type, meta, sessionId });
    if (typeof navigator !== "undefined" && navigator.sendBeacon) {
      navigator.sendBeacon(
        "/api/event",
        new Blob([body], { type: "application/json" }),
      );
    } else {
      void fetch("/api/event", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body,
        keepalive: true,
      });
    }
  } catch {
    /* analytics must never break UX */
  }
}

export function detectDevice(): "mobile" | "desktop" {
  if (typeof window === "undefined") return "desktop";
  return window.matchMedia("(max-width: 768px)").matches ? "mobile" : "desktop";
}
