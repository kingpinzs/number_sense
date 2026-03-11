/**
 * RhythmicCountingDrill Component
 *
 * Trains skip-counting fluency through a visual rhythmic sequence.
 *
 * Flow:
 *   1. Show the step instruction ("Count by 5s!")
 *   2. Play the sequence one number at a time with a visual pulse beat
 *   3. Blank positions (shown as "?") are collected after the full sequence plays
 *   4. User enters answers via NumberKeypad, one blank at a time
 *   5. Per-blank feedback (green check / red X with correct value)
 *   6. Persist DrillResult and call onComplete
 *
 * Audio: Web Audio API click/beat, wrapped in try/catch — falls back to
 * visual-only mode if AudioContext is unavailable (iOS restrictions, etc.).
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X } from 'lucide-react';
import { NumberKeypad } from '@/shared/components/NumberKeypad';
import { db } from '@/services/storage/db';
import { STORAGE_KEYS } from '@/services/storage/localStorage';
import type { DrillResult } from '@/services/storage/schemas';

// ─── Public interface ────────────────────────────────────────────────────────

export interface DrillProps {
  difficulty: 'easy' | 'medium' | 'hard';
  sessionId: number;
  onComplete: (result: DrillResult) => void;
  onSkip?: () => void;
}

// ─── Constants ───────────────────────────────────────────────────────────────

interface DifficultyConfig {
  steps: readonly number[];
  sequenceLength: number;
  blankCount: number;
  /** Milliseconds between beats (60000 / BPM) */
  beatIntervalMs: number;
  minStart: number;
  maxStart: number;
}

const DIFFICULTY_CONFIG: Record<'easy' | 'medium' | 'hard', DifficultyConfig> = {
  easy: {
    steps: [2, 5, 10],
    sequenceLength: 8,
    blankCount: 1,
    beatIntervalMs: 750, // 80 BPM
    minStart: 0,
    maxStart: 20,
  },
  medium: {
    steps: [3, 4, 6],
    sequenceLength: 8,
    blankCount: 2,
    beatIntervalMs: 600, // 100 BPM
    minStart: 0,
    maxStart: 50,
  },
  hard: {
    steps: [7, 8, 9, 11, 12],
    sequenceLength: 10,
    blankCount: 3,
    beatIntervalMs: 500, // 120 BPM
    minStart: 0,
    maxStart: 100,
  },
};

// ─── Audio ───────────────────────────────────────────────────────────────────

/**
 * Play a short 800 Hz click using the Web Audio API.
 * Wrapped in try/catch — silently degrades when AudioContext is unavailable.
 */
function playBeat(audioCtx: AudioContext): void {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.frequency.value = 800;
  gain.gain.value = 0.1;
  osc.start();
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
  osc.stop(audioCtx.currentTime + 0.1);
}

function tryCreateAudioContext(): AudioContext | null {
  try {
    return new AudioContext();
  } catch {
    return null;
  }
}

// ─── Sequence generation ─────────────────────────────────────────────────────

interface CountingSequence {
  /** Full sequence values (including blank positions) */
  values: number[];
  /** Step used */
  step: number;
  /**
   * Indices in `values` that are blanks the user must fill in.
   * Sorted ascending.
   */
  blankIndices: number[];
}

function pickRandom<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateSequence(difficulty: 'easy' | 'medium' | 'hard'): CountingSequence {
  const cfg = DIFFICULTY_CONFIG[difficulty];
  const step = pickRandom(cfg.steps);
  // Easy: start on multiples (5, 10, 15) for memorization/rhythm
  // Medium/Hard: any start (8, 13, 18) forces understanding the pattern, not reciting
  let start: number;
  if (difficulty === 'easy') {
    const maxMultiple = Math.floor(cfg.maxStart / step);
    const minMultiple = Math.ceil(cfg.minStart / step);
    start = randInt(minMultiple, maxMultiple) * step;
  } else {
    start = randInt(cfg.minStart, cfg.maxStart);
  }

  const values: number[] = [];
  for (let i = 0; i < cfg.sequenceLength; i++) {
    values.push(start + step * i);
  }

  // Distribute blanks across the sequence, avoiding the very first position
  // so the user always sees at least the starting number for context.
  const availableIndices = Array.from({ length: cfg.sequenceLength - 1 }, (_, i) => i + 1);

  // Shuffle then take the required number of blanks
  for (let i = availableIndices.length - 1; i > 0; i--) {
    const j = randInt(0, i);
    [availableIndices[i], availableIndices[j]] = [availableIndices[j], availableIndices[i]];
  }

  const blankIndices = availableIndices.slice(0, cfg.blankCount).sort((a, b) => a - b);

  return { values, step, blankIndices };
}

