/**
 * MentalMathStrategyDrill Component
 *
 * Teaches the specific mental math shortcuts that neurotypical people use
 * instinctively (Make 10, Near Doubles, Compensation, Partitioning, etc.).
 *
 * Flow:
 *   1. TEACH phase — display strategy name + worked example, steps revealed one
 *      at a time (1 s apart).
 *   2. PRACTICE phase — new problem using the same strategy; user types answer.
 *   3. FEEDBACK phase — correct/incorrect, then the strategy steps for the new
 *      problem are shown before onComplete fires.
 */

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent } from '@/shared/components/ui/card';
import { db } from '@/services/storage/db';
import type { DrillResult } from '@/services/storage/schemas';

// ---------------------------------------------------------------------------
// Public interface — must be re-declared in each drill file per project spec
// ---------------------------------------------------------------------------
export interface DrillProps {
  difficulty: 'easy' | 'medium' | 'hard';
  sessionId: number;
  onComplete: (result: DrillResult) => void;
  onSkip?: () => void;
}

// ---------------------------------------------------------------------------
// Data types
// ---------------------------------------------------------------------------

/**
 * A single step in a strategy walkthrough.
 * `label` is the plain-text label shown to the left of `expression`.
 */
interface WorkedStep {
  label: string;
  expression: string;
  highlight?: 'primary' | 'result';
}

interface Strategy {
  name: string;
  description: string;
  /** Worked example — fixed numbers, purely illustrative */
  workedSteps: WorkedStep[];
  /** Generate a fresh practice problem and its solution steps */
  generateProblem: () => PracticeProblem;
}

interface PracticeProblem {
  display: string;         // e.g. "7 + 8"
  answer: number;
  solutionSteps: WorkedStep[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Return a random integer in [min, max] (inclusive). */
function rand(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min + 1));
}

// ---------------------------------------------------------------------------
// Strategy definitions per difficulty
// ---------------------------------------------------------------------------

/** Easy: Make 10 */
function genMake10(): PracticeProblem {
  // Pick a + b where a is 6–9, b is 2–9, and they sum > 10
  const a = rand(6, 9);
  const bMin = 11 - a; // minimum b so sum > 10
  const b = rand(bMin, 9);
  const carry = 10 - a;
  const remainder = b - carry;
  const answer = a + b;
  return {
    display: `${a} + ${b}`,
    answer,
    solutionSteps: [
      { label: 'Start', expression: `${a} + ${b}`, highlight: 'primary' },
      { label: 'Split', expression: `${a} + ${carry} + ${remainder}`, highlight: 'primary' },
      { label: 'Make 10', expression: `10 + ${remainder}`, highlight: 'primary' },
      { label: 'Answer', expression: `= ${answer}`, highlight: 'result' },
    ],
  };
}

/** Easy: Doubles */
function genDoubles(): PracticeProblem {
  const n = rand(2, 9);
  const answer = n * 2;
  return {
    display: `${n} + ${n}`,
    answer,
    solutionSteps: [
      { label: 'Recognise double', expression: `${n} + ${n}`, highlight: 'primary' },
      { label: 'Answer', expression: `= ${answer}`, highlight: 'result' },
    ],
  };
}

/** Easy: Count On */
function genCountOn(): PracticeProblem {
  // Small number (1-3) added to a bigger number (5-15)
  const small = rand(1, 3);
  const big = rand(5, 15);
  const answer = big + small;
  const steps: WorkedStep[] = [
    { label: 'Start from', expression: `${big}`, highlight: 'primary' },
  ];
  for (let i = 1; i <= small; i++) {
    steps.push({ label: `Count ${i}`, expression: `${big + i}`, highlight: 'primary' });
  }
  steps.push({ label: 'Answer', expression: `= ${answer}`, highlight: 'result' });
  return {
    display: `${big} + ${small}`,
    answer,
    solutionSteps: steps,
  };
}

/** Medium: Near Doubles */
function genNearDoubles(): PracticeProblem {
  const n = rand(3, 9);
  const a = n;
  const b = n + 1;
  const answer = a + b;
  return {
    display: `${a} + ${b}`,
    answer,
    solutionSteps: [
      { label: 'Near double', expression: `${a} + ${b}`, highlight: 'primary' },
      { label: 'Use double', expression: `${a} + ${a} + 1`, highlight: 'primary' },
      { label: 'Calculate', expression: `${a * 2} + 1`, highlight: 'primary' },
      { label: 'Answer', expression: `= ${answer}`, highlight: 'result' },
    ],
  };
}

