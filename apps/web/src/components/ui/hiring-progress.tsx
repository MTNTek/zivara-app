'use client';

interface HiringProgressProps {
  total: number;
  hired: number;
  applicants?: number;
  showLive?: boolean;
  compact?: boolean;
}

export function HiringProgress({
  total,
  hired,
  applicants,
  showLive = true,
  compact = false,
}: HiringProgressProps) {
  const pct = total > 0 ? Math.min((hired / total) * 100, 100) : 0;
  const remaining = Math.max(total - hired, 0);
  const isFilled = remaining === 0;
  const isUrgent = !isFilled && remaining <= Math.max(Math.ceil(total * 0.2), 3);

  const barColor = isFilled
    ? '#22C55E'
    : isUrgent
    ? '#F59E0B'
    : '#14B8A6';

  if (compact) {
    return (
      <div className="space-y-1">
        <div className="w-full h-1.5 bg-[#E2E8F0] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full progress-bar-fill"
            style={{ width: `${pct}%`, backgroundColor: barColor }}
          />
        </div>
        <p className="text-xs text-[#64748B]">
          {isFilled ? 'All positions filled' : `${hired}/${total} hired`}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {showLive && !isFilled && (
            <span className="live-dot" aria-hidden="true" />
          )}
          <span className="text-xs font-semibold text-[#475569] uppercase tracking-wide">
            {isFilled ? 'Position Filled' : 'Live Hiring Progress'}
          </span>
        </div>
        <span className="text-xs font-semibold text-[#0F172A]">
          {hired} of {total} hired
        </span>
      </div>

      {/* Bar */}
      <div
        className="w-full h-2 bg-[#E2E8F0] rounded-full overflow-hidden"
        role="progressbar"
        aria-valuenow={hired}
        aria-valuemin={0}
        aria-valuemax={total}
        aria-label={`${hired} of ${total} positions filled`}
      >
        <div
          className="h-full rounded-full progress-bar-fill"
          style={{ width: `${pct}%`, backgroundColor: barColor }}
        />
      </div>

      {/* Status line */}
      <div className="flex items-center justify-between text-xs">
        {isFilled ? (
          <span className="font-semibold text-[#15803D]">✓ All positions filled</span>
        ) : isUrgent ? (
          <span className="font-semibold text-[#B45309]">🔥 Only {remaining} remaining</span>
        ) : (
          <span className="text-[#64748B]">{remaining} positions remaining</span>
        )}
        {applicants !== undefined && (
          <span className="text-[#94A3B8]">{applicants} applicants</span>
        )}
      </div>
    </div>
  );
}
