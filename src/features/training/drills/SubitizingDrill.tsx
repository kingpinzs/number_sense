/**
 * SubitizingDrill Component
 * Trains instant quantity recognition — the #1 evidence-based dyscalculia intervention.
 *
 * Shows a group of dots briefly, then hides them. User must identify the quantity.
 * Progressively shorter display times and more dots at higher difficulty levels.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { db } from '@/services/storage/db';
import { STORAGE_KEYS } from '@/services/storage/localStorage';
import type { DrillResult } from '@/services/storage/schemas';

export interface DrillProps {
  difficulty: 'easy' | 'medium' | 'hard';
  sessionId: number;
  onComplete: (result: DrillResult) => void;
  onSkip?: () => void;
}

interface DotPosition {
  x: number;
  y: number;
}

/** Difficulty → dot count range and display time */
const DIFFICULTY_CONFIG = {
  easy:   { minDots: 1, maxDots: 4,  displayMs: 2000 },
  medium: { minDots: 3, maxDots: 7,  displayMs: 1200 },
  hard:   { minDots: 5, maxDots: 10, displayMs: 600 },
} as const;

/** Generate non-overlapping random dot positions within a circle */
function generateDotPositions(count: number): DotPosition[] {
  const positions: DotPosition[] = [];
  const minDistance = 18; // Minimum px between dot centers (prevents overlap)
  let attempts = 0;
  const maxAttempts = 500;

  while (positions.length < count && attempts < maxAttempts) {
    // Place dots within a 200×200 area with 20px padding
    const x = 20 + Math.random() * 160;
    const y = 20 + Math.random() * 160;

    // Check minimum distance from all existing dots
    const tooClose = positions.some(
      (p) => Math.hypot(p.x - x, p.y - y) < minDistance
    );

    if (!tooClose) {
      positions.push({ x, y });
    }
    attempts++;
  }

  // Fallback: if we couldn't place all dots, use a grid
  while (positions.length < count) {
    const idx = positions.length;
    const cols = Math.ceil(Math.sqrt(count));
    const row = Math.floor(idx / cols);
    const col = idx % cols;
    positions.push({
      x: 30 + col * (140 / cols),
      y: 30 + row * (140 / Math.ceil(count / cols)),
    });
  }

  return positions;
}

