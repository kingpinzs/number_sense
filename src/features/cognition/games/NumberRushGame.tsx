// NumberRushGame - Magnitude comparison brain game
// Tap the bigger number as fast as you can across 20 rounds

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

interface NumberRushGameProps {
  onBack: () => void;
}

const TOTAL_ROUNDS = 20;
const FEEDBACK_DELAY_MS = 500;
const POINTS_BASE = 100;
const SPEED_BONUS_THRESHOLD_MS = 2000;

type FeedbackState = 'none' | 'correct' | 'incorrect';

interface RoundPair {
  left: number;
  right: number;
}

/**
 * Generate a pair of distinct numbers for a given difficulty.
 * - Easy: 1-20, gap >= 5
 * - Medium: 1-100, gap >= 2
 * - Hard: 1-1000, gap of 1-5 (very close)
 */
function generatePair(difficulty: GameDifficulty): RoundPair {
  let left: number;
  let right: number;

  switch (difficulty) {
    case 'easy': {
      const max = 20;
      const minGap = 5;
      left = Math.floor(Math.random() * max) + 1;
      const offset = Math.floor(Math.random() * (max - minGap)) + minGap;
      right = left + (Math.random() < 0.5 ? offset : -offset);
      // Clamp to range
      if (right < 1) right = left + offset;
      if (right > max) right = left - offset;
      if (right < 1) right = 1;
      break;
    }
    case 'medium': {
      const max = 100;
      const minGap = 2;
      const maxGap = 15;
      left = Math.floor(Math.random() * max) + 1;
      const gap = Math.floor(Math.random() * (maxGap - minGap + 1)) + minGap;
      right = left + (Math.random() < 0.5 ? gap : -gap);
      if (right < 1) right = left + gap;
      if (right > max) right = left - gap;
      if (right < 1) right = 1;
      break;
    }
    case 'hard': {
      const max = 1000;
      const minGap = 1;
      const maxGap = 5;
      left = Math.floor(Math.random() * max) + 1;
      const gap = Math.floor(Math.random() * (maxGap - minGap + 1)) + minGap;
      right = left + (Math.random() < 0.5 ? gap : -gap);
      if (right < 1) right = left + gap;
      if (right > max) right = left - gap;
      if (right < 1) right = 1;
      break;
    }
  }

  // Ensure they are never equal
  if (left === right) {
    right = left < 20 ? left + 1 : left - 1;
  }

  return { left, right };
}

function getEncouragementMessage(accuracy: number): string {
  if (accuracy >= 95) return 'Outstanding reflexes!';
  if (accuracy >= 80) return 'Great number sense!';
  if (accuracy >= 60) return 'Good effort, keep practising!';
  return 'Keep at it — you will improve!';
}

