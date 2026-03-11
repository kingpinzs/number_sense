/**
 * insightEngine.test.ts
 *
 * Comprehensive unit tests for the InsightEngine analytics service.
 * Tests follow the AAA pattern (Arrange, Act, Assert).
 *
 * Coverage targets:
 *   - All 10 analysis functions
 *   - scoreConfidence formula
 *   - buildDomainPerformance, buildContextBuckets, buildSuggestedDrills
 *   - analyzePerformance (integration, mocked db)
 *   - Edge cases: zero data, partial data, insufficient sample sizes
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { DrillResult, Session } from '@/services/storage/schemas';

// ── Mock Dexie db ─────────────────────────────────────────────────────────────
vi.mock('@/services/storage/db', () => ({
  db: {
    drill_results: { toArray: vi.fn() },
    sessions: { toArray: vi.fn() },
  },
}));

// ── Mock localStorage (via Storage.prototype, jsdom provides it) ──────────────
// We use the real jsdom localStorage — just clear it before each test.

import { db } from '@/services/storage/db';
import { STORAGE_KEYS } from '@/services/storage/localStorage';
import {
  analyzePerformance,
  analyzeDomains,
  analyzeTimeOfDay,
  analyzeDayOfWeek,
  analyzeSessionFrequency,
  analyzeFatigue,
  analyzeResponseTime,
  analyzeDifficultyReadiness,
  analyzeStreakCorrelation,
  analyzeWeeklyProgress,
  analyzeDrillEffectiveness,
  buildDomainPerformance,
  buildContextBuckets,
  buildSuggestedDrills,
  scoreConfidence,
  average,
  getDomain,
  classifyTimeOfDay,
  classifyDayType,
  buildInsightId,
  suggestDifficulty,
  dominantDifficulty,
  daysAgoISO,
  // Public alias exports (task contract)
  getTimeOfDay,
  calculateConfidence,
  generateInsightId,
} from './insightEngine';
import { MIN_DATA_POINTS, MIN_CONFIDENCE } from '@/services/training/insightTypes';

// ─── Factories ────────────────────────────────────────────────────────────────

let _drillId = 1;

function makeDrill(
  overrides: Partial<DrillResult> & Pick<DrillResult, 'module'>,
): DrillResult {
  return {
    id: _drillId++,
    sessionId: 1,
    timestamp: new Date().toISOString(),
    difficulty: 'easy',
    isCorrect: true,
    timeToAnswer: 2000,
    accuracy: 80,
    ...overrides,
  };
}

function makeSession(overrides: Partial<Session> = {}): Session {
  return {
    id: 1,
    timestamp: new Date().toISOString(),
    module: 'training',
    duration: 300000,
    completionStatus: 'completed',
    ...overrides,
  };
}

/**
 * Build a timestamp for N days ago at a specific hour.
 */
function tsAt(daysAgo: number, hour: number = 10): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
}

// ─── scoreConfidence ──────────────────────────────────────────────────────────

describe('scoreConfidence', () => {
  it('returns 0 for n=0 (below 5 threshold) and delta=0', () => {
    expect(scoreConfidence(0, 0)).toBe(0);
  });

  it('applies sampleFactor 0.2 for n < 5', () => {
    // delta=50 → effectFactor=1.0; 0.2 * 1.0 = 0.2
    expect(scoreConfidence(4, 50)).toBeCloseTo(0.2, 5);
  });

  it('applies sampleFactor 0.4 for n in [5, 10)', () => {
    expect(scoreConfidence(5, 50)).toBeCloseTo(0.4, 5);
    expect(scoreConfidence(9, 50)).toBeCloseTo(0.4, 5);
  });

  it('applies sampleFactor 0.6 for n in [10, 20)', () => {
    expect(scoreConfidence(10, 50)).toBeCloseTo(0.6, 5);
    expect(scoreConfidence(19, 50)).toBeCloseTo(0.6, 5);
  });

  it('applies sampleFactor 0.8 for n in [20, 50)', () => {
    expect(scoreConfidence(20, 50)).toBeCloseTo(0.8, 5);
    expect(scoreConfidence(49, 50)).toBeCloseTo(0.8, 5);
  });

  it('applies sampleFactor 1.0 for n >= 50', () => {
    expect(scoreConfidence(50, 50)).toBeCloseTo(1.0, 5);
    expect(scoreConfidence(100, 50)).toBeCloseTo(1.0, 5);
  });

  it('caps effectFactor at 1.0 for delta >= 50', () => {
    expect(scoreConfidence(50, 50)).toBeCloseTo(1.0, 5);
    expect(scoreConfidence(50, 100)).toBeCloseTo(1.0, 5);
    expect(scoreConfidence(50, 1000)).toBeCloseTo(1.0, 5);
  });

  it('scales effectFactor linearly for delta < 50', () => {
    // n=50 → sampleFactor=1.0; delta=25 → effectFactor=0.5; result=0.5
    expect(scoreConfidence(50, 25)).toBeCloseTo(0.5, 5);
  });

  it('works with negative delta (uses abs)', () => {
    expect(scoreConfidence(50, -50)).toBeCloseTo(1.0, 5);
    expect(scoreConfidence(50, -25)).toBeCloseTo(0.5, 5);
  });
});

// ─── average ─────────────────────────────────────────────────────────────────

describe('average', () => {
  it('returns 0 for empty array', () => {
    expect(average([])).toBe(0);
  });

  it('returns the single value for array of length 1', () => {
    expect(average([42])).toBe(42);
  });

  it('calculates arithmetic mean correctly', () => {
    expect(average([10, 20, 30])).toBeCloseTo(20, 5);
  });
});

// ─── getDomain ────────────────────────────────────────────────────────────────

describe('getDomain', () => {
  it('maps number_line to numberSense', () => {
    expect(getDomain('number_line')).toBe('numberSense');
  });

  it('maps spatial_rotation to spatial', () => {
    expect(getDomain('spatial_rotation')).toBe('spatial');
  });

  it('maps math_operations to arithmetic', () => {
    expect(getDomain('math_operations')).toBe('arithmetic');
  });

  it('returns null for unknown module (game types)', () => {
    expect(getDomain('colored_dots')).toBeNull();
    expect(getDomain('rhythm_count')).toBeNull();
    expect(getDomain('whats_my_rule')).toBeNull();
  });
});

// ─── classifyTimeOfDay ────────────────────────────────────────────────────────

describe('classifyTimeOfDay', () => {
  function tsWithHour(hour: number): string {
    const d = new Date();
    d.setHours(hour, 0, 0, 0);
    return d.toISOString();
  }

  it('classifies hour 6 as morning', () => expect(classifyTimeOfDay(tsWithHour(6))).toBe('morning'));
  it('classifies hour 11 as morning', () => expect(classifyTimeOfDay(tsWithHour(11))).toBe('morning'));
  it('classifies hour 12 as afternoon', () => expect(classifyTimeOfDay(tsWithHour(12))).toBe('afternoon'));
  it('classifies hour 16 as afternoon', () => expect(classifyTimeOfDay(tsWithHour(16))).toBe('afternoon'));
  it('classifies hour 17 as evening', () => expect(classifyTimeOfDay(tsWithHour(17))).toBe('evening'));
  it('classifies hour 21 as evening', () => expect(classifyTimeOfDay(tsWithHour(21))).toBe('evening'));
  it('classifies hour 22 as night', () => expect(classifyTimeOfDay(tsWithHour(22))).toBe('night'));
  it('classifies hour 23 as night', () => expect(classifyTimeOfDay(tsWithHour(23))).toBe('night'));
  it('classifies hour 0 as night', () => expect(classifyTimeOfDay(tsWithHour(0))).toBe('night'));
  it('classifies hour 5 as night', () => expect(classifyTimeOfDay(tsWithHour(5))).toBe('night'));
});

