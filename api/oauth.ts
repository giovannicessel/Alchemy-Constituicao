import express from "express";
import { asyncRoute } from "../server/_core/asyncRoute.js";

/** Só fluxo Manus (`/api/oauth/callback`). Google → `api/google-callback.ts`. */
const app = express();
app.set("trust proxy", 1);

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

app.get(
  "/api/oauth/callback",
  asyncRoute(async (req, res) => {
    const { handleManusOAuthCallback } = await import("../server/_core/manusOAuthCallback.js");
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
