/**
 * InsightWeighting Tests
 *
 * Tests for calculateInsightWeightAdjustments and applyInsightWeightAdjustments.
 * Verifies weight multiplier tiers and normalization.
 */

import { describe, it, expect } from 'vitest';
import {
  calculateInsightWeightAdjustments,
  applyInsightWeightAdjustments,
} from './insightWeighting';
import type { DomainPerformance } from '@/services/training/insightTypes';
import type { TrainingPlanWeights } from '@/services/training/drillSelector';

function createDomainPerf(overrides: Partial<DomainPerformance> = {}): DomainPerformance {
  return {
    domain: 'arithmetic',
    domainLabel: 'Arithmetic',
    recentAccuracy: 70,
    previousAccuracy: 65,
    trend: 5,
    totalDrills: 20,
    avgResponseTime: 3000,
    currentDifficulty: 'medium',
    ...overrides,
  };
}

const EQUAL_WEIGHTS: TrainingPlanWeights = {
  numberSense: 1 / 6,
  placeValue: 1 / 6,
  sequencing: 1 / 6,
  arithmetic: 1 / 6,
  spatial: 1 / 6,
  applied: 1 / 6,
};

describe('calculateInsightWeightAdjustments', () => {
  it('returns 1.3 multiplier for weak domains (accuracy < 50%)', () => {
    const result = calculateInsightWeightAdjustments([
      createDomainPerf({ domain: 'placeValue', recentAccuracy: 35 }),
    ]);

    expect(result.placeValue).toBe(1.3);
  });

  it('returns 1.15 multiplier for moderate-weak domains (accuracy 50-70%)', () => {
    const result = calculateInsightWeightAdjustments([
      createDomainPerf({ domain: 'sequencing', recentAccuracy: 60 }),
    ]);

    expect(result.sequencing).toBe(1.15);
  });

  it('returns 0.85 multiplier for strong domains (accuracy > 85%)', () => {
    const result = calculateInsightWeightAdjustments([
      createDomainPerf({ domain: 'arithmetic', recentAccuracy: 92 }),
    ]);

    expect(result.arithmetic).toBe(0.85);
  });

  it('returns 1.0 multiplier for domains in the normal range (70-85%)', () => {
    const result = calculateInsightWeightAdjustments([
      createDomainPerf({ domain: 'spatial', recentAccuracy: 75 }),
    ]);

    expect(result.spatial).toBe(1.0);
  });

  it('returns 1.0 for domains with 0 drills completed', () => {
    const result = calculateInsightWeightAdjustments([
      createDomainPerf({ domain: 'applied', totalDrills: 0, recentAccuracy: 0 }),
    ]);

    expect(result.applied).toBe(1.0);
  });

  it('handles multiple domains correctly', () => {
    const result = calculateInsightWeightAdjustments([
      createDomainPerf({ domain: 'numberSense', recentAccuracy: 30 }),   // weak → 1.3
      createDomainPerf({ domain: 'arithmetic', recentAccuracy: 55 }),    // moderate → 1.15
      createDomainPerf({ domain: 'spatial', recentAccuracy: 90 }),       // strong → 0.85
      createDomainPerf({ domain: 'applied', recentAccuracy: 75 }),       // normal → 1.0
    ]);

    expect(result.numberSense).toBe(1.3);
    expect(result.arithmetic).toBe(1.15);
    expect(result.spatial).toBe(0.85);
    expect(result.applied).toBe(1.0);
  });

  it('returns empty object for empty input', () => {
    const result = calculateInsightWeightAdjustments([]);
    expect(result).toEqual({});
  });

  it('boundary: accuracy exactly 50% gets moderate boost', () => {
    const result = calculateInsightWeightAdjustments([
      createDomainPerf({ domain: 'placeValue', recentAccuracy: 50 }),
    ]);
    expect(result.placeValue).toBe(1.15);
  });

  it('boundary: accuracy exactly 70% gets normal multiplier', () => {
    const result = calculateInsightWeightAdjustments([
      createDomainPerf({ domain: 'placeValue', recentAccuracy: 70 }),
    ]);
    expect(result.placeValue).toBe(1.0);
  });

  it('boundary: accuracy exactly 85% gets normal multiplier (not reduced)', () => {
    const result = calculateInsightWeightAdjustments([
      createDomainPerf({ domain: 'placeValue', recentAccuracy: 85 }),
    ]);
    expect(result.placeValue).toBe(1.0);
  });
});

