import TrackView from "./components/TrackView";
import { Wordmark } from "./components/Logo";
import OnboardingStartButton from "./components/OnboardingStartButton";
import InteractiveCompassHero from "./components/InteractiveCompassHero";

const painPoints = [
  "해온 일은 있는데, 다음에 뭘 해야 할지 모르겠다.",
  "경험과 강점은 많은데 하나로 정리되지 않는다.",
  "AI를 배웠지만, 내 일과 어떻게 연결할지 막막하다.",
  "거창한 계획보다 지금 시작할 한 가지가 필요하다.",
];

const steps = [
  {
    n: "01",
    t: "짧게 답합니다",
    d: "지금까지의 경험과 현재 고민을 질문에 따라 정리합니다.",
  },
  {
    n: "02",
    t: "첫 방향을 확인합니다",
    d: "강점, 추천 방향, 시장 단서와 다음 행동을 리포트로 봅니다.",
  },
  {
    n: "03",
    t: "기록하며 좁혀갑니다",
    d: "이후의 기록과 행동이 쌓일수록 Compass가 갱신됩니다.",
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
            <b className="text-ink">아직 ‘일의 언어’로 정리되지 않았을 뿐</b>
            입니다.
          </p>
        </div>
      </section>

      {/* ── What Lompass does ───────────────────────────── */}
      <section className="py-24">
        <div className="mx-auto max-w-4xl px-6">
          <div className="text-center">
            <p className="text-[12px] font-bold uppercase tracking-wider text-clay">
              Lompass가 정리하는 것
            </p>
            <h2 className="mt-3 text-[1.6rem] font-extrabold tracking-[-0.035em] text-ink sm:text-[2rem]">
              내 경험에서, 다음 한 걸음을 찾습니다.
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-[1rem] font-medium leading-7 text-ink-soft">
              온보딩 답변과 이후의 기록에서 반복되는 경험·강점·행동 신호를 모아,
              <br className="hidden sm:block" /> 지금의 방향과 작은 실행으로 정리합니다.
            </p>
          </div>

          <div className="mt-12 grid gap-4 md:grid-cols-3">
            <ResultCard
              title="나의 강점"
              body="반복해서 드러나는 경험과 강점을 정리합니다."
              accent="clay"
            />
            <ResultCard
              title="지금의 방향"
              body="여러 신호가 어느 쪽으로 모이는지 보여줍니다."
              accent="sage"
            />
            <ResultCard
              title="오늘 해볼 일"
              body="지금 바로 할 수 있는 작은 행동을 제안합니다."
              accent="clay"
            />
          </div>
        </div>
      </section>

      {/* ── How it works ────────────────────────────────── */}
      <section className="bg-cream-2 py-24">
        <div className="mx-auto max-w-4xl px-6">
          <h2 className="text-center text-[1.6rem] font-extrabold tracking-[-0.035em] text-ink sm:text-[2rem]">
            어떻게 진행되나요?
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

      {/* ── Habit + privacy ─────────────────────────────── */}
      <section className="py-24">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <p className="text-[12px] font-bold uppercase tracking-wider text-clay">
            첫 리포트 이후
          </p>
          <h2 className="mt-3 text-[1.6rem] font-extrabold tracking-[-0.035em] text-ink sm:text-[2rem]">
            이후에는, 하루 한 줄이면 충분합니다.
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-[1rem] font-medium leading-7 text-ink-soft">
            오늘 한 행동, 머릿속에 남은 생각, 누군가와 나눈 대화를 짧게 남겨보세요.
            <br className="hidden sm:block" /> Lompass가 기록을 다시 읽고 다음 질문과
            작은 행동을 제안합니다.
          </p>
          <p className="mx-auto mt-7 inline-flex rounded-full bg-clay-tint px-4 py-2 text-sm font-semibold text-clay-deep">
            가입 없이 시작 · 일상의 Compass 기록은 내 브라우저에 우선 저장
          </p>
        </div>
      </section>

      {/* ── Final CTA ───────────────────────────────────── */}
      <section className="px-6 pb-24">
        <div className="bg-warm-glow mx-auto max-w-3xl rounded-[2rem] border border-line bg-surface px-8 py-16 text-center shadow-soft">
          <h2 className="text-[1.6rem] font-extrabold tracking-[-0.035em] leading-snug text-ink sm:text-[2rem]">
            오늘의 기록이
            <br /> 다음 방향의 시작이 됩니다.
          </h2>
          <p className="mt-4 text-[1rem] font-medium text-ink-soft">
            거창한 계획보다, 지금의 경험부터 짧게 정리해보세요.
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
          <p>© Lompass</p>
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
