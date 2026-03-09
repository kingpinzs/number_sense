// SessionContext - Active training session state management
// Architecture: React Context + useReducer pattern for session state
// Manages: currentModule, sessionId, sessionStatus, startTime
// Story 3.1: Extended to support training-specific state
// Story 4.2: Extended to support Magic Minute state

import { createContext, useContext, useReducer, type ReactNode, type Dispatch } from 'react';
import type { DrillType } from '@/services/training/drillSelector';
import type { DrillResult } from '@/services/storage/schemas';
import type { MistakePattern } from '@/services/adaptiveDifficulty/mistakeAnalyzer';
import type { MagicMinuteResult } from '@/features/magic-minute/types/magicMinute.types';

/**
 * SessionStatus - Possible session states
 */
export type SessionStatus = 'idle' | 'active' | 'paused' | 'completed';

/**
 * SessionState interface - Active session state
 * Extended in Story 3.1 to support training sessions
 * Extended in Story 4.2 to support Magic Minute
 */
export interface SessionState {
  currentModule: string | null;
  sessionId: number | null;
  sessionStatus: SessionStatus;
  startTime: string | null;

  // Training-specific state (Story 3.1)
  sessionType?: 'quick' | 'full';
  drillQueue?: DrillType[];
  currentDrillIndex?: number;
  results?: DrillResult[];

  // Confidence tracking (Story 3.6)
  confidenceBefore?: number | null;  // 1-5 scale
  confidenceAfter?: number | null;   // 1-5 scale
  confidenceChange?: number | null;  // Delta (after - before)

  // Magic Minute state (Story 4.2)
  magicMinuteTriggered?: boolean;
  magicMinuteActive?: boolean;
  magicMinutePatterns?: MistakePattern[];
  magicMinuteResults?: MagicMinuteResult[];
}

/**
 * SessionAction - Discriminated union of all possible actions
 * Extended in Story 3.1 to support training sessions
 * Extended in Story 4.2 to support Magic Minute
 */
export type SessionAction =
  | { type: 'START_SESSION'; payload: { module: string; sessionId: number } }
  | { type: 'START_TRAINING_SESSION'; payload: { sessionId: number; sessionType: 'quick' | 'full'; drillQueue: DrillType[] } }
  | { type: 'NEXT_DRILL' }
  | { type: 'RECORD_DRILL_RESULT'; payload: DrillResult }
  | { type: 'END_SESSION' }
  | { type: 'PAUSE_SESSION' }
  | { type: 'RESUME_SESSION' }
  | { type: 'SET_CONFIDENCE_BEFORE'; payload: number }  // Story 3.6
  | { type: 'SET_CONFIDENCE_AFTER'; payload: number }   // Story 3.6
  // Story 4.2: Magic Minute actions
  | { type: 'TRIGGER_MAGIC_MINUTE'; payload: { patterns: MistakePattern[] } }
  | { type: 'RECORD_MAGIC_MINUTE_RESULT'; payload: MagicMinuteResult }
  | { type: 'COMPLETE_MAGIC_MINUTE' };

/**
 * Initial state - No active session
 */
const initialState: SessionState = {
  currentModule: null,
  sessionId: null,
  sessionStatus: 'idle',
  startTime: null
};

/**
 * SessionReducer - Handles all state transitions
 * Follows architecture spec reducer pattern
 *
 * @param state - Current state
 * @param action - Action to process
 * @returns New state
 */
function sessionReducer(state: SessionState, action: SessionAction): SessionState {
  switch (action.type) {
    case 'START_SESSION':
      return {
        ...state,
        currentModule: action.payload.module,
        sessionId: action.payload.sessionId,
        sessionStatus: 'active',
        startTime: new Date().toISOString()
      };

    case 'START_TRAINING_SESSION':
      // Story 3.1: New action for training sessions
      return {
        ...state,
        currentModule: 'training',
        sessionId: action.payload.sessionId,
        sessionStatus: 'active',
        startTime: new Date().toISOString(),
        sessionType: action.payload.sessionType,
        drillQueue: action.payload.drillQueue,
        currentDrillIndex: 0,
        results: []
      };

    case 'NEXT_DRILL':
      // Story 3.1: Advance to next drill in queue
      if (state.currentDrillIndex === undefined || !state.drillQueue) {
        console.warn('Cannot advance drill: not in training session');
        return state;
      }
      return {
        ...state,
        currentDrillIndex: state.currentDrillIndex + 1
      };

    case 'RECORD_DRILL_RESULT':
      // Story 3.1: Record drill result
      return {
        ...state,
        results: [...(state.results || []), action.payload]
      };

    case 'END_SESSION':
      return {
        ...state,
        sessionStatus: 'completed'
        // Note: Keep module/sessionId/results for telemetry logging after completion
      };

    case 'PAUSE_SESSION':
      if (state.sessionStatus !== 'active') {
        console.warn('Cannot pause session: session is not active');
        return state;
      }
      return {
        ...state,
        sessionStatus: 'paused'
      };

    case 'RESUME_SESSION':
      if (state.sessionStatus !== 'paused') {
        console.warn('Cannot resume session: session is not paused');
        return state;
      }
      return {
        ...state,
        sessionStatus: 'active'
      };

    case 'SET_CONFIDENCE_BEFORE':
      // Story 3.6: Set pre-session confidence (1-5)
      return {
        ...state,
        confidenceBefore: action.payload
      };

    case 'SET_CONFIDENCE_AFTER': {
      // Story 3.6: Set post-session confidence and calculate delta
      const confidenceChange = state.confidenceBefore !== null && state.confidenceBefore !== undefined
        ? action.payload - state.confidenceBefore
        : null;
      return {
        ...state,
        confidenceAfter: action.payload,
        confidenceChange
      };
    }

    // Story 4.2: Magic Minute actions
    case 'TRIGGER_MAGIC_MINUTE':
      return {
        ...state,
        magicMinuteTriggered: true,
        magicMinuteActive: true,
        magicMinutePatterns: action.payload.patterns,
        magicMinuteResults: []
      };

    case 'RECORD_MAGIC_MINUTE_RESULT':
      return {
        ...state,
        magicMinuteResults: [
          ...(state.magicMinuteResults || []),
          action.payload
        ]
      };

    case 'COMPLETE_MAGIC_MINUTE':
      return {
        ...state,
        magicMinuteActive: false
      };

    default:
      return state;
  }
}

