import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useExperiment } from './useExperiment';
import {
  getActiveExperiments,
  assignVariant,
  recordObservation,
} from './experimentManager';
import type { ExperimentDefinition } from './experiments';

// ─── UserSettingsContext mock ─────────────────────────────────────────────────
// Module-level variable acts as a "remote control" — tests mutate it before render.
// vi.mock is hoisted, so the closure captures the variable reference (not value).
let mockResearchModeEnabled = false;

vi.mock('@/context/UserSettingsContext', () => ({
  useUserSettings: () => ({
    settings: {
      researchModeEnabled: mockResearchModeEnabled,
      reducedMotion: false,
      soundEnabled: true,
      dailyGoalMinutes: 60,
      showAdaptiveToasts: true,
      theme: 'system',
    },
    updateSettings: vi.fn(),
  }),
}));

// ─── experimentManager mock ───────────────────────────────────────────────────
vi.mock('./experimentManager', () => ({
  getActiveExperiments: vi.fn(),
  assignVariant: vi.fn(),
  recordObservation: vi.fn().mockResolvedValue(undefined),
}));

// ─── Fixtures ─────────────────────────────────────────────────────────────────
const MOCK_ACTIVE_EXPERIMENT: ExperimentDefinition = {
  id: 'drill-timer-visibility',
  name: 'Drill Timer Visibility',
  description: 'Test if showing/hiding the countdown timer affects drill accuracy',
  status: 'active',
  startDate: '2026-03-07',
  endDate: '2026-06-07',
  variants: [
    { id: 'control', name: 'Timer Visible', weight: 0.5 },
    { id: 'treatment', name: 'Timer Hidden', weight: 0.5 },
  ],
  metrics: ['drill_accuracy', 'drill_speed', 'user_confidence'],
};

// ─── Setup ────────────────────────────────────────────────────────────────────
beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(recordObservation).mockResolvedValue(undefined);
  // Default: Research Mode off, no active experiments
  mockResearchModeEnabled = false;
  vi.mocked(getActiveExperiments).mockReturnValue([]);
});

// ─── Research Mode guard ──────────────────────────────────────────────────────
describe('Research Mode guard', () => {
  it('returns control variant when Research Mode is disabled', async () => {
    mockResearchModeEnabled = false;

    const { result } = renderHook(() => useExperiment('drill-timer-visibility'));

    await waitFor(() => {
      expect(result.current.variant).toBe('control');
      expect(result.current.isControl).toBe(true);
      expect(result.current.isTreatment).toBe(false);
    });
  });

  it('does not call assignVariant when Research Mode is disabled', async () => {
    mockResearchModeEnabled = false;

    // Fix M1: wait for effect to complete first (confirmed via output state), then assert
    const { result } = renderHook(() => useExperiment('drill-timer-visibility'));
    await waitFor(() => expect(result.current.variant).toBe('control'));
    expect(assignVariant).not.toHaveBeenCalled();
  });

  it('enrolls user when Research Mode is toggled enabled mid-session', async () => {
    // M2: dynamic toggle disabled → enabled while component is mounted
    mockResearchModeEnabled = false;
    vi.mocked(getActiveExperiments).mockReturnValue([MOCK_ACTIVE_EXPERIMENT]);
    vi.mocked(assignVariant).mockReturnValue({ id: 'treatment', name: 'Timer Hidden', weight: 0.5 });

    const { result, rerender } = renderHook(() => useExperiment('drill-timer-visibility'));

    // Start: Research Mode disabled → 'control', no enrollment
    await waitFor(() => expect(result.current.variant).toBe('control'));
    expect(assignVariant).not.toHaveBeenCalled();

    // Enable Research Mode → useEffect re-runs with new dep value
    mockResearchModeEnabled = true;
    rerender();

    // Effect re-runs: experiment is active, Research Mode on → assigns treatment
    await waitFor(() => expect(result.current.variant).toBe('treatment'));
    expect(assignVariant).toHaveBeenCalledWith('drill-timer-visibility');
  });
});

// ─── Inactive experiment guard ────────────────────────────────────────────────
describe('Inactive experiment guard', () => {
  it('returns control variant when no experiments are active', async () => {
    mockResearchModeEnabled = true;
    vi.mocked(getActiveExperiments).mockReturnValue([]);

    const { result } = renderHook(() => useExperiment('drill-timer-visibility'));

    await waitFor(() => {
      expect(result.current.variant).toBe('control');
    });
    expect(assignVariant).not.toHaveBeenCalled();
  });

  it('returns control when experimentId is not in the active experiments list', async () => {
    mockResearchModeEnabled = true;
    vi.mocked(getActiveExperiments).mockReturnValue([MOCK_ACTIVE_EXPERIMENT]);

    const { result } = renderHook(() => useExperiment('unknown-experiment-id'));

    await waitFor(() => {
      expect(result.current.variant).toBe('control');
    });
    expect(assignVariant).not.toHaveBeenCalled();
  });
});

