import express from "express";
import { registerGoogleLoginRoute } from "../server/_core/oauthGoogleLogin";

/** Vercel: função mínima — não carrega db/sdk dos callbacks OAuth. */
const app = express();
app.set("trust proxy", 1);
registerGoogleLoginRoute(app);

export default app;
