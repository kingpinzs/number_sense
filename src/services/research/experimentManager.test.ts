import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  getUserId,
  deterministicHash,
  getActiveExperiments,
  assignVariant,
  getAssignedVariant,
  recordObservation,
  clearAssignmentsForTesting,
} from './experimentManager';

// ─── localStorage mock ───────────────────────────────────────────────────────
// Uses vi.spyOn pattern from project-context.md for reliable mock cleanup
const mockStorage: Record<string, string> = {};
vi.spyOn(Storage.prototype, 'getItem').mockImplementation(
  (key: string) => mockStorage[key] ?? null
);
vi.spyOn(Storage.prototype, 'setItem').mockImplementation(
  (key: string, val: string) => { mockStorage[key] = val; }
);
vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(
  (key: string) => { delete mockStorage[key]; }
);

// ─── Dexie DB mock ───────────────────────────────────────────────────────────
vi.mock('@/services/storage/db', () => ({
  db: {
    experiment_observations: {
      add: vi.fn().mockResolvedValue(1),
    },
  },
}));

import { db } from '@/services/storage/db';

// ─── crypto.randomUUID mock ──────────────────────────────────────────────────
// JSDOM does not expose crypto.randomUUID in all vitest configs — must mock it.
const MOCK_UUID = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
type UUIDType = `${string}-${string}-${string}-${string}-${string}`;

beforeEach(() => {
  // Clear mock storage between tests
  Object.keys(mockStorage).forEach(k => delete mockStorage[k]);
  vi.clearAllMocks();
  // Re-apply mocks after clearAllMocks wipes implementations
  vi.spyOn(Storage.prototype, 'getItem').mockImplementation(
    (key: string) => mockStorage[key] ?? null
  );
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(
    (key: string, val: string) => { mockStorage[key] = val; }
  );
  vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(
    (key: string) => { delete mockStorage[key]; }
  );
  vi.mocked(db.experiment_observations.add).mockResolvedValue(1);
  vi.spyOn(crypto, 'randomUUID').mockReturnValue(MOCK_UUID as UUIDType);
});

// Note: afterEach vi.clearAllMocks() is intentionally omitted — beforeEach already
// calls vi.clearAllMocks() at the start of every test, making afterEach redundant.

// ─── getUserId ───────────────────────────────────────────────────────────────
describe('getUserId', () => {
  it('generates a UUID on first call and stores it in localStorage', () => {
    const id = getUserId();
    expect(id).toBe(MOCK_UUID);
    expect(mockStorage['discalculas:userId']).toBe(MOCK_UUID);
  });

  it('returns the stored ID on subsequent calls without re-generating', () => {
    getUserId(); // First call — generates and stores
    vi.mocked(crypto.randomUUID).mockReturnValue('different-uuid-1234-5678-abcd' as UUIDType);
    const id = getUserId(); // Second call — should return stored
    expect(id).toBe(MOCK_UUID);
    expect(crypto.randomUUID).toHaveBeenCalledTimes(1);
  });

  it('returns pre-existing ID if localStorage already has one', () => {
    mockStorage['discalculas:userId'] = 'existing-uuid-stored-before';
    const id = getUserId();
    expect(id).toBe('existing-uuid-stored-before');
    expect(crypto.randomUUID).not.toHaveBeenCalled();
  });
});

