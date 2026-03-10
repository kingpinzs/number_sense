// ColoredDotsTest — Visual processing test for subitizing, selective attention, & size-quantity bias
// 6 rounds: 2 uniform (all same size), 2 varied (random sizes), 2 biased (runner-up gets large dots)
// Detects if larger dots trick you into thinking a color has more dots than it does
// Each round: Phase 1 (brief display → pick from memory) → Phase 2 (static → verify)

import { useState, useCallback, useRef, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import type { ColoredDot, ColoredDotsDifficulty, ColoredDotsRoundResult, SizeMode, DotSize, ColorSizeStats } from '../types';

interface ColoredDotsTestProps {
  onBack: () => void;
}

/** Color palette with accessible names */
const COLORS = [
  { hex: '#E87461', name: 'Coral' },
  { hex: '#5B8DEF', name: 'Blue' },
  { hex: '#A8E6CF', name: 'Mint' },
  { hex: '#FFD56F', name: 'Yellow' },
];

/** Dot size definitions in pixels */
const DOT_RADII: Record<DotSize, number> = {
  small: 5,
  normal: 8,
  large: 12,
};

const DIFFICULTY_CONFIGS: Record<string, ColoredDotsDifficulty> = {
  easy: { label: 'Easy', colorCount: 2, minDots: 8, maxDots: 14, displayTimeMs: 3000 },
  medium: { label: 'Medium', colorCount: 3, minDots: 14, maxDots: 22, displayTimeMs: 2000 },
  hard: { label: 'Hard', colorCount: 4, minDots: 22, maxDots: 35, displayTimeMs: 1500 },
};

/** The 6-round sequence: 2 uniform (baseline), 2 varied, 2 biased (deceptive) */
const ROUND_SIZE_MODES: SizeMode[] = ['uniform', 'uniform', 'varied', 'varied', 'biased', 'biased'];
const TOTAL_ROUNDS = ROUND_SIZE_MODES.length;

/** Duration of the visual interference/masking screen in ms */
const MASK_DURATION_MS = 500;

/** Adaptive speed: correct → 20% faster, wrong → 20% slower (back toward base) */
const SPEED_UP_FACTOR = 0.8;
const SLOW_DOWN_FACTOR = 1.2;
/** Fastest display time — below this you can't even see the dots */
const MIN_DISPLAY_MS = 400;

type TestPhase = 'setup' | 'phase1-display' | 'mask' | 'phase1-answer' | 'phase2-display' | 'phase2-answer' | 'round-feedback' | 'results';

/** Pick a dot size based on size mode, color role (winner/runner-up/other), and randomness */
function pickDotSize(sizeMode: SizeMode, isWinner: boolean, isRunnerUp: boolean): { radius: number; size: DotSize } {
  if (sizeMode === 'uniform') {
    return { radius: DOT_RADII.normal, size: 'normal' };
  }

  if (sizeMode === 'varied') {
    // Random distribution: 25% small, 50% normal, 25% large
    const r = Math.random();
    if (r < 0.25) return { radius: DOT_RADII.small, size: 'small' };
    if (r < 0.75) return { radius: DOT_RADII.normal, size: 'normal' };
    return { radius: DOT_RADII.large, size: 'large' };
  }

  // sizeMode === 'biased' — runner-up gets mostly large, winner gets mostly small
  if (isRunnerUp) {
    const r = Math.random();
    if (r < 0.75) return { radius: DOT_RADII.large, size: 'large' };
    return { radius: DOT_RADII.normal, size: 'normal' };
  }
  if (isWinner) {
    const r = Math.random();
    if (r < 0.60) return { radius: DOT_RADII.small, size: 'small' };
    return { radius: DOT_RADII.normal, size: 'normal' };
  }
  // Other colors: mix
  const r = Math.random();
  if (r < 0.3) return { radius: DOT_RADII.small, size: 'small' };
  if (r < 0.7) return { radius: DOT_RADII.normal, size: 'normal' };
  return { radius: DOT_RADII.large, size: 'large' };
}

/** Generate dots with size variation based on sizeMode */
function generateDots(config: ColoredDotsDifficulty, sizeMode: SizeMode): {
  dots: ColoredDot[];
  correctColor: string;
  runnerUpColor: string;
  counts: Record<string, number>;
  sizeStats: Record<string, ColorSizeStats>;
  largestDotColor: string;
} {
  const activeColors = COLORS.slice(0, config.colorCount);
  const totalDots = config.minDots + Math.floor(Math.random() * (config.maxDots - config.minDots + 1));

  // Winner has 2-4 more dots than runner-up
  const winnerIdx = Math.floor(Math.random() * activeColors.length);
  const margin = 2 + Math.floor(Math.random() * 3);

  // Distribute dot counts
  const basePer = Math.floor((totalDots - margin) / activeColors.length);
  const counts: Record<string, number> = {};

  let assigned = 0;
  for (let i = 0; i < activeColors.length; i++) {
    counts[activeColors[i].name] = basePer;
    assigned += basePer;
  }
  counts[activeColors[winnerIdx].name] += margin;
  assigned += margin;

  let remainder = totalDots - assigned;
  let idx = 0;
  while (remainder > 0) {
    if (idx !== winnerIdx) {
      counts[activeColors[idx].name]++;
      remainder--;
    }
    idx = (idx + 1) % activeColors.length;
    if (idx === winnerIdx) idx = (idx + 1) % activeColors.length;
  }

  // Find runner-up (second highest count)
  const sorted = Object.entries(counts).sort(([, a], [, b]) => b - a);
  const runnerUpColor = sorted[1][0];

  // Generate dots with positions and sizes
  const dots: ColoredDot[] = [];
  const maxRadius = DOT_RADII.large;
  const canvasW = 300;
  const canvasH = 300;
  const minDistance = maxRadius * 2.5; // Use largest radius for spacing
  const pad = maxRadius + 4;

  // Track size stats per color
  const sizeStats: Record<string, ColorSizeStats> = {};
  for (const c of activeColors) {
    sizeStats[c.name] = { total: 0, small: 0, normal: 0, large: 0 };
  }

  for (const color of activeColors) {
    const count = counts[color.name];
    const isWinner = color.name === activeColors[winnerIdx].name;
    const isRunnerUp = color.name === runnerUpColor;

    for (let i = 0; i < count; i++) {
      const { radius, size } = pickDotSize(sizeMode, isWinner, isRunnerUp);

      let placed = false;
      for (let attempt = 0; attempt < 200; attempt++) {
        const x = pad + Math.random() * (canvasW - 2 * pad);
        const y = pad + Math.random() * (canvasH - 2 * pad);
        const overlaps = dots.some(d => Math.hypot(d.x - x, d.y - y) < minDistance);
        if (!overlaps) {
          dots.push({ x, y, color: color.hex, colorName: color.name, radius, size });
          placed = true;
          break;
        }
      }
      // Grid fallback
      if (!placed) {
        const cols = Math.ceil(Math.sqrt(totalDots));
        const gridIdx = dots.length;
        const col = gridIdx % cols;
        const row = Math.floor(gridIdx / cols);
        dots.push({
          x: pad + (col + 0.5) * ((canvasW - 2 * pad) / cols),
          y: pad + (row + 0.5) * ((canvasH - 2 * pad) / Math.ceil(totalDots / cols)),
          color: color.hex,
          colorName: color.name,
          radius,
          size,
        });
      }

      sizeStats[color.name].total++;
      sizeStats[color.name][size]++;
    }
  }

  // Shuffle dot render order
  for (let i = dots.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [dots[i], dots[j]] = [dots[j], dots[i]];
  }

  // Find which color has the most large dots
  let maxLarge = 0;
  let largestDotColor = activeColors[0].name;
  for (const [colorName, stats] of Object.entries(sizeStats)) {
    if (stats.large > maxLarge) {
      maxLarge = stats.large;
      largestDotColor = colorName;
    }
  }

  return { dots, correctColor: activeColors[winnerIdx].name, runnerUpColor, counts, sizeStats, largestDotColor };
}

/** TV static pixel size */
const STATIC_PIXEL = 10;
/** Number of columns/rows in the static grid */
const STATIC_COLS = Math.floor(300 / STATIC_PIXEL);
const STATIC_ROWS = Math.floor(300 / STATIC_PIXEL);

/** Generate TV-static pixel data — a grid of randomly colored pixels using the active test colors */
function generateStaticPixels(colorCount: 2 | 3 | 4): { x: number; y: number; color: string }[] {
  const activeColors = COLORS.slice(0, colorCount);
  const pixels: { x: number; y: number; color: string }[] = [];
  for (let row = 0; row < STATIC_ROWS; row++) {
    for (let col = 0; col < STATIC_COLS; col++) {
      const color = activeColors[Math.floor(Math.random() * activeColors.length)];
      pixels.push({
        x: col * STATIC_PIXEL,
        y: row * STATIC_PIXEL,
        color: color.hex,
      });
    }
  }
  return pixels;
}

export default function ColoredDotsTest({ onBack }: ColoredDotsTestProps) {
  const [difficulty, setDifficulty] = useState<string>('medium');
  const [phase, setPhase] = useState<TestPhase>('setup');
  const [round, setRound] = useState(0);
  const [dots, setDots] = useState<ColoredDot[]>([]);
  const [correctColor, setCorrectColor] = useState('');
  const [dotCounts, setDotCounts] = useState<Record<string, number>>({});
  const [currentSizeStats, setCurrentSizeStats] = useState<Record<string, ColorSizeStats>>({});
  const [currentSizeMode, setCurrentSizeMode] = useState<SizeMode>('uniform');
  const [currentLargestDotColor, setCurrentLargestDotColor] = useState('');
  const [phase1Answer, setPhase1Answer] = useState<string | null>(null);
  const [staticPixels, setStaticPixels] = useState<{ x: number; y: number; color: string }[]>([]);
  const phase1StartRef = useRef(0);
  const phase2StartRef = useRef(0);
  const [phase1Time, setPhase1Time] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [allResults, setAllResults] = useState<ColoredDotsRoundResult[]>([]);
  const [currentDisplayMs, setCurrentDisplayMs] = useState(0);

  const config = DIFFICULTY_CONFIGS[difficulty];
  const activeColors = COLORS.slice(0, config.colorCount);

  const startRound = useCallback((roundIdx: number, displayMs?: number) => {
    const displayTime = displayMs ?? config.displayTimeMs;
    const sizeMode = ROUND_SIZE_MODES[roundIdx];
    const { dots: newDots, correctColor: correct, counts, sizeStats, largestDotColor } = generateDots(config, sizeMode);
    setDots(newDots);
    setCorrectColor(correct);
    setDotCounts(counts);
    setCurrentSizeStats(sizeStats);
    setCurrentSizeMode(sizeMode);
    setCurrentLargestDotColor(largestDotColor);
    setPhase1Answer(null);
    setCurrentDisplayMs(displayTime);
    setPhase('phase1-display');

    timerRef.current = setTimeout(() => {
      // Show TV static to disrupt afterimage before asking for answer
      setStaticPixels(generateStaticPixels(config.colorCount));
      setPhase('mask');

      timerRef.current = setTimeout(() => {
        setPhase('phase1-answer');
        phase1StartRef.current = performance.now();
      }, MASK_DURATION_MS);
    }, displayTime);
  }, [config]);

  const startTest = useCallback(() => {
    setAllResults([]);
    setRound(0);
    startRound(0, config.displayTimeMs);
  }, [startRound, config.displayTimeMs]);

  useEffect(() => {
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, []);

  const handlePhase1Answer = (colorName: string) => {
    setPhase1Answer(colorName);
    setPhase1Time(performance.now() - phase1StartRef.current);
    setPhase('phase2-display');
    phase2StartRef.current = performance.now();
  };

  const handlePhase2Answer = (colorName: string) => {
    const p2Time = performance.now() - phase2StartRef.current;

    // Build result for this round
    const roundResult: ColoredDotsRoundResult = {
      correctColor,
      phase1Answer,
      phase2Answer: colorName,
      phase1Correct: phase1Answer === correctColor,
      phase2Correct: colorName === correctColor,
      phase1ResponseTimeMs: phase1Time,
      phase2ResponseTimeMs: p2Time,
      dotCounts,
      sizeStats: currentSizeStats,
      sizeMode: currentSizeMode,
      largestDotColor: currentLargestDotColor,
      pickedLargestDotColor: phase1Answer === currentLargestDotColor && currentLargestDotColor !== correctColor,
      difficulty,
    };

    const updatedResults = [...allResults, roundResult];
    setAllResults(updatedResults);

    // Adaptive speed: correct → faster, wrong → slower (back toward base)
    const wasCorrect = phase1Answer === correctColor;
    const nextDisplayMs = wasCorrect
      ? Math.max(MIN_DISPLAY_MS, Math.round(currentDisplayMs * SPEED_UP_FACTOR))
      : Math.min(config.displayTimeMs, Math.round(currentDisplayMs * SLOW_DOWN_FACTOR));

    // Show brief feedback, then advance
    setPhase('round-feedback');
    timerRef.current = setTimeout(() => {
      const nextRound = round + 1;
      if (nextRound >= TOTAL_ROUNDS) {
        setPhase('results');
      } else {
        setRound(nextRound);
        startRound(nextRound, nextDisplayMs);
      }
    }, 1200);
  };

  // --- SETUP ---
  if (phase === 'setup') {
    return (
      <div className="max-w-md mx-auto px-4 py-6 pb-24">
        <Button variant="ghost" onClick={onBack} className="mb-2 -ml-2 min-h-[44px]" aria-label="Back to self-discovery">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back
        </Button>
        <h1 className="text-2xl font-bold mb-2">Colored Dots Test</h1>
        <p className="text-sm text-muted-foreground mb-2">
          You&apos;ll see colored dots briefly. Pick which color appears most.
        </p>
        <p className="text-sm text-muted-foreground mb-6">
          {TOTAL_ROUNDS} rounds test whether dot size affects your perception of quantity.
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
                {cfg.colorCount} colors, {cfg.minDots}-{cfg.maxDots} dots, {cfg.displayTimeMs / 1000}s display
              </div>
            </button>
          ))}
        </div>

        <Button onClick={startTest} className="w-full min-h-[48px] text-base font-bold">
          Start Test
        </Button>
      </div>
    );
  }

  // --- PHASE 1: BRIEF DISPLAY ---
  if (phase === 'phase1-display') {
    return (
      <div className="max-w-md mx-auto px-4 py-6 pb-24 text-center">
        <p className="text-xs text-muted-foreground mb-1">Round {round + 1}/{TOTAL_ROUNDS}</p>
        <p className="text-sm text-muted-foreground mb-1">Watch carefully...</p>
        <p className="text-xs text-muted-foreground mb-3">{(currentDisplayMs / 1000).toFixed(1)}s</p>
        <DotCanvas dots={dots} />
      </div>
    );
  }

  // --- MASKING SCREEN (TV static disrupts afterimage) ---
  if (phase === 'mask') {
    return (
      <div className="max-w-md mx-auto px-4 py-6 pb-24 text-center">
        <p className="text-xs text-muted-foreground mb-1">Round {round + 1}/{TOTAL_ROUNDS}</p>
        <p className="text-sm text-muted-foreground mb-4">&nbsp;</p>
        <StaticCanvas pixels={staticPixels} />
      </div>
    );
  }

  // --- PHASE 1: ANSWER (dots hidden) ---
  if (phase === 'phase1-answer') {
    return (
      <div className="max-w-md mx-auto px-4 py-6 pb-24 text-center">
        <p className="text-xs text-muted-foreground mb-1">Round {round + 1}/{TOTAL_ROUNDS}</p>
        <h2 className="text-xl font-bold mb-2">Which color had the most dots?</h2>
        <p className="text-sm text-muted-foreground mb-6">Pick from memory</p>
        <div className="grid grid-cols-2 gap-3">
          {activeColors.map(color => (
            <Button key={color.name} onClick={() => handlePhase1Answer(color.name)} variant="outline" className="min-h-[56px] text-base font-medium flex items-center gap-2">
              <span className="w-5 h-5 rounded-full shrink-0" style={{ backgroundColor: color.hex }} />
              {color.name}
            </Button>
          ))}
        </div>
      </div>
    );
  }

  // --- PHASE 2: STATIC DISPLAY + ANSWER ---
  if (phase === 'phase2-display') {
    return (
      <div className="max-w-md mx-auto px-4 py-6 pb-24 text-center">
        <p className="text-xs text-muted-foreground mb-1">Round {round + 1}/{TOTAL_ROUNDS}</p>
        <p className="text-sm text-muted-foreground mb-2">Now look again — which color has the most?</p>
        <DotCanvas dots={dots} />
        <div className="grid grid-cols-2 gap-3 mt-4">
          {activeColors.map(color => (
            <Button key={color.name} onClick={() => handlePhase2Answer(color.name)} variant="outline" className="min-h-[56px] text-base font-medium flex items-center gap-2">
              <span className="w-5 h-5 rounded-full shrink-0" style={{ backgroundColor: color.hex }} />
              {color.name}
            </Button>
          ))}
        </div>
      </div>
    );
  }

  // --- ROUND FEEDBACK ---
  if (phase === 'round-feedback') {
    const wasCorrect = phase1Answer === correctColor;
    return (
      <div className="max-w-md mx-auto px-4 py-6 pb-24 text-center">
        <p className="text-xs text-muted-foreground mb-2">Round {round + 1}/{TOTAL_ROUNDS}</p>
        <div className={`text-3xl font-bold mb-2 ${wasCorrect ? 'text-green-500' : 'text-red-500'}`}>
          {wasCorrect ? 'Correct!' : 'Incorrect'}
        </div>
        {!wasCorrect && (
          <p className="text-sm text-muted-foreground">The answer was {correctColor}</p>
        )}
      </div>
    );
  }

  // --- FINAL RESULTS ---
  if (phase === 'results') {
    const uniformResults = allResults.filter(r => r.sizeMode === 'uniform');
    const variedResults = allResults.filter(r => r.sizeMode === 'varied');
    const biasedResults = allResults.filter(r => r.sizeMode === 'biased');

    const uniformCorrect = uniformResults.filter(r => r.phase1Correct).length;
    const variedCorrect = variedResults.filter(r => r.phase1Correct).length;
    const biasedCorrect = biasedResults.filter(r => r.phase1Correct).length;

    // Size bias detection: in biased rounds, did user pick the color with large dots (not the actual winner)?
    const sizeBiasCount = biasedResults.filter(r => r.pickedLargestDotColor).length;
    const hasSizeBias = sizeBiasCount > 0;

    // Also check if varied rounds showed the same pattern
    const variedSizeBias = variedResults.filter(r =>
      r.phase1Answer === r.largestDotColor && r.largestDotColor !== r.correctColor
    ).length;

    return (
      <div className="max-w-md mx-auto px-4 py-6 pb-24">
        <h2 className="text-2xl font-bold mb-4 text-center">Test Results</h2>

        {/* Accuracy by size mode */}
        <Card className="mb-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Accuracy by Dot Size Mode</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Uniform (all same size)</span>
                <span className="font-medium">{uniformCorrect}/{uniformResults.length}</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-green-500 rounded-full" style={{ width: `${uniformResults.length > 0 ? (uniformCorrect / uniformResults.length) * 100 : 0}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Varied (random sizes)</span>
                <span className="font-medium">{variedCorrect}/{variedResults.length}</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: `${variedResults.length > 0 ? (variedCorrect / variedResults.length) * 100 : 0}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Size-biased (deceptive)</span>
                <span className="font-medium">{biasedCorrect}/{biasedResults.length}</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full" style={{ width: `${biasedResults.length > 0 ? (biasedCorrect / biasedResults.length) * 100 : 0}%` }} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Size Bias Analysis */}
        <Card className="mb-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Size-Quantity Bias Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            {hasSizeBias ? (
              <div className="space-y-2">
                <p className="text-sm text-red-500 font-medium">
                  Size bias detected in {sizeBiasCount} of {biasedResults.length} deceptive rounds
                </p>
                <p className="text-sm text-muted-foreground">
                  You picked the color with larger dots instead of the color with more dots.
                  This suggests your brain weighs visual area (dot size) when estimating quantity.
                </p>
                {variedSizeBias > 0 && (
                  <p className="text-sm text-muted-foreground">
                    This also happened in {variedSizeBias} varied round(s), reinforcing the pattern.
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-green-500 font-medium">
                  No size bias detected
                </p>
                <p className="text-sm text-muted-foreground">
                  You correctly counted dots regardless of their size. Your brain separates
                  visual area from quantity effectively.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Per-round detail */}
        <Card className="mb-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Round Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {allResults.map((r, i) => {
                const modeLabel = r.sizeMode === 'uniform' ? 'Uniform' : r.sizeMode === 'varied' ? 'Varied' : 'Biased';
                return (
                  <div key={i} className="border-b border-border/50 pb-2 last:border-0 last:pb-0">
                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                      <span>Round {i + 1} ({modeLabel})</span>
                      <span className={r.phase1Correct ? 'text-green-500' : 'text-red-500'}>
                        {r.phase1Correct ? 'Correct' : 'Incorrect'}
                      </span>
                    </div>
                    <div className="flex gap-2 text-xs">
                      {Object.entries(r.dotCounts)
                        .sort(([, a], [, b]) => b - a)
                        .map(([colorName, count]) => {
                          const color = COLORS.find(c => c.name === colorName);
                          const stats = r.sizeStats[colorName];
                          return (
                            <div key={colorName} className="flex items-center gap-1">
                              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color?.hex }} />
                              <span>{count}</span>
                              {r.sizeMode !== 'uniform' && stats && (
                                <span className="text-muted-foreground">
                                  ({stats.small}s/{stats.normal}n/{stats.large}L)
                                </span>
                              )}
                            </div>
                          );
                        })}
                    </div>
                    {r.phase1Answer !== r.correctColor && r.pickedLargestDotColor && (
                      <p className="text-xs text-red-400 mt-0.5">Picked color with largest dots</p>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-3">
          <Button variant="outline" onClick={startTest} className="flex-1 min-h-[44px]">
            Try Again
          </Button>
          <Button onClick={onBack} className="flex-1 min-h-[44px]">
            Done
          </Button>
        </div>
      </div>
    );
  }

  return null;
}

/** SVG canvas for rendering colored dots with variable sizes */
function DotCanvas({ dots, label = 'Colored dots display' }: { dots: ColoredDot[]; label?: string }) {
  return (
    <svg
      viewBox="0 0 300 300"
      className="w-full max-w-[300px] mx-auto bg-muted/30 rounded-lg"
      role="img"
      aria-label={label}
    >
      {dots.map((dot, i) => (
        <circle
          key={i}
          cx={dot.x}
          cy={dot.y}
          r={dot.radius}
          fill={dot.color}
        />
      ))}
    </svg>
  );
}

/** SVG canvas rendering TV-static noise using the test colors */
function StaticCanvas({ pixels }: { pixels: { x: number; y: number; color: string }[] }) {
  return (
    <svg
      viewBox="0 0 300 300"
      className="w-full max-w-[300px] mx-auto rounded-lg"
      role="img"
      aria-label="Visual mask"
    >
      {pixels.map((p, i) => (
        <rect
          key={i}
          x={p.x}
          y={p.y}
          width={STATIC_PIXEL}
          height={STATIC_PIXEL}
          fill={p.color}
        />
      ))}
    </svg>
  );
}
