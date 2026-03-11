// Tests for Drill Selection Service - Story 3.1
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { loadTrainingPlanWeights, selectDrills, type TrainingPlanWeights } from './drillSelector';
import { db } from '@/services/storage/db';
import type { Assessment } from '@/services/storage/schemas';

// Mock database
vi.mock('@/services/storage/db', () => ({
  db: {
    assessments: {
      orderBy: vi.fn(),
    },
  },
}));

describe('loadTrainingPlanWeights', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('throws error when no assessment exists', async () => {
    // Arrange: Mock no assessment
    const mockFirst = vi.fn().mockResolvedValue(null);
    const mockReverse = vi.fn().mockReturnValue({ first: mockFirst });
    const mockOrderBy = vi.fn().mockReturnValue({ reverse: mockReverse });
    (db.assessments.orderBy as any) = mockOrderBy;

    // Act & Assert
    await expect(loadTrainingPlanWeights()).rejects.toThrow(
      'No completed assessment found. Please complete assessment first.'
    );
  });

  it('throws error when assessment is in-progress', async () => {
    // Arrange: Mock in-progress assessment
    const incompleteAssessment: Partial<Assessment> = {
      id: 1,
      timestamp: new Date().toISOString(),
      status: 'in-progress',
      weaknesses: [],
      strengths: [],
    };

    const mockFirst = vi.fn().mockResolvedValue(incompleteAssessment);
    const mockReverse = vi.fn().mockReturnValue({ first: mockFirst });
    const mockOrderBy = vi.fn().mockReturnValue({ reverse: mockReverse });
    (db.assessments.orderBy as any) = mockOrderBy;

    // Act & Assert
    await expect(loadTrainingPlanWeights()).rejects.toThrow(
      'No completed assessment found. Please complete assessment first.'
    );
  });

  it('derives weights from weaknesses array - all weak', async () => {
    // Arrange: Assessment with 3 domains as weaknesses (legacy format)
    const assessment: Partial<Assessment> = {
      id: 1,
      timestamp: new Date().toISOString(),
      status: 'completed',
      weaknesses: ['number_sense', 'spatial', 'operations'],
      strengths: [],
    };

    const mockFirst = vi.fn().mockResolvedValue(assessment);
    const mockReverse = vi.fn().mockReturnValue({ first: mockFirst });
    const mockOrderBy = vi.fn().mockReturnValue({ reverse: mockReverse });
    (db.assessments.orderBy as any) = mockOrderBy;

    // Act
    const weights = await loadTrainingPlanWeights();

    // Assert: number_sense→numberSense=2.0, spatial→spatial=2.0, operations→arithmetic=2.0
    // placeValue=1.0, sequencing=1.0, applied=1.0 (defaults)
    // Sum = 2+1+1+2+2+1 = 9.0
    expect(weights.numberSense).toBeCloseTo(2.0 / 9.0, 5);
    expect(weights.spatial).toBeCloseTo(2.0 / 9.0, 5);
    expect(weights.arithmetic).toBeCloseTo(2.0 / 9.0, 5);
    expect(weights.placeValue).toBeCloseTo(1.0 / 9.0, 5);
    expect(weights.sequencing).toBeCloseTo(1.0 / 9.0, 5);
    expect(weights.applied).toBeCloseTo(1.0 / 9.0, 5);
    expect(Object.values(weights).reduce((a, b) => a + b, 0)).toBeCloseTo(1.0, 5);
  });

  it('derives weights from strengths array - all strong', async () => {
    // Arrange: Assessment with 3 domains as strengths (legacy format)
    const assessment: Partial<Assessment> = {
      id: 1,
      timestamp: new Date().toISOString(),
      status: 'completed',
      weaknesses: [],
      strengths: ['number_sense', 'spatial', 'operations'],
    };

    const mockFirst = vi.fn().mockResolvedValue(assessment);
    const mockReverse = vi.fn().mockReturnValue({ first: mockFirst });
    const mockOrderBy = vi.fn().mockReturnValue({ reverse: mockReverse });
    (db.assessments.orderBy as any) = mockOrderBy;

    // Act
    const weights = await loadTrainingPlanWeights();

    // Assert: number_sense→numberSense=0.5, spatial→spatial=0.5, operations→arithmetic=0.5
    // placeValue=1.0, sequencing=1.0, applied=1.0 (defaults)
    // Sum = 0.5+1+1+0.5+0.5+1 = 4.5
    expect(weights.numberSense).toBeCloseTo(0.5 / 4.5, 5);
    expect(weights.spatial).toBeCloseTo(0.5 / 4.5, 5);
    expect(weights.arithmetic).toBeCloseTo(0.5 / 4.5, 5);
    expect(weights.placeValue).toBeCloseTo(1.0 / 4.5, 5);
    expect(weights.sequencing).toBeCloseTo(1.0 / 4.5, 5);
    expect(weights.applied).toBeCloseTo(1.0 / 4.5, 5);
    expect(Object.values(weights).reduce((a, b) => a + b, 0)).toBeCloseTo(1.0, 5);
  });

  it('derives weights from mixed weaknesses and strengths', async () => {
    // Arrange: Mixed assessment - number_sense weak, operations strong, others moderate
    const assessment: Partial<Assessment> = {
      id: 1,
      timestamp: new Date().toISOString(),
      status: 'completed',
      weaknesses: ['number_sense'],
      strengths: ['operations'],
    };

    const mockFirst = vi.fn().mockResolvedValue(assessment);
    const mockReverse = vi.fn().mockReturnValue({ first: mockFirst });
    const mockOrderBy = vi.fn().mockReturnValue({ reverse: mockReverse });
    (db.assessments.orderBy as any) = mockOrderBy;

    // Act
    const weights = await loadTrainingPlanWeights();

    // Assert:
    // Raw weights: numberSense=2.0, placeValue=1.0, sequencing=1.0, arithmetic=0.5, spatial=1.0, applied=1.0
    // Sum = 6.5
    expect(weights.numberSense).toBeCloseTo(2.0 / 6.5, 5);
    expect(weights.placeValue).toBeCloseTo(1.0 / 6.5, 5);
    expect(weights.sequencing).toBeCloseTo(1.0 / 6.5, 5);
    expect(weights.arithmetic).toBeCloseTo(0.5 / 6.5, 5);
    expect(weights.spatial).toBeCloseTo(1.0 / 6.5, 5);
    expect(weights.applied).toBeCloseTo(1.0 / 6.5, 5);
    expect(Object.values(weights).reduce((a, b) => a + b, 0)).toBeCloseTo(1.0, 5);
  });

  it('returns default equal weights when assessment has no weaknesses or strengths', async () => {
    // Arrange: Assessment with empty arrays
    const assessment: Partial<Assessment> = {
      id: 1,
      timestamp: new Date().toISOString(),
      status: 'completed',
      weaknesses: [],
      strengths: [],
    };

    const mockFirst = vi.fn().mockResolvedValue(assessment);
    const mockReverse = vi.fn().mockReturnValue({ first: mockFirst });
    const mockOrderBy = vi.fn().mockReturnValue({ reverse: mockReverse });
    (db.assessments.orderBy as any) = mockOrderBy;

    // Act
    const weights = await loadTrainingPlanWeights();

    // Assert: All moderate (1.0 * 6 = 6.0, normalized to 1/6 each)
    expect(weights.numberSense).toBeCloseTo(1 / 6, 5);
    expect(weights.placeValue).toBeCloseTo(1 / 6, 5);
    expect(weights.sequencing).toBeCloseTo(1 / 6, 5);
    expect(weights.arithmetic).toBeCloseTo(1 / 6, 5);
    expect(weights.spatial).toBeCloseTo(1 / 6, 5);
    expect(weights.applied).toBeCloseTo(1 / 6, 5);
    expect(Object.values(weights).reduce((a, b) => a + b, 0)).toBeCloseTo(1.0, 5);
  });
});

