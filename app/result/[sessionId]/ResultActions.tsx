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

export function FollowUpCTA({ sessionId }: { sessionId: string }) {
  const items = [
    { t: "내 오퍼 문장 다듬기", d: "첫 제안을 더 자연스럽게", soon: true },
    { t: "첫 고객 메시지 만들기", d: "보낼 메시지 초안 생성", soon: true },
    { t: "결과 이메일로 받기", d: "나중에 다시 보기", soon: true },
  ];
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {items.map((it) => (
        <button
          key={it.t}
          onClick={() => track("followup_cta_clicked", { label: it.t }, sessionId)}
          className="rounded-2xl border border-line bg-surface px-5 py-4 text-left transition hover:border-clay hover:shadow-soft"
        >
          <p className="font-semibold text-ink">{it.t}</p>
          <p className="mt-1 text-sm text-ink-soft">{it.d}</p>
          {it.soon && (
            <span className="mt-2 inline-block rounded-full bg-sage-tint px-2.5 py-0.5 text-xs font-medium text-sage">
              곧 만나요
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
