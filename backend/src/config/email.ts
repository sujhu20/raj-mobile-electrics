import { Resend } from 'resend';
import { env } from './env';
import { logger } from '../utils/logger';

let resend: Resend | null = null;

export function getResend(): Resend | null {
  if (!resend && env.RESEND_API_KEY) {
    resend = new Resend(env.RESEND_API_KEY);
    logger.info('✅ Resend email client configured');
  }
  return resend;
}

export default getResend;
