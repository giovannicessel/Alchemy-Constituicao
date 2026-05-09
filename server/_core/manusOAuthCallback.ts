import { COOKIE_NAME, ONE_YEAR_MS } from "../../shared/const";
import type { Request, Response } from "express";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
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

/** Fluxo Manus / OAuth integrado — mantido para `pnpm dev` e `/api/oauth/callback`. */
export async function handleManusOAuthCallback(req: Request, res: Response): Promise<void> {
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
}
