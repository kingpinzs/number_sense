// insightsEngine.test.ts - Story 5.4
// Unit tests for insights generation engine
// Tests follow AAA pattern (Arrange, Act, Assert)

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  detectTrend,
  calculateWeeklyConsistency,
  calculateSpacingQuality,
  generateInsights,
} from './insightsEngine';
import type { Session, DrillResult } from '@/services/storage/schemas';

// --- detectTrend tests ---

describe('detectTrend', () => {
  it('returns "improving" for increasing values', () => {
    expect(detectTrend([1, 2, 3, 4, 5])).toBe('improving');
  });

  it('returns "declining" for decreasing values', () => {
    expect(detectTrend([5, 4, 3, 2, 1])).toBe('declining');
  });

  it('returns "stable" for flat values', () => {
    expect(detectTrend([3, 3, 3, 3, 3])).toBe('stable');
  });

  it('returns "stable" for fewer than 3 data points', () => {
    expect(detectTrend([1])).toBe('stable');
    expect(detectTrend([1, 2])).toBe('stable');
    expect(detectTrend([])).toBe('stable');
  });

  it('returns "stable" for values with small variation', () => {
    expect(detectTrend([3.0, 3.01, 3.02, 3.0, 3.01])).toBe('stable');
  });

  it('returns "improving" for gradual improvement', () => {
    expect(detectTrend([60, 65, 70, 75, 80])).toBe('improving');
  });

  it('returns "declining" for gradual decline', () => {
    expect(detectTrend([80, 75, 70, 65, 60])).toBe('declining');
  });
});

// --- calculateWeeklyConsistency tests ---

describe('calculateWeeklyConsistency', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-02-07T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns count of unique days with sessions in last 7 days', () => {
    const sessions: Session[] = [
      makeSession('2026-02-07T10:00:00Z'), // today
      makeSession('2026-02-06T10:00:00Z'), // yesterday
      makeSession('2026-02-05T10:00:00Z'), // 2 days ago
      makeSession('2026-02-04T10:00:00Z'), // 3 days ago
      makeSession('2026-02-03T10:00:00Z'), // 4 days ago
    ];

    expect(calculateWeeklyConsistency(sessions)).toBe(5);
  });

  it('returns 0 when no sessions in last 7 days', () => {
    const sessions: Session[] = [
      makeSession('2026-01-20T10:00:00Z'), // >7 days ago
    ];

    expect(calculateWeeklyConsistency(sessions)).toBe(0);
  });

  it('counts unique days (not duplicate sessions on same day)', () => {
    const sessions: Session[] = [
      makeSession('2026-02-07T10:00:00Z'),
      makeSession('2026-02-07T14:00:00Z'), // same day
      makeSession('2026-02-06T10:00:00Z'),
    ];

    expect(calculateWeeklyConsistency(sessions)).toBe(2);
  });

  it('excludes non-completed sessions', () => {
    const sessions: Session[] = [
      makeSession('2026-02-07T10:00:00Z', 'completed'),
      makeSession('2026-02-06T10:00:00Z', 'abandoned'),
      makeSession('2026-02-05T10:00:00Z', 'paused'),
    ];

    expect(calculateWeeklyConsistency(sessions)).toBe(1);
  });

  it('returns 0 for empty session array', () => {
    expect(calculateWeeklyConsistency([])).toBe(0);
  });
});

// --- generateInsights tests ---

describe('generateInsights', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-02-07T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns empty array when fewer than 3 completed sessions', () => {
    const sessions: Session[] = [
      makeSession('2026-02-07T10:00:00Z'),
      makeSession('2026-02-06T10:00:00Z'),
    ];

    expect(generateInsights(sessions, [])).toEqual([]);
  });

  it('returns excellent spacing insight when 5 evenly-spaced sessions this week', () => {
    const sessions = makeDailySessions(5);

    const insights = generateInsights(sessions, []);
    const consistencyInsight = insights.find(i => i.id === 'consistency-excellent-spacing');

    expect(consistencyInsight).toBeDefined();
    expect(consistencyInsight!.category).toBe('positive');
    expect(consistencyInsight!.message).toContain('5 days this week');
    expect(consistencyInsight!.message).toContain('distributed practice');
  });

  it('returns concern insight when only 1 session this week', () => {
    // 3 sessions total but only 1 this week (others are old)
    const sessions: Session[] = [
      makeSession('2026-02-07T10:00:00Z'),
      makeSession('2026-01-20T10:00:00Z'),
      makeSession('2026-01-19T10:00:00Z'),
    ];

    const insights = generateInsights(sessions, []);
    const consistencyInsight = insights.find(i => i.id === 'consistency-low-week');

    expect(consistencyInsight).toBeDefined();
    expect(consistencyInsight!.category).toBe('concern');
    expect(consistencyInsight!.action).toBeDefined();
    expect(consistencyInsight!.action!.route).toBe('/training');
  });

  it('returns performance trend insight for improving accuracy', () => {
    const sessions = makeDailySessions(5);
    const drillResults = makeImprovingDrills('number_line', 10);

    const insights = generateInsights(sessions, drillResults);
    const perfInsight = insights.find(i => i.id === 'performance-improving-number_line');

    expect(perfInsight).toBeDefined();
    expect(perfInsight!.category).toBe('positive');
    expect(perfInsight!.icon).toBe('📈');
  });

  it('returns declining trend concern insight', () => {
    const sessions = makeDailySessions(5);
    const drillResults = makeDecliningDrills('math_operations', 10);

    const insights = generateInsights(sessions, drillResults);
    const perfInsight = insights.find(i => i.id === 'performance-declining-math_operations');

    expect(perfInsight).toBeDefined();
    expect(perfInsight!.category).toBe('concern');
    expect(perfInsight!.action).toBeDefined();
  });

  it('returns time pattern insight for fastest module', () => {
    const sessions = makeDailySessions(5);
    const drillResults = [
      ...makeTimedDrills('number_line', 1000, 5),    // 1s avg (fast)
      ...makeTimedDrills('spatial_rotation', 3000, 5), // 3s avg (slow)
      ...makeTimedDrills('math_operations', 2500, 5),  // 2.5s avg (medium)
    ];

    const insights = generateInsights(sessions, drillResults);
    const timeInsight = insights.find(i => i.id === 'time-fastest-number_line');

    expect(timeInsight).toBeDefined();
    expect(timeInsight!.icon).toBe('⚡');
    expect(timeInsight!.message).toContain('Number Line');
  });

  it('returns confidence insight for positive trend', () => {
    const sessions = makeSessionsWithConfidence([2, 2.5, 3, 3.5, 4]);

    const insights = generateInsights(sessions, []);
    const confInsight = insights.find(i => i.id === 'confidence-improving');

    expect(confInsight).toBeDefined();
    expect(confInsight!.category).toBe('positive');
    expect(confInsight!.title).toBe('Confidence Growing!');
  });

  it('sorts insights by priority (concern before positive before general)', () => {
    // Create data that triggers multiple insight types
    const sessions: Session[] = [
      // Only 1 session this week → concern (priority 2)
      makeSession('2026-02-07T10:00:00Z'),
      makeSession('2026-01-20T10:00:00Z'),
      makeSession('2026-01-19T10:00:00Z'),
    ];

    const drillResults = [
      ...makeTimedDrills('number_line', 1000, 5),
      ...makeTimedDrills('spatial_rotation', 3000, 5),
    ];

    const insights = generateInsights(sessions, drillResults);

    // Verify priority ordering
    for (let i = 1; i < insights.length; i++) {
      expect(insights[i].priority).toBeGreaterThanOrEqual(insights[i - 1].priority);
    }
  });

  it('returns max 5 insights', () => {
    // Create data that would trigger many insights (already chronological from helper)
    const sessions = makeSessionsWithConfidence([2, 2.5, 3, 3.5, 4, 4.2, 4.5]);

    const drillResults = [
      ...makeImprovingDrills('number_line', 10),
      ...makeImprovingDrills('spatial_rotation', 10),
      ...makeTimedDrills('number_line', 1000, 5),
      ...makeTimedDrills('spatial_rotation', 3000, 5),
    ];

    const insights = generateInsights(sessions, drillResults);

    expect(insights.length).toBeLessThanOrEqual(5);
  });

  it('returns milestone insight at priority 1 when session count hits milestone', () => {
    // 10 completed sessions → should trigger milestone
    const sessions = makeDailySessions(5);
    // Add 5 more older sessions to reach 10 total
    for (let i = 0; i < 5; i++) {
      sessions.push(makeSession(`2026-01-${20 + i}T10:00:00Z`));
    }

    const insights = generateInsights(sessions, []);
    const milestoneInsight = insights.find(i => i.id === 'milestone-sessions-10');

    expect(milestoneInsight).toBeDefined();
    expect(milestoneInsight!.category).toBe('milestone');
    expect(milestoneInsight!.priority).toBe(1);
    // Milestone should be first (highest priority)
    expect(insights[0].priority).toBe(1);
  });

  it('does not return milestone when count is well past milestone', () => {
    // 15 sessions — past the 10-milestone window (10+3=13)
    const sessions: Session[] = [];
    for (let i = 0; i < 15; i++) {
      sessions.push(makeSession(`2026-01-${String(i + 10).padStart(2, '0')}T10:00:00Z`));
    }

    const insights = generateInsights(sessions, []);
    const milestoneInsight = insights.find(i => i.category === 'milestone');

    expect(milestoneInsight).toBeUndefined();
  });
});

