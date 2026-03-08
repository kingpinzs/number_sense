// SpatialFlipGame - Spatial rotation guessing game
// Story 6.4: Identify which comparison shape matches the reference after rotation/mirror

import { useState, useEffect, useCallback, useRef } from 'react';
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
import { SHAPES, rotateShape, mirrorShape, rotateAndMirrorShape } from '@/features/training/content/shapes';
import type { GameDifficulty, SpatialFlipQuestion } from '../types';
import {
  SPATIAL_FLIP_TOTAL_QUESTIONS,
  SPATIAL_FLIP_TIME_LIMIT_MS,
  SPATIAL_FLIP_AUTO_ADVANCE_MS,
} from '../types';
import {
  generateQuestion,
  getEncouragementMessage,
  CHOICE_LABELS,
} from '../utils/spatialFlipUtils';

interface SpatialFlipGameProps {
  onBack: () => void;
}

type FeedbackState = 'none' | 'correct' | 'incorrect';

export function getChoiceStyle(choice: { rotationDegrees: number; isMirrored: boolean }): React.CSSProperties {
  if (choice.isMirrored && choice.rotationDegrees > 0) {
    return rotateAndMirrorShape(choice.rotationDegrees);
  } else if (choice.isMirrored) {
    return mirrorShape();
  } else if (choice.rotationDegrees > 0) {
    return rotateShape(choice.rotationDegrees);
  }
  return {};
}

