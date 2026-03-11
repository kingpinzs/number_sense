/**
 * InsightEngine Types
 *
 * The InsightEngine automatically detects patterns in training data
 * by analyzing every variable it can derive from timestamps, accuracy,
 * response times, domains, difficulty levels, session patterns, and more.
 *
 * It surfaces only insights with sufficient confidence and effect size,
 * giving the user an "AI-like" experience of discovering what works for them.
 */

// ─── Core insight types ─────────────────────────────────────────────────────

export type InsightType =
  | 'strength'        // Domain where user excels
  | 'weakness'        // Domain where user struggles most
  | 'trend'           // Performance change over time
  | 'recommendation'  // Actionable suggestion
  | 'discovery'       // Pattern the engine found in context variables
  | 'milestone';      // Achievement or progress marker

export type InsightPriority = 'critical' | 'high' | 'medium' | 'low';

export interface InsightAction {
  /** What to do about this insight */
  label: string;
  /** Which drill type to suggest (if applicable) */
  drillType?: string;
  /** Which domain to focus on */
  domain?: string;
  /** Suggested difficulty level */
  difficulty?: 'easy' | 'medium' | 'hard';
}

export interface Insight {
  /** Unique insight identifier (deterministic from variables + type) */
  id: string;
  type: InsightType;
  /** 0-1 confidence score based on sample size + effect size */
  confidence: number;
  /** Training domain this insight relates to (if domain-specific) */
  domain?: string;
  /** Short title for the card header */
  title: string;
  /** Longer explanation message */
  message: string;
  /** Suggested action based on this insight */
  action?: InsightAction;
  /** Sorting priority (higher = show first) */
  priority: number;
  /** Which analysis variables contributed to this insight */
  variables: string[];
  /** When this insight was generated */
  generatedAt: string;
}

// ─── Suggested drills ───────────────────────────────────────────────────────

export interface SuggestedDrill {
  /** Drill type identifier (matches DrillType from drillSelector) */
  drillType: string;
  /** Human-readable drill name */
  name: string;
  /** Why this drill is suggested */
  reason: string;
  /** Which domain it trains */
  domain: string;
  /** Suggested difficulty based on current performance */
  difficulty: 'easy' | 'medium' | 'hard';
  /** Priority ranking (higher = more important to do) */
  priority: number;
}

// ─── Domain performance snapshot ────────────────────────────────────────────

export interface DomainPerformance {
  domain: string;
  /** Human-readable domain name */
  domainLabel: string;
  /** Recent accuracy (last 10 drills in this domain), 0-100 */
  recentAccuracy: number;
  /** Previous accuracy (10 drills before that), 0-100 */
  previousAccuracy: number;
  /** Delta: recentAccuracy - previousAccuracy */
  trend: number;
  /** Total drill count in this domain */
  totalDrills: number;
  /** Average response time (ms) in recent window */
  avgResponseTime: number;
  /** Current difficulty level the user is at */
  currentDifficulty: 'easy' | 'medium' | 'hard';
}

// ─── Context variables (auto-derived from timestamps + data) ────────────────

export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night';
export type DayType = 'weekday' | 'weekend';

export interface ContextBucket {
  /** The variable being bucketed */
  variable: string;
  /** The bucket label (e.g., "morning", "weekday") */
  label: string;
  /** Number of data points in this bucket */
  count: number;
  /** Average accuracy in this bucket */
  avgAccuracy: number;
  /** Average response time in this bucket */
  avgResponseTime: number;
}

// ─── Analysis results ───────────────────────────────────────────────────────

export interface InsightEngineResult {
  /** Timestamp when analysis was run */
  analyzedAt: string;
  /** Total drill results analyzed */
  dataPointCount: number;
  /** Whether there's enough data for meaningful insights (>= 10 drills) */
  hasEnoughData: boolean;
  /** Sorted insights (highest priority first) */
  insights: Insight[];
  /** Suggested drills ranked by priority */
  suggestedDrills: SuggestedDrill[];
  /** Per-domain performance snapshots */
  domainPerformance: DomainPerformance[];
  /** Context variable analysis (time of day, day of week, etc.) */
  contextAnalysis: ContextBucket[];
}

// ─── Optional check-in config (future) ──────────────────────────────────────

export interface CheckInQuestion {
  id: string;
  label: string;
  type: 'boolean' | 'scale' | 'choice';
  options?: string[];
}

export interface CheckInConfig {
  /** Whether the user has opted in to check-in questions */
  enabled: boolean;
  /** How often to ask (every session, daily, weekly) */
  frequency: 'every_session' | 'daily' | 'weekly';
  /** Which questions are active */
  activeQuestions: string[];
}

// ─── Constants ──────────────────────────────────────────────────────────────

/** Minimum drill results needed before generating insights */
export const MIN_DATA_POINTS = 10;

/** Minimum confidence to surface an insight */
export const MIN_CONFIDENCE = 0.3;

/** Minimum effect size (percentage points) to consider meaningful */
export const MIN_EFFECT_SIZE = 8;

/** Domain labels for display */
export const DOMAIN_LABELS: Record<string, string> = {
  numberSense: 'Number Sense',
  placeValue: 'Place Value',
  sequencing: 'Sequencing',
  arithmetic: 'Arithmetic',
  spatial: 'Spatial',
  applied: 'Applied Math',
};

/** Drill type to domain mapping */
export const DRILL_TO_DOMAIN: Record<string, string> = {
  number_line: 'numberSense',
  subitizing: 'numberSense',
  magnitude_comparison: 'numberSense',
  place_value: 'placeValue',
  estimation: 'placeValue',
  number_decomposition: 'placeValue',
  sequencing: 'sequencing',
  rhythmic_counting: 'sequencing',
  math_operations: 'arithmetic',
  number_bonds: 'arithmetic',
  fact_fluency: 'arithmetic',
  mental_math_strategy: 'arithmetic',
  fact_family: 'arithmetic',
  spatial_rotation: 'spatial',
  fractions: 'applied',
  time_measurement: 'applied',
  working_memory: 'applied',
  everyday_math: 'applied',
};

/** Human-readable drill names */
export const DRILL_LABELS: Record<string, string> = {
  number_line: 'Number Line',
  subitizing: 'Subitizing',
  magnitude_comparison: 'Magnitude Comparison',
  place_value: 'Place Value',
  estimation: 'Estimation',
  number_decomposition: 'Number Decomposition',
  sequencing: 'Sequencing',
  rhythmic_counting: 'Rhythmic Counting',
  math_operations: 'Math Operations',
  number_bonds: 'Number Bonds',
  fact_fluency: 'Fact Fluency',
  mental_math_strategy: 'Mental Math Strategy',
  fact_family: 'Fact Families',
  spatial_rotation: 'Spatial Rotation',
  fractions: 'Fractions',
  time_measurement: 'Time & Measurement',
  working_memory: 'Working Memory',
  everyday_math: 'Everyday Math',
};

/** Time-of-day hour ranges */
export const TIME_OF_DAY_RANGES: Record<TimeOfDay, [number, number]> = {
  morning: [6, 12],
  afternoon: [12, 17],
  evening: [17, 22],
  night: [22, 6],  // wraps around midnight
};
