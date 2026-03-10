// EstimateItGame - Arithmetic estimation brain game
// Pick the closest estimate from 4 choices for arithmetic expressions

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

// --- Constants ---

const TOTAL_ROUNDS = 15;
const TIME_LIMIT_MS = 8000;
const FEEDBACK_DISPLAY_MS = 1200;
const POINTS_CORRECT = 100;
const POINTS_BONUS_FAST = 50; // bonus if answered within 3 seconds

// Distractor offset multipliers (away from correct answer)
const DISTRACTOR_OFFSETS = [0.15, 0.30, 0.50];

// --- Types ---

interface EstimateItGameProps {
  onBack: () => void;
}

type FeedbackState = 'none' | 'correct' | 'incorrect' | 'timeout';

interface Question {
  expression: string;
  correctAnswer: number;
  choices: number[];
  correctIndex: number;
  difficulty: GameDifficulty;
}

// --- Question generation ---

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getDifficultyForRound(round: number): GameDifficulty {
  if (round <= 5) return 'easy';
  if (round <= 10) return 'medium';
  return 'hard';
}

function generateQuestion(round: number): Question {
  const difficulty = getDifficultyForRound(round);
  let a: number;
  let b: number;
  let expression: string;
  let correctAnswer: number;

  switch (difficulty) {
    case 'easy': {
      // Addition of 2-digit numbers (10-50)
      a = randomInt(10, 50);
      b = randomInt(10, 50);
      expression = `${a} + ${b}`;
      correctAnswer = a + b;
      break;
    }
    case 'medium': {
      // Addition or subtraction with numbers 20-100
      const useSubtraction = Math.random() < 0.5;
      if (useSubtraction) {
        a = randomInt(40, 100);
        b = randomInt(20, a - 1); // ensure positive result
        expression = `${a} − ${b}`;
        correctAnswer = a - b;
      } else {
        a = randomInt(20, 100);
        b = randomInt(20, 100);
        expression = `${a} + ${b}`;
        correctAnswer = a + b;
      }
      break;
    }
    case 'hard': {
      // Multiplication (e.g. 23 x 7)
      a = randomInt(12, 49);
      b = randomInt(3, 9);
      expression = `${a} × ${b}`;
      correctAnswer = a * b;
      break;
    }
  }

  // Generate distractors at ±15%, ±30%, ±50% offsets
  // Randomly pick direction (above or below) for each offset
  const distractors: number[] = [];
  const usedValues = new Set<number>();
  usedValues.add(correctAnswer);

  for (const offset of DISTRACTOR_OFFSETS) {
    const direction = Math.random() < 0.5 ? 1 : -1;
    let distractor = Math.round(correctAnswer * (1 + direction * offset));

    // Ensure no duplicates and distractor is positive
    if (usedValues.has(distractor) || distractor <= 0) {
      distractor = Math.round(correctAnswer * (1 - direction * offset));
    }
    // Final fallback: shift slightly if still duplicate
    while (usedValues.has(distractor) || distractor <= 0) {
      distractor += direction * Math.max(1, Math.round(correctAnswer * 0.05));
    }

    usedValues.add(distractor);
    distractors.push(distractor);
  }

  // Combine and shuffle choices
  const allChoices = [correctAnswer, ...distractors];
  const shuffled = allChoices
    .map((value, i) => ({ value, sort: Math.random(), origIdx: i }))
    .sort((a, b) => a.sort - b.sort);

  const choices = shuffled.map(item => item.value);
  const correctIndex = choices.indexOf(correctAnswer);

  return { expression, correctAnswer, choices, correctIndex, difficulty };
}

function getEncouragementMessage(accuracy: number): string {
  if (accuracy >= 90) return 'Outstanding estimation skills!';
  if (accuracy >= 70) return 'Great number sense!';
  if (accuracy >= 50) return 'Good work! Your estimation is improving!';
  return 'Keep practising - estimation gets easier with time!';
}

// --- Component ---