export default function SubitizingDrill({ difficulty, sessionId, onComplete }: DrillProps) {
  const config = DIFFICULTY_CONFIG[difficulty];

  // Generate target count and dot positions on mount
  const [targetCount] = useState(() => {
    const { minDots, maxDots } = config;
    return minDots + Math.floor(Math.random() * (maxDots - minDots + 1));
  });
  const [dotPositions] = useState(() => generateDotPositions(targetCount));

  // Phases: 'showing' → 'hidden' → 'answered'
  const [phase, setPhase] = useState<'showing' | 'hidden' | 'answered'>('showing');
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isCorrect, setIsCorrect] = useState(false);
  const [startTime] = useState(Date.now());
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Check for prefers-reduced-motion
  const prefersReducedMotion = typeof window !== 'undefined'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  // Auto-hide dots after display time
  useEffect(() => {
    timerRef.current = setTimeout(() => {
      setPhase('hidden');
    }, config.displayMs);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [config.displayMs]);

  const handleAnswer = useCallback(async (answer: number) => {
    if (phase === 'answered') return;

    const correct = answer === targetCount;
    const timeToAnswer = Date.now() - startTime;

    setSelectedAnswer(answer);
    setIsCorrect(correct);
    setPhase('answered');

    const result: DrillResult = {
      sessionId,
      timestamp: new Date().toISOString(),
      module: 'subitizing',
      difficulty,
      isCorrect: correct,
      timeToAnswer,
      accuracy: correct ? 100 : 0,
      targetNumber: targetCount,
      userAnswer: answer,
      correctAnswer: targetCount,
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

    // Auto-advance after feedback
    setTimeout(() => {
      onComplete(result);
    }, 1500);
  }, [phase, targetCount, startTime, sessionId, difficulty, onComplete]);

  // Generate answer options (correct + 3 distractors)
  const answerOptions = (() => {
    const options = new Set<number>([targetCount]);
    // Add nearby distractors
    const nearby = [targetCount - 1, targetCount + 1, targetCount - 2, targetCount + 2];
    for (const n of nearby) {
      if (n >= 1 && n <= 12 && options.size < 4) {
        options.add(n);
      }
    }
    // Fill remaining with random if needed
    while (options.size < 4) {
      const n = 1 + Math.floor(Math.random() * 12);
      if (!options.has(n)) options.add(n);
    }
    return [...options].sort((a, b) => a - b);
  })();

  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center bg-background p-6"
      role="application"
      aria-label="Subitizing drill"
    >
      <div className="w-full max-w-md space-y-8">
        {/* Instruction */}
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-foreground" aria-live="polite">
            How many dots?
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {phase === 'showing'
              ? 'Count quickly!'
              : phase === 'hidden'
                ? 'Select your answer'
                : isCorrect
                  ? 'Correct!'
                  : `The answer was ${targetCount}`}
          </p>
        </div>

        {/* Dot display area */}
        <div className="flex justify-center">
          <div
            className="relative h-[200px] w-[200px] rounded-2xl bg-muted"
            aria-label={phase === 'showing' ? `${targetCount} dots displayed` : 'Dots hidden'}
          >
            <AnimatePresence>
              {phase === 'showing' && dotPositions.map((pos, i) => (
                <motion.div
                  key={i}
                  initial={prefersReducedMotion ? { opacity: 1 } : { scale: 0, opacity: 0 }}
                  animate={prefersReducedMotion ? { opacity: 1 } : { scale: 1, opacity: 1 }}
                  exit={prefersReducedMotion ? { opacity: 0 } : { scale: 0, opacity: 0 }}
                  transition={{ duration: 0.15, delay: i * 0.02 }}
                  className="absolute h-5 w-5 rounded-full bg-primary shadow-md"
                  style={{ left: pos.x, top: pos.y }}
                />
              ))}
            </AnimatePresence>

            {phase === 'hidden' && (
              <div className="flex h-full items-center justify-center">
                <span className="text-4xl text-muted-foreground/40">?</span>
              </div>
            )}

            {phase === 'answered' && (
              <div className="flex h-full items-center justify-center">
                {isCorrect ? (
                  <Check className="h-16 w-16 text-green-500" />
                ) : (
                  <X className="h-16 w-16 text-yellow-500" />
                )}
              </div>
            )}
          </div>
        </div>

        {/* Answer buttons */}
        {phase !== 'showing' && (
          <div className="grid grid-cols-2 gap-3">
            {answerOptions.map((option) => {
              const isSelected = selectedAnswer === option;
              const showCorrect = phase === 'answered' && option === targetCount;
              const showWrong = phase === 'answered' && isSelected && !isCorrect;

              return (
                <Button
                  key={option}
                  variant={showCorrect ? 'default' : showWrong ? 'destructive' : 'outline'}
                  size="lg"
                  className={`min-h-[60px] text-2xl font-bold ${
                    showCorrect ? 'bg-green-600 hover:bg-green-600' : ''
                  }`}
                  onClick={() => handleAnswer(option)}
                  disabled={phase === 'answered'}
                  aria-label={`${option} dots`}
                >
                  {option}
                </Button>
              );
            })}
          </div>
        )}

        {/* Progress indicator during showing phase */}
        {phase === 'showing' && (
          <div className="flex justify-center">
            <div className="h-1 w-32 overflow-hidden rounded-full bg-muted">
              <motion.div
                className="h-full bg-primary"
                initial={{ width: '100%' }}
                animate={{ width: '0%' }}
                transition={{ duration: config.displayMs / 1000, ease: 'linear' }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