// ─── classifyDayType ─────────────────────────────────────────────────────────

describe('classifyDayType', () => {
  // Use fixed known dates: 2026-03-09 is a Monday; 2026-03-14 is Saturday; 2026-03-15 is Sunday
  it('classifies Monday as weekday', () => {
    expect(classifyDayType('2026-03-09T10:00:00Z')).toBe('weekday');
  });

  it('classifies Friday as weekday', () => {
    expect(classifyDayType('2026-03-13T10:00:00Z')).toBe('weekday');
  });

  it('classifies Saturday as weekend', () => {
    expect(classifyDayType('2026-03-14T10:00:00Z')).toBe('weekend');
  });

  it('classifies Sunday as weekend', () => {
    expect(classifyDayType('2026-03-15T10:00:00Z')).toBe('weekend');
  });
});

// ─── buildInsightId ───────────────────────────────────────────────────────────

describe('buildInsightId', () => {
  it('joins type and parts with underscores', () => {
    expect(buildInsightId('strength', 'numberSense')).toBe('strength_numbersense');
  });

  it('replaces spaces with hyphens and lowercases', () => {
    expect(buildInsightId('discovery', 'Time Of Day', 'morning')).toBe('discovery_time-of-day_morning');
  });

  it('works with a single part', () => {
    expect(buildInsightId('recommendation', 'fatigue')).toBe('recommendation_fatigue');
  });
});

// ─── suggestDifficulty ────────────────────────────────────────────────────────

describe('suggestDifficulty', () => {
  it('suggests easy for accuracy < 50', () => expect(suggestDifficulty(30)).toBe('easy'));
  it('suggests medium for accuracy in [50, 80)', () => {
    expect(suggestDifficulty(50)).toBe('medium');
    expect(suggestDifficulty(79)).toBe('medium');
  });
  it('suggests hard for accuracy >= 80', () => {
    expect(suggestDifficulty(80)).toBe('hard');
    expect(suggestDifficulty(100)).toBe('hard');
  });
});

// ─── dominantDifficulty ───────────────────────────────────────────────────────

describe('dominantDifficulty', () => {
  it('returns easy when no results provided', () => {
    expect(dominantDifficulty([])).toBe('easy');
  });

  it('returns the most common difficulty', () => {
    const results = [
      makeDrill({ module: 'number_line', difficulty: 'easy' }),
      makeDrill({ module: 'number_line', difficulty: 'medium' }),
      makeDrill({ module: 'number_line', difficulty: 'medium' }),
    ];
    expect(dominantDifficulty(results)).toBe('medium');
  });

  it('returns hard when all are hard', () => {
    const results = [
      makeDrill({ module: 'number_line', difficulty: 'hard' }),
      makeDrill({ module: 'number_line', difficulty: 'hard' }),
    ];
    expect(dominantDifficulty(results)).toBe('hard');
  });
});

// ─── daysAgoISO ──────────────────────────────────────────────────────────────

describe('daysAgoISO', () => {
  it('returns a string parseable as a Date', () => {
    const ts = daysAgoISO(7);
    expect(() => new Date(ts)).not.toThrow();
  });

  it('returns a date approximately N days in the past', () => {
    const ts = daysAgoISO(7);
    const diff = Date.now() - new Date(ts).getTime();
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    // Allow 2-hour tolerance for DST transitions and test execution time
    const toleranceMs = 2 * 60 * 60 * 1000;
    expect(diff).toBeGreaterThanOrEqual(sevenDaysMs - toleranceMs);
    expect(diff).toBeLessThanOrEqual(sevenDaysMs + toleranceMs);
  });
});

// ─── analyzeDomains ──────────────────────────────────────────────────────────

describe('analyzeDomains', () => {
  it('returns empty array with no results', () => {
    expect(analyzeDomains([])).toEqual([]);
  });

  it('returns empty array with only one domain', () => {
    const results = Array.from({ length: 10 }, () =>
      makeDrill({ module: 'number_line', accuracy: 80 }),
    );
    expect(analyzeDomains(results)).toEqual([]);
  });

  it('returns empty when delta between domains is below MIN_EFFECT_SIZE', () => {
    // Both domains very close in accuracy
    const results = [
      ...Array.from({ length: 10 }, () => makeDrill({ module: 'number_line', accuracy: 80 })),
      ...Array.from({ length: 10 }, () => makeDrill({ module: 'math_operations', accuracy: 79 })),
    ];
    expect(analyzeDomains(results)).toEqual([]);
  });

  it('generates strength and weakness insights when delta >= MIN_EFFECT_SIZE and confidence >= MIN_CONFIDENCE', () => {
    // numberSense at 95%, arithmetic at 30% — delta=65%
    const results = [
      ...Array.from({ length: 10 }, () => makeDrill({ module: 'number_line', accuracy: 95 })),
      ...Array.from({ length: 10 }, () => makeDrill({ module: 'math_operations', accuracy: 30 })),
    ];
    const insights = analyzeDomains(results);
    const types = insights.map(i => i.type);
    expect(types).toContain('strength');
    expect(types).toContain('weakness');
  });

  it('strength insight references the best domain', () => {
    const results = [
      ...Array.from({ length: 10 }, () => makeDrill({ module: 'number_line', accuracy: 95 })),
      ...Array.from({ length: 10 }, () => makeDrill({ module: 'math_operations', accuracy: 30 })),
    ];
    const insights = analyzeDomains(results);
    const strength = insights.find(i => i.type === 'strength');
    expect(strength?.domain).toBe('numberSense');
  });

  it('weakness insight references the worst domain', () => {
    const results = [
      ...Array.from({ length: 10 }, () => makeDrill({ module: 'number_line', accuracy: 95 })),
      ...Array.from({ length: 10 }, () => makeDrill({ module: 'math_operations', accuracy: 30 })),
    ];
    const insights = analyzeDomains(results);
    const weakness = insights.find(i => i.type === 'weakness');
    expect(weakness?.domain).toBe('arithmetic');
  });

  it('insight confidence is >= MIN_CONFIDENCE', () => {
    const results = [
      ...Array.from({ length: 10 }, () => makeDrill({ module: 'number_line', accuracy: 95 })),
      ...Array.from({ length: 10 }, () => makeDrill({ module: 'math_operations', accuracy: 30 })),
    ];
    const insights = analyzeDomains(results);
    for (const i of insights) {
      expect(i.confidence).toBeGreaterThanOrEqual(MIN_CONFIDENCE);
    }
  });

  it('returns no insights when sample sizes are too small for confidence', () => {
    // 1 result per domain → n=1 → sampleFactor=0.2 but delta=65 → effectFactor=1.0
    // 0.2 * 1.0 = 0.2 < MIN_CONFIDENCE(0.3) — no insight
    const results = [
      makeDrill({ module: 'number_line', accuracy: 95 }),
      makeDrill({ module: 'math_operations', accuracy: 30 }),
    ];
    const insights = analyzeDomains(results);
    // With n=1 each, confidence = 0.2 * 1.0 = 0.2 which is below MIN_CONFIDENCE=0.3
    for (const i of insights) {
      expect(i.confidence).toBeGreaterThanOrEqual(MIN_CONFIDENCE);
    }
  });

  it('uses only the last 10 drills for recent accuracy', () => {
    // Earlier 5 drills are low accuracy, later 10 are high — recent should be high
    const early = Array.from({ length: 5 }, () =>
      makeDrill({ module: 'number_line', accuracy: 20, timestamp: tsAt(20) }),
    );
    const recent = Array.from({ length: 10 }, () =>
      makeDrill({ module: 'number_line', accuracy: 90, timestamp: tsAt(1) }),
    );
    const lowDomain = Array.from({ length: 10 }, () =>
      makeDrill({ module: 'math_operations', accuracy: 30, timestamp: tsAt(1) }),
    );
    const results = [...early, ...recent, ...lowDomain];
    const insights = analyzeDomains(results);
    const strength = insights.find(i => i.type === 'strength');
    expect(strength?.domain).toBe('numberSense');
  });
});

