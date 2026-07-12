'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiClient, ApiError } from '@/lib/api-client';

interface EmployerProfile {
  id: string;
  companyName: string;
  tradeLicenseNumber: string;
  industry: string;
  description: string | null;
  logoUrl: string | null;
  websiteUrl: string | null;
  employeeCountRange: string | null;
  operatingCountry: string;
  verificationStatus: string;
  isBadgeVisible: boolean;
  memberRole: string;
  memberCount: number;
}

export default function EmployerProfilePage() {
  const [profile, setProfile] = useState<EmployerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiClient
      .get<EmployerProfile>('/employers/me')
      .then(setProfile)
      .catch((err: unknown) => {
        setError(err instanceof ApiError ? err.message : 'Failed to load profile.');
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <main className="container mx-auto px-4 py-8"><p className="text-sm text-zinc-500">Loading…</p></main>;
  if (error || !profile) return <main className="container mx-auto px-4 py-8"><p className="text-sm text-red-600">{error}</p></main>;

  const isOwner = profile.memberRole === 'owner';

  return (
    <main className="container mx-auto max-w-2xl px-4 py-8">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          {profile.logoUrl ? (
            <img src={profile.logoUrl} alt={profile.companyName} className="h-14 w-14 rounded-lg object-cover" />
          ) : (
            <div aria-hidden="true" className="flex h-14 w-14 items-center justify-center rounded-lg bg-zinc-100 text-xl font-semibold text-zinc-500">
              {profile.companyName.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold text-zinc-900">{profile.companyName}</h1>
              {profile.isBadgeVisible && (
                <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">✓ Verified</span>
              )}
            </div>
            <p className="text-sm text-zinc-500">{profile.industry} · {profile.operatingCountry}</p>
          </div>
        </div>
        {isOwner && (
          <Link href="/employer/profile/edit" className="rounded-md border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50">
            Edit profile
          </Link>
        )}
      </div>

      {profile.verificationStatus !== 'verified' && (
        <div className="mt-5 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Your company is pending verification. You can post jobs once your trade license is approved.
        </div>
      )}

      <div className="mt-6 space-y-3 text-sm">
        {profile.description && (
          <div>
            <p className="font-medium text-zinc-700">About</p>
            <p className="mt-1 text-zinc-600">{profile.description}</p>
          </div>
        )}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs font-medium text-zinc-500">Trade license</p>
            <p className="mt-0.5 text-zinc-700">{profile.tradeLicenseNumber}</p>
          </div>
          {profile.employeeCountRange && (
            <div>
              <p className="text-xs font-medium text-zinc-500">Team size</p>
              <p className="mt-0.5 text-zinc-700">{profile.employeeCountRange} employees</p>
            </div>
          )}
          {profile.websiteUrl && (
            <div>
              <p className="text-xs font-medium text-zinc-500">Website</p>
              <a href={profile.websiteUrl} target="_blank" rel="noopener noreferrer" className="mt-0.5 text-zinc-700 hover:underline">
                {profile.websiteUrl}
              </a>
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 border-t border-zinc-100 pt-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-zinc-700">Team ({profile.memberCount})</p>
          {isOwner && (
            <Link href="/employer/team" className="text-xs text-zinc-500 hover:text-zinc-900 hover:underline">Manage team →</Link>
          )}
        </div>
      </div>
    </main>
  );
}