/** Medium: Compensation */
function genCompensation(): PracticeProblem {
  // Round one operand to nearest 10 (it's 1–3 away from a multiple of 10)
  const offset = rand(1, 3);
  const tensBase = rand(3, 8) * 10; // e.g. 30, 40 … 80
  const a = tensBase - offset;       // e.g. 47 or 38
  const b = rand(11, 30);
  const rounded = tensBase;
  const answer = a + b;
  return {
    display: `${a} + ${b}`,
    answer,
    solutionSteps: [
      { label: 'Round up', expression: `${rounded} + ${b}`, highlight: 'primary' },
      { label: 'Subtract extra', expression: `${rounded + b} - ${offset}`, highlight: 'primary' },
      { label: 'Answer', expression: `= ${answer}`, highlight: 'result' },
    ],
  };
}

/** Medium: Bridge Through 10 */
function genBridge10(): PracticeProblem {
  const a = rand(6, 9);
  const b = rand(4, 8);
  const toTen = 10 - a;
  const leftover = b - toTen;
  const answer = a + b;
  return {
    display: `${a} + ${b}`,
    answer,
    solutionSteps: [
      { label: 'Bridge to 10', expression: `${a} + ${toTen} = 10`, highlight: 'primary' },
      { label: 'Add remainder', expression: `10 + ${leftover} = ${answer}`, highlight: 'primary' },
      { label: 'Answer', expression: `= ${answer}`, highlight: 'result' },
    ],
  };
}

/** Hard: Splitting (Partitioning) */
function genSplitting(): PracticeProblem {
  const a1 = rand(1, 9) * 10;   // tens of a
  const a2 = rand(1, 9);        // units of a
  const b1 = rand(1, 9) * 10;
  const b2 = rand(1, 9);
  const a = a1 + a2;
  const b = b1 + b2;
  const answer = a + b;
  return {
    display: `${a} + ${b}`,
    answer,
    solutionSteps: [
      { label: 'Split tens', expression: `${a1} + ${b1} = ${a1 + b1}`, highlight: 'primary' },
      { label: 'Split ones', expression: `${a2} + ${b2} = ${a2 + b2}`, highlight: 'primary' },
      { label: 'Combine', expression: `${a1 + b1} + ${a2 + b2}`, highlight: 'primary' },
      { label: 'Answer', expression: `= ${answer}`, highlight: 'result' },
    ],
  };
}

/** Hard: Multiply by Splitting */
function genMultiplySplit(): PracticeProblem {
  const a = rand(6, 9);
  const b = rand(6, 9);
  // Split b into 5 + remainder
  const b1 = 5;
  const b2 = b - 5;
  const answer = a * b;
  return {
    display: `${a} \u00D7 ${b}`,
    answer,
    solutionSteps: [
      { label: 'Split', expression: `${a} \u00D7 ${b1} + ${a} \u00D7 ${b2}`, highlight: 'primary' },
      { label: 'Calculate', expression: `${a * b1} + ${a * b2}`, highlight: 'primary' },
      { label: 'Answer', expression: `= ${answer}`, highlight: 'result' },
    ],
  };
}

/** Hard: Subtract by Adding Up */
function genSubtractAddUp(): PracticeProblem {
  // minuend 51–99, subtrahend 11–49, gap > 10
  const subtrahend = rand(11, 49);
  const minuend = subtrahend + rand(11, 50);
  const answer = minuend - subtrahend;
  // Build "add-up" steps from subtrahend to minuend
  const toNextTen = 10 - (subtrahend % 10);
  const firstStop = subtrahend + toNextTen;
  const lastTen = Math.floor(minuend / 10) * 10;
  const finalBit = minuend - lastTen;
  const steps: WorkedStep[] = [
    { label: 'Start at', expression: `${subtrahend}`, highlight: 'primary' },
    { label: `Add ${toNextTen}`, expression: `${subtrahend} + ${toNextTen} = ${firstStop}`, highlight: 'primary' },
  ];
  if (firstStop < lastTen) {
    const jump = lastTen - firstStop;
    steps.push({ label: `Add ${jump}`, expression: `${firstStop} + ${jump} = ${lastTen}`, highlight: 'primary' });
  }
  if (finalBit > 0) {
    steps.push({ label: `Add ${finalBit}`, expression: `${lastTen} + ${finalBit} = ${minuend}`, highlight: 'primary' });
  }
  steps.push({ label: 'Answer', expression: `= ${answer}`, highlight: 'result' });
  return {
    display: `${minuend} - ${subtrahend}`,
    answer,
    solutionSteps: steps,
  };
}

