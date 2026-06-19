import type { CompassStatus } from "./compass-engine";

export const CHAT_STARTERS = [
  "오늘 한 일은...",
  "누가 내게 물어본 문제는...",
  "오늘 기분은...",
  "오늘 잘한 점은...",
  "오늘 고객이나 주변에서 들은 말은...",
  "내일 작게 해볼 일은...",
] as const;

export type ChatWelcome = {
  kind: "onboarding" | "returning";
  text: string;
};

export function resolveChatWelcome({
  entry,
  onboardingSeen,
  lastVisitAt,
  now,
  status,
}: {
  entry: string | null;
  onboardingSeen: boolean;
  lastVisitAt: string | null;
  now: Date;
  status: CompassStatus;
}): ChatWelcome | null {
  if (entry === "onboarding" && !onboardingSeen) {
    return {
      kind: "onboarding",
      text: "첫 방향을 찾았어요. 이제부터는 거창하게 정리하지 않아도 괜찮아요. 오늘 리포트를 보고 가장 마음에 남은 점이나, 지금 작게 해보고 싶은 일을 적어볼까요?",
    };
  }

  if (!lastVisitAt || isSameLocalDay(lastVisitAt, now)) return null;

  return {
    kind: "returning",
    text: returningMessage(status),
  };
}

function isSameLocalDay(value: string, now: Date): boolean {
  const previous = new Date(value);
  if (!Number.isFinite(previous.getTime())) return false;
  return localDayKey(previous) === localDayKey(now);
}

function localDayKey(value: Date): string {
  return [
    value.getFullYear(),
    String(value.getMonth() + 1).padStart(2, "0"),
    String(value.getDate()).padStart(2, "0"),
  ].join("-");
}

function returningMessage(status: CompassStatus): string {
  switch (status) {
    case "executing":
      return "다시 만나 반가워요. 지금 방향을 실제 행동으로 옮기고 있는 단계예요. 오늘 해본 일이나 새로 들은 반응이 있었나요?";
    case "confirming":
      return "다시 만나 반가워요. 방향이 조금씩 잡히고 있어요. 오늘 더 확신이 생긴 순간이나 망설여진 지점이 있었나요?";
    case "narrowing":
      return "다시 만나 반가워요. 여러 가능성을 좁혀가는 중이에요. 오늘 유난히 마음이 간 일이나 사람이 있었나요?";
    default:
      return "다시 만나 반가워요. 거창한 이야기가 아니어도 괜찮아요. 오늘 기억에 남은 일 하나를 들려주실래요?";
  }
}
