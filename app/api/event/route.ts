import { NextResponse } from "next/server";
import { logEvent } from "@/lib/store";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body?.type) {
    return NextResponse.json({ error: "missing type" }, { status: 400 });
  }
  await logEvent({
    id: `e_${Date.now()}_${Math.round(Math.random() * 1e6)}`,
    sessionId: body.sessionId,
    type: String(body.type),
    meta: body.meta && typeof body.meta === "object" ? body.meta : undefined,
    at: new Date().toISOString(),
  });
  return NextResponse.json({ ok: true });
}
