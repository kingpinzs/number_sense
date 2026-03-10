// NumberOrdering - Tap numbers in ascending order
// Assesses number ordering and sequencing ability

import { useState, useCallback, useRef, useEffect } from 'react';
import { Button } from '@/shared/components/ui/button';
import { QuestionCard } from './QuestionCard';

export interface NumberOrderingResult {
  /** The order the user tapped the numbers */
  order: number[];
  /** Whether the order was correct (ascending) */
  isCorrect: boolean;
  /** Time to answer in milliseconds */
  timeToAnswer: number;
}

export interface NumberOrderingProps {
  /** Array of 4-5 scrambled numbers */
  numbers: number[];
  /** Callback when user answers */
  onAnswer: (result: NumberOrderingResult) => void;
}

/**
 * NumberOrdering - User taps numbers in ascending order (smallest to largest)
 *
 * Features:
 * - Displays scrambled numbers as tappable buttons
 * - Tracks tap order; buttons disable after tap
 * - Shows selected order below
 * - Auto-submits when all numbers are tapped
 * - Records timing with performance.now()
 * - 44px+ touch targets for accessibility
 * - No visual feedback during assessment
 */
export function NumberOrdering({
  numbers,
  onAnswer,
}: NumberOrderingProps) {
  const startTimeRef = useRef<number>(performance.now());
  const [answered, setAnswered] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<number[]>([]);

  // Reset when question changes
  useEffect(() => {
    startTimeRef.current = performance.now();
    setAnswered(false);
    setSelectedOrder([]);
  }, [numbers]);

  const correctOrder = [...numbers].sort((a, b) => a - b);

  const handleTap = useCallback(
    (num: number) => {
      if (answered) return;
      if (selectedOrder.includes(num)) return;

      const newOrder = [...selectedOrder, num];
      setSelectedOrder(newOrder);

      // Auto-submit when all numbers are selected
      if (newOrder.length === numbers.length) {
        const timeToAnswer = performance.now() - startTimeRef.current;
        const isCorrect =
          newOrder.length === correctOrder.length &&
          newOrder.every((val, idx) => val === correctOrder[idx]);

        setAnswered(true);

        onAnswer({
          order: newOrder,
          isCorrect,
          timeToAnswer,
        });
      }
    },
    [answered, selectedOrder, numbers.length, correctOrder, onAnswer]
  );

  return (
    <QuestionCard
      question="Tap the numbers from smallest to largest"
      data-testid="number-ordering"
    >
      <div className="flex flex-col items-center gap-8 w-full">
        {/* Number buttons */}
        <div
          className="flex flex-wrap items-center justify-center gap-3"
          data-testid="number-buttons"
        >
          {numbers.map((num, index) => {
            const isSelected = selectedOrder.includes(num);
            const selectionIndex = selectedOrder.indexOf(num);
            return (
              <Button
                key={index}
                variant={isSelected ? 'secondary' : 'outline'}
                onClick={() => handleTap(num)}
                disabled={answered || isSelected}
                className="min-h-[60px] min-w-[60px] text-2xl font-bold relative"
                data-testid={`number-${index}`}
                aria-label={`${num}${isSelected ? `, selected ${selectionIndex + 1}` : ''}`}
              >
                {num}
                {isSelected && (
                  <span
                    className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center"
                    data-testid={`order-badge-${index}`}
                  >
                    {selectionIndex + 1}
                  </span>
                )}
              </Button>
            );
          })}
        </div>

        {/* Selected order display */}
        <div
          className="flex items-center gap-2 min-h-[32px]"
          data-testid="selected-order"
          aria-live="polite"
        >
          {selectedOrder.length > 0 ? (
            selectedOrder.map((num, index) => (
              <span key={index} className="text-lg font-semibold">
                {index > 0 && (
                  <span className="text-muted-foreground mx-1">&lt;</span>
                )}
                {num}
              </span>
            ))
          ) : (
            <span className="text-sm text-muted-foreground">
              Tap numbers in order...
            </span>
          )}
        </div>

        <p
          className="text-center text-sm text-muted-foreground"
          data-testid="instruction-text"
        >
          {answered
            ? 'Answer recorded'
            : `${numbers.length - selectedOrder.length} number${numbers.length - selectedOrder.length !== 1 ? 's' : ''} remaining`}
        </p>
      </div>
    </QuestionCard>
  );
}

export default NumberOrdering;
