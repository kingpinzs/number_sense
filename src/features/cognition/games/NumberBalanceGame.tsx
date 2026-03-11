// NumberBalanceGame — Algebraic balance scale puzzle
// Teaches "what value makes both sides equal?" as a foundation for equation reasoning.
// 10 rounds per game, difficulty selector, SVG balance scale animation.

import { useState, useCallback, useRef, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { db } from '@/services/storage/db';

interface GameProps {
  onBack: () => void;
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Difficulty = 'easy' | 'medium' | 'hard';
type GamePhase = 'setup' | 'playing' | 'results';
type AnswerState = 'idle' | 'correct' | 'wrong';

interface Puzzle {
  /** Full equation string displayed to the user, e.g. "? + 3 = 8" */
  display: string;
  /** Numeric correct answer */
  answer: number;
  /** Left-hand side label for the balance pan */
  leftLabel: string;
  /** Right-hand side label for the balance pan */
  rightLabel: string;
}

interface RoundResult {
  isCorrect: boolean;
  timeMs: number;
}

// ---------------------------------------------------------------------------
// Puzzle generation
// ---------------------------------------------------------------------------

/** Return a random integer in [min, max] inclusive. */
function randInt(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min + 1));
}

/** Shuffle an array in-place using Fisher-Yates. */
function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Generate a Puzzle appropriate for the given difficulty.
 *
 * Easy:   single unknown addition  — "? + b = c"  or  "a + ? = c"
 * Medium: single unknown with +/–/× — "? × b = c", "a – ? = c", "? + b + c = d"
 * Hard:   two-step problems — "(? + b) × c = d", "? × a – b = c"
 */
function generatePuzzle(difficulty: Difficulty): Puzzle {
  if (difficulty === 'easy') {
    return generateEasyPuzzle();
  }
  if (difficulty === 'medium') {
    return generateMediumPuzzle();
  }
  return generateHardPuzzle();
}

function generateEasyPuzzle(): Puzzle {
  // "? + b = c"  or  "a + ? = c"
  const answer = randInt(1, 20);
  const b = randInt(1, 20 - answer + 1);
  const c = answer + b;
  const unknownFirst = Math.random() < 0.5;
  const display = unknownFirst ? `? + ${b} = ${c}` : `${b} + ? = ${c}`;
  const left = unknownFirst ? `? + ${b}` : `${b} + ?`;
  return { display, answer, leftLabel: left, rightLabel: String(c) };
}

function generateMediumPuzzle(): Puzzle {
  const type = randInt(0, 2);

  if (type === 0) {
    // "? × b = c"
    const b = randInt(2, 9);
    const answer = randInt(2, 50 / b);
    const c = answer * b;
    return {
      display: `? × ${b} = ${c}`,
      answer,
      leftLabel: `? × ${b}`,
      rightLabel: String(c),
    };
  }

  if (type === 1) {
    // "a − ? = c"  (answer = a − c, ensuring a > c > 0)
    const c = randInt(1, 30);
    const answer = randInt(1, 50 - c);
    const a = c + answer;
    return {
      display: `${a} − ? = ${c}`,
      answer,
      leftLabel: `${a} − ?`,
      rightLabel: String(c),
    };
  }

  // "? + b + c = d"  (three addends)
  const b = randInt(1, 15);
  const c = randInt(1, 15);
  const answer = randInt(1, 50 - b - c);
  const d = answer + b + c;
  return {
    display: `? + ${b} + ${c} = ${d}`,
    answer,
    leftLabel: `? + ${b} + ${c}`,
    rightLabel: String(d),
  };
}

