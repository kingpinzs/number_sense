// WorkingMemorySpan - Remember numbers, then add them
// Assesses working memory capacity with sequential number presentation

import { useState, useCallback, useRef, useEffect } from 'react';
import { QuestionCard } from './QuestionCard';
import { NumberKeypad } from '@/shared/components/NumberKeypad';

export interface WorkingMemorySpanResult {
  /** User's answer */
  userAnswer: number;
  /** The correct answer (sum of all numbers) */
  correctAnswer: number;
  /** Whether the answer was correct */
  isCorrect: boolean;
  /** Time to answer in milliseconds (from recall phase start) */
  timeToAnswer: number;
}

export interface WorkingMemorySpanProps {
  /** Array of numbers to remember (e.g., [3, 7, 5]) */
  numbers: number[];
  /** Callback when user answers */
  onAnswer: (result: WorkingMemorySpanResult) => void;
}

type Phase = 'showing' | 'recall';

/**
 * WorkingMemorySpan - Show numbers one at a time, then ask for their sum
 *
 * Features:
 * - Phase 1: Shows each number for 2 seconds sequentially
 * - Phase 2: Asks "What is the sum?" with NumberKeypad
 * - Records timing from start of recall phase
 * - 44px+ touch targets for accessibility
 * - No visual feedback during assessment
 */
export function WorkingMemorySpan({
  numbers,
  onAnswer,
}: WorkingMemorySpanProps) {
  const recallStartTimeRef = useRef<number>(0);
  const [phase, setPhase] = useState<Phase>('showing');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [inputValue, setInputValue] = useState('');

  const correctAnswer = numbers.reduce((sum, n) => sum + n, 0);

  // Reset when question changes
  useEffect(() => {
    setPhase('showing');
    setCurrentIndex(0);
    setAnswered(false);
    setInputValue('');
  }, [numbers]);

  // Sequential display timer
  useEffect(() => {
    if (phase !== 'showing') return;

    const timerId = setTimeout(() => {
      if (currentIndex < numbers.length - 1) {
        setCurrentIndex((prev) => prev + 1);
      } else {
        // All numbers shown, switch to recall phase
        setPhase('recall');
        recallStartTimeRef.current = performance.now();
      }
    }, 2000);

    return () => clearTimeout(timerId);
  }, [phase, currentIndex, numbers.length]);

  const handleSubmit = useCallback(() => {
    if (answered) return;
    if (inputValue === '') return;

    const timeToAnswer = performance.now() - recallStartTimeRef.current;
    const userAnswer = parseInt(inputValue, 10);
    const isCorrect = userAnswer === correctAnswer;

    setAnswered(true);

    onAnswer({
      userAnswer,
      correctAnswer,
      isCorrect,
      timeToAnswer,
    });
  }, [answered, inputValue, correctAnswer, onAnswer]);

  return (
    <QuestionCard
      question={phase === 'showing' ? 'Remember these numbers' : 'What is the sum?'}
      data-testid="working-memory-span"
    >
      <div className="flex flex-col items-center gap-8 w-full">
        {phase === 'showing' ? (
          /* Phase 1: Show numbers one at a time */
          <>
            <div
              className="flex items-center justify-center min-h-[120px]"
              data-testid="number-presentation"
              aria-live="polite"
              aria-atomic="true"
            >
              <span
                className="text-6xl font-bold text-primary"
                data-testid="current-number"
              >
                {numbers[currentIndex]}
              </span>
            </div>

            {/* Progress dots */}
            <div
              className="flex items-center gap-2"
              data-testid="progress-dots"
              aria-label={`Number ${currentIndex + 1} of ${numbers.length}`}
            >
              {numbers.map((_, index) => (
                <div
                  key={index}
                  className={`w-3 h-3 rounded-full ${
                    index <= currentIndex ? 'bg-primary' : 'bg-muted'
                  }`}
                  data-testid={`dot-${index}`}
                />
              ))}
            </div>

            <p
              className="text-center text-sm text-muted-foreground"
              data-testid="instruction-text"
            >
              {`Number ${currentIndex + 1} of ${numbers.length} - remember them all`}
            </p>
          </>
        ) : (
          /* Phase 2: Recall - ask for sum */
          <>
            <div
              className="text-center"
              data-testid="recall-prompt"
            >
              <p className="text-lg text-muted-foreground">
                Add all {numbers.length} numbers together
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
              data-testid="memory-keypad"
            />

            <p
              className="text-center text-sm text-muted-foreground"
              data-testid="instruction-text"
            >
              {answered
                ? 'Answer recorded'
                : 'Enter the sum and tap Submit'}
            </p>
          </>
        )}
      </div>
    </QuestionCard>
  );
}

export default WorkingMemorySpan;
