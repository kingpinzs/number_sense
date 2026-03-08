// useQuickActions Hook - Story 6.2
// Fetches user state from Dexie + localStorage, passes to actionSelector
// Handles telemetry logging and navigation on action click

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { startOfDay, parseISO } from 'date-fns';
import { db } from '@/services/storage/db';
import { getCurrentStreak } from '@/services/training/streakManager';
import { getLastSessionDate } from '@/services/storage/localStorage';
import { selectQuickActions } from '../services/actionSelector';
import type { QuickAction } from '../types';

export interface UseQuickActionsResult {
  actions: QuickAction[];
  isLoading: boolean;
  handleActionClick: (action: QuickAction) => void;
}

/**
 * Hook to compute and manage quick actions for the home screen.
 * Queries Dexie for session/assessment data, reads streak from localStorage,
 * and passes assembled state to the pure actionSelector.
 */
export function useQuickActions(): UseQuickActionsResult {
  const navigate = useNavigate();
  const [actions, setActions] = useState<QuickAction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchActions = useCallback(async () => {
    setIsLoading(true);
    try {
      // Check assessment status
      const assessmentCount = await db.assessments
        .where('status')
        .equals('completed')
        .count();
      const hasAssessment = assessmentCount > 0;

      // Get completed training session count (filtered in Dexie, not in memory)
      const trainingSessionCount = await db.sessions
        .where('module')
        .equals('training')
        .filter(s => s.completionStatus === 'completed')
        .count();

      // Check if user has a session today
      const lastSessionDateStr = getLastSessionDate();
      let hasSessionToday = false;
      if (lastSessionDateStr) {
        const lastSessionDay = startOfDay(parseISO(lastSessionDateStr));
        const today = startOfDay(new Date());
        hasSessionToday = lastSessionDay.getTime() === today.getTime();
      }

      // Check streak
      const currentStreak = getCurrentStreak();
      const streakActive = currentStreak > 0;

      // For now, newInsightsCount is 0 — this will be wired up
      // when insights tracking is implemented
      const newInsightsCount = 0;

      const selected = selectQuickActions({
        hasAssessment,
        hasSessionToday,
        streakActive,
        trainingSessionCount,
        newInsightsCount,
      });

      setActions(selected);
    } catch (error) {
      console.error('Failed to compute quick actions:', error);
      // Fallback: show defaults
      setActions(selectQuickActions({
        hasAssessment: false,
        hasSessionToday: false,
        streakActive: false,
        trainingSessionCount: 0,
        newInsightsCount: 0,
      }));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchActions();
  }, [fetchActions]);

  const handleActionClick = useCallback((action: QuickAction) => {
    // Log telemetry (fire-and-forget)
    db.telemetry_logs.add({
      timestamp: new Date().toISOString(),
      event: 'quick_action_clicked',
      module: 'coach',
      data: { action: action.id, source: 'home' },
      userId: 'local_user',
    }).catch(err => console.error('Failed to log telemetry:', err));

    navigate(action.route);
  }, [navigate]);

  return { actions, isLoading, handleActionClick };
}
