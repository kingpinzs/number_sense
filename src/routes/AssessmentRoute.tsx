// Assessment route - Entry point for dyscalculia assessment wizard
// Story 2.1: Build Assessment Wizard Shell with Multi-Step Form
// Story 2.6: Results Summary Integration
// Full-page assessment without modal overlay

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useSession } from '@/context/SessionContext';
import { Progress } from '@/shared/components/ui/progress';
import { Button } from '@/shared/components/ui/button';
import {
  QuantityComparison,
  NumberLineEstimation,
  MentalRotation,
  PatternMatching,
  BasicOperations,
  WordProblem,
  generateNumberSenseQuestions,
  generateSpatialQuestions,
  generateOperationsQuestions,
  ResultsSummary,
  type QuantityComparisonResult,
  type NumberLineResult,
  type MentalRotationResult,
  type PatternMatchingResult,
  type BasicOperationsResult,
  type WordProblemResult,
} from '@/features/assessment';
import {
  calculateDomainScore,
  type Domain,
  type QuestionForScoring,
  type DomainScores,
} from '@/services/assessment/scoring';

const TOTAL_QUESTIONS = 10;

const assessmentSchema = z.object({
  currentStep: z.number().min(1).max(TOTAL_QUESTIONS),
  answers: z.array(z.string().optional()),
  startTime: z.string(),
});

type AssessmentFormValues = z.infer<typeof assessmentSchema>;

/**
 * AssessmentRoute - Full-page assessment without modal overlay
 * On completion or exit, navigates back to home.
 */
