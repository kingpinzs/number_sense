// Date Formatters Tests - Story 5.2
// Tests for session date, time, duration formatting and date grouping

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  formatSessionDate,
  formatSessionTime,
  formatDuration,
  groupSessionsByDate,
} from './dateFormatters';
import type { Session } from '@/services/storage/schemas';

// Helper to create a date relative to "now"
function daysAgo(days: number, hour: number = 14, minute: number = 30): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

describe('formatSessionDate', () => {
  it('returns "Today" for today\'s date', () => {
    const today = new Date().toISOString();
    expect(formatSessionDate(today)).toBe('Today');
  });

  it('returns "Yesterday" for yesterday\'s date', () => {
    const yesterday = daysAgo(1);
    expect(formatSessionDate(yesterday)).toBe('Yesterday');
  });

  it('returns formatted date for older dates', () => {
    // Use a fixed date to avoid flakiness
    const date = '2025-11-04T14:30:00.000Z';
    const result = formatSessionDate(date);
    // Should be in "EEE, MMM d" format like "Tue, Nov 4"
    expect(result).toMatch(/^[A-Z][a-z]{2}, [A-Z][a-z]{2} \d{1,2}$/);
  });
});

describe('formatSessionTime', () => {
  it('formats time in 12-hour format with AM/PM', () => {
    const timestamp = '2025-11-04T14:30:00.000Z';
    const result = formatSessionTime(timestamp);
    // Result depends on timezone, but should match h:mm AM/PM pattern
    expect(result).toMatch(/^\d{1,2}:\d{2}\s[AP]M$/);
  });

  it('formats morning time', () => {
    const timestamp = '2025-11-04T09:05:00.000Z';
    const result = formatSessionTime(timestamp);
    expect(result).toMatch(/^\d{1,2}:\d{2}\s[AP]M$/);
  });
});

describe('formatDuration', () => {
  it('formats 12 minutes correctly', () => {
    expect(formatDuration(720000)).toBe('12 minutes');
  });

  it('formats 1 minute correctly', () => {
    expect(formatDuration(60000)).toBe('1 minute');
  });

  it('formats less than 1 minute correctly', () => {
    expect(formatDuration(30000)).toBe('< 1 minute');
  });

  it('formats 0 ms as less than 1 minute', () => {
    expect(formatDuration(0)).toBe('< 1 minute');
  });

  it('floors to whole minutes', () => {
    // 5.5 minutes = 330000ms -> floors to 5
    expect(formatDuration(330000)).toBe('5 minutes');
  });
});

describe('groupSessionsByDate', () => {
  // Pin to a Wednesday so "yesterday" is always within the same week (weekStartsOn: 1 = Monday)
  const FIXED_NOW = new Date('2026-03-11T12:00:00.000Z'); // Wednesday

  function daysBeforeFixed(days: number): string {
    const d = new Date(FIXED_NOW);
    d.setDate(d.getDate() - days);
    d.setHours(14, 30, 0, 0);
    return d.toISOString();
  }

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(FIXED_NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('groups sessions into Today, This Week, Earlier', () => {
    const sessions = [
      { timestamp: daysBeforeFixed(0) } as Session,   // Today (Wed)
      { timestamp: daysBeforeFixed(1) } as Session,   // This Week (Tue)
      { timestamp: daysBeforeFixed(2) } as Session,   // This Week (Mon)
      { timestamp: daysBeforeFixed(14) } as Session,  // Earlier
    ];

    const groups = groupSessionsByDate(sessions);
    const keys = Array.from(groups.keys());

    expect(keys).toContain('Today');
    expect(groups.get('Today')).toHaveLength(1);

    expect(keys).toContain('This Week');
    expect(groups.get('This Week')).toHaveLength(2);

    expect(keys).toContain('Earlier');
    expect(groups.get('Earlier')).toHaveLength(1);
  });

  it('returns empty map for empty sessions', () => {
    const groups = groupSessionsByDate([]);
    expect(groups.size).toBe(0);
  });

  it('puts yesterday in This Week group', () => {
    const sessions = [
      { timestamp: daysBeforeFixed(1) } as Session,
    ];

    const groups = groupSessionsByDate(sessions);
    expect(groups.has('This Week')).toBe(true);
    expect(groups.get('This Week')).toHaveLength(1);
  });

  it('only creates groups that have sessions', () => {
    const sessions = [
      { timestamp: daysBeforeFixed(30) } as Session,
    ];

    const groups = groupSessionsByDate(sessions);
    expect(groups.has('Today')).toBe(false);
    expect(groups.has('This Week')).toBe(false);
    expect(groups.has('Earlier')).toBe(true);
  });
});
