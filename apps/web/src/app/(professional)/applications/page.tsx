'use client';

import { useEffect, useState } from 'react';
import { apiClient, ApiError } from '@/lib/api-client';

interface Application {
  id: string;
  jobId: string;
  status: string;
  coverNote: string | null;
  createdAt: string;
  updatedAt: string;
  jobTitle: Record<string, string> | null;
  jobStatus: string | null;
}

const STATUS_STYLES: Record<string, string> = {
  received: 'bg-zinc-100 text-zinc-600',
  under_review: 'bg-blue-50 text-blue-700',
  shortlisted: 'bg-green-50 text-green-700',
  rejected: 'bg-red-50 text-red-700',
  hired: 'bg-emerald-50 text-emerald-700',
  withdrawn: 'bg-zinc-100 text-zinc-400',
};

const STATUS_LABELS: Record<string, string> = {
  received: 'Received', under_review: 'Under review', shortlisted: 'Shortlisted',
  rejected: 'Not selected', hired: 'Hired', withdrawn: 'Withdrawn',
};

export default function ApplicationsPage() {
  const [appList, setAppList] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    apiClient.get<Application[]>('/applications/mine')
      .then(setAppList)
      .catch((err: unknown) => setError(err instanceof ApiError ? err.message : 'Failed to load.'))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleWithdraw = async (id: string) => {
    if (!confirm('Withdraw this application?')) return;
    try {
      await apiClient.post(`/applications/${id}/withdraw`);
      setAppList((prev) => prev.map((a) => a.id === id ? { ...a, status: 'withdrawn' } : a));
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Failed to withdraw.');
    }
  };

  if (loading) return <main className="container mx-auto px-4 py-8"><p className="text-sm text-zinc-500">Loading…</p></main>;
  if (error) return <main className="container mx-auto px-4 py-8"><p className="text-sm text-red-600">{error}</p></main>;

  return (
    <main className="container mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-xl font-semibold text-zinc-900">My applications</h1>
      <p className="mt-1 text-sm text-zinc-500">{appList.length} application{appList.length !== 1 ? 's' : ''}</p>

      {appList.length === 0 && (
        <div className="mt-8 rounded-lg border border-zinc-100 bg-zinc-50 px-6 py-12 text-center">
          <p className="text-sm text-zinc-500">You haven&apos;t applied to any jobs yet.</p>
        </div>
      )}

      <div className="mt-6 space-y-3">
        {appList.map((app) => (
          <div key={app.id} className="rounded-lg border border-zinc-200 bg-white p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-medium text-zinc-900">
                  {app.jobTitle?.['en'] ?? 'Job listing'}
                </p>
                <p className="mt-0.5 text-xs text-zinc-400">
                  Applied {new Date(app.createdAt).toLocaleDateString('en-GB')}
                  {' · '}Updated {new Date(app.updatedAt).toLocaleDateString('en-GB')}
                </p>
              </div>
              <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[app.status] ?? 'bg-zinc-100 text-zinc-600'}`}>
                {STATUS_LABELS[app.status] ?? app.status}
              </span>
            </div>
            {!['withdrawn', 'rejected', 'hired'].includes(app.status) && (
              <button
                onClick={() => void handleWithdraw(app.id)}
                className="mt-3 text-xs text-zinc-400 hover:text-red-600"
              >
                Withdraw application
              </button>
            )}
          </div>
        ))}
      </div>
    </main>
  );
}
