"use client";

import { useEffect } from "react";
import { track } from "@/lib/track";

export default function TrackView({
  event,
  meta,
}: {
  event: string;
  meta?: Record<string, unknown>;
}) {
  useEffect(() => {
    track(event, meta);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}
