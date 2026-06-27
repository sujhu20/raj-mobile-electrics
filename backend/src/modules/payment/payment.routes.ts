// @ts-nocheck
import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { asyncHandler } from '../../utils/asyncHandler';
import { ApiResponse, AppError } from '../../utils/apiResponse';
import prisma from '../../config/database';
import { env } from '../../config/env';
import crypto from 'crypto';

const router = Router();

// ============================================================================
// STRIPE
// ============================================================================

router.post('/stripe/create-intent', authenticate, asyncHandler(async (req, res) => {
  const { orderId } = req.body;
  if (!env.STRIPE_SECRET_KEY) throw new AppError('Stripe not configured', 503);

  const Stripe = (await import('stripe')).default;
  const stripe = new Stripe(env.STRIPE_SECRET_KEY);

  const order = await prisma.order.findFirst({
    where: { id: orderId, userId: req.user!.userId },
    include: { payment: true },
  });
  if (!order) throw new AppError('Order not found', 404);
  if (order.payment?.status === 'COMPLETED') throw new AppError('Order already paid', 400);

  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(Number(order.total) * 100), // Convert to paisa/cents
    currency: 'npr',
    metadata: { orderId: order.id, orderNumber: order.orderNumber },
  });

  await prisma.payment.update({
    where: { orderId: order.id },
    data: { transactionId: paymentIntent.id },
  });

  ApiResponse.success(res, { clientSecret: paymentIntent.client_secret });
}));

// Stripe webhook
router.post('/stripe/webhook', asyncHandler(async (req, res) => {
  if (!env.STRIPE_SECRET_KEY || !env.STRIPE_WEBHOOK_SECRET) {
    throw new AppError('Stripe not configured', 503);
  }

  const Stripe = (await import('stripe')).default;
  const stripe = new Stripe(env.STRIPE_SECRET_KEY);

  const sig = req.headers['stripe-signature'] as string;
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, env.STRIPE_WEBHOOK_SECRET);
  } catch {
    throw new AppError('Invalid webhook signature', 400);
  }

  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object as any;
    const orderId = paymentIntent.metadata.orderId;

    await prisma.payment.update({
      where: { orderId },
      data: {
        status: 'COMPLETED',
        paidAt: new Date(),
        gatewayResponse: paymentIntent as any,
      },
    });

    await prisma.order.update({
      where: { id: orderId },
      data: { status: 'CONFIRMED' },
    });
  }

  ApiResponse.success(res, { received: true });
}));

// ============================================================================
// ESEWA
// ============================================================================

router.post('/esewa/initiate', authenticate, asyncHandler(async (req, res) => {
  const { orderId } = req.body;

  const order = await prisma.order.findFirst({
    where: { id: orderId, userId: req.user!.userId },
  });
  if (!order) throw new AppError('Order not found', 404);

  const amount = Number(order.total);
  const taxAmount = Number(order.tax);
  const productDeliveryCharge = Number(order.deliveryFee);
  const productServiceCharge = 0;
  const totalAmount = amount;

  // Generate signature
  const message = `total_amount=${totalAmount},transaction_uuid=${order.id},product_code=${env.ESEWA_MERCHANT_CODE}`;
  const signature = crypto
    .createHmac('sha256', env.ESEWA_SECRET_KEY || '')
    .update(message)
    .digest('base64');

  const formData = {
    amount: amount - taxAmount - productDeliveryCharge,
    tax_amount: taxAmount,
    total_amount: totalAmount,
    transaction_uuid: order.id,
    product_code: env.ESEWA_MERCHANT_CODE,
    product_service_charge: productServiceCharge,
    product_delivery_charge: productDeliveryCharge,
    success_url: `${env.FRONTEND_URL}/payment/esewa/success`,
    failure_url: `${env.FRONTEND_URL}/payment/esewa/failure`,
    signed_field_names: 'total_amount,transaction_uuid,product_code',
    signature,
  };

  ApiResponse.success(res, {
    paymentUrl: `${env.ESEWA_BASE_URL}/api/epay/main/v2/form`,
    formData,
  });
}));

// eSewa callback
router.get('/esewa/callback', asyncHandler(async (req, res) => {
  const { data } = req.query;
  if (!data) throw new AppError('Invalid callback data', 400);

  const decoded = JSON.parse(Buffer.from(data as string, 'base64').toString());
  const orderId = decoded.transaction_uuid;

  if (decoded.status === 'COMPLETE') {
    await prisma.payment.update({
      where: { orderId },
      data: {
        status: 'COMPLETED',
        transactionId: decoded.transaction_code,
        paidAt: new Date(),
        gatewayResponse: decoded,
      },
    });

    await prisma.order.update({
      where: { id: orderId },
      data: { status: 'CONFIRMED' },
    });
  }

  ApiResponse.success(res, { status: decoded.status });
}));

// ============================================================================
// KHALTI
// ============================================================================

router.post('/khalti/initiate', authenticate, asyncHandler(async (req, res) => {
  const { orderId } = req.body;
  if (!env.KHALTI_SECRET_KEY) throw new AppError('Khalti not configured', 503);

  const order = await prisma.order.findFirst({
    where: { id: orderId, userId: req.user!.userId },
    include: { user: true },
  });
  if (!order) throw new AppError('Order not found', 404);

  const response = await fetch(`${env.KHALTI_BASE_URL}/api/v2/epayment/initiate/`, {
    method: 'POST',
    headers: {
      'Authorization': `key ${env.KHALTI_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      return_url: `${env.FRONTEND_URL}/payment/khalti/callback`,
      website_url: env.FRONTEND_URL,
      amount: Math.round(Number(order.total) * 100), // In paisa
      purchase_order_id: order.id,
      purchase_order_name: `Order #${order.orderNumber}`,
      customer_info: {
        name: `${order.user.firstName} ${order.user.lastName}`,
        email: order.user.email,
        phone: order.user.phone || '',
      },
    }),
  });

  const khaltiResponse = await response.json() as any;

  if (!response.ok) throw new AppError('Failed to initiate Khalti payment', 500);

  await prisma.payment.update({
    where: { orderId: order.id },
    data: { transactionId: khaltiResponse.pidx },
  });

  ApiResponse.success(res, {
    paymentUrl: khaltiResponse.payment_url,
    pidx: khaltiResponse.pidx,
  });
}));

// Khalti verify
router.post('/khalti/verify', asyncHandler(async (req, res) => {
  const { pidx, orderId } = req.body;
  if (!env.KHALTI_SECRET_KEY) throw new AppError('Khalti not configured', 503);

  const response = await fetch(`${env.KHALTI_BASE_URL}/api/v2/epayment/lookup/`, {
    method: 'POST',
    headers: {
      'Authorization': `key ${env.KHALTI_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ pidx }),
  });

  const khaltiResponse = await response.json() as any;

  if (khaltiResponse.status === 'Completed') {
    await prisma.payment.update({
      where: { orderId },
      data: {
        status: 'COMPLETED',
        paidAt: new Date(),
        gatewayResponse: khaltiResponse,
      },
    });

    await prisma.order.update({
      where: { id: orderId },
      data: { status: 'CONFIRMED' },
    });

    ApiResponse.success(res, { verified: true });
  } else {
    ApiResponse.error(res, 'Payment verification failed', 400);
  }
}));

export default router;
