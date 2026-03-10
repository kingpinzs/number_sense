// Assessment route - Entry point for dyscalculia assessment wizard
// Expanded from 10 to 18 questions across 6 domains
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
  ResultsSummary,
  type QuantityComparisonResult,
  type NumberLineResult,
  type MentalRotationResult,
  type PatternMatchingResult,
  type BasicOperationsResult,
  type WordProblemResult,
} from '@/features/assessment';
import {
  SymbolicComparison,
  DigitValue,
  EstimationQuestion,
  NumberDecomposition,
  NumberOrdering,
  SkipCounting,
  TimedFactRetrieval,
  MirrorDiscrimination,
  FractionIdentification,
  ClockReading,
  WorkingMemorySpan,
  type SymbolicComparisonResult,
  type DigitValueResult,
  type EstimationQuestionResult,
  type NumberDecompositionResult,
  type NumberOrderingResult,
  type SkipCountingResult,
  type TimedFactRetrievalResult,
  type MirrorDiscriminationResult,
  type FractionIdentificationResult,
  type ClockReadingResult,
  type WorkingMemorySpanResult,
} from '@/features/assessment';
import {
  generateNumberSenseQuestions,
  generatePlaceValueQuestions,
  generateSequencingQuestions,
  generateArithmeticQuestions,
  generateSpatialQuestions,
  generateAppliedQuestions,
} from '@/features/assessment/content/questions';
import {
  calculateDomainScore,
  ALL_DOMAINS,
  type Domain,
  type QuestionForScoring,
  type DomainScores,
} from '@/services/assessment/scoring';

const TOTAL_QUESTIONS = 18;

const assessmentSchema = z.object({
  currentStep: z.number().min(1).max(TOTAL_QUESTIONS),
  answers: z.array(z.string().optional()),
  startTime: z.string(),
});

type AssessmentFormValues = z.infer<typeof assessmentSchema>;

/**
 * Map question index (0-17) to domain
 * Q1-Q3 (0-2): number_sense
 * Q4-Q6 (3-5): place_value
 * Q7-Q9 (6-8): sequencing
 * Q10-Q12 (9-11): arithmetic
 * Q13-Q15 (12-14): spatial
 * Q16-Q18 (15-17): applied
 */
