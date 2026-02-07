/**
 * Adaptive Difficulty Engine
 * Story 4.4: Implement Adaptive Difficulty Engine
 *
 * Purpose: Automatically adjust challenge parameters based on user performance
 * to keep users in their optimal challenge level (flow state).
 *
 * Architecture: Pure functional service with separate async functions for DB operations
 * Performance: <50ms for calculations, <200ms total with DB queries
 * Browser-only: No Node.js APIs
 */

import { db } from '@/services/storage/db';
import type { Session, DrillResult, DifficultyHistory } from '@/services/storage/schemas';

// ============================================================================
// Type Definitions (Task 1)
// ============================================================================

/**
 * Difficulty level on 1-10 numeric scale
 */
export type DifficultyLevel = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

/**
 * Module types that support difficulty adjustment
 */
export type DifficultyModule = 'number_line' | 'spatial_rotation' | 'math_operations';

/**
 * Reasons for difficulty adjustment matching schema
 */
export type AdjustmentReason =
  | 'accuracy_high'      // User performing too well, increase difficulty
  | 'accuracy_low'       // User struggling, decrease difficulty
  | 'speed_fast'         // User answering quickly, increase difficulty
  | 'mirror_confusion'   // User confused by mirrors, disable mirroring (AC-3)
  | 'optimal'            // No adjustment needed
  | 'initial';           // First session, setting initial difficulty

/**
 * Performance metrics calculated from recent sessions and drills
 */
export interface PerformanceMetrics {
  /** Average accuracy across last 5 sessions (0-100) */
  averageAccuracy: number;
  /** Median time to answer in milliseconds */
  medianTimeMs: number;
  /** Standard deviation of accuracy (consistency measure) */
  consistencyScore: number;
  /** Confidence trend: positive = improving, negative = declining */
  confidenceTrend: number;
  /** Number of sessions analyzed */
  sessionCount: number;
  /** Number of drills analyzed */
  drillCount: number;
  /** Mirror confusion rate for spatial rotation (0-1, AC-3) */
  mirrorConfusionRate?: number;
  /** Number of mirror drills analyzed */
  mirrorDrillCount?: number;
}

/**
 * Module-specific difficulty configuration
 */
export interface NumberLineConfig {
  range: { min: number; max: number };
  tolerance: number; // 0.05 to 0.20
  targets: 'multiples_of_5' | 'multiples_of_10' | 'any';
}

export interface SpatialRotationConfig {
  shapes: ('lshape' | 'tshape' | 'irregular')[];
  allowMirroring: boolean;
  complexity: 'simple' | 'medium' | 'complex';
}

export interface MathOperationsConfig {
  magnitude: 'single_digit' | 'double_digit' | 'triple_digit';
  operations: ('addition' | 'subtraction' | 'multiplication')[];
  mixed: boolean;
}

export type DifficultyConfig = NumberLineConfig | SpatialRotationConfig | MathOperationsConfig;

/**
 * Result of a difficulty adjustment decision
 */
export interface AdjustmentResult {
  module: DifficultyModule;
  previousLevel: DifficultyLevel;
  newLevel: DifficultyLevel;
  reason: AdjustmentReason;
  timestamp: string;
  metrics: PerformanceMetrics;
}

// ============================================================================
// Difficulty Configuration Constants (Task 6)
// ============================================================================

/**
 * Level names for human readability
 */
export const LEVEL_NAMES: Record<DifficultyLevel, string> = {
  1: 'beginner',
  2: 'beginner+',
  3: 'easy',
  4: 'easy+',
  5: 'medium',
  6: 'medium+',
  7: 'hard',
  8: 'hard+',
  9: 'expert',
  10: 'master',
};

/**
 * Number line difficulty configurations per level
 */
