import express from "express";
import { asyncRoute } from "../server/_core/asyncRoute";

/**
 * Função dedicada na Vercel (como `google-login.ts`).
 * Carrega o handler só em runtime via import dinâmico — não liga `db`/drizzle no cold start deste ficheiro.
 */
const app = express();
app.set("trust proxy", 1);

const googleHandler = asyncRoute(async (req, res) => {
  const { handleGoogleOAuthCallback } = await import("../server/_core/googleOAuthCallbackHandler");
  await handleGoogleOAuthCallback(req, res);
});

app.get("/api/auth/google/callback", googleHandler);
app.get("/auth/google/callback", googleHandler);

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("[api/google-callback] Error:", err);
  res.status(500).json({
    error: "google_callback_failed",
    message: err instanceof Error ? err.message : String(err),
  });
});

export default app;