function getDomainForIndex(index: number): Domain {
  if (index < 3) return 'number_sense';
  if (index < 6) return 'place_value';
  if (index < 9) return 'sequencing';
  if (index < 12) return 'arithmetic';
  if (index < 15) return 'spatial';
  return 'applied';
}

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

  const [currentStep, setCurrentStep] = useState(1);
  const [localAnswers, setLocalAnswers] = useState<(string | undefined)[]>(Array(TOTAL_QUESTIONS).fill(undefined));

  // Generate all questions once
  const questions = useMemo(() => {
    const seed = Date.now();
    return [
      ...generateNumberSenseQuestions(seed),      // Q1-Q3
      ...generatePlaceValueQuestions(seed),        // Q4-Q6
      ...generateSequencingQuestions(seed),         // Q7-Q9
      ...generateArithmeticQuestions(seed),         // Q10-Q12
      ...generateSpatialQuestions(seed),            // Q13-Q15
      ...generateAppliedQuestions(seed),            // Q16-Q18
    ];
  }, []);

  const methods = useForm<AssessmentFormValues>({
    resolver: zodResolver(assessmentSchema),
    defaultValues: {
      currentStep: 1,
      answers: Array(TOTAL_QUESTIONS).fill(undefined),
      startTime: new Date().toISOString(),
    },
  });

  const { setValue, getValues } = methods;

  const currentAnswer = localAnswers[currentStep - 1];
  const hasAnswer = currentAnswer !== undefined && currentAnswer !== '';

  const progressValue = (currentStep / TOTAL_QUESTIONS) * 100;

  const sessionStartedRef = useRef(false);

  useEffect(() => {
    if (!sessionStartedRef.current) {
      sessionStartedRef.current = true;
      const sessionId = Date.now();
      startSession('assessment', sessionId);
      setValue('startTime', new Date().toISOString());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePrevious = useCallback(() => {
    setCurrentStep(prev => {
      if (prev > 1) return prev - 1;
      return prev;
    });
  }, []);

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
        const tolerance = (question.range[1] - question.range[0]) * 0.1;
        return Math.abs(userAnswer - question.targetNumber) <= tolerance;
      }
      case 'symbolic-comparison': {
        const correct = question.leftNumber > question.rightNumber ? 'left' : 'right';
        return answer === correct;
      }
      case 'digit-value':
        return Number(answer) === question.correctValue;
      case 'estimation-question':
        return Number(answer) === question.correctAnswer;
      case 'number-decomposition':
        return answer === question.correctDecomposition;
      case 'number-ordering':
        return answer === JSON.stringify(question.correctOrder);
      case 'skip-counting':
        return Number(answer) === question.correctNext;
      case 'pattern-matching':
        return answer === question.correctOption;
      case 'basic-operations':
        return Number(answer) === question.correctAnswer;
      case 'word-problem':
        return Number(answer) === question.correctAnswer;
      case 'timed-fact-retrieval':
        return Number(answer) === question.correctAnswer;
      case 'mental-rotation': {
        const correctAnswer = question.isMatch ? 'yes' : 'no';
        return answer === correctAnswer;
      }
      case 'mirror-discrimination': {
        const correct = question.isActuallyMirrored ? 'mirrored' : 'rotated';
        return answer === correct;
      }
      case 'fraction-identification': {
        const correct = `${question.numerator}/${question.denominator}`;
        return answer === correct;
      }
      case 'clock-reading': {
        const h = question.hours;
        const m = String(question.minutes).padStart(2, '0');
        return answer === `${h}:${m}`;
      }
      case 'working-memory-span': {
        const sum = question.numbers.reduce((a: number, b: number) => a + b, 0);
        return Number(answer) === sum;
      }
      default:
        return false;
    }
  }, [questions]);

  const handleNext = useCallback(() => {
    if (!hasAnswer) return;

    if (currentStep < TOTAL_QUESTIONS) {
      setCurrentStep(prev => prev + 1);
    } else {
      endSession();

      const startTime = new Date(getValues('startTime'));
      const endTime = new Date();

      const durationMs = endTime.getTime() - startTime.getTime();
      const totalSeconds = Math.floor(durationMs / 1000);
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;

      // Build QuestionForScoring array
      const questionsForScoring: QuestionForScoring[] = localAnswers.map((answer, index) => ({
        domain: getDomainForIndex(index),
        isCorrect: isAnswerCorrect(index, answer),
      }));

      // Calculate domain scores
      const domainScores: DomainScores = {} as DomainScores;
      for (const domain of ALL_DOMAINS) {
        domainScores[domain] = calculateDomainScore(questionsForScoring, domain);
      }

      setAssessmentResults({
        domainScores,
        completionTime: { minutes, seconds },
      });
      setShowResults(true);
    }
  }, [currentStep, hasAnswer, endSession, getValues, localAnswers, isAnswerCorrect]);

  const handleExit = useCallback(() => {
    setShowExitConfirm(true);
  }, []);

  const handleConfirmExit = useCallback(() => {
    endSession();
    navigate('/');
    setShowExitConfirm(false);
  }, [endSession, navigate]);

  const handleStartTraining = useCallback(() => {
    navigate('/training');
  }, [navigate]);

  const handleCancelExit = useCallback(() => {
    setShowExitConfirm(false);
  }, []);

  // Generic answer handler for simple string answers
  const setAnswer = useCallback((value: string) => {
    setLocalAnswers(prev => {
      const newAnswers = [...prev];
      newAnswers[currentStep - 1] = value;
      return newAnswers;
    });
  }, [currentStep]);

  // Specific handlers for existing components that use typed results
  const handleQuantityAnswer = useCallback((result: QuantityComparisonResult) => {
    setAnswer(result.answer);
  }, [setAnswer]);

  const handleNumberLineAnswer = useCallback((result: NumberLineResult) => {
    setAnswer(String(result.userAnswer));
  }, [setAnswer]);

  const handleMentalRotationAnswer = useCallback((result: MentalRotationResult) => {
    setAnswer(result.answer);
  }, [setAnswer]);

  const handlePatternMatchingAnswer = useCallback((result: PatternMatchingResult) => {
    setAnswer(result.selectedOption);
  }, [setAnswer]);

  const handleBasicOperationsAnswer = useCallback((result: BasicOperationsResult) => {
    setAnswer(String(result.userAnswer));
  }, [setAnswer]);

  const handleWordProblemAnswer = useCallback((result: WordProblemResult) => {
    setAnswer(String(result.userAnswer));
  }, [setAnswer]);

  // New question type handlers
  const handleSymbolicComparisonAnswer = useCallback((result: SymbolicComparisonResult) => {
    setAnswer(result.answer);
  }, [setAnswer]);

  const handleDigitValueAnswer = useCallback((result: DigitValueResult) => {
    setAnswer(String(result.userAnswer));
  }, [setAnswer]);

  const handleEstimationAnswer = useCallback((result: EstimationQuestionResult) => {
    setAnswer(String(result.userAnswer));
  }, [setAnswer]);

  const handleNumberDecompositionAnswer = useCallback((result: NumberDecompositionResult) => {
    setAnswer(result.userAnswer);
  }, [setAnswer]);

  const handleNumberOrderingAnswer = useCallback((result: NumberOrderingResult) => {
    setAnswer(JSON.stringify(result.order));
  }, [setAnswer]);

  const handleSkipCountingAnswer = useCallback((result: SkipCountingResult) => {
    setAnswer(String(result.userAnswer));
  }, [setAnswer]);

  const handleTimedFactAnswer = useCallback((result: TimedFactRetrievalResult) => {
    setAnswer(String(result.userAnswer));
  }, [setAnswer]);

  const handleMirrorAnswer = useCallback((result: MirrorDiscriminationResult) => {
    setAnswer(result.answer);
  }, [setAnswer]);

  const handleFractionAnswer = useCallback((result: FractionIdentificationResult) => {
    setAnswer(result.userAnswer);
  }, [setAnswer]);

  const handleClockAnswer = useCallback((result: ClockReadingResult) => {
    setAnswer(result.userAnswer);
  }, [setAnswer]);

  const handleWorkingMemoryAnswer = useCallback((result: WorkingMemorySpanResult) => {
    setAnswer(String(result.userAnswer));
  }, [setAnswer]);

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
      case 'symbolic-comparison':
        return (
          <SymbolicComparison
            leftNumber={questionConfig.leftNumber}
            rightNumber={questionConfig.rightNumber}
            onAnswer={handleSymbolicComparisonAnswer}
          />
        );
      case 'digit-value':
        return (
          <DigitValue
            number={questionConfig.number}
            highlightIndex={questionConfig.highlightIndex}
            correctValue={questionConfig.correctValue}
            choices={questionConfig.choices}
            onAnswer={handleDigitValueAnswer}
          />
        );
      case 'estimation-question':
        return (
          <EstimationQuestion
            expression={questionConfig.expression}
            correctAnswer={questionConfig.correctAnswer}
            choices={questionConfig.choices}
            onAnswer={handleEstimationAnswer}
          />
        );
      case 'number-decomposition':
        return (
          <NumberDecomposition
            number={questionConfig.number}
            correctDecomposition={questionConfig.correctDecomposition}
            choices={questionConfig.choices}
            onAnswer={handleNumberDecompositionAnswer}
          />
        );
      case 'number-ordering':
        return (
          <NumberOrdering
            numbers={questionConfig.numbers}
            onAnswer={handleNumberOrderingAnswer}
          />
        );
      case 'skip-counting':
        return (
          <SkipCounting
            sequence={questionConfig.sequence}
            correctNext={questionConfig.correctNext}
            onAnswer={handleSkipCountingAnswer}
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
      case 'timed-fact-retrieval':
        return (
          <TimedFactRetrieval
            operand1={questionConfig.operand1}
            operand2={questionConfig.operand2}
            operation={questionConfig.operation}
            correctAnswer={questionConfig.correctAnswer}
            timeLimitMs={questionConfig.timeLimitMs}
            onAnswer={handleTimedFactAnswer}
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
      case 'mirror-discrimination':
        return (
          <MirrorDiscrimination
            shapeType={questionConfig.shapeType}
            isActuallyMirrored={questionConfig.isActuallyMirrored}
            onAnswer={handleMirrorAnswer}
          />
        );
      case 'fraction-identification':
        return (
          <FractionIdentification
            numerator={questionConfig.numerator}
            denominator={questionConfig.denominator}
            choices={questionConfig.choices}
            onAnswer={handleFractionAnswer}
          />
        );
      case 'clock-reading':
        return (
          <ClockReading
            hours={questionConfig.hours}
            minutes={questionConfig.minutes}
            choices={questionConfig.choices}
            onAnswer={handleClockAnswer}
          />
        );
      case 'working-memory-span':
        return (
          <WorkingMemorySpan
            numbers={questionConfig.numbers}
            onAnswer={handleWorkingMemoryAnswer}
          />
        );
      default:
        return null;
    }
  };

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
