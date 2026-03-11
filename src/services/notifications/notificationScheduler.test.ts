// Tests for the smart notification scheduler pure functions
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  requestNotificationPermission,
  showBrowserNotification,
  analyzeOptimalHour,
  getAccuracyAtHour,
  recordSkipAtHour,
  getSkipCountForHour,
  getSkipHistory,
  shouldSuggestTimeChange,
  getNotificationLastShown,
  setNotificationLastShown,
  clearNotificationLastShown,
  wasShownToday,
  isStaleNotification,
  isWithinNotificationWindow,
  formatHour,
  clearNotificationData,
  MIN_SESSIONS_FOR_OPTIMAL,
  SKIPS_BEFORE_SUGGEST_CHANGE,
  NOTIFICATION_WINDOW_HOURS,
  type SessionSummary
} from './notificationScheduler';
import { STORAGE_KEYS } from '@/services/storage/localStorage';

// ─── Notification API mock ────────────────────────────────────────────────────

const mockNotificationConstructor = vi.fn();
let notificationPermission: NotificationPermission = 'default';
const mockRequestPermission = vi.fn(async () => notificationPermission);

function installNotificationMock() {
  // Build a constructor function with a dynamic `permission` getter so tests
  // can mutate `notificationPermission` and have it reflected immediately.
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
  notificationPermission = 'default';
  mockRequestPermission.mockImplementation(async () => notificationPermission);
  installNotificationMock();
});

afterEach(() => {
  localStorage.clear();
});

// ─── Constants ────────────────────────────────────────────────────────────────

describe('Constants', () => {
  it('MIN_SESSIONS_FOR_OPTIMAL is a positive integer', () => {
    expect(MIN_SESSIONS_FOR_OPTIMAL).toBeGreaterThan(0);
    expect(Number.isInteger(MIN_SESSIONS_FOR_OPTIMAL)).toBe(true);
  });

  it('SKIPS_BEFORE_SUGGEST_CHANGE is a positive integer', () => {
    expect(SKIPS_BEFORE_SUGGEST_CHANGE).toBeGreaterThan(0);
    expect(Number.isInteger(SKIPS_BEFORE_SUGGEST_CHANGE)).toBe(true);
  });

  it('NOTIFICATION_WINDOW_HOURS is a positive number', () => {
    expect(NOTIFICATION_WINDOW_HOURS).toBeGreaterThan(0);
  });
});

// ─── requestNotificationPermission ───────────────────────────────────────────

describe('requestNotificationPermission', () => {
  it('returns "denied" when Notification API is unavailable', async () => {
    const original = window.Notification;
    // @ts-expect-error intentionally removing the API
    delete window.Notification;
    const result = await requestNotificationPermission();
    expect(result).toBe('denied');
    window.Notification = original;
  });

  it('returns current permission without re-requesting when already "granted"', async () => {
    notificationPermission = 'granted';
    const result = await requestNotificationPermission();
    expect(result).toBe('granted');
    expect(mockRequestPermission).not.toHaveBeenCalled();
  });

  it('returns current permission without re-requesting when already "denied"', async () => {
    notificationPermission = 'denied';
    const result = await requestNotificationPermission();
    expect(result).toBe('denied');
    expect(mockRequestPermission).not.toHaveBeenCalled();
  });

  it('calls requestPermission when permission is "default"', async () => {
    notificationPermission = 'default';
    mockRequestPermission.mockResolvedValue('granted');
    const result = await requestNotificationPermission();
    expect(result).toBe('granted');
    expect(mockRequestPermission).toHaveBeenCalledOnce();
  });
});

// ─── showBrowserNotification ──────────────────────────────────────────────────

describe('showBrowserNotification', () => {
  it('does nothing when Notification API is unavailable', () => {
    const original = window.Notification;
    // @ts-expect-error intentionally removing the API
    delete window.Notification;
    expect(() => showBrowserNotification('Title', 'Body')).not.toThrow();
    window.Notification = original;
  });

  it('does nothing when permission is not "granted"', () => {
    notificationPermission = 'default';
    showBrowserNotification('Title', 'Body');
    expect(mockNotificationConstructor).not.toHaveBeenCalled();
  });

  it('creates a Notification when permission is "granted"', () => {
    notificationPermission = 'granted';
    showBrowserNotification('Title', 'Body');
    expect(mockNotificationConstructor).toHaveBeenCalledWith('Title', expect.objectContaining({ body: 'Body' }));
  });

  it('uses the default icon when none supplied', () => {
    notificationPermission = 'granted';
    showBrowserNotification('Title', 'Body');
    expect(mockNotificationConstructor).toHaveBeenCalledWith(
      'Title',
      expect.objectContaining({ icon: '/icons/icon-192.png' })
    );
  });

  it('uses a custom icon when supplied', () => {
    notificationPermission = 'granted';
    showBrowserNotification('Title', 'Body', { icon: '/custom.png' });
    expect(mockNotificationConstructor).toHaveBeenCalledWith(
      'Title',
      expect.objectContaining({ icon: '/custom.png' })
    );
  });

  it('does not throw if the Notification constructor throws', () => {
    notificationPermission = 'granted';
    mockNotificationConstructor.mockImplementationOnce(() => {
      throw new Error('sandbox error');
    });
    expect(() => showBrowserNotification('Title', 'Body')).not.toThrow();
  });
});

