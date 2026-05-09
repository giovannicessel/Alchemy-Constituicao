import express from "express";

/** Rotas REST pesadas (tRPC + storage). OAuth Google está em `api/oauth.ts`. */

const app = express();
app.set("trust proxy", 1);

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

let trpcHandler:
  | ((
      req: express.Request,
      res: express.Response,
      next: express.NextFunction,
    ) => void)
  | null = null;
let trpcInitError: string | null = null;

async function getTrpcHandler() {
  if (trpcHandler) return trpcHandler;
  if (trpcInitError) throw new Error(trpcInitError);
  try {
    const [{ createExpressMiddleware }, { createContext }, { appRouter }] = await Promise.all([
      import("@trpc/server/adapters/express"),
      import("../server/_core/context"),
      import("../server/routers"),
    ]);
    trpcHandler = createExpressMiddleware({
      router: appRouter,
      createContext,
    });
    return trpcHandler;
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    trpcInitError = msg;
    throw new Error(msg);
  }
}

app.use("/api/trpc", (req, res, next) => {
  void getTrpcHandler()
    .then((handler) => handler(req, res, next))
    .catch((error) => {
      console.error("[api/index] tRPC init failed:", error);
      res.status(500).json({
        error: "trpc_init_failed",
        message: error instanceof Error ? error.message : String(error),
      });
    });
});

let storageProxyRegistered = false;
app.use((req, res, next) => {
  if (storageProxyRegistered) return next();
  void import("../server/_core/storageProxy")
    .then(({ registerStorageProxy }) => {
      registerStorageProxy(app);
      storageProxyRegistered = true;
      next();
    })
    .catch((error) => {
      console.error("[api/index] storage proxy init failed:", error);
      next();
    });
});

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("Vercel Serverless Error:", err);
  res.status(500).json({ error: "Internal Server Error" });
});

export default app;