export default function AssessmentRoute() {
  const navigate = useNavigate();
  const { startSession, endSession } = useSession();
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [assessmentResults, setAssessmentResults] = useState<{
    domainScores: DomainScores;
    completionTime: { minutes: number; seconds: number };
  } | null>(null);
  const questionAreaRef = useRef<HTMLDivElement>(null);

  // Use local state for currentStep - more reliable than React Hook Form for UI state
  const [currentStep, setCurrentStep] = useState(1);
  // Local state for answers for immediate UI feedback
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

  // Initialize form with React Hook Form (for form submission only)
  const methods = useForm<AssessmentFormValues>({
    resolver: zodResolver(assessmentSchema),
    defaultValues: {
      currentStep: 1,
      answers: Array(TOTAL_QUESTIONS).fill(undefined),
      startTime: new Date().toISOString(),
    },
  });

  const { setValue, getValues } = methods;

  // Current answer for validation - use local state
  const currentAnswer = localAnswers[currentStep - 1];
  const hasAnswer = currentAnswer !== undefined && currentAnswer !== '';

  // Progress calculation (0-100%)
  const progressValue = (currentStep / TOTAL_QUESTIONS) * 100;

  // Track if session has been started to prevent duplicate starts
  const sessionStartedRef = useRef(false);

  // Start session on mount
  useEffect(() => {
    if (!sessionStartedRef.current) {
      sessionStartedRef.current = true;
      const sessionId = Date.now();
      startSession('assessment', sessionId);
      setValue('startTime', new Date().toISOString());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Navigate to previous question
  const handlePrevious = useCallback(() => {
    setCurrentStep(prev => {
      if (prev > 1) return prev - 1;
      return prev;
    });
  }, []);

  // Helper function to check if answer is correct
  const isAnswerCorrect = useCallback((questionIndex: number, answer: string | undefined): boolean => {
    if (!answer) return false;

    const question = questions[questionIndex];

    switch (question.type) {
      case 'quantity-comparison': {
        const correctAnswer = question.leftCount > question.rightCount ? 'left'
          : question.leftCount < question.rightCount ? 'right'
          : 'same';
        return answer === correctAnswer;
      }
      case 'number-line': {
        const userAnswer = Number(answer);
        const tolerance = (question.range[1] - question.range[0]) * 0.1; // 10% tolerance
        return Math.abs(userAnswer - question.targetNumber) <= tolerance;
      }
      case 'mental-rotation': {
        const correctAnswer = question.isMatch ? 'yes' : 'no';
        return answer === correctAnswer;
      }
      case 'pattern-matching': {
        return answer === question.correctOption;
      }
      case 'basic-operations': {
        return Number(answer) === question.correctAnswer;
      }
      case 'word-problem': {
        return Number(answer) === question.correctAnswer;
      }
      default:
        return false;
    }
  }, [questions]);

  // Navigate to next question or complete
  const handleNext = useCallback(() => {
    if (!hasAnswer) return;

    if (currentStep < TOTAL_QUESTIONS) {
      setCurrentStep(prev => prev + 1);
    } else {
      // Assessment complete - calculate scores and show results
      endSession();

      const startTime = new Date(getValues('startTime'));
      const endTime = new Date();

      // Calculate completion time
      const durationMs = endTime.getTime() - startTime.getTime();
      const totalSeconds = Math.floor(durationMs / 1000);
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;

      // Build QuestionForScoring array using localAnswers
      // Q1-Q4: number_sense, Q5-Q7: spatial, Q8-Q10: operations
      const questionsForScoring: QuestionForScoring[] = localAnswers.map((answer, index) => {
        let domain: Domain;
        if (index < 4) domain = 'number_sense';
        else if (index < 7) domain = 'spatial';
        else domain = 'operations';

        return {
          domain,
          isCorrect: isAnswerCorrect(index, answer),
        };
      });

      // Calculate domain scores
      const domainScores: DomainScores = {
        number_sense: calculateDomainScore(questionsForScoring, 'number_sense'),
        spatial: calculateDomainScore(questionsForScoring, 'spatial'),
        operations: calculateDomainScore(questionsForScoring, 'operations'),
      };

      // Set results and show summary
      setAssessmentResults({
        domainScores,
        completionTime: { minutes, seconds },
      });
      setShowResults(true);
    }
  }, [currentStep, hasAnswer, endSession, getValues, localAnswers, isAnswerCorrect]);

  // Handle exit with confirmation
  const handleExit = useCallback(() => {
    setShowExitConfirm(true);
  }, []);

  // Confirm exit
  const handleConfirmExit = useCallback(() => {
    endSession();
    navigate('/');
    setShowExitConfirm(false);
  }, [endSession, navigate]);

  // Handle Start Training from results summary
  const handleStartTraining = useCallback(() => {
    navigate('/training');
  }, [navigate]);

  // Cancel exit
  const handleCancelExit = useCallback(() => {
    setShowExitConfirm(false);
  }, []);

  // Handle answer from question components - uses setLocalAnswers for immediate UI feedback
  const handleQuantityAnswer = useCallback((result: QuantityComparisonResult) => {
    setLocalAnswers(prev => {
      const newAnswers = [...prev];
      newAnswers[currentStep - 1] = result.answer;
      return newAnswers;
    });
  }, [currentStep]);

  const handleNumberLineAnswer = useCallback((result: NumberLineResult) => {
    setLocalAnswers(prev => {
      const newAnswers = [...prev];
      newAnswers[currentStep - 1] = String(result.userAnswer);
      return newAnswers;
    });
  }, [currentStep]);

  const handleMentalRotationAnswer = useCallback((result: MentalRotationResult) => {
    setLocalAnswers(prev => {
      const newAnswers = [...prev];
      newAnswers[currentStep - 1] = result.answer;
      return newAnswers;
    });
  }, [currentStep]);

  const handlePatternMatchingAnswer = useCallback((result: PatternMatchingResult) => {
    setLocalAnswers(prev => {
      const newAnswers = [...prev];
      newAnswers[currentStep - 1] = result.selectedOption;
      return newAnswers;
    });
  }, [currentStep]);

  const handleBasicOperationsAnswer = useCallback((result: BasicOperationsResult) => {
    setLocalAnswers(prev => {
      const newAnswers = [...prev];
      newAnswers[currentStep - 1] = String(result.userAnswer);
      return newAnswers;
    });
  }, [currentStep]);

  const handleWordProblemAnswer = useCallback((result: WordProblemResult) => {
    setLocalAnswers(prev => {
      const newAnswers = [...prev];
      newAnswers[currentStep - 1] = String(result.userAnswer);
      return newAnswers;
    });
  }, [currentStep]);

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
            onAnswer={handleQuantityAnswer}
          />
        );
      case 'number-line':
        return (
          <NumberLineEstimation
            range={questionConfig.range}
            targetNumber={questionConfig.targetNumber}
            onAnswer={handleNumberLineAnswer}
          />
        );
      case 'mental-rotation':
        return (
          <MentalRotation
            shapeType={questionConfig.shapeType}
            rotationAngle={questionConfig.rotationAngle}
            isMatch={questionConfig.isMatch}
            onAnswer={handleMentalRotationAnswer}
          />
        );
      case 'pattern-matching':
        return (
          <PatternMatching
            patternType={questionConfig.patternType}
            correctOption={questionConfig.correctOption}
            targetPattern={questionConfig.targetPattern}
            options={questionConfig.options}
            onAnswer={handlePatternMatchingAnswer}
          />
        );
      case 'basic-operations':
        return (
          <BasicOperations
            operationType={questionConfig.operationType}
            operand1={questionConfig.operand1}
            operand2={questionConfig.operand2}
            correctAnswer={questionConfig.correctAnswer}
            onAnswer={handleBasicOperationsAnswer}
          />
        );
      case 'word-problem':
        return (
          <WordProblem
            problemText={questionConfig.problemText}
            correctAnswer={questionConfig.correctAnswer}
            onAnswer={handleWordProblemAnswer}
          />
        );
      default:
        return null;
    }
  };

  // If results are ready, show ResultsSummary
  if (showResults && assessmentResults) {
    return (
      <ResultsSummary
        domainScores={assessmentResults.domainScores}
        completionTime={assessmentResults.completionTime}
        onStartTraining={handleStartTraining}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex min-h-[100dvh] max-w-4xl flex-col" style={{ paddingBottom: 'calc(var(--safe-area-bottom, 0px))' }}>
        {/* Header with exit button */}
        <div className="relative border-b bg-background p-4" style={{ paddingTop: 'calc(1rem + var(--safe-area-top, 0px))' }}>
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-4 min-h-[44px] min-w-[44px]"
            onClick={handleExit}
            aria-label="Exit assessment"
            data-testid="exit-button"
          >
            <X className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-semibold text-foreground">Assessment</h1>

          {/* Step indicator */}
          <div
            className="mt-2 text-center text-lg font-medium text-foreground"
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
        </div>

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
                <h3 id="exit-confirm-title" className="text-xl font-semibold text-foreground">
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
          <div
            className="sticky bottom-0 z-10 flex items-center justify-between border-t bg-background p-4"
            style={{ paddingBottom: 'calc(1rem + var(--safe-area-bottom, 0px))' }}
          >
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
              variant={hasAnswer ? 'default' : 'outline'}
              className={`min-h-[44px] min-w-[120px] gap-2 transition-all ${
                hasAnswer ? 'bg-success hover:bg-success/90 text-success-foreground shadow-lg scale-105' : ''
              }`}
              aria-label={currentStep === TOTAL_QUESTIONS ? 'Complete assessment' : 'Next question'}
              data-testid="next-button"
            >
              <span>
                {currentStep === TOTAL_QUESTIONS ? 'Complete' : 'Next'}
              </span>
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
