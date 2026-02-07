// useSessionHistory Hook Tests - Story 5.2
// Tests for session history data fetching with pagination

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useSessionHistory } from './useSessionHistory';
import type { Session, DrillResult } from '@/services/storage/schemas';

// Mock Dexie database
vi.mock('@/services/storage/db', () => ({
  db: {
    sessions: {
      where: vi.fn(),
    },
    drill_results: {
      where: vi.fn(),
    },
    magic_minute_sessions: {
      where: vi.fn(),
    },
  },
}));

import { db } from '@/services/storage/db';

// Mock session data fixtures
const createMockSession = (
  id: number,
  timestamp: string,
  overrides: Partial<Session> = {}
): Session => ({
  id,
  timestamp,
  module: 'training',
  duration: 720000, // 12 minutes
  completionStatus: 'completed',
  drillCount: 12,
  accuracy: 85,
  confidenceBefore: 3,
  confidenceAfter: 4,
  confidenceChange: 1,
  drillQueue: ['number_line', 'spatial_rotation', 'math_operations'],
  ...overrides,
});

const createMockDrillResult = (
  id: number,
  sessionId: number,
  module: 'number_line' | 'spatial_rotation' | 'math_operations',
  overrides: Partial<DrillResult> = {}
): DrillResult => ({
  id,
  sessionId,
  timestamp: new Date().toISOString(),
  module,
  difficulty: 'medium',
  isCorrect: true,
  timeToAnswer: 5000,
  accuracy: 100,
  ...overrides,
});

const mockSessions: Session[] = [
  createMockSession(3, '2025-01-03T14:30:00Z', { accuracy: 90, confidenceChange: 2 }),
  createMockSession(2, '2025-01-02T10:00:00Z', { accuracy: 75, confidenceChange: 0 }),
  createMockSession(1, '2025-01-01T09:00:00Z', { accuracy: 60, confidenceChange: -1 }),
];

const mockDrillResults: DrillResult[] = [
  createMockDrillResult(1, 3, 'number_line'),
  createMockDrillResult(2, 3, 'spatial_rotation', { isCorrect: false }),
  createMockDrillResult(3, 2, 'math_operations'),
];

function setupSuccessfulMock(
  sessions: Session[] = mockSessions,
  drills: DrillResult[] = mockDrillResults,
  magicMinutes: { sessionId: number }[] = []
) {
  const sessionsChain = {
    equals: vi.fn().mockReturnThis(),
    reverse: vi.fn().mockReturnThis(),
    offset: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    toArray: vi.fn().mockResolvedValue(sessions),
  };
  vi.mocked(db.sessions.where).mockReturnValue(sessionsChain as any);

  const drillsChain = {
    anyOf: vi.fn().mockReturnThis(),
    toArray: vi.fn().mockResolvedValue(drills),
  };
  vi.mocked(db.drill_results.where).mockReturnValue(drillsChain as any);

  const mmChain = {
    anyOf: vi.fn().mockReturnThis(),
    toArray: vi.fn().mockResolvedValue(magicMinutes),
  };
  vi.mocked(db.magic_minute_sessions.where).mockReturnValue(mmChain as any);

  return { sessionsChain, drillsChain, mmChain };
}

