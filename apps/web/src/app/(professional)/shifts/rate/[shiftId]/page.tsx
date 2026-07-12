'use client';

import { useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient, ApiError } from '@/lib/api-client';

interface PageProps { params: Promise<{ shiftId: string }> }

export default function RateShiftPage({ params }: PageProps) {
  const { shiftId } = use(params);
  const router = useRouter();
  const [stars, setStars] = useState(0);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (stars === 0) { setError('Please select a star rating.'); return; }
    setError(null);
    setSubmitting(true);
    try {
      await apiClient.post('/ratings', {
        shiftId,
        stars,
        reviewText: reviewText.trim() || undefined,
      });
      setSuccess(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to submit rating.');
    } finally { setSubmitting(false); }
  };

  if (success) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-white px-4">
        <div className="w-full max-w-sm text-center">
          <div className="mb-3 text-4xl">⭐</div>
          <h1 className="text-lg font-semibold text-zinc-900">Rating submitted</h1>
          <p className="mt-1 text-sm text-zinc-500">Thank you for your feedback.</p>
          <button
            onClick={() => router.push('/professional/shifts')}
            className="mt-5 rounded-md bg-zinc-900 px-5 py-2 text-sm font-medium text-white hover:bg-zinc-700"
          >
            Back to shifts
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-white px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-xl font-semibold text-zinc-900">Rate this shift</h1>
        <p className="mt-1 text-sm text-zinc-500">Your rating helps build trust on the platform.</p>

        {error && (
          <div role="alert" className="mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={onSubmit} className="mt-6 space-y-5">
          {/* Star selector */}
          <div>
            <p className="text-sm font-medium text-zinc-700">Rating</p>
            <div
              className="mt-2 flex gap-1"
              role="group"
              aria-label="Star rating"
            >
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setStars(n)}
                  onMouseEnter={() => setHoveredStar(n)}
                  onMouseLeave={() => setHoveredStar(0)}
                  aria-label={`${n} star${n !== 1 ? 's' : ''}`}
                  aria-pressed={stars === n}
                  className={`text-3xl transition-colors ${
                    n <= (hoveredStar || stars) ? 'text-amber-400' : 'text-zinc-200'
                  }`}
                >
                  ★
                </button>
              ))}
            </div>
            {stars > 0 && (
              <p className="mt-1 text-xs text-zinc-400">
                {['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent'][stars]}
              </p>
            )}
          </div>

          {/* Review text */}
          <div>
            <label htmlFor="reviewText" className="block text-sm font-medium text-zinc-700">
              Written review <span className="text-zinc-400">(optional)</span>
            </label>
            <textarea
              id="reviewText"
              rows={3}
              maxLength={1000}
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder="Share your experience…"
              className="mt-1 block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm placeholder-zinc-400 focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
            />
            <p className="mt-1 text-right text-xs text-zinc-400">{reviewText.length}/1000</p>
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={submitting || stars === 0}
              className="rounded-md bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-60"
            >
              {submitting ? 'Submitting…' : 'Submit rating'}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="rounded-md border border-zinc-300 px-5 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
