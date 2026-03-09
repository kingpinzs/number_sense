/**
 * SpatialRotationDrill Component
 * Story 3.3: Spatial rotation drill for visual-spatial reasoning training
 *
 * User mentally rotates and mirrors 2D shapes to determine if they match.
 * Provides visual feedback, calculates accuracy, and records drill results to Dexie.
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { db } from '@/services/storage/db';
import { STORAGE_KEYS } from '@/services/storage/localStorage';
import type { DrillResult } from '@/services/storage/schemas';
import {
  SHAPES,
  type ShapeType,
  EASY_SHAPES,
  MEDIUM_SHAPES,
  HARD_SHAPES,
  rotateShape,
  mirrorShape,
  rotateAndMirrorShape,
} from '../content/shapes';

/**
 * DrillProps interface per Epic 3 tech spec
 */
export interface DrillProps {
  difficulty: 'easy' | 'medium' | 'hard';
  sessionId: number;
  onComplete: (result: DrillResult) => void;
  onSkip?: () => void; // Optional skip functionality (deferred to Epic 4)
}

/**
 * Drill problem structure
 */
interface DrillProblem {
  referenceShape: ShapeType;
  comparisonShape: ShapeType;
  rotationDegrees: number;
  isMirrored: boolean;
  correctAnswer: boolean; // true if shapes are the same
}

/**
 * Rotation angles based on difficulty
 */
const ROTATION_ANGLES = {
  easy: [0, 90, 180, 270],
  medium: [0, 45, 90, 180, 270],
  hard: [0, 45, 90, 135, 180, 225, 270, 315],
};

/**
 * Generate a random drill problem based on difficulty
 */
const generateDrillProblem = (difficulty: 'easy' | 'medium' | 'hard'): DrillProblem => {
  const shapeSet = difficulty === 'easy' ? EASY_SHAPES : difficulty === 'medium' ? MEDIUM_SHAPES : HARD_SHAPES;
  const rotations = ROTATION_ANGLES[difficulty];

  // Select random shape
  const referenceShape = shapeSet[Math.floor(Math.random() * shapeSet.length)];

  // 50% chance that comparison is the same shape
  const isSame = Math.random() < 0.5;

  // If same, apply transformations. If different, select different shape
  const comparisonShape = isSame
    ? referenceShape
    : shapeSet[Math.floor(Math.random() * shapeSet.length)];

  // Apply rotation based on difficulty
  const rotationDegrees = rotations[Math.floor(Math.random() * rotations.length)];

  // Apply mirroring based on difficulty
  let isMirrored = false;
  if (difficulty === 'medium') {
    // Medium: 30% chance of mirroring (not both rotation and mirroring)
    isMirrored = rotationDegrees === 0 && Math.random() < 0.3;
  } else if (difficulty === 'hard') {
    // Hard: 50% chance of mirroring (can combine with rotation)
    isMirrored = Math.random() < 0.5;
  }

  return {
    referenceShape,
    comparisonShape,
    rotationDegrees,
    isMirrored,
    correctAnswer: isSame,
  };
};

