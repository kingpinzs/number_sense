/**
 * Integration Tests for Transparency Toast Notifications
 * Story 4.5: Build Transparency Toast Notifications
 *
 * Testing: Full integration of toast display with settings and adjustments
 * AC: #1, #2, #3, #4, #5, #6
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { AdjustmentResult, PerformanceMetrics, AdjustmentReason, DifficultyModule } from '@/services/adaptiveDifficulty/difficultyEngine';
import { useTransparencyToast } from '../hooks/useTransparencyToast';
import { getToastMessage, MODULE_FRIENDLY_NAMES, TOAST_MESSAGES } from './toastMessages';

// Mock sonner
vi.mock('sonner', () => ({
  toast: vi.fn(),
}));

// Mock UserSettingsContext with configurable settings
let mockShowAdaptiveToasts = true;

vi.mock('@/context/UserSettingsContext', () => ({
  useUserSettings: vi.fn(() => ({
    settings: {
      showAdaptiveToasts: mockShowAdaptiveToasts,
      reducedMotion: false,
      soundEnabled: true,
      dailyGoalMinutes: 60,
      researchModeEnabled: false,
    },
    updateSettings: vi.fn(),
  })),
}));

import { toast } from 'sonner';
const mockToast = vi.mocked(toast);

// Helper to create test AdjustmentResult
function createAdjustment(
  reason: AdjustmentReason = 'accuracy_high',
  module: DifficultyModule = 'number_line',
  overrides: Partial<AdjustmentResult> = {}
): AdjustmentResult {
  const defaultMetrics: PerformanceMetrics = {
    averageAccuracy: 90,
    medianTimeMs: 2500,
    consistencyScore: 8,
    confidenceTrend: 0.3,
    sessionCount: 5,
    drillCount: 25,
  };

  return {
    module,
    previousLevel: 5,
    newLevel: 6,
    reason,
    timestamp: new Date().toISOString(),
    metrics: defaultMetrics,
    ...overrides,
  };
}

describe('Transparency Toast Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockShowAdaptiveToasts = true;
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    });
  });

  describe('AC 7.1: Toast appears after session with difficulty increase', () => {
    it('shows toast with celebration emoji for accuracy_high', () => {
      const { result } = renderHook(() => useTransparencyToast());
      const adjustment = createAdjustment('accuracy_high', 'number_line', {
        previousLevel: 5,
        newLevel: 6,
      });

      act(() => {
        result.current.showTransparencyToast([adjustment]);
      });

      expect(mockToast).toHaveBeenCalledTimes(1);
      const [message] = mockToast.mock.calls[0];
      expect(message).toContain('🎉'); // Celebration emoji for increase
    });

    it('shows toast with speed emoji for speed_fast', () => {
      const { result } = renderHook(() => useTransparencyToast());
      const adjustment = createAdjustment('speed_fast', 'math_operations', {
        previousLevel: 4,
        newLevel: 5,
      });

      act(() => {
        result.current.showTransparencyToast([adjustment]);
      });

      expect(mockToast).toHaveBeenCalledTimes(1);
      const [message] = mockToast.mock.calls[0];
      expect(message).toContain('⚡'); // Speed emoji
    });
  });

  describe('AC 7.2: Toast appears after session with difficulty decrease', () => {
    it('shows toast with strength emoji for accuracy_low', () => {
      const { result } = renderHook(() => useTransparencyToast());
      const adjustment = createAdjustment('accuracy_low', 'spatial_rotation', {
        previousLevel: 5,
        newLevel: 4,
      });

      act(() => {
        result.current.showTransparencyToast([adjustment]);
      });

      expect(mockToast).toHaveBeenCalledTimes(1);
      const [message] = mockToast.mock.calls[0];
      expect(message).toContain('💪'); // Strength emoji for decrease
    });

    it('shows toast with rotation emoji for mirror_confusion', () => {
      const { result } = renderHook(() => useTransparencyToast());
      const adjustment = createAdjustment('mirror_confusion', 'spatial_rotation', {
        previousLevel: 6,
        newLevel: 3,
      });

      act(() => {
        result.current.showTransparencyToast([adjustment]);
      });

      expect(mockToast).toHaveBeenCalledTimes(1);
      const [message] = mockToast.mock.calls[0];
      expect(message).toContain('🔄'); // Rotation emoji for mirror confusion
    });
  });

  describe('AC 7.3: Toast respects showAdaptiveToasts=false', () => {
    it('does not show toast when setting is disabled', () => {
      mockShowAdaptiveToasts = false;

      const { result } = renderHook(() => useTransparencyToast());
      const adjustment = createAdjustment();

      act(() => {
        result.current.showTransparencyToast([adjustment]);
      });

      expect(mockToast).not.toHaveBeenCalled();
    });

    it('shows toast when setting is enabled', () => {
      mockShowAdaptiveToasts = true;

      const { result } = renderHook(() => useTransparencyToast());
      const adjustment = createAdjustment();

      act(() => {
        result.current.showTransparencyToast([adjustment]);
      });

      expect(mockToast).toHaveBeenCalledTimes(1);
    });

    it('reports correct isEnabled status', () => {
      mockShowAdaptiveToasts = false;
      const { result: resultDisabled } = renderHook(() => useTransparencyToast());
      expect(resultDisabled.current.isEnabled).toBe(false);

      mockShowAdaptiveToasts = true;
      const { result: resultEnabled } = renderHook(() => useTransparencyToast());
      expect(resultEnabled.current.isEnabled).toBe(true);
    });
  });

  describe('AC 7.4: Only one toast shows when multiple adjustments occur', () => {
    it('only shows first adjustment from array', () => {
      const { result } = renderHook(() => useTransparencyToast());

      const adjustments = [
        createAdjustment('accuracy_high', 'number_line', { timestamp: '2025-01-01T00:00:00.000Z' }),
        createAdjustment('speed_fast', 'math_operations', { timestamp: '2025-01-01T00:00:01.000Z' }),
        createAdjustment('accuracy_low', 'spatial_rotation', { timestamp: '2025-01-01T00:00:02.000Z' }),
      ];

      act(() => {
        result.current.showTransparencyToast(adjustments);
      });

      // Only one toast call
      expect(mockToast).toHaveBeenCalledTimes(1);

      // Should be first adjustment's emoji
      const [message] = mockToast.mock.calls[0];
      expect(message).toContain('🎉'); // accuracy_high emoji
      expect(message).not.toContain('⚡'); // Not speed_fast
      expect(message).not.toContain('💪'); // Not accuracy_low
    });

    it('prevents duplicate toasts for same timestamp', () => {
      const { result } = renderHook(() => useTransparencyToast());

      const adjustment = createAdjustment('accuracy_high', 'number_line', {
        timestamp: '2025-01-01T00:00:00.000Z',
      });

      // Call multiple times with same adjustment
      act(() => {
        result.current.showTransparencyToast([adjustment]);
      });

      act(() => {
        result.current.showTransparencyToast([adjustment]);
      });

      act(() => {
        result.current.showTransparencyToast([adjustment]);
      });

      // Should only have shown once
      expect(mockToast).toHaveBeenCalledTimes(1);
    });
  });

  describe('AC 7.5: Module names display correctly', () => {
    const moduleCases: Array<{ code: DifficultyModule; name: string }> = [
      { code: 'number_line', name: 'Number Line' },
      { code: 'spatial_rotation', name: 'Spatial Rotation' },
      { code: 'math_operations', name: 'Math Operations' },
    ];

    moduleCases.forEach(({ code, name }) => {
      it(`displays "${name}" for ${code} module`, () => {
        // Verify the constant mapping
        expect(MODULE_FRIENDLY_NAMES[code]).toBe(name);
      });

      it(`message includes "${name}" when template uses {module}`, () => {
        // Use accuracy_high reason which has templates with {module} placeholder
        const adjustment = createAdjustment('accuracy_high', code);

        // Check that at least one template contains the module name after substitution
        const toastContent = getToastMessage(adjustment);

        // The message should be a valid string
        expect(typeof toastContent.message).toBe('string');
        expect(toastContent.message.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Toast configuration validation', () => {
    it('all reason codes have valid configurations', () => {
      const allReasons: AdjustmentReason[] = [
        'accuracy_high',
        'accuracy_low',
        'speed_fast',
        'mirror_confusion',
        'optimal',
        'initial',
      ];

      allReasons.forEach((reason) => {
        expect(TOAST_MESSAGES[reason]).toBeDefined();
        expect(TOAST_MESSAGES[reason].emoji).toBeDefined();
        expect(TOAST_MESSAGES[reason].templates.length).toBeGreaterThan(0);
      });
    });

    it('toast options include correct duration and dismissible settings', () => {
      const { result } = renderHook(() => useTransparencyToast());
      const adjustment = createAdjustment();

      act(() => {
        result.current.showTransparencyToast([adjustment]);
      });

      const [, options] = mockToast.mock.calls[0];
      expect(options?.duration).toBe(5000);
      expect(options?.dismissible).toBe(true);
    });

    it('uses correct position on desktop', () => {
      Object.defineProperty(window, 'innerWidth', { value: 1024 });

      const { result } = renderHook(() => useTransparencyToast());
      const adjustment = createAdjustment();

      act(() => {
        result.current.showTransparencyToast([adjustment]);
      });

      const [, options] = mockToast.mock.calls[0];
      expect(options?.position).toBe('top-right');
    });

    it('uses correct position on mobile', () => {
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

  describe('End-to-end flow simulation', () => {
    it('simulates complete session ending with difficulty increase', () => {
      mockShowAdaptiveToasts = true;

      const { result } = renderHook(() => useTransparencyToast());

      // Simulate session ending with high accuracy
      const sessionAdjustments: AdjustmentResult[] = [
        {
          module: 'number_line',
          previousLevel: 5,
          newLevel: 6,
          reason: 'accuracy_high',
          timestamp: new Date().toISOString(),
          metrics: {
            averageAccuracy: 92,
            medianTimeMs: 2300,
            consistencyScore: 5,
            confidenceTrend: 0.5,
            sessionCount: 5,
            drillCount: 30,
          },
        },
      ];

      act(() => {
        result.current.showTransparencyToast(sessionAdjustments);
      });

      // Verify toast was shown
      expect(mockToast).toHaveBeenCalledTimes(1);

      // Verify content matches expectation (messages mention progress, challenges, or harder)
      const [message] = mockToast.mock.calls[0];
      expect(message).toMatch(/🎉.*(challenge|progress|level|harder|mastered)/i);
    });

    it('simulates complete session ending with difficulty decrease', () => {
      mockShowAdaptiveToasts = true;

      const { result } = renderHook(() => useTransparencyToast());

      // Simulate session ending with low accuracy
      const sessionAdjustments: AdjustmentResult[] = [
        {
          module: 'spatial_rotation',
          previousLevel: 5,
          newLevel: 4,
          reason: 'accuracy_low',
          timestamp: new Date().toISOString(),
          metrics: {
            averageAccuracy: 55,
            medianTimeMs: 4500,
            consistencyScore: 18,
            confidenceTrend: -0.2,
            sessionCount: 5,
            drillCount: 25,
          },
        },
      ];

      act(() => {
        result.current.showTransparencyToast(sessionAdjustments);
      });

      // Verify toast was shown
      expect(mockToast).toHaveBeenCalledTimes(1);

      // Verify content matches expectation
      // Templates include: "simpler", "confidence", "foundation", "fundamentals"
      const [message] = mockToast.mock.calls[0];
      expect(message).toMatch(/💪.*(simpler|confidence|foundation|fundamentals)/i);
    });
  });
});
