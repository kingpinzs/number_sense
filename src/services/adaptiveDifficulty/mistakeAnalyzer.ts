/**
 * Mistake Analysis Engine
 * Story 4.1: Implement Mistake Analysis Engine
 *
 * Purpose: Detect error patterns from drill results in real-time to identify
 * which specific skills need targeted practice.
 *
 * Architecture: Pure functional service with no side effects
 * Performance: <50ms per analysis call
 * Browser-only: No Node.js APIs
 */

import { v4 as uuidv4 } from 'uuid';
import type { DrillResult } from '../storage/schemas';

// ============================================================================
// Type Definitions (Task 1)
// ============================================================================

/**
 * All possible mistake types across all drill modules
 */
export type MistakeType =
  // Number Line mistakes
  | 'overestimation'
  | 'underestimation'
  | 'magnitude_error'
  | 'boundary_error'
  // Spatial Rotation mistakes
  | 'rotation_confusion'
  | 'mirror_confusion'
  | 'complexity_threshold'
  // Math Operations mistakes
  | 'operation_weakness'
  | 'magnitude_threshold'
  | 'speed_accuracy_tradeoff';

/**
 * Severity levels for mistakes based on error magnitude
 */
export type Severity = 'minor' | 'moderate' | 'severe';

/**
 * Single categorized mistake entry
 */
export interface CategorizedMistake {
  drillId: string;                    // Unique identifier (uuid)
  mistakeType: MistakeType;           // Type of mistake detected
  severity: Severity;                 // Based on error magnitude
  timestamp: number;                  // Date.now()
  drillContext: {                     // Context of the drill
    module: string;
    difficulty: string;
    [key: string]: any;               // Additional module-specific context
  };
}

/**
 * Detected pattern from multiple mistakes
 */
export interface MistakePattern {
  patternType: MistakeType;           // Type of pattern
  occurrences: number;                // Count of this mistake type
  recentDrills: number;               // Window size analyzed
  confidence: number;                 // 0-1 confidence in pattern
  detectedAt: number;                 // Timestamp of detection
}

/**
 * Complete analysis output for a session
 */
export interface AnalysisResult {
  sessionId: number;                  // Session analyzed
  analyzedAt: number;                 // Timestamp
  mistakes: CategorizedMistake[];     // All categorized mistakes
  patterns: MistakePattern[];         // Detected patterns
  recommendations: string[];          // Suggested focus areas
}

// ============================================================================
// Core Functions (Tasks 2-5)
// ============================================================================

/**
 * Categorize a mistake from a drill result
 * Task 2: Determine mistake type and severity
 *
 * @param result - DrillResult to categorize
 * @returns Object with mistake type and severity
 */
export function categorizeMistake(result: DrillResult): { type: MistakeType; severity: Severity } {
  const module = result.module;

  // Number Line categorization (AC-1)
  if (module === 'number_line') {
    return categorizeNumberLineMistake(result);
  }

  // Spatial Rotation categorization (AC-2)
  if (module === 'spatial_rotation') {
    return categorizeSpatialMistake(result);
  }

  // Math Operations categorization (AC-3)
  if (module === 'math_operations') {
    return categorizeMathMistake(result);
  }

  // Fallback (should not reach here)
  throw new Error(`Unknown module type: ${module}`);
}

/**
 * Categorize number line mistakes
 * Detects: overestimation, underestimation, magnitude_error, boundary_error
 */
