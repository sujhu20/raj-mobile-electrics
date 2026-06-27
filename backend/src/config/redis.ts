import Redis from 'ioredis';
import { env } from './env';
import { logger } from '../utils/logger';

let redis: Redis | null = null;

export function getRedis(): Redis {
  if (!redis) {
    redis = new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      lazyConnect: true,
    });

    redis.on('connect', () => {
      logger.info('✅ Redis connected');
    });

    redis.on('error', (err) => {
      logger.error({ err }, '❌ Redis connection error');
    });
  }
  return redis;
}

export async function connectRedis(): Promise<void> {
  try {
    const client = getRedis();
    await client.connect();
  } catch (error) {
    logger.warn('⚠️ Redis not available — caching disabled');
  }
}

export async function disconnectRedis(): Promise<void> {
  if (redis) {
    await redis.quit();
    redis = null;
  }
}

export default getRedis;
