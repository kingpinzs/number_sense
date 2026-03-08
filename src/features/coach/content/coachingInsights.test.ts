// Coaching Insights Template Tests
// Validates each insight's evaluate + build functions with mock state data

import { describe, it, expect } from 'vitest';
import { COACHING_INSIGHTS } from './coachingInsights';
import { REAL_WORLD_TIPS } from './realWorldTips';
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

describe('COACHING_INSIGHTS structure', () => {
  it('has 10 insights', () => {
    expect(COACHING_INSIGHTS.length).toBe(10);
  });

  it('all insights have unique IDs', () => {
    const ids = COACHING_INSIGHTS.map(i => i.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('all insights have unique triggerIds', () => {
    const triggerIds = COACHING_INSIGHTS.map(i => i.triggerId);
    expect(new Set(triggerIds).size).toBe(triggerIds.length);
  });

  it('all priorities are between 8 and 17', () => {
    for (const insight of COACHING_INSIGHTS) {
      expect(insight.priority).toBeGreaterThanOrEqual(8);
      expect(insight.priority).toBeLessThanOrEqual(17);
    }
  });

  it('priorities are unique', () => {
    const priorities = COACHING_INSIGHTS.map(i => i.priority);
    expect(new Set(priorities).size).toBe(priorities.length);
  });
});

describe('weak-module-focus insight', () => {
  const insight = COACHING_INSIGHTS.find(i => i.triggerId === 'weak-module-focus')!;

  it('evaluates true when a module has <60% accuracy with 3+ drills', () => {
    const state = makeState({
      modulePerformance: {
        number_line: { recentAccuracy: 45, drillCount: 5, trend: 'stable', avgResponseTime: 3000 },
      },
    });
    expect(insight.evaluate(state)).toBe(true);
  });

  it('evaluates false when all modules >=60%', () => {
    const state = makeState({
      modulePerformance: {
        number_line: { recentAccuracy: 70, drillCount: 5, trend: 'stable', avgResponseTime: 3000 },
      },
    });
    expect(insight.evaluate(state)).toBe(false);
  });

  it('evaluates false when module has <3 drills', () => {
    const state = makeState({
      modulePerformance: {
        number_line: { recentAccuracy: 40, drillCount: 2, trend: null, avgResponseTime: 3000 },
      },
    });
    expect(insight.evaluate(state)).toBe(false);
  });

  it('builds message with module name and accuracy', () => {
    const state = makeState({
      modulePerformance: {
        number_line: { recentAccuracy: 45, drillCount: 5, trend: 'stable', avgResponseTime: 3000 },
      },
    });
    const msg = insight.build(state);
    expect(msg.message).toContain('Number Line');
    expect(msg.message).toContain('45%');
    expect(msg.detail).toBeTruthy();
  });
});

describe('module-improving insight', () => {
  const insight = COACHING_INSIGHTS.find(i => i.triggerId === 'module-improving')!;

  it('evaluates true when a module trend is improving with 5+ drills', () => {
    const state = makeState({
      modulePerformance: {
        spatial_rotation: { recentAccuracy: 75, drillCount: 8, trend: 'improving', avgResponseTime: 4000 },
      },
    });
    expect(insight.evaluate(state)).toBe(true);
  });

  it('evaluates false when trend is stable', () => {
    const state = makeState({
      modulePerformance: {
        spatial_rotation: { recentAccuracy: 75, drillCount: 8, trend: 'stable', avgResponseTime: 4000 },
      },
    });
    expect(insight.evaluate(state)).toBe(false);
  });

  it('builds message with module name', () => {
    const state = makeState({
      modulePerformance: {
        spatial_rotation: { recentAccuracy: 75, drillCount: 8, trend: 'improving', avgResponseTime: 4000 },
      },
    });
    const msg = insight.build(state);
    expect(msg.title).toContain('Spatial Rotation');
  });
});

describe('module-declining insight', () => {
  const insight = COACHING_INSIGHTS.find(i => i.triggerId === 'module-declining')!;

  it('evaluates true when a module trend is declining with 5+ drills', () => {
    const state = makeState({
      modulePerformance: {
        math_operations: { recentAccuracy: 50, drillCount: 6, trend: 'declining', avgResponseTime: 5000 },
      },
    });
    expect(insight.evaluate(state)).toBe(true);
  });

  it('builds supportive message', () => {
    const state = makeState({
      modulePerformance: {
        math_operations: { recentAccuracy: 50, drillCount: 6, trend: 'declining', avgResponseTime: 5000 },
      },
    });
    const msg = insight.build(state);
    expect(msg.message).toContain('Math Operations');
    expect(msg.message).toContain('dipped');
  });
});

describe('error-pattern insight', () => {
  const insight = COACHING_INSIGHTS.find(i => i.triggerId === 'error-pattern')!;

  it('evaluates true when error pattern frequency >= 30%', () => {
    const state = makeState({
      errorPatterns: [{ module: 'number_line', mistakeType: 'overestimation', frequency: 0.4 }],
    });
    expect(insight.evaluate(state)).toBe(true);
  });

  it('evaluates false when frequency < 30%', () => {
    const state = makeState({
      errorPatterns: [{ module: 'number_line', mistakeType: 'overestimation', frequency: 0.2 }],
    });
    expect(insight.evaluate(state)).toBe(false);
  });

  it('evaluates false when no error patterns', () => {
    expect(insight.evaluate(makeState())).toBe(false);
  });

  it('builds message with mistake description and advice', () => {
    const state = makeState({
      errorPatterns: [{ module: 'number_line', mistakeType: 'overestimation', frequency: 0.4 }],
    });
    const msg = insight.build(state);
    expect(msg.message).toContain('place numbers too high');
    expect(msg.message).toContain('anchoring');
    expect(msg.detail).toContain('40%');
  });
});

describe('confidence-gap insight', () => {
  const insight = COACHING_INSIGHTS.find(i => i.triggerId === 'confidence-gap')!;

  it('evaluates true when accuracy >=70 but confidence <3', () => {
    const state = makeState({ recentAccuracy: 78, confidenceAfter: 2 });
    expect(insight.evaluate(state)).toBe(true);
  });

  it('evaluates false when confidence >=3', () => {
    const state = makeState({ recentAccuracy: 78, confidenceAfter: 4 });
    expect(insight.evaluate(state)).toBe(false);
  });

  it('builds message with actual accuracy', () => {
    const state = makeState({ recentAccuracy: 78, confidenceAfter: 2 });
    const msg = insight.build(state);
    expect(msg.message).toContain('78%');
  });
});

describe('spacing-advice insight', () => {
  const insight = COACHING_INSIGHTS.find(i => i.triggerId === 'spacing-advice')!;

  it('evaluates true when spacing is clustered', () => {
    expect(insight.evaluate(makeState({ spacingQuality: 'clustered' }))).toBe(true);
  });

  it('evaluates false when spacing is excellent', () => {
    expect(insight.evaluate(makeState({ spacingQuality: 'excellent' }))).toBe(false);
  });

  it('evaluates false when spacing is null', () => {
    expect(insight.evaluate(makeState({ spacingQuality: null }))).toBe(false);
  });
});

describe('difficulty-ready insight', () => {
  const insight = COACHING_INSIGHTS.find(i => i.triggerId === 'difficulty-ready')!;

  it('evaluates true when module accuracy >=85% with 5+ drills', () => {
    const state = makeState({
      modulePerformance: {
        number_line: { recentAccuracy: 90, drillCount: 10, trend: 'stable', avgResponseTime: 3000 },
      },
    });
    expect(insight.evaluate(state)).toBe(true);
  });

  it('evaluates false when no modules >=85%', () => {
    const state = makeState({
      modulePerformance: {
        number_line: { recentAccuracy: 80, drillCount: 10, trend: 'stable', avgResponseTime: 3000 },
      },
    });
    expect(insight.evaluate(state)).toBe(false);
  });
});

describe('automaticity insight', () => {
  const insight = COACHING_INSIGHTS.find(i => i.triggerId === 'automaticity')!;

  it('evaluates true when high accuracy + fast response + enough drills', () => {
    const state = makeState({
      modulePerformance: {
        number_line: { recentAccuracy: 85, drillCount: 8, trend: 'stable', avgResponseTime: 3000 },
      },
    });
    expect(insight.evaluate(state)).toBe(true);
  });

  it('evaluates false when accuracy too low', () => {
    const state = makeState({
      modulePerformance: {
        number_line: { recentAccuracy: 50, drillCount: 8, trend: 'stable', avgResponseTime: 3000 },
      },
    });
    expect(insight.evaluate(state)).toBe(false);
  });

  it('builds message with speed and accuracy', () => {
    const state = makeState({
      modulePerformance: {
        number_line: { recentAccuracy: 85, drillCount: 8, trend: 'stable', avgResponseTime: 3200 },
      },
    });
    const msg = insight.build(state);
    expect(msg.message).toContain('3.2s');
    expect(msg.message).toContain('85%');
  });
});

describe('slow-and-accurate insight', () => {
  const insight = COACHING_INSIGHTS.find(i => i.triggerId === 'slow-and-accurate')!;

  it('evaluates true when high accuracy + slow response', () => {
    const state = makeState({
      modulePerformance: {
        spatial_rotation: { recentAccuracy: 80, drillCount: 5, trend: 'stable', avgResponseTime: 9000 },
      },
    });
    expect(insight.evaluate(state)).toBe(true);
  });

  it('evaluates false when response time is fast', () => {
    const state = makeState({
      modulePerformance: {
        spatial_rotation: { recentAccuracy: 80, drillCount: 5, trend: 'stable', avgResponseTime: 3000 },
      },
    });
    expect(insight.evaluate(state)).toBe(false);
  });
});

describe('real-world-tip insight', () => {
  const insight = COACHING_INSIGHTS.find(i => i.triggerId === 'real-world-tip')!;

  it('evaluates true when has assessment and at least 1 session', () => {
    expect(insight.evaluate(makeState())).toBe(true);
  });

  it('evaluates false for first-time users', () => {
    expect(insight.evaluate(makeState({ hasAssessment: false, trainingSessionCount: 0 }))).toBe(false);
  });

  it('builds message with real-world activity', () => {
    const state = makeState({ weakestModule: 'spatial_rotation' });
    const msg = insight.build(state);
    expect(msg.title).toContain('Try This');
    expect(msg.icon).toBe('🌍');
    expect(msg.detail).toBeTruthy();
  });

  it('builds fallback when all tips shown', () => {
    const allIds = REAL_WORLD_TIPS.map(t => t.id);
    const state = makeState({ shownRealWorldTipIds: allIds });
    const msg = insight.build(state);
    expect(msg.id).toBe('coaching-real-world-tip-done');
  });
});
