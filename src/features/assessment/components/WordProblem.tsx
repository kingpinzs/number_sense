// WordProblem - Dyscalculia-friendly word problem question
// Story 2.4: Implement Operations Question Types
// Question 10: Simple context word problem with number keypad input

import { useState, useCallback, useRef, useEffect } from 'react';
import { QuestionCard } from './QuestionCard';
import { NumberKeypad } from '@/shared/components/NumberKeypad';

export interface WordProblemResult {
  /** User's answer as number */
  userAnswer: number;
  /** Whether the answer was correct */
  isCorrect: boolean;
  /** Time to answer in milliseconds */
  timeToAnswer: number;
  /** Problem text */
  problemText: string;
  /** Correct answer */
  correctAnswer: number;
}

export interface WordProblemProps {
  /** The word problem text */
  problemText: string;
  /** Correct answer */
  correctAnswer: number;
  /** Callback when user answers */
  onAnswer: (result: WordProblemResult) => void;
}

/**
 * WordProblem - Shows word problem with number keypad input
 *
 * Features:
 * - Displays problem text with large, clear font (20px+ for readability)
 * - Number keypad for input (0-9, backspace, submit)
 * - Records timing with performance.now()
 * - Input validation (non-negative integers, max 4 digits)
 * - 60px+ touch targets for accessibility
 * - No visual feedback during assessment
 * - Dyscalculia-friendly: simple language, clear numbers
 */
export function WordProblem({
  problemText,
  correctAnswer,
  onAnswer,
}: WordProblemProps) {
  const startTimeRef = useRef<number>(performance.now());
  const [answered, setAnswered] = useState(false);
  const [inputValue, setInputValue] = useState('');

  // Reset when question changes
  useEffect(() => {
    startTimeRef.current = performance.now();
    setAnswered(false);
    setInputValue('');
  }, [problemText, correctAnswer]);

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
      problemText,
      correctAnswer,
    });
  }, [answered, inputValue, correctAnswer, problemText, onAnswer]);

  return (
    <QuestionCard
      question="Solve the problem"
      data-testid="word-problem"
    >
      <div className="flex flex-col items-center gap-8 w-full">
        {/* Problem text */}
        <div
          className="text-center max-w-md"
          data-testid="problem-text"
        >
          <p className="text-xl leading-relaxed">
            {problemText}
          </p>
        </div>

        {/* Answer display */}
        <div className="flex flex-col items-center gap-2">
          <label htmlFor="word-answer-input" className="text-sm font-medium text-muted-foreground">
            Your answer:
          </label>
          <div
            id="word-answer-input"
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
          data-testid="word-problem-keypad"
        />

        {/* Status text */}
        <p
          className="text-center text-sm text-muted-foreground"
          data-testid="instruction-text"
        >
          {answered
            ? 'Answer recorded'
            : 'Read the problem, then enter your answer'}
        </p>
      </div>
    </QuestionCard>
  );
}

export default WordProblem;