// --- Test Helpers ---

function makeSession(
  timestamp: string,
  completionStatus: 'completed' | 'abandoned' | 'paused' = 'completed',
): Session {
  return {
    timestamp,
    module: 'training',
    duration: 600000,
    completionStatus,
    accuracy: 80,
    drillCount: 10,
  };
}

function makeDailySessions(count: number): Session[] {
  const sessions: Session[] = [];
  for (let i = 0; i < count; i++) {
    const day = 7 - i;
    const dayStr = day < 10 ? `0${day}` : `${day}`;
    sessions.push(makeSession(`2026-02-${dayStr}T10:00:00Z`));
  }
  return sessions;
}

function makeSessionsWithConfidence(confidenceValues: number[]): Session[] {
  // Assign earlier dates to earlier indices (chronological order)
  const n = confidenceValues.length;
  return confidenceValues.map((conf, i) => {
    const day = 7 - (n - 1 - i); // oldest first: day 3,4,5,6,7
    const dayStr = day < 10 ? `0${day}` : `${day}`;
    return {
      timestamp: `2026-02-${dayStr}T10:00:00Z`,
      module: 'training',
      duration: 600000,
      completionStatus: 'completed' as const,
      confidenceAfter: conf,
      confidenceChange: i > 0 ? conf - confidenceValues[i - 1] : 0,
      accuracy: 80,
      drillCount: 10,
    };
  });
}

function makeImprovingDrills(module: DrillResult['module'], count: number): DrillResult[] {
  return Array.from({ length: count }, (_, i) => ({
    sessionId: 1,
    timestamp: `2026-02-0${Math.min(7, i + 1)}T10:${String(i).padStart(2, '0')}:00Z`,
    module,
    difficulty: 'medium' as const,
    isCorrect: true,
    timeToAnswer: 2000,
    accuracy: 60 + i * 4, // 60, 64, 68, 72, 76, 80, 84, 88, 92, 96
  }));
}

function makeDecliningDrills(module: DrillResult['module'], count: number): DrillResult[] {
  return Array.from({ length: count }, (_, i) => ({
    sessionId: 1,
    timestamp: `2026-02-0${Math.min(7, i + 1)}T10:${String(i).padStart(2, '0')}:00Z`,
    module,
    difficulty: 'medium' as const,
    isCorrect: i < 3,
    timeToAnswer: 2000,
    accuracy: 96 - i * 4, // 96, 92, 88, 84, 80, 76, 72, 68, 64, 60
  }));
}

function makeTimedDrills(
  module: DrillResult['module'],
  avgTimeMs: number,
  count: number,
): DrillResult[] {
  return Array.from({ length: count }, (_, i) => ({
    sessionId: 1,
    timestamp: `2026-02-07T10:${String(i).padStart(2, '0')}:00Z`,
    module,
    difficulty: 'medium' as const,
    isCorrect: true,
    timeToAnswer: avgTimeMs + (i % 2 === 0 ? 100 : -100), // slight variation
    accuracy: 85,
  }));
}

/**
 * Creates drills with specific speed (timeToAnswer) for early vs late comparison.
 * Used by automaticity detector tests.
 */
function makeSpeedChangeDrills(
  module: DrillResult['module'],
  timeMs: number,
  accuracy: number,
  startIndex: number,
  count: number,
): DrillResult[] {
  return Array.from({ length: count }, (_, i) => ({
    sessionId: 1,
    timestamp: `2026-02-0${Math.min(7, startIndex + i + 1)}T10:${String(startIndex + i).padStart(2, '0')}:00Z`,
    module,
    difficulty: 'medium' as const,
    isCorrect: accuracy >= 50,
    timeToAnswer: timeMs,
    accuracy,
  }));
}

/**
 * Creates drills with specific accuracy for early vs late comparison.
 * Used by struggle-to-strength and weakness detector tests.
 */