// ─── analyzeOptimalHour ───────────────────────────────────────────────────────

describe('analyzeOptimalHour', () => {
  function makeSession(hour: number, accuracy: number): SessionSummary {
    const d = new Date();
    d.setHours(hour, 0, 0, 0);
    return { timestamp: d.toISOString(), accuracy };
  }

  it('returns null when sessions array is empty', () => {
    expect(analyzeOptimalHour([])).toBeNull();
  });

  it('returns null when no hour bucket has enough sessions', () => {
    // Only 1 session at hour 9 — below MIN_SESSIONS_FOR_OPTIMAL (2)
    expect(analyzeOptimalHour([makeSession(9, 80)])).toBeNull();
  });

  it('returns null when sessions have no accuracy data', () => {
    const d = new Date();
    d.setHours(9);
    const sessions: SessionSummary[] = [
      { timestamp: d.toISOString() },
      { timestamp: d.toISOString() }
    ];
    expect(analyzeOptimalHour(sessions)).toBeNull();
  });

  it('returns the hour with the highest average accuracy', () => {
    const sessions: SessionSummary[] = [
      makeSession(9, 70),
      makeSession(9, 80),   // average 75 at hour 9
      makeSession(14, 90),
      makeSession(14, 95)   // average 92.5 at hour 14
    ];
    expect(analyzeOptimalHour(sessions)).toBe(14);
  });

  it('handles ties by returning the first best bucket encountered', () => {
    const sessions: SessionSummary[] = [
      makeSession(9, 90),
      makeSession(9, 90),
      makeSession(18, 90),
      makeSession(18, 90)
    ];
    // Both buckets average 90 — should return one of them (implementation detail)
    const result = analyzeOptimalHour(sessions);
    expect([9, 18]).toContain(result);
  });

  it('ignores sessions without accuracy', () => {
    const d9 = new Date(); d9.setHours(9);
    const d14 = new Date(); d14.setHours(14);
    const sessions: SessionSummary[] = [
      { timestamp: d9.toISOString(), accuracy: 80 },
      { timestamp: d9.toISOString() }, // no accuracy
      { timestamp: d14.toISOString(), accuracy: 95 },
      { timestamp: d14.toISOString(), accuracy: 90 }
    ];
    // hour 9 has only 1 valid accuracy entry → excluded
    // hour 14 has 2 → included
    expect(analyzeOptimalHour(sessions)).toBe(14);
  });
});

// ─── getAccuracyAtHour ────────────────────────────────────────────────────────

describe('getAccuracyAtHour', () => {
  function makeSession(hour: number, accuracy: number): SessionSummary {
    const d = new Date();
    d.setHours(hour, 0, 0, 0);
    return { timestamp: d.toISOString(), accuracy };
  }

  it('returns null when no sessions match the hour', () => {
    const sessions = [makeSession(10, 80), makeSession(10, 90)];
    expect(getAccuracyAtHour(sessions, 9)).toBeNull();
  });

  it('returns null when fewer than MIN_SESSIONS_FOR_OPTIMAL match', () => {
    expect(getAccuracyAtHour([makeSession(9, 80)], 9)).toBeNull();
  });

  it('returns the average accuracy when enough sessions exist', () => {
    const sessions = [makeSession(9, 70), makeSession(9, 90)];
    expect(getAccuracyAtHour(sessions, 9)).toBe(80);
  });

  it('handles sessions without accuracy gracefully', () => {
    const d = new Date(); d.setHours(9);
    const sessions: SessionSummary[] = [
      { timestamp: d.toISOString(), accuracy: 80 },
      { timestamp: d.toISOString() } // no accuracy
    ];
    // Only 1 valid session → below threshold
    expect(getAccuracyAtHour(sessions, 9)).toBeNull();
  });
});

// ─── Skip Tracking ────────────────────────────────────────────────────────────

describe('recordSkipAtHour / getSkipCountForHour / getSkipHistory', () => {
  it('returns 0 when no skips recorded', () => {
    expect(getSkipCountForHour(9)).toBe(0);
  });

  it('records a skip and returns count of 1', () => {
    recordSkipAtHour(9);
    expect(getSkipCountForHour(9)).toBe(1);
  });

  it('increments count on multiple skips at same hour', () => {
    recordSkipAtHour(9);
    recordSkipAtHour(9);
    recordSkipAtHour(9);
    expect(getSkipCountForHour(9)).toBe(3);
  });

  it('tracks different hours independently', () => {
    recordSkipAtHour(9);
    recordSkipAtHour(9);
    recordSkipAtHour(18);
    expect(getSkipCountForHour(9)).toBe(2);
    expect(getSkipCountForHour(18)).toBe(1);
  });

  it('returns empty array initially', () => {
    expect(getSkipHistory()).toEqual([]);
  });

  it('returns safe defaults for malformed data', () => {
    localStorage.setItem(STORAGE_KEYS.NOTIFICATION_SKIP_HISTORY, 'invalid-json');
    expect(getSkipHistory()).toEqual([]);
  });

  it('returns safe defaults for non-array data', () => {
    localStorage.setItem(STORAGE_KEYS.NOTIFICATION_SKIP_HISTORY, JSON.stringify({ hour: 9 }));
    expect(getSkipHistory()).toEqual([]);
  });
});