// ---------------------------------------------------------------------------
// Strategy catalogue
// ---------------------------------------------------------------------------

const STRATEGIES: Record<'easy' | 'medium' | 'hard', Strategy[]> = {
  easy: [
    {
      name: 'Make 10',
      description: 'Break one number to reach 10, then add the rest.',
      workedSteps: [
        { label: 'Start', expression: '8 + 5', highlight: 'primary' },
        { label: 'Split', expression: '8 + 2 + 3', highlight: 'primary' },
        { label: 'Make 10', expression: '10 + 3', highlight: 'primary' },
        { label: 'Answer', expression: '= 13', highlight: 'result' },
      ],
      generateProblem: genMake10,
    },
    {
      name: 'Doubles',
      description: 'Memorise doubles as anchor points (6+6=12, 7+7=14…).',
      workedSteps: [
        { label: 'Recognise double', expression: '7 + 7', highlight: 'primary' },
        { label: 'Answer', expression: '= 14', highlight: 'result' },
      ],
      generateProblem: genDoubles,
    },
    {
      name: 'Count On',
      description: 'Start from the bigger number and count up by the small number.',
      workedSteps: [
        { label: 'Start from', expression: '8', highlight: 'primary' },
        { label: 'Count 1', expression: '9', highlight: 'primary' },
        { label: 'Count 2', expression: '10', highlight: 'primary' },
        { label: 'Count 3', expression: '11', highlight: 'primary' },
        { label: 'Answer', expression: '= 11', highlight: 'result' },
      ],
      generateProblem: genCountOn,
    },
  ],
  medium: [
    {
      name: 'Near Doubles',
      description: 'Use the nearest double, then adjust by 1.',
      workedSteps: [
        { label: 'Near double', expression: '6 + 7', highlight: 'primary' },
        { label: 'Use double', expression: '6 + 6 + 1', highlight: 'primary' },
        { label: 'Calculate', expression: '12 + 1', highlight: 'primary' },
        { label: 'Answer', expression: '= 13', highlight: 'result' },
      ],
      generateProblem: genNearDoubles,
    },
    {
      name: 'Compensation',
      description: 'Round to a friendly number, then subtract the extra.',
      workedSteps: [
        { label: 'Round up', expression: '50 + 26', highlight: 'primary' },
        { label: 'Subtract extra', expression: '76 - 1', highlight: 'primary' },
        { label: 'Answer', expression: '= 75', highlight: 'result' },
      ],
      generateProblem: genCompensation,
    },
    {
      name: 'Bridge Through 10',
      description: 'Add just enough to reach 10, then add the rest.',
      workedSteps: [
        { label: 'Bridge to 10', expression: '8 + 2 = 10', highlight: 'primary' },
        { label: 'Add remainder', expression: '10 + 5 = 15', highlight: 'primary' },
        { label: 'Answer', expression: '= 15', highlight: 'result' },
      ],
      generateProblem: genBridge10,
    },
  ],
  hard: [
    {
      name: 'Splitting',
      description: 'Partition both numbers into tens and ones, add separately.',
      workedSteps: [
        { label: 'Split tens', expression: '30 + 20 = 50', highlight: 'primary' },
        { label: 'Split ones', expression: '4 + 7 = 11', highlight: 'primary' },
        { label: 'Combine', expression: '50 + 11', highlight: 'primary' },
        { label: 'Answer', expression: '= 61', highlight: 'result' },
      ],
      generateProblem: genSplitting,
    },
    {
      name: 'Multiply by Splitting',
      description: 'Split one factor, multiply each part, then add.',
      workedSteps: [
        { label: 'Split', expression: '7 \u00D7 5 + 7 \u00D7 3', highlight: 'primary' },
        { label: 'Calculate', expression: '35 + 21', highlight: 'primary' },
        { label: 'Answer', expression: '= 56', highlight: 'result' },
      ],
      generateProblem: genMultiplySplit,
    },
    {
      name: 'Subtract by Adding Up',
      description: 'Count up from the subtrahend to the minuend.',
      workedSteps: [
        { label: 'Start at', expression: '47', highlight: 'primary' },
        { label: 'Add 3', expression: '47 + 3 = 50', highlight: 'primary' },
        { label: 'Add 30', expression: '50 + 30 = 80', highlight: 'primary' },
        { label: 'Add 3', expression: '80 + 3 = 83', highlight: 'primary' },
        { label: 'Answer', expression: '= 36', highlight: 'result' },
      ],
      generateProblem: genSubtractAddUp,
    },
  ],
};

