// MentalRotation - Shape rotation matching question
// Story 2.3: Implement Spatial Awareness Question Types
// AC1-AC4: Mental rotation with two shapes, rotation angles, Yes/No options, timing

import { useState, useCallback, useRef, useEffect } from 'react';
import { Button } from '@/shared/components/ui/button';
import { QuestionCard } from './QuestionCard';

export interface MentalRotationResult {
  /** User's answer: 'yes' or 'no' */
  answer: 'yes' | 'no';
  /** Whether the answer was correct */
  isCorrect: boolean;
  /** Time to answer in milliseconds */
  timeToAnswer: number;
  /** Shape type used */
  shapeType: string;
  /** Rotation angle applied */
  rotationAngle: number;
  /** Whether shapes actually match */
  isMatch: boolean;
}

export interface MentalRotationProps {
  /** Shape type identifier */
  shapeType: string;
  /** Rotation angle (90, 180, or 270 degrees) */
  rotationAngle: 90 | 180 | 270;
  /** Whether the shapes actually match (true = same shape, false = different) */
  isMatch: boolean;
  /** Callback when user answers */
  onAnswer: (result: MentalRotationResult) => void;
}

/** SVG path definitions for clearly distinct asymmetric shapes */
const SHAPE_PATHS: Record<string, string> = {
  'L-shape': 'M 20 20 L 20 80 L 40 80 L 40 40 L 80 40 L 80 20 Z',
  'T-shape': 'M 20 20 L 20 40 L 40 40 L 40 80 L 60 80 L 60 40 L 80 40 L 80 20 Z',
  'zigzag': 'M 20 20 L 40 40 L 60 20 L 80 40 L 80 60 L 60 40 L 40 60 L 20 40 Z',
  'irregular-polygon': 'M 30 20 L 70 25 L 80 50 L 65 80 L 35 75 L 20 45 Z',
  'arrow': 'M 50 20 L 80 50 L 65 50 L 65 80 L 35 80 L 35 50 L 20 50 Z',
};

/**
 * For non-matching pairs, use a completely different shape type
 * so the difference is unambiguous. Maps each shape to a clearly
 * different shape rather than a slightly tweaked variant.
 */
const MISMATCH_SHAPE: Record<string, string> = {
  'L-shape': 'arrow',
  'T-shape': 'zigzag',
  'zigzag': 'L-shape',
  'irregular-polygon': 'T-shape',
  'arrow': 'irregular-polygon',
};

/**
 * MentalRotation - Shows two shapes for rotation comparison
 *
 * Features:
 * - SVG shape rendering with asymmetric shapes
 * - CSS transform for rotation (90°, 180°, 270°)
 * - Yes/No answer buttons
 * - Records timing with performance.now()
 * - 60px+ touch targets for accessibility
 * - No visual feedback during assessment
 * - Non-matching pairs use clearly different shape types
 */
export function MentalRotation({
  shapeType,
  rotationAngle,
  isMatch,
  onAnswer,
}: MentalRotationProps) {
  const startTimeRef = useRef<number>(performance.now());
  const [answered, setAnswered] = useState(false);

  // Reset timer when question changes
  useEffect(() => {
    startTimeRef.current = performance.now();
    setAnswered(false);
  }, [shapeType, rotationAngle, isMatch]);

  // Determine which shapes to display
  const leftShapePath = SHAPE_PATHS[shapeType] || SHAPE_PATHS['L-shape'];
  const rightShapePath = isMatch
    ? leftShapePath
    : SHAPE_PATHS[MISMATCH_SHAPE[shapeType] || 'arrow'];

  const handleAnswer = useCallback(
    (answer: 'yes' | 'no') => {
      if (answered) return;

      const timeToAnswer = performance.now() - startTimeRef.current;
      const userSaysMatch = answer === 'yes';
      const isCorrect = userSaysMatch === isMatch;

      setAnswered(true);

      onAnswer({
        answer,
        isCorrect,
        timeToAnswer,
        shapeType,
        rotationAngle,
        isMatch,
      });
    },
    [answered, isMatch, shapeType, rotationAngle, onAnswer]
  );

  return (
    <QuestionCard
      question="Are these the exact same shape, just rotated?"
      data-testid="mental-rotation"
      footer={
        <>
          <Button
            variant="outline"
            onClick={() => handleAnswer('yes')}
            disabled={answered}
            className="min-h-[60px] min-w-[100px]"
            data-testid="answer-yes"
            aria-label="Yes, these are the same shape"
          >
            Yes
          </Button>
          <Button
            variant="outline"
            onClick={() => handleAnswer('no')}
            disabled={answered}
            className="min-h-[60px] min-w-[100px]"
            data-testid="answer-no"
            aria-label="No, these are different shapes"
          >
            No
          </Button>
        </>
      }
    >
      <div className="flex flex-col items-center gap-4">
        <p className="text-sm text-muted-foreground text-center">
          Ignore size — focus on the shape itself
        </p>
        <div className="flex items-center justify-center gap-8">
          {/* Left shape (unrotated) */}
          <div
            className="flex flex-col items-center gap-2"
            data-testid="left-shape"
            aria-label="Left shape"
          >
            <svg
              width="120"
              height="120"
              viewBox="0 0 100 100"
              className="bg-muted rounded-lg"
              role="img"
              aria-label={`Left ${shapeType} shape`}
            >
              <path
                d={leftShapePath}
                className="fill-primary"
                data-testid="left-shape-path"
              />
            </svg>
          </div>

          {/* Right shape (rotated) */}
          <div
            className="flex flex-col items-center gap-2"
            data-testid="right-shape"
            aria-label={`Right shape rotated ${rotationAngle} degrees`}
          >
            <svg
              width="120"
              height="120"
              viewBox="0 0 100 100"
              className="bg-muted rounded-lg"
              role="img"
              aria-label={`Right ${shapeType} shape rotated ${rotationAngle} degrees`}
              style={{
                transform: `rotate(${rotationAngle}deg)`,
                transformOrigin: 'center center',
              }}
            >
              <path
                d={rightShapePath}
                className="fill-primary"
                data-testid="right-shape-path"
              />
            </svg>
          </div>
        </div>
      </div>
    </QuestionCard>
  );
}

export default MentalRotation;