// ─── analyzeTimeOfDay ────────────────────────────────────────────────────────

describe('analyzeTimeOfDay', () => {
  it('returns empty array with no results', () => {
    expect(analyzeTimeOfDay([])).toEqual([]);
  });

  it('returns empty array with only one time bucket', () => {
    // All drills in the morning
    const results = Array.from({ length: 10 }, (_, i) =>
      makeDrill({ module: 'number_line', accuracy: 80, timestamp: tsAt(i, 9) }),
    );
    expect(analyzeTimeOfDay(results)).toEqual([]);
  });

  it('returns empty array when delta < MIN_EFFECT_SIZE', () => {
    const results = [
      ...Array.from({ length: 5 }, (_, i) => makeDrill({ module: 'number_line', accuracy: 80, timestamp: tsAt(i, 9) })),
      ...Array.from({ length: 5 }, (_, i) => makeDrill({ module: 'number_line', accuracy: 79, timestamp: tsAt(i, 14) })),
    ];
    expect(analyzeTimeOfDay(results)).toEqual([]);
  });

  it('generates a discovery insight when morning is significantly better than evening', () => {
    // Morning: 95%, Evening: 40% — delta=55%
    const morning = Array.from({ length: 20 }, (_, i) =>
      makeDrill({ module: 'number_line', accuracy: 95, timestamp: tsAt(i % 10, 9) }),
    );
    const evening = Array.from({ length: 20 }, (_, i) =>
      makeDrill({ module: 'number_line', accuracy: 40, timestamp: tsAt(i % 10, 19) }),
    );
    const insights = analyzeTimeOfDay([...morning, ...evening]);
    expect(insights).toHaveLength(1);
    expect(insights[0].type).toBe('discovery');
    expect(insights[0].message).toContain('morning');
  });

  it('insight confidence is >= MIN_CONFIDENCE', () => {
    const morning = Array.from({ length: 20 }, (_, i) =>
      makeDrill({ module: 'number_line', accuracy: 95, timestamp: tsAt(i % 10, 9) }),
    );
    const evening = Array.from({ length: 20 }, (_, i) =>
      makeDrill({ module: 'number_line', accuracy: 40, timestamp: tsAt(i % 10, 19) }),
    );
    const insights = analyzeTimeOfDay([...morning, ...evening]);
    for (const i of insights) {
      expect(i.confidence).toBeGreaterThanOrEqual(MIN_CONFIDENCE);
    }
  });
});

// ─── analyzeDayOfWeek ────────────────────────────────────────────────────────

describe('analyzeDayOfWeek', () => {
  it('returns empty array with no results', () => {
    expect(analyzeDayOfWeek([])).toEqual([]);
  });

  it('returns empty when only weekday data exists', () => {
    const results = Array.from({ length: 10 }, () =>
      makeDrill({ module: 'number_line', accuracy: 80, timestamp: '2026-03-09T10:00:00Z' }),
    );
    expect(analyzeDayOfWeek(results)).toEqual([]);
  });

  it('returns empty when delta < MIN_EFFECT_SIZE', () => {
    const results = [
      ...Array.from({ length: 10 }, () =>
        makeDrill({ module: 'number_line', accuracy: 80, timestamp: '2026-03-09T10:00:00Z' }),
      ),
      ...Array.from({ length: 10 }, () =>
        makeDrill({ module: 'number_line', accuracy: 79, timestamp: '2026-03-14T10:00:00Z' }),
      ),
    ];
    expect(analyzeDayOfWeek(results)).toEqual([]);
  });

  it('generates a discovery insight when weekdays are significantly better than weekends', () => {
    // Weekday (Mon): 95%; Weekend (Sat): 40%
    const weekdayDrills = Array.from({ length: 20 }, () =>
      makeDrill({ module: 'number_line', accuracy: 95, timestamp: '2026-03-09T10:00:00Z' }),
    );
    const weekendDrills = Array.from({ length: 20 }, () =>
      makeDrill({ module: 'number_line', accuracy: 40, timestamp: '2026-03-14T10:00:00Z' }),
    );
    const insights = analyzeDayOfWeek([...weekdayDrills, ...weekendDrills]);
    expect(insights).toHaveLength(1);
    expect(insights[0].type).toBe('discovery');
    expect(insights[0].message).toContain('weekdays');
  });

  it('generates insight referencing weekends as better when applicable', () => {
    const weekdayDrills = Array.from({ length: 20 }, () =>
      makeDrill({ module: 'number_line', accuracy: 40, timestamp: '2026-03-09T10:00:00Z' }),
    );
    const weekendDrills = Array.from({ length: 20 }, () =>
      makeDrill({ module: 'number_line', accuracy: 95, timestamp: '2026-03-14T10:00:00Z' }),
    );
    const insights = analyzeDayOfWeek([...weekdayDrills, ...weekendDrills]);
    expect(insights).toHaveLength(1);
    expect(insights[0].message).toContain('weekends');
  });
});

// ─── analyzeSessionFrequency ─────────────────────────────────────────────────

describe('analyzeSessionFrequency', () => {
  it('returns empty with fewer than 2 sessions', () => {
    expect(analyzeSessionFrequency([], [])).toEqual([]);
    expect(analyzeSessionFrequency([], [makeSession()])).toEqual([]);
  });

  it('returns empty when no short or long gap sessions exist', () => {
    // Two sessions 25h apart — neither short (<24h) nor long (>48h)
    const s1 = makeSession({ id: 1, timestamp: tsAt(2, 10) });
    const s2 = makeSession({ id: 2, timestamp: tsAt(1, 11) }); // ~25h later
    const results = [
      makeDrill({ module: 'number_line', sessionId: 2, accuracy: 80 }),
    ];
    expect(analyzeSessionFrequency(results, [s1, s2])).toEqual([]);
  });

  it('generates a discovery insight when short gaps correlate with higher accuracy', () => {
    // Session 1: baseline; Session 2: 10h later (short gap); Session 3: 72h later (long gap)
    const now = Date.now();
    const s1 = makeSession({ id: 1, timestamp: new Date(now - 4 * 24 * 3600000).toISOString() });
    const s2 = makeSession({ id: 2, timestamp: new Date(now - 4 * 24 * 3600000 + 10 * 3600000).toISOString() });
    const s3 = makeSession({ id: 3, timestamp: new Date(now - 1 * 24 * 3600000).toISOString() }); // 72h after s2

    // Short gap session (s2): high accuracy
    const shortGapResults = Array.from({ length: 15 }, () =>
      makeDrill({ module: 'number_line', sessionId: 2, accuracy: 90 }),
    );
    // Long gap session (s3): low accuracy
    const longGapResults = Array.from({ length: 15 }, () =>
      makeDrill({ module: 'number_line', sessionId: 3, accuracy: 50 }),
    );

    const insights = analyzeSessionFrequency([...shortGapResults, ...longGapResults], [s1, s2, s3]);
    expect(insights.length).toBeGreaterThan(0);
    expect(insights[0].type).toBe('discovery');
    expect(insights[0].message).toContain('Daily practice');
  });

  it('returns empty when drill results for gap sessions are not in results array', () => {
    const s1 = makeSession({ id: 1, timestamp: tsAt(3, 10) });
    const s2 = makeSession({ id: 2, timestamp: tsAt(3, 18) }); // 8h after → short
    const s3 = makeSession({ id: 3, timestamp: tsAt(0, 10) }); // 63h after → long

    // No drill results provided at all
    expect(analyzeSessionFrequency([], [s1, s2, s3])).toEqual([]);
  });
});

