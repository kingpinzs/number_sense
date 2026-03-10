// TypeScript schema interfaces for Dexie tables
// Architecture: Discalculas local-first data model
// All data stored in browser IndexedDB via Dexie.js

/**
 * Session represents a complete user training/assessment session
 * Story 3.1: Extended to support training-specific fields
 * Story 3.6: Extended to support confidence tracking (1-5 scale)
 */
export interface Session {
  id?: number;           // Primary key (auto-increment)
  timestamp: string;     // ISO 8601 (indexed)
  module: string;        // "assessment" | "training" | "cognition" | "coach"
  duration: number;      // milliseconds
  completionStatus: "completed" | "abandoned" | "paused";
  /** @deprecated Use confidenceBefore (1-5 scale) instead */
  confidencePre?: number;
  /** @deprecated Use confidenceAfter (1-5 scale) instead */
  confidencePost?: number;
  anxietyLevel?: number;    // 1-10 scale

  // Training-specific fields (Story 3.1)
  sessionType?: 'quick' | 'full';   // Training session type
  drillQueue?: string[];             // Array of drill types for the session

  // Confidence tracking fields (Story 3.6) - 1-5 scale
  confidenceBefore?: number;   // 1-5 scale
  confidenceAfter?: number;    // 1-5 scale
  confidenceChange?: number;   // Delta (after - before)
  drillCount?: number;         // Number of drills completed
  accuracy?: number;           // Accuracy percentage (0-100)
}

/**
 * Assessment stores diagnostic assessment results
 */
export interface Assessment {
  id?: number;
  timestamp: string;
  status: "in-progress" | "completed";
  totalQuestions: number;
  correctAnswers: number;
  weaknesses: string[];     // e.g., ["number-sense", "spatial-rotation"]
  strengths: string[];
  recommendations: string[];
  userId: string;          // Always "local_user"
}

/**
 * DrillResult captures individual drill performance data
 * Story 3.2: Extended to support detailed drill metrics per Epic 3 spec
 */
export interface DrillResult {
  id?: number;              // Auto-increment primary key (Dexie)
  sessionId: number;        // Foreign key to sessions table
  timestamp: string;        // ISO 8601 drill completion time
  module: 'number_line' | 'spatial_rotation' | 'math_operations' | 'subitizing' | 'number_bonds'
    | 'magnitude_comparison' | 'place_value' | 'estimation' | 'sequencing' | 'fact_fluency'
    | 'fractions' | 'time_measurement' | 'working_memory';  // Drill type
  difficulty: 'easy' | 'medium' | 'hard';
  isCorrect: boolean;
  timeToAnswer: number;     // Milliseconds
  accuracy: number;         // Percentage (0-100)

  // Number Line specific fields
  targetNumber?: number;    // Target number to place on line
  userAnswer?: number;      // User's placement value
  correctAnswer?: number;   // Correct answer (same as targetNumber for validation)

  // Spatial Rotation specific fields
  shapeType?: string;       // SVG shape identifier
  rotationDegrees?: number; // Rotation amount (90, 180, 270)
  isMirrored?: boolean;     // Whether shape was mirrored

  // Math Operations specific fields
  operation?: 'addition' | 'subtraction' | 'multiplication';
  problem?: string;         // e.g., "12 + 7"

  // Confidence tracking (Story 3.6)
  confidence?: string;      // User's self-reported confidence level
}

/**
 * TelemetryLog stores structured event telemetry
 */
export interface TelemetryLog {
  id?: number;
  timestamp: string;       // Indexed
  event: string;          // Indexed (e.g., "drill_completed", "session_started")
  module: string;
  data: Record<string, any>;  // JSON payload
  userId: string;         // Always "local_user"
}

/**
 * MagicMinuteSession tracks 60-second sprint sessions
 */
export interface MagicMinuteSession {
  id?: number;
  sessionId: number;
  timestamp: string;
  targetedMistakes: string[];   // Array of mistake types from session
  challengesGenerated: number;
  challengesCompleted: number;
  successRate: number;          // 0-1
  duration: number;             // milliseconds (should be ~60000)
}

/**
 * DifficultyHistory tracks adaptive difficulty adjustments
 */
export interface DifficultyHistory {
  id?: number;
  sessionId: number;
  timestamp: string;
  module: string;
  previousDifficulty: number;   // 1-10
  newDifficulty: number;        // 1-10
  reason: string;               // "too_easy" | "too_hard" | "optimal"
  userAccepted: boolean;        // Did user accept adjustment?
}

/**
 * Experiment defines A/B test experiments
 */
export interface Experiment {
  id?: number;
  name: string;
  description: string;
  status: "active" | "paused" | "completed";
  startDate: string;
  endDate?: string;
  variants: string[];           // e.g., ["control", "variant_a", "variant_b"]
}

/**
 * ExperimentObservation captures metrics for experiment variants
 */
export interface ExperimentObservation {
  id?: number;
  experimentId: string;  // Story 8.1: String experiment key (e.g., 'drill-timer-visibility')
  variantId: string;
  timestamp: string;
  metric: string;               // e.g., "completion_rate", "confidence_delta"
  value: number;
  userId: string;               // Always "local_user"
}
