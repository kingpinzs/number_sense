// coachEngine unit tests - Story 6.1
// Tests all 7 triggers, priority selection, dismissal logic, edge cases

import { describe, it, expect } from 'vitest';
import { getContextualGuidance } from './coachEngine';
import type { CoachUserState } from '../types';

function makeState(overrides: Partial<CoachUserState> = {}): CoachUserState {
  return {
    hasAssessment: true,
    trainingSessionCount: 5,
    currentStreak: 3,
    previousStreak: 3,
    weeklySessionCount: 3,
    recentAccuracy: 70,
    weakestModule: 'number_line',
    dismissedTipIds: [],
    modulePerformance: null,
    errorPatterns: [],
    spacingQuality: null,
    confidenceAfter: null,
    shownRealWorldTipIds: [],
    ...overrides,
  };
}

describe('coachEngine - getContextualGuidance', () => {
  // --- Individual Trigger Tests ---

  describe('trigger: first-launch', () => {
    it('returns first-launch message when no assessment exists', () => {
      const result = getContextualGuidance(makeState({
        hasAssessment: false,
        trainingSessionCount: 0,
        currentStreak: 0,
        previousStreak: 0,
        weeklySessionCount: 0,
        recentAccuracy: null,
        weakestModule: null,
      }));

      expect(result).not.toBeNull();
      expect(result!.triggerId).toBe('first-launch');
      expect(result!.action?.route).toBe('/assessment');
    });
  });

  describe('trigger: after-assessment', () => {
    it('returns after-assessment message when assessment done but 0 training sessions', () => {
      const result = getContextualGuidance(makeState({
        hasAssessment: true,
        trainingSessionCount: 0,
        weeklySessionCount: 0,
        recentAccuracy: null,
        currentStreak: 0,
        previousStreak: 0,
      }));

      expect(result).not.toBeNull();
      expect(result!.triggerId).toBe('after-assessment');
    });

    it('interpolates weakest module name in after-assessment message', () => {
      const result = getContextualGuidance(makeState({
        hasAssessment: true,
        trainingSessionCount: 0,
        weeklySessionCount: 0,
        recentAccuracy: null,
        currentStreak: 0,
        previousStreak: 0,
        weakestModule: 'spatial_rotation',
      }));

      expect(result!.message).toContain('Spatial Rotation');
      expect(result!.message).not.toContain('[weak area]');
    });

    it('uses fallback text when weakestModule is null', () => {
      const result = getContextualGuidance(makeState({
        hasAssessment: true,
        trainingSessionCount: 0,
        weeklySessionCount: 0,
        recentAccuracy: null,
        currentStreak: 0,
        previousStreak: 0,
        weakestModule: null,
      }));

      expect(result!.message).toContain('your weakest area');
    });
  });

  describe('trigger: before-first-training', () => {
    it('returns before-first-training when after-assessment is dismissed', () => {
      const result = getContextualGuidance(makeState({
        hasAssessment: true,
        trainingSessionCount: 0,
        weeklySessionCount: 0,
        recentAccuracy: null,
        currentStreak: 0,
        previousStreak: 0,
        dismissedTipIds: ['after-assessment'],
      }));

      expect(result).not.toBeNull();
      expect(result!.triggerId).toBe('before-first-training');
    });
  });

  describe('trigger: after-3-sessions', () => {
    it('returns after-3-sessions message when 3+ sessions completed', () => {
      const result = getContextualGuidance(makeState({
        trainingSessionCount: 3,
        weeklySessionCount: 3,
        currentStreak: 3,
        previousStreak: 3,
        recentAccuracy: 70,
      }));

      expect(result).not.toBeNull();
      expect(result!.triggerId).toBe('after-3-sessions');
    });
  });

  describe('trigger: streak-broken', () => {
    it('returns streak-broken when current streak <=1 and previous >1', () => {
      const result = getContextualGuidance(makeState({
        currentStreak: 0,
        previousStreak: 5,
        trainingSessionCount: 5,
        weeklySessionCount: 0,
      }));

      expect(result).not.toBeNull();
      expect(result!.triggerId).toBe('streak-broken');
    });

    it('returns streak-broken when current streak is 1 and previous was >1', () => {
      const result = getContextualGuidance(makeState({
        currentStreak: 1,
        previousStreak: 3,
        trainingSessionCount: 3,
        weeklySessionCount: 1,
      }));

      expect(result).not.toBeNull();
      expect(result!.triggerId).toBe('streak-broken');
    });

    it('does NOT return streak-broken when previous streak was also <=1', () => {
      const result = getContextualGuidance(makeState({
        currentStreak: 1,
        previousStreak: 1,
        trainingSessionCount: 1,
        weeklySessionCount: 1,
        recentAccuracy: 50,
      }));

      expect(result?.triggerId).not.toBe('streak-broken');
    });
  });

  describe('trigger: high-accuracy', () => {
    it('returns high-accuracy when recent accuracy >85%', () => {
      const result = getContextualGuidance(makeState({
        recentAccuracy: 90,
        weeklySessionCount: 3,
        currentStreak: 3,
        previousStreak: 3,
      }));

      expect(result).not.toBeNull();
      // after-3-sessions has higher priority, so dismiss it first
      const result2 = getContextualGuidance(makeState({
        recentAccuracy: 90,
        weeklySessionCount: 3,
        currentStreak: 3,
        previousStreak: 3,
        dismissedTipIds: ['after-3-sessions'],
      }));
      expect(result2!.triggerId).toBe('high-accuracy');
    });

    it('does NOT return high-accuracy when accuracy is exactly 85%', () => {
      const result = getContextualGuidance(makeState({
        recentAccuracy: 85,
        trainingSessionCount: 1,
        weeklySessionCount: 3,
        currentStreak: 2,
        previousStreak: 2,
        dismissedTipIds: ['low-consistency'],
      }));

      // 85 is NOT >85
      expect(result?.triggerId).not.toBe('high-accuracy');
    });

    it('does NOT return high-accuracy when accuracy is null', () => {
      const result = getContextualGuidance(makeState({
        recentAccuracy: null,
        trainingSessionCount: 1,
        weeklySessionCount: 1,
      }));

      expect(result?.triggerId).not.toBe('high-accuracy');
    });
  });

  describe('trigger: low-consistency', () => {
    it('returns low-consistency when <2 sessions in last 7 days', () => {
      const result = getContextualGuidance(makeState({
        weeklySessionCount: 1,
        trainingSessionCount: 5,
        currentStreak: 1,
        previousStreak: 1,
        recentAccuracy: 70,
        dismissedTipIds: [],
      }));

      expect(result).not.toBeNull();
      expect(result!.triggerId).toBe('low-consistency');
    });

    it('does NOT return low-consistency when no training sessions exist', () => {
      const result = getContextualGuidance(makeState({
        weeklySessionCount: 0,
        trainingSessionCount: 0,
        currentStreak: 0,
        previousStreak: 0,
        recentAccuracy: null,
      }));

      // Should return after-assessment instead (has assessment, 0 training)
      expect(result?.triggerId).not.toBe('low-consistency');
    });
  });

  // --- Priority Selection Tests ---

  describe('priority selection', () => {
    it('returns highest priority when multiple triggers match', () => {
      // Streak broken (priority 2) + low consistency (3) + after 3 sessions (4)
      const result = getContextualGuidance(makeState({
        currentStreak: 0,
        previousStreak: 5,
        weeklySessionCount: 1,
        trainingSessionCount: 5,
        recentAccuracy: 90,
      }));

      expect(result!.triggerId).toBe('streak-broken');
    });

    it('first-launch beats all other triggers', () => {
      const result = getContextualGuidance(makeState({
        hasAssessment: false,
        trainingSessionCount: 0,
        currentStreak: 0,
        previousStreak: 5,
        weeklySessionCount: 0,
        recentAccuracy: null,
        weakestModule: null,
      }));

      expect(result!.triggerId).toBe('first-launch');
    });

    it('returns next priority when top priority is dismissed', () => {
      const result = getContextualGuidance(makeState({
        currentStreak: 0,
        previousStreak: 5,
        weeklySessionCount: 1,
        trainingSessionCount: 5,
        recentAccuracy: 90,
        dismissedTipIds: ['streak-broken'],
      }));

      expect(result!.triggerId).toBe('low-consistency');
    });
  });

  // --- Dismissal Logic Tests ---

  describe('dismissal logic', () => {
    it('does not return a dismissed tip', () => {
      const result = getContextualGuidance(makeState({
        trainingSessionCount: 3,
        weeklySessionCount: 3,
        currentStreak: 3,
        previousStreak: 3,
        recentAccuracy: 70,
        dismissedTipIds: ['after-3-sessions'],
      }));

      expect(result?.triggerId).not.toBe('after-3-sessions');
    });

    it('returns dismissed tip if dismissedTipIds is cleared (state change)', () => {
      const result = getContextualGuidance(makeState({
        trainingSessionCount: 3,
        weeklySessionCount: 3,
        currentStreak: 3,
        previousStreak: 3,
        recentAccuracy: 70,
        dismissedTipIds: [],
      }));

      expect(result!.triggerId).toBe('after-3-sessions');
    });

    it('returns null when all matching triggers are dismissed', () => {
      const result = getContextualGuidance(makeState({
        hasAssessment: true,
        trainingSessionCount: 3,
        weeklySessionCount: 3,
        currentStreak: 3,
        previousStreak: 3,
        recentAccuracy: 70,
        dismissedTipIds: ['after-3-sessions', 'real-world-tip'],
      }));

      // after-3-sessions + real-world-tip both dismissed → null
      expect(result).toBeNull();
    });

    it('skips multiple dismissed tips and returns first undismissed', () => {
      const result = getContextualGuidance(makeState({
        currentStreak: 0,
        previousStreak: 5,
        weeklySessionCount: 1,
        trainingSessionCount: 5,
        recentAccuracy: 90,
        dismissedTipIds: ['streak-broken', 'low-consistency'],
      }));

      expect(result!.triggerId).toBe('after-3-sessions');
    });
  });

  // --- Edge Case Tests ---

  describe('edge cases', () => {
    it('returns first-launch for completely empty state', () => {
      const result = getContextualGuidance(makeState({
        hasAssessment: false,
        trainingSessionCount: 0,
        currentStreak: 0,
        previousStreak: 0,
        weeklySessionCount: 0,
        recentAccuracy: null,
        weakestModule: null,
        dismissedTipIds: [],
      }));

      expect(result!.triggerId).toBe('first-launch');
    });

    it('returns null when no triggers match and all are dismissed', () => {
      // State where only after-3-sessions + real-world-tip match
      const result = getContextualGuidance(makeState({
        trainingSessionCount: 3,
        weeklySessionCount: 3,
        currentStreak: 3,
        previousStreak: 3,
        recentAccuracy: 70,
        dismissedTipIds: ['after-3-sessions', 'real-world-tip'],
      }));

      expect(result).toBeNull();
    });

    it('handles exactly 3 training sessions correctly', () => {
      const result = getContextualGuidance(makeState({
        trainingSessionCount: 3,
        weeklySessionCount: 3,
        currentStreak: 3,
        previousStreak: 3,
        recentAccuracy: 70,
        dismissedTipIds: [],
      }));

      expect(result!.triggerId).toBe('after-3-sessions');
    });

    it('handles exactly 85.01% accuracy as high accuracy', () => {
      const result = getContextualGuidance(makeState({
        recentAccuracy: 85.01,
        trainingSessionCount: 5,
        weeklySessionCount: 3,
        currentStreak: 3,
        previousStreak: 3,
        dismissedTipIds: ['after-3-sessions'],
      }));

      expect(result!.triggerId).toBe('high-accuracy');
    });
  });

  // --- Coaching Insight Integration Tests ---

  describe('coaching insights integration', () => {
    it('returns coaching insight when all motivational triggers dismissed', () => {
      const result = getContextualGuidance(makeState({
        dismissedTipIds: ['after-3-sessions'],
        modulePerformance: {
          number_line: { recentAccuracy: 45, drillCount: 5, trend: 'stable', avgResponseTime: 3000 },
        },
      }));

      expect(result).not.toBeNull();
      expect(result!.triggerId).toBe('weak-module-focus');
    });

    it('motivational triggers take priority over coaching insights', () => {
      const result = getContextualGuidance(makeState({
        modulePerformance: {
          number_line: { recentAccuracy: 45, drillCount: 5, trend: 'stable', avgResponseTime: 3000 },
        },
      }));

      // after-3-sessions (priority 4) beats weak-module-focus (priority 8)
      expect(result!.triggerId).toBe('after-3-sessions');
    });

    it('returns real-world-tip when all higher priorities dismissed', () => {
      const result = getContextualGuidance(makeState({
        dismissedTipIds: ['after-3-sessions'],
        modulePerformance: null,
        errorPatterns: [],
        spacingQuality: null,
        confidenceAfter: null,
      }));

      // Only real-world-tip should match (has assessment + 5 sessions)
      expect(result).not.toBeNull();
      expect(result!.triggerId).toBe('real-world-tip');
    });

    it('returns error-pattern insight with targeted advice', () => {
      const result = getContextualGuidance(makeState({
        dismissedTipIds: ['after-3-sessions'],
        errorPatterns: [{ module: 'number_line', mistakeType: 'overestimation', frequency: 0.5 }],
      }));

      expect(result).not.toBeNull();
      expect(result!.triggerId).toBe('error-pattern');
      expect(result!.message).toContain('place numbers too high');
    });

    it('includes detail field on coaching messages', () => {
      const result = getContextualGuidance(makeState({
        dismissedTipIds: ['after-3-sessions'],
        modulePerformance: {
          number_line: { recentAccuracy: 45, drillCount: 5, trend: 'stable', avgResponseTime: 3000 },
        },
      }));

      expect(result!.detail).toBeTruthy();
    });

    it('coaching insights can be dismissed', () => {
      const result = getContextualGuidance(makeState({
        dismissedTipIds: ['after-3-sessions', 'weak-module-focus'],
        modulePerformance: {
          number_line: { recentAccuracy: 45, drillCount: 5, trend: 'declining', avgResponseTime: 3000 },
        },
      }));

      // weak-module-focus dismissed, should get module-declining instead
      expect(result).not.toBeNull();
      expect(result!.triggerId).toBe('module-declining');
    });
  });
});
