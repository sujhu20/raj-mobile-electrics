// @ts-nocheck
import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { authorize } from '../../middleware/rbac';
import { asyncHandler } from '../../utils/asyncHandler';
import { ApiResponse, AppError } from '../../utils/apiResponse';
import prisma from '../../config/database';
import { sendEmail, orderConfirmationTemplate, orderStatusUpdateTemplate } from '../../utils/email';
import { env } from '../../config/env';

const router = Router();

// Generate order number: MH-YYYYMMDD-XXX
function generateOrderNumber(): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `MH-${date}-${random}`;
}

// ============================================================================
// CUSTOMER ROUTES
// ============================================================================

// Create order (checkout)
router.post('/', authenticate, asyncHandler(async (req, res) => {
  const { addressId, paymentMethod, notes } = req.body;

  if (!addressId) throw new AppError('Shipping address is required', 400);
  if (!paymentMethod) throw new AppError('Payment method is required', 400);

  // Verify address belongs to user
  const address = await prisma.address.findFirst({
    where: { id: addressId, userId: req.user!.userId },
  });
  if (!address) throw new AppError('Address not found', 404);

  // Get cart with items
  const cart = await prisma.cart.findUnique({
    where: { userId: req.user!.userId },
    include: {
      items: { include: { product: true } },
      coupon: true,
    },
  });
  if (!cart || cart.items.length === 0) throw new AppError('Cart is empty', 400);

  // Validate stock and calculate totals
  let subtotal = 0;
  const orderItems: { productId: string; quantity: number; price: number; total: number }[] = [];

  for (const item of cart.items) {
    if (!item.product.isActive) throw new AppError(`${item.product.name} is no longer available`, 400);
    if (item.product.stock < item.quantity) {
      throw new AppError(`Only ${item.product.stock} of ${item.product.name} available`, 400);
    }
    const price = Number(item.product.price);
    const total = price * item.quantity;
    subtotal += total;
    orderItems.push({ productId: item.productId, quantity: item.quantity, price, total });
  }

  // Calculate discount
  let discount = 0;
  let couponId: string | null = null;
  if (cart.coupon && cart.coupon.isActive && new Date() < cart.coupon.expiresAt) {
    if (cart.coupon.minOrderAmount && subtotal < Number(cart.coupon.minOrderAmount)) {
      throw new AppError(`Minimum order amount of Rs. ${cart.coupon.minOrderAmount} required for this coupon`, 400);
    }
    if (cart.coupon.type === 'PERCENTAGE') {
      discount = subtotal * (Number(cart.coupon.value) / 100);
      if (cart.coupon.maxDiscount) discount = Math.min(discount, Number(cart.coupon.maxDiscount));
    } else {
      discount = Number(cart.coupon.value);
    }
    couponId = cart.coupon.id;
  }

  const taxRate = env.TAX_RATE / 100;
  const deliveryFee = subtotal >= env.FREE_DELIVERY_THRESHOLD ? 0 : env.DELIVERY_FEE;
  const tax = (subtotal - discount) * taxRate;
  const total = subtotal - discount + tax + deliveryFee;

  // Create order in a transaction
  const order = await prisma.$transaction(async (tx) => {
    // Create order
    const order = await tx.order.create({
      data: {
        orderNumber: generateOrderNumber(),
        userId: req.user!.userId,
        addressId,
        couponId,
        subtotal,
        discount,
        tax,
        deliveryFee,
        total,
        notes,
        status: 'PENDING',
        estimatedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        items: { create: orderItems },
      },
      include: { items: { include: { product: true } } },
    });

    // Create payment record
    await tx.payment.create({
      data: {
        orderId: order.id,
        method: paymentMethod,
        amount: total,
        status: paymentMethod === 'COD' ? 'PENDING' : 'PENDING',
      },
    });

    // Reduce stock
    for (const item of orderItems) {
      await tx.product.update({
        where: { id: item.productId },
        data: {
          stock: { decrement: item.quantity },
          totalSold: { increment: item.quantity },
        },
      });
    }

    // Update coupon usage
    if (couponId) {
      await tx.coupon.update({ where: { id: couponId }, data: { usedCount: { increment: 1 } } });
    }

    // Clear cart
    await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
    await tx.cart.update({ where: { id: cart.id }, data: { couponId: null } });

    // Create notification
    await tx.notification.create({
      data: {
        userId: req.user!.userId,
        type: 'ORDER_UPDATE',
        title: 'Order Placed',
        message: `Your order #${order.orderNumber} has been placed successfully.`,
        data: { orderId: order.id },
      },
    });

    return order;
  }, {
    maxWait: 20000,
    timeout: 40000,
  });

  // Send confirmation email (non-blocking)
  const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });
  if (user) {
    sendEmail({
      to: user.email,
      subject: `Order Confirmed — #${order.orderNumber}`,
      html: orderConfirmationTemplate(
        user.firstName, order.orderNumber,
        `Rs. ${total.toFixed(2)}`, orderItems.length
      ),
    }).catch(() => {});
  }

  ApiResponse.created(res, order, 'Order placed successfully');
}));

// Get user's orders
router.get('/', authenticate, asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const status = req.query.status as string;

  const where: any = { userId: req.user!.userId };
  if (status) where.status = status;

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: {
        items: {
          include: { product: { include: { images: { where: { isPrimary: true }, take: 1 } } } },
        },
        payment: { select: { method: true, status: true } },
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.order.count({ where }),
  ]);

  ApiResponse.paginated(res, orders, {
    page, limit, total, totalPages: Math.ceil(total / limit),
    hasNext: page < Math.ceil(total / limit), hasPrev: page > 1,
  });
}));