export const NUMBER_LINE_CONFIGS: Record<DifficultyLevel, NumberLineConfig> = {
  1: { range: { min: 0, max: 10 }, tolerance: 0.20, targets: 'multiples_of_5' },
  2: { range: { min: 0, max: 20 }, tolerance: 0.20, targets: 'multiples_of_5' },
  3: { range: { min: 0, max: 50 }, tolerance: 0.15, targets: 'multiples_of_5' },
  4: { range: { min: 0, max: 100 }, tolerance: 0.15, targets: 'multiples_of_10' },
  5: { range: { min: 0, max: 100 }, tolerance: 0.10, targets: 'multiples_of_10' },
  6: { range: { min: 0, max: 200 }, tolerance: 0.10, targets: 'multiples_of_10' },
  7: { range: { min: 0, max: 500 }, tolerance: 0.08, targets: 'any' },
  8: { range: { min: 0, max: 500 }, tolerance: 0.05, targets: 'any' },
  9: { range: { min: 0, max: 1000 }, tolerance: 0.05, targets: 'any' },
  10: { range: { min: 0, max: 1000 }, tolerance: 0.03, targets: 'any' },
};

/**
 * Spatial rotation difficulty configurations per level
 */
export const SPATIAL_ROTATION_CONFIGS: Record<DifficultyLevel, SpatialRotationConfig> = {
  1: { shapes: ['lshape'], allowMirroring: false, complexity: 'simple' },
  2: { shapes: ['lshape', 'tshape'], allowMirroring: false, complexity: 'simple' },
  3: { shapes: ['lshape', 'tshape'], allowMirroring: false, complexity: 'simple' },
  4: { shapes: ['lshape', 'tshape'], allowMirroring: true, complexity: 'simple' },
  5: { shapes: ['lshape', 'tshape'], allowMirroring: true, complexity: 'medium' },
  6: { shapes: ['lshape', 'tshape', 'irregular'], allowMirroring: true, complexity: 'medium' },
  7: { shapes: ['lshape', 'tshape', 'irregular'], allowMirroring: true, complexity: 'medium' },
  8: { shapes: ['lshape', 'tshape', 'irregular'], allowMirroring: true, complexity: 'complex' },
  9: { shapes: ['irregular'], allowMirroring: true, complexity: 'complex' },
  10: { shapes: ['irregular'], allowMirroring: true, complexity: 'complex' },
};

/**
 * Math operations difficulty configurations per level
 */
export const MATH_OPERATIONS_CONFIGS: Record<DifficultyLevel, MathOperationsConfig> = {
  1: { magnitude: 'single_digit', operations: ['addition'], mixed: false },
  2: { magnitude: 'single_digit', operations: ['addition', 'subtraction'], mixed: false },
  3: { magnitude: 'single_digit', operations: ['addition', 'subtraction'], mixed: false },
  4: { magnitude: 'single_digit', operations: ['addition', 'subtraction'], mixed: true },
  5: { magnitude: 'double_digit', operations: ['addition', 'subtraction'], mixed: false },
  6: { magnitude: 'double_digit', operations: ['addition', 'subtraction'], mixed: true },
  7: { magnitude: 'double_digit', operations: ['addition', 'subtraction', 'multiplication'], mixed: false },
  8: { magnitude: 'double_digit', operations: ['addition', 'subtraction', 'multiplication'], mixed: true },
  9: { magnitude: 'triple_digit', operations: ['addition', 'subtraction', 'multiplication'], mixed: true },
  10: { magnitude: 'triple_digit', operations: ['addition', 'subtraction', 'multiplication'], mixed: true },
};

/**
 * Get difficulty configuration for a specific module and level
 */
export function getDifficultyConfig(module: DifficultyModule, level: DifficultyLevel): DifficultyConfig {
  switch (module) {
    case 'number_line':
      return NUMBER_LINE_CONFIGS[level];
    case 'spatial_rotation':
      return SPATIAL_ROTATION_CONFIGS[level];
    case 'math_operations':
      return MATH_OPERATIONS_CONFIGS[level];
  }
}

// ============================================================================
// Pure Calculation Functions (Tasks 2, 4)
// ============================================================================

/**
 * Calculate median of an array of numbers
 */
function calculateMedian(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
}

/**
 * Calculate standard deviation of an array of numbers
 */
function calculateStdDev(values: number[]): number {
  if (values.length === 0) return 0;
  const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
  const squaredDiffs = values.map((v) => Math.pow(v - mean, 2));
  const variance = squaredDiffs.reduce((sum, v) => sum + v, 0) / values.length;
  return Math.sqrt(variance);
}

