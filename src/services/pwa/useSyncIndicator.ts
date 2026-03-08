// useSyncIndicator.ts - Hook for sync status state management
// Story 7.4: Ambient Sync Indicator
//
// Reads onlineStatus from AppContext (which manages online/offline events).
// DO NOT add new window.addEventListener('online'/'offline') here —
// AppContext already owns those listeners.

import { useState, useEffect, useRef, useCallback } from 'react';
import { useApp } from '@/context/AppContext';
import { flushQueue, getQueueSize } from './syncQueue';

export type SyncStatus = 'idle' | 'syncing' | 'complete';

export interface SyncIndicatorState {
  isOnline: boolean;
  syncStatus: SyncStatus;
  pendingSyncCount: number;
}

export function useSyncIndicator(): SyncIndicatorState {
  const { state, setPendingSyncCount } = useApp();
  const { onlineStatus } = state;
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const prevOnlineRef = useRef<boolean>(onlineStatus);
  const completeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Distinguishes initial mount from subsequent onlineStatus changes
  const isFirstRunRef = useRef(true);

  // Hydrate pendingSyncCount in AppContext on mount
  useEffect(() => {
    setPendingSyncCount(getQueueSize());
  }, [setPendingSyncCount]);

  const triggerFlush = useCallback(async () => {
    const queueSize = getQueueSize();
    if (queueSize === 0) return;

    setSyncStatus('syncing');
    try {
      await flushQueue();
      setPendingSyncCount(0);
      setSyncStatus('complete');
      completeTimerRef.current = setTimeout(() => {
        setSyncStatus('idle');
      }, 2000);
    } catch {
      // Flush failed — reset to idle, queue preserved for next retry
      setSyncStatus('idle');
    }
  }, [setPendingSyncCount]);

  // Watch for offline → online transition, or auto-flush on startup if already online
  // with events queued during a previous offline session.
  useEffect(() => {
    if (isFirstRunRef.current) {
      isFirstRunRef.current = false;
      // On mount: flush events left over from a prior offline session.
      // prevOnlineRef is already initialized to onlineStatus via useRef — no reassignment needed.
      if (onlineStatus && getQueueSize() > 0) {
        triggerFlush();
      }
      return;
    }

    // Subsequent renders: detect offline → online transition
    const wasOffline = !prevOnlineRef.current;
    if (wasOffline && onlineStatus) {
      triggerFlush();
    }
    prevOnlineRef.current = onlineStatus;
  }, [onlineStatus, triggerFlush]);

  // Cleanup timeout on unmount to prevent memory leaks and stale state updates
  useEffect(() => {
    return () => {
      if (completeTimerRef.current) {
        clearTimeout(completeTimerRef.current);
      }
    };
  }, []);

  return {
    isOnline: onlineStatus,
    syncStatus,
    pendingSyncCount: state.pendingSyncCount,
  };
}
