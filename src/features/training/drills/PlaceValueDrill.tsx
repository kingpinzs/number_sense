/**
 * PlaceValueDrill Component
 * Trains understanding of positional value within numbers.
 *
 * Shows a number with a highlighted digit.
 * Asks "What is the value of the highlighted digit?"
 * 4 multiple-choice buttons.
 * Easy: 2-digit. Medium: 3-digit. Hard: 4-digit.
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

interface PlaceValueProblem {
  number: number;
  digits: string[];
  highlightIndex: number;
  correctValue: number;
  choices: number[];
}

/** Difficulty -> number of digits */
const DIFFICULTY_CONFIG = {
  easy:   { minDigits: 2, maxDigits: 2 },
  medium: { minDigits: 3, maxDigits: 3 },
  hard:   { minDigits: 4, maxDigits: 4 },
} as const;

/** Position names for aria labels */
const POSITION_NAMES = ['ones', 'tens', 'hundreds', 'thousands'] as const;

function generatePlaceValueProblem(difficulty: 'easy' | 'medium' | 'hard'): PlaceValueProblem {
  const config = DIFFICULTY_CONFIG[difficulty];
  const numDigits = config.minDigits + Math.floor(
    Math.random() * (config.maxDigits - config.minDigits + 1)
  );

  // Generate a number with the right number of digits (first digit never 0)
  const minNum = Math.pow(10, numDigits - 1);
  const maxNum = Math.pow(10, numDigits) - 1;
  const number = minNum + Math.floor(Math.random() * (maxNum - minNum + 1));

  const digits = String(number).split('');

  // Pick a random digit position to highlight
  const highlightIndex = Math.floor(Math.random() * numDigits);

  // Calculate the positional value of the highlighted digit
  // e.g., in 347, digit '4' at index 1 has value 40
  const positionFromRight = numDigits - 1 - highlightIndex;
  const digitValue = parseInt(digits[highlightIndex], 10);
  const correctValue = digitValue * Math.pow(10, positionFromRight);

  // Generate 3 distractor choices
  const choicesSet = new Set<number>();
  choicesSet.add(correctValue);

  // Distractors: the raw digit, digit * wrong place value, nearby values
  const rawDigit = digitValue;
  if (rawDigit !== correctValue) choicesSet.add(rawDigit);

  // Try other place values for the same digit
  for (let i = 0; i < numDigits && choicesSet.size < 4; i++) {
    if (i !== positionFromRight) {
      const altValue = digitValue * Math.pow(10, i);
      if (altValue > 0) choicesSet.add(altValue);
    }
  }

  // Fill remaining with plausible distractors
  while (choicesSet.size < 4) {
    const randomMultiplier = Math.pow(10, Math.floor(Math.random() * numDigits));
    const distractor = (1 + Math.floor(Math.random() * 9)) * randomMultiplier;
    if (distractor !== correctValue) {
      choicesSet.add(distractor);
    }
  }

  // Shuffle choices
  const choices = Array.from(choicesSet).slice(0, 4);
  for (let i = choices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [choices[i], choices[j]] = [choices[j], choices[i]];
  }

  return { number, digits, highlightIndex, correctValue, choices };
}

export default function PlaceValueDrill({ difficulty, sessionId, onComplete }: DrillProps) {
  const [problem] = useState(() => generatePlaceValueProblem(difficulty));
  const { number, digits, highlightIndex, correctValue, choices } = problem;

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

  const positionFromRight = digits.length - 1 - highlightIndex;
  const positionName = POSITION_NAMES[positionFromRight] ?? `10^${positionFromRight}`;

  const handleSelect = async (choice: number) => {
    if (submitted) return;

    const correct = choice === correctValue;
    const timeToAnswer = Date.now() - startTime;

    setIsCorrect(correct);
    setSubmitted(true);
    setShowFeedback(true);

    const result: DrillResult = {
      sessionId,
      timestamp: new Date().toISOString(),
      module: 'place_value',
      difficulty,
      isCorrect: correct,
      timeToAnswer,
      accuracy: correct ? 100 : 0,
      targetNumber: number,
      userAnswer: choice,
      correctAnswer: correctValue,
      problem: `Value of digit ${digits[highlightIndex]} in ${number} (${positionName} place)`,
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
      aria-label="Place value drill"
      data-testid="place-value-drill"
    >
      <div className="w-full max-w-md space-y-8">
        {/* Problem display */}
        <div className="text-center">
          <p className="text-sm font-medium text-muted-foreground mb-2">Place Value</p>
          <p className="text-base text-muted-foreground mb-4">
            What is the value of the highlighted digit?
          </p>
          <h2
            className="font-bold text-foreground inline-flex items-center justify-center gap-1"
            style={{ fontSize: 'clamp(32px, 8vw, 56px)' }}
            aria-live="polite"
            aria-atomic="true"
            data-testid="number-display"
          >
            {digits.map((digit, index) => (
              <span
                key={index}
                className={
                  index === highlightIndex
                    ? 'text-primary bg-primary/20 rounded-lg px-2 py-1 border-2 border-primary'
                    : 'text-foreground px-1'
                }
                aria-label={
                  index === highlightIndex
                    ? `Highlighted digit ${digit} in the ${positionName} place`
                    : `Digit ${digit}`
                }
              >
                {digit}
              </span>
            ))}
          </h2>
        </div>

        {/* Multiple choice buttons */}
        {!submitted && (
          <div
            className="grid grid-cols-2 gap-4"
            data-testid="choices"
            role="group"
            aria-label="Answer choices"
          >
            {choices.map((choice, index) => (
              <motion.button
                key={index}
                whileTap={prefersReducedMotion ? undefined : { scale: 0.95 }}
                whileHover={prefersReducedMotion ? undefined : { scale: 1.03 }}
                onClick={() => handleSelect(choice)}
                className="min-h-[60px] rounded-xl border-2 border-primary bg-card px-4 py-4 text-xl font-semibold text-foreground transition-colors hover:bg-primary/10"
                data-testid={`choice-${index}`}
                aria-label={`Answer: ${choice}`}
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
                      The {positionName} digit {digits[highlightIndex]} = {correctValue.toLocaleString()}
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
                      The {positionName} digit {digits[highlightIndex]} = {correctValue.toLocaleString()}
                    </p>
                    <p className="sr-only">
                      The answer is {correctValue}. The digit {digits[highlightIndex]} is in the {positionName} place, so its value is {correctValue}.
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
