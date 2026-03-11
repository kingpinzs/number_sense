// useInsights Hook Tests - Story 5.4
// Updated to test unified InsightEngine integration
// The hook now wraps analyzePerformance() from @/services/training/insightEngine

import { describe, it, expect, vi, beforeEach, afterEach, beforeAll, afterAll } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useInsights } from './useInsights';
import type { InsightEngineResult } from '@/services/training/insightTypes';

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

// Mock the unified InsightEngine
vi.mock('@/services/training/insightEngine', () => ({
  analyzePerformance: vi.fn(),
}));

import { analyzePerformance } from '@/services/training/insightEngine';

function createMockResult(overrides: Partial<InsightEngineResult> = {}): InsightEngineResult {
  return {
    analyzedAt: '2026-03-10T10:00:00Z',
    dataPointCount: 50,
    hasEnoughData: true,
    insights: [
      {
        id: 'strength_arithmetic',
        type: 'strength',
        confidence: 0.85,
        domain: 'arithmetic',
        title: 'Strong in Arithmetic',
        message: 'Your accuracy is 92%.',
        priority: 50,
        variables: ['domain', 'recentAccuracy'],
        generatedAt: '2026-03-10T10:00:00Z',
        action: { label: 'Practice to maintain', drillType: 'math_operations', difficulty: 'hard' },
      },
      {
        id: 'weakness_placevalue',
        type: 'weakness',
        confidence: 0.7,
        domain: 'placeValue',
        title: 'Place Value needs attention',
        message: 'Your accuracy is 45%.',
        priority: 80,
        variables: ['domain', 'recentAccuracy'],
        generatedAt: '2026-03-10T10:00:00Z',
      },
    ],
    suggestedDrills: [],
    domainPerformance: [],
    contextAnalysis: [],
    ...overrides,
  };
}

describe('useInsights', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns loading state initially', async () => {
    vi.mocked(analyzePerformance).mockImplementation(() => new Promise(() => {})); // Never resolves

    const { result } = renderHook(() => useInsights());

    expect(result.current.isLoading).toBe(true);
    expect(result.current.insights).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  it('returns insights after successful fetch', async () => {
    vi.mocked(analyzePerformance).mockResolvedValue(createMockResult());

    const { result } = renderHook(() => useInsights());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.hasEnoughData).toBe(true);
    expect(result.current.error).toBeNull();
    expect(result.current.insights.length).toBe(2);
  });

  it('maps engine insights to legacy format with icon and category', async () => {
    vi.mocked(analyzePerformance).mockResolvedValue(createMockResult());

    const { result } = renderHook(() => useInsights());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const strengthInsight = result.current.insights.find(i => i.id === 'strength_arithmetic');
    expect(strengthInsight).toBeDefined();
    expect(strengthInsight!.category).toBe('positive');
    expect(strengthInsight!.icon).toBe('💪');
    expect(strengthInsight!.title).toBe('Strong in Arithmetic');

    const weaknessInsight = result.current.insights.find(i => i.id === 'weakness_placevalue');
    expect(weaknessInsight).toBeDefined();
    expect(weaknessInsight!.category).toBe('concern');
    expect(weaknessInsight!.icon).toBe('🎯');
  });

  it('maps engine action to legacy route format', async () => {
    vi.mocked(analyzePerformance).mockResolvedValue(createMockResult());

    const { result } = renderHook(() => useInsights());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const withAction = result.current.insights.find(i => i.action);
    expect(withAction).toBeDefined();
    expect(withAction!.action!.label).toBe('Practice to maintain');
    expect(withAction!.action!.route).toBe('/training');
  });

  it('returns hasEnoughData false when engine reports insufficient data', async () => {
    vi.mocked(analyzePerformance).mockResolvedValue(
      createMockResult({ hasEnoughData: false, insights: [] }),
    );

    const { result } = renderHook(() => useInsights());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.hasEnoughData).toBe(false);
    expect(result.current.insights).toEqual([]);
  });

  it('handles fetch errors gracefully', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(analyzePerformance).mockRejectedValue(new Error('DB error'));

    const { result } = renderHook(() => useInsights());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe('Failed to generate insights');
    expect(result.current.insights).toEqual([]);
    consoleSpy.mockRestore();
  });

  it('calls analyzePerformance from the unified engine', async () => {
    vi.mocked(analyzePerformance).mockResolvedValue(createMockResult());

    const { result } = renderHook(() => useInsights());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(analyzePerformance).toHaveBeenCalledTimes(1);
  });

  it('provides refetch function', async () => {
    vi.mocked(analyzePerformance).mockResolvedValue(createMockResult());

    const { result } = renderHook(() => useInsights());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(typeof result.current.refetch).toBe('function');

    // Call refetch
    await result.current.refetch();

    // Should have called analyzePerformance again
    expect(analyzePerformance).toHaveBeenCalledTimes(2);
  });

  it('caps insights at 5 maximum', async () => {
    const manyInsights = Array.from({ length: 8 }, (_, i) => ({
      id: `insight-${i}`,
      type: 'trend' as const,
      confidence: 0.8,
      title: `Insight ${i}`,
      message: `Message ${i}`,
      priority: 50 - i,
      variables: ['test'],
      generatedAt: '2026-03-10T10:00:00Z',
    }));
    vi.mocked(analyzePerformance).mockResolvedValue(
      createMockResult({ insights: manyInsights }),
    );

    const { result } = renderHook(() => useInsights());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.insights).toHaveLength(5);
  });
});
