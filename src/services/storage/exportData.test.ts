// Data Export Utility Tests - Story 3.7
// Tests for exporting session data for debugging and user data portability

import { describe, it, expect, beforeEach } from 'vitest';
import 'fake-indexeddb/auto';
import { db } from './db';
import {
  exportSessionData,
  exportSessionsInRange,
  exportAllTrainingData,
  createDownloadUrl
} from './exportData';

describe('Data Export Utility', () => {
  beforeEach(async () => {
    // Clear all tables before each test
    await db.sessions.clear();
    await db.drill_results.clear();
    await db.telemetry_logs.clear();
  });

  describe('exportSessionData', () => {
    it('should return null for non-existent session', async () => {
      const result = await exportSessionData(9999);
      expect(result).toBeNull();
    });

    it('should export session with all related drill results', async () => {
      // Create a session
      const sessionId = await db.sessions.add({
        timestamp: '2024-01-15T10:00:00.000Z',
        module: 'training',
        duration: 300000,
        completionStatus: 'completed',
        sessionType: 'quick',
        drillCount: 3,
        accuracy: 66
      });

      // Create drill results for this session
      await db.drill_results.bulkAdd([
        {
          sessionId,
          timestamp: '2024-01-15T10:01:00.000Z',
          module: 'number_line',
          difficulty: 'easy',
          isCorrect: true,
          timeToAnswer: 2500,
          accuracy: 100,
          targetNumber: 47,
          userAnswer: 47,
          correctAnswer: 47
        },
        {
          sessionId,
          timestamp: '2024-01-15T10:02:00.000Z',
          module: 'spatial_rotation',
          difficulty: 'medium',
          isCorrect: true,
          timeToAnswer: 3000,
          accuracy: 100
        },
        {
          sessionId,
          timestamp: '2024-01-15T10:03:00.000Z',
          module: 'math_operations',
          difficulty: 'easy',
          isCorrect: false,
          timeToAnswer: 4000,
          accuracy: 0,
          operation: 'addition',
          problem: '12 + 7'
        }
      ]);

      const result = await exportSessionData(sessionId);

      expect(result).not.toBeNull();
      expect(result!.session.id).toBe(sessionId);
      expect(result!.drillResults).toHaveLength(3);
      expect(result!.exportedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });

    it('should include telemetry logs within session timeframe', async () => {
      // Create a session with known duration
      const sessionId = await db.sessions.add({
        timestamp: '2024-01-15T10:00:00.000Z',
        module: 'training',
        duration: 60000, // 1 minute
        completionStatus: 'completed'
      });

      // Create telemetry logs - some within session, some outside
      await db.telemetry_logs.bulkAdd([
        {
          timestamp: '2024-01-15T10:00:30.000Z', // Within session
          event: 'drill_complete',
          module: 'number_line',
          data: { accuracy: 100 },
          userId: 'local_user'
        },
        {
          timestamp: '2024-01-15T10:05:00.000Z', // After session ends
          event: 'session_start',
          module: 'training',
          data: {},
          userId: 'local_user'
        }
      ]);

      const result = await exportSessionData(sessionId);

      expect(result).not.toBeNull();
      expect(result!.telemetryLogs).toHaveLength(1);
      expect(result!.telemetryLogs[0].event).toBe('drill_complete');
    });

    it('should export session even with no drill results', async () => {
      const sessionId = await db.sessions.add({
        timestamp: '2024-01-15T10:00:00.000Z',
        module: 'training',
        duration: 0,
        completionStatus: 'abandoned'
      });

      const result = await exportSessionData(sessionId);

      expect(result).not.toBeNull();
      expect(result!.session.id).toBe(sessionId);
      expect(result!.drillResults).toHaveLength(0);
    });
  });

  describe('exportSessionsInRange', () => {
    it('should export all sessions within date range', async () => {
      // Create sessions across different dates
      await db.sessions.bulkAdd([
        {
          timestamp: '2024-01-10T10:00:00.000Z',
          module: 'training',
          duration: 60000,
          completionStatus: 'completed'
        },
        {
          timestamp: '2024-01-15T10:00:00.000Z',
          module: 'training',
          duration: 60000,
          completionStatus: 'completed'
        },
        {
          timestamp: '2024-01-20T10:00:00.000Z',
          module: 'training',
          duration: 60000,
          completionStatus: 'completed'
        }
      ]);

      const result = await exportSessionsInRange(
        '2024-01-12T00:00:00.000Z',
        '2024-01-18T00:00:00.000Z'
      );

      expect(result).toHaveLength(1);
      expect(result[0].session.timestamp).toBe('2024-01-15T10:00:00.000Z');
    });

    it('should return empty array when no sessions in range', async () => {
      await db.sessions.add({
        timestamp: '2024-01-15T10:00:00.000Z',
        module: 'training',
        duration: 60000,
        completionStatus: 'completed'
      });

      const result = await exportSessionsInRange(
        '2024-02-01T00:00:00.000Z',
        '2024-02-28T00:00:00.000Z'
      );

      expect(result).toHaveLength(0);
    });

    it('should include drill results for each session', async () => {
      const sessionId = await db.sessions.add({
        timestamp: '2024-01-15T10:00:00.000Z',
        module: 'training',
        duration: 60000,
        completionStatus: 'completed'
      });

      await db.drill_results.add({
        sessionId,
        timestamp: '2024-01-15T10:01:00.000Z',
        module: 'number_line',
        difficulty: 'easy',
        isCorrect: true,
        timeToAnswer: 2000,
        accuracy: 100
      });

      const result = await exportSessionsInRange(
        '2024-01-01T00:00:00.000Z',
        '2024-01-31T00:00:00.000Z'
      );

      expect(result).toHaveLength(1);
      expect(result[0].drillResults).toHaveLength(1);
    });
  });

  describe('exportAllTrainingData', () => {
    it('should export all sessions, drill results, and telemetry logs', async () => {
      // Create sessions
      await db.sessions.bulkAdd([
        { timestamp: '2024-01-15T10:00:00.000Z', module: 'training', duration: 60000, completionStatus: 'completed' },
        { timestamp: '2024-01-16T10:00:00.000Z', module: 'training', duration: 60000, completionStatus: 'completed' }
      ]);

      // Create drill results
      await db.drill_results.bulkAdd([
        { sessionId: 1, timestamp: '2024-01-15T10:01:00.000Z', module: 'number_line', difficulty: 'easy', isCorrect: true, timeToAnswer: 2000, accuracy: 100 },
        { sessionId: 2, timestamp: '2024-01-16T10:01:00.000Z', module: 'spatial_rotation', difficulty: 'medium', isCorrect: false, timeToAnswer: 3000, accuracy: 0 }
      ]);

      // Create telemetry logs
      await db.telemetry_logs.bulkAdd([
        { timestamp: '2024-01-15T10:00:00.000Z', event: 'session_start', module: 'training', data: {}, userId: 'local_user' },
        { timestamp: '2024-01-15T10:05:00.000Z', event: 'session_end', module: 'training', data: { accuracy: 100 }, userId: 'local_user' }
      ]);

      const result = await exportAllTrainingData();

      expect(result.sessions).toHaveLength(2);
      expect(result.drillResults).toHaveLength(2);
      expect(result.telemetryLogs).toHaveLength(2);
      expect(result.exportedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });

    it('should return empty arrays when database is empty', async () => {
      const result = await exportAllTrainingData();

      expect(result.sessions).toHaveLength(0);
      expect(result.drillResults).toHaveLength(0);
      expect(result.telemetryLogs).toHaveLength(0);
    });
  });

  describe('createDownloadUrl', () => {
    // Note: URL.createObjectURL is not available in jsdom/Node.js test environment
    // These functions are browser-only and should be tested in E2E tests
    it.skip('should create a blob URL for JSON data (browser-only)', () => {
      const data = { test: 'value', nested: { key: 123 } };
      const url = createDownloadUrl(data, 'test.json');

      expect(url).toMatch(/^blob:/);

      // Clean up
      URL.revokeObjectURL(url);
    });

    it.skip('should format JSON with 2-space indentation (browser-only)', () => {
      const data = { a: 1, b: 2 };
      const url = createDownloadUrl(data, 'test.json');

      // The blob URL was created successfully
      expect(url).toMatch(/^blob:/);

      URL.revokeObjectURL(url);
    });
  });

  describe('Export JSON structure matches interfaces', () => {
    it('should have correct Session structure in export', async () => {
      const sessionId = await db.sessions.add({
        timestamp: '2024-01-15T10:00:00.000Z',
        module: 'training',
        duration: 300000,
        completionStatus: 'completed',
        sessionType: 'quick',
        drillCount: 6,
        accuracy: 85,
        confidenceBefore: 2,
        confidenceAfter: 4,
        confidenceChange: 2
      });

      const result = await exportSessionData(sessionId);

      expect(result).not.toBeNull();
      const session = result!.session;

      // Verify Session interface fields
      expect(session).toHaveProperty('id');
      expect(session).toHaveProperty('timestamp');
      expect(session).toHaveProperty('module');
      expect(session).toHaveProperty('duration');
      expect(session).toHaveProperty('completionStatus');
      expect(session).toHaveProperty('sessionType');
      expect(session).toHaveProperty('drillCount');
      expect(session).toHaveProperty('accuracy');
      expect(session).toHaveProperty('confidenceBefore');
      expect(session).toHaveProperty('confidenceAfter');
      expect(session).toHaveProperty('confidenceChange');
    });

    it('should have correct DrillResult structure in export', async () => {
      const sessionId = await db.sessions.add({
        timestamp: '2024-01-15T10:00:00.000Z',
        module: 'training',
        duration: 60000,
        completionStatus: 'completed'
      });

      await db.drill_results.add({
        sessionId,
        timestamp: '2024-01-15T10:01:00.000Z',
        module: 'math_operations',
        difficulty: 'medium',
        isCorrect: true,
        timeToAnswer: 2500,
        accuracy: 100,
        operation: 'multiplication',
        problem: '7 x 8'
      });

      const result = await exportSessionData(sessionId);

      expect(result).not.toBeNull();
      expect(result!.drillResults).toHaveLength(1);

      const drill = result!.drillResults[0];

      // Verify DrillResult interface fields
      expect(drill).toHaveProperty('id');
      expect(drill).toHaveProperty('sessionId');
      expect(drill).toHaveProperty('timestamp');
      expect(drill).toHaveProperty('module');
      expect(drill).toHaveProperty('difficulty');
      expect(drill).toHaveProperty('isCorrect');
      expect(drill).toHaveProperty('timeToAnswer');
      expect(drill).toHaveProperty('accuracy');
      expect(drill).toHaveProperty('operation');
      expect(drill).toHaveProperty('problem');
    });
  });
});
