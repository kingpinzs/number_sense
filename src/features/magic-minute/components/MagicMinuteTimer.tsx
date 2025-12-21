/**
 * MagicMinuteTimer Component
 * Story 4.2: Build Magic Minute Timer Component
 * Story 4.3: Extended with micro-challenge integration
 *
 * A 60-second countdown timer for Magic Minute micro-challenges.
 * Features:
 * - Full-screen overlay with coral accent color
 * - Large countdown display (72px font)
 * - Real-time "X correct" counter
 * - Pulsing border animation (Framer Motion)
 * - Celebration animation on completion
 * - WCAG 2.1 AA accessible (role="timer", aria-live)
 * - Micro-challenge generation and rendering (Story 4.3)
 * - Mid-session difficulty adaptation (Story 4.3)
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type {
  MagicMinuteTimerProps,
  MagicMinuteSummary,
} from '../types/magicMinute.types';
import { MAGIC_MINUTE_DURATION } from '../types/magicMinute.types';
import type { MicroChallenge, MicroChallengeResult, AdaptiveState } from '../types/microChallenge.types';
import {
  generateMicroChallenges,
  createAdaptiveState,
  updateAdaptiveState,
  applyDifficultyModifier,
} from '@/services/adaptiveDifficulty/microChallengeGenerator';
import MicroNumberLineDrill from './MicroNumberLineDrill';
import MicroSpatialDrill from './MicroSpatialDrill';
import MicroMathDrill from './MicroMathDrill';
import type { MicroNumberLineParams, MicroSpatialParams, MicroMathParams } from '../types/microChallenge.types';
import { completeMagicMinuteWithResults } from '../services/magicMinutePersistence';

/**
 * Check if user prefers reduced motion
 */
const prefersReducedMotion = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

/**
 * MagicMinuteTimer - 60-second countdown timer component
 *
 * @param props - Component props
 * @returns React component
 */
