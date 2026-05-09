import { COOKIE_NAME, ONE_YEAR_MS } from "../../shared/const";
import type { Request, Response } from "express";
import { parse as parseCookieHeader } from "cookie";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { ENV } from "./env";
import { signSessionJwt } from "./sessionJwt";

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

/**
 * Callback Google OAuth sem depender de `sdk.ts` (axios / Manus).
 * Usado na Vercel em `api/oauth.ts` para reduzir imports no cold start.
 */
export async function handleGoogleOAuthCallback(req: Request, res: Response): Promise<void> {
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

    if (!ENV.googleClientSecret?.trim()) {
      res.status(500).json({
        error: "GOOGLE_CLIENT_SECRET não configurado na Vercel",
        hint: "missing_client_secret",
      });
      return;
    }
    if (!ENV.googleClientId?.trim()) {
      res.status(500).json({
        error: "GOOGLE_CLIENT_ID não configurado na Vercel",
        hint: "missing_client_id",
      });
      return;
    }

    try {
    const origin = `${req.protocol}://${req.get("host")}`;
    const redirectUri = ENV.googleRedirectUri || `${origin}/api/auth/google/callback`;
    const body = new URLSearchParams({
      code,
      client_id: ENV.googleClientId,
      client_secret: ENV.googleClientSecret,
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
    await db.upsertUser({
      openId,
      name: profile.name ?? null,
      email: profile.email ?? null,
      loginMethod: "google",
      lastSignedIn: new Date(),
    });
    const sessionToken = await signSessionJwt(
      {
        openId,
        appId: ENV.appId,
        name: profile.name || profile.email || "Usuário Google",
      },
      { expiresInMs: ONE_YEAR_MS },
    );
    const cookieOptions = getSessionCookieOptions(req);
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
