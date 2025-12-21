// StreakCounter - Display current streak with celebration animation
// Reads streak from AppContext by default, or accepts streak prop override

import { motion } from 'framer-motion';
import { useApp } from '@/context/AppContext';

export interface StreakCounterProps {
  /** Optional streak override - if not provided, reads from AppContext */
  streak?: number;
  onTap?: () => void;
  className?: string;
}

/**
 * StreakCounter component displays the current streak count with a flame emoji
 * Reads streak from AppContext by default, or accepts streak prop override
 * Tapping/clicking triggers an optional callback and celebration animation
 *
 * @example
 * // Using AppContext (default)
 * <StreakCounter onTap={() => console.log('Tapped!')} />
 *
 * @example
 * // With explicit streak prop
 * <StreakCounter streak={7} onTap={() => console.log('Tapped!')} />
 */
export function StreakCounter({ streak: streakProp, onTap, className = '' }: StreakCounterProps) {
  const { state } = useApp();

  // Use prop if provided, otherwise read from context
  const streak = streakProp ?? state.streak;
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
      className={`flex flex-col items-center gap-1 p-4 bg-transparent border-none cursor-pointer ${className}`}
      aria-label={`Current streak: ${streak} ${streak === 1 ? 'day' : 'days'}`}
    >
      <div className="text-4xl" role="img" aria-label="Fire emoji">
        🔥
      </div>
      <div className="text-2xl font-bold text-primary">
        {streak}
      </div>
      <div className="text-sm text-muted-foreground">
        {streak === 1 ? 'Day' : 'Days'}
      </div>
    </motion.button>
  );
}
