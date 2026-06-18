# My Next Chapter · Compass

A local-first web app that helps someone restarting their work life find **one
direction**. You just talk; the app turns your words into small directional
signals ("beads"), measures whether they're **converging** (alignment **M**),
names the emerging direction **H** as a single compressed sentence, and opens
**next actions** + **recommended content** once a direction forms.

> Product copy/UI is Korean. Code, comments, and this README are English.
> Live: https://nextt-chapter-ai-2.vercel.app · auto-deploys from `main` (Vercel).

---

## 🤖 If you are an AI continuing this work, read this first

1. **There are TWO generations of code in `lib/`.** Only the **`compass-*`**
   modules + the 4 `app/api/compass/*` routes + `/chat` `/dashboard` +
   `BeadCompass.tsx` are **LIVE**. Everything else (the diagnostic/questionnaire
   MVP1 — `store*.ts`, `engine.ts`, `identity-compass-engine.ts`, `ontology.ts`,
   `proposal*.ts`, `compass-ai.ts`, the `/start /diagnostic /result /admin`
   pages, the `/api/{session,response,…}` routes) is **LEGACY / orphaned** —
   it still builds and its tests still run, but nothing in the current UI links
   to it. Don't extend it; don't be confused by it.
2. **The architecture is split into a pure logic half and a view half** (see
   below). This is deliberate: you can change the math without touching the UI,
   and vice-versa, with minimal interference. Keep it that way.
3. **Invariants** (don't break — see [Invariants](#invariants-keep-these)):
   math is pure/deterministic and lives only in `compass-engine.ts`; the LLM
   only does extraction/induction/essence/coach-reply, never the math; IndexedDB
   is the source of truth and API routes are stateless; **never chain >1 LLM
   call in one request** (Vercel timeout — split into deferred endpoints).
4. **Run it:** `npm install && npm test && npm run dev`. Tests are the spec.

---

## Architecture: logic ↔ view separation (the point)

Every module belongs to exactly one **register**, and each register is only
allowed to import "downward". This is what lets logic and view evolve
independently without interfering.

| Register | Files | May import | May NOT import | Runs on |
|---|---|---|---|---|
| **Pure logic** (domain core) | `compass-engine.ts`, `compass-actions.ts`, `compass-fallback.ts`, `compass-content.ts`, `compass-seed.ts` | nothing but each other | React, DOM, storage, LLM, `Date.now`/`Math.random` | client **or** server (isomorphic) |
| **Intelligence** (LLM) | `compass-extract.ts`, `compass-reply.ts` (`"server-only"`) | pure logic, `ai-env.ts`, `fetch` | React, DOM, storage | server only |
| **Storage** | `local-ontology-store.ts` (`"use client"`) | pure logic (types) | React, LLM | browser (IndexedDB) |
| **Controller** (HTTP) | `app/api/compass/{compute,reply,essence,content}/route.ts` | pure logic + intelligence | React, DOM | server (stateless) |
| **View** (presentational) | `app/components/BeadCompass.tsx` | pure logic (types + pure fns like `cosine`) | storage, LLM, `fetch` | browser |
| **Container** (pages) | `app/chat/page.tsx`, `app/dashboard/page.tsx` | everything above | — | browser |

**Why this matters for you:** the entire "hard" part — magnetization, Bayesian
posteriors, decay, ΔM simulation, action derivation, content theming — is pure
functions with **zero** React/DOM/LLM/storage dependencies. So it is fully unit-
tested, runs identically in the browser or a serverless function, and you can
refactor the math or the UI in isolation. The only place the two meet is the
thin container pages.

---

## Data flow (one chat turn)

```
user types ──▶ chat/page.tsx send()
   │  fires TWO requests in parallel (never chained):
   ├─▶ POST /api/compass/compute  {compass, input}
   │       induceAxes (first msg only) → extractBeads (LLM, or heuristic if no key)
   │       → addBeads → recompute(M, posteriors, decay, status)
   │       → returns CompassState                ── updates the compass CARD
   │       client: saveCompassState (IndexedDB)  ── source of truth
   │       client: deferred POST /essence        ── fills WorkCompass.essence (the H sentence)
   └─▶ POST /api/compass/reply    {compass, input, history}
           generateCoachReply (LLM)              ── fills the chat BUBBLE (typing dots → text)
                                                    NO numbers in the bubble; human-ack fallback

dashboard/page.tsx ── reads same IndexedDB ──▶ compass card · actions (ΔM) ·
   completion (moves needle, marks done) · deferred /content (real YouTube search, validated)
```

Server routes store nothing. The browser's IndexedDB (`local-ontology-store.ts`,
key `compass-v2`) is the single source of truth. The split into `compute` /
`reply` / `essence` / `content` endpoints exists so no single request chains
multiple LLM calls (that previously caused Vercel timeouts).

