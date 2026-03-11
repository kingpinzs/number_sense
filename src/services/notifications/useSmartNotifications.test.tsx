// Tests for useSmartNotifications hook
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSmartNotifications } from './useSmartNotifications';
import * as scheduler from './notificationScheduler';

// ─── Module mocks ─────────────────────────────────────────────────────────────

// Mock dexie-react-hooks to avoid IndexedDB in unit tests
vi.mock('dexie-react-hooks', () => ({
  useLiveQuery: vi.fn(() => [])
}));

// Mock Capacitor (non-native in tests)
vi.mock('@capacitor/core', () => ({
  Capacitor: { isNativePlatform: () => false }
}));

// Mock toast
const mockToast = vi.fn();
vi.mock('@/shared/components/ui/toast', () => ({
  toast: (msg: string, opts?: unknown) => mockToast(msg, opts)
}));

// Mock UserSettingsContext
const mockUpdateSettings = vi.fn();
let mockSettings = {
  notificationsEnabled: false,
  notificationHour: 9,
  smartScheduling: true
};

vi.mock('@/context/UserSettingsContext', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/context/UserSettingsContext')>();
  return {
    ...actual,
    useUserSettings: () => ({
      settings: mockSettings,
      updateSettings: mockUpdateSettings
    })
  };
});

// Mock db (not used in unit tests — useLiveQuery is mocked)
vi.mock('@/services/storage/db', () => ({
  db: {
    sessions: { where: vi.fn() }
  }
}));

// ─── Setup ────────────────────────────────────────────────────────────────────

const { useLiveQuery } = await import('dexie-react-hooks');
const mockUseLiveQuery = vi.mocked(useLiveQuery);

const mockNotificationConstructor = vi.fn();
let notificationPermission: NotificationPermission = 'default';
const mockRequestPermission = vi.fn(async () => notificationPermission);

function installNotificationMock() {
  function MockNotification(title: string, opts: unknown) {
    mockNotificationConstructor(title, opts);
  }
  Object.defineProperty(MockNotification, 'permission', {
    get: () => notificationPermission,
    configurable: true
  });
  (MockNotification as any).requestPermission = mockRequestPermission;
  Object.defineProperty(window, 'Notification', {
    value: MockNotification,
    configurable: true,
    writable: true
  });
}

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();

  mockSettings = {
    notificationsEnabled: false,
    notificationHour: 9,
    smartScheduling: true
  };

  notificationPermission = 'default';
  mockRequestPermission.mockImplementation(async () => notificationPermission);
  installNotificationMock();

  // Default: sessions loaded (empty array)
  mockUseLiveQuery.mockReturnValue([]);
});

