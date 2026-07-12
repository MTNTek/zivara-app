'use client';

import { useEffect, useState } from 'react';
import { apiClient, ApiError } from '@/lib/api-client';

interface Shift {
  id: string;
  shiftDate: string;
  startTime: string;
  endTime: string;
  location: string;
  roleDescription: string;
  status: string;
  professionalConfirmedAt: string | null;
  employerConfirmedCompletion: boolean;
  professionalConfirmedCompletion: boolean;
}

interface ShiftsResponse {
  upcoming: Shift[];
  active: Shift[];
  past: Shift[];
}

const STATUS_STYLES: Record<string, string> = {
  scheduled: 'bg-blue-50 text-blue-700',
  confirmed: 'bg-green-50 text-green-700',
  completed: 'bg-zinc-100 text-zinc-600',
  cancelled: 'bg-red-50 text-red-700',
  disputed: 'bg-amber-50 text-amber-700',
};

function ShiftCard({ shift, onAction }: { shift: Shift; onAction: () => void }) {
  const [busy, setBusy] = useState(false);

  const handleConfirm = async () => {
    setBusy(true);
    try {
      await apiClient.post(`/shifts/${shift.id}/confirm`);
      onAction();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Failed.');
    } finally { setBusy(false); }
  };

  const handleConfirmCompletion = async () => {
    setBusy(true);
    try {
      await apiClient.post(`/shifts/${shift.id}/confirm-completion`);
      onAction();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Failed.');
    } finally { setBusy(false); }
  };

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-medium text-zinc-900">{shift.roleDescription}</p>
          <p className="mt-0.5 text-sm text-zinc-500">{shift.location}</p>
          <p className="mt-0.5 text-xs text-zinc-400">
            {shift.shiftDate} · {shift.startTime.slice(0, 5)} – {shift.endTime.slice(0, 5)}
          </p>
        </div>
        <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[shift.status] ?? 'bg-zinc-100 text-zinc-600'}`}>
          {shift.status}
        </span>
      </div>
      <div className="mt-3 flex gap-2">
        {shift.status === 'scheduled' && !shift.professionalConfirmedAt && (
          <button
            onClick={() => void handleConfirm()}
            disabled={busy}
            className="rounded-md bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-700 disabled:opacity-60"
          >
            {busy ? '…' : 'Confirm shift'}
          </button>
        )}
        {['scheduled', 'confirmed'].includes(shift.status) && !shift.professionalConfirmedCompletion && (
          <button
            onClick={() => void handleConfirmCompletion()}
            disabled={busy}
            className="rounded-md border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-60"
          >
            {busy ? '…' : 'Mark completed'}
          </button>
        )}
      </div>
    </div>
  );
}

export default function ProfessionalShiftsPage() {
  const [data, setData] = useState<ShiftsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    apiClient.get<ShiftsResponse>('/shifts/professional/mine')
      .then(setData)
      .catch((err: unknown) => setError(err instanceof ApiError ? err.message : 'Failed to load shifts.'))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  if (loading) return <main className="container mx-auto px-4 py-8"><p className="text-sm text-zinc-500">Loading…</p></main>;
  if (error || !data) return <main className="container mx-auto px-4 py-8"><p className="text-sm text-red-600">{error}</p></main>;

  const Section = ({ title, items }: { title: string; items: Shift[] }) => (
    <section className="mt-6">
      <h2 className="text-sm font-semibold text-zinc-700">{title} ({items.length})</h2>
      {items.length === 0 ? (
        <p className="mt-2 text-sm text-zinc-400">None.</p>
      ) : (
        <div className="mt-3 space-y-3">
          {items.map((s) => <ShiftCard key={s.id} shift={s} onAction={load} />)}
        </div>
      )}
    </section>
  );

  return (
    <main className="container mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-xl font-semibold text-zinc-900">My shifts</h1>
      <Section title="Upcoming" items={data.upcoming} />
      <Section title="Active today" items={data.active} />
      <Section title="Past" items={data.past} />
    </main>
  );
}
