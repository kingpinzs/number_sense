// SkipCounting - Fill in the next number in a counting sequence
// Assesses pattern recognition and skip counting ability

import { useState, useCallback, useRef, useEffect } from 'react';
import { QuestionCard } from './QuestionCard';
import { NumberKeypad } from '@/shared/components/NumberKeypad';

export interface SkipCountingResult {
  /** User's answer */
  userAnswer: number;
  /** Whether the answer was correct */
  isCorrect: boolean;
  /** Time to answer in milliseconds */
  timeToAnswer: number;
  /** The correct next number */
  correctNext: number;
}

export interface SkipCountingProps {
  /** The sequence of numbers shown (e.g., [5, 10, 15]) */
  sequence: number[];
  /** The correct next number in the sequence (e.g., 20) */
  correctNext: number;
  /** Callback when user answers */
  onAnswer: (result: SkipCountingResult) => void;
}

/**
 * SkipCounting - Shows a sequence with "?" at the end, user types the next number
 *
 * Features:
 * - Displays sequence with a "?" placeholder at the end
 * - NumberKeypad for input
 * - Records timing with performance.now()
 * - 44px+ touch targets for accessibility
 * - No visual feedback during assessment
 */
export function SkipCounting({
  sequence,
  correctNext,
  onAnswer,
}: SkipCountingProps) {
  const startTimeRef = useRef<number>(performance.now());
  const [answered, setAnswered] = useState(false);
  const [inputValue, setInputValue] = useState('');

  // Reset when question changes
  useEffect(() => {
    startTimeRef.current = performance.now();
    setAnswered(false);
    setInputValue('');
  }, [sequence, correctNext]);

  const handleSubmit = useCallback(() => {
    if (answered) return;
    if (inputValue === '') return;

    const timeToAnswer = performance.now() - startTimeRef.current;
    const userAnswer = parseInt(inputValue, 10);
    const isCorrect = userAnswer === correctNext;

    setAnswered(true);

    onAnswer({
      userAnswer,
      isCorrect,
      timeToAnswer,
      correctNext,
    });
  }, [answered, inputValue, correctNext, onAnswer]);

  return (
    <QuestionCard
      question="What comes next?"
      data-testid="skip-counting"
    >
      <div className="flex flex-col items-center gap-8 w-full">
        {/* Sequence display */}
        <div
          className="flex items-center justify-center gap-3 flex-wrap"
          data-testid="sequence-display"
          aria-label={`Sequence: ${sequence.join(', ')}, then what?`}
        >
          {sequence.map((num, index) => (
            <span
              key={index}
              className="text-3xl font-bold"
              data-testid={`sequence-item-${index}`}
            >
              {index > 0 && (
                <span className="text-muted-foreground mr-3">,</span>
              )}
              {num}
            </span>
          ))}
          <span className="text-3xl font-bold text-muted-foreground">,</span>
          <span
            className="text-3xl font-bold text-primary border-b-2 border-primary px-3"
            data-testid="sequence-blank"
          >
            ?
          </span>
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
          data-testid="skip-counting-keypad"
        />

        <p
          className="text-center text-sm text-muted-foreground"
          data-testid="instruction-text"
        >
          {answered
            ? 'Answer recorded'
            : 'Enter the next number and tap Submit'}
        </p>
      </div>
    </QuestionCard>
  );
}

export default SkipCounting;
