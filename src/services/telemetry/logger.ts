// Telemetry Logger Service - Story 3.7
// Architecture: Structured event logging for session lifecycle telemetry
// Persists telemetry to Dexie telemetry_logs table with localStorage fallback

import { db } from '@/services/storage/db';
import { STORAGE_KEYS } from '@/services/storage/localStorage';
import { toast } from 'sonner';

/**
 * Telemetry event types for session lifecycle tracking
 */
export type TelemetryEvent =
  | 'session_start'
  | 'drill_complete'
  | 'session_end'
  | 'session_pause'
  | 'session_resume';

/**
 * Data payload for session_start event
 */
export interface SessionStartData {
  sessionType: 'quick' | 'full';
  drillCount: number;
}

/**
 * Data payload for drill_complete event
 */
export interface DrillCompleteData {
  accuracy: number;
  difficulty: string;
  isCorrect: boolean;
  timeToAnswer: number;
}

/**
 * Data payload for session_end event
 */
export interface SessionEndData {
  accuracy: number;
  duration: number;
  confidenceChange: number | null;
  drillCount: number;
}

/**
 * Data payload for session_pause event
 */
export interface SessionPauseData {
  currentDrillIndex: number;
}

/**
 * Generic telemetry entry for localStorage backup
 */
interface TelemetryBackupEntry {
  timestamp: string;
  event: TelemetryEvent;
  module: string;
  data: Record<string, any>;
  userId: string;
}

/**
 * Write telemetry entry to Dexie with localStorage fallback
 * All telemetry entries include userId: 'local_user' for privacy
 *
 * @param event - Telemetry event type
 * @param module - Module name ('training' or specific drill type)
 * @param data - Event-specific data payload
 */
async function writeTelemetry(
  event: TelemetryEvent,
  module: string,
  data: Record<string, any>
): Promise<void> {
  const entry = {
    timestamp: new Date().toISOString(),
    event,
    module,
    data,
    userId: 'local_user'
  };

  try {
    await db.telemetry_logs.add(entry);
  } catch (error) {
    console.error(`Telemetry write failed for ${event}:`, error);

    // Fallback to localStorage
    try {
      const backupKey = STORAGE_KEYS.TELEMETRY_BACKUP;
      const existing = localStorage.getItem(backupKey);
      let backupEntries: TelemetryBackupEntry[] = [];
      try {
        backupEntries = existing ? JSON.parse(existing) : [];
      } catch {
        // Corrupted backup — start fresh
      }
      backupEntries.push(entry);
      localStorage.setItem(backupKey, JSON.stringify(backupEntries));
    } catch (backupError) {
      console.error('Telemetry localStorage backup failed:', backupError);
    }

    // Show user-friendly toast notification
    toast.error('Session data not saved', {
      description: 'Your progress may not be recorded. Please check your browser storage settings.'
    });
  }
}

/**
 * Log session start event
 * Called when user starts a training session
 *
 * @param sessionId - Unique session identifier
 * @param sessionType - 'quick' or 'full' session
 * @param drillCount - Number of drills in the session
 */
export async function logSessionStart(
  sessionId: string | number,
  sessionType: 'quick' | 'full',
  drillCount: number
): Promise<void> {
  await writeTelemetry('session_start', 'training', {
    sessionId,
    sessionType,
    drillCount
  });
}

/**
 * Log drill completion event
 * Called after each drill is completed
 *
 * @param module - Drill type ('number_line', 'spatial_rotation', 'math_operations')
 * @param data - Drill performance metrics
 */
export async function logDrillComplete(
  module: string,
  data: DrillCompleteData
): Promise<void> {
  await writeTelemetry('drill_complete', module, data);
}

/**
 * Log session end event
 * Called when training session is completed
 *
 * @param data - Session summary metrics
 */
export async function logSessionEnd(data: SessionEndData): Promise<void> {
  await writeTelemetry('session_end', 'training', data);
}

/**
 * Log session pause event
 * Called when user pauses the session
 *
 * @param currentDrillIndex - Index of drill when paused
 */
export async function logSessionPause(currentDrillIndex: number): Promise<void> {
  await writeTelemetry('session_pause', 'training', { currentDrillIndex });
}

/**
 * Log session resume event
 * Called when user resumes a paused session
 */
export async function logSessionResume(): Promise<void> {
  await writeTelemetry('session_resume', 'training', {});
}

/**
 * Restore telemetry entries from localStorage backup to Dexie
 * Should be called on app initialization to recover any failed writes
 *
 * @returns Number of entries restored
 */
export async function restoreTelemetryBackup(): Promise<number> {
  const backupKey = STORAGE_KEYS.TELEMETRY_BACKUP;
  const existing = localStorage.getItem(backupKey);

  if (!existing) {
    return 0;
  }

  try {
    let backupEntries: TelemetryBackupEntry[];
    try {
      backupEntries = JSON.parse(existing);
    } catch {
      // Corrupted backup — clear it
      localStorage.removeItem(backupKey);
      return 0;
    }

    if (!Array.isArray(backupEntries) || backupEntries.length === 0) {
      localStorage.removeItem(backupKey);
      return 0;
    }

    // Deduplicate by checking existing timestamps in Dexie
    const timestamps = backupEntries.map(e => e.timestamp);
    const existingEntries = await db.telemetry_logs
      .where('timestamp')
      .anyOf(timestamps)
      .toArray();
    const existingTimestamps = new Set(existingEntries.map(e => e.timestamp));
    const newEntries = backupEntries.filter(e => !existingTimestamps.has(e.timestamp));

    if (newEntries.length > 0) {
      await db.telemetry_logs.bulkAdd(newEntries);
    }

    // Clear backup after successful restore
    localStorage.removeItem(backupKey);

    return newEntries.length;
  } catch (error) {
    console.error('Failed to restore telemetry backup:', error);
    return 0;
  }
}
