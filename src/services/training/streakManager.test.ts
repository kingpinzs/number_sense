// streakManager.test.ts - Test suite for streak calculation logic
// Story 3.6: Comprehensive tests for AC-6 streak update logic

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getStreak, updateStreak, resetStreak, getCurrentStreak, checkMilestone } from './streakManager';
import { addMilestoneShown } from '@/services/storage/localStorage';
import { subDays, startOfDay } from 'date-fns';

const STREAK_KEY = 'discalculas:streak';
const LAST_SESSION_DATE_KEY = 'discalculas:lastSessionDate';

describe('streakManager', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  describe('getStreak', () => {
    it('should return 0 when no streak exists', () => {
      expect(getStreak()).toBe(0);
    });

    it('should return existing streak from localStorage', () => {
      localStorage.setItem(STREAK_KEY, '5');
      expect(getStreak()).toBe(5);
    });

    it('should return 0 on localStorage error', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('localStorage error');
      });
      expect(getStreak()).toBe(0);
      consoleSpy.mockRestore();
    });
  });

  describe('updateStreak - AC-6', () => {
    it('should start streak at 1 for first session', () => {
      const streak = updateStreak();
      expect(streak).toBe(1);
      expect(localStorage.getItem(STREAK_KEY)).toBe('1');
      expect(localStorage.getItem(LAST_SESSION_DATE_KEY)).toBeTruthy();
    });

    it('should maintain streak when session is same day', () => {
      // Set up: completed session today
      const today = startOfDay(new Date());
      localStorage.setItem(STREAK_KEY, '3');
      localStorage.setItem(LAST_SESSION_DATE_KEY, today.toISOString());

      const streak = updateStreak();
      expect(streak).toBe(3); // Same streak, not incremented
    });

    it('should increment streak when last session was yesterday', () => {
      // Set up: completed session yesterday
      const yesterday = startOfDay(subDays(new Date(), 1));
      localStorage.setItem(STREAK_KEY, '5');
      localStorage.setItem(LAST_SESSION_DATE_KEY, yesterday.toISOString());

      const streak = updateStreak();
      expect(streak).toBe(6); // Incremented from 5 to 6
    });

    it('should reset streak to 1 when last session was 2 days ago', () => {
      // Set up: completed session 2 days ago
      const twoDaysAgo = startOfDay(subDays(new Date(), 2));
      localStorage.setItem(STREAK_KEY, '10');
      localStorage.setItem(LAST_SESSION_DATE_KEY, twoDaysAgo.toISOString());

      const streak = updateStreak();
      expect(streak).toBe(1); // Reset to 1
    });

    it('should reset streak to 1 when last session was 7 days ago', () => {
      // Set up: completed session 7 days ago
      const sevenDaysAgo = startOfDay(subDays(new Date(), 7));
      localStorage.setItem(STREAK_KEY, '20');
      localStorage.setItem(LAST_SESSION_DATE_KEY, sevenDaysAgo.toISOString());

      const streak = updateStreak();
      expect(streak).toBe(1); // Reset to 1
    });

    it('should update LAST_SESSION_DATE to today', () => {
      const today = startOfDay(new Date());
      updateStreak();

      const lastSessionDate = localStorage.getItem(LAST_SESSION_DATE_KEY);
      expect(lastSessionDate).toBeTruthy();
      const savedDate = startOfDay(new Date(lastSessionDate!));
      expect(savedDate.getTime()).toBe(today.getTime());
    });

    it('should return 1 on localStorage error (fallback)', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('localStorage error');
      });

      const streak = updateStreak();
      expect(streak).toBe(1); // Fallback value
      consoleSpy.mockRestore();
    });
  });

  describe('getCurrentStreak - AC-2 display logic', () => {
    it('should return stored streak when last session is today', () => {
      const today = startOfDay(new Date());
      localStorage.setItem(STREAK_KEY, '5');
      localStorage.setItem(LAST_SESSION_DATE_KEY, today.toISOString());

      expect(getCurrentStreak()).toBe(5);
    });

    it('should return stored streak when last session was yesterday', () => {
      const yesterday = startOfDay(subDays(new Date(), 1));
      localStorage.setItem(STREAK_KEY, '7');
      localStorage.setItem(LAST_SESSION_DATE_KEY, yesterday.toISOString());

      expect(getCurrentStreak()).toBe(7);
    });

    it('should return 0 when last session was more than 1 day ago', () => {
      const threeDaysAgo = startOfDay(subDays(new Date(), 3));
      localStorage.setItem(STREAK_KEY, '10');
      localStorage.setItem(LAST_SESSION_DATE_KEY, threeDaysAgo.toISOString());

      expect(getCurrentStreak()).toBe(0);
    });

    it('should return 0 when no last session date exists', () => {
      localStorage.setItem(STREAK_KEY, '3');
      // No LAST_SESSION_DATE_KEY set

      expect(getCurrentStreak()).toBe(0);
    });
  });

  describe('checkMilestone - AC-3', () => {
    it('should return milestone object for streak of 7', () => {
      const milestone = checkMilestone(7);
      expect(milestone).not.toBeNull();
      expect(milestone!.streak).toBe(7);
      expect(milestone!.title).toBe('One Week Streak!');
      expect(milestone!.emoji).toBe('🎉');
    });

    it('should return milestone object for streak of 30', () => {
      const milestone = checkMilestone(30);
      expect(milestone).not.toBeNull();
      expect(milestone!.title).toBe('One Month Streak!');
    });

    it('should return milestone object for streak of 100', () => {
      const milestone = checkMilestone(100);
      expect(milestone).not.toBeNull();
      expect(milestone!.title).toBe('Century Streak!');
    });

    it('should return null for non-milestone streak', () => {
      expect(checkMilestone(8)).toBeNull();
      expect(checkMilestone(15)).toBeNull();
      expect(checkMilestone(99)).toBeNull();
    });

    it('should return null when milestone already shown', () => {
      addMilestoneShown(7);
      expect(checkMilestone(7)).toBeNull();
    });

    it('should return milestone when different milestone was shown', () => {
      addMilestoneShown(7);
      const milestone = checkMilestone(30);
      expect(milestone).not.toBeNull();
      expect(milestone!.streak).toBe(30);
    });
  });

  describe('resetStreak', () => {
    it('should reset streak to 0', () => {
      localStorage.setItem(STREAK_KEY, '10');
      localStorage.setItem(LAST_SESSION_DATE_KEY, new Date().toISOString());

      resetStreak();

      expect(localStorage.getItem(STREAK_KEY)).toBe('0');
      expect(localStorage.getItem(LAST_SESSION_DATE_KEY)).toBeNull();
    });

    it('should handle localStorage errors gracefully', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('localStorage error');
      });

      expect(() => resetStreak()).not.toThrow();
      consoleSpy.mockRestore();
    });
  });
});
