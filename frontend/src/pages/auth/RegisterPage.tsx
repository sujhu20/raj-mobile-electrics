import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { FiMail, FiLock, FiUser, FiPhone, FiEye, FiEyeOff } from 'react-icons/fi';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { register as registerAction, clearError } from '../../store/slices/authSlice';
import { APP_NAME } from '../../config/constants';

const registerSchema = z.object({
  firstName: z.string().min(2, 'Min 2 characters'),
  lastName: z.string().min(2, 'Min 2 characters'),
  email: z.string().email('Invalid email'),
  phone: z
    .string()
    .regex(/^[0-9+\-\s()]{7,15}$/, 'Enter a valid phone number')
    .optional()
    .or(z.literal('')),
  password: z.string()
    .min(8, 'Min 8 characters')
    .regex(/[A-Z]/, 'Need uppercase')
    .regex(/[a-z]/, 'Need lowercase')
    .regex(/[0-9]/, 'Need number')
    .regex(/[^A-Za-z0-9]/, 'Need special char'),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Passwords do not match', path: ['confirmPassword'],
});

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { isLoading, error } = useAppSelector((s) => s.auth);
  const [showPassword, setShowPassword] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterForm) => {
    dispatch(clearError());
    const result = await dispatch(registerAction({
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      password: data.password,
      phone: data.phone || undefined,
    }));
    if (registerAction.fulfilled.match(result)) navigate('/');
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <img src="/logo.jpg" alt={APP_NAME} className="w-10 h-10 rounded-xl object-cover" />
            <span className="text-2xl font-bold text-gradient">{APP_NAME}</span>
          </Link>
          <h1 className="text-2xl font-bold">Create Account</h1>
          <p className="text-surface-700/60 text-sm mt-1">Join {APP_NAME} to start shopping</p>
        </div>

        <div className="bg-white rounded-2xl shadow-card border border-surface-200/60 p-8">
          {error && <div className="mb-4 p-3 rounded-xl bg-danger-500/10 text-danger-500 text-sm font-medium">{error}</div>}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Name row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-surface-700 mb-1.5">First Name</label>
                <div className="relative">
                  <FiUser className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-700/40" size={16} />
                  <input {...register('firstName')} placeholder="John" className="w-full h-12 pl-10 pr-4 rounded-xl border border-surface-200 bg-surface-50 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition text-sm" />
                </div>
                {errors.firstName && <p className="text-danger-500 text-xs mt-1">{errors.firstName.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-surface-700 mb-1.5">Last Name</label>
                <input {...register('lastName')} placeholder="Doe" className="w-full h-12 px-4 rounded-xl border border-surface-200 bg-surface-50 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition text-sm" />
                {errors.lastName && <p className="text-danger-500 text-xs mt-1">{errors.lastName.message}</p>}
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1.5">Email</label>
              <div className="relative">
                <FiMail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-700/40" size={18} />
                <input {...register('email')} type="email" placeholder="you@example.com" className="w-full h-12 pl-11 pr-4 rounded-xl border border-surface-200 bg-surface-50 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition text-sm" />
              </div>
              {errors.email && <p className="text-danger-500 text-xs mt-1">{errors.email.message}</p>}
            </div>

            {/* Phone — optional */}
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1.5">
                Phone Number <span className="text-surface-700/40 font-normal">(optional)</span>
              </label>
              <div className="relative">
                <FiPhone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-700/40" size={18} />
                <input
                  {...register('phone')}
                  type="tel"
                  placeholder="+977 9800000000"
                  className="w-full h-12 pl-11 pr-4 rounded-xl border border-surface-200 bg-surface-50 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition text-sm"
                />
              </div>
              {errors.phone && <p className="text-danger-500 text-xs mt-1">{errors.phone.message}</p>}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1.5">Password</label>
              <div className="relative">
                <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-700/40" size={18} />
                <input {...register('password')} type={showPassword ? 'text' : 'password'} placeholder="Min. 8 characters" className="w-full h-12 pl-11 pr-12 rounded-xl border border-surface-200 bg-surface-50 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition text-sm" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-surface-700/40">
                  {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                </button>
              </div>
              {errors.password && <p className="text-danger-500 text-xs mt-1">{errors.password.message}</p>}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1.5">Confirm Password</label>
              <input {...register('confirmPassword')} type="password" placeholder="Confirm your password" className="w-full h-12 px-4 rounded-xl border border-surface-200 bg-surface-50 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition text-sm" />
              {errors.confirmPassword && <p className="text-danger-500 text-xs mt-1">{errors.confirmPassword.message}</p>}
            </div>

            <button type="submit" disabled={isLoading} className="w-full h-12 rounded-xl gradient-primary text-white font-semibold hover:opacity-90 transition disabled:opacity-50">
              {isLoading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-surface-700/60">
            Already have an account? <Link to="/login" className="text-primary-600 font-semibold">Sign In</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
