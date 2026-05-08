import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import type { IRouter } from "express-serve-static-core";
import { registerOAuthRoutes } from "./_core/oauth";
import { registerStorageProxy } from "./_core/storageProxy";
import { createContext } from "./_core/context";
import { appRouter } from "./routers";

/** Rotas pesadas (tRPC, OAuth, DB via imports): carregadas só após import dinâmico na Vercel. */
export function attachApiRoutes(app: IRouter): void {
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  registerStorageProxy(app);
  registerOAuthRoutes(app);

  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    }),
  );

  app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error("Vercel Serverless Error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  });
}
