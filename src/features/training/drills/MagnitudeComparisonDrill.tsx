/**
 * MagnitudeComparisonDrill Component
 * Trains numerical magnitude awareness — foundational for number sense.
 *
 * Shows two written numbers side by side.
 * User taps the larger one.
 * Easy: 1-20 range, big difference. Medium: 1-100, moderate. Hard: 1-1000, close values.
 */

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X } from 'lucide-react';
import { db } from '@/services/storage/db';
import { STORAGE_KEYS } from '@/services/storage/localStorage';
import type { DrillResult } from '@/services/storage/schemas';

export interface DrillProps {
  difficulty: 'easy' | 'medium' | 'hard';
  sessionId: number;
  onComplete: (result: DrillResult) => void;
  onSkip?: () => void;
}

interface ComparisonProblem {
  left: number;
  right: number;
  correctSide: 'left' | 'right';
}

/** Difficulty -> range and minimum difference between numbers */
const DIFFICULTY_CONFIG = {
  easy:   { min: 1, max: 20,   minDiff: 5,  maxDiff: 15  },
  medium: { min: 1, max: 100,  minDiff: 3,  maxDiff: 30  },
  hard:   { min: 1, max: 1000, minDiff: 1,  maxDiff: 10  },
} as const;

function generateComparisonProblem(difficulty: 'easy' | 'medium' | 'hard'): ComparisonProblem {
  const config = DIFFICULTY_CONFIG[difficulty];
  const range = config.max - config.min;

  // Generate first number
  const a = config.min + Math.floor(Math.random() * range);

  // Generate difference within configured bounds
  const diff = config.minDiff + Math.floor(Math.random() * (config.maxDiff - config.minDiff + 1));

  // Randomly add or subtract the difference, clamping to valid range
  const direction = Math.random() < 0.5 ? 1 : -1;
  let b = a + direction * diff;
  b = Math.max(config.min, Math.min(config.max, b));

  // Ensure they are never equal
  if (b === a) {
    b = a + config.minDiff <= config.max ? a + config.minDiff : a - config.minDiff;
  }

  // Randomly assign to left/right
  const leftIsLarger = Math.random() < 0.5;
  const left = leftIsLarger ? Math.max(a, b) : Math.min(a, b);
  const right = leftIsLarger ? Math.min(a, b) : Math.max(a, b);

  return {
    left,
    right,
    correctSide: left > right ? 'left' : 'right',
  };
}

