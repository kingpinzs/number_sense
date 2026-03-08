// Action Selector - Story 6.2
// Pure functional service: takes QuickActionUserState, returns QuickAction[]
// No side effects, no Dexie queries, no localStorage reads

import type { QuickAction, QuickActionUserState } from '../types';
import { ACTION_DEFINITIONS } from '../content/actionDefinitions';

const MAX_ACTIONS = 4;
const MIN_ACTIONS = 2;

/**
 * Select and prioritize quick actions based on user state.
 * Pure function — all side effects (data fetching) live in the hook.
 *
 * Priority algorithm:
 * 1. No session today + streak active → "Start Training" (prevent streak break)
 * 2. No assessment → "Take Assessment" (onboarding)
 * 3. New insights available → "Review Insights" (discovery)
 * 4. Default: "Start Training" + "View Progress"
 *
 * Additional conditional actions:
 * - "View Progress": shown when 3+ sessions completed
 * - "Try Cognition Games": shown when 5+ training sessions
 *
 * Always returns 2-4 actions, never empty, never more than 4.
 */
export function selectQuickActions(state: QuickActionUserState): QuickAction[] {
  const selected: QuickAction[] = [];

  const findAction = (id: string): QuickAction | undefined =>
    ACTION_DEFINITIONS.find(a => a.id === id);

  // Priority 1: No session today + streak active → Start Training (urgent)
  if (!state.hasSessionToday && state.streakActive) {
    selected.push({ ...findAction('start_training')!, subtitle: 'Continue your streak!' });
  }

  // Priority 2: No assessment → Take Assessment (onboarding)
  if (!state.hasAssessment) {
    selected.push({ ...findAction('take_assessment')! });
  }

  // Priority 3: New insights → Review Insights
  if (state.newInsightsCount > 0) {
    selected.push({ ...findAction('review_insights')!, badge: state.newInsightsCount });
  }

  // Conditional: View Progress if 3+ sessions
  if (state.trainingSessionCount >= 3) {
    const alreadyHasProgress = selected.some(a => a.id === 'view_progress');
    if (!alreadyHasProgress) {
      selected.push({ ...findAction('view_progress')! });
    }
  }

  // Conditional: Try Cognition Games if 5+ training sessions
  if (state.trainingSessionCount >= 5) {
    selected.push({ ...findAction('try_cognition')! });
  }

  // Default: Start Training (if not already added via streak-urgency)
  if (!selected.some(a => a.id === 'start_training') && state.hasAssessment) {
    selected.push({ ...findAction('start_training')!, subtitle: 'Jump into a session' });
  }

  // Ensure minimum 2 actions with defaults
  if (selected.length < MIN_ACTIONS) {
    // Add Start Training if missing
    if (!selected.some(a => a.id === 'start_training')) {
      selected.push({ ...findAction('start_training')!, subtitle: 'Jump into a session' });
    }
    // Add View Progress if still below minimum
    if (selected.length < MIN_ACTIONS && !selected.some(a => a.id === 'view_progress')) {
      selected.push({ ...findAction('view_progress')! });
    }
  }

  // Cap at MAX_ACTIONS, sorted by priority
  selected.sort((a, b) => a.priority - b.priority);
  return selected.slice(0, MAX_ACTIONS);
}
