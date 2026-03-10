// Drill selection service - Weighted random drill selection
// Story 3.1: Build Training Session Shell and State Management
// Task 4: Implement Drill Selection Service

import { db } from '@/services/storage/db';

/**
 * Training plan weights from assessment
 */
export interface TrainingPlanWeights {
  numberSense: number;  // 0.0 - 1.0
  spatial: number;
  operations: number;
}

/**
 * Domain mapping between Assessment weaknesses/strengths and TrainingPlanWeights
 */
const DOMAIN_WEIGHT_MAP: Record<string, keyof TrainingPlanWeights> = {
  'number_sense': 'numberSense',
  'number-sense': 'numberSense',
  'spatial': 'spatial',
  'spatial_rotation': 'spatial',
  'spatial-rotation': 'spatial',
  'operations': 'operations',
  'math_operations': 'operations',
  'math-operations': 'operations',
};

/**
 * Load training plan weights from latest completed assessment
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
  // Weight assignments (matching Epic 2 scoring algorithm):
  // - Weaknesses: 2.0x weight
  // - Strengths: 0.5x weight
  // - Neither (moderate): 1.0x weight
  const rawWeights: Record<keyof TrainingPlanWeights, number> = {
    numberSense: 1.0,  // Default to moderate
    spatial: 1.0,
    operations: 1.0,
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

  // Handle edge case where sum is 0 (shouldn't happen)
  if (sum === 0) {
    return {
      numberSense: 1 / 3,
      spatial: 1 / 3,
      operations: 1 / 3,
    };
  }

  // Normalize each weight
  const normalizedWeights: TrainingPlanWeights = {
    numberSense: rawWeights.numberSense / sum,
    spatial: rawWeights.spatial / sum,
    operations: rawWeights.operations / sum,
  };

  return normalizedWeights;
}

/**
 * Drill types available in training
 */
export type DrillType = 'number_line' | 'spatial_rotation' | 'math_operations' | 'subitizing' | 'number_bonds';

/**
 * All available drill types grouped by their training domain.
 * numberSense drills are rotated to ensure variety within that domain.
 */
const DOMAIN_DRILLS: Record<keyof TrainingPlanWeights, DrillType[]> = {
  numberSense: ['number_line', 'subitizing', 'number_bonds'],
  spatial: ['spatial_rotation'],
  operations: ['math_operations'],
};

const ALL_DRILL_TYPES: DrillType[] = ['number_line', 'spatial_rotation', 'math_operations', 'subitizing', 'number_bonds'];

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

  // Track which numberSense sub-drill to rotate through
  let numberSenseIndex = 0;

  for (let i = 0; i < count; i++) {
    // Generate weighted random drill
    let selectedDrill: DrillType;

    // Variety enforcement: Force different type if we've had 2 consecutive
    // (reduced from 3 to ensure more variety with 5 drill types)
    if (consecutiveCount >= 2) {
      // Explicitly select a different type
      const otherTypes = ALL_DRILL_TYPES.filter(t => t !== lastDrillType);
      selectedDrill = otherTypes[Math.floor(Math.random() * otherTypes.length)];
      consecutiveCount = 1;
    } else {
      // Normal weighted selection — pick domain first, then drill within domain
      const random = Math.random();

      let domain: keyof TrainingPlanWeights;
      if (random < weights.numberSense) {
        domain = 'numberSense';
      } else if (random < weights.numberSense + weights.spatial) {
        domain = 'spatial';
      } else {
        domain = 'operations';
      }

      // Pick drill within domain (rotate for multi-drill domains)
      const drillsInDomain = DOMAIN_DRILLS[domain];
      if (drillsInDomain.length > 1) {
        selectedDrill = drillsInDomain[numberSenseIndex % drillsInDomain.length];
        numberSenseIndex++;
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
