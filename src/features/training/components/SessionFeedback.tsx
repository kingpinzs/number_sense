// SessionFeedback - Correct/incorrect feedback with animations and sound
// Story 3.5: Build Drill Session UI Components
// Shows visual feedback, streak pulse animation, and plays success sound

import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useUserSettings } from '@/context/UserSettingsContext';
import { Check, X } from 'lucide-react';

export interface SessionFeedbackProps {
  isCorrect: boolean;
  correctAnswer?: string | number;
  showStreakPulse?: boolean;
}

/**
 * SessionFeedback component
 *
 * AC: Shows feedback for correct/incorrect answers
 * - Correct: Green checkmark ✓, "+1" floating animation
 * - Incorrect: Red X ✗, show correct answer
 * - Streak pulse: Flame 🔥 pulses when correct (showStreakPulse=true)
 * - Success sound via Web Audio API (respects soundEnabled setting)
 * - Animations respect prefers-reduced-motion
 *
 * @param isCorrect - Whether the answer was correct
 * @param correctAnswer - The correct answer (shown if incorrect)
 * @param showStreakPulse - Whether to show streak flame pulse animation
 */
export default function SessionFeedback({ isCorrect, correctAnswer, showStreakPulse }: SessionFeedbackProps) {
  const { settings } = useUserSettings();
  const audioContextRef = useRef<AudioContext | null>(null);

  // Play success sound on correct answer
  useEffect(() => {
    if (isCorrect && settings.soundEnabled) {
      playSuccessSound();
    }
    // Cleanup audio context on unmount
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
    };
  }, [isCorrect, settings.soundEnabled]);

  /**
   * Play success sound using Web Audio API
   * Creates a simple beep tone (523.25 Hz = C5)
   */
  const playSuccessSound = () => {
    try {
      // Create audio context if needed
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }

      const ctx = audioContextRef.current;
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      // Success sound: C5 note (523.25 Hz)
      oscillator.frequency.value = 523.25;
      oscillator.type = 'sine';

      // Volume envelope: fade in/out
      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.01);
      gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.15);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.15);
    } catch (error) {
      console.error('Failed to play success sound:', error);
    }
  };

  return (
    <div
      className="flex flex-col items-center justify-center gap-4 py-8"
      data-testid="session-feedback"
      role="alert"
      aria-live="polite"
    >
      {/* Correct feedback */}
      {isCorrect && (
        <>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            className="flex items-center justify-center w-20 h-20 rounded-full bg-green-100"
          >
            <Check className="w-12 h-12 text-green-600" strokeWidth={3} />
          </motion.div>

          {/* "+1" floating animation */}
          <motion.div
            initial={{ opacity: 0, y: 0 }}
            animate={{ opacity: [0, 1, 0], y: -30 }}
            transition={{ duration: 1 }}
            className="text-2xl font-bold text-green-600"
            aria-hidden="true"
          >
            +1
          </motion.div>

          {/* Streak pulse (if applicable) */}
          {showStreakPulse && (
            <motion.div
              animate={{
                scale: [1, 1.3, 1],
              }}
              transition={{
                duration: 0.5,
                repeat: 1,
              }}
              className="text-4xl"
              role="img"
              aria-label="Streak continues"
            >
              🔥
            </motion.div>
          )}
        </>
      )}

      {/* Incorrect feedback */}
      {!isCorrect && (
        <>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            className="flex items-center justify-center w-20 h-20 rounded-full bg-yellow-100"
          >
            <X className="w-12 h-12 text-yellow-600" strokeWidth={3} />
          </motion.div>

          {/* Encouragement message */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-base font-medium text-foreground"
          >
            Almost there — keep going!
          </motion.p>

          {/* Show correct answer */}
          {correctAnswer !== undefined && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-sm text-muted-foreground"
            >
              The answer was <span className="font-semibold text-foreground">{correctAnswer}</span>
            </motion.div>
          )}
        </>
      )}
    </div>
  );
}
