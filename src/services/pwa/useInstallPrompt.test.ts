import { describe, it, expect, vi, beforeEach, afterEach, beforeAll, afterAll } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useInstallPrompt } from './useInstallPrompt';
import { db } from '@/services/storage/db';

// Suppress React act() warnings from async effects (db.sessions.count) settling after unmount
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

// Mock Dexie db — session count and telemetry writes
vi.mock('@/services/storage/db', () => ({
  db: {
    sessions: { count: vi.fn().mockResolvedValue(1) },
    telemetry_logs: { add: vi.fn().mockResolvedValue(1) },
  },
}));

// localStorage mock
const mockStorage: Record<string, string> = {};

// matchMedia mock — default: not in standalone mode
const mockMatchMedia = vi.fn().mockReturnValue({
  matches: false,
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
});

function fireBeforeInstallPrompt() {
  const mockPromptResult = { outcome: 'accepted' as const };
  const event = Object.assign(new Event('beforeinstallprompt'), {
    preventDefault: vi.fn(),
    prompt: vi.fn().mockResolvedValue(mockPromptResult),
    userChoice: Promise.resolve(mockPromptResult),
    platforms: [],
  });
  window.dispatchEvent(event);
  return event;
}

beforeEach(() => {
  // Clear mock storage state
  Object.keys(mockStorage).forEach(k => delete mockStorage[k]);

  // Re-apply localStorage spies (use clearAllMocks per project-context.md pattern)
  vi.spyOn(Storage.prototype, 'getItem').mockImplementation(key => mockStorage[key] ?? null);
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation((key, val) => { mockStorage[key] = String(val); });

  // Re-apply db mocks (clearAllMocks clears mockResolvedValue — must re-set)
  vi.mocked(db.sessions.count).mockResolvedValue(1);
  vi.mocked(db.telemetry_logs.add).mockResolvedValue(1);

  // matchMedia: not in standalone mode by default
  Object.defineProperty(window, 'matchMedia', { value: mockMatchMedia, writable: true });
  mockMatchMedia.mockReturnValue({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() });

  // Reset userAgent to non-iOS
  Object.defineProperty(navigator, 'userAgent', {
    value: 'Mozilla/5.0 (Windows NT 10.0)',
    configurable: true,
    writable: true,
  });
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('useInstallPrompt', () => {
  it('initializes without error', () => {
    const { result } = renderHook(() => useInstallPrompt());
    expect(result.current).toBeDefined();
    expect(result.current.shouldShowPrompt).toBe(false);
    expect(result.current.isIOS).toBe(false);
    expect(typeof result.current.triggerInstall).toBe('function');
    expect(typeof result.current.dismissPrompt).toBe('function');
  });

  it('shouldShowPrompt is false when no beforeinstallprompt event fired', () => {
    const { result } = renderHook(() => useInstallPrompt());
    expect(result.current.shouldShowPrompt).toBe(false);
  });

  it('shouldShowPrompt is true after event fired and session completed', async () => {
    const { result } = renderHook(() => useInstallPrompt());

    act(() => { fireBeforeInstallPrompt(); });

    await waitFor(() => {
      expect(result.current.shouldShowPrompt).toBe(true);
    });
  });

  it('shouldShowPrompt is false when already in standalone mode', async () => {
    mockMatchMedia.mockReturnValue({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() });

    const { result } = renderHook(() => useInstallPrompt());
    act(() => { fireBeforeInstallPrompt(); });

    await waitFor(() => {
      expect(result.current.shouldShowPrompt).toBe(false);
    });
  });

  it('shouldShowPrompt is false when PWA_INSTALLED flag is set in localStorage', async () => {
    mockStorage['discalculas:pwaInstalled'] = 'true';

    const { result } = renderHook(() => useInstallPrompt());
    act(() => { fireBeforeInstallPrompt(); });

    await waitFor(() => {
      expect(result.current.shouldShowPrompt).toBe(false);
    });
  });

  it('shouldShowPrompt is false when no session completed yet', async () => {
    vi.mocked(db.sessions.count).mockResolvedValue(0);

    const { result } = renderHook(() => useInstallPrompt());
    act(() => { fireBeforeInstallPrompt(); });

    await waitFor(() => {
      // session count is 0 — timing gate prevents showing
      expect(result.current.shouldShowPrompt).toBe(false);
    });
  });

  it('dismissPrompt increments localStorage counter', () => {
    const { result } = renderHook(() => useInstallPrompt());

    act(() => { result.current.dismissPrompt(); });
    expect(mockStorage['discalculas:pwaInstallDismissedCount']).toBe('1');

    act(() => { result.current.dismissPrompt(); });
    expect(mockStorage['discalculas:pwaInstallDismissedCount']).toBe('2');
  });

  it('shouldShowPrompt becomes false immediately after dismissPrompt() is called', async () => {
    const { result } = renderHook(() => useInstallPrompt());

    act(() => { fireBeforeInstallPrompt(); });
    await waitFor(() => expect(result.current.shouldShowPrompt).toBe(true));

    act(() => { result.current.dismissPrompt(); });

    expect(result.current.shouldShowPrompt).toBe(false);
  });

  it('shouldShowPrompt is false after 3 dismissals', async () => {
    mockStorage['discalculas:pwaInstallDismissedCount'] = '3';

    const { result } = renderHook(() => useInstallPrompt());
    act(() => { fireBeforeInstallPrompt(); });

    await waitFor(() => {
      expect(result.current.shouldShowPrompt).toBe(false);
    });
  });

  it('triggerInstall calls native install dialog (evidenced by accepted outcome + installed flag)', async () => {
    const { result } = renderHook(() => useInstallPrompt());

    act(() => { fireBeforeInstallPrompt(); });
    await waitFor(() => expect(result.current.shouldShowPrompt).toBe(true));

    let outcome: 'accepted' | 'dismissed' | null = null;
    await act(async () => { outcome = await result.current.triggerInstall(); });

    // prompt() was called — the mock returns 'accepted' outcome
    expect(outcome).toBe('accepted');
    // Side effect: PWA_INSTALLED flag set on accepted outcome
    expect(mockStorage['discalculas:pwaInstalled']).toBe('true');
  });

  it('triggerInstall returns accepted outcome', async () => {
    const { result } = renderHook(() => useInstallPrompt());

    act(() => { fireBeforeInstallPrompt(); });
    await waitFor(() => expect(result.current.shouldShowPrompt).toBe(true));

    let outcome: string | null = null;
    await act(async () => { outcome = await result.current.triggerInstall(); });

    expect(outcome).toBe('accepted');
  });

  it('triggerInstall returns null when no deferred prompt is available', async () => {
    const { result } = renderHook(() => useInstallPrompt());
    // No beforeinstallprompt fired — deferredPrompt.current is null

    let outcome: 'accepted' | 'dismissed' | null = 'accepted';
    await act(async () => { outcome = await result.current.triggerInstall(); });

    expect(outcome).toBeNull();
  });

  it('triggerInstall sets PWA_INSTALLED flag on accepted outcome', async () => {
    const { result } = renderHook(() => useInstallPrompt());

    act(() => { fireBeforeInstallPrompt(); });
    await waitFor(() => expect(result.current.shouldShowPrompt).toBe(true));

    await act(async () => { await result.current.triggerInstall(); });

    expect(mockStorage['discalculas:pwaInstalled']).toBe('true');
  });

  it('iOS detection returns true for iPhone user agent', async () => {
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15',
      configurable: true,
      writable: true,
    });

    const { result } = renderHook(() => useInstallPrompt());

    await waitFor(() => {
      expect(result.current.isIOS).toBe(true);
    });
  });

  it('iOS detection returns false for Android user agent', async () => {
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (Linux; Android 12; Pixel 6) AppleWebKit/537.36',
      configurable: true,
      writable: true,
    });

    const { result } = renderHook(() => useInstallPrompt());

    await waitFor(() => {
      expect(result.current.isIOS).toBe(false);
    });
  });

  it('appinstalled event sets PWA_INSTALLED flag and hides prompt', async () => {
    const { result } = renderHook(() => useInstallPrompt());

    act(() => { fireBeforeInstallPrompt(); });
    await waitFor(() => expect(result.current.shouldShowPrompt).toBe(true));

    act(() => { window.dispatchEvent(new Event('appinstalled')); });

    await waitFor(() => {
      expect(mockStorage['discalculas:pwaInstalled']).toBe('true');
      expect(result.current.shouldShowPrompt).toBe(false);
    });
  });

  it('cleans up beforeinstallprompt listener on unmount', () => {
    const addSpy = vi.spyOn(window, 'addEventListener');
    const removeSpy = vi.spyOn(window, 'removeEventListener');

    const { unmount } = renderHook(() => useInstallPrompt());
    unmount();

    expect(addSpy).toHaveBeenCalledWith('beforeinstallprompt', expect.any(Function));
    expect(removeSpy).toHaveBeenCalledWith('beforeinstallprompt', expect.any(Function));
  });

  it('cleans up appinstalled listener on unmount', () => {
    const addSpy = vi.spyOn(window, 'addEventListener');
    const removeSpy = vi.spyOn(window, 'removeEventListener');

    const { unmount } = renderHook(() => useInstallPrompt());
    unmount();

    expect(addSpy).toHaveBeenCalledWith('appinstalled', expect.any(Function));
    expect(removeSpy).toHaveBeenCalledWith('appinstalled', expect.any(Function));
  });
});
