/**
 * MicroMathDrill Component
 * Story 4.3: Simplified math operations drill for Magic Minute
 *
 * Features:
 * - Only single-digit operations (e.g., 3 + 5, 9 - 4)
 * - Number keypad with larger buttons (50px minimum)
 * - Auto-submits after 2 digits typed (no explicit Submit)
 * - 8-second timeout
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/shared/components/ui/button';
import type { MicroChallengeResult, MicroMathParams } from '../types/microChallenge.types';
import { CHALLENGE_TIMEOUT_MS, MATH_AUTO_SUBMIT_DIGITS } from '../types/microChallenge.types';
import type { MistakeType } from '@/services/adaptiveDifficulty/mistakeAnalyzer';

export interface MicroMathDrillProps {
  /** Challenge ID */
  challengeId: string;
  /** Challenge parameters */
  params: MicroMathParams;
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

export default function MicroMathDrill({
  challengeId,
  params,
  targetMistakeType,
  onComplete,
}: MicroMathDrillProps) {
  const { problem, answer } = params;

  // State management
  const [userInput, setUserInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const startTime = useRef(Date.now());
  const reducedMotion = prefersReducedMotion();

  // Handle answer submission
  const handleSubmit = useCallback(
    (timedOut: boolean = false) => {
      if (isSubmitting) return;
      setIsSubmitting(true);

      const userAnswer = parseInt(userInput, 10);
      const correct = !isNaN(userAnswer) && userAnswer === answer;
      const timeToAnswer = Date.now() - startTime.current;

      const result: MicroChallengeResult = {
        correct,
        timeToAnswer,
        challengeId,
        challengeType: 'math',
        mistakeTypeTargeted: targetMistakeType,
        timedOut,
      };

      onComplete(result);
    },
    [isSubmitting, userInput, answer, challengeId, targetMistakeType, onComplete]
  );

  // Auto-submit after 2 digits typed (AC #4)
  useEffect(() => {
    if (userInput.length >= MATH_AUTO_SUBMIT_DIGITS && !isSubmitting) {
      // Small delay to show the input before submitting
      const timeout = setTimeout(() => {
        handleSubmit(false);
      }, 200);
      return () => clearTimeout(timeout);
    }
  }, [userInput, handleSubmit, isSubmitting]);

  // 8-second timeout (AC #8)
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (!isSubmitting) {
        handleSubmit(true);
      }
    }, CHALLENGE_TIMEOUT_MS);

    return () => clearTimeout(timeout);
  }, [handleSubmit, isSubmitting]);

  // Handle digit input
  const handleDigit = (digit: number) => {
    if (isSubmitting || userInput.length >= MATH_AUTO_SUBMIT_DIGITS) return;
    setUserInput((prev) => prev + digit.toString());
  };

  // Handle backspace
  const handleBackspace = () => {
    if (isSubmitting) return;
    setUserInput((prev) => prev.slice(0, -1));
  };

  // Handle keyboard input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isSubmitting) return;

      if (e.key >= '0' && e.key <= '9') {
        handleDigit(parseInt(e.key, 10));
      } else if (e.key === 'Backspace') {
        handleBackspace();
      } else if (e.key === 'Enter' && userInput.length > 0) {
        handleSubmit(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handleSubmit, isSubmitting, userInput]);

  // Keypad layout
  const keypadRows = [
    [1, 2, 3],
    [4, 5, 6],
    [7, 8, 9],
    ['⌫', 0, '✓'],
  ];

  return (
    <div
      className="flex flex-col items-center justify-center p-4"
      role="application"
      aria-label="Math micro-challenge"
    >
      {/* Problem display */}
      <motion.div
        className="mb-4 text-center"
        initial={reducedMotion ? {} : { opacity: 0, y: -10 }}
        animate={reducedMotion ? {} : { opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        <div className="text-4xl font-bold text-foreground mb-2">
          {problem} = <span className="text-[#E87461]">?</span>
        </div>
      </motion.div>

      {/* Answer display */}
      <div className="mb-4 w-full max-w-xs">
        <div
          className="h-14 flex items-center justify-center rounded-lg border-2 border-[#E87461] bg-white dark:bg-gray-800 text-3xl font-bold text-foreground"
          aria-live="polite"
          aria-label={`Your answer: ${userInput || 'empty'}`}
        >
          {userInput || (
            <span className="text-muted-foreground text-lg">Type answer...</span>
          )}
        </div>
      </div>

      {/* Number keypad with 50px minimum buttons (AC #4) */}
      <div className="grid grid-cols-3 gap-2 w-full max-w-xs">
        {keypadRows.map((row, rowIndex) =>
          row.map((key, colIndex) => {
            if (key === '⌫') {
              return (
                <Button
                  key={`${rowIndex}-${colIndex}`}
                  onClick={handleBackspace}
                  disabled={isSubmitting || userInput.length === 0}
                  className="min-h-[50px] min-w-[50px] text-xl font-bold"
                  variant="outline"
                  aria-label="Backspace"
                >
                  ⌫
                </Button>
              );
            } else if (key === '✓') {
              return (
                <Button
                  key={`${rowIndex}-${colIndex}`}
                  onClick={() => handleSubmit(false)}
                  disabled={isSubmitting || userInput.length === 0}
                  className="min-h-[50px] min-w-[50px] text-xl font-bold bg-green-600 hover:bg-green-700"
                  aria-label="Submit answer"
                >
                  ✓
                </Button>
              );
            } else {
              return (
                <Button
                  key={`${rowIndex}-${colIndex}`}
                  onClick={() => handleDigit(key as number)}
                  disabled={isSubmitting || userInput.length >= MATH_AUTO_SUBMIT_DIGITS}
                  className="min-h-[50px] min-w-[50px] text-2xl font-bold"
                  variant="secondary"
                >
                  {key}
                </Button>
              );
            }
          })
        )}
      </div>

      {/* Auto-submit hint */}
      <div className="mt-3 text-xs text-muted-foreground text-center">
        Auto-submits after {MATH_AUTO_SUBMIT_DIGITS} digits
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
