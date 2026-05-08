import express from "express";

const app = express();
app.set("trust proxy", 1);

const apiRouter = express.Router();

let attachPromise: Promise<void> | null = null;

async function ensureApiRoutesLoaded() {
  if (!attachPromise) {
    attachPromise = import("../server/vercelAttachRoutes.js").then(({ attachApiRoutes }) => {
      attachApiRoutes(apiRouter);
    });
  }
  await attachPromise;
}

app.use(async (req, res, next) => {
  try {
    await ensureApiRoutesLoaded();
  } catch (err) {
    console.error("[api/index] Falha ao carregar server/vercelAttachRoutes:", err);
    res.status(500).json({
      error: "api_bootstrap_failed",
      message: err instanceof Error ? err.message : String(err),
    });
    return;
  }
  apiRouter(req, res, next);
});

export default app;
