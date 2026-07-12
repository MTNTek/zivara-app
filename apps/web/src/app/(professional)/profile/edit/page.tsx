'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
  fullName: z.string().min(2, 'Full name must be at least 2 characters.').max(100),
  phone: z.string().max(30).optional().or(z.literal('')),
  bio: z.string().max(1000).optional().or(z.literal('')),
  primaryIndustry: z.string().optional(),
  currentCity: z.string().max(100).optional().or(z.literal('')),
  currentCountry: z.string().max(100).optional().or(z.literal('')),
  nationality: z.string().max(100).optional().or(z.literal('')),
  showNationality: z.boolean(),
  isPublic: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

interface ProfileData {
  fullName: string;
  phone: string | null;
  bio: string | null;
  primaryIndustry: string | null;
  currentCity: string | null;
  currentCountry: string | null;
  nationality: string | null;
  showNationality: boolean;
  isProfilePublic: boolean;
}

const inputClass =
  'mt-1 block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm placeholder-zinc-400 shadow-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900';

export default function EditProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema as Parameters<typeof zodResolver>[0]),
    defaultValues: { showNationality: false, isPublic: true },
  });

  useEffect(() => {
    apiClient
      .get<ProfileData>('/professionals/me')
      .then((profile) => {
        reset({
          fullName: profile.fullName,
          phone: profile.phone ?? '',
          bio: profile.bio ?? '',
          primaryIndustry: profile.primaryIndustry ?? '',
          currentCity: profile.currentCity ?? '',
          currentCountry: profile.currentCountry ?? '',
          nationality: profile.nationality ?? '',
          showNationality: profile.showNationality,
          isPublic: profile.isProfilePublic,
        });
      })
      .finally(() => setLoading(false));
  }, [reset]);

  const onSubmit = async (data: FormValues) => {
    setServerError(null);
    try {
      await apiClient.patch('/professionals/me', {
        fullName: data.fullName,
        phone: data.phone || undefined,
        bio: data.bio || undefined,
        primaryIndustry: data.primaryIndustry || undefined,
        currentCity: data.currentCity || undefined,
        currentCountry: data.currentCountry || undefined,
        nationality: data.nationality || undefined,
        showNationality: data.showNationality,
      });
      await apiClient.patch('/professionals/me/visibility', { isPublic: data.isPublic });
      router.push('/professional/profile');
    } catch (err) {
      setServerError(err instanceof ApiError ? err.message : 'Failed to save profile.');
    }
  };

  if (loading) {
    return (
      <main className="container mx-auto max-w-lg px-4 py-8">
        <p className="text-sm text-zinc-500">Loading…</p>
      </main>
    );
  }

  return (
    <main className="container mx-auto max-w-lg px-4 py-8">
      <div className="mb-6">
        <Link href="/professional/profile" className="text-xs text-zinc-500 hover:text-zinc-900">
          ← Back to profile
        </Link>
        <h1 className="mt-2 text-xl font-semibold text-zinc-900">Edit profile</h1>
      </div>

      {serverError && (
        <div role="alert" aria-live="assertive" className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <div>
          <label htmlFor="fullName" className="block text-sm font-medium text-zinc-700">Full name</label>
          <input id="fullName" type="text" autoComplete="name" className={inputClass} {...register('fullName')} aria-describedby={errors.fullName ? 'fullName-err' : undefined} />
          {errors.fullName && <p id="fullName-err" role="alert" className="mt-1 text-xs text-red-600">{errors.fullName.message}</p>}
        </div>

        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-zinc-700">Phone number <span className="text-zinc-400">(optional)</span></label>
          <input id="phone" type="tel" autoComplete="tel" className={inputClass} placeholder="+971 50 000 0000" {...register('phone')} />
        </div>

        <div>
          <label htmlFor="primaryIndustry" className="block text-sm font-medium text-zinc-700">Industry</label>
          <select id="primaryIndustry" className={inputClass} {...register('primaryIndustry')}>
            <option value="">Select an industry</option>
            {INDUSTRIES.map((ind) => <option key={ind} value={ind}>{ind}</option>)}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="currentCity" className="block text-sm font-medium text-zinc-700">City</label>
            <input id="currentCity" type="text" className={inputClass} placeholder="Dubai" {...register('currentCity')} />
          </div>
          <div>
            <label htmlFor="currentCountry" className="block text-sm font-medium text-zinc-700">Country</label>
            <input id="currentCountry" type="text" className={inputClass} placeholder="UAE" {...register('currentCountry')} />
          </div>
        </div>

        <div>
          <label htmlFor="bio" className="block text-sm font-medium text-zinc-700">Bio <span className="text-zinc-400">(optional)</span></label>
          <textarea id="bio" rows={3} className={inputClass} placeholder="Tell employers about your experience…" {...register('bio')} aria-describedby={errors.bio ? 'bio-err' : undefined} />
          {errors.bio && <p id="bio-err" role="alert" className="mt-1 text-xs text-red-600">{errors.bio.message}</p>}
        </div>

        <div>
          <label htmlFor="nationality" className="block text-sm font-medium text-zinc-700">Nationality <span className="text-zinc-400">(optional)</span></label>
          <input id="nationality" type="text" className={inputClass} placeholder="e.g. Emirati" {...register('nationality')} />
        </div>

        <div className="flex items-start gap-3">
          <input id="showNationality" type="checkbox" className="mt-0.5 h-4 w-4 rounded border-zinc-300" {...register('showNationality')} />
          <div>
            <label htmlFor="showNationality" className="text-sm font-medium text-zinc-700">Show nationality to employers</label>
            <p className="text-xs text-zinc-400">When unchecked, employers cannot see your nationality.</p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <input id="isPublic" type="checkbox" className="mt-0.5 h-4 w-4 rounded border-zinc-300" {...register('isPublic')} />
          <div>
            <label htmlFor="isPublic" className="text-sm font-medium text-zinc-700">Public profile</label>
            <p className="text-xs text-zinc-400">When unchecked, your profile won&apos;t appear in employer searches.</p>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={isSubmitting} className="rounded-md bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-60">
            {isSubmitting ? 'Saving…' : 'Save changes'}
          </button>
          <Link href="/professional/profile" className="rounded-md border border-zinc-300 px-5 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50">
            Cancel
          </Link>
        </div>
      </form>
    </main>
  );
}
