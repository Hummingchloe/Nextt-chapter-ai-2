import Link from "next/link";
import TrackView from "./components/TrackView";
import { LogoMark, Wordmark } from "./components/Logo";

const painPoints = [
  "지금 일 말고, 내 경험으로 새 수익을 만들 수 있을까?",
  "AI 시대에 내 경험과 기술이 아직 가치가 있을까?",
  "내 전문성을 상품이나 서비스로 바꿀 수 있을까?",
  "AI를 배웠거나 관심은 있는데, 내 일과 어떻게 연결하지?",
];

const userTypes = [
  {
    tag: "전환을 준비하는 경험자",
    desc: "현재 일에 만족하지 않거나 다음 커리어 방향을 다시 잡고 싶은 분",
    tint: "bg-clay-tint",
  },
  {
    tag: "이미 자산이 있는 전문가",
    desc: "교육·상담·운영·마케팅·기술 등 경험은 있는데 어떻게 팔지 막힌 분",
    tint: "bg-sage-tint",
  },
  {
    tag: "AI를 연결하려는 사람",
    desc: "AI는 배웠거나 관심 있는데, 내 일·수익과 연결을 못 한 분",
    tint: "bg-clay-tint",
  },
  {
    tag: "사람을 잇는 커넥터",
    desc: "커뮤니티·소개·협업 연결에 강점이 있는, 관계 자산이 큰 분",
    tint: "bg-sage-tint",
  },
];

const steps = [
  {
    n: "01",
    t: "채팅에 기록해요",
    d: "질문지를 넘기지 않아도 괜찮아요. 지금 생각과 오늘의 기록을 그냥 적으면 돼요.",
  },
  {
    n: "02",
    t: "Compass가 갱신돼요",
    d: "기록은 이 브라우저에 쌓이고, 서버는 필요한 계산만 수행해요.",
  },
  {
    n: "03",
    t: "대시보드에서 확인해요",
    d: "방향이 충분히 선명해지면 오늘의 액션과 추천 콘텐츠가 열려요.",
  },
];

