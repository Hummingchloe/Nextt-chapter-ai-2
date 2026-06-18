import { NextResponse } from "next/server";
import { normalizeOntology } from "@/lib/ontology";
import { generateProposalWithAI } from "@/lib/proposal-ai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 35;

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const ontology = normalizeOntology(readObject(body, "ontology"));
  if (ontology.compass.alignment < 50) {
    return NextResponse.json(
      {
        error: "alignment_below_threshold",
        alignment: ontology.compass.alignment,
      },
      { status: 409 },
    );
  }

  const result = await generateProposalWithAI(ontology);
  return NextResponse.json({
    ...result,
    persistence: "local-first-no-server-write",
  });
}

function readObject(body: unknown, key: string): Record<string, unknown> | null {
  if (!body || typeof body !== "object") return null;
  const value = (body as Record<string, unknown>)[key];
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
}