// ─── Phase machine ────────────────────────────────────────────────────────────

type Phase =
  | 'intro'      // Show the step instruction
  | 'playing'    // Sequence is animating beat-by-beat
  | 'input'      // User fills in blanks one at a time
  | 'feedback'   // Brief per-blank feedback
  | 'complete';  // Final overall feedback overlay, then calls onComplete

// ─── Component ────────────────────────────────────────────────────────────────

export default function RhythmicCountingDrill({
  difficulty,
  sessionId,
  onComplete,
}: DrillProps) {
  const cfg = DIFFICULTY_CONFIG[difficulty];

  // Stable sequence — generated once per mount
  const [seq] = useState<CountingSequence>(() => generateSequence(difficulty));

  // Game state
  const [phase, setPhase] = useState<Phase>('intro');
  const [currentBeatIndex, setCurrentBeatIndex] = useState(-1);
  const [isPulsing, setIsPulsing] = useState(false);

  // Input state — tracks which blank the user is currently answering
  const [currentBlankAnswerIndex, setCurrentBlankAnswerIndex] = useState(0);
  const [userInput, setUserInput] = useState('');

  // Per-blank results
  const [blankResults, setBlankResults] = useState<
    Array<{ userAnswer: number; correct: boolean }>
  >([]);
  const [showBlankFeedback, setShowBlankFeedback] = useState(false);

  // Overall result feedback
  const [allCorrect, setAllCorrect] = useState(false);

  // Timing
  const [startTime] = useState(Date.now());

  // Refs
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const prefersReducedMotion =
    typeof window !== 'undefined'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false;

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  // ── Intro → Playing ──────────────────────────────────────────────────────

  const startSequence = useCallback(() => {
    // Lazily create AudioContext on first user gesture
    if (!audioCtxRef.current) {
      audioCtxRef.current = tryCreateAudioContext();
    }
    setPhase('playing');
    setCurrentBeatIndex(-1);
  }, []);

  // Drive the beat-by-beat animation once we enter 'playing'
  useEffect(() => {
    if (phase !== 'playing') return;

    let beat = 0;
    const { sequenceLength, beatIntervalMs } = cfg;

    const scheduleBeat = () => {
      if (beat >= sequenceLength) {
        // Sequence complete — transition to user input
        setCurrentBeatIndex(-1);
        setPhase('input');
        return;
      }

      setCurrentBeatIndex(beat);
      setIsPulsing(true);

      // Play audio click
      if (audioCtxRef.current) {
        try {
          playBeat(audioCtxRef.current);
        } catch {
          // Silently ignore audio errors
        }
      }

      // Turn off pulse after half a beat interval
      timerRef.current = setTimeout(() => {
        setIsPulsing(false);
        beat++;
        timerRef.current = setTimeout(scheduleBeat, beatIntervalMs * 0.1);
      }, beatIntervalMs * 0.4);
    };

    // Brief pause before first beat
    timerRef.current = setTimeout(scheduleBeat, 300);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [phase, cfg]);

  // ── Submit a blank answer ─────────────────────────────────────────────────

  const handleSubmitBlank = useCallback(() => {
    if (userInput === '') return;
    if (showBlankFeedback) return;

    const answerIndex = currentBlankAnswerIndex;
    const blankSeqIdx = seq.blankIndices[answerIndex];
    const correctValue = seq.values[blankSeqIdx];
    const userAnswer = parseInt(userInput, 10);
    const correct = userAnswer === correctValue;

    const updatedResults = [
      ...blankResults,
      { userAnswer, correct },
    ];

    setBlankResults(updatedResults);
    setShowBlankFeedback(true);

    // After feedback pause, either go to next blank or complete
    timerRef.current = setTimeout(() => {
      setShowBlankFeedback(false);
      setUserInput('');

      const nextIdx = answerIndex + 1;

      if (nextIdx >= seq.blankIndices.length) {
        // All blanks answered — compute final result and complete
        const correctCount = updatedResults.filter(r => r.correct).length;
        const totalBlanks = seq.blankIndices.length;
        const allBlanksCorrect = correctCount === totalBlanks;
        const accuracy = (correctCount / totalBlanks) * 100;

        setAllCorrect(allBlanksCorrect);
        setPhase('complete');

        const result: DrillResult = {
          sessionId,
          timestamp: new Date().toISOString(),
          module: 'rhythmic_counting',
          difficulty,
          isCorrect: allBlanksCorrect,
          timeToAnswer: Date.now() - startTime,
          accuracy,
        };

        // Persist fire-and-forget so onComplete timer is synchronously registered
        db.drill_results.add(result).catch((error: unknown) => {
          console.error('Failed to persist rhythmic counting result:', error);
          try {
            const backup = localStorage.getItem(STORAGE_KEYS.DRILL_RESULTS_BACKUP);
            const existing = backup ? JSON.parse(backup) : [];
            existing.push(result);
            localStorage.setItem(STORAGE_KEYS.DRILL_RESULTS_BACKUP, JSON.stringify(existing));
          } catch {
            localStorage.setItem(
              STORAGE_KEYS.DRILL_RESULTS_BACKUP,
              JSON.stringify([result])
            );
          }
        });

        // Show complete overlay briefly then call onComplete
        timerRef.current = setTimeout(() => {
          onComplete(result);
        }, 1800);
      } else {
        setCurrentBlankAnswerIndex(nextIdx);
      }
    }, 1200);
  }, [
    userInput,
    showBlankFeedback,
    currentBlankAnswerIndex,
    blankResults,
    seq,
    sessionId,
    difficulty,
    startTime,
    onComplete,
  ]);

  // Keyboard enter key support during input phase
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && phase === 'input' && userInput !== '' && !showBlankFeedback) {
        handleSubmitBlank();
      }
    },
    [phase, userInput, showBlankFeedback, handleSubmitBlank]
  );

  // ── Derived display helpers ───────────────────────────────────────────────

  /**
   * Determine the display label for each sequence position.
   * During playback: reveal position up to currentBeatIndex, blanks show "?"
   * During input: revealed numbers shown; answered blanks shown (correct/wrong);
   *               current and future blanks show "?"
   */
  function getPositionDisplay(index: number): {
    label: string;
    isCurrentBeat: boolean;
    isBlank: boolean;
    answeredCorrect?: boolean;
    answeredWrong?: boolean;
    isCurrentInput: boolean;
  } {
    const isBlankPosition = seq.blankIndices.includes(index);
    const isCurrentBeat = index === currentBeatIndex;

    if (phase === 'playing') {
      if (index > currentBeatIndex) {
        // Not yet revealed
        return { label: '', isCurrentBeat: false, isBlank: isBlankPosition, isCurrentInput: false };
      }
      return {
        label: isBlankPosition ? '?' : String(seq.values[index]),
        isCurrentBeat,
        isBlank: isBlankPosition,
        isCurrentInput: false,
      };
    }

    // input / complete / feedback phases
    if (!isBlankPosition) {
      return { label: String(seq.values[index]), isCurrentBeat: false, isBlank: false, isCurrentInput: false };
    }

    // It's a blank
    const blankAnswerIdx = seq.blankIndices.indexOf(index);
    if (blankAnswerIdx < currentBlankAnswerIndex) {
      // Already answered
      const result = blankResults[blankAnswerIdx];
      return {
        label: String(seq.values[index]),
        isCurrentBeat: false,
        isBlank: true,
        answeredCorrect: result?.correct,
        answeredWrong: result ? !result.correct : undefined,
        isCurrentInput: false,
      };
    }
    if (blankAnswerIdx === currentBlankAnswerIndex) {
      return {
        label: userInput !== '' ? userInput : '?',
        isCurrentBeat: false,
        isBlank: true,
        isCurrentInput: true,
      };
    }
    // Future blank
    return { label: '?', isCurrentBeat: false, isBlank: true, isCurrentInput: false };
  }

  // The current blank being answered (during input phase)
  const currentBlankSeqIdx =
    phase === 'input' ? seq.blankIndices[currentBlankAnswerIndex] : -1;

  // Feedback for the current blank
  const currentBlankResult = showBlankFeedback
    ? blankResults[blankResults.length - 1]
    : null;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center bg-background p-6"
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="application"
      aria-label="Rhythmic counting drill"
      data-testid="rhythmic-counting-drill"
    >
      <div className="w-full max-w-md space-y-6">
        {/* Header / instruction */}
        <div className="text-center">
          <p className="text-sm font-medium text-muted-foreground mb-1">
            Rhythmic Counting
          </p>
          <h2
            className="text-2xl font-bold text-foreground"
            aria-live="polite"
            data-testid="step-instruction"
          >
            Count by {seq.step}s!
          </h2>
        </div>

        {/* Central beat pulse + current number (only during playback) */}
        {phase === 'playing' && (
          <div className="flex items-center justify-center" aria-hidden="true">
            <div className="relative flex items-center justify-center">
              {/* Outer pulse ring */}
              <div
                className={`absolute rounded-full bg-primary/20 transition-all duration-150 ${
                  isPulsing ? 'w-40 h-40 opacity-100' : 'w-28 h-28 opacity-30'
                }`}
                style={
                  !prefersReducedMotion && isPulsing
                    ? { transform: 'scale(1.15)' }
                    : {}
                }
                data-testid="beat-pulse"
              />
              {/* Number display */}
              <span
                className="relative z-10 text-5xl font-extrabold text-primary"
                data-testid="current-beat-number"
              >
                {currentBeatIndex >= 0
                  ? seq.blankIndices.includes(currentBeatIndex)
                    ? '?'
                    : seq.values[currentBeatIndex]
                  : ''}
              </span>
            </div>
          </div>
        )}

        {/* Sequence progress row — always shown except in intro */}
        {phase !== 'intro' && (
          <div
            className="flex flex-wrap items-center justify-center gap-2"
            aria-label="Sequence progress"
            data-testid="sequence-row"
          >
            {Array.from({ length: seq.values.length }, (_, i) => {
              const pos = getPositionDisplay(i);
              let boxClasses =
                'w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold border-2 transition-colors';

              if (phase === 'playing') {
                if (i > currentBeatIndex) {
                  // Not yet reached — dim
                  boxClasses += ' border-border bg-muted/30 text-transparent';
                } else if (i === currentBeatIndex) {
                  boxClasses += ' border-primary bg-primary/20 text-primary scale-110';
                } else {
                  boxClasses += pos.isBlank
                    ? ' border-yellow-500 bg-yellow-500/10 text-yellow-600'
                    : ' border-border bg-muted text-foreground';
                }
              } else {
                // input / complete
                if (!pos.isBlank) {
                  boxClasses += ' border-border bg-muted text-foreground';
                } else if (pos.answeredCorrect) {
                  boxClasses += ' border-green-500 bg-green-500/10 text-green-600';
                } else if (pos.answeredWrong) {
                  boxClasses += ' border-yellow-500 bg-yellow-500/10 text-yellow-600';
                } else if (pos.isCurrentInput) {
                  boxClasses += ' border-primary bg-primary/20 text-primary';
                } else {
                  boxClasses += ' border-dashed border-primary/60 bg-muted/30 text-muted-foreground';
                }
              }

              return (
                <div key={i} className={boxClasses} data-testid={`seq-pos-${i}`}>
                  {pos.label}
                </div>
              );
            })}
          </div>
        )}

        {/* Intro phase — prompt user to start */}
        {phase === 'intro' && (
          <div className="text-center space-y-4">
            <p className="text-muted-foreground text-sm">
              Watch the numbers appear one by one with the beat.
              <br />
              Some positions will be blank — you will fill them in!
            </p>
            <button
              onClick={startSequence}
              className="min-h-[48px] px-8 py-3 rounded-xl bg-primary text-primary-foreground font-bold text-base hover:bg-primary/90 transition-colors"
              data-testid="start-btn"
            >
              Start Sequence
            </button>
          </div>
        )}

        {/* Playing phase — status text */}
        {phase === 'playing' && (
          <p
            className="text-center text-sm text-muted-foreground"
            aria-live="polite"
            data-testid="playing-status"
          >
            {currentBeatIndex >= 0
              ? `Number ${currentBeatIndex + 1} of ${seq.values.length}`
              : 'Get ready...'}
          </p>
        )}

        {/* Input phase — number keypad */}
        {phase === 'input' && !showBlankFeedback && (
          <div className="space-y-4">
            <p className="text-center text-sm font-medium text-muted-foreground" aria-live="polite">
              What goes in position {currentBlankSeqIdx + 1}?
              {' '}
              <span className="text-muted-foreground/70">
                ({currentBlankAnswerIndex + 1} of {seq.blankIndices.length})
              </span>
            </p>

            {/* Current answer display box */}
            <div className="text-center">
              <div
                className="mx-auto inline-block min-w-[100px] rounded-lg border-2 border-primary bg-card px-6 py-3"
                aria-live="polite"
                aria-label="Your answer"
              >
                <span className="text-3xl font-semibold text-foreground">
                  {userInput || '\u00A0'}
                </span>
              </div>
            </div>

            <div className="flex justify-center">
              <NumberKeypad
                value={userInput}
                onChange={setUserInput}
                onSubmit={handleSubmitBlank}
                maxDigits={4}
                disabled={showBlankFeedback}
              />
            </div>
          </div>
        )}

        {/* Per-blank feedback */}
        <AnimatePresence>
          {showBlankFeedback && currentBlankResult && (
            <motion.div
              initial={prefersReducedMotion ? { opacity: 0 } : { scale: 0.8, opacity: 0 }}
              animate={prefersReducedMotion ? { opacity: 1 } : { scale: 1, opacity: 1 }}
              exit={prefersReducedMotion ? { opacity: 0 } : { scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="flex flex-col items-center justify-center space-y-2"
              role="alert"
              aria-live="assertive"
              data-testid="blank-feedback"
            >
              {currentBlankResult.correct ? (
                <>
                  <Check className="h-16 w-16 text-green-500" aria-hidden="true" />
                  <p className="text-xl font-bold text-green-500">Correct!</p>
                </>
              ) : (
                <>
                  <X className="h-16 w-16 text-red-500" aria-hidden="true" />
                  <p className="text-base font-medium text-foreground">
                    The answer was{' '}
                    <span className="font-bold text-yellow-500" data-testid="correct-answer-reveal">
                      {seq.values[seq.blankIndices[blankResults.length - 1]]}
                    </span>
                  </p>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Complete overlay */}
        <AnimatePresence>
          {phase === 'complete' && (
            <motion.div
              initial={prefersReducedMotion ? { opacity: 0 } : { scale: 0, opacity: 0 }}
              animate={prefersReducedMotion ? { opacity: 1 } : { scale: 1, opacity: 1 }}
              exit={prefersReducedMotion ? { opacity: 0 } : { scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 flex items-center justify-center bg-background/90"
              role="alert"
              aria-live="assertive"
              data-testid="complete-overlay"
            >
              <div className="text-center space-y-4">
                {allCorrect ? (
                  <>
                    <Check className="mx-auto h-24 w-24 text-green-500" aria-hidden="true" />
                    <p className="text-2xl font-bold text-green-500">All correct!</p>
                    <p className="text-base text-muted-foreground">
                      You counted by {seq.step}s perfectly.
                    </p>
                  </>
                ) : (
                  <>
                    <X className="mx-auto h-24 w-24 text-yellow-500" aria-hidden="true" />
                    <p className="text-xl font-bold text-foreground">Keep practising!</p>
                    <p className="text-base text-muted-foreground">
                      {blankResults.filter(r => r.correct).length} of{' '}
                      {seq.blankIndices.length} blanks correct.
                    </p>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
