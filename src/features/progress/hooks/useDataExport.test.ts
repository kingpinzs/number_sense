// useDataExport Hook Tests - Story 5.5
// Tests for data export hook
// Pattern: Cloned from useInsights.test.ts

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useDataExport } from './useDataExport';
import type { Session } from '@/services/storage/schemas';

// Mock Dexie database
vi.mock('@/services/storage/db', () => ({
  db: {
    sessions: {
      toArray: vi.fn(),
      where: vi.fn(),
    },
    drill_results: {
      where: vi.fn(),
    },
    assessments: {
      toArray: vi.fn(),
    },
  },
}));

// Mock exportData utilities
vi.mock('@/services/storage/exportData', () => ({
  downloadExportedData: vi.fn(),
  downloadCSVData: vi.fn(),
}));

// Mock localStorage utilities
vi.mock('@/services/storage/localStorage', () => ({
  getUserSettings: vi.fn().mockReturnValue({
    reducedMotion: false,
    soundEnabled: true,
    dailyGoalMinutes: 60,
    researchModeEnabled: false,
    showAdaptiveToasts: true,
    theme: 'system',
    magicMinuteEnabled: true,
  }),
  getStreak: vi.fn().mockReturnValue(5),
}));

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: Object.assign(vi.fn(), {
    success: vi.fn(),
    error: vi.fn(),
  }),
}));

import { db } from '@/services/storage/db';
import { downloadExportedData, downloadCSVData } from '@/services/storage/exportData';
import { getUserSettings, getStreak } from '@/services/storage/localStorage';
import { toast } from 'sonner';

// Mock session data
const mockSessions: Session[] = [
  {
    id: 1,
    timestamp: '2026-02-07T10:00:00Z',
    module: 'training',
    duration: 600000,
    completionStatus: 'completed',
    accuracy: 85,
    drillCount: 10,
  },
  {
    id: 2,
    timestamp: '2026-02-06T10:00:00Z',
    module: 'training',
    duration: 300000,
    completionStatus: 'completed',
    accuracy: 70,
    drillCount: 5,
  },
];

function setupMocks(sessions: Session[] = mockSessions) {
  // Re-establish localStorage mocks (cleared by restoreAllMocks)
  vi.mocked(getUserSettings).mockReturnValue({
    reducedMotion: false,
    soundEnabled: true,
    dailyGoalMinutes: 60,
    researchModeEnabled: false,
    showAdaptiveToasts: true,
    theme: 'system',
    magicMinuteEnabled: true,
  });
  vi.mocked(getStreak).mockReturnValue(5);

  // Mock db.sessions.toArray() for "all_time" queries
  vi.mocked(db.sessions.toArray).mockResolvedValue(sessions);

  // Mock db.sessions.where() chain for date-range queries
  const sessionsChain = {
    aboveOrEqual: vi.fn().mockReturnValue({
      toArray: vi.fn().mockResolvedValue(sessions),
    }),
  };
  vi.mocked(db.sessions.where).mockReturnValue(sessionsChain as any);

  // Mock drill results join
  const drillsChain = {
    anyOf: vi.fn().mockReturnValue({
      toArray: vi.fn().mockResolvedValue([]),
    }),
  };
  vi.mocked(db.drill_results.where).mockReturnValue(drillsChain as any);

  // Mock assessments
  vi.mocked(db.assessments.toArray).mockResolvedValue([]);
}