function generateHardPuzzle(): Puzzle {
  const type = randInt(0, 1);

  if (type === 0) {
    // "(? + b) × c = d"   →  answer = d/c − b
    const c = randInt(2, 5);
    const b = randInt(1, 10);
    const answer = randInt(1, 15);
    const d = (answer + b) * c;
    return {
      display: `(? + ${b}) × ${c} = ${d}`,
      answer,
      leftLabel: `(? + ${b}) × ${c}`,
      rightLabel: String(d),
    };
  }

  // "? × a − b = c"   →  answer = (c + b) / a, ensure clean division
  const a = randInt(2, 5);
  const b = randInt(1, 20);
  const answer = randInt(2, 20);
  const c = answer * a - b;
  // Guard: c must be positive
  if (c <= 0) {
    // Fallback to type 0 so we always return a valid puzzle
    const c2 = randInt(2, 5);
    const b2 = randInt(1, 10);
    const answer2 = randInt(1, 15);
    const d2 = (answer2 + b2) * c2;
    return {
      display: `(? + ${b2}) × ${c2} = ${d2}`,
      answer: answer2,
      leftLabel: `(? + ${b2}) × ${c2}`,
      rightLabel: String(d2),
    };
  }
  return {
    display: `? × ${a} − ${b} = ${c}`,
    answer,
    leftLabel: `? × ${a} − ${b}`,
    rightLabel: String(c),
  };
}

/**
 * Generate four multiple-choice options that include the correct answer.
 * Distractors are nearby integers that are distinct from the correct answer.
 */
function generateChoices(answer: number): number[] {
  const choices = new Set<number>([answer]);

  // Nearby distractors: ±1, ±2, ±3, ±4, ±5 (avoid negatives)
  const candidates = shuffle([1, 2, 3, 4, 5, 6, 7, 8].map(d => [answer + d, answer - d]).flat())
    .filter(n => n > 0 && n !== answer);

  for (const n of candidates) {
    if (choices.size >= 4) break;
    choices.add(n);
  }

  // Fallback: if still fewer than 4, pad with incrementing integers
  let pad = answer + 10;
  while (choices.size < 4) {
    if (!choices.has(pad)) choices.add(pad);
    pad++;
  }

  return shuffle(Array.from(choices));
}

// ---------------------------------------------------------------------------
// Balance Scale SVG component
// ---------------------------------------------------------------------------

interface BalanceScaleProps {
  leftSide: string;
  rightSide: string;
  /** null = neutral, true = balanced (level), false = tilts left (wrong) */
  isBalanced: boolean | null;
}

