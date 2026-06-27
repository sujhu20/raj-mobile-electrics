import multer from 'multer';
import { Request } from 'express';
import { AppError } from '../utils/apiResponse';

// File filter — only allow images
const imageFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/avif'];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError('Only JPEG, PNG, WebP, and AVIF images are allowed', 400));
  }
};

/**
 * Multer upload configuration — stores files in memory (buffer)
 * for direct upload to Cloudinary
 */
export const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: imageFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
    files: 10, // Max 10 files per request
  },
});

/**
 * Single image upload middleware
 */
export const uploadSingle = upload.single('image');

/**
 * Multiple images upload middleware (max 10)
 */
export const uploadMultiple = upload.array('images', 10);
