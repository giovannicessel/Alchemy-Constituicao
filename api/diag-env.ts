/**
 * Só indica se variáveis existem (não expõe valores). Útil para conferir o painel da Vercel.
 */
export default function handler(
  _req: unknown,
  res: { statusCode?: number; setHeader: (n: string, v: string) => void; end: (b: string) => void },
) {
  const has = (key: string) => Boolean(process.env[key]?.trim());

  const payload = {
    hasGoogleClientId: has("GOOGLE_CLIENT_ID"),
    hasGoogleClientSecret: has("GOOGLE_CLIENT_SECRET"),
    hasJwtSecret: has("JWT_SECRET"),
    hasDatabaseUrl: has("DATABASE_URL"),
    hasGoogleRedirectUri: has("GOOGLE_REDIRECT_URI"),
    /** true = JWT_SECRET não definido; o app usa fallback de desenvolvimento (funciona, mas defina um segredo em produção). */
    jwtSecretIsDefaultFallback: !has("JWT_SECRET"),
    nodeEnv: process.env.NODE_ENV ?? null,
  };

  res.statusCode = 200;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(payload));
}
