import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { env } from './config/env';
import { generalLimiter } from './middleware/rateLimiter';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import prisma from './config/database';
import { getRedis, isRedisReady } from './config/redis';

// Import route modules
import authRoutes from './modules/auth/auth.routes';
import userRoutes from './modules/user/user.routes';
import productRoutes from './modules/product/product.routes';
import categoryRoutes from './modules/category/category.routes';
import cartRoutes from './modules/cart/cart.routes';
import wishlistRoutes from './modules/wishlist/wishlist.routes';
import orderRoutes from './modules/order/order.routes';
import paymentRoutes from './modules/payment/payment.routes';
import reviewRoutes from './modules/review/review.routes';
import couponRoutes from './modules/coupon/coupon.routes';
import bannerRoutes from './modules/banner/banner.routes';
import notificationRoutes from './modules/notification/notification.routes';
import analyticsRoutes from './modules/analytics/analytics.routes';
import searchRoutes from './modules/search/search.routes';

const app = express();

// ============================================================================
// TRUST PROXY — required when behind Coolify's Traefik reverse proxy
// Ensures rate limiting uses real client IPs, not the proxy IP
// ============================================================================
app.set('trust proxy', 1);

// ============================================================================
// GLOBAL MIDDLEWARE
// ============================================================================

// Security headers
app.use(helmet());

// CORS
app.use(
  cors({
    origin: env.FRONTEND_URL,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);

// Rate limiting
app.use('/api/', generalLimiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Cookie parsing
app.use(cookieParser());

// ============================================================================
// HEALTH / LIVENESS / READINESS ENDPOINTS
// Outside /api/ prefix to bypass rate limiting
// ============================================================================

// Liveness — confirms the process is alive (fastest check)
app.get('/live', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Readiness — confirms dependencies are reachable
app.get('/ready', async (_req, res) => {
  const checks: Record<string, string> = {};
  let allOk = true;

  // Database check
  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = 'ok';
  } catch {
    checks.database = 'error';
    allOk = false;
  }

  // Redis check (optional — not a hard failure for readiness)
  checks.redis = isRedisReady() ? 'ok' : 'unavailable';

  const statusCode = allOk ? 200 : 503;
  res.status(statusCode).json({
    status: allOk ? 'ready' : 'not_ready',
    checks,
  });
});

// Full health — for Coolify/Docker health checks and monitoring
app.get('/api/health', async (_req, res) => {
  const health: {
    status: string;
    uptime: number;
    environment: string;
    timestamp: string;
    database: string;
    redis: string;
  } = {
    status: 'ok',
    uptime: Math.floor(process.uptime()),
    environment: env.NODE_ENV,
    timestamp: new Date().toISOString(),
    database: 'unknown',
    redis: 'unknown',
  };

  // Database check
  try {
    await prisma.$queryRaw`SELECT 1`;
    health.database = 'connected';
  } catch {
    health.database = 'error';
    health.status = 'degraded';
  }

  // Redis check
  health.redis = isRedisReady() ? 'connected' : 'unavailable';

  const statusCode = health.status === 'ok' ? 200 : 503;
  res.status(statusCode).json({ success: true, data: health });
});

// ============================================================================
// API ROUTES
// ============================================================================

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/banners', bannerRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin/analytics', analyticsRoutes);
app.use('/api/search', searchRoutes);

// ============================================================================
// ERROR HANDLING
// ============================================================================

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