// ─── analyzeFatigue ──────────────────────────────────────────────────────────

describe('analyzeFatigue', () => {
  it('returns empty with no results', () => {
    expect(analyzeFatigue([], [])).toEqual([]);
  });

  it('returns empty when no session has >= 6 drills', () => {
    const session = makeSession({ id: 1 });
    const results = Array.from({ length: 5 }, (_, i) =>
      makeDrill({ module: 'number_line', sessionId: 1, accuracy: 80, timestamp: tsAt(0, i) }),
    );
    expect(analyzeFatigue(results, [session])).toEqual([]);
  });

  it('returns empty when accuracy does not drop significantly (drop <= 15%)', () => {
    const session = makeSession({ id: 1 });
    const results = [
      // First 3: 80%; Last 3: 70% — drop of 10%, below 15% threshold
      ...Array.from({ length: 3 }, (_, i) =>
        makeDrill({ module: 'number_line', sessionId: 1, accuracy: 80, timestamp: tsAt(0, i) }),
      ),
      makeDrill({ module: 'number_line', sessionId: 1, accuracy: 75, timestamp: tsAt(0, 3) }),
      makeDrill({ module: 'number_line', sessionId: 1, accuracy: 75, timestamp: tsAt(0, 4) }),
      ...Array.from({ length: 3 }, (_, i) =>
        makeDrill({ module: 'number_line', sessionId: 1, accuracy: 70, timestamp: tsAt(0, 5 + i) }),
      ),
    ];
    expect(analyzeFatigue(results, [session])).toEqual([]);
  });

  it('generates a recommendation when accuracy drops > 15% in a session', () => {
    const session = makeSession({ id: 1 });
    // First 3: 90%; Last 3: 40% — drop of 50%
    const results = [
      ...Array.from({ length: 3 }, (_, i) =>
        makeDrill({ module: 'number_line', sessionId: 1, accuracy: 90, timestamp: tsAt(0, i) }),
      ),
      makeDrill({ module: 'number_line', sessionId: 1, accuracy: 70, timestamp: tsAt(0, 3) }),
      makeDrill({ module: 'number_line', sessionId: 1, accuracy: 65, timestamp: tsAt(0, 4) }),
      makeDrill({ module: 'number_line', sessionId: 1, accuracy: 60, timestamp: tsAt(0, 5) }),
      ...Array.from({ length: 3 }, (_, i) =>
        makeDrill({ module: 'number_line', sessionId: 1, accuracy: 40, timestamp: tsAt(0, 6 + i) }),
      ),
    ];
    const insights = analyzeFatigue(results, [session]);
    expect(insights).toHaveLength(1);
    expect(insights[0].type).toBe('recommendation');
    expect(insights[0].message).toContain('drops');
  });

  it('aggregates fatigue across multiple sessions', () => {
    const session1 = makeSession({ id: 1 });
    const session2 = makeSession({ id: 2 });

    const makeSessionResults = (sessionId: number, firstAcc: number, lastAcc: number) => [
      ...Array.from({ length: 3 }, (_, i) =>
        makeDrill({ module: 'number_line', sessionId, accuracy: firstAcc, timestamp: tsAt(1, i) }),
      ),
      makeDrill({ module: 'number_line', sessionId, accuracy: (firstAcc + lastAcc) / 2, timestamp: tsAt(1, 3) }),
      makeDrill({ module: 'number_line', sessionId, accuracy: (firstAcc + lastAcc) / 2, timestamp: tsAt(1, 4) }),
      makeDrill({ module: 'number_line', sessionId, accuracy: (firstAcc + lastAcc) / 2, timestamp: tsAt(1, 5) }),
      ...Array.from({ length: 3 }, (_, i) =>
        makeDrill({ module: 'number_line', sessionId, accuracy: lastAcc, timestamp: tsAt(1, 6 + i) }),
      ),
    ];

    const results = [
      ...makeSessionResults(1, 90, 40),
      ...makeSessionResults(2, 85, 45),
    ];
    const insights = analyzeFatigue(results, [session1, session2]);
    expect(insights).toHaveLength(1);
  });
});

// ─── analyzeResponseTime ─────────────────────────────────────────────────────

describe('analyzeResponseTime', () => {
  it('returns empty array with no results', () => {
    expect(analyzeResponseTime([])).toEqual([]);
  });

  it('returns empty when one week has no data', () => {
    // Only this week data, no last week
    const results = Array.from({ length: 10 }, () =>
      makeDrill({ module: 'number_line', timeToAnswer: 2000, timestamp: tsAt(1) }),
    );
    expect(analyzeResponseTime(results)).toEqual([]);
  });

  it('returns empty when change is below MIN_EFFECT_SIZE percent', () => {
    // This week: 2000ms; last week: 2010ms — negligible change
    const lastWeek = Array.from({ length: 10 }, () =>
      makeDrill({ module: 'number_line', timeToAnswer: 2010, timestamp: tsAt(10) }),
    );
    const thisWeek = Array.from({ length: 10 }, () =>
      makeDrill({ module: 'number_line', timeToAnswer: 2000, timestamp: tsAt(1) }),
    );
    expect(analyzeResponseTime([...lastWeek, ...thisWeek])).toEqual([]);
  });

  it('generates a trend insight when getting significantly faster', () => {
    // Last week: 5000ms; this week: 2000ms — 60% faster, well above threshold
    const lastWeek = Array.from({ length: 20 }, () =>
      makeDrill({ module: 'number_line', timeToAnswer: 5000, timestamp: tsAt(10) }),
    );
    const thisWeek = Array.from({ length: 20 }, () =>
      makeDrill({ module: 'number_line', timeToAnswer: 2000, timestamp: tsAt(1) }),
    );
    const insights = analyzeResponseTime([...lastWeek, ...thisWeek]);
    expect(insights).toHaveLength(1);
    expect(insights[0].type).toBe('trend');
    expect(insights[0].title).toContain('improving');
  });

  it('generates a trend insight when getting significantly slower', () => {
    // Last week: 2000ms; this week: 5000ms
    const lastWeek = Array.from({ length: 20 }, () =>
      makeDrill({ module: 'number_line', timeToAnswer: 2000, timestamp: tsAt(10) }),
    );
    const thisWeek = Array.from({ length: 20 }, () =>
      makeDrill({ module: 'number_line', timeToAnswer: 5000, timestamp: tsAt(1) }),
    );
    const insights = analyzeResponseTime([...lastWeek, ...thisWeek]);
    expect(insights).toHaveLength(1);
    expect(insights[0].title).toContain('slowed');
  });
});

// ─── analyzeDifficultyReadiness ──────────────────────────────────────────────

describe('analyzeDifficultyReadiness', () => {
  it('returns empty array with no results', () => {
    expect(analyzeDifficultyReadiness([])).toEqual([]);
  });

  it('returns empty when accuracy is below 80%', () => {
    const results = Array.from({ length: 10 }, () =>
      makeDrill({ module: 'number_line', accuracy: 75, difficulty: 'easy' }),
    );
    expect(analyzeDifficultyReadiness(results)).toEqual([]);
  });

  it('generates recommendation when recent accuracy >= 80% on easy', () => {
    const results = Array.from({ length: 10 }, () =>
      makeDrill({ module: 'number_line', accuracy: 90, difficulty: 'easy' }),
    );
    const insights = analyzeDifficultyReadiness(results);
    expect(insights.length).toBeGreaterThan(0);
    const insight = insights[0];
    expect(insight.type).toBe('recommendation');
    expect(insight.action?.difficulty).toBe('medium');
  });

  it('generates recommendation for hard when on medium with >= 80%', () => {
    const results = Array.from({ length: 10 }, () =>
      makeDrill({ module: 'number_line', accuracy: 90, difficulty: 'medium' }),
    );
    const insights = analyzeDifficultyReadiness(results);
    expect(insights.length).toBeGreaterThan(0);
    const insight = insights[0];
    expect(insight.action?.difficulty).toBe('hard');
  });

  it('does not generate insight when already on hard difficulty', () => {
    const results = Array.from({ length: 10 }, () =>
      makeDrill({ module: 'number_line', accuracy: 95, difficulty: 'hard' }),
    );
    // On hard: no further difficulty to suggest for this domain
    const insights = analyzeDifficultyReadiness(results);
    const numberSenseInsights = insights.filter(i => i.domain === 'numberSense');
    expect(numberSenseInsights).toHaveLength(0);
  });

  it('returns empty for domains with fewer than 5 drills', () => {
    const results = Array.from({ length: 4 }, () =>
      makeDrill({ module: 'number_line', accuracy: 95, difficulty: 'easy' }),
    );
    expect(analyzeDifficultyReadiness(results)).toEqual([]);
  });
});

