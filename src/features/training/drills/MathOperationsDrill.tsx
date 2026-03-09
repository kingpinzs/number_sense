/**
 * Math Operations Drill Component
 * Story 3.4: Math operations drill for basic arithmetic training
 *
 * User solves arithmetic problems (addition, subtraction, multiplication) using a number keypad.
 * Provides visual feedback, confidence prompts, and records drill results to Dexie.
 */

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { NumberKeypad } from '@/shared/components/NumberKeypad';
import { db } from '@/services/storage/db';
import { STORAGE_KEYS } from '@/services/storage/localStorage';
import type { DrillResult } from '@/services/storage/schemas';
import { generateProblem } from '@/services/training/problemGenerator';

/**
 * DrillProps interface per Epic 3 tech spec
 */
export interface DrillProps {
  difficulty: 'easy' | 'medium' | 'hard';
  sessionId: number;
  onComplete: (result: DrillResult) => void;
  onSkip?: () => void;
  usedProblems?: Set<string>;
}

export default function MathOperationsDrill({ difficulty, sessionId, onComplete, usedProblems }: DrillProps) {
  // Generate problem on mount, checking against usedProblems to avoid duplicates
  const [problemData] = useState(() => generateProblem(difficulty, undefined, usedProblems));
  const { problem, answer: correctAnswer, operation } = problemData;

  // State management
  const [userInput, setUserInput] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [showConfidencePrompt, setShowConfidencePrompt] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [startTime] = useState(Date.now());
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clean up timeout on unmount to prevent setState on unmounted component
  useEffect(() => {
    return () => {
      if (feedbackTimerRef.current) {
        clearTimeout(feedbackTimerRef.current);
      }
    };
  }, []);

  // Check for prefers-reduced-motion
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Handle submit answer
  const handleSubmit = () => {
    if (submitted || userInput === '') return;

    const userAnswer = parseInt(userInput, 10);
    const correct = userAnswer === correctAnswer;

    setIsCorrect(correct);
    setSubmitted(true);
    setShowFeedback(true);

    // Show confidence prompt after feedback delay
    feedbackTimerRef.current = setTimeout(() => {
      setShowFeedback(false);
      setShowConfidencePrompt(true);
    }, correct ? 1000 : 1500);
  };

  // Handle confidence selection
  const handleConfidenceSelect = async (selectedConfidence: string) => {
    setShowConfidencePrompt(false);

    const timeToAnswer = Date.now() - startTime;
    const userAnswerNum = userInput === '' ? null : parseInt(userInput, 10);

    // Create drill result
    const result: DrillResult = {
      sessionId,
      timestamp: new Date().toISOString(),
      module: 'math_operations',
      difficulty,
      isCorrect,
      timeToAnswer,
      accuracy: isCorrect ? 100 : 0,
      userAnswer: userAnswerNum ?? undefined,
      correctAnswer,
      operation,
      problem,
      confidence: selectedConfidence,
    };

    // Persist to Dexie with try-catch and localStorage fallback
    try {
      await db.drill_results.add(result);
    } catch (error) {
      console.error('Failed to persist drill result:', error);
      // Fallback to localStorage backup
      try {
        const backup = localStorage.getItem(STORAGE_KEYS.DRILL_RESULTS_BACKUP);
        const results = backup ? JSON.parse(backup) : [];
        results.push(result);
        localStorage.setItem(STORAGE_KEYS.DRILL_RESULTS_BACKUP, JSON.stringify(results));
      } catch {
        localStorage.setItem(STORAGE_KEYS.DRILL_RESULTS_BACKUP, JSON.stringify([result]));
      }
    }

    // Call onComplete callback
    onComplete(result);
  };

  // Handle Enter key for submit
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !submitted && userInput !== '') {
      handleSubmit();
    }
  };

  // Get operation display name
  const getOperationName = () => {
    switch (operation) {
      case 'addition':
        return 'Addition';
      case 'subtraction':
        return 'Subtraction';
      case 'multiplication':
        return 'Multiplication';
      default:
        return '';
    }
  };

  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center bg-background p-6"
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="application"
      aria-label="Math operations drill"
    >
      <div className="w-full max-w-md space-y-8">
        {/* Operation type label */}
        <div className="text-center">
          <p className="text-sm font-medium text-muted-foreground">{getOperationName()}</p>
        </div>

        {/* Problem display */}
        <div className="text-center">
          <h2
            className="text-5xl font-bold text-foreground"
            style={{ minHeight: '60px', fontSize: 'clamp(36px, 8vw, 60px)' }}
            aria-live="polite"
            aria-atomic="true"
          >
            {problem} = ?
          </h2>
        </div>

        {/* User answer display */}
        <div className="text-center">
          <div
            className="mx-auto inline-block min-w-[120px] rounded-lg border-2 border-primary bg-card px-6 py-4"
            aria-live="polite"
            aria-label="Your answer"
          >
            <span className="text-3xl font-semibold text-foreground">
              {userInput || '\u00A0'}
            </span>
          </div>
        </div>

        {/* Number Keypad */}
        {!submitted && (
          <div className="flex justify-center">
            <NumberKeypad
              value={userInput}
              onChange={setUserInput}
              onSubmit={handleSubmit}
              maxDigits={4}
              disabled={submitted}
              data-testid="math-operations-keypad"
            />
          </div>
        )}

        {/* Feedback Animation */}
        <AnimatePresence>
          {showFeedback && (
            <motion.div
              initial={prefersReducedMotion ? { opacity: 0 } : { scale: 0, opacity: 0 }}
              animate={prefersReducedMotion ? { opacity: 1 } : { scale: 1, opacity: 1 }}
              exit={prefersReducedMotion ? { opacity: 0 } : { scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 flex items-center justify-center bg-background/80"
              role="alert"
              aria-live="assertive"
            >
              <div className="text-center">
                {isCorrect ? (
                  <>
                    <div className="mb-4 flex justify-center">
                      <Check className="h-24 w-24 text-green-500" aria-hidden="true" />
                    </div>
                    <motion.p
                      initial={prefersReducedMotion ? {} : { y: 0, opacity: 1 }}
                      animate={prefersReducedMotion ? {} : { y: -20, opacity: 0 }}
                      transition={{ duration: 1, delay: 0.2 }}
                      className="text-4xl font-bold text-green-500"
                    >
                      +1
                    </motion.p>
                    <p className="sr-only">Correct! You earned 1 point.</p>
                  </>
                ) : (
                  <>
                    <div className="mb-4 flex justify-center">
                      <X className="h-24 w-24 text-red-500" aria-hidden="true" />
                    </div>
                    <p className="text-2xl font-semibold text-red-500">
                      {problem} = {correctAnswer}
                    </p>
                    <p className="sr-only">
                      Incorrect. The correct answer is {correctAnswer}.
                    </p>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Confidence Prompt */}
        <AnimatePresence>
          {showConfidencePrompt && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
              role="region"
              aria-label="Confidence level"
            >
              <h3 className="text-center text-xl font-semibold text-foreground">
                How confident were you?
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Button
                  onClick={() => handleConfidenceSelect('guessed')}
                  variant="outline"
                  size="lg"
                  className="h-16"
                  aria-label="Guessed - I was not confident"
                >
                  Guessed
                </Button>
                <Button
                  onClick={() => handleConfidenceSelect('unsure')}
                  variant="outline"
                  size="lg"
                  className="h-16"
                  aria-label="Unsure - I was somewhat confident"
                >
                  Unsure
                </Button>
                <Button
                  onClick={() => handleConfidenceSelect('confident')}
                  variant="outline"
                  size="lg"
                  className="h-16"
                  aria-label="Confident - I was very confident"
                >
                  Confident
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
