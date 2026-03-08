import { useEffect, useRef, useState, useCallback } from 'react';
import { STORAGE_KEYS } from '@/services/storage/localStorage';
import { db } from '@/services/storage/db';

// BeforeInstallPromptEvent is not in the standard TypeScript lib — define it here
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
  prompt(): Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

function detectPlatform(): 'android' | 'desktop' {
  // TODO: Migrate to navigator.userAgentData when Safari supports it
  // Note: iOS branch removed — detectPlatform() is only called from triggerInstall(),
  // which requires deferredPrompt (never available on iOS where beforeinstallprompt
  // doesn't fire), so 'ios' was unreachable dead code.
  if (/Android/.test(navigator.userAgent)) return 'android';
  return 'desktop';
}

export function useInstallPrompt() {
  const deferredPrompt = useRef<BeforeInstallPromptEvent | null>(null);
  const [promptAvailable, setPromptAvailable] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [hasCompletedSession, setHasCompletedSession] = useState(false);
  const [sessionDismissed, setSessionDismissed] = useState(false);

  // Helpers — read directly from localStorage to avoid stale state
  const isInstalled = useCallback((): boolean => {
    if (typeof window === 'undefined') return true;
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as any).standalone === true ||
      localStorage.getItem(STORAGE_KEYS.PWA_INSTALLED) === 'true'
    );
  }, []);

  const getDismissCount = useCallback((): number => {
    const raw = localStorage.getItem(STORAGE_KEYS.PWA_INSTALL_DISMISSED_COUNT);
    return raw ? parseInt(raw, 10) : 0;
  }, []);

  // Listen for beforeinstallprompt (Chromium only)
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      deferredPrompt.current = e as BeforeInstallPromptEvent;
      setPromptAvailable(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  // Listen for appinstalled event — hide prompt permanently when app is installed
  useEffect(() => {
    const handler = () => {
      localStorage.setItem(STORAGE_KEYS.PWA_INSTALLED, 'true');
      setPromptAvailable(false);
      deferredPrompt.current = null;
    };
    window.addEventListener('appinstalled', handler);
    return () => window.removeEventListener('appinstalled', handler);
  }, []);

  // Check if user has completed at least one session
  useEffect(() => {
    db.sessions.count().then(count => setHasCompletedSession(count > 0));
  }, []);

  // Detect iOS — Safari doesn't support beforeinstallprompt, needs custom instructions
  useEffect(() => {
    // TODO: Migrate to navigator.userAgentData when Safari supports it
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(ios);
  }, []);

  const shouldShowPrompt =
    !sessionDismissed &&
    (promptAvailable || isIOS) &&
    !isInstalled() &&
    getDismissCount() < 3 &&
    hasCompletedSession;

  // triggerInstall — calls native browser install dialog (Chromium only)
  const triggerInstall = useCallback(async (): Promise<'accepted' | 'dismissed' | null> => {
    if (!deferredPrompt.current) return null;
    const result = await deferredPrompt.current.prompt();
    // prompt() can only be called once per event — null out the ref
    deferredPrompt.current = null;
    setPromptAvailable(false);

    if (result.outcome === 'accepted') {
      localStorage.setItem(STORAGE_KEYS.PWA_INSTALLED, 'true');
      // AC #9: Telemetry logging on successful install
      const dismissCount = getDismissCount();
      await db.telemetry_logs.add({
        timestamp: new Date().toISOString(),
        event: 'pwa_installed',
        module: 'pwa',
        data: { platform: detectPlatform(), promptShownCount: dismissCount + 1 },
        userId: 'local_user',
      });
    }

    return result.outcome;
  }, [getDismissCount]);

  // dismissPrompt — hides prompt for this session and increments persistent counter
  const dismissPrompt = useCallback(() => {
    const count = getDismissCount() + 1;
    localStorage.setItem(STORAGE_KEYS.PWA_INSTALL_DISMISSED_COUNT, String(count));
    setSessionDismissed(true);
  }, [getDismissCount]);

  return { shouldShowPrompt, isIOS, triggerInstall, dismissPrompt };
}
