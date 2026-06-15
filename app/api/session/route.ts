import { NextResponse } from "next/server";
import { createSession } from "@/lib/store";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const id =
    typeof globalThis.crypto?.randomUUID === "function"
      ? globalThis.crypto.randomUUID()
      : `s_${Date.now()}_${Math.round(Math.random() * 1e6)}`;

  const session = await createSession({
    id,
    locale: "ko-KR",
    device: body?.device === "mobile" ? "mobile" : "desktop",
    name: typeof body?.name === "string" ? body.name : undefined,
  });

  return NextResponse.json({ sessionId: session.id });
}
