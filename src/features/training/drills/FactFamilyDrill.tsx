/**
 * FactFamilyDrill Component
 *
 * Teaches that operations are reversible: knowing 3 + 4 = 7 means you also
 * know 7 - 3 = 4 and 7 - 4 = 3 without extra work.  The same holds for
 * multiplication/division families.
 *
 * Difficulty:
 *   easy   — addition/subtraction, numbers 1–10, one inverse question
 *   medium — +/-  (1–20) and ×/÷ (1–12), two inverse questions
 *   hard   — +/- (1–100) and ×/÷ (1–12), up to three inverse questions
 *
 * Flow:
 *   1. Show anchor fact prominently.
 *   2. Show fact-family triangle (SVG).
 *   3. Present inverse questions one at a time.
 *   4. After all questions answered, save DrillResult and call onComplete.
 */

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { db } from '@/services/storage/db';
import type { DrillResult } from '@/services/storage/schemas';

// ---------------------------------------------------------------------------
// Public interface — re-declared per-file as required by project spec
// ---------------------------------------------------------------------------
export interface DrillProps {
  difficulty: 'easy' | 'medium' | 'hard';
  sessionId: number;
  onComplete: (result: DrillResult) => void;
  onSkip?: () => void;
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type OpFamily = 'add_sub' | 'mul_div';

interface FactFamily {
  a: number;               // first operand
  b: number;               // second operand
  total: number;           // sum or product
  opFamily: OpFamily;
  /** Anchor fact text, e.g. "3 + 4 = 7" */
  anchorFact: string;
  /** Symbol for the triangle centre, e.g. "+" or "×" */
  opSymbol: string;
  /** List of inverse questions the user must answer */
  questions: InverseQuestion[];
}

interface InverseQuestion {
  /** Question text, e.g. "7 - 3 = ?" */
  text: string;
  answer: number;
}

interface QuestionState {
  userInput: string;
  submitted: boolean;
  isCorrect: boolean;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function rand(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min + 1));
}

// ---------------------------------------------------------------------------
// Fact-family generators
// ---------------------------------------------------------------------------

/**
 * Build an addition/subtraction fact family.
 * Generates (a, b, total) where a + b = total, then creates inverse questions
 * according to difficulty count.
 */
function buildAddSubFamily(difficulty: 'easy' | 'medium' | 'hard'): FactFamily {
  let maxN: number;
  switch (difficulty) {
    case 'easy':   maxN = 10;  break;
    case 'medium': maxN = 20;  break;
    default:       maxN = 100; break;
  }

  const a = rand(1, Math.floor(maxN / 2));
  const b = rand(1, maxN - a);
  const total = a + b;

  const questionCount = difficulty === 'easy' ? 1 : difficulty === 'medium' ? 2 : 3;

  const allQuestions: InverseQuestion[] = [
    { text: `${total} - ${a} = ?`, answer: b },
    { text: `${total} - ${b} = ?`, answer: a },
    { text: `${b} + ${a} = ?`,     answer: total },
  ];

  return {
    a,
    b,
    total,
    opFamily: 'add_sub',
    anchorFact: `${a} + ${b} = ${total}`,
    opSymbol: '+',
    questions: allQuestions.slice(0, questionCount),
  };
}

/**
 * Build a multiplication/division fact family.
 * Generates (a, b, product) where a × b = product.
 */
function buildMulDivFamily(difficulty: 'easy' | 'medium' | 'hard'): FactFamily {
  // Both easy and medium use 1–12, hard stays 1–12 too (spec)
  const a = rand(2, 12);
  const b = rand(2, 12);
  const total = a * b;

  const questionCount = difficulty === 'easy' ? 1 : difficulty === 'medium' ? 2 : 3;

  const allQuestions: InverseQuestion[] = [
    { text: `${total} \u00F7 ${a} = ?`, answer: b },
    { text: `${total} \u00F7 ${b} = ?`, answer: a },
    { text: `${b} \u00D7 ${a} = ?`,     answer: total },
  ];

  return {
    a,
    b,
    total,
    opFamily: 'mul_div',
    anchorFact: `${a} \u00D7 ${b} = ${total}`,
    opSymbol: '\u00D7',
    questions: allQuestions.slice(0, questionCount),
  };
}

/**
 * Pick which family type to use, and how many questions, based on difficulty.
 */
function generateFactFamily(difficulty: 'easy' | 'medium' | 'hard'): FactFamily {
  if (difficulty === 'easy') {
    // Easy: always addition/subtraction
    return buildAddSubFamily(difficulty);
  }
  if (difficulty === 'medium') {
    // Medium: mix of +/- and ×/÷
    return Math.random() < 0.5
      ? buildAddSubFamily(difficulty)
      : buildMulDivFamily(difficulty);
  }
  // Hard: mix of +/- and ×/÷ with larger numbers
  return Math.random() < 0.5
    ? buildAddSubFamily(difficulty)
    : buildMulDivFamily(difficulty);
}