---

## Core concepts (`lib/compass-engine.ts`)

- **Bead** — one decision/value/market/action signal as a vector. `direction:
  number[]` (one component per axis, each in `[-1,1]`), plus `intensity`,
  `confidence`, `weight (1-10)`, `source: "record" | "market" | "action"`.
- **M (magnetization / 정렬도)** — `alignment`, the resultant length of the
  weighted unit directions over total mass, `0..1`. 1 = beads all point the same
  way (coherent), 0 = they cancel out (dispersed). **It measures coherence, not
  volume.** `displayAlignment` shrinks M toward 0 when evidence is thin (honest
  headline %).
- **H (WorkCompass)** — the consensus direction (`compass.dir`) plus per-axis
  Bayesian `Beta(α,β)` posteriors and a **one-sentence `essence`** (see below).
- **Axes** — the coordinate basis, **learned by the LLM** from the user's first
  message (`induceAxes`), not a fixed template. Falls back to `DEFAULT_AXES`
  without a key. Learned once, then stable (re-induction is a TODO).
- **Status** — `listening → narrowing → confirming → executing`, from M ×
  evidence. Gates actions/content.
- **Actions** — candidates with an expected `ΔM` (`compass-actions.ts`).
  Completing one registers a real `source:"action"` bead → **moves the needle**
  and is recorded in `doneActions`.
- **Convergence viz** (`BeadCompass.tsx`) — axis-free. Each ball's height =
  its cosine alignment to H; aligned balls rise into the needle tip, divergent
  ones fan out. You *see* convergence. H's meaning is the essence sentence.

### The essence sentence (important product rule)
H is compressed into **one sentence**, like a latent-space compression that
raises abstraction. It must be a **"~하는 사람 / ~하는 자"** phrasing that
abstracts **across** the person's scattered interests — **never a job-title
noun**. Example: a florist-and-tailor dreamer → *"누군가만을 위한 특별한 순간을
디자인해주는 자"*. Encoded in `synthesizeEssence` (`compass-extract.ts`).
Stored in `WorkCompass.essence`, which **persists across `recompute`** (the
templated `oneLiner` is the no-key fallback and is overwritten every recompute).

---

## File map (LIVE)

**Pure logic**
- `lib/compass-engine.ts` — types + all math (M, posteriors, decay, simulate, recompute, addBeads, status). The heart.
- `lib/compass-actions.ts` — `deriveActions` / `activeActions` / `completeAction` / `actionToBead`.
- `lib/compass-content.ts` — `deriveContent` (YouTube links from bead tags / axis poles) + `contentTheme`.
- `lib/compass-fallback.ts` — `extractBeadsHeuristic` (keyword→bead, used when no API key).
- `lib/compass-seed.ts` — `seedCompass` for the "🧪 테스트 먹이기" button (real beads through the engine).

**Intelligence (server-only, LLM)**
- `lib/compass-extract.ts` — `extractBeads` (structured tool_use), `induceAxes`, `synthesizeEssence`, `searchYoutubeContent` (web_search, youtube-only, max_uses 1, URLs validated from `web_search_tool_result`), `DEFAULT_AXES`.
- `lib/compass-reply.ts` — `generateCoachReply` (the natural chat coach).
- `lib/ai-env.ts` — `anthropicApiKey()` (`ANTHROPIC_API_KEY` || `CLAUDE_API_KEY`), `anthropicModel()`.

**Storage** — `lib/local-ontology-store.ts` → `loadCompassState` / `saveCompassState` / `resetCompassState` (IndexedDB key `compass-v2`). *(The `loadLocalOntology` funcs in the same file are legacy.)*

