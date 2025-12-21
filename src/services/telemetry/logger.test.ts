// Telemetry Logger Service Tests - Story 3.7
// Tests for session lifecycle telemetry logging with Dexie persistence

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import 'fake-indexeddb/auto';
import { db } from '@/services/storage/db';
import { STORAGE_KEYS } from '@/services/storage/localStorage';
import {
  logSessionStart,
  logDrillComplete,
  logSessionEnd,
  logSessionPause,
  logSessionResume,
  restoreTelemetryBackup
} from './logger';

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn()
  }
}));

describe('Telemetry Logger Service', () => {
  beforeEach(async () => {
    // Clear database before each test
    await db.telemetry_logs.clear();
    // Clear localStorage
    localStorage.clear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('logSessionStart', () => {
    it('should log session_start event to telemetry_logs table', async () => {
      await logSessionStart('test-session-123', 'quick', 6);

      const logs = await db.telemetry_logs.toArray();
      expect(logs).toHaveLength(1);
      expect(logs[0].event).toBe('session_start');
      expect(logs[0].module).toBe('training');
      expect(logs[0].userId).toBe('local_user');
      expect(logs[0].data).toEqual({
        sessionId: 'test-session-123',
        sessionType: 'quick',
        drillCount: 6
      });
    });

    it('should include ISO 8601 timestamp', async () => {
      await logSessionStart('sess-1', 'full', 12);

      const logs = await db.telemetry_logs.toArray();
      expect(logs[0].timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });
  });

  describe('logDrillComplete', () => {
    it('should log drill_complete event with performance metrics', async () => {
      await logDrillComplete('number_line', {
        accuracy: 95.7,
        difficulty: 'medium',
        isCorrect: true,
        timeToAnswer: 3247
      });

      const logs = await db.telemetry_logs.toArray();
      expect(logs).toHaveLength(1);
      expect(logs[0].event).toBe('drill_complete');
      expect(logs[0].module).toBe('number_line');
      expect(logs[0].data).toEqual({
        accuracy: 95.7,
        difficulty: 'medium',
        isCorrect: true,
        timeToAnswer: 3247
      });
    });

    it('should log for different drill types', async () => {
      await logDrillComplete('spatial_rotation', {
        accuracy: 100,
        difficulty: 'easy',
        isCorrect: true,
        timeToAnswer: 1500
      });

      await logDrillComplete('math_operations', {
        accuracy: 0,
        difficulty: 'hard',
        isCorrect: false,
        timeToAnswer: 5000
      });

      const logs = await db.telemetry_logs.toArray();
      expect(logs).toHaveLength(2);
      expect(logs[0].module).toBe('spatial_rotation');
      expect(logs[1].module).toBe('math_operations');
    });
  });

  describe('logSessionEnd', () => {
    it('should log session_end event with session summary', async () => {
      await logSessionEnd({
        accuracy: 85,
        duration: 647000,
        confidenceChange: 2,
        drillCount: 12
      });

      const logs = await db.telemetry_logs.toArray();
      expect(logs).toHaveLength(1);
      expect(logs[0].event).toBe('session_end');
      expect(logs[0].module).toBe('training');
      expect(logs[0].data).toEqual({
        accuracy: 85,
        duration: 647000,
        confidenceChange: 2,
        drillCount: 12
      });
    });

    it('should handle null confidenceChange', async () => {
      await logSessionEnd({
        accuracy: 75,
        duration: 300000,
        confidenceChange: null,
        drillCount: 6
      });

      const logs = await db.telemetry_logs.toArray();
      expect(logs[0].data.confidenceChange).toBeNull();
    });
  });

  describe('logSessionPause', () => {
    it('should log session_pause event with current drill index', async () => {
      await logSessionPause(3);

      const logs = await db.telemetry_logs.toArray();
      expect(logs).toHaveLength(1);
      expect(logs[0].event).toBe('session_pause');
      expect(logs[0].module).toBe('training');
      expect(logs[0].data).toEqual({ currentDrillIndex: 3 });
    });
  });

  describe('logSessionResume', () => {
    it('should log session_resume event', async () => {
      await logSessionResume();

      const logs = await db.telemetry_logs.toArray();
      expect(logs).toHaveLength(1);
      expect(logs[0].event).toBe('session_resume');
      expect(logs[0].module).toBe('training');
      expect(logs[0].data).toEqual({});
    });
  });

  describe('Error handling and localStorage fallback', () => {
    it('should fallback to localStorage when Dexie fails', async () => {
      // Mock Dexie to throw an error
      const originalAdd = db.telemetry_logs.add.bind(db.telemetry_logs);
      db.telemetry_logs.add = vi.fn().mockRejectedValue(new Error('IndexedDB quota exceeded'));

      await logSessionStart('test-session', 'quick', 6);

      // Check localStorage backup
      const backup = localStorage.getItem(STORAGE_KEYS.TELEMETRY_BACKUP);
      expect(backup).not.toBeNull();

      const entries = JSON.parse(backup!);
      expect(entries).toHaveLength(1);
      expect(entries[0].event).toBe('session_start');

      // Restore original
      db.telemetry_logs.add = originalAdd;
    });

    it('should show toast notification on Dexie failure', async () => {
      const { toast } = await import('sonner');
      const originalAdd = db.telemetry_logs.add.bind(db.telemetry_logs);
      db.telemetry_logs.add = vi.fn().mockRejectedValue(new Error('Write failed'));

      await logSessionStart('test-session', 'quick', 6);

      expect(toast.error).toHaveBeenCalledWith(
        'Session data not saved',
        expect.objectContaining({
          description: expect.any(String)
        })
      );

      db.telemetry_logs.add = originalAdd;
    });
  });

  describe('restoreTelemetryBackup', () => {
    it('should restore telemetry entries from localStorage to Dexie', async () => {
      // Seed localStorage with backup entries
      const backupEntries = [
        {
          timestamp: new Date().toISOString(),
          event: 'session_start',
          module: 'training',
          data: { sessionType: 'quick', drillCount: 6 },
          userId: 'local_user'
        },
        {
          timestamp: new Date().toISOString(),
          event: 'session_end',
          module: 'training',
          data: { accuracy: 85 },
          userId: 'local_user'
        }
      ];
      localStorage.setItem(STORAGE_KEYS.TELEMETRY_BACKUP, JSON.stringify(backupEntries));

      const restoredCount = await restoreTelemetryBackup();

      expect(restoredCount).toBe(2);

      // Verify entries are in Dexie
      const logs = await db.telemetry_logs.toArray();
      expect(logs).toHaveLength(2);

      // Verify localStorage backup is cleared
      expect(localStorage.getItem(STORAGE_KEYS.TELEMETRY_BACKUP)).toBeNull();
    });

    it('should return 0 when no backup exists', async () => {
      const restoredCount = await restoreTelemetryBackup();
      expect(restoredCount).toBe(0);
    });

    it('should return 0 when backup is empty array', async () => {
      localStorage.setItem(STORAGE_KEYS.TELEMETRY_BACKUP, JSON.stringify([]));

      const restoredCount = await restoreTelemetryBackup();
      expect(restoredCount).toBe(0);
    });
  });

  describe('userId privacy requirement', () => {
    it('should always set userId to local_user for all events', async () => {
      await logSessionStart('s1', 'quick', 6);
      await logDrillComplete('number_line', { accuracy: 100, difficulty: 'easy', isCorrect: true, timeToAnswer: 1000 });
      await logSessionEnd({ accuracy: 100, duration: 60000, confidenceChange: 1, drillCount: 6 });
      await logSessionPause(2);
      await logSessionResume();

      const logs = await db.telemetry_logs.toArray();
      expect(logs).toHaveLength(5);

      // All entries should have userId = 'local_user'
      logs.forEach(log => {
        expect(log.userId).toBe('local_user');
      });
    });
  });
});
