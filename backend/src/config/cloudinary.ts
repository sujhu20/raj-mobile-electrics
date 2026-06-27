import { v2 as cloudinary } from 'cloudinary';
import { env } from './env';
import { logger } from '../utils/logger';

export function configureCloudinary(): void {
  if (env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET) {
    cloudinary.config({
      cloud_name: env.CLOUDINARY_CLOUD_NAME,
      api_key: env.CLOUDINARY_API_KEY,
      api_secret: env.CLOUDINARY_API_SECRET,
      secure: true,
    });
    logger.info('✅ Cloudinary configured');
  } else {
    logger.warn('⚠️ Cloudinary credentials not set — image upload disabled');
  }
}

export { cloudinary };

/**
 * Upload a file buffer to Cloudinary
 */
export async function uploadToCloudinary(
  fileBuffer: Buffer,
  folder: string = 'products'
): Promise<{ url: string; publicId: string }> {
  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        {
          folder: `techhub/${folder}`,
          resource_type: 'image',
          transformation: [
            { width: 1200, height: 1200, crop: 'limit', quality: 'auto:good', format: 'webp' },
          ],
        },
        (error, result) => {
          if (error || !result) {
            reject(error || new Error('Upload failed'));
          } else {
            resolve({
              url: result.secure_url,
              publicId: result.public_id,
            });
          }
        }
      )
      .end(fileBuffer);
  });
}

/**
 * Delete a file from Cloudinary by public ID
 */
export async function deleteFromCloudinary(publicId: string): Promise<void> {
  await cloudinary.uploader.destroy(publicId);
}