function categorizeNumberLineMistake(result: DrillResult): { type: MistakeType; severity: Severity } {
  const target = result.targetNumber!;
  const userAnswer = result.userAnswer as number;
  const error = Math.abs(userAnswer - target);

  // Infer range from difficulty level since rangeMin/rangeMax not in schema
  // easy: 0-100, medium: 0-500, hard: 0-1000
  const rangeByDifficulty: Record<string, number> = {
    easy: 100,
    medium: 500,
    hard: 1000,
  };
  const range = rangeByDifficulty[result.difficulty] || 100;
  const errorPercent = (error / range) * 100;

  // Determine severity (AC-4)
  let severity: Severity;
  if (errorPercent > 20) {
    severity = 'severe';
  } else if (errorPercent >= 5) {
    severity = 'moderate';
  } else {
    severity = 'minor';
  }

  // Determine mistake type based on error pattern analysis
  let type: MistakeType;

  // Boundary error: target is within 10% of range edges (0 or max)
  const boundaryThreshold = range * 0.1;
  const isNearLowerBoundary = target <= boundaryThreshold;
  const isNearUpperBoundary = target >= (range - boundaryThreshold);

  // Magnitude error: large errors (>30%) suggest magnitude/scale confusion
  const isMagnitudeError = errorPercent > 30;

  if (isMagnitudeError && result.difficulty === 'hard') {
    // Magnitude errors are more significant on larger ranges
    type = 'magnitude_error';
  } else if ((isNearLowerBoundary || isNearUpperBoundary) && errorPercent > 10) {
    // Boundary errors: struggles near 0 or max of range
    type = 'boundary_error';
  } else if (userAnswer > target) {
    type = 'overestimation';
  } else {
    type = 'underestimation';
  }

  return { type, severity };
}

/**
 * Categorize spatial rotation mistakes
 * Detects: rotation_confusion, mirror_confusion, complexity_threshold
 */
function categorizeSpatialMistake(result: DrillResult): { type: MistakeType; severity: Severity } {
  const isMirrored = result.isMirrored ?? false;
  const shapeType = (result.shapeType ?? '').toLowerCase();
  const difficulty = result.difficulty;

  // Shape complexity classification
  const simpleShapes = ['circle', 'square', 'triangle'];
  const mediumShapes = ['rectangle', 'pentagon', 'hexagon', 'diamond', 'parallelogram'];
  // Complex shapes: everything else (irregular, star, arrow, etc.)

  const isSimpleShape = simpleShapes.includes(shapeType);
  const isMediumShape = mediumShapes.includes(shapeType);
  const isComplexShape = !isSimpleShape && !isMediumShape && shapeType !== '';

  // Determine mistake type based on complexity pattern
  let type: MistakeType;

  // Complexity threshold: user OK with simple shapes but struggles with complex
  // This is detected when failing on hard difficulty with complex shapes
  if (isComplexShape && difficulty === 'hard') {
    type = 'complexity_threshold';
  } else if (isMirrored) {
    type = 'mirror_confusion';
  } else {
    type = 'rotation_confusion';
  }

  // Determine severity based on shape complexity (AC-4)
  let severity: Severity;
  if (isSimpleShape) {
    severity = 'severe';  // Wrong on simple shapes = severe
  } else if (isMediumShape) {
    severity = 'moderate';  // Medium complexity = moderate
  } else {
    severity = 'minor';  // Complex shapes = minor (expected difficulty)
  }

  return { type, severity };
}

/**
 * Categorize math operations mistakes
 * Detects: operation_weakness, magnitude_threshold, speed_accuracy_tradeoff
 */
function categorizeMathMistake(result: DrillResult): { type: MistakeType; severity: Severity } {
  const operation = result.operation!;
  const difficulty = result.difficulty;
  const timeToAnswer = result.timeToAnswer;
  const problem = result.problem ?? '';

  // Parse problem to detect magnitude (single vs double digit)
  const numbers = problem.match(/\d+/g)?.map(Number) || [];
  const hasDoubleDigit = numbers.some(n => n >= 10);
  const hasTripleDigit = numbers.some(n => n >= 100);

  // Speed threshold (in ms) - fast answers with errors suggest speed/accuracy tradeoff
  const fastThreshold = 2000;  // Under 2 seconds is very fast

  // Determine mistake type based on pattern analysis
  let type: MistakeType;

  // Speed/accuracy tradeoff: fast answer but wrong suggests rushing
  if (timeToAnswer < fastThreshold) {
    type = 'speed_accuracy_tradeoff';
  }
  // Magnitude threshold: struggles with larger numbers
  else if ((hasTripleDigit && difficulty === 'hard') || (hasDoubleDigit && difficulty === 'medium')) {
    type = 'magnitude_threshold';
  }
  // Default: operation-specific weakness
  else {
    type = 'operation_weakness';
  }

  // Determine severity based on operation difficulty (AC-4)
  let severity: Severity;
  if (operation === 'addition' && difficulty === 'easy' && !hasDoubleDigit) {
    severity = 'severe';  // Basic single-digit addition = severe
  } else if (hasDoubleDigit && difficulty !== 'hard') {
    severity = 'moderate';  // Double-digit on easy/medium = moderate
  } else if (operation === 'multiplication' || hasTripleDigit) {
    severity = 'minor';   // Multiplication or large numbers = minor
  } else {
    severity = 'moderate'; // Default
  }

  return { type, severity };
}

