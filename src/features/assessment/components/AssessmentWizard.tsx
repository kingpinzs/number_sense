// AssessmentWizard - Multi-step assessment form shell component
// Story 2.1: Build Assessment Wizard Shell with Multi-Step Form
// Architecture: React Hook Form + shadcn/ui Sheet + SessionContext

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useSession } from '@/context/SessionContext';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/shared/components/ui/sheet';
import { Progress } from '@/shared/components/ui/progress';
import { Button } from '@/shared/components/ui/button';
import { QuantityComparison } from './QuantityComparison';
import { NumberLineEstimation } from './NumberLineEstimation';
import { MentalRotation } from './MentalRotation';
import { PatternMatching } from './PatternMatching';
import { BasicOperations } from './BasicOperations';
import { WordProblem } from './WordProblem';
import {
  generateNumberSenseQuestions,
  generateSpatialQuestions,
  generateOperationsQuestions,
} from '../content/questions';

// Total number of assessment questions
const TOTAL_QUESTIONS = 10;

// Schema for wizard form state
const assessmentSchema = z.object({
  currentStep: z.number().min(1).max(TOTAL_QUESTIONS),
  answers: z.array(z.string().optional()),
  startTime: z.string(),
});

type AssessmentFormValues = z.infer<typeof assessmentSchema>;

export interface AssessmentWizardProps {
  /** Whether the wizard is open */
  open: boolean;
  /** Callback when open state changes */
  onOpenChange: (open: boolean) => void;
  /** Callback when assessment is completed */
  onComplete?: (answers: (string | undefined)[]) => void;
  /** Callback when assessment is abandoned */
  onExit?: () => void;
}

/**
 * AssessmentWizard - Multi-step assessment form with progress tracking
 *
 * Features:
 * - Step indicator showing "Question X of 10"
 * - Progress bar (0-100%) showing completion
 * - Previous/Next navigation with validation
 * - Exit confirmation dialog
 * - Full-screen modal on mobile via Sheet component
 * - ARIA landmarks and keyboard navigation
 * - Focus trap active
 */
