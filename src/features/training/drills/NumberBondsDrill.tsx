/**
 * NumberBondsDrill Component
 * Trains part-whole number relationships — critical for arithmetic fluency.
 *
 * Shows a number decomposed into two parts with one part missing.
 * User must find the missing part (e.g., 10 = 7 + ?).
 * Visual bar model available at lower difficulty levels.
 */

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X } from 'lucide-react';
import { NumberKeypad } from '@/shared/components/NumberKeypad';
import { db } from '@/services/storage/db';
import { STORAGE_KEYS } from '@/services/storage/localStorage';
import type { DrillResult } from '@/services/storage/schemas';

export interface DrillProps {
  difficulty: 'easy' | 'medium' | 'hard';
  sessionId: number;
  onComplete: (result: DrillResult) => void;
  onSkip?: () => void;
}

interface BondProblem {
  targetSum: number;
  knownPart: number;
  missingPart: number;
  showVisual: boolean;
}

/** Difficulty → target sum range and visual hint */
const DIFFICULTY_CONFIG = {
  easy:   { minSum: 5,  maxSum: 10,  showVisual: true },
  medium: { minSum: 10, maxSum: 20,  showVisual: false },
  hard:   { minSum: 20, maxSum: 100, showVisual: false },
} as const;

function generateBondProblem(difficulty: 'easy' | 'medium' | 'hard'): BondProblem {
  const config = DIFFICULTY_CONFIG[difficulty];
  const targetSum = config.minSum + Math.floor(
    Math.random() * (config.maxSum - config.minSum + 1)
  );
  // Ensure knownPart is between 1 and targetSum - 1 (never 0 or the whole)
  const knownPart = 1 + Math.floor(Math.random() * (targetSum - 1));
  const missingPart = targetSum - knownPart;

  return { targetSum, knownPart, missingPart, showVisual: config.showVisual };
}

export default function NumberBondsDrill({ difficulty, sessionId, onComplete }: DrillProps) {
  const [problem] = useState(() => generateBondProblem(difficulty));
  const { targetSum, knownPart, missingPart, showVisual } = problem;

  const [userInput, setUserInput] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
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

  const handleSubmit = async () => {
    if (submitted || userInput === '') return;

    const userAnswer = parseInt(userInput, 10);
    const correct = userAnswer === missingPart;
    const timeToAnswer = Date.now() - startTime;

    setIsCorrect(correct);
    setSubmitted(true);
    setShowFeedback(true);

    const result: DrillResult = {
      sessionId,
      timestamp: new Date().toISOString(),
      module: 'number_bonds',
      difficulty,
      isCorrect: correct,
      timeToAnswer,
      accuracy: correct ? 100 : 0,
      targetNumber: targetSum,
      userAnswer,
      correctAnswer: missingPart,
      problem: `${targetSum} = ${knownPart} + ?`,
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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !submitted && userInput !== '') {
      handleSubmit();
    }
  };

  // Visual bar model proportion
  const knownPercent = (knownPart / targetSum) * 100;

  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center bg-background p-6"
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="application"
      aria-label="Number bonds drill"
    >
      <div className="w-full max-w-md space-y-8">
        {/* Problem display */}
        <div className="text-center">
          <p className="text-sm font-medium text-muted-foreground mb-2">Number Bonds</p>
          <h2
            className="text-4xl font-bold text-foreground"
            style={{ fontSize: 'clamp(28px, 7vw, 48px)' }}
            aria-live="polite"
            aria-atomic="true"
          >
            <span className="text-primary">{targetSum}</span>
            {' = '}
            {knownPart}
            {' + '}
            <span className="inline-block min-w-[60px] border-b-4 border-primary text-center">
              {submitted ? (
                <span className={isCorrect ? 'text-green-500' : 'text-yellow-500'}>
                  {missingPart}
                </span>
              ) : (
                <span className="text-primary">{userInput || '?'}</span>
              )}
            </span>
          </h2>
        </div>

        {/* Visual bar model (easy difficulty) */}
        {showVisual && (
          <div className="space-y-2">
            <div className="flex h-12 w-full overflow-hidden rounded-lg border-2 border-border">
              {/* Known part */}
              <div
                className="flex items-center justify-center bg-primary/80 text-primary-foreground font-semibold"
                style={{ width: `${knownPercent}%` }}
              >
                {knownPart}
              </div>
              {/* Missing part */}
              <div
                className={`flex items-center justify-center font-semibold ${
                  submitted
                    ? isCorrect
                      ? 'bg-green-500/80 text-white'
                      : 'bg-yellow-500/80 text-white'
                    : 'bg-muted text-muted-foreground'
                }`}
                style={{ width: `${100 - knownPercent}%` }}
              >
                {submitted ? missingPart : '?'}
              </div>
            </div>
            <p className="text-center text-xs text-muted-foreground">
              Total: {targetSum}
            </p>
          </div>
        )}

        {/* User answer display */}
        {!submitted && (
          <>
            <div className="text-center">
              <div
                className="mx-auto inline-block min-w-[120px] rounded-lg border-2 border-primary bg-card px-6 py-4"
                aria-live="polite"
                aria-label="Your answer"
              >
                <span className="text-3xl font-semibold text-foreground">
                  {userInput || '\u00A0'}
                </span>
              </div>
            </div>

            {/* Number Keypad */}
            <div className="flex justify-center">
              <NumberKeypad
                value={userInput}
                onChange={setUserInput}
                onSubmit={handleSubmit}
                maxDigits={3}
                disabled={submitted}
              />
            </div>
          </>
        )}

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
                      {knownPart} + {missingPart} = {targetSum}
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
                      {knownPart} + {missingPart} = {targetSum}
                    </p>
                    <p className="sr-only">
                      The answer is {missingPart}. {knownPart} plus {missingPart} equals {targetSum}.
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
