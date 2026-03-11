// Notifications service — public API
export {
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
  NOTIFICATION_WINDOW_HOURS
} from './notificationScheduler';

export type { SkipEntry, SessionSummary } from './notificationScheduler';

export { useSmartNotifications } from './useSmartNotifications';
