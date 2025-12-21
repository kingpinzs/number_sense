/**
 * useMagicMinuteTrigger Hook
 * Story 4.2: Build Magic Minute Timer Component
 *
 * Custom hook that manages Magic Minute trigger logic.
 * Determines when to activate the 60-second micro-challenge sprint
 * based on drill count, mistake patterns, and probability.
 *
 * Trigger conditions:
 * - At least 6 drills completed
 * - At least 3 mistake patterns detected
 * - At trigger points (drill 6, 9, or 12)
 * - 30% probability at each trigger point
 * - Only triggers once per session
 */

import { useState, useCallback } from 'react';
import type { MistakePattern } from '@/services/adaptiveDifficulty/mistakeAnalyzer';
import { DEFAULT_TRIGGER_CONFIG } from '../types/magicMinute.types';

/**
 * Return type for useMagicMinuteTrigger hook
 */
export interface UseMagicMinuteTriggerResult {
  /** Whether Magic Minute should be triggered now */
  shouldTrigger: boolean;
  /** Mistake patterns that triggered the Magic Minute */
  mistakePatterns: MistakePattern[];
  /** Check if Magic Minute should trigger given current state */
  checkTrigger: (drillCount: number, patterns: MistakePattern[]) => boolean;
  /** Acknowledge the trigger (sets shouldTrigger to false but keeps hasTriggered) */
  acknowledge: () => void;
  /** Reset trigger state for new session */
  reset: () => void;
}

/**
 * useMagicMinuteTrigger - Hook for Magic Minute trigger logic
 *
 * @param config - Optional custom trigger configuration
 * @returns Trigger state and control functions
 */
export function useMagicMinuteTrigger(
  config = DEFAULT_TRIGGER_CONFIG
): UseMagicMinuteTriggerResult {
  // State
  const [shouldTrigger, setShouldTrigger] = useState(false);
  const [hasTriggered, setHasTriggered] = useState(false);
  const [mistakePatterns, setMistakePatterns] = useState<MistakePattern[]>([]);

  /**
   * Check if Magic Minute should trigger
   * Called after each drill completion
   */
  const checkTrigger = useCallback(
    (drillCount: number, patterns: MistakePattern[]): boolean => {
      // Already triggered this session - don't trigger again
      if (hasTriggered) {
        return false;
      }

      // Check minimum drill count
      if (drillCount < config.minDrillCount) {
        return false;
      }

      // Check minimum mistake count
      if (patterns.length < config.minMistakeCount) {
        return false;
      }

      // Check if at a trigger point
      if (!config.triggerPoints.includes(drillCount)) {
        return false;
      }

      // Roll probability
      const roll = Math.random();
      if (roll >= config.triggerProbability) {
        return false;
      }

      // All conditions met - trigger!
      setShouldTrigger(true);
      setHasTriggered(true);
      setMistakePatterns(patterns);

      return true;
    },
    [hasTriggered, config]
  );

  /**
   * Acknowledge trigger - used after Magic Minute starts
   * Sets shouldTrigger to false but keeps hasTriggered true
   */
  const acknowledge = useCallback(() => {
    setShouldTrigger(false);
  }, []);

  /**
   * Reset trigger state for new session
   * Allows Magic Minute to trigger again
   */
  const reset = useCallback(() => {
    setShouldTrigger(false);
    setHasTriggered(false);
    setMistakePatterns([]);
  }, []);

  return {
    shouldTrigger,
    mistakePatterns,
    checkTrigger,
    acknowledge,
    reset,
  };
}
