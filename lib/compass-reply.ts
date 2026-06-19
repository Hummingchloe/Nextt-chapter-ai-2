import "server-only";

import { BRAND } from "./brand";

// ─────────────────────────────────────────────────────────────
// Coach reply — the conversational layer.
//
// The chat should feel like talking to a grounded coach, not reading a
// dashboard. This generates a natural reply that (1) reacts to what the user
// actually said, (2) lightly names a signal it noticed so the "beads" feel like
// they form *in conversation*, and (3) asks one natural follow-up steered by
// the gap (missing signal type / most uncertain axis).
//
// Numbers (정렬도/%) NEVER appear here — those live on the compass card. Split
// into its own endpoint and called in parallel with /compute, so it never
// chains LLM work in one request.
// ─────────────────────────────────────────────────────────────

import { anthropicApiKey, anthropicModel } from "./ai-env";
import { mostUncertainAxis, type CompassState } from "./compass-engine";

const API_URL = "https://api.anthropic.com/v1/messages";
const TIMEOUT_MS = 12000;

export interface CoachTurn {
  role: "user" | "assistant";
  text: string;
}

const STATUS_KO: Record<CompassState["status"], string> = {
  listening: "아직 방향을 듣는 중",
  narrowing: "여러 방향 중 좁혀가는 중",
  confirming: "방향이 잡혀가는 중",
  executing: "방향이 또렷해진 단계",
};

function steer(compass: CompassState): { axisLine: string; wantLine: string } {
  const hasMarket = compass.beads.some((b) => b.source === "market");
  const hasAction = compass.beads.some((b) => b.source === "action");

  const idx = mostUncertainAxis(compass);
  const ax = idx >= 0 ? compass.axes[idx] : undefined;
  const axisLine = ax ? `${ax.name} (${ax.negPole} ↔ ${ax.posPole})` : "아직 축이 잡히기 전";

  let wantLine: string;
  if (compass.beads.length === 0) {
    wantLine = "요즘 자주 떠오르는 생각이나, 최근에 한 작은 행동을 편하게 더 듣고 싶음";
  } else if (!hasMarket) {
    wantLine = "주변에서 누가 어떤 문제로 도움을 청했는지(외부 수요 신호)가 아직 없음 — 그걸 자연스럽게 끌어내면 좋음";
  } else if (!hasAction) {
    wantLine = "말로는 보이지만 실제로 작게 해본 행동 기록이 없음 — 무엇을 해봤는지/해볼지 물어보면 좋음";
  } else {
    wantLine = `아직 흐린 축(${axisLine})에서 어느 쪽이 더 자기다운지 자연스럽게 떠보면 좋음`;
  }
  return { axisLine, wantLine };
}

export async function generateCoachReply(opts: {
  input: string;
  history: CoachTurn[];
  compass: CompassState;
}): Promise<string | null> {
  const apiKey = anthropicApiKey();
  if (!apiKey) return null;
  const model = anthropicModel();

  const { axisLine, wantLine } = steer(opts.compass);
  const direction = opts.compass.compass.essence || opts.compass.compass.oneLiner || "아직 잠정적";
  const convo = opts.history
    .slice(-6)
    .map((t) => `${t.role === "user" ? "사용자" : "코치"}: ${t.text}`)
    .join("\n");

  const system = [
    `당신은 '${BRAND.name}'의 Compass 코치입니다. AI 시대에 자기 경험을 새 수익 기회로 바꾸려는 사람과 편안하게 대화합니다.`,
    "",
    "원칙:",
    "- 방금 사용자가 한 말의 '구체적인 내용 한 가지'를 콕 집어 사람처럼 반응하세요(직무 전환, AI 자동화, 고객 문의처럼 실제 디테일).",
    "- 그 말에서 보이는 신호(이미 가진 경험/자산, 주변 반응, 실제로 한 행동) 하나를 자연스럽게 짚어, 상대가 '아 이게 의미가 있구나'를 느끼게 하세요. 분석하듯 말고 대화하듯.",
    "- 그다음 자연스러운 질문을 '딱 하나만' 하세요. 아래 '지금 더 알고 싶은 것'을 우선 활용하되, 심문하듯 몰아붙이지 마세요.",
    "- 금지: 숫자·퍼센트·'정렬도', 단정적 진단('당신은 ~한 사람입니다'), 빈 칭찬, 직전에 이미 한 질문의 반복.",
    "- 따뜻하지만 담백하게. 한국어 2~4문장. 군더더기·머리말 없이 대화체로만.",
  ].join("\n");

  const user = [
    convo ? `[지금까지의 대화]\n${convo}\n` : "",
    `[사용자가 방금 한 말]\n${opts.input}\n`,
    "[참고용 맥락 — 사용자에게 숫자나 분석으로 말하지 말 것]",
    `- 단계: ${STATUS_KO[opts.compass.status]}`,
    `- 잠정 방향: ${direction}`,
    `- 지금 더 알고 싶은 것: ${wantLine}`,
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model,
        max_tokens: 400,
        temperature: 0.6,
        system,
        messages: [{ role: "user", content: user }],
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const text: string = (data?.content ?? [])
      .map((p: { text?: string }) => p.text ?? "")
      .join("")
      .trim();
    return text || null;
  } catch {
    return null;
  }
}
