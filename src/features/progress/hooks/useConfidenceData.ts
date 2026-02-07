// useConfidenceData Hook - Story 5.1
// Fetches and calculates confidence data from Dexie
// Architecture: Custom hook with loading state and error handling

import { useState, useEffect, useCallback } from 'react';
import { db } from '@/services/storage/db';
import type { Session, DrillResult } from '@/services/storage/schemas';
import {
  calculateDomainConfidence,
  getBaselineConfidence,
  type DomainConfidence,
} from '../services/confidenceCalculator';

/**
 * Minimum sessions required to show confidence radar (AC-4)
 */
const MIN_SESSIONS_REQUIRED = 3;

/**
 * Maximum sessions to query for calculations (AC-2)
 */
const MAX_SESSIONS_TO_QUERY = 10;

/**
 * Hook return type
 */
export interface UseConfidenceDataResult {
  /** True while data is being fetched */
  isLoading: boolean;
  /** Current calculated confidence scores (null if insufficient data) */
  current: DomainConfidence | null;
  /** Baseline confidence from first session (null if no baseline) */
  baseline: DomainConfidence | null;
  /** Number of training sessions completed */
  sessionCount: number;
  /** True if user has enough sessions to show radar */
  hasEnoughData: boolean;
  /** Error message if fetch failed */
  error: string | null;
  /** Refetch data (useful after session completion) */
  refetch: () => Promise<void>;
}

/**
 * Hook to fetch and calculate confidence data from Dexie
 *
 * Queries last 10 training sessions and calculates:
 * - Current weighted confidence per domain
 * - Baseline from first session
 *
 * @returns UseConfidenceDataResult with loading, data, and error states
 */
export function useConfidenceData(): UseConfidenceDataResult {
  const [isLoading, setIsLoading] = useState(true);
  const [current, setCurrent] = useState<DomainConfidence | null>(null);
  const [baseline, setBaseline] = useState<DomainConfidence | null>(null);
  const [sessionCount, setSessionCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Query training sessions (AC-2)
      // Using indexed 'module' field for efficient query
      const sessions: Session[] = await db.sessions
        .where('module')
        .equals('training')
        .reverse()
        .limit(MAX_SESSIONS_TO_QUERY)
        .toArray();

      setSessionCount(sessions.length);

      // Check minimum sessions requirement (AC-4)
      if (sessions.length < MIN_SESSIONS_REQUIRED) {
        setCurrent(null);
        setBaseline(null);
        setIsLoading(false);
        return;
      }

      // Get drill results for these sessions
      const sessionIds = sessions
        .map(s => s.id)
        .filter((id): id is number => id !== undefined);

      let drillResults: DrillResult[] = [];
      if (sessionIds.length > 0) {
        // Query drill results for all sessions
        drillResults = await db.drill_results
          .where('sessionId')
          .anyOf(sessionIds)
          .toArray();
      }

      // Calculate confidence scores
      const currentConfidence = calculateDomainConfidence(sessions, drillResults);
      const baselineConfidence = getBaselineConfidence(sessions, drillResults);

      setCurrent(currentConfidence);
      setBaseline(baselineConfidence);
    } catch (err) {
      console.error('Error fetching confidence data:', err);
      setError('Failed to load confidence data');
      setCurrent(null);
      setBaseline(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial fetch on mount
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    isLoading,
    current,
    baseline,
    sessionCount,
    hasEnoughData: sessionCount >= MIN_SESSIONS_REQUIRED,
    error,
    refetch: fetchData,
  };
}
