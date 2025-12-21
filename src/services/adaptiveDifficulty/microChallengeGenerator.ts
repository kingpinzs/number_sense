/**
 * Micro-Challenge Generator
 * Story 4.3: Implement Micro-Challenge Generation Engine
 *
 * Generates targeted micro-challenges from user's recent mistakes.
 * Challenges are simplified versions of drills optimized for
 * 60-second Magic Minute sprints.
 *
 * Architecture: Pure functional service with no side effects
 * Performance: <50ms per generation call
 * Browser-only: No Node.js APIs
 */

import { v4 as uuidv4 } from 'uuid';
import type { MistakePattern, MistakeType } from '@/services/adaptiveDifficulty/mistakeAnalyzer';
import type {
  MicroChallenge,
  MicroChallengeType,
  MicroNumberLineParams,
  MicroSpatialParams,
  MicroMathParams,
} from '@/features/magic-minute/types/microChallenge.types';

// ============================================================================
// Type Mappings (Task 1.2)
// ============================================================================

/**
 * Maps all 10 MistakeTypes to the 3 MicroChallengeTypes
 * @param mistakeType - The mistake type to map
 * @returns The corresponding micro-challenge type
 */
export function mapMistakeTypeToDrillType(mistakeType: MistakeType): MicroChallengeType {
  const mapping: Record<MistakeType, MicroChallengeType> = {
    // Number line mistakes → number_line drills
    overestimation: 'number_line',
    underestimation: 'number_line',
    magnitude_error: 'number_line',
    boundary_error: 'number_line',
    // Spatial rotation mistakes → spatial drills
    rotation_confusion: 'spatial',
    mirror_confusion: 'spatial',
    complexity_threshold: 'spatial',
    // Math operation mistakes → math drills
    operation_weakness: 'math',
    magnitude_threshold: 'math',
    speed_accuracy_tradeoff: 'math',
  };
  return mapping[mistakeType];
}

// ============================================================================
// Weighted Pool Building (Task 1.4)
// ============================================================================

interface WeightedEntry {
  type: MicroChallengeType;
  weight: number;
  targetMistakeType: MistakeType | null;
}

/**
 * Build a weighted pool of challenge types based on detected mistakes
 * Detected weakness areas get 2x weight
 */
function buildWeightedPool(patterns: MistakePattern[]): WeightedEntry[] {
  // Base weights for each challenge type
  const baseWeights: Record<MicroChallengeType, number> = {
    number_line: 1,
    spatial: 1,
    math: 1,
  };

  // Track which mistake types are detected
  const detectedMistakes: Map<MicroChallengeType, MistakeType[]> = new Map();

  // Apply 2x weight for detected weakness areas
  for (const pattern of patterns) {
    const drillType = mapMistakeTypeToDrillType(pattern.patternType);
    baseWeights[drillType] *= 2;

    // Track the mistake types for each drill type
    const existing = detectedMistakes.get(drillType) || [];
    existing.push(pattern.patternType);
    detectedMistakes.set(drillType, existing);
  }

  // Build weighted entries
  return Object.entries(baseWeights).map(([type, weight]) => {
    const drillType = type as MicroChallengeType;
    const mistakes = detectedMistakes.get(drillType) || [];
    return {
      type: drillType,
      weight,
      // Pick a random mistake type if multiple, or null if none
      targetMistakeType: mistakes.length > 0
        ? mistakes[Math.floor(Math.random() * mistakes.length)]
        : getDefaultMistakeType(drillType),
    };
  });
}

/**
 * Get default mistake type for a drill type (when no specific pattern detected)
 */
function getDefaultMistakeType(drillType: MicroChallengeType): MistakeType {
  const defaults: Record<MicroChallengeType, MistakeType> = {
    number_line: 'overestimation',
    spatial: 'rotation_confusion',
    math: 'operation_weakness',
  };
  return defaults[drillType];
}

// ============================================================================
// Challenge Selection (Task 6.1-6.3)
// ============================================================================

/**
 * Select a challenge from the pool, avoiding consecutive same types
 */