export default function NumberRushGame({ onBack }: NumberRushGameProps) {
  const shouldReduceMotion = useReducedMotion();

  // Game settings
  const [difficulty, setDifficulty] = useState<GameDifficulty>('medium');

  // Game state
  const [round, setRound] = useState(1);
  const [pair, setPair] = useState<RoundPair>(() => generatePair('medium'));
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [responseTimes, setResponseTimes] = useState<number[]>([]);
  const [feedback, setFeedback] = useState<FeedbackState>('none');
  const [selectedSide, setSelectedSide] = useState<'left' | 'right' | null>(null);
  const [gameComplete, setGameComplete] = useState(false);

  // Timing
  const roundStartTime = useRef(Date.now());
  const gameStartTime = useRef(Date.now());
  const feedbackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Refs for stable callbacks
  const roundRef = useRef(round);
  roundRef.current = round;
  const difficultyRef = useRef(difficulty);
  difficultyRef.current = difficulty;

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (feedbackTimeoutRef.current !== null) {
        clearTimeout(feedbackTimeoutRef.current);
      }
    };
  }, []);

  // Reset round start time when round changes (and feedback clears)
  useEffect(() => {
    if (feedback === 'none' && !gameComplete) {
      roundStartTime.current = Date.now();
    }
  }, [round, feedback, gameComplete]);

  // Advance to next round or complete the game
  const advanceRound = useCallback(() => {
    if (roundRef.current >= TOTAL_ROUNDS) {
      setGameComplete(true);
      setFeedback('none');
    } else {
      setRound(prev => prev + 1);
      setPair(generatePair(difficultyRef.current));
      setFeedback('none');
      setSelectedSide(null);
    }
  }, []);

  // Handle user tap on a number
  const handleChoice = useCallback((side: 'left' | 'right') => {
    if (feedback !== 'none' || gameComplete) return;

    const responseTime = Date.now() - roundStartTime.current;
    const chosenValue = side === 'left' ? pair.left : pair.right;
    const correctValue = Math.max(pair.left, pair.right);
    const isCorrect = chosenValue === correctValue;

    setSelectedSide(side);
    setResponseTimes(prev => [...prev, responseTime]);

    if (isCorrect) {
      setCorrectCount(prev => prev + 1);
      setFeedback('correct');
      // Calculate score with speed bonus
      const speedBonus = responseTime < SPEED_BONUS_THRESHOLD_MS
        ? Math.round((SPEED_BONUS_THRESHOLD_MS - responseTime) / 20)
        : 0;
      setScore(prev => prev + POINTS_BASE + speedBonus);
    } else {
      setFeedback('incorrect');
    }

    // Auto-advance after feedback
    feedbackTimeoutRef.current = setTimeout(() => {
      feedbackTimeoutRef.current = null;
      advanceRound();
    }, FEEDBACK_DELAY_MS);
  }, [feedback, gameComplete, pair, advanceRound]);

  // Log results on game completion
  useEffect(() => {
    if (!gameComplete) return;

    const totalDuration = Date.now() - gameStartTime.current;
    const accuracy = Math.round((correctCount / TOTAL_ROUNDS) * 100);
    const avgResponseTime = responseTimes.length > 0
      ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length)
      : 0;

    // Track last used module
    localStorage.setItem(STORAGE_KEYS.LAST_USED_MODULE, 'magnitude_comparison');

    // Save to drill_results
    db.drill_results.add({
      sessionId: 0,
      timestamp: new Date().toISOString(),
      module: 'magnitude_comparison',
      difficulty,
      isCorrect: accuracy >= 50,
      timeToAnswer: avgResponseTime,
      accuracy,
    }).catch(err => console.error('Failed to save drill result:', err));

    // Log telemetry
    db.telemetry_logs.add({
      timestamp: new Date().toISOString(),
      event: 'cognition_game_complete',
      module: 'magnitude_comparison',
      data: {
        difficulty,
        score,
        correctCount,
        totalRounds: TOTAL_ROUNDS,
        accuracy,
        avgResponseTime,
        duration: totalDuration,
      },
      userId: 'local_user',
    }).catch(err => console.error('Failed to log telemetry:', err));
  }, [gameComplete, correctCount, responseTimes, difficulty, score]);

  // Reset game
  const resetGame = useCallback((newDifficulty?: GameDifficulty) => {
    const diff = newDifficulty ?? difficulty;
    if (feedbackTimeoutRef.current !== null) {
      clearTimeout(feedbackTimeoutRef.current);
      feedbackTimeoutRef.current = null;
    }
    setDifficulty(diff);
    setRound(1);
    setPair(generatePair(diff));
    setScore(0);
    setCorrectCount(0);
    setResponseTimes([]);
    setFeedback('none');
    setSelectedSide(null);
    setGameComplete(false);
    gameStartTime.current = Date.now();
    roundStartTime.current = Date.now();
  }, [difficulty]);

  // Handle difficulty change
  const handleDifficultyChange = useCallback((newDifficulty: GameDifficulty) => {
    if (newDifficulty !== difficulty) {
      resetGame(newDifficulty);
    }
  }, [difficulty, resetGame]);

  // Computed stats
  const accuracy = TOTAL_ROUNDS > 0 ? Math.round((correctCount / TOTAL_ROUNDS) * 100) : 0;
  const avgResponseTime = responseTimes.length > 0
    ? (responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length / 1000).toFixed(1)
    : '0.0';

  // Progress bar percentage
  const progressPercent = Math.round(((round - 1) / TOTAL_ROUNDS) * 100);

  // Determine card border colors during feedback
  const getCardBorder = (side: 'left' | 'right'): string => {
    if (feedback === 'none') return 'border-2 border-border';
    if (selectedSide !== side) {
      // Not selected side — show green if it was the correct answer
      const value = side === 'left' ? pair.left : pair.right;
      if (value === Math.max(pair.left, pair.right) && feedback === 'incorrect') {
        return 'border-2 border-green-500 ring-2 ring-green-500/30';
      }
      return 'border-2 border-border';
    }
    // Selected side
    if (feedback === 'correct') return 'border-2 border-green-500 ring-2 ring-green-500/30';
    return 'border-2 border-red-500 ring-2 ring-red-500/30';
  };

  const getCardBg = (side: 'left' | 'right'): string => {
    if (feedback === 'none') return 'bg-card';
    if (selectedSide !== side) {
      const value = side === 'left' ? pair.left : pair.right;
      if (value === Math.max(pair.left, pair.right) && feedback === 'incorrect') {
        return 'bg-green-500/10';
      }
      return 'bg-card';
    }
    if (feedback === 'correct') return 'bg-green-500/10';
    return 'bg-red-500/10';
  };

  return (
    <div className="max-w-md mx-auto px-4 py-4">
      {/* Header: difficulty selector */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex gap-1">
          {(['easy', 'medium', 'hard'] as const).map(d => (
            <button
              key={d}
              onClick={() => handleDifficultyChange(d)}
              className={`px-3 py-2 min-h-[44px] text-sm rounded-full capitalize transition-colors
                ${
                  d === difficulty
                    ? 'bg-[#E87461] text-white'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }
              `}
              aria-pressed={d === difficulty}
            >
              {d}
            </button>
          ))}
        </div>
        <span className="text-lg font-bold tabular-nums" aria-label={`Score: ${score}`}>
          {score}
        </span>
      </div>

      {/* Score bar with round counter */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-semibold" aria-live="polite">
            Round {round}/{TOTAL_ROUNDS}
          </span>
          <span className="text-xs text-muted-foreground">
            {correctCount} correct
          </span>
        </div>
        <div
          className="w-full h-2 bg-muted rounded-full overflow-hidden"
          role="progressbar"
          aria-valuenow={round - 1}
          aria-valuemin={0}
          aria-valuemax={TOTAL_ROUNDS}
          aria-label="Game progress"
        >
          <motion.div
            className="h-full bg-[#E87461] rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.3 }}
          />
        </div>
      </div>

      {/* Instruction */}
      <p className="text-center text-sm text-muted-foreground mb-6">
        Tap the bigger number!
      </p>

      {/* Number cards */}
      <div
        className="flex items-center justify-center gap-3 mb-6"
        role="group"
        aria-label="Choose the bigger number"
      >
        {/* Left number */}
        <motion.button
          onClick={() => handleChoice('left')}
          disabled={feedback !== 'none' || gameComplete}
          className={`
            flex-1 max-w-[140px] aspect-square rounded-2xl flex items-center justify-center
            shadow-sm transition-shadow
            focus-visible:ring-2 focus-visible:ring-[#E87461] focus-visible:ring-offset-2 focus:outline-none
            min-h-[44px]
            ${getCardBorder('left')}
            ${getCardBg('left')}
            ${feedback === 'none' && !gameComplete ? 'hover:shadow-md cursor-pointer active:scale-95' : ''}
          `}
          aria-label={`${pair.left}`}
          whileTap={feedback === 'none' && !gameComplete && !shouldReduceMotion ? { scale: 0.93 } : undefined}
          animate={
            shouldReduceMotion
              ? {}
              : feedback === 'correct' && selectedSide === 'left'
              ? { scale: [1, 1.05, 1] }
              : {}
          }
          transition={{ duration: shouldReduceMotion ? 0 : 0.3 }}
        >
          <span className="text-3xl sm:text-4xl font-bold tabular-nums">
            {pair.left}
          </span>
        </motion.button>

        {/* VS divider */}
        <span className="text-lg font-bold text-muted-foreground select-none" aria-hidden="true">
          vs
        </span>

        {/* Right number */}
        <motion.button
          onClick={() => handleChoice('right')}
          disabled={feedback !== 'none' || gameComplete}
          className={`
            flex-1 max-w-[140px] aspect-square rounded-2xl flex items-center justify-center
            shadow-sm transition-shadow
            focus-visible:ring-2 focus-visible:ring-[#E87461] focus-visible:ring-offset-2 focus:outline-none
            min-h-[44px]
            ${getCardBorder('right')}
            ${getCardBg('right')}
            ${feedback === 'none' && !gameComplete ? 'hover:shadow-md cursor-pointer active:scale-95' : ''}
          `}
          aria-label={`${pair.right}`}
          whileTap={feedback === 'none' && !gameComplete && !shouldReduceMotion ? { scale: 0.93 } : undefined}
          animate={
            shouldReduceMotion
              ? {}
              : feedback === 'correct' && selectedSide === 'right'
              ? { scale: [1, 1.05, 1] }
              : {}
          }
          transition={{ duration: shouldReduceMotion ? 0 : 0.3 }}
        >
          <span className="text-3xl sm:text-4xl font-bold tabular-nums">
            {pair.right}
          </span>
        </motion.button>
      </div>

      {/* Feedback announcement for screen readers */}
      <div aria-live="assertive" className="sr-only">
        {feedback === 'correct' && `Correct! Round ${round} of ${TOTAL_ROUNDS}.`}
        {feedback === 'incorrect' && `Incorrect. Round ${round} of ${TOTAL_ROUNDS}.`}
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

      {/* Results dialog */}
      <Dialog open={gameComplete} onOpenChange={(open) => { if (!open) resetGame(); }}>
        <DialogContent className="max-w-sm" aria-describedby="results-description">
          <DialogHeader>
            <DialogTitle className="text-center text-xl">Number Rush Complete!</DialogTitle>
            <DialogDescription id="results-description" className="text-center">
              {getEncouragementMessage(accuracy)}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 text-center py-2">
            <p className="text-2xl font-bold" style={{ color: '#E87461' }}>
              {score} pts
            </p>
            <p className="text-sm">
              <span className="font-semibold">Accuracy:</span>{' '}
              {correctCount}/{TOTAL_ROUNDS} ({accuracy}%)
            </p>
            <p className="text-sm text-muted-foreground">
              Avg response time: {avgResponseTime}s
            </p>
          </div>

          <DialogFooter className="flex flex-col gap-2 sm:flex-col">
            <Button
              onClick={() => resetGame()}
              className="w-full min-h-[44px]"
              style={{ backgroundColor: '#E87461' }}
            >
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
