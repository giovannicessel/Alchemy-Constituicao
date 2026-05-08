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
    apiRouter(req, res, next);
  } catch (err) {
    next(err);
  }
});

export default app;
