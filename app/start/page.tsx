"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LogoMark, Wordmark } from "../components/Logo";
import { track, detectDevice } from "@/lib/track";

const reassurances = [
  { icon: "🌿", t: "시험이 아니에요", d: "정답을 맞히는 게 아니라, 가능성을 찾는 시간이에요." },
  { icon: "🤍", t: "편하게 답하면 돼요", d: "잘 모르겠는 질문은 가볍게 넘어가도 괜찮아요." },
  { icon: "⏳", t: "약 15분이면 충분해요", d: "끝나면, 당신만을 위한 한 페이지 결과를 드려요." },
];

export default function StartPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    track("start_viewed");
  }, []);

  async function begin() {
    if (loading) return;
    setLoading(true);
    try {
      const res = await fetch("/api/session", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ device: detectDevice(), name: name.trim() || undefined }),
      });
      const data = await res.json();
      track("diagnostic_started", { hasName: Boolean(name.trim()) }, data.sessionId);
      const q = new URLSearchParams({ sid: data.sessionId });
      if (name.trim()) q.set("name", name.trim());
      router.push(`/diagnostic?${q.toString()}`);
    } catch {
      setLoading(false);
      alert("연결에 문제가 있었어요. 잠시 후 다시 시도해 주세요.");
    }
  }

  return (
    <main className="bg-warm-glow flex min-h-dvh flex-col">
      <header className="mx-auto w-full max-w-6xl px-6 py-6">
        <Link href="/">
          <Wordmark />
        </Link>
      </header>

      <div className="flex flex-1 items-center justify-center px-6 pb-16">
        <div className="animate-fade-up w-full max-w-lg rounded-[2rem] border border-line bg-surface p-8 shadow-soft sm:p-10">
          <LogoMark className="h-12 w-12 animate-breathe" />

          <h1 className="mt-6 font-display text-[1.7rem] font-bold leading-snug text-ink sm:text-[2rem]">
            잠깐 숨을 고르고,
            <br />
            천천히 시작해 볼까요?
          </h1>
          <p className="mt-4 leading-relaxed text-ink-soft">
            지금부터 드리는 질문은 당신을 평가하기 위한 게 아니에요. 흩어져 있던
            경험을 모아, <b className="text-ink">다시 시작할 방향 하나</b>를
            함께 찾기 위한 거예요.
          </p>

          <ul className="mt-7 space-y-3">
            {reassurances.map((r) => (
              <li
                key={r.t}
                className="flex items-start gap-3 rounded-2xl bg-cream-2 px-4 py-3"
              >
                <span className="text-xl">{r.icon}</span>
                <div>
                  <p className="font-semibold text-ink">{r.t}</p>
                  <p className="text-sm text-ink-soft">{r.d}</p>
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-8">
            <label
              htmlFor="name"
              className="mb-2 block text-sm font-medium text-ink-soft"
            >
              어떻게 불러드릴까요?{" "}
              <span className="text-ink-faint">(선택)</span>
            </label>
            <input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="예) 지영"
              maxLength={20}
              className="w-full rounded-2xl border border-line bg-cream px-4 py-3.5 text-ink outline-none transition placeholder:text-ink-faint focus:border-clay focus:bg-surface"
              onKeyDown={(e) => {
                if (e.key === "Enter") begin();
              }}
            />
          </div>

          <button
            onClick={begin}
            disabled={loading}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-clay px-8 py-4 text-[1.05rem] font-semibold text-white shadow-soft transition hover:bg-clay-deep hover:shadow-lift active:scale-[0.99] disabled:opacity-60"
          >
            {loading ? "준비하고 있어요…" : "진단 시작하기 →"}
          </button>
          <p className="mt-3 text-center text-sm text-ink-faint">
            가입 없이 바로 시작해요.
          </p>
        </div>
      </div>
    </main>
  );
}
