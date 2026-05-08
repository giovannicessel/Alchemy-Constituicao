import type { NextFunction, Request, RequestHandler, Response } from "express";

/**
 * Express 4 não captura rejeições de handlers async — isso vira 500 genérico ou crash na Vercel.
 */
export function asyncRoute(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
): RequestHandler {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
