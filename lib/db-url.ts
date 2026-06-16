// ─────────────────────────────────────────────────────────────
// Resolve a Postgres connection string from the environment.
// Robust to how different hosts name the variable:
//   • Neon integration      → DATABASE_URL (+ *_UNPOOLED)
//   • Vercel Postgres        → POSTGRES_URL (+ *_NON_POOLING, _PRISMA_URL)
//   • anything else          → first env value that looks like a pg URL
// Prefers a pooled endpoint (best for serverless).
// ─────────────────────────────────────────────────────────────

const KNOWN_VARS = [
  "DATABASE_URL",
  "POSTGRES_URL",
  "POSTGRES_PRISMA_URL",
  "DATABASE_URL_UNPOOLED",
  "POSTGRES_URL_NON_POOLING",
  "POSTGRES_URL_NO_SSL",
];

const PG_URL = /^postgres(ql)?:\/\//i;

export function resolveDbUrl(): string {
  const found: string[] = [];
  for (const name of KNOWN_VARS) {
    const v = process.env[name];
    if (v && PG_URL.test(v)) found.push(v);
  }
  if (found.length === 0) {
    // Last resort: scan all env values for a Postgres URL.
    for (const v of Object.values(process.env)) {
      if (typeof v === "string" && PG_URL.test(v)) found.push(v);
    }
  }
  if (found.length === 0) return "";
  // Prefer a pooled connection (pgbouncer) for serverless.
  const pooled = found.find((u) => /pooler|pgbouncer=true/i.test(u));
  return pooled ?? found[0];
}

export function hasDb(): boolean {
  return resolveDbUrl() !== "";
}

// Which known variable names are present (for diagnostics — no values).
export function presentDbVars(): string[] {
  return KNOWN_VARS.filter((n) => {
    const v = process.env[n];
    return Boolean(v && PG_URL.test(v));
  });
}
