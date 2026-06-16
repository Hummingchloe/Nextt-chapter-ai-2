"use client";

import { useEffect } from "react";
import { saveLocalSession } from "@/lib/session-client";

// Persists a session (with its direction) to the browser so it shows up
// in the report list and the tab bar. Rendered on result / home pages.
export default function RememberSession({
  sessionId,
  name,
  direction,
}: {
  sessionId: string;
  name?: string;
  direction?: string;
}) {
  useEffect(() => {
    saveLocalSession(sessionId, name, direction);
  }, [sessionId, name, direction]);
  return null;
}
