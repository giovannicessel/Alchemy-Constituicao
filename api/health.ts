/**
 * Função isolada: não importa Express, tRPC nem Drizzle — só existe para cold start na Vercel.
 * Deve responder 200 se o runtime Node estiver ok.
 */
export default function handler(
  _req: unknown,
  res: { statusCode?: number; setHeader: (n: string, v: string) => void; end: (b: string) => void },
) {
  res.statusCode = 200;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify({ ok: true, scope: "minimal" }));
}
