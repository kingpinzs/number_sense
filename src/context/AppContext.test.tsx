// AppContext Tests
// Architecture: Unit and integration tests for AppContext
// Coverage: state management, localStorage persistence, convenience methods

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AppProvider, useApp } from './AppContext';
import * as localStorageService from '@/services/storage/localStorage';

// Test component that uses AppContext
function TestComponent() {
  const { state, setStreak, updateOnlineStatus, setLastSync, setPendingSyncCount } = useApp();

  return (
    <div>
      <div data-testid="streak">{state.streak}</div>
      <div data-testid="online-status">{state.onlineStatus.toString()}</div>
      <div data-testid="last-sync">{state.lastSyncTimestamp || 'null'}</div>
      <div data-testid="pending-sync-count">{state.pendingSyncCount}</div>
      <button onClick={() => setStreak(10)}>Set Streak 10</button>
      <button onClick={() => updateOnlineStatus(false)}>Go Offline</button>
      <button onClick={() => setLastSync('2025-11-10T12:00:00Z')}>Set Sync</button>
      <button onClick={() => setLastSync(null)}>Clear Sync</button>
      <button onClick={() => setPendingSyncCount(5)}>Set Pending 5</button>
      <button onClick={() => setPendingSyncCount(0)}>Clear Pending</button>
    </div>
  );
}

describe('AppContext', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorageService.setStreak(0);
    vi.clearAllMocks();
  });

  describe('Provider and Hook', () => {
    it('provides context to child components', () => {
      render(
        <AppProvider>
          <TestComponent />
        </AppProvider>
      );

      // Verify initial state is rendered
      expect(screen.getByTestId('streak')).toHaveTextContent('0');
      expect(screen.getByTestId('online-status')).toHaveTextContent('true');
      expect(screen.getByTestId('last-sync')).toHaveTextContent('null');
      expect(screen.getByTestId('pending-sync-count')).toHaveTextContent('0');
    });

    it('throws error when useApp used outside provider', () => {
      // Suppress console.error for this test
      const originalError = console.error;
      console.error = vi.fn();

      expect(() => {
        render(<TestComponent />);
      }).toThrow('useApp must be used within AppProvider');

      console.error = originalError;
    });
  });

  describe('Streak Management', () => {
    it('updates streak state when setStreak is called', () => {
      render(
        <AppProvider>
          <TestComponent />
        </AppProvider>
      );

      // Initial streak is 0
      expect(screen.getByTestId('streak')).toHaveTextContent('0');

      // Click button to set streak to 10
      fireEvent.click(screen.getByText('Set Streak 10'));

      // Verify streak updated
      expect(screen.getByTestId('streak')).toHaveTextContent('10');
    });

    it('persists streak to localStorage on update', () => {
      const setStreakSpy = vi.spyOn(localStorageService, 'setStreak');

      render(
        <AppProvider>
          <TestComponent />
        </AppProvider>
      );

      // Set streak to 10
      fireEvent.click(screen.getByText('Set Streak 10'));

      // Verify localStorage was called
      expect(setStreakSpy).toHaveBeenCalledWith(10);
    });

    it('loads initial streak from localStorage', () => {
      // Set streak in localStorage before mounting
      localStorageService.setStreak(7);

      render(
        <AppProvider>
          <TestComponent />
        </AppProvider>
      );

      // Verify streak loaded from localStorage
      expect(screen.getByTestId('streak')).toHaveTextContent('7');
    });
  });

  describe('Online Status Management', () => {
    it('updates online status when updateOnlineStatus is called', () => {
      render(
        <AppProvider>
          <TestComponent />
        </AppProvider>
      );

      // Initial status is true (navigator.onLine)
      expect(screen.getByTestId('online-status')).toHaveTextContent('true');

      // Click button to go offline
      fireEvent.click(screen.getByText('Go Offline'));

      // Verify status updated
      expect(screen.getByTestId('online-status')).toHaveTextContent('false');
    });
  });

  describe('Last Sync Timestamp Management', () => {
    it('updates last sync timestamp when setLastSync is called', () => {
      render(
        <AppProvider>
          <TestComponent />
        </AppProvider>
      );

      // Initial sync timestamp is null
      expect(screen.getByTestId('last-sync')).toHaveTextContent('null');

      // Click button to set sync timestamp
      fireEvent.click(screen.getByText('Set Sync'));

      // Verify timestamp updated
      expect(screen.getByTestId('last-sync')).toHaveTextContent('2025-11-10T12:00:00Z');
    });

    it('allows setting sync timestamp to null', () => {
      render(
        <AppProvider>
          <TestComponent />
        </AppProvider>
      );

      // Set timestamp first
      fireEvent.click(screen.getByText('Set Sync'));
      expect(screen.getByTestId('last-sync')).toHaveTextContent('2025-11-10T12:00:00Z');

      // Clear timestamp
      fireEvent.click(screen.getByText('Clear Sync'));
      expect(screen.getByTestId('last-sync')).toHaveTextContent('null');
    });
  });

  describe('Pending Sync Count Management', () => {
    it('initializes pendingSyncCount to 0', () => {
      render(
        <AppProvider>
          <TestComponent />
        </AppProvider>
      );

      expect(screen.getByTestId('pending-sync-count')).toHaveTextContent('0');
    });

    it('updates pendingSyncCount when setPendingSyncCount is called', () => {
      render(
        <AppProvider>
          <TestComponent />
        </AppProvider>
      );

      fireEvent.click(screen.getByText('Set Pending 5'));

      expect(screen.getByTestId('pending-sync-count')).toHaveTextContent('5');
    });

    it('resets pendingSyncCount to 0 when cleared', () => {
      render(
        <AppProvider>
          <TestComponent />
        </AppProvider>
      );

      fireEvent.click(screen.getByText('Set Pending 5'));
      expect(screen.getByTestId('pending-sync-count')).toHaveTextContent('5');

      fireEvent.click(screen.getByText('Clear Pending'));
      expect(screen.getByTestId('pending-sync-count')).toHaveTextContent('0');
    });
  });

  describe('Integration', () => {
    it('maintains state across multiple updates', () => {
      render(
        <AppProvider>
          <TestComponent />
        </AppProvider>
      );

      // Update streak
      fireEvent.click(screen.getByText('Set Streak 10'));
      expect(screen.getByTestId('streak')).toHaveTextContent('10');

      // Update online status
      fireEvent.click(screen.getByText('Go Offline'));
      expect(screen.getByTestId('online-status')).toHaveTextContent('false');

      // Update last sync
      fireEvent.click(screen.getByText('Set Sync'));
      expect(screen.getByTestId('last-sync')).toHaveTextContent('2025-11-10T12:00:00Z');

      // Verify all state updated correctly
      expect(screen.getByTestId('streak')).toHaveTextContent('10');
      expect(screen.getByTestId('online-status')).toHaveTextContent('false');
      expect(screen.getByTestId('last-sync')).toHaveTextContent('2025-11-10T12:00:00Z');
    });
  });
});
