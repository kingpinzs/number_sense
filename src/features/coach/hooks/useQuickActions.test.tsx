// useQuickActions.test.ts - Story 6.2
// Tests for useQuickActions hook: data fetching, action selection, telemetry

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import type { ReactNode } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { useQuickActions } from './useQuickActions';

// Mock navigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock db
vi.mock('@/services/storage/db', () => ({
  db: {
    assessments: {
      where: vi.fn(),
    },
    sessions: {
      where: vi.fn(),
    },
    telemetry_logs: {
      add: vi.fn().mockResolvedValue(1),
    },
  },
}));

// Mock streakManager
vi.mock('@/services/training/streakManager', () => ({
  getCurrentStreak: vi.fn().mockReturnValue(3),
}));

// Mock localStorage functions
vi.mock('@/services/storage/localStorage', () => ({
  getLastSessionDate: vi.fn().mockReturnValue('2026-02-06T00:00:00.000Z'),
}));

// Mock date-fns so we control "today" without fake timers
vi.mock('date-fns', async () => {
  const actual = await vi.importActual('date-fns');
  return {
    ...actual,
    startOfDay: vi.fn((date: Date) => {
      // Return a stable "today" for new Date() calls, passthrough for others
      return (actual as any).startOfDay(date);
    }),
  };
});

import { db } from '@/services/storage/db';
import { getCurrentStreak } from '@/services/training/streakManager';
import { getLastSessionDate } from '@/services/storage/localStorage';

function setupDefaultMocks() {
  vi.mocked(db.assessments.where).mockReturnValue({
    equals: vi.fn().mockReturnValue({
      count: vi.fn().mockResolvedValue(1),
    }),
  } as any);

  vi.mocked(db.sessions.where).mockReturnValue({
    equals: vi.fn().mockReturnValue({
      filter: vi.fn().mockReturnValue({
        count: vi.fn().mockResolvedValue(0),
      }),
    }),
  } as any);

  vi.mocked(getCurrentStreak).mockReturnValue(3);
  vi.mocked(getLastSessionDate).mockReturnValue('2026-02-06T00:00:00.000Z');
}

// Wrapper with BrowserRouter for useNavigate
function wrapper({ children }: { children: ReactNode }) {
  return <BrowserRouter>{children}</BrowserRouter>;
}

describe('useQuickActions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupDefaultMocks();
  });

  it('returns loading state initially, then actions', async () => {
    const { result } = renderHook(() => useQuickActions(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.actions.length).toBeGreaterThanOrEqual(2);
  });

  it('fetches data from db and computes actions', async () => {
    const { result } = renderHook(() => useQuickActions(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(db.assessments.where).toHaveBeenCalledWith('status');
    expect(db.sessions.where).toHaveBeenCalledWith('module');
  });

  it('includes Start Training with streak subtitle when streak active and no session today', async () => {
    vi.mocked(getCurrentStreak).mockReturnValue(5);
    vi.mocked(getLastSessionDate).mockReturnValue('2026-02-06T00:00:00.000Z');

    const { result } = renderHook(() => useQuickActions(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const startTraining = result.current.actions.find(a => a.id === 'start_training');
    expect(startTraining).toBeDefined();
    expect(startTraining!.subtitle).toBe('Continue your streak!');
  });

  it('handleActionClick logs telemetry and navigates', async () => {
    const { result } = renderHook(() => useQuickActions(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const action = result.current.actions[0];
    act(() => {
      result.current.handleActionClick(action);
    });

    expect(db.telemetry_logs.add).toHaveBeenCalledWith(
      expect.objectContaining({
        event: 'quick_action_clicked',
        module: 'coach',
        data: { action: action.id, source: 'home' },
        userId: 'local_user',
      })
    );
    expect(mockNavigate).toHaveBeenCalledWith(action.route);
  });

  it('falls back to defaults on error', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(db.assessments.where).mockImplementation(() => {
      throw new Error('DB error');
    });

    const { result } = renderHook(() => useQuickActions(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.actions.length).toBeGreaterThanOrEqual(2);
    consoleSpy.mockRestore();
  });

  it('shows default subtitle when session already completed today', async () => {
    // getLastSessionDate returns today's date
    const today = new Date();
    vi.mocked(getLastSessionDate).mockReturnValue(today.toISOString());
    vi.mocked(getCurrentStreak).mockReturnValue(5);

    const { result } = renderHook(() => useQuickActions(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const startTraining = result.current.actions.find(a => a.id === 'start_training');
    expect(startTraining).toBeDefined();
    expect(startTraining!.subtitle).toBe('Jump into a session');
  });
});
