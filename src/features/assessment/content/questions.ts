// Question configurations for assessment
// Story 2.2: Number Sense Question Types

export interface QuantityComparisonConfig {
  type: 'quantity-comparison';
  id: string;
  leftCount: number;
  rightCount: number;
}

export interface NumberLineEstimationConfig {
  type: 'number-line';
  id: string;
  range: [number, number];
  targetNumber: number;
}

export type NumberSenseQuestionConfig =
  | QuantityComparisonConfig
  | NumberLineEstimationConfig;

/**
 * Generate randomized quantity comparison questions
 * Returns dot counts between 5-20 for each side
 */
export function generateQuantityComparisonConfig(
  id: string,
  seed?: number
): QuantityComparisonConfig {
  // Use seed for deterministic generation if provided
  const random = seed !== undefined ? seededRandom(seed) : Math.random;

  const leftCount = Math.floor(random() * 16) + 5; // 5-20
  const rightCount = Math.floor(random() * 16) + 5; // 5-20

  return {
    type: 'quantity-comparison',
    id,
    leftCount,
    rightCount,
  };
}

/**
 * Generate randomized number line estimation questions
 * Range: 0-100 or 0-1000, target within range
 */
export function generateNumberLineConfig(
  id: string,
  rangeType: '0-100' | '0-1000' = '0-100',
  seed?: number
): NumberLineEstimationConfig {
  const random = seed !== undefined ? seededRandom(seed) : Math.random;

  const range: [number, number] = rangeType === '0-100' ? [0, 100] : [0, 1000];
  const [min, max] = range;

  // Generate target away from endpoints (10%-90% of range)
  const rangeSize = max - min;
  const targetNumber = Math.round(min + rangeSize * 0.1 + random() * rangeSize * 0.8);

  return {
    type: 'number-line',
    id,
    range,
    targetNumber,
  };
}

/**
 * Default number sense questions for assessment
 * Q1-Q2: Quantity Comparison
 * Q3-Q4: Number Line Estimation
 */
export function generateNumberSenseQuestions(seed?: number): NumberSenseQuestionConfig[] {
  const baseSeed = seed ?? Date.now();

  return [
    generateQuantityComparisonConfig('q1', baseSeed),
    generateQuantityComparisonConfig('q2', baseSeed + 1),
    generateNumberLineConfig('q3', '0-100', baseSeed + 2),
    generateNumberLineConfig('q4', '0-1000', baseSeed + 3),
  ];
}

/**
 * Simple seeded random number generator (mulberry32)
 * Provides deterministic randomness for testing
 */