export default function MagnitudeComparisonDrill({ difficulty, sessionId, onComplete }: DrillProps) {
  const [problem] = useState(() => generateComparisonProblem(difficulty));
  const { left, right, correctSide } = problem;

  const [submitted, setSubmitted] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [selectedSide, setSelectedSide] = useState<'left' | 'right' | null>(null);
  const [startTime] = useState(Date.now());
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const prefersReducedMotion = typeof window !== 'undefined'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  useEffect(() => {
    return () => {
      if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    };
  }, []);

  const handleSelect = async (side: 'left' | 'right') => {
    if (submitted) return;

    const correct = side === correctSide;
    const timeToAnswer = Date.now() - startTime;
    const userAnswer = side === 'left' ? left : right;
    const correctAnswer = correctSide === 'left' ? left : right;

    setSelectedSide(side);
    setIsCorrect(correct);
    setSubmitted(true);
    setShowFeedback(true);

    const result: DrillResult = {
      sessionId,
      timestamp: new Date().toISOString(),
      module: 'magnitude_comparison',
      difficulty,
      isCorrect: correct,
      timeToAnswer,
      accuracy: correct ? 100 : 0,
      targetNumber: correctAnswer,
      userAnswer,
      correctAnswer,
      problem: `${left} vs ${right}`,
    };

    // Persist to Dexie
    try {
      await db.drill_results.add(result);
    } catch (error) {
      console.error('Failed to persist drill result:', error);
      try {
        const backup = localStorage.getItem(STORAGE_KEYS.DRILL_RESULTS_BACKUP);
        const results = backup ? JSON.parse(backup) : [];
        results.push(result);
        localStorage.setItem(STORAGE_KEYS.DRILL_RESULTS_BACKUP, JSON.stringify(results));
      } catch {
        localStorage.setItem(STORAGE_KEYS.DRILL_RESULTS_BACKUP, JSON.stringify([result]));
      }
    }

    feedbackTimerRef.current = setTimeout(() => {
      onComplete(result);
    }, 1500);
  };

  const largerNumber = Math.max(left, right);

  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center bg-background p-6"
      role="application"
      aria-label="Magnitude comparison drill"
      data-testid="magnitude-comparison-drill"
    >
      <div className="w-full max-w-md space-y-8">
        {/* Problem display */}
        <div className="text-center">
          <p className="text-sm font-medium text-muted-foreground mb-2">Which is larger?</p>
          <h2
            className="text-2xl font-bold text-foreground"
            style={{ fontSize: 'clamp(20px, 5vw, 32px)' }}
            aria-live="polite"
            aria-atomic="true"
          >
            Tap the bigger number
          </h2>
        </div>

        {/* Two number buttons */}
        <div className="flex items-center justify-center gap-6">
          <motion.button
            whileTap={prefersReducedMotion ? undefined : { scale: 0.95 }}
            whileHover={prefersReducedMotion ? undefined : { scale: 1.03 }}
            onClick={() => handleSelect('left')}
            disabled={submitted}
            className={`flex h-32 w-32 items-center justify-center rounded-2xl border-4 font-bold transition-colors ${
              submitted
                ? selectedSide === 'left'
                  ? isCorrect
                    ? 'border-green-500 bg-green-500/20 text-green-500'
                    : 'border-yellow-500 bg-yellow-500/20 text-yellow-500'
                  : correctSide === 'left'
                    ? 'border-green-500 bg-green-500/10 text-green-500'
                    : 'border-border bg-card text-muted-foreground'
                : 'border-primary bg-card text-foreground hover:bg-primary/10'
            }`}
            style={{ fontSize: 'clamp(28px, 7vw, 48px)' }}
            data-testid="choice-left"
            aria-label={`Number ${left}`}
            type="button"
          >
            {left}
          </motion.button>

          <span
            className="text-xl font-medium text-muted-foreground"
            aria-hidden="true"
          >
            or
          </span>

          <motion.button
            whileTap={prefersReducedMotion ? undefined : { scale: 0.95 }}
            whileHover={prefersReducedMotion ? undefined : { scale: 1.03 }}
            onClick={() => handleSelect('right')}
            disabled={submitted}
            className={`flex h-32 w-32 items-center justify-center rounded-2xl border-4 font-bold transition-colors ${
              submitted
                ? selectedSide === 'right'
                  ? isCorrect
                    ? 'border-green-500 bg-green-500/20 text-green-500'
                    : 'border-yellow-500 bg-yellow-500/20 text-yellow-500'
                  : correctSide === 'right'
                    ? 'border-green-500 bg-green-500/10 text-green-500'
                    : 'border-border bg-card text-muted-foreground'
                : 'border-primary bg-card text-foreground hover:bg-primary/10'
            }`}
            style={{ fontSize: 'clamp(28px, 7vw, 48px)' }}
            data-testid="choice-right"
            aria-label={`Number ${right}`}
            type="button"
          >
            {right}
          </motion.button>
        </div>

        {/* Feedback */}
        <AnimatePresence>
          {showFeedback && (
            <motion.div
              initial={prefersReducedMotion ? { opacity: 0 } : { scale: 0, opacity: 0 }}
              animate={prefersReducedMotion ? { opacity: 1 } : { scale: 1, opacity: 1 }}
              exit={prefersReducedMotion ? { opacity: 0 } : { scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 flex items-center justify-center bg-background/80"
              role="alert"
              aria-live="assertive"
            >
              <div className="text-center">
                {isCorrect ? (
                  <>
                    <div className="mb-4 flex justify-center">
                      <Check className="h-24 w-24 text-green-500" aria-hidden="true" />
                    </div>
                    <p className="text-2xl font-bold text-green-500">
                      {largerNumber} is larger!
                    </p>
                    <p className="sr-only">Correct!</p>
                  </>
                ) : (
                  <>
                    <div className="mb-4 flex justify-center">
                      <X className="h-24 w-24 text-yellow-500" aria-hidden="true" />
                    </div>
                    <p className="text-lg font-medium text-foreground mb-1">
                      Not quite — keep going!
                    </p>
                    <p className="text-2xl font-semibold text-muted-foreground">
                      {largerNumber} is the larger number
                    </p>
                    <p className="sr-only">
                      The correct answer is {largerNumber}. {largerNumber} is greater than {Math.min(left, right)}.
                    </p>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
