// BasicOperations - Basic arithmetic question (addition/subtraction)
// Story 2.4: Implement Operations Question Types
// Questions 8-9: Simple arithmetic with number keypad input

import { useState, useCallback, useRef, useEffect } from 'react';
import { QuestionCard } from './QuestionCard';
import { NumberKeypad } from '@/shared/components/NumberKeypad';

export interface BasicOperationsResult {
  /** User's answer as number */
  userAnswer: number;
  /** Whether the answer was correct */
  isCorrect: boolean;
  /** Time to answer in milliseconds */
  timeToAnswer: number;
  /** Operation type used */
  operationType: string;
  /** Correct answer */
  correctAnswer: number;
}

export interface BasicOperationsProps {
  /** Type of operation */
  operationType: 'addition' | 'subtraction';
  /** First operand */
  operand1: number;
  /** Second operand */
  operand2: number;
  /** Correct answer */
  correctAnswer: number;
  /** Callback when user answers */
  onAnswer: (result: BasicOperationsResult) => void;
}

/**
 * BasicOperations - Shows arithmetic problem with number keypad input
 *
 * Features:
 * - Displays operation in large, clear format (24px+ font)
 * - Number keypad for input (0-9, backspace, submit)
 * - Records timing with performance.now()
 * - Input validation (non-negative integers, max 4 digits)
 * - 60px+ touch targets for accessibility
 * - No visual feedback during assessment
 */
export function BasicOperations({
  operationType,
  operand1,
  operand2,
  correctAnswer,
  onAnswer,
}: BasicOperationsProps) {
  const startTimeRef = useRef<number>(performance.now());
  const [answered, setAnswered] = useState(false);
  const [inputValue, setInputValue] = useState('');

  // Reset when question changes
  useEffect(() => {
    startTimeRef.current = performance.now();
    setAnswered(false);
    setInputValue('');
  }, [operationType, operand1, operand2]);

  const handleSubmit = useCallback(() => {
    if (answered) return;
    if (inputValue === '') return;

    const timeToAnswer = performance.now() - startTimeRef.current;
    const userAnswer = parseInt(inputValue, 10);
    const isCorrect = userAnswer === correctAnswer;

    setAnswered(true);

    onAnswer({
      userAnswer,
      isCorrect,
      timeToAnswer,
      operationType,
      correctAnswer,
    });
  }, [answered, inputValue, correctAnswer, operationType, onAnswer]);

  // Format the operation symbol
  const operationSymbol = operationType === 'addition' ? '+' : '−';

  return (
    <QuestionCard
      question="Solve the problem"
      data-testid="basic-operations"
    >
      <div className="flex flex-col items-center gap-8 w-full">
        {/* Problem display */}
        <div
          className="text-center"
          data-testid="problem-display"
          aria-label={`${operand1} ${operationType === 'addition' ? 'plus' : 'minus'} ${operand2} equals`}
        >
          <p className="text-4xl font-bold tracking-wide">
            {operand1} {operationSymbol} {operand2} = ?
          </p>
        </div>

        {/* Answer display */}
        <div className="flex flex-col items-center gap-2">
          <label htmlFor="answer-input" className="text-sm font-medium text-muted-foreground">
            Your answer:
          </label>
          <div
            id="answer-input"
            className="min-w-[120px] min-h-[48px] flex items-center justify-center border-2 border-border rounded-lg bg-background px-4"
            data-testid="answer-display"
            aria-live="polite"
            aria-atomic="true"
          >
            <span className="text-2xl font-semibold">
              {inputValue || '\u00A0'}
            </span>
          </div>
        </div>

        {/* Number keypad */}
        <NumberKeypad
          value={inputValue}
          onChange={setInputValue}
          onSubmit={handleSubmit}
          disabled={answered}
          maxDigits={4}
          data-testid="operations-keypad"
        />

        {/* Status text */}
        <p
          className="text-center text-sm text-muted-foreground"
          data-testid="instruction-text"
        >
          {answered
            ? 'Answer recorded'
            : 'Enter your answer and tap Submit'}
        </p>
      </div>
    </QuestionCard>
  );
}

export default BasicOperations;