/**
 * Analyze a single drill result
 * Task 3: Return categorized mistake or null if correct
 *
 * @param result - DrillResult to analyze
 * @returns CategorizedMistake or null if answer was correct
 */
export function analyzeDrillResult(result: DrillResult): CategorizedMistake | null {
  // Return null for correct answers (AC-4)
  if (result.isCorrect) {
    return null;
  }

  // Categorize the mistake
  const { type, severity } = categorizeMistake(result);

  // Build CategorizedMistake object
  const mistake: CategorizedMistake = {
    drillId: uuidv4(),  // Generate unique ID
    mistakeType: type,
    severity,
    timestamp: Date.now(),
    drillContext: {
      module: result.module,
      difficulty: result.difficulty,
      // Include module-specific context
      ...(result.operation && { operation: result.operation }),
      ...(result.shapeType && { shapeType: result.shapeType }),
      ...(result.targetNumber !== undefined && { targetNumber: result.targetNumber }),
    },
  };

  return mistake;
}

/**
 * Detect patterns in mistake history
 * Task 4: Find patterns using sliding window
 *
 * @param mistakes - Array of categorized mistakes
 * @param windowSize - Number of recent drills to analyze (default: 5)
 * @returns Array of detected patterns
 */
export function detectPattern(
  mistakes: CategorizedMistake[],
  windowSize: number = 5
): MistakePattern[] {
  // Apply sliding window - take last N mistakes
  const recentMistakes = mistakes.slice(-windowSize);

  // Count occurrences of each mistake type
  const typeCounts = new Map<MistakeType, number>();
  for (const mistake of recentMistakes) {
    const count = typeCounts.get(mistake.mistakeType) || 0;
    typeCounts.set(mistake.mistakeType, count + 1);
  }

  // Identify patterns: 2+ occurrences = pattern (AC-5)
  const patterns: MistakePattern[] = [];
  for (const [type, occurrences] of typeCounts.entries()) {
    if (occurrences >= 2) {
      const pattern: MistakePattern = {
        patternType: type,
        occurrences,
        recentDrills: recentMistakes.length,
        confidence: occurrences / recentMistakes.length,  // 0-1 confidence
        detectedAt: Date.now(),
      };
      patterns.push(pattern);
    }
  }

  return patterns;
}

/**
 * Analyze complete session results
 * Task 5: Full session analysis
 *
 * @param results - Array of all drill results in session
 * @returns Complete AnalysisResult with mistakes, patterns, and recommendations
 */
export function analyzeSession(results: DrillResult[]): AnalysisResult {
  const sessionId = results.length > 0 ? results[0].sessionId : 0;

  // Process each result through analyzeDrillResult
  const mistakes: CategorizedMistake[] = [];
  for (const result of results) {
    const mistake = analyzeDrillResult(result);
    if (mistake) {
      mistakes.push(mistake);
    }
  }

  // Detect patterns in mistakes
  const patterns = detectPattern(mistakes);

  // Generate recommendations based on patterns
  const recommendations: string[] = [];
  for (const pattern of patterns) {
    const recommendation = generateRecommendation(pattern);
    if (recommendation) {
      recommendations.push(recommendation);
    }
  }

  // Build complete AnalysisResult
  const analysis: AnalysisResult = {
    sessionId,
    analyzedAt: Date.now(),
    mistakes,
    patterns,
    recommendations,
  };

  return analysis;
}

/**
 * Generate recommendation from detected pattern
 * Exported for testing flexibility
 */
