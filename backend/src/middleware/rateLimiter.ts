import rateLimit from 'express-rate-limit';
import { env } from '../config/env';
import { verifyAccessToken } from '../utils/jwt';

const isDev = env.NODE_ENV === 'development';

/**
 * General API rate limiter — 100 requests per 15 minutes
 */
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 100000 : 100,
  message: {
    success: false,
    message: 'Too many requests, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip general rate limiting for sensitive auth routes, which have their own strict authLimiter
    const url = req.originalUrl || '';
    const isSensitiveAuth = 
      url.includes('/api/auth/register') ||
      url.includes('/api/auth/login') ||
      url.includes('/api/auth/google') ||
      url.includes('/api/auth/forgot-password') ||
      url.includes('/api/auth/reset-password') ||
      url.includes('/api/auth/verify-email');
      
    if (isSensitiveAuth) {
      return true;
    }

    // Skip rate limiting for authenticated requests with a valid token
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.split(' ')[1];
        verifyAccessToken(token);
        return true;
      } catch {
        return false;
      }
    }

    return false;
  },
});

/**
 * Auth rate limiter — stricter for login/register endpoints
 * 10 requests per 15 minutes
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 100000 : 10,
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Upload rate limiter — 20 uploads per 15 minutes
 */
export const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 100000 : 20,
  message: {
    success: false,
    message: 'Too many upload requests, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
