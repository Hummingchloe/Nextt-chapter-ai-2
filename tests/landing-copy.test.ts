import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("landing copy stays concise and matches the actual first-time journey", () => {
  const page = readFileSync("app/page.tsx", "utf8");

  assert.match(page, /흩어진 매일이/);
  assert.match(page, /한 방향으로 모이는 순간/);
  assert.match(page, /내 경험에서, 다음 한 걸음을 찾습니다/);
  assert.match(page, /짧게 답합니다/);
  assert.match(page, /첫 방향을 확인합니다/);
  assert.match(page, /기록하며 좁혀갑니다/);
  assert.match(page, /이후에는, 하루 한 줄이면 충분합니다/);
  assert.match(page, /오늘의 기록이/);

  assert.doesNotMatch(page, /긴 질문지가 없어요/);
  assert.doesNotMatch(page, /한 줄 적고 시작하기/);
  assert.doesNotMatch(page, /누구를 위한 서비스인가요/);
  assert.doesNotMatch(page, /추천 콘텐츠와 기록 로그/);
  assert.doesNotMatch(page, /막연함 대신, 살아있는 상태판/);
  assert.doesNotMatch(page, /다음 방향을 함께 묻는 일상의 컴퍼스/);
});
