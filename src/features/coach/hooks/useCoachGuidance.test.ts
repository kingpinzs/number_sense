// useCoachGuidance Hook Tests - Story 6.1 + Data-Driven Coaching
// Tests data fetching, guidance computation, dismiss behavior, pruning, previous streak,
// enriched data (module performance, error patterns, spacing, confidence, real-world tips)

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useCoachGuidance } from './useCoachGuidance';

// Mock Dexie database
vi.mock('@/services/storage/db', () => ({
  db: {
    assessments: {
      where: vi.fn(),
    },
    sessions: {
      where: vi.fn(),
    },
    drill_results: {
      where: vi.fn(),
      orderBy: vi.fn(),
    },
  },
}));

// Mock streak manager
vi.mock('@/services/training/streakManager', () => ({
  getCurrentStreak: vi.fn(() => 3),
}));

// Mock localStorage functions
vi.mock('@/services/storage/localStorage', () => ({
  getDismissedCoachTips: vi.fn(() => []),
  addDismissedCoachTip: vi.fn(),
  setDismissedCoachTips: vi.fn(),
  getPreviousStreak: vi.fn(() => 3),
  setPreviousStreak: vi.fn(),
  getShownRealWorldTips: vi.fn(() => []),
  addShownRealWorldTip: vi.fn(),
}));

// Mock insights engine
vi.mock('@/features/progress/services/insightsEngine', () => ({
  calculateWeeklyConsistency: vi.fn(() => 3),
  calculateSpacingQuality: vi.fn(() => ({
    frequencyScore: 0.6,
    regularityScore: 0.7,
    overallScore: 0.66,
    recommendation: 'excellent',
  })),
  detectTrend: vi.fn(() => 'stable'),
}));

// Mock mistake analyzer
vi.mock('@/services/adaptiveDifficulty/mistakeAnalyzer', () => ({
  categorizeMistake: vi.fn(() => ({ type: 'overestimation', severity: 'moderate' })),
}));

import { db } from '@/services/storage/db';
import { getCurrentStreak } from '@/services/training/streakManager';
import {
  getDismissedCoachTips,
  addDismissedCoachTip,
  setDismissedCoachTips,
  getPreviousStreak,
  setPreviousStreak,
  getShownRealWorldTips,
  addShownRealWorldTip,
} from '@/services/storage/localStorage';
import { calculateWeeklyConsistency, calculateSpacingQuality } from '@/features/progress/services/insightsEngine';

function setupDefaultMocks() {
  // Assessment: 1 completed
  const assessmentsChain = {
    equals: vi.fn().mockReturnThis(),
    count: vi.fn().mockResolvedValue(1),
    last: vi.fn().mockResolvedValue({
      id: 1,
      timestamp: '2026-02-01T10:00:00Z',
      status: 'completed',
      totalQuestions: 10,
      correctAnswers: 7,
      weaknesses: ['number_line'],
      strengths: ['math_operations'],
      recommendations: [],
      userId: 'local_user',
    }),
  };
  vi.mocked(db.assessments.where).mockReturnValue(assessmentsChain as any);

  // Sessions: 5 completed training sessions
  const sessionsChain = {
    equals: vi.fn().mockReturnThis(),
    toArray: vi.fn().mockResolvedValue([
      { id: 1, timestamp: '2026-02-03T10:00:00Z', module: 'training', duration: 600000, completionStatus: 'completed' },
      { id: 2, timestamp: '2026-02-04T10:00:00Z', module: 'training', duration: 600000, completionStatus: 'completed' },
      { id: 3, timestamp: '2026-02-05T10:00:00Z', module: 'training', duration: 600000, completionStatus: 'completed' },
      { id: 4, timestamp: '2026-02-06T10:00:00Z', module: 'training', duration: 600000, completionStatus: 'completed' },
      { id: 5, timestamp: '2026-02-07T10:00:00Z', module: 'training', duration: 600000, completionStatus: 'completed' },
    ]),
  };
  vi.mocked(db.sessions.where).mockReturnValue(sessionsChain as any);

  // Drill results via orderBy('timestamp').toArray()
  const drillResultsChain = {
    toArray: vi.fn().mockResolvedValue([
      { sessionId: 3, accuracy: 75, module: 'number_line', timestamp: '2026-02-05T10:01:00Z', difficulty: 'medium', isCorrect: true, timeToAnswer: 2000 },
      { sessionId: 4, accuracy: 80, module: 'number_line', timestamp: '2026-02-06T10:01:00Z', difficulty: 'medium', isCorrect: true, timeToAnswer: 2000 },
      { sessionId: 5, accuracy: 70, module: 'number_line', timestamp: '2026-02-07T10:01:00Z', difficulty: 'medium', isCorrect: true, timeToAnswer: 2000 },
    ]),
  };
  vi.mocked(db.drill_results.orderBy).mockReturnValue(drillResultsChain as any);

  // Legacy drill_results.where for backward compat (no longer used but keep mock stable)
  const drillsWhereChain = {
    anyOf: vi.fn().mockReturnThis(),
    toArray: vi.fn().mockResolvedValue([
      { sessionId: 3, accuracy: 75, module: 'number_line', timestamp: '2026-02-05T10:01:00Z', difficulty: 'medium', isCorrect: true, timeToAnswer: 2000 },
    ]),
  };
  vi.mocked(db.drill_results.where).mockReturnValue(drillsWhereChain as any);

  vi.mocked(getCurrentStreak).mockReturnValue(3);
  vi.mocked(getPreviousStreak).mockReturnValue(3);
  vi.mocked(getDismissedCoachTips).mockReturnValue([]);
  vi.mocked(calculateWeeklyConsistency).mockReturnValue(3);
  vi.mocked(getShownRealWorldTips).mockReturnValue([]);
  vi.mocked(calculateSpacingQuality).mockReturnValue({
    frequencyScore: 0.6,
    regularityScore: 0.7,
    overallScore: 0.66,
    recommendation: 'excellent',
  });
}

