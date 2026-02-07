// StreakCounter - Display current streak with celebration animation
// Story 5.3: Enhanced with 60px flame, 48px number, "Day Streak" label,
// dimmed flame for 0, noSessions message, flame flicker animation

import { motion, useReducedMotion } from 'framer-motion';
import { useApp } from '@/context/AppContext';

export interface StreakCounterProps {
  /** Optional streak override - if not provided, reads from AppContext */
  streak?: number;
  /** If true, shows "Start your streak today!" instead of number */
  noSessions?: boolean;
  onTap?: () => void;
  className?: string;
}

/**
 * StreakCounter component displays the current streak count with a flame emoji
 * Reads streak from AppContext by default, or accepts streak prop override
 * Tapping/clicking triggers an optional callback and celebration animation
 */
export function StreakCounter({ streak: streakProp, noSessions = false, onTap, className = '' }: StreakCounterProps) {
  const { state } = useApp();
  const shouldReduceMotion = useReducedMotion();

  // Use prop if provided, otherwise read from context
  const streak = streakProp ?? state.streak;
  const isDimmed = streak === 0;

  const handleTap = () => {
    if (onTap) {
      onTap();
    }
  };

  return (
    <motion.button
      onClick={handleTap}
      whileTap={{ scale: 1.1 }}
      whileHover={{ scale: 1.05 }}
      transition={{ type: 'spring', stiffness: 300, damping: 15 }}
      className={`flex flex-col items-center gap-1 p-4 bg-transparent border-none cursor-pointer min-h-[44px] ${className}`}
      aria-label={`Current streak: ${streak} ${streak === 1 ? 'day' : 'days'}`}
    >
      <motion.div
        className={`text-6xl ${isDimmed ? 'opacity-30 grayscale' : ''}`}
        role="img"
        aria-label="Fire emoji"
        initial={{ scale: 1 }}
        animate={shouldReduceMotion ? {} : {
          scale: [1, 1.15, 1, 1.1, 1],
          rotate: [0, -5, 5, -3, 0],
        }}
        transition={{ duration: 1.5, ease: 'easeInOut' }}
      >
        🔥
      </motion.div>
      {noSessions ? (
        <div className="text-lg text-muted-foreground">
          Start your streak today!
        </div>
      ) : (
        <>
          <div className="text-5xl font-bold text-primary">
            {streak}
          </div>
          <div className="text-lg text-muted-foreground">
            Day Streak
          </div>
        </>
      )}
    </motion.button>
  );
}
