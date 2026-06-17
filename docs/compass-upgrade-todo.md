# Compass Upgrade 이후 Product TODO

작성 시점: 2026-06-17
기준: `identity-compass-engine` product-local TDD 업그레이드 후 현재 제품 상태

## 우리가 맞춰야 할 제품 방향

**My Next Chapter는 질문지 앱이 아니라, 사용자의 과거/현재 맥락에서 방향성을 추출하고 그 방향성이 충분히 선명해졌을 때 Offer Direction으로 번역하는 코칭 제품이다.**

따라서 우선순위는 다음 순서다.

1. 사용자의 맥락을 안전하게 가져온다.
2. 원문이 아니라 decision/emotion/pattern 신호를 추출한다.
3. 신호를 H 방향성, M 정렬도, confidence로 누적한다.
4. confidence가 낮으면 더 묻고, 높으면 Offer Direction을 추천한다.
5. 추천된 오퍼를 실제 행동/고객 접점으로 검증한다.

이 방향에 직접 연결되지 않는 기능은 P1/P2로 뒤로 미룬다.

---

## 현재 구현 완료

- Product-local `lib/identity-compass-engine.ts` 추가.
- 기존 로컬 compass/vault는 건드리지 않고 `ico1036/identity-compass` 방법론을 제품용 TS 엔진으로 재설계.
- decision / emotion / pattern 신호 추출.
- 3축 H direction: autonomy / depth / innovation.
- H confidence, M alignment, clarity 산출.
- Offer readiness: `not_ready` / `explore` / `recommend`.
- confidence가 낮을 때 adaptive question 생성.
- 기존 `buildCompass()`와 Home dashboard에 연결.
- TDD 테스트 추가: `tests/identity-compass-engine.test.ts`.
- Gate 통과: `npm test`, `npm run build`.

---

## P0 TODO — 팀 방향성 정렬용

### 1. Product North Star 확정

**질문**: 우리는 이 제품을 “진단 결과 추천 앱”이 아니라 “맥락 기반 방향성 → Offer Direction 코칭 제품”으로 합의하는가?

결정 필요:
- 첫 데모에서 반드시 보여줄 핵심 순간 1개.
- “나를 안다”와 “오퍼를 만든다” 중 어느 순간을 더 앞에 둘지.
- confidence가 낮을 때 추천을 참는 UX를 제품 철학으로 받아들일지.

### 2. Context-first Input UX

현재는 14문항 진단이 중심이다. 다음 단계는 사용자가 기존 자료를 가져오거나 자유 입력을 붙여넣는 흐름이다.

범위:
- 일기/메모/블로그/노션 텍스트 paste.
- 질문지 fallback 유지.
- 입력 후 “우리는 원문이 아니라 신호만 추출한다”를 명확히 보여주기.

### 3. Privacy & Raw Text Disposal UX

범위:
- 원문 미저장/폐기 안내.
- 추출된 신호 preview.
- 사용자가 저장할 신호를 확인/삭제할 수 있는 UI.

중요성:
- 이 제품의 신뢰 기반.
- 팀 내 모든 표현과 기능 우선순위가 이 원칙을 따라야 함.

### 4. Compass Evidence Panel

현재 Home에는 H 신뢰도/M 정렬도/Offer 준비도를 작게 노출한다. 다음은 사용자가 “왜 이런 결론이 나왔는지” 볼 수 있게 하는 것이다.

범위:
- decision / emotion / pattern 신호 카드.
- core values / anti values.
- confidence를 높이기 위해 필요한 다음 질문.

### 5. Offer Direction Validation Loop

현재 offer readiness와 질문은 생겼지만, 실제 시장 검증 루프는 약하다.

범위:
- readiness가 `recommend`일 때만 오퍼 초안 강화.
- `explore`일 때는 고객 한 명/문장 하나/행동 하나로 좁히기.
- Daily Note의 customer voice가 Offer confidence를 올리는 구조 명확화.

---

## P1로 미룰 것

- 완전한 외부 전문가 추천/검색 자동화.
- 복잡한 시각화/3D Compass.
- 많은 페르소나/세그먼트 확장.
- 커뮤니티/매칭 기능.
- 고급 리포트 PDF/공유 기능.

이유: 지금은 “제품이 무엇을 선명하게 해주는가”가 먼저다. 기능을 늘리면 팀 방향성이 흐려질 수 있다.

---

## 팀 피드백 요청

각자 아래 3개에만 답해주면 다음 우선순위를 정할 수 있다.

1. 위 North Star 문장에 동의하는가? 아니라면 어떤 문장이어야 하는가?
2. 첫 데모에서 사용자가 반드시 느껴야 하는 한 문장은 무엇인가?
3. P0 중 빼야 하거나 P1로 내려야 하는 것이 있는가?
