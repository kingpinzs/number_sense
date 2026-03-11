/**
 * FractionsDrill Component
 * Trains fraction recognition from visual representations — essential for part-whole understanding.
 *
 * Shows a shape (rectangle or circle) divided into equal parts with some shaded.
 * User selects the correct fraction from 4 multiple-choice options.
 * Easy: halves/quarters. Medium: thirds/sixths. Hard: eighths/twelfths.
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

interface FractionProblem {
  numerator: number;
  denominator: number;
  shape: 'rectangle' | 'circle';
  choices: string[];
  correctIndex: number;
}

/** Difficulty → denominator options */
const DIFFICULTY_CONFIG = {
  easy:   { denominators: [2, 4] },
  medium: { denominators: [3, 6] },
  hard:   { denominators: [8, 12] },
} as const;

/** Shuffle an array in place (Fisher-Yates) and return it */
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Greatest common divisor for simplifying fractions */
function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

/** Format a fraction string, simplifying if possible */
function formatFraction(num: number, den: number): string {
  const g = gcd(num, den);
  const sNum = num / g;
  const sDen = den / g;
  if (sDen === 1) return String(sNum);
  return `${sNum}/${sDen}`;
}

function generateFractionProblem(difficulty: 'easy' | 'medium' | 'hard'): FractionProblem {
  const config = DIFFICULTY_CONFIG[difficulty];
  const denominator = config.denominators[Math.floor(Math.random() * config.denominators.length)];
  // Numerator between 1 and denominator - 1 (proper fractions only)
  const numerator = 1 + Math.floor(Math.random() * (denominator - 1));

  const shape = Math.random() < 0.5 ? 'rectangle' : 'circle';
  const correctFraction = formatFraction(numerator, denominator);

  // Generate 3 distractors that differ from the correct answer
  const distractors = new Set<string>();
  distractors.add(correctFraction);

  // Strategy: vary numerator and denominator to create plausible wrong answers
  const attempts = 0;
  while (distractors.size < 4 && attempts < 50) {
    let dNum: number;
    let dDen: number;
    const strategy = Math.floor(Math.random() * 3);
    if (strategy === 0) {
      // Different numerator, same denominator
      dNum = 1 + Math.floor(Math.random() * (denominator - 1));
      dDen = denominator;
    } else if (strategy === 1) {
      // Same numerator, different denominator
      dNum = numerator;
      const allDens = [2, 3, 4, 6, 8, 12];
      dDen = allDens[Math.floor(Math.random() * allDens.length)];
    } else {
      // Both different
      const allDens = [2, 3, 4, 6, 8, 12];
      dDen = allDens[Math.floor(Math.random() * allDens.length)];
      dNum = 1 + Math.floor(Math.random() * (dDen - 1));
    }
    const frac = formatFraction(dNum, dDen);
    if (frac !== correctFraction) {
      distractors.add(frac);
    }
  }

  // Fallback: ensure we have exactly 4 choices
  const fallbackOptions = ['1/2', '1/3', '2/3', '1/4', '3/4', '1/6', '5/6', '1/8', '3/8', '5/12'];
  for (const f of fallbackOptions) {
    if (distractors.size >= 4) break;
    if (f !== correctFraction) distractors.add(f);
  }

  const choicesArr = Array.from(distractors).slice(0, 4);
  const shuffled = shuffle(choicesArr);
  const correctIndex = shuffled.indexOf(correctFraction);

  return { numerator, denominator, shape, choices: shuffled, correctIndex };
}

/** SVG rectangle divided into equal vertical slices with some shaded */
function RectangleShape({ numerator, denominator, submitted, isCorrect }: {
  numerator: number; denominator: number; submitted: boolean; isCorrect: boolean;
}) {
  const width = 240;
  const height = 120;
  const sliceWidth = width / denominator;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="w-full max-w-[240px] h-auto mx-auto"
      role="img"
      aria-label={`Rectangle divided into ${denominator} equal parts with ${numerator} shaded`}
      data-testid="fraction-shape"
    >
      {Array.from({ length: denominator }, (_, i) => (
        <rect
          key={i}
          x={i * sliceWidth}
          y={0}
          width={sliceWidth}
          height={height}
          fill={
            i < numerator
              ? submitted
                ? isCorrect ? '#22c55e' : '#eab308'
                : 'var(--primary)'
              : 'var(--muted)'
          }
          stroke="var(--border)"
          strokeWidth={2}
        />
      ))}
    </svg>
  );
}

