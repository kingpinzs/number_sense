import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useServiceWorker } from './useServiceWorker';
import { toast } from '@/shared/components/ui/toast';
import { useRegisterSW } from 'virtual:pwa-register/react';

vi.mock('virtual:pwa-register/react', () => ({
  useRegisterSW: vi.fn(() => ({
    offlineReady: [false, vi.fn()],
    needRefresh: [false, vi.fn()],
    updateServiceWorker: vi.fn(),
  })),
}));

vi.mock('@/shared/components/ui/toast', () => ({
  toast: vi.fn(),
}));

describe('useServiceWorker', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('initializes without error', () => {
    expect(() => renderHook(() => useServiceWorker())).not.toThrow();
  });

  it('shows update toast when needRefresh is true', async () => {
    vi.mocked(useRegisterSW).mockReturnValue({
      offlineReady: [false, vi.fn()],
      needRefresh: [true, vi.fn()],
      updateServiceWorker: vi.fn(),
    });

    renderHook(() => useServiceWorker());

    await waitFor(() => {
      expect(toast).toHaveBeenCalledWith(
        'New version available! Refresh to update.',
        expect.objectContaining({
          action: expect.objectContaining({ label: 'Refresh' }),
          duration: Infinity,
        })
      );
    });
  });

  it('refresh action calls updateServiceWorker(true)', async () => {
    const mockUpdate = vi.fn();
    vi.mocked(useRegisterSW).mockReturnValue({
      offlineReady: [false, vi.fn()],
      needRefresh: [true, vi.fn()],
      updateServiceWorker: mockUpdate,
    });

    renderHook(() => useServiceWorker());

    await waitFor(() => {
      expect(toast).toHaveBeenCalled();
    });

    const toastCall = vi.mocked(toast).mock.calls[0];
    const options = toastCall[1] as unknown as { action: { onClick: () => void } };
    options.action.onClick();

    expect(mockUpdate).toHaveBeenCalledWith(true);
  });

  it('shows offline ready toast when offlineReady is true', async () => {
    vi.mocked(useRegisterSW).mockReturnValue({
      offlineReady: [true, vi.fn()],
      needRefresh: [false, vi.fn()],
      updateServiceWorker: vi.fn(),
    });

    renderHook(() => useServiceWorker());

    await waitFor(() => {
      expect(toast).toHaveBeenCalledWith('App ready to work offline');
    });
  });

  it('does not show toast when both offlineReady and needRefresh are false', () => {
    vi.mocked(useRegisterSW).mockReturnValue({
      offlineReady: [false, vi.fn()],
      needRefresh: [false, vi.fn()],
      updateServiceWorker: vi.fn(),
    });

    renderHook(() => useServiceWorker());

    expect(toast).not.toHaveBeenCalled();
  });

  it('unmounts cleanly without errors', () => {
    vi.mocked(useRegisterSW).mockReturnValue({
      offlineReady: [false, vi.fn()],
      needRefresh: [false, vi.fn()],
      updateServiceWorker: vi.fn(),
    });

    const { unmount } = renderHook(() => useServiceWorker());

    expect(() => unmount()).not.toThrow();
  });

  it('shows both toasts when both offlineReady and needRefresh are true', async () => {
    vi.mocked(useRegisterSW).mockReturnValue({
      offlineReady: [true, vi.fn()],
      needRefresh: [true, vi.fn()],
      updateServiceWorker: vi.fn(),
    });

    renderHook(() => useServiceWorker());

    await waitFor(() => {
      expect(toast).toHaveBeenCalledTimes(2);
    });
    expect(toast).toHaveBeenCalledWith('App ready to work offline');
    expect(toast).toHaveBeenCalledWith(
      'New version available! Refresh to update.',
      expect.any(Object)
    );
  });

  it('does not show duplicate toasts on re-render with same state', async () => {
    const stableUpdate = vi.fn();
    vi.mocked(useRegisterSW).mockReturnValue({
      offlineReady: [false, vi.fn()],
      needRefresh: [true, vi.fn()],
      updateServiceWorker: stableUpdate,
    });

    const { rerender } = renderHook(() => useServiceWorker());

    await waitFor(() => {
      expect(toast).toHaveBeenCalledTimes(1);
    });

    rerender();

    expect(toast).toHaveBeenCalledTimes(1);
  });
});
