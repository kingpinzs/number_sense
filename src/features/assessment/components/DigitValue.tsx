// DigitValue - Identify the place value of a highlighted digit
// Assesses understanding of positional number system

import { useState, useCallback, useRef, useEffect } from 'react';
import { Button } from '@/shared/components/ui/button';
import { QuestionCard } from './QuestionCard';

export interface DigitValueResult {
  /** User's selected answer */
  userAnswer: number;
  /** Whether the answer was correct */
  isCorrect: boolean;
  /** Time to answer in milliseconds */
  timeToAnswer: number;
  /** The correct value */
  correctValue: number;
}

export interface DigitValueProps {
  /** The number to display (e.g., 342) */
  number: number;
  /** Index of the digit to highlight, from left (e.g., 1 for tens in 342) */
  highlightIndex: number;
  /** The correct place value (e.g., 40 for the 4 in 342) */
  correctValue: number;
  /** Array of 4 choice values */
  choices: number[];
  /** Callback when user answers */
  onAnswer: (result: DigitValueResult) => void;
}

/**
 * DigitValue - Shows a number with one digit highlighted, user picks its place value
 *
 * Features:
 * - Displays number with one digit highlighted in primary color
 * - 4 multiple-choice buttons
 * - Records timing with performance.now()
 * - 44px+ touch targets for accessibility
 * - No visual feedback during assessment
 */
export function DigitValue({
  number,
  highlightIndex,
  correctValue,
  choices,
  onAnswer,
}: DigitValueProps) {
  const startTimeRef = useRef<number>(performance.now());
  const [answered, setAnswered] = useState(false);

  // Reset when question changes
  useEffect(() => {
    startTimeRef.current = performance.now();
    setAnswered(false);
  }, [number, highlightIndex, correctValue]);

  const handleAnswer = useCallback(
    (choice: number) => {
      if (answered) return;

      const timeToAnswer = performance.now() - startTimeRef.current;
      const isCorrect = choice === correctValue;

      setAnswered(true);

      onAnswer({
        userAnswer: choice,
        isCorrect,
        timeToAnswer,
        correctValue,
      });
    },
    [answered, correctValue, onAnswer]
  );

  // Split number into individual digits for rendering
  const digits = String(number).split('');

  return (
    <QuestionCard
      question="What is the value of the highlighted digit?"
      data-testid="digit-value"
    >
      <div className="flex flex-col items-center gap-8 w-full">
        {/* Number display with highlighted digit */}
        <div
          className="flex items-center justify-center gap-1"
          data-testid="number-display"
          aria-label={`The number ${number} with digit at position ${highlightIndex} highlighted`}
        >
          {digits.map((digit, index) => (
            <span
              key={index}
              className={`text-5xl font-bold px-2 py-1 rounded-lg ${
                index === highlightIndex
                  ? 'text-primary bg-primary/15 border-2 border-primary'
                  : 'text-foreground'
              }`}
              data-testid={`digit-${index}`}
            >
              {digit}
            </span>
          ))}
        </div>

        {/* Choice buttons */}
        <div
          className="grid grid-cols-2 gap-3 w-full max-w-xs"
          data-testid="choices"
        >
          {choices.map((choice, index) => (
            <Button
              key={index}
              variant="outline"
              onClick={() => handleAnswer(choice)}
              disabled={answered}
              className="min-h-[44px] text-lg font-semibold"
              data-testid={`choice-${index}`}
              aria-label={`${choice}`}
            >
              {choice}
            </Button>
          ))}
        </div>

        <p
          className="text-center text-sm text-muted-foreground"
          data-testid="instruction-text"
        >
          {answered ? 'Answer recorded' : 'Select the value of the highlighted digit'}
        </p>
      </div>
    </QuestionCard>
  );
}

export default DigitValue;
