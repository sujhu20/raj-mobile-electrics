// @ts-nocheck
import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { authorize } from '../../middleware/rbac';
import { validate } from '../../middleware/validate';
import { asyncHandler } from '../../utils/asyncHandler';
import { ApiResponse, AppError } from '../../utils/apiResponse';
import prisma from '../../config/database';
import { uploadMultiple } from '../../middleware/upload';
import { uploadToCloudinary, deleteFromCloudinary } from '../../config/cloudinary';
import { uploadLimiter } from '../../middleware/rateLimiter';
import { logger } from '../../utils/logger';
import { parsePagination, paginationSkip, buildPaginatedResult } from '../../utils/pagination';
import { deleteCachePattern, cacheKey, getCache, setCache } from '../../utils/cache';
import slug from 'slug';
import { z } from 'zod';

const router = Router();

// ============================================================================
// SCHEMAS
// ============================================================================

const createProductSchema = z.object({
  name: z.string().min(3).max(200),
  description: z.string().min(10),
  shortDescription: z.string().max(300).optional(),
  brand: z.string().min(1),
  model: z.string().optional(),
  sku: z.string().optional(),
  price: z.coerce.number().positive(),
  compareAtPrice: z.coerce.number().positive().optional(),
  costPrice: z.coerce.number().positive().optional(),
  stock: z.coerce.number().int().min(0).default(0),
  lowStockThreshold: z.coerce.number().int().min(0).default(5),
  isFeatured: z.coerce.boolean().default(false),
  isActive: z.coerce.boolean().default(true),
  weight: z.coerce.number().positive().optional(),
  categoryId: z.string().min(1),
  specifications: z.any().optional(),
  tags: z.array(z.string()).default([]),
});

const updateProductSchema = createProductSchema.partial();

// ============================================================================
// PUBLIC ROUTES
// ============================================================================

// List products with filters, sorting, pagination
router.get('/', asyncHandler(async (req, res) => {
  const pagination = parsePagination(req.query as Record<string, unknown>);
  const { category, brand, minPrice, maxPrice, rating, sort, search } = req.query;

  // Build where clause
  const where: any = { isActive: true };

  if (category) where.category = { slug: category as string };
  if (brand) where.brand = { equals: brand as string, mode: 'insensitive' };
  if (minPrice || maxPrice) {
    where.price = {};
    if (minPrice) where.price.gte = parseFloat(minPrice as string);
    if (maxPrice) where.price.lte = parseFloat(maxPrice as string);
  }
  if (rating) where.avgRating = { gte: parseFloat(rating as string) };
  if (search) {
    where.OR = [
      { name: { contains: search as string, mode: 'insensitive' } },
      { brand: { contains: search as string, mode: 'insensitive' } },
      { description: { contains: search as string, mode: 'insensitive' } },
    ];
  }

  // Build orderBy
  let orderBy: any = { createdAt: 'desc' };
  switch (sort) {
    case 'price_asc': orderBy = { price: 'asc' }; break;
    case 'price_desc': orderBy = { price: 'desc' }; break;
    case 'rating': orderBy = { avgRating: 'desc' }; break;
    case 'popular': orderBy = { totalSold: 'desc' }; break;
    case 'newest': orderBy = { createdAt: 'desc' }; break;
    case 'name_asc': orderBy = { name: 'asc' }; break;
    case 'name_desc': orderBy = { name: 'desc' }; break;
  }

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: {
        category: { select: { id: true, name: true, slug: true } },
        images: { where: { isPrimary: true }, take: 1 },
      },
      skip: paginationSkip(pagination),
      take: pagination.limit,
      orderBy,
    }),
    prisma.product.count({ where }),
  ]);

  const result = buildPaginatedResult(products, total, pagination);
  ApiResponse.paginated(res, result.data, result.pagination);
}));

// Get featured products
router.get('/featured', asyncHandler(async (req, res) => {
  const cached = await getCache(cacheKey('products', 'featured'));
  if (cached) { ApiResponse.success(res, cached); return; }

  const products = await prisma.product.findMany({
    where: { isFeatured: true, isActive: true },
    include: {
      category: { select: { id: true, name: true, slug: true } },
      images: { where: { isPrimary: true }, take: 1 },
    },
    take: 12,
    orderBy: { createdAt: 'desc' },
  });

  await setCache(cacheKey('products', 'featured'), products, 600);
  ApiResponse.success(res, products);
}));

// Get latest products
router.get('/latest', asyncHandler(async (req, res) => {
  const products = await prisma.product.findMany({
    where: { isActive: true },
    include: {
      category: { select: { id: true, name: true, slug: true } },
      images: { where: { isPrimary: true }, take: 1 },
    },
    take: 12,
    orderBy: { createdAt: 'desc' },
  });
  ApiResponse.success(res, products);
}));

// Get top selling products
router.get('/top-selling', asyncHandler(async (req, res) => {
  const products = await prisma.product.findMany({
    where: { isActive: true, totalSold: { gt: 0 } },
    include: {
      category: { select: { id: true, name: true, slug: true } },
      images: { where: { isPrimary: true }, take: 1 },
    },
    take: 12,
    orderBy: { totalSold: 'desc' },
  });
  ApiResponse.success(res, products);
}));

