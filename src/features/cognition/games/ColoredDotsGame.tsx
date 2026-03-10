// ColoredDotsGame — Brain game version (10 rounds, scoring, difficulty selector)
// Uses variable dot sizes with random distribution for visual variety
// Saves results to drill_results with module 'colored_dots'

import { useState, useCallback, useRef, useEffect } from 'react';
import { ArrowLeft, Eye } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { db } from '@/services/storage/db';
import type { DotSize } from '@/features/self-discovery/types';

interface ColoredDotsGameProps {
  onBack: () => void;
}

const COLORS = [
  { hex: '#E87461', name: 'Coral' },
  { hex: '#5B8DEF', name: 'Blue' },
  { hex: '#A8E6CF', name: 'Mint' },
  { hex: '#FFD56F', name: 'Yellow' },
];

interface DifficultyConfig {
  label: string;
  colorCount: 2 | 3 | 4;
  minDots: number;
  maxDots: number;
  displayTimeMs: number;
}

const DIFFICULTY_CONFIGS: Record<string, DifficultyConfig> = {
  easy: { label: 'Easy', colorCount: 2, minDots: 8, maxDots: 14, displayTimeMs: 3000 },
  medium: { label: 'Medium', colorCount: 3, minDots: 14, maxDots: 22, displayTimeMs: 2000 },
  hard: { label: 'Hard', colorCount: 4, minDots: 22, maxDots: 35, displayTimeMs: 1500 },
};

/** Dot size definitions in pixels */
const DOT_RADII: Record<DotSize, number> = {
  small: 5,
  normal: 8,
  large: 12,
};

interface GameDot {
  x: number;
  y: number;
  color: string;
  colorName: string;
  radius: number;
  size: DotSize;
}

interface RoundResult { correct: boolean; responseTimeMs: number }

/** Duration of the visual interference/masking screen in ms */
const MASK_DURATION_MS = 500;

/** Adaptive speed: correct → 20% faster, wrong → 20% slower (back toward base) */
const SPEED_UP_FACTOR = 0.8;
const SLOW_DOWN_FACTOR = 1.2;
/** Fastest display time — below this you can't even see the dots */
const MIN_DISPLAY_MS = 400;

type Phase = 'setup' | 'display' | 'mask' | 'answer' | 'feedback' | 'complete';

const TOTAL_ROUNDS = 10;

/** TV static pixel size */
const STATIC_PIXEL = 10;
const STATIC_COLS = Math.floor(300 / STATIC_PIXEL);
const STATIC_ROWS = Math.floor(300 / STATIC_PIXEL);

/** Generate TV-static pixel data using the active test colors */
function generateStaticPixels(colorCount: 2 | 3 | 4): { x: number; y: number; color: string }[] {
  const activeColors = COLORS.slice(0, colorCount);
  const pixels: { x: number; y: number; color: string }[] = [];
  for (let row = 0; row < STATIC_ROWS; row++) {
    for (let col = 0; col < STATIC_COLS; col++) {
      pixels.push({
        x: col * STATIC_PIXEL,
        y: row * STATIC_PIXEL,
        color: activeColors[Math.floor(Math.random() * activeColors.length)].hex,
      });
    }
  }
  return pixels;
}

/** Pick a random dot size: 25% small, 50% normal, 25% large */
function pickRandomSize(): { radius: number; size: DotSize } {
  const r = Math.random();
  if (r < 0.25) return { radius: DOT_RADII.small, size: 'small' };
  if (r < 0.75) return { radius: DOT_RADII.normal, size: 'normal' };
  return { radius: DOT_RADII.large, size: 'large' };
}

function generateDots(config: DifficultyConfig) {
  const activeColors = COLORS.slice(0, config.colorCount);
  const totalDots = config.minDots + Math.floor(Math.random() * (config.maxDots - config.minDots + 1));
  const winnerIdx = Math.floor(Math.random() * activeColors.length);
  const margin2 = 2 + Math.floor(Math.random() * 3);

  const basePer = Math.floor((totalDots - margin2) / activeColors.length);
  const counts: Record<string, number> = {};
  let assigned = 0;

  for (let i = 0; i < activeColors.length; i++) {
    counts[activeColors[i].name] = basePer;
    assigned += basePer;
  }
  counts[activeColors[winnerIdx].name] += margin2;
  assigned += margin2;

  let remainder = totalDots - assigned;
  let idx = 0;
  while (remainder > 0) {
    if (idx !== winnerIdx) { counts[activeColors[idx].name]++; remainder--; }
    idx = (idx + 1) % activeColors.length;
    if (idx === winnerIdx) idx = (idx + 1) % activeColors.length;
  }

  const dots: GameDot[] = [];
  const maxRadius = DOT_RADII.large;
  const W = 300, H = 300;
  const pad = maxRadius + 4;
  const minDistance = maxRadius * 2.5;

  for (const color of activeColors) {
    for (let i = 0; i < counts[color.name]; i++) {
      const { radius, size } = pickRandomSize();
      let placed = false;
      for (let a = 0; a < 200; a++) {
        const x = pad + Math.random() * (W - 2 * pad);
        const y = pad + Math.random() * (H - 2 * pad);
        if (!dots.some(d => Math.hypot(d.x - x, d.y - y) < minDistance)) {
          dots.push({ x, y, color: color.hex, colorName: color.name, radius, size });
          placed = true;
          break;
        }
      }
      if (!placed) {
        const cols = Math.ceil(Math.sqrt(totalDots));
        const gi = dots.length;
        dots.push({
          x: pad + ((gi % cols) + 0.5) * ((W - 2 * pad) / cols),
          y: pad + (Math.floor(gi / cols) + 0.5) * ((H - 2 * pad) / Math.ceil(totalDots / cols)),
          color: color.hex,
          colorName: color.name,
          radius,
          size,
        });
      }
    }
  }

  for (let i = dots.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [dots[i], dots[j]] = [dots[j], dots[i]];
  }

  return { dots, correctColor: activeColors[winnerIdx].name };
}

