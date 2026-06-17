"use client";

import { useState } from "react";
import { track } from "@/lib/track";
import type { ExpertLens } from "@/lib/expert-lens";

export default function ExpertLensCard({
  lens,
  sessionId,
}: {
  lens: ExpertLens;
  sessionId?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copyOutreach() {
    try {
      await navigator.clipboard.writeText(lens.outreachDraft);
      setCopied(true);
      track("expert_outreach_copied", undefined, sessionId);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-clay/30 bg-surface shadow-soft">
      <div className="bg-clay/10 px-6 py-3">
        <p className="flex items-center gap-2 text-sm font-semibold text-clay-deep">
          🔎 전문가 렌즈
        </p>
      </div>
      <div className="space-y-4 px-6 py-5">
        <Row label="지금 막힌 지점" value={lens.blocker} />
        <Row label="참고하면 좋은 관점" value={lens.perspective} accent />
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-faint">
            찾아보면 좋은 것
          </p>
          <ul className="mt-1.5 space-y-1">
            {lens.searchHints.map((h, i) => (
              <li key={i} className="text-sm text-ink-soft">
                🔍 {h}
              </li>
            ))}
          </ul>
        </div>
        <Row label="내 상황에 적용하면" value={lens.apply} />
        <div className="rounded-2xl bg-sage-tint/60 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-sage">
            오늘의 작은 행동
          </p>
          <p className="mt-1 leading-relaxed text-ink">{lens.action}</p>
        </div>

        {/* 아웃리치 초안 (LinkedIn/메신저로 직접 전송 — 자동화 아님) */}
        <div className="rounded-2xl border border-line bg-cream-2 p-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-faint">
              보낼 수 있는 메시지 초안
            </p>
            <button
              onClick={copyOutreach}
              className="rounded-full border border-line bg-surface px-3 py-1 text-xs font-medium text-ink transition hover:border-clay hover:text-clay"
            >
              {copied ? "복사됨 ✓" : "복사"}
            </button>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-ink">
            {lens.outreachDraft}
          </p>
        </div>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-ink-faint">
        {label}
      </p>
      <p
        className={`mt-1 leading-relaxed ${accent ? "font-medium text-ink" : "text-ink-soft"}`}
      >
        {value}
      </p>
    </div>
  );
}
