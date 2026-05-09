import express, { type NextFunction, type Request, type Response } from "express";
import { parse as parseCookieHeader } from "cookie";
import { SignJWT } from "jose";

/**
 * Tudo num só ficheiro — a Vercel não empacota bem `api/foo.ts` + `api/bar.ts` irmãos.
 * `mysql2` só via import dinâmico dentro do upsert.
 *
 * Diagnóstico: na Vercel define `SKIP_GOOGLE_OAUTH_DB=1` temporariamente — se o login
 * redireccionar sem FUNCTION_INVOCATION_FAILED, o crash é ao carregar/usar mysql2.
 */

const COOKIE_NAME = "app_session_id";
const ONE_YEAR_MS = 1000 * 60 * 60 * 24 * 365;

function trimEnv(key: string): string {
  return typeof process.env[key] === "string" ? process.env[key]!.trim() : "";
}

function isSecureRequest(req: Request): boolean {
  if (req.protocol === "https") return true;
  const forwardedProto = req.headers["x-forwarded-proto"];
  if (!forwardedProto) return false;
  const protoList = Array.isArray(forwardedProto) ? forwardedProto : forwardedProto.split(",");
  return protoList.some((p: string) => p.trim().toLowerCase() === "https");
}

function sessionCookieAttrs(req: Request) {
  const secure = isSecureRequest(req);
  return {
    httpOnly: true,
    path: "/" as const,
    sameSite: "lax" as const,
    secure,
  };
}

function getQueryParam(req: Request, key: string): string | undefined {
  const value = req.query[key];
  return typeof value === "string" ? value : undefined;
}

function oauthCallbackHint(message: string): string {
  const m = message.toLowerCase();
  if (message.includes("Token exchange failed")) return "token_exchange";
  if (message.includes("Userinfo failed")) return "userinfo";
  if (
    message.includes("Database") ||
    message.includes("upsert") ||
    m.includes("mysql") ||
    m.includes("er_dup") ||
    m.includes("duplicate entry") ||
    m.includes("foreign key") ||
    m.includes("sql") ||
    m.includes("econnrefused") ||
    m.includes("etimedout") ||
    m.includes("enotfound") ||
    m.includes("getaddrinfo") ||
    m.includes("ssl") ||
    m.includes("tls") ||
    m.includes("access denied")
  ) {
    return "database";
  }
  if (message.includes("JWT") || message.includes("sign") || m.includes("jose")) return "session_jwt";
  if (m.includes("cannot find module")) return "module_resolution";
  return "unknown";
}

function asyncRoute(
  fn: (req: Request, res: Response) => Promise<void>,
): (req: Request, res: Response, next: NextFunction) => void {
  return (req, res, next) => {
    Promise.resolve(fn(req, res)).catch(next);
  };
}

async function upsertGoogleOAuthUser(input: {
  openId: string;
  name: string | null;
  email: string | null;
}): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (!databaseUrl) {
    console.warn("[google-callback] DATABASE_URL ausente — skip upsert");
    return;
  }

  if (process.env.VERCEL === "1") {
    const lower = databaseUrl.toLowerCase();
    if (
      lower.includes("127.0.0.1") ||
      lower.includes("localhost") ||
      lower.includes("@localhost") ||
      lower.includes("//localhost")
    ) {
      throw new Error(
        "DATABASE_URL na Vercel aponta para localhost — no painel (Production) coloca o URL da MySQL na cloud (não uses .env local).",
      );
    }
  }

  const ownerOpenId = process.env.OWNER_OPEN_ID?.trim();
  const role = ownerOpenId && input.openId === ownerOpenId ? "admin" : "user";

  const mysqlMod = await import("mysql2/promise");
  const mysql = mysqlMod.default ?? mysqlMod;
  let conn: Awaited<ReturnType<typeof mysql.createConnection>> | undefined;
  try {
    conn = await mysql.createConnection(databaseUrl);
    await conn.execute(
      `INSERT INTO users (\`openId\`, \`name\`, \`email\`, \`loginMethod\`, \`lastSignedIn\`, \`role\`, \`createdAt\`, \`updatedAt\`)
       VALUES (?, ?, ?, 'google', NOW(), ?, NOW(), NOW())
       ON DUPLICATE KEY UPDATE
         \`name\` = VALUES(\`name\`),
         \`email\` = VALUES(\`email\`),
         \`loginMethod\` = VALUES(\`loginMethod\`),
         \`lastSignedIn\` = VALUES(\`lastSignedIn\`),
         \`role\` = VALUES(\`role\`),
         \`updatedAt\` = NOW()`,
      [input.openId, input.name, input.email, role],
    );
  } finally {
    if (conn) await conn.end();
  }
}