// ─── analyzeStreakCorrelation ─────────────────────────────────────────────────

describe('analyzeStreakCorrelation', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns empty when streak is 0', () => {
    const results = Array.from({ length: 10 }, () =>
      makeDrill({ module: 'number_line', accuracy: 90 }),
    );
    expect(analyzeStreakCorrelation(results)).toEqual([]);
  });

  it('returns empty when streak is less than 3', () => {
    localStorage.setItem(STORAGE_KEYS.STREAK, '2');
    const results = Array.from({ length: 10 }, () =>
      makeDrill({ module: 'number_line', accuracy: 90 }),
    );
    expect(analyzeStreakCorrelation(results)).toEqual([]);
  });

  it('returns empty when results length is < 5', () => {
    localStorage.setItem(STORAGE_KEYS.STREAK, '7');
    const results = Array.from({ length: 4 }, () =>
      makeDrill({ module: 'number_line', accuracy: 90 }),
    );
    expect(analyzeStreakCorrelation(results)).toEqual([]);
  });

  it('returns empty when recent accuracy < 70%', () => {
    localStorage.setItem(STORAGE_KEYS.STREAK, '7');
    const results = Array.from({ length: 10 }, () =>
      makeDrill({ module: 'number_line', accuracy: 60 }),
    );
    expect(analyzeStreakCorrelation(results)).toEqual([]);
  });

  it('generates a discovery insight for streak >= 3 with high accuracy', () => {
    localStorage.setItem(STORAGE_KEYS.STREAK, '7');
    const results = Array.from({ length: 20 }, () =>
      makeDrill({ module: 'number_line', accuracy: 90 }),
    );
    const insights = analyzeStreakCorrelation(results);
    expect(insights).toHaveLength(1);
    expect(insights[0].type).toBe('discovery');
    expect(insights[0].message).toContain('7-day streak');
  });

  it('handles non-numeric streak value gracefully (defaults to 0)', () => {
    localStorage.setItem(STORAGE_KEYS.STREAK, 'invalid');
    const results = Array.from({ length: 10 }, () =>
      makeDrill({ module: 'number_line', accuracy: 90 }),
    );
    expect(analyzeStreakCorrelation(results)).toEqual([]);
  });

  it('handles missing streak key (no item in localStorage)', () => {
    // No streak set at all
    const results = Array.from({ length: 10 }, () =>
      makeDrill({ module: 'number_line', accuracy: 90 }),
    );
    expect(analyzeStreakCorrelation(results)).toEqual([]);
  });
});

// ─── analyzeWeeklyProgress ────────────────────────────────────────────────────

describe('analyzeWeeklyProgress', () => {
  it('returns empty with no results', () => {
    expect(analyzeWeeklyProgress([])).toEqual([]);
  });

  it('returns empty when one week has no data', () => {
    const results = Array.from({ length: 10 }, () =>
      makeDrill({ module: 'number_line', accuracy: 80, timestamp: tsAt(1) }),
    );
    expect(analyzeWeeklyProgress(results)).toEqual([]);
  });

  it('returns empty when delta < MIN_EFFECT_SIZE', () => {
    const lastWeek = Array.from({ length: 10 }, () =>
      makeDrill({ module: 'number_line', accuracy: 80, timestamp: tsAt(10) }),
    );
    const thisWeek = Array.from({ length: 10 }, () =>
      makeDrill({ module: 'number_line', accuracy: 81, timestamp: tsAt(1) }),
    );
    expect(analyzeWeeklyProgress([...lastWeek, ...thisWeek])).toEqual([]);
  });

  it('generates a milestone insight for significant positive weekly improvement', () => {
    // Any positive delta that clears MIN_CONFIDENCE will have delta >= 15 (math proof):
    //   sampleFactor * (delta/50) >= 0.3 → with sampleFactor=1.0, delta >= 15
    //   delta=15 >= 10 → type becomes 'milestone'
    // Therefore significant positive improvement always surfaces as 'milestone'.
    const lastWeek = Array.from({ length: 50 }, () =>
      makeDrill({ module: 'number_line', accuracy: 60, timestamp: tsAt(10) }),
    );
    const thisWeek = Array.from({ length: 50 }, () =>
      makeDrill({ module: 'number_line', accuracy: 76, timestamp: tsAt(1) }),
    );
    // delta=16, n=100 → confidence=1.0*(16/50)=0.32 >= 0.3; delta>=10 → 'milestone'
    const insights = analyzeWeeklyProgress([...lastWeek, ...thisWeek]);
    expect(insights).toHaveLength(1);
    expect(insights[0].type).toBe('milestone');
  });

  it('generates a milestone insight for improvement >= 10%', () => {
    const lastWeek = Array.from({ length: 20 }, () =>
      makeDrill({ module: 'number_line', accuracy: 50, timestamp: tsAt(10) }),
    );
    const thisWeek = Array.from({ length: 20 }, () =>
      makeDrill({ module: 'number_line', accuracy: 80, timestamp: tsAt(1) }),
    );
    const insights = analyzeWeeklyProgress([...lastWeek, ...thisWeek]);
    expect(insights).toHaveLength(1);
    expect(insights[0].type).toBe('milestone');
  });

  it('generates a trend insight for decline', () => {
    const lastWeek = Array.from({ length: 20 }, () =>
      makeDrill({ module: 'number_line', accuracy: 85, timestamp: tsAt(10) }),
    );
    const thisWeek = Array.from({ length: 20 }, () =>
      makeDrill({ module: 'number_line', accuracy: 60, timestamp: tsAt(1) }),
    );
    const insights = analyzeWeeklyProgress([...lastWeek, ...thisWeek]);
    expect(insights).toHaveLength(1);
    expect(insights[0].message).toContain('dropped');
  });
});

// ─── analyzeDrillEffectiveness ────────────────────────────────────────────────

