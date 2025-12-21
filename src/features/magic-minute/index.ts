// Public API for magic-minute
// Story 4.2: Build Magic Minute Timer Component
// Story 4.3: Implement Micro-Challenge Generation Engine

// Components
export { default as MagicMinuteTimer } from './components/MagicMinuteTimer';
export { default as MicroNumberLineDrill } from './components/MicroNumberLineDrill';
export { default as MicroSpatialDrill } from './components/MicroSpatialDrill';
export { default as MicroMathDrill } from './components/MicroMathDrill';

// Hooks
export { useMagicMinuteTrigger } from './hooks/useMagicMinuteTrigger';
export type { UseMagicMinuteTriggerResult } from './hooks/useMagicMinuteTrigger';

// Types - Magic Minute
export type {
  MagicMinuteTimerProps,
  MagicMinuteResult,
  MagicMinuteSummary,
  MagicMinuteTriggerConfig,
  RenderChallengeProps,
} from './types/magicMinute.types';

export {
  MAGIC_MINUTE_DURATION,
  DEFAULT_TRIGGER_CONFIG,
} from './types/magicMinute.types';

// Types - Micro Challenges (Story 4.3)
export type {
  MicroChallenge,
  MicroChallengeType,
  MicroChallengeResult,
  MicroNumberLineParams,
  MicroSpatialParams,
  MicroMathParams,
  AdaptiveState,
} from './types/microChallenge.types';

export {
  CHALLENGE_TIMEOUT_MS,
  NUMBER_LINE_AUTO_SUBMIT_MS,
  MATH_AUTO_SUBMIT_DIGITS,
} from './types/microChallenge.types';

// Persistence
export {
  createMagicMinuteSession,
  updateMagicMinuteSession,
  getMagicMinuteSessions,
  getLatestMagicMinuteSession,
  persistMicroChallengeResult,
  persistAllMicroChallengeResults,
  completeMagicMinuteWithResults,
} from './services/magicMinutePersistence';
