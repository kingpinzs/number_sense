// useInsights Hook - Story 5.4
// Now powered by the unified InsightEngine (analyzePerformance)
// Maps InsightEngine results to the legacy Insight format used by InsightsPanel

import { useState, useEffect, useCallback } from 'react';
import { analyzePerformance } from '@/services/training/insightEngine';
import type { Insight as EngineInsight } from '@/services/training/insightTypes';
import type { Insight } from '../services/insightsEngine';

const MAX_INSIGHTS = 5;

export interface UseInsightsResult {
  isLoading: boolean;
  insights: Insight[];
  hasEnoughData: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/** Map InsightEngine insight type to old icon */
const TYPE_TO_ICON: Record<string, string> = {
  strength: '💪',
  weakness: '🎯',
  trend: '📈',
  recommendation: '⚡',
  discovery: '📊',
  milestone: '🎯',
};

/** Map InsightEngine insight type to old category */
const TYPE_TO_CATEGORY: Record<string, Insight['category']> = {
  strength: 'positive',
  weakness: 'concern',
  trend: 'positive',
  recommendation: 'general',
  discovery: 'general',
  milestone: 'milestone',
};

/**
 * Map a new-engine Insight to the legacy Insight format consumed by InsightsPanel.
 */
function mapToLegacyInsight(insight: EngineInsight): Insight {
  const legacy: Insight = {
    id: insight.id,
    category: TYPE_TO_CATEGORY[insight.type] ?? 'general',
    icon: TYPE_TO_ICON[insight.type] ?? '📊',
    title: insight.title,
    message: insight.message,
    priority: insight.priority,
  };

  // Map action — the new engine uses drillType, old panel expects route
  if (insight.action) {
    legacy.action = {
      label: insight.action.label,
      route: '/training',
    };
  }

  return legacy;
}

/**
 * Hook to fetch session data and generate personalized insights.
 * Delegates to the unified InsightEngine (analyzePerformance) which
 * runs 10 analyses on all drill_results and sessions.
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
      const result = await analyzePerformance();
      setHasEnoughData(result.hasEnoughData);

      if (!result.hasEnoughData) {
        setInsights([]);
        return;
      }

      // Map new engine insights to legacy format, capped at MAX_INSIGHTS
      const mapped = result.insights
        .slice(0, MAX_INSIGHTS)
        .map(mapToLegacyInsight);
      setInsights(mapped);
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
