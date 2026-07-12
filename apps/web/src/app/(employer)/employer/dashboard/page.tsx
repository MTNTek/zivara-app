'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiClient, ApiError } from '@/lib/api-client';

interface DashboardStats {
  employerId: string;
  companyName: string;
  verificationStatus: string;
  isBadgeVisible: boolean;
  activeJobCount: number;
  totalApplicationCount: number;
  shortlistedCount: number;
}

export default function EmployerDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiClient
      .get<DashboardStats>('/employers/me/dashboard')
      .then(setStats)
      .catch((err: unknown) => {
        setError(err instanceof ApiError ? err.message : 'Failed to load dashboard.');
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <main className="container mx-auto px-4 py-8"><p className="text-sm text-zinc-500">Loading…</p></main>;
  if (error || !stats) return <main className="container mx-auto px-4 py-8"><p className="text-sm text-red-600">{error}</p></main>;

  return (
    <main className="container mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900">{stats.companyName}</h1>
          <div className="mt-1 flex items-center gap-2">
            {stats.isBadgeVisible && (
              <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700">
                ✓ Verified Employer
              </span>
            )}
            {!stats.isBadgeVisible && (
              <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700">
                Verification {stats.verificationStatus}
              </span>
            )}
          </div>
        </div>
        <Link
          href="/employer/jobs/new"
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700"
        >
          Post a job
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Active jobs', value: stats.activeJobCount },
          { label: 'Applications', value: stats.totalApplicationCount },
          { label: 'Shortlisted', value: stats.shortlistedCount },
        ].map((s) => (
          <div key={s.label} className="rounded-lg border border-zinc-200 bg-white p-5 text-center">
            <p className="text-3xl font-semibold text-zinc-900">{s.value}</p>
            <p className="mt-1 text-sm text-zinc-500">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Quick links */}
      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        <Link href="/employer/jobs" className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white px-5 py-4 hover:border-zinc-400">
          <span className="text-sm font-medium text-zinc-900">My job postings</span>
          <span className="text-zinc-400">→</span>
        </Link>
        <Link href="/employer/applications" className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white px-5 py-4 hover:border-zinc-400">
          <span className="text-sm font-medium text-zinc-900">Applications</span>
          <span className="text-zinc-400">→</span>
        </Link>
        <Link href="/employer/profile" className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white px-5 py-4 hover:border-zinc-400">
          <span className="text-sm font-medium text-zinc-900">Company profile</span>
          <span className="text-zinc-400">→</span>
        </Link>
        <Link href="/employer/team" className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white px-5 py-4 hover:border-zinc-400">
          <span className="text-sm font-medium text-zinc-900">Team members</span>
          <span className="text-zinc-400">→</span>
        </Link>
      </div>
    </main>
  );
}
