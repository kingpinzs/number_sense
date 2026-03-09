// useInsights Hook Tests - Story 5.4
// Tests for insights data fetching hook
// Pattern: Cloned from useConfidenceData.test.ts

import { describe, it, expect, vi, beforeEach, afterEach, beforeAll, afterAll } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useInsights } from './useInsights';
import type { Session, DrillResult } from '@/services/storage/schemas';

// Suppress React act() warnings from async state updates settling after test assertions
const originalConsoleError = console.error;
beforeAll(() => {
  console.error = (...args: unknown[]) => {
    const msg = String(args[0]);
    if (msg.includes('not wrapped in act(')) return;
    originalConsoleError(...args);
  };
});
afterAll(() => {
  console.error = originalConsoleError;
});

// Mock Dexie database
vi.mock('@/services/storage/db', () => ({
  db: {
    sessions: {
      where: vi.fn(),
    },
    drill_results: {
      where: vi.fn(),
    },
  },
}));

import { db } from '@/services/storage/db';

// Mock session data
function createMockSession(
  id: number,
  timestamp: string,
  completionStatus: 'completed' | 'abandoned' | 'paused' = 'completed',
): Session {
  return {
    id,
    timestamp,
    module: 'training',
    duration: 600000,
    completionStatus,
    accuracy: 80,
    drillCount: 10,
  };
}

const mockSessions: Session[] = [
  createMockSession(5, '2026-02-07T10:00:00Z'),
  createMockSession(4, '2026-02-06T10:00:00Z'),
  createMockSession(3, '2026-02-05T10:00:00Z'),
  createMockSession(2, '2026-02-04T10:00:00Z'),
  createMockSession(1, '2026-02-03T10:00:00Z'),
];

const mockDrillResults: DrillResult[] = [
  {
    sessionId: 5,
    timestamp: '2026-02-07T10:01:00Z',
    module: 'number_line',
    difficulty: 'medium',
    isCorrect: true,
    timeToAnswer: 2000,
    accuracy: 85,
  },
  {
    sessionId: 4,
    timestamp: '2026-02-06T10:01:00Z',
    module: 'number_line',
    difficulty: 'medium',
    isCorrect: true,
    timeToAnswer: 2200,
    accuracy: 80,
  },
];

function setupMocks(sessions: Session[], drillResults: DrillResult[] = []) {
  const sessionsChain = {
    equals: vi.fn().mockReturnThis(),
    reverse: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    toArray: vi.fn().mockResolvedValue(sessions),
  };
  vi.mocked(db.sessions.where).mockReturnValue(sessionsChain as any);

  const drillsChain = {
    anyOf: vi.fn().mockReturnThis(),
    toArray: vi.fn().mockResolvedValue(drillResults),
  };
  vi.mocked(db.drill_results.where).mockReturnValue(drillsChain as any);

  return { sessionsChain, drillsChain };
}

describe('useInsights', () => {
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
      limit: vi.fn().mockReturnThis(),
      toArray: vi.fn().mockImplementation(() => new Promise(() => {})), // Never resolves
    };
    vi.mocked(db.sessions.where).mockReturnValue(sessionsChain as any);

    const { result } = renderHook(() => useInsights());

    expect(result.current.isLoading).toBe(true);
    expect(result.current.insights).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  it('returns insights after successful fetch', async () => {
    setupMocks(mockSessions, mockDrillResults);

    const { result } = renderHook(() => useInsights());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.hasEnoughData).toBe(true);
    expect(result.current.error).toBeNull();
    // With 5 daily sessions, should generate at least a consistency insight
    expect(result.current.insights.length).toBeGreaterThan(0);
  });

  it('returns hasEnoughData false when fewer than 3 completed sessions', async () => {
    const fewSessions = mockSessions.slice(0, 2);
    setupMocks(fewSessions);

    const { result } = renderHook(() => useInsights());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.hasEnoughData).toBe(false);
    expect(result.current.insights).toEqual([]);
  });

  it('filters out non-completed sessions for hasEnoughData check', async () => {
    const mixedSessions: Session[] = [
      createMockSession(3, '2026-02-07T10:00:00Z', 'completed'),
      createMockSession(2, '2026-02-06T10:00:00Z', 'abandoned'),
      createMockSession(1, '2026-02-05T10:00:00Z', 'paused'),
    ];
    setupMocks(mixedSessions);

    const { result } = renderHook(() => useInsights());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Only 1 completed session → not enough data
    expect(result.current.hasEnoughData).toBe(false);
    expect(result.current.insights).toEqual([]);
  });

  it('handles fetch errors gracefully', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const sessionsChain = {
      equals: vi.fn().mockReturnThis(),
      reverse: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      toArray: vi.fn().mockRejectedValue(new Error('DB error')),
    };
    vi.mocked(db.sessions.where).mockReturnValue(sessionsChain as any);

    const { result } = renderHook(() => useInsights());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe('Failed to generate insights');
    expect(result.current.insights).toEqual([]);
    consoleSpy.mockRestore();
  });

  it('queries training sessions from Dexie', async () => {
    setupMocks(mockSessions, mockDrillResults);

    const { result } = renderHook(() => useInsights());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(db.sessions.where).toHaveBeenCalledWith('module');
  });

  it('joins drill results by session IDs', async () => {
    setupMocks(mockSessions, mockDrillResults);

    const { result } = renderHook(() => useInsights());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(db.drill_results.where).toHaveBeenCalledWith('sessionId');
  });

  it('provides refetch function', async () => {
    setupMocks(mockSessions, mockDrillResults);

    const { result } = renderHook(() => useInsights());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(typeof result.current.refetch).toBe('function');

    // Call refetch
    await result.current.refetch();

    // Should have called database again
    expect(db.sessions.where).toHaveBeenCalledTimes(2);
  });
});