/** SVG circle divided into equal wedge slices with some shaded */
function CircleShape({ numerator, denominator, submitted, isCorrect }: {
  numerator: number; denominator: number; submitted: boolean; isCorrect: boolean;
}) {
  const cx = 120;
  const cy = 120;
  const r = 100;
  const angleStep = (2 * Math.PI) / denominator;

  function wedgePath(index: number): string {
    const startAngle = index * angleStep - Math.PI / 2;
    const endAngle = (index + 1) * angleStep - Math.PI / 2;
    const x1 = cx + r * Math.cos(startAngle);
    const y1 = cy + r * Math.sin(startAngle);
    const x2 = cx + r * Math.cos(endAngle);
    const y2 = cy + r * Math.sin(endAngle);
    const largeArc = angleStep > Math.PI ? 1 : 0;
    return `M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${largeArc},1 ${x2},${y2} Z`;
  }

  return (
    <svg
      viewBox="0 0 240 240"
      className="w-full max-w-[240px] h-auto mx-auto"
      role="img"
      aria-label={`Circle divided into ${denominator} equal parts with ${numerator} shaded`}
      data-testid="fraction-shape"
    >
      {Array.from({ length: denominator }, (_, i) => (
        <path
          key={i}
          d={wedgePath(i)}
          fill={
            i < numerator
              ? submitted
                ? isCorrect ? '#22c55e' : '#eab308'
                : 'var(--primary)'
              : 'var(--muted)'
          }
          stroke="var(--border)"
          strokeWidth={2}
        />
      ))}
    </svg>
  );
}

export default function FractionsDrill({ difficulty, sessionId, onComplete }: DrillProps) {
  const [problem] = useState(() => generateFractionProblem(difficulty));
  const { numerator, denominator, shape, choices, correctIndex } = problem;
  const correctFraction = choices[correctIndex];

  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
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

  const handleChoice = async (index: number) => {
    if (submitted) return;

    const correct = index === correctIndex;
    const timeToAnswer = Date.now() - startTime;

    setSelectedIndex(index);
    setIsCorrect(correct);
    setSubmitted(true);
    setShowFeedback(true);

    const result: DrillResult = {
      sessionId,
      timestamp: new Date().toISOString(),
      module: 'fractions',
      difficulty,
      isCorrect: correct,
      timeToAnswer,
      accuracy: correct ? 100 : 0,
      targetNumber: numerator,
      userAnswer: index,
      correctAnswer: correctIndex,
      problem: `What fraction is shaded? (${numerator}/${denominator})`,
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
      tabIndex={0}
      role="application"
      aria-label="Fractions drill"
      data-testid="fractions-drill"
    >
      <div className="w-full max-w-md space-y-8">
        {/* Problem display */}
        <div className="text-center">
          <p className="text-sm font-medium text-muted-foreground mb-2">Fractions</p>
          <h2
            className="text-2xl font-bold text-foreground mb-6"
            style={{ fontSize: 'clamp(20px, 5vw, 32px)' }}
            aria-live="polite"
            aria-atomic="true"
            data-testid="fraction-question"
          >
            What fraction is shaded?
          </h2>
        </div>

        {/* Shape visualization */}
        <div className="flex justify-center py-4" data-testid="shape-container">
          {shape === 'rectangle' ? (
            <RectangleShape
              numerator={numerator}
              denominator={denominator}
              submitted={submitted}
              isCorrect={isCorrect}
            />
          ) : (
            <CircleShape
              numerator={numerator}
              denominator={denominator}
              submitted={submitted}
              isCorrect={isCorrect}
            />
          )}
        </div>

        {/* Multiple-choice buttons */}
        <div
          className="grid grid-cols-2 gap-3"
          role="group"
          aria-label="Fraction choices"
          data-testid="choices-container"
        >
          {choices.map((choice, i) => {
            let buttonClass = 'min-h-[56px] rounded-lg border-2 px-4 py-3 text-xl font-semibold transition-colors ';
            if (submitted) {
              if (i === correctIndex) {
                buttonClass += 'border-green-500 bg-green-500/20 text-green-500';
              } else if (i === selectedIndex) {
                buttonClass += 'border-yellow-500 bg-yellow-500/20 text-yellow-500';
              } else {
                buttonClass += 'border-border bg-card text-muted-foreground opacity-50';
              }
            } else {
              buttonClass += 'border-primary bg-card text-foreground hover:bg-primary/10 cursor-pointer';
            }

            return (
              <button
                key={i}
                type="button"
                onClick={() => handleChoice(i)}
                disabled={submitted}
                className={buttonClass}
                aria-label={`Choice: ${choice}`}
                data-testid={`choice-${i}`}
              >
                {choice}
              </button>
            );
          })}
        </div>

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
                      {correctFraction}
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
                      The answer is {correctFraction}
                    </p>
                    <p className="sr-only">
                      The answer is {correctFraction}. {numerator} out of {denominator} parts are shaded.
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
