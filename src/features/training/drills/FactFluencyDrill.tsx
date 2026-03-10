/**
 * FactFluencyDrill Component
 * Trains rapid recall of basic arithmetic facts under time pressure.
 *
 * Shows "3 + 7 = ?" with a visible countdown timer bar.
 * Easy: 10s, addition only, max 5. Medium: 6s, +/-, max 10. Hard: 3s, +/-/x, max 12.
 * If time runs out, the answer is marked as incorrect.
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

interface FactProblem {
  a: number;
  b: number;
  operation: 'addition' | 'subtraction' | 'multiplication';
  operationSymbol: string;
  correctAnswer: number;
  expression: string;
}

/** Difficulty -> time limit, operations, and operand range */
const DIFFICULTY_CONFIG = {
  easy:   { timeLimitMs: 10000, operations: ['addition'] as const, maxOperand: 5  },
  medium: { timeLimitMs: 6000,  operations: ['addition', 'subtraction'] as const, maxOperand: 10 },
  hard:   { timeLimitMs: 3000,  operations: ['addition', 'subtraction', 'multiplication'] as const, maxOperand: 12 },
} as const;

const OPERATION_SYMBOLS: Record<string, string> = {
  addition: '+',
  subtraction: '-',
  multiplication: '\u00D7',
};

function generateFactProblem(difficulty: 'easy' | 'medium' | 'hard'): FactProblem {
  const config = DIFFICULTY_CONFIG[difficulty];
  const operations = config.operations;
  const operation = operations[Math.floor(Math.random() * operations.length)] as 'addition' | 'subtraction' | 'multiplication';
  const operationSymbol = OPERATION_SYMBOLS[operation];

  let a = 1 + Math.floor(Math.random() * config.maxOperand);
  let b = 1 + Math.floor(Math.random() * config.maxOperand);

  // For subtraction, ensure a >= b so the result is non-negative
  if (operation === 'subtraction' && a < b) {
    [a, b] = [b, a];
  }

  let correctAnswer: number;
  switch (operation) {
    case 'addition':
      correctAnswer = a + b;
      break;
    case 'subtraction':
      correctAnswer = a - b;
      break;
    case 'multiplication':
      correctAnswer = a * b;
      break;
  }

  const expression = `${a} ${operationSymbol} ${b}`;

  return { a, b, operation, operationSymbol, correctAnswer, expression };
}

