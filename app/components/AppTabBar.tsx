"use client";

import Link from "next/link";
import { useEffect } from "react";
import { usePathname } from "next/navigation";

function Icon({ name }: { name: "chat" | "dashboard" | "roadmap" }) {
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

  if (name === "chat") {
    return (
      <svg {...common}>
        <path d="M5 5.5h14v9.5H9l-4 3.5z" />
        <path d="M8.5 9.5h7M8.5 12.5h4" />
      </svg>
    );
  }

  if (name === "dashboard") return (
    <svg {...common}>
      <path d="M4.5 19.5v-15h15v15z" />
      <path d="M8 15.5v-4M12 15.5V8M16 15.5v-6" />
    </svg>
  );

  return (
    <svg {...common}>
      <path d="M5 20V6M5 7h8l-2 3 2 3H5" />
      <path d="M9 20c0-3 2-4 5-4s5-1 5-4" />
      <circle cx="19" cy="9" r="1.5" />
    </svg>
  );
}

export default function AppTabBar() {
  const pathname = usePathname() || "/";
  const hidden = isHidden(pathname);

  useEffect(() => {
    document.body.style.paddingBottom = hidden ? "" : "5.5rem";
    return () => {
      document.body.style.paddingBottom = "";
    };
  }, [hidden]);

  if (hidden) return null;

  const tabs = [
    { key: "dashboard", label: "대시보드", icon: "dashboard" as const, href: "/dashboard" },
    { key: "chat", label: "채팅", icon: "chat" as const, href: "/chat" },
    { key: "roadmap", label: "로드맵", icon: "roadmap" as const, href: "/roadmap" },
  ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 flex justify-center px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2">
      <div className="grid w-full max-w-sm grid-cols-3 gap-1 rounded-[1.5rem] border border-line bg-surface/90 p-1.5 shadow-lift backdrop-blur-md">
        {tabs.map((t) => {
          const active = isActive(t.key, pathname);
          return (
            <Link
              key={t.key}
              href={t.href}
              aria-label={t.label}
              title={t.label}
              aria-current={active ? "page" : undefined}
              className={`flex min-h-12 items-center justify-center rounded-2xl px-4 py-3 transition ${
                active
                  ? "bg-clay-tint text-clay-deep"
                  : "text-ink-faint hover:text-clay"
              }`}
            >
              <Icon name={t.icon} />
              <span className="sr-only">{t.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

function isHidden(pathname: string): boolean {
  if (pathname === "/admin") return true;
  if (pathname.startsWith("/api")) return true;
  return false;
}

function isActive(key: string, pathname: string): boolean {
  if (key === "chat") return pathname === "/" || pathname.startsWith("/chat");
  if (key === "dashboard") return pathname.startsWith("/dashboard");
  if (key === "roadmap") return pathname.startsWith("/roadmap");
  return false;
}
