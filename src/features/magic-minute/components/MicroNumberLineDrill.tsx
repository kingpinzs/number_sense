/**
 * MicroNumberLineDrill Component
 * Story 4.3: Simplified number line drill for Magic Minute
 *
 * Features:
 * - Smaller range: 0-50 (vs 0-100 in regular drill)
 * - Larger tolerance: ±15% (vs ±10% in regular drill)
 * - Auto-submit after 2 seconds idle (no Submit button)
 * - Pre-positioned marker at 0
 * - Optimized for time-pressured 60-second sprints
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import type { MicroChallengeResult } from '../types/microChallenge.types';
import type { MicroNumberLineParams } from '../types/microChallenge.types';
import { NUMBER_LINE_AUTO_SUBMIT_MS, CHALLENGE_TIMEOUT_MS } from '../types/microChallenge.types';
import type { MistakeType } from '@/services/adaptiveDifficulty/mistakeAnalyzer';

export interface MicroNumberLineDrillProps {
  /** Challenge ID */
  challengeId: string;
  /** Challenge parameters */
  params: MicroNumberLineParams;
  /** Mistake type this challenge targets */
  targetMistakeType: MistakeType;
  /** Callback when challenge completes */
  onComplete: (result: MicroChallengeResult) => void;
  /** Remaining time in the overall Magic Minute */
  timeRemaining: number;
}

