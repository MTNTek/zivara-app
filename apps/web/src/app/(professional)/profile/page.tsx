'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiClient, ApiError } from '@/lib/api-client';

interface Skill {
  id: string;
  skillName: string;
  yearsExperience: number | null;
}

interface Experience {
  id: string;
  jobTitle: string;
  companyName: string;
  industry: string | null;
  startDate: string;
  endDate: string | null;
  description: string | null;
}

interface Profile {
  id: string;
  fullName: string;
  phone: string | null;
  nationality: string | null;
  showNationality: boolean;
  currentCity: string | null;
  currentCountry: string | null;
  primaryIndustry: string | null;
  bio: string | null;
  profilePhotoUrl: string | null;
  isProfilePublic: boolean;
  verificationStatus: string;
  profileCompleteness: number;
  experience: Experience[];
  skills: Skill[];
}

export default function ProfessionalProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiClient
      .get<Profile>('/professionals/me')
      .then(setProfile)
      .catch((err: unknown) => {
        setError(err instanceof ApiError ? err.message : 'Failed to load profile.');
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <main className="container mx-auto px-4 py-8">
        <p className="text-sm text-zinc-500">Loading profile…</p>
      </main>
    );
  }

  if (error || !profile) {
    return (
      <main className="container mx-auto px-4 py-8">
        <p className="text-sm text-red-600">{error ?? 'Profile not found.'}</p>
      </main>
    );
  }

  const completeness = profile.profileCompleteness;

  return (
    <main className="container mx-auto max-w-2xl px-4 py-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          {profile.profilePhotoUrl ? (
            <img
              src={profile.profilePhotoUrl}
              alt={profile.fullName}
              className="h-16 w-16 rounded-full object-cover"
            />
          ) : (
            <div
              aria-hidden="true"
              className="flex h-16 w-16 items-center justify-center rounded-full bg-zinc-200 text-2xl font-semibold text-zinc-600"
            >
              {profile.fullName.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <h1 className="text-xl font-semibold text-zinc-900">{profile.fullName}</h1>
            {profile.primaryIndustry && (
              <p className="text-sm text-zinc-500">{profile.primaryIndustry}</p>
            )}
            {(profile.currentCity ?? profile.currentCountry) && (
              <p className="text-sm text-zinc-400">
                {[profile.currentCity, profile.currentCountry].filter(Boolean).join(', ')}
              </p>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          {profile.verificationStatus === 'verified' && (
            <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700">
              ✓ Verified
            </span>
          )}
          <Link
            href="/professional/profile/edit"
            className="rounded-md border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
          >
            Edit profile
          </Link>
        </div>
      </div>

      {/* Completeness bar */}
      <div className="mt-6">
        <div className="flex items-center justify-between text-xs text-zinc-500">
          <span>Profile completeness</span>
          <span>{completeness}%</span>
        </div>
        <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-zinc-100">
          <div
            className="h-full rounded-full bg-zinc-900 transition-all"
            style={{ width: `${completeness}%` }}
            role="progressbar"
            aria-valuenow={completeness}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Profile ${completeness}% complete`}
          />
        </div>
      </div>

      {/* Visibility */}
      <div className="mt-4 flex items-center justify-between rounded-md border border-zinc-100 bg-zinc-50 px-4 py-2.5 text-sm">
        <span className="text-zinc-600">
          Profile is <strong>{profile.isProfilePublic ? 'public' : 'private'}</strong>
        </span>
        <Link href="/professional/profile/edit" className="text-xs text-zinc-500 hover:text-zinc-900 hover:underline">
          Change
        </Link>
      </div>

      {/* Bio */}
      {profile.bio && (
        <section className="mt-6">
          <h2 className="text-sm font-semibold text-zinc-700">About</h2>
          <p className="mt-1 text-sm text-zinc-600">{profile.bio}</p>
        </section>
      )}

      {/* Skills */}
      <section className="mt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-zinc-700">Skills</h2>
          <Link href="/professional/profile/edit" className="text-xs text-zinc-400 hover:text-zinc-900 hover:underline">
            + Add skill
          </Link>
        </div>
        {profile.skills.length === 0 ? (
          <p className="mt-2 text-sm text-zinc-400">No skills added yet.</p>
        ) : (
          <div className="mt-2 flex flex-wrap gap-2">
            {profile.skills.map((s) => (
              <span
                key={s.id}
                className="inline-flex items-center rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs text-zinc-700"
              >
                {s.skillName}
                {s.yearsExperience != null && (
                  <span className="ml-1 text-zinc-400">{s.yearsExperience}y</span>
                )}
              </span>
            ))}
          </div>
        )}
      </section>

      {/* Experience */}
      <section className="mt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-zinc-700">Experience</h2>
          <Link
            href="/professional/profile/experience/new"
            className="text-xs text-zinc-400 hover:text-zinc-900 hover:underline"
          >
            + Add experience
          </Link>
        </div>
        {profile.experience.length === 0 ? (
          <p className="mt-2 text-sm text-zinc-400">No experience added yet.</p>
        ) : (
          <div className="mt-3 space-y-4">
            {profile.experience.map((exp) => (
              <div key={exp.id} className="border-l-2 border-zinc-200 pl-4">
                <p className="text-sm font-medium text-zinc-900">{exp.jobTitle}</p>
                <p className="text-sm text-zinc-500">
                  {exp.companyName}
                  {exp.industry ? ` · ${exp.industry}` : ''}
                </p>
                <p className="text-xs text-zinc-400">
                  {exp.startDate} — {exp.endDate ?? 'Present'}
                </p>
                {exp.description && (
                  <p className="mt-1 text-xs text-zinc-500">{exp.description}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