/**
 * Context shape - Includes state, dispatch, and convenience methods
 * Extended in Story 3.1 to support training sessions
 * Extended in Story 4.2 to support Magic Minute
 */
interface SessionContextValue {
  state: SessionState;
  dispatch: Dispatch<SessionAction>;
  // Convenience methods
  startSession: (module: string, sessionId: number) => void;
  startTrainingSession: (sessionId: number, sessionType: 'quick' | 'full', drillQueue: DrillType[]) => void;
  nextDrill: () => void;
  recordDrillResult: (result: DrillResult) => void;
  endSession: () => void;
  pauseSession: () => void;
  resumeSession: () => void;
  // Story 3.6: Confidence tracking methods
  setConfidenceBefore: (confidence: number) => void;
  setConfidenceAfter: (confidence: number) => void;
  // Story 4.2: Magic Minute methods
  triggerMagicMinute: (patterns: MistakePattern[]) => void;
  recordMagicMinuteResult: (result: MagicMinuteResult) => void;
  completeMagicMinute: () => void;
}

// Create context (not exported - use useSession hook instead)
const SessionContext = createContext<SessionContextValue | undefined>(undefined);

/**
 * SessionProvider - Context provider component
 * Wraps app to provide session state
 *
 * @param props - Component props with children
 */
export function SessionProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(sessionReducer, initialState);

  // Convenience methods that wrap dispatch
  const startSession = (module: string, sessionId: number) => {
    dispatch({ type: 'START_SESSION', payload: { module, sessionId } });
  };

  // Story 3.1: Training session convenience methods
  const startTrainingSession = (sessionId: number, sessionType: 'quick' | 'full', drillQueue: DrillType[]) => {
    dispatch({ type: 'START_TRAINING_SESSION', payload: { sessionId, sessionType, drillQueue } });
  };

  const nextDrill = () => {
    dispatch({ type: 'NEXT_DRILL' });
  };

  const recordDrillResult = (result: DrillResult) => {
    dispatch({ type: 'RECORD_DRILL_RESULT', payload: result });
  };

  const endSession = () => {
    dispatch({ type: 'END_SESSION' });
  };

  const pauseSession = () => {
    dispatch({ type: 'PAUSE_SESSION' });
  };

  const resumeSession = () => {
    dispatch({ type: 'RESUME_SESSION' });
  };

  // Story 3.6: Confidence tracking convenience methods
  const setConfidenceBefore = (confidence: number) => {
    dispatch({ type: 'SET_CONFIDENCE_BEFORE', payload: confidence });
  };

  const setConfidenceAfter = (confidence: number) => {
    dispatch({ type: 'SET_CONFIDENCE_AFTER', payload: confidence });
  };

  // Story 4.2: Magic Minute convenience methods
  const triggerMagicMinute = (patterns: MistakePattern[]) => {
    dispatch({ type: 'TRIGGER_MAGIC_MINUTE', payload: { patterns } });
  };

  const recordMagicMinuteResult = (result: MagicMinuteResult) => {
    dispatch({ type: 'RECORD_MAGIC_MINUTE_RESULT', payload: result });
  };

  const completeMagicMinute = () => {
    dispatch({ type: 'COMPLETE_MAGIC_MINUTE' });
  };

  const value: SessionContextValue = {
    state,
    dispatch,
    startSession,
    startTrainingSession,
    nextDrill,
    recordDrillResult,
    endSession,
    pauseSession,
    resumeSession,
    setConfidenceBefore,
    setConfidenceAfter,
    triggerMagicMinute,
    recordMagicMinuteResult,
    completeMagicMinute
  };

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

/**
 * useSession - Custom hook to access SessionContext
 * Provides type-safe access to session state and actions
 *
 * @returns SessionContextValue with state and convenience methods
 * @throws Error if used outside SessionProvider
 */
export function useSession(): SessionContextValue {
  const context = useContext(SessionContext);

  if (context === undefined) {
    throw new Error('useSession must be used within SessionProvider');
  }

  return context;
}

// Re-export MagicMinuteResult for backwards compatibility
export type { MagicMinuteResult } from '@/features/magic-minute/types/magicMinute.types';
