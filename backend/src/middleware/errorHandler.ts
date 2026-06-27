import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { AppError } from '../utils/apiResponse';
import { env } from '../config/env';

/**
 * Global error handler middleware
 * Must be registered last in the middleware chain
 */
export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction): void {
  // Log the error
  logger.error({
    err,
    method: req.method,
    url: req.url,
    ip: req.ip,
    userId: req.user?.userId,
  });

  // Handle known operational errors
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
    return;
  }

  // Handle Prisma errors
  if (err.name === 'PrismaClientKnownRequestError') {
    const prismaError = err as any;
    switch (prismaError.code) {
      case 'P2002':
        res.status(409).json({
          success: false,
          message: `Duplicate value for ${prismaError.meta?.target?.join(', ')}`,
        });
        return;
      case 'P2003':
        res.status(409).json({
          success: false,
          message: 'Delete failed: this record is referenced by other items.',
        });
        return;
      case 'P2025':
        res.status(404).json({
          success: false,
          message: 'Record not found',
        });
        return;
      default:
        break;
    }
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    res.status(401).json({
      success: false,
      message: 'Invalid token',
    });
    return;
  }

  if (err.name === 'TokenExpiredError') {
    res.status(401).json({
      success: false,
      message: 'Token expired',
    });
    return;
  }

  // Handle multer errors
  if (err.name === 'MulterError') {
    res.status(400).json({
      success: false,
      message: `Upload error: ${err.message}`,
    });
    return;
  }

  // Default server error
  res.status(500).json({
    success: false,
    message: env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
    ...(env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
}

/**
 * 404 handler for undefined routes
 */
export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.url} not found`,
  });
}
