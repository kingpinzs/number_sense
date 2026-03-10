/**
 * Adaptive Difficulty Engine Tests
 * Story 4.4: Implement Adaptive Difficulty Engine
 *
 * Comprehensive test suite following red-green-refactor pattern
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  calculatePerformanceMetrics,
  determineAdjustment,
  getDifficultyConfig,
  getCurrentDifficulty,
  applyAdjustment,
  processSessionEnd,
  LEVEL_NAMES,
  NUMBER_LINE_CONFIGS,
  SPATIAL_ROTATION_CONFIGS,
  MATH_OPERATIONS_CONFIGS,
  type PerformanceMetrics,
  type DifficultyLevel,
  type AdjustmentResult,
} from './difficultyEngine';
import type { Session, DrillResult, DifficultyHistory } from '@/services/storage/schemas';

// Mock the database module
vi.mock('@/services/storage/db', () => ({
  db: {
    difficulty_history: {
      add: vi.fn().mockResolvedValue(1),
      where: vi.fn().mockReturnValue({
        equals: vi.fn().mockReturnValue({
          reverse: vi.fn().mockReturnValue({
            first: vi.fn().mockResolvedValue(null),
            limit: vi.fn().mockReturnValue({
              toArray: vi.fn().mockResolvedValue([]),
            }),
          }),
        }),
      }),
    },
    assessments: {
      orderBy: vi.fn().mockReturnValue({
        reverse: vi.fn().mockReturnValue({
          first: vi.fn().mockResolvedValue(null),
        }),
      }),
    },
    sessions: {
      orderBy: vi.fn().mockReturnValue({
        reverse: vi.fn().mockReturnValue({
          limit: vi.fn().mockReturnValue({
            toArray: vi.fn().mockResolvedValue([]),
          }),
        }),
      }),
    },
    drill_results: {
      where: vi.fn().mockReturnValue({
        equals: vi.fn().mockReturnValue({
          toArray: vi.fn().mockResolvedValue([]),
          reverse: vi.fn().mockReturnValue({
            limit: vi.fn().mockReturnValue({
              toArray: vi.fn().mockResolvedValue([]),
            }),
          }),
          count: vi.fn().mockResolvedValue(0),
        }),
      }),
    },
  },
}));

// Import db after mocking
import { db } from '@/services/storage/db';

// ============================================================================
// Test Helpers
// ============================================================================

function createMockSession(overrides: Partial<Session> = {}): Session {
  return {
    id: 1,
    timestamp: new Date().toISOString(),
    module: 'training',
    duration: 300000,
    completionStatus: 'completed',
    accuracy: 75,
    confidenceBefore: 3,
    confidenceAfter: 4,
    ...overrides,
  };
}

function createMockDrillResult(overrides: Partial<DrillResult> = {}): DrillResult {
  return {
    id: 1,
    sessionId: 1,
    timestamp: new Date().toISOString(),
    module: 'number_line',
    difficulty: 'medium',
    isCorrect: true,
    timeToAnswer: 3000,
    accuracy: 80,
    ...overrides,
  };
}

function createMockDifficultyHistory(overrides: Partial<DifficultyHistory> = {}): DifficultyHistory {
  return {
    id: 1,
    sessionId: 1,
    timestamp: new Date().toISOString(),
    module: 'number_line',
    previousDifficulty: 5,
    newDifficulty: 6,
    reason: 'accuracy_high',
    userAccepted: true,
    ...overrides,
  };
}

// ============================================================================
// Task 1: TypeScript Interfaces Tests
// ============================================================================

describe('TypeScript Interfaces and Types', () => {
  describe('DifficultyLevel type', () => {
    it('accepts valid levels 1-10', () => {
      const levels: DifficultyLevel[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      expect(levels).toHaveLength(10);
      levels.forEach((level) => {
        expect(level).toBeGreaterThanOrEqual(1);
        expect(level).toBeLessThanOrEqual(10);
      });
    });
  });

  describe('LEVEL_NAMES constant', () => {
    it('has names for all 10 levels', () => {
      expect(Object.keys(LEVEL_NAMES)).toHaveLength(10);
      expect(LEVEL_NAMES[1]).toBe('beginner');
      expect(LEVEL_NAMES[3]).toBe('easy');
      expect(LEVEL_NAMES[5]).toBe('medium');
      expect(LEVEL_NAMES[7]).toBe('hard');
      expect(LEVEL_NAMES[10]).toBe('master');
    });
  });
});

// ============================================================================
// Task 2: calculatePerformanceMetrics Tests
// ============================================================================

describe('calculatePerformanceMetrics', () => {
  it('calculates average accuracy across sessions', () => {
    const sessions = [
      createMockSession({ accuracy: 80 }),
      createMockSession({ accuracy: 90 }),
      createMockSession({ accuracy: 70 }),
    ];
    const drills: DrillResult[] = [];

    const metrics = calculatePerformanceMetrics(sessions, drills);

    expect(metrics.averageAccuracy).toBe(80);
  });

  it('handles 0% accuracy edge case', () => {
    const sessions = [
      createMockSession({ accuracy: 0 }),
      createMockSession({ accuracy: 0 }),
    ];
    const drills: DrillResult[] = [];

    const metrics = calculatePerformanceMetrics(sessions, drills);

    expect(metrics.averageAccuracy).toBe(0);
  });

  it('handles 100% accuracy edge case', () => {
    const sessions = [
      createMockSession({ accuracy: 100 }),
      createMockSession({ accuracy: 100 }),
    ];
    const drills: DrillResult[] = [];

    const metrics = calculatePerformanceMetrics(sessions, drills);

    expect(metrics.averageAccuracy).toBe(100);
  });

  it('handles 50% accuracy case', () => {
    const sessions = [
      createMockSession({ accuracy: 50 }),
      createMockSession({ accuracy: 50 }),
    ];
    const drills: DrillResult[] = [];

    const metrics = calculatePerformanceMetrics(sessions, drills);

    expect(metrics.averageAccuracy).toBe(50);
  });

  it('calculates median time correctly with odd number of drills', () => {
    const sessions: Session[] = [];
    const drills = [
      createMockDrillResult({ timeToAnswer: 1000 }),
      createMockDrillResult({ timeToAnswer: 3000 }),
      createMockDrillResult({ timeToAnswer: 2000 }),
    ];

    const metrics = calculatePerformanceMetrics(sessions, drills);

    expect(metrics.medianTimeMs).toBe(2000);
  });

  it('calculates median time correctly with even number of drills', () => {
    const sessions: Session[] = [];
    const drills = [
      createMockDrillResult({ timeToAnswer: 1000 }),
      createMockDrillResult({ timeToAnswer: 2000 }),
      createMockDrillResult({ timeToAnswer: 3000 }),
      createMockDrillResult({ timeToAnswer: 4000 }),
    ];

    const metrics = calculatePerformanceMetrics(sessions, drills);

    expect(metrics.medianTimeMs).toBe(2500);
  });

  it('calculates consistency score (standard deviation)', () => {
    const sessions: Session[] = [];
    const drills = [
      createMockDrillResult({ accuracy: 80 }),
      createMockDrillResult({ accuracy: 80 }),
      createMockDrillResult({ accuracy: 80 }),
    ];

    const metrics = calculatePerformanceMetrics(sessions, drills);

    expect(metrics.consistencyScore).toBe(0); // All same = 0 std dev
  });

  it('calculates confidence trend correctly', () => {
    const sessions = [
      createMockSession({ confidenceBefore: 2, confidenceAfter: 4 }), // +2
      createMockSession({ confidenceBefore: 3, confidenceAfter: 4 }), // +1
      createMockSession({ confidenceBefore: 3, confidenceAfter: 3 }), // 0
    ];
    const drills: DrillResult[] = [];

    const metrics = calculatePerformanceMetrics(sessions, drills);

    expect(metrics.confidenceTrend).toBe(1); // (2 + 1 + 0) / 3 = 1
  });

  it('returns session and drill counts', () => {
    const sessions = [createMockSession(), createMockSession()];
    const drills = [createMockDrillResult(), createMockDrillResult(), createMockDrillResult()];

    const metrics = calculatePerformanceMetrics(sessions, drills);

    expect(metrics.sessionCount).toBe(2);
    expect(metrics.drillCount).toBe(3);
  });

  it('handles empty arrays gracefully', () => {
    const metrics = calculatePerformanceMetrics([], []);

    expect(metrics.averageAccuracy).toBe(0);
    expect(metrics.medianTimeMs).toBe(0);
    expect(metrics.consistencyScore).toBe(0);
    expect(metrics.confidenceTrend).toBe(0);
    expect(metrics.sessionCount).toBe(0);
    expect(metrics.drillCount).toBe(0);
  });
});

// ============================================================================
// Task 4: determineAdjustment Tests
// ============================================================================

describe('determineAdjustment', () => {
  const baseMetrics: PerformanceMetrics = {
    averageAccuracy: 75,
    medianTimeMs: 3000,
    consistencyScore: 5,
    confidenceTrend: 0.5,
    sessionCount: 5,
    drillCount: 20,
  };

  describe('number_line module (AC-2)', () => {
    it('increases difficulty when accuracy > 85% for number_line', () => {
      const metrics = { ...baseMetrics, averageAccuracy: 90 };

      const result = determineAdjustment(metrics, 5, 'number_line');

      expect(result).not.toBeNull();
      expect(result?.newLevel).toBe(6);
      expect(result?.reason).toBe('accuracy_high');
    });

    it('decreases difficulty when accuracy < 60% for number_line', () => {
      const metrics = { ...baseMetrics, averageAccuracy: 50 };

      const result = determineAdjustment(metrics, 5, 'number_line');

      expect(result).not.toBeNull();
      expect(result?.newLevel).toBe(4);
      expect(result?.reason).toBe('accuracy_low');
    });

    it('increases difficulty when median time < 2 seconds', () => {
      const metrics = { ...baseMetrics, medianTimeMs: 1500 };

      const result = determineAdjustment(metrics, 5, 'number_line');

      expect(result).not.toBeNull();
      expect(result?.newLevel).toBe(6);
      expect(result?.reason).toBe('speed_fast');
    });
  });

  describe('spatial_rotation module (AC-3)', () => {
    it('increases difficulty when accuracy > 90% for spatial_rotation', () => {
      const metrics = { ...baseMetrics, averageAccuracy: 95 };

      const result = determineAdjustment(metrics, 5, 'spatial_rotation');

      expect(result).not.toBeNull();
      expect(result?.newLevel).toBe(6);
      expect(result?.reason).toBe('accuracy_high');
    });

    it('decreases difficulty when accuracy < 65% for spatial_rotation', () => {
      const metrics = { ...baseMetrics, averageAccuracy: 60 };

      const result = determineAdjustment(metrics, 5, 'spatial_rotation');

      expect(result).not.toBeNull();
      expect(result?.newLevel).toBe(4);
      expect(result?.reason).toBe('accuracy_low');
    });

    it('drops to level 3 when consistent mirror confusion detected', () => {
      const metrics = {
        ...baseMetrics,
        averageAccuracy: 75,
        mirrorConfusionRate: 0.6, // 60% error rate on mirrors
        mirrorDrillCount: 5,      // Enough mirror drills to be significant
      };

      const result = determineAdjustment(metrics, 6, 'spatial_rotation');

      expect(result).not.toBeNull();
      expect(result?.newLevel).toBe(3);
      expect(result?.reason).toBe('mirror_confusion');
    });

    it('ignores mirror confusion if already at level 3 or below', () => {
      const metrics = {
        ...baseMetrics,
        averageAccuracy: 75,
        mirrorConfusionRate: 0.7,
        mirrorDrillCount: 5,
      };

      const result = determineAdjustment(metrics, 3, 'spatial_rotation');

      // No adjustment since already at level 3 (no mirroring)
      expect(result).toBeNull();
    });

    it('ignores mirror confusion if not enough mirror drills', () => {
      const metrics = {
        ...baseMetrics,
        averageAccuracy: 75,
        mirrorConfusionRate: 0.8,
        mirrorDrillCount: 2, // Not enough mirror drills
      };

      const result = determineAdjustment(metrics, 6, 'spatial_rotation');

      // No adjustment due to insufficient data
      expect(result).toBeNull();
    });
  });

  describe('math_operations module (AC-4)', () => {
    it('increases difficulty when accuracy > 80% for math_operations', () => {
      const metrics = { ...baseMetrics, averageAccuracy: 85 };

      const result = determineAdjustment(metrics, 5, 'math_operations');

      expect(result).not.toBeNull();
      expect(result?.newLevel).toBe(6);
      expect(result?.reason).toBe('accuracy_high');
    });

    it('decreases difficulty when accuracy < 65% for math_operations', () => {
      const metrics = { ...baseMetrics, averageAccuracy: 60 };

      const result = determineAdjustment(metrics, 5, 'math_operations');

      expect(result).not.toBeNull();
      expect(result?.newLevel).toBe(4);
      expect(result?.reason).toBe('accuracy_low');
    });

    it('increases difficulty when median time < 3 seconds', () => {
      const metrics = { ...baseMetrics, medianTimeMs: 2500 };

      const result = determineAdjustment(metrics, 5, 'math_operations');

      expect(result).not.toBeNull();
      expect(result?.newLevel).toBe(6);
      expect(result?.reason).toBe('speed_fast');
    });
  });

  describe('gradual adjustment rules (AC-6)', () => {
    it('only adjusts by 1 level at a time (increase)', () => {
      const metrics = { ...baseMetrics, averageAccuracy: 99 };

      const result = determineAdjustment(metrics, 5, 'number_line');

      expect(result?.newLevel).toBe(6); // Not 10
    });

    it('only adjusts by 1 level at a time (decrease)', () => {
      const metrics = { ...baseMetrics, averageAccuracy: 10 };

      const result = determineAdjustment(metrics, 5, 'number_line');

      expect(result?.newLevel).toBe(4); // Not 1
    });

    it('does not adjust if already at max level (10)', () => {
      const metrics = { ...baseMetrics, averageAccuracy: 99 };

      const result = determineAdjustment(metrics, 10, 'number_line');

      expect(result).toBeNull();
    });

    it('does not adjust if already at min level (1)', () => {
      const metrics = { ...baseMetrics, averageAccuracy: 10 };

      const result = determineAdjustment(metrics, 1, 'number_line');

      expect(result).toBeNull();
    });
  });

  describe('cooldown enforcement (AC-6)', () => {
    it('returns null if zero sessions since last adjustment', () => {
      const metrics = { ...baseMetrics, averageAccuracy: 90 };
      const recentAdjustments = [
        createMockDifficultyHistory({
          module: 'number_line',
          timestamp: new Date().toISOString(),
        }),
      ];

      // 0 sessions since last adjustment - should be in cooldown
      const result = determineAdjustment(metrics, 5, 'number_line', recentAdjustments, 0);

      expect(result).toBeNull();
    });

    it('allows adjustment after 1+ sessions since last adjustment', () => {
      const metrics = { ...baseMetrics, averageAccuracy: 90 };
      const recentAdjustments = [
        createMockDifficultyHistory({
          module: 'number_line',
          timestamp: new Date().toISOString(),
        }),
      ];

      // 1 session since last adjustment - cooldown complete
      const result = determineAdjustment(metrics, 5, 'number_line', recentAdjustments, 1);

      expect(result).not.toBeNull();
    });

    it('allows adjustment if no recent adjustments', () => {
      const metrics = { ...baseMetrics, averageAccuracy: 90 };

      const result = determineAdjustment(metrics, 5, 'number_line', []);

      expect(result).not.toBeNull();
    });
  });

  describe('minimum session requirement', () => {
    it('returns null if less than 3 sessions', () => {
      const metrics = { ...baseMetrics, sessionCount: 2 };

      const result = determineAdjustment(metrics, 5, 'number_line');

      expect(result).toBeNull();
    });

    it('returns adjustment if 3+ sessions', () => {
      const metrics = { ...baseMetrics, averageAccuracy: 90, sessionCount: 3 };

      const result = determineAdjustment(metrics, 5, 'number_line');

      expect(result).not.toBeNull();
    });
  });

  describe('no adjustment needed', () => {
    it('returns null when accuracy is in optimal range', () => {
      const metrics = { ...baseMetrics, averageAccuracy: 75 };

      const result = determineAdjustment(metrics, 5, 'number_line');

      expect(result).toBeNull();
    });
  });
});

// ============================================================================
// Task 6: getDifficultyConfig Tests
// ============================================================================

describe('getDifficultyConfig', () => {
  describe('number_line configs', () => {
    it('returns correct config for level 1', () => {
      const config = getDifficultyConfig('number_line', 1);

      expect(config).toEqual(NUMBER_LINE_CONFIGS[1]);
      expect((config as typeof NUMBER_LINE_CONFIGS[1]).range.max).toBe(10);
      expect((config as typeof NUMBER_LINE_CONFIGS[1]).tolerance).toBe(0.20);
    });

    it('returns correct config for level 10', () => {
      const config = getDifficultyConfig('number_line', 10);

      expect(config).toEqual(NUMBER_LINE_CONFIGS[10]);
      expect((config as typeof NUMBER_LINE_CONFIGS[10]).range.max).toBe(1000);
      expect((config as typeof NUMBER_LINE_CONFIGS[10]).tolerance).toBe(0.03);
    });
  });

  describe('spatial_rotation configs', () => {
    it('returns correct config for level 1 (no mirroring)', () => {
      const config = getDifficultyConfig('spatial_rotation', 1);

      expect(config).toEqual(SPATIAL_ROTATION_CONFIGS[1]);
      expect((config as typeof SPATIAL_ROTATION_CONFIGS[1]).allowMirroring).toBe(false);
    });

    it('returns correct config for level 5 (with mirroring)', () => {
      const config = getDifficultyConfig('spatial_rotation', 5);

      expect(config).toEqual(SPATIAL_ROTATION_CONFIGS[5]);
      expect((config as typeof SPATIAL_ROTATION_CONFIGS[5]).allowMirroring).toBe(true);
    });
  });

  describe('math_operations configs', () => {
    it('returns correct config for level 1 (single digit, addition only)', () => {
      const config = getDifficultyConfig('math_operations', 1);

      expect(config).toEqual(MATH_OPERATIONS_CONFIGS[1]);
      expect((config as typeof MATH_OPERATIONS_CONFIGS[1]).magnitude).toBe('single_digit');
      expect((config as typeof MATH_OPERATIONS_CONFIGS[1]).operations).toEqual(['addition']);
    });

    it('returns correct config for level 10 (triple digit, all operations)', () => {
      const config = getDifficultyConfig('math_operations', 10);

      expect(config).toEqual(MATH_OPERATIONS_CONFIGS[10]);
      expect((config as typeof MATH_OPERATIONS_CONFIGS[10]).magnitude).toBe('triple_digit');
      expect((config as typeof MATH_OPERATIONS_CONFIGS[10]).operations).toContain('multiplication');
    });
  });
});

// ============================================================================
// Task 3: getCurrentDifficulty Tests (with mocked DB)
// ============================================================================

describe('getCurrentDifficulty', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns level from difficulty_history if exists', async () => {
    const mockHistory = createMockDifficultyHistory({ newDifficulty: 7 });
    vi.mocked(db.difficulty_history.where).mockReturnValue({
      equals: vi.fn().mockReturnValue({
        reverse: vi.fn().mockReturnValue({
          first: vi.fn().mockResolvedValue(mockHistory),
          limit: vi.fn().mockReturnValue({
            toArray: vi.fn().mockResolvedValue([]),
          }),
        }),
      }),
    } as any);

    const level = await getCurrentDifficulty('number_line');

    expect(level).toBe(7);
  });

  it('returns level based on assessment score > 4.5 (hard)', async () => {
    vi.mocked(db.difficulty_history.where).mockReturnValue({
      equals: vi.fn().mockReturnValue({
        reverse: vi.fn().mockReturnValue({
          first: vi.fn().mockResolvedValue(null),
          limit: vi.fn().mockReturnValue({
            toArray: vi.fn().mockResolvedValue([]),
          }),
        }),
      }),
    } as any);

    vi.mocked(db.assessments.orderBy).mockReturnValue({
      reverse: vi.fn().mockReturnValue({
        first: vi.fn().mockResolvedValue({
          correctAnswers: 10,
          totalQuestions: 10, // Score = 5 (> 4.5)
        }),
      }),
    } as any);

    const level = await getCurrentDifficulty('number_line');

    expect(level).toBe(7); // Hard
  });

  it('returns level based on assessment score > 4 (medium)', async () => {
    vi.mocked(db.difficulty_history.where).mockReturnValue({
      equals: vi.fn().mockReturnValue({
        reverse: vi.fn().mockReturnValue({
          first: vi.fn().mockResolvedValue(null),
          limit: vi.fn().mockReturnValue({
            toArray: vi.fn().mockResolvedValue([]),
          }),
        }),
      }),
    } as any);

    vi.mocked(db.assessments.orderBy).mockReturnValue({
      reverse: vi.fn().mockReturnValue({
        first: vi.fn().mockResolvedValue({
          correctAnswers: 9,
          totalQuestions: 10, // Score = 4.5 (> 4)
        }),
      }),
    } as any);

    const level = await getCurrentDifficulty('number_line');

    expect(level).toBe(5); // Medium
  });

  it('returns default level 3 (easy) if no history or assessment', async () => {
    vi.mocked(db.difficulty_history.where).mockReturnValue({
      equals: vi.fn().mockReturnValue({
        reverse: vi.fn().mockReturnValue({
          first: vi.fn().mockResolvedValue(null),
          limit: vi.fn().mockReturnValue({
            toArray: vi.fn().mockResolvedValue([]),
          }),
        }),
      }),
    } as any);

    vi.mocked(db.assessments.orderBy).mockReturnValue({
      reverse: vi.fn().mockReturnValue({
        first: vi.fn().mockResolvedValue(null),
      }),
    } as any);

    const level = await getCurrentDifficulty('number_line');

    expect(level).toBe(3); // Easy (default)
  });
});

// ============================================================================
// Task 5: applyAdjustment Tests (with mocked DB)
// ============================================================================

describe('applyAdjustment', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('persists adjustment to difficulty_history with correct schema', async () => {
    const mockAdd = vi.fn().mockResolvedValue(42);
    vi.mocked(db.difficulty_history.add as any).mockImplementation(mockAdd);

    const adjustment: AdjustmentResult = {
      module: 'number_line',
      previousLevel: 5,
      newLevel: 6,
      reason: 'accuracy_high',
      timestamp: '2025-12-21T12:00:00.000Z',
      metrics: {
        averageAccuracy: 90,
        medianTimeMs: 2500,
        consistencyScore: 5,
        confidenceTrend: 0.5,
        sessionCount: 5,
        drillCount: 20,
      },
    };

    const id = await applyAdjustment(adjustment, 123);

    expect(id).toBe(42);
    expect(mockAdd).toHaveBeenCalledWith({
      sessionId: 123,
      timestamp: '2025-12-21T12:00:00.000Z',
      module: 'number_line',
      previousDifficulty: 5,
      newDifficulty: 6,
      reason: 'accuracy_high',
      userAccepted: true,
    });
  });

  it('always sets userAccepted to true for auto-adjustments', async () => {
    const mockAdd = vi.fn().mockResolvedValue(1);
    vi.mocked(db.difficulty_history.add as any).mockImplementation(mockAdd);

    const adjustment: AdjustmentResult = {
      module: 'spatial_rotation',
      previousLevel: 3,
      newLevel: 2,
      reason: 'accuracy_low',
      timestamp: new Date().toISOString(),
      metrics: {
        averageAccuracy: 50,
        medianTimeMs: 5000,
        consistencyScore: 10,
        confidenceTrend: -0.5,
        sessionCount: 5,
        drillCount: 15,
      },
    };

    await applyAdjustment(adjustment, 456);

    expect(mockAdd).toHaveBeenCalledWith(
      expect.objectContaining({
        userAccepted: true,
      })
    );
  });
});

// ============================================================================
// Task 8.10: DifficultyHistory Schema Compliance
// ============================================================================

describe('DifficultyHistory schema compliance', () => {
  it('uses numeric previousDifficulty (1-10), not string', async () => {
    const mockAdd = vi.fn().mockResolvedValue(1);
    vi.mocked(db.difficulty_history.add as any).mockImplementation(mockAdd);

    const adjustment: AdjustmentResult = {
      module: 'number_line',
      previousLevel: 5,
      newLevel: 6,
      reason: 'accuracy_high',
      timestamp: new Date().toISOString(),
      metrics: {
        averageAccuracy: 90,
        medianTimeMs: 2000,
        consistencyScore: 3,
        confidenceTrend: 0.2,
        sessionCount: 5,
        drillCount: 20,
      },
    };

    await applyAdjustment(adjustment, 1);

    const calledWith = mockAdd.mock.calls[0][0];
    expect(typeof calledWith.previousDifficulty).toBe('number');
    expect(typeof calledWith.newDifficulty).toBe('number');
    expect(calledWith.previousDifficulty).toBe(5);
    expect(calledWith.newDifficulty).toBe(6);
  });

  it('uses string reason code, not descriptive text', async () => {
    const mockAdd = vi.fn().mockResolvedValue(1);
    vi.mocked(db.difficulty_history.add as any).mockImplementation(mockAdd);

    const adjustment: AdjustmentResult = {
      module: 'math_operations',
      previousLevel: 4,
      newLevel: 5,
      reason: 'speed_fast',
      timestamp: new Date().toISOString(),
      metrics: {
        averageAccuracy: 75,
        medianTimeMs: 1500,
        consistencyScore: 4,
        confidenceTrend: 0.3,
        sessionCount: 4,
        drillCount: 16,
      },
    };

    await applyAdjustment(adjustment, 1);

    const calledWith = mockAdd.mock.calls[0][0];
    expect(calledWith.reason).toBe('speed_fast');
    expect(calledWith.reason).not.toContain(' '); // No spaces = not descriptive text
  });
});

// ============================================================================
// Overall Integration Tests
// ============================================================================

describe('processSessionEnd integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns empty array when no drills in session', async () => {
    vi.mocked(db.drill_results.where).mockReturnValue({
      equals: vi.fn().mockReturnValue({
        toArray: vi.fn().mockResolvedValue([]),
        reverse: vi.fn().mockReturnValue({
          limit: vi.fn().mockReturnValue({
            toArray: vi.fn().mockResolvedValue([]),
          }),
        }),
        count: vi.fn().mockResolvedValue(0),
      }),
    } as any);

    const adjustments = await processSessionEnd(1);

    expect(adjustments).toEqual([]);
  });
});
