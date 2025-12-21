/**
 * MicroSpatialDrill Component
 * Story 4.3: Simplified spatial rotation drill for Magic Minute
 *
 * Features:
 * - Only asymmetric shapes: lshape and tshape
 * - Only 90° or 180° rotations (no 270°, no mirroring)
 * - Two large buttons: "Same" or "Different"
 * - No text input required
 * - 8-second timeout
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/shared/components/ui/button';
import { SHAPES, rotateShape } from '@/features/training/content/shapes';
import type { MicroChallengeResult, MicroSpatialParams } from '../types/microChallenge.types';
import { CHALLENGE_TIMEOUT_MS } from '../types/microChallenge.types';
import type { MistakeType } from '@/services/adaptiveDifficulty/mistakeAnalyzer';

export interface MicroSpatialDrillProps {
  /** Challenge ID */
  challengeId: string;
  /** Challenge parameters */
  params: MicroSpatialParams;
  /** Mistake type this challenge targets */
  targetMistakeType: MistakeType;
  /** Callback when challenge completes */
  onComplete: (result: MicroChallengeResult) => void;
  /** Remaining time in the overall Magic Minute */
  timeRemaining: number;
}

/**
 * Check if user prefers reduced motion
 */
const prefersReducedMotion = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

export default function MicroSpatialDrill({
  challengeId,
  params,
  targetMistakeType,
  onComplete,
}: MicroSpatialDrillProps) {
  const { shape, rotation, isSame } = params;

  // State management
  const [isSubmitting, setIsSubmitting] = useState(false);
  const startTime = useRef(Date.now());
  const reducedMotion = prefersReducedMotion();

  // Get the shape component
  const ShapeComponent = SHAPES[shape];

  // Handle answer submission
  const handleAnswer = useCallback(
    (userSaysame: boolean, timedOut: boolean = false) => {
      if (isSubmitting) return;
      setIsSubmitting(true);

      const correct = userSaysame === isSame;
      const timeToAnswer = Date.now() - startTime.current;

      const result: MicroChallengeResult = {
        correct,
        timeToAnswer,
        challengeId,
        challengeType: 'spatial',
        mistakeTypeTargeted: targetMistakeType,
        timedOut,
      };

      onComplete(result);
    },
    [isSubmitting, isSame, challengeId, targetMistakeType, onComplete]
  );

  // 8-second timeout (AC #8)
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (!isSubmitting) {
        // On timeout, mark as incorrect
        handleAnswer(false, true);
      }
    }, CHALLENGE_TIMEOUT_MS);

    return () => clearTimeout(timeout);
  }, [handleAnswer, isSubmitting]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isSubmitting) return;
      if (e.key === 's' || e.key === 'S' || e.key === '1') {
        handleAnswer(true);
      } else if (e.key === 'd' || e.key === 'D' || e.key === '2') {
        handleAnswer(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleAnswer, isSubmitting]);

  // Calculate the second shape's rotation
  // If isSame is true, apply the same rotation (they match)
  // If isSame is false, apply a different rotation (they don't match)
  const secondRotation = isSame ? rotation : (rotation === 90 ? 180 : 90);

  return (
    <div
      className="flex flex-col items-center justify-center p-4"
      role="application"
      aria-label="Spatial rotation micro-challenge"
    >
      {/* Question prompt */}
      <div className="mb-4 text-center">
        <h3 className="text-xl font-semibold text-foreground">
          Are these the <span className="text-[#E87461]">same</span>?
        </h3>
      </div>

      {/* Shape comparison */}
      <div className="flex items-center justify-center gap-6 mb-6">
        {/* Original shape */}
        <motion.div
          className="w-20 h-20 text-gray-800 dark:text-gray-200"
          initial={reducedMotion ? {} : { opacity: 0, scale: 0.8 }}
          animate={reducedMotion ? {} : { opacity: 1, scale: 1 }}
          transition={{ duration: 0.2 }}
        >
          <ShapeComponent className="w-full h-full" />
        </motion.div>

        {/* Comparison indicator */}
        <div className="text-2xl text-muted-foreground">=?</div>

        {/* Rotated shape */}
        <motion.div
          className="w-20 h-20 text-gray-800 dark:text-gray-200"
          initial={reducedMotion ? {} : { opacity: 0, scale: 0.8 }}
          animate={reducedMotion ? {} : { opacity: 1, scale: 1 }}
          transition={{ duration: 0.2, delay: 0.1 }}
        >
          <ShapeComponent
            className="w-full h-full"
            style={rotateShape(secondRotation)}
          />
        </motion.div>
      </div>

      {/* Answer buttons - Large for easy tapping (AC #3) */}
      <div className="flex gap-4 w-full max-w-xs">
        <Button
          onClick={() => handleAnswer(true)}
          disabled={isSubmitting}
          className="flex-1 min-h-[60px] text-xl font-bold bg-green-600 hover:bg-green-700"
          aria-label="Same - shapes are identical after rotation"
        >
          Same
        </Button>
        <Button
          onClick={() => handleAnswer(false)}
          disabled={isSubmitting}
          className="flex-1 min-h-[60px] text-xl font-bold bg-red-600 hover:bg-red-700"
          aria-label="Different - shapes are not identical"
        >
          Different
        </Button>
      </div>

      {/* Keyboard hint */}
      <div className="mt-3 text-xs text-muted-foreground text-center">
        Press <kbd className="rounded bg-muted px-1">S</kbd> for Same,{' '}
        <kbd className="rounded bg-muted px-1">D</kbd> for Different
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
