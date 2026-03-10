/**
 * EstimationDrill Component
 * Trains numerical estimation skills — critical for real-world math competence.
 *
 * Shows an expression (e.g., "47 + 38").
 * 4 estimate choices; user picks the closest one.
 * Easy: small sums. Medium: larger sums. Hard: multiplication.
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

interface EstimationProblem {
  expression: string;
  correctAnswer: number;
  operation: 'addition' | 'subtraction' | 'multiplication';
  choices: number[];
}

/** Difficulty -> operation type and operand ranges */
const DIFFICULTY_CONFIG = {
  easy:   { operations: ['addition'] as const, minA: 5,  maxA: 30,  minB: 5,  maxB: 30  },
  medium: { operations: ['addition', 'subtraction'] as const, minA: 20, maxA: 100, minB: 10, maxB: 80 },
  hard:   { operations: ['multiplication'] as const, minA: 6,  maxA: 25,  minB: 4,  maxB: 15  },
} as const;

function generateEstimationProblem(difficulty: 'easy' | 'medium' | 'hard'): EstimationProblem {
  const config = DIFFICULTY_CONFIG[difficulty];
  const operations = config.operations;
  const operation = operations[Math.floor(Math.random() * operations.length)] as 'addition' | 'subtraction' | 'multiplication';

  let a = config.minA + Math.floor(Math.random() * (config.maxA - config.minA + 1));
  let b = config.minB + Math.floor(Math.random() * (config.maxB - config.minB + 1));

  // For subtraction, ensure a > b so the result is positive
  if (operation === 'subtraction' && a < b) {
    [a, b] = [b, a];
  }

  let correctAnswer: number;
  let expression: string;

  switch (operation) {
    case 'addition':
      correctAnswer = a + b;
      expression = `${a} + ${b}`;
      break;
    case 'subtraction':
      correctAnswer = a - b;
      expression = `${a} - ${b}`;
      break;
    case 'multiplication':
      correctAnswer = a * b;
      expression = `${a} × ${b}`;
      break;
  }

  // Generate 3 plausible distractor estimates
  const choicesSet = new Set<number>();
  choicesSet.add(correctAnswer);

  // Offset-based distractors — reasonable estimation errors
  const offsets = [
    Math.round(correctAnswer * 0.15),
    Math.round(correctAnswer * 0.3),
    Math.round(correctAnswer * 0.5),
    Math.round(correctAnswer * 0.1),
    Math.round(correctAnswer * 0.25),
  ];

  for (const offset of offsets) {
    if (choicesSet.size >= 4) break;
    const adjusted = Math.max(1, offset); // Ensure offset >= 1
    const distractor = Math.random() < 0.5
      ? correctAnswer + adjusted
      : Math.max(0, correctAnswer - adjusted);
    if (distractor !== correctAnswer) {
      choicesSet.add(distractor);
    }
  }

  // Fill remaining with random offsets if needed
  while (choicesSet.size < 4) {
    const randomOffset = Math.max(1, Math.round(correctAnswer * (0.05 + Math.random() * 0.4)));
    const distractor = Math.random() < 0.5
      ? correctAnswer + randomOffset
      : Math.max(0, correctAnswer - randomOffset);
    if (distractor !== correctAnswer) {
      choicesSet.add(distractor);
    }
  }

  // Shuffle choices
  const choices = Array.from(choicesSet).slice(0, 4);
  for (let i = choices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [choices[i], choices[j]] = [choices[j], choices[i]];
  }

  return { expression, correctAnswer, operation, choices };
}

export default function EstimationDrill({ difficulty, sessionId, onComplete }: DrillProps) {
  const [problem] = useState(() => generateEstimationProblem(difficulty));
  const { expression, correctAnswer, operation, choices } = problem;

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

  const handleSelect = async (choice: number) => {
    if (submitted) return;

    const correct = choice === correctAnswer;
    const timeToAnswer = Date.now() - startTime;

    setIsCorrect(correct);
    setSubmitted(true);
    setShowFeedback(true);

    const result: DrillResult = {
      sessionId,
      timestamp: new Date().toISOString(),
      module: 'estimation',
      difficulty,
      isCorrect: correct,
      timeToAnswer,
      accuracy: correct ? 100 : 0,
      targetNumber: correctAnswer,
      userAnswer: choice,
      correctAnswer,
      operation,
      problem: expression,
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

  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center bg-background p-6"
      role="application"
      aria-label="Estimation drill"
      data-testid="estimation-drill"
    >
      <div className="w-full max-w-md space-y-8">
        {/* Problem display */}
        <div className="text-center">
          <p className="text-sm font-medium text-muted-foreground mb-2">Estimation</p>
          <p className="text-base text-muted-foreground mb-4">
            Which is closest to the answer?
          </p>
          <h2
            className="font-bold text-foreground"
            style={{ fontSize: 'clamp(32px, 8vw, 56px)' }}
            aria-live="polite"
            aria-atomic="true"
            data-testid="expression-display"
          >
            <span className="text-primary">{expression}</span>
          </h2>
        </div>

        {/* Multiple choice buttons */}
        {!submitted && (
          <div
            className="grid grid-cols-2 gap-4"
            data-testid="choices"
            role="group"
            aria-label="Estimate choices"
          >
            {choices.map((choice, index) => (
              <motion.button
                key={index}
                whileTap={prefersReducedMotion ? undefined : { scale: 0.95 }}
                whileHover={prefersReducedMotion ? undefined : { scale: 1.03 }}
                onClick={() => handleSelect(choice)}
                className="min-h-[60px] rounded-xl border-2 border-primary bg-card px-4 py-4 text-xl font-semibold text-foreground transition-colors hover:bg-primary/10"
                data-testid={`choice-${index}`}
                aria-label={`Estimate: ${choice}`}
                type="button"
              >
                {choice.toLocaleString()}
              </motion.button>
            ))}
          </div>
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
                      {expression} = {correctAnswer.toLocaleString()}
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
                      {expression} = {correctAnswer.toLocaleString()}
                    </p>
                    <p className="sr-only">
                      The answer is {correctAnswer}. {expression} equals {correctAnswer}.
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
