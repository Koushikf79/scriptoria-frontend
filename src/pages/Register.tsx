import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff } from 'lucide-react';
import { authApi, ApiError } from '@/lib/api-client';
import { useAuth } from '@/store/authStore';
import { AuthResponse } from '@/lib/types';

const registerSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string().min(8, 'Confirm your password'),
}).refine((values) => values.password === values.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type RegisterFormData = z.infer<typeof registerSchema>;

function extractAuthResponse(payload: any): AuthResponse {
  return (payload?.data ?? payload) as AuthResponse;
}

export default function Register() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (values: RegisterFormData) => {
    setSubmitError(null);
    try {
      const response = await authApi.register({
        fullName: values.fullName,
        email: values.email,
        password: values.password,
      });
      login(extractAuthResponse(response));
      navigate('/dashboard');
    } catch (error: any) {
      if (error instanceof ApiError && error.status === 409) {
        setSubmitError('Email already in use');
        return;
      }
      setSubmitError('Registration failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] px-4 flex items-center justify-center">
      <div className="w-full max-w-[420px] rounded-2xl border border-[#D4AF37]/25 bg-white/[0.03] backdrop-blur-xl p-8 text-white shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-display font-bold text-[#D4AF37] tracking-wide">SCRIPTORIA</h1>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400 mt-2">Film Intelligence System</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-xs uppercase tracking-wider text-slate-400 mb-1">Full Name</label>
            <input
              type="text"
              {...register('fullName')}
              className="w-full rounded-lg bg-[#111118] border border-[#D4AF37]/30 px-3 py-2 text-white outline-none focus:border-[#D4AF37] transition-all"
              placeholder="Your name"
            />
            {errors.fullName && <p className="text-xs text-[#ff4444] mt-1">{errors.fullName.message}</p>}
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider text-slate-400 mb-1">Email</label>
            <input
              type="email"
              {...register('email')}
              className="w-full rounded-lg bg-[#111118] border border-[#D4AF37]/30 px-3 py-2 text-white outline-none focus:border-[#D4AF37] transition-all"
              placeholder="you@example.com"
            />
            {errors.email && <p className="text-xs text-[#ff4444] mt-1">{errors.email.message}</p>}
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider text-slate-400 mb-1">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                {...register('password')}
                className="w-full rounded-lg bg-[#111118] border border-[#D4AF37]/30 px-3 py-2 pr-10 text-white outline-none focus:border-[#D4AF37] transition-all"
                placeholder="********"
              />
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#D4AF37]"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && <p className="text-xs text-[#ff4444] mt-1">{errors.password.message}</p>}
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider text-slate-400 mb-1">Confirm Password</label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                {...register('confirmPassword')}
                className="w-full rounded-lg bg-[#111118] border border-[#D4AF37]/30 px-3 py-2 pr-10 text-white outline-none focus:border-[#D4AF37] transition-all"
                placeholder="********"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((value) => !value)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#D4AF37]"
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.confirmPassword && <p className="text-xs text-[#ff4444] mt-1">{errors.confirmPassword.message}</p>}
          </div>

          {submitError && <p className="text-sm text-[#ff4444]">{submitError}</p>}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-lg bg-[#D4AF37] text-[#0a0a0f] font-semibold py-2.5 hover:brightness-90 transition-all disabled:opacity-60"
          >
            {isSubmitting ? 'Creating Account...' : 'Register'}
          </button>
        </form>

        <div className="mt-6 text-sm text-slate-400">
          Already have an account?{' '}
          <Link to="/login" className="text-[#D4AF37] hover:underline">Login</Link>
        </div>
      </div>
    </div>
  );
}