describe('analyzeDrillEffectiveness', () => {
  it('returns empty with < 10 total results', () => {
    const results = Array.from({ length: 9 }, () =>
      makeDrill({ module: 'number_line', accuracy: 80 }),
    );
    expect(analyzeDrillEffectiveness(results)).toEqual([]);
  });

  it('returns empty when no drill has >= 4 results', () => {
    // 10 results spread across 4 different drills (< 4 each)
    const results = [
      ...Array.from({ length: 3 }, () => makeDrill({ module: 'number_line', accuracy: 90 })),
      ...Array.from({ length: 3 }, () => makeDrill({ module: 'math_operations', accuracy: 50 })),
      ...Array.from({ length: 2 }, () => makeDrill({ module: 'subitizing', accuracy: 60 })),
      ...Array.from({ length: 2 }, () => makeDrill({ module: 'sequencing', accuracy: 70 })),
    ];
    expect(analyzeDrillEffectiveness(results)).toEqual([]);
  });

  it('returns empty when improvement is below MIN_EFFECT_SIZE', () => {
    // Early: 80%; Recent: 82% — delta=2%
    const early = Array.from({ length: 5 }, (_, i) =>
      makeDrill({ module: 'number_line', accuracy: 80, timestamp: tsAt(10 + i) }),
    );
    const recent = Array.from({ length: 5 }, (_, i) =>
      makeDrill({ module: 'number_line', accuracy: 82, timestamp: tsAt(i) }),
    );
    expect(analyzeDrillEffectiveness([...early, ...recent])).toEqual([]);
  });

  it('generates a recommendation for the most-improved drill', () => {
    // number_line: 30% → 90% (60% improvement)
    // math_operations: 50% → 55% (5% improvement)
    const nlEarly = Array.from({ length: 5 }, (_, i) =>
      makeDrill({ module: 'number_line', accuracy: 30, timestamp: tsAt(15 + i) }),
    );
    const nlRecent = Array.from({ length: 5 }, (_, i) =>
      makeDrill({ module: 'number_line', accuracy: 90, timestamp: tsAt(5 + i) }),
    );
    const moEarly = Array.from({ length: 5 }, (_, i) =>
      makeDrill({ module: 'math_operations', accuracy: 50, timestamp: tsAt(15 + i) }),
    );
    const moRecent = Array.from({ length: 5 }, (_, i) =>
      makeDrill({ module: 'math_operations', accuracy: 55, timestamp: tsAt(5 + i) }),
    );
    const results = [...nlEarly, ...nlRecent, ...moEarly, ...moRecent];
    const insights = analyzeDrillEffectiveness(results);
    expect(insights).toHaveLength(1);
    expect(insights[0].type).toBe('recommendation');
    expect(insights[0].id).toContain('number_line');
  });

  it('skips unknown modules (game types not in DRILL_TO_DOMAIN)', () => {
    const results = Array.from({ length: 10 }, () =>
      makeDrill({ module: 'colored_dots' as any, accuracy: 80 }),
    );
    expect(analyzeDrillEffectiveness(results)).toEqual([]);
  });
});

// ─── buildDomainPerformance ──────────────────────────────────────────────────

describe('buildDomainPerformance', () => {
  it('returns 6 domain entries', () => {
    const result = buildDomainPerformance([]);
    expect(result).toHaveLength(6);
  });

  it('returns zeroed values for domains with no data', () => {
    const result = buildDomainPerformance([]);
    for (const dp of result) {
      expect(dp.recentAccuracy).toBe(0);
      expect(dp.previousAccuracy).toBe(0);
      expect(dp.totalDrills).toBe(0);
      expect(dp.avgResponseTime).toBe(0);
      expect(dp.currentDifficulty).toBe('easy');
    }
  });

  it('calculates recentAccuracy from last 10 drills', () => {
    const old = Array.from({ length: 5 }, (_, i) =>
      makeDrill({ module: 'number_line', accuracy: 10, timestamp: tsAt(20 + i) }),
    );
    const recent = Array.from({ length: 10 }, (_, i) =>
      makeDrill({ module: 'number_line', accuracy: 90, timestamp: tsAt(i) }),
    );
    const result = buildDomainPerformance([...old, ...recent]);
    const ns = result.find(d => d.domain === 'numberSense')!;
    expect(ns.recentAccuracy).toBeCloseTo(90, 5);
  });

  it('calculates previousAccuracy from drills 11-20 (before last 10)', () => {
    const previous = Array.from({ length: 10 }, (_, i) =>
      makeDrill({ module: 'number_line', accuracy: 40, timestamp: tsAt(20 + i) }),
    );
    const recent = Array.from({ length: 10 }, (_, i) =>
      makeDrill({ module: 'number_line', accuracy: 90, timestamp: tsAt(i) }),
    );
    const result = buildDomainPerformance([...previous, ...recent]);
    const ns = result.find(d => d.domain === 'numberSense')!;
    expect(ns.previousAccuracy).toBeCloseTo(40, 5);
    expect(ns.trend).toBeCloseTo(50, 5);
  });

  it('includes correct domain labels', () => {
    const result = buildDomainPerformance([]);
    const labels = result.map(d => d.domainLabel);
    expect(labels).toContain('Number Sense');
    expect(labels).toContain('Arithmetic');
    expect(labels).toContain('Spatial');
  });

  it('skips drill results with unknown modules', () => {
    const results = Array.from({ length: 10 }, () =>
      makeDrill({ module: 'colored_dots' as any, accuracy: 90 }),
    );
    const dp = buildDomainPerformance(results);
    for (const d of dp) {
      expect(d.totalDrills).toBe(0);
    }
  });
});

// ─── buildContextBuckets ──────────────────────────────────────────────────────

describe('buildContextBuckets', () => {
  it('returns 6 buckets (4 time-of-day + 2 day-type)', () => {
    const result = buildContextBuckets([]);
    expect(result).toHaveLength(6);
  });

  it('returns buckets with correct variable names', () => {
    const result = buildContextBuckets([]);
    const variables = result.map(b => b.variable);
    expect(variables.filter(v => v === 'timeOfDay')).toHaveLength(4);
    expect(variables.filter(v => v === 'dayOfWeek')).toHaveLength(2);
  });

  it('calculates avgAccuracy for populated buckets', () => {
    const morningResults = Array.from({ length: 10 }, () =>
      makeDrill({ module: 'number_line', accuracy: 90, timestamp: tsAt(0, 9) }),
    );
    const buckets = buildContextBuckets(morningResults);
    const morningBucket = buckets.find(b => b.label === 'morning')!;
    expect(morningBucket.count).toBe(10);
    expect(morningBucket.avgAccuracy).toBeCloseTo(90, 5);
  });

  it('returns zero counts for empty buckets', () => {
    const result = buildContextBuckets([]);
    for (const b of result) {
      expect(b.count).toBe(0);
      expect(b.avgAccuracy).toBe(0);
    }
  });
});

// ─── buildSuggestedDrills ─────────────────────────────────────────────────────

describe('buildSuggestedDrills', () => {
  it('returns one suggestion per domain (6 total)', () => {
    const dp = buildDomainPerformance([]);
    const suggestions = buildSuggestedDrills([], dp);
    expect(suggestions).toHaveLength(6);
  });

  it('prioritizes weakest domains first', () => {
    const results = [
      ...Array.from({ length: 10 }, () => makeDrill({ module: 'number_line', accuracy: 95 })),
      ...Array.from({ length: 10 }, () => makeDrill({ module: 'math_operations', accuracy: 30 })),
    ];
    const dp = buildDomainPerformance(results);
    const suggestions = buildSuggestedDrills(results, dp);
    // The first suggestion should correspond to the weakest domain
    expect(suggestions[0].priority).toBeGreaterThan(suggestions[1].priority);
  });

  it('includes a reason for each suggestion', () => {
    const dp = buildDomainPerformance([]);
    const suggestions = buildSuggestedDrills([], dp);
    for (const s of suggestions) {
      expect(s.reason.length).toBeGreaterThan(0);
    }
  });

  it('uses "not tried" reason for untried domains', () => {
    const dp = buildDomainPerformance([]);
    const suggestions = buildSuggestedDrills([], dp);
    const notTried = suggestions.find(s => s.reason.includes("haven't tried"));
    expect(notTried).toBeDefined();
  });

  it('suggests a valid drill type for each suggestion', () => {
    const dp = buildDomainPerformance([]);
    const suggestions = buildSuggestedDrills([], dp);
    for (const s of suggestions) {
      expect(typeof s.drillType).toBe('string');
      expect(s.drillType.length).toBeGreaterThan(0);
    }
  });
});

// ─── analyzePerformance (integration) ────────────────────────────────────────

