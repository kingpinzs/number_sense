// Tests for Symptom Weighting Service
// Testing: calculateSymptomBoost, applySymptomBoost

import { describe, it, expect } from 'vitest';
import { calculateSymptomBoost, applySymptomBoost } from './symptomWeighting';
import type { SymptomChecklistEntry, Domain } from '@/features/self-discovery/types';
import type { TrainingPlanWeights } from '@/services/training/drillSelector';

const ALL_DOMAINS: Domain[] = ['numberSense', 'placeValue', 'sequencing', 'arithmetic', 'spatial', 'applied'];

/** Create a checklist entry with specified domain impacts */
function makeChecklist(impacts: Partial<Record<Domain, number>>): SymptomChecklistEntry {
  return {
    timestamp: '2026-03-10T10:00:00.000Z',
    symptoms: [],
    domainImpact: {
      numberSense: 0,
      placeValue: 0,
      sequencing: 0,
      arithmetic: 0,
      spatial: 0,
      applied: 0,
      ...impacts,
    },
  };
}

/** Create equal training plan weights (1/6 each) */
function makeEqualWeights(): TrainingPlanWeights {
  return {
    numberSense: 1 / 6,
    placeValue: 1 / 6,
    sequencing: 1 / 6,
    arithmetic: 1 / 6,
    spatial: 1 / 6,
    applied: 1 / 6,
  };
}

describe('calculateSymptomBoost', () => {
  it('returns 1.0 for all domains when impact is 0', () => {
    const checklist = makeChecklist({});
    const boost = calculateSymptomBoost(checklist);

    for (const domain of ALL_DOMAINS) {
      expect(boost[domain]).toBe(1);
    }
  });

  it('returns 1.5 (MAX_BOOST) for all domains when impact is 1.0', () => {
    const checklist = makeChecklist({
      numberSense: 1,
      placeValue: 1,
      sequencing: 1,
      arithmetic: 1,
      spatial: 1,
      applied: 1,
    });

    const boost = calculateSymptomBoost(checklist);

    for (const domain of ALL_DOMAINS) {
      expect(boost[domain]).toBeCloseTo(1.5, 5);
    }
  });

  it('returns 1.25 for domains with 0.5 impact (midpoint)', () => {
    const checklist = makeChecklist({
      numberSense: 0.5,
      placeValue: 0.5,
      sequencing: 0.5,
      arithmetic: 0.5,
      spatial: 0.5,
      applied: 0.5,
    });

    const boost = calculateSymptomBoost(checklist);

    for (const domain of ALL_DOMAINS) {
      expect(boost[domain]).toBeCloseTo(1.25, 5);
    }
  });

  it('calculates per-domain boost independently', () => {
    const checklist = makeChecklist({
      numberSense: 0,
      placeValue: 0.25,
      sequencing: 0.5,
      arithmetic: 0.75,
      spatial: 1.0,
      applied: 0,
    });

    const boost = calculateSymptomBoost(checklist);

    expect(boost.numberSense).toBeCloseTo(1.0, 5);
    expect(boost.placeValue).toBeCloseTo(1.125, 5);  // 1 + 0.25 * 0.5
    expect(boost.sequencing).toBeCloseTo(1.25, 5);   // 1 + 0.5 * 0.5
    expect(boost.arithmetic).toBeCloseTo(1.375, 5);  // 1 + 0.75 * 0.5
    expect(boost.spatial).toBeCloseTo(1.5, 5);       // 1 + 1.0 * 0.5
    expect(boost.applied).toBeCloseTo(1.0, 5);
  });

  it('handles missing domainImpact values by defaulting to 0', () => {
    // Create a checklist with partial domainImpact
    const checklist: SymptomChecklistEntry = {
      timestamp: '2026-03-10T10:00:00.000Z',
      symptoms: [],
      domainImpact: {
        numberSense: 0.5,
        placeValue: 0,
        sequencing: 0,
        arithmetic: 0,
        spatial: 0,
        applied: 0,
      },
    };
    // Simulate a missing property by deleting it
    delete (checklist.domainImpact as Record<string, number>)['placeValue'];

    const boost = calculateSymptomBoost(checklist);

    expect(boost.numberSense).toBeCloseTo(1.25, 5);
    // Missing value defaults to 0 via ?? operator → boost = 1.0
    expect(boost.placeValue).toBeCloseTo(1.0, 5);
  });

  it('returns boost values strictly between 1.0 and 1.5 inclusive', () => {
    const checklist = makeChecklist({
      numberSense: 0.1,
      placeValue: 0.3,
      sequencing: 0.7,
      arithmetic: 0.9,
      spatial: 0.4,
      applied: 0.6,
    });

    const boost = calculateSymptomBoost(checklist);

    for (const domain of ALL_DOMAINS) {
      expect(boost[domain]).toBeGreaterThanOrEqual(1.0);
      expect(boost[domain]).toBeLessThanOrEqual(1.5);
    }
  });
});

