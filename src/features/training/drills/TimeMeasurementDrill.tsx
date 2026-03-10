/**
 * TimeMeasurementDrill Component
 * Trains analog clock reading — a common difficulty area for dyscalculia.
 *
 * Shows an SVG analog clock face with hour and minute hands.
 * User selects the correct time from 4 multiple-choice options.
 * Easy: exact hours. Medium: half/quarter hours. Hard: 5-minute intervals.
 */

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X } from 'lucide-react';
import { db } from '@/services/storage/db';
import { STORAGE_KEYS } from '@/services/storage/localStorage';
import type { DrillResult } from '@/services/storage/schemas';

export interface DrillProps {
  difficulty: 'easy' | 'medium' | 'hard';
  sessionId: number;
  onComplete: (result: DrillResult) => void;
  onSkip?: () => void;
}

interface TimeProblem {
  hour: number;    // 1-12
  minute: number;  // 0-59
  choices: string[];
  correctIndex: number;
}

/** Difficulty → minute options */
const DIFFICULTY_CONFIG = {
  easy:   { minutes: [0] },
  medium: { minutes: [0, 15, 30, 45] },
  hard:   { minutes: [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55] },
} as const;

/** Format time as "H:MM" */
function formatTime(hour: number, minute: number): string {
  return `${hour}:${minute.toString().padStart(2, '0')}`;
}

/** Shuffle an array (Fisher-Yates) */
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function generateTimeProblem(difficulty: 'easy' | 'medium' | 'hard'): TimeProblem {
  const config = DIFFICULTY_CONFIG[difficulty];
  const hour = 1 + Math.floor(Math.random() * 12);
  const minute = config.minutes[Math.floor(Math.random() * config.minutes.length)];
  const correctTime = formatTime(hour, minute);

  // Generate 3 distractors
  const distractors = new Set<string>();
  distractors.add(correctTime);

  while (distractors.size < 4) {
    const strategy = Math.floor(Math.random() * 3);
    let dHour: number;
    let dMinute: number;

    if (strategy === 0) {
      // Different hour, same minute
      dHour = 1 + Math.floor(Math.random() * 12);
      dMinute = minute;
    } else if (strategy === 1) {
      // Same hour, different minute
      dHour = hour;
      dMinute = config.minutes[Math.floor(Math.random() * config.minutes.length)];
    } else {
      // Both different
      dHour = 1 + Math.floor(Math.random() * 12);
      dMinute = config.minutes[Math.floor(Math.random() * config.minutes.length)];
    }

    const time = formatTime(dHour, dMinute);
    if (time !== correctTime) {
      distractors.add(time);
    }
  }

  const choicesArr = Array.from(distractors).slice(0, 4);
  const shuffled = shuffle(choicesArr);
  const correctIndex = shuffled.indexOf(correctTime);

  return { hour, minute, choices: shuffled, correctIndex };
}

/** SVG analog clock face */
function ClockFace({ hour, minute }: { hour: number; minute: number }) {
  const cx = 120;
  const cy = 120;
  const r = 100;

  // Hour hand: rotates 360 degrees in 12 hours, plus offset for minutes
  const hourAngle = ((hour % 12) + minute / 60) * 30 - 90;
  const hourRad = (hourAngle * Math.PI) / 180;
  const hourLength = 55;
  const hourX = cx + hourLength * Math.cos(hourRad);
  const hourY = cy + hourLength * Math.sin(hourRad);

  // Minute hand: rotates 360 degrees in 60 minutes
  const minuteAngle = minute * 6 - 90;
  const minuteRad = (minuteAngle * Math.PI) / 180;
  const minuteLength = 80;
  const minuteX = cx + minuteLength * Math.cos(minuteRad);
  const minuteY = cy + minuteLength * Math.sin(minuteRad);

  return (
    <svg
      viewBox="0 0 240 240"
      className="w-full max-w-[240px] h-auto mx-auto"
      role="img"
      aria-label={`Analog clock showing ${hour}:${minute.toString().padStart(2, '0')}`}
      data-testid="clock-face"
    >
      {/* Clock circle */}
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="hsl(var(--card))"
        stroke="hsl(var(--border))"
        strokeWidth={3}
      />

      {/* Hour tick marks */}
      {Array.from({ length: 12 }, (_, i) => {
        const angle = (i * 30 - 90) * (Math.PI / 180);
        const outerR = r - 5;
        const innerR = i % 3 === 0 ? r - 20 : r - 12;
        return (
          <line
            key={i}
            x1={cx + innerR * Math.cos(angle)}
            y1={cy + innerR * Math.sin(angle)}
            x2={cx + outerR * Math.cos(angle)}
            y2={cy + outerR * Math.sin(angle)}
            stroke="hsl(var(--foreground))"
            strokeWidth={i % 3 === 0 ? 3 : 1.5}
            strokeLinecap="round"
          />
        );
      })}

      {/* Hour numbers */}
      {Array.from({ length: 12 }, (_, i) => {
        const num = i + 1;
        const angle = (num * 30 - 90) * (Math.PI / 180);
        const numR = r - 28;
        return (
          <text
            key={num}
            x={cx + numR * Math.cos(angle)}
            y={cy + numR * Math.sin(angle)}
            textAnchor="middle"
            dominantBaseline="central"
            fill="hsl(var(--foreground))"
            fontSize="14"
            fontWeight="bold"
          >
            {num}
          </text>
        );
      })}

      {/* Hour hand */}
      <line
        x1={cx}
        y1={cy}
        x2={hourX}
        y2={hourY}
        stroke="hsl(var(--foreground))"
        strokeWidth={5}
        strokeLinecap="round"
        data-testid="hour-hand"
      />

      {/* Minute hand */}
      <line
        x1={cx}
        y1={cy}
        x2={minuteX}
        y2={minuteY}
        stroke="hsl(var(--primary))"
        strokeWidth={3}
        strokeLinecap="round"
        data-testid="minute-hand"
      />

      {/* Center dot */}
      <circle cx={cx} cy={cy} r={5} fill="hsl(var(--foreground))" />
    </svg>
  );
}

