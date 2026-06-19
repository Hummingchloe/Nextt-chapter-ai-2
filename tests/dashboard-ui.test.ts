import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("action notes stay free-form and Compass sources are explained", () => {
  const dashboard = readFileSync("app/dashboard/page.tsx", "utf8");
  const compass = readFileSync("app/components/BeadCompass.tsx", "utf8");

  assert.match(dashboard, /실행 결과를 짧게 남겨주세요/);
  assert.doesNotMatch(dashboard, /\["보냈어요", "만났어요", "작성했어요"\]/);
  assert.match(compass, /대화와 메모에서 발견한 경험·강점 신호/);
  assert.match(compass, /시장 조사와 고객 반응에서 확인된 수요 신호/);
  assert.match(compass, /직접 실행하고 남긴 결과에서 생긴 행동 신호/);
  assert.match(compass, /group-focus-within:opacity-100/);
});
