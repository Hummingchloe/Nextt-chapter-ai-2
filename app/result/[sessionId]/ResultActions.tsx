"use client";

import { useState } from "react";
import { track } from "@/lib/track";

export default function ResultActions({
  sessionId,
  reportText,
  name,
}: {
  sessionId: string;
  reportText: string;
  name?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(reportText);
      setCopied(true);
      track("result_copied", undefined, sessionId);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }

  async function share() {
    track("result_shared", undefined, sessionId);
    const shareData = {
      title: "My Life Compass 진단 결과",
      text: `${name ? name + "님의 " : ""}진단 결과를 확인해보세요.`,
      url: typeof window !== "undefined" ? window.location.href : undefined,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        alert("결과 링크를 복사했어요. 어디에든 붙여넣어 보관하세요.");
      }
    } catch {
      /* user canceled */
    }
  }

  function saveTxt() {
    track("result_saved", undefined, sessionId);
    const blob = new Blob([reportText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `my-life-compass-${name || "result"}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex flex-wrap items-center justify-center gap-3">
      <button
        onClick={copy}
        className="rounded-full border border-line bg-surface px-5 py-2.5 text-sm font-medium text-ink transition hover:border-clay hover:text-clay"
      >
        {copied ? "복사됐어요 ✓" : "결과 복사"}
      </button>
      <button
        onClick={share}
        className="rounded-full border border-line bg-surface px-5 py-2.5 text-sm font-medium text-ink transition hover:border-clay hover:text-clay"
      >
        공유하기
      </button>
      <button
        onClick={saveTxt}
        className="rounded-full border border-line bg-surface px-5 py-2.5 text-sm font-medium text-ink transition hover:border-clay hover:text-clay"
      >
        텍스트로 저장
      </button>
      <button
        onClick={() => {
          track("result_print", undefined, sessionId);
          window.print();
        }}
        className="rounded-full border border-line bg-surface px-5 py-2.5 text-sm font-medium text-ink transition hover:border-clay hover:text-clay"
      >
        인쇄 / PDF
      </button>
    </div>
  );
}
