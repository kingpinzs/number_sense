// useSmartNotifications — React hook for intelligent training reminders
//
// On app open the hook:
//  1. Detects stale "pending" reminders and counts them as skips
//  2. Fires a reminder if the user is inside their notification window
//     and has not yet trained today
//  3. Analyses recent session history to find the optimal training hour and
//     suggests adjusting the scheduled time when the current hour collects
//     too many skips

import { useEffect, useRef, useState, useCallback } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { subDays } from 'date-fns';
import { Capacitor } from '@capacitor/core';
import { toast } from '@/shared/components/ui/toast';
import { db } from '@/services/storage/db';
import { useUserSettings } from '@/context/UserSettingsContext';
import {
  requestNotificationPermission,
  showBrowserNotification,
  analyzeOptimalHour,
  getAccuracyAtHour,
  recordSkipAtHour,
  shouldSuggestTimeChange,
  getNotificationLastShown,
  setNotificationLastShown,
  clearNotificationLastShown,
  wasShownToday,
  isWithinNotificationWindow,
  isStaleNotification,
  formatHour
} from './notificationScheduler';

const isNative = Capacitor.isNativePlatform();

/** Number of days of session history to analyse for the optimal-time suggestion */
const ANALYSIS_WINDOW_DAYS = 30;

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useSmartNotifications() {
  const { settings, updateSettings } = useUserSettings();
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>('default');

  // Guard: only run the on-open checks once per mount
  const openCheckDoneRef = useRef(false);

  // ── Sync permission state from browser ──────────────────────────────────────
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermissionStatus(Notification.permission);
    }
  }, []);

  // ── Query recent completed training sessions ─────────────────────────────────
  const recentSessions = useLiveQuery(
    () =>
      db.sessions
        .where('timestamp')
        .above(subDays(new Date(), ANALYSIS_WINDOW_DAYS).toISOString())
        .filter((s) => s.module === 'training' && s.completionStatus === 'completed')
        .toArray(),
    []
  );

  // ── On-open: skip detection + reminder ──────────────────────────────────────
  useEffect(() => {
    // Skip browser-specific logic on native apps (use OS notifications instead)
    if (isNative) return;
    if (!settings.notificationsEnabled) return;
    // Wait for session data to load
    if (recentSessions === undefined) return;
    // Only run once per mount
    if (openCheckDoneRef.current) return;
    openCheckDoneRef.current = true;

    const lastShown = getNotificationLastShown();

    // ── Step 1: Stale-notification skip detection ──────────────────────────────
    if (lastShown && isStaleNotification(2)) {
      const lastShownTime = new Date(lastShown);
      const hasSessionSince = recentSessions.some(
        (s) => new Date(s.timestamp) > lastShownTime
      );
      if (!hasSessionSince) {
        recordSkipAtHour(lastShownTime.getHours());
      }
      clearNotificationLastShown();
    }

    // ── Step 2: Show reminder if inside notification window ───────────────────
    if (!wasShownToday() && isWithinNotificationWindow(settings.notificationHour)) {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const hasTrainedToday = recentSessions.some(
        (s) => new Date(s.timestamp) >= todayStart
      );

      if (!hasTrainedToday) {
        const hour = settings.notificationHour;
        const accuracy = getAccuracyAtHour(recentSessions, hour);
        const highPerformance = accuracy !== null && accuracy >= 80;

        const title = 'Discalculas Training Reminder';
        let body: string;
        if (highPerformance) {
          body = `You score ${Math.round(accuracy!)}% at this time — don't skip your session!`;
        } else {
          const period = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';
          body = `Your ${period} training session is ready. Keep your streak going!`;
        }

        if ('Notification' in window && Notification.permission === 'granted') {
          showBrowserNotification(title, body);
        } else {
          toast(`⏰ ${body}`, { duration: 8000 });
        }

        setNotificationLastShown(new Date().toISOString());
      }
    }
  }, [recentSessions, settings.notificationsEnabled, settings.notificationHour]);

  // ── Smart-scheduling: suggest a better time ──────────────────────────────────
  useEffect(() => {
    if (!settings.notificationsEnabled) return;
    if (!settings.smartScheduling) return;
    if (!recentSessions || recentSessions.length === 0) return;

    const optimalHour = analyzeOptimalHour(recentSessions);
    if (optimalHour === null) return;
    if (optimalHour === settings.notificationHour) return;

    if (shouldSuggestTimeChange(settings.notificationHour)) {
      const period =
        optimalHour < 12 ? 'morning' : optimalHour < 17 ? 'afternoon' : 'evening';
      toast(
        `💡 You tend to perform better in the ${period} (${formatHour(optimalHour)}). Consider moving your reminder.`,
        {
          action: {
            label: 'Update',
            onClick: () => updateSettings({ notificationHour: optimalHour })
          },
          duration: 12000
        }
      );
    }
  // We intentionally run this only when session data changes, not when settings change
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recentSessions]);

  // ── Permission request helper ────────────────────────────────────────────────
  const requestPermission = useCallback(async () => {
    const permission = await requestNotificationPermission();
    setPermissionStatus(permission);
    return permission;
  }, []);

  return { permissionStatus, requestPermission };
}
