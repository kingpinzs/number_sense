// useCoachGuidance Hook - Story 6.1 + Data-Driven Coaching Extension
// Fetches user state from Dexie + localStorage, passes to coachEngine
// Extended: queries per-module performance, error patterns, spacing, confidence

import { useState, useEffect, useCallback } from 'react';
import { db } from '@/services/storage/db';
import { getCurrentStreak } from '@/services/training/streakManager';
import {
  calculateWeeklyConsistency,
  calculateSpacingQuality,
  detectTrend,
} from '@/features/progress/services/insightsEngine';
import { categorizeMistake } from '@/services/adaptiveDifficulty/mistakeAnalyzer';
import {
  getDismissedCoachTips,
  addDismissedCoachTip,
  setDismissedCoachTips,
  getPreviousStreak,
  setPreviousStreak,
  getShownRealWorldTips,
  addShownRealWorldTip,
} from '@/services/storage/localStorage';
import { getContextualGuidance } from '../services/coachEngine';
import type { CoachMessage, ModulePerformance, ErrorPattern } from '../types';

export interface UseCoachGuidanceResult {
  guidance: CoachMessage | null;
  isLoading: boolean;
  dismiss: (tipId: string) => void;
}

const MODULES = ['number_line', 'spatial_rotation', 'math_operations'] as const;
const RECENT_DRILL_COUNT = 10;

/**
 * Hook to compute contextual coach guidance based on user state.
 * Queries Dexie for session data, reads streak/localStorage, and
 * passes assembled state to the pure coachEngine.
 */
