// Pure functional utilities for Spatial Flip game
// Story 6.4: No side effects, no Dexie queries, no React hooks

import type { ShapeType } from '@/features/training/content/shapes';
import type { GameDifficulty, SpatialFlipChoice, SpatialFlipQuestion } from '../types';
import { SPATIAL_FLIP_ROTATION_ANGLES, SPATIAL_FLIP_SHAPES } from '../types';
import { shuffleArray } from './gameUtils';

/**
 * Get shape set for a difficulty level.
 * Uses SPATIAL_FLIP_SHAPES which excludes rotationally symmetric shapes
 * (circle: rotation never visible; square excluded from easy: 90° rotations identical).
 */
export function getShapeSetForDifficulty(difficulty: GameDifficulty): ShapeType[] {
  return SPATIAL_FLIP_SHAPES[difficulty];
}

/**
 * Get allowed rotation angles for a difficulty level
 */
export function getRotationAnglesForDifficulty(difficulty: GameDifficulty): number[] {
  return SPATIAL_FLIP_ROTATION_ANGLES[difficulty];
}

/**
 * Determine whether mirroring should be applied based on difficulty rules
 * Easy: No mirroring
 * Medium: 30% chance (only when rotation=0, not combined)
 * Hard: 50% chance (can combine with rotation)
 */
export function shouldMirror(difficulty: GameDifficulty, rotationDegrees: number): boolean {
  if (difficulty === 'easy') return false;
  if (difficulty === 'medium') {
    return rotationDegrees === 0 && Math.random() < 0.3;
  }
  // hard
  return Math.random() < 0.5;
}

/**
 * Pick a random element from an array
 */
function pickRandom<T>(arr: T[]): T {
  if (arr.length === 0) throw new Error('pickRandom called with empty array');
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Generate 3 distractor choices using DIFFERENT shapes from the reference.
 * Each distractor uses a unique shape so the game tests shape recognition
 * through rotation, not "which of these identical shapes has the right angle."
 */
export function generateDistractors(
  referenceShape: ShapeType,
  correctMirrored: boolean,
  difficulty: GameDifficulty,
): Omit<SpatialFlipChoice, 'id'>[] {
  const shapes = getShapeSetForDifficulty(difficulty);
  const angles = getRotationAnglesForDifficulty(difficulty);

  // Get shapes different from the reference, then shuffle for randomness
  const otherShapes = shuffleArray(shapes.filter(s => s !== referenceShape));

  const distractors: Omit<SpatialFlipChoice, 'id'>[] = [];

  // Each distractor uses a different shape from the reference (and from each other)
  for (let i = 0; i < 3 && i < otherShapes.length; i++) {
    const rotation = pickRandom(angles);
    const mirrored = shouldMirror(difficulty, rotation);
    distractors.push({
      shape: otherShapes[i],
      rotationDegrees: rotation,
      isMirrored: mirrored,
      isCorrect: false,
    });
  }

  // Safety fallback: if fewer than 3 other shapes available, fill with reference shape
  // using a visually distinct transform (should not happen with 4+ shapes per difficulty)
  while (distractors.length < 3) {
    const rotation = angles[distractors.length % angles.length];
    distractors.push({
      shape: referenceShape,
      rotationDegrees: rotation,
      isMirrored: !correctMirrored,
      isCorrect: false,
    });
  }

  return distractors;
}

/**
 * Generate a complete question with 1 correct answer and 3 distractors
 */
export function generateQuestion(difficulty: GameDifficulty): SpatialFlipQuestion {
  const shapes = getShapeSetForDifficulty(difficulty);
  const angles = getRotationAnglesForDifficulty(difficulty);

  // Pick reference shape
  const referenceShape = pickRandom(shapes);

  // Pick correct transformation — ensure it's not trivially identical to reference
  // (rotation=0 with no mirror means the shape looks the same, requiring no spatial reasoning)
  const nonTrivialAngles = angles.filter(a => a !== 0);
  let correctRotation = nonTrivialAngles.length > 0 ? pickRandom(nonTrivialAngles) : pickRandom(angles);
  let correctMirrored = shouldMirror(difficulty, correctRotation);

  // If we got rotation=0 (only possible when nonTrivialAngles was empty), ensure mirroring
  if (correctRotation === 0 && !correctMirrored) {
    const fallbackAngles = angles.filter(a => a !== 0);
    if (fallbackAngles.length > 0) {
      correctRotation = pickRandom(fallbackAngles);
      correctMirrored = shouldMirror(difficulty, correctRotation);
    }
  }

  // Create correct choice
  const correctChoice: Omit<SpatialFlipChoice, 'id'> = {
    shape: referenceShape,
    rotationDegrees: correctRotation,
    isMirrored: correctMirrored,
    isCorrect: true,
  };

  // Generate distractors (all different shapes from reference)
  const distractors = generateDistractors(
    referenceShape,
    correctMirrored,
    difficulty,
  );

  // Combine and shuffle all 4 choices
  const allChoices = [correctChoice, ...distractors];
  const shuffled = shuffleArray(allChoices);

  // Assign IDs and find correct index
  const choices: SpatialFlipChoice[] = shuffled.map((choice, index) => ({
    ...choice,
    id: index,
  }));
  const correctIndex = choices.findIndex(c => c.isCorrect);

  return {
    referenceShape,
    choices,
    correctIndex,
  };
}

/**
 * Get encouragement message based on accuracy percentage
 */
export function getEncouragementMessage(accuracy: number): string {
  if (accuracy >= 90) return 'Excellent spatial reasoning!';
  if (accuracy >= 70) return 'Strong mental rotation skills!';
  if (accuracy >= 50) return 'Good effort! Keep practicing.';
  return 'Mental rotation takes practice. You\'ll improve!';
}

/**
 * Choice labels (A, B, C, D)
 */
export const CHOICE_LABELS = ['A', 'B', 'C', 'D'] as const;
