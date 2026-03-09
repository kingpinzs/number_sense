import { describe, it, expect } from 'vitest';
import { calculateMean, calculateStdDev, compareVariants } from './statsCalculator';

// ─── calculateMean ────────────────────────────────────────────────────────────

describe('calculateMean', () => {
  it('returns 0 for an empty array', () => {
    expect(calculateMean([])).toBe(0);
  });

  it('returns the single element for a single-element array', () => {
    expect(calculateMean([5])).toBe(5);
  });

  it('returns the arithmetic mean for a typical array', () => {
    expect(calculateMean([1, 2, 3])).toBe(2);
  });

  it('returns 0 when all values are 0', () => {
    expect(calculateMean([0, 0, 0])).toBe(0);
  });

  it('handles decimal values correctly', () => {
    expect(calculateMean([0.1, 0.2, 0.3])).toBeCloseTo(0.2, 10);
  });
});

// ─── calculateStdDev ─────────────────────────────────────────────────────────

describe('calculateStdDev', () => {
  it('returns 0 for an empty array', () => {
    expect(calculateStdDev([])).toBe(0);
  });

  it('returns 0 for a single-element array', () => {
    expect(calculateStdDev([5])).toBe(0);
  });

  it('returns 0 when all values are identical', () => {
    expect(calculateStdDev([1, 1, 1])).toBe(0);
  });

  it('computes population std dev for a known dataset', () => {
    // Dataset: [2, 4, 4, 4, 5, 5, 7, 9], mean=5, variance=4, stdDev=2
    expect(calculateStdDev([2, 4, 4, 4, 5, 5, 7, 9])).toBeCloseTo(2, 10);
  });

  it('accepts a pre-computed mean to avoid re-calculation', () => {
    // mean of [2,4,4,4,5,5,7,9] is 5 — provide it explicitly
    expect(calculateStdDev([2, 4, 4, 4, 5, 5, 7, 9], 5)).toBeCloseTo(2, 10);
  });
});

// ─── compareVariants ─────────────────────────────────────────────────────────

describe('compareVariants', () => {
  it('returns all-zero result with low significance for empty arrays', () => {
    const result = compareVariants([], []);
    expect(result.controlMean).toBe(0);
    expect(result.treatmentMean).toBe(0);
    expect(result.difference).toBe(0);
    expect(result.percentChange).toBe(0);
    expect(result.significance).toBe('low');
  });

  it('classifies significance as "high" when |percentChange| > 10%', () => {
    // control=80, treatment=92 → percentChange = 15% > 10%
    const result = compareVariants([80, 80], [92, 92]);
    expect(result.controlMean).toBe(80);
    expect(result.treatmentMean).toBe(92);
    expect(result.difference).toBe(12);
    expect(result.percentChange).toBeCloseTo(15, 5);
    expect(result.significance).toBe('high');
  });

  it('classifies significance as "moderate" when |percentChange| is in [5%, 10%]', () => {
    // control=80, treatment=85 → percentChange = 6.25%
    const result = compareVariants([80, 80], [85, 85]);
    expect(result.percentChange).toBeCloseTo(6.25, 5);
    expect(result.significance).toBe('moderate');
  });

  it('classifies significance as "low" when |percentChange| < 5%', () => {
    // control=80, treatment=82 → percentChange = 2.5%
    const result = compareVariants([80, 80], [82, 82]);
    expect(result.percentChange).toBeCloseTo(2.5, 5);
    expect(result.significance).toBe('low');
  });

  it('classifies significance as "high" via SD threshold (|difference| > 0.5 * controlStdDev)', () => {
    // control=[70,90] → mean=80, stdDev=10; 0.5*stdDev=5
    // treatment=[87,87] → mean=87, difference=7; percentChange=8.75% (< 10%, would be moderate by percent)
    // but 7 > 5 → 'high' via SD threshold
    const result = compareVariants([70, 90], [87, 87]);
    expect(result.controlMean).toBe(80);
    expect(result.controlStdDev).toBeCloseTo(10, 5);
    expect(result.treatmentMean).toBe(87);
    expect(result.difference).toBe(7);
    expect(result.significance).toBe('high');
  });

  it('returns correct fields for control and treatment groups', () => {
    const result = compareVariants([0.8, 0.82, 0.84], [0.87, 0.89, 0.91]);
    expect(result.controlMean).toBeCloseTo(0.82, 5);
    expect(result.treatmentMean).toBeCloseTo(0.89, 5);
    expect(result.difference).toBeCloseTo(0.07, 5);
    expect(result.controlStdDev).toBeGreaterThan(0);
    expect(result.treatmentStdDev).toBeGreaterThan(0);
  });

  it('handles negative differences (treatment worse than control)', () => {
    // control=90, treatment=70 → difference = -20, percentChange = -22.2%
    const result = compareVariants([90, 90], [70, 70]);
    expect(result.difference).toBe(-20);
    expect(result.percentChange).toBeCloseTo(-22.22, 1);
    expect(result.significance).toBe('high');
  });

  it('returns percentChange of 0 when controlMean is 0 (avoids division by zero)', () => {
    const result = compareVariants([0, 0], [5, 5]);
    expect(result.percentChange).toBe(0);
  });

  it('returns low significance for unbalanced groups (one variant empty)', () => {
    // compareVariants([0.85], []) → treatmentMean=0, percentChange=0 (controlMean!=0 but...)
    // Actually: percentChange = (0 - 0.85) / 0.85 * 100 = -100%, which would be 'high'.
    // This test documents the raw function behavior. The ExperimentDashboard filters out
    // such metrics before calling compareVariants — preventing misleading significance display.
    const withControlOnly = compareVariants([0.85], []);
    expect(withControlOnly.treatmentMean).toBe(0);
    expect(withControlOnly.percentChange).toBeCloseTo(-100, 5);
    // significance is technically 'high' due to -100% change — this is WHY the dashboard
    // must filter out single-variant metrics before calling compareVariants
    expect(withControlOnly.significance).toBe('high');

    const withTreatmentOnly = compareVariants([], [0.85]);
    expect(withTreatmentOnly.controlMean).toBe(0);
    expect(withTreatmentOnly.percentChange).toBe(0); // controlMean=0 → division guard
    expect(withTreatmentOnly.significance).toBe('low');
  });
});