describe('selectDrills', () => {
  it('generates correct number of drills - quick session (6)', async () => {
    // Arrange
    const weights: TrainingPlanWeights = {
      numberSense: 0.20,
      placeValue: 0.15,
      sequencing: 0.15,
      arithmetic: 0.20,
      spatial: 0.15,
      applied: 0.15,
    };

    // Act
    const drillQueue = await selectDrills(weights, 6);

    // Assert
    expect(drillQueue).toHaveLength(6);
  });

  it('generates correct number of drills - full session (12)', async () => {
    // Arrange
    const weights: TrainingPlanWeights = {
      numberSense: 0.20,
      placeValue: 0.15,
      sequencing: 0.15,
      arithmetic: 0.20,
      spatial: 0.15,
      applied: 0.15,
    };

    // Act
    const drillQueue = await selectDrills(weights, 12);

    // Assert
    expect(drillQueue).toHaveLength(12);
  });

  it('respects weighted distribution over many runs', async () => {
    // Arrange: Heavy number_sense weight
    const weights: TrainingPlanWeights = {
      numberSense: 0.55,  // 55% probability
      placeValue: 0.05,
      sequencing: 0.05,
      arithmetic: 0.10,   // 10% probability
      spatial: 0.15,      // 15% probability
      applied: 0.10,
    };

    // Act: Run 100 times to check distribution
    const counts: Record<string, number> = {
      number_line: 0,
      subitizing: 0,
      magnitude_comparison: 0,
      place_value: 0,
      estimation: 0,
      number_decomposition: 0,
      sequencing: 0,
      rhythmic_counting: 0,
      math_operations: 0,
      number_bonds: 0,
      fact_fluency: 0,
      mental_math_strategy: 0,
      fact_family: 0,
      spatial_rotation: 0,
      fractions: 0,
      time_measurement: 0,
      working_memory: 0,
      everyday_math: 0,
    };

    const totalDrills = 100;
    for (let i = 0; i < totalDrills; i++) {
      const drillQueue = await selectDrills(weights, 1); // Select 1 drill each time
      counts[drillQueue[0]]++;
    }

    // Assert: Distribution should roughly match weights (with some variance)
    // numberSense domain (number_line + subitizing + magnitude_comparison) should be ~55%
    const numberSenseTotal = counts.number_line + counts.subitizing + counts.magnitude_comparison;
    expect(numberSenseTotal).toBeGreaterThan(35);
    expect(numberSenseTotal).toBeLessThan(80);

    // spatial_rotation should be ~15% (allow 3-35% range)
    expect(counts.spatial_rotation).toBeGreaterThan(3);
    expect(counts.spatial_rotation).toBeLessThan(35);

    // arithmetic domain (math_operations + number_bonds + fact_fluency + mental_math_strategy + fact_family) should be ~10% (allow 1-25% range)
    const arithmeticTotal = counts.math_operations + counts.number_bonds + counts.fact_fluency + counts.mental_math_strategy + counts.fact_family;
    expect(arithmeticTotal).toBeGreaterThan(1);
    expect(arithmeticTotal).toBeLessThan(25);
  });

  it('enforces variety rule - no more than 3 consecutive drills of same type', async () => {
    // Arrange: Extreme weight to force variety enforcement
    const weights: TrainingPlanWeights = {
      numberSense: 0.95,  // Almost always numberSense
      placeValue: 0.01,
      sequencing: 0.01,
      arithmetic: 0.01,
      spatial: 0.01,
      applied: 0.01,
    };

    // Act
    const drillQueue = await selectDrills(weights, 12);

    // Assert: Check for variety enforcement
    let maxConsecutive = 0;
    let currentConsecutive = 1;

    for (let i = 1; i < drillQueue.length; i++) {
      if (drillQueue[i] === drillQueue[i - 1]) {
        currentConsecutive++;
        maxConsecutive = Math.max(maxConsecutive, currentConsecutive);
      } else {
        currentConsecutive = 1;
      }
    }

    // Assert: Max consecutive should be <= 3 (variety enforcement)
    expect(maxConsecutive).toBeLessThanOrEqual(3);
  });

  it('returns valid drill types', async () => {
    // Arrange
    const weights: TrainingPlanWeights = {
      numberSense: 0.20,
      placeValue: 0.15,
      sequencing: 0.15,
      arithmetic: 0.20,
      spatial: 0.15,
      applied: 0.15,
    };

    // Act
    const drillQueue = await selectDrills(weights, 12);

    // Assert: All drills are valid types
    const validDrills = [
      'number_line', 'spatial_rotation', 'math_operations', 'subitizing', 'number_bonds',
      'magnitude_comparison', 'place_value', 'estimation', 'sequencing', 'fact_fluency',
      'fractions', 'time_measurement', 'working_memory',
      'rhythmic_counting', 'mental_math_strategy', 'fact_family', 'everyday_math', 'number_decomposition',
    ];
    for (const drill of drillQueue) {
      expect(validDrills).toContain(drill);
    }
  });

  it('handles edge case - count of 1 drill', async () => {
    // Arrange
    const weights: TrainingPlanWeights = {
      numberSense: 0.30,
      placeValue: 0.10,
      sequencing: 0.10,
      arithmetic: 0.20,
      spatial: 0.15,
      applied: 0.15,
    };

    // Act
    const drillQueue = await selectDrills(weights, 1);

    // Assert
    expect(drillQueue).toHaveLength(1);
    const validDrills = [
      'number_line', 'spatial_rotation', 'math_operations', 'subitizing', 'number_bonds',
      'magnitude_comparison', 'place_value', 'estimation', 'sequencing', 'fact_fluency',
      'fractions', 'time_measurement', 'working_memory',
      'rhythmic_counting', 'mental_math_strategy', 'fact_family', 'everyday_math', 'number_decomposition',
    ];
    expect(validDrills).toContain(drillQueue[0]);
  });
});
