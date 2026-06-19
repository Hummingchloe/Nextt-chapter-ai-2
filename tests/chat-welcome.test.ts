import assert from "node:assert/strict";
import test from "node:test";
import { CHAT_STARTERS, resolveChatWelcome } from "../lib/chat-welcome.ts";

const NOW = new Date(2026, 5, 20, 8);

test("onboarding entry gets a one-time welcome without an API dependency", () => {
  const welcome = resolveChatWelcome({
    entry: "onboarding",
    onboardingSeen: false,
    lastVisitAt: null,
    now: NOW,
    status: "listening",
  });

  assert.equal(welcome?.kind, "onboarding");
  assert.match(welcome?.text ?? "", /첫 방향/);
  assert.equal(
    resolveChatWelcome({
      entry: "onboarding",
      onboardingSeen: true,
      lastVisitAt: null,
      now: NOW,
      status: "listening",
    }),
    null,
  );
});

test("returning welcome appears on a later local day but not twice in one day", () => {
  const returning = resolveChatWelcome({
    entry: null,
    onboardingSeen: false,
    lastVisitAt: new Date(2026, 5, 19, 20).toISOString(),
    now: NOW,
    status: "confirming",
  });
  assert.equal(returning?.kind, "returning");
  assert.match(returning?.text ?? "", /다시 만나/);

  assert.equal(
    resolveChatWelcome({
      entry: null,
      onboardingSeen: false,
      lastVisitAt: new Date(2026, 5, 20, 7).toISOString(),
      now: NOW,
      status: "confirming",
    }),
    null,
  );
});

test("routine starters stay concise on mobile", () => {
  assert.equal(CHAT_STARTERS.length, 4);
  assert.ok(CHAT_STARTERS.some((item) => item.includes("기분")));
  assert.ok(CHAT_STARTERS.some((item) => item.includes("고객")));
  assert.ok(CHAT_STARTERS.some((item) => item.includes("내일")));
});
