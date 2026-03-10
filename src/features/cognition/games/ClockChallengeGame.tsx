// ClockChallengeGame - Analog clock reading brain game
// Show an SVG analog clock, player picks the correct time from 4 choices

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Button } from '@/shared/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/shared/components/ui/dialog';
import { db } from '@/services/storage/db';
import { STORAGE_KEYS } from '@/services/storage/localStorage';
import type { GameDifficulty } from '../types';

interface ClockChallengeGameProps {
  onBack: () => void;
}

type FeedbackState = 'none' | 'correct' | 'incorrect';

const TOTAL_ROUNDS = 12;
const FEEDBACK_MS = 1000;

/** Format a time value as "H:MM" */
function formatTime(hour: number, minute: number): string {
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${displayHour}:${minute.toString().padStart(2, '0')}`;
}

/** Generate a random time for the given difficulty */
function generateTime(difficulty: GameDifficulty): { hour: number; minute: number } {
  const hour = Math.floor(Math.random() * 12) + 1;
  if (difficulty === 'easy') {
    return { hour, minute: 0 };
  }
  if (difficulty === 'medium') {
    const quarterMinutes = [0, 15, 30, 45];
    const minute = quarterMinutes[Math.floor(Math.random() * quarterMinutes.length)];
    return { hour, minute };
  }
  // hard: 5-minute intervals
  const fiveMinIntervals = Array.from({ length: 12 }, (_, i) => i * 5);
  const minute = fiveMinIntervals[Math.floor(Math.random() * fiveMinIntervals.length)];
  return { hour, minute };
}

/** Generate 4 choices including the correct answer, with unique times */
function generateChoices(
  correctHour: number,
  correctMinute: number,
  difficulty: GameDifficulty,
): { hour: number; minute: number }[] {
  const correctKey = `${correctHour}:${correctMinute}`;
  const choices: { hour: number; minute: number }[] = [
    { hour: correctHour, minute: correctMinute },
  ];
  const usedKeys = new Set([correctKey]);

  while (choices.length < 4) {
    const { hour, minute } = generateTime(difficulty);
    const key = `${hour}:${minute}`;
    if (!usedKeys.has(key)) {
      usedKeys.add(key);
      choices.push({ hour, minute });
    }
  }

  // Shuffle using Fisher-Yates
  for (let i = choices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [choices[i], choices[j]] = [choices[j], choices[i]];
  }

  return choices;
}

interface ClockFaceProps {
  hour: number;
  minute: number;
  size?: number;
}

/** SVG analog clock face */
function ClockFace({ hour, minute, size = 200 }: ClockFaceProps) {
  const cx = size / 2;
  const cy = size / 2;
  const radius = size / 2 - 10;

  // Hand angles (0 degrees = 12 o'clock, clockwise)
  const minuteAngle = minute * 6;
  const hourAngle = (hour % 12) * 30 + minute * 0.5;

  // Convert angle to SVG coordinates (SVG 0 is at 3 o'clock, so offset by -90)
  const handEndpoint = (angle: number, length: number) => {
    const rad = ((angle - 90) * Math.PI) / 180;
    return {
      x: cx + length * Math.cos(rad),
      y: cy + length * Math.sin(rad),
    };
  };

  const hourEnd = handEndpoint(hourAngle, radius * 0.5);
  const minuteEnd = handEndpoint(minuteAngle, radius * 0.75);

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      aria-hidden="true"
      className="block"
    >
      {/* Clock face background */}
      <circle
        cx={cx}
        cy={cy}
        r={radius}
        fill="var(--color-card)"
        stroke="var(--color-border)"
        strokeWidth={3}
      />

      {/* Hour marks */}
      {Array.from({ length: 12 }, (_, i) => {
        const angle = i * 30;
        const outerR = radius - 4;
        const innerR = radius - 14;
        const rad = ((angle - 90) * Math.PI) / 180;
        return (
          <line
            key={`mark-${i}`}
            x1={cx + innerR * Math.cos(rad)}
            y1={cy + innerR * Math.sin(rad)}
            x2={cx + outerR * Math.cos(rad)}
            y2={cy + outerR * Math.sin(rad)}
            stroke="var(--color-muted-foreground)"
            strokeWidth={2}
            strokeLinecap="round"
          />
        );
      })}

      {/* Hour numbers */}
      {Array.from({ length: 12 }, (_, i) => {
        const hourNum = i === 0 ? 12 : i;
        const angle = i * 30;
        const numRadius = radius - 28;
        const rad = ((angle - 90) * Math.PI) / 180;
        return (
          <text
            key={`num-${i}`}
            x={cx + numRadius * Math.cos(rad)}
            y={cy + numRadius * Math.sin(rad)}
            textAnchor="middle"
            dominantBaseline="central"
            fill="var(--color-foreground)"
            fontSize={size * 0.08}
            fontWeight="600"
          >
            {hourNum}
          </text>
        );
      })}

      {/* Hour hand (short, thick) */}
      <line
        x1={cx}
        y1={cy}
        x2={hourEnd.x}
        y2={hourEnd.y}
        stroke="var(--color-foreground)"
        strokeWidth={4}
        strokeLinecap="round"
      />

      {/* Minute hand (longer, thinner) */}
      <line
        x1={cx}
        y1={cy}
        x2={minuteEnd.x}
        y2={minuteEnd.y}
        stroke="var(--color-foreground)"
        strokeWidth={2.5}
        strokeLinecap="round"
      />

      {/* Center dot */}
      <circle cx={cx} cy={cy} r={4} fill="var(--color-foreground)" />
    </svg>
  );
}

/** Encouragement based on accuracy */
function getEncouragementMessage(accuracy: number): string {
  if (accuracy >= 90) return 'Excellent time-reading skills!';
  if (accuracy >= 70) return 'Good job! Keep practising to improve.';
  if (accuracy >= 50) return 'Not bad! Try an easier difficulty to build confidence.';
  return 'Keep going — practice makes perfect!';
}

export default function ClockChallengeGame({ onBack }: ClockChallengeGameProps) {
  const shouldReduceMotion = useReducedMotion();

  // Game state
  const [difficulty, setDifficulty] = useState<GameDifficulty>('medium');
  const [round, setRound] = useState(1);
  const [correctCount, setCorrectCount] = useState(0);
  const [feedback, setFeedback] = useState<FeedbackState>('none');
  const [gameComplete, setGameComplete] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  // Current question
  const [currentTime, setCurrentTime] = useState<{ hour: number; minute: number }>(() =>
    generateTime('medium'),
  );
  const [choices, setChoices] = useState<{ hour: number; minute: number }[]>(() =>
    generateChoices(currentTime.hour, currentTime.minute, 'medium'),
  );

  // Duration tracking
  const startTimeRef = useRef<number>(Date.now());

  // Timeout cleanup
  const feedbackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Refs for stable callback values
  const roundRef = useRef(round);
  roundRef.current = round;
  const difficultyRef = useRef(difficulty);
  difficultyRef.current = difficulty;

  // Clean up timeout on unmount (prevent memory leaks)
  useEffect(() => {
    return () => {
      if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
    };
  }, []);

  const cleanupTimeout = useCallback(() => {
    if (feedbackTimeoutRef.current !== null) {
      clearTimeout(feedbackTimeoutRef.current);
      feedbackTimeoutRef.current = null;
    }
  }, []);

  // Advance to next round or complete the game
  const advanceRound = useCallback(() => {
    if (roundRef.current >= TOTAL_ROUNDS) {
      setGameComplete(true);
      setFeedback('none');
      setSelectedIndex(null);
    } else {
      const nextTime = generateTime(difficultyRef.current);
      const nextChoices = generateChoices(nextTime.hour, nextTime.minute, difficultyRef.current);
      setRound(prev => prev + 1);
      setCurrentTime(nextTime);
      setChoices(nextChoices);
      setFeedback('none');
      setSelectedIndex(null);
    }
  }, []);

  // Handle choice selection
  const handleChoice = useCallback(
    (index: number) => {
      if (feedback !== 'none' || gameComplete) return;

      const chosen = choices[index];
      const isCorrect = chosen.hour === currentTime.hour && chosen.minute === currentTime.minute;

      setSelectedIndex(index);

      if (isCorrect) {
        setCorrectCount(prev => prev + 1);
        setFeedback('correct');
      } else {
        setFeedback('incorrect');
      }

      // Auto-advance after feedback
      feedbackTimeoutRef.current = setTimeout(() => {
        feedbackTimeoutRef.current = null;
        advanceRound();
      }, FEEDBACK_MS);
    },
    [feedback, gameComplete, choices, currentTime, advanceRound],
  );

  // Save results on game completion
  useEffect(() => {
    if (!gameComplete) return;

    const duration = Date.now() - startTimeRef.current;
    const finalAccuracy = Math.round((correctCount / TOTAL_ROUNDS) * 100);

    // Save to drill_results
    db.drill_results
      .add({
        sessionId: 0,
        timestamp: new Date().toISOString(),
        module: 'time_measurement',
        difficulty,
        isCorrect: finalAccuracy >= 70,
        timeToAnswer: duration,
        accuracy: finalAccuracy,
      })
      .catch(err => console.error('Failed to save drill result:', err));

    // Also log telemetry
    db.telemetry_logs
      .add({
        timestamp: new Date().toISOString(),
        event: 'cognition_game_complete',
        module: 'clock_challenge',
        data: {
          difficulty,
          correctCount,
          totalRounds: TOTAL_ROUNDS,
          accuracy: finalAccuracy,
          duration,
        },
        userId: 'local_user',
      })
      .catch(err => console.error('Failed to log telemetry:', err));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameComplete]);

  // Reset game
  const resetGame = useCallback(
    (newDifficulty?: GameDifficulty) => {
      const diff = newDifficulty ?? difficultyRef.current;
      cleanupTimeout();
      const time = generateTime(diff);
      setDifficulty(diff);
      difficultyRef.current = diff;
      setRound(1);
      roundRef.current = 1;
      setCorrectCount(0);
      setCurrentTime(time);
      setChoices(generateChoices(time.hour, time.minute, diff));
      setFeedback('none');
      setSelectedIndex(null);
      setGameComplete(false);
      startTimeRef.current = Date.now();
    },
    [cleanupTimeout],
  );

  // Handle difficulty change
  const handleDifficultyChange = useCallback(
    (newDifficulty: GameDifficulty) => {
      if (newDifficulty !== difficultyRef.current) {
        resetGame(newDifficulty);
      }
    },
    [resetGame],
  );

  // Determine correct answer index for feedback display
  const correctIndex = choices.findIndex(
    c => c.hour === currentTime.hour && c.minute === currentTime.minute,
  );

  // Stats for results dialog
  const accuracy = Math.round((correctCount / TOTAL_ROUNDS) * 100);

  // Keep STORAGE_KEYS referenced so the import is not unused
  void STORAGE_KEYS;

  return (
    <div className="max-w-md mx-auto px-4 py-4">
      {/* Header with difficulty selector */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex gap-1">
          {(['easy', 'medium', 'hard'] as const).map(d => (
            <button
              key={d}
              onClick={() => handleDifficultyChange(d)}
              className={`px-3 py-2 min-h-[44px] text-sm rounded-full capitalize transition-colors
                ${
                  d === difficulty
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }
              `}
              aria-pressed={d === difficulty}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      {/* Round counter */}
      <div
        className="text-center mb-4"
        aria-live="polite"
        aria-atomic="true"
      >
        <p className="text-sm text-muted-foreground">
          Round {round} of {TOTAL_ROUNDS}
        </p>
      </div>

      {/* Clock face */}
      <div className="flex justify-center mb-4">
        <motion.div
          key={`${round}-${currentTime.hour}-${currentTime.minute}`}
          initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: shouldReduceMotion ? 0 : 0.3 }}
          aria-label={`Clock showing ${formatTime(currentTime.hour, currentTime.minute)}`}
        >
          <ClockFace hour={currentTime.hour} minute={currentTime.minute} size={200} />
        </motion.div>
      </div>

      {/* Question prompt */}
      <p className="text-center text-sm text-muted-foreground mb-4">
        What time does the clock show?
      </p>

      {/* Feedback announcement for screen readers */}
      <div aria-live="assertive" className="sr-only">
        {feedback === 'correct' && `Correct! The time is ${formatTime(currentTime.hour, currentTime.minute)}.`}
        {feedback === 'incorrect' && `Incorrect. The correct time is ${formatTime(currentTime.hour, currentTime.minute)}.`}
      </div>

      {/* 4 choice buttons in 2x2 grid */}
      <div className="grid grid-cols-2 gap-3 max-w-[300px] mx-auto mb-4">
        {choices.map((choice, index) => {
          const isSelected = selectedIndex === index;
          const isCorrectChoice = index === correctIndex;
          const showGreen = feedback !== 'none' && isCorrectChoice;
          const showRed = feedback === 'incorrect' && isSelected && !isCorrectChoice;

          let borderClass = 'border border-border';
          if (showGreen) borderClass = 'border-2 border-green-500 ring-2 ring-green-500/30';
          else if (showRed) borderClass = 'border-2 border-red-500 ring-2 ring-red-500/30';

          let bgClass = 'bg-card';
          if (showGreen) bgClass = 'bg-green-500/10';
          else if (showRed) bgClass = 'bg-red-500/10';

          return (
            <motion.button
              key={index}
              onClick={() => handleChoice(index)}
              disabled={feedback !== 'none' || gameComplete}
              className={`
                min-h-[44px] py-3 px-4 rounded-xl text-lg font-semibold
                transition-shadow focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus:outline-none
                ${borderClass} ${bgClass}
                ${feedback === 'none' && !gameComplete ? 'hover:shadow-md cursor-pointer' : ''}
              `}
              aria-label={`${formatTime(choice.hour, choice.minute)}`}
              whileTap={feedback === 'none' && !gameComplete ? { scale: 0.95 } : undefined}
              animate={
                shouldReduceMotion
                  ? {}
                  : showGreen
                    ? { scale: [1, 1.05, 1] }
                    : {}
              }
              transition={{ duration: shouldReduceMotion ? 0 : 0.3 }}
            >
              {formatTime(choice.hour, choice.minute)}
            </motion.button>
          );
        })}
      </div>

      {/* Back button */}
      <div className="text-center">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="text-muted-foreground"
        >
          Back to Games
        </Button>
      </div>

      {/* Results Dialog */}
      <Dialog open={gameComplete} onOpenChange={(open) => { if (!open) resetGame(); }}>
        <DialogContent className="max-w-sm" aria-describedby="completion-description">
          <DialogHeader>
            <DialogTitle className="text-center text-xl">Game Complete!</DialogTitle>
            <DialogDescription id="completion-description" className="text-center">
              {getEncouragementMessage(accuracy)}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 text-center py-2">
            <p className="text-lg font-semibold">
              {correctCount}/{TOTAL_ROUNDS} correct ({accuracy}%)
            </p>
          </div>

          <DialogFooter className="flex flex-col gap-2 sm:flex-col">
            <Button onClick={() => resetGame()} className="w-full min-h-[44px]">
              Play Again
            </Button>
            <Button
              variant="outline"
              onClick={onBack}
              className="w-full min-h-[44px]"
            >
              Back
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