async function handleGoogleCallback(req: Request, res: Response): Promise<void> {
  const code = getQueryParam(req, "code");
  const state = getQueryParam(req, "state");
  const cookieState = parseCookieHeader(req.headers.cookie ?? "").google_oauth_state;

  if (!code || !state) {
    res.status(400).json({ error: "code and state are required" });
    return;
  }
  if (!cookieState || cookieState !== state) {
    res.status(400).json({ error: "invalid oauth state" });
    return;
  }

  const googleClientSecret = trimEnv("GOOGLE_CLIENT_SECRET");
  if (!googleClientSecret) {
    res.status(500).json({
      error: "GOOGLE_CLIENT_SECRET não configurado na Vercel",
      hint: "missing_client_secret",
    });
    return;
  }

  try {
    const googleClientId = trimEnv("GOOGLE_CLIENT_ID");
    if (!googleClientId) {
      res.status(500).json({
        error: "GOOGLE_CLIENT_ID não configurado na Vercel",
        hint: "missing_client_id",
      });
      return;
    }
    const origin = `${req.protocol}://${req.get("host")}`;
    const redirectUri =
      trimEnv("GOOGLE_REDIRECT_URI") || `${origin}/api/auth/google/callback`;

    const body = new URLSearchParams({
      code,
      client_id: googleClientId,
      client_secret: googleClientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    });

    const tokenResp = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
    if (!tokenResp.ok) {
      const txt = await tokenResp.text();
      throw new Error(`Token exchange failed: ${txt}`);
    }
    const tokenJson = (await tokenResp.json()) as { access_token?: string };
    const accessToken = tokenJson.access_token;
    if (!accessToken) throw new Error("Google access_token ausente");

    const profileResp = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!profileResp.ok) {
      const txt = await profileResp.text();
      throw new Error(`Userinfo failed: ${txt}`);
    }
    const profile = (await profileResp.json()) as {
      sub?: string;
      name?: string;
      email?: string;
    };
    if (!profile.sub) throw new Error("Google sub ausente");

    const openId = `google:${profile.sub}`;

    const skipDb =
      process.env.SKIP_GOOGLE_OAUTH_DB === "1" || process.env.SKIP_GOOGLE_OAUTH_DB === "true";
    if (!skipDb) {
      await upsertGoogleOAuthUser({
        openId,
        name: profile.name ?? null,
        email: profile.email ?? null,
      });
    } else {
      console.warn("[google-callback] SKIP_GOOGLE_OAUTH_DB ativo — utilizador não gravado na BD");
    }

    const appId = process.env.VITE_APP_ID?.trim() ?? "local-app";
    const cookieSecret = trimEnv("JWT_SECRET") || "dev-local-secret-change-me";
    const displayName = profile.name || profile.email || "Usuário Google";
    const issuedAt = Date.now();
    const expirationSeconds = Math.floor((issuedAt + ONE_YEAR_MS) / 1000);
    const secretKey = new TextEncoder().encode(cookieSecret);

    const sessionToken = await new SignJWT({
      openId,
      appId,
      name: displayName,
    })
      .setProtectedHeader({ alg: "HS256", typ: "JWT" })
      .setExpirationTime(expirationSeconds)
      .sign(secretKey);

    const cookieOptions = sessionCookieAttrs(req);
    res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
    res.clearCookie("google_oauth_state", cookieOptions);
    res.redirect(302, "/");
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error("[Google OAuth] Callback failed", err);
    const detail = err.message.length > 800 ? `${err.message.slice(0, 800)}…` : err.message;
    res.status(500).json({
      error: "Google OAuth callback failed",
      hint: oauthCallbackHint(err.message),
      message: detail,
    });
  }
}

const app = express();
app.set("trust proxy", 1);

app.use((_req, res, next) => {
  res.setHeader("X-Handler", "google-callback-single-file");
  next();
});

const googleHandler = asyncRoute(handleGoogleCallback);
app.get("/api/auth/google/callback", googleHandler);
app.get("/auth/google/callback", googleHandler);

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error("[api/google-callback] Error:", err);
  res.status(500).json({
    error: "google_callback_failed",
    message: err instanceof Error ? err.message : String(err),
  });
});

export default app;
