import app from './app';
import { env } from './config/env';
import { logger } from './utils/logger';
import prisma from './config/database';
import { connectRedis, disconnectRedis } from './config/redis';
import { configureCloudinary } from './config/cloudinary';

async function bootstrap(): Promise<void> {
  try {
    // Connect to database
    await prisma.$connect();
    logger.info('✅ Database connected');

    // Connect to Redis (optional — continues if unavailable)
    await connectRedis();

    // Configure Cloudinary
    configureCloudinary();

    // Start server
    const server = app.listen(env.PORT, () => {
      logger.info(`🚀 ${env.APP_NAME} API running on port ${env.PORT}`);
      logger.info(`📍 Environment: ${env.NODE_ENV}`);
      logger.info(`🌐 Frontend URL: ${env.FRONTEND_URL}`);
    });

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
    logger.fatal({ error }, 'Failed to start server');
    process.exit(1);
  }
}

bootstrap();
