// csvFormatter.test.ts - Story 5.5
// Unit tests for CSV generation utility
// Pattern: Pure unit tests, AAA pattern

import { describe, it, expect } from 'vitest';
import {
  escapeCSV,
  formatSessionsCSV,
  formatDrillResultsCSV,
  generateFullCSV,
  DATE_RANGE_OPTIONS,
  DATE_RANGE_DAYS,
} from './csvFormatter';
import type { Session, DrillResult } from '@/services/storage/schemas';

// --- Test Data ---

const mockSessions: Session[] = [
  {
    id: 1,
    timestamp: '2026-02-07T10:00:00Z',
    module: 'training',
    duration: 600000,
    completionStatus: 'completed',
    drillCount: 10,
    accuracy: 85,
    confidenceBefore: 2,
    confidenceAfter: 4,
    confidenceChange: 2,
  },
  {
    id: 2,
    timestamp: '2026-02-06T14:30:00Z',
    module: 'training',
    duration: 300000,
    completionStatus: 'completed',
    drillCount: 5,
    accuracy: 70,
  },
];

const mockDrillResults: DrillResult[] = [
  {
    id: 1,
    sessionId: 1,
    timestamp: '2026-02-07T10:01:00Z',
    module: 'number_line',
    difficulty: 'medium',
    isCorrect: true,
    timeToAnswer: 2000,
    accuracy: 85,
  },
  {
    id: 2,
    sessionId: 1,
    timestamp: '2026-02-07T10:02:00Z',
    module: 'spatial_rotation',
    difficulty: 'hard',
    isCorrect: false,
    timeToAnswer: 4500,
    accuracy: 60,
  },
];

// --- escapeCSV tests ---

describe('escapeCSV', () => {
  it('returns empty string for null', () => {
    expect(escapeCSV(null)).toBe('');
  });

  it('returns empty string for undefined', () => {
    expect(escapeCSV(undefined)).toBe('');
  });

  it('returns string representation of numbers', () => {
    expect(escapeCSV(42)).toBe('42');
  });

  it('returns string representation of booleans', () => {
    expect(escapeCSV(true)).toBe('true');
    expect(escapeCSV(false)).toBe('false');
  });

  it('returns plain string without special chars as-is', () => {
    expect(escapeCSV('hello')).toBe('hello');
  });

  it('wraps value in quotes when it contains a comma', () => {
    expect(escapeCSV('hello, world')).toBe('"hello, world"');
  });

  it('wraps value in quotes and doubles internal quotes', () => {
    expect(escapeCSV('say "hi"')).toBe('"say ""hi"""');
  });

  it('wraps value in quotes when it contains a newline', () => {
    expect(escapeCSV('line1\nline2')).toBe('"line1\nline2"');
  });
});

// --- formatSessionsCSV tests ---

describe('formatSessionsCSV', () => {
  it('returns correct header row', () => {
    const csv = formatSessionsCSV([]);
    const header = csv.split('\n')[0];
    expect(header).toBe(
      'Session ID,Date,Time,Module,Duration (ms),Drill Count,Accuracy,Confidence Before,Confidence After,Confidence Change'
    );
  });

  it('formats session data rows correctly', () => {
    const csv = formatSessionsCSV(mockSessions);
    const lines = csv.split('\n');

    // Header + 2 data rows
    expect(lines.length).toBe(3);

    // First session with all fields
    expect(lines[1]).toContain('1,');
    expect(lines[1]).toContain('2026-02-07');
    expect(lines[1]).toContain('10:00');
    expect(lines[1]).toContain('training');
    expect(lines[1]).toContain('600000');
    expect(lines[1]).toContain('10');
    expect(lines[1]).toContain('85');
    expect(lines[1]).toContain('2');
    expect(lines[1]).toContain('4');
  });

  it('handles missing optional fields as empty strings', () => {
    const csv = formatSessionsCSV([mockSessions[1]]);
    const lines = csv.split('\n');
    const dataRow = lines[1];

    // Session 2 has no confidenceBefore/After/Change
    // Should end with empty fields: ,,
    expect(dataRow).toContain('70,,,');
  });

  it('returns only header for empty sessions array', () => {
    const csv = formatSessionsCSV([]);
    const lines = csv.split('\n');
    expect(lines.length).toBe(1);
    expect(lines[0]).toContain('Session ID');
  });
});

// --- formatDrillResultsCSV tests ---

describe('formatDrillResultsCSV', () => {
  it('returns correct header row', () => {
    const csv = formatDrillResultsCSV([]);
    const header = csv.split('\n')[0];
    expect(header).toBe(
      'Drill ID,Session ID,Timestamp,Module,Difficulty,Correct,Time (ms),Accuracy'
    );
  });

  it('formats drill result data rows correctly', () => {
    const csv = formatDrillResultsCSV(mockDrillResults);
    const lines = csv.split('\n');

    // Header + 2 data rows
    expect(lines.length).toBe(3);

    // First drill
    expect(lines[1]).toContain('1,1,');
    expect(lines[1]).toContain('number_line');
    expect(lines[1]).toContain('medium');
    expect(lines[1]).toContain('true');
    expect(lines[1]).toContain('2000');
    expect(lines[1]).toContain('85');

    // Second drill
    expect(lines[2]).toContain('2,1,');
    expect(lines[2]).toContain('spatial_rotation');
    expect(lines[2]).toContain('false');
  });

  it('returns only header for empty drills array', () => {
    const csv = formatDrillResultsCSV([]);
    const lines = csv.split('\n');
    expect(lines.length).toBe(1);
  });
});

// --- generateFullCSV tests ---

describe('generateFullCSV', () => {
  it('combines sessions and drills separated by blank line', () => {
    const csv = generateFullCSV(mockSessions, mockDrillResults);

    // Should contain both section headers
    expect(csv).toContain('Session ID,Date,Time');
    expect(csv).toContain('Drill ID,Session ID,Timestamp');

    // Sections separated by double newline (blank line)
    expect(csv).toContain('\n\n');
  });

  it('includes sessions section before drills section', () => {
    const csv = generateFullCSV(mockSessions, mockDrillResults);
    const sessionHeaderIdx = csv.indexOf('Session ID,Date');
    const drillHeaderIdx = csv.indexOf('Drill ID,Session ID');

    expect(sessionHeaderIdx).toBeLessThan(drillHeaderIdx);
  });

  it('works with empty sessions and empty drills', () => {
    const csv = generateFullCSV([], []);
    expect(csv).toContain('Session ID');
    expect(csv).toContain('Drill ID');
  });
});

// --- Type and constant tests ---

describe('DateRange types and constants', () => {
  it('DATE_RANGE_OPTIONS has 4 options', () => {
    expect(DATE_RANGE_OPTIONS).toHaveLength(4);
  });

  it('DATE_RANGE_OPTIONS includes all_time as last option', () => {
    const allTime = DATE_RANGE_OPTIONS.find(o => o.value === 'all_time');
    expect(allTime).toBeDefined();
    expect(allTime!.label).toBe('All time');
  });

  it('DATE_RANGE_DAYS maps correctly', () => {
    expect(DATE_RANGE_DAYS.last_7_days).toBe(7);
    expect(DATE_RANGE_DAYS.last_30_days).toBe(30);
    expect(DATE_RANGE_DAYS.last_90_days).toBe(90);
    expect(DATE_RANGE_DAYS.all_time).toBe(0);
  });
});
