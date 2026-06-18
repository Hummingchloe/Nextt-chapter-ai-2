"use client";

import type { CompassState } from "@/lib/compass-engine";

// A compact "compass rose" of the user's beads, using star-coordinate
// projection: each learned axis is a spoke; a bead is pulled toward the axes it
// loads on. The H needle points to the weighted center of mass; its length is
// the coherence (magnitude). Pure SVG, no deps, themed to the warm palette.

const SIZE = 300;
const C = SIZE / 2;
const R = 120;

const SOURCE_COLOR: Record<string, string> = {
  record: "var(--color-ink-faint)",
  market: "var(--color-sage)",
  action: "var(--color-clay)",
};

function clamp(x: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, x));
}

export default function BeadCompass({ state }: { state: CompassState | null }) {
  const axes = state?.axes ?? [];
  const beads = state?.beads ?? [];
  const n = axes.length;

  if (!state || n < 2) {
    return (
      <div className="flex h-44 items-center justify-center rounded-2xl bg-cream-2 text-sm text-ink-faint">
        구슬이 모이면 여기에 방향 지도가 그려져요.
      </div>
    );
  }

  // Spoke unit vectors (top = up, clockwise).
  const spokes = axes.map((_, i) => {
    const t = -Math.PI / 2 + (2 * Math.PI * i) / n;
    return [Math.cos(t), Math.sin(t)] as const;
  });

  const project = (dir: number[]): [number, number] => {
    let x = 0;
    let y = 0;
    for (let i = 0; i < n; i++) {
      const c = dir[i] ?? 0;
      x += c * spokes[i][0];
      y += c * spokes[i][1];
    }
    return [x, y];
  };
  const mag = (p: [number, number]) => Math.hypot(p[0], p[1]);

  const raw = beads.map((b) => project(b.direction));
  const hRaw = project(state.compass.dir);
  const maxReach = Math.max(1e-6, ...raw.map(mag), mag(hRaw));
  const fit = (R * 0.82) / maxReach;

  // Needle: direction of H, length = coherence (magnitude).
  const hLen = mag(hRaw);
  const hUnit: [number, number] = hLen ? [hRaw[0] / hLen, hRaw[1] / hLen] : [0, 0];
  const needleLen = R * 0.82 * clamp(state.compass.magnitude, 0, 1);
  const nx = C + hUnit[0] * needleLen;
  const ny = C + hUnit[1] * needleLen;

  return (
    <div>
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="w-full" role="img" aria-label="구슬 방향 지도">
        <defs>
          <radialGradient id="rose" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="var(--color-surface)" />
            <stop offset="100%" stopColor="var(--color-cream-2)" />
          </radialGradient>
        </defs>

        <circle cx={C} cy={C} r={R} fill="url(#rose)" stroke="var(--color-line)" />
        {[0.66, 0.33].map((k) => (
          <circle key={k} cx={C} cy={C} r={R * k} fill="none" stroke="var(--color-line)" strokeWidth={1} opacity={0.7} />
        ))}

        {/* Axis spokes + pole labels */}
        {spokes.map((s, i) => {
          const ex = C + s[0] * R;
          const ey = C + s[1] * R;
          const lx = C + s[0] * (R + 12);
          const ly = C + s[1] * (R + 12);
          return (
            <g key={axes[i].id}>
              <line x1={C} y1={C} x2={ex} y2={ey} stroke="var(--color-line)" strokeWidth={1} />
              <text
                x={lx}
                y={ly}
                fontSize={9}
                fill="var(--color-ink-faint)"
                textAnchor={Math.abs(s[0]) < 0.3 ? "middle" : s[0] > 0 ? "start" : "end"}
                dominantBaseline="middle"
              >
                {axes[i].posPole.slice(0, 8)}
              </text>
            </g>
          );
        })}

        {/* H needle */}
        {state.compass.magnitude > 0.02 && (
          <g>
            <line x1={C} y1={C} x2={nx} y2={ny} stroke="var(--color-clay)" strokeWidth={6} strokeLinecap="round" opacity={0.25} />
            <line x1={C} y1={C} x2={nx} y2={ny} stroke="var(--color-clay-deep)" strokeWidth={2.5} strokeLinecap="round" />
            <circle cx={nx} cy={ny} r={4} fill="var(--color-clay-deep)" />
          </g>
        )}

        {/* Beads */}
        {beads.map((b, i) => {
          const px = C + raw[i][0] * fit;
          const py = C + raw[i][1] * fit;
          const r = 3 + (clamp(b.weight, 1, 10) / 10) * 7;
          const opacity = clamp(0.35 + b.confidence * 0.55, 0.35, 0.95);
          const isNewest = i === beads.length - 1;
          return (
            <g key={b.id}>
              {isNewest && (
                <circle cx={px} cy={py} r={r} fill="none" stroke={SOURCE_COLOR[b.source]} strokeWidth={1.5}>
                  <animate attributeName="r" from={r} to={r + 10} dur="1.4s" repeatCount="indefinite" />
                  <animate attributeName="opacity" from={0.6} to={0} dur="1.4s" repeatCount="indefinite" />
                </circle>
              )}
              <circle cx={px} cy={py} r={r} fill={SOURCE_COLOR[b.source]} opacity={opacity} stroke="var(--color-surface)" strokeWidth={1.5} />
            </g>
          );
        })}

        <circle cx={C} cy={C} r={3} fill="var(--color-ink)" />
      </svg>

      <div className="mt-2 flex items-center justify-center gap-4 text-xs text-ink-faint">
        {[
          ["기록", "record"],
          ["시장", "market"],
          ["행동", "action"],
        ].map(([label, key]) => (
          <span key={key} className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: SOURCE_COLOR[key] }} />
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}
