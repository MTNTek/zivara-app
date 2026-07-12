'use client';

import { useEffect, useState, use } from 'react';
import { apiClient, ApiError } from '@/lib/api-client';

interface Application {
  id: string;
  professionalId: string;
  status: string;
  coverNote: string | null;
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
}

const STATUS_STYLES: Record<string, string> = {
  received: 'bg-zinc-100 text-zinc-600',
  under_review: 'bg-blue-50 text-blue-700',
  shortlisted: 'bg-green-50 text-green-700',
  rejected: 'bg-red-50 text-red-700',
  hired: 'bg-emerald-50 text-emerald-700',
  withdrawn: 'bg-zinc-100 text-zinc-400',
};

const ALLOWED_TRANSITIONS = ['received', 'under_review', 'shortlisted', 'rejected', 'hired'];

export default function EmployerApplicationsPage({ params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = use(params);
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    apiClient.get<Application[]>(`/applications/job/${jobId}`)
      .then(setApps)
      .catch((err: unknown) => setError(err instanceof ApiError ? err.message : 'Failed to load.'))
      .finally(() => setLoading(false));
  }, [jobId]);

  const handleStatusChange = async (appId: string, status: string) => {
    setUpdating(appId);
    try {
      const updated = await apiClient.patch<Application>(`/applications/${appId}/status`, { status });
      setApps((prev) => prev.map((a) => a.id === appId ? updated : a));
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Failed to update status.');
    } finally {
      setUpdating(null);
    }
  };

  if (loading) return <main className="container mx-auto px-4 py-8"><p className="text-sm text-zinc-500">Loading…</p></main>;
  if (error) return <main className="container mx-auto px-4 py-8"><p className="text-sm text-red-600">{error}</p></main>;

  return (
    <main className="container mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-xl font-semibold text-zinc-900">Applications</h1>
      <p className="mt-1 text-sm text-zinc-500">{apps.length} applicant{apps.length !== 1 ? 's' : ''}</p>

      {apps.length === 0 && (
        <div className="mt-8 rounded-lg border border-zinc-100 bg-zinc-50 px-6 py-12 text-center">
          <p className="text-sm text-zinc-500">No applications yet for this job.</p>
        </div>
      )}

      <div className="mt-6 space-y-3">
        {apps.map((app) => (
          <div key={app.id} className="rounded-lg border border-zinc-200 bg-white p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-zinc-900">Professional ID: {app.professionalId.slice(0, 8)}…</p>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[app.status] ?? 'bg-zinc-100 text-zinc-600'}`}>
                    {app.status.replace('_', ' ')}
                  </span>
                </div>
                {app.coverNote && (
                  <p className="mt-2 text-sm text-zinc-600 italic">&ldquo;{app.coverNote}&rdquo;</p>
                )}
                <p className="mt-1 text-xs text-zinc-400">Applied {new Date(app.createdAt).toLocaleDateString('en-GB')}</p>
              </div>

              {app.status !== 'withdrawn' && (
                <div className="flex items-center gap-2">
                  <select
                    value={app.status}
                    disabled={updating === app.id}
                    aria-label="Update application status"
                    onChange={(e) => void handleStatusChange(app.id, e.target.value)}
                    className="rounded-md border border-zinc-300 px-2 py-1.5 text-xs focus:border-zinc-900 focus:outline-none disabled:opacity-50"
                  >
                    {ALLOWED_TRANSITIONS.map((s) => (
                      <option key={s} value={s}>{s.replace('_', ' ')}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
