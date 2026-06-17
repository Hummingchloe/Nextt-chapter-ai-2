# My Next Chapter AI — 서비스 구조 & 기획 정리

> 라이브: https://nextt-chapter-ai-2.vercel.app · 깃헙: Hummingchloe/Nextt-chapter-ai-2
> 한 줄: "다시 시작하려는 사람(초기·예비 창업자·이민자 엄마 등)이 **입력할수록 방향·오퍼·
> 네트워크·학습 로드맵이 선명해지는** Personal Founder Compass." (무인증 웹앱)

## 1. 기술 스택 / 인프라
- **Next.js 15 (App Router) + React 19 + TypeScript + Tailwind v4**
- **DB: Neon Postgres**(JSONB) — `postgres`(postgres.js). 듀얼 스토어: `DATABASE_URL` 있으면 PG,
  없으면 로컬 파일(`lib/store.ts`가 자동 선택).
- **AI: Claude API**(claude-sonnet-4-6) — 선택적 보강. **키 없어도 결정론적으로 완전 동작.**
- **배포: Vercel**(`vercel.json`이 framework=nextjs 강제). `git push origin main` → 자동 재배포.
- **무인증**: 익명 세션, 브라우저(localStorage) 기억(`lib/session-client.ts`).
- 폰트 Pretendard+고운바탕, 따뜻한 팔레트(`app/globals.css`).

## 2. 설계 철학
결정론적 baseline + 선택적 AI · 따뜻함(비-생산성앱) · 무죄책(복귀 중심) · 작게 시작 · 모바일 우선 ·
"입력할수록 또렷해짐(컴퍼스)".

## 3. 사용자 루프 (제품 본체)
진단 → 첫 리포트 → Today's Next Step → Daily Note → AI Reflection → 주/월/분기 회고 → 로드맵
(+ Expert Lens가 막힘마다 보조, 컴퍼스가 누적 갱신).

## 4. 화면(라우트)
| 경로 | 역할 |
|---|---|
| `/` | 랜딩 (타겟: 초기 창업자 전반) |
| `/start` | 시작 + 🧪 페르소나 빠른체험(테스트) + 프라이버시 카피 |
| `/diagnostic` | 14문항 진단 + 테스트바(예시 채우기) |
| `/result/[id]` | 첫 코칭 리포트 8섹션 + **전문가 렌즈** |
| `/home/[id]` | 대시보드: 내 컴퍼스·오늘의 추천·오늘 행동·전문가 렌즈·추천칩·성장 로드맵·선명도/레벨/XP·최근 한 줄·주간 CTA·흔적 미리보기 |
| `/next/[id]` | 노트 홈(Today step + 기록 + 서브탭) |
| `/next/[id]/note` | Daily Note 작성 → AI Reflection + 선명도/XP 축하 |
| `/next/[id]/calendar` | 흔적 캘린더(날짜 클릭 모달) |
| `/next/[id]/timeline` | 성장 타임라인(전환점 서사) |
| `/next/[id]/week` | 주/월/분기 회고(기간 탭) |
| `/reports` | 진단 리포트 모아보기(여러 세션) |
| `/admin` | 내부 관리자(완료율·방향분포·이탈·노트·점수) ⚠️무인증 |
| 하단 탭바 | 홈·진단·리포트·노트·주간 |
| API | session·response·complete·note·week·event·admin·health |

## 5. lib 모듈(로직)
- `questions.ts`(14문항)·`directions.ts`(8방향)·`engine.ts`(규칙기반 분류·채점)
- `report.ts`(결정론적 리포트: 요약·강점·방향3·1순위·오퍼·채널·첫행동·닫는말·공부/사람/도구)
- `ai.ts`(Claude 보강+fallback)·`reflection.ts`(일일/주·월·분기 회고)·`note.ts`
- `momentum.ts`(복귀형 지표)·`progress.ts`(선명도 clarity + XP/레벨/스트릭)
- `compass-summary.ts`(내 컴퍼스 + 로드맵 + 오늘의 추천)·`timeline.ts`·`expert-lens.ts`
- `personas.ts`(6 테스트 페르소나, `TEST_TOOLS_ENABLED`)
- `store.ts`/`store-pg.ts`/`store-file.ts`/`db-url.ts`·`session-client.ts`·`track.ts`

## 6. 데이터 모델
- `sessions(jsonb)`: DiagnosticSession {id,name?,answers,recommendation,report,notes[],status,…}
- `events(jsonb)`: 분석 이벤트. notes는 session.notes[]에 임베드.
- 파생값(momentum·clarity·xp·compass·lens·timeline·roadmap)은 **저장 안 하고 매 요청 계산**.

## 7. 구현 완료 (회의·v3·전략문서 반영)
Self Awareness 진단 · 첫 리포트 · Today's Next Step · Daily Note + Reflection · 주/월/분기 회고 ·
모멘텀(캘린더·타임라인·복귀 스트릭) · 컴퍼스 선명도 + XP/레벨 게임화 · 오늘의 추천 ·
추천 확장(공부·사람·도구) · **Expert Lens v0** · 프라이버시 카피 · 타겟 확장 · 테스트 도구 · 관리자.

## 8. 미구현(보류 — 외부 키·인프라·승인 필요)
- **EX-A 실제 자료 추천**(YouTube Data API·웹 검색 키) — 파이프라인 설계만 됨
- **LinkedIn 공식 API**(파트너 승인) — MVP는 "URL 붙여넣기+아웃리치 초안"만
- **메신저/음성 입력**(텔레그램·Whisper)·진짜 컴퍼스 벡터(EN2)·정렬충돌(EN4)
- 익명 연대(G)·데이터 수익화·Expert 마켓플레이스·코호트·인증/결제

## 9. 운영 메모
- 환경변수: `DATABASE_URL`(필수), `ANTHROPIC_API_KEY`(선택)
- 출시 전 정리 필요: `TEST_TOOLS_ENABLED=false`(테스트 도구 숨김), `/admin` 접근 보호
