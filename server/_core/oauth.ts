import type { IRouter } from "express-serve-static-core";
import { asyncRoute } from "./asyncRoute";
import { handleGoogleOAuthCallback } from "./googleOAuthCallbackHandler";
import { handleManusOAuthCallback } from "./manusOAuthCallback";
import { registerGoogleLoginRoute } from "./oauthGoogleLogin";

export function registerOAuthRoutes(app: IRouter) {
  registerGoogleLoginRoute(app);

  const googleCb = asyncRoute(handleGoogleOAuthCallback);
  app.get("/api/auth/google/callback", googleCb);
  app.get("/auth/google/callback", googleCb);

  app.get("/api/oauth/callback", asyncRoute(handleManusOAuthCallback));
}