/**
 * Calculate performance metrics from sessions and drill results
 * Pure function - no side effects
 *
 * @param sessions - Recent sessions (ideally last 5)
 * @param drills - Recent drill results (ideally last 20)
 * @returns PerformanceMetrics object
 */
export function calculatePerformanceMetrics(
  sessions: Session[],
  drills: DrillResult[]
): PerformanceMetrics {
  // Calculate average accuracy from sessions
  const sessionAccuracies = sessions
    .map((s) => s.accuracy)
    .filter((a): a is number => a !== undefined);
  const averageAccuracy =
    sessionAccuracies.length > 0
      ? sessionAccuracies.reduce((sum, a) => sum + a, 0) / sessionAccuracies.length
      : 0;

  // Calculate median time from drills
  const times = drills.map((d) => d.timeToAnswer);
  const medianTimeMs = calculateMedian(times);

  // Calculate consistency (standard deviation of drill accuracies)
  const drillAccuracies = drills.map((d) => d.accuracy);
  const consistencyScore = calculateStdDev(drillAccuracies);

  // Calculate confidence trend from sessions
  const confidenceDeltas = sessions
    .filter((s) => s.confidenceBefore !== undefined && s.confidenceAfter !== undefined)
    .map((s) => (s.confidenceAfter as number) - (s.confidenceBefore as number));
  const confidenceTrend =
    confidenceDeltas.length > 0
      ? confidenceDeltas.reduce((sum, d) => sum + d, 0) / confidenceDeltas.length
      : 0;

  // Calculate mirror confusion rate for spatial_rotation drills (AC-3)
  const mirrorDrills = drills.filter((d) => d.module === 'spatial_rotation' && d.isMirrored === true);
  const mirrorDrillCount = mirrorDrills.length;
  const mirrorErrors = mirrorDrills.filter((d) => !d.isCorrect).length;
  const mirrorConfusionRate = mirrorDrillCount > 0 ? mirrorErrors / mirrorDrillCount : undefined;

  return {
    averageAccuracy,
    medianTimeMs,
    consistencyScore,
    confidenceTrend,
    sessionCount: sessions.length,
    drillCount: drills.length,
    mirrorConfusionRate,
    mirrorDrillCount,
  };
}

/**
 * Determine if difficulty adjustment is needed based on performance metrics
 * Pure function - no side effects
 *
 * @param metrics - Performance metrics from calculatePerformanceMetrics
 * @param currentLevel - Current difficulty level (1-10)
 * @param module - Module type for module-specific thresholds
 * @param recentAdjustments - Recent adjustment history for cooldown check
 * @returns AdjustmentResult or null if no adjustment needed
 */