// ─── deterministicHash ───────────────────────────────────────────────────────
describe('deterministicHash', () => {
  it('returns the same value for the same inputs', () => {
    const h1 = deterministicHash('user-abc', 'drill-timer-visibility');
    const h2 = deterministicHash('user-abc', 'drill-timer-visibility');
    expect(h1).toBe(h2);
  });

  it('returns a value in range [0, 99]', () => {
    const h = deterministicHash('user-abc', 'experiment-xyz');
    expect(h).toBeGreaterThanOrEqual(0);
    expect(h).toBeLessThan(100);
  });

  it('produces different values for different userIds with same experimentId', () => {
    const h1 = deterministicHash('user-aaa', 'drill-timer-visibility');
    const h2 = deterministicHash('user-zzz', 'drill-timer-visibility');
    // djb2 rolling hash considers all characters — these specific inputs are distinct
    expect(h1).not.toBe(h2);
  });

  it('produces different values for same userId with different experimentIds', () => {
    const h1 = deterministicHash('same-user', 'experiment-a');
    const h2 = deterministicHash('same-user', 'experiment-b');
    expect(h1).not.toBe(h2);
  });

  it('is consistent with empty strings', () => {
    const h = deterministicHash('', '');
    expect(h).toBeGreaterThanOrEqual(0);
    expect(h).toBeLessThan(100);
  });
});

// ─── getActiveExperiments ────────────────────────────────────────────────────
describe('getActiveExperiments', () => {
  it('returns only active experiments', () => {
    const active = getActiveExperiments();
    expect(active.every(e => e.status === 'active')).toBe(true);
  });

  it('excludes the known draft experiment confidence-scale by id', () => {
    // confidence-scale has status:'draft' — verifies status filtering by named experiment
    const active = getActiveExperiments();
    const ids = active.map(e => e.id);
    expect(ids).not.toContain('confidence-scale');
  });

  it('returns an array (possibly empty)', () => {
    const active = getActiveExperiments();
    expect(Array.isArray(active)).toBe(true);
  });

  describe('date range filtering (time-frozen)', () => {
    afterEach(() => {
      vi.useRealTimers();
    });

    it('excludes experiments whose endDate has passed', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-07-01T00:00:00Z')); // after drill-timer-visibility ends 2026-06-07
      const active = getActiveExperiments();
      expect(active.find(e => e.id === 'drill-timer-visibility')).toBeUndefined();
    });

    it('excludes experiments whose startDate has not yet arrived', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-03-06T00:00:00Z')); // one day before startDate 2026-03-07
      const active = getActiveExperiments();
      expect(active.find(e => e.id === 'drill-timer-visibility')).toBeUndefined();
    });

    it('includes experiments that are within their active date window', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-04-15T00:00:00Z')); // within 2026-03-07 to 2026-06-07
      const active = getActiveExperiments();
      expect(active.find(e => e.id === 'drill-timer-visibility')).toBeDefined();
    });
  });
});

// ─── assignVariant ───────────────────────────────────────────────────────────
describe('assignVariant', () => {
  beforeEach(() => {
    clearAssignmentsForTesting();
  });

  it('returns a variant object with id, name, and weight', () => {
    const variant = assignVariant('drill-timer-visibility');
    expect(variant).toHaveProperty('id');
    expect(variant).toHaveProperty('name');
    expect(variant).toHaveProperty('weight');
  });

  it('returns the same variant on multiple calls (deterministic)', () => {
    const v1 = assignVariant('drill-timer-visibility');
    clearAssignmentsForTesting(); // Clear cache but keep userId
    const v2 = assignVariant('drill-timer-visibility');
    // Same userId → same hash → same variant
    expect(v1.id).toBe(v2.id);
  });

  it('returns cached assignment on second call without recalculating', () => {
    const v1 = assignVariant('drill-timer-visibility');
    // Changing UUID won't affect second call since it uses cached assignment
    vi.mocked(crypto.randomUUID).mockReturnValue('completely-different-uuid' as UUIDType);
    const v2 = assignVariant('drill-timer-visibility');
    expect(v1.id).toBe(v2.id);
  });

  it('assigns a variant that exists in the experiment definition', () => {
    const variant = assignVariant('drill-timer-visibility');
    expect(['control', 'treatment']).toContain(variant.id);
  });

  it('persists assignment to localStorage', () => {
    assignVariant('drill-timer-visibility');
    const stored = mockStorage['discalculas:experimentAssignments'];
    expect(stored).toBeDefined();
    const parsed = JSON.parse(stored);
    expect(parsed['drill-timer-visibility']).toBeDefined();
  });

  it('throws an error for unknown experiment IDs', () => {
    expect(() => assignVariant('non-existent-experiment')).toThrow(
      'Unknown experiment: "non-existent-experiment"'
    );
  });

  it('maps deterministicHash output to variant using weight buckets', () => {
    // drill-timer-visibility is 50/50: control covers [0,50), treatment covers [50,100)
    const hash = deterministicHash(MOCK_UUID, 'drill-timer-visibility');
    const variant = assignVariant('drill-timer-visibility');
    const expectedId = hash < 50 ? 'control' : 'treatment';
    expect(variant.id).toBe(expectedId);
  });
});

