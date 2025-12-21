/**
 * useMagicMinuteTrigger Hook Tests
 * Story 4.2: Build Magic Minute Timer Component
 *
 * Tests for the trigger logic that determines when Magic Minute activates.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useMagicMinuteTrigger } from './useMagicMinuteTrigger';
import type { MistakePattern } from '@/services/adaptiveDifficulty/mistakeAnalyzer';

// Mock mistake patterns
const createMistakePatterns = (count: number): MistakePattern[] => {
  return Array.from({ length: count }, (_, i) => ({
    patternType: `pattern_${i}` as any,
    occurrences: 2,
    recentDrills: 5,
    confidence: 0.6,
    detectedAt: Date.now(),
  }));
};

describe('useMagicMinuteTrigger', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  // Task 3.1: Hook returns expected interface
  it('returns shouldTrigger, checkTrigger, and reset functions', () => {
    const { result } = renderHook(() => useMagicMinuteTrigger());

    expect(result.current.shouldTrigger).toBe(false);
    expect(typeof result.current.checkTrigger).toBe('function');
    expect(typeof result.current.reset).toBe('function');
    expect(result.current.mistakePatterns).toEqual([]);
  });

  // Task 3.2: Does not trigger before drill 6
  it('does not trigger before completing 6 drills', () => {
    const { result } = renderHook(() => useMagicMinuteTrigger());
    const mistakePatterns = createMistakePatterns(5);

    act(() => {
      result.current.checkTrigger(5, mistakePatterns);
    });

    expect(result.current.shouldTrigger).toBe(false);
  });

  // Task 3.3: Does not trigger with fewer than 3 mistakes
  it('does not trigger with fewer than 3 mistakes', () => {
    const { result } = renderHook(() => useMagicMinuteTrigger());
    const mistakePatterns = createMistakePatterns(2);

    act(() => {
      result.current.checkTrigger(8, mistakePatterns);
    });

    expect(result.current.shouldTrigger).toBe(false);
  });

  // Task 3.2/3.3: Triggers at valid trigger point with sufficient mistakes (deterministic for testing)
  it('triggers at drill 6 with 3+ mistakes when probability succeeds', () => {
    // Mock Math.random to return 0 (which is < 0.3, so should trigger)
    vi.spyOn(Math, 'random').mockReturnValue(0);

    const { result } = renderHook(() => useMagicMinuteTrigger());
    const mistakePatterns = createMistakePatterns(4);

    act(() => {
      result.current.checkTrigger(6, mistakePatterns);  // Use valid trigger point
    });

    expect(result.current.shouldTrigger).toBe(true);
    expect(result.current.mistakePatterns).toEqual(mistakePatterns);
  });

  // Task 3.4: Only triggers once per session
  it('only triggers once per session', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);

    const { result } = renderHook(() => useMagicMinuteTrigger());
    const mistakePatterns = createMistakePatterns(4);

    // First check at drill 6 - should trigger
    act(() => {
      result.current.checkTrigger(6, mistakePatterns);
    });
    expect(result.current.shouldTrigger).toBe(true);

    // Reset the shouldTrigger but keep hasTriggered true
    act(() => {
      result.current.acknowledge();
    });

    // Second check at drill 9 - should NOT trigger again
    act(() => {
      result.current.checkTrigger(9, mistakePatterns);
    });
    expect(result.current.shouldTrigger).toBe(false);
  });

  // Reset allows triggering in new session
  it('reset allows triggering in new session', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);

    const { result } = renderHook(() => useMagicMinuteTrigger());
    const mistakePatterns = createMistakePatterns(4);

    // Trigger once at drill 6
    act(() => {
      result.current.checkTrigger(6, mistakePatterns);
    });
    expect(result.current.shouldTrigger).toBe(true);

    // Reset for new session
    act(() => {
      result.current.reset();
    });

    // Should be able to trigger again at drill 6
    act(() => {
      result.current.checkTrigger(6, mistakePatterns);
    });
    expect(result.current.shouldTrigger).toBe(true);
  });

  // Does not trigger when probability fails
  it('does not trigger when probability fails', () => {
    // Mock Math.random to return 0.5 (which is >= 0.3, so should not trigger)
    vi.spyOn(Math, 'random').mockReturnValue(0.5);

    const { result } = renderHook(() => useMagicMinuteTrigger());
    const mistakePatterns = createMistakePatterns(4);

    act(() => {
      result.current.checkTrigger(6, mistakePatterns);  // Use valid trigger point
    });

    expect(result.current.shouldTrigger).toBe(false);
  });

  // Triggers at different valid drill points
  it('can trigger at drill 6, 9, or 12', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const mistakePatterns = createMistakePatterns(4);

    // Test drill 6
    const { result: result6 } = renderHook(() => useMagicMinuteTrigger());
    act(() => {
      result6.current.checkTrigger(6, mistakePatterns);
    });
    expect(result6.current.shouldTrigger).toBe(true);

    // Test drill 9
    const { result: result9 } = renderHook(() => useMagicMinuteTrigger());
    act(() => {
      result9.current.checkTrigger(9, mistakePatterns);
    });
    expect(result9.current.shouldTrigger).toBe(true);

    // Test drill 12
    const { result: result12 } = renderHook(() => useMagicMinuteTrigger());
    act(() => {
      result12.current.checkTrigger(12, mistakePatterns);
    });
    expect(result12.current.shouldTrigger).toBe(true);
  });

  // Does not trigger at non-trigger points
  it('does not trigger at non-trigger drill points', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const mistakePatterns = createMistakePatterns(4);

    const { result } = renderHook(() => useMagicMinuteTrigger());

    // Test drill 7 (not a trigger point)
    act(() => {
      result.current.checkTrigger(7, mistakePatterns);
    });
    expect(result.current.shouldTrigger).toBe(false);

    // Test drill 10 (not a trigger point)
    act(() => {
      result.current.checkTrigger(10, mistakePatterns);
    });
    expect(result.current.shouldTrigger).toBe(false);
  });
});
