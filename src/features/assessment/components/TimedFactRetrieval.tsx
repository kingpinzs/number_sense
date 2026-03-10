// TimedFactRetrieval - Basic arithmetic with visible countdown timer
// Assesses math fact fluency under time pressure

import { useState, useCallback, useRef, useEffect } from 'react';
import { QuestionCard } from './QuestionCard';
import { NumberKeypad } from '@/shared/components/NumberKeypad';

export interface TimedFactRetrievalResult {
  /** User's answer as number, or null if timed out */
  userAnswer: number | null;
  /** Whether the answer was correct */
  isCorrect: boolean;
  /** Time to answer in milliseconds */
  timeToAnswer: number;
  /** Whether the timer expired */
  timedOut: boolean;
  /** The correct answer */
  correctAnswer: number;
}

export interface TimedFactRetrievalProps {
  /** First operand */
  operand1: number;
  /** Second operand */
  operand2: number;
  /** Operation symbol */
  operation: '+' | '-' | '\u00D7';
  /** Correct answer */
  correctAnswer: number;
  /** Time limit in milliseconds */
  timeLimitMs: number;
  /** Callback when user answers */
  onAnswer: (result: TimedFactRetrievalResult) => void;
}

/**
 * TimedFactRetrieval - Arithmetic with countdown bar, auto-submits on timeout
 *
 * Features:
 * - Displays arithmetic problem with visible countdown bar
 * - NumberKeypad for input
 * - Auto-submits as incorrect if timer expires
 * - Records timing with performance.now()
 * - 44px+ touch targets for accessibility
 * - No visual feedback during assessment
 */
export function TimedFactRetrieval({
  operand1,
  operand2,
  operation,
  correctAnswer,
  timeLimitMs,
  onAnswer,
}: TimedFactRetrievalProps) {
  const startTimeRef = useRef<number>(performance.now());
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const answeredRef = useRef(false);
  const [answered, setAnswered] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [timeRemaining, setTimeRemaining] = useState(timeLimitMs);

  // Reset when question changes
  useEffect(() => {
    startTimeRef.current = performance.now();
    answeredRef.current = false;
    setAnswered(false);
    setInputValue('');
    setTimeRemaining(timeLimitMs);
  }, [operand1, operand2, operation, timeLimitMs]);

  // Countdown timer
  useEffect(() => {
    if (answered) return;

    const intervalId = setInterval(() => {
      const elapsed = performance.now() - startTimeRef.current;
      const remaining = Math.max(0, timeLimitMs - elapsed);
      setTimeRemaining(remaining);

      if (remaining <= 0) {
        clearInterval(intervalId);
        // Auto-submit as timed out
        if (!answeredRef.current) {
          answeredRef.current = true;
          setAnswered(true);
          onAnswer({
            userAnswer: null,
            isCorrect: false,
            timeToAnswer: timeLimitMs,
            timedOut: true,
            correctAnswer,
          });
        }
      }
    }, 100);

    timerRef.current = intervalId;

    return () => {
      clearInterval(intervalId);
    };
  }, [answered, timeLimitMs, correctAnswer, onAnswer]);

  const handleSubmit = useCallback(() => {
    if (answeredRef.current) return;
    if (inputValue === '') return;

    const timeToAnswer = performance.now() - startTimeRef.current;
    const userAnswer = parseInt(inputValue, 10);
    const isCorrect = userAnswer === correctAnswer;

    answeredRef.current = true;
    setAnswered(true);

    if (timerRef.current !== null) {
      clearInterval(timerRef.current);
    }

    onAnswer({
      userAnswer,
      isCorrect,
      timeToAnswer,
      timedOut: false,
      correctAnswer,
    });
  }, [inputValue, correctAnswer, onAnswer]);

  const progressPercent = (timeRemaining / timeLimitMs) * 100;

  return (
    <QuestionCard
      question="Solve quickly!"
      data-testid="timed-fact-retrieval"
    >
      <div className="flex flex-col items-center gap-6 w-full">
        {/* Countdown bar */}
        <div
          className="w-full max-w-xs h-3 bg-muted rounded-full overflow-hidden"
          data-testid="countdown-bar"
          role="progressbar"
          aria-valuenow={Math.round(timeRemaining)}
          aria-valuemin={0}
          aria-valuemax={timeLimitMs}
          aria-label={`${Math.ceil(timeRemaining / 1000)} seconds remaining`}
        >
          <div
            className={`h-full rounded-full transition-all duration-100 ${
              progressPercent > 30 ? 'bg-primary' : 'bg-destructive'
            }`}
            style={{ width: `${progressPercent}%` }}
            data-testid="countdown-fill"
          />
        </div>

        {/* Problem display */}
        <div
          className="text-center"
          data-testid="problem-display"
          aria-label={`${operand1} ${operation} ${operand2}`}
        >
          <p className="text-4xl font-bold tracking-wide">
            {operand1} {operation} {operand2} = ?
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
          data-testid="timed-keypad"
        />

        <p
          className="text-center text-sm text-muted-foreground"
          data-testid="instruction-text"
        >
          {answered
            ? timeRemaining <= 0
              ? 'Time expired'
              : 'Answer recorded'
            : `${Math.ceil(timeRemaining / 1000)}s remaining`}
        </p>
      </div>
    </QuestionCard>
  );
}

export default TimedFactRetrieval;
