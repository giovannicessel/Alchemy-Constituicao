import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { Request, Response } from "express";
import type { User } from "../../drizzle/schema";
import { parse as parseCookieHeader } from "cookie";
import { COOKIE_NAME } from "../../shared/const";
import { ENV } from "./env";

export type TrpcContext = {
  req: Request;
  res: Response;
  user: User | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;
  const trpcPath = `${opts.req.path ?? ""}${opts.req.url ?? ""}`;
  const isAuthProbeRoute =
    trpcPath.includes("auth.me") || trpcPath.includes("auth.logout");

  const token = parseCookieHeader(opts.req.headers.cookie ?? "")[COOKIE_NAME];

  const parseSessionFromCookie = async (): Promise<Pick<User, "openId" | "name"> | null> => {
    if (!token) return null;
    try {
      const { jwtVerify } = await import("jose");
      const secretKey = new TextEncoder().encode(ENV.cookieSecret);
      const { payload } = await jwtVerify(token, secretKey, { algorithms: ["HS256"] });
      const openId = typeof payload.openId === "string" ? payload.openId : null;
      const name = typeof payload.name === "string" ? payload.name : "";
      if (!openId) return null;
      return { openId, name };
    } catch {
      return null;
    }
  };

  if (!isAuthProbeRoute) {
    try {
      const { sdk } = await import("./sdk");
      user = await sdk.authenticateRequest(opts.req);
    } catch {
      // Authentication is optional for public procedures.
      user = null;
    }
  } else {
    // Evita derrubar a função no handshake auth.me/logout quando DB está instável.
    const session = await parseSessionFromCookie();
    if (session) {
      user = {
        id: -1,
        openId: session.openId,
        name: session.name,
        email: null,
        loginMethod: "google",
        role: "user",
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
      };
    }
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
