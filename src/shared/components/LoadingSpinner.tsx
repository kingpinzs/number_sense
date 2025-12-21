// LoadingSpinner - Accessible loading indicator with size variants
// Uses Tailwind animate-spin, respects prefers-reduced-motion

export interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  className?: string;
  label?: string;
}

const sizeClasses = {
  small: 'w-6 h-6',   // 24px
  medium: 'w-10 h-10', // 40px
  large: 'w-15 h-15',  // 60px
} as const;

// Using actual pixel values for precise sizing
const sizeStyles = {
  small: { width: '24px', height: '24px' },
  medium: { width: '40px', height: '40px' },
  large: { width: '60px', height: '60px' },
} as const;

/**
 * LoadingSpinner component - Accessible circular loading indicator
 * Features:
 * - Three size variants: small (24px), medium (40px), large (60px)
 * - WCAG 2.1 AA compliant with role="status" and aria-live="polite"
 * - Screen reader text for accessibility
 * - Respects prefers-reduced-motion via Tailwind's motion-safe
 */
export function LoadingSpinner({
  size = 'medium',
  className = '',
  label = 'Loading...',
}: LoadingSpinnerProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={`inline-flex items-center justify-center ${className}`}
    >
      <svg
        className={`motion-safe:animate-spin text-primary ${sizeClasses[size]}`}
        style={sizeStyles[size]}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
      <span className="sr-only">{label}</span>
    </div>
  );
}
