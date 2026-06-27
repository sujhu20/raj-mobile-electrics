// @ts-nocheck
import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { authorize } from '../../middleware/rbac';
import { asyncHandler } from '../../utils/asyncHandler';
import { ApiResponse, AppError } from '../../utils/apiResponse';
import prisma from '../../config/database';
import { getCache, setCache, deleteCachePattern, cacheKey } from '../../utils/cache';
import slug from 'slug';
import { z } from 'zod';
import { validate } from '../../middleware/validate';

const router = Router();

const categorySchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().optional(),
  image: z.string().url().optional(),
  parentId: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
});

// Get all categories (tree structure)
router.get('/', asyncHandler(async (req, res) => {
  const cached = await getCache(cacheKey('categories', 'tree'));
  if (cached) { ApiResponse.success(res, cached); return; }

  const categories = await prisma.category.findMany({
    where: { isActive: true, parentId: null },
    include: {
      children: {
        where: { isActive: true },
        include: { children: { where: { isActive: true } } },
        orderBy: { sortOrder: 'asc' },
      },
      _count: { select: { products: true } },
    },
    orderBy: { sortOrder: 'asc' },
  });

  await setCache(cacheKey('categories', 'tree'), categories, 1800);
  ApiResponse.success(res, categories);
}));

// Get category by slug with products
router.get('/:slug', asyncHandler(async (req, res) => {
  const category = await prisma.category.findUnique({
    where: { slug: req.params.slug },
    include: {
      children: { where: { isActive: true } },
      products: {
        where: { isActive: true },
        include: { images: { where: { isPrimary: true }, take: 1 } },
        take: 20,
        orderBy: { createdAt: 'desc' },
      },
    },
  });
  if (!category) throw new AppError('Category not found', 404);
  ApiResponse.success(res, category);
}));

// Admin: Create category
router.post('/admin', authenticate, authorize('ADMIN'), validate({ body: categorySchema }), asyncHandler(async (req, res) => {
  const categorySlug = slug(req.body.name);
  const category = await prisma.category.create({
    data: { ...req.body, slug: categorySlug },
  });
  await deleteCachePattern('techhub:categories:*');
  ApiResponse.created(res, category, 'Category created');
}));

// Admin: Update category
router.put('/admin/:id', authenticate, authorize('ADMIN'), validate({ body: categorySchema.partial() }), asyncHandler(async (req, res) => {
  const existing = await prisma.category.findUnique({ where: { id: req.params.id } });
  if (!existing) throw new AppError('Category not found', 404);

  const data: any = { ...req.body };
  if (req.body.name && req.body.name !== existing.name) {
    data.slug = slug(req.body.name);
  }

  const category = await prisma.category.update({ where: { id: req.params.id }, data });
  await deleteCachePattern('techhub:categories:*');
  ApiResponse.success(res, category, 'Category updated');
}));

// Admin: Delete category
router.delete('/admin/:id', authenticate, authorize('ADMIN'), asyncHandler(async (req, res) => {
  const category = await prisma.category.findUnique({
    where: { id: req.params.id },
    include: { _count: { select: { products: true, children: true } } },
  });
  if (!category) throw new AppError('Category not found', 404);
  if (category._count.products > 0) throw new AppError('Cannot delete category with products', 400);
  if (category._count.children > 0) throw new AppError('Cannot delete category with subcategories', 400);

  await prisma.category.delete({ where: { id: req.params.id } });
  await deleteCachePattern('techhub:categories:*');
  ApiResponse.success(res, null, 'Category deleted');
}));

export default router;
