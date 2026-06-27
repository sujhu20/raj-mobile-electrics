import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { FiMail, FiLock, FiEye, FiEyeOff } from 'react-icons/fi';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { login, clearError } from '../../store/slices/authSlice';
import { APP_NAME, ROLES, ROUTES } from '../../config/constants';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { isLoading, error } = useAppSelector((s) => s.auth);
  const [showPassword, setShowPassword] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    dispatch(clearError());
    const result = await dispatch(login(data));
    if (login.fulfilled.match(result)) {
      const user = result.payload as any;
      if (user?.role === ROLES.ADMIN) {
        navigate(ROUTES.ADMIN_DASHBOARD);
      } else {
        navigate(ROUTES.HOME);
      }
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <img src="/logo.jpg" alt={APP_NAME} className="w-10 h-10 rounded-xl object-cover" />
            <span className="text-2xl font-bold text-gradient">{APP_NAME}</span>
          </Link>
          <h1 className="text-2xl font-bold text-surface-900">Welcome back</h1>
          <p className="text-surface-700/60 text-sm mt-1">Sign in to your account to continue</p>
        </div>

        <div className="bg-white rounded-2xl shadow-card border border-surface-200/60 p-8">
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-danger-500/10 text-danger-500 text-sm font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1.5">Email</label>
              <div className="relative">
                <FiMail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-700/40" size={18} />
                <input
                  {...register('email')}
                  type="email"
                  placeholder="you@example.com"
                  className="w-full h-12 pl-11 pr-4 rounded-xl border border-surface-200 bg-surface-50 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition text-sm"
                  id="login-email"
                />
              </div>
              {errors.email && <p className="text-danger-500 text-xs mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1.5">Password</label>
              <div className="relative">
                <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-700/40" size={18} />
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  className="w-full h-12 pl-11 pr-12 rounded-xl border border-surface-200 bg-surface-50 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition text-sm"
                  id="login-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-surface-700/40 hover:text-surface-700 transition"
                >
                  {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                </button>
              </div>
              {errors.password && <p className="text-danger-500 text-xs mt-1">{errors.password.message}</p>}
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="rounded border-surface-200 text-primary-600 focus:ring-primary-500" />
                <span className="text-sm text-surface-700/70">Remember me</span>
              </label>
              <Link to="/forgot-password" className="text-sm text-primary-600 font-medium hover:text-primary-700 transition">
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 rounded-xl gradient-primary text-white font-semibold hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
              id="login-submit"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                  Signing in...
                </span>
              ) : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-surface-700/60">
              Don't have an account?{' '}
              <Link to="/register" className="text-primary-600 font-semibold hover:text-primary-700 transition">Sign Up</Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
