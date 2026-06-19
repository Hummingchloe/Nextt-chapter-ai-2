import Link from "next/link";
import TrackView from "./components/TrackView";
import { LogoMark, Wordmark } from "./components/Logo";
import OnboardingStartButton from "./components/OnboardingStartButton";
import InteractiveCompassHero from "./components/InteractiveCompassHero";
import { BRAND } from "@/lib/brand";

const painPoints = [
  "내가 다음에 할 수 있는 일이 뭔지 모르겠다.",
  "경험은 쌓였는데 어떻게 정리해야 할지 막막하다.",
  "지금 작게 시작할 수 있는 한 가지를 찾고 싶다.",
  "AI는 배웠는데, 내 일과 어떻게 연결해야 할지 모르겠다.",
];

const userTypes = [
  {
    tag: "다음 방향을 찾는 사람",
    desc: "지금까지 해온 일은 있는데, 다음 걸음을 어디로 둘지 막막한 분.",
    tint: "bg-clay-tint",
  },
  {
    tag: "자산이 흩어진 전문가",
    desc: "경험·강점은 분명한데 어떻게 모아 팔지 막힌 분.",
    tint: "bg-sage-tint",
  },
  {
    tag: "AI를 연결하려는 사람",
    desc: "AI를 알지만 내 일과 수익으로 어떻게 잇는지 모르는 분.",
    tint: "bg-clay-tint",
  },
  {
    tag: "사람을 잇는 커넥터",
    desc: "모임·소개·관계 자산이 큰, 연결에 강점이 있는 분.",
    tint: "bg-sage-tint",
  },
];

const steps = [
  {
    n: "01",
    t: "대화에 기록해요",
    d: "긴 질문지가 없어요. 지금 생각이나 오늘 있었던 일을 짧게 적으세요.",
  },
  {
    n: "02",
    t: "컴퍼스가 신호를 모아요",
    d: "기록은 이 브라우저에 쌓이고, 서버는 필요한 계산만 합니다.",
  },
  {
    n: "03",
    t: "방향이 또렷해져요",
    d: "방향이 또렷해진 만큼 오늘 해볼 일과 추천 콘텐츠가 열립니다.",
  },
];