describe('useDataExport', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns initial state with dateRange all_time, isLoading true, isExporting false', async () => {
    setupMocks();

    const { result } = renderHook(() => useDataExport());

    expect(result.current.dateRange).toBe('all_time');
    expect(result.current.isExporting).toBe(false);
    // isLoading starts true, then goes false after check
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
  });

  it('hasData is false when no sessions exist', async () => {
    setupMocks([]);

    const { result } = renderHook(() => useDataExport());

    await waitFor(() => {
      expect(result.current.hasData).toBe(false);
    });
  });

  it('hasData is true when sessions exist', async () => {
    setupMocks(mockSessions);

    const { result } = renderHook(() => useDataExport());

    await waitFor(() => {
      expect(result.current.hasData).toBe(true);
    });
  });

  it('exportCSV calls downloadCSVData with correct filename', async () => {
    setupMocks(mockSessions);

    const { result } = renderHook(() => useDataExport());

    await waitFor(() => {
      expect(result.current.hasData).toBe(true);
    });

    await act(async () => {
      await result.current.exportCSV();
    });

    expect(downloadCSVData).toHaveBeenCalledTimes(1);
    const [csvContent, filename] = vi.mocked(downloadCSVData).mock.calls[0];
    expect(typeof csvContent).toBe('string');
    expect(csvContent).toContain('Session ID,Date');
    expect(filename).toMatch(/^discalculas-export-\d{4}-\d{2}-\d{2}\.csv$/);
  });

  it('exportJSON calls downloadExportedData with correct structure and filename', async () => {
    setupMocks(mockSessions);

    const { result } = renderHook(() => useDataExport());

    await waitFor(() => {
      expect(result.current.hasData).toBe(true);
    });

    await act(async () => {
      await result.current.exportJSON();
    });

    expect(downloadExportedData).toHaveBeenCalledTimes(1);
    const [payload, filename] = vi.mocked(downloadExportedData).mock.calls[0];
    const data = payload as any;
    expect(data.exportDate).toBeDefined();
    expect(data.dateRange).toBe('all_time');
    expect(data.sessions).toEqual(mockSessions);
    expect(data.userSettings).toBeDefined();
    expect(data.streak).toBe(5);
    expect(filename).toMatch(/^discalculas-export-\d{4}-\d{2}-\d{2}\.json$/);
  });

  it('setDateRange updates date range', async () => {
    setupMocks(mockSessions);

    const { result } = renderHook(() => useDataExport());

    await waitFor(() => {
      expect(result.current.hasData).toBe(true);
    });

    act(() => {
      result.current.setDateRange('last_7_days');
    });

    expect(result.current.dateRange).toBe('last_7_days');
  });

  it('shows toast when no sessions in selected date range on export', async () => {
    // Start with data, then export with empty range
    vi.mocked(db.sessions.toArray).mockResolvedValueOnce(mockSessions); // initial check
    vi.mocked(db.sessions.toArray).mockResolvedValueOnce([]); // export call

    const { result } = renderHook(() => useDataExport());

    await waitFor(() => {
      expect(result.current.hasData).toBe(true);
    });

    await act(async () => {
      await result.current.exportCSV();
    });

    expect(toast).toHaveBeenCalledWith('No sessions found in selected date range');
    expect(downloadCSVData).not.toHaveBeenCalled();
  });

  it('shows success toast after successful export', async () => {
    setupMocks(mockSessions);

    const { result } = renderHook(() => useDataExport());

    await waitFor(() => {
      expect(result.current.hasData).toBe(true);
    });

    await act(async () => {
      await result.current.exportCSV();
    });

    expect(toast.success).toHaveBeenCalledWith('Export complete! Check your downloads.');
  });

  it('provides exportCSV and exportJSON functions', async () => {
    setupMocks();

    const { result } = renderHook(() => useDataExport());

    expect(typeof result.current.exportCSV).toBe('function');
    expect(typeof result.current.exportJSON).toBe('function');
  });

  it('shows error toast when export fails', async () => {
    setupMocks(mockSessions);

    const { result } = renderHook(() => useDataExport());

    await waitFor(() => {
      expect(result.current.hasData).toBe(true);
    });

    // Override to fail on next toArray call (used by fetchSessions inside fetchExportData)
    vi.mocked(db.sessions.toArray).mockRejectedValueOnce(new Error('DB error'));

    await act(async () => {
      await result.current.exportCSV();
    });

    expect(toast.error).toHaveBeenCalledWith('Export failed. Please try again.');
    expect(downloadCSVData).not.toHaveBeenCalled();
  });

  it('hasData remains true when date range changes (global check per AC-8)', async () => {
    setupMocks(mockSessions);

    const { result } = renderHook(() => useDataExport());

    await waitFor(() => {
      expect(result.current.hasData).toBe(true);
    });

    // Change date range — hasData should stay true (checks all sessions, not filtered)
    act(() => {
      result.current.setDateRange('last_7_days');
    });

    // hasData should still be true because the global check doesn't change with dateRange
    expect(result.current.hasData).toBe(true);
  });
});
