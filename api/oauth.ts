import express from "express";
import { asyncRoute } from "../server/_core/asyncRoute";
import { handleGoogleOAuthCallback } from "../server/_core/googleOAuthCallbackHandler";

/**
 * Vercel: callback Google sem carregar `sdk.ts` (axios / Manus) no cold start.
 * Login em `/api/auth/google/login` → `api/google-login.ts`.
 */
const app = express();
app.set("trust proxy", 1);

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

const googleCb = asyncRoute(handleGoogleOAuthCallback);
app.get("/api/auth/google/callback", googleCb);
app.get("/auth/google/callback", googleCb);

app.get(
  "/api/oauth/callback",
  asyncRoute(async (req, res) => {
    const { handleManusOAuthCallback } = await import("../server/_core/manusOAuthCallback");
    return handleManusOAuthCallback(req, res);
  }),
);

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("[api/oauth] Error:", err);
  res.status(500).json({
    error: "oauth_handler_failed",
    message: err instanceof Error ? err.message : String(err),
  });
});

export default app;