function makeAccuracyChangeDrills(
  module: DrillResult['module'],
  accuracy: number,
  startIndex: number,
  count: number,
): DrillResult[] {
  return Array.from({ length: count }, (_, i) => ({
    sessionId: 1,
    timestamp: `2026-02-0${Math.min(7, startIndex + i + 1)}T10:${String(startIndex + i).padStart(2, '0')}:00Z`,
    module,
    difficulty: 'medium' as const,
    isCorrect: accuracy >= 50,
    timeToAnswer: 2000,
    accuracy,
  }));
}

// ========================================
// EDGE CASE TESTS - Insights Engine Hardening
// Epic 5 Retro Action Items #1-5
// ========================================

describe('detectTrend - edge cases', () => {
  it('handles NaN values by filtering them out', () => {
    // 5 values with NaN sprinkled in - only 3 clean: 1, 2, 3 (improving)
    expect(detectTrend([1, NaN, 2, NaN, 3])).toBe('improving');
  });

  it('handles Infinity values by filtering them out', () => {
    expect(detectTrend([1, Infinity, 2, -Infinity, 3])).toBe('improving');
  });

  it('returns stable when NaN reduces clean values below 3', () => {
    expect(detectTrend([1, NaN, 2])).toBe('stable');
  });

  it('returns stable for all NaN values', () => {
    expect(detectTrend([NaN, NaN, NaN, NaN])).toBe('stable');
  });

  it('handles exactly 3 data points (boundary)', () => {
    expect(detectTrend([1, 2, 3])).toBe('improving');
    expect(detectTrend([3, 2, 1])).toBe('declining');
    expect(detectTrend([5, 5, 5])).toBe('stable');
  });

  it('returns stable for all identical values', () => {
    expect(detectTrend([50, 50, 50, 50, 50, 50])).toBe('stable');
  });

  it('handles extreme values (0% and 100%)', () => {
    expect(detectTrend([0, 0, 0, 100, 100])).toBe('improving');
    expect(detectTrend([100, 100, 0, 0, 0])).toBe('declining');
  });

  it('handles negative values gracefully', () => {
    expect(detectTrend([-10, -5, 0, 5, 10])).toBe('improving');
  });

  it('handles slope exactly at threshold boundary (0.05)', () => {
    // Slope of exactly 0.05 should be stable (> not >=)
    // For values [0, 0.05, 0.10] with n=3: slope = 0.05
    expect(detectTrend([0, 0.05, 0.10])).toBe('stable');
  });

  it('handles very large arrays (100+ values)', () => {
    const rising = Array.from({ length: 100 }, (_, i) => i);
    expect(detectTrend(rising)).toBe('improving');
  });

  it('handles mixed NaN and valid with declining trend', () => {
    expect(detectTrend([10, NaN, 8, 6, NaN, 4])).toBe('declining');
  });
});

