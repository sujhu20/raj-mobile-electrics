import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { ApiResponse } from '../utils/apiResponse';

/**
 * Request validation middleware using Zod schemas
 * Validates body, query, and/or params based on provided schemas
 */
export function validate(schemas: {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}) {
  return (req: Request, res: Response, next: NextFunction): void => {
    console.log(`[VALIDATE] START - Validating request for: ${req.method} ${req.originalUrl}`);
    try {
      if (schemas.body) {
        console.log(`[VALIDATE] Parsing body with Zod schema...`);
        req.body = schemas.body.parse(req.body);
      }
      if (schemas.query) {
        console.log(`[VALIDATE] Parsing query with Zod schema...`);
        req.query = schemas.query.parse(req.query) as any;
      }
      if (schemas.params) {
        console.log(`[VALIDATE] Parsing params with Zod schema...`);
        req.params = schemas.params.parse(req.params) as any;
      }
      console.log(`[VALIDATE] END - Validation SUCCESS`);
      next();
    } catch (error) {
      console.error(`[VALIDATE] END - Validation FAILED`, error);
      if (error instanceof ZodError) {
        const formattedErrors = error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));
        ApiResponse.error(res, 'Validation failed', 422, formattedErrors);
        return;
      }
      next(error);
    }
  };
}
