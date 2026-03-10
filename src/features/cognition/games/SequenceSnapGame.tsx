// SequenceSnapGame - Number sequence pattern recognition game
// Identify the missing number in a sequence with progressive difficulty

import { useState, useCallback, useRef, useEffect } from 'react';
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
import type { GameDifficulty } from '../types';

// --- Constants ---

const TOTAL_ROUNDS = 15;
const FEEDBACK_DELAY_MS = 1000;
const NUM_CHOICES = 4;

// --- Sequence generation utilities ---

interface SequenceQuestion {
  /** The full sequence with the missing value filled in */
  sequence: number[];
  /** Index of the missing number in the sequence */
  missingIndex: number;
  /** The correct answer (the missing number) */
  correctAnswer: number;
  /** 4 multiple-choice options (includes correctAnswer) */
  choices: number[];
}

/** Difficulty tiers based on round number (1-indexed) */
function getDifficultyForRound(round: number): GameDifficulty {
  if (round <= 5) return 'easy';
  if (round <= 10) return 'medium';
  return 'hard';
}

/** Generate a random integer in [min, max] */
function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/** Pick a random element from an array */
function pickRandom<T>(arr: readonly T[]): T {
  return arr[randInt(0, arr.length - 1)];
}

/** Shuffle array in-place (Fisher-Yates) and return it */
function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = randInt(0, i);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Generate a sequence question for the given difficulty.
 *
 * Easy:   count by 1 or 2, start 1-10, 5 terms
 * Medium: count by 3, 5, or 10, start 1-20, 5 terms
 * Hard:   count by 4, 6, or 7 (or mixed +/- within a range), start 1-30, 5-6 terms
 */
function generateSequenceQuestion(difficulty: GameDifficulty): SequenceQuestion {
  let step: number;
  let start: number;
  let length: number;

  switch (difficulty) {
    case 'easy':
      step = pickRandom([1, 2]);
      start = randInt(1, 10);
      length = 5;
      break;
    case 'medium':
      step = pickRandom([3, 5, 10]);
      start = randInt(1, 20);
      length = 5;
      break;
    case 'hard':
      step = pickRandom([4, 6, 7]);
      start = randInt(1, 30);
      length = pickRandom([5, 6]);
      break;
  }

  // Build the full sequence
  const sequence: number[] = [];
  for (let i = 0; i < length; i++) {
    sequence.push(start + step * i);
  }

  // Pick which index to hide (avoid first and last for easier context)
  const missingIndex = randInt(1, length - 2);
  const correctAnswer = sequence[missingIndex];

  // Generate distractors
  const distractors = new Set<number>();
  // Common off-by-one and off-by-step distractors
  const candidates = [
    correctAnswer + step,
    correctAnswer - step,
    correctAnswer + 1,
    correctAnswer - 1,
    correctAnswer + 2,
    correctAnswer - 2,
    correctAnswer + step * 2,
  ];

  for (const c of candidates) {
    if (c !== correctAnswer && c >= 0 && distractors.size < NUM_CHOICES - 1) {
      distractors.add(c);
    }
  }

  // Fill remaining distractors with random offsets if needed
  while (distractors.size < NUM_CHOICES - 1) {
    const offset = randInt(1, step * 3);
    const sign = Math.random() < 0.5 ? 1 : -1;
    const candidate = correctAnswer + offset * sign;
    if (candidate !== correctAnswer && candidate >= 0) {
      distractors.add(candidate);
    }
  }

  const choices = shuffle([correctAnswer, ...Array.from(distractors).slice(0, NUM_CHOICES - 1)]);

  return { sequence, missingIndex, correctAnswer, choices };
}

/** Return an encouragement message based on accuracy */
function getEncouragementMessage(accuracy: number): string {
  if (accuracy >= 90) return 'Outstanding! You have excellent pattern recognition!';
  if (accuracy >= 70) return 'Great job! You are getting the hang of number sequences!';
  if (accuracy >= 50) return 'Good effort! Keep practising to sharpen your skills.';
  return 'Nice try! Number sequences get easier with practice.';
}

// --- Component ---

interface SequenceSnapGameProps {
  onBack: () => void;
}

type FeedbackState = 'none' | 'correct' | 'incorrect';

