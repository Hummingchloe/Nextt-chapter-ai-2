"use client";

import { cosine, type CompassState } from "@/lib/compass-engine";

// Convergence compass. No axes — those are just an arbitrary coordinate basis.
// What matters: each bead is a floating ball with a direction; M is whether
// they're converging into one; H is the consensus direction (the needle). A
// ball's height = its alignment to H (cosine), so aligned balls are pulled up
// into the needle tip and divergent balls fan out at the base. You literally
// see "공들이 모이고 있느냐". H's meaning lives in one sentence (the caption),
// not in numbers — like a latent-space compression raised to language.

const W = 300;
const H = 290;
const CX = W / 2;
const BASE_Y = 252;
const TIP_Y = 40;
const SPAN = BASE_Y - TIP_Y; // vertical travel
const MAX_HALF = 126; // funnel half-width at the base

const SOURCE_COLOR: Record<string, string> = {
  record: "var(--color-ink-faint)",
  market: "var(--color-sage)",
  action: "var(--color-clay)",
};

const SOURCE_HELP = [
  {
    key: "record",
    label: "기록",
    description: "대화와 메모에서 발견한 경험·강점 신호예요.",
    position: "left-0",
  },
  {
    key: "market",
    label: "시장",
    description: "시장 조사와 고객 반응에서 확인된 수요 신호예요.",
    position: "left-1/2 -translate-x-1/2",
  },
  {
    key: "action",
    label: "행동",
    description: "직접 실행하고 남긴 결과에서 생긴 행동 신호예요.",
    position: "right-0",
  },
] as const;

function clamp(x: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, x));
}

export default function BeadCompass({ state }: { state: CompassState | null }) {
  const beads = state?.beads ?? [];
  const hDir = state?.compass.dir ?? [];
  const hLen = Math.sqrt(hDir.reduce((s, x) => s + x * x, 0));
  const m = state?.alignment ?? 0;

  if (!state || beads.length === 0) {
    return (
      <div className="flex h-44 items-center justify-center rounded-2xl bg-cream-2 px-6 text-center text-sm text-ink-faint">
        기록이 쌓이면 방향 변화가 보이기 시작해요.
      </div>
    );
  }

  const needleTipY = BASE_Y - SPAN * clamp(m, 0, 1);

  // Place each bead by its alignment to H. golden-angle spread avoids overlap.
  const dots = beads.map((b, i) => {
    const a = hLen > 1e-6 ? clamp(cosine(b.direction, hDir), -1, 1) : 0;
    const t = (a + 1) / 2; // 1 = aligned (top), 0 = opposed (base)
    const y = BASE_Y - SPAN * t;
    const halfW = MAX_HALF * Math.pow(1 - t, 1.15);
    const jx = Math.cos(i * 2.399963); // deterministic, well-distributed in [-1,1]
    const x = CX + jx * halfW;
    const r = 3 + (clamp(b.weight, 1, 10) / 10) * 6;
    const opacity = clamp(0.42 + b.confidence * 0.5, 0.42, 0.95);
    return { b, x, y, r, opacity, newest: i === beads.length - 1 };
  });

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="방향 변화 나침반">
        <defs>
          <radialGradient id="field" cx="50%" cy="28%" r="75%">
            <stop offset="0%" stopColor="var(--color-surface)" />
            <stop offset="100%" stopColor="var(--color-cream-2)" />
          </radialGradient>
          <linearGradient id="needle" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="var(--color-clay)" />
            <stop offset="100%" stopColor="var(--color-clay-deep)" />
          </linearGradient>
        </defs>

        <rect x="0" y="0" width={W} height={H} rx="16" fill="url(#field)" />

        {/* Convergence funnel guides (faint): tip at top, fanning to the base. */}
        <path
          d={`M ${CX} ${TIP_Y} L ${CX - MAX_HALF} ${BASE_Y} M ${CX} ${TIP_Y} L ${CX + MAX_HALF} ${BASE_Y}`}
          stroke="var(--color-line)"
          strokeWidth={1}
          fill="none"
        />
        <line x1={CX} y1={TIP_Y} x2={CX} y2={BASE_Y} stroke="var(--color-line)" strokeWidth={1} strokeDasharray="3 5" />

        {/* H needle — length = M (coherence). The hero. */}
        {m > 0.03 && (
          <g>
            <line x1={CX} y1={BASE_Y} x2={CX} y2={needleTipY} stroke="var(--color-clay)" strokeWidth={7} strokeLinecap="round" opacity={0.2} />
            <line x1={CX} y1={BASE_Y} x2={CX} y2={needleTipY} stroke="url(#needle)" strokeWidth={2.5} strokeLinecap="round" />
            <path
              d={`M ${CX} ${needleTipY - 9} L ${CX - 5} ${needleTipY + 3} L ${CX + 5} ${needleTipY + 3} Z`}
              fill="var(--color-clay-deep)"
            />
          </g>
        )}

        {/* Beads — floating balls; height = alignment to H. */}
        {dots.map(({ b, x, y, r, opacity, newest }) => (
          <g key={b.id}>
            {newest && (
              <circle cx={x} cy={y} r={r} fill="none" stroke={SOURCE_COLOR[b.source]} strokeWidth={1.5}>
                <animate attributeName="r" from={r} to={r + 9} dur="1.5s" repeatCount="indefinite" />
                <animate attributeName="opacity" from={0.6} to={0} dur="1.5s" repeatCount="indefinite" />
              </circle>
            )}
            <circle cx={x} cy={y} r={r} fill={SOURCE_COLOR[b.source]} opacity={opacity} stroke="var(--color-surface)" strokeWidth={1.5} />
          </g>
        ))}

        <circle cx={CX} cy={BASE_Y} r={3} fill="var(--color-ink)" />
      </svg>

      <div className="mt-2 flex items-center justify-center gap-4 text-xs text-ink-faint">
        {SOURCE_HELP.map(({ key, label, description, position }) => (
          <span key={key} className="group relative inline-flex">
            <button
              type="button"
              aria-describedby={`bead-help-${key}`}
              className="inline-flex items-center gap-1.5 rounded-full px-1.5 py-1 transition hover:bg-cream focus:bg-cream focus:outline-none focus-visible:ring-2 focus-visible:ring-clay"
            >
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: SOURCE_COLOR[key] }} />
              {label}
              <span aria-hidden="true" className="text-[10px] text-ink-faint">ⓘ</span>
            </button>
            <span
              id={`bead-help-${key}`}
              role="tooltip"
              className={`pointer-events-none absolute bottom-full z-10 mb-2 w-48 rounded-xl bg-ink px-3 py-2 text-left text-[11px] leading-5 text-white opacity-0 shadow-soft transition group-hover:opacity-100 group-focus-within:opacity-100 ${position}`}
            >
              {description}
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}
