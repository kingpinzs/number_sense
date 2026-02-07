// LocalStorage wrapper with type-safe access and validation
// Architecture: Simple key-value storage for settings and streaks

/**
 * Namespaced storage keys to prevent collisions
 */
export const STORAGE_KEYS = {
  STREAK: 'discalculas:streak',
  LAST_SESSION_DATE: 'discalculas:lastSessionDate',
  USER_SETTINGS: 'discalculas:userSettings',
  LAST_USED_MODULE: 'discalculas:lastUsedModule',
  RESEARCH_MODE_ENABLED: 'discalculas:researchModeEnabled',
  // Story 3.7: Session telemetry backup keys
  SESSION_BACKUP: 'discalculas:sessionBackup',
  TELEMETRY_BACKUP: 'discalculas:telemetryBackup',
  DRILL_RESULTS_BACKUP: 'discalculas:drillResultsBackup',
  // Story 5.3: Streak milestone tracking
  STREAK_MILESTONES_SHOWN: 'discalculas:streakMilestonesShown'
} as const;

/**
 * User settings interface
 */
export interface UserSettings {
  reducedMotion: boolean;
  soundEnabled: boolean;
  dailyGoalMinutes: number;
  researchModeEnabled: boolean;
  showAdaptiveToasts: boolean;
}

/**
 * Default user settings
 */
export const DEFAULT_SETTINGS: UserSettings = {
  reducedMotion: false,
  soundEnabled: true,
  dailyGoalMinutes: 60,
  researchModeEnabled: false,
  showAdaptiveToasts: true
};

/**
 * Validate and sanitize user settings object
 * Ensures type safety and prevents injection attacks
 *
 * @param obj - Raw object from localStorage
 * @returns Validated UserSettings object
 */
function validateUserSettings(obj: any): UserSettings {
  return {
    reducedMotion: Boolean(obj?.reducedMotion ?? DEFAULT_SETTINGS.reducedMotion),
    soundEnabled: Boolean(obj?.soundEnabled ?? DEFAULT_SETTINGS.soundEnabled),
    dailyGoalMinutes: Number(obj?.dailyGoalMinutes) || DEFAULT_SETTINGS.dailyGoalMinutes,
    researchModeEnabled: Boolean(obj?.researchModeEnabled ?? DEFAULT_SETTINGS.researchModeEnabled),
    showAdaptiveToasts: Boolean(obj?.showAdaptiveToasts ?? DEFAULT_SETTINGS.showAdaptiveToasts)
  };
}

/**
 * Get user settings from localStorage
 * Returns default settings if not found or invalid JSON
 *
 * @returns UserSettings object
 */
export function getUserSettings(): UserSettings {
  const raw = localStorage.getItem(STORAGE_KEYS.USER_SETTINGS);
  if (!raw) return DEFAULT_SETTINGS;

  try {
    const parsed = JSON.parse(raw);
    return validateUserSettings(parsed);
  } catch {
    // Invalid JSON, return defaults
    return DEFAULT_SETTINGS;
  }
}

/**
 * Save user settings to localStorage
 * Supports partial updates - merges with existing settings
 *
 * @param settings - Partial or complete UserSettings object
 */
export function setUserSettings(settings: Partial<UserSettings>): void {
  const current = getUserSettings();
  const updated = { ...current, ...settings };
  localStorage.setItem(STORAGE_KEYS.USER_SETTINGS, JSON.stringify(updated));
}

/**
 * Get current streak count
 *
 * @returns Streak count (0 if not set)
 */
export function getStreak(): number {
  const raw = localStorage.getItem(STORAGE_KEYS.STREAK);
  return raw ? parseInt(raw, 10) || 0 : 0;
}

/**
 * Set streak count
 *
 * @param streak - New streak value
 */
export function setStreak(streak: number): void {
  localStorage.setItem(STORAGE_KEYS.STREAK, streak.toString());
}

/**
 * Get last session date (ISO 8601 string)
 *
 * @returns ISO date string or null if not set
 */
export function getLastSessionDate(): string | null {
  return localStorage.getItem(STORAGE_KEYS.LAST_SESSION_DATE);
}

/**
 * Set last session date
 *
 * @param date - ISO 8601 date string
 */
export function setLastSessionDate(date: string): void {
  localStorage.setItem(STORAGE_KEYS.LAST_SESSION_DATE, date);
}

/**
 * Get last used module
 *
 * @returns Module name or null if not set
 */
export function getLastUsedModule(): string | null {
  return localStorage.getItem(STORAGE_KEYS.LAST_USED_MODULE);
}

/**
 * Set last used module
 *
 * @param module - Module name
 */
export function setLastUsedModule(module: string): void {
  localStorage.setItem(STORAGE_KEYS.LAST_USED_MODULE, module);
}

/**
 * Get research mode enabled flag (legacy compatibility)
 * Note: Research mode settings now stored in UserSettings
 *
 * @returns boolean
 */
export function getResearchModeEnabled(): boolean {
  const raw = localStorage.getItem(STORAGE_KEYS.RESEARCH_MODE_ENABLED);
  if (raw !== null) {
    return raw === 'true';
  }
  // Fallback to UserSettings
  return getUserSettings().researchModeEnabled;
}

/**
 * Get list of streak milestones already shown to user
 *
 * @returns Array of milestone streak values that have been shown
 */
export function getMilestonesShown(): number[] {
  const raw = localStorage.getItem(STORAGE_KEYS.STREAK_MILESTONES_SHOWN);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

/**
 * Record a milestone as shown so it won't trigger again
 *
 * @param streak - The milestone streak value to mark as shown
 */
export function addMilestoneShown(streak: number): void {
  const shown = getMilestonesShown();
  if (!shown.includes(streak)) {
    shown.push(streak);
    localStorage.setItem(STORAGE_KEYS.STREAK_MILESTONES_SHOWN, JSON.stringify(shown));
  }
}

/**
 * Set research mode enabled flag (legacy compatibility)
 * Note: Prefer using setUserSettings({ researchModeEnabled: true })
 *
 * @param enabled - boolean flag
 */
export function setResearchModeEnabled(enabled: boolean): void {
  localStorage.setItem(STORAGE_KEYS.RESEARCH_MODE_ENABLED, enabled.toString());
  // Also update UserSettings for consistency
  setUserSettings({ researchModeEnabled: enabled });
}