export default function LandingPage() {
  return (
    <main className="relative overflow-hidden">
      <TrackView event="landing_viewed" />

      {/* ── Nav ─────────────────────────────────────────── */}
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Wordmark />
        <OnboardingStartButton
          className="hidden rounded-full bg-clay px-5 py-2.5 text-sm font-bold text-white transition hover:bg-clay-deep disabled:opacity-60 sm:inline-block"
        >
          내 방향 찾아보기
        </OnboardingStartButton>
      </header>

      {/* ── Hero ────────────────────────────────────────── */}
      <section className="interactive-hero bg-warm-glow relative">
        <div className="mx-auto max-w-3xl px-6 pb-20 pt-16 text-center sm:pb-24 sm:pt-24">
          <h1 className="animate-fade-up text-[2rem] font-extrabold leading-[1.14] tracking-[-0.04em] text-ink sm:text-[3.6rem] sm:leading-[1.12]">
            흩어진 매일이
            <br />
            <span className="text-clay">한 방향으로 모이는 순간</span>
          </h1>

          <p className="animate-fade-up delay-1 mx-auto mt-6 max-w-xl text-[1.05rem] font-medium leading-relaxed text-ink-soft">
            기록이 쌓일수록, 나의 경험과 강점이
            <br /> 하나의 방향으로 또렷해집니다.
          </p>

          <div className="animate-fade-up delay-2 mx-auto mt-9 max-w-[290px] sm:max-w-[320px]">
            <InteractiveCompassHero />
          </div>

          <div className="animate-fade-up delay-3 mt-9 flex flex-col items-center gap-3">
            <OnboardingStartButton
              className="group inline-flex items-center gap-2 rounded-2xl bg-clay px-8 py-4 text-[1.05rem] font-bold text-white transition hover:bg-clay-deep active:scale-[0.98] disabled:opacity-60"
            >
              내 방향 찾아보기
              <span className="transition group-hover:translate-x-0.5">→</span>
            </OnboardingStartButton>
            <p className="text-sm font-medium text-ink-faint">
              가입 없이 · 로컬 우선 저장 · 대시보드 자동 갱신
            </p>
          </div>
        </div>
      </section>

      {/* ── Pain points ─────────────────────────────────── */}
      <section className="bg-cream-2 py-24">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="text-[1.6rem] font-extrabold tracking-[-0.035em] text-ink sm:text-[2rem]">
            이런 생각, 해본 적 있나요?
          </h2>
          <div className="mt-10 grid gap-3 sm:grid-cols-2">
            {painPoints.map((p) => (
              <div
                key={p}
                className="rounded-2xl border border-line bg-surface px-6 py-5 text-left text-[1rem] font-medium leading-relaxed text-ink-soft"
              >
                {p}
              </div>
            ))}
          </div>
          <p className="mt-10 text-[1.05rem] font-medium leading-relaxed text-ink-soft">
            가능성이 없는 게 아닙니다.
            <br />
            <b className="text-ink">아직 '일의 언어'로 번역되지 않았을 뿐</b>
            입니다.
          </p>
        </div>
      </section>

      {/* ── What you get ────────────────────────────────── */}
      <section className="py-24">
        <div className="mx-auto max-w-4xl px-6">
          <div className="text-center">
            <p className="text-[12px] font-bold uppercase tracking-wider text-clay">
              대화 뒤, 대시보드에 쌓이는 것
            </p>
            <h2 className="mt-3 text-[1.6rem] font-extrabold tracking-[-0.035em] text-ink sm:text-[2rem]">
              막연함 대신, 살아있는 상태판
            </h2>
          </div>

          <div className="mt-12 grid gap-4 md:grid-cols-2">
            <ResultCard
              title="나의 강점 요약"
              body="대화 기록에서 반복되는 경험과 자산 신호를 모아 보여줍니다."
              accent="clay"
            />
            <ResultCard
              title="지금의 방향"
              body="기록이 충분한지 보고, 추천보다 질문이 먼저인지 판단합니다."
              accent="sage"
            />
            <ResultCard
              title="오늘 해볼 일"
              body="방향이 또렷해진 만큼 오늘·내일·3일차 행동을 제안합니다."
              accent="clay"
            />
            <ResultCard
              title="추천 콘텐츠와 기록 로그"
              body="추천 콘텐츠와 내가 남긴 기록의 흐름을 같이 봅니다."
              accent="sage"
            />
          </div>
        </div>
      </section>

      {/* ── Who it's for ────────────────────────────────── */}
      <section className="bg-cream-2 py-24">
        <div className="mx-auto max-w-4xl px-6">
          <div className="text-center">
            <h2 className="text-[1.6rem] font-extrabold tracking-[-0.035em] text-ink sm:text-[2rem]">
              누구를 위한 서비스인가요
            </h2>
            <p className="mt-3 text-[1rem] font-medium text-ink-soft">
              다음 방향이 막막한 사람이, 자신의 경험에서 한 가지 길을 또렷하게 만드는 시간.
            </p>
          </div>
          <div className="mt-12 grid gap-4 sm:grid-cols-2">
            {userTypes.map((u) => (
              <div
                key={u.tag}
                className="flex items-start gap-4 rounded-2xl border border-line bg-surface p-6 transition hover:shadow-soft"
              >
                <span
                  className={`mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${u.tint}`}
                >
                  <LogoMark className="h-5 w-5" />
                </span>
                <div>
                  <p className="font-extrabold tracking-[-0.02em] text-ink">{u.tag}</p>
                  <p className="mt-1 text-[0.95rem] font-medium leading-relaxed text-ink-soft">
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
          <h2 className="text-center text-[1.6rem] font-extrabold tracking-[-0.035em] text-ink sm:text-[2rem]">
            어떻게 진행되나요
          </h2>
          <div className="mt-14 grid gap-10 sm:grid-cols-3">
            {steps.map((s) => (
              <div key={s.n} className="text-center sm:text-left">
                <span className="text-3xl font-extrabold tracking-[-0.04em] text-clay/60">
                  {s.n}
                </span>
                <p className="mt-3 text-lg font-extrabold tracking-[-0.025em] text-ink">
                  {s.t}
                </p>
                <p className="mt-2 text-[0.97rem] font-medium leading-relaxed text-ink-soft">
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
              <p className="text-[12px] font-bold uppercase tracking-wider text-clay">
                방향을 찾은 다음에도
              </p>
              <h2 className="mt-3 text-[1.6rem] font-extrabold tracking-[-0.035em] leading-snug text-ink sm:text-[2rem]">
                혼자 두지 않습니다.
                <br />
                대화 한 줄이면 충분합니다.
              </h2>
              <p className="mt-5 text-[1rem] font-medium leading-relaxed text-ink-soft">
                대화에 오늘의 작은 행동을 짧게 기록하면 컴퍼스가 흐름을 읽고
                대시보드에 다음 걸음을 보여줍니다.
                크게 하지 않아도 괜찮습니다.{" "}
                <b className="text-ink">멈추지만 않으면 됩니다.</b>
              </p>
              <ul className="mt-6 space-y-2.5 text-ink">
                {[
                  "오늘의 가장 작은 행동 1개",
                  "2~3분이면 끝나는 짧은 기록",
                  "현재 방향이 자동 갱신",
                  "대시보드 추천 상태 확인",
                ].map((t) => (
                  <li key={t} className="flex items-center gap-2.5 text-[0.97rem] font-medium">
                    <span className="text-clay">✓</span>
                    {t}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-3xl border border-line bg-surface p-6 shadow-soft">
              <p className="text-[11px] font-bold uppercase tracking-wider text-clay">
                {BRAND.chatLabel}
              </p>
              <div className="mt-3 rounded-2xl bg-cream-2 p-4">
                <p className="text-sm font-medium text-ink-soft">오늘 해볼 일</p>
                <p className="mt-1 text-[0.97rem] font-bold tracking-[-0.02em] text-ink">
                  가장 편한 동료 한 사람에게 "요즘 그 매뉴얼 잘 보고 있어요?"라고 물어보기.
                </p>
              </div>
              <div className="mt-3 rounded-2xl bg-sage-tint p-4">
                <p className="text-[11px] font-bold uppercase tracking-wider text-sage">
                  오늘의 한 줄 피드백
                </p>
                <p className="mt-1.5 text-sm font-medium leading-relaxed text-ink">
                  오늘은 막막함을 안고도 한 걸음 나갔습니다. 더 많이 하기보다,
                  같은 질문을 한 사람에게 한 번 더 해보는 게 좋아 보입니다.
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
          <h2 className="mt-6 text-[1.6rem] font-extrabold tracking-[-0.035em] leading-snug text-ink sm:text-[2rem]">
            "이제 나도, 이 방향으로
            <br />
            한번 작게 시작해볼 수 있겠다."
          </h2>
          <p className="mt-4 text-[1rem] font-medium text-ink-soft">
            기록할수록 방향이 또렷해집니다. 당신의 차례입니다.
          </p>
          <OnboardingStartButton
            className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-clay px-8 py-4 text-[1.05rem] font-bold text-white transition hover:bg-clay-deep active:scale-[0.98] disabled:opacity-60"
          >
            내 방향 찾아보기 →
          </OnboardingStartButton>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────── */}
      <footer className="border-t border-line bg-cream-2">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-8 text-sm font-medium text-ink-faint sm:flex-row">
          <Wordmark />
          <div className="text-center sm:text-right">
            <p>다음 방향을 함께 묻는 일상의 컴퍼스.</p>
            <p className="mt-1 text-xs">
              🔒 적으신 이야기는 방향을 찾는 데만 쓰입니다. 외부로 팔지 않습니다.
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
    <div className="group relative overflow-hidden rounded-2xl border border-line bg-surface p-7 transition hover:-translate-y-0.5 hover:shadow-soft">
      <span
        className={`absolute right-6 top-6 h-2 w-2 rounded-full ${
          accent === "clay" ? "bg-clay" : "bg-sage"
        }`}
      />
      <p className="text-lg font-extrabold tracking-[-0.025em] text-ink">{title}</p>
      <p className="mt-2 text-[0.97rem] font-medium leading-relaxed text-ink-soft">{body}</p>
    </div>
  );
}
