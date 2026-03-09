// syncQueue.ts - Offline telemetry event queue
// Story 7.4: Ambient Sync Indicator
//
// Pure functions — no React imports. Queues telemetry events in localStorage
// when offline, flushes them to Dexie when reconnecting.
//
// Known limitation: navigator.onLine can return true without actual internet
// connectivity (e.g., captive portal WiFi). Since all app data is local-first
// (Dexie/localStorage), this is not a functional problem — persistence works
// regardless of actual internet reachability.

import { STORAGE_KEYS } from '@/services/storage/localStorage';
import { db } from '@/services/storage/db';

export interface TelemetryEventPayload {
  timestamp: string;
  event: string;
  module: string;
  data: Record<string, unknown>;
  userId: string;
}

const MAX_QUEUE_SIZE = 100;

/**
 * Get current number of queued events
 */
export function getQueueSize(): number {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SYNC_QUEUE);
    if (!raw) return 0;
    const queue = JSON.parse(raw);
    return Array.isArray(queue) ? queue.length : 0;
  } catch {
    return 0;
  }
}

/**
 * Queue a telemetry event for later sync.
 * If queue is at max capacity, the oldest event is dropped (FIFO overflow).
 */
export function queueEvent(event: TelemetryEventPayload): void {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SYNC_QUEUE);
    const queue: TelemetryEventPayload[] = raw ? JSON.parse(raw) : [];
    if (queue.length >= MAX_QUEUE_SIZE) {
      queue.shift(); // Drop oldest event to make room
    }
    queue.push(event);
    localStorage.setItem(STORAGE_KEYS.SYNC_QUEUE, JSON.stringify(queue));
  } catch {
    // localStorage unavailable — silently fail to not disrupt the app
  }
}

/**
 * Flush all queued events to Dexie (batch write).
 * On success: clears queue and returns count of flushed events.
 * On failure: preserves queue intact for retry on next reconnect.
 *
 * @returns Number of events flushed (0 if queue was empty)
 * @throws Re-throws write errors so callers can handle sync failure
 */
export async function flushQueue(): Promise<number> {
  const raw = localStorage.getItem(STORAGE_KEYS.SYNC_QUEUE);
  if (!raw) return 0;
  const queue: TelemetryEventPayload[] = JSON.parse(raw);
  if (!Array.isArray(queue) || queue.length === 0) return 0;

  // bulkAdd wraps all inserts in a single IndexedDB transaction (atomic).
  // If any write fails, the entire batch rolls back — no partial writes,
  // no duplicate events on retry. Error propagates to caller for sync failure handling.
  await db.telemetry_logs.bulkAdd(queue);
  clearQueue();
  return queue.length;
}

/**
 * Clear the sync queue (e.g., after successful flush or for testing)
 */
export function clearQueue(): void {
  localStorage.removeItem(STORAGE_KEYS.SYNC_QUEUE);
}
