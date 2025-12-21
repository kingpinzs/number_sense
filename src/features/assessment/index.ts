// Public API for assessment
// Story 2.1: Assessment wizard shell and multi-step form
// Story 2.2: Number sense question types
// Story 2.3: Spatial awareness question types
// Story 2.4: Operations question types
// Story 2.6: Results summary visualization

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
} from './content/questions';
export type {
  QuantityComparisonConfig,
  NumberLineEstimationConfig,
  NumberSenseQuestionConfig,
  MentalRotationConfig,
  PatternMatchingConfig,
  SpatialQuestionConfig,
  BasicOperationsConfig,
  WordProblemConfig,
  OperationsQuestionConfig,
} from './content/questions';
