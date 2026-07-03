import prisma from '../../config/database';
import { hashPassword, comparePassword } from '../../utils/hash';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  generateRandomToken,
  TokenPayload,
} from '../../utils/jwt';
import { sendEmail, welcomeEmailTemplate, passwordResetTemplate } from '../../utils/email';
import { env } from '../../config/env';
import { AppError } from '../../utils/apiResponse';
import { RegisterInput, LoginInput } from './auth.schema';

export class AuthService {
  /**
   * Register a new user
   */
  async register(data: RegisterInput) {
    console.log("REGISTER Service Started");
    console.log('[REGISTER] START');

    // Check if user exists
    console.log("STEP 1 findUnique START");
    console.log('[REGISTER] Step 1: findUnique - START');
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    console.log("STEP 1 findUnique END");
    console.log('[REGISTER] Step 1: findUnique - DONE', !!existing);
    if (existing) {
      throw new AppError('Email already registered', 409);
    }

    // Hash password
    console.log("STEP 2 hashPassword START");
    console.log('[REGISTER] Step 2: hashPassword - START');
    const hashedPassword = await hashPassword(data.password);
    console.log("STEP 2 hashPassword END");
    console.log('[REGISTER] Step 2: hashPassword - DONE');

    // Generate verification token
    const verifyToken = generateRandomToken();
    console.log('[REGISTER] Step 3: verifyToken generated');

    // Create user
    console.log("STEP 4 createUser START");
    console.log('[REGISTER] Step 4: prisma.user.create - START');
    const user = await prisma.user.create({
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        password: hashedPassword,
        phone: data.phone,
        verifyToken,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isVerified: true,
        createdAt: true,
      },
    });
    console.log("STEP 4 createUser END");
    console.log('[REGISTER] Step 4: prisma.user.create - DONE', user.id);

    // Create empty cart for user
    console.log("STEP 5 createCart START");
    console.log('[REGISTER] Step 5: prisma.cart.create - START');
    await prisma.cart.create({
      data: { userId: user.id },
    });
    console.log("STEP 5 createCart END");
    console.log('[REGISTER] Step 5: prisma.cart.create - DONE');

    // Send verification email
    console.log("STEP 6 sendEmail START");
    console.log('[REGISTER] Step 6: sendEmail - FIRE AND FORGET');
    const verifyUrl = `${env.FRONTEND_URL}/verify-email?token=${verifyToken}`;
    sendEmail({
      to: user.email,
      subject: `Welcome to ${env.APP_NAME} — Verify Your Email`,
      html: welcomeEmailTemplate(user.firstName, verifyUrl),
    }).catch((err) => {
      console.error('[REGISTER] sendEmail failed:', err);
    });
    console.log("STEP 6 sendEmail END");
    console.log('[REGISTER] Step 6: sendEmail - dispatched (not awaited)');