export default function MicroNumberLineDrill({
  challengeId,
  params,
  targetMistakeType,
  onComplete,
}: MicroNumberLineDrillProps) {
  const { target, range, tolerance } = params;
  const rangeSize = range.max - range.min;

  // State management
  const [hasInteracted, setHasInteracted] = useState(false);
  const [lastMoveTime, setLastMoveTime] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const startTime = useRef(Date.now());

  // Refs
  const lineRef = useRef<HTMLDivElement>(null);

  // Framer Motion values - start at 0 position
  const markerX = useMotionValue(0);
  const markerValue = useTransform(markerX, (x) => {
    if (!lineRef.current) return range.min;
    const lineWidth = lineRef.current.offsetWidth;
    if (lineWidth === 0) return range.min;
    const percentage = x / lineWidth;
    return Math.round(range.min + percentage * rangeSize);
  });

  // Calculate user answer from marker position
  const calculateAnswer = useCallback((): number => {
    if (!lineRef.current) return range.min;
    const lineWidth = lineRef.current.offsetWidth;
    if (lineWidth === 0) return range.min;
    const percentage = markerX.get() / lineWidth;
    return Math.round(range.min + percentage * rangeSize);
  }, [markerX, range.min, rangeSize]);

  // Check if answer is within tolerance
  const isWithinTolerance = useCallback(
    (userAnswer: number): boolean => {
      const toleranceAmount = rangeSize * tolerance;
      return Math.abs(userAnswer - target) <= toleranceAmount;
    },
    [rangeSize, tolerance, target]
  );

  // Handle submission
  const handleSubmit = useCallback(
    (timedOut: boolean = false) => {
      if (isSubmitting) return;
      setIsSubmitting(true);

      const userAnswer = calculateAnswer();
      const correct = isWithinTolerance(userAnswer);
      const timeToAnswer = Date.now() - startTime.current;

      const result: MicroChallengeResult = {
        correct,
        timeToAnswer,
        challengeId,
        challengeType: 'number_line',
        mistakeTypeTargeted: targetMistakeType,
        timedOut,
      };

      onComplete(result);
    },
    [calculateAnswer, isWithinTolerance, challengeId, targetMistakeType, onComplete, isSubmitting]
  );

  // Auto-submit after 2 seconds of no movement (AC #2)
  useEffect(() => {
    if (!hasInteracted || lastMoveTime === null || isSubmitting) return;

    const timeout = setTimeout(() => {
      const timeSinceMove = Date.now() - lastMoveTime;
      if (timeSinceMove >= NUMBER_LINE_AUTO_SUBMIT_MS) {
        handleSubmit(false);
      }
    }, NUMBER_LINE_AUTO_SUBMIT_MS);

    return () => clearTimeout(timeout);
  }, [lastMoveTime, hasInteracted, handleSubmit, isSubmitting]);

  // 8-second timeout (AC #8)
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (!isSubmitting) {
        handleSubmit(true);
      }
    }, CHALLENGE_TIMEOUT_MS);

    return () => clearTimeout(timeout);
  }, [handleSubmit, isSubmitting]);

  // Handle marker drag
  const handleDrag = () => {
    if (!hasInteracted) setHasInteracted(true);
    setLastMoveTime(Date.now());
  };

  // Handle click on number line
  const handleLineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isSubmitting || !lineRef.current) return;

    const rect = lineRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const lineWidth = rect.width;
    const clampedX = Math.max(0, Math.min(lineWidth, clickX));

    markerX.set(clampedX);
    if (!hasInteracted) setHasInteracted(true);
    setLastMoveTime(Date.now());
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (isSubmitting) return;

    const currentValue = markerValue.get();
    const step = rangeSize / 50; // 2% steps for faster navigation

    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      const newValue = Math.max(range.min, currentValue - step);
      const lineWidth = lineRef.current?.offsetWidth || 1;
      const newX = ((newValue - range.min) / rangeSize) * lineWidth;
      markerX.set(newX);
      if (!hasInteracted) setHasInteracted(true);
      setLastMoveTime(Date.now());
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      const newValue = Math.min(range.max, currentValue + step);
      const lineWidth = lineRef.current?.offsetWidth || 1;
      const newX = ((newValue - range.min) / rangeSize) * lineWidth;
      markerX.set(newX);
      if (!hasInteracted) setHasInteracted(true);
      setLastMoveTime(Date.now());
    }
  };

  return (
    <div
      className="flex flex-col items-center justify-center p-4"
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="application"
      aria-label="Number line micro-challenge"
    >
      {/* Target number prompt */}
      <div className="mb-4 text-center">
        <h3 className="text-xl font-semibold text-foreground">
          Place <span className="text-[#E87461] text-2xl font-bold">{target}</span>
        </h3>
      </div>

      {/* Number line container */}
      <div className="w-full max-w-xs space-y-2">
        {/* Range labels */}
        <div className="flex justify-between text-sm font-medium text-foreground">
          <span>{range.min}</span>
          <span>{range.max}</span>
        </div>

        {/* Number line */}
        <div
          ref={lineRef}
          className="relative h-3 w-full cursor-pointer rounded-full bg-muted"
          onClick={handleLineClick}
          role="slider"
          aria-label={`Number line from ${range.min} to ${range.max}`}
          aria-valuemin={range.min}
          aria-valuemax={range.max}
          aria-valuenow={Math.round(markerValue.get())}
        >
          {/* Draggable marker */}
          <motion.div
            drag="x"
            dragConstraints={lineRef}
            dragElastic={0}
            dragMomentum={false}
            onDrag={handleDrag}
            style={{ x: markerX }}
            className="absolute top-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing"
            whileTap={{ scale: 1.1 }}
          >
            <div
              className="flex h-10 w-10 items-center justify-center rounded-full bg-[#E87461] shadow-lg"
              role="button"
              aria-label={`Marker at position ${Math.round(markerValue.get())}`}
              tabIndex={0}
            >
              <span className="text-white font-bold">{Math.round(markerValue.get())}</span>
            </div>
          </motion.div>
        </div>

        {/* Auto-submit hint */}
        <div className="text-center text-xs text-muted-foreground">
          {hasInteracted ? 'Release to auto-submit...' : 'Drag marker to position'}
        </div>
      </div>

      {/* Timeout indicator */}
      <motion.div
        className="mt-4 h-1 w-full max-w-xs rounded-full bg-gray-200 overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <motion.div
          className="h-full bg-[#E87461]"
          initial={{ width: '100%' }}
          animate={{ width: '0%' }}
          transition={{ duration: CHALLENGE_TIMEOUT_MS / 1000, ease: 'linear' }}
        />
      </motion.div>
    </div>
  );
}
