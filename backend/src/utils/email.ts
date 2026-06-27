import { getResend } from '../config/email';
import { env } from '../config/env';
import { logger } from './logger';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

/**
 * Send an email using Resend
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  const resend = getResend();
  if (!resend) {
    logger.warn(`Email not sent (Resend not configured): ${options.subject} → ${options.to}`);
    return false;
  }

  try {
    await resend.emails.send({
      from: `${env.APP_NAME} <${env.FROM_EMAIL}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
    });
    logger.info(`Email sent: ${options.subject} → ${options.to}`);
    return true;
  } catch (error) {
    logger.error({ error }, `Failed to send email: ${options.subject} → ${options.to}`);
    return false;
  }
}

// ============================================================================
// EMAIL TEMPLATES
// ============================================================================

export function welcomeEmailTemplate(name: string, verifyUrl: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; background: #f4f4f7; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 40px auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 32px; text-align: center; }
        .header h1 { color: #fff; margin: 0; font-size: 28px; }
        .body { padding: 32px; color: #333; line-height: 1.6; }
        .btn { display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #fff; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
        .footer { padding: 24px 32px; text-align: center; color: #888; font-size: 13px; border-top: 1px solid #eee; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Welcome to ${env.APP_NAME}!</h1>
        </div>
        <div class="body">
          <p>Hi ${name},</p>
          <p>Thank you for joining ${env.APP_NAME}! We're excited to have you on board.</p>
          <p>Please verify your email address to get started:</p>
          <a href="${verifyUrl}" class="btn">Verify Email</a>
          <p>If you didn't create an account, you can safely ignore this email.</p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} ${env.APP_NAME}. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

export function passwordResetTemplate(name: string, resetUrl: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; background: #f4f4f7; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 40px auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
        .header { background: linear-gradient(135deg, #f5365c 0%, #f56036 100%); padding: 40px 32px; text-align: center; }
        .header h1 { color: #fff; margin: 0; font-size: 28px; }
        .body { padding: 32px; color: #333; line-height: 1.6; }
        .btn { display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #f5365c 0%, #f56036 100%); color: #fff; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
        .footer { padding: 24px 32px; text-align: center; color: #888; font-size: 13px; border-top: 1px solid #eee; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Password Reset</h1>
        </div>
        <div class="body">
          <p>Hi ${name},</p>
          <p>You requested a password reset. Click the button below to set a new password:</p>
          <a href="${resetUrl}" class="btn">Reset Password</a>
          <p>This link expires in 1 hour.</p>
          <p>If you didn't request this, please ignore this email.</p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} ${env.APP_NAME}. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

export function orderConfirmationTemplate(
  name: string,
  orderNumber: string,
  total: string,
  itemCount: number
): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; background: #f4f4f7; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 40px auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
        .header { background: linear-gradient(135deg, #2dce89 0%, #2dcecc 100%); padding: 40px 32px; text-align: center; }
        .header h1 { color: #fff; margin: 0; font-size: 28px; }
        .body { padding: 32px; color: #333; line-height: 1.6; }
        .order-box { background: #f7f7fa; border-radius: 8px; padding: 20px; margin: 20px 0; }
        .order-box p { margin: 8px 0; }
        .order-box .total { font-size: 24px; font-weight: 700; color: #2dce89; }
        .footer { padding: 24px 32px; text-align: center; color: #888; font-size: 13px; border-top: 1px solid #eee; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Order Confirmed! ✓</h1>
        </div>
        <div class="body">
          <p>Hi ${name},</p>
          <p>Your order has been placed successfully!</p>
          <div class="order-box">
            <p><strong>Order #:</strong> ${orderNumber}</p>
            <p><strong>Items:</strong> ${itemCount} item(s)</p>
            <p class="total">${total}</p>
          </div>
          <p>We'll send you tracking updates as your order progresses.</p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} ${env.APP_NAME}. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

export function orderStatusUpdateTemplate(
  name: string,
  orderNumber: string,
  status: string
): string {
  const statusColors: Record<string, string> = {
    CONFIRMED: '#2dce89',
    PACKED: '#fb6340',
    SHIPPED: '#5e72e4',
    DELIVERED: '#2dce89',
    CANCELLED: '#f5365c',
  };
  const color = statusColors[status] || '#5e72e4';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; background: #f4f4f7; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 40px auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
        .header { background: linear-gradient(135deg, ${color} 0%, ${color}cc 100%); padding: 40px 32px; text-align: center; }
        .header h1 { color: #fff; margin: 0; font-size: 28px; }
        .body { padding: 32px; color: #333; line-height: 1.6; }
        .status { display: inline-block; padding: 8px 20px; background: ${color}; color: #fff; border-radius: 20px; font-weight: 600; font-size: 16px; margin: 16px 0; }
        .footer { padding: 24px 32px; text-align: center; color: #888; font-size: 13px; border-top: 1px solid #eee; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Order Update</h1>
        </div>
        <div class="body">
          <p>Hi ${name},</p>
          <p>Your order <strong>#${orderNumber}</strong> has been updated:</p>
          <p><span class="status">${status}</span></p>
          <p>You can track your order anytime from your account.</p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} ${env.APP_NAME}. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}
