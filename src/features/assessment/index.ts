// Public API for assessment
// Expanded to 18 questions across 6 domains

export { AssessmentWizard } from './components/AssessmentWizard';
export type { AssessmentWizardProps } from './components/AssessmentWizard';

export { ResultsSummary } from './components/ResultsSummary';
export type { ResultsSummaryProps } from './components/ResultsSummary';

// Assessment storage service
export { saveAssessmentResults } from '@/services/assessment/storage';
export type { AssessmentResults } from '@/services/assessment/storage';

// Question components
export { QuestionCard } from './components/QuestionCard';
export type { QuestionCardProps } from './components/QuestionCard';

// Original question components
export { QuantityComparison } from './components/QuantityComparison';
export type {
  QuantityComparisonProps,
  QuantityComparisonResult,
} from './components/QuantityComparison';

export { NumberLineEstimation } from './components/NumberLineEstimation';
export type {
  NumberLineEstimationProps,
  NumberLineResult,
} from './components/NumberLineEstimation';

export { MentalRotation } from './components/MentalRotation';
export type {
  MentalRotationProps,
  MentalRotationResult,
} from './components/MentalRotation';

export { PatternMatching } from './components/PatternMatching';
export type {
  PatternMatchingProps,
  PatternMatchingResult,
} from './components/PatternMatching';

export { BasicOperations } from './components/BasicOperations';
export type {
  BasicOperationsProps,
  BasicOperationsResult,
} from './components/BasicOperations';

export { WordProblem } from './components/WordProblem';
export type {
  WordProblemProps,
  WordProblemResult,
} from './components/WordProblem';

// New assessment components
export { SymbolicComparison } from './components/SymbolicComparison';
export type {
  SymbolicComparisonProps,
  SymbolicComparisonResult,
} from './components/SymbolicComparison';

export { DigitValue } from './components/DigitValue';
export type {
  DigitValueProps,
  DigitValueResult,
} from './components/DigitValue';

export { EstimationQuestion } from './components/EstimationQuestion';
export type {
  EstimationQuestionProps,
  EstimationQuestionResult,
} from './components/EstimationQuestion';

export { NumberDecomposition } from './components/NumberDecomposition';
export type {
  NumberDecompositionProps,
  NumberDecompositionResult,
} from './components/NumberDecomposition';

export { NumberOrdering } from './components/NumberOrdering';
export type {
  NumberOrderingProps,
  NumberOrderingResult,
} from './components/NumberOrdering';

export { SkipCounting } from './components/SkipCounting';
export type {
  SkipCountingProps,
  SkipCountingResult,
} from './components/SkipCounting';

export { TimedFactRetrieval } from './components/TimedFactRetrieval';
export type {
  TimedFactRetrievalProps,
  TimedFactRetrievalResult,
} from './components/TimedFactRetrieval';

export { MirrorDiscrimination } from './components/MirrorDiscrimination';
export type {
  MirrorDiscriminationProps,
  MirrorDiscriminationResult,
} from './components/MirrorDiscrimination';

export { FractionIdentification } from './components/FractionIdentification';
export type {
  FractionIdentificationProps,
  FractionIdentificationResult,
} from './components/FractionIdentification';

export { ClockReading } from './components/ClockReading';
export type {
  ClockReadingProps,
  ClockReadingResult,
} from './components/ClockReading';

export { WorkingMemorySpan } from './components/WorkingMemorySpan';
export type {
  WorkingMemorySpanProps,
  WorkingMemorySpanResult,
} from './components/WorkingMemorySpan';

// Question configuration
export {
  generateQuantityComparisonConfig,
  generateNumberLineConfig,
  generateNumberSenseQuestions,
  generateMentalRotationConfig,
  generatePatternMatchingConfig,
  generateSpatialQuestions,
  generateBasicOperationsConfig,
  generateWordProblemConfig,
  generateOperationsQuestions,
  generateArithmeticQuestions,
  generatePlaceValueQuestions,
  generateSequencingQuestions,
  generateAppliedQuestions,
  generateSymbolicComparisonConfig,
} from './content/questions';
export type {
  QuantityComparisonConfig,
  NumberLineEstimationConfig,
  NumberSenseQuestionConfig,
  SymbolicComparisonConfig,
  MentalRotationConfig,
  PatternMatchingConfig,
  MirrorDiscriminationConfig,
  SpatialQuestionConfig,
  BasicOperationsConfig,
  WordProblemConfig,
  OperationsQuestionConfig,
  ArithmeticQuestionConfig,
  TimedFactRetrievalConfig,
  DigitValueConfig,
  EstimationQuestionConfig,
  NumberDecompositionConfig,
  PlaceValueQuestionConfig,
  NumberOrderingConfig,
  SkipCountingConfig,
  SequencingQuestionConfig,
  FractionIdentificationConfig,
  ClockReadingConfig,
  WorkingMemorySpanConfig,
  AppliedQuestionConfig,
  AssessmentQuestionConfig,
} from './content/questions';
