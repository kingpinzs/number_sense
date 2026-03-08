import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getQueueSize, queueEvent, flushQueue, clearQueue, type TelemetryEventPayload } from './syncQueue';

// Mock Dexie db — bulkAdd is used for atomic batch inserts
vi.mock('@/services/storage/db', () => ({
  db: {
    telemetry_logs: { bulkAdd: vi.fn().mockResolvedValue(0) },
  },
}));

// Import after mock so we can spy on it
import { db } from '@/services/storage/db';

// localStorage mock
const mockStorage: Record<string, string> = {};

beforeEach(() => {
  Object.keys(mockStorage).forEach(k => delete mockStorage[k]);

  vi.spyOn(Storage.prototype, 'getItem').mockImplementation(key => mockStorage[key] ?? null);
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation((key, val) => { mockStorage[key] = String(val); });
  vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(key => { delete mockStorage[key]; });

  // Re-apply db mocks (vi.clearAllMocks clears mockResolvedValue)
  vi.mocked(db.telemetry_logs.bulkAdd).mockResolvedValue(0);
});

afterEach(() => {
  vi.clearAllMocks();
});

const makeEvent = (id = 1): TelemetryEventPayload => ({
  // Pad id to 2 digits so timestamp stays valid ISO 8601 (seconds 00-59) for all test ids
  timestamp: `2026-01-01T00:00:${String(id % 60).padStart(2, '0')}.000Z`,
  event: 'test_event',
  module: 'test',
  data: { value: id },
  userId: 'local_user',
});

describe('getQueueSize', () => {
  it('returns 0 when queue is empty', () => {
    expect(getQueueSize()).toBe(0);
  });

  it('returns 0 when localStorage key is null', () => {
    expect(getQueueSize()).toBe(0);
  });

  it('returns correct count after events are queued', () => {
    queueEvent(makeEvent(1));
    queueEvent(makeEvent(2));
    expect(getQueueSize()).toBe(2);
  });

  it('returns 0 on invalid JSON', () => {
    mockStorage['discalculas:syncQueue'] = 'not-valid-json{{{';
    expect(getQueueSize()).toBe(0);
  });

  it('returns 0 when stored value is not an array', () => {
    mockStorage['discalculas:syncQueue'] = JSON.stringify({ notAnArray: true });
    expect(getQueueSize()).toBe(0);
  });
});

describe('queueEvent', () => {
  it('adds an event to the queue', () => {
    queueEvent(makeEvent(1));
    expect(getQueueSize()).toBe(1);
  });

  it('accumulates multiple events', () => {
    queueEvent(makeEvent(1));
    queueEvent(makeEvent(2));
    queueEvent(makeEvent(3));
    expect(getQueueSize()).toBe(3);
  });

  it('drops the oldest event when queue reaches 100 capacity', () => {
    // Fill queue to 100
    for (let i = 0; i < 100; i++) {
      queueEvent({ ...makeEvent(i), data: { index: i } });
    }
    expect(getQueueSize()).toBe(100);

    // Adding one more should drop the oldest (index 0) and keep 100
    queueEvent({ ...makeEvent(100), data: { index: 100 } });
    expect(getQueueSize()).toBe(100);

    const raw = mockStorage['discalculas:syncQueue'];
    const queue: TelemetryEventPayload[] = JSON.parse(raw);
    expect(queue[0].data.index).toBe(1); // Oldest (0) was dropped
    expect(queue[99].data.index).toBe(100); // Newest at end
  });
});

describe('flushQueue', () => {
  it('returns 0 when queue is empty', async () => {
    const count = await flushQueue();
    expect(count).toBe(0);
    expect(db.telemetry_logs.bulkAdd).not.toHaveBeenCalled();
  });

  it('writes all events to Dexie atomically via bulkAdd and clears the queue', async () => {
    queueEvent(makeEvent(1));
    queueEvent(makeEvent(2));

    const count = await flushQueue();

    expect(count).toBe(2);
    // bulkAdd called once with entire queue (atomic batch, not N separate add() calls)
    expect(db.telemetry_logs.bulkAdd).toHaveBeenCalledTimes(1);
    expect(db.telemetry_logs.bulkAdd).toHaveBeenCalledWith(expect.arrayContaining([
      expect.objectContaining({ event: 'test_event' }),
    ]));
    expect(getQueueSize()).toBe(0);
  });

  it('preserves the queue when a Dexie bulkAdd fails (atomic rollback)', async () => {
    queueEvent(makeEvent(1));
    queueEvent(makeEvent(2));

    vi.mocked(db.telemetry_logs.bulkAdd).mockRejectedValueOnce(new Error('DB write failed'));

    await expect(flushQueue()).rejects.toThrow('DB write failed');
    // Queue preserved — no partial writes thanks to atomic bulkAdd
    expect(getQueueSize()).toBe(2);
  });

  it('clears queue after successful flush', async () => {
    queueEvent(makeEvent(1));
    await flushQueue();
    expect(getQueueSize()).toBe(0);
  });
});

describe('clearQueue', () => {
  it('removes the SYNC_QUEUE key from localStorage', () => {
    queueEvent(makeEvent(1));
    expect(getQueueSize()).toBe(1);

    clearQueue();
    expect(getQueueSize()).toBe(0);
    expect(mockStorage['discalculas:syncQueue']).toBeUndefined();
  });

  it('does not throw when queue is already empty', () => {
    expect(() => clearQueue()).not.toThrow();
  });
});
