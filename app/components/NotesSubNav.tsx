"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Segmented control across the Notes area: records / calendar / timeline.
export default function NotesSubNav({ sessionId }: { sessionId: string }) {
  const pathname = usePathname() || "";
  const base = `/next/${sessionId}`;
  const tabs = [
    { label: "기록", href: base, active: pathname === base },
    {
      label: "캘린더",
      href: `${base}/calendar`,
      active: pathname.endsWith("/calendar"),
    },
    {
      label: "타임라인",
      href: `${base}/timeline`,
      active: pathname.endsWith("/timeline"),
    },
  ];

  return (
    <div className="flex gap-1 rounded-full border border-line bg-cream-2 p-1">
      {tabs.map((t) => (
        <Link
          key={t.href}
          href={t.href}
          className={`flex-1 rounded-full py-2 text-center text-sm font-medium transition ${
            t.active
              ? "bg-surface text-clay-deep shadow-sm"
              : "text-ink-soft hover:text-clay"
          }`}
        >
          {t.label}
        </Link>
      ))}
    </div>
  );
}
