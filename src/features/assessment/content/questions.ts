// Question configurations for assessment
// Expanded from 10 to 18 questions across 6 domains

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

export interface SymbolicComparisonConfig {
  type: 'symbolic-comparison';
  id: string;
  leftNumber: number;
  rightNumber: number;
}

export type NumberSenseQuestionConfig =
  | QuantityComparisonConfig
  | NumberLineEstimationConfig
  | SymbolicComparisonConfig;

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

/**
 * Generate randomized quantity comparison questions
 * Returns dot counts between 5-20 for each side
 */
export function generateQuantityComparisonConfig(
  id: string,
  seed?: number
): QuantityComparisonConfig {
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
 */
export function generateNumberLineConfig(
  id: string,
  rangeType: '0-100' | '0-1000' = '0-100',
  seed?: number
): NumberLineEstimationConfig {
  const random = seed !== undefined ? seededRandom(seed) : Math.random;

  const range: [number, number] = rangeType === '0-100' ? [0, 100] : [0, 1000];
  const [min, max] = range;

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
 * Generate symbolic comparison question (compare two written numbers)
 */
export function generateSymbolicComparisonConfig(
  id: string,
  seed?: number
): SymbolicComparisonConfig {
  const random = seed !== undefined ? seededRandom(seed) : Math.random;

  // Generate 3-digit numbers that are close but different
  const base = Math.floor(random() * 900) + 100; // 100-999
  const offset = Math.floor(random() * 50) + 1;  // 1-50 difference
  const leftNumber = base;
  const rightNumber = random() > 0.5 ? base + offset : base - offset;

  return {
    type: 'symbolic-comparison',
    id,
    leftNumber: Math.max(100, leftNumber),
    rightNumber: Math.max(100, Math.abs(rightNumber)),
  };
}

/**
 * Number sense questions for assessment (Q1-Q3)
 * Q1: Quantity Comparison (dot groups)
 * Q2: Number Line Estimation
 * Q3: Symbolic Comparison (written numerals)
 */
export function generateNumberSenseQuestions(seed?: number): NumberSenseQuestionConfig[] {
  const baseSeed = seed ?? Date.now();

  return [
    generateQuantityComparisonConfig('q1', baseSeed),
    generateNumberLineConfig('q2', '0-100', baseSeed + 1),
    generateSymbolicComparisonConfig('q3', baseSeed + 2),
  ];
}

// ============================================================================
// Place Value & Estimation Questions (Q4-Q6)
// ============================================================================

export interface DigitValueConfig {
  type: 'digit-value';
  id: string;
  number: number;
  highlightIndex: number;   // Index of digit to highlight (0 = leftmost)
  correctValue: number;     // Place value of that digit
  choices: number[];        // 4 choices
}

export interface EstimationQuestionConfig {
  type: 'estimation-question';
  id: string;
  expression: string;       // e.g., "47 + 38"
  correctAnswer: number;
  choices: number[];         // 4 estimate choices
}

export interface NumberDecompositionConfig {
  type: 'number-decomposition';
  id: string;
  number: number;
  correctDecomposition: string;
  choices: string[];
}

export type PlaceValueQuestionConfig =
  | DigitValueConfig
  | EstimationQuestionConfig
  | NumberDecompositionConfig;

function generateDigitValueConfig(id: string, seed?: number): DigitValueConfig {
  const random = seed !== undefined ? seededRandom(seed) : Math.random;

  // Generate a 3-digit number
  const number = Math.floor(random() * 900) + 100; // 100-999
  const digits = String(number).split('').map(Number);
  const highlightIndex = Math.floor(random() * 3);

  // Calculate place value
  const placeValues = [100, 10, 1];
  const correctValue = digits[highlightIndex] * placeValues[highlightIndex];

  // Generate wrong choices
  const wrongChoices = new Set<number>();
  wrongChoices.add(digits[highlightIndex]); // The digit itself (common mistake)
  for (const pv of placeValues) {
    wrongChoices.add(digits[highlightIndex] * pv);
  }
  wrongChoices.delete(correctValue);

  const choices = [correctValue];
  for (const w of wrongChoices) {
    if (choices.length < 4) choices.push(w);
  }
  while (choices.length < 4) {
    const filler = Math.floor(random() * 900) + 1;
    if (!choices.includes(filler)) choices.push(filler);
  }

  // Shuffle choices
  for (let i = choices.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [choices[i], choices[j]] = [choices[j], choices[i]];
  }

  return { type: 'digit-value', id, number, highlightIndex, correctValue, choices };
}

function generateEstimationQuestionConfig(id: string, seed?: number): EstimationQuestionConfig {
  const random = seed !== undefined ? seededRandom(seed) : Math.random;

  const a = Math.floor(random() * 80) + 10; // 10-89
  const b = Math.floor(random() * 80) + 10; // 10-89
  const correctAnswer = a + b;
  const expression = `${a} + ${b}`;

  // Generate choices: correct ± spread
  const spread = Math.max(10, Math.floor(correctAnswer * 0.2));
  const choices = [
    correctAnswer,
    correctAnswer + spread,
    correctAnswer - spread,
    correctAnswer + spread * 2,
  ];

  for (let i = choices.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [choices[i], choices[j]] = [choices[j], choices[i]];
  }

  return { type: 'estimation-question', id, expression, correctAnswer, choices };
}

function generateNumberDecompositionConfig(id: string, seed?: number): NumberDecompositionConfig {
  const random = seed !== undefined ? seededRandom(seed) : Math.random;

  const number = Math.floor(random() * 900) + 100; // 100-999
  const hundreds = Math.floor(number / 100) * 100;
  const tens = Math.floor((number % 100) / 10) * 10;
  const ones = number % 10;
  const correctDecomposition = `${hundreds} + ${tens} + ${ones}`;

  // Wrong decompositions
  const choices = [correctDecomposition];
  choices.push(`${hundreds + 100} + ${tens} + ${ones}`);
  choices.push(`${hundreds} + ${tens + 10} + ${ones}`);
  choices.push(`${Math.floor(number / 10) * 10} + ${number % 10}`);

  for (let i = choices.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [choices[i], choices[j]] = [choices[j], choices[i]];
  }

  return { type: 'number-decomposition', id, number, correctDecomposition, choices };
}

export function generatePlaceValueQuestions(seed?: number): PlaceValueQuestionConfig[] {
  const baseSeed = seed ?? Date.now();
  return [
    generateDigitValueConfig('q4', baseSeed + 3),
    generateEstimationQuestionConfig('q5', baseSeed + 4),
    generateNumberDecompositionConfig('q6', baseSeed + 5),
  ];
}

// ============================================================================
// Sequencing & Patterns Questions (Q7-Q9)
// ============================================================================

export interface NumberOrderingConfig {
  type: 'number-ordering';
  id: string;
  numbers: number[];          // Scrambled numbers
  correctOrder: number[];     // Sorted ascending
}

export interface SkipCountingConfig {
  type: 'skip-counting';
  id: string;
  sequence: number[];         // Visible numbers
  correctNext: number;        // Next number in sequence
}

export type SequencingQuestionConfig =
  | NumberOrderingConfig
  | SkipCountingConfig
  | PatternMatchingConfig;

function generateNumberOrderingConfig(id: string, seed?: number): NumberOrderingConfig {
  const random = seed !== undefined ? seededRandom(seed) : Math.random;

  // Generate 5 unique random numbers
  const numbers: number[] = [];
  while (numbers.length < 5) {
    const n = Math.floor(random() * 100) + 1;
    if (!numbers.includes(n)) numbers.push(n);
  }

  const correctOrder = [...numbers].sort((a, b) => a - b);

  // Shuffle for display
  const shuffled = [...numbers];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return { type: 'number-ordering', id, numbers: shuffled, correctOrder };
}

function generateSkipCountingConfig(id: string, seed?: number): SkipCountingConfig {
  const random = seed !== undefined ? seededRandom(seed) : Math.random;

  const steps = [2, 3, 5, 10];
  const step = steps[Math.floor(random() * steps.length)];
  const start = Math.floor(random() * 20) * step;

  const sequence = [start, start + step, start + step * 2];
  const correctNext = start + step * 3;

  return { type: 'skip-counting', id, sequence, correctNext };
}

export function generateSequencingQuestions(seed?: number): SequencingQuestionConfig[] {
  const baseSeed = seed ?? Date.now();
  return [
    generateNumberOrderingConfig('q7', baseSeed + 6),
    generateSkipCountingConfig('q8', baseSeed + 7),
    generatePatternMatchingConfig('q9', baseSeed + 8),
  ];
}

// ============================================================================
// Spatial Awareness Question Types
// ============================================================================

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

export interface MirrorDiscriminationConfig {
  type: 'mirror-discrimination';
  id: string;
  shapeType: string;
  isActuallyMirrored: boolean;
}

export type SpatialQuestionConfig =
  | MentalRotationConfig
  | MirrorDiscriminationConfig;

/** Available shape types for mental rotation */
const SHAPE_TYPES = ['L-shape', 'T-shape', 'zigzag', 'irregular-polygon', 'arrow'];

/** Rotation angles (90, 180, 270) */
const ROTATION_ANGLES = [90, 180, 270] as const;

/** Pattern templates for 3x3 grids */
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

export function generateMentalRotationConfig(
  id: string,
  seed?: number
): MentalRotationConfig {
  const random = seed !== undefined ? seededRandom(seed) : Math.random;

  const shapeType = SHAPE_TYPES[Math.floor(random() * SHAPE_TYPES.length)];
  const rotationAngle = ROTATION_ANGLES[Math.floor(random() * ROTATION_ANGLES.length)];
  const isMatch = random() > 0.5;

  return { type: 'mental-rotation', id, shapeType, rotationAngle, isMatch };
}

function generatePatternVariant(original: number[][], seed: number): number[][] {
  const random = seededRandom(seed);
  const variant = original.map(row => [...row]);

  const changes = Math.floor(random() * 2) + 2;
  for (let i = 0; i < changes; i++) {
    const row = Math.floor(random() * 3);
    const col = Math.floor(random() * 3);
    variant[row][col] = variant[row][col] === 1 ? 0 : 1;
  }

  const isDifferent = JSON.stringify(variant) !== JSON.stringify(original);
  if (!isDifferent) {
    variant[0][0] = variant[0][0] === 1 ? 0 : 1;
  }

  return variant;
}

export function generatePatternMatchingConfig(
  id: string,
  seed?: number
): PatternMatchingConfig {
  const random = seed !== undefined ? seededRandom(seed) : Math.random;

  const patternTypes = Object.keys(PATTERN_TEMPLATES);
  const patternType = patternTypes[Math.floor(random() * patternTypes.length)];
  const targetPattern = PATTERN_TEMPLATES[patternType as keyof typeof PATTERN_TEMPLATES];

  const correctOptions = ['A', 'B', 'C', 'D'] as const;
  const correctOption = correctOptions[Math.floor(random() * 4)];

  const baseSeed = seed ?? Date.now();
  const options = {
    A: correctOption === 'A' ? targetPattern : generatePatternVariant(targetPattern, baseSeed + 1),
    B: correctOption === 'B' ? targetPattern : generatePatternVariant(targetPattern, baseSeed + 2),
    C: correctOption === 'C' ? targetPattern : generatePatternVariant(targetPattern, baseSeed + 3),
    D: correctOption === 'D' ? targetPattern : generatePatternVariant(targetPattern, baseSeed + 4),
  };

  return { type: 'pattern-matching', id, patternType, correctOption, targetPattern, options };
}

function generateMirrorDiscriminationConfig(
  id: string,
  seed?: number
): MirrorDiscriminationConfig {
  const random = seed !== undefined ? seededRandom(seed) : Math.random;

  const shapeType = SHAPE_TYPES[Math.floor(random() * SHAPE_TYPES.length)];
  const isActuallyMirrored = random() > 0.5;

  return { type: 'mirror-discrimination', id, shapeType, isActuallyMirrored };
}

/**
 * Spatial questions for assessment (Q13-Q15)
 * Q13: Mental Rotation
 * Q14: Mental Rotation (different angle)
 * Q15: Mirror Discrimination
 */
export function generateSpatialQuestions(seed?: number): SpatialQuestionConfig[] {
  const baseSeed = seed ?? Date.now();
  return [
    generateMentalRotationConfig('q13', baseSeed + 12),
    generateMentalRotationConfig('q14', baseSeed + 13),
    generateMirrorDiscriminationConfig('q15', baseSeed + 14),
  ];
}

// ============================================================================
// Arithmetic Fluency Questions (Q10-Q12)
// ============================================================================

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

export interface TimedFactRetrievalConfig {
  type: 'timed-fact-retrieval';
  id: string;
  operand1: number;
  operand2: number;
  operation: '+' | '-' | '\u00d7';
  correctAnswer: number;
  timeLimitMs: number;
}

export type ArithmeticQuestionConfig =
  | BasicOperationsConfig
  | WordProblemConfig
  | TimedFactRetrievalConfig;

// Keep legacy alias for backward compatibility
export type OperationsQuestionConfig = ArithmeticQuestionConfig;

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

export function generateBasicOperationsConfig(
  id: string,
  difficulty: 'easy' | 'medium' | 'hard' = 'easy',
  seed?: number
): BasicOperationsConfig {
  const random = seed !== undefined ? seededRandom(seed) : Math.random;

  const operationType = random() > 0.5 ? 'addition' : 'subtraction';

  let min: number, max: number;
  switch (difficulty) {
    case 'easy':   min = 1;  max = 20; break;
    case 'medium': min = 10; max = 50; break;
    case 'hard':   min = 20; max = 99; break;
  }

  const operand1 = Math.floor(random() * (max - min + 1)) + min;
  const operand2 = Math.floor(random() * (max - min + 1)) + min;

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

export function generateWordProblemConfig(
  id: string,
  seed?: number
): WordProblemConfig {
  const random = seed !== undefined ? seededRandom(seed) : Math.random;

  const contexts = ['apples', 'coins', 'toys', 'books'] as const;
  const context = contexts[Math.floor(random() * contexts.length)];
  const operationType = random() > 0.5 ? 'addition' : 'subtraction';

  const num1 = Math.floor(random() * 20) + 1;
  const num2 = Math.floor(random() * 20) + 1;

  let finalNum1 = num1;
  let finalNum2 = num2;
  if (operationType === 'subtraction' && num1 < num2) {
    [finalNum1, finalNum2] = [num2, num1];
  }

  const template = WORD_PROBLEM_TEMPLATES[context][operationType];
  const problemText = template(finalNum1, finalNum2);

  const correctAnswer =
    operationType === 'addition' ? finalNum1 + finalNum2 : finalNum1 - finalNum2;

  return { type: 'word-problem', id, problemText, correctAnswer, context };
}

function generateTimedFactRetrievalConfig(
  id: string,
  seed?: number
): TimedFactRetrievalConfig {
  const random = seed !== undefined ? seededRandom(seed) : Math.random;

  const operand1 = Math.floor(random() * 10) + 1;
  const operand2 = Math.floor(random() * 10) + 1;
  const operation = '+' as const;
  const correctAnswer = operand1 + operand2;

  return {
    type: 'timed-fact-retrieval',
    id,
    operand1,
    operand2,
    operation,
    correctAnswer,
    timeLimitMs: 8000,
  };
}

/**
 * Arithmetic fluency questions for assessment (Q10-Q12)
 * Q10: Basic Operations
 * Q11: Word Problem
 * Q12: Timed Fact Retrieval
 */
export function generateArithmeticQuestions(seed?: number): ArithmeticQuestionConfig[] {
  const baseSeed = seed ?? Date.now();
  return [
    generateBasicOperationsConfig('q10', 'easy', baseSeed + 9),
    generateWordProblemConfig('q11', baseSeed + 10),
    generateTimedFactRetrievalConfig('q12', baseSeed + 11),
  ];
}

// Legacy alias
export function generateOperationsQuestions(seed?: number): OperationsQuestionConfig[] {
  return generateArithmeticQuestions(seed);
}

// ============================================================================
// Applied Math Questions (Q16-Q18)
// ============================================================================

export interface FractionIdentificationConfig {
  type: 'fraction-identification';
  id: string;
  numerator: number;
  denominator: number;
  choices: string[];     // e.g., ["1/4", "1/3", "1/2", "2/3"]
}

export interface ClockReadingConfig {
  type: 'clock-reading';
  id: string;
  hours: number;
  minutes: number;
  choices: string[];     // e.g., ["3:15", "3:30", "3:45", "4:00"]
}

export interface WorkingMemorySpanConfig {
  type: 'working-memory-span';
  id: string;
  numbers: number[];
}

export type AppliedQuestionConfig =
  | FractionIdentificationConfig
  | ClockReadingConfig
  | WorkingMemorySpanConfig;

function generateFractionIdentificationConfig(
  id: string,
  seed?: number
): FractionIdentificationConfig {
  const random = seed !== undefined ? seededRandom(seed) : Math.random;

  const denominators = [2, 3, 4, 6, 8];
  const denominator = denominators[Math.floor(random() * denominators.length)];
  const numerator = Math.floor(random() * (denominator - 1)) + 1;

  const correctFraction = `${numerator}/${denominator}`;
  const choices = [correctFraction];

  // Generate wrong choices
  while (choices.length < 4) {
    const wrongNum = Math.floor(random() * 7) + 1;
    const wrongDen = denominators[Math.floor(random() * denominators.length)];
    const wrongFraction = `${Math.min(wrongNum, wrongDen - 1)}/${wrongDen}`;
    if (!choices.includes(wrongFraction)) choices.push(wrongFraction);
  }

  for (let i = choices.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [choices[i], choices[j]] = [choices[j], choices[i]];
  }

  return { type: 'fraction-identification', id, numerator, denominator, choices };
}

function generateClockReadingConfig(
  id: string,
  seed?: number
): ClockReadingConfig {
  const random = seed !== undefined ? seededRandom(seed) : Math.random;

  const hours = Math.floor(random() * 12) + 1;
  const minuteOptions = [0, 15, 30, 45];
  const minutes = minuteOptions[Math.floor(random() * minuteOptions.length)];

  const formatTime = (h: number, m: number) =>
    `${h}:${String(m).padStart(2, '0')}`;

  const correct = formatTime(hours, minutes);
  const choices = [correct];

  // Wrong choices: adjacent times
  const wrongTimes = [
    formatTime(hours, (minutes + 15) % 60),
    formatTime(hours, (minutes + 30) % 60),
    formatTime(hours % 12 + 1, minutes),
  ];
  for (const wt of wrongTimes) {
    if (!choices.includes(wt)) choices.push(wt);
  }
  while (choices.length < 4) {
    const wh = Math.floor(random() * 12) + 1;
    const wm = minuteOptions[Math.floor(random() * minuteOptions.length)];
    const wt = formatTime(wh, wm);
    if (!choices.includes(wt)) choices.push(wt);
  }

  for (let i = choices.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [choices[i], choices[j]] = [choices[j], choices[i]];
  }

  return { type: 'clock-reading', id, hours, minutes, choices };
}

function generateWorkingMemorySpanConfig(
  id: string,
  seed?: number
): WorkingMemorySpanConfig {
  const random = seed !== undefined ? seededRandom(seed) : Math.random;

  // 3 single-digit numbers
  const numbers = [
    Math.floor(random() * 9) + 1,
    Math.floor(random() * 9) + 1,
    Math.floor(random() * 9) + 1,
  ];

  return { type: 'working-memory-span', id, numbers };
}

/**
 * Applied math questions for assessment (Q16-Q18)
 * Q16: Fraction Identification
 * Q17: Clock Reading
 * Q18: Working Memory Span
 */
export function generateAppliedQuestions(seed?: number): AppliedQuestionConfig[] {
  const baseSeed = seed ?? Date.now();
  return [
    generateFractionIdentificationConfig('q16', baseSeed + 15),
    generateClockReadingConfig('q17', baseSeed + 16),
    generateWorkingMemorySpanConfig('q18', baseSeed + 17),
  ];
}

// ============================================================================
// All Question Types Union
// ============================================================================

export type AssessmentQuestionConfig =
  | NumberSenseQuestionConfig
  | PlaceValueQuestionConfig
  | SequencingQuestionConfig
  | ArithmeticQuestionConfig
  | SpatialQuestionConfig
  | AppliedQuestionConfig;
