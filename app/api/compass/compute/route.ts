import { NextResponse } from "next/server";
import { normalizeOntology, updateOntologyFromInput } from "@/lib/ontology";
import { buildProposalDashboard } from "@/lib/proposal";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const input = readString(body, "input").trim();
  if (!input) {
    return NextResponse.json({ error: "missing input" }, { status: 400 });
  }
  if (input.length > 4000) {
    return NextResponse.json({ error: "input too long" }, { status: 413 });
  }

  const current = normalizeOntology(readObject(body, "ontology"));
  const result = updateOntologyFromInput(current, input);
  const dashboard = buildProposalDashboard(result.ontology);

  return NextResponse.json({
    ontology: result.ontology,
    assistantMessage: result.assistantMessage,
    dashboard,
    persistence: "local-first-no-server-write",
  });
}

function readString(body: unknown, key: string): string {
  if (!body || typeof body !== "object") return "";
  const value = (body as Record<string, unknown>)[key];
  return typeof value === "string" ? value : "";
}

function readObject(body: unknown, key: string): Record<string, unknown> | null {
  if (!body || typeof body !== "object") return null;
  const value = (body as Record<string, unknown>)[key];
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
}
