"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { getLocalSession, saveLocalSession } from "@/lib/session-client";

// Line icons (stroke = currentColor) matching the warm aesthetic.
function Icon({ name }: { name: string }) {
  const common = {
    width: 22,
    height: 22,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  switch (name) {
    case "home":
      return (
        <svg {...common}>
          <path d="M4 11.5 12 5l8 6.5" />
          <path d="M6 10.5V19h12v-8.5" />
        </svg>
      );
    case "diagnose":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8" />
          <path d="M15 9l-2.5 4.5L8 16l2.5-4.5L15 9z" />
        </svg>
      );
    case "report":
      return (
        <svg {...common}>
          <path d="M7 3.5h7L18 7v13.5H7z" />
          <path d="M14 3.5V7h4" />
          <path d="M9.5 12h6M9.5 15.5h6" />
        </svg>
      );
    case "note":
      return (
        <svg {...common}>
          <path d="M6 4h11a1 1 0 0 1 1 1v15l-3-2-3 2V4" />
          <path d="M6 4a1 1 0 0 0-1 1v13a1 1 0 0 0 1 1h2" />
        </svg>
      );
    case "weekly":
      return (
        <svg {...common}>
          <rect x="4" y="5" width="16" height="15" rx="2" />
          <path d="M4 9h16M8 3.5v3M16 3.5v3" />
          <path d="M12 13v2.2l1.6 1" />
        </svg>
      );
    default:
      return null;
  }
}

export default function AppTabBar() {
  const pathname = usePathname() || "/";
  const [sid, setSid] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Prefer a session id present in the current URL; remember it.
    const m = pathname.match(/\/(?:result|next|home)\/([^/]+)/);
    if (m?.[1]) {
      saveLocalSession(m[1]);
      setSid(m[1]);
    } else {
      setSid(getLocalSession()?.sessionId ?? null);
    }
    setMounted(true);
  }, [pathname]);

  // Reserve space so the fixed bar never covers page content.
  useEffect(() => {
    const visible = mounted && !!sid && !isHidden(pathname);
    document.body.style.paddingBottom = visible ? "5.5rem" : "";
    return () => {
      document.body.style.paddingBottom = "";
    };
  }, [mounted, sid, pathname]);

  if (!mounted || !sid || isHidden(pathname)) return null;

  const tabs = [
    { key: "home", label: "홈", icon: "home", href: `/home/${sid}` },
    { key: "diagnose", label: "진단", icon: "diagnose", href: "/start" },
    { key: "report", label: "리포트", icon: "report", href: "/reports" },
    { key: "note", label: "노트", icon: "note", href: `/next/${sid}` },
    { key: "weekly", label: "주간", icon: "weekly", href: `/next/${sid}/week` },
  ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 flex justify-center px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2">
      <div className="flex w-full max-w-md items-stretch justify-between gap-1 rounded-[1.5rem] border border-line bg-surface/90 p-1.5 shadow-lift backdrop-blur-md">
        {tabs.map((t) => {
          const active = isActive(t.key, pathname, sid);
          return (
            <Link
              key={t.key}
              href={t.href}
              aria-current={active ? "page" : undefined}
              className={`flex flex-1 flex-col items-center gap-1 rounded-2xl py-2 text-[0.7rem] font-medium transition ${
                active
                  ? "bg-clay-tint text-clay-deep"
                  : "text-ink-faint hover:text-clay"
              }`}
            >
              <Icon name={t.icon} />
              {t.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

function isHidden(pathname: string): boolean {
  // Distraction-free during the diagnostic questions and note entry.
  if (pathname === "/diagnostic") return true;
  if (/^\/next\/[^/]+\/note$/.test(pathname)) return true;
  return false;
}

function isActive(key: string, pathname: string, sid: string): boolean {
  switch (key) {
    case "home":
      return pathname.startsWith("/home");
    case "diagnose":
      return pathname === "/start" || pathname === "/diagnostic";
    case "report":
      return pathname.startsWith("/reports") || pathname.startsWith("/result");
    case "note":
      return (
        pathname.startsWith(`/next/${sid}`) &&
        !pathname.endsWith("/week") &&
        !pathname.endsWith("/note")
      );
    case "weekly":
      return pathname.endsWith("/week");
    default:
      return false;
  }
}
