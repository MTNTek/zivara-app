type BadgeVariant =
  | 'verified'
  | 'draft'
  | 'open'
  | 'hiring'
  | 'filled'
  | 'completed'
  | 'archived'
  | 'received'
  | 'under_review'
  | 'shortlisted'
  | 'hired'
  | 'rejected'
  | 'withdrawn'
  | 'success'
  | 'warning'
  | 'error'
  | 'neutral';

const styles: Record<BadgeVariant, string> = {
  verified:    'bg-[#F0FDF4] text-[#15803D] border border-[rgba(34,197,94,0.2)]',
  draft:       'bg-[#F1F5F9] text-[#64748B]',
  open:        'bg-[#F0FDFA] text-[#0D9488]',
  hiring:      'bg-[#F0FDFA] text-[#0D9488]',
  filled:      'bg-[#F0FDF4] text-[#15803D]',
  completed:   'bg-[#F1F5F9] text-[#475569]',
  archived:    'bg-[#F1F5F9] text-[#94A3B8]',
  received:    'bg-[#F1F5F9] text-[#475569]',
  under_review:'bg-[#FFFBEB] text-[#B45309]',
  shortlisted: 'bg-[#F0FDFA] text-[#0D9488]',
  hired:       'bg-[#F0FDF4] text-[#15803D]',
  rejected:    'bg-[#FEF2F2] text-[#B91C1C]',
  withdrawn:   'bg-[#F1F5F9] text-[#94A3B8]',
  success:     'bg-[#F0FDF4] text-[#15803D]',
  warning:     'bg-[#FFFBEB] text-[#B45309]',
  error:       'bg-[#FEF2F2] text-[#B91C1C]',
  neutral:     'bg-[#F1F5F9] text-[#475569]',
};

const labels: Partial<Record<BadgeVariant, string>> = {
  verified:    '✓ Verified Employer',
  open:        'Hiring Now',
  hiring:      'Hiring',
  filled:      'Filled',
  completed:   'Completed',
  archived:    'Archived',
  under_review:'Under Review',
  shortlisted: '⭐ Shortlisted',
  hired:       '✓ Hired',
  rejected:    'Not Selected',
};

interface BadgeProps {
  variant: BadgeVariant;
  children?: React.ReactNode;
  className?: string;
}

export function Badge({ variant, children, className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${styles[variant]} ${className}`}
    >
      {children ?? labels[variant] ?? variant}
    </span>
  );
}
