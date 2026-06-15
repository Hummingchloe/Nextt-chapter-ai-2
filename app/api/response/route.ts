import { NextResponse } from "next/server";
import { saveAnswer } from "@/lib/store";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body?.sessionId || typeof body.key !== "string") {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }
  await saveAnswer(body.sessionId, body.key, String(body.value ?? ""));
  return NextResponse.json({ ok: true });
}
