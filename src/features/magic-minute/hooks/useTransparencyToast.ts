/**
 * useTransparencyToast Hook
 * Story 4.5: Build Transparency Toast Notifications
 *
 * Purpose: Provide a hook to show transparency toasts that respects user settings
 * AC-5: User preference toggle (showAdaptiveToasts)
 * AC-6: Integration with TrainingSession
 */

import { useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { useUserSettings } from '@/context/UserSettingsContext';
import type { AdjustmentResult } from '@/services/adaptiveDifficulty/difficultyEngine';
import { getToastMessage } from '../utils/toastMessages';
import { getToastPosition } from '../utils/toastPosition';

/**
 * Return type for the useTransparencyToast hook
 */
export interface UseTransparencyToastReturn {
  /** Show a transparency toast for the given adjustments */
  showTransparencyToast: (adjustments: AdjustmentResult[]) => void;
  /** Whether toasts are enabled in user settings */
  isEnabled: boolean;
}

/**
 * Hook to show transparency toasts with user preference respect
 *
 * Checks the user's `showAdaptiveToasts` setting before displaying.
 * Only shows the first adjustment if multiple are provided.
 *
 * Usage:
 * ```tsx
 * const { showTransparencyToast, isEnabled } = useTransparencyToast();
 *
 * // Call when session ends with adjustments
 * showTransparencyToast(difficultyAdjustments);
 * ```
 */
export function useTransparencyToast(): UseTransparencyToastReturn {
  const { settings } = useUserSettings();

  // Track the last shown adjustment to prevent duplicates
  const lastShownTimestampRef = useRef<string | null>(null);

  const showTransparencyToast = useCallback(
    (adjustments: AdjustmentResult[]) => {
      // AC-5: Respect user's showAdaptiveToasts preference
      if (!settings.showAdaptiveToasts) {
        return;
      }

      // No adjustments to show
      if (adjustments.length === 0) {
        return;
      }

      // AC-3: Only show first adjustment (no spam)
      const firstAdjustment = adjustments[0];

      // Prevent duplicate toasts for the same adjustment
      if (lastShownTimestampRef.current === firstAdjustment.timestamp) {
        return;
      }

      // Get user-friendly message
      const { emoji, message } = getToastMessage(firstAdjustment);
      const toastMessage = `${emoji} ${message}`;

      // AC-3: Responsive positioning
      const position = getToastPosition();

      // Show the toast
      toast(toastMessage, {
        duration: 5000, // AC-3: Auto-dismiss after 5 seconds
        dismissible: true, // AC-3: User can dismiss early
        position,
      });

      // Mark as shown
      lastShownTimestampRef.current = firstAdjustment.timestamp;
    },
    [settings.showAdaptiveToasts]
  );

  return {
    showTransparencyToast,
    isEnabled: settings.showAdaptiveToasts,
  };
}
