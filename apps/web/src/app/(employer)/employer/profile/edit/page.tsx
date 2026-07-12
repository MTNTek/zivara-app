'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiClient, ApiError } from '@/lib/api-client';

const INDUSTRIES = ['Construction', 'Solar Energy', 'Hospitality', 'Cleaning', 'Domestic Services', 'Private Tutoring'] as const;
const EMPLOYEE_RANGES = ['1-10', '10-50', '50-200', '200-500', '500+'] as const;

const schema = z.object({
  companyName: z.string().min(2, 'Company name is required.').max(200),
  industry: z.string().min(1, 'Please select an industry.'),
  description: z.string().max(2000).optional().or(z.literal('')),
  websiteUrl: z.string().url('Enter a valid URL.').optional().or(z.literal('')),
  employeeCountRange: z.string().optional(),
  operatingCountry: z.string().min(2, 'Operating country is required.').max(100),
});

type FormValues = z.infer<typeof schema>;

const inputClass = 'mt-1 block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm placeholder-zinc-400 shadow-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900';

interface ProfileData { companyName: string; industry: string; description: string | null; websiteUrl: string | null; employeeCountRange: string | null; operatingCountry: string; }

export default function EditEmployerProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [serverError, setServerError] = useState<string | null>(null);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema as Parameters<typeof zodResolver>[0]),
  });

  useEffect(() => {
    apiClient.get<ProfileData>('/employers/me')
      .then((p) => reset({ companyName: p.companyName, industry: p.industry, description: p.description ?? '', websiteUrl: p.websiteUrl ?? '', employeeCountRange: p.employeeCountRange ?? '', operatingCountry: p.operatingCountry }))
      .finally(() => setLoading(false));
  }, [reset]);

  const onSubmit = async (data: FormValues) => {
    setServerError(null);
    try {
      await apiClient.patch('/employers/me', { ...data, description: data.description || undefined, websiteUrl: data.websiteUrl || undefined, employeeCountRange: data.employeeCountRange || undefined });
      router.push('/employer/profile');
    } catch (err) {
      setServerError(err instanceof ApiError ? err.message : 'Failed to save.');
    }
  };

  if (loading) return <main className="container mx-auto max-w-lg px-4 py-8"><p className="text-sm text-zinc-500">Loading…</p></main>;

  return (
    <main className="container mx-auto max-w-lg px-4 py-8">
      <div className="mb-6">
        <Link href="/employer/profile" className="text-xs text-zinc-500 hover:text-zinc-900">← Back</Link>
        <h1 className="mt-2 text-xl font-semibold text-zinc-900">Edit company profile</h1>
      </div>

      {serverError && <div role="alert" className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{serverError}</div>}

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <div>
          <label htmlFor="companyName" className="block text-sm font-medium text-zinc-700">Company name</label>
          <input id="companyName" type="text" className={inputClass} {...register('companyName')} />
          {errors.companyName && <p role="alert" className="mt-1 text-xs text-red-600">{errors.companyName.message}</p>}
        </div>

        <div>
          <label htmlFor="industry" className="block text-sm font-medium text-zinc-700">Industry</label>
          <select id="industry" className={inputClass} {...register('industry')}>
            <option value="">Select an industry</option>
            {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
          </select>
          {errors.industry && <p role="alert" className="mt-1 text-xs text-red-600">{errors.industry.message}</p>}
        </div>

        <div>
          <label htmlFor="operatingCountry" className="block text-sm font-medium text-zinc-700">Operating country</label>
          <input id="operatingCountry" type="text" className={inputClass} placeholder="e.g. UAE" {...register('operatingCountry')} />
          {errors.operatingCountry && <p role="alert" className="mt-1 text-xs text-red-600">{errors.operatingCountry.message}</p>}
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-zinc-700">About your company <span className="text-zinc-400">(optional)</span></label>
          <textarea id="description" rows={4} className={inputClass} {...register('description')} />
        </div>

        <div>
          <label htmlFor="websiteUrl" className="block text-sm font-medium text-zinc-700">Website <span className="text-zinc-400">(optional)</span></label>
          <input id="websiteUrl" type="url" className={inputClass} placeholder="https://example.com" {...register('websiteUrl')} />
          {errors.websiteUrl && <p role="alert" className="mt-1 text-xs text-red-600">{errors.websiteUrl.message}</p>}
        </div>

        <div>
          <label htmlFor="employeeCountRange" className="block text-sm font-medium text-zinc-700">Company size <span className="text-zinc-400">(optional)</span></label>
          <select id="employeeCountRange" className={inputClass} {...register('employeeCountRange')}>
            <option value="">Select a range</option>
            {EMPLOYEE_RANGES.map(r => <option key={r} value={r}>{r} employees</option>)}
          </select>
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={isSubmitting} className="rounded-md bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-60">
            {isSubmitting ? 'Saving…' : 'Save changes'}
          </button>
          <Link href="/employer/profile" className="rounded-md border border-zinc-300 px-5 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50">Cancel</Link>
        </div>
      </form>
    </main>
  );
}
