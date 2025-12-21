// UserSettingsContext - User preferences and settings management
// Architecture: React Context + useState for simple state
// Manages: reducedMotion, soundEnabled, dailyGoalMinutes, researchModeEnabled
// Persists: Automatically saves to localStorage on every change

import { createContext, useContext, useState, type ReactNode } from 'react';
import { getUserSettings, setUserSettings, type UserSettings } from '@/services/storage/localStorage';

/**
 * Context shape - Includes settings and update method
 */
interface UserSettingsContextValue {
  settings: UserSettings;
  updateSettings: (partial: Partial<UserSettings>) => void;
}

// Create context (not exported - use useUserSettings hook instead)
const UserSettingsContext = createContext<UserSettingsContextValue | undefined>(undefined);

/**
 * UserSettingsProvider - Context provider component
 * Loads settings from localStorage on mount
 * Persists settings to localStorage on every update
 *
 * @param props - Component props with children
 */
export function UserSettingsProvider({ children }: { children: ReactNode }) {
  // Load settings from localStorage on mount
  const [settings, setSettings] = useState<UserSettings>(() => getUserSettings());

  /**
   * Update settings with partial values
   * Merges with existing settings and persists to localStorage
   *
   * @param partial - Partial settings to update
   */
  const updateSettings = (partial: Partial<UserSettings>) => {
    setSettings((current) => {
      const updated = { ...current, ...partial };
      // Persist to localStorage immediately
      setUserSettings(updated);
      return updated;
    });
  };

  const value: UserSettingsContextValue = {
    settings,
    updateSettings
  };

  return <UserSettingsContext.Provider value={value}>{children}</UserSettingsContext.Provider>;
}

/**
 * useUserSettings - Custom hook to access UserSettingsContext
 * Provides type-safe access to user settings and update method
 *
 * @returns UserSettingsContextValue with settings and updateSettings
 * @throws Error if used outside UserSettingsProvider
 */
export function useUserSettings(): UserSettingsContextValue {
  const context = useContext(UserSettingsContext);

  if (context === undefined) {
    throw new Error('useUserSettings must be used within UserSettingsProvider');
  }

  return context;
}