function BalanceScale({ leftSide, rightSide, isBalanced }: BalanceScaleProps) {
  // Tilt the beam slightly when an incorrect answer was chosen.
  // null = pre-answer (level), true = balanced, false = tilted
  const tilt = isBalanced === false ? -5 : 0;

  return (
    <svg
      viewBox="0 0 300 200"
      className="w-full max-w-[300px] mx-auto"
      role="img"
      aria-label={`Balance scale: ${leftSide} vs ${rightSide}`}
    >
      {/* Base / fulcrum */}
      <polygon points="150,190 135,160 165,160" fill="currentColor" opacity="0.3" />
      {/* Vertical post */}
      <line x1="150" y1="100" x2="150" y2="160" stroke="currentColor" strokeWidth="3" />
      {/* Beam */}
      <line
        x1="30"
        y1="100"
        x2="270"
        y2="100"
        stroke="currentColor"
        strokeWidth="4"
        transform={`rotate(${tilt}, 150, 100)`}
      />
      {/* Left pan */}
      <rect
        x="20"
        y="105"
        width="100"
        height="44"
        rx="6"
        fill="hsl(var(--primary) / 0.15)"
        stroke="hsl(var(--primary))"
        strokeWidth="2"
        transform={`rotate(${tilt}, 150, 100)`}
      />
      <text
        x="70"
        y="133"
        textAnchor="middle"
        fontSize="14"
        fontWeight="bold"
        fill="currentColor"
        transform={`rotate(${tilt}, 150, 100)`}
      >
        {leftSide}
      </text>
      {/* Right pan */}
      <rect
        x="180"
        y="105"
        width="100"
        height="44"
        rx="6"
        fill="hsl(var(--primary) / 0.15)"
        stroke="hsl(var(--primary))"
        strokeWidth="2"
        transform={`rotate(${tilt}, 150, 100)`}
      />
      <text
        x="230"
        y="133"
        textAnchor="middle"
        fontSize="14"
        fontWeight="bold"
        fill="currentColor"
        transform={`rotate(${tilt}, 150, 100)`}
      >
        {rightSide}
      </text>
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Difficulty selector card
// ---------------------------------------------------------------------------

const DIFFICULTY_DESCRIPTIONS: Record<Difficulty, string> = {
  easy: 'Addition only · numbers 1–20',
  medium: 'Add / subtract / multiply · numbers 1–50',
  hard: 'Two-step problems · numbers 1–100',
};

interface DifficultySelectorProps {
  selected: Difficulty;
  onChange: (d: Difficulty) => void;
}

function DifficultySelector({ selected, onChange }: DifficultySelectorProps) {
  return (
    <div className="space-y-3 mb-6" role="group" aria-label="Select difficulty">
      {(['easy', 'medium', 'hard'] as Difficulty[]).map(d => (
        <button
          key={d}
          onClick={() => onChange(d)}
          className={`w-full p-4 rounded-lg border text-left min-h-[44px] transition-colors capitalize ${
            selected === d
              ? 'border-primary bg-primary/10'
              : 'border-border hover:border-primary/50'
          }`}
          aria-pressed={selected === d}
        >
          <div className="font-medium capitalize">{d}</div>
          <div className="text-xs text-muted-foreground">{DIFFICULTY_DESCRIPTIONS[d]}</div>
        </button>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TOTAL_ROUNDS = 10;
const BASE_POINTS = 100;
const BONUS_POINTS = 50;
/** Milliseconds within which a correct answer earns the speed bonus */
const BONUS_TIME_MS = 5000;
/** Auto-advance after feedback (ms) */
const FEEDBACK_DURATION_MS = 1500;

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function NumberBalanceGame({ onBack }: GameProps) {
  const [phase, setPhase] = useState<GamePhase>('setup');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');

  // Per-round state
  const [roundIndex, setRoundIndex] = useState(0);
  const [puzzle, setPuzzle] = useState<Puzzle | null>(null);
  const [choices, setChoices] = useState<number[]>([]);
  const [answerState, setAnswerState] = useState<AnswerState>('idle');
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);

  // Accumulated results
  const [results, setResults] = useState<RoundResult[]>([]);
  const [totalScore, setTotalScore] = useState(0);

  // Timing
  const roundStartRef = useRef<number>(0);
  const gameStartRef = useRef<number>(0);

  // Timer ref for cleanup
  const advanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (advanceTimerRef.current !== null) clearTimeout(advanceTimerRef.current);
    };
  }, []);

  // -------------------------------------------------------------------------
  // Game flow helpers
  // -------------------------------------------------------------------------

  /** Load a fresh puzzle for the current round index and difficulty. */
  const loadRound = useCallback((diff: Difficulty) => {
    const p = generatePuzzle(diff);
    setPuzzle(p);
    setChoices(generateChoices(p.answer));
    setAnswerState('idle');
    setSelectedAnswer(null);
    roundStartRef.current = Date.now();
  }, []);

  /** Start the game (called when the user clicks "Start Game"). */
  const startGame = useCallback(() => {
    setResults([]);
    setTotalScore(0);
    setRoundIndex(0);
    gameStartRef.current = Date.now();
    setPhase('playing');
    // loadRound is called in the useEffect that watches [phase, roundIndex, difficulty]
  }, []);

  // Load round whenever we enter 'playing' phase or advance round index.
  useEffect(() => {
    if (phase === 'playing') {
      loadRound(difficulty);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, roundIndex]);

  /** Handle the user picking an answer button. */
  const handleAnswer = useCallback(
    (chosen: number) => {
      if (!puzzle || answerState !== 'idle') return;

      const timeMs = Date.now() - roundStartRef.current;
      const isCorrect = chosen === puzzle.answer;

      setSelectedAnswer(chosen);
      setAnswerState(isCorrect ? 'correct' : 'wrong');

      const points = isCorrect
        ? BASE_POINTS + (timeMs <= BONUS_TIME_MS ? BONUS_POINTS : 0)
        : 0;

      setResults(prev => [...prev, { isCorrect, timeMs }]);
      setTotalScore(prev => prev + points);

      // Auto-advance after feedback
      advanceTimerRef.current = setTimeout(() => {
        advanceTimerRef.current = null;
        const nextRound = roundIndex + 1;
        if (nextRound >= TOTAL_ROUNDS) {
          setPhase('results');
        } else {
          setRoundIndex(nextRound);
          // answerState / selectedAnswer are reset inside loadRound via useEffect
        }
      }, FEEDBACK_DURATION_MS);
    },
    [puzzle, answerState, roundIndex],
  );

  /** Persist results to Dexie and return. */
  const persistResults = useCallback(
    async (allResults: RoundResult[], diff: Difficulty, duration: number) => {
      const correctCount = allResults.filter(r => r.isCorrect).length;
      const accuracy = Math.round((correctCount / allResults.length) * 100);
      const avgTime = Math.round(
        allResults.reduce((s, r) => s + r.timeMs, 0) / allResults.length,
      );
      try {
        const sessionId = await db.sessions.add({
          timestamp: new Date().toISOString(),
          module: 'cognition',
          duration,
          completionStatus: 'completed',
        });
        await db.drill_results.add({
          sessionId,
          timestamp: new Date().toISOString(),
          module: 'number_balance',
          difficulty: diff,
          isCorrect: accuracy >= 70,
          timeToAnswer: avgTime,
          accuracy,
        });
      } catch (e) {
        console.error('Failed to log number balance results:', e);
      }
    },
    [],
  );

  // Persist once when results screen appears
  useEffect(() => {
    if (phase === 'results' && results.length > 0) {
      const duration = Date.now() - gameStartRef.current;
      persistResults(results, difficulty, duration);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  /** Reset back to the setup screen. */
  const handlePlayAgain = useCallback(() => {
    if (advanceTimerRef.current !== null) {
      clearTimeout(advanceTimerRef.current);
      advanceTimerRef.current = null;
    }
    setPhase('setup');
    setRoundIndex(0);
    setResults([]);
    setTotalScore(0);
    setPuzzle(null);
    setAnswerState('idle');
    setSelectedAnswer(null);
  }, []);

  // -------------------------------------------------------------------------
  // Derived display values
  // -------------------------------------------------------------------------

  const correctCount = results.filter(r => r.isCorrect).length;
  const accuracy = results.length > 0 ? Math.round((correctCount / results.length) * 100) : 0;
  const avgTimeS =
    results.length > 0
      ? (results.reduce((s, r) => s + r.timeMs, 0) / results.length / 1000).toFixed(1)
      : '0.0';

  // The balance pan label with the user's chosen answer substituted for "?"
  const leftLabelResolved =
    puzzle && selectedAnswer !== null
      ? puzzle.leftLabel.replace('?', String(selectedAnswer))
      : puzzle?.leftLabel ?? '';

  // -------------------------------------------------------------------------
  // Render: Setup
  // -------------------------------------------------------------------------

  if (phase === 'setup') {
    return (
      <div className="max-w-md mx-auto px-4 py-6 pb-24">
        <Button
          variant="ghost"
          onClick={onBack}
          className="mb-2 -ml-2 min-h-[44px]"
          aria-label="Back to games"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to games
        </Button>

        <h1 className="text-2xl font-bold mb-1">Number Balance</h1>
        <p className="text-sm text-muted-foreground mb-6">
          Find the value that balances the scale. {TOTAL_ROUNDS} rounds, max{' '}
          {TOTAL_ROUNDS * (BASE_POINTS + BONUS_POINTS)} points.
        </p>

        <DifficultySelector selected={difficulty} onChange={setDifficulty} />

        <Button
          onClick={startGame}
          className="w-full min-h-[48px] text-base font-bold"
        >
          Start Game
        </Button>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Render: Results
  // -------------------------------------------------------------------------

  if (phase === 'results') {
    let encouragement: string;
    if (accuracy === 100) encouragement = 'Perfect balance! Algebraic genius!';
    else if (accuracy >= 70) encouragement = 'Great work! Keep practising balance.';
    else encouragement = 'Balance takes practice. Try again!';

    return (
      <div className="max-w-md mx-auto px-4 py-6 pb-24">
        <h2 className="text-2xl font-bold text-center mb-4">Game Complete!</h2>
        <p className="text-center text-muted-foreground mb-6">{encouragement}</p>

        <div className="rounded-lg border border-border bg-card p-4 mb-6 space-y-3">
          <div className="flex justify-between text-sm">
            <span>Score:</span>
            <span className="font-semibold">{totalScore}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Correct:</span>
            <span className="font-semibold">
              {correctCount}/{TOTAL_ROUNDS}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Accuracy:</span>
            <span className="font-semibold">{accuracy}%</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Avg Response:</span>
            <span className="font-semibold">{avgTimeS}s</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Difficulty:</span>
            <span className="font-semibold capitalize">{difficulty}</span>
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={handlePlayAgain}
            className="flex-1 min-h-[44px]"
          >
            Play Again
          </Button>
          <Button onClick={onBack} className="flex-1 min-h-[44px]">
            Back to games
          </Button>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Render: Playing
  // -------------------------------------------------------------------------

  if (!puzzle) return null;

  const isBalancedState: boolean | null =
    answerState === 'idle' ? null : answerState === 'correct';

  return (
    <div className="max-w-md mx-auto px-4 py-6 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <Button
          variant="ghost"
          onClick={onBack}
          className="min-h-[44px] -ml-2"
          aria-label="Back to games"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back
        </Button>
        <p className="text-sm text-muted-foreground">
          Round {roundIndex + 1}/{TOTAL_ROUNDS}
        </p>
        <p className="text-sm font-semibold">{totalScore} pts</p>
      </div>

      {/* Balance scale */}
      <div className="mb-2" aria-live="polite" aria-atomic="true">
        <BalanceScale
          leftSide={answerState !== 'idle' ? leftLabelResolved : puzzle.leftLabel}
          rightSide={puzzle.rightLabel}
          isBalanced={isBalancedState}
        />
      </div>

      {/* Equation display */}
      <p className="text-center text-lg font-mono font-bold mb-4">{puzzle.display}</p>

      {/* Feedback banner */}
      <div
        className="min-h-[28px] text-center text-sm font-semibold mb-4"
        aria-live="assertive"
        aria-atomic="true"
      >
        {answerState === 'correct' && (
          <span className="text-green-500">Correct! {puzzle.answer} balances it.</span>
        )}
        {answerState === 'wrong' && selectedAnswer !== null && (
          <span className="text-red-500">
            Not quite — the answer is {puzzle.answer}.
          </span>
        )}
      </div>

      {/* Answer choices */}
      <div className="grid grid-cols-2 gap-3" role="group" aria-label="Choose the answer">
        {choices.map(choice => {
          let extraClass = '';

          if (answerState !== 'idle') {
            if (choice === puzzle.answer) {
              extraClass = 'border-green-500 bg-green-500/10 text-green-700 dark:text-green-400';
            } else if (choice === selectedAnswer) {
              extraClass = 'border-red-500 bg-red-500/10 text-red-700 dark:text-red-400';
            }
          }

          return (
            <button
              key={choice}
              onClick={() => handleAnswer(choice)}
              disabled={answerState !== 'idle'}
              className={`min-h-[56px] rounded-lg border text-lg font-bold transition-colors
                ${answerState === 'idle' ? 'border-border hover:border-primary/50 hover:bg-primary/5' : ''}
                ${extraClass}
                disabled:cursor-default
              `}
              aria-label={`Answer ${choice}`}
            >
              {choice}
            </button>
          );
        })}
      </div>
    </div>
  );
}
