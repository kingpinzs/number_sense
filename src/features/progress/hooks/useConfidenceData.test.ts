// useConfidenceData Hook Tests - Story 5.1
// Tests for data fetching hook

import { describe, it, expect, vi, beforeEach, afterEach, beforeAll, afterAll } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useConfidenceData } from './useConfidenceData';
import type { Session } from '@/services/storage/schemas';

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
const createMockSession = (
  id: number,
  timestamp: string,
  confidenceAfter: number,
  drillQueue: string[] = ['number_line']
): Session => ({
  id,
  timestamp,
  module: 'training',
  duration: 300000,
  completionStatus: 'completed',
  confidenceAfter,
  drillQueue,
});

const mockSessions: Session[] = [
  createMockSession(3, '2025-01-03T10:00:00Z', 4, ['number_line', 'spatial_rotation']),
  createMockSession(2, '2025-01-02T10:00:00Z', 3.5, ['math_operations']),
  createMockSession(1, '2025-01-01T10:00:00Z', 3, ['number_line']),
];

describe('useConfidenceData', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns loading state initially', async () => {
    // Setup mock to delay response
    const mockChain = {
      equals: vi.fn().mockReturnThis(),
      reverse: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      toArray: vi.fn().mockImplementation(() => new Promise(() => {})), // Never resolves
    };
    vi.mocked(db.sessions.where).mockReturnValue(mockChain as any);

    const { result } = renderHook(() => useConfidenceData());

    expect(result.current.isLoading).toBe(true);
  });

  it('returns confidence data after fetch', async () => {
    // Setup successful mock
    const sessionsChain = {
      equals: vi.fn().mockReturnThis(),
      reverse: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      toArray: vi.fn().mockResolvedValue(mockSessions),
    };
    vi.mocked(db.sessions.where).mockReturnValue(sessionsChain as any);

    const drillsChain = {
      anyOf: vi.fn().mockReturnThis(),
      toArray: vi.fn().mockResolvedValue([]),
    };
    vi.mocked(db.drill_results.where).mockReturnValue(drillsChain as any);

    const { result } = renderHook(() => useConfidenceData());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.current).not.toBeNull();
    expect(result.current.hasEnoughData).toBe(true);
    expect(result.current.sessionCount).toBe(3);
  });

  it('returns hasEnoughData false when sessions < 3', async () => {
    // Only 2 sessions
    const fewSessions = mockSessions.slice(0, 2);

    const sessionsChain = {
      equals: vi.fn().mockReturnThis(),
      reverse: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      toArray: vi.fn().mockResolvedValue(fewSessions),
    };
    vi.mocked(db.sessions.where).mockReturnValue(sessionsChain as any);

    const { result } = renderHook(() => useConfidenceData());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.hasEnoughData).toBe(false);
    expect(result.current.current).toBeNull();
    expect(result.current.sessionCount).toBe(2);
  });

  it('handles fetch errors gracefully', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    // Setup mock to reject
    const sessionsChain = {
      equals: vi.fn().mockReturnThis(),
      reverse: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      toArray: vi.fn().mockRejectedValue(new Error('DB error')),
    };
    vi.mocked(db.sessions.where).mockReturnValue(sessionsChain as any);

    const { result } = renderHook(() => useConfidenceData());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe('Failed to load confidence data');
    expect(result.current.current).toBeNull();
    consoleSpy.mockRestore();
  });

  it('provides refetch function', async () => {
    const sessionsChain = {
      equals: vi.fn().mockReturnThis(),
      reverse: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      toArray: vi.fn().mockResolvedValue(mockSessions),
    };
    vi.mocked(db.sessions.where).mockReturnValue(sessionsChain as any);

    const drillsChain = {
      anyOf: vi.fn().mockReturnThis(),
      toArray: vi.fn().mockResolvedValue([]),
    };
    vi.mocked(db.drill_results.where).mockReturnValue(drillsChain as any);

    const { result } = renderHook(() => useConfidenceData());

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
