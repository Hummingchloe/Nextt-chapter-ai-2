import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("interactive landing Compass preserves the current copy and onboarding handoff", () => {
  const page = readFileSync("app/page.tsx", "utf8");
  const hero = readFileSync("app/components/InteractiveCompassHero.tsx", "utf8");
  const startButton = readFileSync("app/components/OnboardingStartButton.tsx", "utf8");
  const styles = readFileSync("app/globals.css", "utf8");

  assert.match(page, /흩어진 매일이/);
  assert.match(page, /한 방향으로 모이는 순간/);
  assert.match(page, /기록이 쌓일수록, 나의 경험과 강점이/);
  assert.match(page, /내 방향 찾아보기/);
  assert.match(page, /InteractiveCompassHero/);
  assert.doesNotMatch(page, /완벽한 답보다, 작은 방향|다독임이 아니라 좌표를 드려요/);

  assert.match(startButton, /fetch\("\/api\/session"/);
  assert.match(startButton, /router\.push\(`\/diagnostic\?sid=/);
  assert.doesNotMatch(startButton, /router\.push\("\/chat"\)/);

  assert.match(hero, /requestAnimationFrame/);
  assert.match(hero, /event\.pointerType !== "mouse"/);
  assert.doesNotMatch(hero, /Math\.random/);
  assert.match(styles, /prefers-reduced-motion: reduce/);
  assert.match(styles, /compass-bead-gather/);
});
