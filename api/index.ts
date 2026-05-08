import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "../server/_core/oauth";
import { registerStorageProxy } from "../server/_core/storageProxy";
import { appRouter } from "../server/routers";
import { createContext } from "../server/_core/context";

const app = express();
app.set("trust proxy", 1);

// Cold start / monitoramento sem passar pelo tRPC nem pelo MySQL
app.get("/api/health", (_req, res) => {
  res.status(200).json({ ok: true });
});

// Configure body parser
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Registrando base do servidor
registerStorageProxy(app);
registerOAuthRoutes(app);

// Configurando tRPC na rota /api/trpc
app.use(
  "/api/trpc",
  createExpressMiddleware({
    router: appRouter,
    createContext,
  })
);

// Tratamento de erros
app.use((err: any, _req: any, res: any, _next: any) => {
  console.error("Vercel Serverless Error:", err);
  res.status(500).json({ error: "Internal Server Error" });
});

export default app;
