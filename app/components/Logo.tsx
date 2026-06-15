export function LogoMark({ className = "" }: { className?: string }) {
  // A gentle sunrise — a new chapter beginning.
  return (
    <svg
      viewBox="0 0 32 32"
      className={className}
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M16 7c5 0 9 4 9 9H7c0-5 4-9 9-9Z"
        fill="var(--color-clay)"
        opacity="0.95"
      />
      <path
        d="M16 11c2.8 0 5 2.2 5 5h-10c0-2.8 2.2-5 5-5Z"
        fill="var(--color-gold)"
      />
      <path
        d="M3 20h26M7.5 24h17M11 28h10"
        stroke="var(--color-sage)"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <LogoMark className="h-7 w-7" />
      <span className="font-display text-[1.05rem] font-bold text-ink">
        My Next Chapter
      </span>
    </span>
  );
}