// ---------------------------------------------------------------------------
// Fact-family triangle SVG
// ---------------------------------------------------------------------------

interface TriangleProps {
  total: number;
  a: number;
  b: number;
  opSymbol: string;
}

/**
 * SVG triangle visual with:
 *   - sum/product at the top vertex
 *   - two operands at the bottom corners
 *   - operation symbol in the centre
 */
function FactFamilyTriangle({ total, a, b, opSymbol }: TriangleProps) {
  return (
    <svg
      viewBox="0 0 200 180"
      className="w-48 h-44 mx-auto"
      aria-label={`Fact family triangle: ${total} at top, ${a} and ${b} at bottom`}
      role="img"
      data-testid="fact-family-triangle"
    >
      {/* Triangle outline */}
      <polygon
        points="100,10 10,170 190,170"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
      {/* Top number (sum / product) */}
      <text
        x="100"
        y="45"
        textAnchor="middle"
        fontSize="22"
        fontWeight="bold"
        className="fill-primary"
        data-testid="triangle-total"
      >
        {total}
      </text>
      {/* Bottom left operand */}
      <text
        x="35"
        y="160"
        textAnchor="middle"
        fontSize="18"
        className="fill-foreground"
        data-testid="triangle-a"
      >
        {a}
      </text>
      {/* Bottom right operand */}
      <text
        x="165"
        y="160"
        textAnchor="middle"
        fontSize="18"
        className="fill-foreground"
        data-testid="triangle-b"
      >
        {b}
      </text>
      {/* Operation symbol in centre */}
      <text
        x="100"
        y="120"
        textAnchor="middle"
        fontSize="16"
        className="fill-muted-foreground"
        data-testid="triangle-op"
      >
        {opSymbol}
      </text>
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Per-question feedback overlay
// ---------------------------------------------------------------------------

interface QuestionFeedbackProps {
  isCorrect: boolean;
  correctAnswer: number;
  prefersReducedMotion: boolean;
}

function QuestionFeedback({ isCorrect, correctAnswer, prefersReducedMotion }: QuestionFeedbackProps) {
  return (
    <motion.div
      initial={prefersReducedMotion ? { opacity: 0 } : { scale: 0, opacity: 0 }}
      animate={prefersReducedMotion ? { opacity: 1 } : { scale: 1, opacity: 1 }}
      exit={prefersReducedMotion ? { opacity: 0 } : { scale: 0.8, opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="flex flex-col items-center gap-2 py-2"
      role="alert"
      aria-live="assertive"
      data-testid="question-feedback"
    >
      {isCorrect ? (
        <>
          <Check className="h-10 w-10 text-green-500" aria-hidden="true" />
          <p className="text-lg font-bold text-green-500">Correct!</p>
          <p className="sr-only">Correct!</p>
        </>
      ) : (
        <>
          <X className="h-10 w-10 text-yellow-500" aria-hidden="true" />
          <p className="text-lg font-bold text-yellow-500">
            The answer is {correctAnswer}
          </p>
          <p className="sr-only">Incorrect. The answer is {correctAnswer}.</p>
        </>
      )}
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export default function FactFamilyDrill({ difficulty, sessionId, onComplete }: DrillProps) {
  const [family] = useState<FactFamily>(() => generateFactFamily(difficulty));

  // Index of the current question (0-based)
  const [currentIdx, setCurrentIdx] = useState(0);

  // State for each question
  const [questionStates, setQuestionStates] = useState<QuestionState[]>(() =>
    family.questions.map(() => ({ userInput: '', submitted: false, isCorrect: false }))
  );

  // Whether we are showing per-question feedback (brief overlay before advancing)
  const [showingFeedback, setShowingFeedback] = useState(false);

  // Whether the whole drill is complete (all questions answered)
  const [drillComplete, setDrillComplete] = useState(false);

  const [startTime] = useState(Date.now());

  const advanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const completeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const prefersReducedMotion =
    typeof window !== 'undefined'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false;

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
      if (completeTimerRef.current) clearTimeout(completeTimerRef.current);
    };
  }, []);

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  const currentQ = family.questions[currentIdx];
  const currentState = questionStates[currentIdx];

  /** Update just the userInput for the current question (before submission). */
  function updateCurrentInput(value: string) {
    setQuestionStates((prev) =>
      prev.map((qs, i) => (i === currentIdx ? { ...qs, userInput: value } : qs))
    );
  }

  // ---------------------------------------------------------------------------
  // Submit handler for the current question
  // ---------------------------------------------------------------------------
  const handleSubmit = () => {
    if (showingFeedback || currentState.submitted || currentState.userInput.trim() === '') return;

    const userAnswer = parseInt(currentState.userInput, 10);
    const correct = userAnswer === currentQ.answer;

    const isLastQuestion = currentIdx === family.questions.length - 1;

    // Compute the full updated states here — avoids stale-closure issues in the
    // async setTimeout callback, since React state updates are batched and the
    // callback would otherwise see the pre-update snapshot.
    const nextStates = questionStates.map((qs, i) =>
      i === currentIdx ? { ...qs, submitted: true, isCorrect: correct } : qs
    );

    setQuestionStates(nextStates);
    setShowingFeedback(true);

    advanceTimerRef.current = setTimeout(async () => {
      setShowingFeedback(false);

      if (isLastQuestion) {
        // Tally results using the pre-computed nextStates (no stale closure)
        const correctCount = nextStates.filter((qs) => qs.isCorrect).length;
        const totalQuestions = family.questions.length;
        const allCorrect = correctCount === totalQuestions;

        const result: DrillResult = {
          sessionId,
          timestamp: new Date().toISOString(),
          module: 'fact_family',
          difficulty,
          isCorrect: allCorrect,
          timeToAnswer: Date.now() - startTime,
          accuracy: (correctCount / totalQuestions) * 100,
        };

        try {
          await db.drill_results.add(result);
        } catch (error) {
          console.error('Failed to persist drill result:', error);
        }

        setDrillComplete(true);

        completeTimerRef.current = setTimeout(() => {
          onComplete(result);
        }, 1500);
      } else {
        // Advance to next question
        setCurrentIdx((prev) => prev + 1);
      }
    }, 1200);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center bg-background p-6"
      role="application"
      aria-label="Fact family drill"
    >
      <div className="w-full max-w-md space-y-6">

        {/* Header */}
        <div className="text-center">
          <p className="text-sm font-medium text-muted-foreground">Fact Family</p>
          <p className="text-xs text-muted-foreground mt-1">
            Question {currentIdx + 1} of {family.questions.length}
          </p>
        </div>

        {/* Anchor fact */}
        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-1">Anchor fact:</p>
          <p
            className="text-3xl font-bold text-foreground"
            aria-live="polite"
            aria-atomic="true"
            data-testid="anchor-fact"
          >
            {family.anchorFact}
          </p>
        </div>

        {/* Fact family triangle */}
        <FactFamilyTriangle
          total={family.total}
          a={family.a}
          b={family.b}
          opSymbol={family.opSymbol}
        />

        {/* Current inverse question */}
        {!drillComplete && (
          <div className="space-y-4" data-testid="question-area">
            <div className="text-center">
              <p
                className="text-2xl font-semibold text-foreground"
                data-testid="question-text"
              >
                {currentQ.text}
              </p>
            </div>

            {/* Input row */}
            <div className="flex flex-col items-center gap-3">
              <input
                type="number"
                inputMode="numeric"
                value={currentState.userInput}
                onChange={(e) =>
                  updateCurrentInput(e.target.value)
                }
                onKeyDown={handleKeyDown}
                disabled={currentState.submitted}
                placeholder="?"
                className="w-[120px] rounded-lg border-2 border-primary bg-card px-4 py-3 text-center text-2xl font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                aria-label="Your answer"
                data-testid="answer-input"
              />
              <Button
                onClick={handleSubmit}
                disabled={currentState.submitted || currentState.userInput.trim() === ''}
                className="min-h-[44px] w-full max-w-[200px]"
                data-testid="submit-btn"
              >
                Check
              </Button>
            </div>

            {/* Per-question feedback */}
            <AnimatePresence>
              {showingFeedback && currentState.submitted && (
                <QuestionFeedback
                  key={currentIdx}
                  isCorrect={currentState.isCorrect}
                  correctAnswer={currentQ.answer}
                  prefersReducedMotion={prefersReducedMotion}
                />
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Final result banner after all questions answered */}
        <AnimatePresence>
          {drillComplete && (
            <motion.div
              initial={prefersReducedMotion ? { opacity: 0 } : { scale: 0.8, opacity: 0 }}
              animate={prefersReducedMotion ? { opacity: 1 } : { scale: 1, opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col items-center gap-2 py-4"
              role="alert"
              aria-live="assertive"
              data-testid="drill-complete-banner"
            >
              {(() => {
                const correctCount = questionStates.filter((qs) => qs.isCorrect).length;
                const allCorrect = correctCount === family.questions.length;
                return allCorrect ? (
                  <>
                    <Check className="h-16 w-16 text-green-500" aria-hidden="true" />
                    <p className="text-2xl font-bold text-green-500">Excellent!</p>
                    <p className="sr-only">All answers correct!</p>
                  </>
                ) : (
                  <>
                    <X className="h-16 w-16 text-yellow-500" aria-hidden="true" />
                    <p className="text-xl font-bold text-foreground">
                      {correctCount} / {family.questions.length} correct
                    </p>
                    <p className="sr-only">
                      {correctCount} out of {family.questions.length} answers were correct.
                    </p>
                  </>
                );
              })()}
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
