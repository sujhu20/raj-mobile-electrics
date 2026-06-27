import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, TokenPayload } from '../utils/jwt';
import { ApiResponse } from '../utils/apiResponse';
import prisma from '../config/database';

// Extend Express Request
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        role: string;
        email: string;
        firstName: string;
        lastName: string;
      };
    }
  }
}

/**
 * Authentication middleware — verifies JWT access token
 */
export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    ApiResponse.unauthorized(res, 'Access token is required');
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = verifyAccessToken(token);
    req.user = {
      userId: payload.userId,
      role: payload.role,
      email: '',
      firstName: '',
      lastName: '',
    };
    next();
  } catch {
    ApiResponse.unauthorized(res, 'Invalid or expired access token');
  }
}

/**
 * Optional authentication — attaches user if token present, continues otherwise
 */
export function optionalAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    next();
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = verifyAccessToken(token);
    req.user = {
      userId: payload.userId,
      role: payload.role,
      email: '',
      firstName: '',
      lastName: '',
    };
  } catch {
    // Token invalid but request can proceed
  }

  next();
}

/**
 * Middleware to load full user data from database (use after authenticate)
 */
export async function loadUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  if (!req.user) {
    next();
    return;
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isBlocked: true,
        isVerified: true,
      },
    });

    if (!user) {
      ApiResponse.unauthorized(res, 'User not found');
      return;
    }

    if (user.isBlocked) {
      ApiResponse.forbidden(res, 'Your account has been blocked');
      return;
    }

    req.user = {
      userId: user.id,
      role: user.role,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    };

    next();
  } catch {
    ApiResponse.error(res, 'Authentication error', 500);
  }
}
