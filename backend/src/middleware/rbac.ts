import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../utils/apiResponse';

/**
 * Role-based access control middleware
 * Usage: authorize('ADMIN') or authorize('ADMIN', 'CUSTOMER')
 */
export function authorize(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      ApiResponse.unauthorized(res, 'Authentication required');
      return;
    }

    if (!roles.includes(req.user.role)) {
      ApiResponse.forbidden(res, 'You do not have permission to perform this action');
      return;
    }

    next();
  };
}

/**
 * Shorthand for admin-only routes
 */
export const adminOnly = authorize('ADMIN');

/**
 * Shorthand for customer-only routes
 */
export const customerOnly = authorize('CUSTOMER');