export default function MagicMinuteTimer({
  mistakePatterns,
  sessionId,
  onComplete,
  onChallengeComplete,
  renderChallenge,
  enableChallenges = true,
}: MagicMinuteTimerProps) {
  // Timer state
  const [timeLeft, setTimeLeft] = useState(MAGIC_MINUTE_DURATION);
  const [correctCount, setCorrectCount] = useState(0);
  const [totalChallenges, setTotalChallenges] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);

  // Micro-challenge state (Story 4.3)
  const [challenges, setChallenges] = useState<MicroChallenge[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [adaptiveState, setAdaptiveState] = useState<AdaptiveState>(createAdaptiveState);
  const challengeResults = useRef<MicroChallengeResult[]>([]);

  // Check for reduced motion preference
  const reducedMotion = useMemo(() => prefersReducedMotion(), []);

  // Generate challenges when component mounts (Story 4.3)
  useEffect(() => {
    if (enableChallenges && mistakePatterns.length > 0) {
      const generated = generateMicroChallenges(mistakePatterns, 12);
      setChallenges(generated);
    }
  }, [enableChallenges, mistakePatterns]);

  // Get current challenge with difficulty modifier applied
  const currentChallenge = useMemo(() => {
    if (challenges.length === 0 || currentIndex >= challenges.length) return null;
    return applyDifficultyModifier(challenges[currentIndex], adaptiveState.difficultyModifier);
  }, [challenges, currentIndex, adaptiveState.difficultyModifier]);

  // Store sessionId for persistence
  const sessionIdRef = useRef(sessionId);
  sessionIdRef.current = sessionId;

  // Focus trap ref
  const containerRef = useRef<HTMLDivElement>(null);

  // Focus trap effect - trap focus within overlay
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Store the previously focused element
    const previouslyFocused = document.activeElement as HTMLElement;

    // Focus the container when mounted
    container.focus();

    // Handle Tab key to trap focus
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        const focusableElements = container.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstFocusable = container;
        const lastFocusable = focusableElements.length > 0
          ? focusableElements[focusableElements.length - 1]
          : container;

        if (e.shiftKey && document.activeElement === firstFocusable) {
          e.preventDefault();
          lastFocusable.focus();
        } else if (!e.shiftKey && document.activeElement === lastFocusable) {
          e.preventDefault();
          firstFocusable.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      // Restore focus when unmounted
      if (previouslyFocused && typeof previouslyFocused.focus === 'function') {
        previouslyFocused.focus();
      }
    };
  }, []);

  // Extract targeted mistake types for summary
  const targetedMistakes = useMemo(
    () => mistakePatterns.map((p) => p.patternType),
    [mistakePatterns]
  );

  // Handle timer completion
  const handleComplete = useCallback(() => {
    if (isComplete) return;

    setIsComplete(true);
    setShowCelebration(true);

    const summary: MagicMinuteSummary = {
      totalChallenges,
      correctCount,
      successRate: totalChallenges > 0 ? correctCount / totalChallenges : 0,
      duration: (MAGIC_MINUTE_DURATION - timeLeft) * 1000, // Elapsed time in ms (0-60000)
      targetedMistakes,
    };

    // Persist Magic Minute session and results (Story 4.3 - AC #6)
    if (enableChallenges && challengeResults.current.length > 0) {
      completeMagicMinuteWithResults(
        sessionIdRef.current,
        summary,
        challengeResults.current
      ).catch((error) => {
        console.error('Failed to persist Magic Minute results:', error);
      });
    }

    // Delay callback slightly to show celebration
    setTimeout(() => {
      onComplete(summary);
    }, reducedMotion ? 0 : 1500);
  }, [
    isComplete,
    totalChallenges,
    correctCount,
    timeLeft,
    targetedMistakes,
    onComplete,
    reducedMotion,
    enableChallenges,
  ]);

  // Timer countdown effect
  useEffect(() => {
    if (timeLeft <= 0) {
      handleComplete();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, handleComplete]);

  // Handle challenge result (Story 4.3 integration)
  const handleChallengeResult = useCallback(
    (result: MicroChallengeResult) => {
      // Update counters
      setTotalChallenges((prev) => prev + 1);
      if (result.correct) {
        setCorrectCount((prev) => prev + 1);
      }

      // Update adaptive state for difficulty adjustment (AC #7)
      setAdaptiveState((prev) => updateAdaptiveState(prev, result.correct));

      // Store result for persistence
      challengeResults.current.push(result);

      // Advance to next challenge
      setCurrentIndex((prev) => prev + 1);

      // Notify parent
      onChallengeComplete?.(result);
    },
    [onChallengeComplete]
  );

  // Render the current micro-challenge
  const renderCurrentChallenge = useCallback(() => {
    if (!currentChallenge || isComplete) return null;

    // Use custom render prop if provided
    if (renderChallenge) {
      return renderChallenge({
        challenge: currentChallenge,
        onResult: handleChallengeResult,
        timeRemaining: timeLeft,
      });
    }

    // Default rendering based on challenge type
    switch (currentChallenge.type) {
      case 'number_line':
        return (
          <MicroNumberLineDrill
            challengeId={currentChallenge.id}
            params={currentChallenge.params as MicroNumberLineParams}
            targetMistakeType={currentChallenge.targetMistakeType}
            onComplete={handleChallengeResult}
            timeRemaining={timeLeft}
          />
        );
      case 'spatial':
        return (
          <MicroSpatialDrill
            challengeId={currentChallenge.id}
            params={currentChallenge.params as MicroSpatialParams}
            targetMistakeType={currentChallenge.targetMistakeType}
            onComplete={handleChallengeResult}
            timeRemaining={timeLeft}
          />
        );
      case 'math':
        return (
          <MicroMathDrill
            challengeId={currentChallenge.id}
            params={currentChallenge.params as MicroMathParams}
            targetMistakeType={currentChallenge.targetMistakeType}
            onComplete={handleChallengeResult}
            timeRemaining={timeLeft}
          />
        );
      default:
        return null;
    }
  }, [currentChallenge, isComplete, renderChallenge, handleChallengeResult, timeLeft]);

  // Pulsing border animation variants
  const pulseVariants = {
    initial: { boxShadow: '0 0 0 0 rgba(232, 116, 97, 0.4)' },
    animate: {
      boxShadow: [
        '0 0 0 0 rgba(232, 116, 97, 0.4)',
        '0 0 0 20px rgba(232, 116, 97, 0)',
        '0 0 0 0 rgba(232, 116, 97, 0)',
      ],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: 'easeInOut' as const,
      },
    },
  };

  // Celebration confetti particles
  const confettiColors = ['#E87461', '#FFD700', '#4CAF50', '#2196F3', '#9C27B0'];

  return (
    <div
      ref={containerRef}
      tabIndex={-1}
      data-testid="magic-minute-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 outline-none"
    >
      <motion.div
        className="relative flex flex-col items-center justify-center rounded-3xl bg-white p-8 shadow-2xl"
        style={{ minWidth: '320px', maxWidth: '400px' }}
        initial={reducedMotion ? {} : { opacity: 0, scale: 0.9 }}
        animate={reducedMotion ? {} : { opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        variants={reducedMotion ? undefined : pulseVariants}
      >
        {/* Pulsing border effect */}
        {!reducedMotion && !isComplete && (
          <motion.div
            className="absolute inset-0 rounded-3xl"
            variants={pulseVariants}
            initial="initial"
            animate="animate"
          />
        )}

        {/* Title */}
        <h2 className="mb-2 text-2xl font-bold text-gray-900">
          Magic Minute!
        </h2>

        {/* Instruction - only show when no challenge active */}
        {!currentChallenge && (
          <p className="mb-6 text-center text-sm text-gray-600">
            Quick challenges based on your recent mistakes
          </p>
        )}

        {/* Micro-challenge area (Story 4.3) */}
        {enableChallenges && currentChallenge && !isComplete && (
          <div className="mb-4 w-full">
            {renderCurrentChallenge()}
          </div>
        )}

        {/* Timer Display */}
        <div
          role="timer"
          aria-live="polite"
          aria-label={`${timeLeft} seconds remaining`}
          data-testid="countdown-display"
          className="mb-4 flex h-32 w-32 items-center justify-center rounded-full border-4 border-[#E87461]"
          style={{ color: '#E87461' }}
        >
          <span className="text-7xl font-bold tabular-nums">{timeLeft}</span>
        </div>

        {/* Correct Counter */}
        <div className="mb-4 text-xl font-semibold text-gray-700">
          <span className="text-[#E87461]">{correctCount}</span> correct
        </div>

        {/* Progress indicator */}
        <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
          <motion.div
            className="h-full bg-[#E87461]"
            initial={{ width: '100%' }}
            animate={{ width: `${(timeLeft / MAGIC_MINUTE_DURATION) * 100}%` }}
            transition={{ duration: 0.5, ease: 'linear' }}
          />
        </div>

        {/* Answer as many as you can text */}
        <p className="mt-4 text-center text-xs text-gray-500">
          Answer as many as you can!
        </p>

        {/* Celebration Animation */}
        <AnimatePresence>
          {showCelebration && !reducedMotion && (
            <>
              {/* Confetti particles */}
              {confettiColors.map((color, i) =>
                Array.from({ length: 8 }).map((_, j) => (
                  <motion.div
                    key={`confetti-${i}-${j}`}
                    className="absolute h-3 w-3 rounded-full"
                    style={{ backgroundColor: color }}
                    initial={{
                      x: 0,
                      y: 0,
                      opacity: 1,
                      scale: 1,
                    }}
                    animate={{
                      x: (Math.random() - 0.5) * 300,
                      y: (Math.random() - 0.5) * 300,
                      opacity: 0,
                      scale: 0,
                      rotate: Math.random() * 720,
                    }}
                    exit={{ opacity: 0 }}
                    transition={{
                      duration: 1.5,
                      delay: Math.random() * 0.3,
                      ease: 'easeOut',
                    }}
                  />
                ))
              )}

              {/* Completion message */}
              <motion.div
                className="absolute inset-0 flex items-center justify-center rounded-3xl bg-white/95"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                <div className="text-center">
                  <p className="text-4xl">🎉</p>
                  <p className="mt-2 text-xl font-bold text-[#E87461]">
                    Time's Up!
                  </p>
                  <p className="mt-1 text-gray-600">
                    {correctCount} out of {totalChallenges} correct
                  </p>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Simple completion message for reduced motion */}
        {showCelebration && reducedMotion && (
          <div className="absolute inset-0 flex items-center justify-center rounded-3xl bg-white/95">
            <div className="text-center">
              <p className="text-xl font-bold text-[#E87461]">Time's Up!</p>
              <p className="mt-1 text-gray-600">
                {correctCount} out of {totalChallenges} correct
              </p>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
