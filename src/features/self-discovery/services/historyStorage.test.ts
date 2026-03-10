// Tests for Personal History Storage Service
// Testing: createPersonalHistory, getLatestPersonalHistory, updateHistorySection,
//          completePersonalHistory, getAllPersonalHistories

import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll } from 'vitest';
import { DiscalculasDB } from '@/services/storage/db';
import {
  createPersonalHistory,
  getLatestPersonalHistory,
  updateHistorySection,
  completePersonalHistory,
  getAllPersonalHistories,
} from './historyStorage';
import type { HistorySectionData } from '../types';

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

describe('Personal History Storage', () => {
  let testDB: DiscalculasDB;

  beforeEach(() => {
    testDB = new DiscalculasDB();
  });

  afterEach(async () => {
    await testDB.delete();
    await testDB.close();
  });

  describe('createPersonalHistory', () => {
    it('creates an entry and returns an id', async () => {
      const id = await createPersonalHistory();

      expect(id).toBeGreaterThan(0);
    });

    it('creates entry with in-progress status', async () => {
      const id = await createPersonalHistory();
      const entry = await testDB.personal_history.get(id);

      expect(entry).toBeDefined();
      expect(entry!.completionStatus).toBe('in-progress');
    });

    it('creates entry with empty sections object', async () => {
      const id = await createPersonalHistory();
      const entry = await testDB.personal_history.get(id);

      expect(entry!.sections).toEqual({});
    });

    it('creates entry with valid ISO timestamps', async () => {
      const id = await createPersonalHistory();
      const entry = await testDB.personal_history.get(id);

      const parsed = new Date(entry!.timestamp);
      expect(parsed.toISOString()).toBe(entry!.timestamp);

      const parsedUpdate = new Date(entry!.lastUpdated);
      expect(parsedUpdate.toISOString()).toBe(entry!.lastUpdated);
    });

    it('creates entry with timestamp and lastUpdated matching initially', async () => {
      const id = await createPersonalHistory();
      const entry = await testDB.personal_history.get(id);

      // They should be very close (same new Date() call)
      const ts = new Date(entry!.timestamp).getTime();
      const lu = new Date(entry!.lastUpdated).getTime();
      expect(Math.abs(ts - lu)).toBeLessThan(100);
    });

    it('creates multiple independent entries', async () => {
      const id1 = await createPersonalHistory();
      const id2 = await createPersonalHistory();

      expect(id2).toBeGreaterThan(id1);

      const entry1 = await testDB.personal_history.get(id1);
      const entry2 = await testDB.personal_history.get(id2);

      expect(entry1).toBeDefined();
      expect(entry2).toBeDefined();
    });
  });

  describe('getLatestPersonalHistory', () => {
    it('returns undefined when no entries exist', async () => {
      const latest = await getLatestPersonalHistory();
      expect(latest).toBeUndefined();
    });

    it('returns the most recent entry by timestamp', async () => {
      await createPersonalHistory();
      await new Promise(resolve => setTimeout(resolve, 10));
      const id2 = await createPersonalHistory();

      const latest = await getLatestPersonalHistory();

      expect(latest).toBeDefined();
      expect(latest!.id).toBe(id2);
    });

    it('returns the latest even after updates to an older entry', async () => {
      const id1 = await createPersonalHistory();
      await new Promise(resolve => setTimeout(resolve, 10));
      const id2 = await createPersonalHistory();

      // Update the older entry — should NOT change which is "latest"
      // because latest is by timestamp (creation time), not lastUpdated
      await updateHistorySection(id1, 'medications', {
        completed: true,
        data: { medications: 'aspirin' },
      });

      const latest = await getLatestPersonalHistory();
      expect(latest!.id).toBe(id2);
    });
  });

  describe('updateHistorySection', () => {
    it('updates a section in an existing entry', async () => {
      const id = await createPersonalHistory();
      const sectionData: HistorySectionData = {
        completed: true,
        data: { medications: 'aspirin', conditions: 'none' },
      };

      await updateHistorySection(id, 'medications', sectionData);

      const entry = await testDB.personal_history.get(id);
      expect(entry!.sections['medications']).toEqual(sectionData);
    });

    it('updates lastUpdated timestamp', async () => {
      const id = await createPersonalHistory();
      const entryBefore = await testDB.personal_history.get(id);
      const originalLastUpdated = entryBefore!.lastUpdated;

      await new Promise(resolve => setTimeout(resolve, 10));

      await updateHistorySection(id, 'sensory', {
        completed: false,
        data: { vision: 'glasses' },
      });

      const entryAfter = await testDB.personal_history.get(id);
      expect(entryAfter!.lastUpdated).not.toBe(originalLastUpdated);
      expect(new Date(entryAfter!.lastUpdated).getTime()).toBeGreaterThan(
        new Date(originalLastUpdated).getTime()
      );
    });

    it('preserves existing sections when updating a different section', async () => {
      const id = await createPersonalHistory();

      await updateHistorySection(id, 'medications', {
        completed: true,
        data: { medications: 'aspirin' },
      });

      await updateHistorySection(id, 'sensory', {
        completed: false,
        data: { vision: 'glasses' },
      });

      const entry = await testDB.personal_history.get(id);
      expect(entry!.sections['medications']).toBeDefined();
      expect(entry!.sections['medications'].data.medications).toBe('aspirin');
      expect(entry!.sections['sensory']).toBeDefined();
      expect(entry!.sections['sensory'].data.vision).toBe('glasses');
    });

    it('overwrites existing section data when updating the same section', async () => {
      const id = await createPersonalHistory();

      await updateHistorySection(id, 'medications', {
        completed: false,
        data: { medications: 'original' },
      });

      await updateHistorySection(id, 'medications', {
        completed: true,
        data: { medications: 'updated', conditions: 'ADHD' },
      });

      const entry = await testDB.personal_history.get(id);
      expect(entry!.sections['medications'].completed).toBe(true);
      expect(entry!.sections['medications'].data.medications).toBe('updated');
      expect(entry!.sections['medications'].data.conditions).toBe('ADHD');
    });

    it('silently does nothing for non-existent historyId', async () => {
      // Should not throw — just early return
      await expect(
        updateHistorySection(99999, 'medications', {
          completed: true,
          data: { medications: 'test' },
        })
      ).resolves.toBeUndefined();
    });

    it('does not modify timestamp (creation time)', async () => {
      const id = await createPersonalHistory();
      const entryBefore = await testDB.personal_history.get(id);

      await new Promise(resolve => setTimeout(resolve, 10));

      await updateHistorySection(id, 'medications', {
        completed: true,
        data: { medications: 'aspirin' },
      });

      const entryAfter = await testDB.personal_history.get(id);
      expect(entryAfter!.timestamp).toBe(entryBefore!.timestamp);
    });
  });

  describe('completePersonalHistory', () => {
    it('marks entry as completed', async () => {
      const id = await createPersonalHistory();

      await completePersonalHistory(id);

      const entry = await testDB.personal_history.get(id);
      expect(entry!.completionStatus).toBe('completed');
    });

    it('updates lastUpdated when completing', async () => {
      const id = await createPersonalHistory();
      const entryBefore = await testDB.personal_history.get(id);

      await new Promise(resolve => setTimeout(resolve, 10));

      await completePersonalHistory(id);

      const entryAfter = await testDB.personal_history.get(id);
      expect(new Date(entryAfter!.lastUpdated).getTime()).toBeGreaterThan(
        new Date(entryBefore!.lastUpdated).getTime()
      );
    });

    it('does not modify sections data', async () => {
      const id = await createPersonalHistory();

      await updateHistorySection(id, 'medications', {
        completed: true,
        data: { medications: 'aspirin' },
      });

      await completePersonalHistory(id);

      const entry = await testDB.personal_history.get(id);
      expect(entry!.sections['medications'].data.medications).toBe('aspirin');
    });

    it('does not throw for non-existent id', async () => {
      await expect(completePersonalHistory(99999)).resolves.toBeUndefined();
    });
  });

  describe('getAllPersonalHistories', () => {
    it('returns empty array when no entries exist', async () => {
      const all = await getAllPersonalHistories();
      expect(all).toEqual([]);
    });

    it('returns all entries in reverse chronological order', async () => {
      const id1 = await createPersonalHistory();
      await new Promise(resolve => setTimeout(resolve, 10));
      const id2 = await createPersonalHistory();
      await new Promise(resolve => setTimeout(resolve, 10));
      const id3 = await createPersonalHistory();

      const all = await getAllPersonalHistories();

      expect(all).toHaveLength(3);
      // Reverse chronological — most recent first
      expect(all[0].id).toBe(id3);
      expect(all[1].id).toBe(id2);
      expect(all[2].id).toBe(id1);
    });

    it('includes both in-progress and completed entries', async () => {
      const id1 = await createPersonalHistory();
      await new Promise(resolve => setTimeout(resolve, 10));
      await createPersonalHistory();

      await completePersonalHistory(id1);

      const all = await getAllPersonalHistories();

      expect(all).toHaveLength(2);
      const statuses = all.map(e => e.completionStatus);
      expect(statuses).toContain('in-progress');
      expect(statuses).toContain('completed');
    });
  });
});