export default function LandingPage() {
  return (
    <main className="relative overflow-hidden">
      <TrackView event="landing_viewed" />

      {/* ── Nav ─────────────────────────────────────────── */}
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <Wordmark />
        <Link
          href="/chat"
          className="hidden rounded-full border border-line bg-surface/70 px-5 py-2 text-sm font-medium text-ink-soft transition hover:border-clay hover:text-clay sm:inline-block"
        >
          채팅 시작하기
        </Link>
      </header>

      {/* ── Hero ────────────────────────────────────────── */}
      <section className="bg-warm-glow relative">
        <div className="mx-auto max-w-3xl px-6 pb-20 pt-12 text-center sm:pt-20">
          <p className="animate-fade-up mb-6 inline-flex items-center gap-2 rounded-full border border-line bg-surface/80 px-4 py-1.5 text-sm text-ink-soft shadow-sm backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-sage" />
            AI 시대, 내 경험을 새 수익으로
          </p>

          <h1 className="animate-fade-up delay-1 font-display text-[2.1rem] font-bold leading-[1.32] text-ink sm:text-[3.1rem] sm:leading-[1.3]">
            내 경험이 다시 수익이 되는
            <br />
            <span className="relative inline-block text-clay-deep">
              방향 하나
              <svg
                className="absolute -bottom-2 left-0 w-full"
                viewBox="0 0 200 12"
                fill="none"
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                <path
                  d="M3 8.5C40 4 120 3 197 6.5"
                  stroke="var(--color-gold)"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  opacity="0.6"
                />
              </svg>
            </span>
            <br />
            함께 찾아요.
          </h1>

          <p className="animate-fade-up delay-2 mx-auto mt-7 max-w-xl text-[1.05rem] leading-relaxed text-ink-soft">
            창업을 과장하는 서비스가 아니에요. 흩어져 있던 내 경험과 강점에서,
            <br className="hidden sm:block" />
            지금 작게 시험해볼 수 있는 <b className="text-ink">새 수익의 방향</b>을
            선명하게 보는 시간이에요.
          </p>

          <div className="animate-fade-up delay-3 mt-9 flex flex-col items-center gap-3">
            <Link
              href="/chat"
              className="group inline-flex items-center gap-2 rounded-full bg-clay px-8 py-4 text-[1.05rem] font-semibold text-white shadow-soft transition hover:bg-clay-deep hover:shadow-lift active:scale-[0.98]"
            >
              내 방향 찾기
              <span className="transition group-hover:translate-x-0.5">→</span>
            </Link>
            <p className="text-sm text-ink-faint">
              가입 없이 · 작게 시작 · 리포트 자동 생성
            </p>
          </div>
        </div>

        {/* Floating sample peek */}
        <div className="pointer-events-none mx-auto -mb-16 max-w-md px-6">
          <div className="animate-float rounded-3xl border border-line bg-surface/90 p-5 shadow-lift backdrop-blur">
            <p className="text-xs font-semibold uppercase tracking-wider text-clay">
              대시보드 미리보기
            </p>
            <p className="mt-2 font-display text-lg font-bold text-ink">
              “지금 보이는 방향과 다음 행동”
            </p>
            <p className="mt-1 text-sm text-ink-soft">
              오늘의 액션 · 콘텐츠 추천 · 최근 기록이 한 화면에 정리돼요.
            </p>
          </div>
        </div>
      </section>

      {/* ── Pain points ─────────────────────────────────── */}
      <section className="bg-cream-2 pt-28 pb-20">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="font-display text-2xl font-bold text-ink sm:text-3xl">
            이런 생각, 해본 적 있나요?
          </h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            {painPoints.map((p) => (
              <div
                key={p}
                className="rounded-2xl border border-line bg-surface px-6 py-5 text-left text-[1.02rem] leading-relaxed text-ink shadow-sm"
              >
                <span className="mr-2 text-clay">“</span>
                {p}
              </div>
            ))}
          </div>
          <p className="mt-10 text-[1.05rem] leading-relaxed text-ink-soft">
            가능성이 없는 게 아니에요.
            <br />
            <b className="text-ink">아직 ‘일의 언어’로 번역되지 않았을 뿐</b>
            이에요.
          </p>
        </div>
      </section>

      {/* ── What you get ────────────────────────────────── */}
      <section className="py-24">
        <div className="mx-auto max-w-4xl px-6">
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-clay">
              채팅 뒤, 대시보드에 쌓이는 것
            </p>
            <h2 className="mt-3 font-display text-2xl font-bold text-ink sm:text-3xl">
              막연함 대신, 살아있는 상태판
            </h2>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-2">
            <ResultCard
              title="나의 강점 요약"
              body="채팅 기록에서 반복되는 경험과 자산 신호를 요약해요."
              accent="clay"
            />
            <ResultCard
              title="현재 방향"
              body="맥락이 충분한지 보고, 추천보다 질문이 먼저인지 판단해요."
              accent="sage"
            />
            <ResultCard
              title="날짜별 액션"
              body="방향이 충분히 선명해지면 오늘, 내일, 3일차 행동을 제안해요."
              accent="clay"
            />
            <ResultCard
              title="콘텐츠 추천과 최근 기록"
              body="관련 콘텐츠와 내가 남긴 기록 흐름을 같이 보여줘요."
              accent="sage"
            />
          </div>
        </div>
      </section>

      {/* ── Who it's for ────────────────────────────────── */}
      <section className="bg-cream-2 py-24">
        <div className="mx-auto max-w-4xl px-6">
          <div className="text-center">
            <h2 className="font-display text-2xl font-bold text-ink sm:text-3xl">
              누구를 위한 서비스인가요
            </h2>
            <p className="mt-3 text-ink-soft">
              미국·한국·홍콩 등 여러 국가의 35–55세 경험자 중, AI 시대에
              내 경험을 새 수익 기회로 바꾸고 싶은 분을 위해 만들었어요.
            </p>
          </div>
          <div className="mt-12 grid gap-5 sm:grid-cols-2">
            {userTypes.map((u) => (
              <div
                key={u.tag}
                className="flex items-start gap-4 rounded-2xl border border-line bg-surface p-6 shadow-sm transition hover:shadow-soft"
              >
                <span
                  className={`mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${u.tint}`}
                >
                  <LogoMark className="h-5 w-5" />
                </span>
                <div>
                  <p className="font-semibold text-ink">{u.tag}</p>
                  <p className="mt-1 text-[0.95rem] leading-relaxed text-ink-soft">
                    {u.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ────────────────────────────────── */}
      <section className="py-24">
        <div className="mx-auto max-w-4xl px-6">
          <h2 className="text-center font-display text-2xl font-bold text-ink sm:text-3xl">
            어떻게 진행되나요
          </h2>
          <div className="mt-14 grid gap-10 sm:grid-cols-3">
            {steps.map((s) => (
              <div key={s.n} className="text-center sm:text-left">
                <span className="font-display text-3xl font-bold text-clay/40">
                  {s.n}
                </span>
                <p className="mt-3 font-display text-lg font-bold text-ink">
                  {s.t}
                </p>
                <p className="mt-2 text-[0.97rem] leading-relaxed text-ink-soft">
                  {s.d}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── After the dashboard: momentum ──────────────────── */}
      <section className="bg-cream-2 py-24">
        <div className="mx-auto max-w-4xl px-6">
          <div className="grid items-center gap-10 md:grid-cols-2">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-clay">
                방향을 찾은 다음에도
              </p>
              <h2 className="mt-3 font-display text-2xl font-bold leading-snug text-ink sm:text-3xl">
                혼자 두지 않아요.
                <br />
                채팅 한 줄이면 충분해요.
              </h2>
              <p className="mt-5 leading-relaxed text-ink-soft">
                채팅에 오늘의 작은 행동을 짧게 기록하면 Compass가 흐름을 읽고
                대시보드에 다음 걸음을 보여줘요.
                크게 하지 않아도 괜찮아요.{" "}
                <b className="text-ink">멈추지만 않으면 돼요.</b>
              </p>
              <ul className="mt-6 space-y-2.5 text-ink">
                {[
                  "오늘의 가장 작은 행동 1개",
                  "2~3분이면 끝나는 짧은 기록",
                  "현재 방향 자동 갱신",
                  "대시보드 추천 상태 확인",
                ].map((t) => (
                  <li key={t} className="flex items-center gap-2.5">
                    <span className="text-clay">✓</span>
                    {t}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-3xl border border-line bg-surface p-6 shadow-soft">
              <p className="text-xs font-semibold uppercase tracking-wider text-clay">
                Compass Chat
              </p>
              <div className="mt-3 rounded-2xl bg-cream-2 p-4">
                <p className="text-sm text-ink-soft">오늘의 작은 행동</p>
                <p className="mt-1 font-medium text-ink">
                  가장 편한 지인 한 명에게 “요즘 제일 막막한 게 뭐예요?”라고
                  물어보세요.
                </p>
              </div>
              <div className="mt-3 rounded-2xl bg-sage-tint/60 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-sage">
                  오늘의 한 줄 피드백
                </p>
                <p className="mt-1.5 text-sm leading-relaxed text-ink">
                  오늘은 막막함을 안고도 한 걸음 나갔어요. 지금은 더 많이 하기보다,
                  같은 질문을 한 사람에게 더 해보는 게 좋아 보여요.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Final CTA ───────────────────────────────────── */}
      <section className="px-6 pb-24">
        <div className="bg-warm-glow mx-auto max-w-3xl rounded-[2rem] border border-line bg-surface px-8 py-16 text-center shadow-soft">
          <LogoMark className="mx-auto h-12 w-12 animate-breathe" />
          <h2 className="mt-6 font-display text-2xl font-bold leading-snug text-ink sm:text-[2rem]">
            “이제 나도, 내 경험으로
            <br />
            작게 시작해볼 수 있겠어.”
          </h2>
          <p className="mt-4 text-ink-soft">
            채팅으로 기록할수록 방향이 선명해집니다. 당신의 차례예요.
          </p>
          <Link
            href="/chat"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-clay px-8 py-4 text-[1.05rem] font-semibold text-white shadow-soft transition hover:bg-clay-deep hover:shadow-lift active:scale-[0.98]"
          >
            내 방향 찾기 →
          </Link>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────── */}
      <footer className="border-t border-line bg-cream-2">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-8 text-sm text-ink-faint sm:flex-row">
          <Wordmark />
          <div className="text-center sm:text-right">
            <p>AI 시대에 내 경험을 새 수익 기회로 바꾸는 가장 작은 첫걸음.</p>
            <p className="mt-1 text-xs">
              🔒 당신이 적은 이야기는 방향을 찾는 데만 쓰여요. 회사에 파는 일은 없어요.
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}

function ResultCard({
  title,
  body,
  accent,
}: {
  title: string;
  body: string;
  accent: "clay" | "sage";
}) {
  return (
    <div className="group relative overflow-hidden rounded-3xl border border-line bg-surface p-7 shadow-sm transition hover:-translate-y-1 hover:shadow-soft">
      <span
        className={`absolute right-6 top-6 h-2.5 w-2.5 rounded-full ${
          accent === "clay" ? "bg-clay" : "bg-sage"
        }`}
      />
      <p className="font-display text-lg font-bold text-ink">{title}</p>
      <p className="mt-2 text-[0.97rem] leading-relaxed text-ink-soft">{body}</p>
    </div>
  );
}
