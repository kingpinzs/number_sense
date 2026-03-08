// PatternMatchGame - Core cognition mini-game
// Story 6.3: Pattern matching with tile flip mechanics

import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { Eye, EyeOff } from 'lucide-react';
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
import type { Tile, GameDifficulty, GameResult } from '../types';
import { DIFFICULTY_CONFIGS } from '../types';
import {
  generateTilePairs,
  checkMatch,
  calculateAccuracy,
} from '../utils/gameUtils';

// Symbol colors for visual differentiation
const SYMBOL_COLORS: Record<string, string> = {
  circle: '#E87461',
  square: '#4ECDC4',
  triangle: '#FFD93D',
  star: '#FF6B6B',
  diamond: '#6C5CE7',
  heart: '#FD79A8',
  hexagon: '#00B894',
  cross: '#0984E3',
  pentagon: '#E17055',
  arrow: '#636E72',
};

function SymbolIcon({ symbol }: { symbol: string }) {
  const color = SYMBOL_COLORS[symbol] || '#888';
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" aria-hidden="true">
      {symbol === 'circle' && (
        <circle cx="20" cy="20" r="14" fill={color} />
      )}
      {symbol === 'square' && (
        <rect x="6" y="6" width="28" height="28" rx="3" fill={color} />
      )}
      {symbol === 'triangle' && (
        <polygon points="20,4 36,34 4,34" fill={color} />
      )}
      {symbol === 'star' && (
        <polygon
          points="20,2 24.5,14.5 38,14.5 27,23 31,36 20,28 9,36 13,23 2,14.5 15.5,14.5"
          fill={color}
        />
      )}
      {symbol === 'diamond' && (
        <polygon points="20,2 36,20 20,38 4,20" fill={color} />
      )}
      {symbol === 'heart' && (
        <path
          d="M20 35 C10 25, 2 18, 8 10 C12 5, 18 7, 20 12 C22 7, 28 5, 32 10 C38 18, 30 25, 20 35Z"
          fill={color}
        />
      )}
      {symbol === 'hexagon' && (
        <polygon points="20,3 35,11 35,27 20,35 5,27 5,11" fill={color} />
      )}
      {symbol === 'cross' && (
        <>
          <rect x="14" y="4" width="12" height="32" rx="2" fill={color} />
          <rect x="4" y="14" width="32" height="12" rx="2" fill={color} />
        </>
      )}
      {symbol === 'pentagon' && (
        <polygon points="20,3 37,15 30,35 10,35 3,15" fill={color} />
      )}
      {symbol === 'arrow' && (
        <polygon points="20,2 36,20 26,20 26,38 14,38 14,20 4,20" fill={color} />
      )}
    </svg>
  );
}

function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function getEncouragement(accuracy: number): string {
  if (accuracy >= 100) return 'Perfect memory! Not a single wrong guess!';
  if (accuracy >= 80) return 'Great visual memory!';
  if (accuracy >= 60) return 'Good job! Your pattern recognition is improving!';
  return 'Nice work! Practice makes those neural pathways stronger!';
}

const DIFFICULTY_LABELS: Record<GameDifficulty, string> = {
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard',
};

interface PatternMatchGameProps {
  onBack: () => void;
}

