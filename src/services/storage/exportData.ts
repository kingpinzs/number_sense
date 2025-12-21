// Data Export Utility - Story 3.7
// Architecture: Export session data for debugging and user data portability
// Bundles session + all drill results + telemetry logs into single JSON object

import { db } from './db';
import type { Session, DrillResult, TelemetryLog } from './schemas';

/**
 * Exported session data structure
 * Contains complete session with all related drill results and telemetry logs
 */
export interface ExportedSessionData {
  session: Session;
  drillResults: DrillResult[];
  telemetryLogs: TelemetryLog[];
  exportedAt: string;
}

/**
 * Export all data for a specific session
 * Joins session record with related drill_results and telemetry_logs
 *
 * @param sessionId - Database ID of the session to export
 * @returns Complete session data bundle or null if session not found
 */
export async function exportSessionData(
  sessionId: number
): Promise<ExportedSessionData | null> {
  try {
    // Get the session record
    const session = await db.sessions.get(sessionId);

    if (!session) {
      console.warn(`Session ${sessionId} not found for export`);
      return null;
    }

    // Get all drill results for this session
    const drillResults = await db.drill_results
      .where('sessionId')
      .equals(sessionId)
      .toArray();

    // Get telemetry logs within the session timeframe
    // Filter by timestamp range from session start to session end (if available)
    const sessionStart = session.timestamp;
    let telemetryLogs: TelemetryLog[] = [];

    if (sessionStart) {
      // Get all telemetry logs after session start
      // Filter to training-related events only
      telemetryLogs = await db.telemetry_logs
        .where('timestamp')
        .aboveOrEqual(sessionStart)
        .filter(log =>
          log.module === 'training' ||
          log.module === 'number_line' ||
          log.module === 'spatial_rotation' ||
          log.module === 'math_operations'
        )
        .toArray();

      // If session has duration, filter to only logs within session timeframe
      if (session.duration && session.duration > 0) {
        const sessionEndTime = new Date(sessionStart).getTime() + session.duration;
        telemetryLogs = telemetryLogs.filter(log => {
          const logTime = new Date(log.timestamp).getTime();
          return logTime <= sessionEndTime;
        });
      }
    }

    return {
      session,
      drillResults,
      telemetryLogs,
      exportedAt: new Date().toISOString()
    };
  } catch (error) {
    console.error(`Failed to export session ${sessionId}:`, error);
    throw new Error(`Failed to export session data: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Export all sessions within a date range
 * Useful for bulk export of training history
 *
 * @param startDate - Start of date range (ISO 8601 string)
 * @param endDate - End of date range (ISO 8601 string)
 * @returns Array of exported session data
 */
export async function exportSessionsInRange(
  startDate: string,
  endDate: string
): Promise<ExportedSessionData[]> {
  try {
    // Get all sessions in date range
    const sessions = await db.sessions
      .where('timestamp')
      .between(startDate, endDate, true, true)
      .toArray();

    // Export each session with its related data
    const exports: ExportedSessionData[] = [];

    for (const session of sessions) {
      if (session.id) {
        const exportedData = await exportSessionData(session.id);
        if (exportedData) {
          exports.push(exportedData);
        }
      }
    }

    return exports;
  } catch (error) {
    console.error('Failed to export sessions in range:', error);
    throw new Error(`Failed to export sessions: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Export all training data for the user
 * Includes all sessions, drill results, and telemetry logs
 *
 * @returns Complete data export as JSON-serializable object
 */
export async function exportAllTrainingData(): Promise<{
  sessions: Session[];
  drillResults: DrillResult[];
  telemetryLogs: TelemetryLog[];
  exportedAt: string;
}> {
  try {
    const [sessions, drillResults, telemetryLogs] = await Promise.all([
      db.sessions.toArray(),
      db.drill_results.toArray(),
      db.telemetry_logs.toArray()
    ]);

    return {
      sessions,
      drillResults,
      telemetryLogs,
      exportedAt: new Date().toISOString()
    };
  } catch (error) {
    console.error('Failed to export all training data:', error);
    throw new Error(`Failed to export all data: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Generate a downloadable JSON file from exported data
 * Creates a Blob URL for file download
 *
 * @param data - Any JSON-serializable data
 * @param filename - Suggested filename for download
 * @returns Blob URL for download
 */
export function createDownloadUrl(data: unknown, _filename: string): string {
  const jsonString = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  return URL.createObjectURL(blob);
}

/**
 * Trigger download of exported data
 *
 * @param data - Data to export
 * @param filename - Filename for the download
 */
export function downloadExportedData(data: unknown, filename: string): void {
  const url = createDownloadUrl(data, filename);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
