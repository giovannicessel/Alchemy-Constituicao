import type { Request, Response } from "express";
import type { IRouter } from "express-serve-static-core";
import crypto from "node:crypto";
import { getSessionCookieOptions } from "./cookies";
import { ENV } from "./env";

/** Rota leve: só env + cookies + crypto — usada na Vercel em função dedicada (`api/google-login.ts`). */
export function registerGoogleLoginRoute(app: IRouter) {
  app.get("/api/auth/google/login", (req: Request, res: Response) => {
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
  });
}
