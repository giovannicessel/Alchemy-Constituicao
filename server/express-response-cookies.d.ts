/**
 * Em alguns ambientes (ex.: CI/Vercel) a cadeia de tipos do Express não expõe `clearCookie`
 * em `Response`, embora exista em runtime.
 */
import type { CookieOptions } from "express";

declare module "express-serve-static-core" {
  interface Response<
    ResBody = unknown,
    Locals extends Record<string, unknown> = Record<string, unknown>,
  > {
    clearCookie(name: string, options?: CookieOptions): this;
  }
}

export {};
