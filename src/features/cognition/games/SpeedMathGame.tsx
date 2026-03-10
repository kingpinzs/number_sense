// SpeedMathGame - Timed arithmetic fact fluency brain game
// Answer as many math problems as possible in 60 seconds

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

interface SpeedMathGameProps {
  onBack: () => void;
}

type GamePhase = 'ready' | 'playing' | 'complete';
type FeedbackState = 'none' | 'correct' | 'incorrect';
type Operation = '+' | '-' | '\u00D7';

interface Problem {
  a: number;
  b: number;
  operation: Operation;
  answer: number;
  display: string;
}

const GAME_DURATION_MS = 60_000;
const FEEDBACK_DURATION_MS = 500;
const NUM_CHOICES = 4;

const DIFFICULTY_LABELS: Record<GameDifficulty, string> = {
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard',
};

const DIFFICULTY_DESCRIPTIONS: Record<GameDifficulty, string> = {
  easy: 'Addition, 1\u201310',
  medium: '+/\u2212, 1\u201320',
  hard: '+/\u2212/\u00D7, 1\u201312',
};

/** Generate a random integer in [min, max] inclusive */
function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/** Generate a math problem based on difficulty */
function generateProblem(difficulty: GameDifficulty): Problem {
  let a: number;
  let b: number;
  let operation: Operation;
  let answer: number;

  if (difficulty === 'easy') {
    // Addition only, operands 1-10
    operation = '+';
    a = randInt(1, 10);
    b = randInt(1, 10);
    answer = a + b;
  } else if (difficulty === 'medium') {
    // Addition and subtraction, operands 1-20
    const ops: Operation[] = ['+', '-'];
    operation = ops[randInt(0, ops.length - 1)];
    if (operation === '+') {
      a = randInt(1, 20);
      b = randInt(1, 20);
      answer = a + b;
    } else {
      // Ensure non-negative result
      a = randInt(2, 20);
      b = randInt(1, a);
      answer = a - b;
    }
  } else {
    // Addition, subtraction, multiplication, operands 1-12
    const ops: Operation[] = ['+', '-', '\u00D7'];
    operation = ops[randInt(0, ops.length - 1)];
    if (operation === '+') {
      a = randInt(1, 12);
      b = randInt(1, 12);
      answer = a + b;
    } else if (operation === '-') {
      a = randInt(2, 12);
      b = randInt(1, a);
      answer = a - b;
    } else {
      a = randInt(1, 12);
      b = randInt(1, 12);
      answer = a * b;
    }
  }

  const display = `${a} ${operation} ${b} = ?`;
  return { a, b, operation, answer, display };
}

/** Generate distractor answers that are plausible but wrong */
function generateChoices(correctAnswer: number): number[] {
  const choices = new Set<number>([correctAnswer]);

  // Generate distractors near the correct answer
  let attempts = 0;
  while (choices.size < NUM_CHOICES && attempts < 50) {
    attempts++;
    // Offsets: small deviations from the correct answer
    const offset = randInt(1, Math.max(5, Math.floor(Math.abs(correctAnswer) * 0.5) + 2));
    const sign = Math.random() < 0.5 ? 1 : -1;
    const distractor = correctAnswer + sign * offset;
    // Keep distractors non-negative and different from correct
    if (distractor >= 0 && distractor !== correctAnswer) {
      choices.add(distractor);
    }
  }

  // Fallback: fill remaining slots with sequential offsets
  let fallback = 1;
  while (choices.size < NUM_CHOICES) {
    const candidate = correctAnswer + fallback;
    if (!choices.has(candidate) && candidate >= 0) {
      choices.add(candidate);
    }
    fallback = fallback > 0 ? -fallback : -fallback + 1;
  }

  // Shuffle using Fisher-Yates
  const arr = Array.from(choices);
  for (let i = arr.length - 1; i > 0; i--) {
    const j = randInt(0, i);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }

  return arr;
}

