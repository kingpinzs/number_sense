// statsCalculator.ts - Pure statistical analysis service for A/B experiment results
// Story 8.3: Build Experiment Results Dashboard
//
// Pure service — no React or Dexie imports.
// Receives raw number[] arrays from the component layer, returns typed result objects.

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface VariantComparison {
  controlMean: number;
  controlStdDev: number;
  treatmentMean: number;
  treatmentStdDev: number;
  /** treatmentMean - controlMean */
  difference: number;
  /** (difference / controlMean) * 100; always 0 when controlMean === 0 */
  percentChange: number;
  /** 'high' | 'moderate' | 'low' based on significance thresholds */
  significance: 'high' | 'moderate' | 'low';
}

// ─── Functions ─────────────────────────────────────────────────────────────────

/**
 * Calculates the arithmetic mean of an array of numbers.
 * Returns 0 for an empty array.
 */
export function calculateMean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

/**
 * Calculates the population standard deviation of an array of numbers.
 * Returns 0 for empty or single-element arrays.
 *
 * @param values - Array of numeric values
 * @param mean - Optional pre-computed mean (avoids re-computation if available)
 */
export function calculateStdDev(values: number[], mean?: number): number {
  if (values.length <= 1) return 0;
  const m = mean ?? calculateMean(values);
  const variance = values.reduce((sum, v) => sum + (v - m) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

/**
 * Compares control and treatment variant observation arrays and returns a typed
 * VariantComparison with means, standard deviations, difference, percent change,
 * and a significance classification.
 *
 * Significance thresholds:
 *   'high'     — |percentChange| > 10% OR |difference| > 0.5 * controlStdDev
 *   'moderate' — |percentChange| >= 5%
 *   'low'      — |percentChange| < 5%
 *
 * Note: This is descriptive statistics for display — not rigorous inferential testing.
 */
export function compareVariants(
  controlValues: number[],
  treatmentValues: number[]
): VariantComparison {
  const controlMean = calculateMean(controlValues);
  const controlStdDev = calculateStdDev(controlValues, controlMean);
  const treatmentMean = calculateMean(treatmentValues);
  const treatmentStdDev = calculateStdDev(treatmentValues, treatmentMean);

  const difference = treatmentMean - controlMean;
  const percentChange = controlMean === 0 ? 0 : (difference / controlMean) * 100;

  const absPercent = Math.abs(percentChange);
  const absDiff = Math.abs(difference);

  let significance: 'high' | 'moderate' | 'low';
  if (absPercent > 10 || (controlStdDev > 0 && absDiff > 0.5 * controlStdDev)) {
    significance = 'high';
  } else if (absPercent >= 5) {
    significance = 'moderate';
  } else {
    significance = 'low';
  }

  return {
    controlMean,
    controlStdDev,
    treatmentMean,
    treatmentStdDev,
    difference,
    percentChange,
    significance,
  };
}
