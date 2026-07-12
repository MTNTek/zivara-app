'use client';

import { useEffect, useState } from 'react';
import { apiClient, ApiError } from '@/lib/api-client';

interface Analytics {
  jobsByIndustry: { industry: string; count: number }[];
  registrationsLast30Days: number;
}

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiClient.get<Analytics>('/admin/analytics')
      .then(setData)
      .catch((err: unknown) => setError(err instanceof ApiError ? err.message : 'Failed to load.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <main className="container mx-auto px-4 py-8"><p className="text-sm text-zinc-500">Loading…</p></main>;
  if (error || !data) return <main className="container mx-auto px-4 py-8"><p className="text-sm text-red-600">{error}</p></main>;

  const maxCount = Math.max(...data.jobsByIndustry.map((j) => j.count), 1);

  return (
    <main className="container mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-xl font-semibold text-zinc-900">Platform analytics</h1>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-zinc-200 bg-white p-5">
          <p className="text-3xl font-semibold text-zinc-900">{data.registrationsLast30Days}</p>
          <p className="mt-1 text-sm text-zinc-500">New registrations (last 30 days)</p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-5">
          <p className="text-3xl font-semibold text-zinc-900">{data.jobsByIndustry.reduce((s, j) => s + j.count, 0)}</p>
          <p className="mt-1 text-sm text-zinc-500">Active jobs (total)</p>
        </div>
      </div>

      <section className="mt-8">
        <h2 className="text-sm font-semibold text-zinc-700">Active jobs by industry</h2>
        <div className="mt-3 space-y-2">
          {data.jobsByIndustry.length === 0 && (
            <p className="text-sm text-zinc-400">No active jobs yet.</p>
          )}
          {data.jobsByIndustry.map((item) => (
            <div key={item.industry}>
              <div className="flex items-center justify-between text-sm">
                <span className="text-zinc-700">{item.industry}</span>
                <span className="font-medium text-zinc-900">{item.count}</span>
              </div>
              <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-zinc-100">
                <div
                  className="h-full rounded-full bg-zinc-900"
                  style={{ width: `${(item.count / maxCount) * 100}%` }}
                  role="progressbar"
                  aria-valuenow={item.count}
                  aria-valuemax={maxCount}
                  aria-label={`${item.industry}: ${item.count} jobs`}
                />
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
