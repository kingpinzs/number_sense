// NumberLineEstimation - Number line position estimation question
// Story 2.2: Implement Number Sense Question Types
// AC4-AC7: Number line with range, position click, tolerance, recording

import { useState, useCallback, useRef, useEffect } from 'react';
import { QuestionCard } from './QuestionCard';

export interface NumberLineResult {
  /** User's estimated position (0-100 percentage) */
  userAnswer: number;
  /** Correct position (0-100 percentage) */
  correctAnswer: number;
  /** Absolute error in percentage points */
  error: number;
  /** Whether within ±10% tolerance */
  isCorrect: boolean;
  /** Time to answer in milliseconds */
  timeToAnswer: number;
  /** The target number */
  targetNumber: number;
  /** The range used [min, max] */
  range: [number, number];
}

export interface NumberLineEstimationProps {
  /** Range of the number line [min, max] */
  range: [number, number];
  /** Target number to locate */
  targetNumber: number;
  /** Callback when user clicks position */
  onAnswer: (result: NumberLineResult) => void;
  /** Tolerance for correct answer (default 10%) */
  tolerance?: number;
}

/** Tolerance for correct answer: ±10% */
const DEFAULT_TOLERANCE = 10;

/**
 * NumberLineEstimation - Shows number line for position estimation
 *
 * Features:
 * - Horizontal number line with range labels
 * - Click handler calculates percentage position
 * - ±10% tolerance for correct answer
 * - Records all required fields
 * - No visual feedback during assessment
 */
export function NumberLineEstimation({
  range,
  targetNumber,
  onAnswer,
  tolerance = DEFAULT_TOLERANCE,
}: NumberLineEstimationProps) {
  const startTimeRef = useRef<number>(performance.now());
  const [answered, setAnswered] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState<number | null>(null);
  const lineRef = useRef<HTMLDivElement>(null);

  const [min, max] = range;

  // Reset when question changes
  useEffect(() => {
    startTimeRef.current = performance.now();
    setAnswered(false);
    setSelectedPosition(null);
  }, [targetNumber, min, max]);

  // Calculate correct position as percentage
  const correctPosition = ((targetNumber - min) / (max - min)) * 100;

  const handleLineClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (answered || !lineRef.current) return;

      const rect = lineRef.current.getBoundingClientRect();
      const clickX = event.clientX - rect.left;
      const percentage = Math.max(0, Math.min(100, (clickX / rect.width) * 100));

      const timeToAnswer = performance.now() - startTimeRef.current;
      const error = Math.abs(percentage - correctPosition);
      const isCorrect = error <= tolerance;

      setAnswered(true);
      setSelectedPosition(percentage);

      onAnswer({
        userAnswer: percentage,
        correctAnswer: correctPosition,
        error,
        isCorrect,
        timeToAnswer,
        targetNumber,
        range,
      });
    },
    [answered, correctPosition, tolerance, targetNumber, range, onAnswer]
  );

  // Handle keyboard interaction for accessibility
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (answered) return;

      // Allow Enter/Space to place at current focus position (center)
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        // Simulate click at center for keyboard users
        const percentage = 50;
        const timeToAnswer = performance.now() - startTimeRef.current;
        const error = Math.abs(percentage - correctPosition);
        const isCorrect = error <= tolerance;

        setAnswered(true);
        setSelectedPosition(percentage);

        onAnswer({
          userAnswer: percentage,
          correctAnswer: correctPosition,
          error,
          isCorrect,
          timeToAnswer,
          targetNumber,
          range,
        });
      }
    },
    [answered, correctPosition, tolerance, targetNumber, range, onAnswer]
  );

  return (
    <QuestionCard
      question={`Where is ${targetNumber} on this line?`}
      data-testid="number-line-estimation"
    >
      <div className="w-full max-w-sm px-4">
        {/* Number line container */}
        <div
          ref={lineRef}
          className="relative h-16 cursor-pointer touch-manipulation"
          onClick={handleLineClick}
          onKeyDown={handleKeyDown}
          role="slider"
          aria-label={`Number line from ${min} to ${max}. Find where ${targetNumber} should be.`}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={selectedPosition !== null ? Math.round((selectedPosition / 100) * (max - min) + min) : undefined}
          tabIndex={answered ? -1 : 0}
          data-testid="number-line"
        >
          {/* Line track */}
          <div
            className="absolute top-1/2 left-0 right-0 h-1 bg-border rounded-full -translate-y-1/2"
            data-testid="line-track"
          />

          {/* Start tick and label */}
          <div className="absolute left-0 top-1/2 -translate-y-1/2 flex flex-col items-center">
            <div className="w-0.5 h-4 bg-foreground rounded-full" />
            <span
              className="text-sm font-medium mt-1"
              data-testid="range-min"
            >
              {min}
            </span>
          </div>

          {/* End tick and label */}
          <div className="absolute right-0 top-1/2 -translate-y-1/2 flex flex-col items-center">
            <div className="w-0.5 h-4 bg-foreground rounded-full" />
            <span
              className="text-sm font-medium mt-1"
              data-testid="range-max"
            >
              {max}
            </span>
          </div>

          {/* User's selected position marker */}
          {selectedPosition !== null && (
            <div
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 bg-primary rounded-full border-2 border-background shadow-md"
              style={{ left: `${selectedPosition}%` }}
              data-testid="position-marker"
              aria-label={`Your answer: ${Math.round((selectedPosition / 100) * (max - min) + min)}`}
            />
          )}
        </div>

        {/* Instruction text */}
        <p
          className="text-center text-sm text-muted-foreground mt-4"
          data-testid="instruction-text"
        >
          {answered
            ? 'Answer recorded'
            : 'Tap or click on the line to mark your answer'}
        </p>
      </div>
    </QuestionCard>
  );
}

export default NumberLineEstimation;
