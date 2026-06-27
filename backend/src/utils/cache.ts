import { getRedis } from '../config/redis';
import { logger } from './logger';

const DEFAULT_TTL = 300; // 5 minutes

/**
 * Get a cached value by key
 */
export async function getCache<T>(key: string): Promise<T | null> {
  try {
    const redis = getRedis();
    const data = await redis.get(key);
    if (data) {
      return JSON.parse(data) as T;
    }
    return null;
  } catch {
    logger.warn(`Cache get failed for key: ${key}`);
    return null;
  }
}

/**
 * Set a cached value with TTL
 */
export async function setCache<T>(key: string, value: T, ttl: number = DEFAULT_TTL): Promise<void> {
  try {
    const redis = getRedis();
    await redis.setex(key, ttl, JSON.stringify(value));
  } catch {
    logger.warn(`Cache set failed for key: ${key}`);
  }
}

/**
 * Delete a cached value
 */
export async function deleteCache(key: string): Promise<void> {
  try {
    const redis = getRedis();
    await redis.del(key);
  } catch {
    logger.warn(`Cache delete failed for key: ${key}`);
  }
}

/**
 * Delete all keys matching a pattern
 */
export async function deleteCachePattern(pattern: string): Promise<void> {
  try {
    const redis = getRedis();
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch {
    logger.warn(`Cache pattern delete failed for: ${pattern}`);
  }
}

/**
 * Generate a cache key with namespace
 */
export function cacheKey(namespace: string, ...parts: (string | number)[]): string {
  return `techhub:${namespace}:${parts.join(':')}`;
}
