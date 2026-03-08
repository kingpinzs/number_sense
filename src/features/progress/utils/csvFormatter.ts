// csvFormatter.ts - Story 5.5
// CSV generation utilities for data export
// Custom serializer (no papaparse) following RFC 4180

import type { Session, DrillResult } from '@/services/storage/schemas';

// --- Types ---

export type DateRange = 'last_7_days' | 'last_30_days' | 'last_90_days' | 'all_time';

export const DATE_RANGE_OPTIONS: { value: DateRange; label: string }[] = [
  { value: 'last_7_days', label: 'Last 7 days' },
  { value: 'last_30_days', label: 'Last 30 days' },
  { value: 'last_90_days', label: 'Last 90 days' },
  { value: 'all_time', label: 'All time' },
];

export const DATE_RANGE_DAYS: Record<DateRange, number> = {
  last_7_days: 7,
  last_30_days: 30,
  last_90_days: 90,
  all_time: 0,
};

// --- CSV Escaping (RFC 4180) ---

/**
 * Escape a single CSV value per RFC 4180
 * - null/undefined -> empty string
 * - Wraps in double quotes if value contains comma, quote, or newline
 * - Doubles internal double quotes
 */
export function escapeCSV(value: unknown): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

// --- Session CSV ---

const SESSION_HEADERS = [
  'Session ID',
  'Date',
  'Time',
  'Module',
  'Duration (ms)',
  'Drill Count',
  'Accuracy',
  'Confidence Before',
  'Confidence After',
  'Confidence Change',
];

/**
 * Format sessions as CSV string with header row
 */
export function formatSessionsCSV(sessions: Session[]): string {
  const headerLine = SESSION_HEADERS.join(',');
  const dataLines = sessions.map(s => {
    // Extract date/time from ISO string directly (avoids timezone conversion)
    const date = s.timestamp ? s.timestamp.slice(0, 10) : '';
    const time = s.timestamp ? s.timestamp.slice(11, 16) : '';
    return [
      escapeCSV(s.id),
      escapeCSV(date),
      escapeCSV(time),
      escapeCSV(s.module),
      escapeCSV(s.duration),
      escapeCSV(s.drillCount),
      escapeCSV(s.accuracy),
      escapeCSV(s.confidenceBefore),
      escapeCSV(s.confidenceAfter),
      escapeCSV(s.confidenceChange),
    ].join(',');
  });
  return [headerLine, ...dataLines].join('\n');
}

// --- Drill Results CSV ---

const DRILL_HEADERS = [
  'Drill ID',
  'Session ID',
  'Timestamp',
  'Module',
  'Difficulty',
  'Correct',
  'Time (ms)',
  'Accuracy',
];

/**
 * Format drill results as CSV string with header row
 */
export function formatDrillResultsCSV(drills: DrillResult[]): string {
  const headerLine = DRILL_HEADERS.join(',');
  const dataLines = drills.map(d =>
    [
      escapeCSV(d.id),
      escapeCSV(d.sessionId),
      escapeCSV(d.timestamp),
      escapeCSV(d.module),
      escapeCSV(d.difficulty),
      escapeCSV(d.isCorrect),
      escapeCSV(d.timeToAnswer),
      escapeCSV(d.accuracy),
    ].join(',')
  );
  return [headerLine, ...dataLines].join('\n');
}

// --- Full CSV Export ---

/**
 * Generate complete CSV with sessions section + drill results section
 * Sections are separated by a blank line
 */
export function generateFullCSV(sessions: Session[], drills: DrillResult[]): string {
  const sessionsCSV = formatSessionsCSV(sessions);
  const drillsCSV = formatDrillResultsCSV(drills);
  return `${sessionsCSV}\n\n${drillsCSV}`;
}