function seededRandom(seed: number): () => number {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Story 2.3: Spatial Awareness Question Types

export interface MentalRotationConfig {
  type: 'mental-rotation';
  id: string;
  shapeType: string;
  rotationAngle: 90 | 180 | 270;
  isMatch: boolean;
}

export interface PatternMatchingConfig {
  type: 'pattern-matching';
  id: string;
  patternType: string;
  correctOption: 'A' | 'B' | 'C' | 'D';
  targetPattern: number[][];
  options: {
    A: number[][];
    B: number[][];
    C: number[][];
    D: number[][];
  };
}

export type SpatialQuestionConfig =
  | MentalRotationConfig
  | PatternMatchingConfig;

/** Available shape types for mental rotation */
const SHAPE_TYPES = ['L-shape', 'T-shape', 'zigzag', 'irregular-polygon', 'arrow'];

/** Rotation angles (90°, 180°, 270°) */
const ROTATION_ANGLES = [90, 180, 270] as const;

/** Pattern templates for 3×3 grids */
const PATTERN_TEMPLATES = {
  checkerboard: [
    [1, 0, 1],
    [0, 1, 0],
    [1, 0, 1],
  ],
  diagonal: [
    [1, 0, 0],
    [0, 1, 0],
    [0, 0, 1],
  ],
  'diagonal-reverse': [
    [0, 0, 1],
    [0, 1, 0],
    [1, 0, 0],
  ],
  cross: [
    [0, 1, 0],
    [1, 1, 1],
    [0, 1, 0],
  ],
  border: [
    [1, 1, 1],
    [1, 0, 1],
    [1, 1, 1],
  ],
  corners: [
    [1, 0, 1],
    [0, 0, 0],
    [1, 0, 1],
  ],
};

/**
 * Generate randomized mental rotation question
 * Returns shape type, rotation angle, and whether shapes match
 */
export function generateMentalRotationConfig(
  id: string,
  seed?: number
): MentalRotationConfig {
  const random = seed !== undefined ? seededRandom(seed) : Math.random;

  const shapeType = SHAPE_TYPES[Math.floor(random() * SHAPE_TYPES.length)];
  const rotationAngle = ROTATION_ANGLES[Math.floor(random() * ROTATION_ANGLES.length)];
  const isMatch = random() > 0.5; // 50% chance of match

  return {
    type: 'mental-rotation',
    id,
    shapeType,
    rotationAngle,
    isMatch,
  };
}

/**
 * Generate a variant pattern by changing cells to ensure it's different
 */
function generatePatternVariant(original: number[][], seed: number): number[][] {
  const random = seededRandom(seed);
  const variant = original.map(row => [...row]);

  // Always change at least 2 cells to ensure difference
  const changes = Math.floor(random() * 2) + 2; // 2-3 changes

  for (let i = 0; i < changes; i++) {
    const row = Math.floor(random() * 3);
    const col = Math.floor(random() * 3);
    variant[row][col] = variant[row][col] === 1 ? 0 : 1;
  }

  // Verify it's actually different (extremely unlikely to be same after 2+ changes)
  const isDifferent = JSON.stringify(variant) !== JSON.stringify(original);
  if (!isDifferent) {
    // Failsafe: change corner cell if somehow still the same
    variant[0][0] = variant[0][0] === 1 ? 0 : 1;
  }

  return variant;
}

/**
 * Generate randomized pattern matching question
 * Returns pattern type and 4 grid options with one correct match
 */
export function generatePatternMatchingConfig(
  id: string,
  seed?: number
): PatternMatchingConfig {
  const random = seed !== undefined ? seededRandom(seed) : Math.random;

  const patternTypes = Object.keys(PATTERN_TEMPLATES);
  const patternType = patternTypes[Math.floor(random() * patternTypes.length)];
  const targetPattern = PATTERN_TEMPLATES[patternType as keyof typeof PATTERN_TEMPLATES];

  // Randomly select which option is correct
  const correctOptions = ['A', 'B', 'C', 'D'] as const;
  const correctOption = correctOptions[Math.floor(random() * 4)];

  // Generate options: correct one matches, others are variants
  const baseSeed = seed ?? Date.now();
  const options = {
    A: correctOption === 'A' ? targetPattern : generatePatternVariant(targetPattern, baseSeed + 1),
    B: correctOption === 'B' ? targetPattern : generatePatternVariant(targetPattern, baseSeed + 2),
    C: correctOption === 'C' ? targetPattern : generatePatternVariant(targetPattern, baseSeed + 3),
    D: correctOption === 'D' ? targetPattern : generatePatternVariant(targetPattern, baseSeed + 4),
  };

  return {
    type: 'pattern-matching',
    id,
    patternType,
    correctOption,
    targetPattern,
    options,
  };
}

/**
 * Default spatial awareness questions for assessment
 * Q5-Q6: Mental Rotation
 * Q7: Pattern Matching
 */
export function generateSpatialQuestions(seed?: number): SpatialQuestionConfig[] {
  const baseSeed = seed ?? Date.now();

  return [
    generateMentalRotationConfig('q5', baseSeed + 4),
    generateMentalRotationConfig('q6', baseSeed + 5),
    generatePatternMatchingConfig('q7', baseSeed + 6),
  ];
}

// Story 2.4: Operations Question Types

export interface BasicOperationsConfig {
  type: 'basic-operations';
  id: string;
  operationType: 'addition' | 'subtraction';
  operand1: number;
  operand2: number;
  correctAnswer: number;
}

export interface WordProblemConfig {
  type: 'word-problem';
  id: string;
  problemText: string;
  correctAnswer: number;
  context: 'apples' | 'coins' | 'toys' | 'books';
}

export type OperationsQuestionConfig =
  | BasicOperationsConfig
  | WordProblemConfig;

/** Word problem templates by context */
const WORD_PROBLEM_TEMPLATES = {
  apples: {
    addition: (a: number, b: number) =>
      `You have ${a} apples. Your friend gives you ${b} more apples. How many apples do you have now?`,
    subtraction: (a: number, b: number) =>
      `You have ${a} apples. You give away ${b} apples. How many apples do you have now?`,
  },
  coins: {
    addition: (a: number, b: number) =>
      `You have ${a} coins. You find ${b} more coins. How many coins do you have now?`,
    subtraction: (a: number, b: number) =>
      `You have ${a} coins. You spend ${b} coins. How many coins do you have now?`,
  },
  toys: {
    addition: (a: number, b: number) =>
      `You have ${a} toys. You get ${b} more toys. How many toys do you have now?`,
    subtraction: (a: number, b: number) =>
      `You have ${a} toys. You give ${b} toys to your friend. How many toys do you have now?`,
  },
  books: {
    addition: (a: number, b: number) =>
      `You have ${a} books. You buy ${b} more books. How many books do you have now?`,
    subtraction: (a: number, b: number) =>
      `You have ${a} books. You donate ${b} books to the library. How many books do you have now?`,
  },
};

/**
 * Generate randomized basic operations question
 * Difficulty: 1-20 for easy, 10-50 for medium, 20-99 for hard
 * Ensures subtraction results are non-negative
 */
export function generateBasicOperationsConfig(
  id: string,
  difficulty: 'easy' | 'medium' | 'hard' = 'easy',
  seed?: number
): BasicOperationsConfig {
  const random = seed !== undefined ? seededRandom(seed) : Math.random;

  // Select operation type (50/50 split)
  const operationType = random() > 0.5 ? 'addition' : 'subtraction';

  // Determine operand ranges based on difficulty
  let min: number, max: number;
  switch (difficulty) {
    case 'easy':
      min = 1;
      max = 20;
      break;
    case 'medium':
      min = 10;
      max = 50;
      break;
    case 'hard':
      min = 20;
      max = 99;
      break;
  }

  const operand1 = Math.floor(random() * (max - min + 1)) + min;
  const operand2 = Math.floor(random() * (max - min + 1)) + min;

  // For subtraction, ensure operand1 >= operand2 (no negative results)
  let finalOperand1 = operand1;
  let finalOperand2 = operand2;
  if (operationType === 'subtraction' && operand1 < operand2) {
    [finalOperand1, finalOperand2] = [operand2, operand1];
  }

  const correctAnswer =
    operationType === 'addition'
      ? finalOperand1 + finalOperand2
      : finalOperand1 - finalOperand2;

  return {
    type: 'basic-operations',
    id,
    operationType,
    operand1: finalOperand1,
    operand2: finalOperand2,
    correctAnswer,
  };
}

/**
 * Generate randomized word problem question
 * Uses simple contexts (apples, coins, toys, books) with clear numbers
 */
export function generateWordProblemConfig(
  id: string,
  seed?: number
): WordProblemConfig {
  const random = seed !== undefined ? seededRandom(seed) : Math.random;

  // Select context
  const contexts = ['apples', 'coins', 'toys', 'books'] as const;
  const context = contexts[Math.floor(random() * contexts.length)];

  // Select operation type (50/50 split)
  const operationType = random() > 0.5 ? 'addition' : 'subtraction';

  // Generate numbers (1-20 range for dyscalculia-friendly problems)
  const num1 = Math.floor(random() * 20) + 1; // 1-20
  const num2 = Math.floor(random() * 20) + 1; // 1-20

  // For subtraction, ensure num1 >= num2 (no negative results)
  let finalNum1 = num1;
  let finalNum2 = num2;
  if (operationType === 'subtraction' && num1 < num2) {
    [finalNum1, finalNum2] = [num2, num1];
  }

  // Generate problem text
  const template = WORD_PROBLEM_TEMPLATES[context][operationType];
  const problemText = template(finalNum1, finalNum2);

  // Calculate correct answer
  const correctAnswer =
    operationType === 'addition'
      ? finalNum1 + finalNum2
      : finalNum1 - finalNum2;

  return {
    type: 'word-problem',
    id,
    problemText,
    correctAnswer,
    context,
  };
}

/**
 * Default operations questions for assessment
 * Q8-Q9: Basic Operations (addition/subtraction)
 * Q10: Word Problem
 */
export function generateOperationsQuestions(seed?: number): OperationsQuestionConfig[] {
  const baseSeed = seed ?? Date.now();

  return [
    generateBasicOperationsConfig('q8', 'easy', baseSeed + 7),
    generateBasicOperationsConfig('q9', 'easy', baseSeed + 8),
    generateWordProblemConfig('q10', baseSeed + 9),
  ];
}
