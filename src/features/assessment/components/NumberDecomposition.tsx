// NumberDecomposition - Break a number into place values
// Assesses understanding of expanded form / place value decomposition

import { useState, useCallback, useRef, useEffect } from 'react';
import { Button } from '@/shared/components/ui/button';
import { QuestionCard } from './QuestionCard';

export interface NumberDecompositionResult {
  /** User's selected decomposition string */
  userAnswer: string;
  /** Whether the answer was correct */
  isCorrect: boolean;
  /** Time to answer in milliseconds */
  timeToAnswer: number;
  /** The correct decomposition */
  correctDecomposition: string;
}

export interface NumberDecompositionProps {
  /** The number to decompose (e.g., 256) */
  number: number;
  /** The correct decomposition string (e.g., "200 + 50 + 6") */
  correctDecomposition: string;
  /** Array of 4 decomposition choices */
  choices: string[];
  /** Callback when user answers */
  onAnswer: (result: NumberDecompositionResult) => void;
}

/**
 * NumberDecomposition - Show a number, user picks the correct place value breakdown
 *
 * Features:
 * - Displays number in large, clear format
 * - 4 decomposition choices as buttons
 * - Records timing with performance.now()
 * - 44px+ touch targets for accessibility
 * - No visual feedback during assessment
 */
export function NumberDecomposition({
  number,
  correctDecomposition,
  choices,
  onAnswer,
}: NumberDecompositionProps) {
  const startTimeRef = useRef<number>(performance.now());
  const [answered, setAnswered] = useState(false);

  // Reset when question changes
  useEffect(() => {
    startTimeRef.current = performance.now();
    setAnswered(false);
  }, [number, correctDecomposition]);

  const handleAnswer = useCallback(
    (choice: string) => {
      if (answered) return;

      const timeToAnswer = performance.now() - startTimeRef.current;
      const isCorrect = choice === correctDecomposition;

      setAnswered(true);

      onAnswer({
        userAnswer: choice,
        isCorrect,
        timeToAnswer,
        correctDecomposition,
      });
    },
    [answered, correctDecomposition, onAnswer]
  );

  return (
    <QuestionCard
      question="How is this number broken down?"
      data-testid="number-decomposition"
    >
      <div className="flex flex-col items-center gap-8 w-full">
        {/* Number display */}
        <div
          className="text-center"
          data-testid="number-display"
          aria-label={`Break down the number ${number}`}
        >
          <p className="text-5xl font-bold">{number}</p>
        </div>

        {/* Decomposition choices */}
        <div
          className="flex flex-col gap-3 w-full max-w-sm"
          data-testid="choices"
        >
          {choices.map((choice, index) => (
            <Button
              key={index}
              variant="outline"
              onClick={() => handleAnswer(choice)}
              disabled={answered}
              className="min-h-[44px] text-base font-semibold w-full"
              data-testid={`choice-${index}`}
              aria-label={choice}
            >
              {choice}
            </Button>
          ))}
        </div>

        <p
          className="text-center text-sm text-muted-foreground"
          data-testid="instruction-text"
        >
          {answered ? 'Answer recorded' : 'Select the correct decomposition'}
        </p>
      </div>
    </QuestionCard>
  );
}

export default NumberDecomposition;