function getEncouragementMessage(score: number, accuracy: number): string {
  if (accuracy >= 95 && score >= 30) return 'Lightning fast and laser accurate!';
  if (accuracy >= 95) return 'Incredible accuracy! Your facts are rock solid!';
  if (score >= 30) return 'Amazing speed! You are a math machine!';
  if (score >= 20) return 'Great work! Your fact fluency is getting stronger!';
  if (score >= 10) return 'Good job! Keep practicing to build speed!';
  return 'Nice effort! Every session makes your brain faster!';
}

export default function SpeedMathGame({ onBack }: SpeedMathGameProps) {
  const shouldReduceMotion = useReducedMotion();

  // Game configuration
  const [difficulty, setDifficulty] = useState<GameDifficulty>('easy');
  const [phase, setPhase] = useState<GamePhase>('ready');

  // Game state
  const [problem, setProblem] = useState<Problem | null>(null);
  const [choices, setChoices] = useState<number[]>([]);
  const [score, setScore] = useState(0);
  const [attempted, setAttempted] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(GAME_DURATION_MS);
  const [feedback, setFeedback] = useState<FeedbackState>('none');
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);

  // Refs for timers and cleanup
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const feedbackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startTimeRef = useRef<number>(0);

  // Screen reader announcements
  const [announcement, setAnnouncement] = useState('');

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
    };
  }, []);

  // Load next problem
  const loadNextProblem = useCallback((diff: GameDifficulty) => {
    const newProblem = generateProblem(diff);
    setProblem(newProblem);
    setChoices(generateChoices(newProblem.answer));
    setFeedback('none');
    setSelectedAnswer(null);
  }, []);

  // Start the game
  const startGame = useCallback(() => {
    setPhase('playing');
    setScore(0);
    setAttempted(0);
    setCorrectCount(0);
    setTimeRemaining(GAME_DURATION_MS);
    startTimeRef.current = Date.now();
    loadNextProblem(difficulty);
  }, [difficulty, loadNextProblem]);

  // Countdown timer
  useEffect(() => {
    if (phase !== 'playing') return;

    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const remaining = Math.max(0, GAME_DURATION_MS - elapsed);
      setTimeRemaining(remaining);

      if (remaining <= 0) {
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        if (feedbackTimeoutRef.current) {
          clearTimeout(feedbackTimeoutRef.current);
          feedbackTimeoutRef.current = null;
        }
        setPhase('complete');
      }
    }, 100);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [phase]);

  // Handle answer selection
  const handleAnswer = useCallback((answer: number) => {
    if (feedback !== 'none' || phase !== 'playing' || !problem) return;

    setSelectedAnswer(answer);
    setAttempted(prev => prev + 1);
    const isCorrect = answer === problem.answer;

    if (isCorrect) {
      setFeedback('correct');
      setScore(prev => prev + 1);
      setCorrectCount(prev => prev + 1);
      setAnnouncement('Correct!');
    } else {
      setFeedback('incorrect');
      setAnnouncement(`Wrong. The answer was ${problem.answer}.`);
    }

    // Auto-advance after feedback
    feedbackTimeoutRef.current = setTimeout(() => {
      // Check if game is still running (timer might have ended)
      const elapsed = Date.now() - startTimeRef.current;
      if (elapsed < GAME_DURATION_MS) {
        loadNextProblem(difficulty);
      }
    }, FEEDBACK_DURATION_MS);
  }, [feedback, phase, problem, difficulty, loadNextProblem]);

  // Save results when game completes
  useEffect(() => {
    if (phase !== 'complete') return;

    const accuracy = attempted > 0 ? Math.round((correctCount / attempted) * 100) : 0;

    // Try to save to Dexie, fall back to localStorage
    (async () => {
      try {
        await db.drill_results.add({
          sessionId: 0,
          timestamp: new Date().toISOString(),
          module: 'fact_fluency',
          difficulty,
          isCorrect: accuracy >= 70,
          timeToAnswer: GAME_DURATION_MS,
          accuracy,
        });
      } catch (err) {
        console.error('Failed to save to Dexie, using localStorage fallback:', err);
        try {
          const backupKey = STORAGE_KEYS.DRILL_RESULTS_BACKUP;
          const existing = localStorage.getItem(backupKey);
          const backups = existing ? JSON.parse(existing) : [];
          backups.push({
            timestamp: new Date().toISOString(),
            module: 'fact_fluency',
            difficulty,
            score,
            attempted,
            accuracy,
          });
          localStorage.setItem(backupKey, JSON.stringify(backups));
        } catch {
          // localStorage also failed, silently continue
        }
      }
    })();

    // Log telemetry
    db.telemetry_logs
      .add({
        timestamp: new Date().toISOString(),
        event: 'cognition_game_complete',
        module: 'speed_math',
        data: {
          difficulty,
          score,
          attempted,
          accuracy,
          duration: GAME_DURATION_MS,
        },
        userId: 'local_user',
      })
      .catch(err => console.error('Failed to log telemetry:', err));
  }, [phase, difficulty, score, attempted, correctCount]);

  // Reset and play again
  const resetGame = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
    setPhase('ready');
    setProblem(null);
    setChoices([]);
    setScore(0);
    setAttempted(0);
    setCorrectCount(0);
    setTimeRemaining(GAME_DURATION_MS);
    setFeedback('none');
    setSelectedAnswer(null);
    setAnnouncement('');
  }, []);

  // Handle difficulty change
  const handleDifficultyChange = (newDifficulty: GameDifficulty) => {
    setDifficulty(newDifficulty);
    if (phase === 'ready') {
      // Just update difficulty, don't restart
    }
  };

  const accuracy = attempted > 0 ? Math.round((correctCount / attempted) * 100) : 0;
  const secondsRemaining = Math.ceil(timeRemaining / 1000);

  // Get button style for choice based on feedback state
  const getChoiceStyle = (choice: number): string => {
    const base = 'min-h-[56px] text-xl font-bold rounded-xl transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2';

    if (feedback === 'none') {
      return `${base} bg-muted hover:bg-muted/80 text-foreground border border-border`;
    }

    if (choice === problem?.answer) {
      return `${base} bg-emerald-500 text-white border border-emerald-600`;
    }

    if (choice === selectedAnswer && feedback === 'incorrect') {
      return `${base} bg-red-500 text-white border border-red-600`;
    }

    return `${base} bg-muted/50 text-muted-foreground border border-border`;
  };

  return (
    <div className="max-w-md mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <Button
          variant="ghost"
          onClick={onBack}
          className="min-h-[44px]"
        >
          &larr; Back to Games
        </Button>
        <h1 className="text-xl font-bold">Speed Math</h1>
        <div className="w-[72px]" /> {/* Spacer for alignment */}
      </div>

      {/* Ready phase: difficulty selection and start */}
      {phase === 'ready' && (
        <div className="space-y-6">
          {/* Difficulty selector */}
          <div>
            <p className="text-sm text-muted-foreground mb-2 text-center">Choose difficulty</p>
            <div className="flex gap-1" role="tablist" aria-label="Difficulty">
              {(['easy', 'medium', 'hard'] as GameDifficulty[]).map(diff => (
                <button
                  key={diff}
                  role="tab"
                  aria-selected={difficulty === diff}
                  onClick={() => handleDifficultyChange(diff)}
                  className={`
                    flex-1 py-2 px-3 text-sm font-medium rounded-lg min-h-[44px]
                    transition-colors
                    focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus:outline-none
                    ${
                      difficulty === diff
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }
                  `}
                >
                  {DIFFICULTY_LABELS[diff]}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              {DIFFICULTY_DESCRIPTIONS[difficulty]}
            </p>
          </div>

          {/* Game instructions */}
          <div className="text-center space-y-2">
            <p className="text-lg font-semibold" style={{ color: '#E87461' }}>
              60 seconds on the clock!
            </p>
            <p className="text-sm text-muted-foreground">
              Answer as many math problems as you can before time runs out.
            </p>
          </div>

          {/* Start button */}
          <div className="flex justify-center">
            <Button
              onClick={startGame}
              className="min-h-[56px] px-10 text-lg font-bold"
              style={{ backgroundColor: '#E87461', color: 'white' }}
            >
              Start!
            </Button>
          </div>
        </div>
      )}

      {/* Playing phase */}
      {phase === 'playing' && problem && (
        <div className="space-y-6">
          {/* Stats bar: score and timer */}
          <div className="flex items-center justify-between" aria-live="polite">
            <div className="text-lg font-bold">
              Score: <span style={{ color: '#E87461' }}>{score}</span>
            </div>
            <div
              className={`text-lg font-bold tabular-nums ${secondsRemaining <= 10 ? 'text-red-500' : 'text-muted-foreground'}`}
              aria-label={`${secondsRemaining} seconds remaining`}
            >
              {secondsRemaining}s
            </div>
          </div>

          {/* Timer bar */}
          <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: '#E87461' }}
              initial={{ width: '100%' }}
              animate={{ width: `${(timeRemaining / GAME_DURATION_MS) * 100}%` }}
              transition={{ duration: 0.1, ease: 'linear' }}
            />
          </div>

          {/* Problem display */}
          <motion.div
            key={problem.display}
            className="text-center py-8"
            initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.2 }}
          >
            <p
              className="text-5xl font-bold tabular-nums"
              aria-label={`What is ${problem.a} ${problem.operation === '\u00D7' ? 'times' : problem.operation === '+' ? 'plus' : 'minus'} ${problem.b}?`}
            >
              {problem.display}
            </p>
          </motion.div>

          {/* Multiple choice answers */}
          <div className="grid grid-cols-2 gap-3">
            {choices.map((choice, index) => (
              <motion.button
                key={`${problem.display}-${choice}-${index}`}
                onClick={() => handleAnswer(choice)}
                disabled={feedback !== 'none'}
                className={getChoiceStyle(choice)}
                whileTap={shouldReduceMotion ? undefined : { scale: 0.95 }}
                animate={
                  feedback !== 'none' && choice === problem.answer
                    ? shouldReduceMotion
                      ? { opacity: 1 }
                      : { scale: [1, 1.05, 1] }
                    : {}
                }
                transition={{ duration: shouldReduceMotion ? 0 : 0.2 }}
                aria-label={`Answer: ${choice}`}
              >
                {choice}
              </motion.button>
            ))}
          </div>
        </div>
      )}

      {/* Screen reader announcements */}
      <div aria-live="assertive" className="sr-only">
        {announcement}
      </div>

      {/* Results dialog */}
      <Dialog open={phase === 'complete'} onOpenChange={() => {}}>
        <DialogContent
          onPointerDownOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle className="text-2xl text-center">Time&apos;s Up!</DialogTitle>
            <DialogDescription className="text-center text-base">
              {getEncouragementMessage(score, accuracy)}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            <p className="text-center">
              <span className="text-4xl font-bold" style={{ color: '#E87461' }}>{score}</span>
              <span className="text-lg text-muted-foreground ml-2">correct</span>
            </p>
            <div className="flex justify-center gap-6 text-sm">
              <div className="text-center">
                <p className="font-semibold text-lg">{attempted}</p>
                <p className="text-muted-foreground">Attempted</p>
              </div>
              <div className="text-center">
                <p className="font-semibold text-lg">{accuracy}%</p>
                <p className="text-muted-foreground">Accuracy</p>
              </div>
            </div>
          </div>
          <DialogFooter className="flex gap-2 sm:gap-0">
            <Button
              onClick={() => {
                resetGame();
                // Immediately start a new game
                setTimeout(() => startGame(), 0);
              }}
              className="min-h-[44px]"
              style={{ backgroundColor: '#E87461', color: 'white' }}
            >
              Play Again
            </Button>
            <Button
              variant="outline"
              onClick={onBack}
              className="min-h-[44px]"
            >
              Back to Games
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
