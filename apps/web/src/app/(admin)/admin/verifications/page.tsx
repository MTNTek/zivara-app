'use client';

import { useEffect, useState } from 'react';
import { apiClient, ApiError } from '@/lib/api-client';

interface ProfessionalVerification {
  id: string; userId: string; fullName: string;
  verificationStatus: string; createdAt: string;
}
interface EmployerVerification {
  id: string; ownerUserId: string; companyName: string;
  tradeLicenseNumber: string; verificationStatus: string; createdAt: string;
}
interface VerificationsResponse {
  professionals: ProfessionalVerification[];
  employers: EmployerVerification[];
}

export default function AdminVerificationsPage() {
  const [data, setData] = useState<VerificationsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  const load = () => {
    apiClient.get<VerificationsResponse>('/admin/verifications')
      .then(setData).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const decide = async (type: 'professionals' | 'employers', id: string, decision: 'approved' | 'rejected') => {
    const reason = decision === 'approved' ? 'Identity and documents verified.' : prompt('Rejection reason (required):');
    if (!reason) return;
    setProcessing(id);
    try {
      await apiClient.post(`/admin/verifications/${type}/${id}`, { decision, reason });
      load();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Failed.');
    } finally { setProcessing(null); }
  };

  if (loading) return <main className="container mx-auto px-4 py-8"><p className="text-sm text-zinc-500">Loading…</p></main>;

  const total = (data?.professionals.length ?? 0) + (data?.employers.length ?? 0);

  return (
    <main className="container mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-xl font-semibold text-zinc-900">Verification queue</h1>
      <p className="mt-1 text-sm text-zinc-500">{total} pending</p>

      {total === 0 && (
        <div className="mt-8 rounded-lg border border-zinc-100 bg-zinc-50 px-6 py-12 text-center">
          <p className="text-sm text-zinc-500">No pending verifications.</p>
        </div>
      )}

      {(data?.professionals.length ?? 0) > 0 && (
        <section className="mt-6">
          <h2 className="text-sm font-semibold text-zinc-700">Professionals ({data!.professionals.length})</h2>
          <div className="mt-3 space-y-3">
            {data!.professionals.map((p) => (
              <div key={p.id} className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white px-5 py-4">
                <div>
                  <p className="text-sm font-medium text-zinc-900">{p.fullName}</p>
                  <p className="text-xs text-zinc-400">Submitted {new Date(p.createdAt).toLocaleDateString('en-GB')}</p>
                </div>
                <div className="flex gap-2">
                  <button disabled={processing === p.id} onClick={() => void decide('professionals', p.id, 'approved')} className="rounded-md bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50">Approve</button>
                  <button disabled={processing === p.id} onClick={() => void decide('professionals', p.id, 'rejected')} className="rounded-md border border-red-300 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50">Reject</button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {(data?.employers.length ?? 0) > 0 && (
        <section className="mt-6">
          <h2 className="text-sm font-semibold text-zinc-700">Employers ({data!.employers.length})</h2>
          <div className="mt-3 space-y-3">
            {data!.employers.map((e) => (
              <div key={e.id} className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white px-5 py-4">
                <div>
                  <p className="text-sm font-medium text-zinc-900">{e.companyName}</p>
                  <p className="text-xs text-zinc-500">License: {e.tradeLicenseNumber}</p>
                  <p className="text-xs text-zinc-400">Submitted {new Date(e.createdAt).toLocaleDateString('en-GB')}</p>
                </div>
                <div className="flex gap-2">
                  <button disabled={processing === e.id} onClick={() => void decide('employers', e.id, 'approved')} className="rounded-md bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50">Approve</button>
                  <button disabled={processing === e.id} onClick={() => void decide('employers', e.id, 'rejected')} className="rounded-md border border-red-300 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50">Reject</button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
