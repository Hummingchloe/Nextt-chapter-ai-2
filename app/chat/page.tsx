"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { LogoMark, Wordmark } from "../components/Logo";
import BeadCompass from "../components/BeadCompass";
import {
  loadCompassState,
  resetCompassState,
  saveCompassState,
} from "@/lib/local-ontology-store";
import type { CompassState } from "@/lib/compass-engine";
import { seedCompass } from "@/lib/compass-seed";
import { BRAND } from "@/lib/brand";

const STARTERS = [
  "오늘 한 일은...",
  "누가 내게 물어본 문제는...",
  "내일 작게 해볼 일은...",
];

interface Bubble {
  id: string;
  role: "user" | "assistant";
  text: string;
  pending?: boolean;
}

const STATUS_LABEL: Record<CompassState["status"], string> = {
  listening: "듣는 중",
  narrowing: "좁히는 중",
  confirming: "확인하는 중",
  executing: "실행 단계",
};

// Fallback only (no key / reply failed). Human, never a numeric status line.
function humanAck(status: CompassState["status"]): string {
  switch (status) {
    case "executing":
      return "좋아요, 잘 들었어요. 이걸 실제로 한 걸음 더 옮긴다면 가장 먼저 누구한테 말해볼 것 같아요?";
    case "confirming":
      return "방향이 점점 선명해지는 것 같아요. 방금 얘기에서 한 걸음 더 들어가 볼까요?";
    case "narrowing":
      return "좋아요, 잘 기록됐어요. 요즘 그 일에서 가장 마음이 가는 지점은 어디예요?";
    default:
      return "그렇군요. 조금만 더 들려주세요 — 요즘 자주 떠오르는 생각이 있나요?";
  }
}

