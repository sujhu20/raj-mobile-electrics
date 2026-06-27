// @ts-nocheck
import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { asyncHandler } from '../../utils/asyncHandler';
import { ApiResponse, AppError } from '../../utils/apiResponse';
import prisma from '../../config/database';

const router = Router();

// Get wishlist
router.get('/', authenticate, asyncHandler(async (req, res) => {
  const items = await prisma.wishlist.findMany({
    where: { userId: req.user!.userId },
    include: {
      product: {
        include: {
          images: { where: { isPrimary: true }, take: 1 },
          category: { select: { id: true, name: true, slug: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
  ApiResponse.success(res, items);
}));

// Add to wishlist
router.post('/:productId', authenticate, asyncHandler(async (req, res) => {
  const product = await prisma.product.findUnique({ where: { id: req.params.productId } });
  if (!product) throw new AppError('Product not found', 404);

  const existing = await prisma.wishlist.findUnique({
    where: { userId_productId: { userId: req.user!.userId, productId: req.params.productId } },
  });
  if (existing) { ApiResponse.success(res, existing, 'Already in wishlist'); return; }

  const item = await prisma.wishlist.create({
    data: { userId: req.user!.userId, productId: req.params.productId },
  });
  ApiResponse.created(res, item, 'Added to wishlist');
}));

// Remove from wishlist
router.delete('/:productId', authenticate, asyncHandler(async (req, res) => {
  await prisma.wishlist.deleteMany({
    where: { userId: req.user!.userId, productId: req.params.productId },
  });
  ApiResponse.success(res, null, 'Removed from wishlist');
}));

// Move to cart
router.post('/:productId/move-to-cart', authenticate, asyncHandler(async (req, res) => {
  const product = await prisma.product.findUnique({ where: { id: req.params.productId } });
  if (!product || !product.isActive) throw new AppError('Product not available', 404);
  if (product.stock < 1) throw new AppError('Product out of stock', 400);

  let cart = await prisma.cart.findUnique({ where: { userId: req.user!.userId } });
  if (!cart) cart = await prisma.cart.create({ data: { userId: req.user!.userId } });

  const existingItem = await prisma.cartItem.findUnique({
    where: { cartId_productId: { cartId: cart.id, productId: req.params.productId } },
  });

  if (existingItem) {
    await prisma.cartItem.update({ where: { id: existingItem.id }, data: { quantity: existingItem.quantity + 1 } });
  } else {
    await prisma.cartItem.create({ data: { cartId: cart.id, productId: req.params.productId, quantity: 1 } });
  }

  // Remove from wishlist
  await prisma.wishlist.deleteMany({ where: { userId: req.user!.userId, productId: req.params.productId } });
  ApiResponse.success(res, null, 'Moved to cart');
}));

export default router;
