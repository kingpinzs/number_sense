// SymbolicComparison - Compare two written numbers, tap the bigger one
// Assesses symbolic number comparison ability

import { useState, useCallback, useRef, useEffect } from 'react';
import { Button } from '@/shared/components/ui/button';
import { QuestionCard } from './QuestionCard';

export interface SymbolicComparisonResult {
  /** User's answer: 'left' or 'right' */
  answer: 'left' | 'right';
  /** Whether the answer was correct */
  isCorrect: boolean;
  /** Time to answer in milliseconds */
  timeToAnswer: number;
}

export interface SymbolicComparisonProps {
  /** Number shown on the left */
  leftNumber: number;
  /** Number shown on the right */
  rightNumber: number;
  /** Callback when user answers */
  onAnswer: (result: SymbolicComparisonResult) => void;
}

/**
 * SymbolicComparison - Two large written numbers, tap the bigger one
 *
 * Features:
 * - Displays two numbers in large side-by-side boxes
 * - User taps the bigger number
 * - Records timing with performance.now()
 * - 44px+ touch targets for accessibility
 * - No visual feedback during assessment
 */
export function SymbolicComparison({
  leftNumber,
  rightNumber,
  onAnswer,
}: SymbolicComparisonProps) {
  const startTimeRef = useRef<number>(performance.now());
  const [answered, setAnswered] = useState(false);

  // Reset when question changes
  useEffect(() => {
    startTimeRef.current = performance.now();
    setAnswered(false);
  }, [leftNumber, rightNumber]);

  const correctAnswer: 'left' | 'right' =
    leftNumber >= rightNumber ? 'left' : 'right';

  const handleAnswer = useCallback(
    (answer: 'left' | 'right') => {
      if (answered) return;

      const timeToAnswer = performance.now() - startTimeRef.current;
      const isCorrect = answer === correctAnswer;

      setAnswered(true);

      onAnswer({
        answer,
        isCorrect,
        timeToAnswer,
      });
    },
    [answered, correctAnswer, onAnswer]
  );

  return (
    <QuestionCard
      question="Tap the bigger number"
      data-testid="symbolic-comparison"
    >
      <div className="flex flex-col items-center gap-8 w-full">
        <div
          className="flex items-center justify-center gap-6 w-full"
          data-testid="numbers-display"
        >
          {/* Left number */}
          <Button
            variant="outline"
            onClick={() => handleAnswer('left')}
            disabled={answered}
            className="flex-1 max-w-[160px] min-h-[100px] text-4xl font-bold rounded-xl border-2"
            data-testid="left-number"
            aria-label={`${leftNumber}`}
          >
            {leftNumber}
          </Button>

          <span className="text-2xl font-bold text-muted-foreground shrink-0">
            vs
          </span>

          {/* Right number */}
          <Button
            variant="outline"
            onClick={() => handleAnswer('right')}
            disabled={answered}
            className="flex-1 max-w-[160px] min-h-[100px] text-4xl font-bold rounded-xl border-2"
            data-testid="right-number"
            aria-label={`${rightNumber}`}
          >
            {rightNumber}
          </Button>
        </div>

        <p
          className="text-center text-sm text-muted-foreground"
          data-testid="instruction-text"
        >
          {answered ? 'Answer recorded' : 'Tap the number that is bigger'}
        </p>
      </div>
    </QuestionCard>
  );
}

export default SymbolicComparison;
