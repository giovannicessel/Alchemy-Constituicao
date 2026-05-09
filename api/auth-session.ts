import express, { type Request } from "express";
import { parse as parseCookieHeader } from "cookie";

const COOKIE_NAME = "app_session_id";

function isSecureRequest(req: Request): boolean {
  if (req.protocol === "https") return true;
  const forwardedProto = req.headers["x-forwarded-proto"];
  if (!forwardedProto) return false;
  const protoList = Array.isArray(forwardedProto) ? forwardedProto : forwardedProto.split(",");
  return protoList.some((proto: string) => proto.trim().toLowerCase() === "https");
}

const app = express();
app.set("trust proxy", 1);
app.use(express.json({ limit: "1mb" }));

app.get("/api/auth/me", async (req, res) => {
  try {
    const token = parseCookieHeader(req.headers.cookie ?? "")[COOKIE_NAME];
    if (!token) {
      res.status(200).json({ user: null });
      return;
    }

    const { jwtVerify } = await import("jose");
    const cookieSecret = (process.env.JWT_SECRET ?? "dev-local-secret-change-me").trim();
    const secretKey = new TextEncoder().encode(cookieSecret);
    const { payload } = await jwtVerify(token, secretKey, { algorithms: ["HS256"] });
    const openId = typeof payload.openId === "string" ? payload.openId : null;
    const name = typeof payload.name === "string" ? payload.name : "";
    if (!openId) {
      res.status(200).json({ user: null });
      return;
    }
    res.status(200).json({
      user: {
        id: -1,
        openId,
        name,
        email: null,
        loginMethod: "google",
        role: "user",
      },
    });
  } catch (error) {
    console.warn("[auth-session] me failed:", error);
    res.status(200).json({ user: null });
  }
});

app.post("/api/auth/logout", (req, res) => {
  const secure = isSecureRequest(req);
  res.clearCookie(COOKIE_NAME, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure,
  });
  res.status(200).json({ success: true });
});

export default app;
