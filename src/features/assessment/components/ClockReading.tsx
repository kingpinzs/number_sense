// ClockReading - Read time from an analog clock
// Assesses time-telling and spatial interpretation of clock positions

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { Button } from '@/shared/components/ui/button';
import { QuestionCard } from './QuestionCard';

export interface ClockReadingResult {
  /** User's selected time string */
  userAnswer: string;
  /** Whether the answer was correct */
  isCorrect: boolean;
  /** Time to answer in milliseconds */
  timeToAnswer: number;
  /** The correct time string */
  correctTime: string;
}

export interface ClockReadingProps {
  /** Hour (1-12) */
  hours: number;
  /** Minutes (0-59) */
  minutes: number;
  /** Array of 4 time string choices (e.g., ["3:00", "3:30", "6:15", "9:45"]) */
  choices: string[];
  /** Callback when user answers */
  onAnswer: (result: ClockReadingResult) => void;
}

/**
 * ClockReading - SVG analog clock with hour/minute hands, 4 time choices
 *
 * Features:
 * - SVG clock with circle, hour marks, hour hand, minute hand
 * - 4 time choice buttons
 * - Records timing with performance.now()
 * - 44px+ touch targets for accessibility
 * - No visual feedback during assessment
 */
export function ClockReading({
  hours,
  minutes,
  choices,
  onAnswer,
}: ClockReadingProps) {
  const startTimeRef = useRef<number>(performance.now());
  const [answered, setAnswered] = useState(false);

  // Reset when question changes
  useEffect(() => {
    startTimeRef.current = performance.now();
    setAnswered(false);
  }, [hours, minutes]);

  const correctTime = `${hours}:${String(minutes).padStart(2, '0')}`;

  const handleAnswer = useCallback(
    (choice: string) => {
      if (answered) return;

      const timeToAnswer = performance.now() - startTimeRef.current;
      const isCorrect = choice === correctTime;

      setAnswered(true);

      onAnswer({
        userAnswer: choice,
        isCorrect,
        timeToAnswer,
        correctTime,
      });
    },
    [answered, correctTime, onAnswer]
  );

  // Clock geometry
  const cx = 100;
  const cy = 100;
  const radius = 85;

  // Calculate hand angles (12 o'clock is 0 degrees, clockwise)
  const minuteAngle = (minutes / 60) * 360;
  const hourAngle = ((hours % 12) / 12) * 360 + (minutes / 60) * 30;

  // Calculate hand endpoints
  const minuteHandLength = 65;
  const hourHandLength = 45;

  const minuteHandEnd = useMemo(() => {
    const rad = ((minuteAngle - 90) * Math.PI) / 180;
    return {
      x: cx + minuteHandLength * Math.cos(rad),
      y: cy + minuteHandLength * Math.sin(rad),
    };
  }, [minuteAngle]);

  const hourHandEnd = useMemo(() => {
    const rad = ((hourAngle - 90) * Math.PI) / 180;
    return {
      x: cx + hourHandLength * Math.cos(rad),
      y: cy + hourHandLength * Math.sin(rad),
    };
  }, [hourAngle]);

  // Hour marks (12 positions)
  const hourMarks = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const angle = ((i * 30 - 90) * Math.PI) / 180;
      const innerR = radius - 10;
      const outerR = radius - 2;
      return {
        x1: cx + innerR * Math.cos(angle),
        y1: cy + innerR * Math.sin(angle),
        x2: cx + outerR * Math.cos(angle),
        y2: cy + outerR * Math.sin(angle),
        label: i === 0 ? 12 : i,
        labelX: cx + (radius - 20) * Math.cos(angle),
        labelY: cy + (radius - 20) * Math.sin(angle),
      };
    });
  }, []);

  return (
    <QuestionCard
      question="What time does the clock show?"
      data-testid="clock-reading"
    >
      <div className="flex flex-col items-center gap-8 w-full">
        {/* Clock SVG */}
        <div
          className="flex justify-center"
          data-testid="clock-display"
          aria-label={`Analog clock showing ${correctTime}`}
        >
          <svg
            width="200"
            height="200"
            viewBox="0 0 200 200"
            role="img"
            aria-label={`Clock showing ${correctTime}`}
          >
            {/* Clock face */}
            <circle
              cx={cx}
              cy={cy}
              r={radius}
              className="fill-muted stroke-border"
              strokeWidth="3"
              data-testid="clock-face"
            />

            {/* Hour marks and numbers */}
            {hourMarks.map((mark, index) => (
              <g key={index}>
                <line
                  x1={mark.x1}
                  y1={mark.y1}
                  x2={mark.x2}
                  y2={mark.y2}
                  className="stroke-foreground"
                  strokeWidth="2"
                  data-testid={`hour-mark-${index}`}
                />
                <text
                  x={mark.labelX}
                  y={mark.labelY}
                  textAnchor="middle"
                  dominantBaseline="central"
                  className="fill-foreground text-xs font-semibold"
                  data-testid={`hour-label-${index}`}
                >
                  {mark.label}
                </text>
              </g>
            ))}

            {/* Hour hand */}
            <line
              x1={cx}
              y1={cy}
              x2={hourHandEnd.x}
              y2={hourHandEnd.y}
              className="stroke-foreground"
              strokeWidth="4"
              strokeLinecap="round"
              data-testid="hour-hand"
            />

            {/* Minute hand */}
            <line
              x1={cx}
              y1={cy}
              x2={minuteHandEnd.x}
              y2={minuteHandEnd.y}
              className="stroke-primary"
              strokeWidth="2.5"
              strokeLinecap="round"
              data-testid="minute-hand"
            />

            {/* Center dot */}
            <circle
              cx={cx}
              cy={cy}
              r="4"
              className="fill-foreground"
              data-testid="center-dot"
            />
          </svg>
        </div>

        {/* Time choices */}
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
              aria-label={`Time ${choice}`}
            >
              {choice}
            </Button>
          ))}
        </div>

        <p
          className="text-center text-sm text-muted-foreground"
          data-testid="instruction-text"
        >
          {answered ? 'Answer recorded' : 'Select the time shown on the clock'}
        </p>
      </div>
    </QuestionCard>
  );
}

export default ClockReading;