export function determineAdjustment(
  metrics: PerformanceMetrics,
  currentLevel: DifficultyLevel,
  module: DifficultyModule,
  recentAdjustments: DifficultyHistory[] = [],
  sessionsSinceLastAdjustment: number = Infinity
): AdjustmentResult | null {
  // Check cooldown: no adjustment if one was made in last 2 sessions (AC-6)
  const recentForModule = recentAdjustments.filter((a) => a.module === module);
  if (recentForModule.length > 0) {
    // Session-based cooldown: must have completed at least 2 sessions since last adjustment
    if (sessionsSinceLastAdjustment < 2) {
      return null; // Still in cooldown
    }
  }

  // Need at least 3 sessions worth of data
  if (metrics.sessionCount < 3) {
    return null;
  }

  const timestamp = new Date().toISOString();

  // Module-specific threshold checks
  switch (module) {
    case 'number_line': {
      // AC-2: Number line adjustment rules
      if (metrics.averageAccuracy > 85 && currentLevel < 10) {
        return {
          module,
          previousLevel: currentLevel,
          newLevel: Math.min(10, currentLevel + 1) as DifficultyLevel,
          reason: 'accuracy_high',
          timestamp,
          metrics,
        };
      }
      if (metrics.averageAccuracy < 60 && currentLevel > 1) {
        return {
          module,
          previousLevel: currentLevel,
          newLevel: Math.max(1, currentLevel - 1) as DifficultyLevel,
          reason: 'accuracy_low',
          timestamp,
          metrics,
        };
      }
      if (metrics.medianTimeMs < 2000 && currentLevel < 10) {
        return {
          module,
          previousLevel: currentLevel,
          newLevel: Math.min(10, currentLevel + 1) as DifficultyLevel,
          reason: 'speed_fast',
          timestamp,
          metrics,
        };
      }
      break;
    }

    case 'spatial_rotation': {
      // AC-3: Spatial rotation adjustment rules

      // Check for consistent mirror confusion (error rate > 50% on mirrored drills with 3+ mirror drills)
      if (
        metrics.mirrorConfusionRate !== undefined &&
        metrics.mirrorDrillCount !== undefined &&
        metrics.mirrorDrillCount >= 3 &&
        metrics.mirrorConfusionRate > 0.5
      ) {
        // Decrease difficulty to avoid mirrors for next 5 sessions
        // Levels 1-3 have allowMirroring: false in SPATIAL_ROTATION_CONFIGS
        if (currentLevel > 3) {
          return {
            module,
            previousLevel: currentLevel,
            newLevel: 3 as DifficultyLevel, // Drop to level 3 (no mirroring)
            reason: 'mirror_confusion',
            timestamp,
            metrics,
          };
        }
      }

      if (metrics.averageAccuracy > 90 && currentLevel < 10) {
        return {
          module,
          previousLevel: currentLevel,
          newLevel: Math.min(10, currentLevel + 1) as DifficultyLevel,
          reason: 'accuracy_high',
          timestamp,
          metrics,
        };
      }
      if (metrics.averageAccuracy < 65 && currentLevel > 1) {
        return {
          module,
          previousLevel: currentLevel,
          newLevel: Math.max(1, currentLevel - 1) as DifficultyLevel,
          reason: 'accuracy_low',
          timestamp,
          metrics,
        };
      }
      break;
    }

    case 'math_operations': {
      // AC-4: Math operations adjustment rules
      if (metrics.averageAccuracy > 80 && currentLevel < 10) {
        return {
          module,
          previousLevel: currentLevel,
          newLevel: Math.min(10, currentLevel + 1) as DifficultyLevel,
          reason: 'accuracy_high',
          timestamp,
          metrics,
        };
      }
      if (metrics.averageAccuracy < 65 && currentLevel > 1) {
        return {
          module,
          previousLevel: currentLevel,
          newLevel: Math.max(1, currentLevel - 1) as DifficultyLevel,
          reason: 'accuracy_low',
          timestamp,
          metrics,
        };
      }
      if (metrics.medianTimeMs < 3000 && currentLevel < 10) {
        return {
          module,
          previousLevel: currentLevel,
          newLevel: Math.min(10, currentLevel + 1) as DifficultyLevel,
          reason: 'speed_fast',
          timestamp,
          metrics,
        };
      }
      break;
    }
  }

  return null; // No adjustment needed
}

// ============================================================================
// Database Functions (Tasks 3, 5)
// ============================================================================

/**
 * Get current difficulty level for a module
 * Checks difficulty_history first, then falls back to assessment score
 *
 * @param module - Module type
 * @returns Current difficulty level (1-10)
 */
export async function getCurrentDifficulty(module: DifficultyModule): Promise<DifficultyLevel> {
  // Query latest difficulty_history entry for this module
  const latestHistory = await db.difficulty_history
    .where('module')
    .equals(module)
    .reverse()
    .first();

  if (latestHistory) {
    // Clamp to valid range
    const level = Math.max(1, Math.min(10, latestHistory.newDifficulty)) as DifficultyLevel;
    return level;
  }

  // No history - check for assessment score to determine initial difficulty
  const latestAssessment = await db.assessments
    .orderBy('timestamp')
    .reverse()
    .first();

  if (latestAssessment) {
    // Calculate average score from assessment
    const score = latestAssessment.correctAnswers / latestAssessment.totalQuestions * 5;

    // AC-7: Initial difficulty assignment rules
    if (score > 4.5) return 7; // Hard
    if (score > 4) return 5;   // Medium
  }

  // Default: level 3 (easy)
  return 3;
}

