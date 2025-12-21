/**
 * Magic Minute Persistence Service
 * Story 4.2: Build Magic Minute Timer Component
 * Story 4.3: Extended with micro-challenge result persistence
 *
 * Handles persistence of Magic Minute sessions to Dexie IndexedDB.
 */

import { db } from '@/services/storage/db';
import type { MagicMinuteSession, DrillResult } from '@/services/storage/schemas';
import type { MagicMinuteSummary } from '../types/magicMinute.types';
import type { MicroChallengeResult } from '../types/microChallenge.types';

/**
 * Create a new Magic Minute session record
 *
 * @param sessionId - Parent training session ID
 * @param targetedMistakes - Array of mistake types being targeted
 * @returns The created session ID or null on failure
 */
export async function createMagicMinuteSession(
  sessionId: number,
  targetedMistakes: string[]
): Promise<number | null> {
  try {
    const record: Omit<MagicMinuteSession, 'id'> = {
      sessionId,
      timestamp: new Date().toISOString(),
      targetedMistakes,
      challengesGenerated: 0,
      challengesCompleted: 0,
      successRate: 0,
      duration: 0,
    };

    const id = await db.magic_minute_sessions.add(record);
    return typeof id === 'number' ? id : null;
  } catch (error) {
    console.error('Failed to create Magic Minute session:', error);
    return null;
  }
}

/**
 * Update a Magic Minute session with completion data
 *
 * @param id - Magic Minute session ID
 * @param summary - Summary data from completed Magic Minute
 * @returns true if update successful
 */
export async function updateMagicMinuteSession(
  id: number,
  summary: MagicMinuteSummary
): Promise<boolean> {
  try {
    await db.magic_minute_sessions.update(id, {
      challengesGenerated: summary.totalChallenges,
      challengesCompleted: summary.totalChallenges,
      successRate: summary.successRate,
      duration: summary.duration,
    });
    return true;
  } catch (error) {
    console.error('Failed to update Magic Minute session:', error);
    return false;
  }
}

/**
 * Get Magic Minute sessions for a training session
 *
 * @param sessionId - Parent training session ID
 * @returns Array of Magic Minute sessions
 */
export async function getMagicMinuteSessions(
  sessionId: number
): Promise<MagicMinuteSession[]> {
  try {
    return await db.magic_minute_sessions
      .where('sessionId')
      .equals(sessionId)
      .toArray();
  } catch (error) {
    console.error('Failed to get Magic Minute sessions:', error);
    return [];
  }
}

/**
 * Get most recent Magic Minute session
 *
 * @returns Most recent Magic Minute session or null
 */
export async function getLatestMagicMinuteSession(): Promise<MagicMinuteSession | null> {
  try {
    const sessions = await db.magic_minute_sessions
      .orderBy('timestamp')
      .reverse()
      .limit(1)
      .toArray();
    return sessions[0] || null;
  } catch (error) {
    console.error('Failed to get latest Magic Minute session:', error);
    return null;
  }
}

// ============================================================================
// Story 4.3: Micro-Challenge Result Persistence
// ============================================================================

/**
 * Map MicroChallengeType to DrillResult module
 */
function mapChallengeTypeToModule(
  challengeType: 'number_line' | 'spatial' | 'math'
): DrillResult['module'] {
  switch (challengeType) {
    case 'number_line':
      return 'number_line';
    case 'spatial':
      return 'spatial_rotation';
    case 'math':
      return 'math_operations';
  }
}

/**
 * Persist a single micro-challenge result as a DrillResult
 * Uses 'easy' difficulty to mark as simplified micro-challenge
 *
 * @param sessionId - Parent training session ID
 * @param result - Micro-challenge result to persist
 * @returns true if persistence successful
 */
export async function persistMicroChallengeResult(
  sessionId: number,
  result: MicroChallengeResult
): Promise<boolean> {
  try {
    const drillResult: Omit<DrillResult, 'id'> = {
      sessionId,
      timestamp: new Date().toISOString(),
      module: mapChallengeTypeToModule(result.challengeType),
      difficulty: 'easy', // Micro-challenges are simplified
      isCorrect: result.correct,
      timeToAnswer: result.timeToAnswer,
      accuracy: result.correct ? 100 : 0,
    };

    await db.drill_results.add(drillResult);
    return true;
  } catch (error) {
    console.error('Failed to persist micro-challenge result:', error);
    return false;
  }
}

/**
 * Persist all micro-challenge results from a Magic Minute session
 *
 * @param sessionId - Parent training session ID
 * @param results - Array of micro-challenge results
 * @returns Number of successfully persisted results
 */
export async function persistAllMicroChallengeResults(
  sessionId: number,
  results: MicroChallengeResult[]
): Promise<number> {
  let successCount = 0;

  for (const result of results) {
    const success = await persistMicroChallengeResult(sessionId, result);
    if (success) {
      successCount++;
    }
  }

  return successCount;
}

/**
 * Complete Magic Minute session with full persistence
 * Creates/updates session record and persists all challenge results
 *
 * @param sessionId - Parent training session ID
 * @param summary - Summary data from completed Magic Minute
 * @param results - Array of individual challenge results
 * @returns Magic Minute session ID or null on failure
 */
export async function completeMagicMinuteWithResults(
  sessionId: number,
  summary: MagicMinuteSummary,
  results: MicroChallengeResult[]
): Promise<number | null> {
  try {
    // Create session record
    const magicMinuteId = await createMagicMinuteSession(
      sessionId,
      summary.targetedMistakes
    );

    if (!magicMinuteId) {
      console.error('Failed to create Magic Minute session record');
      return null;
    }

    // Update with completion data
    await updateMagicMinuteSession(magicMinuteId, summary);

    // Persist individual challenge results
    const persistedCount = await persistAllMicroChallengeResults(sessionId, results);

    if (persistedCount < results.length) {
      console.warn(
        `Only ${persistedCount}/${results.length} challenge results persisted`
      );
    }

    return magicMinuteId;
  } catch (error) {
    console.error('Failed to complete Magic Minute with results:', error);
    return null;
  }
}