**Routes** — `app/api/compass/compute|reply|essence|content/route.ts` (all stateless, `maxDuration = 30`).

**View** — `app/chat/page.tsx`, `app/dashboard/page.tsx`, `app/components/BeadCompass.tsx`; landing `app/page.tsx` (CTAs → `/chat`); `app/components/AppTabBar.tsx` (채팅/대시보드).

**Tests** (run via `tsx --test`) — `tests/compass-engine.test.ts`, `compass-wiring.test.ts`, `compass-integration.test.ts`, `compass-seed.test.ts`. HTTP black-box driver: `scripts/compass-itest.py`.

> **LEGACY (do not extend):** `lib/{store,store-pg,store-file,db-url,engine,identity-compass-engine,ontology,proposal,proposal-ai,compass-ai,compass-summary,context-signals,directions,expert-lens,market-check,momentum,note,personas,progress,questions,reflection,report,session-client,timeline,track,types,ai}.ts`; pages `/start /diagnostic /result /reports /home /next /admin`; routes `/api/{session,response,complete,week,note,event,admin,health}`; tests `identity-compass-engine`, `integration-flow`, `local-first-ontology`, `product-contract`.

---

## Invariants (keep these)

1. **Math lives only in `compass-engine.ts`**, pure and deterministic. No
   `Date.now()` / `Math.random()` — callers pass `now` (ISO string) and ids.
2. **The LLM never does math.** It only: extract beads, induce axes, synthesize
   the essence, write the coach reply. Everything numeric is deterministic.
3. **IndexedDB is the source of truth.** API routes are stateless calculators
   that return data; the client persists it. Don't add server-side storage
   without a deliberate reason (see "deferred").
4. **Never chain >1 LLM call in one HTTP request.** Split into its own deferred
   endpoint and call it in parallel / after, from the client. (Vercel timeout.)
5. **No numbers in the chat conversation.** 정렬도/% live on the compass card,
   never in a chat bubble. The bubble is the coach reply only.
6. **Essence = "~하는 사람/자" abstraction, not a job title.** Persist it in
   `WorkCompass.essence`.
7. **Degrade gracefully without a key:** heuristic extraction, human-ack reply,
   deterministic content. The app must work (less smart) with no
   `ANTHROPIC_API_KEY`.

---

## Run / test / deploy

```bash
npm install
npm test                 # tsx --test tests/*.test.ts  (the spec; keep green)
npm run dev              # http://localhost:3000  → /chat, /dashboard
npm run build            # production build (the real gate; CI = npm run ci)
```

- **No key locally** → app runs on deterministic fallbacks. Set
  `ANTHROPIC_API_KEY` (or `CLAUDE_API_KEY`) to enable the LLM paths.
- **Deploy:** push to `main` → Vercel builds & deploys to production. The key
  is configured in Vercel, so LLM paths are live in prod.
- **Verify the live endpoints fast:** `scripts/compass-itest.py` (point it at
  the prod base URL) threads CompassState across turns and asserts the loop.

---

## Status: done vs deferred

**Done & verified (in-browser + prod):** vector engine + tests; LLM extraction
(structured output); learned axes; convergence visualization; honest
`displayAlignment`; actions with ΔM + done-tracking; YouTube content (real
web_search, validated, with fallback); natural coach reply (parallel, numbers
off chat); essence one-liner ("~하는 사람" abstraction, persisted); endpoint
split to avoid timeouts.

**Deferred (good next steps):**
- **Axis re-induction + bead reprojection** on drift (currently axes are learned
  once on the first message, then frozen).
- **First-message single-call**: it still runs `induceAxes` + `extractBeads`
  sequentially (~14s). Move induction off the hot path (DEFAULT_AXES first, learn
  later) if targeting Hobby-tier 10s limits.
- **`tags` in the bead extraction schema** so live (LLM) content theming is as
  on-topic as the seed's (seed beads carry tags; LLM beads don't yet).
- **Streaming** the coach reply (currently typing-dots → full text).
- **Delete the legacy MVP1 system** once nothing depends on it.
- **Multi-device:** only if needed — would add Postgres as a backup/mirror
  (keep IndexedDB as source of truth; never two-way sync the same field).
