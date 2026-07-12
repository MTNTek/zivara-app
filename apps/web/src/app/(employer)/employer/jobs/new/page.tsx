'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiClient, ApiError } from '@/lib/api-client';

const INDUSTRIES = ['Construction', 'Solar Energy', 'Hospitality', 'Cleaning', 'Domestic Services', 'Private Tutoring'] as const;

const schema = z.object({
  titleEn: z.string().min(2, 'Job title is required.').max(200),
  titleAr: z.string().max(200).optional().or(z.literal('')),
  descriptionEn: z.string().min(10, 'Description must be at least 10 characters.').max(5000),
  industry: z.string().min(1, 'Please select an industry.'),
  city: z.string().min(1, 'City is required.').max(100),
  country: z.string().min(1, 'Country is required.').max(100),
  employmentType: z.enum(['full_time', 'part_time', 'shift_based', 'contract']),
  salaryMin: z.string().optional().or(z.literal('')),
  salaryMax: z.string().optional().or(z.literal('')),
  salaryCurrency: z.string().max(3).default('AED'),
  expiresAt: z.string().optional().or(z.literal('')),
  requiredSkills: z.string().optional(), // comma-separated
});

type FormValues = z.infer<typeof schema>;

const inputClass = 'mt-1 block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm placeholder-zinc-400 shadow-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900';

export default function NewJobPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema as Parameters<typeof zodResolver>[0]),
    defaultValues: { salaryCurrency: 'AED', employmentType: 'full_time' },
  });

  const onSubmit = async (data: FormValues) => {
    setServerError(null);
    try {
      const skills = data.requiredSkills
        ? data.requiredSkills.split(',').map((s) => s.trim()).filter(Boolean)
        : [];

      const payload = {
        title: { en: data.titleEn, ...(data.titleAr ? { ar: data.titleAr } : {}) },
        description: { en: data.descriptionEn },
        industry: data.industry,
        city: data.city,
        country: data.country,
        employmentType: data.employmentType,
        salaryMin: data.salaryMin ? Number(data.salaryMin) : undefined,
        salaryMax: data.salaryMax ? Number(data.salaryMax) : undefined,
        salaryCurrency: data.salaryCurrency,
        expiresAt: data.expiresAt || undefined,
        requiredSkills: skills,
      };

      await apiClient.post('/jobs', payload);
      router.push('/employer/jobs');
    } catch (err) {
      setServerError(err instanceof ApiError ? err.message : 'Failed to create job.');
    }
  };

  return (
    <main className="container mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6">
        <Link href="/employer/jobs" className="text-xs text-zinc-500 hover:text-zinc-900">← My jobs</Link>
        <h1 className="mt-2 text-xl font-semibold text-zinc-900">Post a job</h1>
        <p className="mt-0.5 text-sm text-zinc-500">Jobs are saved as drafts. Publish when ready.</p>
      </div>

      {serverError && <div role="alert" className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{serverError}</div>}

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        {/* Title */}
        <div>
          <label htmlFor="titleEn" className="block text-sm font-medium text-zinc-700">Job title (English)</label>
          <input id="titleEn" type="text" className={inputClass} placeholder="e.g. Senior Site Engineer" {...register('titleEn')} />
          {errors.titleEn && <p role="alert" className="mt-1 text-xs text-red-600">{errors.titleEn.message}</p>}
        </div>
        <div>
          <label htmlFor="titleAr" className="block text-sm font-medium text-zinc-700">Job title (Arabic) <span className="text-zinc-400">(optional)</span></label>
          <input id="titleAr" type="text" className={inputClass} dir="rtl" {...register('titleAr')} />
        </div>

        {/* Description */}
        <div>
          <label htmlFor="descriptionEn" className="block text-sm font-medium text-zinc-700">Job description</label>
          <textarea id="descriptionEn" rows={5} className={inputClass} placeholder="Describe the role, responsibilities, and requirements…" {...register('descriptionEn')} />
          {errors.descriptionEn && <p role="alert" className="mt-1 text-xs text-red-600">{errors.descriptionEn.message}</p>}
        </div>

        {/* Industry + Type */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="industry" className="block text-sm font-medium text-zinc-700">Industry</label>
            <select id="industry" className={inputClass} {...register('industry')}>
              <option value="">Select…</option>
              {INDUSTRIES.map((i) => <option key={i} value={i}>{i}</option>)}
            </select>
            {errors.industry && <p role="alert" className="mt-1 text-xs text-red-600">{errors.industry.message}</p>}
          </div>
          <div>
            <label htmlFor="employmentType" className="block text-sm font-medium text-zinc-700">Employment type</label>
            <select id="employmentType" className={inputClass} {...register('employmentType')}>
              <option value="full_time">Full-time</option>
              <option value="part_time">Part-time</option>
              <option value="shift_based">Shift-based</option>
              <option value="contract">Contract</option>
            </select>
          </div>
        </div>

        {/* Location */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="city" className="block text-sm font-medium text-zinc-700">City</label>
            <input id="city" type="text" className={inputClass} placeholder="Dubai" {...register('city')} />
            {errors.city && <p role="alert" className="mt-1 text-xs text-red-600">{errors.city.message}</p>}
          </div>
          <div>
            <label htmlFor="country" className="block text-sm font-medium text-zinc-700">Country</label>
            <input id="country" type="text" className={inputClass} placeholder="UAE" {...register('country')} />
            {errors.country && <p role="alert" className="mt-1 text-xs text-red-600">{errors.country.message}</p>}
          </div>
        </div>

        {/* Salary */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label htmlFor="salaryMin" className="block text-sm font-medium text-zinc-700">Salary min <span className="text-zinc-400">(optional)</span></label>
            <input id="salaryMin" type="number" min="0" className={inputClass} {...register('salaryMin')} />
          </div>
          <div>
            <label htmlFor="salaryMax" className="block text-sm font-medium text-zinc-700">Salary max <span className="text-zinc-400">(optional)</span></label>
            <input id="salaryMax" type="number" min="0" className={inputClass} {...register('salaryMax')} />
          </div>
          <div>
            <label htmlFor="salaryCurrency" className="block text-sm font-medium text-zinc-700">Currency</label>
            <input id="salaryCurrency" type="text" maxLength={3} className={inputClass} {...register('salaryCurrency')} />
          </div>
        </div>

        {/* Skills */}
        <div>
          <label htmlFor="requiredSkills" className="block text-sm font-medium text-zinc-700">Required skills <span className="text-zinc-400">(comma-separated, optional)</span></label>
          <input id="requiredSkills" type="text" className={inputClass} placeholder="Scaffolding, Safety Compliance, Welding" {...register('requiredSkills')} />
        </div>

        {/* Expiry */}
        <div>
          <label htmlFor="expiresAt" className="block text-sm font-medium text-zinc-700">Expiry date <span className="text-zinc-400">(optional — defaults to 60 days)</span></label>
          <input id="expiresAt" type="date" className={inputClass} {...register('expiresAt')} />
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={isSubmitting} className="rounded-md bg-zinc-900 px-6 py-2.5 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-60">
            {isSubmitting ? 'Saving…' : 'Save as draft'}
          </button>
          <Link href="/employer/jobs" className="rounded-md border border-zinc-300 px-5 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50">Cancel</Link>
        </div>
      </form>
    </main>
  );
}