/**
 * Get recent difficulty adjustments for cooldown checking
 *
 * @param module - Module type
 * @param limit - Number of recent adjustments to fetch
 * @returns Array of recent DifficultyHistory entries
 */
export async function getRecentAdjustments(
  module: DifficultyModule,
  limit: number = 5
): Promise<DifficultyHistory[]> {
  return db.difficulty_history
    .where('module')
    .equals(module)
    .reverse()
    .limit(limit)
    .toArray();
}

/**
 * Apply a difficulty adjustment and persist to database
 *
 * @param adjustment - The adjustment to apply
 * @param sessionId - Current session ID
 * @returns Created record ID
 */
export async function applyAdjustment(
  adjustment: AdjustmentResult,
  sessionId: number
): Promise<number> {
  const record: Omit<DifficultyHistory, 'id'> = {
    sessionId,
    timestamp: adjustment.timestamp,
    module: adjustment.module,
    previousDifficulty: adjustment.previousLevel,
    newDifficulty: adjustment.newLevel,
    reason: adjustment.reason,
    userAccepted: true, // Auto-adjustments are always accepted
  };

  const id = await db.difficulty_history.add(record);
  return id as number;
}

// ============================================================================
// Main Session End Processing (Task 7)
// ============================================================================

/**
 * Process session end - calculate metrics and apply difficulty adjustments
 * This is the main entry point called from TrainingSession.tsx
 *
 * @param sessionId - Numeric session ID
 * @returns Array of adjustments made (for TransparencyToast)
 */
export async function processSessionEnd(sessionId: number): Promise<AdjustmentResult[]> {
  const adjustments: AdjustmentResult[] = [];

  // Get drill results for this session to determine which modules were used
  const sessionDrills = await db.drill_results
    .where('sessionId')
    .equals(sessionId)
    .toArray();

  if (sessionDrills.length === 0) {
    return adjustments;
  }

  // Get unique modules used in this session
  const modulesUsed = [...new Set(sessionDrills.map((d) => d.module))] as DifficultyModule[];

  // Process each module
  for (const module of modulesUsed) {
    // Get recent sessions that used this module (last 5)
    const recentSessions = await db.sessions
      .orderBy('timestamp')
      .reverse()
      .limit(20)
      .toArray();

    // Filter to sessions that have drill results for this module
    const moduleSessions: Session[] = [];
    for (const session of recentSessions) {
      if (session.id === undefined) continue;
      const drillsForSession = await db.drill_results
        .where('[sessionId+module]')
        .equals([session.id, module])
        .count();
      if (drillsForSession > 0) {
        moduleSessions.push(session);
      }
      if (moduleSessions.length >= 5) break;
    }

    // Get recent drills for this module (last 20)
    const recentDrills = await db.drill_results
      .where('module')
      .equals(module)
      .reverse()
      .limit(20)
      .toArray();

    // Calculate performance metrics
    const metrics = calculatePerformanceMetrics(moduleSessions, recentDrills);

    // Get current difficulty
    const currentLevel = await getCurrentDifficulty(module);

    // Get recent adjustments for cooldown check
    const recentAdjustments = await getRecentAdjustments(module);

    // Calculate sessions since last adjustment (AC-6 cooldown)
    let sessionsSinceLastAdjustment = Infinity;
    if (recentAdjustments.length > 0) {
      const lastAdjustmentSessionId = recentAdjustments[0].sessionId;
      // Count sessions completed after the last adjustment
      const sessionsAfterAdjustment = await db.sessions
        .where('id')
        .above(lastAdjustmentSessionId)
        .count();
      sessionsSinceLastAdjustment = sessionsAfterAdjustment;
    }

    // Determine if adjustment is needed
    const adjustment = determineAdjustment(
      metrics,
      currentLevel,
      module,
      recentAdjustments,
      sessionsSinceLastAdjustment
    );

    if (adjustment) {
      // Apply the adjustment
      await applyAdjustment(adjustment, sessionId);
      adjustments.push(adjustment);
    }
  }

  return adjustments;
}
