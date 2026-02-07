// Dexie database configuration for Discalculas
// Architecture: Local-first IndexedDB persistence layer
// Story 3.7: Added database maintenance utilities

import Dexie, { type Table } from 'dexie';
import { subDays } from 'date-fns';
import type {
  Session,
  Assessment,
  DrillResult,
  TelemetryLog,
  MagicMinuteSession,
  DifficultyHistory,
  Experiment,
  ExperimentObservation
} from './schemas';

/**
 * DiscalculasDB - Main database class for local data persistence
 *
 * Schema v1 includes 8 tables:
 * - sessions: User training/assessment sessions
 * - assessments: Diagnostic assessment results
 * - drill_results: Individual drill performance
 * - telemetry_logs: Structured event logs
 * - magic_minute_sessions: 60-second sprint sessions
 * - difficulty_history: Adaptive difficulty tracking
 * - experiments: A/B test definitions
 * - experiment_observations: Experiment metrics
 */
export class DiscalculasDB extends Dexie {
  // Table declarations with TypeScript types
  sessions!: Table<Session, number>;
  assessments!: Table<Assessment, number>;
  drill_results!: Table<DrillResult, number>;
  telemetry_logs!: Table<TelemetryLog, number>;
  magic_minute_sessions!: Table<MagicMinuteSession, number>;
  difficulty_history!: Table<DifficultyHistory, number>;
  experiments!: Table<Experiment, number>;
  experiment_observations!: Table<ExperimentObservation, number>;

  constructor() {
    super('DiscalculasDB');

    // Schema v2: Added [sessionId+module] compound index for drill_results (Story 4.4)
    // Note: Dexie handles index migrations automatically
    this.version(2).stores({
      // ++id: auto-increment primary key
      // field: indexed field
      // [field1+field2]: compound index
      sessions: '++id, timestamp, module, [timestamp+module]',
      assessments: '++id, timestamp, status',
      drill_results: '++id, sessionId, timestamp, module, [sessionId+module]',
      telemetry_logs: '++id, timestamp, event, [timestamp+event]',
      magic_minute_sessions: '++id, sessionId, timestamp',
      difficulty_history: '++id, sessionId, timestamp, module',
      experiments: '++id, status',
      experiment_observations: '++id, experimentId, variantId, timestamp'
    });
  }
}

// Export singleton instance
export const db = new DiscalculasDB();

/**
 * Database health check utility
 * Tests write and read operations to verify IndexedDB is accessible
 *
 * @returns {Promise<boolean>} true if database is operational
 */
export async function ensureDBHealth(): Promise<boolean> {
  try {
    // Test write
    const testId = await db.telemetry_logs.add({
      timestamp: new Date().toISOString(),
      event: 'health_check',
      module: 'system',
      data: { timestamp: Date.now() },
      userId: 'local_user'
    });

    // Test read
    const record = await db.telemetry_logs.get(testId);

    // Cleanup test record
    await db.telemetry_logs.delete(testId);

    return record !== undefined;
  } catch (error) {
    console.error('DB health check failed:', error);
    return false;
  }
}

/**
 * Query performance monitoring wrapper
 * Logs warning if query exceeds 100ms threshold
 *
 * @param queryFn - Async query function to execute
 * @param queryName - Descriptive name for logging
 * @returns Query result
 */
export async function queryWithTiming<T>(
  queryFn: () => Promise<T>,
  queryName: string
): Promise<T> {
  const start = performance.now();
  const result = await queryFn();
  const duration = performance.now() - start;

  if (duration > 100) {
    console.warn(`Slow query: ${queryName} took ${duration.toFixed(2)}ms`);
  }

  return result;
}

/**
 * Clean old sessions from the database - Story 3.7
 * Auto-delete sessions older than retention period to keep database size manageable
 * Also cleans associated drill_results and telemetry_logs for deleted sessions
 *
 * @param retentionDays - Number of days to retain sessions (default: 365)
 * @returns Number of sessions deleted
 */
export async function cleanOldSessions(retentionDays: number = 365): Promise<number> {
  try {
    // Calculate cutoff date
    const cutoffDate = subDays(new Date(), retentionDays).toISOString();

    // Find sessions older than cutoff date
    const oldSessions = await db.sessions
      .where('timestamp')
      .below(cutoffDate)
      .toArray();

    if (oldSessions.length === 0) {
      return 0;
    }

    // Get IDs of sessions to delete
    const sessionIds = oldSessions
      .map(s => s.id)
      .filter((id): id is number => id !== undefined);

    // Use transaction for atomic cleanup across all related tables
    await db.transaction('rw', [db.sessions, db.drill_results, db.telemetry_logs], async () => {
      // Delete associated drill results
      for (const sessionId of sessionIds) {
        await db.drill_results.where('sessionId').equals(sessionId).delete();
      }

      // Delete associated telemetry logs (by timestamp range)
      await db.telemetry_logs.where('timestamp').below(cutoffDate).delete();

      // Delete the sessions themselves
      await db.sessions.where('timestamp').below(cutoffDate).delete();
    });

    return oldSessions.length;
  } catch (error) {
    console.error('Failed to clean old sessions:', error);
    return 0;
  }
}

/**
 * Get database storage statistics
 * Useful for monitoring database size and record counts
 *
 * @returns Object with table counts and estimated size
 */
export async function getDatabaseStats(): Promise<{
  sessions: number;
  drillResults: number;
  telemetryLogs: number;
  assessments: number;
}> {
  const [sessions, drillResults, telemetryLogs, assessments] = await Promise.all([
    db.sessions.count(),
    db.drill_results.count(),
    db.telemetry_logs.count(),
    db.assessments.count()
  ]);

  return {
    sessions,
    drillResults,
    telemetryLogs,
    assessments
  };
}
