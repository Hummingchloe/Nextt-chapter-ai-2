# Product Testing Contract

이 문서는 My Next Chapter 제품에서 테스트가 보장해야 하는 기능 계약이다.

## 원칙

테스트는 “통과하기 위한 테스트”가 아니라 제품 목적을 고정한다.
새 기능은 아래 계약을 깨지 않아야 merge 가능하다.

## 제품 목적

My Next Chapter는 사용자의 과거/현재 맥락에서 방향성을 추출하고, 그 방향이 충분히 선명해졌을 때 Offer Direction과 작은 검증 행동으로 번역하는 코칭 제품이다.

## 테스트가 보장하는 것

### 1. Recommendation / Report

- 모든 샘플 페르소나는 진단 답변에서 자산, 사용자 유형, 방향 후보 3개, 1순위 방향까지 도달해야 한다.
- 리포트는 “지금의 당신”으로 시작해 사용자가 “나를 아네”라고 느끼게 해야 한다.
- 리포트는 강점 3개 이상, 첫 오퍼 초안, 첫 손님 채널, 이번 주 첫 행동을 제공해야 한다.
- 성공/시장성을 단정하지 않는다.

### 2. Compass

- Compass는 기존 추천을 대체하지 않고 확장해야 한다.
- 충분한 맥락이 있으면 H confidence, M alignment, clarity, offer readiness가 계산되어야 한다.
- 맥락이 부족하면 강한 추천을 하지 않고 adaptive question을 내야 한다.

### 3. Daily Note / Momentum

- Daily Note는 일기가 아니라 다음 행동을 이어주는 코칭 루프다.
- 어제의 nextStep이 오늘의 행동으로 이어져야 한다.
- Momentum은 죄책감 없는 방식으로 “다시 돌아옴”을 보상해야 한다.
- 고객의 말과 insight는 단순 출석보다 clarity/XP를 더 올려야 한다.

### 4. Timeline / Expert Lens

- Timeline은 raw log가 아니라 성장 스토리를 보여줘야 한다.
- 진단 완료, 방향 선택, 첫 행동, 고객의 말, 다시 돌아온 날 같은 의미 있는 사건만 드러내야 한다.
- Expert Lens는 blocker별 관점을 제공하되, 가짜 링크를 만들지 않고 honest search hints만 제공해야 한다.

### 5. Integration Flow

아래 3개 데모 페르소나는 end-to-end로 자연스럽게 돌아야 한다.

- AI 업무화 1인 사업자
- 아이 금융교육/클래스형 오퍼
- 커리어 전환 코칭

각 플로우는 다음을 만족해야 한다.

- 결과에서 “나를 아네”가 먼저 온다.
- 오퍼 초안이 실제 사람에게 보여줄 수 있을 만큼 구체적이다.
- 다음 행동이 어제 기록 또는 리포트와 연결된다.
- 과장된 성공 보장을 하지 않는다.

## Merge Gate

로컬 및 CI에서 아래 명령이 모두 통과해야 merge 가능하다.

```bash
npm test
npm run build
```

통합 명령:

```bash
npm run ci
```

## 새 기능 추가 시 규칙

새 기능이 다음 중 하나를 바꾸면 테스트도 함께 추가/수정해야 한다.

- 진단 질문 또는 추천 엔진
- 리포트 구조 또는 문장 톤
- Compass / Offer readiness / Market Check
- Daily Note / Momentum / Timeline
- 데모 페르소나 플로우

테스트를 삭제하거나 약화하는 변경은 제품 목적 변경으로 간주하고 팀 합의가 필요하다.
