'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiClient, ApiError } from '@/lib/api-client';

interface DashboardStats {
  totalUsers: number;
  newUsersToday: number;
  totalProfessionals: number;
  totalEmployers: number;
  pendingProfessionalVerifications: number;
  pendingEmployerVerifications: number;
  activeJobs: number;
  activeShifts: number;
  flaggedRatings: number;
  disputedShifts: number;
}

function StatCard({ label, value, alert }: { label: string; value: number; alert?: boolean }) {
  return (
    <div className={`rounded-lg border p-5 ${alert && value > 0 ? 'border-amber-200 bg-amber-50' : 'border-zinc-200 bg-white'}`}>
      <p className={`text-3xl font-semibold ${alert && value > 0 ? 'text-amber-800' : 'text-zinc-900'}`}>{value}</p>
      <p className={`mt-1 text-sm ${alert && value > 0 ? 'text-amber-700' : 'text-zinc-500'}`}>{label}</p>
    </div>
  );
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiClient.get<DashboardStats>('/admin/dashboard')
      .then(setStats)
      .catch((err: unknown) => setError(err instanceof ApiError ? err.message : 'Failed to load.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <main className="container mx-auto px-4 py-8"><p className="text-sm text-zinc-500">Loading…</p></main>;
  if (error || !stats) return <main className="container mx-auto px-4 py-8"><p className="text-sm text-red-600">{error}</p></main>;

  return (
    <main className="container mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-zinc-900">Admin Dashboard</h1>
        <span className="rounded-full bg-zinc-900 px-3 py-1 text-xs font-medium text-white">Administrator</span>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard label="Total users" value={stats.totalUsers} />
        <StatCard label="New today" value={stats.newUsersToday} />
        <StatCard label="Active jobs" value={stats.activeJobs} />
        <StatCard label="Active shifts" value={stats.activeShifts} />
        <StatCard label="Professionals" value={stats.totalProfessionals} />
      </div>

      <h2 className="mt-8 text-sm font-semibold text-zinc-700">Requires attention</h2>
      <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Prof. verifications" value={stats.pendingProfessionalVerifications} alert />
        <StatCard label="Employer verifications" value={stats.pendingEmployerVerifications} alert />
        <StatCard label="Flagged ratings" value={stats.flaggedRatings} alert />
        <StatCard label="Disputed shifts" value={stats.disputedShifts} alert />
      </div>

      <h2 className="mt-8 text-sm font-semibold text-zinc-700">Quick actions</h2>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {[
          { href: '/admin/verifications', label: 'Verification queue', count: stats.pendingProfessionalVerifications + stats.pendingEmployerVerifications },
          { href: '/admin/disputes', label: 'Disputes', count: stats.disputedShifts },
          { href: '/admin/ratings', label: 'Flagged ratings', count: stats.flaggedRatings },
          { href: '/admin/users', label: 'User management', count: null },
          { href: '/admin/analytics', label: 'Analytics', count: null },
          { href: '/admin/audit-logs', label: 'Audit log', count: null },
        ].map((item) => (
          <Link key={item.href} href={item.href} className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white px-5 py-4 hover:border-zinc-400">
            <span className="text-sm font-medium text-zinc-900">{item.label}</span>
            <div className="flex items-center gap-2">
              {item.count !== null && item.count > 0 && (
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">{item.count}</span>
              )}
              <span className="text-zinc-400">→</span>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
