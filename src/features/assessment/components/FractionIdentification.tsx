// FractionIdentification - Identify the fraction shown by a shaded region
// Assesses fraction understanding and part-whole relationships

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { Button } from '@/shared/components/ui/button';
import { QuestionCard } from './QuestionCard';

export interface FractionIdentificationResult {
  /** User's selected fraction string */
  userAnswer: string;
  /** Whether the answer was correct */
  isCorrect: boolean;
  /** Time to answer in milliseconds */
  timeToAnswer: number;
  /** The correct fraction string */
  correctFraction: string;
}

export interface FractionIdentificationProps {
  /** Numerator (number of shaded parts) */
  numerator: number;
  /** Denominator (total number of parts) */
  denominator: number;
  /** Array of 4 fraction string choices (e.g., ["1/4", "2/4", "3/4", "1/2"]) */
  choices: string[];
  /** Callback when user answers */
  onAnswer: (result: FractionIdentificationResult) => void;
}

/**
 * FractionIdentification - SVG rectangle divided into parts with some shaded
 *
 * Features:
 * - SVG rectangle divided into `denominator` equal vertical strips
 * - `numerator` strips shaded in primary color
 * - 4 fraction choice buttons
 * - Records timing with performance.now()
 * - 44px+ touch targets for accessibility
 * - No visual feedback during assessment
 */
export function FractionIdentification({
  numerator,
  denominator,
  choices,
  onAnswer,
}: FractionIdentificationProps) {
  const startTimeRef = useRef<number>(performance.now());
  const [answered, setAnswered] = useState(false);

  // Reset when question changes
  useEffect(() => {
    startTimeRef.current = performance.now();
    setAnswered(false);
  }, [numerator, denominator]);

  const correctFraction = `${numerator}/${denominator}`;

  const handleAnswer = useCallback(
    (choice: string) => {
      if (answered) return;

      const timeToAnswer = performance.now() - startTimeRef.current;
      const isCorrect = choice === correctFraction;

      setAnswered(true);

      onAnswer({
        userAnswer: choice,
        isCorrect,
        timeToAnswer,
        correctFraction,
      });
    },
    [answered, correctFraction, onAnswer]
  );

  // Generate the rectangle strips
  const svgWidth = 280;
  const svgHeight = 80;
  const stripWidth = svgWidth / denominator;

  const strips = useMemo(() => {
    return Array.from({ length: denominator }, (_, i) => ({
      x: i * stripWidth,
      isShaded: i < numerator,
    }));
  }, [denominator, numerator, stripWidth]);

  return (
    <QuestionCard
      question="What fraction is shaded?"
      data-testid="fraction-identification"
    >
      <div className="flex flex-col items-center gap-8 w-full">
        {/* Fraction visual */}
        <div
          className="flex justify-center"
          data-testid="fraction-visual"
          aria-label={`A rectangle divided into ${denominator} parts with ${numerator} shaded`}
        >
          <svg
            width={svgWidth}
            height={svgHeight}
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            className="rounded-lg border-2 border-border"
            role="img"
            aria-label={`${numerator} out of ${denominator} parts shaded`}
          >
            {strips.map((strip, index) => (
              <rect
                key={index}
                x={strip.x}
                y={0}
                width={stripWidth}
                height={svgHeight}
                className={strip.isShaded ? 'fill-primary' : 'fill-muted'}
                stroke="currentColor"
                strokeWidth="1"
                data-testid={`strip-${index}`}
              />
            ))}
          </svg>
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
              aria-label={`Fraction ${choice}`}
            >
              {choice}
            </Button>
          ))}
        </div>

        <p
          className="text-center text-sm text-muted-foreground"
          data-testid="instruction-text"
        >
          {answered ? 'Answer recorded' : 'Select the fraction that is shaded'}
        </p>
      </div>
    </QuestionCard>
  );
}

export default FractionIdentification;