export function useCoachGuidance(): UseCoachGuidanceResult {
  const [guidance, setGuidance] = useState<CoachMessage | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchGuidance = useCallback(async () => {
    setIsLoading(true);

    try {
      // Check assessment status
      const assessmentCount = await db.assessments
        .where('status')
        .equals('completed')
        .count();
      const hasAssessment = assessmentCount > 0;

      // Get training sessions
      const trainingSessions = await db.sessions
        .where('module')
        .equals('training')
        .toArray();
      const completedSessions = trainingSessions.filter(
        s => s.completionStatus === 'completed'
      );
      const trainingSessionCount = completedSessions.length;

      // Calculate weekly consistency
      const weeklySessionCount = calculateWeeklyConsistency(completedSessions);

      // Get streak info
      const currentStreak = getCurrentStreak();
      const storedPrevious = getPreviousStreak();

      // Determine previous streak for break detection:
      // Only update stored value when streak grows past 1 (preserves high-water mark)
      const previousStreak = storedPrevious;
      if (currentStreak > 1 && currentStreak !== storedPrevious) {
        setPreviousStreak(currentStreak);
      }

      // Get ALL recent drill results for enriched analysis
      const allDrillResults = await db.drill_results
        .orderBy('timestamp')
        .toArray();

      // Compute recent accuracy from last 3 sessions' drill results
      let recentAccuracy: number | null = null;
      if (trainingSessionCount > 0) {
        const recentSessionIds = completedSessions
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
          .slice(0, 3)
          .map(s => s.id)
          .filter((id): id is number => id !== undefined);

        if (recentSessionIds.length > 0) {
          const recentDrills = allDrillResults.filter(
            d => recentSessionIds.includes(d.sessionId)
          );

          if (recentDrills.length > 0) {
            recentAccuracy = recentDrills.reduce((sum, d) => sum + d.accuracy, 0) / recentDrills.length;
          }
        }
      }

      // Determine weakest module from assessments
      let weakestModule: string | null = null;
      if (hasAssessment) {
        const latestAssessment = await db.assessments
          .where('status')
          .equals('completed')
          .last();
        if (latestAssessment && latestAssessment.weaknesses.length > 0) {
          weakestModule = latestAssessment.weaknesses[0];
        }
      }

      // --- Enriched data: per-module performance ---
      let modulePerformance: Record<string, ModulePerformance> | null = null;
      if (allDrillResults.length > 0) {
        modulePerformance = {};
        for (const mod of MODULES) {
          const moduleDrills = allDrillResults
            .filter(dr => dr.module === mod)
            .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

          const drillCount = moduleDrills.length;
          if (drillCount === 0) continue;

          const recent = moduleDrills.slice(-RECENT_DRILL_COUNT);
          const modAccuracy = recent.reduce((s, d) => s + d.accuracy, 0) / recent.length;
          const accuracyValues = recent.map(d => d.accuracy);
          const trend = drillCount >= 3 ? detectTrend(accuracyValues) : null;

          const timeDrills = recent.filter(d => d.timeToAnswer > 0);
          const avgResponseTime = timeDrills.length > 0
            ? timeDrills.reduce((s, d) => s + d.timeToAnswer, 0) / timeDrills.length
            : null;

          modulePerformance[mod] = {
            recentAccuracy: modAccuracy,
            drillCount,
            trend,
            avgResponseTime,
          };
        }
      }

      // --- Enriched data: error patterns ---
      const errorPatterns: ErrorPattern[] = [];
      if (allDrillResults.length > 0) {
        for (const mod of MODULES) {
          const recentModDrills = allDrillResults
            .filter(dr => dr.module === mod)
            .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
            .slice(-RECENT_DRILL_COUNT);

          const incorrect = recentModDrills.filter(d => !d.isCorrect);
          if (incorrect.length === 0 || recentModDrills.length < 3) continue;

          // Categorize mistakes and count types
          const typeCounts = new Map<string, number>();
          for (const drill of incorrect) {
            try {
              const { type } = categorizeMistake(drill);
              typeCounts.set(type, (typeCounts.get(type) ?? 0) + 1);
            } catch {
              // Skip drills with unknown module
            }
          }

          for (const [mistakeType, count] of typeCounts) {
            const frequency = count / recentModDrills.length;
            if (frequency >= 0.2) {
              errorPatterns.push({ module: mod, mistakeType, frequency });
            }
          }
        }
        // Sort by frequency descending
        errorPatterns.sort((a, b) => b.frequency - a.frequency);
      }

      // --- Enriched data: spacing quality ---
      const spacing = calculateSpacingQuality(completedSessions);
      const spacingQuality = spacing.recommendation === 'no-data' ? null : spacing.recommendation;

      // --- Enriched data: confidence after latest session ---
      let confidenceAfter: number | null = null;
      if (completedSessions.length > 0) {
        const latest = completedSessions
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
        if (latest.confidenceAfter !== undefined) {
          confidenceAfter = latest.confidenceAfter;
        }
      }

      // Read shown real-world tips
      const shownRealWorldTipIds = getShownRealWorldTips();

      // Read dismissed tips and prune resolved ones
      let dismissedTipIds = getDismissedCoachTips();
      const prunedIds = pruneResolvedDismissals(dismissedTipIds, {
        currentStreak,
        weeklySessionCount,
        recentAccuracy,
      });
      if (prunedIds.length !== dismissedTipIds.length) {
        setDismissedCoachTips(prunedIds);
        dismissedTipIds = prunedIds;
      }

      // Get guidance from pure engine
      const result = getContextualGuidance({
        hasAssessment,
        trainingSessionCount,
        currentStreak,
        previousStreak,
        weeklySessionCount,
        recentAccuracy,
        weakestModule,
        dismissedTipIds,
        modulePerformance,
        errorPatterns,
        spacingQuality,
        confidenceAfter,
        shownRealWorldTipIds,
      });

      // If a real-world tip was selected, track it as shown
      if (result && result.triggerId === 'real-world-tip' && result.id.startsWith('coaching-rwt-')) {
        const tipId = result.id.replace('coaching-rwt-', '');
        addShownRealWorldTip(tipId);
      }

      setGuidance(result);
    } catch (error) {
      console.error('Failed to compute coach guidance:', error);
      setGuidance(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGuidance();
  }, [fetchGuidance]);

  const dismiss = useCallback((tipId: string) => {
    addDismissedCoachTip(tipId);
    fetchGuidance();
  }, [fetchGuidance]);

  return { guidance, isLoading, dismiss };
}

/**
 * Prune dismissed tips whose resolution condition has been met.
 * Re-enables recurring tips when user state changes meaningfully.
 * One-time tips (first-launch, after-assessment, etc.) stay permanently dismissed.
 */
function pruneResolvedDismissals(
  dismissedTipIds: string[],
  state: { currentStreak: number; weeklySessionCount: number; recentAccuracy: number | null }
): string[] {
  return dismissedTipIds.filter(tipId => {
    switch (tipId) {
      case 'streak-broken':
        return state.currentStreak <= 1; // Keep dismissed while streak still broken
      case 'low-consistency':
        return state.weeklySessionCount < 2; // Keep dismissed while still inconsistent
      case 'high-accuracy':
        return state.recentAccuracy !== null && state.recentAccuracy > 85; // Keep dismissed while still high
      default:
        return true; // One-time tips stay dismissed
    }
  });
}
