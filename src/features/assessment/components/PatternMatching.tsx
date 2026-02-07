// PatternMatching - Pattern recognition question
// Story 2.3: Implement Spatial Awareness Question Types
// AC5-AC8: Pattern matching with 3×3 grids, 4 options, selection, timing

import { useState, useCallback, useRef, useEffect } from 'react';
import { Button } from '@/shared/components/ui/button';
import { QuestionCard } from './QuestionCard';

export interface PatternMatchingResult {
  /** User's selected option: 'A', 'B', 'C', or 'D' */
  selectedOption: 'A' | 'B' | 'C' | 'D';
  /** Whether the answer was correct */
  isCorrect: boolean;
  /** Time to answer in milliseconds */
  timeToAnswer: number;
  /** Pattern type used */
  patternType: string;
  /** Correct option */
  correctOption: 'A' | 'B' | 'C' | 'D';
}

export interface PatternMatchingProps {
  /** Pattern type identifier */
  patternType: string;
  /** Correct option (A, B, C, or D) */
  correctOption: 'A' | 'B' | 'C' | 'D';
  /** Grid patterns for each option (3×3 arrays of 0/1) */
  options: {
    A: number[][];
    B: number[][];
    C: number[][];
    D: number[][];
  };
  /** The target pattern to match */
  targetPattern: number[][];
  /** Callback when user answers */
  onAnswer: (result: PatternMatchingResult) => void;
  /** Initial answer (for restoring previous selection) */
  initialAnswer?: 'A' | 'B' | 'C' | 'D';
}

/** Grid component for rendering a 3×3 pattern */
interface GridProps {
  pattern: number[][];
  label: string;
  'data-testid'?: string;
}

function Grid({ pattern, label, 'data-testid': testId }: GridProps) {
  if (!pattern || !Array.isArray(pattern)) {
    console.error(`Invalid pattern for ${label}:`, pattern);
    return <div className="text-destructive">Error: Invalid pattern data</div>;
  }

  return (
    <div
      className="inline-flex flex-col gap-1"
      data-testid={testId}
      aria-label={`${label} grid pattern`}
    >
      {pattern.map((row, rowIndex) => (
        <div key={rowIndex} className="flex gap-1">
          {row.map((cell, colIndex) => (
            <div
              key={colIndex}
              className="w-8 h-8 rounded-sm border-2"
              style={{
                backgroundColor: cell === 1 ? '#E87461' : '#ffffff',
                borderColor: cell === 1 ? '#E87461' : 'rgba(13, 15, 18, 0.12)',
              }}
              data-testid={`${testId}-cell-${rowIndex}-${colIndex}`}
              aria-label={cell === 1 ? 'Filled' : 'Empty'}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

/**
 * PatternMatching - Shows target pattern and 4 option grids
 *
 * Features:
 * - 3×3 flexbox grids with colored cells
 * - 4 option grids (A, B, C, D) as buttons
 * - Records timing with performance.now()
 * - 60px+ touch targets for accessibility
 * - No visual feedback during assessment
 */
export function PatternMatching({
  patternType,
  correctOption,
  options,
  targetPattern,
  onAnswer,
  initialAnswer,
}: PatternMatchingProps) {
  const startTimeRef = useRef<number>(performance.now());
  const [answered, setAnswered] = useState(!!initialAnswer);
  const [, setSelectedOption] = useState<'A' | 'B' | 'C' | 'D' | null>(initialAnswer ?? null);

  // Reset when question changes
  useEffect(() => {
    startTimeRef.current = performance.now();
    setAnswered(!!initialAnswer);
    setSelectedOption(initialAnswer ?? null);
  }, [patternType, correctOption, initialAnswer]);

  const handleAnswer = useCallback(
    (option: 'A' | 'B' | 'C' | 'D') => {
      if (answered) return;

      const timeToAnswer = performance.now() - startTimeRef.current;
      const isCorrect = option === correctOption;

      setAnswered(true);
      setSelectedOption(option);

      onAnswer({
        selectedOption: option,
        isCorrect,
        timeToAnswer,
        patternType,
        correctOption,
      });
    },
    [answered, correctOption, patternType, onAnswer]
  );

  return (
    <QuestionCard
      question="Which grid matches this pattern?"
      data-testid="pattern-matching"
    >
      <div className="flex flex-col items-center gap-6 w-full">
        {/* Target pattern */}
        <div className="flex flex-col items-center gap-2">
          <p className="text-sm font-medium text-muted-foreground">
            Match this pattern:
          </p>
          <Grid
            pattern={targetPattern}
            label="Target"
            data-testid="target-pattern"
          />
        </div>

        {/* Option grids */}
        <div className="grid grid-cols-2 gap-4">
          {(['A', 'B', 'C', 'D'] as const).map((option) => (
            <Button
              key={option}
              variant="outline"
              onClick={() => handleAnswer(option)}
              disabled={answered}
              className="min-h-[140px] min-w-[120px] flex flex-col items-center gap-2 p-4"
              data-testid={`option-${option}`}
              aria-label={`Option ${option}`}
            >
              <span className="text-lg font-semibold">{option}</span>
              <Grid
                pattern={options[option]}
                label={`Option ${option}`}
                data-testid={`option-${option}-grid`}
              />
            </Button>
          ))}
        </div>

        {/* Instruction text */}
        <p
          className="text-center text-sm text-muted-foreground"
          data-testid="instruction-text"
        >
          {answered
            ? 'Answer recorded'
            : 'Tap the grid that matches the pattern above'}
        </p>
      </div>
    </QuestionCard>
  );
}

export default PatternMatching;