export default function SequenceSnapGame({ onBack }: SequenceSnapGameProps) {
  const shouldReduceMotion = useReducedMotion();

  // Game state
  const [round, setRound] = useState(1);
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [question, setQuestion] = useState<SequenceQuestion>(() =>
    generateSequenceQuestion(getDifficultyForRound(1)),
  );
  const [feedback, setFeedback] = useState<FeedbackState>('none');
  const [selectedChoice, setSelectedChoice] = useState<number | null>(null);
  const [gameComplete, setGameComplete] = useState(false);
  const [feedbackAnnouncement, setFeedbackAnnouncement] = useState('');

  // Duration tracking
  const startTimeRef = useRef<number>(Date.now());
  const [duration, setDuration] = useState(0);

  // Timeout cleanup ref
  const autoAdvanceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (autoAdvanceTimeoutRef.current !== null) {
        clearTimeout(autoAdvanceTimeoutRef.current);
      }
    };
  }, []);

  // Advance to next round or end game (stable via refs)
  const roundRef = useRef(round);
  roundRef.current = round;

  const advanceRound = useCallback(() => {
    if (roundRef.current >= TOTAL_ROUNDS) {
      setDuration(Date.now() - startTimeRef.current);
      setGameComplete(true);
      setFeedback('none');
    } else {
      const nextRound = roundRef.current + 1;
      setRound(nextRound);
      setQuestion(generateSequenceQuestion(getDifficultyForRound(nextRound)));
      setFeedback('none');
      setSelectedChoice(null);
      setFeedbackAnnouncement('');
    }
  }, []);

  // Handle choice selection
  const handleChoice = useCallback(
    (choice: number) => {
      if (feedback !== 'none' || gameComplete) return;

      setSelectedChoice(choice);
      const isCorrect = choice === question.correctAnswer;

      if (isCorrect) {
        setCorrectCount(prev => prev + 1);
        setScore(prev => prev + 10);
        setFeedback('correct');
        setFeedbackAnnouncement(`Correct! Round ${round} of ${TOTAL_ROUNDS}.`);
      } else {
        setFeedback('incorrect');
        setFeedbackAnnouncement(
          `Incorrect. The correct answer was ${question.correctAnswer}. Round ${round} of ${TOTAL_ROUNDS}.`,
        );
      }

      // Auto-advance after feedback delay
      autoAdvanceTimeoutRef.current = setTimeout(() => {
        autoAdvanceTimeoutRef.current = null;
        advanceRound();
      }, FEEDBACK_DELAY_MS);
    },
    [feedback, gameComplete, question, round, advanceRound],
  );

  // Log results on game completion
  useEffect(() => {
    if (!gameComplete) return;

    const accuracy = Math.round((correctCount / TOTAL_ROUNDS) * 100);

    // Save to drill_results with module 'sequencing'
    db.drill_results
      .add({
        sessionId: 0,
        timestamp: new Date().toISOString(),
        module: 'sequencing',
        difficulty: getDifficultyForRound(TOTAL_ROUNDS),
        isCorrect: accuracy >= 70,
        timeToAnswer: duration,
        accuracy,
      })
      .catch(err => console.error('Failed to save drill result:', err));

    // Also log telemetry
    db.telemetry_logs
      .add({
        timestamp: new Date().toISOString(),
        event: 'cognition_game_complete',
        module: 'sequence_snap',
        data: {
          score,
          correctCount,
          totalRounds: TOTAL_ROUNDS,
          accuracy,
          duration,
        },
        userId: 'local_user',
      })
      .catch(err => console.error('Failed to log telemetry:', err));
  }, [gameComplete, correctCount, score, duration]);

  // Reset game
  const resetGame = useCallback(() => {
    if (autoAdvanceTimeoutRef.current !== null) {
      clearTimeout(autoAdvanceTimeoutRef.current);
      autoAdvanceTimeoutRef.current = null;
    }
    setRound(1);
    setScore(0);
    setCorrectCount(0);
    setQuestion(generateSequenceQuestion(getDifficultyForRound(1)));
    setFeedback('none');
    setSelectedChoice(null);
    setGameComplete(false);
    setFeedbackAnnouncement('');
    setDuration(0);
    startTimeRef.current = Date.now();
  }, []);

  // Compute display values
  const accuracy = TOTAL_ROUNDS > 0 ? Math.round((correctCount / TOTAL_ROUNDS) * 100) : 0;
  const currentDifficulty = getDifficultyForRound(round);

  // Render the sequence display with missing number as "?"
  const renderSequence = () => {
    return question.sequence.map((num, idx) => {
      const isMissing = idx === question.missingIndex;
      const showCorrectAfterWrong =
        feedback === 'incorrect' && isMissing;

      return (
        <motion.span
          key={idx}
          className={`
            inline-flex items-center justify-center
            min-w-[48px] h-[48px] rounded-lg text-lg font-bold
            ${isMissing && feedback === 'none' ? 'bg-primary/20 text-primary border-2 border-primary border-dashed' : ''}
            ${isMissing && feedback === 'correct' ? 'bg-green-500/20 text-green-600 border-2 border-green-500' : ''}
            ${showCorrectAfterWrong ? 'bg-yellow-500/20 text-yellow-600 border-2 border-yellow-500' : ''}
            ${!isMissing ? 'bg-muted text-foreground border border-border' : ''}
          `}
          animate={
            shouldReduceMotion
              ? {}
              : isMissing && feedback !== 'none'
                ? { scale: [1, 1.1, 1] }
                : {}
          }
          transition={{ duration: shouldReduceMotion ? 0 : 0.3 }}
        >
          {isMissing
            ? feedback !== 'none'
              ? question.correctAnswer
              : '?'
            : num}
        </motion.span>
      );
    });
  };

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
        <h1 className="text-xl font-bold">Sequence Snap</h1>
        <div className="w-[72px]" /> {/* Spacer for alignment */}
      </div>

      {/* Stats bar */}
      <div className="flex items-center justify-between mb-4 text-sm" aria-live="polite">
        <span className="font-semibold">Round {round}/{TOTAL_ROUNDS}</span>
        <span
          className={`text-xs px-2 py-1 rounded-full capitalize ${
            currentDifficulty === 'easy'
              ? 'bg-green-500/20 text-green-600'
              : currentDifficulty === 'medium'
                ? 'bg-yellow-500/20 text-yellow-600'
                : 'bg-red-500/20 text-red-600'
          }`}
        >
          {currentDifficulty}
        </span>
        <span className="font-semibold">Score: {score}</span>
      </div>

      {/* Instruction */}
      <div className="text-center mb-4 text-sm text-muted-foreground min-h-[20px]">
        {feedback === 'none' && 'Find the missing number in the sequence'}
        {feedback === 'correct' && 'Correct!'}
        {feedback === 'incorrect' && `Not quite — the answer was ${question.correctAnswer}`}
      </div>

      {/* Sequence display */}
      <div className="flex items-center justify-center gap-2 flex-wrap mb-6" aria-label="Number sequence">
        {renderSequence()}
      </div>

      {/* Multiple-choice buttons */}
      <div className="grid grid-cols-2 gap-3 max-w-[280px] mx-auto mb-6">
        {question.choices.map((choice) => {
          const isSelected = selectedChoice === choice;
          const isCorrectChoice = choice === question.correctAnswer;
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
              key={choice}
              onClick={() => handleChoice(choice)}
              disabled={feedback !== 'none' || gameComplete}
              className={`
                min-h-[44px] rounded-xl flex items-center justify-center
                text-lg font-semibold shadow-sm transition-shadow
                focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus:outline-none
                ${borderClass} ${bgClass}
                ${feedback === 'none' && !gameComplete ? 'hover:shadow-md cursor-pointer' : ''}
              `}
              aria-label={`Choose ${choice}`}
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
              {choice}
            </motion.button>
          );
        })}
      </div>

      {/* Back button at bottom */}
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

      {/* Feedback announcement for screen readers */}
      <div aria-live="assertive" className="sr-only">
        {feedbackAnnouncement}
      </div>

      {/* Results dialog */}
      <Dialog open={gameComplete} onOpenChange={(open) => { if (!open) resetGame(); }}>
        <DialogContent className="max-w-sm" aria-describedby="results-description">
          <DialogHeader>
            <DialogTitle className="text-center text-xl">Game Complete!</DialogTitle>
            <DialogDescription id="results-description" className="text-center">
              {getEncouragementMessage(accuracy)}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 text-center py-2">
            <p className="text-lg font-semibold">
              Score: {score}
            </p>
            <p className="text-sm">
              <span className="font-semibold">Accuracy:</span>{' '}
              {correctCount}/{TOTAL_ROUNDS} ({accuracy}%)
            </p>
            <p className="text-sm text-muted-foreground">
              Rounds completed: {TOTAL_ROUNDS}
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
