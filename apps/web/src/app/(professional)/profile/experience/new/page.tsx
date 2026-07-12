'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiClient, ApiError } from '@/lib/api-client';

const schema = z.object({
  jobTitle: z.string().min(2, 'Job title is required.').max(150),
  companyName: z.string().min(2, 'Company name is required.').max(150),
  industry: z.string().max(100).optional().or(z.literal('')),
  startDate: z.string().min(1, 'Start date is required.').regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD format.'),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD format.').optional().or(z.literal('')),
  description: z.string().max(2000).optional().or(z.literal('')),
  isCurrentRole: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

const inputClass =
  'mt-1 block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm placeholder-zinc-400 shadow-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900';

export default function AddExperiencePage() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema as Parameters<typeof zodResolver>[0]),
    defaultValues: { isCurrentRole: false },
  });

  const isCurrentRole = watch('isCurrentRole');

  const onSubmit = async (data: FormValues) => {
    setServerError(null);
    try {
      await apiClient.post('/professionals/me/experience', {
        jobTitle: data.jobTitle,
        companyName: data.companyName,
        industry: data.industry || undefined,
        startDate: data.startDate,
        endDate: data.isCurrentRole ? undefined : (data.endDate || undefined),
        description: data.description || undefined,
      });
      router.push('/professional/profile');
    } catch (err) {
      setServerError(err instanceof ApiError ? err.message : 'Failed to add experience.');
    }
  };

  return (
    <main className="container mx-auto max-w-lg px-4 py-8">
      <div className="mb-6">
        <Link href="/professional/profile" className="text-xs text-zinc-500 hover:text-zinc-900">← Back to profile</Link>
        <h1 className="mt-2 text-xl font-semibold text-zinc-900">Add experience</h1>
      </div>

      {serverError && (
        <div role="alert" aria-live="assertive" className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <div>
          <label htmlFor="jobTitle" className="block text-sm font-medium text-zinc-700">Job title</label>
          <input id="jobTitle" type="text" className={inputClass} placeholder="e.g. Site Engineer" {...register('jobTitle')} aria-describedby={errors.jobTitle ? 'jobTitle-err' : undefined} />
          {errors.jobTitle && <p id="jobTitle-err" role="alert" className="mt-1 text-xs text-red-600">{errors.jobTitle.message}</p>}
        </div>

        <div>
          <label htmlFor="companyName" className="block text-sm font-medium text-zinc-700">Company name</label>
          <input id="companyName" type="text" className={inputClass} {...register('companyName')} aria-describedby={errors.companyName ? 'company-err' : undefined} />
          {errors.companyName && <p id="company-err" role="alert" className="mt-1 text-xs text-red-600">{errors.companyName.message}</p>}
        </div>

        <div>
          <label htmlFor="industry" className="block text-sm font-medium text-zinc-700">Industry <span className="text-zinc-400">(optional)</span></label>
          <input id="industry" type="text" className={inputClass} placeholder="e.g. Construction" {...register('industry')} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="startDate" className="block text-sm font-medium text-zinc-700">Start date</label>
            <input id="startDate" type="date" className={inputClass} {...register('startDate')} aria-describedby={errors.startDate ? 'start-err' : undefined} />
            {errors.startDate && <p id="start-err" role="alert" className="mt-1 text-xs text-red-600">{errors.startDate.message}</p>}
          </div>
          <div>
            <label htmlFor="endDate" className="block text-sm font-medium text-zinc-700">End date</label>
            <input id="endDate" type="date" className={inputClass} disabled={isCurrentRole} {...register('endDate')} />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input id="isCurrentRole" type="checkbox" className="h-4 w-4 rounded border-zinc-300" {...register('isCurrentRole')} />
          <label htmlFor="isCurrentRole" className="text-sm text-zinc-700">I currently work here</label>
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-zinc-700">Description <span className="text-zinc-400">(optional)</span></label>
          <textarea id="description" rows={3} className={inputClass} {...register('description')} />
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={isSubmitting} className="rounded-md bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-60">
            {isSubmitting ? 'Saving…' : 'Add experience'}
          </button>
          <Link href="/professional/profile" className="rounded-md border border-zinc-300 px-5 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50">
            Cancel
          </Link>
        </div>
      </form>
    </main>
  );
}
