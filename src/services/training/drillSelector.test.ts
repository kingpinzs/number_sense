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
    // Arrange: Assessment with all domains as weaknesses
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

    // Assert: All equal weights (2.0 + 2.0 + 2.0 = 6.0, normalized to 1/3 each)
    expect(weights.numberSense).toBeCloseTo(1 / 3, 5);
    expect(weights.spatial).toBeCloseTo(1 / 3, 5);
    expect(weights.operations).toBeCloseTo(1 / 3, 5);
    expect(weights.numberSense + weights.spatial + weights.operations).toBeCloseTo(1.0, 5);
  });

  it('derives weights from strengths array - all strong', async () => {
    // Arrange: Assessment with all domains as strengths
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

    // Assert: All equal weights (0.5 + 0.5 + 0.5 = 1.5, normalized to 1/3 each)
    expect(weights.numberSense).toBeCloseTo(1 / 3, 5);
    expect(weights.spatial).toBeCloseTo(1 / 3, 5);
    expect(weights.operations).toBeCloseTo(1 / 3, 5);
    expect(weights.numberSense + weights.spatial + weights.operations).toBeCloseTo(1.0, 5);
  });

  it('derives weights from mixed weaknesses and strengths', async () => {
    // Arrange: Mixed assessment - number_sense weak, operations strong, spatial moderate
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
    // Raw weights: number_sense=2.0, spatial=1.0 (default), operations=0.5
    // Sum = 3.5
    // Normalized: 2.0/3.5=0.571, 1.0/3.5=0.286, 0.5/3.5=0.143
    expect(weights.numberSense).toBeCloseTo(2.0 / 3.5, 5);
    expect(weights.spatial).toBeCloseTo(1.0 / 3.5, 5);
    expect(weights.operations).toBeCloseTo(0.5 / 3.5, 5);
    expect(weights.numberSense + weights.spatial + weights.operations).toBeCloseTo(1.0, 5);
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

    // Assert: All moderate (1.0 + 1.0 + 1.0 = 3.0, normalized to 1/3 each)
    expect(weights.numberSense).toBeCloseTo(1 / 3, 5);
    expect(weights.spatial).toBeCloseTo(1 / 3, 5);
    expect(weights.operations).toBeCloseTo(1 / 3, 5);
    expect(weights.numberSense + weights.spatial + weights.operations).toBeCloseTo(1.0, 5);
  });
});

describe('selectDrills', () => {
  it('generates correct number of drills - quick session (6)', async () => {
    // Arrange
    const weights: TrainingPlanWeights = {
      numberSense: 0.33,
      spatial: 0.33,
      operations: 0.34,
    };

    // Act
    const drillQueue = await selectDrills(weights, 6);

    // Assert
    expect(drillQueue).toHaveLength(6);
  });

  it('generates correct number of drills - full session (12)', async () => {
    // Arrange
    const weights: TrainingPlanWeights = {
      numberSense: 0.33,
      spatial: 0.33,
      operations: 0.34,
    };

    // Act
    const drillQueue = await selectDrills(weights, 12);

    // Assert
    expect(drillQueue).toHaveLength(12);
  });

  it('respects weighted distribution over many runs', async () => {
    // Arrange: Heavy number_sense weight
    const weights: TrainingPlanWeights = {
      numberSense: 0.7,  // 70% probability
      spatial: 0.2,      // 20% probability
      operations: 0.1,   // 10% probability
    };

    // Act: Run 100 times to check distribution
    const counts = {
      number_line: 0,
      spatial_rotation: 0,
      math_operations: 0,
    };

    const totalDrills = 100;
    for (let i = 0; i < totalDrills; i++) {
      const drillQueue = await selectDrills(weights, 1); // Select 1 drill each time
      counts[drillQueue[0]]++;
    }

    // Assert: Distribution should roughly match weights (with some variance)
    // number_line should be ~70% (allow 50-90% range for randomness)
    expect(counts.number_line).toBeGreaterThan(50);
    expect(counts.number_line).toBeLessThan(90);

    // spatial_rotation should be ~20% (allow 5-35% range)
    expect(counts.spatial_rotation).toBeGreaterThan(5);
    expect(counts.spatial_rotation).toBeLessThan(35);

    // math_operations should be ~10% (allow 0-25% range)
    expect(counts.math_operations).toBeGreaterThan(0);
    expect(counts.math_operations).toBeLessThan(25);
  });

  it('enforces variety rule - no more than 3 consecutive drills of same type', async () => {
    // Arrange: Extreme weight to force variety enforcement
    const weights: TrainingPlanWeights = {
      numberSense: 0.99,  // Almost always number_line
      spatial: 0.005,
      operations: 0.005,
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
      numberSense: 0.33,
      spatial: 0.33,
      operations: 0.34,
    };

    // Act
    const drillQueue = await selectDrills(weights, 12);

    // Assert: All drills are valid types
    const validDrills = ['number_line', 'spatial_rotation', 'math_operations'];
    for (const drill of drillQueue) {
      expect(validDrills).toContain(drill);
    }
  });

  it('handles edge case - count of 1 drill', async () => {
    // Arrange
    const weights: TrainingPlanWeights = {
      numberSense: 0.5,
      spatial: 0.3,
      operations: 0.2,
    };

    // Act
    const drillQueue = await selectDrills(weights, 1);

    // Assert
    expect(drillQueue).toHaveLength(1);
    expect(['number_line', 'spatial_rotation', 'math_operations']).toContain(drillQueue[0]);
  });
});
