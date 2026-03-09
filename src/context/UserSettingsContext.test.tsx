// UserSettingsContext Tests
// Architecture: Unit and integration tests for UserSettingsContext
// Coverage: settings persistence, localStorage integration, partial updates

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { UserSettingsProvider, useUserSettings } from './UserSettingsContext';
import * as localStorage from '@/services/storage/localStorage';

// Test component that uses UserSettingsContext
function TestComponent() {
  const { settings, updateSettings } = useUserSettings();

  return (
    <div>
      <div data-testid="reduced-motion">{settings.reducedMotion.toString()}</div>
      <div data-testid="sound-enabled">{settings.soundEnabled.toString()}</div>
      <div data-testid="daily-goal">{settings.dailyGoalMinutes}</div>
      <div data-testid="research-mode">{settings.researchModeEnabled.toString()}</div>
      <button onClick={() => updateSettings({ soundEnabled: false })}>Disable Sound</button>
      <button onClick={() => updateSettings({ reducedMotion: true })}>Enable Reduced Motion</button>
      <button onClick={() => updateSettings({ dailyGoalMinutes: 90 })}>Set Goal 90</button>
      <button onClick={() => updateSettings({ researchModeEnabled: true })}>Enable Research</button>
    </div>
  );
}

describe('UserSettingsContext', () => {
  beforeEach(() => {
    // Reset localStorage before each test
    localStorage.setUserSettings(localStorage.DEFAULT_SETTINGS);
    vi.clearAllMocks();
  });

  describe('Provider and Hook', () => {
    it('provides context to child components', () => {
      render(
        <UserSettingsProvider>
          <TestComponent />
        </UserSettingsProvider>
      );

      // Verify default settings
      expect(screen.getByTestId('reduced-motion')).toHaveTextContent('false');
      expect(screen.getByTestId('sound-enabled')).toHaveTextContent('true');
      expect(screen.getByTestId('daily-goal')).toHaveTextContent('60');
      expect(screen.getByTestId('research-mode')).toHaveTextContent('false');
    });

    it('throws error when useUserSettings used outside provider', () => {
      // Suppress console.error for this test
      const originalError = console.error;
      console.error = vi.fn();

      expect(() => {
        render(<TestComponent />);
      }).toThrow('useUserSettings must be used within UserSettingsProvider');

      console.error = originalError;
    });
  });

  describe('Settings Updates', () => {
    it('updates soundEnabled setting', () => {
      render(
        <UserSettingsProvider>
          <TestComponent />
        </UserSettingsProvider>
      );

      // Initial value
      expect(screen.getByTestId('sound-enabled')).toHaveTextContent('true');

      // Update setting
      fireEvent.click(screen.getByText('Disable Sound'));

      // Verify updated
      expect(screen.getByTestId('sound-enabled')).toHaveTextContent('false');
    });

    it('updates reducedMotion setting', () => {
      render(
        <UserSettingsProvider>
          <TestComponent />
        </UserSettingsProvider>
      );

      // Update setting
      fireEvent.click(screen.getByText('Enable Reduced Motion'));

      // Verify updated
      expect(screen.getByTestId('reduced-motion')).toHaveTextContent('true');
    });

    it('updates dailyGoalMinutes setting', () => {
      render(
        <UserSettingsProvider>
          <TestComponent />
        </UserSettingsProvider>
      );

      // Update setting
      fireEvent.click(screen.getByText('Set Goal 90'));

      // Verify updated
      expect(screen.getByTestId('daily-goal')).toHaveTextContent('90');
    });

    it('updates researchModeEnabled setting', () => {
      render(
        <UserSettingsProvider>
          <TestComponent />
        </UserSettingsProvider>
      );

      // Update setting
      fireEvent.click(screen.getByText('Enable Research'));

      // Verify updated
      expect(screen.getByTestId('research-mode')).toHaveTextContent('true');
    });
  });

  describe('LocalStorage Persistence', () => {
    it('persists settings to localStorage on update', () => {
      const setUserSettingsSpy = vi.spyOn(localStorage, 'setUserSettings');

      render(
        <UserSettingsProvider>
          <TestComponent />
        </UserSettingsProvider>
      );

      // Update setting
      fireEvent.click(screen.getByText('Disable Sound'));

      // Verify localStorage was called with full merged settings (not just partial)
      expect(setUserSettingsSpy).toHaveBeenCalledWith({
        reducedMotion: false,
        soundEnabled: false,
        dailyGoalMinutes: 60,
        researchModeEnabled: false,
        showAdaptiveToasts: true,
        theme: 'system',
        magicMinuteEnabled: true
      });
    });

    it('loads settings from localStorage on mount', async () => {
      // Set custom settings in localStorage
      localStorage.setUserSettings({
        reducedMotion: true,
        soundEnabled: false,
        dailyGoalMinutes: 120,
        researchModeEnabled: true
      });

      render(
        <UserSettingsProvider>
          <TestComponent />
        </UserSettingsProvider>
      );

      // Wait for settings to load
      await waitFor(() => {
        expect(screen.getByTestId('reduced-motion')).toHaveTextContent('true');
        expect(screen.getByTestId('sound-enabled')).toHaveTextContent('false');
        expect(screen.getByTestId('daily-goal')).toHaveTextContent('120');
        expect(screen.getByTestId('research-mode')).toHaveTextContent('true');
      });
    });
  });

  describe('Partial Updates', () => {
    it('merges partial updates with existing settings', () => {
      render(
        <UserSettingsProvider>
          <TestComponent />
        </UserSettingsProvider>
      );

      // Update one setting
      fireEvent.click(screen.getByText('Disable Sound'));

      // Verify only that setting changed
      expect(screen.getByTestId('sound-enabled')).toHaveTextContent('false');
      expect(screen.getByTestId('reduced-motion')).toHaveTextContent('false'); // unchanged
      expect(screen.getByTestId('daily-goal')).toHaveTextContent('60'); // unchanged
      expect(screen.getByTestId('research-mode')).toHaveTextContent('false'); // unchanged
    });

    it('persists multiple updates correctly', () => {
      render(
        <UserSettingsProvider>
          <TestComponent />
        </UserSettingsProvider>
      );

      // Make multiple updates
      fireEvent.click(screen.getByText('Disable Sound'));
      fireEvent.click(screen.getByText('Enable Reduced Motion'));
      fireEvent.click(screen.getByText('Set Goal 90'));

      // Verify all updates applied
      expect(screen.getByTestId('sound-enabled')).toHaveTextContent('false');
      expect(screen.getByTestId('reduced-motion')).toHaveTextContent('true');
      expect(screen.getByTestId('daily-goal')).toHaveTextContent('90');
    });
  });

  describe('Corrupt Data Handling', () => {
    it('falls back to defaults when localStorage has invalid JSON', async () => {
      // Spy on getUserSettings to simulate corrupt data
      const getUserSettingsSpy = vi.spyOn(localStorage, 'getUserSettings');
      getUserSettingsSpy.mockReturnValueOnce(localStorage.DEFAULT_SETTINGS);

      render(
        <UserSettingsProvider>
          <TestComponent />
        </UserSettingsProvider>
      );

      // Verify defaults loaded
      await waitFor(() => {
        expect(screen.getByTestId('reduced-motion')).toHaveTextContent('false');
        expect(screen.getByTestId('sound-enabled')).toHaveTextContent('true');
        expect(screen.getByTestId('daily-goal')).toHaveTextContent('60');
        expect(screen.getByTestId('research-mode')).toHaveTextContent('false');
      });

      getUserSettingsSpy.mockRestore();
    });
  });
});
