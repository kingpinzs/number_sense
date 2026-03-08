import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useSyncIndicator } from './useSyncIndicator';

// Mock AppContext
const mockSetPendingSyncCount = vi.fn();
const mockDispatch = vi.fn();

vi.mock('@/context/AppContext', () => ({
  useApp: vi.fn(() => ({
    state: { onlineStatus: true, pendingSyncCount: 0, streak: 0, lastSyncTimestamp: null },
    dispatch: mockDispatch,
    setStreak: vi.fn(),
    updateOnlineStatus: vi.fn(),
    setLastSync: vi.fn(),
    setPendingSyncCount: mockSetPendingSyncCount,
  })),
}));

// Mock syncQueue module
vi.mock('./syncQueue', () => ({
  getQueueSize: vi.fn().mockReturnValue(0),
  flushQueue: vi.fn().mockResolvedValue(0),
  clearQueue: vi.fn(),
  queueEvent: vi.fn(),
}));

import { useApp } from '@/context/AppContext';
import { getQueueSize, flushQueue } from './syncQueue';

function setMockOnlineStatus(isOnline: boolean, pendingSyncCount = 0) {
  vi.mocked(useApp).mockReturnValue({
    state: { onlineStatus: isOnline, pendingSyncCount, streak: 0, lastSyncTimestamp: null },
    dispatch: mockDispatch,
    setStreak: vi.fn(),
    updateOnlineStatus: vi.fn(),
    setLastSync: vi.fn(),
    setPendingSyncCount: mockSetPendingSyncCount,
  });
}

beforeEach(() => {
  setMockOnlineStatus(true);
  vi.mocked(getQueueSize).mockReturnValue(0);
  vi.mocked(flushQueue).mockResolvedValue(0);
});

afterEach(() => {
  // Safety net: always restore real timers even if a test fails before its own cleanup
  vi.useRealTimers();
  vi.clearAllMocks();
  // Re-apply defaults after clearAllMocks wipes mockReturnValue/mockResolvedValue
  setMockOnlineStatus(true);
  vi.mocked(getQueueSize).mockReturnValue(0);
  vi.mocked(flushQueue).mockResolvedValue(0);
});

