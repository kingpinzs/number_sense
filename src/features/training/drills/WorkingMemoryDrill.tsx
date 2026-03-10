/**
 * WorkingMemoryDrill Component
 * Trains numerical working memory — the ability to hold and manipulate numbers mentally.
 *
 * Phase 1: Shows 2-4 numbers sequentially (each for 2s), then hides them.
 * Phase 2: Asks "What is the sum of all numbers?"
 * User enters the answer via NumberKeypad.
 * Easy: 2 single-digit. Medium: 3 single-digit. Hard: 3-4 two-digit.
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

interface MemoryProblem {
  numbers: number[];
  correctSum: number;
}

/** Difficulty configuration */
const DIFFICULTY_CONFIG = {
  easy:   { count: 2, minVal: 1, maxVal: 9 },
  medium: { count: 3, minVal: 1, maxVal: 9 },
  hard:   { count: [3, 4] as readonly number[], minVal: 10, maxVal: 50 },
} as const;

/** Display duration per number in milliseconds */
const DISPLAY_DURATION_MS = 2000;

function generateMemoryProblem(difficulty: 'easy' | 'medium' | 'hard'): MemoryProblem {
  const config = DIFFICULTY_CONFIG[difficulty];
  const count = typeof config.count === 'number'
    ? config.count
    : config.count[Math.floor(Math.random() * config.count.length)];

  const numbers: number[] = [];
  for (let i = 0; i < count; i++) {
    numbers.push(
      config.minVal + Math.floor(Math.random() * (config.maxVal - config.minVal + 1))
    );
  }

  const correctSum = numbers.reduce((acc, n) => acc + n, 0);
  return { numbers, correctSum };
}

type Phase = 'showing' | 'answering';

export default function WorkingMemoryDrill({ difficulty, sessionId, onComplete }: DrillProps) {
  const [problem] = useState(() => generateMemoryProblem(difficulty));
  const { numbers, correctSum } = problem;

  const [phase, setPhase] = useState<Phase>('showing');
  const [currentNumberIndex, setCurrentNumberIndex] = useState(0);
  const [userInput, setUserInput] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [startTime] = useState(Date.now());
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const prefersReducedMotion = typeof window !== 'undefined'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  // Sequential number display timer
  useEffect(() => {
    if (phase !== 'showing') return;

    showTimerRef.current = setTimeout(() => {
      if (currentNumberIndex < numbers.length - 1) {
        setCurrentNumberIndex(prev => prev + 1);
      } else {
        setPhase('answering');
      }
    }, DISPLAY_DURATION_MS);

    return () => {
      if (showTimerRef.current) clearTimeout(showTimerRef.current);
    };
  }, [phase, currentNumberIndex, numbers.length]);

  // Cleanup feedback timer on unmount
  useEffect(() => {
    return () => {
      if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    };
  }, []);

  const handleSubmit = async () => {
    if (submitted || userInput === '') return;

    const userAnswer = parseInt(userInput, 10);
    const correct = userAnswer === correctSum;
    const timeToAnswer = Date.now() - startTime;

    setIsCorrect(correct);
    setSubmitted(true);
    setShowFeedback(true);

    const result: DrillResult = {
      sessionId,
      timestamp: new Date().toISOString(),
      module: 'working_memory',
      difficulty,
      isCorrect: correct,
      timeToAnswer,
      accuracy: correct ? 100 : 0,
      targetNumber: correctSum,
      userAnswer,
      correctAnswer: correctSum,
      problem: `Sum of: ${numbers.join(', ')}`,
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
    if (e.key === 'Enter' && !submitted && userInput !== '' && phase === 'answering') {
      handleSubmit();
    }
  };

  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center bg-background p-6"
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="application"
      aria-label="Working memory drill"
      data-testid="working-memory-drill"
    >
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center">
          <p className="text-sm font-medium text-muted-foreground mb-2">Working Memory</p>
        </div>

        {/* Phase 1: Showing numbers */}
        {phase === 'showing' && (
          <div className="text-center space-y-4">
            <p
              className="text-lg font-medium text-foreground"
              data-testid="memorize-prompt"
            >
              Remember these numbers
            </p>

            {/* Progress dots */}
            <div
              className="flex justify-center gap-2 mb-4"
              aria-label={`Number ${currentNumberIndex + 1} of ${numbers.length}`}
              data-testid="progress-dots"
            >
              {numbers.map((_, i) => (
                <div
                  key={i}
                  className={`h-3 w-3 rounded-full transition-colors ${
                    i <= currentNumberIndex ? 'bg-primary' : 'bg-muted'
                  }`}
                />
              ))}
            </div>

            {/* Number display with animation */}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentNumberIndex}
                initial={prefersReducedMotion ? { opacity: 0 } : { scale: 0.5, opacity: 0 }}
                animate={prefersReducedMotion ? { opacity: 1 } : { scale: 1, opacity: 1 }}
                exit={prefersReducedMotion ? { opacity: 0 } : { scale: 0.5, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="flex items-center justify-center"
                aria-live="polite"
                aria-atomic="true"
                data-testid="current-number"
              >
                <span
                  className="text-primary font-bold"
                  style={{ fontSize: 'clamp(48px, 15vw, 96px)' }}
                >
                  {numbers[currentNumberIndex]}
                </span>
              </motion.div>
            </AnimatePresence>

            <p className="text-sm text-muted-foreground" data-testid="number-counter">
              Number {currentNumberIndex + 1} of {numbers.length}
            </p>
          </div>
        )}

        {/* Phase 2: Answering */}
        {phase === 'answering' && !submitted && (
          <>
            <div className="text-center">
              <h2
                className="text-2xl font-bold text-foreground mb-4"
                style={{ fontSize: 'clamp(20px, 5vw, 32px)' }}
                aria-live="polite"
                aria-atomic="true"
                data-testid="sum-question"
              >
                What is the sum of all {numbers.length} numbers?
              </h2>
            </div>

            {/* User answer display */}
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
                      {numbers.join(' + ')} = {correctSum}
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
                      {numbers.join(' + ')} = {correctSum}
                    </p>
                    <p className="sr-only">
                      The answer is {correctSum}. The numbers were {numbers.join(', ')} and their sum is {correctSum}.
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
