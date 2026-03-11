// RhythmCountGame — Brain game: rhythmic skip-counting with multiple-choice blanks
//
// 10 rounds. Each round plays a skip-counting sequence with a visual beat then
// asks the user to pick the missing number from 4 choices.
//
// Scoring: 100 points per correct + 50 bonus if answered within 3 seconds.
// Results saved to sessions + drill_results (module: 'rhythm_count').

import { useState, useCallback, useRef, useEffect } from 'react';
import { ArrowLeft, Music } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { db } from '@/services/storage/db';

// ─── Constants ────────────────────────────────────────────────────────────────

const TOTAL_ROUNDS = 10;
const BONUS_WINDOW_MS = 3000;
const POINTS_CORRECT = 100;
const POINTS_BONUS = 50;

interface DifficultyConfig {
  label: string;
  description: string;
  steps: readonly number[];
  sequenceLength: number;
  beatIntervalMs: number;
  minStart: number;
  maxStart: number;
}

const DIFFICULTY_CONFIGS: Record<'easy' | 'medium' | 'hard', DifficultyConfig> = {
  easy: {
    label: 'Easy',
    description: 'Count by 2, 5, or 10. Slow beat.',
    steps: [2, 5, 10],
    sequenceLength: 8,
    beatIntervalMs: 750,
    minStart: 0,
    maxStart: 20,
  },
  medium: {
    label: 'Medium',
    description: 'Count by 3, 4, or 6. Moderate beat.',
    steps: [3, 4, 6],
    sequenceLength: 8,
    beatIntervalMs: 600,
    minStart: 0,
    maxStart: 50,
  },
  hard: {
    label: 'Hard',
    description: 'Count by 7, 8, 9, 11, or 12. Fast beat.',
    steps: [7, 8, 9, 11, 12],
    sequenceLength: 10,
    beatIntervalMs: 500,
    minStart: 0,
    maxStart: 100,
  },
};

// ─── Sequence generation ──────────────────────────────────────────────────────

