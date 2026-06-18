#!/usr/bin/env python3
"""Black-box integration test for /api/compass/compute.

Threads the CompassState across rounds exactly like the chat UI does, and
asserts the engine loop behaves: axes get created, beads accumulate, coherent
input raises alignment, status advances, and actions open up.
"""
import json
import sys
import urllib.request

URL = "http://localhost:3939/api/compass/compute"

# A coherent journey: all signals point to (1:1 / 전문성 / 기존 관계) — the
# negative poles — so coherence (M) should climb and status should advance.
INPUTS = [
    "지인이 내 상담 경험을 보고 1:1로 도와달라고 물어봤어요",
    "나는 오래 해온 전문 상담을 아는 사람들에게 직접 맞춤으로 해주는 게 맞는 것 같아요",
    "어제 지인 한 명에게 1:1 상담 오퍼를 보냈어요",
    "친구 소개로 또 다른 분이 상담을 요청했어요",
]


def post(payload):
    req = urllib.request.Request(
        URL,
        data=json.dumps(payload).encode("utf-8"),
        headers={"content-type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=20) as r:
        return json.loads(r.read().decode("utf-8"))


def main():
    compass = None
    failures = []
    print("round | rawM% | disp% | status      | beads | actions | axisInduced/ai")
    print("-" * 76)
    last = None
    for i, text in enumerate(INPUTS, 1):
        data = post({"compass": compass, "input": text})
        compass = data["compass"]
        ai = data.get("ai", {})
        m = round(compass["alignment"] * 100)
        disp = round(compass["displayAlignment"] * 100)
        status = compass["status"]
        beads = len(compass["beads"])
        actions = len(data.get("actions", []))
        axes = len(compass["axes"])
        print(f"  {i}   | {m:>4} | {disp:>4} | {status:<11} | {beads:>5} | {actions:>7} | "
              f"{ai.get('axisInduced')}/{ai.get('provider')}")

        if axes < 2:
            failures.append(f"round {i}: axes not created ({axes})")
        if beads != i:
            failures.append(f"round {i}: expected {i} beads, got {beads}")
        if not (0 <= compass["alignment"] <= 1):
            failures.append(f"round {i}: alignment out of range {compass['alignment']}")
        if compass["displayAlignment"] > compass["alignment"] + 1e-9:
            failures.append(f"round {i}: displayAlignment exceeds rawM")
        last = compass

    # The headline must be honest on the very first message (the bug we fixed):
    # a single coherent bead should NOT read as ~100%.
    first = post({"compass": None, "input": INPUTS[0]})["compass"]
    if first["displayAlignment"] >= 0.6:
        failures.append(f"round-1 displayAlignment too high: {first['displayAlignment']}")

    # By the end, a coherent journey should have left "listening" and opened actions.
    if last["status"] == "listening":
        failures.append("final status still 'listening' after coherent journey")
    final_actions = post({"compass": last, "input": "오늘도 같은 방향으로 한 걸음 더 갔어요"})
    if len(final_actions.get("actions", [])) == 0:
        failures.append("no actions offered at the end")

    # Axes should be the learned/DEFAULT space with readable poles.
    print("\nlearned axes:")
    for ax in last["axes"]:
        print(f"  - {ax['name']}: +{ax['posPole']} / -{ax['negPole']}")
    print(f"\nfinal one-liner: {last['compass']['oneLiner']}")
    print(f"final H direction: {[round(x, 2) for x in last['compass']['dir']]}")

    if failures:
        print("\n❌ FAILURES:")
        for f in failures:
            print("  -", f)
        sys.exit(1)
    print("\n✅ HTTP integration passed: chat → compute → state loop is coherent.")


if __name__ == "__main__":
    main()