export default function FactFluencyDrill({ difficulty, sessionId, onComplete }: DrillProps) {
  const [problem] = useState(() => generateFactProblem(difficulty));
  const { correctAnswer, expression, operation } = problem;
  const timeLimit = DIFFICULTY_CONFIG[difficulty].timeLimitMs;

  const [userInput, setUserInput] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number>(timeLimit);
  const [startTime] = useState(Date.now());
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const prefersReducedMotion = typeof window !== 'undefined'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  // Start countdown timer
  useEffect(() => {
    // Update progress bar every 50ms
    countdownRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, timeLimit - elapsed);
      setTimeRemaining(remaining);
    }, 50);

    // Set up timeout
    timeoutRef.current = setTimeout(() => {
      if (!submitted) {
        handleTimeout();
      }
    }, timeLimit);

    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const persistResult = async (result: DrillResult) => {
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
  };

  const handleTimeout = async () => {
    if (submitted) return;

    // Stop timers
    if (countdownRef.current) clearInterval(countdownRef.current);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    setTimedOut(true);
    setIsCorrect(false);
    setSubmitted(true);
    setShowFeedback(true);
    setTimeRemaining(0);

    const result: DrillResult = {
      sessionId,
      timestamp: new Date().toISOString(),
      module: 'fact_fluency',
      difficulty,
      isCorrect: false,
      timeToAnswer: timeLimit,
      accuracy: 0,
      targetNumber: correctAnswer,
      userAnswer: undefined,
      correctAnswer,
      operation,
      problem: expression,
    };

    await persistResult(result);

    feedbackTimerRef.current = setTimeout(() => {
      onComplete(result);
    }, 1500);
  };

  const handleSubmit = async () => {
    if (submitted || userInput === '') return;

    // Stop timers
    if (countdownRef.current) clearInterval(countdownRef.current);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    const userAnswer = parseInt(userInput, 10);
    const correct = userAnswer === correctAnswer;
    const timeToAnswer = Date.now() - startTime;

    setIsCorrect(correct);
    setSubmitted(true);
    setShowFeedback(true);

    const result: DrillResult = {
      sessionId,
      timestamp: new Date().toISOString(),
      module: 'fact_fluency',
      difficulty,
      isCorrect: correct,
      timeToAnswer,
      accuracy: correct ? 100 : 0,
      targetNumber: correctAnswer,
      userAnswer,
      correctAnswer,
      operation,
      problem: expression,
    };

    await persistResult(result);

    feedbackTimerRef.current = setTimeout(() => {
      onComplete(result);
    }, 1500);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !submitted && userInput !== '') {
      handleSubmit();
    }
  };

  // Timer progress (1 = full, 0 = empty)
  const timerProgress = timeRemaining / timeLimit;

  // Timer bar color transitions
  const timerColor =
    timerProgress > 0.5
      ? 'bg-green-500'
      : timerProgress > 0.2
        ? 'bg-yellow-500'
        : 'bg-red-500';

  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center bg-background p-6"
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="application"
      aria-label="Fact fluency drill"
      data-testid="fact-fluency-drill"
    >
      <div className="w-full max-w-md space-y-8">
        {/* Timer bar */}
        <div
          className="w-full"
          role="timer"
          aria-label={`${Math.ceil(timeRemaining / 1000)} seconds remaining`}
          data-testid="timer-bar"
        >
          <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
            <div
              className={`h-full rounded-full transition-all duration-100 ${timerColor}`}
              style={{ width: `${timerProgress * 100}%` }}
            />
          </div>
          <p className="mt-1 text-center text-xs text-muted-foreground">
            {Math.ceil(timeRemaining / 1000)}s
          </p>
        </div>

        {/* Problem display */}
        <div className="text-center">
          <p className="text-sm font-medium text-muted-foreground mb-2">Fact Fluency</p>
          <h2
            className="font-bold text-foreground"
            style={{ fontSize: 'clamp(32px, 8vw, 56px)' }}
            aria-live="polite"
            aria-atomic="true"
            data-testid="problem-display"
          >
            <span className="text-primary">{expression}</span>
            {' = '}
            <span className="inline-block min-w-[60px] border-b-4 border-primary text-center">
              {submitted ? (
                <span className={isCorrect ? 'text-green-500' : 'text-yellow-500'}>
                  {correctAnswer}
                </span>
              ) : (
                <span className="text-primary">{userInput || '?'}</span>
              )}
            </span>
          </h2>
        </div>

        {/* User answer display & keypad */}
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
            >
              <div className="text-center">
                {isCorrect ? (
                  <>
                    <div className="mb-4 flex justify-center">
                      <Check className="h-24 w-24 text-green-500" aria-hidden="true" />
                    </div>
                    <p className="text-2xl font-bold text-green-500">
                      {expression} = {correctAnswer}
                    </p>
                    <p className="sr-only">Correct!</p>
                  </>
                ) : (
                  <>
                    <div className="mb-4 flex justify-center">
                      <X className="h-24 w-24 text-yellow-500" aria-hidden="true" />
                    </div>
                    <p className="text-lg font-medium text-foreground mb-1">
                      {timedOut ? "Time's up!" : 'Not quite — keep going!'}
                    </p>
                    <p className="text-2xl font-semibold text-muted-foreground">
                      {expression} = {correctAnswer}
                    </p>
                    <p className="sr-only">
                      {timedOut ? 'Time ran out.' : 'Incorrect.'} The answer is {correctAnswer}. {expression} equals {correctAnswer}.
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
