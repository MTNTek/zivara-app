interface StarRatingProps {
  average: number;
  count: number;
  size?: 'sm' | 'md';
}

export function StarRating({ average, count, size = 'sm' }: StarRatingProps) {
  if (count === 0) return null;

  const filled = Math.round(average);
  const starSize = size === 'md' ? 'text-base' : 'text-sm';

  return (
    <div className="flex items-center gap-1.5" aria-label={`${average} out of 5 stars, ${count} review${count !== 1 ? 's' : ''}`}>
      <span className={`${starSize} text-amber-400`} aria-hidden="true">
        {'★'.repeat(filled)}{'☆'.repeat(5 - filled)}
      </span>
      <span className={`${size === 'md' ? 'text-sm' : 'text-xs'} text-zinc-500`}>
        {average} ({count})
      </span>
    </div>
  );
}
