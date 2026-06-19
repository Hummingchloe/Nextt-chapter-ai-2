// Central brand definitions. Change values here to rebrand without code-wide search.
//
// Why this file exists: product name, tagline, and logo are still being decided.
// Concentrating brand strings here makes the swap a single-file change once the
// rebrand lands. Only LIVE surfaces (per README: /, /chat, /dashboard, layout,
// compass intelligence prompts) read from here.

export const BRAND = {
  name: "Lompass",
  fullName: "Lompass",
  chatLabel: "Lompass Chat",
  landingPill: "다음 방향을 함께 묻는 일상의 컴퍼스",
  meta: {
    title: "Lompass — 방향이 또렷해지는 일상의 컴퍼스",
    description:
      "매일의 대화를 쌓아가며 다음 방향을 조금씩 또렷하게 만드는 컴퍼스.",
    ogTitle: "Lompass",
    ogDescription:
      "방향이 또렷해지는 일상의 컴퍼스 — 매일의 대화로 다음 걸음을 찾아요.",
  },
} as const;