// Get product by slug
router.get('/:slug', asyncHandler(async (req, res) => {
  const product = await prisma.product.findUnique({
    where: { slug: req.params.slug },
    include: {
      category: { select: { id: true, name: true, slug: true } },
      images: { orderBy: { sortOrder: 'asc' } },
      reviews: {
        where: { isApproved: true },
        include: { user: { select: { id: true, firstName: true, lastName: true, avatar: true } } },
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
    },
  });

  if (!product || !product.isActive) {
    throw new AppError('Product not found', 404);
  }

  ApiResponse.success(res, product);
}));

// Get similar products
router.get('/:id/similar', asyncHandler(async (req, res) => {
  const product = await prisma.product.findUnique({ where: { id: req.params.id } });
  if (!product) throw new AppError('Product not found', 404);

  const similar = await prisma.product.findMany({
    where: {
      isActive: true,
      id: { not: product.id },
      OR: [
        { categoryId: product.categoryId },
        { brand: product.brand },
      ],
    },
    include: { images: { where: { isPrimary: true }, take: 1 } },
    take: 8,
    orderBy: { totalSold: 'desc' },
  });

  ApiResponse.success(res, similar);
}));

// ============================================================================
// ADMIN ROUTES
// ============================================================================

// Get product by ID (admin — includes inactive/draft products)
router.get('/admin/:id', authenticate, authorize('ADMIN'), asyncHandler(async (req, res) => {
  const product = await prisma.product.findUnique({
    where: { id: req.params.id },
    include: {
      category: { select: { id: true, name: true, slug: true } },
      images: { orderBy: { sortOrder: 'asc' } },
    },
  });

  if (!product) throw new AppError('Product not found', 404);
  ApiResponse.success(res, product);
}));

// Create product
router.post('/admin', authenticate, authorize('ADMIN'), validate({ body: createProductSchema }), asyncHandler(async (req, res) => {
  const productSlug = slug(req.body.name) + '-' + Date.now().toString(36);

  const product = await prisma.product.create({
    data: {
      ...req.body,
      slug: productSlug,
      specifications: req.body.specifications || {},
    },
    include: { category: true, images: true },
  });

  await deleteCachePattern('techhub:products:*');
  ApiResponse.created(res, product, 'Product created');
}));

// Update product
router.put('/admin/:id', authenticate, authorize('ADMIN'), validate({ body: updateProductSchema }), asyncHandler(async (req, res) => {
  const existing = await prisma.product.findUnique({ where: { id: req.params.id } });
  if (!existing) throw new AppError('Product not found', 404);

  const data: any = { ...req.body };
  if (req.body.name && req.body.name !== existing.name) {
    data.slug = slug(req.body.name) + '-' + Date.now().toString(36);
  }

  const product = await prisma.product.update({
    where: { id: req.params.id },
    data,
    include: { category: true, images: true },
  });

  await deleteCachePattern('techhub:products:*');
  ApiResponse.success(res, product, 'Product updated');
}));

// Delete product
router.delete('/admin/:id', authenticate, authorize('ADMIN'), asyncHandler(async (req, res) => {
  const product = await prisma.product.findUnique({
    where: { id: req.params.id },
    include: { images: true },
  });
  if (!product) throw new AppError('Product not found', 404);

  // Delete images from Cloudinary (handled gracefully)
  for (const image of product.images) {
    try {
      await deleteFromCloudinary(image.publicId);
    } catch (error: any) {
      logger.warn(`Failed to delete image ${image.publicId} from Cloudinary: ${error.message}`);
    }
  }

  await prisma.product.delete({ where: { id: req.params.id } });
  await deleteCachePattern('techhub:products:*');
  ApiResponse.success(res, null, 'Product deleted');
}));

// Upload images
router.post('/admin/:id/images', authenticate, authorize('ADMIN'), uploadLimiter, uploadMultiple, asyncHandler(async (req, res) => {
  const product = await prisma.product.findUnique({ where: { id: req.params.id } });
  if (!product) throw new AppError('Product not found', 404);

  const files = req.files as Express.Multer.File[];
  if (!files || files.length === 0) throw new AppError('No images provided', 400);

  const existingCount = await prisma.productImage.count({ where: { productId: product.id } });

  const uploadedImages = [];
  for (let i = 0; i < files.length; i++) {
    const result = await uploadToCloudinary(files[i].buffer, 'products');
    const image = await prisma.productImage.create({
      data: {
        productId: product.id,
        url: result.url,
        publicId: result.publicId,
        isPrimary: existingCount === 0 && i === 0,
        sortOrder: existingCount + i,
      },
    });
    uploadedImages.push(image);
  }

  await deleteCachePattern('techhub:products:*');
  ApiResponse.created(res, uploadedImages, 'Images uploaded');
}));

// Delete image
router.delete('/admin/:id/images/:imageId', authenticate, authorize('ADMIN'), asyncHandler(async (req, res) => {
  const image = await prisma.productImage.findFirst({
    where: { id: req.params.imageId, productId: req.params.id },
  });
  if (!image) throw new AppError('Image not found', 404);

  try {
    await deleteFromCloudinary(image.publicId);
  } catch (error: any) {
    logger.warn(`Failed to delete image ${image.publicId} from Cloudinary: ${error.message}`);
  }

  await prisma.productImage.delete({ where: { id: image.id } });
  await deleteCachePattern('techhub:products:*');
  ApiResponse.success(res, null, 'Image deleted');
}));

export default router;
