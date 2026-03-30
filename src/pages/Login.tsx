import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff } from 'lucide-react';
import { authApi } from '@/lib/api-client';
import { useAuth } from '@/store/authStore';
import { AuthResponse } from '@/lib/types';
import { API } from '@/config';

const loginSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

function extractAuthResponse(payload: any): AuthResponse {
  return (payload?.data ?? payload) as AuthResponse;
}

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [apiProbeMessage, setApiProbeMessage] = useState('Checking backend connectivity...');
  const [apiProbeOk, setApiProbeOk] = useState(false);

  useEffect(() => {
    console.log('API URL:', import.meta.env.VITE_API_URL);

    if (!API) {
      console.error('API Error: VITE_API_URL is undefined');
      setApiProbeOk(false);
      setApiProbeMessage('Backend URL is missing. Set VITE_API_URL (e.g., http://localhost:8080).');
      return;
    }

    fetch(`${API}/api/v1/auth/me`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
      .then(async (res) => {
        const bodyText = await res.text();
        let parsed: unknown = bodyText;

        try {
          parsed = bodyText ? JSON.parse(bodyText) : null;
        } catch {
          // Keep text payload when response is not JSON
        }

        console.log('API Data:', {
          url: `${API}/api/v1/auth/me`,
          status: res.status,
          body: parsed,
        });

        // 2xx or 401 both confirm backend is reachable.
        if (res.ok || res.status === 401) {
          setApiProbeOk(true);
          setApiProbeMessage('Backend reachable. API calls should appear in Network > Fetch/XHR.');
          return;
        }

        setApiProbeOk(false);
        setApiProbeMessage(`Backend responded with status ${res.status}. Check server routes/CORS.`);
      })
      .catch((err) => {
        console.error('API Error:', err);
        setApiProbeOk(false);
        setApiProbeMessage('Unable to reach backend API. Check local server status and CORS.');
      });
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (values: LoginFormData) => {
    setSubmitError(null);
    try {
      const response = await authApi.login({
        email: values.email ?? '',
        password: values.password ?? '',
      });
      login(extractAuthResponse(response));
      navigate('/dashboard');
    } catch {
      setSubmitError('Invalid email or password');
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
          <div
            className={`rounded-md border px-3 py-2 text-xs ${
              apiProbeOk
                ? 'border-green-500/40 text-green-300 bg-green-500/10'
                : 'border-amber-500/40 text-amber-200 bg-amber-500/10'
            }`}
          >
            {apiProbeMessage}
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

          {submitError && <p className="text-sm text-[#ff4444]">{submitError}</p>}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-lg bg-[#D4AF37] text-[#0a0a0f] font-semibold py-2.5 hover:brightness-90 transition-all disabled:opacity-60"
          >
            {isSubmitting ? 'Signing In...' : 'Login'}
          </button>
        </form>

        <div className="mt-6 space-y-2 text-sm text-slate-400">
          <p>
            Don't have an account?{' '}
            <Link to="/register" className="text-[#D4AF37] hover:underline">Register</Link>
          </p>
          <p>
            <button type="button" className="text-slate-400 hover:text-[#D4AF37] transition-colors">Forgot password?</button>
          </p>
        </div>
      </div>
    </div>
  );
}
