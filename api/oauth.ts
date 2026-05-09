import express from "express";
import { registerOAuthRoutes } from "../server/_core/oauth";

/**
 * Função só para rotas Google OAuth — não importa `server/routers` (tRPC).
 * Evita bundle pesado / crash na mesma função que `/api/trpc`.
 */
const app = express();
app.set("trust proxy", 1);

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

registerOAuthRoutes(app);

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("[api/oauth] Error:", err);
  res.status(500).json({
    error: "oauth_handler_failed",
    message: err instanceof Error ? err.message : String(err),
  });
});

export default app;
