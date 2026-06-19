"use client";

import { useEffect, useRef, type CSSProperties, type PointerEvent } from "react";

const TICKS = Array.from({ length: 36 }, (_, index) => ({
  angle: index * 10,
  major: index % 3 === 0,
}));

const BEADS = [
  {
    cx: 126,
    cy: 91,
    r: 8,
    fill: "var(--color-sage)",
    fromX: -54,
    fromY: 35,
    hoverX: 3,
    hoverY: 0,
    delay: 120,
    duration: 6.8,
  },
  {
    cx: 151,
    cy: 77,
    r: 7,
    fill: "var(--color-clay)",
    fromX: 46,
    fromY: -24,
    hoverX: 0,
    hoverY: 2,
    delay: 210,
    duration: 7.6,
  },
  {
    cx: 174,
    cy: 94,
    r: 6,
    fill: "var(--color-ink-faint)",
    fromX: 62,
    fromY: 42,
    hoverX: -3,
    hoverY: -1,
    delay: 300,
    duration: 6.2,
  },
  {
    cx: 145,
    cy: 108,
    r: 5,
    fill: "var(--color-clay)",
    fromX: -42,
    fromY: 58,
    hoverX: 1,
    hoverY: -2,
    delay: 390,
    duration: 7.2,
  },
  {
    cx: 166,
    cy: 114,
    r: 5,
    fill: "var(--color-sage)",
    fromX: 52,
    fromY: 64,
    hoverX: -2,
    hoverY: -3,
    delay: 480,
    duration: 6.6,
  },
  {
    cx: 137,
    cy: 119,
    r: 4,
    fill: "var(--color-ink-faint)",
    fromX: -68,
    fromY: -32,
    hoverX: 2,
    hoverY: -3,
    delay: 570,
    duration: 7.9,
  },
] as const;

export default function InteractiveCompassHero() {
  const tiltRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    },
    [],
  );

  function updateTilt(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType !== "mouse" || !tiltRef.current) return;
    const target = tiltRef.current;
    const { left, top, width, height } = target.getBoundingClientRect();
    const rotateY = ((event.clientX - left) / width - 0.5) * 6;
    const rotateX = ((event.clientY - top) / height - 0.5) * -6;

    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    frameRef.current = requestAnimationFrame(() => {
      target.style.setProperty("--compass-tilt-x", `${rotateX.toFixed(2)}deg`);
      target.style.setProperty("--compass-tilt-y", `${rotateY.toFixed(2)}deg`);
    });
  }

  function resetTilt() {
    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    frameRef.current = requestAnimationFrame(() => {
      tiltRef.current?.style.setProperty("--compass-tilt-x", "0deg");
      tiltRef.current?.style.setProperty("--compass-tilt-y", "0deg");
    });
  }

  return (
    <div
      className="interactive-compass"
      role="img"
      aria-label="흩어진 기록, 시장, 행동 신호가 한 방향으로 모이는 나침반 예시"
      onPointerMove={updateTilt}
      onPointerLeave={resetTilt}
    >
      <div ref={tiltRef} className="interactive-compass__tilt">
        <svg
          viewBox="0 0 300 300"
          className="w-full"
          aria-hidden="true"
          focusable="false"
        >
          <circle
            className="interactive-compass__halo"
            cx="150"
            cy="150"
            r="135"
            fill="var(--color-clay-tint)"
            opacity="0.55"
          />
          <circle cx="150" cy="150" r="126" fill="var(--color-cream-2)" />
          <circle
            cx="150"
            cy="150"
            r="108"
            fill="var(--color-surface)"
            stroke="var(--color-line)"
            strokeWidth="2"
          />

          <g className="interactive-compass__ticks">
            {TICKS.map(({ angle, major }) => (
              <line
                key={angle}
                x1="150"
                y1={major ? 46 : 50}
                x2="150"
                y2={major ? 56 : 55}
                stroke={major ? "var(--color-ink-faint)" : "var(--color-line)"}
                strokeWidth={major ? 1.5 : 1}
                transform={`rotate(${angle} 150 150)`}
              />
            ))}
          </g>

          <circle
            className="interactive-compass__progress"
            cx="150"
            cy="150"
            r="97"
            fill="none"
            stroke="var(--color-clay)"
            strokeWidth="8"
            strokeLinecap="round"
            transform="rotate(-90 150 150)"
          />

          <g className="interactive-compass__needle-settle">
            <g className="interactive-compass__needle-idle">
              <g className="interactive-compass__needle-react">
                <line
                  x1="150"
                  y1="232"
                  x2="150"
                  y2="65"
                  stroke="var(--color-clay)"
                  strokeWidth="4"
                  strokeLinecap="round"
                />
                <path d="M150 47 L142 69 L158 69 Z" fill="var(--color-clay-deep)" />
                <path d="M150 232 L136 151 L164 151 Z" fill="var(--color-ink-faint)" />
              </g>
            </g>
          </g>

          {BEADS.map((bead, index) => {
            const style = {
              "--bead-from-x": `${bead.fromX}px`,
              "--bead-from-y": `${bead.fromY}px`,
              "--bead-hover-x": `${bead.hoverX}px`,
              "--bead-hover-y": `${bead.hoverY}px`,
              "--bead-float-duration": `${bead.duration}s`,
              "--bead-float-delay": `${index * -0.7}s`,
              animationDelay: `${bead.delay}ms`,
            } as CSSProperties;

            return (
              <g
                key={`${bead.cx}-${bead.cy}`}
                className="interactive-compass__bead-settle"
                style={style}
              >
                <circle
                  className="interactive-compass__bead-float"
                  cx={bead.cx}
                  cy={bead.cy}
                  r={bead.r}
                  fill={bead.fill}
                  opacity="0.88"
                  stroke="var(--color-surface)"
                  strokeWidth="2"
                />
              </g>
            );
          })}

          <circle
            cx="150"
            cy="151"
            r="11"
            fill="var(--color-surface)"
            stroke="var(--color-ink)"
            strokeWidth="4"
          />
          <circle cx="150" cy="151" r="3" fill="var(--color-clay)" />
        </svg>
      </div>
    </div>
  );
}