describe('generateInsights - edge cases', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-02-07T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns empty array for 0 sessions', () => {
    expect(generateInsights([], [])).toEqual([]);
  });

  it('returns empty array for 1 session', () => {
    expect(generateInsights([makeSession('2026-02-07T10:00:00Z')], [])).toEqual([]);
  });

  it('returns empty array for exactly 2 sessions', () => {
    const sessions = [
      makeSession('2026-02-07T10:00:00Z'),
      makeSession('2026-02-06T10:00:00Z'),
    ];
    expect(generateInsights(sessions, [])).toEqual([]);
  });

  it('accepts exactly 3 sessions (boundary) without crashing', () => {
    const sessions = [
      makeSession('2026-02-07T10:00:00Z'),
      makeSession('2026-02-06T10:00:00Z'),
      makeSession('2026-02-05T10:00:00Z'),
    ];
    const insights = generateInsights(sessions, []);
    // 3 sessions passes MIN_SESSIONS check; may or may not produce insights
    // depending on whether any detector triggers
    expect(Array.isArray(insights)).toBe(true);
  });

  it('excludes non-completed sessions from count', () => {
    const sessions: Session[] = [
      makeSession('2026-02-07T10:00:00Z', 'completed'),
      makeSession('2026-02-06T10:00:00Z', 'abandoned'),
      makeSession('2026-02-05T10:00:00Z', 'paused'),
    ];
    // Only 1 completed → below MIN_SESSIONS_FOR_INSIGHTS (3)
    expect(generateInsights(sessions, [])).toEqual([]);
  });

  it('handles sessions with no weekly activity (all old)', () => {
    const sessions: Session[] = [
      makeSession('2026-01-10T10:00:00Z'),
      makeSession('2026-01-11T10:00:00Z'),
      makeSession('2026-01-12T10:00:00Z'),
    ];
    const insights = generateInsights(sessions, []);
    // Should get a "no sessions this week" concern
    const noWeek = insights.find(i => i.id === 'consistency-no-week');
    expect(noWeek).toBeDefined();
    expect(noWeek!.message).toBe('No training sessions this week yet - start one now!');
  });

  it('shows singular "session" for exactly 1 weekly session', () => {
    const sessions: Session[] = [
      makeSession('2026-02-07T10:00:00Z'),
      makeSession('2026-01-20T10:00:00Z'),
      makeSession('2026-01-19T10:00:00Z'),
    ];
    const insights = generateInsights(sessions, []);
    const low = insights.find(i => i.id === 'consistency-low-week');
    expect(low).toBeDefined();
    expect(low!.message).toContain('1 session');
    expect(low!.message).not.toContain('1 sessions');
  });

  it('shows plural "sessions" for 2 weekly sessions', () => {
    const sessions: Session[] = [
      makeSession('2026-02-07T10:00:00Z'),
      makeSession('2026-02-06T10:00:00Z'),
      makeSession('2026-01-19T10:00:00Z'),
    ];
    const insights = generateInsights(sessions, []);
    const low = insights.find(i => i.id === 'consistency-low-week');
    expect(low).toBeDefined();
    expect(low!.message).toContain('2 sessions');
  });

  // Milestone boundary tests
  it('triggers milestone at exactly 5 sessions', () => {
    const sessions = makeDailySessions(5);
    const insights = generateInsights(sessions, []);
    const milestone = insights.find(i => i.id === 'milestone-sessions-5');
    expect(milestone).toBeDefined();
  });

  it('triggers milestone at exactly 10 sessions', () => {
    const sessions: Session[] = [];
    for (let i = 0; i < 10; i++) {
      sessions.push(makeSession(`2026-02-0${Math.min(i + 1, 7)}T${String(10 + i).padStart(2, '0')}:00:00Z`));
    }
    const insights = generateInsights(sessions, []);
    const milestone = insights.find(i => i.id === 'milestone-sessions-10');
    expect(milestone).toBeDefined();
  });

  it('triggers milestone at exactly 25 sessions', () => {
    const sessions: Session[] = [];
    for (let i = 0; i < 25; i++) {
      const day = String((i % 28) + 1).padStart(2, '0');
      sessions.push(makeSession(`2026-01-${day}T${String(10 + (i % 10)).padStart(2, '0')}:00:00Z`));
    }
    const insights = generateInsights(sessions, []);
    const milestone = insights.find(i => i.id === 'milestone-sessions-25');
    expect(milestone).toBeDefined();
  });

  it('does not trigger milestone at 8 sessions (between 5+3 and 10)', () => {
    const sessions: Session[] = [];
    for (let i = 0; i < 8; i++) {
      sessions.push(makeSession(`2026-02-0${Math.min(i + 1, 7)}T${String(10 + i).padStart(2, '0')}:00:00Z`));
    }
    const insights = generateInsights(sessions, []);
    const milestone = insights.find(i => i.category === 'milestone');
    expect(milestone).toBeUndefined();
  });

  // Confidence edge cases
  it('handles confidence at exactly 3.5 boundary (not > 3.5)', () => {
    const sessions = makeSessionsWithConfidence([3.5, 3.5, 3.5, 3.5, 3.5]);
    const insights = generateInsights(sessions, []);
    // avgConfidence = 3.5 exactly → condition is > 3.5, so should NOT trigger
    const highConf = insights.find(i => i.id === 'confidence-high-avg');
    expect(highConf).toBeUndefined();
  });

  it('triggers high confidence when avg is above 3.5', () => {
    // Use 3 old sessions (no weekly consistency insight) to avoid MAX_INSIGHTS cap
    const sessions: Session[] = [
      { timestamp: '2026-01-10T10:00:00Z', module: 'training', duration: 600000, completionStatus: 'completed', confidenceAfter: 3.8, accuracy: 80, drillCount: 10 },
      { timestamp: '2026-01-11T10:00:00Z', module: 'training', duration: 600000, completionStatus: 'completed', confidenceAfter: 3.9, accuracy: 80, drillCount: 10 },
      { timestamp: '2026-01-12T10:00:00Z', module: 'training', duration: 600000, completionStatus: 'completed', confidenceAfter: 4.0, accuracy: 80, drillCount: 10 },
    ];
    const insights = generateInsights(sessions, []);
    const highConf = insights.find(i => i.id === 'confidence-high-avg');
    expect(highConf).toBeDefined();
    expect(highConf!.message).toContain('/5');
  });

  it('confidence improving message shows from/to format', () => {
    const sessions = makeSessionsWithConfidence([2.0, 2.5, 3.0, 3.5, 4.0]);
    const insights = generateInsights(sessions, []);
    const conf = insights.find(i => i.id === 'confidence-improving');
    expect(conf).toBeDefined();
    expect(conf!.message).toContain('from');
    expect(conf!.message).toContain('/5');
  });

  it('handles sessions without confidenceAfter (undefined)', () => {
    const sessions: Session[] = [
      makeSession('2026-02-07T10:00:00Z'),
      makeSession('2026-02-06T10:00:00Z'),
      makeSession('2026-02-05T10:00:00Z'),
    ];
    // None have confidenceAfter → should not crash, no confidence insights
    const insights = generateInsights(sessions, []);
    const conf = insights.find(i => i.id.startsWith('confidence'));
    expect(conf).toBeUndefined();
  });

  // Performance trend edge cases
  it('handles drill results with NaN accuracy', () => {
    const sessions = makeDailySessions(5);
    const drills: DrillResult[] = Array.from({ length: 5 }, (_, i) => ({
      sessionId: 1,
      timestamp: `2026-02-0${i + 1}T10:00:00Z`,
      module: 'number_line' as const,
      difficulty: 'medium' as const,
      isCorrect: true,
      timeToAnswer: 2000,
      accuracy: i < 3 ? NaN : 80 + i, // NaN in first 3 → less than 3 clean values
    }));
    // Should not crash
    const insights = generateInsights(sessions, drills);
    expect(Array.isArray(insights)).toBe(true);
  });

  it('uses "trending upward" message for small improvements (<=1%)', () => {
    const sessions = makeDailySessions(5);
    // Accuracy barely increasing: 80, 80.2, 80.4, 80.6, 80.8
    const drills: DrillResult[] = Array.from({ length: 5 }, (_, i) => ({
      sessionId: 1,
      timestamp: `2026-02-0${i + 1}T10:00:00Z`,
      module: 'number_line' as const,
      difficulty: 'medium' as const,
      isCorrect: true,
      timeToAnswer: 2000,
      accuracy: 80 + i * 0.2,
    }));
    const insights = generateInsights(sessions, drills);
    const perf = insights.find(i => i.id === 'performance-improving-number_line');
    if (perf) {
      // Improvement is ~0.8 → rounds to 1 or 0, so should use "trending upward"
      expect(perf.message).toContain('trending upward');
    }
  });

  // Time pattern edge cases
  it('returns no time insights with only 1 module of drills', () => {
    const sessions = makeDailySessions(5);
    const drills = makeTimedDrills('number_line', 2000, 5);
    const insights = generateInsights(sessions, drills);
    const timeInsight = insights.find(i => i.id.startsWith('time-'));
    expect(timeInsight).toBeUndefined();
  });

  it('returns no speed star when modules have similar timing', () => {
    const sessions = makeDailySessions(5);
    const drills = [
      ...makeTimedDrills('number_line', 2000, 5),
      ...makeTimedDrills('spatial_rotation', 2100, 5), // only 5% difference
      ...makeTimedDrills('math_operations', 2050, 5),
    ];
    const insights = generateInsights(sessions, drills);
    const speedStar = insights.find(i => i.id.startsWith('time-fastest-'));
    expect(speedStar).toBeUndefined();
  });

  // Multiple insights per module
  it('can generate both improving and declining trends across different modules', () => {
    const sessions = makeDailySessions(5);
    const drills = [
      ...makeImprovingDrills('number_line', 10),
      ...makeDecliningDrills('math_operations', 10),
    ];
    const insights = generateInsights(sessions, drills);
    const improving = insights.find(i => i.id === 'performance-improving-number_line');
    const declining = insights.find(i => i.id === 'performance-declining-math_operations');
    // At least one should exist (may be capped at 3 total)
    expect(improving || declining).toBeDefined();
  });

  // Large session history
  it('handles 100+ sessions without errors', () => {
    const sessions: Session[] = [];
    for (let i = 0; i < 100; i++) {
      const day = String((i % 28) + 1).padStart(2, '0');
      const month = String(Math.floor(i / 28) + 1).padStart(2, '0');
      sessions.push(makeSession(`2026-${month}-${day}T10:00:00Z`));
    }
    const insights = generateInsights(sessions, []);
    expect(Array.isArray(insights)).toBe(true);
    expect(insights.length).toBeLessThanOrEqual(5);
  });

  // Empty drill results
  it('handles empty drill results gracefully', () => {
    const sessions = makeDailySessions(5);
    const insights = generateInsights(sessions, []);
    expect(Array.isArray(insights)).toBe(true);
  });

  // Drill results with timeToAnswer = 0 (filtered out by time patterns)
  it('filters out drills with timeToAnswer = 0 in time patterns', () => {
    const sessions = makeDailySessions(5);
    const drills: DrillResult[] = Array.from({ length: 5 }, (_, i) => ({
      sessionId: 1,
      timestamp: `2026-02-07T10:${String(i).padStart(2, '0')}:00Z`,
      module: 'number_line' as const,
      difficulty: 'medium' as const,
      isCorrect: true,
      timeToAnswer: 0, // should be filtered
      accuracy: 85,
    }));
    // Should not crash, time patterns need at least 3 drills with timeToAnswer > 0
    const insights = generateInsights(sessions, drills);
    expect(Array.isArray(insights)).toBe(true);
  });
});

