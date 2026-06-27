// @ts-nocheck
import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { authorize } from '../../middleware/rbac';
import { asyncHandler } from '../../utils/asyncHandler';
import { ApiResponse, AppError } from '../../utils/apiResponse';
import prisma from '../../config/database';
import { z } from 'zod';
import { validate } from '../../middleware/validate';

const router = Router();

const couponSchema = z.object({
  code: z.string().min(3).max(20).transform(v => v.toUpperCase()),
  description: z.string().optional(),
  type: z.enum(['PERCENTAGE', 'FIXED']),
  value: z.coerce.number().positive(),
  minOrderAmount: z.coerce.number().positive().optional(),
  maxDiscount: z.coerce.number().positive().optional(),
  usageLimit: z.coerce.number().int().positive().optional(),
  isActive: z.boolean().default(true),
  startsAt: z.coerce.date().optional(),
  expiresAt: z.coerce.date(),
});

// Validate coupon (customer)
router.post('/validate', authenticate, asyncHandler(async (req, res) => {
  const { code } = req.body;
  if (!code) throw new AppError('Coupon code is required', 400);

  const coupon = await prisma.coupon.findUnique({ where: { code: code.toUpperCase() } });
  if (!coupon) throw new AppError('Invalid coupon code', 404);
  if (!coupon.isActive) throw new AppError('Coupon is no longer active', 400);
  if (new Date() > coupon.expiresAt) throw new AppError('Coupon has expired', 400);
  if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) throw new AppError('Coupon usage limit reached', 400);

  ApiResponse.success(res, {
    code: coupon.code,
    type: coupon.type,
    value: coupon.value,
    minOrderAmount: coupon.minOrderAmount,
    maxDiscount: coupon.maxDiscount,
    description: coupon.description,
  });
}));

// Admin: List coupons
router.get('/admin', authenticate, authorize('ADMIN'), asyncHandler(async (req, res) => {
  const coupons = await prisma.coupon.findMany({ orderBy: { createdAt: 'desc' } });
  ApiResponse.success(res, coupons);
}));

// Admin: Create coupon
router.post('/admin', authenticate, authorize('ADMIN'), validate({ body: couponSchema }), asyncHandler(async (req, res) => {
  const coupon = await prisma.coupon.create({ data: req.body });
  ApiResponse.created(res, coupon, 'Coupon created');
}));

// Admin: Update coupon
router.put('/admin/:id', authenticate, authorize('ADMIN'), validate({ body: couponSchema.partial() }), asyncHandler(async (req, res) => {
  const existing = await prisma.coupon.findUnique({ where: { id: req.params.id } });
  if (!existing) throw new AppError('Coupon not found', 404);
  const coupon = await prisma.coupon.update({ where: { id: req.params.id }, data: req.body });
  ApiResponse.success(res, coupon, 'Coupon updated');
}));

// Admin: Delete coupon
router.delete('/admin/:id', authenticate, authorize('ADMIN'), asyncHandler(async (req, res) => {
  await prisma.coupon.delete({ where: { id: req.params.id } });
  ApiResponse.success(res, null, 'Coupon deleted');
}));

export default router;