interface RoundQuestion {
  values: number[];
  step: number;
  missingIndex: number;
  correctAnswer: number;
  choices: number[];
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickRandom<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = randInt(0, i);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function generateRoundQuestion(difficulty: 'easy' | 'medium' | 'hard'): RoundQuestion {
  const cfg = DIFFICULTY_CONFIGS[difficulty];
  const step = pickRandom(cfg.steps);
  const start = randInt(cfg.minStart, cfg.maxStart);

  const values: number[] = [];
  for (let i = 0; i < cfg.sequenceLength; i++) {
    values.push(start + step * i);
  }

  // Missing index: never the very first position (keep at least one anchor)
  const missingIndex = randInt(1, cfg.sequenceLength - 1);
  const correctAnswer = values[missingIndex];

  // Build 3 distractors — off-by-step and off-by-1 candidates, no negatives
  const candidates: number[] = [
    correctAnswer + step,
    correctAnswer - step,
    correctAnswer + 1,
    correctAnswer - 1,
    correctAnswer + step * 2,
    correctAnswer - step * 2,
  ].filter(c => c !== correctAnswer && c >= 0);

  // De-duplicate
  const unique = Array.from(new Set(candidates));

  // Pad with random offsets if we don't have 3 yet
  while (unique.length < 3) {
    const offset = randInt(1, step * 2);
    const sign = Math.random() < 0.5 ? 1 : -1;
    const c = correctAnswer + offset * sign;
    if (c !== correctAnswer && c >= 0 && !unique.includes(c)) {
      unique.push(c);
    }
  }

  const choices = shuffle([correctAnswer, ...unique.slice(0, 3)]);

  return { values, step, missingIndex, correctAnswer, choices };
}

// ─── Audio ────────────────────────────────────────────────────────────────────

function tryCreateAudioContext(): AudioContext | null {
  try {
    return new AudioContext();
  } catch {
    return null;
  }
}

function playBeat(audioCtx: AudioContext): void {
  try {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.frequency.value = 800;
    gain.gain.value = 0.1;
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
    osc.stop(audioCtx.currentTime + 0.1);
  } catch {
    // Silently degrade
  }
}

// ─── Encouragement ────────────────────────────────────────────────────────────

function getEncouragement(accuracy: number): string {
  if (accuracy >= 90) return 'Outstanding! Your rhythm sense is excellent!';
  if (accuracy >= 70) return 'Great work! You are building strong counting patterns!';
  if (accuracy >= 50) return 'Good effort! Keep practising the beat.';
  return 'Nice try! Rhythmic counting gets easier with practice.';
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface RhythmCountGameProps {
  onBack: () => void;
}

interface RoundResult {
  correct: boolean;
  responseTimeMs: number;
  bonus: boolean;
}

type GamePhase = 'setup' | 'playing' | 'answer' | 'feedback' | 'complete';

// ─── Component ────────────────────────────────────────────────────────────────

export default function RhythmCountGame({ onBack }: RhythmCountGameProps) {
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('easy');
  const [phase, setPhase] = useState<GamePhase>('setup');
  const [round, setRound] = useState(0);
  const [question, setQuestion] = useState<RoundQuestion | null>(null);
  const [results, setResults] = useState<RoundResult[]>([]);
  const [score, setScore] = useState(0);

  // Beat animation state
  const [currentBeatIndex, setCurrentBeatIndex] = useState(-1);
  const [isPulsing, setIsPulsing] = useState(false);

  // Answer phase
  const [lastCorrect, setLastCorrect] = useState(false);
  const [lastBonus, setLastBonus] = useState(false);

  // Refs
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const answerStartRef = useRef(0);
  const gameStartRef = useRef(0);

  const cfg = DIFFICULTY_CONFIGS[difficulty];

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  // ── Beat sequencer (runs when phase === 'playing') ──────────────────────

  useEffect(() => {
    if (phase !== 'playing' || !question) return;

    let beat = 0;
    const { sequenceLength, beatIntervalMs } = cfg;

    const scheduleBeat = () => {
      if (beat >= sequenceLength) {
        setCurrentBeatIndex(-1);
        setPhase('answer');
        answerStartRef.current = Date.now();
        return;
      }

      setCurrentBeatIndex(beat);
      setIsPulsing(true);

      if (audioCtxRef.current) {
        playBeat(audioCtxRef.current);
      }

      timerRef.current = setTimeout(() => {
        setIsPulsing(false);
        beat++;
        timerRef.current = setTimeout(scheduleBeat, beatIntervalMs * 0.1);
      }, beatIntervalMs * 0.4);
    };

    timerRef.current = setTimeout(scheduleBeat, 300);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [phase, question, cfg]);

  // ── Start a new round ────────────────────────────────────────────────────

  const startRound = useCallback(
    (roundIndex: number) => {
      const q = generateRoundQuestion(difficulty);
      setQuestion(q);
      setRound(roundIndex);
      setCurrentBeatIndex(-1);
      setPhase('playing');
    },
    [difficulty]
  );

  const startGame = useCallback(() => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = tryCreateAudioContext();
    }
    setResults([]);
    setScore(0);
    setRound(0);
    gameStartRef.current = Date.now();
    startRound(0);
  }, [startRound]);

  // ── Handle a multiple-choice answer ─────────────────────────────────────

  const handleAnswer = useCallback(
    (choice: number) => {
      if (!question) return;

      const responseTimeMs = Date.now() - answerStartRef.current;
      const correct = choice === question.correctAnswer;
      const bonus = correct && responseTimeMs <= BONUS_WINDOW_MS;

      const roundResult: RoundResult = { correct, responseTimeMs, bonus };
      const updatedResults = [...results, roundResult];

      setLastCorrect(correct);
      setLastBonus(bonus);
      setResults(updatedResults);
      setPhase('feedback');

      if (correct) {
        setScore(prev => prev + POINTS_CORRECT + (bonus ? POINTS_BONUS : 0));
      }

      timerRef.current = setTimeout(() => {
        const nextRound = round + 1;
        if (nextRound >= TOTAL_ROUNDS) {
          setPhase('complete');
          logResults(updatedResults);
        } else {
          startRound(nextRound);
        }
      }, 900);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [question, results, round, startRound]
  );

  // ── Persist results ──────────────────────────────────────────────────────

  const logResults = async (allResults: RoundResult[]) => {
    const correctCount = allResults.filter(r => r.correct).length;
    const accuracy = (correctCount / allResults.length) * 100;
    const avgTime =
      allResults.reduce((s, r) => s + r.responseTimeMs, 0) / allResults.length;
    const totalDuration = Date.now() - gameStartRef.current;

    try {
      const sessionId = await db.sessions.add({
        timestamp: new Date().toISOString(),
        module: 'cognition',
        duration: totalDuration,
        completionStatus: 'completed',
      });

      await db.drill_results.add({
        sessionId,
        timestamp: new Date().toISOString(),
        module: 'rhythm_count',
        difficulty: difficulty as 'easy' | 'medium' | 'hard',
        isCorrect: accuracy >= 70,
        timeToAnswer: avgTime,
        accuracy,
      });
    } catch (e) {
      console.error('Failed to log rhythm count results:', e);
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  // Setup screen
  if (phase === 'setup') {
    return (
      <div className="max-w-md mx-auto px-4 py-6 pb-24">
        <Button
          variant="ghost"
          onClick={onBack}
          className="mb-2 -ml-2 min-h-[44px]"
          aria-label="Back to games"
        >
          <ArrowLeft className="w-4 h-4 mr-1" aria-hidden="true" />
          Back to games
        </Button>

        <div className="flex items-center gap-2 mb-4">
          <Music className="w-6 h-6 text-primary" aria-hidden="true" />
          <h1 className="text-2xl font-bold">Rhythm Count</h1>
        </div>

        <p className="text-sm text-muted-foreground mb-6">
          Watch the sequence play with the beat, then pick the missing number.{' '}
          {TOTAL_ROUNDS} rounds. Answer fast for a bonus!
        </p>

        <div className="space-y-3 mb-6">
          {(Object.entries(DIFFICULTY_CONFIGS) as [
            'easy' | 'medium' | 'hard',
            DifficultyConfig
          ][]).map(([key, dcfg]) => (
            <button
              key={key}
              onClick={() => setDifficulty(key)}
              className={`w-full p-4 rounded-lg border text-left min-h-[44px] transition-colors ${
                difficulty === key
                  ? 'border-primary bg-primary/10'
                  : 'border-border hover:border-primary/50'
              }`}
              data-testid={`difficulty-${key}`}
            >
              <div className="font-medium">{dcfg.label}</div>
              <div className="text-xs text-muted-foreground">{dcfg.description}</div>
            </button>
          ))}
        </div>

        <Button
          onClick={startGame}
          className="w-full min-h-[48px] text-base font-bold"
          data-testid="start-game-btn"
        >
          Start Game
        </Button>
      </div>
    );
  }

  // Playing phase — animated beat sequence
  if (phase === 'playing' && question) {
    return (
      <div className="max-w-md mx-auto px-4 py-6 pb-24 text-center">
        <p className="text-xs text-muted-foreground mb-1" data-testid="round-counter">
          Round {round + 1}/{TOTAL_ROUNDS}
        </p>
        <p className="text-sm font-medium mb-1">Count by {question.step}s!</p>
        <p className="text-xs text-muted-foreground mb-4">Watch the beat...</p>

        {/* Central pulse */}
        <div className="flex items-center justify-center mb-6" aria-hidden="true">
          <div className="relative flex items-center justify-center">
            <div
              className={`absolute rounded-full bg-primary/20 transition-all duration-150 ${
                isPulsing ? 'w-40 h-40 opacity-100' : 'w-24 h-24 opacity-20'
              }`}
              data-testid="beat-pulse"
            />
            <span
              className="relative z-10 text-5xl font-extrabold text-primary"
              data-testid="current-beat-number"
            >
              {currentBeatIndex >= 0
                ? question.missingIndex === currentBeatIndex
                  ? '?'
                  : question.values[currentBeatIndex]
                : ''}
            </span>
          </div>
        </div>

        {/* Sequence dot row */}
        <div
          className="flex flex-wrap items-center justify-center gap-2"
          aria-label="Sequence progress"
          data-testid="sequence-row"
        >
          {question.values.map((val, i) => {
            const revealed = i <= currentBeatIndex;
            const isBlank = i === question.missingIndex;
            let cls =
              'w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold border-2 transition-all';

            if (!revealed) {
              cls += ' border-border bg-muted/30 text-transparent';
            } else if (i === currentBeatIndex) {
              cls += ' border-primary bg-primary/20 text-primary scale-110';
            } else if (isBlank) {
              cls += ' border-yellow-500 bg-yellow-500/10 text-yellow-600';
            } else {
              cls += ' border-border bg-muted text-foreground';
            }

            return (
              <div key={i} className={cls}>
                {revealed ? (isBlank ? '?' : val) : ''}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Answer phase — multiple choice
  if (phase === 'answer' && question) {
    return (
      <div className="max-w-md mx-auto px-4 py-6 pb-24 text-center">
        <p className="text-xs text-muted-foreground mb-1" data-testid="round-counter">
          Round {round + 1}/{TOTAL_ROUNDS}
        </p>
        <p className="text-sm font-medium mb-1">Count by {question.step}s!</p>
        <h2 className="text-lg font-bold mb-2">What is the missing number?</h2>

        {/* Sequence display (static) */}
        <div
          className="flex flex-wrap items-center justify-center gap-2 mb-6"
          data-testid="answer-sequence-row"
        >
          {question.values.map((val, i) => {
            const isBlank = i === question.missingIndex;
            const cls = `w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold border-2 ${
              isBlank
                ? 'border-primary bg-primary/20 text-primary border-dashed'
                : 'border-border bg-muted text-foreground'
            }`;
            return (
              <div key={i} className={cls} data-testid={`answer-pos-${i}`}>
                {isBlank ? '?' : val}
              </div>
            );
          })}
        </div>

        {/* Score */}
        <p className="text-xs text-muted-foreground mb-4">
          Score: {score} &bull; Answer within 3s for a bonus!
        </p>

        {/* Choices */}
        <div className="grid grid-cols-2 gap-3">
          {question.choices.map(choice => (
            <Button
              key={choice}
              onClick={() => handleAnswer(choice)}
              variant="outline"
              className="min-h-[56px] text-xl font-bold"
              data-testid={`choice-${choice}`}
            >
              {choice}
            </Button>
          ))}
        </div>
      </div>
    );
  }

  // Feedback phase
  if (phase === 'feedback' && question) {
    return (
      <div className="max-w-md mx-auto px-4 py-6 pb-24 text-center">
        <p className="text-xs text-muted-foreground mb-2" data-testid="round-counter">
          Round {round + 1}/{TOTAL_ROUNDS}
        </p>
        <div
          className={`text-4xl font-bold mb-2 ${lastCorrect ? 'text-green-500' : 'text-red-500'}`}
          data-testid="feedback-result"
        >
          {lastCorrect ? 'Correct!' : 'Incorrect'}
        </div>
        {lastBonus && lastCorrect && (
          <p className="text-sm text-yellow-500 font-semibold mb-1" data-testid="bonus-indicator">
            +50 Speed Bonus!
          </p>
        )}
        {!lastCorrect && (
          <p className="text-sm text-muted-foreground" data-testid="correct-answer-reveal">
            The answer was {question.correctAnswer}
          </p>
        )}
        <p className="text-sm font-medium mt-2">Score: {score}</p>
      </div>
    );
  }

  // Complete screen
  if (phase === 'complete') {
    const correctCount = results.filter(r => r.correct).length;
    const accuracy = Math.round((correctCount / results.length) * 100);
    const avgTime = results.reduce((s, r) => s + r.responseTimeMs, 0) / results.length;

    return (
      <div className="max-w-md mx-auto px-4 py-6 pb-24">
        <h2 className="text-2xl font-bold text-center mb-4">Game Complete!</h2>
        <p className="text-center text-sm text-muted-foreground mb-4">
          {getEncouragement(accuracy)}
        </p>

        <Card className="mb-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Score:</span>
              <span className="font-bold">{score}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Correct:</span>
              <span className="font-medium">{correctCount}/{TOTAL_ROUNDS}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Accuracy:</span>
              <span className="font-medium">{accuracy}%</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Avg Response:</span>
              <span className="font-medium">{(avgTime / 1000).toFixed(1)}s</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Difficulty:</span>
              <span className="font-medium">{DIFFICULTY_CONFIGS[difficulty].label}</span>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={startGame}
            className="flex-1 min-h-[44px]"
            data-testid="play-again-btn"
          >
            Play Again
          </Button>
          <Button
            onClick={onBack}
            className="flex-1 min-h-[44px]"
            data-testid="back-to-games-btn"
          >
            Back to Games
          </Button>
        </div>
      </div>
    );
  }

  return null;
}
