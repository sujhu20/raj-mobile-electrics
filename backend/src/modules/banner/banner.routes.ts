// @ts-nocheck
import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { authorize } from '../../middleware/rbac';
import { asyncHandler } from '../../utils/asyncHandler';
import { ApiResponse, AppError } from '../../utils/apiResponse';
import prisma from '../../config/database';
import { uploadSingle } from '../../middleware/upload';
import { uploadToCloudinary, deleteFromCloudinary } from '../../config/cloudinary';
import { getCache, setCache, deleteCachePattern, cacheKey } from '../../utils/cache';
import { uploadLimiter } from '../../middleware/rateLimiter';
import { logger } from '../../utils/logger';

const router = Router();

// Get active banners (public)
router.get('/', asyncHandler(async (req, res) => {
  const cached = await getCache(cacheKey('banners', 'active'));
  if (cached) { ApiResponse.success(res, cached); return; }

  const banners = await prisma.banner.findMany({
    where: {
      isActive: true,
      startsAt: { lte: new Date() },
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
    orderBy: { sortOrder: 'asc' },
  });

  await setCache(cacheKey('banners', 'active'), banners, 1800);
  ApiResponse.success(res, banners);
}));

// Admin: List all banners
router.get('/admin', authenticate, authorize('ADMIN'), asyncHandler(async (req, res) => {
  const banners = await prisma.banner.findMany({ orderBy: { sortOrder: 'asc' } });
  ApiResponse.success(res, banners);
}));

// Admin: Create banner
router.post('/admin', authenticate, authorize('ADMIN'), uploadLimiter, uploadSingle, asyncHandler(async (req, res) => {
  if (!req.file) throw new AppError('Banner image is required', 400);

  const { url, publicId } = await uploadToCloudinary(req.file.buffer, 'banners');

  const banner = await prisma.banner.create({
    data: {
      title: req.body.title,
      subtitle: req.body.subtitle,
      imageUrl: url,
      publicId,
      linkUrl: req.body.linkUrl,
      type: req.body.type || 'HERO',
      isActive: req.body.isActive !== 'false',
      sortOrder: parseInt(req.body.sortOrder) || 0,
      expiresAt: req.body.expiresAt ? new Date(req.body.expiresAt) : null,
    },
  });

  await deleteCachePattern('techhub:banners:*');
  ApiResponse.created(res, banner, 'Banner created');
}));

// Admin: Update banner
router.put('/admin/:id', authenticate, authorize('ADMIN'), uploadLimiter, uploadSingle, asyncHandler(async (req, res) => {
  const existing = await prisma.banner.findUnique({ where: { id: req.params.id } });
  if (!existing) throw new AppError('Banner not found', 404);

  const data: any = {
    title: req.body.title || existing.title,
    subtitle: req.body.subtitle,
    linkUrl: req.body.linkUrl,
    type: req.body.type || existing.type,
    isActive: req.body.isActive !== undefined ? req.body.isActive !== 'false' : existing.isActive,
    sortOrder: req.body.sortOrder ? parseInt(req.body.sortOrder) : existing.sortOrder,
    expiresAt: req.body.expiresAt ? new Date(req.body.expiresAt) : existing.expiresAt,
  };

  if (req.file) {
    try {
      await deleteFromCloudinary(existing.publicId);
    } catch (error: any) {
      logger.warn(`Failed to delete banner image ${existing.publicId} from Cloudinary: ${error.message}`);
    }
    const { url, publicId } = await uploadToCloudinary(req.file.buffer, 'banners');
    data.imageUrl = url;
    data.publicId = publicId;
  }

  const banner = await prisma.banner.update({ where: { id: req.params.id }, data });
  await deleteCachePattern('techhub:banners:*');
  ApiResponse.success(res, banner, 'Banner updated');
}));

// Admin: Delete banner
router.delete('/admin/:id', authenticate, authorize('ADMIN'), asyncHandler(async (req, res) => {
  const banner = await prisma.banner.findUnique({ where: { id: req.params.id } });
  if (!banner) throw new AppError('Banner not found', 404);

  try {
    await deleteFromCloudinary(banner.publicId);
  } catch (error: any) {
    logger.warn(`Failed to delete banner image ${banner.publicId} from Cloudinary: ${error.message}`);
  }

  await prisma.banner.delete({ where: { id: req.params.id } });
  await deleteCachePattern('techhub:banners:*');
  ApiResponse.success(res, null, 'Banner deleted');
}));

export default router;
