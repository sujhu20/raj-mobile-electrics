import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  // Server
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(5000),
  FRONTEND_URL: z.string().url().default('http://localhost:5173'),

  // Database
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),

  // Redis
  REDIS_URL: z.string().default('redis://localhost:6379'),

  // JWT
  JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET must be at least 32 characters'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 characters'),
  JWT_ACCESS_EXPIRY: z.string().default('15m'),
  JWT_REFRESH_EXPIRY: z.string().default('7d'),

  // Google OAuth
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),

  // Cloudinary
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),

  // Resend
  RESEND_API_KEY: z.string().optional(),
  FROM_EMAIL: z.string().email().default('rajmobileandelectrics@gmail.com'),

  // Stripe
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),

  // eSewa
  ESEWA_MERCHANT_CODE: z.string().optional(),
  ESEWA_SECRET_KEY: z.string().optional(),
  ESEWA_BASE_URL: z.string().default('https://rc-epay.esewa.com.np'),

  // Khalti
  KHALTI_SECRET_KEY: z.string().optional(),
  KHALTI_BASE_URL: z.string().default('https://a.khalti.com'),

  // App
  APP_NAME: z.string().default('Raj Mobile & Electrics'),
  DEFAULT_CURRENCY: z.string().default('NPR'),
  TAX_RATE: z.coerce.number().default(13),
  DELIVERY_FEE: z.coerce.number().default(100),
  FREE_DELIVERY_THRESHOLD: z.coerce.number().default(5000),
  ADMIN_EMAIL: z.string().email().default('admin@rajmobileandelectrics.com'),
  ADMIN_PASSWORD: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:');
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
export type Env = z.infer<typeof envSchema>;