// ─── Happy path ───────────────────────────────────────────────────────────────
describe('Happy path (Research Mode enabled + experiment active)', () => {
  it('returns treatment variant when user is assigned to treatment', async () => {
    mockResearchModeEnabled = true;
    vi.mocked(getActiveExperiments).mockReturnValue([MOCK_ACTIVE_EXPERIMENT]);
    vi.mocked(assignVariant).mockReturnValue({ id: 'treatment', name: 'Timer Hidden', weight: 0.5 });

    const { result } = renderHook(() => useExperiment('drill-timer-visibility'));

    await waitFor(() => {
      expect(result.current.variant).toBe('treatment');
      expect(result.current.isControl).toBe(false);
      expect(result.current.isTreatment).toBe(true);
    });
    expect(assignVariant).toHaveBeenCalledWith('drill-timer-visibility');
  });

  it('returns control variant when user is assigned to control', async () => {
    mockResearchModeEnabled = true;
    vi.mocked(getActiveExperiments).mockReturnValue([MOCK_ACTIVE_EXPERIMENT]);
    vi.mocked(assignVariant).mockReturnValue({ id: 'control', name: 'Timer Visible', weight: 0.5 });

    const { result } = renderHook(() => useExperiment('drill-timer-visibility'));

    await waitFor(() => {
      expect(result.current.variant).toBe('control');
      expect(result.current.isControl).toBe(true);
      expect(result.current.isTreatment).toBe(false);
    });
  });
});

// ─── Error resilience ─────────────────────────────────────────────────────────
describe('Error resilience', () => {
  it('falls back to control when assignVariant throws', async () => {
    mockResearchModeEnabled = true;
    vi.mocked(getActiveExperiments).mockReturnValue([MOCK_ACTIVE_EXPERIMENT]);
    vi.mocked(assignVariant).mockImplementation(() => {
      throw new Error('Corrupted localStorage');
    });

    const { result } = renderHook(() => useExperiment('drill-timer-visibility'));

    await waitFor(() => {
      expect(result.current.variant).toBe('control');
      expect(result.current.isControl).toBe(true);
    });
  });
});

// ─── recordMetric ─────────────────────────────────────────────────────────────
describe('recordMetric', () => {
  it('delegates to recordObservation with correct experimentId, metric, and value', async () => {
    mockResearchModeEnabled = true;
    vi.mocked(getActiveExperiments).mockReturnValue([MOCK_ACTIVE_EXPERIMENT]);
    vi.mocked(assignVariant).mockReturnValue({ id: 'treatment', name: 'Timer Hidden', weight: 0.5 });

    const { result } = renderHook(() => useExperiment('drill-timer-visibility'));
    await waitFor(() => expect(result.current.variant).toBe('treatment'));

    await result.current.recordMetric('drill_accuracy', 0.85);

    expect(recordObservation).toHaveBeenCalledWith('drill-timer-visibility', 'drill_accuracy', 0.85);
  });

  it('returns a Promise from recordMetric', async () => {
    mockResearchModeEnabled = false;
    const { result } = renderHook(() => useExperiment('drill-timer-visibility'));
    await waitFor(() => expect(result.current.variant).toBe('control'));

    const returnValue = result.current.recordMetric('some_metric', 1);
    expect(returnValue).toBeInstanceOf(Promise);
  });
});

// ─── Research Mode dynamic toggle ────────────────────────────────────────────
describe('Research Mode dynamic toggle', () => {
  it('returns control when Research Mode is disabled mid-session (enabled → disabled)', async () => {
    // L3: inverse of M2 — user was enrolled, then disables Research Mode
    mockResearchModeEnabled = true;
    vi.mocked(getActiveExperiments).mockReturnValue([MOCK_ACTIVE_EXPERIMENT]);
    vi.mocked(assignVariant).mockReturnValue({ id: 'treatment', name: 'Timer Hidden', weight: 0.5 });

    const { result, rerender } = renderHook(() => useExperiment('drill-timer-visibility'));

    // Start: Research Mode enabled → enrolled in treatment
    await waitFor(() => expect(result.current.variant).toBe('treatment'));

    // Disable Research Mode → useEffect re-runs, guard fires first, returns 'control'
    mockResearchModeEnabled = false;
    rerender();

    await waitFor(() => expect(result.current.variant).toBe('control'));
    expect(result.current.isControl).toBe(true);
    expect(result.current.isTreatment).toBe(false);
  });
});

// ─── experimentId change ──────────────────────────────────────────────────────
describe('experimentId change', () => {
  it('re-runs the effect when experimentId changes', async () => {
    mockResearchModeEnabled = true;
    vi.mocked(getActiveExperiments).mockReturnValue([MOCK_ACTIVE_EXPERIMENT]);
    vi.mocked(assignVariant).mockReturnValue({ id: 'treatment', name: 'Timer Hidden', weight: 0.5 });

    const { result, rerender } = renderHook(
      ({ id }: { id: string }) => useExperiment(id),
      { initialProps: { id: 'drill-timer-visibility' } }
    );

    await waitFor(() => {
      expect(assignVariant).toHaveBeenCalledWith('drill-timer-visibility');
    });

    // Change experimentId — effect should re-run; new experiment is not in active list
    vi.clearAllMocks();
    vi.mocked(getActiveExperiments).mockReturnValue([]);

    rerender({ id: 'confidence-scale' });

    // L2 fix: verify BOTH mechanism (getActiveExperiments called) AND outcome (returns 'control')
    await waitFor(() => {
      expect(getActiveExperiments).toHaveBeenCalled();
      expect(result.current.variant).toBe('control');
    });
    expect(assignVariant).not.toHaveBeenCalled();
  });
});
