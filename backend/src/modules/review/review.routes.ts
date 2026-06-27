// @ts-nocheck
import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { authorize } from '../../middleware/rbac';
import { asyncHandler } from '../../utils/asyncHandler';
import { ApiResponse, AppError } from '../../utils/apiResponse';
import prisma from '../../config/database';

const router = Router();

// Get product reviews (mounted at /api/products/:productId/reviews via app.ts redirect)
// But we also mount directly for standalone access
router.get('/product/:productId', asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;

  const [reviews, total] = await Promise.all([
    prisma.review.findMany({
      where: { productId: req.params.productId, isApproved: true },
      include: { user: { select: { id: true, firstName: true, lastName: true, avatar: true } } },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.review.count({ where: { productId: req.params.productId, isApproved: true } }),
  ]);

  // Get rating distribution
  const ratings = await (prisma.review as any).groupBy({
    by: ['rating'],
    where: { productId: req.params.productId as string, isApproved: true },
    _count: true,
  });

  ApiResponse.paginated(res, reviews, {
    page, limit, total, totalPages: Math.ceil(total / limit),
    hasNext: page < Math.ceil(total / limit), hasPrev: page > 1,
  });
}));

// Add review (verified buyer only)
router.post('/product/:productId', authenticate, asyncHandler(async (req, res) => {
  const { rating, title, comment } = req.body;
  if (!rating || rating < 1 || rating > 5) throw new AppError('Rating must be between 1 and 5', 400);
  if (!comment) throw new AppError('Comment is required', 400);

  // Check if user has purchased this product
  const hasPurchased = await prisma.orderItem.findFirst({
    where: {
      productId: req.params.productId,
      order: { userId: req.user!.userId, status: 'DELIVERED' },
    },
  });

  // Check for existing review
  const existing = await prisma.review.findUnique({
    where: {
      userId_productId: { userId: req.user!.userId, productId: req.params.productId },
    },
  });
  if (existing) throw new AppError('You have already reviewed this product', 400);

  const review = await prisma.review.create({
    data: {
      userId: req.user!.userId,
      productId: req.params.productId,
      rating,
      title,
      comment,
      isVerified: !!hasPurchased,
      isApproved: false, // Requires admin approval
    },
    include: { user: { select: { firstName: true, lastName: true } } },
  });

  ApiResponse.created(res, review, 'Review submitted. It will be visible after approval.');
}));

// Update own review
router.put('/:id', authenticate, asyncHandler(async (req, res) => {
  const review = await prisma.review.findFirst({ where: { id: req.params.id, userId: req.user!.userId } });
  if (!review) throw new AppError('Review not found', 404);

  const updated = await prisma.review.update({
    where: { id: req.params.id },
    data: { ...req.body, isApproved: false }, // Re-approve after edit
  });
  ApiResponse.success(res, updated, 'Review updated');
}));

// Delete own review
router.delete('/:id', authenticate, asyncHandler(async (req, res) => {
  const review = await prisma.review.findFirst({ where: { id: req.params.id, userId: req.user!.userId } });
  if (!review) throw new AppError('Review not found', 404);

  await prisma.review.delete({ where: { id: req.params.id } });

  // Recalculate product rating
  const stats = await prisma.review.aggregate({
    where: { productId: review.productId, isApproved: true },
    _avg: { rating: true },
    _count: true,
  });
  await prisma.product.update({
    where: { id: review.productId },
    data: { avgRating: stats._avg.rating || 0, reviewCount: stats._count },
  });

  ApiResponse.success(res, null, 'Review deleted');
}));

// Admin: List all reviews
router.get('/admin/all', authenticate, authorize('ADMIN'), asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const status = req.query.status as string; // approved, pending

  const where: any = {};
  if (status === 'pending') where.isApproved = false;
  if (status === 'approved') where.isApproved = true;

  const [reviews, total] = await Promise.all([
    prisma.review.findMany({
      where,
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
        product: { select: { id: true, name: true, slug: true } },
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.review.count({ where }),
  ]);

  ApiResponse.paginated(res, reviews, {
    page, limit, total, totalPages: Math.ceil(total / limit),
    hasNext: page < Math.ceil(total / limit), hasPrev: page > 1,
  });
}));

// Admin: Approve review
router.put('/admin/:id/approve', authenticate, authorize('ADMIN'), asyncHandler(async (req, res) => {
  const review = await prisma.review.findUnique({ where: { id: req.params.id } });
  if (!review) throw new AppError('Review not found', 404);

  await prisma.review.update({ where: { id: req.params.id }, data: { isApproved: true } });

  // Recalculate product rating
  const stats = await prisma.review.aggregate({
    where: { productId: review.productId, isApproved: true },
    _avg: { rating: true },
    _count: true,
  });
  await prisma.product.update({
    where: { id: review.productId },
    data: { avgRating: stats._avg.rating || 0, reviewCount: stats._count },
  });

  ApiResponse.success(res, null, 'Review approved');
}));

// Admin: Delete review
router.delete('/admin/:id', authenticate, authorize('ADMIN'), asyncHandler(async (req, res) => {
  const review = await prisma.review.findUnique({ where: { id: req.params.id } });
  if (!review) throw new AppError('Review not found', 404);

  await prisma.review.delete({ where: { id: req.params.id } });

  // Recalculate product rating
  const stats = await prisma.review.aggregate({
    where: { productId: review.productId, isApproved: true },
    _avg: { rating: true },
    _count: true,
  });
  await prisma.product.update({
    where: { id: review.productId },
    data: { avgRating: stats._avg.rating || 0, reviewCount: stats._count },
  });

  ApiResponse.success(res, null, 'Review deleted');
}));

export default router;