export default function PatternMatchGame({ onBack }: PatternMatchGameProps) {
  const navigate = useNavigate();
  const shouldReduceMotion = useReducedMotion();

  // Game state
  const [difficulty, setDifficulty] = useState<GameDifficulty>('medium');
  const [tiles, setTiles] = useState<Tile[]>(() => generateTilePairs('medium'));
  const [selectedTiles, setSelectedTiles] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [matchedPairs, setMatchedPairs] = useState(0);
  const [gamePhase, setGamePhase] = useState<'playing' | 'complete'>('playing');
  const [isChecking, setIsChecking] = useState(false);

  // Timer state
  const [elapsed, setElapsed] = useState(0);
  const [timerStarted, setTimerStarted] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number | null>(null);

  // Timer visibility
  const [timerVisible, setTimerVisible] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEYS.GAME_TIMER_VISIBLE);
    return stored === 'true';
  });

  // Announcement for screen readers
  const [announcement, setAnnouncement] = useState('');

  // Roving tabindex for grid arrow key navigation (AC #8)
  const [focusedTileIndex, setFocusedTileIndex] = useState(0);
  const tileRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const config = DIFFICULTY_CONFIGS[difficulty];

  // Start timer on first click
  const startTimer = useCallback(() => {
    if (!timerStarted) {
      setTimerStarted(true);
      startTimeRef.current = Date.now();
    }
  }, [timerStarted]);

  // Arrow key navigation for ARIA grid pattern (AC #8)
  const handleGridKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const currentIndex = tileRefs.current.findIndex(
        (ref) => ref === document.activeElement
      );
      if (currentIndex === -1) return;

      let nextIndex = currentIndex;
      const cols = config.cols;
      const total = tiles.length;

      switch (e.key) {
        case 'ArrowRight':
          nextIndex = currentIndex + 1 < total ? currentIndex + 1 : currentIndex;
          break;
        case 'ArrowLeft':
          nextIndex = currentIndex - 1 >= 0 ? currentIndex - 1 : currentIndex;
          break;
        case 'ArrowDown':
          nextIndex = currentIndex + cols < total ? currentIndex + cols : currentIndex;
          break;
        case 'ArrowUp':
          nextIndex = currentIndex - cols >= 0 ? currentIndex - cols : currentIndex;
          break;
        default:
          return;
      }

      e.preventDefault();
      setFocusedTileIndex(nextIndex);
      tileRefs.current[nextIndex]?.focus();
    },
    [config.cols, tiles.length]
  );

  // Timer interval
  useEffect(() => {
    if (timerStarted && gamePhase === 'playing') {
      timerRef.current = setInterval(() => {
        if (startTimeRef.current) {
          setElapsed(Date.now() - startTimeRef.current);
        }
      }, 100);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [timerStarted, gamePhase]);

  // Check for game completion
  useEffect(() => {
    if (matchedPairs === config.pairs && matchedPairs > 0) {
      setGamePhase('complete');
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  }, [matchedPairs, config.pairs]);

  const handleTileClick = useCallback(
    (tileId: number) => {
      if (isChecking) return;
      if (gamePhase !== 'playing') return;

      const tile = tiles.find((t) => t.id === tileId);
      if (!tile || tile.matched || tile.revealed) return;

      startTimer();

      // Reveal tile
      setTiles((prev) =>
        prev.map((t) => (t.id === tileId ? { ...t, revealed: true } : t))
      );

      const newSelected = [...selectedTiles, tileId];
      setSelectedTiles(newSelected);

      if (newSelected.length === 2) {
        setMoves((prev) => prev + 1);
        setIsChecking(true);

        const tile1 = tiles.find((t) => t.id === newSelected[0])!;
        const tile2 = tile;

        if (checkMatch(tile1, tile2)) {
          // Match found
          setTiles((prev) =>
            prev.map((t) =>
              t.id === newSelected[0] || t.id === newSelected[1]
                ? { ...t, matched: true, revealed: true }
                : t
            )
          );
          setMatchedPairs((prev) => prev + 1);
          setSelectedTiles([]);
          setIsChecking(false);
          setAnnouncement(`Match found! ${tile1.symbol}. Move ${moves + 1}.`);
        } else {
          // No match — flip back after 1 second
          setTimeout(() => {
            setTiles((prev) =>
              prev.map((t) =>
                t.id === newSelected[0] || t.id === newSelected[1]
                  ? { ...t, revealed: false }
                  : t
              )
            );
            setSelectedTiles([]);
            setIsChecking(false);
            setAnnouncement(`No match. Move ${moves + 1}. Try again.`);
          }, 1000);
        }
      }
    },
    [isChecking, gamePhase, tiles, selectedTiles, startTimer]
  );

  // Log telemetry on game complete
  useEffect(() => {
    if (gamePhase === 'complete') {
      const accuracy = calculateAccuracy(config.pairs, moves);
      db.telemetry_logs
        .add({
          timestamp: new Date().toISOString(),
          event: 'cognition_game_complete',
          module: 'pattern_match',
          data: {
            difficulty,
            moves,
            duration: elapsed,
            accuracy,
          },
          userId: 'local_user',
        })
        .catch((err) => console.error('Failed to log telemetry:', err));
    }
  }, [gamePhase, config.pairs, moves, elapsed, difficulty]);

  const handleDifficultyChange = (newDifficulty: GameDifficulty) => {
    setDifficulty(newDifficulty);
    resetGame(newDifficulty);
  };

  const resetGame = (diff: GameDifficulty = difficulty) => {
    setTiles(generateTilePairs(diff));
    setSelectedTiles([]);
    setMoves(0);
    setMatchedPairs(0);
    setGamePhase('playing');
    setIsChecking(false);
    setFocusedTileIndex(0);
    setElapsed(0);
    setTimerStarted(false);
    startTimeRef.current = null;
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const toggleTimerVisibility = () => {
    setTimerVisible((prev) => {
      const next = !prev;
      localStorage.setItem(STORAGE_KEYS.GAME_TIMER_VISIBLE, String(next));
      return next;
    });
  };

  const accuracy = calculateAccuracy(config.pairs, moves);
  const gameResult: GameResult = {
    difficulty,
    moves,
    duration: elapsed,
    accuracy,
    pairs: config.pairs,
  };

  return (
    <div className="max-w-md mx-auto px-4 py-4">
      {/* Back button */}
      <Button
        variant="ghost"
        onClick={onBack}
        className="mb-3 min-h-[44px] focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      >
        &larr; Back to Games
      </Button>

      {/* Difficulty selector */}
      <div className="flex gap-1 mb-4" role="tablist" aria-label="Difficulty">
        {(['easy', 'medium', 'hard'] as GameDifficulty[]).map((diff) => (
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

      {/* Game stats bar */}
      <div className="flex items-center justify-between mb-4 text-lg font-semibold">
        <span>Moves: {moves}</span>
        <span>
          {matchedPairs}/{config.pairs} pairs
        </span>
        <div className="flex items-center gap-1">
          {timerVisible && <span>{formatTime(elapsed)}</span>}
          <button
            onClick={toggleTimerVisibility}
            aria-label={timerVisible ? 'Hide timer' : 'Show timer'}
            className="p-1 rounded min-w-[44px] min-h-[44px] flex items-center justify-center focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus:outline-none text-muted-foreground hover:text-foreground"
          >
            {timerVisible ? (
              <Eye className="w-5 h-5" />
            ) : (
              <EyeOff className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      {/* Screen reader announcements */}
      <div aria-live="polite" className="sr-only">
        {announcement}
      </div>

      {/* Tile grid — ARIA grid with row/gridcell structure + arrow key navigation */}
      <div
        className="flex flex-col gap-2 mx-auto"
        style={{ maxWidth: `${config.cols * 78}px` }}
        role="grid"
        aria-label="Pattern Match game board"
        onKeyDown={handleGridKeyDown}
      >
        {Array.from(
          { length: Math.ceil(tiles.length / config.cols) },
          (_, rowIdx) => (
            <div key={rowIdx} role="row" className="flex gap-2">
              {tiles
                .slice(rowIdx * config.cols, (rowIdx + 1) * config.cols)
                .map((tile, colIdx) => {
                  const index = rowIdx * config.cols + colIdx;
                  const row = rowIdx + 1;
                  const col = colIdx + 1;

                  return (
                    <div key={tile.id} role="gridcell">
                      <motion.button
                        ref={(el) => {
                          tileRefs.current[index] = el;
                        }}
                        tabIndex={index === focusedTileIndex ? 0 : -1}
                        onClick={() => handleTileClick(tile.id)}
                        disabled={tile.matched || tile.revealed || isChecking}
                        aria-label={
                          tile.matched
                            ? `Tile row ${row}, column ${col}: matched ${tile.symbol}`
                            : tile.revealed
                              ? `Tile row ${row}, column ${col}: ${tile.symbol}`
                              : `Tile row ${row}, column ${col}: face down`
                        }
                        className={`
                          w-[70px] h-[70px] rounded-xl flex items-center justify-center
                          focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus:outline-none
                          transition-shadow
                          ${
                            tile.matched
                              ? 'bg-white border-2 border-green-500 ring-2 ring-green-500/30'
                              : tile.revealed
                                ? 'bg-white border border-border'
                                : 'bg-muted border border-border shadow-sm hover:shadow-md cursor-pointer'
                          }
                        `}
                        animate={
                          shouldReduceMotion
                            ? { opacity: 1 }
                            : {
                                rotateY:
                                  tile.revealed || tile.matched ? 180 : 0,
                              }
                        }
                        transition={{
                          duration: shouldReduceMotion ? 0.15 : 0.4,
                        }}
                        style={
                          shouldReduceMotion
                            ? undefined
                            : {
                                perspective: 600,
                                transformStyle: 'preserve-3d',
                              }
                        }
                      >
                        {(tile.revealed || tile.matched) && (
                          <div
                            style={
                              shouldReduceMotion
                                ? undefined
                                : { transform: 'rotateY(180deg)' }
                            }
                          >
                            <SymbolIcon symbol={tile.symbol} />
                          </div>
                        )}
                      </motion.button>
                    </div>
                  );
                })}
            </div>
          )
        )}
      </div>

      {/* Completion modal */}
      <Dialog open={gamePhase === 'complete'} onOpenChange={() => {}}>
        <DialogContent
          onPointerDownOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle className="text-2xl text-center">
              Game Complete!
            </DialogTitle>
            <DialogDescription className="text-center text-base">
              {getEncouragement(gameResult.accuracy)}
            </DialogDescription>
          </DialogHeader>
          <div className="text-center space-y-2 py-4">
            <p className="text-lg font-semibold">
              Completed in {gameResult.moves} moves,{' '}
              {formatTime(gameResult.duration)}
            </p>
            <p className="text-muted-foreground">
              Accuracy: {gameResult.accuracy}%
            </p>
          </div>
          <DialogFooter className="flex flex-col gap-2 sm:flex-col">
            <Button
              onClick={() => resetGame()}
              className="w-full min-h-[44px]"
            >
              Play Again
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/')}
              className="w-full min-h-[44px]"
            >
              Back to Home
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