describe('useSyncIndicator', () => {
  describe('initial state', () => {
    it('returns isOnline from AppContext', () => {
      setMockOnlineStatus(true);
      const { result } = renderHook(() => useSyncIndicator());
      expect(result.current.isOnline).toBe(true);
    });

    it('returns isOnline=false when AppContext reports offline', () => {
      setMockOnlineStatus(false);
      const { result } = renderHook(() => useSyncIndicator());
      expect(result.current.isOnline).toBe(false);
    });

    it('returns syncStatus=idle initially', () => {
      const { result } = renderHook(() => useSyncIndicator());
      expect(result.current.syncStatus).toBe('idle');
    });

    it('returns pendingSyncCount from AppContext state', () => {
      setMockOnlineStatus(true, 5);
      const { result } = renderHook(() => useSyncIndicator());
      expect(result.current.pendingSyncCount).toBe(5);
    });

    it('hydrates pendingSyncCount on mount via getQueueSize', async () => {
      vi.mocked(getQueueSize).mockReturnValue(3);
      setMockOnlineStatus(false); // offline prevents startup flush — testing hydration only
      renderHook(() => useSyncIndicator());
      await waitFor(() => {
        expect(mockSetPendingSyncCount).toHaveBeenCalledWith(3);
      });
      expect(flushQueue).not.toHaveBeenCalled(); // hydration must not trigger flush
    });
  });

  describe('offline → online transition', () => {
    it('does NOT trigger flush when going online with empty queue', async () => {
      vi.mocked(getQueueSize).mockReturnValue(0);
      setMockOnlineStatus(false);
      const { rerender } = renderHook(() => useSyncIndicator());

      await act(async () => {
        setMockOnlineStatus(true);
        rerender();
      });

      expect(flushQueue).not.toHaveBeenCalled();
    });

    it('triggers flushQueue when going online with non-empty queue', async () => {
      vi.mocked(getQueueSize).mockReturnValue(3);
      vi.mocked(flushQueue).mockResolvedValue(3);

      setMockOnlineStatus(false);
      const { rerender } = renderHook(() => useSyncIndicator());

      await act(async () => {
        setMockOnlineStatus(true);
        rerender();
      });

      expect(flushQueue).toHaveBeenCalled();
    });

    it('sets syncStatus to syncing immediately when flush starts', () => {
      // triggerFlush calls setSyncStatus('syncing') synchronously before first await
      vi.mocked(getQueueSize).mockReturnValue(2);
      vi.mocked(flushQueue).mockResolvedValue(2);

      setMockOnlineStatus(false);
      const { result, rerender } = renderHook(() => useSyncIndicator());

      act(() => {
        setMockOnlineStatus(true);
        rerender();
      });

      expect(result.current.syncStatus).toBe('syncing');
    });

    it('transitions to complete after flush and then idle after 2s', async () => {
      vi.useFakeTimers();
      vi.mocked(getQueueSize).mockReturnValue(2);
      vi.mocked(flushQueue).mockResolvedValue(2);

      setMockOnlineStatus(false);
      const { result, rerender } = renderHook(() => useSyncIndicator());

      // Trigger offline → online
      act(() => {
        setMockOnlineStatus(true);
        rerender();
      });

      // setSyncStatus('syncing') is synchronous — should already be set
      expect(result.current.syncStatus).toBe('syncing');

      // Flush the flushQueue() promise continuation via microtasks
      await act(async () => {
        await Promise.resolve();
        await Promise.resolve();
      });

      expect(result.current.syncStatus).toBe('complete');

      // Advance 2000ms timer to trigger idle transition
      act(() => { vi.advanceTimersByTime(2000); });
      expect(result.current.syncStatus).toBe('idle');

      vi.useRealTimers(); // Explicit restore (afterEach also does this as safety net)
    });

    it('resets pendingSyncCount to 0 after successful flush', async () => {
      vi.mocked(getQueueSize).mockReturnValue(2);
      vi.mocked(flushQueue).mockResolvedValue(2);

      setMockOnlineStatus(false);
      const { rerender } = renderHook(() => useSyncIndicator());

      await act(async () => {
        setMockOnlineStatus(true);
        rerender();
      });

      await waitFor(() => {
        expect(mockSetPendingSyncCount).toHaveBeenCalledWith(0);
      });
    });

    it('handles flushQueue error gracefully and resets to idle', async () => {
      vi.mocked(getQueueSize).mockReturnValue(1);
      vi.mocked(flushQueue).mockRejectedValue(new Error('DB error'));

      setMockOnlineStatus(false);
      const { result, rerender } = renderHook(() => useSyncIndicator());

      await act(async () => {
        setMockOnlineStatus(true);
        rerender();
      });

      await waitFor(() => {
        expect(result.current.syncStatus).toBe('idle');
      });
      // setPendingSyncCount(0) should NOT be called on failure
      expect(mockSetPendingSyncCount).not.toHaveBeenCalledWith(0);
    });
  });

  describe('startup flush (app starts online with queued events)', () => {
    it('auto-flushes on mount when already online with events from previous offline session', async () => {
      vi.mocked(getQueueSize).mockReturnValue(3);
      vi.mocked(flushQueue).mockResolvedValue(3);
      setMockOnlineStatus(true);

      renderHook(() => useSyncIndicator());

      await waitFor(() => {
        expect(flushQueue).toHaveBeenCalled();
      });
    });

    it('does NOT flush on mount when online but queue is empty', async () => {
      vi.mocked(getQueueSize).mockReturnValue(0);
      setMockOnlineStatus(true);

      renderHook(() => useSyncIndicator());

      // Allow effects to settle
      await act(async () => { await Promise.resolve(); });

      expect(flushQueue).not.toHaveBeenCalled();
    });

    it('does NOT flush on mount when offline (even with queued events)', async () => {
      vi.mocked(getQueueSize).mockReturnValue(5);
      setMockOnlineStatus(false);

      renderHook(() => useSyncIndicator());

      await act(async () => { await Promise.resolve(); });

      expect(flushQueue).not.toHaveBeenCalled();
    });

    it('does NOT re-flush on subsequent online rerenders after initial mount flush', async () => {
      vi.mocked(getQueueSize).mockReturnValue(0); // empty queue — no startup flush
      setMockOnlineStatus(true);

      const { rerender } = renderHook(() => useSyncIndicator());

      // Rerender with same online status and non-empty queue — should not re-flush
      vi.mocked(getQueueSize).mockReturnValue(5);
      await act(async () => {
        setMockOnlineStatus(true);
        rerender();
      });

      expect(flushQueue).not.toHaveBeenCalled();
    });
  });
});
