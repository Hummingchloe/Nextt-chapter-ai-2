import Link from "next/link";
import type { RoadmapNode } from "@/lib/compass-roadmap";

const NODE_STYLE: Record<RoadmapNode["kind"], string> = {
  milestone: "border-clay bg-clay text-white shadow-[0_12px_28px_-14px_rgba(49,130,246,0.65)]",
  step: "border-sage bg-sage-tint text-sage",
  current: "border-clay bg-surface text-clay shadow-[0_0_0_7px_rgba(49,130,246,0.10)]",
  locked: "border-dashed border-line bg-cream-2 text-ink-faint",
  destination: "border-dashed border-ink-faint/50 bg-surface text-ink-soft",
};

function NodeIcon({ kind }: { kind: RoadmapNode["kind"] }) {
  const common = {
    width: 26,
    height: 26,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };

  if (kind === "milestone") {
    return <svg {...common}><path d="M6 3.5h9l3 3V20.5H6z" /><path d="M15 3.5v3h3M9 11h6M9 15h4" /></svg>;
  }
  if (kind === "step") {
    return <svg {...common}><path d="m5 12 4 4L19 6" /></svg>;
  }
  if (kind === "current") {
    return <svg {...common}><path d="M12 3v18M5 10l7-7 7 7" /></svg>;
  }
  if (kind === "locked") {
    return <svg {...common}><rect x="5" y="10" width="14" height="10" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></svg>;
  }
  return <svg {...common}><path d="M6 21V4M6 5h10l-2.5 3L16 11H6" /></svg>;
}

export default function RoadmapPath({ nodes }: { nodes: RoadmapNode[] }) {
  return (
    <div className="relative mx-auto max-w-xl py-2">
      <div className="absolute bottom-10 left-1/2 top-10 w-px -translate-x-1/2 bg-line" aria-hidden="true" />
      <div className="relative space-y-7">
        {nodes.map((node, index) => {
          const left = index % 2 === 0;
          const content = (
            <div className={`flex items-center gap-4 ${left ? "" : "flex-row-reverse text-right"}`}>
              <div
                className={`relative z-10 flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-2 ${NODE_STYLE[node.kind]} ${
                  node.kind === "current" ? "animate-breathe" : ""
                }`}
              >
                <NodeIcon kind={node.kind} />
              </div>
              <div className="min-w-0 flex-1 rounded-2xl border border-line bg-surface p-4 shadow-sm">
                {node.kind === "current" && (
                  <span className="mb-1 inline-flex rounded-full bg-clay-tint px-2 py-0.5 text-[10px] font-bold text-clay-deep">
                    지금
                  </span>
                )}
                <p className="text-sm font-bold leading-6 text-ink">{node.label}</p>
                {node.sublabel && (
                  <p className="mt-1 text-xs leading-5 text-ink-soft">{node.sublabel}</p>
                )}
                {node.href && (
                  <p className="mt-2 text-xs font-semibold text-clay">눌러서 보기 →</p>
                )}
              </div>
            </div>
          );

          return node.href ? (
            <Link
              key={node.key}
              href={node.href}
              className={`block w-[92%] transition hover:-translate-y-0.5 ${left ? "mr-auto" : "ml-auto"}`}
            >
              {content}
            </Link>
          ) : (
            <div key={node.key} className={`w-[92%] ${left ? "mr-auto" : "ml-auto"}`}>
              {content}
            </div>
          );
        })}
      </div>
    </div>
  );
}
