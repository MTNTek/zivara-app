'use client';

import { useEffect, useState } from 'react';
import { apiClient, ApiError } from '@/lib/api-client';

interface Shift {
  id: string;
  professionalId: string;
  shiftDate: string;
  startTime: string;
  endTime: string;
  location: string;
  roleDescription: string;
  status: string;
  employerConfirmedCompletion: boolean;
  professionalConfirmedCompletion: boolean;
}

const STATUS_STYLES: Record<string, string> = {
  scheduled: 'bg-blue-50 text-blue-700',
  confirmed: 'bg-green-50 text-green-700',
  completed: 'bg-zinc-100 text-zinc-600',
  cancelled: 'bg-red-50 text-red-700',
  disputed: 'bg-amber-50 text-amber-700',
};

export default function EmployerShiftsPage() {
  const [shiftList, setShiftList] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    apiClient.get<Shift[]>('/shifts/employer/mine')
      .then(setShiftList)
      .catch((err: unknown) => setError(err instanceof ApiError ? err.message : 'Failed to load.'))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleConfirmCompletion = async (id: string) => {
    try {
      await apiClient.post(`/shifts/${id}/confirm-completion`);
      load();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Failed.');
    }
  };

  if (loading) return <main className="container mx-auto px-4 py-8"><p className="text-sm text-zinc-500">Loading…</p></main>;
  if (error) return <main className="container mx-auto px-4 py-8"><p className="text-sm text-red-600">{error}</p></main>;

  return (
    <main className="container mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-xl font-semibold text-zinc-900">Shifts</h1>
      <p className="mt-1 text-sm text-zinc-500">{shiftList.length} shift{shiftList.length !== 1 ? 's' : ''} total</p>

      {shiftList.length === 0 && (
        <div className="mt-8 rounded-lg border border-zinc-100 bg-zinc-50 px-6 py-12 text-center">
          <p className="text-sm text-zinc-500">No shifts scheduled yet.</p>
        </div>
      )}

      <div className="mt-6 space-y-3">
        {shiftList.map((s) => (
          <div key={s.id} className="rounded-lg border border-zinc-200 bg-white p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-medium text-zinc-900">{s.roleDescription}</p>
                <p className="mt-0.5 text-sm text-zinc-500">{s.location}</p>
                <p className="mt-0.5 text-xs text-zinc-400">
                  {s.shiftDate} · {s.startTime.slice(0, 5)} – {s.endTime.slice(0, 5)}
                </p>
                <p className="mt-0.5 text-xs text-zinc-400">
                  Professional: {s.professionalId.slice(0, 8)}…
                </p>
                <div className="mt-1 flex gap-3 text-xs text-zinc-400">
                  <span>You confirmed: {s.employerConfirmedCompletion ? '✓' : '–'}</span>
                  <span>Professional confirmed: {s.professionalConfirmedCompletion ? '✓' : '–'}</span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[s.status] ?? 'bg-zinc-100 text-zinc-600'}`}>
                  {s.status}
                </span>
                {['scheduled', 'confirmed'].includes(s.status) && !s.employerConfirmedCompletion && (
                  <button
                    onClick={() => void handleConfirmCompletion(s.id)}
                    className="rounded-md border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
                  >
                    Mark completed
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
