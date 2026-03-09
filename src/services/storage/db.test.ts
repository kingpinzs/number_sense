// Tests for Dexie database layer
// Testing: Database initialization, CRUD operations, indexes, health checks

import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll } from 'vitest';
import { DiscalculasDB, db, ensureDBHealth, queryWithTiming } from './db';
import type { Session } from './schemas';

// Suppress Dexie "Another connection wants to delete database" and slow query warnings
const originalWarn = console.warn;
beforeAll(() => {
  console.warn = (...args: unknown[]) => {
    const msg = String(args[0]);
    if (msg.includes('Another connection wants to delete database') || msg.includes('Slow query:')) return;
    originalWarn(...args);
  };
});
afterAll(() => {
  console.warn = originalWarn;
});

describe('DiscalculasDB', () => {
  // Use test database instance
  let testDB: DiscalculasDB;

  beforeEach(() => {
    testDB = new DiscalculasDB();
  });

  afterEach(async () => {
    // Clean up test database
    await testDB.delete();
    await testDB.close();
  });

  describe('Database Initialization', () => {
    it('creates database with correct name', () => {
      expect(testDB.name).toBe('DiscalculasDB');
    });

    it('has version 2', () => {
      expect(testDB.verno).toBe(2);
    });

    it('defines all 8 tables', () => {
      const tables = testDB.tables.map(t => t.name).sort();
      expect(tables).toEqual([
        'assessments',
        'difficulty_history',
        'drill_results',
        'experiment_observations',
        'experiments',
        'magic_minute_sessions',
        'sessions',
        'telemetry_logs'
      ]);
    });

    it('exports singleton db instance', () => {
      expect(db).toBeInstanceOf(DiscalculasDB);
      expect(db.name).toBe('DiscalculasDB');
    });
  });

  describe('Sessions Table', () => {
    it('writes and reads a session', async () => {
      // Arrange
      const session: Session = {
        timestamp: '2025-11-10T10:00:00.000Z',
        module: 'training',
        duration: 300000,
        completionStatus: 'completed',
        confidencePre: 5,
        confidencePost: 7,
        anxietyLevel: 3
      };

      // Act
      const id = await testDB.sessions.add(session);
      const retrieved = await testDB.sessions.get(id);

      // Assert
      expect(retrieved).toBeDefined();
      expect(retrieved?.module).toBe('training');
      expect(retrieved?.completionStatus).toBe('completed');
      expect(retrieved?.confidencePre).toBe(5);
    });

    it('auto-increments id', async () => {
      const session1: Session = {
        timestamp: '2025-11-10T10:00:00.000Z',
        module: 'assessment',
        duration: 180000,
        completionStatus: 'completed'
      };

      const session2: Session = {
        timestamp: '2025-11-10T11:00:00.000Z',
        module: 'training',
        duration: 240000,
        completionStatus: 'completed'
      };

      const id1 = await testDB.sessions.add(session1);
      const id2 = await testDB.sessions.add(session2);

      expect(id2).toBeGreaterThan(id1);
    });

    it('queries by timestamp index', async () => {
      // Arrange
      await testDB.sessions.add({
        timestamp: '2025-11-10T09:00:00.000Z',
        module: 'training',
        duration: 300000,
        completionStatus: 'completed'
      });

      await testDB.sessions.add({
        timestamp: '2025-11-10T12:00:00.000Z',
        module: 'training',
        duration: 300000,
        completionStatus: 'completed'
      });

      // Act
      const results = await testDB.sessions
        .where('timestamp')
        .above('2025-11-10T10:00:00.000Z')
        .toArray();

      // Assert
      expect(results).toHaveLength(1);
      expect(results[0].timestamp).toBe('2025-11-10T12:00:00.000Z');
    });

    it('queries by compound index [timestamp+module]', async () => {
      // Arrange
      await testDB.sessions.bulkAdd([
        {
          timestamp: '2025-11-10T10:00:00.000Z',
          module: 'training',
          duration: 300000,
          completionStatus: 'completed'
        },
        {
          timestamp: '2025-11-10T10:00:00.000Z',
          module: 'assessment',
          duration: 180000,
          completionStatus: 'completed'
        },
        {
          timestamp: '2025-11-10T11:00:00.000Z',
          module: 'training',
          duration: 300000,
          completionStatus: 'completed'
        }
      ]);

      // Act
      const results = await testDB.sessions
        .where('[timestamp+module]')
        .equals(['2025-11-10T10:00:00.000Z', 'training'])
        .toArray();

      // Assert
      expect(results).toHaveLength(1);
      expect(results[0].module).toBe('training');
      expect(results[0].timestamp).toBe('2025-11-10T10:00:00.000Z');
    });
  });

  describe('CRUD Operations', () => {
    it('creates a record', async () => {
      const id = await testDB.telemetry_logs.add({
        timestamp: '2025-11-10T10:00:00.000Z',
        event: 'test_event',
        module: 'system',
        data: { foo: 'bar' },
        userId: 'local_user'
      });

      expect(id).toBeGreaterThan(0);
    });

    it('reads a record', async () => {
      const id = await testDB.telemetry_logs.add({
        timestamp: '2025-11-10T10:00:00.000Z',
        event: 'test_event',
        module: 'system',
        data: { foo: 'bar' },
        userId: 'local_user'
      });

      const record = await testDB.telemetry_logs.get(id);

      expect(record).toBeDefined();
      expect(record?.event).toBe('test_event');
    });

    it('updates a record', async () => {
      const id = await testDB.sessions.add({
        timestamp: '2025-11-10T10:00:00.000Z',
        module: 'training',
        duration: 300000,
        completionStatus: 'paused'
      });

      await testDB.sessions.update(id, { completionStatus: 'completed' });
      const updated = await testDB.sessions.get(id);

      expect(updated?.completionStatus).toBe('completed');
    });

    it('deletes a record', async () => {
      const id = await testDB.sessions.add({
        timestamp: '2025-11-10T10:00:00.000Z',
        module: 'training',
        duration: 300000,
        completionStatus: 'completed'
      });

      await testDB.sessions.delete(id);
      const deleted = await testDB.sessions.get(id);

      expect(deleted).toBeUndefined();
    });
  });

  describe('Foreign Key Pattern', () => {
    it('associates drill_results with session via sessionId', async () => {
      // Arrange - Create session
      const sessionId = await testDB.sessions.add({
        timestamp: '2025-11-10T10:00:00.000Z',
        module: 'training',
        duration: 300000,
        completionStatus: 'completed'
      });

      // Act - Create drill results for session
      await testDB.drill_results.bulkAdd([
        {
          sessionId,
          timestamp: '2025-11-10T10:05:00.000Z',
          module: 'number_line',
          difficulty: 'easy',
          isCorrect: true,
          timeToAnswer: 2500,
          accuracy: 80
        },
        {
          sessionId,
          timestamp: '2025-11-10T10:10:00.000Z',
          module: 'spatial_rotation',
          difficulty: 'medium',
          isCorrect: true,
          timeToAnswer: 3200,
          accuracy: 70
        }
      ]);

      // Assert - Query drill results by sessionId
      const drillResults = await testDB.drill_results
        .where('sessionId')
        .equals(sessionId)
        .toArray();

      expect(drillResults).toHaveLength(2);
      expect(drillResults[0].sessionId).toBe(sessionId);
      expect(drillResults[1].sessionId).toBe(sessionId);
    });
  });

  describe('Error Handling', () => {
    it('accepts data with missing optional fields', async () => {
      // Missing optional fields is valid
      const sessionWithoutOptionals = {
        timestamp: '2025-11-10T10:00:00.000Z',
        module: 'training',
        duration: 300000,
        completionStatus: 'completed' as const
      };

      // Should succeed (TypeScript would enforce this)
      const id = await testDB.sessions.add(sessionWithoutOptionals);
      const retrieved = await testDB.sessions.get(id);

      expect(retrieved).toBeDefined();
      expect(retrieved?.confidencePre).toBeUndefined();
      expect(retrieved?.confidencePost).toBeUndefined();
    });

    it('returns undefined for non-existent id', async () => {
      const result = await testDB.sessions.get(99999);
      expect(result).toBeUndefined();
    });
  });

  describe('ensureDBHealth', () => {
    it('returns true when database is healthy', async () => {
      const isHealthy = await ensureDBHealth();
      expect(isHealthy).toBe(true);
    });

    it('writes and cleans up health check record', async () => {
      const beforeCount = await db.telemetry_logs.count();
      await ensureDBHealth();
      const afterCount = await db.telemetry_logs.count();

      // Health check should clean up after itself
      expect(afterCount).toBe(beforeCount);
    });
  });

  describe('queryWithTiming', () => {
    it('executes query and returns result', async () => {
      await testDB.sessions.add({
        timestamp: '2025-11-10T10:00:00.000Z',
        module: 'training',
        duration: 300000,
        completionStatus: 'completed'
      });

      const result = await queryWithTiming(
        () => testDB.sessions.toArray(),
        'test-query'
      );

      expect(result).toHaveLength(1);
    });

    it('returns result even for slow queries', async () => {
      // Create a deliberately slow query
      const slowQuery = () => new Promise<string>(resolve => {
        setTimeout(() => resolve('done'), 150);
      });

      const result = await queryWithTiming(slowQuery, 'slow-query');

      expect(result).toBe('done');
    });
  });

  describe('All Tables CRUD', () => {
    it('performs CRUD on assessments table', async () => {
      const id = await testDB.assessments.add({
        timestamp: '2025-11-10T10:00:00.000Z',
        status: 'completed',
        totalQuestions: 20,
        correctAnswers: 15,
        weaknesses: ['number-sense'],
        strengths: ['spatial-rotation'],
        recommendations: ['Practice number line'],
        userId: 'local_user'
      });

      const record = await testDB.assessments.get(id);
      expect(record).toBeDefined();

      await testDB.assessments.update(id, { status: 'in-progress' });
      const updated = await testDB.assessments.get(id);
      expect(updated?.status).toBe('in-progress');

      await testDB.assessments.delete(id);
      const deleted = await testDB.assessments.get(id);
      expect(deleted).toBeUndefined();
    });

    it('performs CRUD on experiments table', async () => {
      const id = await testDB.experiments.add({
        name: 'Test Experiment',
        description: 'Testing A/B variants',
        status: 'active',
        startDate: '2025-11-10T00:00:00.000Z',
        variants: ['control', 'variant_a']
      });

      const record = await testDB.experiments.get(id);
      expect(record?.name).toBe('Test Experiment');

      await testDB.experiments.delete(id);
      const deleted = await testDB.experiments.get(id);
      expect(deleted).toBeUndefined();
    });
  });
});