export default function EstimateItGame({ onBack }: EstimateItGameProps) {
  const shouldReduceMotion = useReducedMotion();

  // Game state
  const [round, setRound] = useState(1);
  const [question, setQuestion] = useState<Question>(() => generateQuestion(1));
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [feedback, setFeedback] = useState<FeedbackState>('none');
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [gameComplete, setGameComplete] = useState(false);
  const [responseTimes, setResponseTimes] = useState<number[]>([]);

  // Timer state
  const [timeRemaining, setTimeRemaining] = useState(TIME_LIMIT_MS);
  const questionStartTime = useRef(Date.now());

  // Timer visibility (persisted preference)
  const [timerVisible] = useState(() => {
    return localStorage.getItem(STORAGE_KEYS.GAME_TIMER_VISIBLE) !== 'false';
  });

  // Refs for stable callbacks
  const roundRef = useRef(round);
  roundRef.current = round;
  const feedbackRef = useRef(feedback);
  feedbackRef.current = feedback;

  // Auto-advance and timer cleanup refs
  const autoAdvanceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (autoAdvanceTimeoutRef.current !== null) clearTimeout(autoAdvanceTimeoutRef.current);
      if (timerIntervalRef.current !== null) clearInterval(timerIntervalRef.current);
    };
  }, []);

  // Advance to next question or complete game
  const advanceQuestion = useCallback(() => {
    if (roundRef.current >= TOTAL_ROUNDS) {
      setGameComplete(true);
      setFeedback('none');
    } else {
      const nextRound = roundRef.current + 1;
      setRound(nextRound);
      setQuestion(generateQuestion(nextRound));
      setFeedback('none');
      setSelectedIndex(null);
      setTimeRemaining(TIME_LIMIT_MS);
    }
  }, []);

  // Handle timeout
  const handleTimeExpired = useCallback(() => {
    if (feedbackRef.current !== 'none') return;

    setResponseTimes(prev => [...prev, TIME_LIMIT_MS]);
    setFeedback('timeout');
    setSelectedIndex(null);

    autoAdvanceTimeoutRef.current = setTimeout(() => {
      autoAdvanceTimeoutRef.current = null;
      advanceQuestion();
    }, FEEDBACK_DISPLAY_MS);
  }, [advanceQuestion]);

  // Countdown timer per question
  useEffect(() => {
    if (feedback !== 'none' || gameComplete) return;

    questionStartTime.current = Date.now();
    setTimeRemaining(TIME_LIMIT_MS);

    timerIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - questionStartTime.current;
      const remaining = Math.max(0, TIME_LIMIT_MS - elapsed);
      setTimeRemaining(remaining);

      if (remaining <= 0) {
        if (timerIntervalRef.current !== null) clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
        handleTimeExpired();
      }
    }, 50);

    return () => {
      if (timerIntervalRef.current !== null) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    };
  }, [round, feedback, gameComplete, handleTimeExpired]);

  // Handle choice selection
  const handleChoice = useCallback(
    (choiceIndex: number) => {
      if (feedback !== 'none' || gameComplete) return;

      // Stop the countdown timer
      if (timerIntervalRef.current !== null) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }

      const responseTime = Date.now() - questionStartTime.current;
      setSelectedIndex(choiceIndex);
      setResponseTimes(prev => [...prev, responseTime]);

      const isCorrect = choiceIndex === question.correctIndex;

      if (isCorrect) {
        const bonus = responseTime < 3000 ? POINTS_BONUS_FAST : 0;
        setScore(prev => prev + POINTS_CORRECT + bonus);
        setCorrectCount(prev => prev + 1);
        setFeedback('correct');
      } else {
        setFeedback('incorrect');
      }

      autoAdvanceTimeoutRef.current = setTimeout(() => {
        autoAdvanceTimeoutRef.current = null;
        advanceQuestion();
      }, FEEDBACK_DISPLAY_MS);
    },
    [feedback, gameComplete, question.correctIndex, advanceQuestion],
  );

  // Save result to drill_results on game completion
  useEffect(() => {
    if (!gameComplete) return;

    const accuracy = Math.round((correctCount / TOTAL_ROUNDS) * 100);
    const avgResponseTime =
      responseTimes.length > 0
        ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length)
        : 0;

    // Save to drill_results
    db.drill_results
      .add({
        sessionId: 0,
        timestamp: new Date().toISOString(),
        module: 'estimation',
        difficulty: getDifficultyForRound(TOTAL_ROUNDS),
        isCorrect: accuracy >= 50,
        timeToAnswer: avgResponseTime,
        accuracy,
      })
      .catch(err => console.error('Failed to save drill result:', err));

    // Also log telemetry
    db.telemetry_logs
      .add({
        timestamp: new Date().toISOString(),
        event: 'cognition_game_complete',
        module: 'estimation',
        data: {
          score,
          correctCount,
          totalRounds: TOTAL_ROUNDS,
          accuracy,
          avgResponseTime,
        },
        userId: 'local_user',
      })
      .catch(err => console.error('Failed to log telemetry:', err));
  }, [gameComplete, correctCount, responseTimes, score]);

  // Reset game
  const resetGame = useCallback(() => {
    if (autoAdvanceTimeoutRef.current !== null) {
      clearTimeout(autoAdvanceTimeoutRef.current);
      autoAdvanceTimeoutRef.current = null;
    }
    if (timerIntervalRef.current !== null) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    setRound(1);
    setQuestion(generateQuestion(1));
    setScore(0);
    setCorrectCount(0);
    setFeedback('none');
    setSelectedIndex(null);
    setGameComplete(false);
    setResponseTimes([]);
    setTimeRemaining(TIME_LIMIT_MS);
  }, []);

  // Computed values
  const timerFraction = timeRemaining / TIME_LIMIT_MS;
  const timerColorClass =
    timerFraction > 0.5
      ? 'bg-green-500'
      : timerFraction > 0.25
        ? 'bg-yellow-500'
        : 'bg-red-500';

  const accuracy = TOTAL_ROUNDS > 0
    ? Math.round((correctCount / TOTAL_ROUNDS) * 100)
    : 0;
  const avgResponseTime =
    responseTimes.length > 0
      ? (responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length / 1000).toFixed(1)
      : '0.0';

  return (
    <div className="max-w-md mx-auto px-4 py-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <Button
          variant="ghost"
          onClick={onBack}
          className="min-h-[44px]"
        >
          &larr; Back
        </Button>
        <h1 className="text-lg font-bold">Estimate It</h1>
        <div className="w-[60px]" /> {/* Spacer for alignment */}
      </div>

      {/* Stats bar */}
      <div className="flex items-center justify-between mb-3 text-sm" aria-live="polite">
        <span className="font-semibold">
          Round {Math.min(round, TOTAL_ROUNDS)}/{TOTAL_ROUNDS}
        </span>
        <span className="text-muted-foreground capitalize">
          {getDifficultyForRound(round)}
        </span>
        <span className="font-semibold">
          Score: {score}
        </span>
      </div>

      {/* Timer bar */}
      {!gameComplete && (
        <div
          className="w-full h-2 bg-muted rounded-full overflow-hidden mb-6"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={TIME_LIMIT_MS}
          aria-valuenow={Math.round(timeRemaining)}
          aria-label={`${(timeRemaining / 1000).toFixed(1)} seconds remaining`}
        >
          <motion.div
            className={`h-full rounded-full ${timerColorClass}`}
            initial={false}
            animate={{ width: `${timerFraction * 100}%` }}
            transition={{
              duration: shouldReduceMotion ? 0 : 0.1,
              ease: 'linear',
            }}
          />
        </div>
      )}

      {/* Timer text (optional visibility) */}
      {timerVisible && !gameComplete && feedback === 'none' && (
        <p className="text-center text-xs text-muted-foreground mb-2 font-mono tabular-nums">
          {(timeRemaining / 1000).toFixed(1)}s
        </p>
      )}

      {/* Expression */}
      <div className="text-center mb-8">
        <motion.p
          key={round}
          className="text-4xl sm:text-5xl font-bold tracking-wide"
          initial={shouldReduceMotion ? {} : { opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: shouldReduceMotion ? 0 : 0.3 }}
          aria-label={`Estimate: ${question.expression}`}
        >
          {question.expression}
        </motion.p>
        <p className="text-sm text-muted-foreground mt-2">
          Pick the closest estimate
        </p>
      </div>

      {/* Choice buttons - 2x2 grid */}
      <div
        className="grid grid-cols-2 gap-3 max-w-[320px] mx-auto mb-6"
        role="group"
        aria-label="Estimation choices"
      >
        {question.choices.map((choice, index) => {
          const isSelected = selectedIndex === index;
          const isCorrectChoice = index === question.correctIndex;
          const showCorrectHighlight = feedback !== 'none' && isCorrectChoice;
          const showIncorrectHighlight =
            (feedback === 'incorrect' || feedback === 'timeout') && isSelected && !isCorrectChoice;

          let borderClass = 'border border-border';
          if (showCorrectHighlight) {
            borderClass = 'border-2 border-green-500 ring-2 ring-green-500/30';
          } else if (showIncorrectHighlight) {
            borderClass = 'border-2 border-red-500 ring-2 ring-red-500/30';
          }

          // On timeout with no selection, still highlight correct
          const showTimeoutCorrect = feedback === 'timeout' && isCorrectChoice;

          return (
            <motion.button
              key={`${round}-${index}`}
              onClick={() => handleChoice(index)}
              disabled={feedback !== 'none' || gameComplete}
              className={`
                min-h-[56px] py-3 px-4 rounded-xl text-xl font-semibold
                bg-card shadow-sm transition-shadow
                focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus:outline-none
                ${borderClass}
                ${feedback === 'none' && !gameComplete ? 'hover:shadow-md cursor-pointer active:scale-95' : ''}
              `}
              aria-label={`Choice: ${choice}`}
              animate={
                shouldReduceMotion
                  ? {}
                  : showCorrectHighlight || showTimeoutCorrect
                    ? { scale: [1, 1.05, 1] }
                    : {}
              }
              transition={{ duration: shouldReduceMotion ? 0 : 0.3 }}
            >
              {choice}
            </motion.button>
          );
        })}
      </div>

      {/* Feedback announcement for screen readers */}
      <div aria-live="assertive" className="sr-only">
        {feedback === 'correct' &&
          `Correct! The answer was ${question.correctAnswer}. Round ${round} of ${TOTAL_ROUNDS}.`}
        {feedback === 'incorrect' &&
          `Incorrect. The correct answer was ${question.correctAnswer}. Round ${round} of ${TOTAL_ROUNDS}.`}
        {feedback === 'timeout' &&
          `Time's up! The correct answer was ${question.correctAnswer}. Round ${round} of ${TOTAL_ROUNDS}.`}
      </div>

      {/* Feedback text */}
      {feedback !== 'none' && !gameComplete && (
        <motion.p
          className={`text-center text-sm font-semibold mb-2 ${
            feedback === 'correct'
              ? 'text-green-500'
              : 'text-red-500'
          }`}
          initial={shouldReduceMotion ? {} : { opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: shouldReduceMotion ? 0 : 0.2 }}
        >
          {feedback === 'correct' && 'Correct!'}
          {feedback === 'incorrect' && `Not quite — answer was ${question.correctAnswer}`}
          {feedback === 'timeout' && `Time's up! Answer was ${question.correctAnswer}`}
        </motion.p>
      )}

      {/* Completion dialog */}
      <Dialog open={gameComplete} onOpenChange={() => {}}>
        <DialogContent
          onPointerDownOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
          className="max-w-sm"
          aria-describedby="completion-description"
        >
          <DialogHeader>
            <DialogTitle className="text-center text-xl">Game Complete!</DialogTitle>
            <DialogDescription id="completion-description" className="text-center">
              {getEncouragementMessage(accuracy)}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 text-center py-4">
            <p className="text-2xl font-bold">{score} points</p>
            <p className="text-lg font-semibold">
              {correctCount}/{TOTAL_ROUNDS} correct ({accuracy}%)
            </p>
            <p className="text-sm text-muted-foreground">
              Avg response time: {avgResponseTime}s
            </p>
          </div>

          <DialogFooter className="flex flex-col gap-2 sm:flex-col">
            <Button onClick={resetGame} className="w-full min-h-[44px]">
              Play Again
            </Button>
            <Button
              variant="outline"
              onClick={onBack}
              className="w-full min-h-[44px]"
            >
              Back to Games
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
