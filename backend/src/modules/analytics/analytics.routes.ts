// @ts-nocheck
import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { authorize } from '../../middleware/rbac';
import { asyncHandler } from '../../utils/asyncHandler';
import { ApiResponse } from '../../utils/apiResponse';
import prisma from '../../config/database';

const router = Router();

// All analytics routes require admin auth
router.use(authenticate, authorize('ADMIN'));

// Dashboard summary
router.get('/dashboard', asyncHandler(async (req, res) => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const [
    totalRevenue, monthlyRevenue, lastMonthRevenue,
    totalOrders, monthlyOrders, pendingOrders,
    totalProducts, totalUsers, lowStockProducts,
  ] = await Promise.all([
    prisma.payment.aggregate({ where: { status: 'COMPLETED' }, _sum: { amount: true } }),
    prisma.payment.aggregate({
      where: { status: 'COMPLETED', paidAt: { gte: startOfMonth } }, _sum: { amount: true },
    }),
    prisma.payment.aggregate({
      where: { status: 'COMPLETED', paidAt: { gte: startOfLastMonth, lt: startOfMonth } },
      _sum: { amount: true },
    }),
    prisma.order.count(),
    prisma.order.count({ where: { createdAt: { gte: startOfMonth } } }),
    prisma.order.count({ where: { status: 'PENDING' } }),
    prisma.product.count({ where: { isActive: true } }),
    prisma.user.count({ where: { role: 'CUSTOMER' } }),
    prisma.product.count({ where: { isActive: true, stock: { lte: 5 } } }),
  ]);

  const revenueGrowth = lastMonthRevenue._sum.amount
    ? ((Number(monthlyRevenue._sum.amount || 0) - Number(lastMonthRevenue._sum.amount)) /
      Number(lastMonthRevenue._sum.amount) * 100).toFixed(1)
    : '0';

  ApiResponse.success(res, {
    revenue: {
      total: Number(totalRevenue._sum.amount || 0),
      monthly: Number(monthlyRevenue._sum.amount || 0),
      growth: parseFloat(revenueGrowth as string),
    },
    orders: { total: totalOrders, monthly: monthlyOrders, pending: pendingOrders },
    products: { total: totalProducts, lowStock: lowStockProducts },
    users: { total: totalUsers },
  });
}));

// Revenue stats
router.get('/revenue', asyncHandler(async (req, res) => {
  const { period = 'monthly', year = new Date().getFullYear() } = req.query;

  const payments = await prisma.payment.findMany({
    where: {
      status: 'COMPLETED',
      paidAt: {
        gte: new Date(`${year}-01-01`),
        lt: new Date(`${Number(year) + 1}-01-01`),
      },
    },
    select: { amount: true, paidAt: true },
    orderBy: { paidAt: 'asc' },
  });

  // Group by month
  const monthlyData = Array.from({ length: 12 }, (_, i) => ({
    month: new Date(0, i).toLocaleString('en', { month: 'short' }),
    revenue: 0,
    orders: 0,
  }));

  payments.forEach((p) => {
    if (p.paidAt) {
      const month = p.paidAt.getMonth();
      monthlyData[month].revenue += Number(p.amount);
      monthlyData[month].orders += 1;
    }
  });

  ApiResponse.success(res, monthlyData);
}));

// Sales by period
router.get('/sales', asyncHandler(async (req, res) => {
  const days = parseInt(req.query.days as string) || 30;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const orders = await prisma.order.findMany({
    where: { createdAt: { gte: startDate }, status: { not: 'CANCELLED' } },
    select: { total: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  });

  // Group by date
  const salesByDate: Record<string, { date: string; sales: number; orders: number }> = {};
  orders.forEach((o) => {
    const date = o.createdAt.toISOString().slice(0, 10);
    if (!salesByDate[date]) salesByDate[date] = { date, sales: 0, orders: 0 };
    salesByDate[date].sales += Number(o.total);
    salesByDate[date].orders += 1;
  });

  ApiResponse.success(res, Object.values(salesByDate));
}));

// Top selling products
router.get('/top-products', asyncHandler(async (req, res) => {
  const products = await prisma.product.findMany({
    where: { isActive: true },
    select: {
      id: true, name: true, slug: true, brand: true,
      price: true, totalSold: true, stock: true,
      images: { where: { isPrimary: true }, take: 1 },
    },
    orderBy: { totalSold: 'desc' },
    take: 10,
  });
  ApiResponse.success(res, products);
}));

// Reports
router.get('/reports', asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  const start = startDate ? new Date(startDate as string) : new Date(new Date().setMonth(new Date().getMonth() - 1));
  const end = endDate ? new Date(endDate as string) : new Date();

  const [orders, revenue, topProducts, ordersByStatus] = await Promise.all([
    prisma.order.count({ where: { createdAt: { gte: start, lte: end } } }),
    prisma.payment.aggregate({
      where: { status: 'COMPLETED', paidAt: { gte: start, lte: end } },
      _sum: { amount: true },
    }),
    prisma.orderItem.groupBy({
      by: ['productId'],
      where: { order: { createdAt: { gte: start, lte: end }, status: { not: 'CANCELLED' } } },
      _sum: { quantity: true, total: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: 10,
    }),
    prisma.order.groupBy({
      by: ['status'],
      where: { createdAt: { gte: start, lte: end } },
      _count: true,
    }),
  ]);

  ApiResponse.success(res, {
    period: { start, end },
    totalOrders: orders,
    totalRevenue: Number(revenue._sum.amount || 0),
    topProducts,
    ordersByStatus,
  });
}));

export default router;
