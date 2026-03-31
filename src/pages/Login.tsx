import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../store/auth-context';
import { AxiosError } from 'axios';
import type { ApiError } from '../types';
import Icon from '../components/Icon';

const loginSchema = z.object({
  email: z.email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setApiError(null);
    try {
      await login(data.email, data.password);
      navigate('/products');
    } catch (err) {
      if (err instanceof AxiosError && err.response?.data) {
        const body = err.response.data as ApiError;
        const message = Array.isArray(body.message)
          ? body.message.join(', ')
          : body.message;
        setApiError(message);
      } else {
        setApiError('An unexpected error occurred. Please try again.');
      }
    }
  };

  const inputClass =
    'w-full rounded-lg border border-zinc-200 bg-surface-container-lowest px-4 py-3 font-body text-sm text-on-surface placeholder-zinc-400 transition focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none';

  return (
    <div className="flex min-h-screen items-center justify-center px-4 pt-16 pb-12">
      <div className="editorial-shadow w-full max-w-md rounded-2xl bg-white p-10">
        <div className="mb-8 text-center">
          <span className="text-3xl font-black tracking-tighter text-red-600">MO</span>
          <h1 className="mt-4 font-headline text-3xl font-extrabold tracking-tight text-on-surface">
            Welcome back
          </h1>
          <p className="mt-2 font-label text-xs uppercase tracking-widest text-zinc-500">
            Sign in to your account
          </p>
        </div>

        {apiError && (
          <div className="mb-6 flex items-center gap-2 rounded-lg bg-error-container p-3" role="alert">
            <Icon name="error" className="text-sm text-on-error-container" />
            <span className="font-body text-sm text-on-error-container">{apiError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
          <div>
            <label
              htmlFor="email"
              className="mb-2 block font-label text-[10px] font-bold uppercase tracking-widest text-zinc-500"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              className={inputClass}
              placeholder="you@example.com"
              aria-invalid={errors.email ? 'true' : 'false'}
              {...register('email')}
            />
            {errors.email && (
              <p className="mt-1.5 font-body text-xs text-error" role="alert">
                {errors.email.message}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-2 block font-label text-[10px] font-bold uppercase tracking-widest text-zinc-500"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              className={inputClass}
              placeholder="Enter your password"
              aria-invalid={errors.password ? 'true' : 'false'}
              {...register('password')}
            />
            {errors.password && (
              <p className="mt-1.5 font-body text-xs text-error" role="alert">
                {errors.password.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="group relative w-full overflow-hidden rounded-lg bg-primary py-3.5 font-label text-sm font-black uppercase tracking-widest text-on-primary shadow-lg transition-all hover:bg-primary-container active:scale-[0.98] disabled:opacity-50"
          >
            <span className="relative z-10">
              {isSubmitting ? 'Signing in...' : 'Sign In'}
            </span>
            <div className="absolute inset-0 translate-y-full bg-white/10 transition-transform duration-300 group-hover:translate-y-0" />
          </button>
        </form>

        <p className="mt-8 text-center font-body text-sm text-zinc-500">
          Don&apos;t have an account?{' '}
          <Link
            to="/register"
            className="font-semibold text-primary transition hover:text-primary-container"
          >
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
