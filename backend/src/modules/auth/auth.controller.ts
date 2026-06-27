import { Request, Response } from 'express';
import { authService } from './auth.service';
import { ApiResponse } from '../../utils/apiResponse';
import { asyncHandler } from '../../utils/asyncHandler';

export class AuthController {
  register = asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.register(req.body);

    // Set refresh token in HTTP-only cookie
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    ApiResponse.created(res, {
      user: result.user,
      accessToken: result.accessToken,
    }, 'Registration successful. Please verify your email.');
  });

  login = asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.login(req.body);

    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    ApiResponse.success(res, {
      user: result.user,
      accessToken: result.accessToken,
    }, 'Login successful');
  });

  googleLogin = asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.googleLogin(req.body.credential);

    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    ApiResponse.success(res, {
      user: result.user,
      accessToken: result.accessToken,
    }, 'Google login successful');
  });

  refreshToken = asyncHandler(async (req: Request, res: Response) => {
    const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if (!refreshToken) {
      ApiResponse.unauthorized(res, 'Refresh token is required');
      return;
    }

    const result = await authService.refreshToken(refreshToken);

    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    ApiResponse.success(res, {
      accessToken: result.accessToken,
    }, 'Token refreshed');
  });

  logout = asyncHandler(async (req: Request, res: Response) => {
    if (req.user) {
      await authService.logout(req.user.userId);
    }

    res.clearCookie('refreshToken');
    ApiResponse.success(res, null, 'Logged out successfully');
  });

  forgotPassword = asyncHandler(async (req: Request, res: Response) => {
    await authService.forgotPassword(req.body.email);
    ApiResponse.success(res, null, 'If the email exists, a password reset link has been sent.');
  });

  resetPassword = asyncHandler(async (req: Request, res: Response) => {
    await authService.resetPassword(req.body.token, req.body.password);
    ApiResponse.success(res, null, 'Password reset successful. Please login with your new password.');
  });

  verifyEmail = asyncHandler(async (req: Request, res: Response) => {
    await authService.verifyEmail(req.body.token);
    ApiResponse.success(res, null, 'Email verified successfully');
  });
}

export const authController = new AuthController();
