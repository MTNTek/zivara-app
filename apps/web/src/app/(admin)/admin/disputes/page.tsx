'use client';

import { useEffect, useState } from 'react';
import { apiClient, ApiError } from '@/lib/api-client';

interface Shift {
  id: string; employerId: string; professionalId: string;
  shiftDate: string; location: string; roleDescription: string;
  status: string; updatedAt: string;
}

export default function AdminDisputesPage() {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  const load = () => {
    apiClient.get<Shift[]>('/admin/disputes').then(setShifts).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const resolve = async (id: string, resolution: 'completed' | 'cancelled') => {
    const reason = prompt(`Reason for marking as ${resolution}:`);
    if (!reason) return;
    setProcessing(id);
    try {
      await apiClient.post(`/admin/disputes/${id}/resolve`, { resolution, reason });
      load();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Failed.');
    } finally { setProcessing(null); }
  };

  if (loading) return <main className="container mx-auto px-4 py-8"><p className="text-sm text-zinc-500">Loading…</p></main>;

  return (
    <main className="container mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-xl font-semibold text-zinc-900">Disputed shifts</h1>
      <p className="mt-1 text-sm text-zinc-500">{shifts.length} open dispute{shifts.length !== 1 ? 's' : ''}</p>

      {shifts.length === 0 && (
        <div className="mt-8 rounded-lg border border-zinc-100 bg-zinc-50 px-6 py-12 text-center">
          <p className="text-sm text-zinc-500">No open disputes.</p>
        </div>
      )}

      <div className="mt-6 space-y-3">
        {shifts.map((s) => (
          <div key={s.id} className="rounded-lg border border-amber-200 bg-amber-50 p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-medium text-zinc-900">{s.roleDescription}</p>
                <p className="mt-0.5 text-sm text-zinc-500">{s.location} · {s.shiftDate}</p>
                <p className="mt-0.5 text-xs text-zinc-400">
                  Employer: {s.employerId.slice(0, 8)}… · Professional: {s.professionalId.slice(0, 8)}…
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <button disabled={processing === s.id} onClick={() => void resolve(s.id, 'completed')} className="rounded-md bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50">Mark completed</button>
                <button disabled={processing === s.id} onClick={() => void resolve(s.id, 'cancelled')} className="rounded-md border border-red-300 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50">Mark cancelled</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