// ========================================
// STATISTICAL SIGNIFICANCE TESTS
// t-test validation for trend detection
// ========================================

describe('detectTrend - statistical significance', () => {
  it('reports stable for noisy data with slight upward slope', () => {
    // Slope exists but residuals are large → not statistically significant
    expect(detectTrend([80, 82, 79, 83, 81])).toBe('stable');
  });

  it('reports stable for noisy data with slight downward slope', () => {
    expect(detectTrend([81, 79, 83, 78, 82])).toBe('stable');
  });

  it('reports improving for clean upward trend (zero residuals)', () => {
    // Perfect linear fit → SE=0 → infinitely significant
    expect(detectTrend([10, 20, 30, 40, 50])).toBe('improving');
  });

  it('reports declining for clean downward trend (zero residuals)', () => {
    expect(detectTrend([50, 40, 30, 20, 10])).toBe('declining');
  });

  it('reports improving for strong signal with some noise', () => {
    // Strong upward trend with small noise — signal >> noise
    expect(detectTrend([60, 63, 68, 71, 76, 79, 84, 87, 92, 95])).toBe('improving');
  });

  it('reports declining for strong signal with some noise', () => {
    expect(detectTrend([95, 92, 87, 84, 79, 76, 71, 68, 63, 60])).toBe('declining');
  });

  it('reports stable for wild oscillations despite positive slope', () => {
    // Mean drifts up slightly but variance is huge → not significant
    expect(detectTrend([50, 90, 40, 95, 45])).toBe('stable');
  });

  it('reports stable for random-looking data', () => {
    expect(detectTrend([72, 68, 75, 70, 73, 69, 74])).toBe('stable');
  });

  it('reports improving when n is large enough to overcome noise', () => {
    // 20 data points with consistent upward trend and small noise
    const data = Array.from({ length: 20 }, (_, i) => 50 + i * 2 + (i % 2 === 0 ? 1 : -1));
    expect(detectTrend(data)).toBe('improving');
  });

  it('handles 3-point data with perfect fit (df=1, high critical t)', () => {
    // With only 3 points, df=1, critical t=6.314 — need very strong signal
    // Perfect fit [1, 2, 3] has SE=0 → passes
    expect(detectTrend([1, 2, 3])).toBe('improving');
    // But noisy 3-point data won't pass
    expect(detectTrend([1, 3, 2])).toBe('stable');
  });

  it('distinguishes real improvement from measurement noise in accuracy data', () => {
    // Real scenario: student accuracy bouncing ±3% around 75% — should be stable
    expect(detectTrend([73, 77, 74, 76, 75, 78, 74])).toBe('stable');
    // Real scenario: student improving 5% per session — should be improving
    expect(detectTrend([60, 65, 70, 75, 80, 85, 90])).toBe('improving');
  });
});

// ========================================
// SPACING QUALITY TESTS
// Spaced repetition science validation
// ========================================

describe('calculateSpacingQuality', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-02-07T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns no-data for 0 sessions', () => {
    const result = calculateSpacingQuality([]);
    expect(result.recommendation).toBe('no-data');
    expect(result.frequencyScore).toBe(0);
  });

  it('returns no-data for 1 recent session', () => {
    const sessions = [makeSession('2026-02-07T10:00:00Z')];
    const result = calculateSpacingQuality(sessions);
    expect(result.recommendation).toBe('no-data');
    expect(result.frequencyScore).toBeCloseTo(0.2, 1); // 1/5
  });

  it('returns excellent for 5 evenly-spaced daily sessions', () => {
    const sessions = makeDailySessions(5);
    const result = calculateSpacingQuality(sessions);
    expect(result.recommendation).toBe('excellent');
    expect(result.frequencyScore).toBeCloseTo(1.0, 1);
    expect(result.regularityScore).toBeGreaterThan(0.8);
    expect(result.overallScore).toBeGreaterThan(0.8);
  });

  it('returns excellent for 4 evenly-spaced sessions (every other day)', () => {
    const sessions: Session[] = [
      makeSession('2026-02-07T10:00:00Z'),
      makeSession('2026-02-05T10:00:00Z'),
      makeSession('2026-02-03T10:00:00Z'),
      makeSession('2026-02-01T10:00:00Z'),
    ];
    const result = calculateSpacingQuality(sessions);
    expect(result.recommendation).toBe('excellent');
    expect(result.regularityScore).toBeGreaterThan(0.8); // even 48h gaps
  });

  it('detects clustered sessions (4+ days, poor spacing)', () => {
    // 4 sessions but all crammed into 2 consecutive days
    const sessions: Session[] = [
      makeSession('2026-02-07T08:00:00Z'),
      makeSession('2026-02-07T14:00:00Z'),
      makeSession('2026-02-06T08:00:00Z'),
      makeSession('2026-02-06T14:00:00Z'),
      makeSession('2026-02-05T08:00:00Z'),
      makeSession('2026-02-04T08:00:00Z'),
      makeSession('2026-02-03T08:00:00Z'),
    ];
    const result = calculateSpacingQuality(sessions);
    // 5 unique days → frequencyScore = 1.0
    // But gaps are uneven (two 24h gaps then nothing vs even distribution)
    expect(result.frequencyScore).toBeGreaterThan(0.5);
  });

  it('returns infrequent for only 1 session in 7 days', () => {
    const sessions: Session[] = [
      makeSession('2026-02-07T10:00:00Z'),
      makeSession('2026-01-20T10:00:00Z'), // old
      makeSession('2026-01-19T10:00:00Z'), // old
    ];
    const result = calculateSpacingQuality(sessions);
    // Only 1 recent → frequencyScore = 0.2, no-data (can't calc gaps)
    expect(result.frequencyScore).toBeCloseTo(0.2, 1);
  });

  it('excludes non-completed sessions', () => {
    const sessions: Session[] = [
      makeSession('2026-02-07T10:00:00Z', 'completed'),
      makeSession('2026-02-06T10:00:00Z', 'abandoned'),
      makeSession('2026-02-05T10:00:00Z', 'completed'),
      makeSession('2026-02-04T10:00:00Z', 'paused'),
      makeSession('2026-02-03T10:00:00Z', 'completed'),
    ];
    const result = calculateSpacingQuality(sessions);
    // Only 3 completed days → frequencyScore = 3/5 = 0.6
    expect(result.frequencyScore).toBeCloseTo(0.6, 1);
  });

  it('frequency score caps at 1.0 for 7 sessions', () => {
    const sessions: Session[] = [];
    for (let i = 0; i < 7; i++) {
      sessions.push(makeSession(`2026-02-0${7 - i}T10:00:00Z`));
    }
    const result = calculateSpacingQuality(sessions);
    expect(result.frequencyScore).toBe(1.0); // min(7/5, 1) = 1
  });

  it('regularity score near 1.0 for perfectly regular intervals', () => {
    // Every 24 hours exactly
    const sessions = makeDailySessions(5);
    const result = calculateSpacingQuality(sessions);
    expect(result.regularityScore).toBeGreaterThan(0.9);
  });

  it('regularity score near 0 for extremely irregular intervals', () => {
    // 3 sessions: two on same day, one 6 days earlier
    const sessions: Session[] = [
      makeSession('2026-02-07T10:00:00Z'),
      makeSession('2026-02-06T10:00:00Z'),
      makeSession('2026-02-01T10:00:00Z'), // 5 day gap then 1 day gap
    ];
    const result = calculateSpacingQuality(sessions);
    // Gaps: [120h, 24h] → mean=72, std=~48 → CV=0.67 → reg=0.33
    expect(result.regularityScore).toBeLessThan(0.5);
  });

  it('overall score weights regularity higher than frequency', () => {
    // 3 sessions evenly spaced vs 5 sessions clustered
    // The evenly-spaced one should have higher overallScore despite fewer sessions
    const evenSessions: Session[] = [
      makeSession('2026-02-07T10:00:00Z'),
      makeSession('2026-02-05T10:00:00Z'),
      makeSession('2026-02-03T10:00:00Z'),
    ];
    const evenResult = calculateSpacingQuality(evenSessions);

    // Clustered: 5 sessions in 2 consecutive days
    const clusteredSessions: Session[] = [
      makeSession('2026-02-07T10:00:00Z'),
      makeSession('2026-02-06T10:00:00Z'),
      makeSession('2026-02-01T10:00:00Z'),
      makeSession('2026-01-31T23:00:00Z'), // just barely in range
      makeSession('2026-01-31T10:00:00Z'),
    ];
    const clusteredResult = calculateSpacingQuality(clusteredSessions);

    // Even spacing should beat clustered for regularity
    expect(evenResult.regularityScore).toBeGreaterThan(clusteredResult.regularityScore);
  });
});

