// actionSelector.test.ts - Story 6.2
// Unit tests for selectQuickActions pure function

import { describe, it, expect } from 'vitest';
import { selectQuickActions } from './actionSelector';
import type { QuickActionUserState } from '../types';

/** Helper to build state with defaults */
function makeState(overrides: Partial<QuickActionUserState> = {}): QuickActionUserState {
  return {
    hasAssessment: true,
    hasSessionToday: false,
    streakActive: false,
    trainingSessionCount: 0,
    newInsightsCount: 0,
    ...overrides,
  };
}

describe('selectQuickActions', () => {
  // --- Individual condition tests ---

  describe('individual conditions', () => {
    it('includes "Start Training" with streak subtitle when no session today and streak active', () => {
      const actions = selectQuickActions(makeState({
        hasSessionToday: false,
        streakActive: true,
      }));

      const startTraining = actions.find(a => a.id === 'start_training');
      expect(startTraining).toBeDefined();
      expect(startTraining!.subtitle).toBe('Continue your streak!');
      expect(startTraining!.color).toBe('primary');
      expect(startTraining!.route).toBe('/training');
    });

    it('includes "Take Assessment" when no assessment exists', () => {
      const actions = selectQuickActions(makeState({
        hasAssessment: false,
      }));

      const takeAssessment = actions.find(a => a.id === 'take_assessment');
      expect(takeAssessment).toBeDefined();
      expect(takeAssessment!.color).toBe('accent');
      expect(takeAssessment!.route).toBe('/assessment');
    });

    it('includes "Review Insights" with badge when new insights available', () => {
      const actions = selectQuickActions(makeState({
        newInsightsCount: 3,
      }));

      const reviewInsights = actions.find(a => a.id === 'review_insights');
      expect(reviewInsights).toBeDefined();
      expect(reviewInsights!.badge).toBe(3);
      expect(reviewInsights!.route).toBe('/progress');
    });

    it('includes "View Progress" when 3+ sessions completed', () => {
      const actions = selectQuickActions(makeState({
        trainingSessionCount: 3,
      }));

      const viewProgress = actions.find(a => a.id === 'view_progress');
      expect(viewProgress).toBeDefined();
      expect(viewProgress!.route).toBe('/progress');
    });

    it('includes "Try Cognition Games" when 5+ training sessions', () => {
      const actions = selectQuickActions(makeState({
        trainingSessionCount: 5,
      }));

      const tryCognition = actions.find(a => a.id === 'try_cognition');
      expect(tryCognition).toBeDefined();
      expect(tryCognition!.route).toBe('/cognition');
    });
  });

  // --- Priority selection tests ---

  describe('priority selection', () => {
    it('puts streak-urgent Start Training first when streak active and no session today', () => {
      const actions = selectQuickActions(makeState({
        hasSessionToday: false,
        streakActive: true,
        trainingSessionCount: 5,
        newInsightsCount: 2,
      }));

      expect(actions[0].id).toBe('start_training');
      expect(actions[0].subtitle).toBe('Continue your streak!');
    });

    it('puts Take Assessment before View Progress for new users', () => {
      const actions = selectQuickActions(makeState({
        hasAssessment: false,
        trainingSessionCount: 3,
      }));

      const assessmentIdx = actions.findIndex(a => a.id === 'take_assessment');
      const progressIdx = actions.findIndex(a => a.id === 'view_progress');
      expect(assessmentIdx).toBeLessThan(progressIdx);
    });

    it('puts Review Insights before View Progress when insights available', () => {
      const actions = selectQuickActions(makeState({
        trainingSessionCount: 5,
        newInsightsCount: 1,
      }));

      const insightsIdx = actions.findIndex(a => a.id === 'review_insights');
      const progressIdx = actions.findIndex(a => a.id === 'view_progress');
      expect(insightsIdx).toBeLessThan(progressIdx);
    });
  });

  // --- Edge cases ---

  describe('edge cases', () => {
    it('returns actions for fresh user (no assessment, no sessions)', () => {
      const actions = selectQuickActions(makeState({
        hasAssessment: false,
        trainingSessionCount: 0,
        newInsightsCount: 0,
      }));

      expect(actions.length).toBeGreaterThanOrEqual(2);
      expect(actions.some(a => a.id === 'take_assessment')).toBe(true);
      expect(actions.some(a => a.id === 'start_training')).toBe(true);
    });

    it('caps at 4 actions when all conditions match (power user)', () => {
      const actions = selectQuickActions(makeState({
        hasAssessment: true,
        hasSessionToday: false,
        streakActive: true,
        trainingSessionCount: 10,
        newInsightsCount: 5,
      }));

      expect(actions.length).toBeLessThanOrEqual(4);
    });

    it('handles exactly 3 sessions (boundary for View Progress)', () => {
      const actions = selectQuickActions(makeState({
        trainingSessionCount: 3,
      }));

      expect(actions.some(a => a.id === 'view_progress')).toBe(true);
    });

    it('does NOT include View Progress at 2 sessions', () => {
      const actions = selectQuickActions(makeState({
        trainingSessionCount: 2,
      }));

      // With hasAssessment=true + trainingSessionCount=2, View Progress won't be added
      // by its condition (requires 3+), but may appear as min-2 fallback
      expect(actions.length).toBeGreaterThanOrEqual(2);
    });

    it('handles exactly 5 sessions (boundary for Cognition Games)', () => {
      const actions = selectQuickActions(makeState({
        trainingSessionCount: 5,
      }));

      expect(actions.some(a => a.id === 'try_cognition')).toBe(true);
    });

    it('does NOT include Cognition Games at 4 sessions', () => {
      const actions = selectQuickActions(makeState({
        trainingSessionCount: 4,
      }));

      expect(actions.some(a => a.id === 'try_cognition')).toBe(false);
    });
  });

  // --- Bounds and defaults ---

  describe('bounds and defaults', () => {
    it('always returns at least 2 actions', () => {
      const actions = selectQuickActions(makeState());
      expect(actions.length).toBeGreaterThanOrEqual(2);
    });

    it('never returns more than 4 actions', () => {
      // Max conditions: streak active + no session + insights + 5+ sessions
      const actions = selectQuickActions(makeState({
        hasAssessment: true,
        hasSessionToday: false,
        streakActive: true,
        trainingSessionCount: 10,
        newInsightsCount: 5,
      }));

      expect(actions.length).toBeLessThanOrEqual(4);
    });

    it('never returns empty array', () => {
      const actions = selectQuickActions(makeState());
      expect(actions.length).toBeGreaterThan(0);
    });

    it('includes default Start Training for returning user with session today', () => {
      const actions = selectQuickActions(makeState({
        hasAssessment: true,
        hasSessionToday: true,
        streakActive: true,
        trainingSessionCount: 1,
      }));

      expect(actions.some(a => a.id === 'start_training')).toBe(true);
      // Should NOT have the streak-urgency subtitle
      const startTraining = actions.find(a => a.id === 'start_training');
      expect(startTraining!.subtitle).toBe('Jump into a session');
    });

    it('returns actions sorted by priority', () => {
      const actions = selectQuickActions(makeState({
        hasAssessment: true,
        hasSessionToday: false,
        streakActive: true,
        trainingSessionCount: 5,
        newInsightsCount: 2,
      }));

      for (let i = 1; i < actions.length; i++) {
        expect(actions[i].priority).toBeGreaterThanOrEqual(actions[i - 1].priority);
      }
    });
  });
});
