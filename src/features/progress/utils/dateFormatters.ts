// Date Formatting Utilities - Story 5.2
// Formats session dates, times, durations for SessionHistory display

import { format, isToday, isYesterday, isThisWeek } from 'date-fns';
import type { Session } from '@/services/storage/schemas';

/**
 * Format session date as "Today", "Yesterday", or "Mon, Nov 4"
 */
export function formatSessionDate(timestamp: string): string {
  const date = new Date(timestamp);
  if (isToday(date)) return 'Today';
  if (isYesterday(date)) return 'Yesterday';
  return format(date, 'EEE, MMM d');
}

/**
 * Format session time as "2:30 PM" (12-hour format)
 */
export function formatSessionTime(timestamp: string): string {
  return format(new Date(timestamp), 'h:mm a');
}

/**
 * Format duration in milliseconds as human-readable string
 * Examples: "12 minutes", "1 minute", "< 1 minute"
 */
export function formatDuration(ms: number): string {
  const minutes = Math.floor(ms / 60000);
  if (minutes < 1) return '< 1 minute';
  if (minutes === 1) return '1 minute';
  return `${minutes} minutes`;
}

/**
 * Group sessions by date category for sticky headers
 * Categories: "Today", "This Week", "Earlier"
 * Only creates groups that contain sessions.
 */
export function groupSessionsByDate<T extends Session>(sessions: T[]): Map<string, T[]> {
  const groups = new Map<string, T[]>();

  for (const session of sessions) {
    const date = new Date(session.timestamp);
    let group: string;

    if (isToday(date)) {
      group = 'Today';
    } else if (isThisWeek(date, { weekStartsOn: 1 })) {
      group = 'This Week';
    } else {
      group = 'Earlier';
    }

    const existing = groups.get(group) || [];
    existing.push(session);
    groups.set(group, existing);
  }

  return groups;
}
