// Coach Engine - Story 6.1 + Data-Driven Coaching Extension
// Pure functional service: takes CoachUserState, returns CoachMessage | null
// No side effects, no Dexie queries, no localStorage reads

import type { CoachMessage, CoachUserState } from '../types';
import { COACH_MESSAGES, getModuleDisplayName } from '../content/coachMessages';
import { COACHING_INSIGHTS } from '../content/coachingInsights';

/**
 * Get the most relevant contextual guidance for the current user state.
 * Pure function — all side effects (data fetching, localStorage) live in the hook.
 *
 * Priority order (lowest number wins):
 * 1-7:   Motivational triggers (existing)
 * 8-17:  Performance coaching (data-driven, specific)
 *
 * Dismissed tips are filtered out unless the triggerId is no longer in dismissedTipIds
 * (i.e., the caller resets dismissals when user state changes).
 */
export function getContextualGuidance(state: CoachUserState): CoachMessage | null {
  const matchingMessages: CoachMessage[] = [];

  // --- Phase 1: Motivational triggers (priority 1-7) ---

  if (evaluateFirstLaunch(state)) {
    matchingMessages.push(findMessage('first-launch')!);
  }

  if (evaluateStreakBroken(state)) {
    matchingMessages.push(findMessage('streak-broken')!);
  }

  if (evaluateLowConsistency(state)) {
    matchingMessages.push(findMessage('low-consistency')!);
  }

  if (evaluateAfter3Sessions(state)) {
    matchingMessages.push(findMessage('after-3-sessions')!);
  }

  if (evaluateHighAccuracy(state)) {
    matchingMessages.push(findMessage('high-accuracy')!);
  }

  if (evaluateAfterAssessment(state)) {
    const msg = findMessage('after-assessment')!;
    // Interpolate [weak area] with actual weakest module
    matchingMessages.push({
      ...msg,
      message: msg.message.replace('[weak area]', getModuleDisplayName(state.weakestModule)),
    });
  }

  if (evaluateBeforeFirstTraining(state)) {
    matchingMessages.push(findMessage('before-first-training')!);
  }

  // --- Phase 2: Performance coaching triggers (priority 8-17) ---

  for (const insight of COACHING_INSIGHTS) {
    if (insight.evaluate(state)) {
      matchingMessages.push(insight.build(state));
    }
  }

  // Filter out dismissed tips
  const undismissed = matchingMessages.filter(
    msg => !state.dismissedTipIds.includes(msg.triggerId)
  );

  if (undismissed.length === 0) return null;

  // Return highest priority (lowest number)
  undismissed.sort((a, b) => a.priority - b.priority);
  return undismissed[0];
}

// --- Trigger Evaluators ---

function evaluateFirstLaunch(state: CoachUserState): boolean {
  return !state.hasAssessment;
}

function evaluateStreakBroken(state: CoachUserState): boolean {
  // Streak is broken when current streak is 0 or 1 AND previous streak was > 1
  return state.previousStreak > 1 && state.currentStreak <= 1;
}

function evaluateLowConsistency(state: CoachUserState): boolean {
  // <2 sessions in last 7 days, but must have an assessment and at least 1 training session
  return state.hasAssessment && state.trainingSessionCount > 0 && state.weeklySessionCount < 2;
}

function evaluateAfter3Sessions(state: CoachUserState): boolean {
  return state.trainingSessionCount >= 3;
}

function evaluateHighAccuracy(state: CoachUserState): boolean {
  return state.recentAccuracy !== null && state.recentAccuracy > 85;
}

function evaluateAfterAssessment(state: CoachUserState): boolean {
  return state.hasAssessment && state.trainingSessionCount === 0;
}

function evaluateBeforeFirstTraining(state: CoachUserState): boolean {
  // Same condition as afterAssessment — shown as lower priority alternative
  return state.hasAssessment && state.trainingSessionCount === 0;
}

// --- Helpers ---

function findMessage(triggerId: string): CoachMessage | undefined {
  return COACH_MESSAGES.find(m => m.triggerId === triggerId);
}
