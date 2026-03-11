// Drill selection service - Weighted random drill selection
// Story 3.1: Build Training Session Shell and State Management
// Task 4: Implement Drill Selection Service

import { db } from '@/services/storage/db';
import { calculateSymptomBoost, applySymptomBoost } from '@/services/assessment/symptomWeighting';

/**
 * Training plan weights from assessment (6 domains)
 */
export interface TrainingPlanWeights {
  numberSense: number;  // 0.0 - 1.0
  placeValue: number;
  sequencing: number;
  arithmetic: number;
  spatial: number;
  applied: number;
}

/**
 * Domain mapping between Assessment weaknesses/strengths and TrainingPlanWeights
 */
const DOMAIN_WEIGHT_MAP: Record<string, keyof TrainingPlanWeights> = {
  'number_sense': 'numberSense',
  'number-sense': 'numberSense',
  'place_value': 'placeValue',
  'place-value': 'placeValue',
  'sequencing': 'sequencing',
  'arithmetic': 'arithmetic',
  'spatial': 'spatial',
  'spatial_rotation': 'spatial',
  'spatial-rotation': 'spatial',
  'applied': 'applied',
  // Legacy mappings for backward compatibility
  'operations': 'arithmetic',
  'math_operations': 'arithmetic',
  'math-operations': 'arithmetic',
};

/**
 * Load training plan weights from latest completed assessment
 * Handles backward compatibility with old 3-domain assessments
 *
 * @returns Promise<TrainingPlanWeights> - Normalized weights based on assessment
 * @throws Error if no completed assessment exists
 */
export async function loadTrainingPlanWeights(): Promise<TrainingPlanWeights> {
  // Query latest completed assessment
  const latestAssessment = await db.assessments
    .orderBy('timestamp')
    .reverse()
    .first();

  if (!latestAssessment || latestAssessment.status !== 'completed') {
    throw new Error('No completed assessment found. Please complete assessment first.');
  }

  // Derive weights from weaknesses/strengths arrays
  const rawWeights: Record<keyof TrainingPlanWeights, number> = {
    numberSense: 1.0,  // Default to moderate
    placeValue: 1.0,
    sequencing: 1.0,
    arithmetic: 1.0,
    spatial: 1.0,
    applied: 1.0,
  };

  // Apply weakness weights (2.0x)
  for (const weakness of latestAssessment.weaknesses) {
    const mappedDomain = DOMAIN_WEIGHT_MAP[weakness];
    if (mappedDomain) {
      rawWeights[mappedDomain] = 2.0;
    }
  }

  // Apply strength weights (0.5x)
  for (const strength of latestAssessment.strengths) {
    const mappedDomain = DOMAIN_WEIGHT_MAP[strength];
    if (mappedDomain) {
      rawWeights[mappedDomain] = 0.5;
    }
  }

  // Normalize weights to sum to 1.0
  const sum = Object.values(rawWeights).reduce((acc, weight) => acc + weight, 0);

  const domainCount = Object.keys(rawWeights).length;
  if (sum === 0) {
    const equalWeight = 1 / domainCount;
    return {
      numberSense: equalWeight,
      placeValue: equalWeight,
      sequencing: equalWeight,
      arithmetic: equalWeight,
      spatial: equalWeight,
      applied: equalWeight,
    };
  }

  // Normalize each weight
  let normalizedWeights: TrainingPlanWeights = {
    numberSense: rawWeights.numberSense / sum,
    placeValue: rawWeights.placeValue / sum,
    sequencing: rawWeights.sequencing / sum,
    arithmetic: rawWeights.arithmetic / sum,
    spatial: rawWeights.spatial / sum,
    applied: rawWeights.applied / sum,
  };

  // Apply symptom boost if a symptom checklist exists (backward compatible)
  try {
    const latestChecklist = await db.symptom_checklists
      .orderBy('timestamp')
      .reverse()
      .first();

    if (latestChecklist) {
      const boost = calculateSymptomBoost(latestChecklist);
      normalizedWeights = applySymptomBoost(normalizedWeights, boost);
    }
  } catch {
    // Silently ignore — no symptom data means no boost
  }

  return normalizedWeights;
}

