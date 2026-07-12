'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { apiClient, ApiError } from '@/lib/api-client';

interface Member {
  id: string;
  userId: string;
  role: string;
  createdAt: string;
  user: { id: string; email: string };
}

interface ProfileMeta { memberRole: string }

const inviteSchema = z.object({
  email: z.string().email('Please enter a valid email address.'),
  role: z.enum(['manager', 'recruiter']),
});
type InviteForm = z.infer<typeof inviteSchema>;

const inputClass = 'mt-1 block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm placeholder-zinc-400 shadow-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900';

export default function TeamPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [myRole, setMyRole] = useState<string>('recruiter');
  const [loading, setLoading] = useState(true);
  const [serverError, setServerError] = useState<string | null>(null);
  const [inviteSuccess, setInviteSuccess] = useState<string | null>(null);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<InviteForm>({
    resolver: zodResolver(inviteSchema as Parameters<typeof zodResolver>[0]),
    defaultValues: { role: 'recruiter' },
  });

  const load = () => {
    Promise.all([
      apiClient.get<Member[]>('/employers/me/members'),
      apiClient.get<ProfileMeta>('/employers/me'),
    ]).then(([m, p]) => {
      setMembers(m);
      setMyRole(p.memberRole);
    }).finally(() => setLoading(false));
  };

  useEffect(load, []);

  const onInvite = async (data: InviteForm) => {
    setServerError(null);
    setInviteSuccess(null);
    try {
      await apiClient.post('/employers/me/members', data);
      setInviteSuccess(`${data.email} has been added to your team.`);
      reset();
      load();
    } catch (err) {
      setServerError(err instanceof ApiError ? err.message : 'Failed to add member.');
    }
  };

  const handleRemove = async (memberId: string) => {
    if (!confirm('Remove this team member?')) return;
    try {
      await apiClient.delete(`/employers/me/members/${memberId}`);
      setMembers((prev) => prev.filter((m) => m.id !== memberId));
    } catch (err) {
      setServerError(err instanceof ApiError ? err.message : 'Failed to remove member.');
    }
  };

  if (loading) return <main className="container mx-auto px-4 py-8"><p className="text-sm text-zinc-500">Loading…</p></main>;

  const isOwner = myRole === 'owner';
  const canInvite = myRole === 'owner' || myRole === 'manager';

  return (
    <main className="container mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-xl font-semibold text-zinc-900">Team members</h1>

      {serverError && <div role="alert" className="mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{serverError}</div>}
      {inviteSuccess && <div role="status" className="mt-4 rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{inviteSuccess}</div>}

      {/* Member list */}
      <div className="mt-6 divide-y divide-zinc-100 rounded-lg border border-zinc-200 bg-white">
        {members.length === 0 && (
          <p className="px-5 py-4 text-sm text-zinc-400">No team members yet.</p>
        )}
        {members.map((m) => (
          <div key={m.id} className="flex items-center justify-between px-5 py-3">
            <div>
              <p className="text-sm font-medium text-zinc-900">{m.user.email}</p>
              <p className="text-xs text-zinc-400 capitalize">{m.role}</p>
            </div>
            {isOwner && m.role !== 'owner' && (
              <button
                onClick={() => void handleRemove(m.id)}
                className="text-xs text-red-500 hover:text-red-700"
                aria-label={`Remove ${m.user.email}`}
              >
                Remove
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Invite form */}
      {canInvite && (
        <section className="mt-8">
          <h2 className="text-sm font-semibold text-zinc-700">Invite a team member</h2>
          <p className="mt-1 text-xs text-zinc-400">They must already have a Zivara account.</p>

          <form onSubmit={handleSubmit(onInvite)} noValidate className="mt-4 space-y-3">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-zinc-700">Email address</label>
              <input id="email" type="email" className={inputClass} placeholder="colleague@company.com" {...register('email')} />
              {errors.email && <p role="alert" className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
            </div>
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-zinc-700">Role</label>
              <select id="role" className={inputClass} {...register('role')}>
                <option value="manager">Manager</option>
                <option value="recruiter">Recruiter</option>
              </select>
            </div>
            <button type="submit" disabled={isSubmitting} className="rounded-md bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-60">
              {isSubmitting ? 'Adding…' : 'Add to team'}
            </button>
          </form>
        </section>
      )}
    </main>
  );
}
