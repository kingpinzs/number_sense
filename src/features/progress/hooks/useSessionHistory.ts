// useSessionHistory Hook - Story 5.2
// Fetches paginated session history with joined drill results from Dexie
// Pattern: Cloned from useConfidenceData with pagination extensions

import { useState, useEffect, useCallback, useRef } from 'react';
import { db } from '@/services/storage/db';
import type { Session, DrillResult, MagicMinuteSession } from '@/services/storage/schemas';

const PAGE_SIZE = 30;

/**
 * Session with joined drill results
 */
export interface SessionWithDrills extends Session {
  drills: DrillResult[];
  hasMagicMinute: boolean;
}

/**
 * Hook return type
 */
export interface UseSessionHistoryResult {
  /** True while data is being fetched */
  isLoading: boolean;
  /** Sessions with joined drill results */
  sessions: SessionWithDrills[];
  /** True if more pages are available */
  hasMore: boolean;
  /** Error message if fetch failed */
  error: string | null;
  /** Load next page of sessions */
  loadMore: () => Promise<void>;
}

/**
 * Hook to fetch paginated session history from Dexie
 *
 * Queries training sessions in reverse chronological order,
 * joins drill results, filters for completed sessions only.
 * Supports "Load More" pagination with 30-session pages.
 *
 * @returns UseSessionHistoryResult
 */
export function useSessionHistory(): UseSessionHistoryResult {
  const [isLoading, setIsLoading] = useState(true);
  const [sessions, setSessions] = useState<SessionWithDrills[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const offsetRef = useRef(0);

  const fetchSessions = useCallback(async (offset: number, append: boolean = false) => {
    setIsLoading(true);
    setError(null);

    try {
      // Query training sessions using indexed 'module' field
      const results: Session[] = await db.sessions
        .where('module')
        .equals('training')
        .reverse()
        .offset(offset)
        .limit(PAGE_SIZE)
        .toArray();

      // Determine if more pages exist (uses raw count before filtering;
      // in rare cases where most results are non-completed, "Load More"
      // may yield fewer visible sessions than expected)
      setHasMore(results.length === PAGE_SIZE);

      // Filter for completed sessions only
      const completed = results.filter(s => s.completionStatus === 'completed');

      // Join drill results for these sessions
      const sessionIds = completed
        .map(s => s.id)
        .filter((id): id is number => id !== undefined);

      let drillResults: DrillResult[] = [];
      let magicMinuteSessions: MagicMinuteSession[] = [];
      if (sessionIds.length > 0) {
        [drillResults, magicMinuteSessions] = await Promise.all([
          db.drill_results.where('sessionId').anyOf(sessionIds).toArray(),
          db.magic_minute_sessions.where('sessionId').anyOf(sessionIds).toArray(),
        ]);
      }

      // Build set of session IDs that had Magic Minute
      const magicMinuteSessionIds = new Set(magicMinuteSessions.map(mm => mm.sessionId));

      // Map sessions with their drill results and Magic Minute flag
      const sessionsWithDrills: SessionWithDrills[] = completed.map(session => ({
        ...session,
        drills: drillResults.filter(dr => dr.sessionId === session.id),
        hasMagicMinute: magicMinuteSessionIds.has(session.id!),
      }));

      // Append or replace sessions
      if (append) {
        setSessions(prev => [...prev, ...sessionsWithDrills]);
      } else {
        setSessions(sessionsWithDrills);
      }
    } catch (err) {
      console.error('Error fetching session history:', err);
      setError('Failed to load session history');
      if (!append) {
        setSessions([]);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load more function for pagination
  const loadMore = useCallback(async () => {
    offsetRef.current += PAGE_SIZE;
    await fetchSessions(offsetRef.current, true);
  }, [fetchSessions]);

  // Initial fetch on mount
  useEffect(() => {
    offsetRef.current = 0;
    fetchSessions(0);
  }, [fetchSessions]);

  return {
    isLoading,
    sessions,
    hasMore,
    error,
    loadMore,
  };
}
