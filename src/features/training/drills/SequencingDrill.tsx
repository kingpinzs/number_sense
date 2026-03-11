/**
 * SequencingDrill Component
 * Trains number sequence pattern recognition — critical for mathematical reasoning.
 *
 * Shows a number sequence with one missing element.
 * User must identify the pattern and enter the missing number.
 * Easy: count by 1, small numbers. Medium: count by 2/5. Hard: various steps, larger numbers.
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

interface SequenceProblem {
  /** The full sequence of numbers (with the correct value at the missing index) */
  sequence: number[];
  /** Index of the missing element in the sequence */
  missingIndex: number;
  /** The step size between consecutive elements */
  step: number;
}

/** Difficulty configuration for sequence generation */
const DIFFICULTY_CONFIG = {
  easy:   { steps: [1],       minStart: 1,  maxStart: 10,  sequenceLength: 5 },
  medium: { steps: [2, 5],    minStart: 2,  maxStart: 30,  sequenceLength: 5 },
  hard:   { steps: [3, 4, 6, 7, 10], minStart: 5, maxStart: 50, sequenceLength: 5 },
} as const;

function generateSequenceProblem(difficulty: 'easy' | 'medium' | 'hard'): SequenceProblem {
  const config = DIFFICULTY_CONFIG[difficulty];
  const step = config.steps[Math.floor(Math.random() * config.steps.length)];
  // Start must be a multiple of step (like kids learn: 5, 10, 15... not 8, 13, 18)
  const maxMultiple = Math.floor(config.maxStart / step);
  const minMultiple = Math.max(1, Math.ceil(config.minStart / step));
  const start = (minMultiple + Math.floor(Math.random() * (maxMultiple - minMultiple + 1))) * step;

  const sequence: number[] = [];
  for (let i = 0; i < config.sequenceLength; i++) {
    sequence.push(start + step * i);
  }

  // Missing index: avoid first and last positions for clarity
  const missingIndex = 1 + Math.floor(Math.random() * (config.sequenceLength - 2));

  return { sequence, missingIndex, step };
}

export default function SequencingDrill({ difficulty, sessionId, onComplete }: DrillProps) {
  const [problem] = useState(() => generateSequenceProblem(difficulty));
  const { sequence, missingIndex } = problem;
  const correctAnswer = sequence[missingIndex];

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
    const correct = userAnswer === correctAnswer;
    const timeToAnswer = Date.now() - startTime;

    setIsCorrect(correct);
    setSubmitted(true);
    setShowFeedback(true);

    const problemStr = sequence
      .map((n, i) => (i === missingIndex ? '?' : String(n)))
      .join(', ');

    const result: DrillResult = {
      sessionId,
      timestamp: new Date().toISOString(),
      module: 'sequencing',
      difficulty,
      isCorrect: correct,
      timeToAnswer,
      accuracy: correct ? 100 : 0,
      targetNumber: correctAnswer,
      userAnswer,
      correctAnswer,
      problem: problemStr,
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

  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center bg-background p-6"
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="application"
      aria-label="Sequencing drill"
      data-testid="sequencing-drill"
    >
      <div className="w-full max-w-md space-y-8">
        {/* Problem display */}
        <div className="text-center">
          <p className="text-sm font-medium text-muted-foreground mb-2">Number Sequence</p>
          <div
            className="flex flex-wrap items-center justify-center gap-2"
            style={{ fontSize: 'clamp(28px, 7vw, 48px)' }}
            aria-live="polite"
            aria-atomic="true"
            data-testid="sequence-display"
          >
            {sequence.map((num, i) => (
              <span key={i} className="flex items-center">
                {i > 0 && (
                  <span className="text-muted-foreground mx-1">,</span>
                )}
                {i === missingIndex ? (
                  <span
                    className="inline-block min-w-[60px] border-b-4 border-primary text-center font-bold"
                    data-testid="missing-slot"
                  >
                    {submitted ? (
                      <span className={isCorrect ? 'text-green-500' : 'text-yellow-500'}>
                        {correctAnswer}
                      </span>
                    ) : (
                      <span className="text-primary">{userInput || '?'}</span>
                    )}
                  </span>
                ) : (
                  <span className="font-bold text-foreground">{num}</span>
                )}
              </span>
            ))}
          </div>
        </div>

        {/* User answer display */}
        {!submitted && (
          <>
            <div className="text-center">
              <div
                className="mx-auto inline-block min-w-[120px] rounded-lg border-2 border-primary bg-card px-6 py-4"
                aria-live="polite"
                aria-label="Your answer"
                data-testid="user-answer-display"
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
                maxDigits={4}
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
              data-testid="feedback-overlay"
            >
              <div className="text-center">
                {isCorrect ? (
                  <>
                    <div className="mb-4 flex justify-center">
                      <Check className="h-24 w-24 text-green-500" aria-hidden="true" />
                    </div>
                    <p className="text-2xl font-bold text-green-500">
                      {sequence.join(', ')}
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
                      {sequence.join(', ')}
                    </p>
                    <p className="sr-only">
                      The answer is {correctAnswer}. The complete sequence is {sequence.join(', ')}.
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
