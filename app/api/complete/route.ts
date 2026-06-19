import { NextResponse } from "next/server";
import { runRecommendation } from "@/lib/engine";
import { buildReport } from "@/lib/report";
import { warmUpReport } from "@/lib/ai";
import { researchMarket } from "@/lib/market-research";
import { getSession, logEvent, updateSession, saveAnswer } from "@/lib/store";
import type { QuestionResponseMap } from "@/lib/types";

export const runtime = "nodejs";
// Engine + deterministic report are instant; this headroom is for the
// optional Claude warm-up call (Pro plan honors up to this; Hobby caps ~10s).
export const maxDuration = 30;

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const sessionId: string | undefined = body?.sessionId;
  if (!sessionId) {
    return NextResponse.json({ error: "missing sessionId" }, { status: 400 });
  }

  const session = await getSession(sessionId);
  if (!session) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  // Merge any answers passed in this request (defensive against lost writes).
  const incoming: QuestionResponseMap = body?.answers ?? {};
  for (const [k, v] of Object.entries(incoming)) {
    if (session.answers[k] === undefined) {
      await saveAnswer(sessionId, k, String(v ?? ""));
    }
  }
  const fresh = (await getSession(sessionId))!;
  const answers: QuestionResponseMap = { ...incoming, ...fresh.answers };

  // 1) Rule-based recommendation (deterministic, source of truth)
  const recommendation = runRecommendation(answers);

  // 2) Deterministic report, optional two-search market research, then warm-up.
  // Every external step fails closed: the report still completes and weak
  // market evidence is explicitly marked as insufficient.
  const baseReport = buildReport(answers, recommendation);
  const researchedReport = await researchMarket(
    baseReport,
    answers,
    recommendation,
  );
  const report = await warmUpReport(researchedReport, answers);

  const startedMs = new Date(session.startedAt).getTime();
  const completionTimeSeconds = Math.max(
    0,
    Math.round((Date.now() - startedMs) / 1000),
  );

  await updateSession(sessionId, {
    status: "completed",
    completedAt: new Date().toISOString(),
    completionTimeSeconds,
    predictedUserType: recommendation.primaryUserType,
    topRecommendedDirection: recommendation.topDirection.label,
    recommendation,
    report,
    name: typeof body?.name === "string" && body.name ? body.name : session.name,
    email: typeof body?.email === "string" && body.email ? body.email : session.email,
  });

  await logEvent({
    id: `e_${Date.now()}_${Math.round(Math.random() * 1e6)}`,
    sessionId,
    type: "diagnostic_completed",
    meta: {
      topDirection: recommendation.topDirection.label,
      userType: recommendation.primaryUserType,
      completionTimeSeconds,
    },
    at: new Date().toISOString(),
  });

  return NextResponse.json({ sessionId, recommendation, report });
}