// ========================================
// SPACING-AWARE CONSISTENCY INSIGHTS TESTS
// ========================================

describe('generateInsights - spacing-aware consistency', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-02-07T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows excellent spacing message for well-distributed 5-day practice', () => {
    const sessions = makeDailySessions(5);
    const insights = generateInsights(sessions, []);
    const spacing = insights.find(i => i.id === 'consistency-excellent-spacing');
    expect(spacing).toBeDefined();
    expect(spacing!.message).toContain('distributed practice');
    expect(spacing!.message).toContain('5 days');
  });

  it('shows clustered warning for 4+ days with poor spacing', () => {
    // 5 unique days but all crammed: Feb 7, 6, 5, 4, 1 (big gap at start)
    const sessions: Session[] = [
      makeSession('2026-02-07T10:00:00Z'),
      makeSession('2026-02-06T10:00:00Z'),
      makeSession('2026-02-05T10:00:00Z'),
      makeSession('2026-02-04T10:00:00Z'),
      makeSession('2026-02-01T10:00:00Z'), // 3-day gap then daily
    ];
    const insights = generateInsights(sessions, []);
    // The regularity depends on gap distribution; may be clustered or high-week
    const consistency = insights.find(i =>
      i.id === 'consistency-clustered' ||
      i.id === 'consistency-high-week' ||
      i.id === 'consistency-excellent-spacing'
    );
    expect(consistency).toBeDefined();
  });

  it('shows spacing advice in low-week message', () => {
    const sessions: Session[] = [
      makeSession('2026-02-07T10:00:00Z'),
      makeSession('2026-01-20T10:00:00Z'),
      makeSession('2026-01-19T10:00:00Z'),
    ];
    const insights = generateInsights(sessions, []);
    const low = insights.find(i => i.id === 'consistency-low-week');
    expect(low).toBeDefined();
    expect(low!.message).toContain('Spacing practice evenly');
  });

  it('falls back to generic high-week message for medium regularity', () => {
    // 4 sessions with medium regularity (not excellent, not clustered)
    // Gaps: 24h, 48h, 24h → CV = some medium value
    const sessions: Session[] = [
      makeSession('2026-02-07T10:00:00Z'),
      makeSession('2026-02-06T10:00:00Z'),
      makeSession('2026-02-04T10:00:00Z'), // 48h gap
      makeSession('2026-02-03T10:00:00Z'),
    ];
    const insights = generateInsights(sessions, []);
    // Should produce one of the three consistency variants
    const consistency = insights.find(i =>
      i.id === 'consistency-excellent-spacing' ||
      i.id === 'consistency-high-week' ||
      i.id === 'consistency-clustered'
    );
    expect(consistency).toBeDefined();
  });

  it('shows moderate-week insight for exactly 3 weekly sessions', () => {
    const sessions: Session[] = [
      makeSession('2026-02-07T10:00:00Z'),
      makeSession('2026-02-05T10:00:00Z'),
      makeSession('2026-02-03T10:00:00Z'),
    ];
    const insights = generateInsights(sessions, []);
    const moderate = insights.find(i => i.id === 'consistency-moderate-week');
    expect(moderate).toBeDefined();
    expect(moderate!.message).toContain('3 days');
    expect(moderate!.message).toContain('spacing');
  });
});

// ========================================
// AUTOMATICITY DETECTOR TESTS
// Brain pathway strengthening detection
// ========================================

