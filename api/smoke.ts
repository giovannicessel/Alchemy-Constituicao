/** Sem dependências — só confirma que uma segunda função serverless responde. */
export default function handler(
  _req: unknown,
  res: { statusCode?: number; setHeader: (n: string, v: string) => void; end: (b: string) => void },
) {
  res.statusCode = 200;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify({ ok: true, route: "smoke" }));
}
