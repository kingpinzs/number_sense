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

  // Use local state for currentStep - more reliable than React Hook Form for UI state
  const [currentStep, setCurrentStep] = useState(1);
  // Local state to track answers for immediate UI feedback
  const [localAnswers, setLocalAnswers] = useState<(string | undefined)[]>(Array(TOTAL_QUESTIONS).fill(undefined));

  // Generate all questions once (deterministic seed for consistency)
  const questions = useMemo(() => {
    const seed = Date.now();
    return [
      ...generateNumberSenseQuestions(seed),
      ...generateSpatialQuestions(seed),
      ...generateOperationsQuestions(seed),
    ];
  }, []);

  // Initialize form with React Hook Form (for answers only)
  const methods = useForm<AssessmentFormValues>({
    resolver: zodResolver(assessmentSchema),
    defaultValues: {
      currentStep: 1,
      answers: Array(TOTAL_QUESTIONS).fill(undefined),
      startTime: new Date().toISOString(),
    },
  });

  const { setValue, getValues } = methods;

  // Use local state for immediate UI feedback
  const currentAnswer = localAnswers[currentStep - 1];
  const hasAnswer = currentAnswer !== undefined && currentAnswer !== '';

  // Progress calculation (0-100%)
  const progressValue = (currentStep / TOTAL_QUESTIONS) * 100;

  // Track if session has been started to prevent duplicate starts
  const sessionStartedRef = useRef(false);

  // Start session when wizard opens and reset state
  useEffect(() => {
    if (open && !sessionStartedRef.current) {
      sessionStartedRef.current = true;
      const sessionId = Date.now();
      startSession('assessment', sessionId);
      setValue('startTime', new Date().toISOString());
      setValue('answers', Array(TOTAL_QUESTIONS).fill(undefined));
      setCurrentStep(1);
      setLocalAnswers(Array(TOTAL_QUESTIONS).fill(undefined));
    }
    if (!open) {
      sessionStartedRef.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Navigate to previous question
  const handlePrevious = useCallback(() => {
    setCurrentStep(prev => {
      if (prev > 1) return prev - 1;
      return prev;
    });
  }, []);

  // Navigate to next question or complete
  const handleNext = useCallback(() => {
    if (!hasAnswer) return;

    if (currentStep < TOTAL_QUESTIONS) {
      setCurrentStep(prev => prev + 1);
    } else {
      // Assessment complete
      endSession();
      onComplete?.(getValues('answers'));
      onOpenChange(false);
    }
  }, [currentStep, hasAnswer, endSession, onComplete, onOpenChange, getValues]);

  // Handle keyboard navigation (must be after handleNext declaration)
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
  }, [open, hasAnswer, handleNext]);

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

  // Handle answer from question components - accepts result objects and serializes to string
  const handleAnswer = useCallback((answer: unknown) => {
    // Serialize complex result objects to JSON strings for storage
    const serializedAnswer = typeof answer === 'string' ? answer : JSON.stringify(answer);

    // Update local state for immediate UI feedback
    setLocalAnswers(prev => {
      const newAnswers = [...prev];
      newAnswers[currentStep - 1] = serializedAnswer;
      return newAnswers;
    });

    // Also update form state for final submission
    const formAnswers = getValues('answers');
    const newFormAnswers = [...formAnswers];
    newFormAnswers[currentStep - 1] = serializedAnswer;
    setValue('answers', newFormAnswers);
  }, [currentStep, setValue, getValues]);

  // Render current question component
  const renderQuestion = () => {
    const questionConfig = questions[currentStep - 1];
    if (!questionConfig) return null;

    // Cast handleAnswer to expected types - all result objects are serialized to JSON
    const typedHandler = handleAnswer as (result: unknown) => void;

    // Use key={currentStep} to force React to remount components when step changes
    // This ensures internal state (like 'answered') resets properly
    switch (questionConfig.type) {
      case 'quantity-comparison':
        return (
          <QuantityComparison
            key={currentStep}
            leftCount={questionConfig.leftCount}
            rightCount={questionConfig.rightCount}
            onAnswer={typedHandler}
          />
        );
      case 'number-line':
        return (
          <NumberLineEstimation
            key={currentStep}
            range={questionConfig.range}
            targetNumber={questionConfig.targetNumber}
            onAnswer={typedHandler}
          />
        );
      case 'mental-rotation':
        return (
          <MentalRotation
            key={currentStep}
            shapeType={questionConfig.shapeType}
            rotationAngle={questionConfig.rotationAngle}
            isMatch={questionConfig.isMatch}
            onAnswer={typedHandler}
          />
        );
      case 'pattern-matching':
        return (
          <PatternMatching
            key={currentStep}
            patternType={questionConfig.patternType}
            correctOption={questionConfig.correctOption}
            targetPattern={questionConfig.targetPattern}
            options={questionConfig.options}
            onAnswer={typedHandler}
            initialAnswer={currentAnswer as 'A' | 'B' | 'C' | 'D' | undefined}
          />
        );
      case 'basic-operations':
        return (
          <BasicOperations
            key={currentStep}
            operationType={questionConfig.operationType}
            operand1={questionConfig.operand1}
            operand2={questionConfig.operand2}
            correctAnswer={questionConfig.correctAnswer}
            onAnswer={typedHandler}
          />
        );
      case 'word-problem':
        return (
          <WordProblem
            key={currentStep}
            problemText={questionConfig.problemText}
            correctAnswer={questionConfig.correctAnswer}
            onAnswer={typedHandler}
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
            <div className="relative z-[999] flex items-center justify-between border-t bg-background p-4">
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