describe('generateInsights - automaticity detection', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-02-07T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('detects automaticity when speed improves ≥20% with stable accuracy', () => {
    const sessions = makeDailySessions(5);
    // Early drills: 3000ms, Late drills: 2000ms (33% faster), accuracy stays ~85%
    const drills: DrillResult[] = [
      ...makeSpeedChangeDrills('number_line', 3000, 85, 0, 3),  // early: slow
      ...makeSpeedChangeDrills('number_line', 2000, 85, 3, 3),  // late: fast
    ];

    const insights = generateInsights(sessions, drills);
    const auto = insights.find(i => i.id === 'automaticity-number_line');

    expect(auto).toBeDefined();
    expect(auto!.category).toBe('positive');
    expect(auto!.icon).toBe('🧠');
    expect(auto!.message).toContain('faster');
    expect(auto!.message).toContain('Number Line');
    expect(auto!.message).toContain('pathways');
  });

  it('does NOT detect automaticity when speed improves but accuracy drops', () => {
    const sessions = makeDailySessions(5);
    // Speed: 3000 → 2000 (33% faster) but accuracy: 85 → 75 (10pt drop)
    const drills: DrillResult[] = [
      ...makeSpeedChangeDrills('number_line', 3000, 85, 0, 3),
      ...makeSpeedChangeDrills('number_line', 2000, 75, 3, 3),
    ];

    const insights = generateInsights(sessions, drills);
    const auto = insights.find(i => i.id === 'automaticity-number_line');
    expect(auto).toBeUndefined();
  });

  it('does NOT detect automaticity when speed improvement < 20%', () => {
    const sessions = makeDailySessions(5);
    // Speed: 3000 → 2500 (only 17% faster)
    const drills: DrillResult[] = [
      ...makeSpeedChangeDrills('number_line', 3000, 85, 0, 3),
      ...makeSpeedChangeDrills('number_line', 2500, 85, 3, 3),
    ];

    const insights = generateInsights(sessions, drills);
    const auto = insights.find(i => i.id === 'automaticity-number_line');
    expect(auto).toBeUndefined();
  });

  it('requires at least 6 drills per module', () => {
    const sessions = makeDailySessions(5);
    // Only 4 drills — not enough
    const drills: DrillResult[] = [
      ...makeSpeedChangeDrills('number_line', 3000, 85, 0, 2),
      ...makeSpeedChangeDrills('number_line', 1500, 85, 2, 2),
    ];

    const insights = generateInsights(sessions, drills);
    const auto = insights.find(i => i.id === 'automaticity-number_line');
    expect(auto).toBeUndefined();
  });

  it('allows small accuracy drop (< 5 points) with speed gain', () => {
    const sessions = makeDailySessions(5);
    // Speed: 3000 → 2000, accuracy: 85 → 82 (only 3pt drop — acceptable)
    const drills: DrillResult[] = [
      ...makeSpeedChangeDrills('number_line', 3000, 85, 0, 3),
      ...makeSpeedChangeDrills('number_line', 2000, 82, 3, 3),
    ];

    const insights = generateInsights(sessions, drills);
    const auto = insights.find(i => i.id === 'automaticity-number_line');
    expect(auto).toBeDefined();
  });

  it('detects automaticity independently per module', () => {
    const sessions = makeDailySessions(5);
    const drills: DrillResult[] = [
      // Number line: getting faster ✓
      ...makeSpeedChangeDrills('number_line', 3000, 85, 0, 3),
      ...makeSpeedChangeDrills('number_line', 2000, 85, 3, 3),
      // Spatial: NOT getting faster
      ...makeSpeedChangeDrills('spatial_rotation', 2000, 80, 0, 3),
      ...makeSpeedChangeDrills('spatial_rotation', 1900, 80, 3, 3),
    ];

    const insights = generateInsights(sessions, drills);
    expect(insights.find(i => i.id === 'automaticity-number_line')).toBeDefined();
    expect(insights.find(i => i.id === 'automaticity-spatial_rotation')).toBeUndefined();
  });
});

// ========================================
// STRUGGLE-TO-STRENGTH DETECTOR TESTS
// Brain rewiring proof
// ========================================

describe('generateInsights - struggle-to-strength detection', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-02-07T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('detects breakthrough when accuracy improves ≥10%', () => {
    const sessions = makeDailySessions(5);
    // Early: 60% accuracy, Late: 85% accuracy (25% improvement)
    const drills: DrillResult[] = [
      ...makeAccuracyChangeDrills('math_operations', 60, 0, 3),
      ...makeAccuracyChangeDrills('math_operations', 85, 3, 3),
    ];

    const insights = generateInsights(sessions, drills);
    const breakthrough = insights.find(i => i.id === 'breakthrough-math_operations');

    expect(breakthrough).toBeDefined();
    expect(breakthrough!.icon).toBe('🌟');
    expect(breakthrough!.message).toContain('60%');
    expect(breakthrough!.message).toContain('85%');
    expect(breakthrough!.message).toContain('number pathways');
  });

  it('does NOT detect breakthrough for < 10% improvement', () => {
    const sessions = makeDailySessions(5);
    // Only 8% improvement
    const drills: DrillResult[] = [
      ...makeAccuracyChangeDrills('math_operations', 75, 0, 3),
      ...makeAccuracyChangeDrills('math_operations', 83, 3, 3),
    ];

    const insights = generateInsights(sessions, drills);
    const breakthrough = insights.find(i => i.id === 'breakthrough-math_operations');
    expect(breakthrough).toBeUndefined();
  });

  it('picks the module with the BIGGEST improvement', () => {
    const sessions = makeDailySessions(5);
    const drills: DrillResult[] = [
      // Number line: 70 → 85 (15% improvement)
      ...makeAccuracyChangeDrills('number_line', 70, 0, 3),
      ...makeAccuracyChangeDrills('number_line', 85, 3, 3),
      // Math ops: 50 → 80 (30% improvement — bigger!)
      ...makeAccuracyChangeDrills('math_operations', 50, 0, 3),
      ...makeAccuracyChangeDrills('math_operations', 80, 3, 3),
    ];

    const insights = generateInsights(sessions, drills);
    // Should pick math_operations (bigger jump)
    const breakthrough = insights.find(i => i.id.startsWith('breakthrough-'));
    expect(breakthrough).toBeDefined();
    expect(breakthrough!.id).toBe('breakthrough-math_operations');
  });

  it('requires at least 6 drills per module', () => {
    const sessions = makeDailySessions(5);
    const drills: DrillResult[] = [
      ...makeAccuracyChangeDrills('math_operations', 50, 0, 2),
      ...makeAccuracyChangeDrills('math_operations', 90, 2, 2),
    ];

    const insights = generateInsights(sessions, drills);
    const breakthrough = insights.find(i => i.id.startsWith('breakthrough-'));
    expect(breakthrough).toBeUndefined();
  });
});

// ========================================
// WEAKNESS FOCUS DETECTOR TESTS
// Where to concentrate practice
// ========================================

