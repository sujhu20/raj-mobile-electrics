import Redis from 'ioredis';
import { env } from './env';
import { logger } from '../utils/logger';

let redis: Redis | null = null;
let isRedisConnected = false;

export function getRedis(): Redis | null {
  // If Redis is disabled or REDIS_URL is explicitly empty, return null
  if (!env.REDIS_URL || env.REDIS_URL === 'none' || env.REDIS_URL === 'false') {
    return null;
  }

  if (!redis) {
    try {
      redis = new Redis(env.REDIS_URL, {
        maxRetriesPerRequest: 1, // Minimize retries on failure
        retryStrategy(times) {
          // If we failed to connect multiple times, slow down retries to once every 10s
          if (times > 3) {
            return 10000;
          }
          return Math.min(times * 500, 2000);
        },
        lazyConnect: true,
      });

      redis.on('connect', () => {
        isRedisConnected = true;
        logger.info('✅ Redis connected');
      });

      redis.on('ready', () => {
        isRedisConnected = true;
      });

      redis.on('error', (err) => {
        isRedisConnected = false;
        logger.warn('⚠️ Redis connection error: ' + err.message);
      });

      redis.on('close', () => {
        isRedisConnected = false;
      });
    } catch (err: any) {
      logger.warn('⚠️ Failed to initialize Redis client: ' + err.message);
      redis = null;
      isRedisConnected = false;
    }
  }
  return redis;
}

export function isRedisReady(): boolean {
  return isRedisConnected && redis !== null && redis.status === 'ready';
}

export async function connectRedis(): Promise<void> {
  const client = getRedis();
  if (!client) {
    logger.info('ℹ️ Redis is disabled by configuration');
    return;
  }
  
  // Connect asynchronously without blocking bootstrap/startup
  client.connect().catch((err) => {
    logger.warn('⚠️ Redis initial connection failed — caching disabled: ' + err.message);
  });
}

export async function disconnectRedis(): Promise<void> {
  if (redis) {
    try {
      await redis.quit();
    } catch {}
    redis = null;
    isRedisConnected = false;
  }
}

export default getRedis;
