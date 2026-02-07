// Confidence Calculator Tests - Story 5.1
// Tests for domain confidence calculation functions

import { describe, it, expect } from 'vitest';
import type { Session, DrillResult } from '@/services/storage/schemas';
import {
  calculateDomainConfidence,
  getBaselineConfidence,
  calculateWeightedAverage,
} from './confidenceCalculator';

// Mock session data fixture
const createMockSession = (
  id: number,
  timestamp: string,
  confidenceAfter: number,
  drillQueue: string[] = []
): Session => ({
  id,
  timestamp,
  module: 'training',
  duration: 300000,
  completionStatus: 'completed',
  confidenceAfter,
  drillQueue,
});

// Mock drill result fixture
const createMockDrillResult = (
  sessionId: number,
  module: 'number_line' | 'spatial_rotation' | 'math_operations'
): DrillResult => ({
  id: Math.random() * 1000,
  sessionId,
  timestamp: new Date().toISOString(),
  module,
  difficulty: 'medium',
  isCorrect: true,
  timeToAnswer: 5000,
  accuracy: 85,
});

describe('calculateDomainConfidence', () => {
  it('returns default 3.0 for all domains when no sessions provided', () => {
    const result = calculateDomainConfidence([], []);

    expect(result).toEqual({
      numberSense: 3.0,
      spatial: 3.0,
      operations: 3.0,
    });
  });

  it('returns correct confidence per domain based on session drillQueue', () => {
    const sessions: Session[] = [
      createMockSession(1, '2025-01-03T10:00:00Z', 4, ['number_line', 'number_line']),
      createMockSession(2, '2025-01-02T10:00:00Z', 3, ['spatial_rotation']),
      createMockSession(3, '2025-01-01T10:00:00Z', 2, ['math_operations']),
    ];

    const result = calculateDomainConfidence(sessions, []);

    // Most recent session (id 1) has numberSense drills with confidence 4
    expect(result.numberSense).toBeCloseTo(4, 1);
    // Session 2 has spatial with confidence 3
    expect(result.spatial).toBeCloseTo(3, 1);
    // Session 3 has operations with confidence 2
    expect(result.operations).toBeCloseTo(2, 1);
  });

  it('applies recency weighting - recent sessions have more influence', () => {
    // Two sessions for same domain, recent one has higher confidence
    const sessions: Session[] = [
      createMockSession(1, '2025-01-02T10:00:00Z', 5, ['number_line']), // Recent: high confidence
      createMockSession(2, '2025-01-01T10:00:00Z', 1, ['number_line']), // Old: low confidence
    ];

    const result = calculateDomainConfidence(sessions, []);

    // Should be closer to 5 than to 1 due to recency weighting
    expect(result.numberSense).toBeGreaterThan(3);
  });

  it('calculates confidence from drill results when drillQueue not available', () => {
    const sessions: Session[] = [
      createMockSession(1, '2025-01-01T10:00:00Z', 4, []), // No drillQueue
    ];

    const drillResults: DrillResult[] = [
      createMockDrillResult(1, 'number_line'),
      createMockDrillResult(1, 'spatial_rotation'),
    ];

    const result = calculateDomainConfidence(sessions, drillResults);

    expect(result.numberSense).toBeCloseTo(4, 1);
    expect(result.spatial).toBeCloseTo(4, 1);
    expect(result.operations).toBeCloseTo(3, 1); // Default, no drills
  });

  it('handles sessions without confidenceAfter gracefully', () => {
    const sessions: Session[] = [
      { ...createMockSession(1, '2025-01-01T10:00:00Z', 4, ['number_line']), confidenceAfter: undefined },
    ];

    const result = calculateDomainConfidence(sessions, []);

    // Should return defaults since no confidence data
    expect(result.numberSense).toBe(3.0);
  });
});

describe('getBaselineConfidence', () => {
  it('returns null when no sessions provided', () => {
    const result = getBaselineConfidence([], []);
    expect(result).toBeNull();
  });

  it('returns null when no sessions have confidenceAfter', () => {
    const sessions: Session[] = [
      { ...createMockSession(1, '2025-01-01T10:00:00Z', 3, ['number_line']), confidenceAfter: undefined },
    ];

    const result = getBaselineConfidence(sessions, []);
    expect(result).toBeNull();
  });

  it('returns baseline from earliest session with confidence data', () => {
    const sessions: Session[] = [
      createMockSession(3, '2025-01-03T10:00:00Z', 5, ['number_line']), // Most recent
      createMockSession(2, '2025-01-02T10:00:00Z', 4, ['spatial_rotation']),
      createMockSession(1, '2025-01-01T10:00:00Z', 2, ['math_operations']), // Earliest
    ];

    const result = getBaselineConfidence(sessions, []);

    expect(result).not.toBeNull();
    // Baseline should use earliest session's confidence for its domain
    expect(result!.operations).toBe(2);
    // Other domains should be default 3.0
    expect(result!.numberSense).toBe(3.0);
    expect(result!.spatial).toBe(3.0);
  });

  it('extracts baseline from first session drill results', () => {
    const sessions: Session[] = [
      createMockSession(1, '2025-01-01T10:00:00Z', 2.5, []),
    ];

    const drillResults: DrillResult[] = [
      createMockDrillResult(1, 'number_line'),
      createMockDrillResult(1, 'spatial_rotation'),
    ];

    const result = getBaselineConfidence(sessions, drillResults);

    expect(result).not.toBeNull();
    expect(result!.numberSense).toBe(2.5);
    expect(result!.spatial).toBe(2.5);
    expect(result!.operations).toBe(3.0); // Default, not trained in first session
  });
});

describe('calculateWeightedAverage', () => {
  it('returns 0 for empty array', () => {
    expect(calculateWeightedAverage([])).toBe(0);
  });

  it('returns the value for single item', () => {
    expect(calculateWeightedAverage([5])).toBe(5);
  });

  it('applies exponential decay weighting', () => {
    // [5, 1] with decay 0.85
    // weights: [1.0, 0.85]
    // weighted sum: 5*1.0 + 1*0.85 = 5.85
    // total weight: 1.0 + 0.85 = 1.85
    // result: 5.85 / 1.85 ≈ 3.16
    const result = calculateWeightedAverage([5, 1], 0.85);
    expect(result).toBeCloseTo(3.16, 1);
  });

  it('weights first element (most recent) highest', () => {
    // Same values, different order - recent position matters
    const recentHigh = calculateWeightedAverage([5, 1]);  // Recent value is 5
    const recentLow = calculateWeightedAverage([1, 5]);   // Recent value is 1

    // When most recent is high, average should be higher
    expect(recentHigh).toBeGreaterThan(recentLow);
  });

  it('allows custom decay factor', () => {
    const fastDecay = calculateWeightedAverage([5, 1], 0.5); // Fast decay
    const slowDecay = calculateWeightedAverage([5, 1], 0.9); // Slow decay

    // Fast decay should weight first element more heavily
    expect(fastDecay).toBeGreaterThan(slowDecay);
  });
});