export function AssessmentWizard({
  open,
  onOpenChange,
  onComplete,
  onExit,
}: AssessmentWizardProps) {
  const { startSession, endSession } = useSession();
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const questionAreaRef = useRef<HTMLDivElement>(null);

  // Generate all questions once (deterministic seed for consistency)
  const questions = useMemo(() => {
    const seed = Date.now();
    return [
      ...generateNumberSenseQuestions(seed),
      ...generateSpatialQuestions(seed),
      ...generateOperationsQuestions(seed),
    ];
  }, []);

  // Initialize form with React Hook Form
  const methods = useForm<AssessmentFormValues>({
    resolver: zodResolver(assessmentSchema),
    defaultValues: {
      currentStep: 1,
      answers: Array(TOTAL_QUESTIONS).fill(undefined),
      startTime: new Date().toISOString(),
    },
  });

  const { watch, setValue, getValues } = methods;
  const currentStep = watch('currentStep');
  const answers = watch('answers');

  // Current answer for validation
  const currentAnswer = answers[currentStep - 1];
  const hasAnswer = currentAnswer !== undefined && currentAnswer !== '';

  // Progress calculation (0-100%)
  const progressValue = (currentStep / TOTAL_QUESTIONS) * 100;

  // Track if session has been started to prevent duplicate starts
  const sessionStartedRef = useRef(false);

  // Start session when wizard opens
  useEffect(() => {
    if (open && !sessionStartedRef.current) {
      sessionStartedRef.current = true;
      const sessionId = `assessment-${Date.now()}`;
      startSession('assessment', sessionId);
      setValue('startTime', new Date().toISOString());
    }
    if (!open) {
      sessionStartedRef.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!open) return;

      if (event.key === 'Escape') {
        event.preventDefault();
        setShowExitConfirm(true);
      } else if (event.key === 'Enter' && hasAnswer) {
        event.preventDefault();
        handleNext();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, hasAnswer, currentStep]);

  // Navigate to previous question
  const handlePrevious = useCallback(() => {
    if (currentStep > 1) {
      setValue('currentStep', currentStep - 1);
    }
  }, [currentStep, setValue]);

  // Navigate to next question or complete
  const handleNext = useCallback(() => {
    if (!hasAnswer) return;

    if (currentStep < TOTAL_QUESTIONS) {
      setValue('currentStep', currentStep + 1);
    } else {
      // Assessment complete
      endSession();
      onComplete?.(getValues('answers'));
      onOpenChange(false);
    }
  }, [currentStep, hasAnswer, setValue, endSession, onComplete, onOpenChange, getValues]);

  // Handle exit with confirmation
  const handleExit = useCallback(() => {
    setShowExitConfirm(true);
  }, []);

  // Confirm exit
  const handleConfirmExit = useCallback(() => {
    endSession();
    onExit?.();
    onOpenChange(false);
    setShowExitConfirm(false);
  }, [endSession, onExit, onOpenChange]);

  // Cancel exit
  const handleCancelExit = useCallback(() => {
    setShowExitConfirm(false);
  }, []);

  // Handle answer from question components
  const handleAnswer = useCallback((answer: string) => {
    const newAnswers = [...answers];
    newAnswers[currentStep - 1] = answer;
    setValue('answers', newAnswers);
  }, [answers, currentStep, setValue]);

  // Render current question component
  const renderQuestion = () => {
    const questionConfig = questions[currentStep - 1];
    if (!questionConfig) return null;

    switch (questionConfig.type) {
      case 'quantity-comparison':
        return (
          <QuantityComparison
            leftCount={questionConfig.leftCount}
            rightCount={questionConfig.rightCount}
            onAnswer={handleAnswer}
            initialAnswer={currentAnswer}
          />
        );
      case 'number-line':
        return (
          <NumberLineEstimation
            range={questionConfig.range}
            targetNumber={questionConfig.targetNumber}
            onAnswer={handleAnswer}
            initialAnswer={currentAnswer}
          />
        );
      case 'mental-rotation':
        return (
          <MentalRotation
            shapeType={questionConfig.shapeType}
            rotationAngle={questionConfig.rotationAngle}
            isMatch={questionConfig.isMatch}
            onAnswer={handleAnswer}
            initialAnswer={currentAnswer}
          />
        );
      case 'pattern-matching':
        return (
          <PatternMatching
            targetPattern={questionConfig.targetPattern}
            options={questionConfig.options}
            onAnswer={handleAnswer}
            initialAnswer={currentAnswer}
          />
        );
      case 'basic-operations':
        return (
          <BasicOperations
            operationType={questionConfig.operationType}
            operand1={questionConfig.operand1}
            operand2={questionConfig.operand2}
            onAnswer={handleAnswer}
            initialAnswer={currentAnswer}
          />
        );
      case 'word-problem':
        return (
          <WordProblem
            problemText={questionConfig.problemText}
            onAnswer={handleAnswer}
            initialAnswer={currentAnswer}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="h-full w-full sm:h-full sm:max-w-full"
        role="dialog"
        aria-labelledby="assessment-title"
        aria-describedby="assessment-description"
        aria-modal="true"
      >
        <div className="flex h-full flex-col">
          {/* Header with exit button */}
          <SheetHeader className="relative border-b pb-4">
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0 min-h-[44px] min-w-[44px]"
              onClick={handleExit}
              aria-label="Exit assessment"
              data-testid="exit-button"
            >
              <X className="h-5 w-5" />
            </Button>
            <SheetTitle id="assessment-title" className="text-xl font-semibold">
              Assessment
            </SheetTitle>
            <SheetDescription id="assessment-description" className="sr-only">
              Answer questions to identify your math and spatial strengths and weaknesses
            </SheetDescription>

            {/* Step indicator */}
            <div
              className="mt-2 text-center text-lg font-medium"
              aria-live="polite"
              aria-atomic="true"
              data-testid="step-indicator"
            >
              Question {currentStep} of {TOTAL_QUESTIONS}
            </div>

            {/* Progress bar */}
            <Progress
              value={progressValue}
              className="mt-3 h-2"
              aria-label={`Progress: ${Math.round(progressValue)}% complete`}
              data-testid="progress-bar"
            />
          </SheetHeader>

          {/* Question area */}
          <FormProvider {...methods}>
            <div
              ref={questionAreaRef}
              className="flex-1 overflow-y-auto p-6"
              style={{ minHeight: '200px' }}
            >
              {/* Exit confirmation overlay */}
              {showExitConfirm ? (
                <div
                  className="flex h-full flex-col items-center justify-center gap-6"
                  role="alertdialog"
                  aria-labelledby="exit-confirm-title"
                  aria-describedby="exit-confirm-description"
                  data-testid="exit-confirmation"
                >
                  <h3 id="exit-confirm-title" className="text-xl font-semibold">
                    Exit Assessment?
                  </h3>
                  <p id="exit-confirm-description" className="text-center text-muted-foreground">
                    Your progress will be lost. Are you sure you want to exit?
                  </p>
                  <div className="flex gap-4">
                    <Button
                      variant="outline"
                      onClick={handleCancelExit}
                      className="min-h-[44px] min-w-[100px]"
                      data-testid="cancel-exit-button"
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={handleConfirmExit}
                      className="min-h-[44px] min-w-[100px]"
                      data-testid="confirm-exit-button"
                    >
                      Exit
                    </Button>
                  </div>
                </div>
              ) : (
                // Render current question component
                <div
                  className="flex h-full flex-col items-center justify-center"
                  data-testid="question-area"
                >
                  {renderQuestion()}
                </div>
              )}
            </div>
          </FormProvider>

          {/* Navigation footer */}
          {!showExitConfirm && (
            <div className="flex items-center justify-between border-t p-4">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentStep === 1}
                className="min-h-[44px] min-w-[44px] gap-2"
                aria-label="Previous question"
                data-testid="previous-button"
              >
                <ChevronLeft className="h-5 w-5" />
                <span className="hidden sm:inline">Previous</span>
              </Button>

              <Button
                onClick={handleNext}
                disabled={!hasAnswer}
                className="min-h-[44px] min-w-[44px] gap-2"
                aria-label={currentStep === TOTAL_QUESTIONS ? 'Complete assessment' : 'Next question'}
                data-testid="next-button"
              >
                <span className="hidden sm:inline">
                  {currentStep === TOTAL_QUESTIONS ? 'Complete' : 'Next'}
                </span>
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

export default AssessmentWizard;