describe('shouldSuggestTimeChange', () => {
  it('returns false when below skip threshold', () => {
    for (let i = 0; i < SKIPS_BEFORE_SUGGEST_CHANGE - 1; i++) {
      recordSkipAtHour(9);
    }
    expect(shouldSuggestTimeChange(9)).toBe(false);
  });

  it('returns true when at skip threshold', () => {
    for (let i = 0; i < SKIPS_BEFORE_SUGGEST_CHANGE; i++) {
      recordSkipAtHour(9);
    }
    expect(shouldSuggestTimeChange(9)).toBe(true);
  });

  it('returns false for hours with no skips', () => {
    expect(shouldSuggestTimeChange(14)).toBe(false);
  });
});

// ─── Last-Shown Tracking ──────────────────────────────────────────────────────

describe('getNotificationLastShown / setNotificationLastShown / clearNotificationLastShown', () => {
  it('returns null when nothing stored', () => {
    expect(getNotificationLastShown()).toBeNull();
  });

  it('stores and retrieves an ISO timestamp', () => {
    const ts = '2025-01-15T09:00:00.000Z';
    setNotificationLastShown(ts);
    expect(getNotificationLastShown()).toBe(ts);
  });

  it('clears the stored timestamp', () => {
    setNotificationLastShown(new Date().toISOString());
    clearNotificationLastShown();
    expect(getNotificationLastShown()).toBeNull();
  });
});

describe('wasShownToday', () => {
  it('returns false when nothing stored', () => {
    expect(wasShownToday()).toBe(false);
  });

  it('returns true when last-shown is today', () => {
    setNotificationLastShown(new Date().toISOString());
    expect(wasShownToday()).toBe(true);
  });

  it('returns false when last-shown was yesterday', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    setNotificationLastShown(yesterday.toISOString());
    expect(wasShownToday()).toBe(false);
  });
});

describe('isStaleNotification', () => {
  it('returns false when nothing stored', () => {
    expect(isStaleNotification()).toBe(false);
  });

  it('returns false when notification was recent (< threshold)', () => {
    // Set timestamp 1 hour ago — default threshold is 2 hours
    const recent = new Date(Date.now() - 60 * 60 * 1000);
    setNotificationLastShown(recent.toISOString());
    expect(isStaleNotification(2)).toBe(false);
  });

  it('returns true when notification is older than threshold', () => {
    const stale = new Date(Date.now() - 3 * 60 * 60 * 1000); // 3 hours ago
    setNotificationLastShown(stale.toISOString());
    expect(isStaleNotification(2)).toBe(true);
  });
});

// ─── isWithinNotificationWindow ───────────────────────────────────────────────

describe('isWithinNotificationWindow', () => {
  it('returns true when current hour equals scheduled hour', () => {
    expect(isWithinNotificationWindow(9, 9)).toBe(true);
  });

  it('returns true when within window (scheduled ± NOTIFICATION_WINDOW_HOURS)', () => {
    expect(isWithinNotificationWindow(9, 8)).toBe(true);
    expect(isWithinNotificationWindow(9, 10)).toBe(true);
  });

  it('returns false when outside window', () => {
    expect(isWithinNotificationWindow(9, 6)).toBe(false);
    expect(isWithinNotificationWindow(9, 14)).toBe(false);
  });
});

// ─── formatHour ───────────────────────────────────────────────────────────────

describe('formatHour', () => {
  it('formats midnight (0) as "12:00 AM"', () => {
    expect(formatHour(0)).toBe('12:00 AM');
  });

  it('formats noon (12) as "12:00 PM"', () => {
    expect(formatHour(12)).toBe('12:00 PM');
  });

  it('formats 9 as "9:00 AM"', () => {
    expect(formatHour(9)).toBe('9:00 AM');
  });

  it('formats 18 as "6:00 PM"', () => {
    expect(formatHour(18)).toBe('6:00 PM');
  });

  it('formats 23 as "11:00 PM"', () => {
    expect(formatHour(23)).toBe('11:00 PM');
  });
});

// ─── clearNotificationData ────────────────────────────────────────────────────

describe('clearNotificationData', () => {
  it('removes skip history and last-shown timestamp from localStorage', () => {
    recordSkipAtHour(9);
    setNotificationLastShown(new Date().toISOString());

    clearNotificationData();

    expect(getSkipHistory()).toEqual([]);
    expect(getNotificationLastShown()).toBeNull();
  });
});
