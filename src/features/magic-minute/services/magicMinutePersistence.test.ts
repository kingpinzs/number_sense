/**
 * Magic Minute Persistence Service Tests
 * Story 4.2: Build Magic Minute Timer Component
 *
 * Tests for Dexie IndexedDB persistence of Magic Minute sessions.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  createMagicMinuteSession,
  updateMagicMinuteSession,
  getMagicMinuteSessions,
  getLatestMagicMinuteSession,
} from './magicMinutePersistence';
import { db } from '@/services/storage/db';
import type { MagicMinuteSummary } from '../types/magicMinute.types';

// Mock the database
vi.mock('@/services/storage/db', () => ({
  db: {
    magic_minute_sessions: {
      add: vi.fn(),
      update: vi.fn(),
      where: vi.fn().mockReturnThis(),
      equals: vi.fn().mockReturnThis(),
      toArray: vi.fn(),
      orderBy: vi.fn().mockReturnThis(),
      reverse: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
    },
  },
}));

describe('magicMinutePersistence', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createMagicMinuteSession', () => {
    it('creates a new session and returns the ID', async () => {
      vi.mocked(db.magic_minute_sessions.add).mockResolvedValue(123);

      const result = await createMagicMinuteSession(1, ['overestimation', 'underestimation']);

      expect(db.magic_minute_sessions.add).toHaveBeenCalledWith(
        expect.objectContaining({
          sessionId: 1,
          targetedMistakes: ['overestimation', 'underestimation'],
          challengesGenerated: 0,
          challengesCompleted: 0,
          successRate: 0,
          duration: 0,
        })
      );
      expect(result).toBe(123);
    });

    it('returns null if add returns non-number ID', async () => {
      vi.mocked(db.magic_minute_sessions.add).mockResolvedValue('string-id' as any);

      const result = await createMagicMinuteSession(1, []);

      expect(result).toBeNull();
    });

    it('returns null on database error', async () => {
      vi.mocked(db.magic_minute_sessions.add).mockRejectedValue(new Error('DB error'));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await createMagicMinuteSession(1, ['overestimation']);

      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to create Magic Minute session:',
        expect.any(Error)
      );
      consoleSpy.mockRestore();
    });
  });

  describe('updateMagicMinuteSession', () => {
    it('updates session with summary data', async () => {
      vi.mocked(db.magic_minute_sessions.update).mockResolvedValue(1);

      const summary: MagicMinuteSummary = {
        totalChallenges: 10,
        correctCount: 8,
        successRate: 0.8,
        duration: 55000,
        targetedMistakes: ['overestimation'],
      };

      const result = await updateMagicMinuteSession(123, summary);

      expect(db.magic_minute_sessions.update).toHaveBeenCalledWith(123, {
        challengesGenerated: 10,
        challengesCompleted: 10,
        successRate: 0.8,
        duration: 55000,
      });
      expect(result).toBe(true);
    });

    it('returns false on database error', async () => {
      vi.mocked(db.magic_minute_sessions.update).mockRejectedValue(new Error('DB error'));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const summary: MagicMinuteSummary = {
        totalChallenges: 5,
        correctCount: 3,
        successRate: 0.6,
        duration: 60000,
        targetedMistakes: [],
      };

      const result = await updateMagicMinuteSession(123, summary);

      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('getMagicMinuteSessions', () => {
    it('returns sessions for a given session ID', async () => {
      const mockSessions = [
        { id: 1, sessionId: 42, timestamp: '2025-01-01', targetedMistakes: [], challengesGenerated: 5, challengesCompleted: 5, successRate: 0.8, duration: 60000 },
        { id: 2, sessionId: 42, timestamp: '2025-01-02', targetedMistakes: [], challengesGenerated: 8, challengesCompleted: 8, successRate: 0.75, duration: 55000 },
      ];
      vi.mocked(db.magic_minute_sessions.where).mockReturnThis();
      vi.mocked(db.magic_minute_sessions.equals).mockReturnThis();
      vi.mocked(db.magic_minute_sessions.toArray).mockResolvedValue(mockSessions);

      const result = await getMagicMinuteSessions(42);

      expect(db.magic_minute_sessions.where).toHaveBeenCalledWith('sessionId');
      expect(db.magic_minute_sessions.equals).toHaveBeenCalledWith(42);
      expect(result).toEqual(mockSessions);
    });

    it('returns empty array on database error', async () => {
      vi.mocked(db.magic_minute_sessions.where).mockImplementation(() => {
        throw new Error('DB error');
      });
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await getMagicMinuteSessions(42);

      expect(result).toEqual([]);
      consoleSpy.mockRestore();
    });
  });

  describe('getLatestMagicMinuteSession', () => {
    it('returns the most recent session', async () => {
      const mockSession = {
        id: 5,
        sessionId: 10,
        timestamp: '2025-01-15',
        targetedMistakes: ['underestimation'],
        challengesGenerated: 12,
        challengesCompleted: 12,
        successRate: 0.9,
        duration: 58000,
      };
      vi.mocked(db.magic_minute_sessions.orderBy).mockReturnThis();
      vi.mocked(db.magic_minute_sessions.reverse).mockReturnThis();
      vi.mocked(db.magic_minute_sessions.limit).mockReturnThis();
      vi.mocked(db.magic_minute_sessions.toArray).mockResolvedValue([mockSession]);

      const result = await getLatestMagicMinuteSession();

      expect(db.magic_minute_sessions.orderBy).toHaveBeenCalledWith('timestamp');
      expect(db.magic_minute_sessions.reverse).toHaveBeenCalled();
      expect(db.magic_minute_sessions.limit).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockSession);
    });

    it('returns null when no sessions exist', async () => {
      vi.mocked(db.magic_minute_sessions.orderBy).mockReturnThis();
      vi.mocked(db.magic_minute_sessions.reverse).mockReturnThis();
      vi.mocked(db.magic_minute_sessions.limit).mockReturnThis();
      vi.mocked(db.magic_minute_sessions.toArray).mockResolvedValue([]);

      const result = await getLatestMagicMinuteSession();

      expect(result).toBeNull();
    });

    it('returns null on database error', async () => {
      vi.mocked(db.magic_minute_sessions.orderBy).mockImplementation(() => {
        throw new Error('DB error');
      });
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await getLatestMagicMinuteSession();

      expect(result).toBeNull();
      consoleSpy.mockRestore();
    });
  });
});
