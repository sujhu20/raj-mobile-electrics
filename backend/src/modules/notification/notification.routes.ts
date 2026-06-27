// @ts-nocheck
import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { asyncHandler } from '../../utils/asyncHandler';
import { ApiResponse } from '../../utils/apiResponse';
import prisma from '../../config/database';

const router = Router();

// Get user notifications
router.get('/', authenticate, asyncHandler(async (req, res) => {
  const notifications = await prisma.notification.findMany({
    where: { userId: req.user!.userId },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  const unreadCount = await prisma.notification.count({
    where: { userId: req.user!.userId, isRead: false },
  });

  ApiResponse.success(res, { notifications, unreadCount });
}));

// Mark as read
router.put('/:id/read', authenticate, asyncHandler(async (req, res) => {
  await prisma.notification.updateMany({
    where: { id: req.params.id, userId: req.user!.userId },
    data: { isRead: true },
  });
  ApiResponse.success(res, null, 'Notification marked as read');
}));

// Mark all as read
router.put('/read-all', authenticate, asyncHandler(async (req, res) => {
  await prisma.notification.updateMany({
    where: { userId: req.user!.userId, isRead: false },
    data: { isRead: true },
  });
  ApiResponse.success(res, null, 'All notifications marked as read');
}));

export default router;
