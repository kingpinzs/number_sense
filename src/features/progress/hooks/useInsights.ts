// useInsights Hook - Story 5.4
// Fetches session and drill data from Dexie, generates insights
// Pattern: Cloned from useConfidenceData with extended query

import { useState, useEffect, useCallback } from 'react';
import { db } from '@/services/storage/db';
import { generateInsights } from '../services/insightsEngine';
import type { Insight } from '../services/insightsEngine';

const MAX_SESSIONS_TO_QUERY = 30;
const MIN_SESSIONS_REQUIRED = 3;

export interface UseInsightsResult {
  isLoading: boolean;
  insights: Insight[];
  hasEnoughData: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook to fetch session data and generate personalized insights
 * Queries last 30 training sessions for trend analysis
 */
export function useInsights(): UseInsightsResult {
  const [isLoading, setIsLoading] = useState(true);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [hasEnoughData, setHasEnoughData] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchInsights = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Query training sessions (same pattern as useConfidenceData)
      const sessions = await db.sessions
        .where('module')
        .equals('training')
        .reverse()
        .limit(MAX_SESSIONS_TO_QUERY)
        .toArray();

      const completedSessions = sessions.filter(s => s.completionStatus === 'completed');
      const enoughData = completedSessions.length >= MIN_SESSIONS_REQUIRED;
      setHasEnoughData(enoughData);

      if (!enoughData) {
        setInsights([]);
        return;
      }

      // Join drill results for these sessions
      const sessionIds = completedSessions
        .map(s => s.id)
        .filter((id): id is number => id !== undefined);

      const drillResults = sessionIds.length > 0
        ? await db.drill_results
            .where('sessionId')
            .anyOf(sessionIds)
            .toArray()
        : [];

      // Generate insights
      const generated = generateInsights(completedSessions, drillResults);
      setInsights(generated);
    } catch (err) {
      console.error('Error generating insights:', err);
      setError('Failed to generate insights');
      setInsights([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInsights();
  }, [fetchInsights]);

  return {
    isLoading,
    insights,
    hasEnoughData,
    error,
    refetch: fetchInsights,
  };
}