export default function SpatialFlipGame({ onBack }: SpatialFlipGameProps) {
  const shouldReduceMotion = useReducedMotion();

  // Game state
  const [difficulty, setDifficulty] = useState<GameDifficulty>('medium');
  const [question, setQuestion] = useState<SpatialFlipQuestion>(() => generateQuestion('medium'));
  const [questionNumber, setQuestionNumber] = useState(1);
  const [correctCount, setCorrectCount] = useState(0);
  const [responseTimes, setResponseTimes] = useState<number[]>([]);
  const [feedback, setFeedback] = useState<FeedbackState>('none');
  const [selectedChoiceId, setSelectedChoiceId] = useState<number | null>(null);
  const [gameComplete, setGameComplete] = useState(false);

  // Timer state
  const [timerVisible, setTimerVisible] = useState(() => {
    return localStorage.getItem(STORAGE_KEYS.GAME_TIMER_VISIBLE) === 'true';
  });
  const [timeRemaining, setTimeRemaining] = useState(SPATIAL_FLIP_TIME_LIMIT_MS);
  const questionStartTime = useRef(Date.now());

  // Keyboard navigation - roving tabindex for 2x2 grid
  const [focusedIndex, setFocusedIndex] = useState(0);
  const choiceRefs = useRef<(HTMLButtonElement | null)[]>([null, null, null, null]);

  // Refs for stable advanceQuestion callback (avoids stale closures in timer chain)
  const questionNumberRef = useRef(questionNumber);
  questionNumberRef.current = questionNumber;
  const difficultyRef = useRef(difficulty);
  difficultyRef.current = difficulty;

  // Track auto-advance timeout for cleanup on unmount
  const autoAdvanceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clean up auto-advance timeout on unmount
  useEffect(() => {
    return () => {
      if (autoAdvanceTimeoutRef.current !== null) {
        clearTimeout(autoAdvanceTimeoutRef.current);
      }
    };
  }, []);

  // Toggle timer visibility
  const toggleTimer = useCallback(() => {
    setTimerVisible(prev => {
      const next = !prev;
      localStorage.setItem(STORAGE_KEYS.GAME_TIMER_VISIBLE, String(next));
      return next;
    });
  }, []);

  // Advance to next question or complete game (stable via refs)
  const advanceQuestion = useCallback(() => {
    if (questionNumberRef.current >= SPATIAL_FLIP_TOTAL_QUESTIONS) {
      setGameComplete(true);
      setFeedback('none');
    } else {
      setQuestionNumber(prev => prev + 1);
      setQuestion(generateQuestion(difficultyRef.current));
      setFeedback('none');
      setSelectedChoiceId(null);
      setFocusedIndex(0);
    }
  }, []);

  // Handle time expiry
  const handleTimeExpired = useCallback(() => {
    if (feedback !== 'none') return;

    const responseTime = SPATIAL_FLIP_TIME_LIMIT_MS;
    setResponseTimes(prev => [...prev, responseTime]);
    setFeedback('incorrect');
    setSelectedChoiceId(null);

    // Auto-advance after feedback (tracked for cleanup)
    autoAdvanceTimeoutRef.current = setTimeout(() => {
      autoAdvanceTimeoutRef.current = null;
      advanceQuestion();
    }, SPATIAL_FLIP_AUTO_ADVANCE_MS);
  }, [feedback, advanceQuestion]);

  // Handle choice selection
  const handleChoice = useCallback(
    (choiceId: number) => {
      if (feedback !== 'none' || gameComplete) return;

      const responseTime = Date.now() - questionStartTime.current;
      const choice = question.choices.find(c => c.id === choiceId);
      if (!choice) return;

      setSelectedChoiceId(choiceId);
      setResponseTimes(prev => [...prev, responseTime]);

      if (choice.isCorrect) {
        setCorrectCount(prev => prev + 1);
        setFeedback('correct');
      } else {
        setFeedback('incorrect');
      }

      // Auto-advance after feedback (tracked for cleanup)
      autoAdvanceTimeoutRef.current = setTimeout(() => {
        autoAdvanceTimeoutRef.current = null;
        advanceQuestion();
      }, SPATIAL_FLIP_AUTO_ADVANCE_MS);
    },
    [feedback, gameComplete, question, advanceQuestion],
  );

  // Countdown timer
  useEffect(() => {
    if (feedback !== 'none' || gameComplete) return;

    questionStartTime.current = Date.now();
    setTimeRemaining(SPATIAL_FLIP_TIME_LIMIT_MS);

    const interval = setInterval(() => {
      const elapsed = Date.now() - questionStartTime.current;
      const remaining = Math.max(0, SPATIAL_FLIP_TIME_LIMIT_MS - elapsed);
      setTimeRemaining(remaining);

      if (remaining <= 0) {
        clearInterval(interval);
        // Time expired — mark as incorrect
        handleTimeExpired();
      }
    }, 100);

    return () => clearInterval(interval);
  }, [questionNumber, feedback, gameComplete, handleTimeExpired]);

  // Log telemetry on game completion
  useEffect(() => {
    if (!gameComplete) return;

    const totalQuestions = SPATIAL_FLIP_TOTAL_QUESTIONS;
    const accuracy = Math.round((correctCount / totalQuestions) * 100);
    const avgResponseTime =
      responseTimes.length > 0
        ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length)
        : 0;

    db.telemetry_logs
      .add({
        timestamp: new Date().toISOString(),
        event: 'cognition_game_complete',
        module: 'spatial_flip',
        data: {
          difficulty,
          correctCount,
          totalQuestions,
          accuracy,
          avgResponseTime,
        },
        userId: 'local_user',
      })
      .catch(err => console.error('Failed to log telemetry:', err));
  }, [gameComplete, correctCount, responseTimes, difficulty]);

  // Reset game
  const resetGame = useCallback(
    (newDifficulty?: GameDifficulty) => {
      const diff = newDifficulty ?? difficulty;
      // Clear any pending auto-advance timeout
      if (autoAdvanceTimeoutRef.current !== null) {
        clearTimeout(autoAdvanceTimeoutRef.current);
        autoAdvanceTimeoutRef.current = null;
      }
      setDifficulty(diff);
      setQuestion(generateQuestion(diff));
      setQuestionNumber(1);
      setCorrectCount(0);
      setResponseTimes([]);
      setFeedback('none');
      setSelectedChoiceId(null);
      setGameComplete(false);
      setFocusedIndex(0);
      setTimeRemaining(SPATIAL_FLIP_TIME_LIMIT_MS);
    },
    [difficulty],
  );

  // Handle difficulty change
  const handleDifficultyChange = useCallback(
    (newDifficulty: GameDifficulty) => {
      if (newDifficulty !== difficulty) {
        resetGame(newDifficulty);
      }
    },
    [difficulty, resetGame],
  );

  // Keyboard navigation for 2x2 grid
  const handleGridKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (feedback !== 'none') return;

      let newIndex = focusedIndex;
      switch (e.key) {
        case 'ArrowRight':
          newIndex = focusedIndex % 2 === 0 ? focusedIndex + 1 : focusedIndex;
          break;
        case 'ArrowLeft':
          newIndex = focusedIndex % 2 === 1 ? focusedIndex - 1 : focusedIndex;
          break;
        case 'ArrowDown':
          newIndex = focusedIndex < 2 ? focusedIndex + 2 : focusedIndex;
          break;
        case 'ArrowUp':
          newIndex = focusedIndex >= 2 ? focusedIndex - 2 : focusedIndex;
          break;
        default:
          return;
      }

      if (newIndex !== focusedIndex && newIndex >= 0 && newIndex < 4) {
        e.preventDefault();
        setFocusedIndex(newIndex);
        choiceRefs.current[newIndex]?.focus();
      }
    },
    [focusedIndex, feedback],
  );

  // Compute stats for completion
  const totalQuestions = SPATIAL_FLIP_TOTAL_QUESTIONS;
  const accuracy = Math.round((correctCount / totalQuestions) * 100);
  const avgResponseTime =
    responseTimes.length > 0
      ? (responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length / 1000).toFixed(1)
      : '0.0';

  const ReferenceComponent = SHAPES[question.referenceShape];
  const timerSeconds = (timeRemaining / 1000).toFixed(1);

  return (
    <div className="max-w-md mx-auto px-4 py-4">
      {/* Header with difficulty + timer */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex gap-1">
          {(['easy', 'medium', 'hard'] as const).map(d => (
            <button
              key={d}
              onClick={() => handleDifficultyChange(d)}
              className={`px-3 py-2 min-h-[44px] text-sm rounded-full capitalize transition-colors
                ${
                  d === difficulty
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }
              `}
              aria-pressed={d === difficulty}
            >
              {d}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {timerVisible && feedback === 'none' && !gameComplete && (
            <span className="text-sm font-mono font-semibold tabular-nums" aria-label={`${timerSeconds} seconds remaining`}>
              {timerSeconds}s
            </span>
          )}
          <button
            onClick={toggleTimer}
            className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-md hover:bg-muted transition-colors"
            aria-label={timerVisible ? 'Hide timer' : 'Show timer'}
          >
            {timerVisible ? (
              <Eye className="w-4 h-4 text-muted-foreground" />
            ) : (
              <EyeOff className="w-4 h-4 text-muted-foreground" />
            )}
          </button>
        </div>
      </div>

      {/* Question progress */}
      <div
        className="text-center mb-4"
        aria-live="polite"
        aria-atomic="true"
      >
        <p className="text-sm text-muted-foreground">
          Question {questionNumber} of {totalQuestions}
        </p>
      </div>

      {/* Reference shape */}
      <div className="flex flex-col items-center mb-4">
        <span className="text-xs font-medium text-muted-foreground mb-2">Reference</span>
        <div
          className="w-28 h-28 flex items-center justify-center rounded-xl border-2 border-muted bg-card shadow-sm"
          aria-label={`Reference shape: ${question.referenceShape}`}
        >
          <ReferenceComponent className="w-20 h-20 text-foreground" />
        </div>
      </div>

      {/* Question prompt */}
      <p className="text-center text-sm text-muted-foreground mb-3">
        Which shape matches the reference?
      </p>

      {/* Feedback announcement */}
      <div aria-live="assertive" className="sr-only">
        {feedback === 'correct' && `Correct! Question ${questionNumber} of ${totalQuestions}.`}
        {feedback === 'incorrect' && `Incorrect. Question ${questionNumber} of ${totalQuestions}.`}
      </div>

      {/* 2x2 choice grid */}
      <div
        className="grid grid-cols-2 gap-3 max-w-[280px] mx-auto mb-4"
        role="grid"
        aria-label="Shape choices"
        onKeyDown={handleGridKeyDown}
      >
        {[0, 1].map(rowIdx => (
          <div key={rowIdx} role="row" className="contents">
            {question.choices.slice(rowIdx * 2, rowIdx * 2 + 2).map((choice, colIdx) => {
              const index = rowIdx * 2 + colIdx;
              const ChoiceComponent = SHAPES[choice.shape];
              const isSelected = selectedChoiceId === choice.id;
              const showCorrectFeedback = feedback !== 'none' && choice.isCorrect;
              const showIncorrectFeedback = feedback !== 'none' && isSelected && !choice.isCorrect;

              let borderClass = 'border border-border';
              if (showCorrectFeedback) borderClass = 'border-2 border-green-500 ring-2 ring-green-500/30';
              else if (showIncorrectFeedback) borderClass = 'border-2 border-yellow-500 ring-2 ring-yellow-500/30';

              return (
                <div key={choice.id} role="gridcell">
                  <motion.button
                    ref={el => { choiceRefs.current[index] = el; }}
                    tabIndex={index === focusedIndex ? 0 : -1}
                    onClick={() => handleChoice(choice.id)}
                    disabled={feedback !== 'none' || gameComplete}
                    className={`
                      w-[130px] h-[100px] rounded-xl flex flex-col items-center justify-center
                      bg-card shadow-sm transition-shadow
                      focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus:outline-none
                      ${borderClass}
                      ${feedback === 'none' && !gameComplete ? 'hover:shadow-md cursor-pointer' : ''}
                    `}
                    aria-label={`Choice ${CHOICE_LABELS[index]}: ${choice.shape}${choice.rotationDegrees > 0 ? ` rotated ${choice.rotationDegrees} degrees` : ''}${choice.isMirrored ? ' mirrored' : ''}`}
                    whileTap={feedback === 'none' && !gameComplete ? { scale: 0.95 } : undefined}
                    animate={
                      shouldReduceMotion
                        ? {}
                        : showCorrectFeedback
                        ? { scale: [1, 1.05, 1] }
                        : {}
                    }
                    transition={{ duration: shouldReduceMotion ? 0 : 0.3 }}
                  >
                    <span className="text-xs font-semibold text-muted-foreground mb-1">
                      {CHOICE_LABELS[index]}
                    </span>
                    <div className="w-16 h-16 flex items-center justify-center">
                      <ChoiceComponent
                        className="w-full h-full text-foreground"
                        style={getChoiceStyle(choice)}
                      />
                    </div>
                  </motion.button>
                </div>
              );
            })}
          </div>
        ))}
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

      {/* Completion modal */}
      <Dialog open={gameComplete} onOpenChange={(open) => { if (!open) resetGame(); }}>
        <DialogContent className="max-w-sm" aria-describedby="completion-description">
          <DialogHeader>
            <DialogTitle className="text-center text-xl">Game Complete!</DialogTitle>
            <DialogDescription id="completion-description" className="text-center">
              {getEncouragementMessage(accuracy)}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 text-center py-2">
            <p className="text-lg font-semibold">
              {correctCount}/{totalQuestions} correct ({accuracy}%)
            </p>
            <p className="text-sm text-muted-foreground">
              Avg response time: {avgResponseTime}s
            </p>
          </div>

          <DialogFooter className="flex flex-col gap-2 sm:flex-col">
            <Button onClick={() => resetGame()} className="w-full min-h-[44px]">
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
