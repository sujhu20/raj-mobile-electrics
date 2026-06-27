import { Request, Response, NextFunction } from 'express';

export type AsyncHandler = (req: Request, res: Response) => Promise<void>;

/**
 * Wraps async route handlers to catch errors and pass to error middleware
 */
export function asyncHandler(fn: AsyncHandler) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res)).catch(next);
  };
}
