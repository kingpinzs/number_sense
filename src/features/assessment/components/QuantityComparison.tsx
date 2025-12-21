// QuantityComparison - Dot quantity comparison question
// Story 2.2: Implement Number Sense Question Types
// AC1-AC3: Quantity comparison with dot groups, answer options, timing

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { Button } from '@/shared/components/ui/button';
import { QuestionCard } from './QuestionCard';

export interface QuantityComparisonResult {
  /** User's answer: 'left', 'right', or 'same' */
  answer: 'left' | 'right' | 'same';
  /** Whether the answer was correct */
  isCorrect: boolean;
  /** Time to answer in milliseconds */
  timeToAnswer: number;
  /** Left group dot count */
  leftCount: number;
  /** Right group dot count */
  rightCount: number;
}

export interface QuantityComparisonProps {
  /** Number of dots in left group (5-20) */
  leftCount: number;
  /** Number of dots in right group (5-20) */
  rightCount: number;
  /** Callback when user answers */
  onAnswer: (result: QuantityComparisonResult) => void;
  /** Optional seed for deterministic randomization in tests */
  seed?: number;
}

interface DotPosition {
  x: number;
  y: number;
}

// Generate non-overlapping dot positions
function generateDotPositions(
  count: number,
  width: number,
  height: number,
  dotRadius: number,
  seed?: number
): DotPosition[] {
  const positions: DotPosition[] = [];
  const minDistance = dotRadius * 2.5; // Minimum distance between dot centers
  const margin = dotRadius + 2;

  // Simple seeded random for tests
  let seedValue = seed ?? Date.now();
  const seededRandom = () => {
    seedValue = (seedValue * 9301 + 49297) % 233280;
    return seedValue / 233280;
  };

  const random = seed !== undefined ? seededRandom : Math.random;

  let attempts = 0;
  const maxAttempts = count * 100;

  while (positions.length < count && attempts < maxAttempts) {
    const x = margin + random() * (width - 2 * margin);
    const y = margin + random() * (height - 2 * margin);

    // Check for overlap with existing dots
    const overlaps = positions.some(
      (pos) => Math.hypot(pos.x - x, pos.y - y) < minDistance
    );

    if (!overlaps) {
      positions.push({ x, y });
    }
    attempts++;
  }

  // Fill remaining with grid fallback if needed
  while (positions.length < count) {
    const cols = Math.ceil(Math.sqrt(count));
    const idx = positions.length;
    const col = idx % cols;
    const row = Math.floor(idx / cols);
    positions.push({
      x: margin + (col + 0.5) * ((width - 2 * margin) / cols),
      y: margin + (row + 0.5) * ((height - 2 * margin) / Math.ceil(count / cols)),
    });
  }

  return positions;
}

/**
 * QuantityComparison - Shows two groups of dots for comparison
 *
 * Features:
 * - SVG dot rendering with random non-overlapping positions
 * - Left/Right/Same answer buttons
 * - Records timing with performance.now()
 * - No visual feedback during assessment
 */
export function QuantityComparison({
  leftCount,
  rightCount,
  onAnswer,
  seed,
}: QuantityComparisonProps) {
  const startTimeRef = useRef<number>(performance.now());
  const [answered, setAnswered] = useState(false);

  // Reset timer when question changes
  useEffect(() => {
    startTimeRef.current = performance.now();
    setAnswered(false);
  }, [leftCount, rightCount]);

  // Generate dot positions (memoized to prevent re-renders)
  const leftDots = useMemo(
    () => generateDotPositions(leftCount, 140, 140, 8, seed),
    [leftCount, seed]
  );

  const rightDots = useMemo(
    () => generateDotPositions(rightCount, 140, 140, 8, seed ? seed + 1000 : undefined),
    [rightCount, seed]
  );

  // Determine correct answer
  const correctAnswer: 'left' | 'right' | 'same' = useMemo(() => {
    if (leftCount > rightCount) return 'left';
    if (rightCount > leftCount) return 'right';
    return 'same';
  }, [leftCount, rightCount]);

  const handleAnswer = useCallback(
    (answer: 'left' | 'right' | 'same') => {
      if (answered) return;

      const timeToAnswer = performance.now() - startTimeRef.current;
      const isCorrect = answer === correctAnswer;

      setAnswered(true);

      onAnswer({
        answer,
        isCorrect,
        timeToAnswer,
        leftCount,
        rightCount,
      });
    },
    [answered, correctAnswer, leftCount, rightCount, onAnswer]
  );

  const renderDotGroup = (dots: DotPosition[], label: string, testId: string) => (
    <div
      className="flex flex-col items-center gap-2"
      data-testid={testId}
      aria-label={`${label} group with ${dots.length} dots`}
    >
      <svg
        width="140"
        height="140"
        viewBox="0 0 140 140"
        className="bg-muted rounded-lg"
        role="img"
        aria-label={`${dots.length} dots`}
      >
        {dots.map((dot, index) => (
          <circle
            key={index}
            cx={dot.x}
            cy={dot.y}
            r="8"
            className="fill-primary"
            data-testid={`${testId}-dot-${index}`}
          />
        ))}
      </svg>
      <span className="text-sm font-medium text-muted-foreground sr-only">
        {label}
      </span>
    </div>
  );

  return (
    <QuestionCard
      question="Which group has more dots?"
      data-testid="quantity-comparison"
      footer={
        <>
          <Button
            variant="outline"
            onClick={() => handleAnswer('left')}
            disabled={answered}
            className="min-h-[44px] min-w-[80px]"
            data-testid="answer-left"
            aria-label="Left group has more"
          >
            Left
          </Button>
          <Button
            variant="outline"
            onClick={() => handleAnswer('same')}
            disabled={answered}
            className="min-h-[44px] min-w-[80px]"
            data-testid="answer-same"
            aria-label="Both groups are the same"
          >
            Same
          </Button>
          <Button
            variant="outline"
            onClick={() => handleAnswer('right')}
            disabled={answered}
            className="min-h-[44px] min-w-[80px]"
            data-testid="answer-right"
            aria-label="Right group has more"
          >
            Right
          </Button>
        </>
      }
    >
      <div className="flex items-center justify-center gap-6">
        {renderDotGroup(leftDots, 'Left', 'left-group')}
        <span className="text-2xl font-bold text-muted-foreground">vs</span>
        {renderDotGroup(rightDots, 'Right', 'right-group')}
      </div>
    </QuestionCard>
  );
}

export default QuantityComparison;
