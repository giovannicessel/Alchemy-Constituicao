import { SignJWT } from "jose";
import { ONE_YEAR_MS } from "../../shared/const";
import { ENV } from "./env";

export type SessionJwtPayload = {
  openId: string;
  appId: string;
  name: string;
};

export async function signSessionJwt(
  payload: SessionJwtPayload,
  options: { expiresInMs?: number } = {},
): Promise<string> {
  const issuedAt = Date.now();
  const expiresInMs = options.expiresInMs ?? ONE_YEAR_MS;
  const expirationSeconds = Math.floor((issuedAt + expiresInMs) / 1000);
  const secretKey = new TextEncoder().encode(ENV.cookieSecret);

  return new SignJWT({
    openId: payload.openId,
    appId: payload.appId,
    name: payload.name,
  })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setExpirationTime(expirationSeconds)
    .sign(secretKey);
}
