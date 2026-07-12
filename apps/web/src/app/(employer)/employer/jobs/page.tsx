'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiClient, ApiError } from '@/lib/api-client';

interface Job {
  id: string;
  title: Record<string, string>;
  industry: string;
  city: string;
  country: string;
  employmentType: string;
  status: string;
  viewCount: number;
  createdAt: string;
}

const STATUS_STYLES: Record<string, string> = {
  active: 'bg-green-50 text-green-700',
  draft: 'bg-zinc-100 text-zinc-600',
  closed: 'bg-red-50 text-red-700',
  expired: 'bg-amber-50 text-amber-700',
};

export default function EmployerJobsPage() {
  const [jobList, setJobList] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    apiClient.get<Job[]>('/jobs/employer/mine')
      .then(setJobList)
      .catch((err: unknown) => setError(err instanceof ApiError ? err.message : 'Failed to load jobs.'))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleClose = async (id: string) => {
    if (!confirm('Close this job posting?')) return;
    try {
      await apiClient.post(`/jobs/${id}/close`);
      setJobList((prev) => prev.map((j) => j.id === id ? { ...j, status: 'closed' } : j));
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Failed to close job.');
    }
  };

  if (loading) return <main className="container mx-auto px-4 py-8"><p className="text-sm text-zinc-500">Loading…</p></main>;
  if (error) return <main className="container mx-auto px-4 py-8"><p className="text-sm text-red-600">{error}</p></main>;

  return (
    <main className="container mx-auto max-w-4xl px-4 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-zinc-900">My job postings</h1>
        <Link href="/employer/jobs/new" className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700">
          + Post a job
        </Link>
      </div>

      {jobList.length === 0 && (
        <div className="mt-8 rounded-lg border border-zinc-100 bg-zinc-50 px-6 py-12 text-center">
          <p className="text-sm text-zinc-500">No job postings yet.</p>
          <Link href="/employer/jobs/new" className="mt-4 inline-block text-sm font-medium text-zinc-900 hover:underline">Post your first job →</Link>
        </div>
      )}

      <div className="mt-6 space-y-3">
        {jobList.map((job) => (
          <div key={job.id} className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white p-4">
            <div>
              <div className="flex items-center gap-2">
                <p className="font-medium text-zinc-900">{job.title['en']}</p>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[job.status] ?? 'bg-zinc-100 text-zinc-600'}`}>
                  {job.status}
                </span>
              </div>
              <p className="mt-0.5 text-sm text-zinc-500">{job.industry} · {job.city}, {job.country}</p>
              <p className="mt-0.5 text-xs text-zinc-400">{job.viewCount} views</p>
            </div>
            <div className="flex items-center gap-2">
              {job.status === 'draft' && (
                <button
                  onClick={async () => {
                    try {
                      await apiClient.post(`/jobs/${job.id}/publish`);
                      setJobList((prev) => prev.map((j) => j.id === job.id ? { ...j, status: 'active' } : j));
                    } catch (err) { alert(err instanceof ApiError ? err.message : 'Failed.'); }
                  }}
                  className="rounded-md bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-700"
                >
                  Publish
                </button>
              )}
              {job.status === 'active' && (
                <button onClick={() => void handleClose(job.id)} className="rounded-md border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-50">
                  Close
                </button>
              )}
              <Link href={`/employer/applications/${job.id}`} className="rounded-md border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-50">
                Applications
              </Link>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
