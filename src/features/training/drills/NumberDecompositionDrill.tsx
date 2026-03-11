/**
 * NumberDecompositionDrill Component
 * Builds understanding that numbers can be broken apart and recombined.
 *
 * Easy (10–99): break into tens + ones — user fills TWO blanks.
 * Medium (100–999): hundreds/tens/ones — user fills ONE blank.
 * Hard (10–999): flexible decomposition — user fills ONE blank.
 *
 * Includes a Base10Blocks visual aid for easy and medium difficulties.
 * DrillResult module key: 'number_decomposition'
 */

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X } from 'lucide-react';
import { db } from '@/services/storage/db';
import { STORAGE_KEYS } from '@/services/storage/localStorage';
import type { DrillResult } from '@/services/storage/schemas';

// ---------------------------------------------------------------------------
// Public interface — must match the DrillProps contract shared across drills
// ---------------------------------------------------------------------------

export interface DrillProps {
  difficulty: 'easy' | 'medium' | 'hard';
  sessionId: number;
  onComplete: (result: DrillResult) => void;
  onSkip?: () => void;
}

// ---------------------------------------------------------------------------
// Problem types
// ---------------------------------------------------------------------------

/**
 * Easy: two blanks — user enters tens part AND ones part.
 * Medium/Hard: one blank — user enters the single missing value.
 */
export interface DecompositionProblem {
  targetNumber: number;
  /** Human-readable equation template e.g. "47 = __ + __" */
  equationTemplate: string;
  /** For easy: [tensAnswer, onesAnswer]; for medium/hard: [singleAnswer] */
  answers: number[];
  /** Show base-10 blocks visual (easy/medium only) */
  showBlocks: boolean;
  /** Explanation shown in feedback */
  explanation: string;
}

// ---------------------------------------------------------------------------
// Base-10 blocks visual component
// ---------------------------------------------------------------------------

/**
 * Base10Blocks — renders a proportional visual of hundreds, tens, and ones.
 *
 * Hundreds: large blue square
 * Tens: tall green rectangle
 * Ones: small yellow square
 */