describe('applySymptomBoost', () => {
  it('preserves normalization — output sums to 1.0', () => {
    const baseWeights = makeEqualWeights();
    const boost: Record<Domain, number> = {
      numberSense: 1.5,
      placeValue: 1.0,
      sequencing: 1.0,
      arithmetic: 1.0,
      spatial: 1.0,
      applied: 1.0,
    };

    const result = applySymptomBoost(baseWeights, boost);
    const sum = Object.values(result).reduce((a, b) => a + b, 0);

    expect(sum).toBeCloseTo(1.0, 5);
  });

  it('no-op when all boosts are 1.0 (equal weights stay equal)', () => {
    const baseWeights = makeEqualWeights();
    const boost: Record<Domain, number> = {
      numberSense: 1,
      placeValue: 1,
      sequencing: 1,
      arithmetic: 1,
      spatial: 1,
      applied: 1,
    };

    const result = applySymptomBoost(baseWeights, boost);

    for (const domain of ALL_DOMAINS) {
      expect(result[domain]).toBeCloseTo(1 / 6, 5);
    }
  });

  it('increases weight of boosted domain relative to others', () => {
    const baseWeights = makeEqualWeights();
    const boost: Record<Domain, number> = {
      numberSense: 1.5,
      placeValue: 1,
      sequencing: 1,
      arithmetic: 1,
      spatial: 1,
      applied: 1,
    };

    const result = applySymptomBoost(baseWeights, boost);

    // numberSense should be higher than other domains
    expect(result.numberSense).toBeGreaterThan(result.placeValue);
    expect(result.numberSense).toBeGreaterThan(result.sequencing);
    expect(result.numberSense).toBeGreaterThan(result.arithmetic);
    expect(result.numberSense).toBeGreaterThan(result.spatial);
    expect(result.numberSense).toBeGreaterThan(result.applied);
  });

  it('caps individual boosts at MAX_BOOST (1.5)', () => {
    const baseWeights = makeEqualWeights();
    // Provide boost values exceeding 1.5
    const boost: Record<Domain, number> = {
      numberSense: 3.0,   // Should be capped at 1.5
      placeValue: 2.0,    // Should be capped at 1.5
      sequencing: 1.0,
      arithmetic: 1.0,
      spatial: 1.0,
      applied: 1.0,
    };

    const result = applySymptomBoost(baseWeights, boost);

    // Both numberSense and placeValue were capped to 1.5, so they should be equal
    expect(result.numberSense).toBeCloseTo(result.placeValue, 5);

    // They should still be greater than the non-boosted domains
    expect(result.numberSense).toBeGreaterThan(result.sequencing);
  });

  it('handles zero weights by returning base weights', () => {
    const zeroWeights: TrainingPlanWeights = {
      numberSense: 0,
      placeValue: 0,
      sequencing: 0,
      arithmetic: 0,
      spatial: 0,
      applied: 0,
    };
    const boost: Record<Domain, number> = {
      numberSense: 1.5,
      placeValue: 1.0,
      sequencing: 1.0,
      arithmetic: 1.0,
      spatial: 1.0,
      applied: 1.0,
    };

    const result = applySymptomBoost(zeroWeights, boost);

    // When sum is 0, returns base weights unchanged
    expect(result).toEqual(zeroWeights);
  });

  it('correctly re-normalizes after applying asymmetric boosts', () => {
    const baseWeights: TrainingPlanWeights = {
      numberSense: 0.3,
      placeValue: 0.2,
      sequencing: 0.1,
      arithmetic: 0.2,
      spatial: 0.1,
      applied: 0.1,
    };
    const boost: Record<Domain, number> = {
      numberSense: 1.5,
      placeValue: 1.0,
      sequencing: 1.25,
      arithmetic: 1.0,
      spatial: 1.5,
      applied: 1.0,
    };

    const result = applySymptomBoost(baseWeights, boost);

    // Verify sum = 1.0
    const sum = Object.values(result).reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1.0, 5);

    // Verify individual boosted values are correct
    // raw boosted: numberSense=0.3*1.5=0.45, placeValue=0.2*1.0=0.2, sequencing=0.1*1.25=0.125,
    //              arithmetic=0.2*1.0=0.2, spatial=0.1*1.5=0.15, applied=0.1*1.0=0.1
    // sum = 0.45+0.2+0.125+0.2+0.15+0.1 = 1.225
    expect(result.numberSense).toBeCloseTo(0.45 / 1.225, 5);
    expect(result.placeValue).toBeCloseTo(0.2 / 1.225, 5);
    expect(result.sequencing).toBeCloseTo(0.125 / 1.225, 5);
    expect(result.arithmetic).toBeCloseTo(0.2 / 1.225, 5);
    expect(result.spatial).toBeCloseTo(0.15 / 1.225, 5);
    expect(result.applied).toBeCloseTo(0.1 / 1.225, 5);
  });

  it('all output weights are non-negative', () => {
    const baseWeights: TrainingPlanWeights = {
      numberSense: 0.5,
      placeValue: 0.1,
      sequencing: 0.1,
      arithmetic: 0.1,
      spatial: 0.1,
      applied: 0.1,
    };
    const boost: Record<Domain, number> = {
      numberSense: 1.5,
      placeValue: 1.5,
      sequencing: 1.0,
      arithmetic: 1.0,
      spatial: 1.25,
      applied: 1.0,
    };

    const result = applySymptomBoost(baseWeights, boost);

    for (const domain of ALL_DOMAINS) {
      expect(result[domain]).toBeGreaterThanOrEqual(0);
    }
  });

  it('preserves relative ordering when boosts are uniform', () => {
    const baseWeights: TrainingPlanWeights = {
      numberSense: 0.4,
      placeValue: 0.2,
      sequencing: 0.15,
      arithmetic: 0.1,
      spatial: 0.1,
      applied: 0.05,
    };
    const uniformBoost: Record<Domain, number> = {
      numberSense: 1.3,
      placeValue: 1.3,
      sequencing: 1.3,
      arithmetic: 1.3,
      spatial: 1.3,
      applied: 1.3,
    };

    const result = applySymptomBoost(baseWeights, uniformBoost);

    // With uniform boost, relative order should be preserved
    expect(result.numberSense).toBeGreaterThan(result.placeValue);
    expect(result.placeValue).toBeGreaterThan(result.sequencing);
    expect(result.sequencing).toBeGreaterThan(result.arithmetic);
    expect(result.arithmetic).toBeGreaterThan(result.applied);
  });

  it('handles a domain with 0 base weight — stays at 0 after boost', () => {
    const baseWeights: TrainingPlanWeights = {
      numberSense: 0.5,
      placeValue: 0,
      sequencing: 0.2,
      arithmetic: 0.2,
      spatial: 0.05,
      applied: 0.05,
    };
    const boost: Record<Domain, number> = {
      numberSense: 1.0,
      placeValue: 1.5,   // Boost a domain with 0 base weight
      sequencing: 1.0,
      arithmetic: 1.0,
      spatial: 1.0,
      applied: 1.0,
    };

    const result = applySymptomBoost(baseWeights, boost);

    // 0 * 1.5 = 0, still 0 after normalization
    expect(result.placeValue).toBe(0);
    // Sum should still be 1.0
    const sum = Object.values(result).reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1.0, 5);
  });
});
