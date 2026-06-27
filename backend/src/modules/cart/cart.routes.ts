// @ts-nocheck
import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { asyncHandler } from '../../utils/asyncHandler';
import { ApiResponse, AppError } from '../../utils/apiResponse';
import prisma from '../../config/database';
import { z } from 'zod';
import { validate } from '../../middleware/validate';

const router = Router();

const addItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().min(1).default(1),
});

const updateItemSchema = z.object({
  quantity: z.number().int().min(1),
});

// Get cart
router.get('/', authenticate, asyncHandler(async (req, res) => {
  let cart = await prisma.cart.findUnique({
    where: { userId: req.user!.userId },
    include: {
      items: {
        include: {
          product: {
            include: { images: { where: { isPrimary: true }, take: 1 } },
          },
        },
        orderBy: { createdAt: 'desc' },
      },
      coupon: true,
    },
  });

  if (!cart) {
    cart = await prisma.cart.create({
      data: { userId: req.user!.userId },
      include: { items: { include: { product: { include: { images: true } } } }, coupon: true },
    });
  }

  // Calculate totals
  let subtotal = 0;
  const validItems = [];
  for (const item of cart.items) {
    if (item.product.isActive) {
      subtotal += Number(item.product.price) * item.quantity;
      validItems.push(item);
    }
  }

  let discount = 0;
  if (cart.coupon && cart.coupon.isActive && new Date() < cart.coupon.expiresAt) {
    if (cart.coupon.type === 'PERCENTAGE') {
      discount = subtotal * (Number(cart.coupon.value) / 100);
      if (cart.coupon.maxDiscount) discount = Math.min(discount, Number(cart.coupon.maxDiscount));
    } else {
      discount = Number(cart.coupon.value);
    }
  }

  const taxRate = parseInt(process.env.TAX_RATE || '13') / 100;
  const deliveryFee = subtotal >= (parseInt(process.env.FREE_DELIVERY_THRESHOLD || '5000'))
    ? 0 : parseInt(process.env.DELIVERY_FEE || '100');
  const tax = (subtotal - discount) * taxRate;
  const total = subtotal - discount + tax + deliveryFee;

  ApiResponse.success(res, {
    ...cart,
    items: validItems,
    summary: { subtotal, discount, tax, deliveryFee, total, itemCount: validItems.length },
  });
}));

// Add item to cart
router.post('/items', authenticate, validate({ body: addItemSchema }), asyncHandler(async (req, res) => {
  const { productId, quantity } = req.body;

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product || !product.isActive) throw new AppError('Product not found', 404);
  if (product.stock < quantity) throw new AppError(`Only ${product.stock} items available`, 400);

  let cart = await prisma.cart.findUnique({ where: { userId: req.user!.userId } });
  if (!cart) {
    cart = await prisma.cart.create({ data: { userId: req.user!.userId } });
  }

  // Check if item already in cart
  const existingItem = await prisma.cartItem.findUnique({
    where: { cartId_productId: { cartId: cart.id, productId } },
  });

  if (existingItem) {
    const newQty = existingItem.quantity + quantity;
    if (product.stock < newQty) throw new AppError(`Only ${product.stock} items available`, 400);
    await prisma.cartItem.update({ where: { id: existingItem.id }, data: { quantity: newQty } });
  } else {
    await prisma.cartItem.create({ data: { cartId: cart.id, productId, quantity } });
  }

  ApiResponse.success(res, null, 'Item added to cart');
}));

// Update item quantity
router.put('/items/:id', authenticate, validate({ body: updateItemSchema }), asyncHandler(async (req, res) => {
  const item = await prisma.cartItem.findFirst({
    where: { id: req.params.id },
    include: { cart: true, product: true },
  });
  if (!item || item.cart.userId !== req.user!.userId) throw new AppError('Cart item not found', 404);
  if (item.product.stock < req.body.quantity) throw new AppError(`Only ${item.product.stock} items available`, 400);

  await prisma.cartItem.update({ where: { id: item.id }, data: { quantity: req.body.quantity } });
  ApiResponse.success(res, null, 'Cart updated');
}));

// Remove item from cart
router.delete('/items/:id', authenticate, asyncHandler(async (req, res) => {
  const item = await prisma.cartItem.findFirst({
    where: { id: req.params.id },
    include: { cart: true },
  });
  if (!item || item.cart.userId !== req.user!.userId) throw new AppError('Cart item not found', 404);

  await prisma.cartItem.delete({ where: { id: item.id } });
  ApiResponse.success(res, null, 'Item removed from cart');
}));

// Clear cart
router.delete('/', authenticate, asyncHandler(async (req, res) => {
  const cart = await prisma.cart.findUnique({ where: { userId: req.user!.userId } });
  if (cart) {
    await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
    await prisma.cart.update({ where: { id: cart.id }, data: { couponId: null } });
  }
  ApiResponse.success(res, null, 'Cart cleared');
}));

// Apply coupon
router.post('/apply-coupon', authenticate, asyncHandler(async (req, res) => {
  const { code } = req.body;
  if (!code) throw new AppError('Coupon code is required', 400);

  const coupon = await prisma.coupon.findUnique({ where: { code: code.toUpperCase() } });
  if (!coupon) throw new AppError('Invalid coupon code', 404);
  if (!coupon.isActive) throw new AppError('This coupon is no longer active', 400);
  if (new Date() > coupon.expiresAt) throw new AppError('This coupon has expired', 400);
  if (new Date() < coupon.startsAt) throw new AppError('This coupon is not yet active', 400);
  if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) throw new AppError('Coupon usage limit reached', 400);

  const cart = await prisma.cart.findUnique({ where: { userId: req.user!.userId } });
  if (!cart) throw new AppError('Cart not found', 404);

  await prisma.cart.update({ where: { id: cart.id }, data: { couponId: coupon.id } });
  ApiResponse.success(res, coupon, 'Coupon applied');
}));

// Remove coupon
router.delete('/coupon', authenticate, asyncHandler(async (req, res) => {
  const cart = await prisma.cart.findUnique({ where: { userId: req.user!.userId } });
  if (cart) {
    await prisma.cart.update({ where: { id: cart.id }, data: { couponId: null } });
  }
  ApiResponse.success(res, null, 'Coupon removed');
}));

export default router;
