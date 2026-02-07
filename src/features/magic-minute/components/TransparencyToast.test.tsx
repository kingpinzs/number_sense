/**
 * Tests for TransparencyToast Component
 * Story 4.5: Build Transparency Toast Notifications
 *
 * Testing: Toast display, responsive positioning, dismissal, single toast per session
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { TransparencyToast, showTransparencyToastImperative } from './TransparencyToast';
import type { AdjustmentResult, PerformanceMetrics } from '@/services/adaptiveDifficulty/difficultyEngine';

// Mock sonner
vi.mock('sonner', () => ({
  toast: vi.fn(),
}));

// Import mocked toast for assertions
import { toast } from 'sonner';
const mockToast = vi.mocked(toast);

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

describe('TransparencyToast', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock window.innerWidth for responsive tests
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024, // Default to desktop
    });
  });

  afterEach(() => {
    cleanup();
  });

  describe('rendering', () => {
    it('renders nothing visible (returns null)', () => {
      const { container } = render(
        <TransparencyToast adjustments={[]} />
      );

      expect(container.innerHTML).toBe('');
    });

    it('does not call toast when adjustments is empty', () => {
      render(<TransparencyToast adjustments={[]} />);

      expect(mockToast).not.toHaveBeenCalled();
    });
  });

  describe('toast display', () => {
    it('calls toast when adjustments array has items', () => {
      const adjustment = createAdjustment();
      render(<TransparencyToast adjustments={[adjustment]} />);

      expect(mockToast).toHaveBeenCalledTimes(1);
    });

    it('includes emoji in toast message', () => {
      const adjustment = createAdjustment({ reason: 'accuracy_high' });
      render(<TransparencyToast adjustments={[adjustment]} />);

      const [message] = mockToast.mock.calls[0];
      expect(message).toContain('🎉');
    });

    it('includes user-friendly message', () => {
      const adjustment = createAdjustment({ reason: 'accuracy_high' });
      render(<TransparencyToast adjustments={[adjustment]} />);

      const [message] = mockToast.mock.calls[0];
      expect(typeof message).toBe('string');
      expect((message as string).length).toBeGreaterThan(5);
    });

    it('only shows first adjustment when multiple exist (no spam)', () => {
      const adjustments = [
        createAdjustment({ reason: 'accuracy_high', timestamp: '2025-01-01T00:00:00.000Z' }),
        createAdjustment({ reason: 'speed_fast', timestamp: '2025-01-01T00:00:01.000Z' }),
        createAdjustment({ reason: 'accuracy_low', timestamp: '2025-01-01T00:00:02.000Z' }),
      ];

      render(<TransparencyToast adjustments={adjustments} />);

      // Should only call toast once
      expect(mockToast).toHaveBeenCalledTimes(1);

      // Should contain emoji for first adjustment (accuracy_high = 🎉)
      const [message] = mockToast.mock.calls[0];
      expect(message).toContain('🎉');
    });
  });

  describe('toast options', () => {
    it('sets duration to 5000ms', () => {
      const adjustment = createAdjustment();
      render(<TransparencyToast adjustments={[adjustment]} />);

      const [, options] = mockToast.mock.calls[0];
      expect(options?.duration).toBe(5000);
    });

    it('sets dismissible to true', () => {
      const adjustment = createAdjustment();
      render(<TransparencyToast adjustments={[adjustment]} />);

      const [, options] = mockToast.mock.calls[0];
      expect(options?.dismissible).toBe(true);
    });

    it('uses top-right position on desktop (width >= 768)', () => {
      Object.defineProperty(window, 'innerWidth', { value: 1024 });

      const adjustment = createAdjustment();
      render(<TransparencyToast adjustments={[adjustment]} />);

      const [, options] = mockToast.mock.calls[0];
      expect(options?.position).toBe('top-right');
    });

    it('uses bottom-center position on mobile (width < 768)', () => {
      Object.defineProperty(window, 'innerWidth', { value: 600 });

      const adjustment = createAdjustment();
      render(<TransparencyToast adjustments={[adjustment]} />);

      const [, options] = mockToast.mock.calls[0];
      expect(options?.position).toBe('bottom-center');
    });
  });

  describe('onDismiss callback', () => {
    it('calls onDismiss when toast is dismissed', () => {
      const onDismiss = vi.fn();
      const adjustment = createAdjustment();

      render(<TransparencyToast adjustments={[adjustment]} onDismiss={onDismiss} />);

      // Get the onDismiss handler passed to toast
      const [, options] = mockToast.mock.calls[0];

      // Simulate dismissal
      options?.onDismiss?.(undefined as any);

      expect(onDismiss).toHaveBeenCalledTimes(1);
    });

    it('calls onDismiss when toast auto-closes', () => {
      const onDismiss = vi.fn();
      const adjustment = createAdjustment();

      render(<TransparencyToast adjustments={[adjustment]} onDismiss={onDismiss} />);

      const [, options] = mockToast.mock.calls[0];

      // Simulate auto-close
      options?.onAutoClose?.(undefined as any);

      expect(onDismiss).toHaveBeenCalledTimes(1);
    });

    it('works without onDismiss callback', () => {
      const adjustment = createAdjustment();

      // Should not throw
      expect(() => {
        render(<TransparencyToast adjustments={[adjustment]} />);
      }).not.toThrow();
    });
  });

  describe('duplicate prevention', () => {
    it('does not show duplicate toast for same adjustment', () => {
      const adjustment = createAdjustment({ timestamp: '2025-01-01T00:00:00.000Z' });

      const { rerender } = render(<TransparencyToast adjustments={[adjustment]} />);

      expect(mockToast).toHaveBeenCalledTimes(1);

      // Re-render with same adjustment
      rerender(<TransparencyToast adjustments={[adjustment]} />);

      // Should still only have called once
      expect(mockToast).toHaveBeenCalledTimes(1);
    });

    it('shows new toast when adjustment changes', () => {
      const adjustment1 = createAdjustment({ timestamp: '2025-01-01T00:00:00.000Z' });
      const adjustment2 = createAdjustment({ timestamp: '2025-01-01T00:01:00.000Z' });

      const { rerender } = render(<TransparencyToast adjustments={[adjustment1]} />);

      expect(mockToast).toHaveBeenCalledTimes(1);

      // Re-render with different adjustment
      rerender(<TransparencyToast adjustments={[adjustment2]} />);

      // Should have called toast again
      expect(mockToast).toHaveBeenCalledTimes(2);
    });

    it('resets when adjustments cleared and new ones added', () => {
      const adjustment1 = createAdjustment({ timestamp: '2025-01-01T00:00:00.000Z' });
      const adjustment2 = createAdjustment({ timestamp: '2025-01-01T00:01:00.000Z' });

      const { rerender } = render(<TransparencyToast adjustments={[adjustment1]} />);

      expect(mockToast).toHaveBeenCalledTimes(1);

      // Clear adjustments
      rerender(<TransparencyToast adjustments={[]} />);

      // Add new adjustment
      rerender(<TransparencyToast adjustments={[adjustment2]} />);

      // Should have called toast again
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
      it(`displays toast with ${expectedEmoji} for ${reason}`, () => {
        vi.clearAllMocks();
        const adjustment = createAdjustment({ reason });
        render(<TransparencyToast adjustments={[adjustment]} />);

        const [message] = mockToast.mock.calls[0];
        expect(message).toContain(expectedEmoji);
        cleanup();
      });
    });
  });
});

describe('showTransparencyToastImperative', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    });
  });

  it('does not call toast when adjustments is empty', () => {
    showTransparencyToastImperative([]);

    expect(mockToast).not.toHaveBeenCalled();
  });

  it('calls toast with correct message', () => {
    const adjustment = createAdjustment({ reason: 'accuracy_high' });
    showTransparencyToastImperative([adjustment]);

    expect(mockToast).toHaveBeenCalledTimes(1);
    const [message] = mockToast.mock.calls[0];
    expect(message).toContain('🎉');
  });

  it('only shows first adjustment', () => {
    const adjustments = [
      createAdjustment({ reason: 'accuracy_high' }),
      createAdjustment({ reason: 'speed_fast' }),
    ];

    showTransparencyToastImperative(adjustments);

    expect(mockToast).toHaveBeenCalledTimes(1);
    const [message] = mockToast.mock.calls[0];
    expect(message).toContain('🎉'); // First adjustment
    expect(message).not.toContain('⚡'); // Not second
  });

  it('sets correct toast options', () => {
    const adjustment = createAdjustment();
    showTransparencyToastImperative([adjustment]);

    const [, options] = mockToast.mock.calls[0];
    expect(options?.duration).toBe(5000);
    expect(options?.dismissible).toBe(true);
  });

  it('calls onDismiss callback when provided', () => {
    const onDismiss = vi.fn();
    const adjustment = createAdjustment();

    showTransparencyToastImperative([adjustment], onDismiss);

    const [, options] = mockToast.mock.calls[0];
    options?.onDismiss?.(undefined as any);

    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});
