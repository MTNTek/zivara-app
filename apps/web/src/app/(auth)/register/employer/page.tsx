'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { apiClient, ApiError } from '@/lib/api-client';

const INDUSTRIES = [
  'Construction',
  'Solar Energy',
  'Hospitality',
  'Cleaning',
  'Domestic Services',
  'Private Tutoring',
] as const;

const schema = z.object({
  companyName: z.string().min(2, 'Company name is required.'),
  tradeLicenseNumber: z.string().min(1, 'Trade license number is required.'),
  industry: z.string().min(1, 'Please select an industry.'),
  operatingCountry: z.string().min(2, 'Operating country is required.'),
  email: z.string().min(1, 'Email is required.').email('Please enter a valid email address.'),
  password: z.string().min(8, 'Password must be at least 8 characters.'),
});

type FormValues = z.infer<typeof schema>;

const inputClass =
  'mt-1 block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm placeholder-zinc-400 shadow-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 disabled:opacity-50';

export default function RegisterEmployerPage() {
  const [success, setSuccess] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema as Parameters<typeof zodResolver>[0]) });

  const onSubmit = async (data: FormValues) => {
    setServerError(null);
    try {
      await apiClient.post('/auth/register/employer', {
        companyName: data.companyName,
        tradeLicenseNumber: data.tradeLicenseNumber,
        industry: data.industry,
        operatingCountry: data.operatingCountry,
        email: data.email,
        password: data.password,
      });
      setSuccess(true);
    } catch (err) {
      if (err instanceof ApiError) {
        setServerError(err.message);
      } else {
        setServerError('Something went wrong. Please try again.');
      }
    }
  };

  if (success) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-4">
        <div className="w-full max-w-sm text-center">
          <div className="mb-4 text-4xl">✓</div>
          <h1 className="text-xl font-semibold text-zinc-900">Account created</h1>
          <p className="mt-2 text-sm text-zinc-500">
            Your employer account has been created. Our team will verify your trade license and
            activate your account within 1–2 business days.
          </p>
          <Link
            href="/login"
            className="mt-6 inline-block rounded-md bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-zinc-700"
          >
            Go to log in
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-start justify-center bg-zinc-50 px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8">
          <Link href="/register" className="mb-4 inline-flex items-center text-xs text-zinc-500 hover:text-zinc-900">
            ← Back
          </Link>
          <h1 className="text-2xl font-semibold text-zinc-900">Create your account</h1>
          <p className="mt-1 text-sm text-zinc-500">Employer — post jobs and hire professionals</p>
        </div>

        {serverError && (
          <div
            role="alert"
            aria-live="assertive"
            className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          <div>
            <label htmlFor="companyName" className="block text-sm font-medium text-zinc-700">
              Company name
            </label>
            <input
              id="companyName"
              type="text"
              autoComplete="organization"
              aria-describedby={errors.companyName ? 'companyName-error' : undefined}
              aria-invalid={!!errors.companyName}
              className={inputClass}
              {...register('companyName')}
            />
            {errors.companyName && (
              <p id="companyName-error" role="alert" className="mt-1 text-xs text-red-600">
                {errors.companyName.message}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="tradeLicenseNumber" className="block text-sm font-medium text-zinc-700">
              Trade license number
            </label>
            <input
              id="tradeLicenseNumber"
              type="text"
              aria-describedby={errors.tradeLicenseNumber ? 'license-error' : undefined}
              aria-invalid={!!errors.tradeLicenseNumber}
              className={inputClass}
              {...register('tradeLicenseNumber')}
            />
            {errors.tradeLicenseNumber && (
              <p id="license-error" role="alert" className="mt-1 text-xs text-red-600">
                {errors.tradeLicenseNumber.message}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="industry" className="block text-sm font-medium text-zinc-700">
              Industry
            </label>
            <select
              id="industry"
              aria-describedby={errors.industry ? 'industry-error' : undefined}
              aria-invalid={!!errors.industry}
              className={inputClass}
              defaultValue=""
              {...register('industry')}
            >
              <option value="" disabled>
                Select an industry
              </option>
              {INDUSTRIES.map((ind) => (
                <option key={ind} value={ind}>
                  {ind}
                </option>
              ))}
            </select>
            {errors.industry && (
              <p id="industry-error" role="alert" className="mt-1 text-xs text-red-600">
                {errors.industry.message}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="operatingCountry" className="block text-sm font-medium text-zinc-700">
              Operating country
            </label>
            <input
              id="operatingCountry"
              type="text"
              placeholder="e.g. UAE"
              aria-describedby={errors.operatingCountry ? 'country-error' : undefined}
              aria-invalid={!!errors.operatingCountry}
              className={inputClass}
              {...register('operatingCountry')}
            />
            {errors.operatingCountry && (
              <p id="country-error" role="alert" className="mt-1 text-xs text-red-600">
                {errors.operatingCountry.message}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-zinc-700">
              Email address
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              aria-describedby={errors.email ? 'email-error' : undefined}
              aria-invalid={!!errors.email}
              className={inputClass}
              placeholder="you@company.com"
              {...register('email')}
            />
            {errors.email && (
              <p id="email-error" role="alert" className="mt-1 text-xs text-red-600">
                {errors.email.message}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-zinc-700">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              aria-describedby={errors.password ? 'password-error' : 'password-hint'}
              aria-invalid={!!errors.password}
              className={inputClass}
              {...register('password')}
            />
            {errors.password ? (
              <p id="password-error" role="alert" className="mt-1 text-xs text-red-600">
                {errors.password.message}
              </p>
            ) : (
              <p id="password-hint" className="mt-1 text-xs text-zinc-400">
                At least 8 characters
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-2 w-full rounded-md bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-700 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-zinc-500">
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-zinc-900 hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </main>
  );
}
