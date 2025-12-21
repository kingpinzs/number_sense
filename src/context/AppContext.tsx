// AppContext - Global application state management
// Architecture: React Context + useReducer pattern for app-level state
// Manages: streak, onlineStatus, lastSyncTimestamp

import { createContext, useContext, useReducer, useEffect, type ReactNode, type Dispatch } from 'react';
import { getStreak, setStreak } from '@/services/storage/localStorage';

/**
 * AppState interface - Global app-level state
 */
export interface AppState {
  streak: number;
  onlineStatus: boolean;
  lastSyncTimestamp: string | null;
}

/**
 * AppAction - Discriminated union of all possible actions
 */
export type AppAction =
  | { type: 'SET_STREAK'; payload: number }
  | { type: 'UPDATE_ONLINE_STATUS'; payload: boolean }
  | { type: 'SET_LAST_SYNC'; payload: string | null };

/**
 * Create initial state - Loaded from localStorage where applicable
 * Function ensures fresh state on each provider mount
 */
function createInitialState(): AppState {
  return {
    streak: getStreak(),
    onlineStatus: typeof navigator !== 'undefined' ? navigator.onLine : true,
    lastSyncTimestamp: null
  };
}

/**
 * AppReducer - Handles all state transitions
 * Follows architecture spec reducer pattern
 *
 * @param state - Current state
 * @param action - Action to process
 * @returns New state
 */
function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_STREAK':
      // Persist streak to localStorage on every update
      setStreak(action.payload);
      return { ...state, streak: action.payload };

    case 'UPDATE_ONLINE_STATUS':
      return { ...state, onlineStatus: action.payload };

    case 'SET_LAST_SYNC':
      return { ...state, lastSyncTimestamp: action.payload };

    default:
      return state;
  }
}

/**
 * Context shape - Includes state, dispatch, and convenience methods
 */
interface AppContextValue {
  state: AppState;
  dispatch: Dispatch<AppAction>;
  // Convenience methods
  setStreak: (streak: number) => void;
  updateOnlineStatus: (isOnline: boolean) => void;
  setLastSync: (timestamp: string | null) => void;
}

// Create context (not exported - use useApp hook instead)
const AppContext = createContext<AppContextValue | undefined>(undefined);

/**
 * AppProvider - Context provider component
 * Wraps app to provide global state
 *
 * @param props - Component props with children
 */
export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, createInitialState());

  // Convenience methods that wrap dispatch
  const setStreakFn = (streak: number) => {
    dispatch({ type: 'SET_STREAK', payload: streak });
  };

  const updateOnlineStatus = (isOnline: boolean) => {
    dispatch({ type: 'UPDATE_ONLINE_STATUS', payload: isOnline });
  };

  const setLastSync = (timestamp: string | null) => {
    dispatch({ type: 'SET_LAST_SYNC', payload: timestamp });
  };

  // Listen for online/offline events with proper cleanup
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const handleOnline = () => updateOnlineStatus(true);
      const handleOffline = () => updateOnlineStatus(false);

      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
  }, [updateOnlineStatus]);

  // Prepare for future WebSocket/sync integration
  // TODO: Add WebSocket connection management here when backend is ready
  // TODO: Implement background sync for telemetry when service worker is active

  const value: AppContextValue = {
    state,
    dispatch,
    setStreak: setStreakFn,
    updateOnlineStatus,
    setLastSync
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

/**
 * useApp - Custom hook to access AppContext
 * Provides type-safe access to app state and actions
 *
 * @returns AppContextValue with state and convenience methods
 * @throws Error if used outside AppProvider
 */
export function useApp(): AppContextValue {
  const context = useContext(AppContext);

  if (context === undefined) {
    throw new Error('useApp must be used within AppProvider');
  }

  return context;
}