export default function TimeMeasurementDrill({ difficulty, sessionId, onComplete }: DrillProps) {
  const [problem] = useState(() => generateTimeProblem(difficulty));
  const { hour, minute, choices, correctIndex } = problem;
  const correctTime = choices[correctIndex];

  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [startTime] = useState(Date.now());
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const prefersReducedMotion = typeof window !== 'undefined'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  useEffect(() => {
    return () => {
      if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    };
  }, []);

  const handleChoice = async (index: number) => {
    if (submitted) return;

    const correct = index === correctIndex;
    const timeToAnswer = Date.now() - startTime;

    setSelectedIndex(index);
    setIsCorrect(correct);
    setSubmitted(true);
    setShowFeedback(true);

    const result: DrillResult = {
      sessionId,
      timestamp: new Date().toISOString(),
      module: 'time_measurement',
      difficulty,
      isCorrect: correct,
      timeToAnswer,
      accuracy: correct ? 100 : 0,
      targetNumber: hour * 100 + minute,
      userAnswer: index,
      correctAnswer: correctIndex,
      problem: `What time is shown? (${formatTime(hour, minute)})`,
    };

    // Persist to Dexie
    try {
      await db.drill_results.add(result);
    } catch (error) {
      console.error('Failed to persist drill result:', error);
      try {
        const backup = localStorage.getItem(STORAGE_KEYS.DRILL_RESULTS_BACKUP);
        const results = backup ? JSON.parse(backup) : [];
        results.push(result);
        localStorage.setItem(STORAGE_KEYS.DRILL_RESULTS_BACKUP, JSON.stringify(results));
      } catch {
        localStorage.setItem(STORAGE_KEYS.DRILL_RESULTS_BACKUP, JSON.stringify([result]));
      }
    }

    feedbackTimerRef.current = setTimeout(() => {
      onComplete(result);
    }, 1500);
  };

  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center bg-background p-6"
      tabIndex={0}
      role="application"
      aria-label="Time measurement drill"
      data-testid="time-measurement-drill"
    >
      <div className="w-full max-w-md space-y-8">
        {/* Problem display */}
        <div className="text-center">
          <p className="text-sm font-medium text-muted-foreground mb-2">Time</p>
          <h2
            className="text-2xl font-bold text-foreground mb-6"
            style={{ fontSize: 'clamp(20px, 5vw, 32px)' }}
            aria-live="polite"
            aria-atomic="true"
            data-testid="time-question"
          >
            What time is shown?
          </h2>
        </div>

        {/* Clock visualization */}
        <div className="flex justify-center py-4" data-testid="clock-container">
          <ClockFace hour={hour} minute={minute} />
        </div>

        {/* Multiple-choice buttons */}
        <div
          className="grid grid-cols-2 gap-3"
          role="group"
          aria-label="Time choices"
          data-testid="choices-container"
        >
          {choices.map((choice, i) => {
            let buttonClass = 'min-h-[56px] rounded-lg border-2 px-4 py-3 text-xl font-semibold transition-colors ';
            if (submitted) {
              if (i === correctIndex) {
                buttonClass += 'border-green-500 bg-green-500/20 text-green-500';
              } else if (i === selectedIndex) {
                buttonClass += 'border-yellow-500 bg-yellow-500/20 text-yellow-500';
              } else {
                buttonClass += 'border-border bg-card text-muted-foreground opacity-50';
              }
            } else {
              buttonClass += 'border-primary bg-card text-foreground hover:bg-primary/10 cursor-pointer';
            }

            return (
              <button
                key={i}
                type="button"
                onClick={() => handleChoice(i)}
                disabled={submitted}
                className={buttonClass}
                aria-label={`Choice: ${choice}`}
                data-testid={`choice-${i}`}
              >
                {choice}
              </button>
            );
          })}
        </div>

        {/* Feedback */}
        <AnimatePresence>
          {showFeedback && (
            <motion.div
              initial={prefersReducedMotion ? { opacity: 0 } : { scale: 0, opacity: 0 }}
              animate={prefersReducedMotion ? { opacity: 1 } : { scale: 1, opacity: 1 }}
              exit={prefersReducedMotion ? { opacity: 0 } : { scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 flex items-center justify-center bg-background/80"
              role="alert"
              aria-live="assertive"
              data-testid="feedback-overlay"
            >
              <div className="text-center">
                {isCorrect ? (
                  <>
                    <div className="mb-4 flex justify-center">
                      <Check className="h-24 w-24 text-green-500" aria-hidden="true" />
                    </div>
                    <p className="text-2xl font-bold text-green-500">
                      {correctTime}
                    </p>
                    <p className="sr-only">Correct!</p>
                  </>
                ) : (
                  <>
                    <div className="mb-4 flex justify-center">
                      <X className="h-24 w-24 text-yellow-500" aria-hidden="true" />
                    </div>
                    <p className="text-lg font-medium text-foreground mb-1">
                      Not quite — keep going!
                    </p>
                    <p className="text-2xl font-semibold text-muted-foreground">
                      The time is {correctTime}
                    </p>
                    <p className="sr-only">
                      The answer is {correctTime}. The clock shows {hour} hours and {minute} minutes.
                    </p>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
