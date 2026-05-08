import { COOKIE_NAME, ONE_YEAR_MS } from "../../shared/const";
import type { Request, Response } from "express";
import type { IRouter } from "express-serve-static-core";
import crypto from "node:crypto";
import { parse as parseCookieHeader } from "cookie";
import * as db from "../db";
import { asyncRoute } from "./asyncRoute";
import { getSessionCookieOptions } from "./cookies";
import { ENV } from "./env";
import { sdk } from "./sdk";

function getQueryParam(req: Request, key: string): string | undefined {
  const value = req.query[key];
  return typeof value === "string" ? value : undefined;
}

function oauthCallbackHint(message: string): string {
  if (message.includes("Token exchange failed")) return "token_exchange";
  if (message.includes("Userinfo failed")) return "userinfo";
  if (message.includes("Database") || message.includes("upsert")) return "database";
  if (message.includes("JWT") || message.includes("sign") || message.includes("secret")) return "session_jwt";
  return "unknown";
}

export function registerOAuthRoutes(app: IRouter) {
  app.get(
    "/api/auth/google/login",
    asyncRoute(async (req: Request, res: Response) => {
      if (!ENV.googleClientId) {
        res.status(500).json({ error: "GOOGLE_CLIENT_ID não configurado" });
        return;
      }
      const origin = `${req.protocol}://${req.get("host")}`;
      const redirectUri = ENV.googleRedirectUri || `${origin}/api/auth/google/callback`;
      const state = crypto.randomBytes(16).toString("hex");
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie("google_oauth_state", state, { ...cookieOptions, maxAge: 10 * 60 * 1000 });

      const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
      url.searchParams.set("client_id", ENV.googleClientId);
      url.searchParams.set("redirect_uri", redirectUri);
      url.searchParams.set("response_type", "code");
      url.searchParams.set("scope", "openid email profile");
      url.searchParams.set("state", state);
      url.searchParams.set("access_type", "offline");
      url.searchParams.set("prompt", "consent");
      res.redirect(302, url.toString());
    }),
  );

  app.get("/api/auth/google/callback", asyncRoute(async (req: Request, res: Response) => {
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
      const sessionToken = await sdk.createSessionToken(openId, {
        name: profile.name || profile.email || "Usuário Google",
        expiresInMs: ONE_YEAR_MS,
      });
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
      res.clearCookie("google_oauth_state", cookieOptions);
      res.redirect(302, "/");
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      console.error("[Google OAuth] Callback failed", err);
      res.status(500).json({
        error: "Google OAuth callback failed",
        hint: oauthCallbackHint(err.message),
      });
    }
  }));

  app.get("/api/oauth/callback", asyncRoute(async (req: Request, res: Response) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");

    if (!code || !state) {
      res.status(400).json({ error: "code and state are required" });
      return;
    }

    try {
      const tokenResponse = await sdk.exchangeCodeForToken(code, state);
      const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);

      if (!userInfo.openId) {
        res.status(400).json({ error: "openId missing from user info" });
        return;
      }

      await db.upsertUser({
        openId: userInfo.openId,
        name: userInfo.name || null,
        email: userInfo.email ?? null,
        loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
        lastSignedIn: new Date(),
      });

      const sessionToken = await sdk.createSessionToken(userInfo.openId, {
        name: userInfo.name || "",
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      res.redirect(302, "/");
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      console.error("[OAuth] Callback failed", err);
      res.status(500).json({ error: "OAuth callback failed", hint: oauthCallbackHint(err.message) });
    }
  }));
}
