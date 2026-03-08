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
  STREAK_MILESTONES_SHOWN: 'discalculas:streakMilestonesShown',
  // Story 6.1: Coach dismissed tips and streak tracking
  DISMISSED_COACH_TIPS: 'discalculas:dismissedCoachTips',
  PREVIOUS_STREAK: 'discalculas:previousStreak',
  // Coach real-world tips tracking
  SHOWN_REAL_WORLD_TIPS: 'discalculas:shownRealWorldTips',
  // Story 6.3: Cognition game preferences
  GAME_TIMER_VISIBLE: 'discalculas:gameTimerVisible',
  // Story 7.3: PWA install prompt tracking
  PWA_INSTALL_DISMISSED_COUNT: 'discalculas:pwaInstallDismissedCount',
  PWA_INSTALLED: 'discalculas:pwaInstalled',
  // Story 7.4: PWA sync queue
  SYNC_QUEUE: 'discalculas:syncQueue',
  // Story 8.1: Research mode experiment infrastructure
  USER_ID: 'discalculas:userId',
  EXPERIMENT_ASSIGNMENTS: 'discalculas:experimentAssignments'
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
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((v: unknown) => typeof v === 'number');
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

/**
 * Get list of dismissed coach tip IDs
 *
 * @returns Array of dismissed tip trigger IDs
 */
export function getDismissedCoachTips(): string[] {
  const raw = localStorage.getItem(STORAGE_KEYS.DISMISSED_COACH_TIPS);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((v: unknown) => typeof v === 'string');
  } catch {
    return [];
  }
}

/**
 * Add a coach tip to the dismissed list
 *
 * @param tipId - The trigger ID of the dismissed tip
 */
export function addDismissedCoachTip(tipId: string): void {
  const dismissed = getDismissedCoachTips();
  if (!dismissed.includes(tipId)) {
    dismissed.push(tipId);
    localStorage.setItem(STORAGE_KEYS.DISMISSED_COACH_TIPS, JSON.stringify(dismissed));
  }
}

/**
 * Replace the entire dismissed coach tips list.
 * Used by pruning logic to re-enable resolved tips.
 *
 * @param tips - Updated array of dismissed tip trigger IDs
 */
export function setDismissedCoachTips(tips: string[]): void {
  localStorage.setItem(STORAGE_KEYS.DISMISSED_COACH_TIPS, JSON.stringify(tips));
}

/**
 * Get previously known streak value (for detecting streak breaks)
 *
 * @returns Previous streak count (0 if not set)
 */
export function getPreviousStreak(): number {
  const raw = localStorage.getItem(STORAGE_KEYS.PREVIOUS_STREAK);
  return raw ? parseInt(raw, 10) || 0 : 0;
}

/**
 * Store current streak as previous (called when streak changes)
 *
 * @param streak - Current streak value to save as previous
 */
export function setPreviousStreak(streak: number): void {
  localStorage.setItem(STORAGE_KEYS.PREVIOUS_STREAK, streak.toString());
}

/**
 * Get list of real-world tip IDs already shown to user
 *
 * @returns Array of shown tip IDs
 */
export function getShownRealWorldTips(): string[] {
  const raw = localStorage.getItem(STORAGE_KEYS.SHOWN_REAL_WORLD_TIPS);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((v: unknown) => typeof v === 'string');
  } catch {
    return [];
  }
}

/**
 * Record a real-world tip as shown
 *
 * @param tipId - The tip ID to mark as shown
 */
export function addShownRealWorldTip(tipId: string): void {
  const shown = getShownRealWorldTips();
  if (!shown.includes(tipId)) {
    shown.push(tipId);
    localStorage.setItem(STORAGE_KEYS.SHOWN_REAL_WORLD_TIPS, JSON.stringify(shown));
  }
}
