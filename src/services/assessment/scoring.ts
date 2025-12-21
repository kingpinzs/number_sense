// Scoring Algorithm and Weakness Identification
// Story 2.5: Implement Scoring Algorithm and Weakness Identification
// Pure functions for calculating domain scores, identifying weaknesses, and generating training weights

/**
 * Domain type for assessment scoring
 */
export type Domain = 'number_sense' | 'spatial' | 'operations';

/**
 * Question result interface for scoring
 */
export interface QuestionForScoring {
  domain: Domain;
  isCorrect: boolean;
}

/**
 * Domain scores object
 */
export interface DomainScores {
  number_sense: number;
  spatial: number;
  operations: number;
}

/**
 * Categorized domains by weakness level
 */
export interface WeaknessCategories {
  weaknesses: Domain[];
  moderate: Domain[];
  strengths: Domain[];
}

/**
 * Training weights for personalized training plan
 */
export interface TrainingWeights {
  number_sense: number;
  spatial: number;
  operations: number;
}

/**
 * Question distribution per domain
 * - Number Sense: Q1-Q4 (4 questions)
 * - Spatial: Q5-Q7 (3 questions)
 * - Operations: Q8-Q10 (3 questions)
 */
const DOMAIN_QUESTION_COUNTS: Record<Domain, number> = {
  number_sense: 4,
  spatial: 3,
  operations: 3,
};

/**
 * calculateDomainScore - Calculate 0-5 scale score for a domain
 *
 * Formula: (correct answers / total questions for domain) × 5
 *
 * @param questions - Array of question results with domain and correctness
 * @param domain - Domain to calculate score for
 * @returns Score between 0.0 and 5.0
 *
 * @example
 * // Number sense: 2 correct out of 4 questions
 * calculateDomainScore(questions, 'number_sense') // Returns 2.5
 *
 * // Spatial: all 3 correct
 * calculateDomainScore(questions, 'spatial') // Returns 5.0
 */
export function calculateDomainScore(
  questions: QuestionForScoring[],
  domain: Domain
): number {
  // Filter questions for this domain
  const domainQuestions = questions.filter((q) => q.domain === domain);

  // Handle empty case
  if (domainQuestions.length === 0) {
    return 0.0;
  }

  // Count correct answers
  const correctCount = domainQuestions.filter((q) => q.isCorrect).length;

  // Get expected question count for this domain
  const totalQuestions = DOMAIN_QUESTION_COUNTS[domain];

  // Calculate score: (correct / total) × 5
  const score = (correctCount / totalQuestions) * 5;

  return score;
}

/**
 * identifyWeaknesses - Categorize domains by score thresholds
 *
 * Thresholds:
 * - Score ≤ 2.5: Weak area (needs priority training)
 * - Score 2.6-3.5: Moderate (needs some focus)
 * - Score > 3.5: Strength (occasional practice)
 *
 * @param domainScores - Scores for each domain (0-5 scale)
 * @returns Categorized domains by weakness level
 *
 * @example
 * identifyWeaknesses({ number_sense: 2.0, spatial: 3.0, operations: 4.5 })
 * // Returns: { weaknesses: ['number_sense'], moderate: ['spatial'], strengths: ['operations'] }
 */
export function identifyWeaknesses(
  domainScores: DomainScores
): WeaknessCategories {
  const weaknesses: Domain[] = [];
  const moderate: Domain[] = [];
  const strengths: Domain[] = [];

  // Categorize each domain
  for (const [domain, score] of Object.entries(domainScores) as [Domain, number][]) {
    if (score <= 2.5) {
      weaknesses.push(domain);
    } else if (score <= 3.5) {
      moderate.push(domain);
    } else {
      strengths.push(domain);
    }
  }

  return {
    weaknesses,
    moderate,
    strengths,
  };
}

/**
 * generateWeights - Generate normalized training weights
 *
 * Weight assignments:
 * - Weak areas: 2.0x weight
 * - Moderate areas: 1.0x weight
 * - Strengths: 0.5x weight
 *
 * Weights are normalized so the sum equals exactly 1.0
 *
 * @param categories - Categorized domains by weakness level
 * @returns Normalized training weights (sum = 1.0)
 *
 * @example
 * // One weak, one moderate, one strength
 * generateWeights({
 *   weaknesses: ['number_sense'],
 *   moderate: ['operations'],
 *   strengths: ['spatial']
 * })
 * // Raw weights: [2.0, 1.0, 0.5] sum = 3.5
 * // Normalized: [0.571, 0.286, 0.143] sum = 1.0
 */
export function generateWeights(
  categories: WeaknessCategories
): TrainingWeights {
  // Initialize raw weights
  const rawWeights: Record<Domain, number> = {
    number_sense: 0,
    spatial: 0,
    operations: 0,
  };

  // Assign raw weights based on category
  // Weaknesses: 2.0x
  for (const domain of categories.weaknesses) {
    rawWeights[domain] = 2.0;
  }

  // Moderate: 1.0x
  for (const domain of categories.moderate) {
    rawWeights[domain] = 1.0;
  }

  // Strengths: 0.5x
  for (const domain of categories.strengths) {
    rawWeights[domain] = 0.5;
  }

  // Calculate sum for normalization
  const sum = Object.values(rawWeights).reduce((acc, weight) => acc + weight, 0);

  // Normalize weights to sum to 1.0
  // Handle edge case where sum is 0 (shouldn't happen in normal usage)
  if (sum === 0) {
    return {
      number_sense: 1 / 3,
      spatial: 1 / 3,
      operations: 1 / 3,
    };
  }

  // Normalize each weight
  const normalizedWeights: TrainingWeights = {
    number_sense: rawWeights.number_sense / sum,
    spatial: rawWeights.spatial / sum,
    operations: rawWeights.operations / sum,
  };

  return normalizedWeights;
}