// ---------------------------------------------------------------------------
// Phase type
// ---------------------------------------------------------------------------
type Phase = 'teach' | 'practice' | 'feedback';

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export default function MentalMathStrategyDrill({ difficulty, sessionId, onComplete }: DrillProps) {
  // Select a random strategy for this difficulty on mount
  const [strategy] = useState<Strategy>(() => {
    const pool = STRATEGIES[difficulty];
    return pool[Math.floor(Math.random() * pool.length)];
  });

  // Generate the practice problem on mount
  const [practice] = useState<PracticeProblem>(() => strategy.generateProblem());

  // How many worked steps are currently revealed (teach phase)
  const [revealedSteps, setRevealedSteps] = useState(0);

  // Current UI phase
  const [phase, setPhase] = useState<Phase>('teach');

  // User input (practice phase)
  const [userInput, setUserInput] = useState('');

  // Feedback state
  const [isCorrect, setIsCorrect] = useState(false);

  // Timer tracking
  const [startTime] = useState(Date.now());

  // Refs for timers so they can be cleaned up on unmount
  const stepRevealRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const prefersReducedMotion =
    typeof window !== 'undefined'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false;

  // ---------------------------------------------------------------------------
  // Teach phase: reveal one worked step per second
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (phase !== 'teach') return;

    const totalSteps = strategy.workedSteps.length;

    // Immediately show the first step
    setRevealedSteps(1);

    stepRevealRef.current = setInterval(() => {
      setRevealedSteps((prev) => {
        const next = prev + 1;
        if (next >= totalSteps) {
          // All steps revealed — stop interval
          if (stepRevealRef.current) {
            clearInterval(stepRevealRef.current);
            stepRevealRef.current = null;
          }
        }
        return next;
      });
    }, 1000);

    return () => {
      if (stepRevealRef.current) clearInterval(stepRevealRef.current);
    };
  }, [phase, strategy.workedSteps.length]);

  // ---------------------------------------------------------------------------
  // Cleanup on unmount
  // ---------------------------------------------------------------------------
  useEffect(() => {
    return () => {
      if (stepRevealRef.current) clearInterval(stepRevealRef.current);
      if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    };
  }, []);

  // ---------------------------------------------------------------------------
  // Derived: all steps revealed → enable "Practice" button
  // ---------------------------------------------------------------------------
  const allRevealed = revealedSteps >= strategy.workedSteps.length;

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  /** Move from teach to practice phase. */
  const handleStartPractice = () => {
    setPhase('practice');
  };

  /** Submit the user's answer. */
  const handleSubmit = async () => {
    if (phase !== 'practice' || userInput.trim() === '') return;

    const userAnswer = parseInt(userInput, 10);
    const correct = userAnswer === practice.answer;
    const timeToAnswer = Date.now() - startTime;

    setIsCorrect(correct);
    setPhase('feedback');

    const result: DrillResult = {
      sessionId,
      timestamp: new Date().toISOString(),
      module: 'mental_math_strategy',
      difficulty,
      isCorrect: correct,
      timeToAnswer,
      accuracy: correct ? 100 : 0,
      problem: practice.display,
      correctAnswer: practice.answer,
      userAnswer,
    };

    try {
      await db.drill_results.add(result);
    } catch (error) {
      console.error('Failed to persist drill result:', error);
    }

    feedbackTimerRef.current = setTimeout(() => {
      onComplete(result);
    }, 2500);
  };

  /** Handle Enter key in input. */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      void handleSubmit();
    }
  };

  // ---------------------------------------------------------------------------
  // Render helpers
  // ---------------------------------------------------------------------------

  /**
   * Render a list of strategy steps, with optional count limiting.
   * Each step is displayed as:
   *   [label]  [expression with styling]
   */
  function renderSteps(steps: WorkedStep[], limit?: number) {
    const visible = limit !== undefined ? steps.slice(0, limit) : steps;
    return (
      <div className="space-y-2" data-testid="strategy-steps">
        {visible.map((step, idx) => (
          <motion.div
            key={idx}
            initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, x: -8 }}
            animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            className="flex items-center gap-3"
          >
            <span className="w-28 shrink-0 text-right text-sm text-muted-foreground">
              {step.label}
            </span>
            <span className="text-foreground">&rarr;</span>
            <span
              className={
                step.highlight === 'result'
                  ? 'font-bold text-green-500 text-lg'
                  : 'rounded bg-primary/20 px-2 font-semibold text-foreground'
              }
            >
              {step.expression}
            </span>
          </motion.div>
        ))}
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center bg-background p-6"
      role="application"
      aria-label="Mental math strategy drill"
    >
      <div className="w-full max-w-md space-y-6">

        {/* Strategy name heading */}
        <div className="text-center">
          <p className="text-sm font-medium text-muted-foreground mb-1">Mental Math Strategy</p>
          <h2 className="text-xl font-bold text-foreground" data-testid="strategy-name">
            {strategy.name}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">{strategy.description}</p>
        </div>

        {/* ---------- TEACH PHASE ---------- */}
        {phase === 'teach' && (
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm font-semibold text-muted-foreground mb-4 text-center">
                Worked Example
              </p>
              {renderSteps(strategy.workedSteps, revealedSteps)}

              <div className="mt-6 flex justify-center">
                <Button
                  onClick={handleStartPractice}
                  disabled={!allRevealed}
                  className="min-h-[44px] w-full"
                  data-testid="practice-btn"
                  aria-label="Start practice"
                >
                  {allRevealed ? 'Now You Try!' : 'Showing Strategy\u2026'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ---------- PRACTICE PHASE ---------- */}
        {phase === 'practice' && (
          <div className="space-y-6" data-testid="practice-section">
            {/* Problem */}
            <div className="text-center">
              <p
                className="text-3xl font-bold text-foreground"
                aria-live="polite"
                aria-atomic="true"
              >
                {practice.display} = ?
              </p>
              <p className="mt-2 text-sm text-muted-foreground" data-testid="hint-text">
                Hint: Use {strategy.name}!
              </p>
            </div>

            {/* Input */}
            <div className="flex flex-col items-center gap-4">
              <input
                type="number"
                inputMode="numeric"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="?"
                className="w-[120px] rounded-lg border-2 border-primary bg-card px-4 py-3 text-center text-2xl font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                aria-label="Your answer"
                data-testid="answer-input"
              />
              <Button
                onClick={() => void handleSubmit()}
                disabled={userInput.trim() === ''}
                className="min-h-[44px] w-full max-w-[200px]"
                data-testid="submit-btn"
              >
                Check Answer
              </Button>
            </div>
          </div>
        )}

        {/* ---------- FEEDBACK PHASE ---------- */}
        <AnimatePresence>
          {phase === 'feedback' && (
            <motion.div
              initial={prefersReducedMotion ? { opacity: 0 } : { scale: 0.8, opacity: 0 }}
              animate={prefersReducedMotion ? { opacity: 1 } : { scale: 1, opacity: 1 }}
              exit={prefersReducedMotion ? { opacity: 0 } : { scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
              data-testid="feedback-section"
              role="alert"
              aria-live="assertive"
            >
              {/* Correct / Incorrect banner */}
              <div className="flex flex-col items-center gap-2">
                {isCorrect ? (
                  <>
                    <Check className="h-16 w-16 text-green-500" aria-hidden="true" />
                    <p className="text-xl font-bold text-green-500">Correct!</p>
                  </>
                ) : (
                  <>
                    <X className="h-16 w-16 text-yellow-500" aria-hidden="true" />
                    <p className="text-xl font-bold text-yellow-500">
                      Not quite — the answer is {practice.answer}
                    </p>
                  </>
                )}
                <p className="sr-only">
                  {isCorrect
                    ? `Correct! ${practice.display} equals ${practice.answer}.`
                    : `Incorrect. ${practice.display} equals ${practice.answer}.`}
                </p>
              </div>

              {/* Strategy solution steps for the practice problem */}
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm font-semibold text-muted-foreground mb-3 text-center">
                    Using {strategy.name}:
                  </p>
                  {renderSteps(practice.solutionSteps)}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
