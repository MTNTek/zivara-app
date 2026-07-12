'use client';

import { useEffect, useState } from 'react';
import { apiClient, ApiError } from '@/lib/api-client';

interface Notification {
  id: string;
  type: string;
  title: Record<string, string>;
  body: Record<string, string>;
  referenceType: string | null;
  referenceId: string | null;
  isRead: boolean;
  createdAt: string;
}

interface NotificationsResponse {
  data: Notification[];
  unreadCount: number;
  page: number;
}

const TYPE_ICON: Record<string, string> = {
  application_shortlisted: '⭐',
  application_hired: '🎉',
  application_rejected: '📋',
  application_received: '📩',
  application_under_review: '👀',
  shift_assigned: '📅',
  shift_confirmed: '✓',
  shift_cancelled: '✗',
  payment_processed: '💳',
  verification_approved: '✓',
  account_suspended: '⚠',
};

export default function NotificationsPage() {
  const [data, setData] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    apiClient.get<NotificationsResponse>('/notifications')
      .then((res) => { setData(res.data); setUnreadCount(res.unreadCount); })
      .catch((err: unknown) => setError(err instanceof ApiError ? err.message : 'Failed to load.'))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleMarkAllRead = async () => {
    try {
      await apiClient.patch('/notifications/read-all');
      setData((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch { /* silent */ }
  };

  const handleMarkRead = async (id: string) => {
    try {
      await apiClient.patch(`/notifications/${id}/read`);
      setData((prev) => prev.map((n) => n.id === id ? { ...n, isRead: true } : n));
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch { /* silent */ }
  };

  if (loading) return <main className="container mx-auto px-4 py-8"><p className="text-sm text-zinc-500">Loading…</p></main>;
  if (error) return <main className="container mx-auto px-4 py-8"><p className="text-sm text-red-600">{error}</p></main>;

  return (
    <main className="container mx-auto max-w-2xl px-4 py-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-semibold text-zinc-900">Notifications</h1>
          {unreadCount > 0 && (
            <span className="rounded-full bg-zinc-900 px-2 py-0.5 text-xs font-medium text-white">
              {unreadCount}
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={() => void handleMarkAllRead()}
            className="text-xs text-zinc-500 hover:text-zinc-900 hover:underline"
          >
            Mark all as read
          </button>
        )}
      </div>

      {data.length === 0 && (
        <div className="mt-8 rounded-lg border border-zinc-100 bg-zinc-50 px-6 py-12 text-center">
          <p className="text-sm text-zinc-500">No notifications yet.</p>
        </div>
      )}

      <div
        role="log"
        aria-label="Notifications"
        aria-live="polite"
        className="mt-6 divide-y divide-zinc-100"
      >
        {data.map((n) => (
          <div
            key={n.id}
            className={`flex gap-3 py-4 ${!n.isRead ? 'bg-zinc-50' : ''}`}
            onClick={() => { if (!n.isRead) void handleMarkRead(n.id); }}
            role={!n.isRead ? 'button' : undefined}
            tabIndex={!n.isRead ? 0 : undefined}
            onKeyDown={(e) => { if (!n.isRead && (e.key === 'Enter' || e.key === ' ')) void handleMarkRead(n.id); }}
            aria-label={!n.isRead ? `Mark "${n.title['en']}" as read` : undefined}
          >
            <div className="shrink-0 text-lg" aria-hidden="true">
              {TYPE_ICON[n.type] ?? '🔔'}
            </div>
            <div className="flex-1">
              <p className={`text-sm ${!n.isRead ? 'font-semibold text-zinc-900' : 'text-zinc-700'}`}>
                {n.title['en']}
              </p>
              <p className="mt-0.5 text-sm text-zinc-500">{n.body['en']}</p>
              <p className="mt-1 text-xs text-zinc-400">
                {new Date(n.createdAt).toLocaleDateString('en-GB', {
                  day: 'numeric', month: 'short', year: 'numeric',
                })}
              </p>
            </div>
            {!n.isRead && (
              <div className="shrink-0">
                <span className="inline-block h-2 w-2 rounded-full bg-zinc-900" aria-hidden="true" />
              </div>
            )}
          </div>
        ))}
      </div>
    </main>
  );
}