export default function SpatialRotationDrill({ difficulty, sessionId, onComplete }: DrillProps) {
  // Generate drill problem on mount
  const [problem] = useState<DrillProblem>(() => generateDrillProblem(difficulty));

  // State management
  const [, setUserAnswer] = useState<boolean | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [startTime] = useState(Date.now());

  // Check for prefers-reduced-motion
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Get shape components
  const ReferenceShapeComponent = SHAPES[problem.referenceShape];
  const ComparisonShapeComponent = SHAPES[problem.comparisonShape];

  // Handle answer selection
  const handleAnswer = async (answer: boolean) => {
    if (submitted) return;

    const timeToAnswer = Date.now() - startTime;
    const correct = answer === problem.correctAnswer;

    setUserAnswer(answer);
    setIsCorrect(correct);
    setSubmitted(true);
    setShowFeedback(true);

    // Create drill result
    const result: DrillResult = {
      sessionId,
      timestamp: new Date().toISOString(),
      module: 'spatial_rotation',
      difficulty,
      isCorrect: correct,
      timeToAnswer,
      accuracy: correct ? 100 : 0, // Binary: 100 if correct, 0 if incorrect
      shapeType: problem.referenceShape,
      rotationDegrees: problem.rotationDegrees,
      isMirrored: problem.isMirrored,
      userAnswer: answer ? 1 : 0, // Store as number (1 = "Yes, Same", 0 = "No, Different")
      correctAnswer: problem.correctAnswer ? 1 : 0,
    };

    // Persist to Dexie with try-catch and localStorage fallback
    try {
      await db.drill_results.add(result);
    } catch (error) {
      console.error('Failed to persist drill result:', error);
      // Fallback to localStorage backup
      try {
        const backup = localStorage.getItem(STORAGE_KEYS.DRILL_RESULTS_BACKUP);
        const results = backup ? JSON.parse(backup) : [];
        results.push(result);
        localStorage.setItem(STORAGE_KEYS.DRILL_RESULTS_BACKUP, JSON.stringify(results));
      } catch {
        localStorage.setItem(STORAGE_KEYS.DRILL_RESULTS_BACKUP, JSON.stringify([result]));
      }
    }

    // Auto-advance after 1.5 seconds
    setTimeout(() => {
      onComplete(result);
    }, 1500);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (submitted) return;

    if (e.key === '1' || e.key === 'y' || e.key === 'Y') {
      e.preventDefault();
      handleAnswer(true);
    } else if (e.key === '2' || e.key === 'n' || e.key === 'N') {
      e.preventDefault();
      handleAnswer(false);
    }
  };

  // Calculate comparison shape style (rotation + mirroring)
  const getComparisonStyle = (): React.CSSProperties => {
    if (problem.isMirrored && problem.rotationDegrees > 0) {
      return rotateAndMirrorShape(problem.rotationDegrees);
    } else if (problem.isMirrored) {
      return mirrorShape();
    } else if (problem.rotationDegrees > 0) {
      return rotateShape(problem.rotationDegrees);
    }
    return {};
  };

  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center bg-background p-6"
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="application"
      aria-label="Spatial rotation drill"
    >
      <div className="w-full max-w-4xl space-y-8">
        {/* Question prompt */}
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-foreground" aria-live="polite">
            Are these the same shape?
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            The shape on the right may be rotated or mirrored
          </p>
        </div>

        {/* Shapes display (two-column grid) */}
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          {/* Reference shape (left) */}
          <div className="flex flex-col items-center space-y-4">
            <div className="text-sm font-medium text-muted-foreground">Reference</div>
            <div
              className="flex h-36 w-36 sm:h-48 sm:w-48 items-center justify-center rounded-lg border-2 border-muted bg-card p-4"
              aria-label={`Reference shape: ${problem.referenceShape}`}
            >
              <ReferenceShapeComponent className="h-full w-full text-foreground" />
            </div>
          </div>

          {/* Comparison shape (right) */}
          <div className="flex flex-col items-center space-y-4">
            <div className="text-sm font-medium text-muted-foreground">Comparison</div>
            <div
              className="flex h-36 w-36 sm:h-48 sm:w-48 items-center justify-center rounded-lg border-2 border-muted bg-card p-4"
              aria-label={`Comparison shape: ${problem.comparisonShape}${problem.isMirrored ? ' mirrored' : ''}${problem.rotationDegrees > 0 ? ` rotated ${problem.rotationDegrees} degrees` : ''}`}
            >
              <ComparisonShapeComponent
                className="h-full w-full text-foreground"
                style={getComparisonStyle()}
              />
            </div>
          </div>
        </div>

        {/* Feedback message */}
        <AnimatePresence>
          {showFeedback && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: prefersReducedMotion ? 0 : 0.5 }}
              className={`rounded-lg border p-4 text-center ${
                isCorrect
                  ? 'border-green-500 bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300'
                  : 'border-yellow-500 bg-yellow-50 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300'
              }`}
              role="alert"
              aria-live="assertive"
            >
              {isCorrect ? (
                <div className="flex items-center justify-center gap-2">
                  <Check className="h-6 w-6" />
                  <div>
                    <p className="text-lg font-semibold">Correct!</p>
                    <p className="mt-1 text-sm">Great spatial reasoning!</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <X className="h-6 w-6" />
                  <div>
                    <p className="text-lg font-semibold">Not quite!</p>
                    <p className="mt-1 text-sm">
                      {problem.correctAnswer
                        ? `These are the same shape ${
                            problem.isMirrored && problem.rotationDegrees > 0
                              ? `(mirrored and rotated ${problem.rotationDegrees}°)`
                              : problem.isMirrored
                              ? '(mirrored)'
                              : problem.rotationDegrees > 0
                              ? `(rotated ${problem.rotationDegrees}°)`
                              : ''
                          }`
                        : 'These are different shapes'}
                    </p>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Answer buttons */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Button
            onClick={() => handleAnswer(true)}
            disabled={submitted}
            className="min-h-[44px] bg-green-500 text-white hover:bg-green-600 disabled:bg-gray-300 disabled:text-gray-500"
            size="lg"
            aria-label="Yes, these are the same shape"
          >
            <motion.span
              whileHover={submitted ? {} : { scale: 1.05 }}
              whileTap={submitted ? {} : { scale: 0.95 }}
              className="flex items-center gap-2"
            >
              <Check className="h-5 w-5" />
              Yes, Same
            </motion.span>
          </Button>

          <Button
            onClick={() => handleAnswer(false)}
            disabled={submitted}
            className="min-h-[44px] bg-red-500 text-white hover:bg-red-600 disabled:bg-gray-300 disabled:text-gray-500"
            size="lg"
            aria-label="No, these are different shapes"
          >
            <motion.span
              whileHover={submitted ? {} : { scale: 1.05 }}
              whileTap={submitted ? {} : { scale: 0.95 }}
              className="flex items-center gap-2"
            >
              <X className="h-5 w-5" />
              No, Different
            </motion.span>
          </Button>
        </div>

        {/* Keyboard navigation hint */}
        <div className="text-center text-xs text-muted-foreground">
          Press <kbd className="rounded bg-muted px-1">1</kbd> or <kbd className="rounded bg-muted px-1">Y</kbd> for Yes,{' '}
          <kbd className="rounded bg-muted px-1">2</kbd> or <kbd className="rounded bg-muted px-1">N</kbd> for No
        </div>
      </div>
    </div>
  );
}
