/**
 * Transparency Toast Component
 * Story 4.5: Build Transparency Toast Notifications
 *
 * Purpose: Display user-friendly notifications when difficulty adjusts
 * AC-1: TransparencyToast component displays explaining the change
 * AC-3: Toast UI requirements (Sonner, responsive, accessible)
 */

import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import type { AdjustmentResult } from '@/services/adaptiveDifficulty/difficultyEngine';
import { getToastMessage } from '../utils/toastMessages';
import { getToastPosition } from '../utils/toastPosition';

export interface TransparencyToastProps {
  /** Array of adjustments from the difficulty engine */
  adjustments: AdjustmentResult[];
  /** Callback when toast is dismissed */
  onDismiss?: () => void;
}

/**
 * TransparencyToast Component
 *
 * Displays a toast notification when difficulty adjustments occur.
 * Uses Sonner toast library with responsive positioning and accessibility.
 *
 * Usage:
 * ```tsx
 * <TransparencyToast
 *   adjustments={difficultyAdjustments}
 *   onDismiss={() => setDifficultyAdjustments([])}
 * />
 * ```
 */
export function TransparencyToast({ adjustments, onDismiss }: TransparencyToastProps) {
  // Track the last shown adjustment timestamp to detect new ones and prevent duplicates
  const lastShownTimestampRef = useRef<string | null>(null);

  useEffect(() => {
    // AC-3: Only show one toast per session end (no spam)
    // Show only the first adjustment if multiple exist
    if (adjustments.length === 0) {
      // Reset tracking when adjustments are cleared
      lastShownTimestampRef.current = null;
      return;
    }

    const firstAdjustment = adjustments[0];

    // Check if this is a new adjustment (different timestamp)
    // This prevents duplicate toasts for the same adjustment on re-renders
    if (lastShownTimestampRef.current === firstAdjustment.timestamp) {
      return; // Already shown this adjustment
    }

    // Get user-friendly message content
    const { emoji, message } = getToastMessage(firstAdjustment);

    // Build toast message with emoji
    const toastMessage = `${emoji} ${message}`;

    // AC-3: Responsive positioning
    const position = getToastPosition();

    // Show the toast with Sonner
    // AC-3 Accessibility: Sonner's Toaster component creates an aria-live region
    // that announces toasts to screen readers. The <Toaster /> in App/Layout
    // handles accessibility via:
    // - aria-live="polite" on the toast container
    // - aria-atomic="true" for complete announcement
    // - role="status" equivalent behavior via live region
    // See: https://sonner.emilkowal.ski/ for accessibility details
    toast(toastMessage, {
      duration: 5000, // AC-3: Auto-dismiss after 5 seconds
      dismissible: true, // AC-3: User can dismiss early with X button
      position,
      // Add description for enhanced screen reader context
      description: 'Your difficulty level has been adjusted based on your performance.',
      onDismiss: () => {
        onDismiss?.();
      },
      onAutoClose: () => {
        onDismiss?.();
      },
    });

    // Mark this adjustment as shown to prevent duplicates
    lastShownTimestampRef.current = firstAdjustment.timestamp;
  }, [adjustments, onDismiss]);

  // This component doesn't render anything visible
  // It just manages toast display via useEffect
  return null;
}

/**
 * Programmatic function to show transparency toast
 * Alternative to using the component
 *
 * @param adjustments - Array of adjustments from difficulty engine
 * @param onDismiss - Optional callback when dismissed
 */
export function showTransparencyToastImperative(
  adjustments: AdjustmentResult[],
  onDismiss?: () => void
): void {
  if (adjustments.length === 0) return;

  const firstAdjustment = adjustments[0];
  const { emoji, message } = getToastMessage(firstAdjustment);
  const toastMessage = `${emoji} ${message}`;
  const position = getToastPosition();

  toast(toastMessage, {
    duration: 5000,
    dismissible: true,
    position,
    description: 'Your difficulty level has been adjusted based on your performance.',
    onDismiss: () => {
      onDismiss?.();
    },
    onAutoClose: () => {
      onDismiss?.();
    },
  });
}
