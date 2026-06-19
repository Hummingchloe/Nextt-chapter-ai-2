"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { detectDevice, track } from "@/lib/track";

interface OnboardingStartButtonProps {
  children: ReactNode;
  className?: string;
}

export default function OnboardingStartButton({
  children,
  className,
}: OnboardingStartButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function startOnboarding() {
    if (loading) return;
    setLoading(true);

    try {
      const response = await fetch("/api/session", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ device: detectDevice() }),
      });
      if (!response.ok) throw new Error("session creation failed");

      const { sessionId } = await response.json();
      track("diagnostic_started", { source: "landing" }, sessionId);
      router.push(`/diagnostic?sid=${encodeURIComponent(sessionId)}`);
    } catch {
      setLoading(false);
      alert("연결에 문제가 있었어요. 잠시 후 다시 시도해 주세요.");
    }
  }

  return (
    <button
      type="button"
      onClick={startOnboarding}
      disabled={loading}
      className={className}
    >
      {loading ? "질문을 준비하고 있어요…" : children}
    </button>
  );
}
