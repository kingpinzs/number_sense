// EstimationQuestion - Estimate the result of an expression
// Assesses numerical estimation and approximation skills

import { useState, useCallback, useRef, useEffect } from 'react';
import { Button } from '@/shared/components/ui/button';
import { QuestionCard } from './QuestionCard';

export interface EstimationQuestionResult {
  /** User's selected answer */
  userAnswer: number;
  /** Whether the answer was correct */
  isCorrect: boolean;
  /** Time to answer in milliseconds */
  timeToAnswer: number;
  /** The correct answer */
  correctAnswer: number;
}

export interface EstimationQuestionProps {
  /** The expression to estimate (e.g., "48 + 53") */
  expression: string;
  /** The correct answer */
  correctAnswer: number;
  /** Array of 4 choices */
  choices: number[];
  /** Callback when user answers */
  onAnswer: (result: EstimationQuestionResult) => void;
}

/**
 * EstimationQuestion - Display an expression, user picks the best estimate
 *
 * Features:
 * - Displays expression in large, clear format
 * - 4 multiple-choice estimate buttons
 * - Records timing with performance.now()
 * - 44px+ touch targets for accessibility
 * - No visual feedback during assessment
 */
export function EstimationQuestion({
  expression,
  correctAnswer,
  choices,
  onAnswer,
}: EstimationQuestionProps) {
  const startTimeRef = useRef<number>(performance.now());
  const [answered, setAnswered] = useState(false);

  // Reset when question changes
  useEffect(() => {
    startTimeRef.current = performance.now();
    setAnswered(false);
  }, [expression, correctAnswer]);

  const handleAnswer = useCallback(
    (choice: number) => {
      if (answered) return;

      const timeToAnswer = performance.now() - startTimeRef.current;
      const isCorrect = choice === correctAnswer;

      setAnswered(true);

      onAnswer({
        userAnswer: choice,
        isCorrect,
        timeToAnswer,
        correctAnswer,
      });
    },
    [answered, correctAnswer, onAnswer]
  );

  return (
    <QuestionCard
      question="Estimate the answer"
      data-testid="estimation-question"
    >
      <div className="flex flex-col items-center gap-8 w-full">
        {/* Expression display */}
        <div
          className="text-center"
          data-testid="expression-display"
          aria-label={`Estimate ${expression}`}
        >
          <p className="text-4xl font-bold tracking-wide">
            {expression} = ?
          </p>
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
          {answered ? 'Answer recorded' : 'Pick the closest estimate'}
        </p>
      </div>
    </QuestionCard>
  );
}

export default EstimationQuestion;
