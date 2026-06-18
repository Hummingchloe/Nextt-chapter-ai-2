"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { LogoMark, Wordmark } from "../components/Logo";
import { loadLocalOntology, resetLocalOntology, saveLocalOntology } from "@/lib/local-ontology-store";
import { buildProposalDashboard, type ProposalDashboard } from "@/lib/proposal";
import type { UserOntology } from "@/lib/ontology";

const STARTERS = [
  "요즘 가장 자주 드는 생각은...",
  "내가 잘하지만 아직 돈으로 연결 못 한 것은...",
  "오늘 한 작은 행동은...",
];

export default function ChatPage() {
  const [ontology, setOntology] = useState<UserOntology | null>(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadLocalOntology()
      .then(setOntology)
      .catch(() => {
        const fresh = resetLocalOntology();
        void fresh.then(setOntology);
      });
  }, []);

  const dashboard: ProposalDashboard | null = useMemo(
    () => (ontology ? buildProposalDashboard(ontology) : null),
    [ontology],
  );

  async function send() {
    const text = input.trim();
    if (!ontology || !text || loading) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/compass/compute", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ontology, input: text }),
      });
      if (!res.ok) throw new Error("compute failed");
      const data = await res.json();
      const next = data.ontology as UserOntology;
      setOntology(next);
      await saveLocalOntology(next);
      setInput("");
    } catch {
      setError("계산 중 문제가 있었어요. 잠시 후 다시 시도해 주세요.");
    } finally {
      setLoading(false);
    }
  }

  async function reset() {
    if (!confirm("이 브라우저에 저장된 로컬 온톨로지를 새로 시작할까요?")) return;
    const fresh = await resetLocalOntology();
    setOntology(fresh);
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
                  <h1 className="font-display text-xl font-bold text-ink">Compass Chat</h1>
                  <p className="text-sm text-ink-soft">기록하면 로컬 온톨로지가 갱신됩니다.</p>
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
            {!ontology ? (
              <div className="rounded-2xl bg-cream-2 p-4 text-sm text-ink-soft">로컬 온톨로지를 불러오는 중...</div>
            ) : ontology.messages.length === 0 ? (
              <div className="max-w-xl rounded-2xl bg-cream-2 p-5 text-ink">
                <p className="font-semibold">처음이라면 여기서 시작하면 됩니다.</p>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                  요즘 머릿속에 자주 떠오르는 고민, 오늘 한 작은 행동, 누가 물어본 문제를 그냥 적어주세요.
                  서버에는 저장하지 않고 이 브라우저의 IndexedDB에 쌓습니다.
                </p>
              </div>
            ) : (
              ontology.messages.map((m) => (
                <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[82%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                      m.role === "user"
                        ? "bg-clay text-white"
                        : "border border-line bg-cream-2 text-ink"
                    }`}
                  >
                    {m.text}
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
                placeholder="그냥 적어주세요. 예: 오늘 지인이 AI로 안내문 만드는 걸 물어봤고, 이걸 작은 서비스로 만들 수 있을지 궁금했어요."
                className="min-h-20 flex-1 resize-none rounded-2xl border border-line bg-cream px-4 py-3 text-sm leading-relaxed text-ink outline-none transition placeholder:text-ink-faint focus:border-clay focus:bg-surface"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) void send();
                }}
              />
              <button
                onClick={send}
                disabled={!input.trim() || loading || !ontology}
                className="w-20 rounded-2xl bg-clay px-4 py-3 text-sm font-semibold text-white shadow-soft transition hover:bg-clay-deep disabled:opacity-50"
              >
                {loading ? "계산" : "보내기"}
              </button>
            </div>
          </div>
        </div>

        <aside className="space-y-4">
          <ScoreCard ontology={ontology} />
          <div className="rounded-[1.25rem] border border-line bg-surface p-5 shadow-sm">
            <p className="text-sm font-semibold text-ink">다음 판단</p>
            <p className="mt-2 text-sm leading-relaxed text-ink-soft">
              {dashboard?.gateMessage ?? "기록을 불러오는 중입니다."}
            </p>
            <Link
              href="/dashboard"
              className="mt-4 flex w-full items-center justify-center rounded-full bg-sage px-4 py-3 text-sm font-semibold text-white"
            >
              대시보드 보기
            </Link>
          </div>
          <div className="rounded-[1.25rem] border border-line bg-surface p-5 shadow-sm">
            <p className="text-sm font-semibold text-ink">로컬 우선 저장</p>
            <p className="mt-2 text-xs leading-relaxed text-ink-soft">
              원문 채팅과 온톨로지는 이 브라우저에 저장됩니다. Vercel API는 입력을 받아 Compass를 계산하고 결과만 돌려줍니다.
            </p>
          </div>
        </aside>
      </section>
    </main>
  );
}

function ScoreCard({ ontology }: { ontology: UserOntology | null }) {
  const compass = ontology?.compass;
  return (
    <div className="rounded-[1.25rem] border border-line bg-surface p-5 shadow-sm">
      <p className="text-sm font-semibold text-ink">현재 정렬도</p>
      <div className="mt-3 flex items-end gap-2">
        <span className="font-display text-5xl font-bold text-clay">{compass?.alignment ?? 0}</span>
        <span className="pb-2 text-sm text-ink-soft">%</span>
      </div>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-cream-2">
        <div className="h-full rounded-full bg-clay" style={{ width: `${compass?.alignment ?? 0}%` }} />
      </div>
      <p className="mt-4 text-sm leading-relaxed text-ink-soft">
        {compass?.oneLine ?? "아직 계산 전입니다."}
      </p>
    </div>
  );
}
