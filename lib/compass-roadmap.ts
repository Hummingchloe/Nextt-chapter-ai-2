import { activeActions } from "./compass-actions";
import type { CompassState } from "./compass-engine";

export interface RoadmapMilestoneInput {
  sessionId: string;
  label: string;
  createdAt: string;
}

export interface RoadmapNode {
  key: string;
  kind: "milestone" | "step" | "current" | "locked" | "destination";
  label: string;
  sublabel?: string;
  href?: string;
}

export interface ReadOnlyJourney {
  chapter: number;
  essence: string;
  nodes: RoadmapNode[];
}

export function deriveReadOnlyJourney(
  state: CompassState,
  milestone: RoadmapMilestoneInput,
  now: string,
): ReadOnlyJourney {
  const done = state.doneActions.slice(-2);
  const current = activeActions(state, now)[0];
  const essence =
    state.compass.essence?.trim() ||
    state.compass.oneLiner.trim() ||
    "내 경험을 다음 기회로 연결하는 사람";

  const nodes: RoadmapNode[] = [
    {
      key: `report-${milestone.sessionId}`,
      kind: "milestone",
      label: "첫 방향 리포트",
      sublabel: milestone.label,
      href: `/result/${milestone.sessionId}`,
    },
    ...done.map((action) => ({
      key: `done-${action.id}-${action.completedAt}`,
      kind: "step" as const,
      label: action.title,
      sublabel: "완료한 행동",
    })),
    {
      key: current ? `current-${current.id}` : "current-chat",
      kind: "current",
      label: current?.title ?? "채팅에서 다음 단서 남기기",
      sublabel: "지금 여기",
      href: "/chat",
    },
    {
      key: "next-report",
      kind: "locked",
      label: "다음 리포트",
      sublabel: "기록이 더 쌓이면 열려요",
    },
    {
      key: "current-direction",
      kind: "destination",
      label: "현재 향하는 방향",
      sublabel: essence,
    },
  ];

  return { chapter: 1, essence, nodes };
}