describe('applyInsightWeightAdjustments', () => {
  it('applies multipliers and re-normalizes to sum to 1.0', () => {
    const adjustments = { arithmetic: 1.3, placeValue: 0.85 };
    const result = applyInsightWeightAdjustments(EQUAL_WEIGHTS, adjustments);

    const sum = Object.values(result).reduce((acc, v) => acc + v, 0);
    expect(sum).toBeCloseTo(1.0, 10);
  });

  it('increases weight for boosted domains', () => {
    const adjustments = { numberSense: 1.3 };
    const result = applyInsightWeightAdjustments(EQUAL_WEIGHTS, adjustments);

    // numberSense should have higher weight than other domains
    expect(result.numberSense).toBeGreaterThan(result.placeValue);
  });

  it('decreases weight for reduced domains', () => {
    const adjustments = { arithmetic: 0.85 };
    const result = applyInsightWeightAdjustments(EQUAL_WEIGHTS, adjustments);

    // arithmetic should have lower weight than other unchanged domains
    expect(result.arithmetic).toBeLessThan(result.placeValue);
  });

  it('returns original weights when all adjustments are 1.0', () => {
    const adjustments = {
      numberSense: 1.0,
      placeValue: 1.0,
      sequencing: 1.0,
      arithmetic: 1.0,
      spatial: 1.0,
      applied: 1.0,
    };
    const result = applyInsightWeightAdjustments(EQUAL_WEIGHTS, adjustments);

    for (const key of Object.keys(EQUAL_WEIGHTS) as (keyof TrainingPlanWeights)[]) {
      expect(result[key]).toBeCloseTo(EQUAL_WEIGHTS[key], 10);
    }
  });

  it('uses 1.0 as default for domains not in adjustments', () => {
    const adjustments = { arithmetic: 2.0 };
    const result = applyInsightWeightAdjustments(EQUAL_WEIGHTS, adjustments);

    // All non-arithmetic domains should be equal to each other
    expect(result.numberSense).toBeCloseTo(result.placeValue, 10);
    expect(result.placeValue).toBeCloseTo(result.sequencing, 10);
    // Arithmetic should be higher
    expect(result.arithmetic).toBeGreaterThan(result.numberSense);
  });

  it('returns original weights when empty adjustments', () => {
    const result = applyInsightWeightAdjustments(EQUAL_WEIGHTS, {});

    for (const key of Object.keys(EQUAL_WEIGHTS) as (keyof TrainingPlanWeights)[]) {
      expect(result[key]).toBeCloseTo(EQUAL_WEIGHTS[key], 10);
    }
  });

  it('handles non-equal weights correctly', () => {
    const weights: TrainingPlanWeights = {
      numberSense: 0.3,
      placeValue: 0.1,
      sequencing: 0.15,
      arithmetic: 0.2,
      spatial: 0.1,
      applied: 0.15,
    };
    const adjustments = { numberSense: 0.85, placeValue: 1.3 };
    const result = applyInsightWeightAdjustments(weights, adjustments);

    const sum = Object.values(result).reduce((acc, v) => acc + v, 0);
    expect(sum).toBeCloseTo(1.0, 10);

    // placeValue should increase relative to its original proportion
    expect(result.placeValue / result.numberSense).toBeGreaterThan(
      weights.placeValue / weights.numberSense,
    );
  });

  it('safety: returns original weights if all adjusted weights are zero', () => {
    const zeroWeights: TrainingPlanWeights = {
      numberSense: 0,
      placeValue: 0,
      sequencing: 0,
      arithmetic: 0,
      spatial: 0,
      applied: 0,
    };
    const result = applyInsightWeightAdjustments(zeroWeights, { arithmetic: 1.3 });

    // Should return original (all zeros) as safety fallback
    expect(result).toEqual(zeroWeights);
  });
});
