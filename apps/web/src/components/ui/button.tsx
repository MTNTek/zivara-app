import { type ButtonHTMLAttributes, forwardRef } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'destructive';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  fullWidth?: boolean;
}

const base =
  'inline-flex items-center justify-center gap-2 font-semibold rounded-[6px] transition-all duration-[120ms] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#14B8A6] disabled:cursor-not-allowed disabled:opacity-40 active:scale-[0.98] select-none';

const variants: Record<Variant, string> = {
  primary:
    'bg-[#14B8A6] text-white hover:bg-[#0D9488] hover:shadow-[0_4px_16px_rgba(20,184,166,0.25)]',
  secondary:
    'bg-white text-[#0F172A] border-[1.5px] border-[#E2E8F0] hover:border-[#14B8A6] hover:text-[#14B8A6] hover:bg-[#F0FDFA]',
  ghost:
    'bg-transparent text-[#14B8A6] hover:bg-[#F0FDFA]',
  destructive:
    'bg-[#EF4444] text-white hover:bg-[#DC2626]',
};

const sizes: Record<Size, string> = {
  sm: 'h-9 px-4 text-sm',
  md: 'h-12 px-6 text-[15px]',
  lg: 'h-14 px-8 text-base',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading = false, fullWidth = false, children, className = '', disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled ?? loading}
        className={`${base} ${variants[variant]} ${sizes[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
        {...props}
      >
        {loading ? (
          <>
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            <span>Loading…</span>
          </>
        ) : children}
      </button>
    );
  },
);

Button.displayName = 'Button';