// Get order detail
router.get('/:id', authenticate, asyncHandler(async (req, res) => {
  const order = await prisma.order.findFirst({
    where: { id: req.params.id, userId: req.user!.userId },
    include: {
      items: {
        include: { product: { include: { images: { where: { isPrimary: true }, take: 1 } } } },
      },
      payment: true,
      address: true,
      coupon: { select: { code: true, type: true, value: true } },
    },
  });
  if (!order) throw new AppError('Order not found', 404);
  ApiResponse.success(res, order);
}));

// Cancel order
router.post('/:id/cancel', authenticate, asyncHandler(async (req, res) => {
  const order = await prisma.order.findFirst({
    where: { id: req.params.id, userId: req.user!.userId },
    include: { items: true },
  });
  if (!order) throw new AppError('Order not found', 404);
  if (!['PENDING', 'CONFIRMED'].includes(order.status)) {
    throw new AppError('Order cannot be cancelled at this stage', 400);
  }

  await prisma.$transaction(async (tx) => {
    // Update order status
    await tx.order.update({
      where: { id: order.id },
      data: { status: 'CANCELLED', cancelReason: req.body.reason, cancelledAt: new Date() },
    });

    // Restore stock
    for (const item of order.items) {
      await tx.product.update({
        where: { id: item.productId },
        data: {
          stock: { increment: item.quantity },
          totalSold: { decrement: item.quantity },
        },
      });
    }

    // Update payment
    await tx.payment.updateMany({
      where: { orderId: order.id },
      data: { status: 'REFUNDED' },
    });

    // Notification
    await tx.notification.create({
      data: {
        userId: req.user!.userId,
        type: 'ORDER_UPDATE',
        title: 'Order Cancelled',
        message: `Your order #${order.orderNumber} has been cancelled.`,
        data: { orderId: order.id },
      },
    });
  }, {
    maxWait: 20000,
    timeout: 40000,
  });

  ApiResponse.success(res, null, 'Order cancelled');
}));

// ============================================================================
// ADMIN ROUTES
// ============================================================================

// List all orders
router.get('/admin/all', authenticate, authorize('ADMIN'), asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const status = req.query.status as string;
  const search = req.query.search as string;

  const where: any = {};
  if (status) where.status = status;
  if (search) {
    where.OR = [
      { orderNumber: { contains: search, mode: 'insensitive' } },
      { user: { email: { contains: search, mode: 'insensitive' } } },
      { user: { firstName: { contains: search, mode: 'insensitive' } } },
    ];
  }

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
        items: { include: { product: { select: { name: true } } } },
        payment: { select: { method: true, status: true } },
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.order.count({ where }),
  ]);

  ApiResponse.paginated(res, orders, {
    page, limit, total, totalPages: Math.ceil(total / limit),
    hasNext: page < Math.ceil(total / limit), hasPrev: page > 1,
  });
}));

// Admin: Get order detail
router.get('/admin/:id', authenticate, authorize('ADMIN'), asyncHandler(async (req, res) => {
  const order = await prisma.order.findUnique({
    where: { id: req.params.id },
    include: {
      user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
      items: { include: { product: { include: { images: { where: { isPrimary: true }, take: 1 } } } } },
      payment: true,
      address: true,
      coupon: true,
    },
  });
  if (!order) throw new AppError('Order not found', 404);
  ApiResponse.success(res, order);
}));

// Admin: Update order status
router.put('/admin/:id/status', authenticate, authorize('ADMIN'), asyncHandler(async (req, res) => {
  const { status } = req.body;
  const validStatuses = ['PENDING', 'CONFIRMED', 'PACKED', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
  if (!validStatuses.includes(status)) throw new AppError('Invalid status', 400);

  const order = await prisma.order.findUnique({
    where: { id: req.params.id },
    include: { user: true, items: true },
  });
  if (!order) throw new AppError('Order not found', 404);

  const data: any = { status };
  if (status === 'DELIVERED') {
    data.deliveredAt = new Date();
    // Mark payment as completed for COD
    await prisma.payment.updateMany({
      where: { orderId: order.id, method: 'COD' },
      data: { status: 'COMPLETED', paidAt: new Date() },
    });
  }
  if (status === 'CANCELLED') {
    data.cancelledAt = new Date();
    data.cancelReason = req.body.reason || 'Cancelled by admin';
    // Restore stock
    for (const item of order.items) {
      await prisma.product.update({
        where: { id: item.productId },
        data: { stock: { increment: item.quantity }, totalSold: { decrement: item.quantity } },
      });
    }
  }

  await prisma.order.update({ where: { id: order.id }, data });

  // Notification
  await prisma.notification.create({
    data: {
      userId: order.userId,
      type: 'ORDER_UPDATE',
      title: `Order ${status}`,
      message: `Your order #${order.orderNumber} has been ${status.toLowerCase()}.`,
      data: { orderId: order.id },
    },
  });

  // Email (non-blocking)
  sendEmail({
    to: order.user.email,
    subject: `Order #${order.orderNumber} — ${status}`,
    html: orderStatusUpdateTemplate(order.user.firstName, order.orderNumber, status),
  }).catch(() => {});

  ApiResponse.success(res, null, `Order status updated to ${status}`);
}));

export default router;
