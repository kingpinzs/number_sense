// MemoryGridGame - Visual memory pattern recall game
// Story 6.5: Remember highlighted squares and recreate the pattern

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
import type { MemoryGridPhase } from '../types';
import {
  MEMORY_GRID_SIZE,
  MEMORY_GRID_COLS,
  MEMORY_GRID_DISPLAY_MS,
  MEMORY_GRID_FEEDBACK_MS,
  MEMORY_GRID_INITIAL_LIVES,
} from '../types';
import {
  generatePattern,
  comparePatterns,
  getPatternLengthForRound,
  getEncouragementMessage,
  indexToRowCol,
} from '../utils/memoryGridUtils';

interface MemoryGridGameProps {
  onBack: () => void;
}

type FeedbackType = 'correct' | 'incorrect' | null;

export default function MemoryGridGame({ onBack }: MemoryGridGameProps) {
  const shouldReduceMotion = useReducedMotion();

  // Game state
  const [phase, setPhase] = useState<MemoryGridPhase>('displaying');
  const [round, setRound] = useState(1);
  const [lives, setLives] = useState(MEMORY_GRID_INITIAL_LIVES);
  const [pattern, setPattern] = useState<number[]>([]);
  const [userSelection, setUserSelection] = useState<number[]>([]);
  const [feedback, setFeedback] = useState<FeedbackType>(null);
  const [roundsCompleted, setRoundsCompleted] = useState(0);
  const [longestPattern, setLongestPattern] = useState(0);
  const [feedbackAnnouncement, setFeedbackAnnouncement] = useState('');

  // Duration tracking
  const startTimeRef = useRef<number>(0);
  const [duration, setDuration] = useState(0);

  // Timeout cleanup refs (Story 6.4 M1: prevent memory leaks)
  const displayTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const feedbackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Grid keyboard navigation
  const [focusedIndex, setFocusedIndex] = useState(0);
  const gridRef = useRef<HTMLDivElement>(null);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (displayTimeoutRef.current) clearTimeout(displayTimeoutRef.current);
      if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
    };
  }, []);

  // Start a new round: generate pattern and show it
  const startRound = useCallback((roundNum: number) => {
    const patternLength = getPatternLengthForRound(roundNum);
    const newPattern = generatePattern(MEMORY_GRID_SIZE, patternLength);
    setPattern(newPattern);
    setUserSelection([]);
    setFeedback(null);
    setFeedbackAnnouncement('');
    setPhase('displaying');

    // Start duration tracking on first round
    if (roundNum === 1) {
      startTimeRef.current = Date.now();
    }

    // After display time, switch to recall phase
    displayTimeoutRef.current = setTimeout(() => {
      setPhase('recalling');
    }, MEMORY_GRID_DISPLAY_MS);
  }, []);

  // Initialize first round
  useEffect(() => {
    startRound(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Toggle square selection during recall phase
  const toggleSquare = useCallback((index: number) => {
    if (phase !== 'recalling') return;
    setUserSelection(prev => {
      if (prev.includes(index)) {
        return prev.filter(i => i !== index);
      }
      return [...prev, index];
    });
  }, [phase]);

  // Handle answer submission
  const handleSubmit = useCallback(() => {
    if (phase !== 'recalling' || userSelection.length === 0) return;

    const isCorrect = comparePatterns(pattern, userSelection);
    setPhase('feedback');

    if (isCorrect) {
      setFeedback('correct');
      const newRoundsCompleted = roundsCompleted + 1;
      const patternLen = getPatternLengthForRound(round);
      setRoundsCompleted(newRoundsCompleted);
      setLongestPattern(prev => Math.max(prev, patternLen));
      setFeedbackAnnouncement(`Correct! Round ${round} complete. Pattern was ${patternLen} squares.`);

      feedbackTimeoutRef.current = setTimeout(() => {
        const nextRound = round + 1;
        setRound(nextRound);
        startRound(nextRound);
      }, MEMORY_GRID_FEEDBACK_MS);
    } else {
      setFeedback('incorrect');
      const newLives = lives - 1;
      setLives(newLives);
      setFeedbackAnnouncement(`Incorrect. ${newLives} ${newLives === 1 ? 'life' : 'lives'} remaining.`);

      if (newLives <= 0) {
        // Game over
        setDuration(Date.now() - startTimeRef.current);
        feedbackTimeoutRef.current = setTimeout(() => {
          setPhase('complete');
        }, MEMORY_GRID_FEEDBACK_MS);
      } else {
        feedbackTimeoutRef.current = setTimeout(() => {
          startRound(round);
        }, MEMORY_GRID_FEEDBACK_MS);
      }
    }
  }, [phase, userSelection, pattern, round, lives, roundsCompleted, startRound]);

  // Handle Give Up
  const handleGiveUp = useCallback(() => {
    if (phase !== 'recalling') return;

    setPhase('feedback');
    setFeedback('incorrect');
    const newLives = lives - 1;
    setLives(newLives);
    setFeedbackAnnouncement(`Gave up. ${newLives} ${newLives === 1 ? 'life' : 'lives'} remaining.`);

    if (newLives <= 0) {
      setDuration(Date.now() - startTimeRef.current);
      feedbackTimeoutRef.current = setTimeout(() => {
        setPhase('complete');
      }, MEMORY_GRID_FEEDBACK_MS);
    } else {
      feedbackTimeoutRef.current = setTimeout(() => {
        startRound(round);
      }, MEMORY_GRID_FEEDBACK_MS);
    }
  }, [phase, lives, round, startRound]);

  // Log telemetry on game complete
  useEffect(() => {
    if (phase !== 'complete') return;
    db.telemetry_logs.add({
      timestamp: new Date().toISOString(),
      event: 'cognition_game_complete',
      module: 'memory_grid',
      data: {
        roundsCompleted,
        longestPattern,
        duration,
        livesRemaining: lives,
      },
      userId: 'local_user',
    }).catch(err => console.error('Failed to log telemetry:', err));
  }, [phase, roundsCompleted, longestPattern, duration, lives]);

  // Reset game
  const resetGame = useCallback(() => {
    if (displayTimeoutRef.current) clearTimeout(displayTimeoutRef.current);
    if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
    setRound(1);
    setLives(MEMORY_GRID_INITIAL_LIVES);
    setPattern([]);
    setUserSelection([]);
    setFeedback(null);
    setFeedbackAnnouncement('');
    setRoundsCompleted(0);
    setLongestPattern(0);
    setDuration(0);
    setFocusedIndex(0);
    startRound(1);
  }, [startRound]);

  // Keyboard navigation for grid (roving tabindex)
  const handleGridKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (phase !== 'recalling') return;

    let newIndex = focusedIndex;
    switch (e.key) {
      case 'ArrowRight':
        newIndex = focusedIndex % MEMORY_GRID_COLS < MEMORY_GRID_COLS - 1
          ? focusedIndex + 1 : focusedIndex;
        break;
      case 'ArrowLeft':
        newIndex = focusedIndex % MEMORY_GRID_COLS > 0
          ? focusedIndex - 1 : focusedIndex;
        break;
      case 'ArrowDown':
        newIndex = focusedIndex + MEMORY_GRID_COLS < MEMORY_GRID_SIZE
          ? focusedIndex + MEMORY_GRID_COLS : focusedIndex;
        break;
      case 'ArrowUp':
        newIndex = focusedIndex - MEMORY_GRID_COLS >= 0
          ? focusedIndex - MEMORY_GRID_COLS : focusedIndex;
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        toggleSquare(focusedIndex);
        return;
      default:
        return;
    }

    e.preventDefault();
    setFocusedIndex(newIndex);
  }, [phase, focusedIndex, toggleSquare]);

  // Focus the active square when focusedIndex changes
  useEffect(() => {
    if (phase !== 'recalling') return;
    const grid = gridRef.current;
    if (!grid) return;
    const squares = grid.querySelectorAll<HTMLButtonElement>('[data-square]');
    squares[focusedIndex]?.focus();
  }, [focusedIndex, phase]);

  // Get square visual class
  const getSquareClass = (index: number): string => {
    const base = 'w-[60px] h-[60px] rounded-md transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2';

    if (phase === 'displaying') {
      if (pattern.includes(index)) {
        return `${base} bg-primary border-2 border-primary`;
      }
      return `${base} bg-muted border border-border`;
    }

    if (phase === 'recalling') {
      if (userSelection.includes(index)) {
        return `${base} bg-primary border-2 border-primary cursor-pointer`;
      }
      return `${base} bg-muted border border-border cursor-pointer hover:bg-muted/80`;
    }

    if (phase === 'feedback') {
      // Show correct pattern during feedback (especially after incorrect)
      if (feedback === 'incorrect' && pattern.includes(index)) {
        return `${base} bg-primary/50 border-2 border-primary/50`;
      }
      if (userSelection.includes(index)) {
        return `${base} bg-primary border-2 border-primary`;
      }
      return `${base} bg-muted border border-border`;
    }

    return `${base} bg-muted border border-border`;
  };

  // Get grid border class for feedback
  const getGridBorderClass = (): string => {
    if (phase === 'feedback' && feedback === 'correct') return 'border-2 border-green-500 rounded-lg p-1';
    if (phase === 'feedback' && feedback === 'incorrect') return 'border-2 border-yellow-500 rounded-lg p-1';
    return 'p-1';
  };

  // Get aria-label for a square
  const getSquareAriaLabel = (index: number): string => {
    const { row, col } = indexToRowCol(index, MEMORY_GRID_COLS);
    const base = `Square row ${row}, column ${col}`;

    if (phase === 'displaying' && pattern.includes(index)) {
      return `${base}, highlighted`;
    }
    if (phase === 'recalling') {
      return `${base}, ${userSelection.includes(index) ? 'selected' : 'not selected'}`;
    }
    if (phase === 'feedback') {
      if (pattern.includes(index)) return `${base}, was in pattern`;
      return base;
    }
    return base;
  };

  const patternLength = getPatternLengthForRound(round);

  return (
    <div className="max-w-md mx-auto px-4 py-6">
      {/* Header with stats */}
      <div className="flex items-center justify-between mb-4">
        <Button
          variant="ghost"
          onClick={onBack}
          className="min-h-[44px]"
        >
          &larr; Back to Games
        </Button>
        <h1 className="text-xl font-bold">Memory Grid</h1>
        <div className="w-[72px]" /> {/* Spacer for alignment */}
      </div>

      {/* Stats bar */}
      <div className="flex items-center justify-between mb-4 text-sm" aria-live="polite">
        <span className="font-semibold">Round {round}</span>
        <span className="text-muted-foreground">Pattern: {patternLength} squares</span>
        <div className="flex gap-1" aria-label={`${lives} ${lives === 1 ? 'life' : 'lives'} remaining`}>
          {Array.from({ length: MEMORY_GRID_INITIAL_LIVES }, (_, i) => (
            <span
              key={i}
              className={`w-4 h-4 rounded-full inline-block ${i < lives ? 'bg-primary' : 'bg-muted border border-border'}`}
              aria-hidden="true"
            />
          ))}
        </div>
      </div>

      {/* Phase instruction */}
      <div className="text-center mb-3 text-sm text-muted-foreground min-h-[20px]">
        {phase === 'displaying' && 'Memorize the pattern...'}
        {phase === 'recalling' && 'Tap the squares you remember!'}
        {phase === 'feedback' && feedback === 'correct' && 'Correct!'}
        {phase === 'feedback' && feedback === 'incorrect' && 'Not quite — here was the pattern'}
      </div>

      {/* Grid */}
      <div className="flex justify-center mb-4">
        <div className={getGridBorderClass()}>
          <div
            ref={gridRef}
            role="grid"
            aria-label="Memory grid"
            className="grid gap-1"
            style={{ gridTemplateColumns: `repeat(${MEMORY_GRID_COLS}, 60px)` }}
            onKeyDown={handleGridKeyDown}
          >
            {Array.from({ length: MEMORY_GRID_SIZE }, (_, index) => {
              return (
                <motion.button
                  key={index}
                  data-square
                  data-index={index}
                  role="gridcell"
                  tabIndex={phase === 'recalling' && index === focusedIndex ? 0 : -1}
                  aria-label={getSquareAriaLabel(index)}
                  className={getSquareClass(index)}
                  onClick={() => toggleSquare(index)}
                  disabled={phase !== 'recalling'}
                  animate={
                    phase === 'displaying' && pattern.includes(index)
                      ? { scale: shouldReduceMotion ? 1 : [1, 1.05, 1] }
                      : {}
                  }
                  transition={
                    phase === 'displaying' && pattern.includes(index)
                      ? {
                          duration: shouldReduceMotion ? 0 : 0.8,
                          repeat: shouldReduceMotion ? 0 : Infinity,
                          repeatType: 'loop' as const,
                        }
                      : undefined
                  }
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex justify-center gap-3">
        {phase === 'recalling' && (
          <>
            <Button
              onClick={handleSubmit}
              disabled={userSelection.length === 0}
              className="min-h-[44px] px-6"
            >
              Submit
            </Button>
            <Button
              variant="outline"
              onClick={handleGiveUp}
              className="min-h-[44px] px-6"
            >
              Give Up
            </Button>
          </>
        )}
      </div>

      {/* Feedback announcement for screen readers */}
      <div aria-live="assertive" className="sr-only">
        {feedbackAnnouncement}
      </div>

      {/* Game Over Dialog */}
      <Dialog open={phase === 'complete'} onOpenChange={() => {}}>
        <DialogContent onPointerDownOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>Game Over!</DialogTitle>
            <DialogDescription>
              {getEncouragementMessage(round)}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-4">
            <p className="text-sm">
              <span className="font-semibold">Reached round:</span> {round}
            </p>
            <p className="text-sm">
              <span className="font-semibold">Rounds completed:</span> {roundsCompleted}
            </p>
            <p className="text-sm">
              <span className="font-semibold">Longest pattern:</span> {longestPattern} squares
            </p>
            <p className="text-sm">
              <span className="font-semibold">Duration:</span> {Math.round(duration / 1000)}s
            </p>
          </div>
          <DialogFooter className="flex gap-2 sm:gap-0">
            <Button onClick={resetGame} className="min-h-[44px]">
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