function selectFromPool(
  pool: WeightedEntry[],
  excludeType: MicroChallengeType | null
): WeightedEntry {
  // Filter out excluded type to prevent consecutive same types
  const filtered = excludeType
    ? pool.filter((e) => e.type !== excludeType)
    : pool;

  // If all filtered out (shouldn't happen), use full pool
  const candidates = filtered.length > 0 ? filtered : pool;

  // Weighted random selection
  const totalWeight = candidates.reduce((sum, e) => sum + e.weight, 0);
  let random = Math.random() * totalWeight;

  for (const entry of candidates) {
    random -= entry.weight;
    if (random <= 0) {
      return entry;
    }
  }

  // Fallback to first entry
  return candidates[0];
}

// ============================================================================
// Challenge Parameter Generation
// ============================================================================

/**
 * Generate parameters for a number line micro-challenge
 * Range: 0-50, tolerance: 15%
 */
function generateNumberLineParams(): MicroNumberLineParams {
  // Generate target in 0-50 range, prefer multiples of 5 for simplicity
  const target = Math.floor(Math.random() * 11) * 5; // 0, 5, 10, ..., 50

  return {
    target,
    range: { min: 0, max: 50 },
    tolerance: 0.15,
  };
}

/**
 * Generate parameters for a spatial rotation micro-challenge
 * Only lshape/tshape, only 90/180 rotations
 */
function generateSpatialParams(): MicroSpatialParams {
  const shapes: ('lshape' | 'tshape')[] = ['lshape', 'tshape'];
  const rotations: (90 | 180)[] = [90, 180];

  const shape = shapes[Math.floor(Math.random() * shapes.length)];
  const rotation = rotations[Math.floor(Math.random() * rotations.length)];

  // 50% chance the shapes are the same (after rotation)
  const isSame = Math.random() < 0.5;

  return {
    shape,
    rotation,
    isSame,
  };
}

/**
 * Generate parameters for a math micro-challenge
 * Single-digit operations only
 */
function generateMathParams(): MicroMathParams {
  // Generate single-digit operands (1-9)
  const a = Math.floor(Math.random() * 9) + 1;
  const b = Math.floor(Math.random() * 9) + 1;

  // 50% addition, 50% subtraction
  const useAddition = Math.random() < 0.5;

  if (useAddition) {
    return {
      problem: `${a} + ${b}`,
      answer: a + b,
      operation: 'addition',
    };
  } else {
    // Ensure a >= b to avoid negative answers
    const larger = Math.max(a, b);
    const smaller = Math.min(a, b);
    return {
      problem: `${larger} - ${smaller}`,
      answer: larger - smaller,
      operation: 'subtraction',
    };
  }
}

/**
 * Generate parameters based on challenge type
 */
function generateParamsForType(
  type: MicroChallengeType
): MicroNumberLineParams | MicroSpatialParams | MicroMathParams {
  switch (type) {
    case 'number_line':
      return generateNumberLineParams();
    case 'spatial':
      return generateSpatialParams();
    case 'math':
      return generateMathParams();
  }
}

/**
 * Create a single micro-challenge
 */
function createChallenge(entry: WeightedEntry): MicroChallenge {
  return {
    id: uuidv4(),
    type: entry.type,
    targetMistakeType: entry.targetMistakeType ?? getDefaultMistakeType(entry.type),
    difficulty: 'micro',
    params: generateParamsForType(entry.type),
  };
}

// ============================================================================
// Shuffle Algorithm (Task 6.1)
// ============================================================================

/**
 * Fisher-Yates shuffle for randomizing challenge order
 */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// ============================================================================
// Main Generation Function (Task 1.3, 1.5)
// ============================================================================

/**
 * Generate micro-challenges for a Magic Minute session
 *
 * @param mistakePatterns - Detected mistake patterns from MistakeAnalyzer
 * @param count - Number of challenges to generate (default: 12, range: 10-15)
 * @returns Array of micro-challenges, shuffled and with no consecutive same types
 *
 * @example
 * const patterns = analyzeSession(drillResults).patterns;
 * const challenges = generateMicroChallenges(patterns, 12);
 */