afterEach(() => {
  localStorage.clear();
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('useSmartNotifications — initial state', () => {
  it('returns permissionStatus and requestPermission', () => {
    const { result } = renderHook(() => useSmartNotifications());
    expect(result.current).toHaveProperty('permissionStatus');
    expect(result.current).toHaveProperty('requestPermission');
  });

  it('reflects the current Notification.permission', () => {
    notificationPermission = 'granted';
    installNotificationMock();
    const { result } = renderHook(() => useSmartNotifications());
    expect(result.current.permissionStatus).toBe('granted');
  });

  it('returns "default" when Notification API is unavailable', () => {
    const original = window.Notification;
    // @ts-expect-error intentionally removing the API
    delete window.Notification;
    const { result } = renderHook(() => useSmartNotifications());
    expect(result.current.permissionStatus).toBe('default');
    window.Notification = original;
  });
});

describe('useSmartNotifications — requestPermission', () => {
  it('calls requestNotificationPermission and updates state', async () => {
    notificationPermission = 'default';
    mockRequestPermission.mockImplementation(async () => {
      notificationPermission = 'granted';
      return 'granted';
    });

    const { result } = renderHook(() => useSmartNotifications());

    let permission: NotificationPermission = 'default';
    await act(async () => {
      permission = await result.current.requestPermission();
    });

    expect(permission).toBe('granted');
    expect(result.current.permissionStatus).toBe('granted');
  });
});

describe('useSmartNotifications — no reminder when disabled', () => {
  it('does not show a reminder when notificationsEnabled is false', () => {
    mockSettings.notificationsEnabled = false;
    mockUseLiveQuery.mockReturnValue([]);

    renderHook(() => useSmartNotifications());

    expect(mockToast).not.toHaveBeenCalled();
    expect(mockNotificationConstructor).not.toHaveBeenCalled();
  });
});

describe('useSmartNotifications — reminder logic', () => {
  it('shows a toast reminder when inside notification window and no session today', () => {
    mockSettings.notificationsEnabled = true;
    mockSettings.notificationHour = new Date().getHours(); // schedule for now

    mockUseLiveQuery.mockReturnValue([]); // no sessions → haven't trained today

    renderHook(() => useSmartNotifications());

    // A toast should have been shown (browser notification is mocked as default permission)
    expect(mockToast).toHaveBeenCalledOnce();
    expect(mockToast.mock.calls[0][0]).toMatch(/session/i);
  });

  it('shows a browser notification when permission is granted', () => {
    notificationPermission = 'granted';
    installNotificationMock();
    mockSettings.notificationsEnabled = true;
    mockSettings.notificationHour = new Date().getHours();

    mockUseLiveQuery.mockReturnValue([]);

    renderHook(() => useSmartNotifications());

    expect(mockNotificationConstructor).toHaveBeenCalledOnce();
    expect(mockToast).not.toHaveBeenCalled();
  });

  it('does NOT show a reminder when user already trained today', () => {
    mockSettings.notificationsEnabled = true;
    mockSettings.notificationHour = new Date().getHours();

    const todaySession = {
      timestamp: new Date().toISOString(),
      accuracy: 85,
      module: 'training',
      completionStatus: 'completed'
    };
    mockUseLiveQuery.mockReturnValue([todaySession]);

    renderHook(() => useSmartNotifications());

    expect(mockToast).not.toHaveBeenCalled();
    expect(mockNotificationConstructor).not.toHaveBeenCalled();
  });

  it('does NOT show a reminder when already shown today', () => {
    mockSettings.notificationsEnabled = true;
    mockSettings.notificationHour = new Date().getHours();

    // Mark as shown today
    scheduler.setNotificationLastShown(new Date().toISOString());

    mockUseLiveQuery.mockReturnValue([]);

    renderHook(() => useSmartNotifications());

    expect(mockToast).not.toHaveBeenCalled();
  });

  it('records the notification shown timestamp after showing', () => {
    mockSettings.notificationsEnabled = true;
    mockSettings.notificationHour = new Date().getHours();
    mockUseLiveQuery.mockReturnValue([]);

    renderHook(() => useSmartNotifications());

    expect(scheduler.wasShownToday()).toBe(true);
  });

  it('does NOT show reminder when outside notification window', () => {
    mockSettings.notificationsEnabled = true;
    // Schedule 6 hours away from now to guarantee out-of-window
    const farHour = (new Date().getHours() + 6) % 24;
    mockSettings.notificationHour = farHour;

    mockUseLiveQuery.mockReturnValue([]);

    renderHook(() => useSmartNotifications());

    expect(mockToast).not.toHaveBeenCalled();
  });

  it('shows a high-performance message when accuracy >= 80 at scheduled hour', () => {
    notificationPermission = 'granted';
    installNotificationMock();
    mockSettings.notificationsEnabled = true;
    mockSettings.notificationHour = new Date().getHours();

    // Two sessions at current hour with high accuracy (yesterday, not today)
    const hour = new Date().getHours();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(hour, 0, 0, 0);

    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    twoDaysAgo.setHours(hour, 0, 0, 0);

    mockUseLiveQuery.mockReturnValue([
      { timestamp: yesterday.toISOString(), accuracy: 90, module: 'training', completionStatus: 'completed' },
      { timestamp: twoDaysAgo.toISOString(), accuracy: 85, module: 'training', completionStatus: 'completed' }
    ]);

    renderHook(() => useSmartNotifications());

    // Should show browser notification with high-performance message
    expect(mockNotificationConstructor).toHaveBeenCalledOnce();
    const [, opts] = mockNotificationConstructor.mock.calls[0];
    expect(opts.body).toMatch(/\d+%/); // should mention accuracy
  });
});

describe('useSmartNotifications — skip detection', () => {
  it('records a skip when a stale notification was shown and no session since', () => {
    mockSettings.notificationsEnabled = true;
    const staleTime = new Date(Date.now() - 3 * 60 * 60 * 1000); // 3 hours ago
    scheduler.setNotificationLastShown(staleTime.toISOString());

    // No sessions after the notification
    mockUseLiveQuery.mockReturnValue([]);

    renderHook(() => useSmartNotifications());

    expect(scheduler.getSkipCountForHour(staleTime.getHours())).toBe(1);
  });

  it('does NOT record a skip when user trained after the notification', () => {
    mockSettings.notificationsEnabled = true;
    const staleTime = new Date(Date.now() - 3 * 60 * 60 * 1000);
    scheduler.setNotificationLastShown(staleTime.toISOString());

    // Session happened after notification
    mockUseLiveQuery.mockReturnValue([
      { timestamp: new Date().toISOString(), accuracy: 80 }
    ]);

    renderHook(() => useSmartNotifications());

    expect(scheduler.getSkipCountForHour(staleTime.getHours())).toBe(0);
  });

  it('clears the last-shown record after processing a stale notification', () => {
    mockSettings.notificationsEnabled = true;
    const staleTime = new Date(Date.now() - 3 * 60 * 60 * 1000);
    scheduler.setNotificationLastShown(staleTime.toISOString());
    mockUseLiveQuery.mockReturnValue([]);

    renderHook(() => useSmartNotifications());

    // Last shown should be cleared after processing
    expect(scheduler.getNotificationLastShown()).toBeNull();
  });
});

describe('useSmartNotifications — smart scheduling suggestions', () => {
  it('suggests a better time when skip threshold is reached and optimal hour differs', () => {
    mockSettings.notificationsEnabled = true;
    mockSettings.smartScheduling = true;
    mockSettings.notificationHour = 9; // current scheduled hour

    // Record enough skips at hour 9
    for (let i = 0; i < scheduler.SKIPS_BEFORE_SUGGEST_CHANGE; i++) {
      scheduler.recordSkipAtHour(9);
    }

    // Sessions with better performance at hour 14
    const makeSession = (hour: number, acc: number) => {
      const d = new Date();
      d.setDate(d.getDate() - 2);
      d.setHours(hour, 0, 0, 0);
      return { timestamp: d.toISOString(), accuracy: acc };
    };

    mockUseLiveQuery.mockReturnValue([
      makeSession(14, 90),
      makeSession(14, 95)
    ]);

    renderHook(() => useSmartNotifications());

    expect(mockToast).toHaveBeenCalledWith(
      expect.stringContaining('perform better'),
      expect.anything()
    );
  });

  it('does NOT suggest a better time when smart scheduling is disabled', () => {
    mockSettings.notificationsEnabled = true;
    mockSettings.smartScheduling = false;
    mockSettings.notificationHour = 9;

    for (let i = 0; i < scheduler.SKIPS_BEFORE_SUGGEST_CHANGE; i++) {
      scheduler.recordSkipAtHour(9);
    }

    const makeSession = (hour: number, acc: number) => {
      const d = new Date();
      d.setDate(d.getDate() - 2);
      d.setHours(hour, 0, 0, 0);
      return { timestamp: d.toISOString(), accuracy: acc };
    };

    mockUseLiveQuery.mockReturnValue([makeSession(14, 90), makeSession(14, 95)]);

    renderHook(() => useSmartNotifications());

    // No suggestion toast expected (reminder toast might fire but not the suggestion)
    const suggestionCalls = mockToast.mock.calls.filter(([msg]) =>
      typeof msg === 'string' && msg.includes('perform better')
    );
    expect(suggestionCalls).toHaveLength(0);
  });

  it('does NOT suggest a time change when optimal hour equals current hour', () => {
    mockSettings.notificationsEnabled = true;
    mockSettings.smartScheduling = true;
    mockSettings.notificationHour = 9;

    for (let i = 0; i < scheduler.SKIPS_BEFORE_SUGGEST_CHANGE; i++) {
      scheduler.recordSkipAtHour(9);
    }

    // Best performance is already at hour 9
    const makeSession = (hour: number, acc: number) => {
      const d = new Date();
      d.setDate(d.getDate() - 2);
      d.setHours(hour, 0, 0, 0);
      return { timestamp: d.toISOString(), accuracy: acc };
    };

    mockUseLiveQuery.mockReturnValue([makeSession(9, 90), makeSession(9, 95)]);

    renderHook(() => useSmartNotifications());

    const suggestionCalls = mockToast.mock.calls.filter(([msg]) =>
      typeof msg === 'string' && msg.includes('perform better')
    );
    expect(suggestionCalls).toHaveLength(0);
  });
});