export default function ChatPage() {
  const [compass, setCompass] = useState<CompassState | null>(null);
  const [messages, setMessages] = useState<Bubble[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadCompassState(new Date().toISOString())
      .then(setCompass)
      .catch(() => resetCompassState(new Date().toISOString()).then(setCompass));
  }, []);

  async function send() {
    const text = input.trim();
    if (!compass || !text || loading) return;
    const prior = compass;
    const stamp = Date.now();
    const pid = `a-${stamp}`;
    const history = messages
      .filter((b) => b.text && !b.pending)
      .slice(-6)
      .map((b) => ({ role: b.role, text: b.text }));

    setLoading(true);
    setError("");
    // User bubble + a pending assistant bubble (typing indicator).
    setMessages((m) => [
      ...m,
      { id: `u-${stamp}`, role: "user", text },
      { id: pid, role: "assistant", text: "", pending: true },
    ]);
    setInput("");

    // (1) Coach reply — reacts to what they said. Parallel, fills the bubble.
    void fetchReply(text, history, prior, pid);

    // (2) Compass update — extraction only. Updates the side card, not the chat.
    try {
      const res = await fetch("/api/compass/compute", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ compass: prior, input: text }),
      });
      if (!res.ok) throw new Error("compute failed");
      const data = await res.json();
      const next = data.compass as CompassState;
      setCompass(next);
      await saveCompassState(next);
      void enrichEssence(next);
    } catch {
      setError("기록 중 문제가 있었어요. 잠시 후 다시 시도해 주세요.");
    } finally {
      setLoading(false);
    }
  }

  // Deferred coach reply: fill the pending bubble when it arrives (human ack on
  // failure). Reacts to the user's message in the context of the prior compass.
  async function fetchReply(
    text: string,
    history: { role: "user" | "assistant"; text: string }[],
    prior: CompassState,
    pid: string,
  ) {
    let reply: string | null = null;
    try {
      const res = await fetch("/api/compass/reply", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ compass: prior, input: text, history }),
      });
      if (res.ok) reply = (await res.json()).reply ?? null;
    } catch {
      /* fall through to human ack */
    }
    const finalText = reply || humanAck(prior.status);
    setMessages((m) => m.map((b) => (b.id === pid ? { ...b, text: finalText, pending: false } : b)));
  }

  // Deferred enrichment: fetch the essence one-liner separately so the chat
  // round-trip never waits on a second LLM call (the split-endpoint lesson).
  async function enrichEssence(state: CompassState) {
    try {
      const res = await fetch("/api/compass/essence", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ compass: state }),
      });
      if (!res.ok) return;
      const { oneLiner } = await res.json();
      if (!oneLiner) return;
      setCompass((prev) => {
        if (!prev) return prev;
        const enriched = { ...prev, compass: { ...prev.compass, essence: oneLiner } };
        void saveCompassState(enriched);
        return enriched;
      });
    } catch {
      /* keep the templated one-liner on failure */
    }
  }

  async function feed() {
    const now = new Date().toISOString();
    const seeded = seedCompass(now);
    setCompass(seeded);
    await saveCompassState(seeded);
    setMessages([
      {
        id: `a-seed-${Date.now()}`,
        role: "assistant",
        text: `(테스트 데이터를 불러왔어요) 전직 AI 엔지니어로 AI 교육 창업을 그려보고 계시네요 — “${
          seeded.compass.essence ?? seeded.compass.oneLiner
        }”. 이 방향에서 요즘 가장 마음이 가는 건 뭐예요?`,
      },
    ]);
    setInput("");
    setError("");
  }

  async function reset() {
    if (!confirm("이 브라우저에 저장된 나침반을 새로 시작할까요?")) return;
    const fresh = await resetCompassState(new Date().toISOString());
    setCompass(fresh);
    setMessages([]);
    setInput("");
    setError("");
  }

  return (
    <main className="min-h-dvh bg-cream">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
        <Link href="/">
          <Wordmark />
        </Link>
        <nav className="flex items-center gap-2 text-sm">
          <button
            onClick={feed}
            className="rounded-full border border-line bg-cream-2 px-3 py-2 text-xs font-bold text-clay-deep transition hover:bg-sand"
            title="전직 AI 엔지니어 · AI 교육 창업 샘플 기록 불러오기"
          >
            샘플 보기
          </button>
          <Link className="rounded-full bg-clay px-4 py-2 font-semibold text-white" href="/chat">
            채팅
          </Link>
          <Link className="rounded-full border border-line bg-surface px-4 py-2 text-ink-soft" href="/dashboard">
            대시보드
          </Link>
        </nav>
      </header>

      <section className="mx-auto grid max-w-6xl gap-5 px-5 pb-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="flex min-h-[calc(100dvh-7rem)] flex-col overflow-hidden rounded-[1.25rem] border border-line bg-surface shadow-soft">
          <div className="border-b border-line bg-cream-2 px-5 py-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <LogoMark className="h-9 w-9" />
                <div>
                  <h1 className="font-display text-xl font-bold text-ink">{BRAND.chatLabel}</h1>
                  <p className="text-sm text-ink-soft">오늘의 기록을 남기면 나침반이 갱신됩니다.</p>
                </div>
              </div>
              <button
                onClick={reset}
                className="rounded-full border border-line px-3 py-1.5 text-xs font-medium text-ink-faint transition hover:text-clay"
              >
                초기화
              </button>
            </div>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
            {!compass ? (
              <div className="rounded-2xl bg-cream-2 p-4 text-sm text-ink-soft">나침반을 불러오는 중...</div>
            ) : messages.length === 0 ? (
              <div className="max-w-xl rounded-2xl bg-cream-2 p-5 text-ink">
                <p className="font-semibold">처음이라면 여기서 시작하면 됩니다.</p>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                  요즘 떠오르는 고민, 오늘 한 작은 행동, 누가 물어본 문제를 그냥 적어주세요.
                  기록은 이 브라우저에만 쌓이고, 나침반에 반영됩니다.
                </p>
              </div>
            ) : (
              messages.map((m) => (
                <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[82%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                      m.role === "user"
                        ? "bg-clay text-white"
                        : "border border-line bg-cream-2 text-ink"
                    }`}
                  >
                    {m.pending ? <TypingDots /> : m.text}
                  </div>
                </div>
              ))
            )}
            {error && <p className="rounded-xl bg-clay-tint px-4 py-3 text-sm text-clay-deep">{error}</p>}
          </div>

          <div className="border-t border-line bg-surface p-4">
            <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
              {STARTERS.map((s) => (
                <button
                  key={s}
                  onClick={() => setInput(s)}
                  className="shrink-0 rounded-full border border-line bg-cream px-3 py-1.5 text-xs text-ink-soft transition hover:border-clay hover:text-clay"
                >
                  {s}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="그냥 적어주세요. 예: 오늘 지인이 AI로 안내문 만드는 걸 물어봤고, 작은 서비스로 만들 수 있을지 궁금했어요."
                className="min-h-20 flex-1 resize-none rounded-2xl border border-line bg-cream px-4 py-3 text-sm leading-relaxed text-ink outline-none transition placeholder:text-ink-faint focus:border-clay focus:bg-surface"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) void send();
                }}
              />
              <button
                onClick={send}
                disabled={!input.trim() || loading || !compass}
                className="w-20 rounded-2xl bg-clay px-4 py-3 text-sm font-semibold text-white shadow-soft transition hover:bg-clay-deep disabled:opacity-50"
              >
                {loading ? "기록 중" : "보내기"}
              </button>
            </div>
          </div>
        </div>

        <aside className="space-y-4">
          <CompassCard compass={compass} />
          <div className="rounded-[1.25rem] border border-line bg-surface p-5 shadow-sm">
            <p className="text-sm font-semibold text-ink">로컬 우선 저장</p>
            <p className="mt-2 text-xs leading-relaxed text-ink-soft">
              기록과 나침반은 이 브라우저(IndexedDB)에 저장됩니다. 서버는 필요한 결과만 돌려줘요.
            </p>
          </div>
          <Link
            href="/dashboard"
            className="flex w-full items-center justify-center rounded-full bg-sage px-4 py-3 text-sm font-semibold text-white"
          >
            대시보드 보기
          </Link>
        </aside>
      </section>
    </main>
  );
}

function TypingDots() {
  return (
    <span className="inline-flex items-center gap-1 py-0.5" aria-label="작성 중">
      {[0, 150, 300].map((d) => (
        <span
          key={d}
          className="h-1.5 w-1.5 animate-bounce rounded-full bg-ink-faint"
          style={{ animationDelay: `${d}ms` }}
        />
      ))}
    </span>
  );
}

const CONVERGE: Record<CompassState["status"], string> = {
  listening: "아직 기록이 부족해요",
  narrowing: "여러 방향을 좁혀가는 중이에요",
  confirming: "한 방향이 보이기 시작했어요",
  executing: "지금 방향이 꽤 또렷해졌어요",
};

function CompassCard({ compass }: { compass: CompassState | null }) {
  const pct = compass ? Math.round(compass.displayAlignment * 100) : 0;
  return (
    <div className="rounded-[1.25rem] border border-line bg-surface p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-clay">나의 나침반</p>
        {compass && (
          <span className="rounded-full bg-cream-2 px-2.5 py-1 text-xs font-medium text-ink-soft">
            {STATUS_LABEL[compass.status]}
          </span>
        )}
      </div>
      <p className="mt-3 font-display text-lg font-bold leading-snug text-ink">
        {compass?.compass.essence ?? compass?.compass.oneLiner ?? "아직 방향을 듣는 중이에요."}
      </p>
      <p className="mt-1 text-xs text-ink-faint">흩어진 기록에서 보이는 현재 방향</p>

      <div className="mt-3">
        <BeadCompass state={compass} />
      </div>

      <div className="mt-3 flex items-center gap-3">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-cream-2">
          <div className="h-full rounded-full bg-clay transition-all duration-500" style={{ width: `${pct}%` }} />
        </div>
        <span className="text-sm font-semibold text-clay">{pct}%</span>
      </div>
      <p className="mt-1.5 text-xs text-ink-faint">
        방향 — {compass ? CONVERGE[compass.status] : "기록 전"}
      </p>
    </div>
  );
}