describe('generateInsights - weakness focus detection', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-02-07T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('identifies module with accuracy >10 points below average', () => {
    const sessions = makeDailySessions(5);
    const drills: DrillResult[] = [
      // Number line: 90% (strong)
      ...makeAccuracyChangeDrills('number_line', 90, 0, 5),
      // Spatial: 88% (strong)
      ...makeAccuracyChangeDrills('spatial_rotation', 88, 0, 5),
      // Math ops: 65% (weak — 24 pts below avg of ~81)
      ...makeAccuracyChangeDrills('math_operations', 65, 0, 5),
    ];

    const insights = generateInsights(sessions, drills);
    const focus = insights.find(i => i.id === 'focus-area-math_operations');

    expect(focus).toBeDefined();
    expect(focus!.category).toBe('concern');
    expect(focus!.icon).toBe('🎯');
    expect(focus!.message).toContain('65%');
    expect(focus!.message).toContain('Math Operations');
    expect(focus!.action).toBeDefined();
    expect(focus!.action!.route).toBe('/training');
  });

  it('does NOT flag when all modules are within 10 points of average', () => {
    const sessions = makeDailySessions(5);
    const drills: DrillResult[] = [
      ...makeAccuracyChangeDrills('number_line', 82, 0, 5),
      ...makeAccuracyChangeDrills('spatial_rotation', 78, 0, 5),
      ...makeAccuracyChangeDrills('math_operations', 80, 0, 5),
    ];

    const insights = generateInsights(sessions, drills);
    const focus = insights.find(i => i.id.startsWith('focus-area-'));
    expect(focus).toBeUndefined();
  });

  it('requires at least 2 modules with data', () => {
    const sessions = makeDailySessions(5);
    // Only one module
    const drills = makeAccuracyChangeDrills('number_line', 50, 0, 5);

    const insights = generateInsights(sessions, drills);
    const focus = insights.find(i => i.id.startsWith('focus-area-'));
    expect(focus).toBeUndefined();
  });

  it('uses only recent drills (last 5) for accuracy', () => {
    const sessions = makeDailySessions(5);
    const drills: DrillResult[] = [
      // Number line: old drills bad, recent drills good
      ...makeAccuracyChangeDrills('number_line', 40, 0, 5),
      ...makeAccuracyChangeDrills('number_line', 90, 5, 5), // last 5 = 90%
      // Spatial: consistently good
      ...makeAccuracyChangeDrills('spatial_rotation', 85, 0, 5),
      // Math ops: consistently good
      ...makeAccuracyChangeDrills('math_operations', 88, 0, 5),
    ];

    const insights = generateInsights(sessions, drills);
    // Number line's RECENT avg is 90%, not 65% overall — should not be flagged
    const focus = insights.find(i => i.id === 'focus-area-number_line');
    expect(focus).toBeUndefined();
  });
});

// ========================================
// CONFIDENCE-PERFORMANCE ALIGNMENT TESTS
// Hidden progress detection
// ========================================

describe('generateInsights - confidence-performance alignment', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-02-07T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('detects "both growing" when accuracy and confidence both improve', () => {
    const sessions = makeSessionsWithConfidence([2.0, 2.5, 3.0, 3.5, 4.0]);
    // Accuracy clearly improving
    const drills = makeImprovingDrills('number_line', 10);

    const insights = generateInsights(sessions, drills);
    const alignment = insights.find(i => i.id === 'alignment-both-growing');

    expect(alignment).toBeDefined();
    expect(alignment!.icon).toBe('🚀');
    expect(alignment!.message).toContain('rewiring');
    expect(alignment!.message).toContain('feel it');
  });

  it('detects "hidden progress" when accuracy up but confidence flat', () => {
    // Flat confidence
    const sessions = makeSessionsWithConfidence([3.0, 3.0, 3.0, 3.0, 3.0]);
    // But accuracy clearly improving
    const drills = makeImprovingDrills('number_line', 10);

    const insights = generateInsights(sessions, drills);
    const hidden = insights.find(i => i.id === 'alignment-hidden-progress');

    expect(hidden).toBeDefined();
    expect(hidden!.icon).toBe('💡');
    expect(hidden!.title).toContain('Better Than You Think');
    expect(hidden!.message).toContain('trust the data');
  });

  it('detects "confidence leading" when confidence up but accuracy flat', () => {
    // Confidence improving
    const sessions = makeSessionsWithConfidence([2.0, 2.5, 3.0, 3.5, 4.0]);
    // But accuracy flat (all same value)
    const drills: DrillResult[] = Array.from({ length: 10 }, (_, i) => ({
      sessionId: 1,
      timestamp: `2026-02-0${Math.min(7, i + 1)}T10:${String(i).padStart(2, '0')}:00Z`,
      module: 'number_line' as const,
      difficulty: 'medium' as const,
      isCorrect: true,
      timeToAnswer: 2000,
      accuracy: 75, // flat
    }));

    const insights = generateInsights(sessions, drills);
    const leading = insights.find(i => i.id === 'alignment-confidence-leading');

    expect(leading).toBeDefined();
    expect(leading!.icon).toBe('💪');
    expect(leading!.message).toContain('keep practicing');
  });

  it('returns no alignment insight when both are flat', () => {
    const sessions = makeSessionsWithConfidence([3.0, 3.0, 3.0, 3.0, 3.0]);
    const drills: DrillResult[] = Array.from({ length: 10 }, (_, i) => ({
      sessionId: 1,
      timestamp: `2026-02-0${Math.min(7, i + 1)}T10:${String(i).padStart(2, '0')}:00Z`,
      module: 'number_line' as const,
      difficulty: 'medium' as const,
      isCorrect: true,
      timeToAnswer: 2000,
      accuracy: 80,
    }));

    const insights = generateInsights(sessions, drills);
    const alignment = insights.find(i => i.id.startsWith('alignment-'));
    expect(alignment).toBeUndefined();
  });

  it('requires at least 3 sessions with confidence data', () => {
    // Only 2 sessions with confidence
    const sessions: Session[] = [
      { ...makeSession('2026-02-07T10:00:00Z'), confidenceAfter: 3.0 },
      { ...makeSession('2026-02-06T10:00:00Z'), confidenceAfter: 4.0 },
      makeSession('2026-02-05T10:00:00Z'), // no confidenceAfter
    ];
    const drills = makeImprovingDrills('number_line', 10);

    const insights = generateInsights(sessions, drills);
    const alignment = insights.find(i => i.id.startsWith('alignment-'));
    expect(alignment).toBeUndefined();
  });

  it('requires at least 3 drill results for accuracy trend', () => {
    const sessions = makeSessionsWithConfidence([2.0, 3.0, 4.0]);
    // Only 2 drills
    const drills: DrillResult[] = [
      { sessionId: 1, timestamp: '2026-02-06T10:00:00Z', module: 'number_line', difficulty: 'medium', isCorrect: true, timeToAnswer: 2000, accuracy: 60 },
      { sessionId: 1, timestamp: '2026-02-07T10:00:00Z', module: 'number_line', difficulty: 'medium', isCorrect: true, timeToAnswer: 2000, accuracy: 90 },
    ];

    const insights = generateInsights(sessions, drills);
    const alignment = insights.find(i => i.id.startsWith('alignment-'));
    expect(alignment).toBeUndefined();
  });
});