describe('useSessionHistory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns loading state initially', async () => {
    const sessionsChain = {
      equals: vi.fn().mockReturnThis(),
      reverse: vi.fn().mockReturnThis(),
      offset: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      toArray: vi.fn().mockImplementation(() => new Promise(() => {})), // Never resolves
    };
    vi.mocked(db.sessions.where).mockReturnValue(sessionsChain as any);

    const { result } = renderHook(() => useSessionHistory());

    expect(result.current.isLoading).toBe(true);
    expect(result.current.sessions).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  it('returns session data with joined drill results', async () => {
    setupSuccessfulMock();

    const { result } = renderHook(() => useSessionHistory());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.sessions).toHaveLength(3);
    expect(result.current.error).toBeNull();

    // First session should have 2 drill results
    expect(result.current.sessions[0].drills).toHaveLength(2);
    expect(result.current.sessions[0].id).toBe(3);

    // Second session should have 1 drill result
    expect(result.current.sessions[1].drills).toHaveLength(1);

    // Third session should have 0 drill results
    expect(result.current.sessions[2].drills).toHaveLength(0);
  });

  it('filters out abandoned and paused sessions', async () => {
    const mixedSessions: Session[] = [
      createMockSession(3, '2025-01-03T14:30:00Z'),
      createMockSession(2, '2025-01-02T10:00:00Z', { completionStatus: 'abandoned' }),
      createMockSession(1, '2025-01-01T09:00:00Z', { completionStatus: 'paused' }),
    ];
    setupSuccessfulMock(mixedSessions, []);

    const { result } = renderHook(() => useSessionHistory());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Only completed sessions should be returned
    expect(result.current.sessions).toHaveLength(1);
    expect(result.current.sessions[0].completionStatus).toBe('completed');
  });

  it('sets hasMore to true when results equal PAGE_SIZE', async () => {
    // Create 30 sessions (PAGE_SIZE)
    const fullPage = Array.from({ length: 30 }, (_, i) =>
      createMockSession(i + 1, `2025-01-${String(i + 1).padStart(2, '0')}T10:00:00Z`)
    );
    setupSuccessfulMock(fullPage, []);

    const { result } = renderHook(() => useSessionHistory());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.hasMore).toBe(true);
  });

  it('sets hasMore to false when results less than PAGE_SIZE', async () => {
    setupSuccessfulMock(mockSessions, []);

    const { result } = renderHook(() => useSessionHistory());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.hasMore).toBe(false);
  });

  it('loadMore appends next page of sessions', async () => {
    // First page: 30 sessions
    const firstPage = Array.from({ length: 30 }, (_, i) =>
      createMockSession(30 - i, `2025-02-${String(30 - i).padStart(2, '0')}T10:00:00Z`)
    );

    // Second page: 5 sessions
    const secondPage = Array.from({ length: 5 }, (_, i) =>
      createMockSession(35 + i, `2025-01-${String(i + 1).padStart(2, '0')}T10:00:00Z`)
    );

    let callCount = 0;
    const sessionsChain = {
      equals: vi.fn().mockReturnThis(),
      reverse: vi.fn().mockReturnThis(),
      offset: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      toArray: vi.fn().mockImplementation(() => {
        callCount++;
        return Promise.resolve(callCount === 1 ? firstPage : secondPage);
      }),
    };
    vi.mocked(db.sessions.where).mockReturnValue(sessionsChain as any);

    const drillsChain = {
      anyOf: vi.fn().mockReturnThis(),
      toArray: vi.fn().mockResolvedValue([]),
    };
    vi.mocked(db.drill_results.where).mockReturnValue(drillsChain as any);

    const mmChain = {
      anyOf: vi.fn().mockReturnThis(),
      toArray: vi.fn().mockResolvedValue([]),
    };
    vi.mocked(db.magic_minute_sessions.where).mockReturnValue(mmChain as any);

    const { result } = renderHook(() => useSessionHistory());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.sessions).toHaveLength(30);
    expect(result.current.hasMore).toBe(true);

    // Load more
    await act(async () => {
      await result.current.loadMore();
    });

    expect(result.current.sessions).toHaveLength(35);
    expect(result.current.hasMore).toBe(false);
  });

  it('sets hasMagicMinute flag for sessions with magic minutes', async () => {
    setupSuccessfulMock(mockSessions, mockDrillResults, [{ sessionId: 3 }]);

    const { result } = renderHook(() => useSessionHistory());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Session 3 has magic minute
    expect(result.current.sessions[0].hasMagicMinute).toBe(true);
    // Sessions 2 and 1 do not
    expect(result.current.sessions[1].hasMagicMinute).toBe(false);
    expect(result.current.sessions[2].hasMagicMinute).toBe(false);
  });

  it('handles fetch errors gracefully', async () => {
    const sessionsChain = {
      equals: vi.fn().mockReturnThis(),
      reverse: vi.fn().mockReturnThis(),
      offset: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      toArray: vi.fn().mockRejectedValue(new Error('DB error')),
    };
    vi.mocked(db.sessions.where).mockReturnValue(sessionsChain as any);

    const { result } = renderHook(() => useSessionHistory());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe('Failed to load session history');
    expect(result.current.sessions).toEqual([]);
  });

  it('queries with correct Dexie chain', async () => {
    const { sessionsChain } = setupSuccessfulMock();

    const { result } = renderHook(() => useSessionHistory());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(db.sessions.where).toHaveBeenCalledWith('module');
    expect(sessionsChain.equals).toHaveBeenCalledWith('training');
    expect(sessionsChain.reverse).toHaveBeenCalled();
    expect(sessionsChain.offset).toHaveBeenCalledWith(0);
    expect(sessionsChain.limit).toHaveBeenCalledWith(30);
  });
});