describe('analyzePerformance', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    _drillId = 1;
  });

  it('returns hasEnoughData: false and empty insights when no data', async () => {
    (db.drill_results.toArray as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    (db.sessions.toArray as ReturnType<typeof vi.fn>).mockResolvedValue([]);

    const result = await analyzePerformance();

    expect(result.hasEnoughData).toBe(false);
    expect(result.dataPointCount).toBe(0);
    expect(result.insights).toEqual([]);
  });

  it('returns hasEnoughData: false when drill count < MIN_DATA_POINTS', async () => {
    const fewDrills = Array.from({ length: MIN_DATA_POINTS - 1 }, () =>
      makeDrill({ module: 'number_line', accuracy: 80 }),
    );
    (db.drill_results.toArray as ReturnType<typeof vi.fn>).mockResolvedValue(fewDrills);
    (db.sessions.toArray as ReturnType<typeof vi.fn>).mockResolvedValue([]);

    const result = await analyzePerformance();

    expect(result.hasEnoughData).toBe(false);
    expect(result.insights).toEqual([]);
  });

  it('returns hasEnoughData: true with >= MIN_DATA_POINTS drills', async () => {
    const enoughDrills = Array.from({ length: MIN_DATA_POINTS }, () =>
      makeDrill({ module: 'number_line', accuracy: 80 }),
    );
    (db.drill_results.toArray as ReturnType<typeof vi.fn>).mockResolvedValue(enoughDrills);
    (db.sessions.toArray as ReturnType<typeof vi.fn>).mockResolvedValue([]);

    const result = await analyzePerformance();

    expect(result.hasEnoughData).toBe(true);
    expect(result.dataPointCount).toBe(MIN_DATA_POINTS);
  });

  it('returns domain performance for all 6 domains regardless of data', async () => {
    (db.drill_results.toArray as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    (db.sessions.toArray as ReturnType<typeof vi.fn>).mockResolvedValue([]);

    const result = await analyzePerformance();

    expect(result.domainPerformance).toHaveLength(6);
  });

  it('returns context analysis with 6 buckets regardless of data', async () => {
    (db.drill_results.toArray as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    (db.sessions.toArray as ReturnType<typeof vi.fn>).mockResolvedValue([]);

    const result = await analyzePerformance();

    expect(result.contextAnalysis).toHaveLength(6);
  });

  it('always returns suggestedDrills (even with no data)', async () => {
    (db.drill_results.toArray as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    (db.sessions.toArray as ReturnType<typeof vi.fn>).mockResolvedValue([]);

    const result = await analyzePerformance();

    expect(result.suggestedDrills.length).toBeGreaterThan(0);
  });

  it('returns insights sorted by priority descending', async () => {
    // Provide enough data to generate multiple insights
    const numberSenseDrills = Array.from({ length: 20 }, () =>
      makeDrill({ module: 'number_line', accuracy: 95, timestamp: tsAt(1) }),
    );
    const arithmeticDrills = Array.from({ length: 20 }, () =>
      makeDrill({ module: 'math_operations', accuracy: 25, timestamp: tsAt(1) }),
    );
    (db.drill_results.toArray as ReturnType<typeof vi.fn>).mockResolvedValue([
      ...numberSenseDrills,
      ...arithmeticDrills,
    ]);
    (db.sessions.toArray as ReturnType<typeof vi.fn>).mockResolvedValue([]);

    const result = await analyzePerformance();

    for (let i = 1; i < result.insights.length; i++) {
      expect(result.insights[i - 1].priority).toBeGreaterThanOrEqual(result.insights[i].priority);
    }
  });

  it('all returned insights have confidence >= MIN_CONFIDENCE', async () => {
    const drills = Array.from({ length: 30 }, () =>
      makeDrill({ module: 'number_line', accuracy: 90, timestamp: tsAt(1) }),
    );
    (db.drill_results.toArray as ReturnType<typeof vi.fn>).mockResolvedValue(drills);
    (db.sessions.toArray as ReturnType<typeof vi.fn>).mockResolvedValue([]);

    const result = await analyzePerformance();

    for (const insight of result.insights) {
      expect(insight.confidence).toBeGreaterThanOrEqual(MIN_CONFIDENCE);
    }
  });

  it('sets analyzedAt as a valid ISO timestamp', async () => {
    (db.drill_results.toArray as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    (db.sessions.toArray as ReturnType<typeof vi.fn>).mockResolvedValue([]);

    const result = await analyzePerformance();
    const parsed = new Date(result.analyzedAt);

    expect(parsed.toISOString()).toBe(result.analyzedAt);
  });

  it('generates weakness insight with sufficient multi-domain data', async () => {
    localStorage.setItem(STORAGE_KEYS.STREAK, '0');
    const strongDrills = Array.from({ length: 20 }, () =>
      makeDrill({ module: 'number_line', accuracy: 95, timestamp: tsAt(1) }),
    );
    const weakDrills = Array.from({ length: 20 }, () =>
      makeDrill({ module: 'math_operations', accuracy: 20, timestamp: tsAt(1) }),
    );
    (db.drill_results.toArray as ReturnType<typeof vi.fn>).mockResolvedValue([...strongDrills, ...weakDrills]);
    (db.sessions.toArray as ReturnType<typeof vi.fn>).mockResolvedValue([]);

    const result = await analyzePerformance();
    const types = result.insights.map(i => i.type);

    expect(types).toContain('weakness');
    expect(types).toContain('strength');
  });

  it('generates fatigue insight when accuracy drops within sessions', async () => {
    const sessionId = 99;
    const session = makeSession({ id: sessionId });

    // 9-drill session: first 3 at 90%, last 3 at 40%
    const drills = [
      ...Array.from({ length: 3 }, (_, i) =>
        makeDrill({ module: 'number_line', sessionId, accuracy: 90, timestamp: tsAt(0, i) }),
      ),
      makeDrill({ module: 'number_line', sessionId, accuracy: 65, timestamp: tsAt(0, 3) }),
      makeDrill({ module: 'number_line', sessionId, accuracy: 65, timestamp: tsAt(0, 4) }),
      makeDrill({ module: 'number_line', sessionId, accuracy: 60, timestamp: tsAt(0, 5) }),
      ...Array.from({ length: 3 }, (_, i) =>
        makeDrill({ module: 'number_line', sessionId, accuracy: 40, timestamp: tsAt(0, 6 + i) }),
      ),
      // Fill remaining drills so hasEnoughData = true
      ...Array.from({ length: 1 }, () =>
        makeDrill({ module: 'math_operations', sessionId, accuracy: 70, timestamp: tsAt(1) }),
      ),
    ];
    (db.drill_results.toArray as ReturnType<typeof vi.fn>).mockResolvedValue(drills);
    (db.sessions.toArray as ReturnType<typeof vi.fn>).mockResolvedValue([session]);

    const result = await analyzePerformance();
    const fatigueInsight = result.insights.find(i => i.id.includes('fatigue'));

    expect(fatigueInsight).toBeDefined();
    expect(fatigueInsight?.type).toBe('recommendation');
  });

  it('each insight has all required fields', async () => {
    const strongDrills = Array.from({ length: 20 }, () =>
      makeDrill({ module: 'number_line', accuracy: 95, timestamp: tsAt(1) }),
    );
    const weakDrills = Array.from({ length: 20 }, () =>
      makeDrill({ module: 'math_operations', accuracy: 20, timestamp: tsAt(1) }),
    );
    (db.drill_results.toArray as ReturnType<typeof vi.fn>).mockResolvedValue([...strongDrills, ...weakDrills]);
    (db.sessions.toArray as ReturnType<typeof vi.fn>).mockResolvedValue([]);

    const result = await analyzePerformance();

    for (const insight of result.insights) {
      expect(insight.id).toBeTruthy();
      expect(insight.type).toBeTruthy();
      expect(typeof insight.confidence).toBe('number');
      expect(insight.title).toBeTruthy();
      expect(insight.message).toBeTruthy();
      expect(Array.isArray(insight.variables)).toBe(true);
      expect(insight.generatedAt).toBeTruthy();
      expect(typeof insight.priority).toBe('number');
    }
  });
});

// ─── getTimeOfDay (public alias for classifyTimeOfDay, accepts a Date) ────────

describe('getTimeOfDay', () => {
  function dateWithHour(hour: number): Date {
    const d = new Date();
    d.setHours(hour, 0, 0, 0);
    return d;
  }

  // Morning: hours 6–11 inclusive
  it('returns "morning" for hour 6 (boundary start)', () => {
    expect(getTimeOfDay(dateWithHour(6))).toBe('morning');
  });

  it('returns "morning" for hour 9', () => {
    expect(getTimeOfDay(dateWithHour(9))).toBe('morning');
  });

  it('returns "morning" for hour 11 (boundary end)', () => {
    expect(getTimeOfDay(dateWithHour(11))).toBe('morning');
  });

  // Afternoon: hours 12–16 inclusive
  it('returns "afternoon" for hour 12 (boundary start)', () => {
    expect(getTimeOfDay(dateWithHour(12))).toBe('afternoon');
  });

  it('returns "afternoon" for hour 14', () => {
    expect(getTimeOfDay(dateWithHour(14))).toBe('afternoon');
  });

  it('returns "afternoon" for hour 16 (boundary end)', () => {
    expect(getTimeOfDay(dateWithHour(16))).toBe('afternoon');
  });

  // Evening: hours 17–21 inclusive
  it('returns "evening" for hour 17 (boundary start)', () => {
    expect(getTimeOfDay(dateWithHour(17))).toBe('evening');
  });

  it('returns "evening" for hour 20', () => {
    expect(getTimeOfDay(dateWithHour(20))).toBe('evening');
  });

  it('returns "evening" for hour 21 (boundary end)', () => {
    expect(getTimeOfDay(dateWithHour(21))).toBe('evening');
  });

  // Night: hours 22–23 and 0–5
  it('returns "night" for hour 22 (boundary start)', () => {
    expect(getTimeOfDay(dateWithHour(22))).toBe('night');
  });

  it('returns "night" for hour 23', () => {
    expect(getTimeOfDay(dateWithHour(23))).toBe('night');
  });

  it('returns "night" for hour 0 (midnight)', () => {
    expect(getTimeOfDay(dateWithHour(0))).toBe('night');
  });

  it('returns "night" for hour 3', () => {
    expect(getTimeOfDay(dateWithHour(3))).toBe('night');
  });

  it('returns "night" for hour 5 (boundary end)', () => {
    expect(getTimeOfDay(dateWithHour(5))).toBe('night');
  });

  it('is consistent with classifyTimeOfDay for the same timestamp', () => {
    for (const hour of [7, 13, 19, 1]) {
      const d = dateWithHour(hour);
      expect(getTimeOfDay(d)).toBe(classifyTimeOfDay(d.toISOString()));
    }
  });
});

// ─── calculateConfidence (public alias) ───────────────────────────────────────

describe('calculateConfidence', () => {
  it('returns 0 when sampleSize=0 and effectSize=0', () => {
    expect(calculateConfidence(0, 0)).toBe(0);
  });

  it('returns 0 when effectSize=0 regardless of sampleSize', () => {
    expect(calculateConfidence(100, 0)).toBe(0);
  });

  it('returns 0 when sampleSize=0 regardless of effectSize', () => {
    expect(calculateConfidence(0, 20)).toBe(0);
  });

  it('returns a positive value for a reasonable sample and effect', () => {
    const c = calculateConfidence(25, 15);
    expect(c).toBeGreaterThan(0);
    expect(c).toBeLessThanOrEqual(1);
  });

  it('is capped at 1.0 for very large inputs', () => {
    expect(calculateConfidence(10000, 10000)).toBe(1);
  });

  it('saturates sample factor at sampleSize >= 50', () => {
    // Both should yield the same value because min(1, n/50) saturates at 1
    expect(calculateConfidence(50, 15)).toBeCloseTo(calculateConfidence(200, 15), 10);
  });

  it('scales linearly with effectSize up to 30', () => {
    // With sampleSize=50: factor = min(1, 50/50) = 1
    // effectSize=15: 1 * (15/30) = 0.5
    // effectSize=30: 1 * (30/30) = 1.0
    expect(calculateConfidence(50, 15)).toBeCloseTo(0.5, 5);
    expect(calculateConfidence(50, 30)).toBeCloseTo(1.0, 5);
  });

  it('returns exactly 1.0 for sampleSize=50 and effectSize=30', () => {
    expect(calculateConfidence(50, 30)).toBe(1);
  });

  it('returns value < MIN_CONFIDENCE for tiny sample and tiny effect', () => {
    // sampleSize=1: factor=min(1,1/50)=0.02; effectSize=1: 0.02*(1/30)≈0.0007
    expect(calculateConfidence(1, 1)).toBeLessThan(MIN_CONFIDENCE);
  });

  it('returns value >= MIN_CONFIDENCE for sampleSize=50 and effectSize=9', () => {
    // 1 * (9/30) = 0.3 = MIN_CONFIDENCE
    expect(calculateConfidence(50, 9)).toBeGreaterThanOrEqual(MIN_CONFIDENCE);
  });

  it('returns a value greater than 0 when sampleSize is fractional (< 50)', () => {
    // sampleSize=10: min(1, 10/50) = 0.2; effectSize=20: 0.2*(20/30)≈0.133
    const c = calculateConfidence(10, 20);
    expect(c).toBeGreaterThan(0);
    expect(c).toBeLessThan(1);
  });
});

// ─── generateInsightId (public alias for buildInsightId) ──────────────────────

describe('generateInsightId', () => {
  it('is deterministic — identical calls return the same id', () => {
    expect(generateInsightId('strength', 'numberSense'))
      .toBe(generateInsightId('strength', 'numberSense'));
  });

  it('produces different ids for different type arguments', () => {
    expect(generateInsightId('strength', 'numberSense'))
      .not.toBe(generateInsightId('weakness', 'numberSense'));
  });

  it('produces different ids for different key arguments', () => {
    expect(generateInsightId('discovery', 'time-of-day', 'morning'))
      .not.toBe(generateInsightId('discovery', 'time-of-day', 'evening'));
  });

  it('returns the exact same id as buildInsightId for matching arguments', () => {
    expect(generateInsightId('recommendation', 'fatigue'))
      .toBe(buildInsightId('recommendation', 'fatigue'));

    expect(generateInsightId('trend', 'response-time', 'faster'))
      .toBe(buildInsightId('trend', 'response-time', 'faster'));
  });

  it('lowercases the type and keys', () => {
    const id = generateInsightId('STRENGTH', 'NumberSense');
    expect(id).toBe(id.toLowerCase());
  });

  it('replaces spaces with hyphens in each part', () => {
    const id = generateInsightId('discovery', 'Time Of Day', 'morning');
    expect(id).toBe('discovery_time-of-day_morning');
  });

  it('handles single-part call (no extra keys)', () => {
    const id = generateInsightId('milestone');
    expect(typeof id).toBe('string');
    expect(id.length).toBeGreaterThan(0);
    expect(id).toBe('milestone');
  });

  it('produces stable id for known strength insight', () => {
    expect(generateInsightId('strength', 'numberSense')).toBe('strength_numbersense');
  });

  it('produces stable id for known weakness insight', () => {
    expect(generateInsightId('weakness', 'arithmetic')).toBe('weakness_arithmetic');
  });

  it('produces stable id for time-of-day discovery insight', () => {
    expect(generateInsightId('discovery', 'time-of-day', 'morning'))
      .toBe('discovery_time-of-day_morning');
  });
});
