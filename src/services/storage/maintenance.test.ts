// Database Maintenance Tests - Story 3.7
// Tests for cleanOldSessions() and getDatabaseStats() functions

import { describe, it, expect, beforeEach } from 'vitest';
import 'fake-indexeddb/auto';
import { subDays } from 'date-fns';
import { db, cleanOldSessions, getDatabaseStats } from './db';

describe('Database Maintenance', () => {
  beforeEach(async () => {
    // Clear all tables before each test
    await db.sessions.clear();
    await db.drill_results.clear();
    await db.telemetry_logs.clear();
    await db.assessments.clear();
  });

  describe('cleanOldSessions', () => {
    it('should delete sessions older than 365 days by default', async () => {
      const now = new Date();

      // Create sessions with different ages
      await db.sessions.bulkAdd([
        {
          timestamp: subDays(now, 366).toISOString(), // 366 days ago - should be deleted
          module: 'training',
          duration: 60000,
          completionStatus: 'completed'
        },
        {
          timestamp: subDays(now, 364).toISOString(), // 364 days ago - should be kept
          module: 'training',
          duration: 60000,
          completionStatus: 'completed'
        },
        {
          timestamp: now.toISOString(), // Today - should be kept
          module: 'training',
          duration: 60000,
          completionStatus: 'completed'
        }
      ]);

      const deletedCount = await cleanOldSessions();

      expect(deletedCount).toBe(1);

      const remainingSessions = await db.sessions.count();
      expect(remainingSessions).toBe(2);
    });

    it('should use custom retention days when provided', async () => {
      const now = new Date();

      // Create sessions
      await db.sessions.bulkAdd([
        {
          timestamp: subDays(now, 31).toISOString(), // 31 days ago
          module: 'training',
          duration: 60000,
          completionStatus: 'completed'
        },
        {
          timestamp: subDays(now, 29).toISOString(), // 29 days ago
          module: 'training',
          duration: 60000,
          completionStatus: 'completed'
        }
      ]);

      // Clean with 30 day retention
      const deletedCount = await cleanOldSessions(30);

      expect(deletedCount).toBe(1);
    });

    it('should return 0 when no sessions exist', async () => {
      const deletedCount = await cleanOldSessions();
      expect(deletedCount).toBe(0);
    });

    it('should return 0 when all sessions are recent', async () => {
      const now = new Date();

      await db.sessions.bulkAdd([
        {
          timestamp: now.toISOString(),
          module: 'training',
          duration: 60000,
          completionStatus: 'completed'
        },
        {
          timestamp: subDays(now, 100).toISOString(),
          module: 'training',
          duration: 60000,
          completionStatus: 'completed'
        }
      ]);

      const deletedCount = await cleanOldSessions();

      expect(deletedCount).toBe(0);
    });

    it('should delete associated drill_results for deleted sessions', async () => {
      const now = new Date();

      // Create an old session
      const oldSessionId = await db.sessions.add({
        timestamp: subDays(now, 400).toISOString(), // 400 days ago
        module: 'training',
        duration: 60000,
        completionStatus: 'completed'
      });

      // Create a recent session
      const newSessionId = await db.sessions.add({
        timestamp: now.toISOString(),
        module: 'training',
        duration: 60000,
        completionStatus: 'completed'
      });

      // Add drill results for both sessions
      await db.drill_results.bulkAdd([
        {
          sessionId: oldSessionId,
          timestamp: subDays(now, 400).toISOString(),
          module: 'number_line',
          difficulty: 'easy',
          isCorrect: true,
          timeToAnswer: 2000,
          accuracy: 100
        },
        {
          sessionId: oldSessionId,
          timestamp: subDays(now, 400).toISOString(),
          module: 'spatial_rotation',
          difficulty: 'easy',
          isCorrect: true,
          timeToAnswer: 2500,
          accuracy: 100
        },
        {
          sessionId: newSessionId,
          timestamp: now.toISOString(),
          module: 'math_operations',
          difficulty: 'medium',
          isCorrect: false,
          timeToAnswer: 3000,
          accuracy: 0
        }
      ]);

      await cleanOldSessions();

      // Verify old session's drill results are deleted
      const oldDrillResults = await db.drill_results.where('sessionId').equals(oldSessionId).count();
      expect(oldDrillResults).toBe(0);

      // Verify new session's drill results are kept
      const newDrillResults = await db.drill_results.where('sessionId').equals(newSessionId).count();
      expect(newDrillResults).toBe(1);
    });

    it('should delete old telemetry logs', async () => {
      const now = new Date();

      await db.telemetry_logs.bulkAdd([
        {
          timestamp: subDays(now, 400).toISOString(), // 400 days ago - should be deleted
          event: 'session_start',
          module: 'training',
          data: {},
          userId: 'local_user'
        },
        {
          timestamp: now.toISOString(), // Today - should be kept
          event: 'session_start',
          module: 'training',
          data: {},
          userId: 'local_user'
        }
      ]);

      // Create corresponding sessions to trigger cleanup
      await db.sessions.add({
        timestamp: subDays(now, 400).toISOString(),
        module: 'training',
        duration: 60000,
        completionStatus: 'completed'
      });

      await cleanOldSessions();

      const remainingLogs = await db.telemetry_logs.count();
      expect(remainingLogs).toBe(1);
    });

    it('should return correct count of deleted sessions', async () => {
      const now = new Date();

      // Create 5 old sessions
      const oldSessions = Array.from({ length: 5 }, (_, i) => ({
        timestamp: subDays(now, 400 + i).toISOString(),
        module: 'training',
        duration: 60000,
        completionStatus: 'completed' as const
      }));

      await db.sessions.bulkAdd(oldSessions);

      const deletedCount = await cleanOldSessions();

      expect(deletedCount).toBe(5);
    });

    it('should preserve sessions within retention period', async () => {
      const now = new Date();

      // Create session 364 days ago (definitely within 365-day retention)
      await db.sessions.add({
        timestamp: subDays(now, 364).toISOString(),
        module: 'training',
        duration: 60000,
        completionStatus: 'completed'
      });

      const deletedCount = await cleanOldSessions(365);

      // Session at 364 days is NOT older than 365 days, so should be kept
      expect(deletedCount).toBe(0);

      const remainingSessions = await db.sessions.count();
      expect(remainingSessions).toBe(1);
    });
  });

  describe('getDatabaseStats', () => {
    it('should return counts for all tables', async () => {
      // Add data to tables
      await db.sessions.add({
        timestamp: new Date().toISOString(),
        module: 'training',
        duration: 60000,
        completionStatus: 'completed'
      });

      await db.drill_results.bulkAdd([
        { sessionId: 1, timestamp: new Date().toISOString(), module: 'number_line', difficulty: 'easy', isCorrect: true, timeToAnswer: 2000, accuracy: 100 },
        { sessionId: 1, timestamp: new Date().toISOString(), module: 'spatial_rotation', difficulty: 'easy', isCorrect: true, timeToAnswer: 2500, accuracy: 100 }
      ]);

      await db.telemetry_logs.bulkAdd([
        { timestamp: new Date().toISOString(), event: 'session_start', module: 'training', data: {}, userId: 'local_user' },
        { timestamp: new Date().toISOString(), event: 'session_end', module: 'training', data: {}, userId: 'local_user' },
        { timestamp: new Date().toISOString(), event: 'drill_complete', module: 'number_line', data: {}, userId: 'local_user' }
      ]);

      await db.assessments.add({
        timestamp: new Date().toISOString(),
        status: 'completed',
        totalQuestions: 10,
        correctAnswers: 8,
        weaknesses: ['number-sense'],
        strengths: ['spatial'],
        recommendations: [],
        userId: 'local_user'
      });

      const stats = await getDatabaseStats();

      expect(stats.sessions).toBe(1);
      expect(stats.drillResults).toBe(2);
      expect(stats.telemetryLogs).toBe(3);
      expect(stats.assessments).toBe(1);
    });

    it('should return zeros when database is empty', async () => {
      const stats = await getDatabaseStats();

      expect(stats.sessions).toBe(0);
      expect(stats.drillResults).toBe(0);
      expect(stats.telemetryLogs).toBe(0);
      expect(stats.assessments).toBe(0);
    });
  });
});
