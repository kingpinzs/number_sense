// MirrorDiscrimination - Is the shape rotated or mirrored?
// Assesses spatial awareness and mirror/rotation discrimination

import { useState, useCallback, useRef, useEffect } from 'react';
import { Button } from '@/shared/components/ui/button';
import { QuestionCard } from './QuestionCard';

export interface MirrorDiscriminationResult {
  /** User's answer: 'rotated' or 'mirrored' */
  answer: 'rotated' | 'mirrored';
  /** Whether the answer was correct */
  isCorrect: boolean;
  /** Time to answer in milliseconds */
  timeToAnswer: number;
  /** Shape type used */
  shapeType: string;
  /** Whether the shape was actually mirrored */
  isActuallyMirrored: boolean;
}

export interface MirrorDiscriminationProps {
  /** Shape type identifier (e.g., 'L-shape', 'T-shape') */
  shapeType: string;
  /** Whether the second shape is actually mirrored (true) or just rotated (false) */
  isActuallyMirrored: boolean;
  /** Callback when user answers */
  onAnswer: (result: MirrorDiscriminationResult) => void;
}

/** SVG path definitions for clearly distinct asymmetric shapes */
const SHAPE_PATHS: Record<string, string> = {
  'L-shape': 'M 20 20 L 20 80 L 40 80 L 40 40 L 80 40 L 80 20 Z',
  'T-shape': 'M 20 20 L 20 40 L 40 40 L 40 80 L 60 80 L 60 40 L 80 40 L 80 20 Z',
  'zigzag': 'M 20 20 L 40 40 L 60 20 L 80 40 L 80 60 L 60 40 L 40 60 L 20 40 Z',
  'arrow': 'M 50 20 L 80 50 L 65 50 L 65 80 L 35 80 L 35 50 L 20 50 Z',
  'F-shape': 'M 20 20 L 20 80 L 40 80 L 40 50 L 60 50 L 60 35 L 40 35 L 40 20 L 80 20 L 80 20 Z',
};

/**
 * MirrorDiscrimination - Shows original and transformed shape, user decides if mirrored or rotated
 *
 * Features:
 * - SVG shape rendering with asymmetric shapes
 * - Original shape on left, transformed shape on right
 * - Mirrored: CSS scaleX(-1), Rotated: CSS rotate(90deg)
 * - Two answer buttons: "Rotated" and "Mirrored"
 * - Records timing with performance.now()
 * - 44px+ touch targets for accessibility
 * - No visual feedback during assessment
 */
export function MirrorDiscrimination({
  shapeType,
  isActuallyMirrored,
  onAnswer,
}: MirrorDiscriminationProps) {
  const startTimeRef = useRef<number>(performance.now());
  const [answered, setAnswered] = useState(false);

  // Reset timer when question changes
  useEffect(() => {
    startTimeRef.current = performance.now();
    setAnswered(false);
  }, [shapeType, isActuallyMirrored]);

  const shapePath = SHAPE_PATHS[shapeType] || SHAPE_PATHS['L-shape'];

  const handleAnswer = useCallback(
    (answer: 'rotated' | 'mirrored') => {
      if (answered) return;

      const timeToAnswer = performance.now() - startTimeRef.current;
      const correctAnswer = isActuallyMirrored ? 'mirrored' : 'rotated';
      const isCorrect = answer === correctAnswer;

      setAnswered(true);

      onAnswer({
        answer,
        isCorrect,
        timeToAnswer,
        shapeType,
        isActuallyMirrored,
      });
    },
    [answered, isActuallyMirrored, shapeType, onAnswer]
  );

  // Transform for the second shape
  const transformStyle = isActuallyMirrored
    ? { transform: 'scaleX(-1)', transformOrigin: 'center center' }
    : { transform: 'rotate(90deg)', transformOrigin: 'center center' };

  return (
    <QuestionCard
      question="Is the second shape rotated or mirrored?"
      data-testid="mirror-discrimination"
      footer={
        <>
          <Button
            variant="outline"
            onClick={() => handleAnswer('rotated')}
            disabled={answered}
            className="min-h-[60px] min-w-[100px]"
            data-testid="answer-rotated"
            aria-label="The shape is rotated"
          >
            Rotated
          </Button>
          <Button
            variant="outline"
            onClick={() => handleAnswer('mirrored')}
            disabled={answered}
            className="min-h-[60px] min-w-[100px]"
            data-testid="answer-mirrored"
            aria-label="The shape is mirrored"
          >
            Mirrored
          </Button>
        </>
      }
    >
      <div className="flex flex-col items-center gap-4">
        <p className="text-sm text-muted-foreground text-center">
          Compare the two shapes carefully
        </p>
        <div className="flex items-center justify-center gap-8">
          {/* Original shape */}
          <div
            className="flex flex-col items-center gap-2"
            data-testid="original-shape"
            aria-label="Original shape"
          >
            <span className="text-xs font-medium text-muted-foreground">Original</span>
            <svg
              width="120"
              height="120"
              viewBox="0 0 100 100"
              className="bg-muted rounded-lg"
              role="img"
              aria-label={`Original ${shapeType}`}
            >
              <path
                d={shapePath}
                className="fill-primary"
                data-testid="original-shape-path"
              />
            </svg>
          </div>

          {/* Transformed shape */}
          <div
            className="flex flex-col items-center gap-2"
            data-testid="transformed-shape"
            aria-label={`Transformed shape (${isActuallyMirrored ? 'mirrored' : 'rotated'})`}
          >
            <span className="text-xs font-medium text-muted-foreground">Transformed</span>
            <svg
              width="120"
              height="120"
              viewBox="0 0 100 100"
              className="bg-muted rounded-lg"
              role="img"
              aria-label={`Transformed ${shapeType}`}
              style={transformStyle}
            >
              <path
                d={shapePath}
                className="fill-primary"
                data-testid="transformed-shape-path"
              />
            </svg>
          </div>
        </div>
      </div>
    </QuestionCard>
  );
}

export default MirrorDiscrimination;