export function Base10Blocks({ number }: { number: number }) {
  const hundreds = Math.floor(number / 100);
  const tens = Math.floor((number % 100) / 10);
  const ones = number % 10;

  return (
    <div
      className="flex items-end gap-2 justify-center my-4 flex-wrap"
      aria-label={`Base 10 blocks showing ${number}`}
      data-testid="base10-blocks"
    >
      {/* Hundreds blocks */}
      {Array.from({ length: hundreds }, (_, i) => (
        <div
          key={`h-${i}`}
          className="w-10 h-10 bg-blue-400/30 border border-blue-500 rounded"
          aria-hidden="true"
          data-testid="block-hundred"
        />
      ))}

      {/* Tens blocks */}
      {Array.from({ length: tens }, (_, i) => (
        <div
          key={`t-${i}`}
          className="w-3 h-10 bg-green-400/30 border border-green-500 rounded"
          aria-hidden="true"
          data-testid="block-ten"
        />
      ))}

      {/* Ones blocks */}
      {Array.from({ length: ones }, (_, i) => (
        <div
          key={`o-${i}`}
          className="w-3 h-3 bg-yellow-400/30 border border-yellow-500 rounded"
          aria-hidden="true"
          data-testid="block-one"
        />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Problem generation
// ---------------------------------------------------------------------------

/** Returns a random integer in [min, max] inclusive */
function randInt(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min + 1));
}

/**
 * Easy: decompose a 2-digit number into tens and ones.
 * User fills in BOTH blanks: "47 = __ + __"
 */
function generateEasyProblem(): DecompositionProblem {
  const target = randInt(10, 99);
  const tens = Math.floor(target / 10) * 10;
  const ones = target % 10;

  return {
    targetNumber: target,
    equationTemplate: `${target} = ___ + ___`,
    answers: [tens, ones],
    showBlocks: true,
    explanation: `${target} = ${tens} + ${ones}. There are ${Math.floor(target / 10)} tens (${tens}) and ${ones} ones.`,
  };
}

/**
 * Medium: decompose a 3-digit number; show one known component and one blank.
 * Example: "347 = 300 + ___ + 7" → answer: 40
 */
function generateMediumProblem(): DecompositionProblem {
  const target = randInt(100, 999);
  const hundreds = Math.floor(target / 100) * 100;
  const tens = Math.floor((target % 100) / 10) * 10;
  const ones = target % 10;

  // Randomly hide either the tens part or a flexible decomposition
  const hideChoice = randInt(0, 1);

  if (hideChoice === 0) {
    // Hide the tens part: "347 = 300 + ___ + 7"
    return {
      targetNumber: target,
      equationTemplate: `${target} = ${hundreds} + ___ + ${ones}`,
      answers: [tens],
      showBlocks: true,
      explanation: `${target} = ${hundreds} + ${tens} + ${ones}. The missing value is ${tens} (${Math.floor((target % 100) / 10)} tens).`,
    };
  } else {
    // Flexible: "347 = ___ + 47" (hide the hundreds portion, show last two digits)
    const lastTwo = target % 100;
    return {
      targetNumber: target,
      equationTemplate: `${target} = ___ + ${lastTwo}`,
      answers: [hundreds],
      showBlocks: true,
      explanation: `${target} = ${hundreds} + ${lastTwo}. The missing hundreds part is ${hundreds}.`,
    };
  }
}

/**
 * Hard: flexible decomposition across any range 10–999.
 * One blank — e.g. "83 = 60 + ___", "145 = ___ + 45", "200 = 150 + ___"
 */
function generateHardProblem(): DecompositionProblem {
  const target = randInt(10, 999);

  // Generate a split point that isn't 0 or target itself
  // For meaningful decomposition, split at a round number
  const roundFactor = target >= 100 ? 50 : 10;
  const knownPart =
    Math.max(
      roundFactor,
      Math.round(((randInt(1, 9) / 10) * target) / roundFactor) * roundFactor
    );
  // Clamp so the known part is always less than the target
  const safeKnown = Math.min(knownPart, target - 1);
  const missingPart = target - safeKnown;

  // Randomly decide which part to hide (known or missing)
  const hideLeft = Math.random() < 0.5;

  if (hideLeft) {
    return {
      targetNumber: target,
      equationTemplate: `${target} = ___ + ${safeKnown}`,
      answers: [missingPart],
      showBlocks: false,
      explanation: `${target} = ${missingPart} + ${safeKnown}. Subtract ${safeKnown} from ${target} to get ${missingPart}.`,
    };
  } else {
    return {
      targetNumber: target,
      equationTemplate: `${target} = ${missingPart} + ___`,
      answers: [safeKnown],
      showBlocks: false,
      explanation: `${target} = ${missingPart} + ${safeKnown}. Subtract ${missingPart} from ${target} to get ${safeKnown}.`,
    };
  }
}

/**
 * Public generator — selects a problem appropriate for the given difficulty.
 */
export function generateDecompositionProblem(
  difficulty: 'easy' | 'medium' | 'hard'
): DecompositionProblem {
  switch (difficulty) {
    case 'easy':
      return generateEasyProblem();
    case 'medium':
      return generateMediumProblem();
    case 'hard':
      return generateHardProblem();
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function NumberDecompositionDrill({
  difficulty,
  sessionId,
  onComplete,
}: DrillProps) {
  const [problem] = useState<DecompositionProblem>(() =>
    generateDecompositionProblem(difficulty)
  );
  const { targetNumber, equationTemplate, answers, showBlocks, explanation } =
    problem;

  /**
   * Easy: two separate inputs for [tensInput, onesInput].
   * Medium/Hard: single input for the one missing value.
   */
  const isEasy = difficulty === 'easy';

  // For easy we track two inputs; index 0 = tens, index 1 = ones
  const [inputValues, setInputValues] = useState<string[]>(
    isEasy ? ['', ''] : ['']
  );

  const [submitted, setSubmitted] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [startTime] = useState(Date.now());
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const prefersReducedMotion =
    typeof window !== 'undefined'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false;

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    };
  }, []);

  // ------------------------------------------------------------------
  // Submission
  // ------------------------------------------------------------------

  const handleSubmit = async () => {
    if (submitted) return;

    // Validate all inputs are filled
    if (inputValues.some((v) => v.trim() === '')) return;

    const parsed = inputValues.map((v) => parseInt(v, 10));
    if (parsed.some(Number.isNaN)) return;

    // For easy, both answers must match in order
    const correct =
      isEasy
        ? parsed[0] === answers[0] && parsed[1] === answers[1]
        : parsed[0] === answers[0];

    const timeToAnswer = Date.now() - startTime;

    setIsCorrect(correct);
    setSubmitted(true);
    setShowFeedback(true);

    const result: DrillResult = {
      sessionId,
      timestamp: new Date().toISOString(),
      module: 'number_decomposition',
      difficulty,
      isCorrect: correct,
      timeToAnswer,
      accuracy: correct ? 100 : 0,
      targetNumber,
      userAnswer: parsed[0],
      correctAnswer: answers[0],
      problem: isEasy
        ? `${targetNumber} = ${parsed[0]} + ${parsed[1]} (correct: ${answers[0]} + ${answers[1]})`
        : equationTemplate,
    };

    // Persist to Dexie; fall back to localStorage on failure
    try {
      await db.drill_results.add(result);
    } catch (error) {
      console.error('Failed to persist drill result:', error);
      try {
        const backup = localStorage.getItem(STORAGE_KEYS.DRILL_RESULTS_BACKUP);
        const results: DrillResult[] = backup ? JSON.parse(backup) : [];
        results.push(result);
        localStorage.setItem(
          STORAGE_KEYS.DRILL_RESULTS_BACKUP,
          JSON.stringify(results)
        );
      } catch {
        localStorage.setItem(
          STORAGE_KEYS.DRILL_RESULTS_BACKUP,
          JSON.stringify([result])
        );
      }
    }

    feedbackTimerRef.current = setTimeout(() => {
      onComplete(result);
    }, 1500);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  // Update a single input slot by index
  const updateInput = (index: number, value: string) => {
    setInputValues((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  // ------------------------------------------------------------------
  // Render helpers for the equation with blanks
  // ------------------------------------------------------------------

  /**
   * For easy difficulty, render the equation with two styled input boxes.
   * Template pattern: "47 = ___ + ___"
   */
  function EasyEquation() {
    return (
      <div
        className="flex flex-wrap items-center justify-center gap-2 text-3xl font-bold text-foreground"
        aria-label={`${targetNumber} equals blank plus blank`}
        data-testid="equation-display"
      >
        <span className="text-primary">{targetNumber}</span>
        <span>=</span>
        <input
          type="number"
          inputMode="numeric"
          value={inputValues[0]}
          onChange={(e) => updateInput(0, e.target.value)}
          disabled={submitted}
          placeholder="?"
          className="w-20 rounded-lg border-2 border-primary bg-card px-2 py-2 text-center text-2xl font-semibold outline-none focus:ring-2 focus:ring-primary"
          aria-label="Tens part"
          data-testid="input-tens"
        />
        <span>+</span>
        <input
          type="number"
          inputMode="numeric"
          value={inputValues[1]}
          onChange={(e) => updateInput(1, e.target.value)}
          disabled={submitted}
          placeholder="?"
          className="w-20 rounded-lg border-2 border-primary bg-card px-2 py-2 text-center text-2xl font-semibold outline-none focus:ring-2 focus:ring-primary"
          aria-label="Ones part"
          data-testid="input-ones"
        />
      </div>
    );
  }

  /**
   * For medium/hard, render the equation template with one input replacing "___".
   */
  function SingleBlankEquation() {
    // Split the template on "___" to interleave the input element
    const parts = equationTemplate.split('___');
    return (
      <div
        className="flex flex-wrap items-center justify-center gap-1 text-3xl font-bold text-foreground"
        aria-label={equationTemplate.replace('___', 'blank')}
        data-testid="equation-display"
      >
        {parts.map((part, idx) => (
          <span key={idx} className="flex items-center gap-1">
            {/* Render equation text segments, highlighting the target number */}
            <span>
              {part.split(String(targetNumber)).map((segment, sIdx, _arr) => (
                <span key={sIdx}>
                  {sIdx > 0 && (
                    <span className="text-primary">{targetNumber}</span>
                  )}
                  {segment}
                </span>
              ))}
            </span>
            {/* Insert the input between parts (all but the last segment) */}
            {idx < parts.length - 1 && (
              <input
                type="number"
                inputMode="numeric"
                value={inputValues[0]}
                onChange={(e) => updateInput(0, e.target.value)}
                disabled={submitted}
                placeholder="?"
                className="w-24 rounded-lg border-2 border-primary bg-card px-2 py-2 text-center text-2xl font-semibold outline-none focus:ring-2 focus:ring-primary"
                aria-label="Missing value"
                data-testid="input-single"
              />
            )}
          </span>
        ))}
      </div>
    );
  }

  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center bg-background p-6"
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="application"
      aria-label="Number decomposition drill"
      data-testid="number-decomposition-drill"
    >
      <div className="w-full max-w-md space-y-6">
        {/* Label */}
        <p className="text-center text-sm font-medium text-muted-foreground">
          Number Decomposition
        </p>

        {/* Target number — large and prominent */}
        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-1">Target Number</p>
          <h2
            className="text-6xl font-bold text-primary"
            aria-live="polite"
            aria-atomic="true"
            data-testid="target-number"
            style={{ fontSize: 'clamp(40px, 10vw, 72px)' }}
          >
            {targetNumber}
          </h2>
        </div>

        {/* Base-10 blocks visual (easy/medium) */}
        {showBlocks && <Base10Blocks number={targetNumber} />}

        {/* Legend for blocks */}
        {showBlocks && (
          <div className="flex justify-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <span className="inline-block w-4 h-4 bg-blue-400/30 border border-blue-500 rounded" />
              Hundreds
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block w-2 h-4 bg-green-400/30 border border-green-500 rounded" />
              Tens
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block w-2 h-2 bg-yellow-400/30 border border-yellow-500 rounded" />
              Ones
            </span>
          </div>
        )}

        {/* Instruction */}
        <p className="text-center text-base text-muted-foreground">
          {isEasy
            ? 'Fill in the tens and ones parts:'
            : 'Fill in the missing value:'}
        </p>

        {/* Equation with blanks */}
        {isEasy ? <EasyEquation /> : <SingleBlankEquation />}

        {/* Submit button */}
        {!submitted && (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitted || inputValues.some((v) => v.trim() === '')}
            className="w-full min-h-[52px] rounded-xl bg-primary px-6 py-3 text-lg font-semibold text-primary-foreground disabled:opacity-40 hover:bg-primary/90 transition-colors"
            data-testid="submit-button"
          >
            Check Answer
          </button>
        )}

        {/* Feedback overlay */}
        <AnimatePresence>
          {showFeedback && (
            <motion.div
              initial={
                prefersReducedMotion
                  ? { opacity: 0 }
                  : { scale: 0, opacity: 0 }
              }
              animate={
                prefersReducedMotion
                  ? { opacity: 1 }
                  : { scale: 1, opacity: 1 }
              }
              exit={
                prefersReducedMotion
                  ? { opacity: 0 }
                  : { scale: 0.8, opacity: 0 }
              }
              transition={{ duration: 0.3 }}
              className="fixed inset-0 flex items-center justify-center bg-background/80 px-6"
              role="alert"
              aria-live="assertive"
              data-testid="feedback-overlay"
            >
              <div className="text-center max-w-sm">
                {isCorrect ? (
                  <>
                    <div className="mb-4 flex justify-center">
                      <Check
                        className="h-24 w-24 text-green-500"
                        aria-hidden="true"
                      />
                    </div>
                    <p className="text-2xl font-bold text-green-500 mb-3">
                      Correct!
                    </p>
                    <p
                      className="text-base text-muted-foreground"
                      data-testid="feedback-explanation"
                    >
                      {explanation}
                    </p>
                    <p className="sr-only">Correct! {explanation}</p>
                  </>
                ) : (
                  <>
                    <div className="mb-4 flex justify-center">
                      <X
                        className="h-24 w-24 text-yellow-500"
                        aria-hidden="true"
                      />
                    </div>
                    <p className="text-lg font-medium text-foreground mb-2">
                      Not quite — keep going!
                    </p>
                    <p
                      className="text-2xl font-semibold text-primary mb-3"
                      data-testid="correct-decomposition"
                    >
                      {explanation.split('.')[0]}
                    </p>
                    <p
                      className="text-base text-muted-foreground"
                      data-testid="feedback-explanation"
                    >
                      {explanation}
                    </p>
                    <p className="sr-only">
                      Incorrect. {explanation}
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
