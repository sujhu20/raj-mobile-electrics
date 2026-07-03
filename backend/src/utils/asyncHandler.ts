import { Request, Response, NextFunction } from 'express';

export type AsyncHandler = (req: Request, res: Response) => Promise<void>;

/**
 * Wraps async route handlers to catch errors and pass to error middleware
 */
export function asyncHandler(fn: AsyncHandler) {
  return (req: Request, res: Response, next: NextFunction) => {
    console.log(`[asyncHandler] ENTER - Wrapping handler for: ${req.method} ${req.originalUrl}`);
    Promise.resolve(fn(req, res))
      .then(() => {
        console.log(`[asyncHandler] EXIT SUCCESS - Handler completed for: ${req.method} ${req.originalUrl}`);
      })
      .catch((error) => {
        console.error(`[asyncHandler] EXIT ERROR - Handler threw for: ${req.method} ${req.originalUrl}`, error);
        next(error);
      });
  };
}