/**
 * Drill types available in training (13 total across 6 domains)
 */
export type DrillType =
  | 'number_line' | 'subitizing' | 'magnitude_comparison'
  | 'place_value' | 'estimation' | 'number_decomposition'
  | 'sequencing' | 'rhythmic_counting'
  | 'math_operations' | 'number_bonds' | 'fact_fluency' | 'mental_math_strategy' | 'fact_family'
  | 'spatial_rotation'
  | 'fractions' | 'time_measurement' | 'working_memory' | 'everyday_math';

/**
 * All available drill types grouped by their training domain.
 * Multi-drill domains rotate to ensure variety.
 */
const DOMAIN_DRILLS: Record<keyof TrainingPlanWeights, DrillType[]> = {
  numberSense: ['number_line', 'subitizing', 'magnitude_comparison'],
  placeValue: ['place_value', 'estimation', 'number_decomposition'],
  sequencing: ['sequencing', 'rhythmic_counting'],
  arithmetic: ['math_operations', 'number_bonds', 'fact_fluency', 'mental_math_strategy', 'fact_family'],
  spatial: ['spatial_rotation'],
  applied: ['fractions', 'time_measurement', 'working_memory', 'everyday_math'],
};

const ALL_DRILL_TYPES: DrillType[] = [
  'number_line', 'subitizing', 'magnitude_comparison',
  'place_value', 'estimation', 'number_decomposition',
  'sequencing', 'rhythmic_counting',
  'math_operations', 'number_bonds', 'fact_fluency', 'mental_math_strategy', 'fact_family',
  'spatial_rotation',
  'fractions', 'time_measurement', 'working_memory', 'everyday_math',
];

/**
 * Select drills based on weighted random selection
 *
 * @param weights - Training plan weights from assessment
 * @param count - Number of drills to select (6 for quick, 12 for full)
 * @returns Array of drill types
 */
export async function selectDrills(
  weights: TrainingPlanWeights,
  count: number
): Promise<DrillType[]> {
  const drillQueue: DrillType[] = [];

  // Variety enforcement: Track consecutive drills of same type
  let consecutiveCount = 0;
  let lastDrillType: DrillType | null = null;

  // Track rotation index per domain for multi-drill domains
  const domainRotationIndex: Record<string, number> = {};

  // Build cumulative weight thresholds for domain selection
  const domainKeys = Object.keys(weights) as (keyof TrainingPlanWeights)[];

  for (let i = 0; i < count; i++) {
    let selectedDrill: DrillType;

    // Variety enforcement: Force different type if we've had 2 consecutive
    if (consecutiveCount >= 2) {
      const otherTypes = ALL_DRILL_TYPES.filter(t => t !== lastDrillType);
      selectedDrill = otherTypes[Math.floor(Math.random() * otherTypes.length)];
      consecutiveCount = 1;
    } else {
      // Normal weighted selection — pick domain first, then drill within domain
      const random = Math.random();

      let cumulative = 0;
      let domain: keyof TrainingPlanWeights = domainKeys[domainKeys.length - 1];
      for (const key of domainKeys) {
        cumulative += weights[key];
        if (random < cumulative) {
          domain = key;
          break;
        }
      }

      // Pick drill within domain (rotate for multi-drill domains)
      const drillsInDomain = DOMAIN_DRILLS[domain];
      if (drillsInDomain.length > 1) {
        const idx = domainRotationIndex[domain] || 0;
        selectedDrill = drillsInDomain[idx % drillsInDomain.length];
        domainRotationIndex[domain] = idx + 1;
      } else {
        selectedDrill = drillsInDomain[0];
      }

      // Update consecutive count
      if (selectedDrill === lastDrillType) {
        consecutiveCount++;
      } else {
        consecutiveCount = 1;
      }
    }

    drillQueue.push(selectedDrill);
    lastDrillType = selectedDrill;
  }

  return drillQueue;
}
