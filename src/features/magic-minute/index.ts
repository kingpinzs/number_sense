// Public API for magic-minute
// Story 4.2: Build Magic Minute Timer Component
// Story 4.3: Implement Micro-Challenge Generation Engine
// Story 4.5: Build Transparency Toast Notifications

// Components
export { default as MagicMinuteTimer } from './components/MagicMinuteTimer';
export { default as MicroNumberLineDrill } from './components/MicroNumberLineDrill';
export { default as MicroSpatialDrill } from './components/MicroSpatialDrill';
export { default as MicroMathDrill } from './components/MicroMathDrill';
export { TransparencyToast, showTransparencyToastImperative } from './components/TransparencyToast';
export type { TransparencyToastProps } from './components/TransparencyToast';

// Hooks
export { useMagicMinuteTrigger } from './hooks/useMagicMinuteTrigger';
export type { UseMagicMinuteTriggerResult } from './hooks/useMagicMinuteTrigger';
export { useTransparencyToast } from './hooks/useTransparencyToast';
export type { UseTransparencyToastReturn } from './hooks/useTransparencyToast';

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

// Story 4.5: Toast Message Utilities
export {
  MODULE_FRIENDLY_NAMES,
  TOAST_MESSAGES,
  getToastMessage,
  getToastMessageDeterministic,
} from './utils/toastMessages';
export type { ToastContent } from './utils/toastMessages';

// Story 4.5: Toast Position Utilities
export {
  MOBILE_BREAKPOINT,
  isMobileDevice,
  getToastPosition,
} from './utils/toastPosition';
export type { ToastPosition } from './utils/toastPosition';
