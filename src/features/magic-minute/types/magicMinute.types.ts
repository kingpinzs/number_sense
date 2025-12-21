/**
 * Magic Minute Types
 * Story 4.2: Build Magic Minute Timer Component
 * Story 4.3: Extended with micro-challenge support
 *
 * Type definitions for Magic Minute feature including timer state,
 * results tracking, and integration with SessionContext.
 */

import type { MistakePattern } from '@/services/adaptiveDifficulty/mistakeAnalyzer';
import type { MicroChallenge, MicroChallengeResult } from './microChallenge.types';

/**
 * Result of a single Magic Minute challenge answer
 */
export interface MagicMinuteResult {
  correct: boolean;
  timeToAnswer: number;  // milliseconds
}

/**
 * Props passed to the renderChallenge function
 */
export interface RenderChallengeProps {
  /** Current micro-challenge to render */
  challenge: MicroChallenge;
  /** Callback when challenge is answered */
  onResult: (result: MicroChallengeResult) => void;
  /** Time remaining in Magic Minute (seconds) */
  timeRemaining: number;
}

/**
 * Props for MagicMinuteTimer component
 */
export interface MagicMinuteTimerProps {
  /** Mistake patterns detected from session to target */
  mistakePatterns: MistakePattern[];
  /** Current training session ID */
  sessionId: number;
  /** Callback when Magic Minute completes (timer reaches 0) */
  onComplete: (results: MagicMinuteSummary) => void;
  /** Callback when a challenge is answered */
  onChallengeComplete?: (result: MagicMinuteResult) => void;
  /** Render prop for micro-challenges (Story 4.3) */
  renderChallenge?: (props: RenderChallengeProps) => React.ReactNode;
  /** Enable micro-challenges (default: true when renderChallenge provided) */
  enableChallenges?: boolean;
}

/**
 * Summary returned when Magic Minute completes
 */
export interface MagicMinuteSummary {
  totalChallenges: number;
  correctCount: number;
  successRate: number;  // 0-1
  duration: number;     // milliseconds (should be ~60000)
  targetedMistakes: string[];
}

/**
 * Configuration for trigger logic
 */
export interface MagicMinuteTriggerConfig {
  /** Minimum drills completed before trigger eligible */
  minDrillCount: number;
  /** Minimum mistakes required to have content */
  minMistakeCount: number;
  /** Probability of trigger at eligible points (0-1) */
  triggerProbability: number;
  /** Drill indices where trigger can occur */
  triggerPoints: number[];
}

/**
 * Default trigger configuration
 */
export const DEFAULT_TRIGGER_CONFIG: MagicMinuteTriggerConfig = {
  minDrillCount: 6,
  minMistakeCount: 3,
  triggerProbability: 0.3,
  triggerPoints: [6, 9, 12],  // After drills 6, 9, or 12
};

/**
 * Timer duration in seconds
 */
export const MAGIC_MINUTE_DURATION = 60;
