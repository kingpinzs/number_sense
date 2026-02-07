/**
 * NumberLineDrill Component
 * Story 3.2: Number line placement drill for number sense training
 *
 * User places a marker on a number line to indicate where a target number belongs.
 * Provides visual feedback, calculates accuracy, and records drill results to Dexie.
 */

import { useState, useRef } from 'react';
import { motion, useMotionValue, useTransform, AnimatePresence } from 'framer-motion';
import { Button } from '@/shared/components/ui/button';
import { db } from '@/services/storage/db';
import { STORAGE_KEYS } from '@/services/storage/localStorage';
import type { DrillResult } from '@/services/storage/schemas';

/**
 * DrillProps interface per Epic 3 tech spec
 */
export interface DrillProps {
  difficulty: 'easy' | 'medium' | 'hard';
  sessionId: number;
  onComplete: (result: DrillResult) => void;
  onSkip?: () => void;  // Optional skip functionality (deferred to Epic 4)
}

/**
 * Number line drill configuration based on difficulty
 */
interface DrillConfig {
  range: { min: number; max: number };
  generateTarget: () => number;
}

const drillConfigs: Record<'easy' | 'medium' | 'hard', DrillConfig> = {
  easy: {
    range: { min: 0, max: 100 },
    generateTarget: () => Math.floor(Math.random() * 10) * 10, // Multiples of 10
  },
  medium: {
    range: { min: 0, max: 100 },
    generateTarget: () => Math.floor(Math.random() * 101), // Any number 0-100
  },
  hard: {
    range: { min: 0, max: 1000 },
    generateTarget: () => Math.floor(Math.random() * 1001), // Any number 0-1000
  },
};

