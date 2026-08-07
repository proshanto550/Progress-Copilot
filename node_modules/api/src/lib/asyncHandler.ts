import type { Request, Response, NextFunction, RequestHandler } from 'express';

/**
 * Wrap an async Express handler so that any thrown error (or rejected
 * promise) is forwarded to `next()` and reaches the global error
 * middleware. Without this, Express 4 silently leaves the request
 * hanging and the unhandled rejection escapes to Node's default
 * handler — which is exactly what was happening with the AI routes:
 * the frontend timed out at 10s because the response was never sent.
 *
 * Usage:
 *   router.get('/foo', asyncHandler(async (req, res) => { ... }));
 */
export const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>): RequestHandler =>
  (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };