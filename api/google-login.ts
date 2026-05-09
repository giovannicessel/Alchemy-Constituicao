import express, { type Request, type Response } from "express";
import crypto from "node:crypto";

/**
 * Zero imports de `server/*` — só express + crypto + env.
 * Se isto ainda der FUNCTION_INVOCATION_FAILED, o problema não é o grafo da app (é rewrite, preset Vercel ou runtime).
 */

function isSecureRequest(req: Request): boolean {
  if (req.protocol === "https") return true;
  const forwardedProto = req.headers["x-forwarded-proto"];
  if (!forwardedProto) return false;
  const protoList = Array.isArray(forwardedProto)
    ? forwardedProto
    : forwardedProto.split(",");
  return protoList.some((proto: string) => proto.trim().toLowerCase() === "https");
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

const app = express();
app.set("trust proxy", 1);

app.use((_req, res, next) => {
  res.setHeader("X-Handler", "google-login-inline");
  next();
});

app.get("/api/auth/google/login", (req: Request, res: Response) => {
  const googleClientId = process.env.GOOGLE_CLIENT_ID?.trim() ?? "";
  if (!googleClientId) {
    res.status(500).json({ error: "GOOGLE_CLIENT_ID não configurado" });
    return;
  }
  const origin = `${req.protocol}://${req.get("host")}`;
  const redirectUri =
    process.env.GOOGLE_REDIRECT_URI?.trim() || `${origin}/api/auth/google/callback`;
  const state = crypto.randomBytes(16).toString("hex");
  const cookieOptions = sessionCookieAttrs(req);
  res.cookie("google_oauth_state", state, { ...cookieOptions, maxAge: 10 * 60 * 1000 });

  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id", googleClientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "openid email profile");
  url.searchParams.set("state", state);
  url.searchParams.set("access_type", "offline");
  url.searchParams.set("prompt", "consent");
  res.redirect(302, url.toString());
});

export default app;
