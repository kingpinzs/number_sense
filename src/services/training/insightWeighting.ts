/**
 * Insight Weight Adjustments
 *
 * Given InsightEngine's domain performance data, generates weight multipliers
 * for drill selection. Weak domains get boosted, strong domains get slightly
 * reduced. Falls back to 1.0 (no change) for domains without data.
 */

import type { DomainPerformance } from '@/services/training/insightTypes';
import type { TrainingPlanWeights } from '@/services/training/drillSelector';

/** Accuracy thresholds for weight adjustment tiers */
const WEAK_THRESHOLD = 50;
const MODERATE_THRESHOLD = 70;
const STRONG_THRESHOLD = 85;

/** Weight multipliers per tier */
const WEAK_BOOST = 1.3;
const MODERATE_BOOST = 1.15;
const STRONG_REDUCTION = 0.85;
const DEFAULT_MULTIPLIER = 1.0;

/**
 * Calculate weight adjustment multipliers from domain performance data.
 *
 * - Domains with accuracy < 50% -> 1.3x weight boost
 * - Domains with accuracy 50-70% -> 1.15x
 * - Domains with accuracy > 85% -> 0.85x (slight reduction)
 * - Default: 1.0
 *
 * @param domainPerformance - Per-domain performance snapshots from InsightEngine
 * @returns Record mapping domain keys to multipliers
 */
export function calculateInsightWeightAdjustments(
  domainPerformance: DomainPerformance[],
): Record<string, number> {
  const adjustments: Record<string, number> = {};

  for (const dp of domainPerformance) {
    if (dp.totalDrills === 0) {
      adjustments[dp.domain] = DEFAULT_MULTIPLIER;
      continue;
    }

    if (dp.recentAccuracy < WEAK_THRESHOLD) {
      adjustments[dp.domain] = WEAK_BOOST;
    } else if (dp.recentAccuracy < MODERATE_THRESHOLD) {
      adjustments[dp.domain] = MODERATE_BOOST;
    } else if (dp.recentAccuracy > STRONG_THRESHOLD) {
      adjustments[dp.domain] = STRONG_REDUCTION;
    } else {
      adjustments[dp.domain] = DEFAULT_MULTIPLIER;
    }
  }

  return adjustments;
}

/**
 * Apply insight-derived weight adjustments to assessment-based training weights.
 * Multiplies each domain weight by its adjustment factor, then re-normalizes
 * so all weights sum to 1.0.
 *
 * @param weights - Original assessment-derived weights
 * @param adjustments - Domain-keyed multipliers from calculateInsightWeightAdjustments
 * @returns New TrainingPlanWeights with adjustments applied
 */
export function applyInsightWeightAdjustments(
  weights: TrainingPlanWeights,
  adjustments: Record<string, number>,
): TrainingPlanWeights {
  const adjusted: Record<string, number> = {};
  const domainKeys = Object.keys(weights) as (keyof TrainingPlanWeights)[];

  for (const domain of domainKeys) {
    const multiplier = adjustments[domain] ?? DEFAULT_MULTIPLIER;
    adjusted[domain] = weights[domain] * multiplier;
  }

  // Re-normalize to sum to 1.0
  const sum = Object.values(adjusted).reduce((acc, v) => acc + v, 0);
  if (sum === 0) return weights; // safety fallback

  const result = { ...weights };
  for (const domain of domainKeys) {
    result[domain] = adjusted[domain] / sum;
  }

  return result;
}
