// @ts-nocheck
import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { authorize } from '../../middleware/rbac';
import { validate } from '../../middleware/validate';
import { asyncHandler } from '../../utils/asyncHandler';
import { ApiResponse, AppError } from '../../utils/apiResponse';
import prisma from '../../config/database';
import { hashPassword, comparePassword } from '../../utils/hash';
import { z } from 'zod';

const router = Router();

// ============================================================================
// SCHEMAS
// ============================================================================

const updateProfileSchema = z.object({
  firstName: z.string().min(2).max(50).optional(),
  lastName: z.string().min(2).max(50).optional(),
  phone: z.string().optional(),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8)
    .regex(/[A-Z]/, 'Must contain uppercase')
    .regex(/[a-z]/, 'Must contain lowercase')
    .regex(/[0-9]/, 'Must contain number'),
});

const addressSchema = z.object({
  label: z.string().default('Home'),
  fullName: z.string().min(2),
  phone: z.string().min(7),
  street: z.string().min(3),
  city: z.string().min(2),
  state: z.string().min(2),
  zipCode: z.string().optional(),
  country: z.string().default('Nepal'),
  isDefault: z.boolean().default(false),
});

// ============================================================================
// CUSTOMER ROUTES
// ============================================================================

// Get current user profile
router.get('/me', authenticate, asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.userId },
    select: {
      id: true, email: true, firstName: true, lastName: true,
      phone: true, avatar: true, role: true, isVerified: true,
      provider: true, createdAt: true,
    },
  });
  ApiResponse.success(res, user);
}));

// Update profile
router.put('/me', authenticate, validate({ body: updateProfileSchema }), asyncHandler(async (req, res) => {
  const user = await prisma.user.update({
    where: { id: req.user!.userId },
    data: req.body,
    select: {
      id: true, email: true, firstName: true, lastName: true,
      phone: true, avatar: true, role: true,
    },
  });
  ApiResponse.success(res, user, 'Profile updated');
}));

// Change password
router.put('/me/password', authenticate, validate({ body: changePasswordSchema }), asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });
  if (!user?.password) throw new AppError('Cannot change password for OAuth accounts', 400);

  const isValid = await comparePassword(req.body.currentPassword, user.password);
  if (!isValid) throw new AppError('Current password is incorrect', 400);

  const hashed = await hashPassword(req.body.newPassword);
  await prisma.user.update({ where: { id: user.id }, data: { password: hashed, refreshToken: null } });
  ApiResponse.success(res, null, 'Password changed. Please login again.');
}));

// Get addresses
router.get('/me/addresses', authenticate, asyncHandler(async (req, res) => {
  const addresses = await prisma.address.findMany({
    where: { userId: req.user!.userId },
    orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
  });
  ApiResponse.success(res, addresses);
}));

// Add address
router.post('/me/addresses', authenticate, validate({ body: addressSchema }), asyncHandler(async (req, res) => {
  // If setting as default, unset others
  if (req.body.isDefault) {
    await prisma.address.updateMany({ where: { userId: req.user!.userId }, data: { isDefault: false } });
  }
  const address = await prisma.address.create({
    data: { ...req.body, userId: req.user!.userId },
  });
  ApiResponse.created(res, address, 'Address added');
}));

// Update address
router.put('/me/addresses/:id', authenticate, validate({ body: addressSchema }), asyncHandler(async (req, res) => {
  const address = await prisma.address.findFirst({ where: { id: req.params.id, userId: req.user!.userId } });
  if (!address) throw new AppError('Address not found', 404);

  if (req.body.isDefault) {
    await prisma.address.updateMany({ where: { userId: req.user!.userId }, data: { isDefault: false } });
  }
  const updated = await prisma.address.update({ where: { id: req.params.id }, data: req.body });
  ApiResponse.success(res, updated, 'Address updated');
}));

// Delete address
router.delete('/me/addresses/:id', authenticate, asyncHandler(async (req, res) => {
  const address = await prisma.address.findFirst({ where: { id: req.params.id, userId: req.user!.userId } });
  if (!address) throw new AppError('Address not found', 404);
  await prisma.address.delete({ where: { id: req.params.id } });
  ApiResponse.success(res, null, 'Address deleted');
}));

// ============================================================================
// ADMIN ROUTES
// ============================================================================

// List all users
router.get('/admin/users', authenticate, authorize('ADMIN'), asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const search = req.query.search as string;

  const where: any = {};
  if (search) {
    where.OR = [
      { firstName: { contains: search, mode: 'insensitive' } },
      { lastName: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true, email: true, firstName: true, lastName: true,
        phone: true, avatar: true, role: true, isVerified: true,
        isBlocked: true, provider: true, lastLoginAt: true, createdAt: true,
        _count: { select: { orders: true, reviews: true } },
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.user.count({ where }),
  ]);

  ApiResponse.paginated(res, users, {
    page, limit, total, totalPages: Math.ceil(total / limit),
    hasNext: page < Math.ceil(total / limit), hasPrev: page > 1,
  });
}));

// Get user details
router.get('/admin/users/:id', authenticate, authorize('ADMIN'), asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.params.id },
    select: {
      id: true, email: true, firstName: true, lastName: true,
      phone: true, avatar: true, role: true, isVerified: true,
      isBlocked: true, provider: true, lastLoginAt: true, createdAt: true,
      addresses: true,
      _count: { select: { orders: true, reviews: true } },
    },
  });
  if (!user) throw new AppError('User not found', 404);
  ApiResponse.success(res, user);
}));

// Block/unblock user
router.put('/admin/users/:id/block', authenticate, authorize('ADMIN'), asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.params.id } });
  if (!user) throw new AppError('User not found', 404);
  if (user.role === 'ADMIN') throw new AppError('Cannot block admin users', 400);

  const updated = await prisma.user.update({
    where: { id: req.params.id },
    data: { isBlocked: !user.isBlocked, refreshToken: null },
    select: { id: true, email: true, isBlocked: true },
  });
  ApiResponse.success(res, updated, updated.isBlocked ? 'User blocked' : 'User unblocked');
}));

// Change user role
router.put('/admin/users/:id/role', authenticate, authorize('ADMIN'), asyncHandler(async (req, res) => {
  const { role } = req.body;
  if (!['CUSTOMER', 'ADMIN'].includes(role)) throw new AppError('Invalid role', 400);

  const updated = await prisma.user.update({
    where: { id: req.params.id },
    data: { role },
    select: { id: true, email: true, role: true },
  });
  ApiResponse.success(res, updated, 'Role updated');
}));

export default router;
