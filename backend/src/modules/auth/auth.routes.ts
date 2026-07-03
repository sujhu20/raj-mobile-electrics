// @ts-nocheck
import { Router } from 'express';
import { authController } from './auth.controller';
import { validate } from '../../middleware/validate';
import { authenticate } from '../../middleware/auth';
import { authLimiter } from '../../middleware/rateLimiter';
import {
  registerSchema,
  loginSchema,
  googleLoginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyEmailSchema,
} from './auth.schema';

const router = Router();

router.post('/register', (req, res, next) => { console.log("REGISTER ROUTE HIT"); next(); }, authLimiter, validate({ body: registerSchema }), authController.register);
router.post('/login', (req, res, next) => { console.log("LOGIN ROUTE HIT"); next(); }, authLimiter, validate({ body: loginSchema }), authController.login);
router.post('/google', authLimiter, validate({ body: googleLoginSchema }), authController.googleLogin);
router.post('/refresh', authController.refreshToken);
router.post('/logout', authenticate, authController.logout);
router.post('/forgot-password', authLimiter, validate({ body: forgotPasswordSchema }), authController.forgotPassword);
router.post('/reset-password', authLimiter, validate({ body: resetPasswordSchema }), authController.resetPassword);
router.post('/verify-email', authLimiter, validate({ body: verifyEmailSchema }), authController.verifyEmail);

export default router;
