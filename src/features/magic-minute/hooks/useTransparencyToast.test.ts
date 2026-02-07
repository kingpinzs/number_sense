/**
 * Tests for useTransparencyToast Hook
 * Story 4.5: Build Transparency Toast Notifications
 *
 * Testing: User preference respect, toast display, duplicate prevention
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTransparencyToast } from './useTransparencyToast';
import type { AdjustmentResult, PerformanceMetrics } from '@/services/adaptiveDifficulty/difficultyEngine';

// Mock sonner
vi.mock('sonner', () => ({
  toast: vi.fn(),
}));

// Mock UserSettingsContext
const mockSettings = {
  showAdaptiveToasts: true,
  reducedMotion: false,
  soundEnabled: true,
  dailyGoalMinutes: 60,
  researchModeEnabled: false,
};

vi.mock('@/context/UserSettingsContext', () => ({
  useUserSettings: vi.fn(() => ({
    settings: mockSettings,
    updateSettings: vi.fn(),
  })),
}));

// Import mocks for assertions
import { toast } from 'sonner';
import { useUserSettings } from '@/context/UserSettingsContext';

const mockToast = vi.mocked(toast);
const mockUseUserSettings = vi.mocked(useUserSettings);

// Helper to create test AdjustmentResult
function createAdjustment(
  overrides: Partial<AdjustmentResult> = {}
): AdjustmentResult {
  const defaultMetrics: PerformanceMetrics = {
    averageAccuracy: 75,
    medianTimeMs: 3000,
    consistencyScore: 10,
    confidenceTrend: 0.5,
    sessionCount: 5,
    drillCount: 20,
  };

  return {
    module: 'number_line',
    previousLevel: 5,
    newLevel: 6,
    reason: 'accuracy_high',
    timestamp: new Date().toISOString(),
    metrics: defaultMetrics,
    ...overrides,
  };
}

describe('useTransparencyToast', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mock settings to default
    mockSettings.showAdaptiveToasts = true;

    // Mock window.innerWidth
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024, // Desktop by default
    });
  });

  describe('basic functionality', () => {
    it('returns showTransparencyToast function', () => {
      const { result } = renderHook(() => useTransparencyToast());

      expect(typeof result.current.showTransparencyToast).toBe('function');
    });

    it('returns isEnabled based on settings', () => {
      const { result } = renderHook(() => useTransparencyToast());

      expect(result.current.isEnabled).toBe(true);
    });

    it('returns isEnabled as false when disabled in settings', () => {
      mockSettings.showAdaptiveToasts = false;
      mockUseUserSettings.mockReturnValue({
        settings: mockSettings,
        updateSettings: vi.fn(),
      });

      const { result } = renderHook(() => useTransparencyToast());

      expect(result.current.isEnabled).toBe(false);
    });
  });

  describe('showTransparencyToast', () => {
    it('calls toast when adjustments provided and enabled', () => {
      const { result } = renderHook(() => useTransparencyToast());
      const adjustment = createAdjustment();

      act(() => {
        result.current.showTransparencyToast([adjustment]);
      });

      expect(mockToast).toHaveBeenCalledTimes(1);
    });

    it('includes emoji in toast message', () => {
      const { result } = renderHook(() => useTransparencyToast());
      const adjustment = createAdjustment({ reason: 'accuracy_high' });

      act(() => {
        result.current.showTransparencyToast([adjustment]);
      });

      const [message] = mockToast.mock.calls[0];
      expect(message).toContain('🎉');
    });

    it('does not call toast when adjustments is empty', () => {
      const { result } = renderHook(() => useTransparencyToast());

      act(() => {
        result.current.showTransparencyToast([]);
      });

      expect(mockToast).not.toHaveBeenCalled();
    });

    it('only shows first adjustment when multiple provided', () => {
      const { result } = renderHook(() => useTransparencyToast());
      const adjustments = [
        createAdjustment({ reason: 'accuracy_high', timestamp: '2025-01-01T00:00:00.000Z' }),
        createAdjustment({ reason: 'speed_fast', timestamp: '2025-01-01T00:00:01.000Z' }),
      ];

      act(() => {
        result.current.showTransparencyToast(adjustments);
      });

      expect(mockToast).toHaveBeenCalledTimes(1);
      const [message] = mockToast.mock.calls[0];
      expect(message).toContain('🎉'); // First adjustment
    });
  });

  describe('user preference respect (AC-5)', () => {
    it('does not call toast when showAdaptiveToasts is false', () => {
      mockSettings.showAdaptiveToasts = false;
      mockUseUserSettings.mockReturnValue({
        settings: mockSettings,
        updateSettings: vi.fn(),
      });

      const { result } = renderHook(() => useTransparencyToast());
      const adjustment = createAdjustment();

      act(() => {
        result.current.showTransparencyToast([adjustment]);
      });

      expect(mockToast).not.toHaveBeenCalled();
    });

    it('calls toast when showAdaptiveToasts is true', () => {
      mockSettings.showAdaptiveToasts = true;
      mockUseUserSettings.mockReturnValue({
        settings: mockSettings,
        updateSettings: vi.fn(),
      });

      const { result } = renderHook(() => useTransparencyToast());
      const adjustment = createAdjustment();

      act(() => {
        result.current.showTransparencyToast([adjustment]);
      });

      expect(mockToast).toHaveBeenCalledTimes(1);
    });
  });

  describe('toast options', () => {
    it('sets duration to 5000ms', () => {
      const { result } = renderHook(() => useTransparencyToast());
      const adjustment = createAdjustment();

      act(() => {
        result.current.showTransparencyToast([adjustment]);
      });

      const [, options] = mockToast.mock.calls[0];
      expect(options?.duration).toBe(5000);
    });

    it('sets dismissible to true', () => {
      const { result } = renderHook(() => useTransparencyToast());
      const adjustment = createAdjustment();

      act(() => {
        result.current.showTransparencyToast([adjustment]);
      });

      const [, options] = mockToast.mock.calls[0];
      expect(options?.dismissible).toBe(true);
    });

    it('uses top-right position on desktop', () => {
      Object.defineProperty(window, 'innerWidth', { value: 1024 });

      const { result } = renderHook(() => useTransparencyToast());
      const adjustment = createAdjustment();

      act(() => {
        result.current.showTransparencyToast([adjustment]);
      });

      const [, options] = mockToast.mock.calls[0];
      expect(options?.position).toBe('top-right');
    });

    it('uses bottom-center position on mobile', () => {
      Object.defineProperty(window, 'innerWidth', { value: 600 });

      const { result } = renderHook(() => useTransparencyToast());
      const adjustment = createAdjustment();

      act(() => {
        result.current.showTransparencyToast([adjustment]);
      });

      const [, options] = mockToast.mock.calls[0];
      expect(options?.position).toBe('bottom-center');
    });
  });

  describe('duplicate prevention', () => {
    it('does not show duplicate toast for same timestamp', () => {
      const { result } = renderHook(() => useTransparencyToast());
      const adjustment = createAdjustment({ timestamp: '2025-01-01T00:00:00.000Z' });

      act(() => {
        result.current.showTransparencyToast([adjustment]);
      });

      expect(mockToast).toHaveBeenCalledTimes(1);

      act(() => {
        result.current.showTransparencyToast([adjustment]);
      });

      // Should still only have called once
      expect(mockToast).toHaveBeenCalledTimes(1);
    });

    it('shows new toast for different timestamp', () => {
      const { result } = renderHook(() => useTransparencyToast());
      const adjustment1 = createAdjustment({ timestamp: '2025-01-01T00:00:00.000Z' });
      const adjustment2 = createAdjustment({ timestamp: '2025-01-01T00:01:00.000Z' });

      act(() => {
        result.current.showTransparencyToast([adjustment1]);
      });

      expect(mockToast).toHaveBeenCalledTimes(1);

      act(() => {
        result.current.showTransparencyToast([adjustment2]);
      });

      expect(mockToast).toHaveBeenCalledTimes(2);
    });
  });

  describe('all adjustment reasons', () => {
    const testCases: Array<{ reason: AdjustmentResult['reason']; expectedEmoji: string }> = [
      { reason: 'accuracy_high', expectedEmoji: '🎉' },
      { reason: 'accuracy_low', expectedEmoji: '💪' },
      { reason: 'speed_fast', expectedEmoji: '⚡' },
      { reason: 'mirror_confusion', expectedEmoji: '🔄' },
    ];

    testCases.forEach(({ reason, expectedEmoji }) => {
      it(`shows toast with ${expectedEmoji} for ${reason}`, () => {
        vi.clearAllMocks();
        const { result } = renderHook(() => useTransparencyToast());
        const adjustment = createAdjustment({ reason });

        act(() => {
          result.current.showTransparencyToast([adjustment]);
        });

        const [message] = mockToast.mock.calls[0];
        expect(message).toContain(expectedEmoji);
      });
    });
  });
});
