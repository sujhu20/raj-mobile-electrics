import { Request as ExpressRequest } from 'express';

// Augment Express types to fix strict mode params typing
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        role: string;
      };
    }
  }
}

// Helper types for route params
export type RouteParams<T extends string> = Record<T, string>;

export {};
