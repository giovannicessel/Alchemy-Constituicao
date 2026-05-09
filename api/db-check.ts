/**
 * Diagnóstico de DB em produção sem expor segredos.
 * NÃO importa mysql2 (evita crash nativo no runtime Vercel).
 */
export default async function handler(
  _req: unknown,
  res: { statusCode?: number; setHeader: (n: string, v: string) => void; end: (b: string) => void },
) {
  const url =
    process.env.DATABASE_URL?.trim() ||
    process.env.MYSQL_URL?.trim() ||
    process.env.PRISMA_DATABASE_URL?.trim() ||
    "";

  const payload: Record<string, unknown> = {
    hasDatabaseUrl: Boolean(url),
    source:
      process.env.DATABASE_URL?.trim()
        ? "DATABASE_URL"
        : process.env.MYSQL_URL?.trim()
          ? "MYSQL_URL"
          : process.env.PRISMA_DATABASE_URL?.trim()
            ? "PRISMA_DATABASE_URL"
            : null,
  };

  if (!url) {
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.end(JSON.stringify(payload));
    return;
  }

  try {
    const parsed = new URL(url);
    payload.dbHost = parsed.hostname;
    payload.dbPort = parsed.port || "3306";
    payload.dbName = parsed.pathname.replace(/^\//, "");
  } catch {
    payload.dbHost = "invalid_url";
  }

  const lower = url.toLowerCase();
  payload.pointsToLocalhost =
    lower.includes("127.0.0.1") ||
    lower.includes("localhost") ||
    lower.includes("@localhost") ||
    lower.includes("//localhost");
  payload.note =
    "Endpoint leve: sem teste de conexão MySQL (evita FUNCTION_INVOCATION_FAILED no runtime).";
  payload.ok = true;

  res.statusCode = 200;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(payload));
}

