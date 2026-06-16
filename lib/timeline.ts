// ─────────────────────────────────────────────────────────────
// Progress Timeline — the growth *story*, not a raw log.
// Only meaningful turning points, so a user who feels "stuck" sees
// proof of how she actually got here. Warm, return-positive copy.
// ─────────────────────────────────────────────────────────────

import type { DailyNote, DiagnosticSession } from "./types";

export type TimelineEventType =
  | "diagnostic_completed"
  | "direction_selected"
  | "first_action_chosen"
  | "customer_voice_captured"
  | "offer_seen"
  | "weekly_ready"
  | "returned_after_gap"
  | "milestone_records";

export interface TimelineEvent {
  type: TimelineEventType;
  icon: string;
  title: string;
  summary: string;
  date: string; // ISO
  href?: string;
}

function dnum(date: string): number {
  return Math.floor(new Date(`${date}T00:00:00Z`).getTime() / 86_400_000);
}

export function buildTimeline(
  session: DiagnosticSession,
  notes: DailyNote[],
): TimelineEvent[] {
  const events: TimelineEvent[] = [];
  const sid = session.id;
  const direction = session.report?.topRecommendation.label;

  // 1) diagnosis + direction
  if (session.completedAt) {
    events.push({
      type: "diagnostic_completed",
      icon: "✦",
      title: "진단을 마쳤어요",
      summary:
        "이날부터 막연한 생각이 아니라, 한 방향을 향해 보기 시작했어요.",
      date: session.completedAt,
      href: `/result/${sid}`,
    });
    if (direction) {
      events.push({
        type: "direction_selected",
        icon: "🌅",
        title: "첫 방향을 골랐어요",
        summary: `${direction} — 이 방향이 조금 더 실제가 되기 시작했어요.`,
        date: session.completedAt,
        href: `/result/${sid}`,
      });
    }
  }

  // 2) note-derived milestones (curated, not every note)
  const ordered = [...notes].sort(
    (a, b) => a.createdAt.localeCompare(b.createdAt),
  );

  let firstAction = false;
  let firstVoice = false;
  let prevDay: number | null = null;

  ordered.forEach((n, i) => {
    const day = dnum(n.date);

    if (!firstAction && n.todayAction.trim()) {
      firstAction = true;
      events.push({
        type: "first_action_chosen",
        icon: "🌿",
        title: "첫 작은 행동을 정했어요",
        summary:
          "작은 행동이지만, 이 흐름을 이어가는 출발점이 되었어요.",
        date: n.createdAt,
        href: `/next/${sid}`,
      });
    }

    if (!firstVoice && n.customerVoice.trim()) {
      firstVoice = true;
      events.push({
        type: "customer_voice_captured",
        icon: "🗣️",
        title: "고객의 말을 처음 기록했어요",
        summary:
          "사람들이 말하는 어려움이, 당신의 방향과 닿기 시작한 순간이에요.",
        date: n.createdAt,
        href: `/next/${sid}`,
      });
    }

    if (prevDay !== null && day - prevDay >= 2) {
      events.push({
        type: "returned_after_gap",
        icon: "🤍",
        title: "다시 돌아온 날이 있었어요",
        summary:
          "끊겼다가 다시 돌아온 것도, 이 타임라인의 중요한 부분이에요.",
        date: n.createdAt,
        href: `/next/${sid}`,
      });
    }
    prevDay = day;

    // gentle count milestones
    if (i + 1 === 3 || i + 1 === 7) {
      events.push({
        type: "milestone_records",
        icon: "📓",
        title: `${i + 1}번째 기록을 남겼어요`,
        summary: "작은 움직임이 차곡차곡 쌓이고 있어요.",
        date: n.createdAt,
        href: `/next/${sid}`,
      });
    }
  });

  // 3) weekly becomes available
  if (notes.length >= 2) {
    const second = ordered[1];
    events.push({
      type: "weekly_ready",
      icon: "↻",
      title: "한 주를 돌아볼 수 있게 됐어요",
      summary: "기록이 쌓여, 이번 주의 흐름도 볼 수 있어요.",
      date: second.createdAt,
      href: `/next/${sid}/week`,
    });
  }

  // chronological (the story reads best forward)
  return events.sort((a, b) => a.date.localeCompare(b.date));
}
