/**
 * Diagnóstico de DB em produção sem expor segredos.
 * Mostra host/database resolvidos e contagem de tabelas-chave.
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

  try {
    const mysqlMod = await import("mysql2/promise");
    const mysql = mysqlMod.default ?? mysqlMod;
    const conn = await mysql.createConnection({
      uri: url,
      connectTimeout: 8000,
      enableKeepAlive: true,
    });
    try {
      const pickCount = async (table: string) => {
        const [rows] = await conn.query(`SELECT COUNT(*) as c FROM \`${table}\``);
        const row = Array.isArray(rows) ? (rows[0] as { c?: number } | undefined) : undefined;
        return Number(row?.c ?? 0);
      };
      payload.counts = {
        titles: await pickCount("titles"),
        chapters: await pickCount("chapters"),
        articles: await pickCount("articles"),
        quizQuestions: await pickCount("quizQuestions"),
        flashcards: await pickCount("flashcards"),
        users: await pickCount("users"),
      };
      payload.ok = true;
    } finally {
      await conn.end();
    }
  } catch (error) {
    payload.ok = false;
    payload.error = error instanceof Error ? error.message : String(error);
  }

  res.statusCode = 200;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(payload));
}