export default function ColoredDotsGame({ onBack }: ColoredDotsGameProps) {
  const [difficulty, setDifficulty] = useState<string>('medium');
  const [phase, setPhase] = useState<Phase>('setup');
  const [round, setRound] = useState(0);
  const [dots, setDots] = useState<GameDot[]>([]);
  const [correctColor, setCorrectColor] = useState('');
  const [results, setResults] = useState<RoundResult[]>([]);
  const [staticPixels, setStaticPixels] = useState<{ x: number; y: number; color: string }[]>([]);
  const [lastCorrect, setLastCorrect] = useState(false);
  const [currentDisplayMs, setCurrentDisplayMs] = useState(0);
  const answerStartRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const gameStartRef = useRef(0);

  const config = DIFFICULTY_CONFIGS[difficulty];
  const activeColors = COLORS.slice(0, config.colorCount);

  useEffect(() => {
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, []);

  const startRound = useCallback((displayMs?: number) => {
    const displayTime = displayMs ?? config.displayTimeMs;
    const { dots: newDots, correctColor: correct } = generateDots(config);
    setDots(newDots);
    setCorrectColor(correct);
    setCurrentDisplayMs(displayTime);
    setPhase('display');

    timerRef.current = setTimeout(() => {
      // Show TV static to disrupt afterimage before asking for answer
      setStaticPixels(generateStaticPixels(config.colorCount));
      setPhase('mask');

      timerRef.current = setTimeout(() => {
        setPhase('answer');
        answerStartRef.current = performance.now();
      }, MASK_DURATION_MS);
    }, displayTime);
  }, [config]);

  const startGame = () => {
    setResults([]);
    setRound(0);
    gameStartRef.current = performance.now();
    startRound(config.displayTimeMs);
  };

  const handleAnswer = (colorName: string) => {
    const responseTime = performance.now() - answerStartRef.current;
    const correct = colorName === correctColor;
    setLastCorrect(correct);
    setResults(prev => [...prev, { correct, responseTimeMs: responseTime }]);
    setPhase('feedback');

    // Adaptive speed: correct → faster, wrong → slower (back toward base)
    const nextDisplayMs = correct
      ? Math.max(MIN_DISPLAY_MS, Math.round(currentDisplayMs * SPEED_UP_FACTOR))
      : Math.min(config.displayTimeMs, Math.round(currentDisplayMs * SLOW_DOWN_FACTOR));

    timerRef.current = setTimeout(() => {
      const nextRound = round + 1;
      if (nextRound >= TOTAL_ROUNDS) {
        setPhase('complete');
        logResults([...results, { correct, responseTimeMs: responseTime }]);
      } else {
        setRound(nextRound);
        startRound(nextDisplayMs);
      }
    }, 800);
  };

  const logResults = async (allResults: RoundResult[]) => {
    const correctCount = allResults.filter(r => r.correct).length;
    const accuracy = (correctCount / allResults.length) * 100;
    const avgTime = allResults.reduce((s, r) => s + r.responseTimeMs, 0) / allResults.length;

    try {
      // Create a session for the game
      const sessionId = await db.sessions.add({
        timestamp: new Date().toISOString(),
        module: 'cognition',
        duration: performance.now() - gameStartRef.current,
        completionStatus: 'completed',
      });

      await db.drill_results.add({
        sessionId,
        timestamp: new Date().toISOString(),
        module: 'colored_dots',
        difficulty: difficulty as 'easy' | 'medium' | 'hard',
        isCorrect: accuracy >= 70,
        timeToAnswer: avgTime,
        accuracy,
      });

      await db.telemetry_logs.add({
        timestamp: new Date().toISOString(),
        event: 'cognition_game_complete',
        module: 'colored_dots',
        data: { difficulty, rounds: TOTAL_ROUNDS, correctCount, accuracy, avgResponseTimeMs: avgTime },
        userId: 'local_user',
      });
    } catch (e) {
      console.error('Failed to log colored dots results:', e);
    }
  };

  // Setup
  if (phase === 'setup') {
    return (
      <div className="max-w-md mx-auto px-4 py-6 pb-24">
        <Button variant="ghost" onClick={onBack} className="mb-2 -ml-2 min-h-[44px]" aria-label="Back to games">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to games
        </Button>
        <div className="flex items-center gap-2 mb-4">
          <Eye className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold">Colored Dots</h1>
        </div>
        <p className="text-sm text-muted-foreground mb-6">
          Dots flash briefly. Pick the most common color. {TOTAL_ROUNDS} rounds.
        </p>

        <div className="space-y-3 mb-6">
          {Object.entries(DIFFICULTY_CONFIGS).map(([key, cfg]) => (
            <button
              key={key}
              onClick={() => setDifficulty(key)}
              className={`w-full p-4 rounded-lg border text-left min-h-[44px] transition-colors ${
                difficulty === key ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'
              }`}
            >
              <div className="font-medium">{cfg.label}</div>
              <div className="text-xs text-muted-foreground">
                {cfg.colorCount} colors, {cfg.minDots}-{cfg.maxDots} dots, {cfg.displayTimeMs / 1000}s
              </div>
            </button>
          ))}
        </div>

        <Button onClick={startGame} className="w-full min-h-[48px] text-base font-bold">
          Start Game
        </Button>
      </div>
    );
  }

  // Display phase
  if (phase === 'display') {
    return (
      <div className="max-w-md mx-auto px-4 py-6 pb-24 text-center">
        <p className="text-xs text-muted-foreground mb-2">Round {round + 1}/{TOTAL_ROUNDS}</p>
        <p className="text-sm mb-1">Watch carefully...</p>
        <p className="text-xs text-muted-foreground mb-3">{(currentDisplayMs / 1000).toFixed(1)}s</p>
        <svg viewBox="0 0 300 300" className="w-full max-w-[300px] mx-auto bg-muted/30 rounded-lg" role="img" aria-label="Colored dots">
          {dots.map((d, i) => <circle key={i} cx={d.x} cy={d.y} r={d.radius} fill={d.color} />)}
        </svg>
      </div>
    );
  }

  // Masking phase (TV static disrupts afterimage)
  if (phase === 'mask') {
    return (
      <div className="max-w-md mx-auto px-4 py-6 pb-24 text-center">
        <p className="text-xs text-muted-foreground mb-2">Round {round + 1}/{TOTAL_ROUNDS}</p>
        <p className="text-sm mb-4">&nbsp;</p>
        <svg viewBox="0 0 300 300" className="w-full max-w-[300px] mx-auto rounded-lg" role="img" aria-label="Visual mask">
          {staticPixels.map((p, i) => <rect key={i} x={p.x} y={p.y} width={STATIC_PIXEL} height={STATIC_PIXEL} fill={p.color} />)}
        </svg>
      </div>
    );
  }

  // Answer phase
  if (phase === 'answer') {
    return (
      <div className="max-w-md mx-auto px-4 py-6 pb-24 text-center">
        <p className="text-xs text-muted-foreground mb-1">Round {round + 1}/{TOTAL_ROUNDS}</p>
        <h2 className="text-lg font-bold mb-4">Which color had the most dots?</h2>
        <div className="grid grid-cols-2 gap-3">
          {activeColors.map(c => (
            <Button key={c.name} onClick={() => handleAnswer(c.name)} variant="outline" className="min-h-[56px] text-base flex items-center gap-2">
              <span className="w-5 h-5 rounded-full shrink-0" style={{ backgroundColor: c.hex }} />
              {c.name}
            </Button>
          ))}
        </div>
      </div>
    );
  }

  // Feedback
  if (phase === 'feedback') {
    return (
      <div className="max-w-md mx-auto px-4 py-6 pb-24 text-center">
        <p className="text-xs text-muted-foreground mb-2">Round {round + 1}/{TOTAL_ROUNDS}</p>
        <div className={`text-4xl mb-2 ${lastCorrect ? 'text-green-500' : 'text-red-500'}`}>
          {lastCorrect ? 'Correct!' : 'Incorrect'}
        </div>
        {!lastCorrect && (
          <p className="text-sm text-muted-foreground">The answer was {correctColor}</p>
        )}
      </div>
    );
  }

  // Complete
  if (phase === 'complete') {
    const correctCount = results.filter(r => r.correct).length;
    const accuracy = Math.round((correctCount / results.length) * 100);
    const avgTime = results.reduce((s, r) => s + r.responseTimeMs, 0) / results.length;

    return (
      <div className="max-w-md mx-auto px-4 py-6 pb-24">
        <h2 className="text-2xl font-bold text-center mb-4">Game Complete!</h2>

        <Card className="mb-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Score</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
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
          <Button variant="outline" onClick={startGame} className="flex-1 min-h-[44px]">
            Play Again
          </Button>
          <Button onClick={onBack} className="flex-1 min-h-[44px]">
            Back to games
          </Button>
        </div>
      </div>
    );
  }

  return null;
}
