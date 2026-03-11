// Smart notification scheduler for training reminders
// Analyses session history to find the best time of day to train,
// tracks reminder skips, and adjusts suggestions accordingly.

import { STORAGE_KEYS } from '@/services/storage/localStorage';

/** Minimum number of sessions in a time bucket before recommending it */
export const MIN_SESSIONS_FOR_OPTIMAL = 2;

/** Number of skips at a given hour before the app suggests changing the time */
export const SKIPS_BEFORE_SUGGEST_CHANGE = 3;

/** Tolerance window (hours) for showing a reminder around the scheduled hour */
export const NOTIFICATION_WINDOW_HOURS = 1;

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SkipEntry {
  hour: number;
  count: number;
}

/** Subset of Session needed for performance-by-hour analysis */
export interface SessionSummary {
  timestamp: string;
  accuracy?: number;
}

// ─── Browser Notification API ─────────────────────────────────────────────────

/**
 * Request browser notification permission.
 * Returns the current permission if already determined.
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'denied';
  if (Notification.permission !== 'default') return Notification.permission;
  return Notification.requestPermission();
}

/**
 * Show a browser Notification.
 * Silently does nothing if permission is not granted or API is unavailable.
 */
export function showBrowserNotification(
  title: string,
  body: string,
  options?: { icon?: string; tag?: string }
): void {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;
  try {
    new Notification(title, {
      body,
      icon: options?.icon ?? '/icons/icon-192.png',
      tag: options?.tag ?? 'discalculas-reminder'
    });
  } catch {
    // Silently ignore — some contexts (e.g. sandboxed iframes) disallow Notification
  }
}

// ─── Optimal Time Analysis ────────────────────────────────────────────────────

/**
 * Analyse a list of completed sessions to find the hour of day with the
 * highest average accuracy.  Returns `null` if no hour bucket has enough data.
 */
export function analyzeOptimalHour(sessions: SessionSummary[]): number | null {
  type Bucket = { totalAccuracy: number; count: number };
  const byHour: Record<number, Bucket> = {};

  for (const s of sessions) {
    if (s.accuracy === undefined || s.accuracy === null) continue;
    const hour = new Date(s.timestamp).getHours();
    const existing = byHour[hour] ?? { totalAccuracy: 0, count: 0 };
    byHour[hour] = {
      totalAccuracy: existing.totalAccuracy + s.accuracy,
      count: existing.count + 1
    };
  }

  const buckets = Object.entries(byHour)
    .filter(([, v]) => v.count >= MIN_SESSIONS_FOR_OPTIMAL)
    .map(([hour, v]) => ({
      hour: Number(hour),
      avgAccuracy: v.totalAccuracy / v.count
    }));

  if (buckets.length === 0) return null;

  return buckets.reduce((best, b) => (b.avgAccuracy > best.avgAccuracy ? b : best)).hour;
}

/**
 * Return the average accuracy from a session list for a given hour of day.
 * Returns `null` if there are fewer than `MIN_SESSIONS_FOR_OPTIMAL` data points.
 */
export function getAccuracyAtHour(sessions: SessionSummary[], hour: number): number | null {
  const matching = sessions.filter(
    (s) => s.accuracy !== undefined && new Date(s.timestamp).getHours() === hour
  );
  if (matching.length < MIN_SESSIONS_FOR_OPTIMAL) return null;
  const total = matching.reduce((sum, s) => sum + (s.accuracy ?? 0), 0);
  return total / matching.length;
}

// ─── Skip Tracking ────────────────────────────────────────────────────────────

/**
 * Record a notification skip at a specific hour of day.
 * A skip is counted when the user was reminded but did not train.
 */
export function recordSkipAtHour(hour: number): void {
  const skips = getSkipHistory();
  const existing = skips.find((s) => s.hour === hour);
  if (existing) {
    existing.count++;
  } else {
    skips.push({ hour, count: 1 });
  }
  localStorage.setItem(STORAGE_KEYS.NOTIFICATION_SKIP_HISTORY, JSON.stringify(skips));
}

/**
 * Return the number of times the user has skipped a reminder at a given hour.
 */
export function getSkipCountForHour(hour: number): number {
  return getSkipHistory().find((s) => s.hour === hour)?.count ?? 0;
}

/**
 * Return the full skip-history array.
 */
export function getSkipHistory(): SkipEntry[] {
  const raw = localStorage.getItem(STORAGE_KEYS.NOTIFICATION_SKIP_HISTORY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (e: unknown) =>
        typeof (e as SkipEntry)?.hour === 'number' &&
        typeof (e as SkipEntry)?.count === 'number'
    );
  } catch {
    return [];
  }
}

/**
 * Return `true` if the skip count at `currentHour` has reached the threshold.
 */
export function shouldSuggestTimeChange(currentHour: number): boolean {
  return getSkipCountForHour(currentHour) >= SKIPS_BEFORE_SUGGEST_CHANGE;
}

// ─── Last-Shown Tracking ──────────────────────────────────────────────────────

/**
 * Return the ISO timestamp of the last shown notification, or `null`.
 */
export function getNotificationLastShown(): string | null {
  return localStorage.getItem(STORAGE_KEYS.NOTIFICATION_LAST_SHOWN);
}

/**
 * Store the ISO timestamp of the most recently shown notification.
 */
export function setNotificationLastShown(ts: string): void {
  localStorage.setItem(STORAGE_KEYS.NOTIFICATION_LAST_SHOWN, ts);
}

/**
 * Remove the last-shown timestamp (called after processing a skip or confirmed session).
 */
export function clearNotificationLastShown(): void {
  localStorage.removeItem(STORAGE_KEYS.NOTIFICATION_LAST_SHOWN);
}

/**
 * Return `true` if a notification has already been shown today.
 */
export function wasShownToday(): boolean {
  const lastShown = getNotificationLastShown();
  if (!lastShown) return false;
  const last = new Date(lastShown);
  const now = new Date();
  return (
    last.getFullYear() === now.getFullYear() &&
    last.getMonth() === now.getMonth() &&
    last.getDate() === now.getDate()
  );
}

/**
 * Return `true` if the last notification was shown more than `thresholdHours`
 * ago (and therefore constitutes a potential skip).
 */
export function isStaleNotification(thresholdHours = 2): boolean {
  const lastShown = getNotificationLastShown();
  if (!lastShown) return false;
  const elapsed = (Date.now() - new Date(lastShown).getTime()) / (1000 * 60 * 60);
  return elapsed > thresholdHours;
}

// ─── Window / Timing Helpers ──────────────────────────────────────────────────

/**
 * Return `true` if `currentHour` is within ±NOTIFICATION_WINDOW_HOURS of `scheduledHour`.
 */
export function isWithinNotificationWindow(scheduledHour: number, currentHour?: number): boolean {
  const hour = currentHour ?? new Date().getHours();
  return Math.abs(hour - scheduledHour) <= NOTIFICATION_WINDOW_HOURS;
}

/**
 * Format an hour (0-23) as a human-readable string, e.g. "9:00 AM" or "6:00 PM".
 */
export function formatHour(hour: number): string {
  const period = hour < 12 ? 'AM' : 'PM';
  const h = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${h}:00 ${period}`;
}

// ─── Reset ────────────────────────────────────────────────────────────────────

/**
 * Clear all notification scheduling data (for settings reset / testing).
 */
export function clearNotificationData(): void {
  localStorage.removeItem(STORAGE_KEYS.NOTIFICATION_SKIP_HISTORY);
  localStorage.removeItem(STORAGE_KEYS.NOTIFICATION_LAST_SHOWN);
}
