// Symptom-to-training weight integration
// Applies symptom checklist domain impact as a boost multiplier on assessment weights

import type { SymptomChecklistEntry, Domain } from '@/features/self-discovery/types';
import type { TrainingPlanWeights } from '@/services/training/drillSelector';

const ALL_DOMAINS: Domain[] = ['numberSense', 'placeValue', 'sequencing', 'arithmetic', 'spatial', 'applied'];

/** Maximum boost multiplier per domain */
const MAX_BOOST = 1.5;

/**
 * Calculate a per-domain boost multiplier from a symptom checklist
 *
 * Impact 0.0 → 1.0x (no boost)
 * Impact 0.5 → 1.25x
 * Impact 1.0 → 1.5x (max boost)
 */
export function calculateSymptomBoost(
  checklist: SymptomChecklistEntry
): Record<Domain, number> {
  const boost: Record<Domain, number> = {
    numberSense: 1, placeValue: 1, sequencing: 1,
    arithmetic: 1, spatial: 1, applied: 1,
  };

  for (const domain of ALL_DOMAINS) {
    const impact = checklist.domainImpact[domain] ?? 0;
    // Linear interpolation from 1.0 to MAX_BOOST based on impact
    boost[domain] = 1 + impact * (MAX_BOOST - 1);
  }

  return boost;
}

/**
 * Apply symptom boost to assessment-derived training weights
 * Multiplies each weight by the boost, then re-normalizes to sum to 1.0
 * Individual boosts capped at MAX_BOOST (1.5x)
 */
export function applySymptomBoost(
  baseWeights: TrainingPlanWeights,
  boost: Record<Domain, number>
): TrainingPlanWeights {
  const boosted: Record<Domain, number> = {
    numberSense: baseWeights.numberSense * Math.min(boost.numberSense, MAX_BOOST),
    placeValue: baseWeights.placeValue * Math.min(boost.placeValue, MAX_BOOST),
    sequencing: baseWeights.sequencing * Math.min(boost.sequencing, MAX_BOOST),
    arithmetic: baseWeights.arithmetic * Math.min(boost.arithmetic, MAX_BOOST),
    spatial: baseWeights.spatial * Math.min(boost.spatial, MAX_BOOST),
    applied: baseWeights.applied * Math.min(boost.applied, MAX_BOOST),
  };

  // Re-normalize to sum to 1.0
  const sum = Object.values(boosted).reduce((acc, v) => acc + v, 0);
  if (sum === 0) return baseWeights;

  return {
    numberSense: boosted.numberSense / sum,
    placeValue: boosted.placeValue / sum,
    sequencing: boosted.sequencing / sum,
    arithmetic: boosted.arithmetic / sum,
    spatial: boosted.spatial / sum,
    applied: boosted.applied / sum,
  };
}
