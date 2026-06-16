// 7-day trace preview. Filled by intensity; empty days stay neutral
// (never red/negative). Server-renderable.
export default function MomentumDots({
  last7,
}: {
  last7: { dayOffset: number; level: 0 | 1 | 2 }[];
}) {
  const labels = ["일", "월", "화", "수", "목", "금", "토"]; // not date-bound; just rhythm
  return (
    <div className="flex items-end gap-2">
      {last7.map((d, i) => (
        <div key={i} className="flex flex-1 flex-col items-center gap-1.5">
          <span
            className={`h-7 w-7 rounded-full transition ${
              d.level === 2
                ? "bg-clay"
                : d.level === 1
                  ? "bg-clay/40"
                  : "border border-line bg-cream-2"
            }`}
            aria-hidden
          />
          {d.dayOffset === 0 && (
            <span className="text-[0.65rem] text-clay">오늘</span>
          )}
          {d.dayOffset !== 0 && <span className="h-[0.8rem]" />}
        </div>
      ))}
    </div>
  );
}
