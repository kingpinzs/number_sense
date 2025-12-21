/**
 * MicroChallenge Types
 * Story 4.3: Implement Micro-Challenge Generation Engine
 *
 * Type definitions for micro-challenges used in Magic Minute sessions.
 * These are simplified versions of regular drills optimized for
 * 60-second time-pressured practice.
 */

import type { MistakeType } from '@/services/adaptiveDifficulty/mistakeAnalyzer';
import type { MagicMinuteResult } from './magicMinute.types';

/**
 * Types of micro-challenges (simplified drill types)
 */
export type MicroChallengeType = 'number_line' | 'spatial' | 'math';

/**
 * Base micro-challenge interface
 */
export interface MicroChallenge {
  /** Unique identifier (uuid) */
  id: string;
  /** Type of micro-challenge */
  type: MicroChallengeType;
  /** Which mistake pattern this challenge addresses */
  targetMistakeType: MistakeType;
  /** Always 'micro' for simplified challenges */
  difficulty: 'micro';
  /** Type-specific parameters */
  params: MicroNumberLineParams | MicroSpatialParams | MicroMathParams;
}

/**
 * Number Line micro-challenge parameters
 * Simplified: 0-50 range, 15% tolerance, auto-submit after 2s idle
 */
export interface MicroNumberLineParams {
  /** Target number to place (0-50) */
  target: number;
  /** Range for the number line */
  range: { min: 0; max: 50 };
  /** Tolerance percentage (15% = more forgiving) */
  tolerance: 0.15;
}

/**
 * Spatial rotation micro-challenge parameters
 * Simplified: only lshape/tshape, 90/180 rotations, no mirroring
 */
export interface MicroSpatialParams {
  /** Shape type (asymmetric shapes only) */
  shape: 'lshape' | 'tshape';
  /** Rotation angle applied to second shape */
  rotation: 90 | 180;
  /** Correct answer: are the shapes the same? */
  isSame: boolean;
}

/**
 * Math operations micro-challenge parameters
 * Simplified: single-digit operations only
 */
export interface MicroMathParams {
  /** Math problem string (e.g., "3 + 5") */
  problem: string;
  /** Correct answer */
  answer: number;
  /** Operation type for tracking */
  operation: 'addition' | 'subtraction';
}

/**
 * Result of a single micro-challenge
 * Extends MagicMinuteResult with challenge-specific fields
 */
export interface MicroChallengeResult extends MagicMinuteResult {
  /** Challenge ID this result is for */
  challengeId: string;
  /** Type of challenge completed */
  challengeType: MicroChallengeType;
  /** Which mistake pattern was targeted */
  mistakeTypeTargeted: MistakeType;
  /** True if 8-second timeout triggered */
  timedOut: boolean;
}

/**
 * State for adaptive difficulty during Magic Minute
 */
export interface AdaptiveState {
  /** Consecutive correct answers */
  consecutiveCorrect: number;
  /** Consecutive incorrect answers */
  consecutiveIncorrect: number;
  /** Current difficulty modifier: -1 = easier, 0 = normal, 1 = harder */
  difficultyModifier: -1 | 0 | 1;
}

/**
 * Challenge timeout in milliseconds
 */
export const CHALLENGE_TIMEOUT_MS = 8000;

/**
 * Auto-submit delay for number line (idle detection)
 */
export const NUMBER_LINE_AUTO_SUBMIT_MS = 2000;

/**
 * Math auto-submit digit count
 */
export const MATH_AUTO_SUBMIT_DIGITS = 2;
