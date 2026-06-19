import { BRAND } from "@/lib/brand";

export function LogoMark({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      className={className}
      fill="none"
      aria-hidden="true"
    >
      <circle cx="20" cy="20" r="18" stroke="var(--color-ink)" strokeWidth="1.6" />
      <path d="M20 7 L23 21 L20 24 L17 21 Z" fill="var(--color-clay)" />
      <circle cx="20" cy="20" r="2" fill="var(--color-ink)" />
    </svg>
  );
}

export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <LogoMark className="h-7 w-7" />
      <span className="text-[1.15rem] font-extrabold tracking-[-0.03em] text-ink">
        {BRAND.name}
      </span>
    </span>
  );
}
