import { Request } from 'express';

/**
 * Safely get a route parameter as a string.
 * Express 5 types params as `string | string[]` but
 * named params (e.g. `:id`) are always strings at runtime.
 */
export function param(req: Request, name: string): string {
  const value = req.params[name];
  return Array.isArray(value) ? value[0] : (value as string);
}

/**
 * Safely get a query parameter as a string.
 */
export function query(req: Request, name: string): string {
  const value = req.query[name];
  if (Array.isArray(value)) return String(value[0]);
  return value ? String(value) : '';
}
