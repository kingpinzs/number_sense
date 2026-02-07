// streakManager - Streak calculation and localStorage persistence
// Story 3.6: Implement Confidence Prompt System
// Handles daily training streak tracking with date comparison logic

import { startOfDay, differenceInDays, parseISO } from 'date-fns';
import { getMilestonesShown } from '@/services/storage/localStorage';

/**
 * localStorage keys for streak data
 */
const STREAK_KEY = 'discalculas:streak';
const LAST_SESSION_DATE_KEY = 'discalculas:lastSessionDate';

/**
 * Get current streak count from localStorage
 *
 * @returns Current streak count (defaults to 0 if not set)
 */
export function getStreak(): number {
  try {
    const streakStr = localStorage.getItem(STREAK_KEY);
    return streakStr ? parseInt(streakStr, 10) : 0;
  } catch (error) {
    console.error('Failed to read streak from localStorage:', error);
    return 0;
  }
}

/**
 * Update streak based on session completion
 * AC-6: Streak update logic:
 * - If last session date = yesterday → increment streak
 * - If last session date = today → maintain streak (don't double-count)
 * - If last session date > 1 day ago → reset streak to 1
 *
 * @returns New streak count
 */
export function updateStreak(): number {
  try {
    const today = startOfDay(new Date());
    const lastSessionDateStr = localStorage.getItem(LAST_SESSION_DATE_KEY);
    const currentStreak = getStreak();

    let newStreak: number;

    if (!lastSessionDateStr) {
      // First session ever - start streak at 1
      newStreak = 1;
    } else {
      const lastSessionDate = startOfDay(parseISO(lastSessionDateStr));
      const daysDifference = differenceInDays(today, lastSessionDate);

      if (daysDifference === 0) {
        // Same day - maintain current streak (don't double-count)
        newStreak = currentStreak || 1; // Ensure at least 1
      } else if (daysDifference === 1) {
        // Yesterday - increment streak
        newStreak = currentStreak + 1;
      } else {
        // More than 1 day ago - reset streak to 1
        newStreak = 1;
      }
    }

    // Update localStorage with new streak and today's date
    localStorage.setItem(STREAK_KEY, newStreak.toString());
    localStorage.setItem(LAST_SESSION_DATE_KEY, today.toISOString());

    return newStreak;
  } catch (error) {
    console.error('Failed to update streak:', error);
    // Fallback: return current streak or 1
    const currentStreak = getStreak();
    return currentStreak || 1;
  }
}

/**
 * Get current streak for DISPLAY (read-only, considers elapsed time)
 * Different from getStreak() which returns raw stored value.
 * - Last session today or yesterday → return stored streak
 * - Last session > 1 day ago → return 0 (streak broken)
 * - No last session date → return 0
 *
 * @returns Current display streak value
 */
export function getCurrentStreak(): number {
  try {
    const lastSessionDateStr = localStorage.getItem(LAST_SESSION_DATE_KEY);
    if (!lastSessionDateStr) return 0;

    const today = startOfDay(new Date());
    const lastSessionDate = startOfDay(parseISO(lastSessionDateStr));
    const daysDifference = differenceInDays(today, lastSessionDate);

    if (daysDifference <= 1) {
      return getStreak();
    }
    return 0;
  } catch (error) {
    console.error('Failed to get current streak:', error);
    return 0;
  }
}

/**
 * Milestone definition for streak celebrations
 */
export interface Milestone {
  streak: number;
  title: string;
  emoji: string;
  message: string;
}

const MILESTONES: Milestone[] = [
  { streak: 7, title: 'One Week Streak!', emoji: '🎉', message: 'Amazing consistency! Keep it up!' },
  { streak: 30, title: 'One Month Streak!', emoji: '🔥', message: 'Incredible dedication!' },
  { streak: 100, title: 'Century Streak!', emoji: '💯', message: 'Legendary! 100 days of practice!' },
];

/**
 * Check if current streak triggers a milestone celebration
 * Returns null if not a milestone or already shown
 *
 * @param streak - Current streak value to check
 * @returns Milestone object or null
 */
export function checkMilestone(streak: number): Milestone | null {
  const milestone = MILESTONES.find(m => m.streak === streak);
  if (!milestone) return null;

  const shown = getMilestonesShown();
  if (shown.includes(streak)) return null;

  return milestone;
}

/**
 * Reset streak to 0 (for testing or user request)
 */
export function resetStreak(): void {
  try {
    localStorage.setItem(STREAK_KEY, '0');
    localStorage.removeItem(LAST_SESSION_DATE_KEY);
  } catch (error) {
    console.error('Failed to reset streak:', error);
  }
}