export function generateMicroChallenges(
  mistakePatterns: MistakePattern[],
  count: number = 12
): MicroChallenge[] {
  // Clamp count to 10-15 range as per AC
  const clampedCount = Math.max(10, Math.min(15, count));

  const challenges: MicroChallenge[] = [];
  const pool = buildWeightedPool(mistakePatterns);
  const usedIds = new Set<string>();
  let lastType: MicroChallengeType | null = null;

  for (let i = 0; i < clampedCount; i++) {
    const entry = selectFromPool(pool, lastType);
    let challenge = createChallenge(entry);

    // Ensure unique IDs (Task 6.3 - no duplicates)
    while (usedIds.has(challenge.id)) {
      challenge = createChallenge(entry);
    }
    usedIds.add(challenge.id);

    challenges.push(challenge);
    lastType = challenge.type;
  }

  // Final shuffle for unpredictability (AC #5)
  return shuffleArray(challenges);
}

// ============================================================================
// Difficulty Adaptation (Task 7)
// ============================================================================

import type { AdaptiveState } from '@/features/magic-minute/types/microChallenge.types';

/**
 * Initial adaptive state
 */
export function createAdaptiveState(): AdaptiveState {
  return {
    consecutiveCorrect: 0,
    consecutiveIncorrect: 0,
    difficultyModifier: 0,
  };
}

/**
 * Update adaptive state after a challenge result
 *
 * AC #7: 5 consecutive correct → harder, 3 consecutive incorrect → easier
 */
export function updateAdaptiveState(
  state: AdaptiveState,
  isCorrect: boolean
): AdaptiveState {
  if (isCorrect) {
    const newCorrect = state.consecutiveCorrect + 1;
    return {
      consecutiveCorrect: newCorrect,
      consecutiveIncorrect: 0,
      difficultyModifier: newCorrect >= 5 ? 1 : state.difficultyModifier,
    };
  } else {
    const newIncorrect = state.consecutiveIncorrect + 1;
    return {
      consecutiveCorrect: 0,
      consecutiveIncorrect: newIncorrect,
      difficultyModifier: newIncorrect >= 3 ? -1 : state.difficultyModifier,
    };
  }
}

/**
 * Apply difficulty modifier to challenge parameters
 * modifier: -1 = easier, 0 = normal, 1 = harder
 */
export function applyDifficultyModifier(
  challenge: MicroChallenge,
  modifier: -1 | 0 | 1
): MicroChallenge {
  if (modifier === 0) return challenge;

  // Clone the challenge to avoid mutation
  const modified = { ...challenge, params: { ...challenge.params } };

  switch (challenge.type) {
    case 'number_line': {
      const params = modified.params as MicroNumberLineParams;
      if (modifier === -1) {
        // Easier: use multiples of 10 only
        params.target = Math.floor(params.target / 10) * 10;
      } else {
        // Harder: use any number in range (but keep it in 0-50)
        params.target = Math.floor(Math.random() * 51);
      }
      break;
    }
    case 'spatial': {
      const params = modified.params as MicroSpatialParams;
      if (modifier === -1) {
        // Easier: only use lshape and 90 degree
        params.shape = 'lshape';
        params.rotation = 90;
      }
      // Harder: keep as is (already simplified for micro-challenges)
      break;
    }
    case 'math': {
      const params = modified.params as MicroMathParams;
      if (modifier === -1) {
        // Easier: smaller numbers (1-5)
        const a = Math.floor(Math.random() * 5) + 1;
        const b = Math.floor(Math.random() * 5) + 1;
        if (params.operation === 'addition') {
          params.problem = `${a} + ${b}`;
          params.answer = a + b;
        } else {
          const larger = Math.max(a, b);
          const smaller = Math.min(a, b);
          params.problem = `${larger} - ${smaller}`;
          params.answer = larger - smaller;
        }
      }
      // Harder: keep as is (already single-digit for micro-challenges)
      break;
    }
  }

  return modified;
}