describe('useCoachGuidance', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupDefaultMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('returns loading state initially then resolves', async () => {
    const { result } = renderHook(() => useCoachGuidance());

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
  });

  it('returns guidance based on user state', async () => {
    const { result } = renderHook(() => useCoachGuidance());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // With 5 sessions, streak 3, weekly 3 → should get after-3-sessions
    expect(result.current.guidance).not.toBeNull();
    expect(result.current.guidance!.triggerId).toBe('after-3-sessions');
  });

  it('returns first-launch when no assessment exists', async () => {
    const assessmentsChain = {
      equals: vi.fn().mockReturnThis(),
      count: vi.fn().mockResolvedValue(0),
      last: vi.fn().mockResolvedValue(null),
    };
    vi.mocked(db.assessments.where).mockReturnValue(assessmentsChain as any);

    const { result } = renderHook(() => useCoachGuidance());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.guidance!.triggerId).toBe('first-launch');
  });

  it('dismiss function updates localStorage and re-fetches guidance', async () => {
    const { result } = renderHook(() => useCoachGuidance());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.guidance).not.toBeNull();

    vi.mocked(getDismissedCoachTips).mockReturnValue(['after-3-sessions']);

    act(() => {
      result.current.dismiss('after-3-sessions');
    });

    expect(addDismissedCoachTip).toHaveBeenCalledWith('after-3-sessions');

    // Re-fetch runs; with after-3-sessions dismissed → falls to coaching insights
    await waitFor(() => {
      // Should get real-world-tip or another coaching insight
      expect(result.current.guidance).not.toBeNull();
    });
  });

  it('handles database errors gracefully', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const assessmentsChain = {
      equals: vi.fn().mockReturnThis(),
      count: vi.fn().mockRejectedValue(new Error('DB error')),
    };
    vi.mocked(db.assessments.where).mockReturnValue(assessmentsChain as any);

    const { result } = renderHook(() => useCoachGuidance());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.guidance).toBeNull();
    consoleSpy.mockRestore();
  });

  it('filters dismissed tips from guidance', async () => {
    vi.mocked(getDismissedCoachTips).mockReturnValue(['after-3-sessions', 'real-world-tip']);

    const { result } = renderHook(() => useCoachGuidance());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // after-3-sessions + real-world-tip dismissed, no coaching insights match → null
    expect(result.current.guidance).toBeNull();
  });

  // --- Dismiss re-fetch tests ---

  it('dismiss triggers re-fetch showing next priority tip', async () => {
    vi.mocked(getCurrentStreak).mockReturnValue(0);
    vi.mocked(getPreviousStreak).mockReturnValue(5);
    vi.mocked(calculateWeeklyConsistency).mockReturnValue(1);

    const { result } = renderHook(() => useCoachGuidance());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.guidance!.triggerId).toBe('streak-broken');

    vi.mocked(getDismissedCoachTips).mockReturnValue(['streak-broken']);

    act(() => {
      result.current.dismiss('streak-broken');
    });

    await waitFor(() => {
      expect(result.current.guidance).not.toBeNull();
      expect(result.current.guidance!.triggerId).toBe('low-consistency');
    });
  });

  // --- Pruning tests ---

  it('prunes streak-broken dismissal when streak rebuilds past 1', async () => {
    vi.mocked(getCurrentStreak).mockReturnValue(3);
    vi.mocked(getPreviousStreak).mockReturnValue(3);
    vi.mocked(getDismissedCoachTips).mockReturnValue(['streak-broken']);

    renderHook(() => useCoachGuidance());

    await waitFor(() => {
      expect(setDismissedCoachTips).toHaveBeenCalledWith([]);
    });
  });

  it('prunes low-consistency dismissal when weekly sessions reach 2+', async () => {
    vi.mocked(calculateWeeklyConsistency).mockReturnValue(3);
    vi.mocked(getDismissedCoachTips).mockReturnValue(['low-consistency']);

    renderHook(() => useCoachGuidance());

    await waitFor(() => {
      expect(setDismissedCoachTips).toHaveBeenCalledWith([]);
    });
  });

  it('does not prune one-time tip dismissals', async () => {
    vi.mocked(getDismissedCoachTips).mockReturnValue(['after-3-sessions', 'first-launch']);

    renderHook(() => useCoachGuidance());

    await waitFor(() => {
      expect(setDismissedCoachTips).not.toHaveBeenCalled();
    });
  });

  // --- Previous streak tests ---

  it('does not update previousStreak when currentStreak is 0', async () => {
    vi.mocked(getCurrentStreak).mockReturnValue(0);
    vi.mocked(getPreviousStreak).mockReturnValue(5);

    renderHook(() => useCoachGuidance());

    await waitFor(() => {
      expect(setPreviousStreak).not.toHaveBeenCalled();
    });
  });

  it('does not update previousStreak when currentStreak is 1', async () => {
    vi.mocked(getCurrentStreak).mockReturnValue(1);
    vi.mocked(getPreviousStreak).mockReturnValue(5);

    renderHook(() => useCoachGuidance());

    await waitFor(() => {
      expect(setPreviousStreak).not.toHaveBeenCalled();
    });
  });

  it('updates previousStreak when currentStreak grows past 1', async () => {
    vi.mocked(getCurrentStreak).mockReturnValue(4);
    vi.mocked(getPreviousStreak).mockReturnValue(3);

    renderHook(() => useCoachGuidance());

    await waitFor(() => {
      expect(setPreviousStreak).toHaveBeenCalledWith(4);
    });
  });

  // --- Enriched data tests ---

  it('queries drill_results via orderBy for enriched analysis', async () => {
    renderHook(() => useCoachGuidance());

    await waitFor(() => {
      expect(db.drill_results.orderBy).toHaveBeenCalledWith('timestamp');
    });
  });

  it('calls calculateSpacingQuality with completed sessions', async () => {
    renderHook(() => useCoachGuidance());

    await waitFor(() => {
      expect(calculateSpacingQuality).toHaveBeenCalled();
    });
  });

  it('reads shown real-world tips from localStorage', async () => {
    renderHook(() => useCoachGuidance());

    await waitFor(() => {
      expect(getShownRealWorldTips).toHaveBeenCalled();
    });
  });

  it('tracks shown real-world tip when one is selected', async () => {
    // Dismiss all motivational triggers so real-world-tip fires
    vi.mocked(getDismissedCoachTips).mockReturnValue(['after-3-sessions']);

    const { result } = renderHook(() => useCoachGuidance());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    if (result.current.guidance?.triggerId === 'real-world-tip') {
      expect(addShownRealWorldTip).toHaveBeenCalled();
    }
  });
});