    // Generate tokens
    console.log("STEP 7 generateToken START");
    console.log('[REGISTER] Step 7: JWT generation - START');
    const payload: TokenPayload = { userId: user.id, role: user.role };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);
    console.log("STEP 7 generateToken END");
    console.log('[REGISTER] Step 7: JWT generation - DONE');

    // Store refresh token
    console.log("STEP 8 updateRefreshToken START");
    console.log('[REGISTER] Step 8: prisma.user.update (refreshToken) - START');
    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken },
    });
    console.log("STEP 8 updateRefreshToken END");
    console.log('[REGISTER] Step 8: prisma.user.update (refreshToken) - DONE');

    console.log('[REGISTER] END - returning result');
    console.log("REGISTER Service Finished");
    return { user, accessToken, refreshToken };
  }

  /**
   * Login with email and password
   */
  async login(data: LoginInput) {
    console.log("LOGIN Service Started");
    console.log("LOGIN STEP 1 findUnique START for email:", JSON.stringify(data.email));
    const user = await prisma.user.findUnique({
      where: { email: data.email },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        password: true,
        role: true,
        isVerified: true,
        isBlocked: true,
        avatar: true,
      },
    });
    console.log("LOGIN STEP 1 findUnique END, user found:", user ? JSON.stringify(user.email) : 'NULL');

    if (!user || !user.password) {
      throw new AppError('Invalid email or password', 401);
    }

    if (user.isBlocked) {
      throw new AppError('Your account has been blocked. Please contact support.', 403);
    }

    console.log("LOGIN STEP 2 comparePassword START");
    const isValidPassword = await comparePassword(data.password, user.password);
    console.log("LOGIN STEP 2 comparePassword END");
    if (!isValidPassword) {
      throw new AppError('Invalid email or password', 401);
    }

    // Generate tokens
    console.log("LOGIN STEP 3 generateTokens START");
    const payload: TokenPayload = { userId: user.id, role: user.role };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);
    console.log("LOGIN STEP 3 generateTokens END");

    // Update last login and refresh token
    console.log("LOGIN STEP 4 updateLastLogin START");
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date(), refreshToken },
    });
    console.log("LOGIN STEP 4 updateLastLogin END");

    const { password: _, ...safeUser } = user;
    console.log("LOGIN Service Finished");
    return { user: safeUser, accessToken, refreshToken };
  }

  /**
   * Google OAuth login/register
   */
  async googleLogin(credential: string) {
    // Verify Google token
    const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`);
    if (!response.ok) {
      throw new AppError('Invalid Google credential', 401);
    }

    const googleUser = (await response.json()) as {
      sub: string;
      email: string;
      given_name: string;
      family_name: string;
      picture: string;
      email_verified: string;
    };

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { email: googleUser.email },
    });

    if (user && user.isBlocked) {
      throw new AppError('Your account has been blocked', 403);
    }

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: googleUser.email,
          firstName: googleUser.given_name || 'User',
          lastName: googleUser.family_name || '',
          avatar: googleUser.picture,
          provider: 'GOOGLE',
          providerId: googleUser.sub,
          isVerified: true,
        },
      });

      // Create empty cart
      await prisma.cart.create({
        data: { userId: user.id },
      });
    }

    // Generate tokens
    const payload: TokenPayload = { userId: user.id, role: user.role };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date(), refreshToken },
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        avatar: user.avatar,
        isVerified: user.isVerified,
      },
      accessToken,
      refreshToken,
    };
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string) {
    let payload: TokenPayload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      throw new AppError('Invalid or expired refresh token', 401);
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, role: true, refreshToken: true, isBlocked: true },
    });

    if (!user || user.refreshToken !== refreshToken) {
      throw new AppError('Invalid refresh token', 401);
    }

    if (user.isBlocked) {
      throw new AppError('Account blocked', 403);
    }

    // Rotate tokens
    const newPayload: TokenPayload = { userId: user.id, role: user.role };
    const newAccessToken = generateAccessToken(newPayload);
    const newRefreshToken = generateRefreshToken(newPayload);

    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: newRefreshToken },
    });

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  }

  /**
   * Logout — invalidate refresh token
   */
  async logout(userId: string) {
    await prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null },
    });
  }

  /**
   * Forgot password — send reset email
   */
  async forgotPassword(email: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Don't reveal if email exists
      return;
    }

    const resetToken = generateRandomToken();
    const resetTokenExp = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.user.update({
      where: { id: user.id },
      data: { resetToken, resetTokenExp },
    });

    const resetUrl = `${env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    // Fire-and-forget — don't block the response on email delivery
    sendEmail({
      to: user.email,
      subject: `${env.APP_NAME} — Reset Your Password`,
      html: passwordResetTemplate(user.firstName, resetUrl),
    }).catch((err) => {
      console.error('[FORGOT_PASSWORD] sendEmail failed:', err);
    });
  }

  /**
   * Reset password with token
   */
  async resetPassword(token: string, newPassword: string) {
    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExp: { gt: new Date() },
      },
    });

    if (!user) {
      throw new AppError('Invalid or expired reset token', 400);
    }

    const hashedPassword = await hashPassword(newPassword);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExp: null,
        refreshToken: null, // Invalidate all sessions
      },
    });
  }

  /**
   * Verify email address
   */
  async verifyEmail(token: string) {
    const user = await prisma.user.findFirst({
      where: { verifyToken: token },
    });

    if (!user) {
      throw new AppError('Invalid verification token', 400);
    }

    if (user.isVerified) {
      return; // Already verified
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { isVerified: true, verifyToken: null },
    });
  }
}

export const authService = new AuthService();
