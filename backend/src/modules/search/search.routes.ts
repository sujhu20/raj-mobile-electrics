// @ts-nocheck
import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { ApiResponse } from '../../utils/apiResponse';
import prisma from '../../config/database';

const router = Router();

// Full-text search
router.get('/', asyncHandler(async (req, res) => {
  const { q, page: pageStr = '1', limit: limitStr = '12' } = req.query;
  const query = (q as string || '').trim();
  const page = parseInt(pageStr as string);
  const limit = parseInt(limitStr as string);

  if (!query) {
    ApiResponse.success(res, { products: [], categories: [], total: 0 });
    return;
  }

  const [products, total, categories] = await Promise.all([
    prisma.product.findMany({
      where: {
        isActive: true,
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { brand: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
          { model: { contains: query, mode: 'insensitive' } },
          { tags: { hasSome: [query.toLowerCase()] } },
        ],
      },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        images: { where: { isPrimary: true }, take: 1 },
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { totalSold: 'desc' },
    }),
    prisma.product.count({
      where: {
        isActive: true,
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { brand: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
        ],
      },
    }),
    prisma.category.findMany({
      where: {
        isActive: true,
        name: { contains: query, mode: 'insensitive' },
      },
      take: 5,
    }),
  ]);

  ApiResponse.success(res, {
    products,
    categories,
    pagination: {
      page, limit, total, totalPages: Math.ceil(total / limit),
      hasNext: page < Math.ceil(total / limit), hasPrev: page > 1,
    },
  });
}));

// Search suggestions
router.get('/suggestions', asyncHandler(async (req, res) => {
  const { q } = req.query;
  const query = (q as string || '').trim();

  if (query.length < 2) {
    ApiResponse.success(res, []);
    return;
  }

  const [products, brands, categories] = await Promise.all([
    prisma.product.findMany({
      where: { isActive: true, name: { contains: query, mode: 'insensitive' } },
      select: { name: true, slug: true },
      take: 5,
    }),
    prisma.product.findMany({
      where: { isActive: true, brand: { contains: query, mode: 'insensitive' } },
      select: { brand: true },
      distinct: ['brand'],
      take: 3,
    }),
    prisma.category.findMany({
      where: { isActive: true, name: { contains: query, mode: 'insensitive' } },
      select: { name: true, slug: true },
      take: 3,
    }),
  ]);

  const suggestions = [
    ...products.map(p => ({ type: 'product', text: p.name, slug: p.slug })),
    ...brands.map(b => ({ type: 'brand', text: b.brand })),
    ...categories.map(c => ({ type: 'category', text: c.name, slug: c.slug })),
  ];

  ApiResponse.success(res, suggestions);
}));

export default router;
