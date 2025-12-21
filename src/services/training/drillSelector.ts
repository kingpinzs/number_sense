// Drill selection service - Weighted random drill selection
// Story 3.1: Build Training Session Shell and State Management
// Task 4: Implement Drill Selection Service

import { db } from '@/services/storage/db';
import type { Assessment } from '@/services/storage/schemas';

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
export type DrillType = 'number_line' | 'spatial_rotation' | 'math_operations';

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

  for (let i = 0; i < count; i++) {
    // Generate weighted random drill
    let selectedDrill: DrillType;

    // Variety enforcement: Force different type if we've had 3 consecutive
    if (consecutiveCount >= 3) {
      // Explicitly select a different type
      const otherTypes: DrillType[] = [];
      if (lastDrillType !== 'number_line') otherTypes.push('number_line');
      if (lastDrillType !== 'spatial_rotation') otherTypes.push('spatial_rotation');
      if (lastDrillType !== 'math_operations') otherTypes.push('math_operations');

      // Randomly select from other types
      selectedDrill = otherTypes[Math.floor(Math.random() * otherTypes.length)];
      consecutiveCount = 1;  // Reset to 1 (starting a new sequence)
    } else {
      // Normal weighted selection
      const random = Math.random();

      if (random < weights.numberSense) {
        selectedDrill = 'number_line';
      } else if (random < weights.numberSense + weights.spatial) {
        selectedDrill = 'spatial_rotation';
      } else {
        selectedDrill = 'math_operations';
      }

      // Update consecutive count
      if (selectedDrill === lastDrillType) {
        consecutiveCount++;
      } else {
        consecutiveCount = 1;  // Start new sequence
      }
    }

    drillQueue.push(selectedDrill);
    lastDrillType = selectedDrill;
  }

  return drillQueue;
}