export default function NumberLineDrill({ difficulty, sessionId, onComplete }: DrillProps) {
  const config = drillConfigs[difficulty];
  const { min, max } = config.range;
  const range = max - min;

  // State management
  const [targetNumber] = useState<number>(config.generateTarget());
  const [markerPosition, setMarkerPosition] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [startTime] = useState(Date.now());

  // Refs
  const lineRef = useRef<HTMLDivElement>(null);
  const markerRef = useRef<HTMLDivElement>(null);

  // Framer Motion values
  const markerX = useMotionValue(0);
  const markerValue = useTransform(markerX, (x) => {
    if (!lineRef.current) return min;
    const lineWidth = lineRef.current.offsetWidth;
    const percentage = x / lineWidth;
    return Math.round(min + percentage * range);
  });

  // Check for prefers-reduced-motion
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Calculate user answer from marker position
  const calculateAnswer = (): number => {
    if (!lineRef.current) return min;
    const lineWidth = lineRef.current.offsetWidth;
    const percentage = markerX.get() / lineWidth;
    return Math.round(min + percentage * range);
  };

  // Calculate accuracy percentage
  const calculateAccuracy = (userAnswer: number, target: number): number => {
    const error = Math.abs(userAnswer - target);
    const errorPercentage = (error / range) * 100;
    return Math.max(0, 100 - errorPercentage);
  };

  // Check if answer is within ±10% tolerance
  const isWithinTolerance = (userAnswer: number, target: number): boolean => {
    const tolerance = range * 0.1;
    return Math.abs(userAnswer - target) <= tolerance;
  };

  // Handle marker drag end
  const handleDragEnd = () => {
    const answer = calculateAnswer();
    setMarkerPosition(answer);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (submitted) return;

    const currentValue = markerValue.get();
    const step = range / 100; // 1% steps

    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      const newValue = Math.max(min, currentValue - step);
      const lineWidth = lineRef.current?.offsetWidth || 1;
      const newX = ((newValue - min) / range) * lineWidth;
      markerX.set(newX);
      setMarkerPosition(Math.round(newValue));
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      const newValue = Math.min(max, currentValue + step);
      const lineWidth = lineRef.current?.offsetWidth || 1;
      const newX = ((newValue - min) / range) * lineWidth;
      markerX.set(newX);
      setMarkerPosition(Math.round(newValue));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (markerPosition !== null) {
        handleSubmit();
      }
    }
  };

  // Handle submit
  const handleSubmit = async () => {
    if (submitted || markerPosition === null) return;

    const userAnswer = calculateAnswer();
    const accuracy = calculateAccuracy(userAnswer, targetNumber);
    const correct = isWithinTolerance(userAnswer, targetNumber);
    const timeToAnswer = Date.now() - startTime;

    setIsCorrect(correct);
    setSubmitted(true);
    setShowFeedback(true);

    // Create drill result
    const result: DrillResult = {
      sessionId,
      timestamp: new Date().toISOString(),
      module: 'number_line',
      difficulty,
      isCorrect: correct,
      timeToAnswer,
      accuracy,
      targetNumber,
      userAnswer,
      correctAnswer: targetNumber,
    };

    // Persist to Dexie with try-catch and localStorage fallback
    try {
      await db.drill_results.add(result);
    } catch (error) {
      console.error('Failed to persist drill result:', error);
      // Fallback to localStorage backup
      try {
        const backup = localStorage.getItem(STORAGE_KEYS.DRILL_RESULTS_BACKUP);
        const results = backup ? JSON.parse(backup) : [];
        results.push(result);
        localStorage.setItem(STORAGE_KEYS.DRILL_RESULTS_BACKUP, JSON.stringify(results));
      } catch {
        // localStorage backup also failed — reset to just this result
        localStorage.setItem(STORAGE_KEYS.DRILL_RESULTS_BACKUP, JSON.stringify([result]));
      }
    }

    // Auto-advance after 1.5 seconds
    setTimeout(() => {
      onComplete(result);
    }, 1500);
  };

  // Handle click on number line to position marker
  const handleLineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (submitted || !lineRef.current) return;

    const rect = lineRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const lineWidth = rect.width;
    const clampedX = Math.max(0, Math.min(lineWidth, clickX));

    markerX.set(clampedX);
    const answer = calculateAnswer();
    setMarkerPosition(answer);
  };

  // Calculate correct marker position for feedback
  const getCorrectMarkerPosition = (): number => {
    if (!lineRef.current) return 0;
    const lineWidth = lineRef.current.offsetWidth;
    return ((targetNumber - min) / range) * lineWidth;
  };

  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center bg-background p-6"
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="application"
      aria-label="Number line drill"
    >
      <div className="w-full max-w-4xl space-y-8">
        {/* Target number prompt */}
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-foreground" aria-live="polite">
            Where is <span className="text-primary">{targetNumber}</span>?
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Drag the marker or use arrow keys to place it on the number line
          </p>
        </div>

        {/* Number line container */}
        <div className="space-y-4">
          {/* Range labels */}
          <div className="flex justify-between text-lg font-medium text-foreground">
            <span>{min}</span>
            <span>{max}</span>
          </div>

          {/* Number line */}
          <div
            ref={lineRef}
            className="relative h-2 w-full cursor-pointer rounded-full bg-muted"
            onClick={handleLineClick}
            role="slider"
            aria-label="Number line from 0 to 100"
            aria-valuemin={min}
            aria-valuemax={max}
            aria-valuenow={markerPosition ?? min}
          >
            {/* Draggable marker */}
            <AnimatePresence>
              {!showFeedback && (
                <motion.div
                  ref={markerRef}
                  drag="x"
                  dragConstraints={lineRef}
                  dragElastic={0}
                  dragMomentum={false}
                  onDragEnd={handleDragEnd}
                  style={{ x: markerX }}
                  className="absolute top-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing"
                  whileTap={{ scale: 1.1 }}
                >
                  <div
                    className="flex h-11 w-11 items-center justify-center rounded-full bg-primary shadow-lg"
                    role="button"
                    aria-label={`Marker at position ${markerPosition ?? min}`}
                    tabIndex={0}
                  >
                    <span className="text-lg">🔴</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Feedback markers (shown after submit) */}
            {showFeedback && (
              <>
                {/* Correct position marker (gray) */}
                <div
                  className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2"
                  style={{ left: `${getCorrectMarkerPosition()}px` }}
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-muted-foreground shadow-lg">
                    <span className="text-lg">⚪</span>
                  </div>
                </div>

                {/* User's position marker (red, only if incorrect) */}
                {!isCorrect && (
                  <motion.div
                    className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2"
                    style={{ left: `${markerX.get()}px` }}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: prefersReducedMotion ? 0 : 0.3 }}
                  >
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-destructive shadow-lg">
                      <span className="text-lg">❌</span>
                    </div>
                  </motion.div>
                )}
              </>
            )}
          </div>

          {/* Current marker value display */}
          {markerPosition !== null && !submitted && (
            <div className="text-center text-sm text-muted-foreground">
              Current position: <span className="font-medium">{markerPosition}</span>
            </div>
          )}
        </div>

        {/* Feedback message */}
        <AnimatePresence>
          {showFeedback && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: prefersReducedMotion ? 0 : 0.5 }}
              className={`rounded-lg border p-4 text-center ${
                isCorrect
                  ? 'border-green-500 bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300'
                  : 'border-yellow-500 bg-yellow-50 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300'
              }`}
            >
              {isCorrect ? (
                <div>
                  <p className="text-lg font-semibold">✅ Correct!</p>
                  <p className="mt-1 text-sm">Great job placing {targetNumber}!</p>
                </div>
              ) : (
                <div>
                  <p className="text-lg font-semibold">Try again!</p>
                  <p className="mt-1 text-sm">
                    You placed it at {markerPosition}, but {targetNumber} is here ⚪
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Submit button */}
        <div className="flex justify-center">
          <Button
            onClick={handleSubmit}
            disabled={markerPosition === null || submitted}
            className="min-h-[44px] min-w-[120px]"
            size="lg"
          >
            Submit
          </Button>
        </div>

        {/* Keyboard navigation hint */}
        <div className="text-center text-xs text-muted-foreground">
          Press <kbd className="rounded bg-muted px-1">←</kbd> <kbd className="rounded bg-muted px-1">→</kbd> to move marker,{' '}
          <kbd className="rounded bg-muted px-1">Enter</kbd> to submit
        </div>
      </div>
    </div>
  );
}
