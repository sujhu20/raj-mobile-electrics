// Startup diagnostics — logged before any async imports that might fail
console.log('[BOOT] index.ts loading...');

import app from './app';
import { env } from './config/env';
import { logger } from './utils/logger';
import prisma from './config/database';
import { connectRedis, disconnectRedis } from './config/redis';
import { configureCloudinary } from './config/cloudinary';

console.log('[BOOT] All imports resolved');

async function bootstrap(): Promise<void> {
  try {
    console.log('[BOOT] bootstrap() started');
    console.log('[BOOT] PORT =', env.PORT, '| NODE_ENV =', env.NODE_ENV);

    // 1. Start server immediately (bind port to prevent Railway port-binding timeout)
    console.log('[BOOT] Step 1: app.listen() - START on port', env.PORT);
    const server = app.listen(env.PORT, () => {
      console.log('[BOOT] Step 1: app.listen() - CALLBACK FIRED');
      logger.info(`🚀 ${env.APP_NAME} API running on port ${env.PORT}`);
      logger.info(`📍 Environment: ${env.NODE_ENV}`);
      logger.info(`🌐 Frontend URL: ${env.FRONTEND_URL}`);
    });

    // 2. Connect to database asynchronously in the background
    console.log('[BOOT] Step 2: prisma.$connect() - START (async)');
    prisma.$connect()
      .then(() => {
        console.log('[BOOT] Step 2: prisma.$connect() - CONNECTED');
        logger.info('✅ Database connected');
      })
      .catch((error) => {
        console.error('[BOOT] Step 2: prisma.$connect() - ERROR:', error);
        logger.error({ error }, '❌ Database connection failed on startup');
      });

    // 3. Connect to Redis asynchronously in the background
    console.log('[BOOT] Step 3: connectRedis() - START (async)');
    connectRedis()
      .then(() => {
        console.log('[BOOT] Step 3: connectRedis() - DONE');
      })
      .catch((error) => {
        console.error('[BOOT] Step 3: connectRedis() - ERROR:', error);
      });

    // 4. Configure Cloudinary
    console.log('[BOOT] Step 4: configureCloudinary() - START');
    configureCloudinary();
    console.log('[BOOT] Step 4: configureCloudinary() - DONE');

    // Graceful shutdown
    const shutdown = async (signal: string) => {
      logger.info(`${signal} received — shutting down gracefully...`);
      server.close(async () => {
        await prisma.$disconnect();
        await disconnectRedis();
        logger.info('👋 Server shut down');
        process.exit(0);
      });

      // Force shutdown after 10s
      setTimeout(() => {
        logger.error('Forced shutdown after 10s timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    // Handle unhandled rejections
    process.on('unhandledRejection', (reason) => {
      logger.error({ reason }, 'Unhandled Rejection');
    });

    process.on('uncaughtException', (error) => {
      logger.fatal({ error }, 'Uncaught Exception');
      process.exit(1);
    });
  } catch (error) {
    console.error('[BOOT] FATAL ERROR during bootstrap:', error);
    logger.fatal({ error }, 'Failed to start server');
    process.exit(1);
  }
}

bootstrap();
