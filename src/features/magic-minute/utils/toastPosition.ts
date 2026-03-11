/**
 * Shared Toast Position Utilities
 * Story 4.5: Build Transparency Toast Notifications
 *
 * Purpose: Responsive toast positioning for mobile/desktop
 * AC-3: bottom-center on mobile, top-right on desktop
 */

/**
 * Mobile breakpoint for toast positioning (768px matches Tailwind 'md')
 */
export const MOBILE_BREAKPOINT = 768;

/**
 * Detect if running on mobile device (width < 768px)
 * Used for responsive toast positioning
 */
export function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false;
  return window.innerWidth < MOBILE_BREAKPOINT;
}

/**
 * Toast position type - Sonner-compatible
 */
export type ToastPosition = 'top-center' | 'top-right';

/**
 * Get responsive toast position based on screen width
 * Mobile uses top-center to avoid being cut off by the fixed BottomNav bar.
 */
export function getToastPosition(): ToastPosition {
  return isMobileDevice() ? 'top-center' : 'top-right';
}