// ─── getAssignedVariant ──────────────────────────────────────────────────────
describe('getAssignedVariant', () => {
  beforeEach(() => {
    clearAssignmentsForTesting();
  });

  it('returns null before any assignment', () => {
    const variant = getAssignedVariant('drill-timer-visibility');
    expect(variant).toBeNull();
  });

  it('returns the correct variant after assignment', () => {
    const assigned = assignVariant('drill-timer-visibility');
    const retrieved = getAssignedVariant('drill-timer-visibility');
    expect(retrieved).not.toBeNull();
    expect(retrieved?.id).toBe(assigned.id);
  });

  it('returns null for an experiment that was never assigned', () => {
    assignVariant('drill-timer-visibility'); // Assign one experiment
    const variant = getAssignedVariant('confidence-scale'); // Query a different one
    expect(variant).toBeNull();
  });

  it('returns null for unknown experiment even if assignments map has data', () => {
    assignVariant('drill-timer-visibility');
    const variant = getAssignedVariant('completely-unknown');
    expect(variant).toBeNull();
  });
});

// ─── recordObservation ───────────────────────────────────────────────────────
describe('recordObservation', () => {
  beforeEach(() => {
    clearAssignmentsForTesting();
  });

  it('calls db.experiment_observations.add with the correct fields', async () => {
    assignVariant('drill-timer-visibility');
    await recordObservation('drill-timer-visibility', 'drill_accuracy', 0.85);

    expect(db.experiment_observations.add).toHaveBeenCalledWith(
      expect.objectContaining({
        experimentId: 'drill-timer-visibility',
        metric: 'drill_accuracy',
        value: 0.85,
        userId: MOCK_UUID,
      })
    );
  });

  it('includes a valid ISO timestamp', async () => {
    await recordObservation('drill-timer-visibility', 'drill_speed', 1200);
    const call = vi.mocked(db.experiment_observations.add).mock.calls[0][0];
    expect(() => new Date(call.timestamp).toISOString()).not.toThrow();
  });

  it('uses variantId from assignment or "control" as fallback', async () => {
    // No assignment → should fallback to 'control'
    await recordObservation('drill-timer-visibility', 'some_metric', 1);
    const call = vi.mocked(db.experiment_observations.add).mock.calls[0][0];
    expect(call.variantId).toBe('control');
  });

  it('uses the assigned variantId when available', async () => {
    const variant = assignVariant('drill-timer-visibility');
    await recordObservation('drill-timer-visibility', 'drill_accuracy', 0.9);
    const call = vi.mocked(db.experiment_observations.add).mock.calls[0][0];
    expect(call.variantId).toBe(variant.id);
  });
});

// ─── clearAssignmentsForTesting ──────────────────────────────────────────────
describe('clearAssignmentsForTesting', () => {
  it('removes the EXPERIMENT_ASSIGNMENTS key from localStorage', () => {
    assignVariant('drill-timer-visibility');
    expect(mockStorage['discalculas:experimentAssignments']).toBeDefined();
    clearAssignmentsForTesting();
    expect(mockStorage['discalculas:experimentAssignments']).toBeUndefined();
  });

  it('causes getAssignedVariant to return null after clearing', () => {
    assignVariant('drill-timer-visibility');
    clearAssignmentsForTesting();
    expect(getAssignedVariant('drill-timer-visibility')).toBeNull();
  });
});
