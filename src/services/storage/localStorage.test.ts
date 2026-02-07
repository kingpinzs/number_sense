// Tests for LocalStorage wrapper utilities
// Testing: Get/set operations, validation, error handling

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  STORAGE_KEYS,
  DEFAULT_SETTINGS,
  getUserSettings,
  setUserSettings,
  getStreak,
  setStreak,
  getLastSessionDate,
  setLastSessionDate,
  getLastUsedModule,
  setLastUsedModule,
  getResearchModeEnabled,
  setResearchModeEnabled,
  getMilestonesShown,
  addMilestoneShown,
  type UserSettings
} from './localStorage';

describe('LocalStorage Wrapper', () => {
  // Clear localStorage before each test
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('STORAGE_KEYS', () => {
    it('defines all required keys with namespace', () => {
      expect(STORAGE_KEYS.STREAK).toBe('discalculas:streak');
      expect(STORAGE_KEYS.LAST_SESSION_DATE).toBe('discalculas:lastSessionDate');
      expect(STORAGE_KEYS.USER_SETTINGS).toBe('discalculas:userSettings');
      expect(STORAGE_KEYS.LAST_USED_MODULE).toBe('discalculas:lastUsedModule');
      expect(STORAGE_KEYS.RESEARCH_MODE_ENABLED).toBe('discalculas:researchModeEnabled');
    });

    it('all keys are prefixed with discalculas:', () => {
      const keys = Object.values(STORAGE_KEYS);
      expect(keys.every(key => key.startsWith('discalculas:'))).toBe(true);
    });
  });

  describe('getUserSettings', () => {
    it('returns default settings when not set', () => {
      const settings = getUserSettings();
      expect(settings).toEqual(DEFAULT_SETTINGS);
    });

    it('returns stored settings', () => {
      const customSettings: UserSettings = {
        reducedMotion: true,
        soundEnabled: false,
        dailyGoalMinutes: 90,
        researchModeEnabled: true,
        showAdaptiveToasts: false
      };

      localStorage.setItem(STORAGE_KEYS.USER_SETTINGS, JSON.stringify(customSettings));

      const retrieved = getUserSettings();
      expect(retrieved).toEqual(customSettings);
    });

    it('returns default settings for invalid JSON', () => {
      localStorage.setItem(STORAGE_KEYS.USER_SETTINGS, 'invalid-json{');

      const settings = getUserSettings();
      expect(settings).toEqual(DEFAULT_SETTINGS);
    });

    it('validates and sanitizes malformed settings', () => {
      // Malformed object with unexpected types
      const malformed = {
        reducedMotion: 'not-a-boolean',
        soundEnabled: 1,
        dailyGoalMinutes: 'not-a-number',
        researchModeEnabled: null,
        showAdaptiveToasts: 'invalid'
      };

      localStorage.setItem(STORAGE_KEYS.USER_SETTINGS, JSON.stringify(malformed));

      const settings = getUserSettings();

      // Should coerce to valid types
      expect(typeof settings.reducedMotion).toBe('boolean');
      expect(typeof settings.soundEnabled).toBe('boolean');
      expect(typeof settings.dailyGoalMinutes).toBe('number');
      expect(typeof settings.researchModeEnabled).toBe('boolean');
      expect(typeof settings.showAdaptiveToasts).toBe('boolean');
    });

    it('handles partial settings object', () => {
      const partial = {
        soundEnabled: false
      };

      localStorage.setItem(STORAGE_KEYS.USER_SETTINGS, JSON.stringify(partial));

      const settings = getUserSettings();

      // Missing fields should use defaults
      expect(settings.reducedMotion).toBe(DEFAULT_SETTINGS.reducedMotion);
      expect(settings.soundEnabled).toBe(false); // Overridden
      expect(settings.dailyGoalMinutes).toBe(DEFAULT_SETTINGS.dailyGoalMinutes);
    });
  });

  describe('setUserSettings', () => {
    it('saves settings to localStorage', () => {
      const newSettings: UserSettings = {
        reducedMotion: true,
        soundEnabled: false,
        dailyGoalMinutes: 120,
        researchModeEnabled: true,
        showAdaptiveToasts: false
      };

      setUserSettings(newSettings);

      const stored = localStorage.getItem(STORAGE_KEYS.USER_SETTINGS);
      expect(stored).toBeTruthy();

      const parsed = JSON.parse(stored!);
      expect(parsed).toEqual(newSettings);
    });

    it('supports partial updates', () => {
      // Set initial settings
      setUserSettings({
        reducedMotion: false,
        soundEnabled: true,
        dailyGoalMinutes: 60,
        researchModeEnabled: false,
        showAdaptiveToasts: true
      });

      // Update only one field
      setUserSettings({ soundEnabled: false });

      const settings = getUserSettings();

      expect(settings.soundEnabled).toBe(false);
      expect(settings.reducedMotion).toBe(false);
      expect(settings.dailyGoalMinutes).toBe(60);
    });

    it('merges with existing settings', () => {
      setUserSettings({ dailyGoalMinutes: 90 });
      setUserSettings({ soundEnabled: false });

      const settings = getUserSettings();

      expect(settings.dailyGoalMinutes).toBe(90);
      expect(settings.soundEnabled).toBe(false);
      expect(settings.reducedMotion).toBe(DEFAULT_SETTINGS.reducedMotion);
    });
  });

  describe('getStreak / setStreak', () => {
    it('returns 0 when not set', () => {
      expect(getStreak()).toBe(0);
    });

    it('stores and retrieves streak value', () => {
      setStreak(7);
      expect(getStreak()).toBe(7);
    });

    it('handles invalid streak gracefully', () => {
      localStorage.setItem(STORAGE_KEYS.STREAK, 'invalid');
      expect(getStreak()).toBe(0);
    });

    it('updates streak value', () => {
      setStreak(5);
      setStreak(10);
      expect(getStreak()).toBe(10);
    });
  });

  describe('getLastSessionDate / setLastSessionDate', () => {
    it('returns null when not set', () => {
      expect(getLastSessionDate()).toBeNull();
    });

    it('stores and retrieves ISO date string', () => {
      const date = '2025-11-10T10:00:00.000Z';
      setLastSessionDate(date);
      expect(getLastSessionDate()).toBe(date);
    });

    it('updates date value', () => {
      setLastSessionDate('2025-11-09T00:00:00.000Z');
      setLastSessionDate('2025-11-10T00:00:00.000Z');
      expect(getLastSessionDate()).toBe('2025-11-10T00:00:00.000Z');
    });
  });

  describe('getLastUsedModule / setLastUsedModule', () => {
    it('returns null when not set', () => {
      expect(getLastUsedModule()).toBeNull();
    });

    it('stores and retrieves module name', () => {
      setLastUsedModule('training');
      expect(getLastUsedModule()).toBe('training');
    });

    it('updates module value', () => {
      setLastUsedModule('assessment');
      setLastUsedModule('training');
      expect(getLastUsedModule()).toBe('training');
    });
  });

  describe('getResearchModeEnabled / setResearchModeEnabled', () => {
    it('returns false when not set', () => {
      expect(getResearchModeEnabled()).toBe(false);
    });

    it('stores and retrieves boolean flag', () => {
      setResearchModeEnabled(true);
      expect(getResearchModeEnabled()).toBe(true);

      setResearchModeEnabled(false);
      expect(getResearchModeEnabled()).toBe(false);
    });

    it('syncs with UserSettings', () => {
      setResearchModeEnabled(true);

      const settings = getUserSettings();
      expect(settings.researchModeEnabled).toBe(true);
    });

    it('falls back to UserSettings if legacy key not set', () => {
      // Set via UserSettings
      setUserSettings({ researchModeEnabled: true });

      // Clear legacy key
      localStorage.removeItem(STORAGE_KEYS.RESEARCH_MODE_ENABLED);

      // Should still return true from UserSettings fallback
      expect(getResearchModeEnabled()).toBe(true);
    });
  });

  describe('getMilestonesShown / addMilestoneShown', () => {
    it('returns empty array when not set', () => {
      expect(getMilestonesShown()).toEqual([]);
    });

    it('returns stored milestones', () => {
      localStorage.setItem(STORAGE_KEYS.STREAK_MILESTONES_SHOWN, JSON.stringify([7, 30]));
      expect(getMilestonesShown()).toEqual([7, 30]);
    });

    it('returns empty array for invalid JSON', () => {
      localStorage.setItem(STORAGE_KEYS.STREAK_MILESTONES_SHOWN, 'invalid');
      expect(getMilestonesShown()).toEqual([]);
    });

    it('adds a milestone to the shown list', () => {
      addMilestoneShown(7);
      expect(getMilestonesShown()).toEqual([7]);
    });

    it('does not add duplicate milestones', () => {
      addMilestoneShown(7);
      addMilestoneShown(7);
      expect(getMilestonesShown()).toEqual([7]);
    });

    it('accumulates multiple milestones', () => {
      addMilestoneShown(7);
      addMilestoneShown(30);
      addMilestoneShown(100);
      expect(getMilestonesShown()).toEqual([7, 30, 100]);
    });
  });

  describe('DEFAULT_SETTINGS', () => {
    it('has sensible defaults', () => {
      expect(DEFAULT_SETTINGS).toEqual({
        reducedMotion: false,
        soundEnabled: true,
        dailyGoalMinutes: 60,
        researchModeEnabled: false,
        showAdaptiveToasts: true
      });
    });
  });

  describe('showAdaptiveToasts setting', () => {
    it('defaults to true', () => {
      const settings = getUserSettings();
      expect(settings.showAdaptiveToasts).toBe(true);
    });

    it('persists false value', () => {
      setUserSettings({ showAdaptiveToasts: false });
      const settings = getUserSettings();
      expect(settings.showAdaptiveToasts).toBe(false);
    });

    it('persists true value after setting false', () => {
      setUserSettings({ showAdaptiveToasts: false });
      setUserSettings({ showAdaptiveToasts: true });
      const settings = getUserSettings();
      expect(settings.showAdaptiveToasts).toBe(true);
    });

    it('validates missing showAdaptiveToasts uses default', () => {
      const partial = { reducedMotion: true };
      localStorage.setItem(STORAGE_KEYS.USER_SETTINGS, JSON.stringify(partial));
      const settings = getUserSettings();
      expect(settings.showAdaptiveToasts).toBe(true);
    });
  });

  describe('Data Validation', () => {
    it('coerces dailyGoalMinutes to number', () => {
      const malformed = {
        ...DEFAULT_SETTINGS,
        dailyGoalMinutes: '120' as any
      };

      localStorage.setItem(STORAGE_KEYS.USER_SETTINGS, JSON.stringify(malformed));

      const settings = getUserSettings();
      expect(typeof settings.dailyGoalMinutes).toBe('number');
      expect(settings.dailyGoalMinutes).toBe(120);
    });

    it('falls back to default for invalid dailyGoalMinutes', () => {
      const malformed = {
        ...DEFAULT_SETTINGS,
        dailyGoalMinutes: 'not-a-number'
      };

      localStorage.setItem(STORAGE_KEYS.USER_SETTINGS, JSON.stringify(malformed));

      const settings = getUserSettings();
      expect(settings.dailyGoalMinutes).toBe(DEFAULT_SETTINGS.dailyGoalMinutes);
    });

    it('coerces boolean fields', () => {
      const malformed = {
        reducedMotion: 1,
        soundEnabled: 'true',
        dailyGoalMinutes: 60,
        researchModeEnabled: null,
        showAdaptiveToasts: 0
      };

      localStorage.setItem(STORAGE_KEYS.USER_SETTINGS, JSON.stringify(malformed));

      const settings = getUserSettings();

      expect(typeof settings.reducedMotion).toBe('boolean');
      expect(typeof settings.soundEnabled).toBe('boolean');
      expect(typeof settings.researchModeEnabled).toBe('boolean');
      expect(typeof settings.showAdaptiveToasts).toBe('boolean');
    });
  });

  describe('Edge Cases', () => {
    it('handles empty localStorage', () => {
      localStorage.clear();

      expect(getUserSettings()).toEqual(DEFAULT_SETTINGS);
      expect(getStreak()).toBe(0);
      expect(getLastSessionDate()).toBeNull();
      expect(getLastUsedModule()).toBeNull();
      expect(getResearchModeEnabled()).toBe(false);
    });

    it('handles corrupted data', () => {
      // Corrupt all keys
      localStorage.setItem(STORAGE_KEYS.USER_SETTINGS, '{corrupted}');
      localStorage.setItem(STORAGE_KEYS.STREAK, 'NaN');

      // Should return safe defaults
      expect(getUserSettings()).toEqual(DEFAULT_SETTINGS);
      expect(getStreak()).toBe(0);
    });

    it('prevents prototype pollution', () => {
      const malicious = JSON.stringify({
        __proto__: { admin: true },
        reducedMotion: false,
        soundEnabled: true,
        dailyGoalMinutes: 60,
        researchModeEnabled: false,
        showAdaptiveToasts: true
      });

      localStorage.setItem(STORAGE_KEYS.USER_SETTINGS, malicious);

      const settings = getUserSettings();

      // Should not have polluted prototype
      expect((settings as any).admin).toBeUndefined();
    });
  });
});