export function generateRecommendation(pattern: MistakePattern): string | null {
  const { patternType, confidence } = pattern;

  // Only recommend if confidence > 0.4 (at least 40% of recent drills)
  if (confidence < 0.4) {
    return null;
  }

  // Generate specific recommendations based on pattern type
  const recommendations: Record<MistakeType, string> = {
    overestimation: 'Practice number line placement - tendency to place too high',
    underestimation: 'Practice number line placement - tendency to place too low',
    magnitude_error: 'Practice with larger number ranges to improve magnitude estimation',
    boundary_error: 'Focus on numbers near 0 and 100 to improve boundary accuracy',
    rotation_confusion: 'Practice distinguishing 90° vs 180° rotations',
    mirror_confusion: 'Practice identifying mirrored vs rotated shapes',
    complexity_threshold: 'Build confidence with complex shapes through gradual progression',
    operation_weakness: 'Focus on subtraction practice to strengthen operation skills',
    magnitude_threshold: 'Practice with double-digit numbers to improve calculation skills',
    speed_accuracy_tradeoff: 'Balance speed with accuracy - take time to check answers',
  };

  return recommendations[patternType] || null;
}

// ============================================================================
// Session Analysis Helper (AC-5: Analysis after every N drills)
// ============================================================================

/**
 * Configuration for incremental session analysis
 */
export interface SessionAnalyzerConfig {
  triggerInterval: number;      // Run analysis after every N drills (default: 3)
  maxBufferSize: number;        // Max mistakes to keep in buffer (default: 10)
  patternWindowSize: number;    // Window size for pattern detection (default: 5)
}

/**
 * Session analyzer state for incremental analysis
 */
export interface SessionAnalyzerState {
  drillCount: number;
  mistakeBuffer: CategorizedMistake[];
  lastAnalysis: AnalysisResult | null;
}

/**
 * Create a session analyzer for incremental "every N drills" analysis
 * AC-5: Runs after every 3 drills with sliding window
 *
 * @param config - Optional configuration overrides
 * @returns Object with addDrillResult and getState methods
 *
 * @example
 * const analyzer = createSessionAnalyzer();
 * // After each drill:
 * const result = analyzer.addDrillResult(drillResult);
 * if (result) {
 *   // Analysis triggered - patterns detected
 *   console.log(result.patterns);
 * }
 */
export function createSessionAnalyzer(config: Partial<SessionAnalyzerConfig> = {}) {
  const settings: SessionAnalyzerConfig = {
    triggerInterval: config.triggerInterval ?? 3,
    maxBufferSize: config.maxBufferSize ?? 10,
    patternWindowSize: config.patternWindowSize ?? 5,
  };

  const state: SessionAnalyzerState = {
    drillCount: 0,
    mistakeBuffer: [],
    lastAnalysis: null,
  };

  /**
   * Add a drill result and potentially trigger analysis
   * @returns AnalysisResult if analysis was triggered, null otherwise
   */
  function addDrillResult(result: DrillResult): AnalysisResult | null {
    state.drillCount++;

    // Analyze the result
    const mistake = analyzeDrillResult(result);
    if (mistake) {
      state.mistakeBuffer.push(mistake);

      // Maintain max buffer size (sliding window)
      if (state.mistakeBuffer.length > settings.maxBufferSize) {
        state.mistakeBuffer.shift();
      }
    }

    // Trigger analysis every N drills
    if (state.drillCount % settings.triggerInterval === 0) {
      const patterns = detectPattern(state.mistakeBuffer, settings.patternWindowSize);
      const recommendations: string[] = [];

      for (const pattern of patterns) {
        const rec = generateRecommendation(pattern);
        if (rec) recommendations.push(rec);
      }

      state.lastAnalysis = {
        sessionId: result.sessionId,
        analyzedAt: Date.now(),
        mistakes: [...state.mistakeBuffer],
        patterns,
        recommendations,
      };

      return state.lastAnalysis;
    }

    return null;
  }

  /**
   * Get current analyzer state
   */
  function getState(): SessionAnalyzerState {
    return { ...state, mistakeBuffer: [...state.mistakeBuffer] };
  }

  /**
   * Reset the analyzer for a new session
   */
  function reset(): void {
    state.drillCount = 0;
    state.mistakeBuffer = [];
    state.lastAnalysis = null;
  }

  return { addDrillResult, getState, reset };
}
