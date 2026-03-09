// SyncIndicator.tsx - Ambient connection & sync status indicator
// Story 7.4: Implement Ambient Sync Indicator
//
// Fixed top-right: z-30 (above page content, below modals at z-50)
// 4 states: online (green dot) | offline (amber + text) | syncing (blue pulse) | complete (checkmark)

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';
import { useSyncIndicator } from '@/services/pwa/useSyncIndicator';

type IndicatorState = 'online' | 'offline' | 'syncing' | 'complete';

function deriveState(isOnline: boolean, syncStatus: 'idle' | 'syncing' | 'complete'): IndicatorState {
  if (!isOnline) return 'offline';
  if (syncStatus === 'syncing') return 'syncing';
  if (syncStatus === 'complete') return 'complete';
  return 'online';
}

export function SyncIndicator() {
  const { isOnline, syncStatus } = useSyncIndicator();
  const shouldReduceMotion = useReducedMotion();
  const currentState = deriveState(isOnline, syncStatus);

  const textVariants = shouldReduceMotion
    ? {}
    : {
        initial: { opacity: 0, width: 0 },
        animate: { opacity: 1, width: 'auto' },
        exit: { opacity: 0, width: 0 },
      };

  const pulseAnimate = shouldReduceMotion ? {} : { scale: [1, 1.3, 1] };
  const pulseTransition = shouldReduceMotion
    ? {}
    : { duration: 1, repeat: Infinity, ease: 'easeInOut' as const };

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={
        currentState === 'online'
          ? 'Connected'
          : currentState === 'offline'
            ? 'Offline - data saved locally'
            : currentState === 'syncing'
              ? 'Syncing data'
              : 'Sync complete'
      }
      className="fixed top-4 right-4 z-30 flex items-center gap-2 rounded-full px-2 py-1 shadow-sm backdrop-blur-sm text-xs font-medium text-foreground border border-border"
      style={{ backgroundColor: 'var(--background, #fdfbf9)' }}
    >
      {currentState === 'online' && (
        <span className="w-4 h-4 rounded-full block" style={{ backgroundColor: 'var(--success, #66bb6a)' }} aria-hidden="true" />
      )}

      {currentState === 'offline' && (
        <>
          <span className="w-4 h-4 rounded-full block" style={{ backgroundColor: 'var(--warning, #ffb74d)' }} aria-hidden="true" />
          <AnimatePresence>
            <motion.span
              key="offline-text"
              className="whitespace-nowrap overflow-hidden"
              {...textVariants}
            >
              Offline - data saved locally
            </motion.span>
          </AnimatePresence>
        </>
      )}

      {currentState === 'syncing' && (
        <>
          <motion.span
            className="w-4 h-4 rounded-full block"
            aria-hidden="true"
            style={{ backgroundColor: 'var(--info, #42a5f5)' }}
            animate={pulseAnimate}
            transition={pulseTransition}
          />
          <AnimatePresence>
            <motion.span
              key="syncing-text"
              className="whitespace-nowrap overflow-hidden"
              {...textVariants}
            >
              Syncing...
            </motion.span>
          </AnimatePresence>
        </>
      )}

      {currentState === 'complete' && (
        <>
          <CheckCircle2 className="w-4 h-4" style={{ color: 'var(--success, #66bb6a)' }} aria-hidden="true" />
          <AnimatePresence>
            <motion.span
              key="complete-text"
              className="whitespace-nowrap overflow-hidden"
              {...textVariants}
            >
              Synced
            </motion.span>
          </AnimatePresence>
        </>
      )}
    </div>
  );
}
