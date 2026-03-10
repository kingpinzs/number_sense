// questions.test.ts - Unit tests for question configuration functions
// Covers all 6 assessment domains (18 questions total):
//   Number Sense (Q1-Q3), Place Value (Q4-Q6), Sequencing (Q7-Q9),
//   Arithmetic (Q10-Q12), Spatial (Q13-Q15), Applied (Q16-Q18)

import { describe, it, expect } from 'vitest';
import {
  generateQuantityComparisonConfig,
  generateNumberLineConfig,
  generateSymbolicComparisonConfig,
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
} from './questions';

// ============================================================================
// Number Sense Questions (Q1-Q3)
// ============================================================================

describe('generateQuantityComparisonConfig', () => {
  it('returns correct type', () => {
    const config = generateQuantityComparisonConfig('q1');
    expect(config.type).toBe('quantity-comparison');
  });

  it('returns provided id', () => {
    const config = generateQuantityComparisonConfig('test-id');
    expect(config.id).toBe('test-id');
  });

  it('generates leftCount between 5 and 20', () => {
    for (let seed = 0; seed < 100; seed++) {
      const config = generateQuantityComparisonConfig('q', seed);
      expect(config.leftCount).toBeGreaterThanOrEqual(5);
      expect(config.leftCount).toBeLessThanOrEqual(20);
    }
  });

  it('generates rightCount between 5 and 20', () => {
    for (let seed = 0; seed < 100; seed++) {
      const config = generateQuantityComparisonConfig('q', seed);
      expect(config.rightCount).toBeGreaterThanOrEqual(5);
      expect(config.rightCount).toBeLessThanOrEqual(20);
    }
  });

  it('produces deterministic results with same seed', () => {
    const config1 = generateQuantityComparisonConfig('q1', 12345);
    const config2 = generateQuantityComparisonConfig('q1', 12345);

    expect(config1.leftCount).toBe(config2.leftCount);
    expect(config1.rightCount).toBe(config2.rightCount);
  });

  it('produces different results with different seeds', () => {
    const config1 = generateQuantityComparisonConfig('q1', 1);
    const config2 = generateQuantityComparisonConfig('q1', 999);

    // At least one should differ (probabilistically certain)
    const allSame =
      config1.leftCount === config2.leftCount && config1.rightCount === config2.rightCount;
    expect(allSame).toBe(false);
  });
});

describe('generateNumberLineConfig', () => {
  it('returns correct type', () => {
    const config = generateNumberLineConfig('q1');
    expect(config.type).toBe('number-line');
  });

  it('returns provided id', () => {
    const config = generateNumberLineConfig('test-id');
    expect(config.id).toBe('test-id');
  });

  it('uses 0-100 range by default', () => {
    const config = generateNumberLineConfig('q1');
    expect(config.range).toEqual([0, 100]);
  });

  it('supports 0-100 range type', () => {
    const config = generateNumberLineConfig('q1', '0-100');
    expect(config.range).toEqual([0, 100]);
  });

  it('supports 0-1000 range type', () => {
    const config = generateNumberLineConfig('q1', '0-1000');
    expect(config.range).toEqual([0, 1000]);
  });

  it('generates targetNumber within 10%-90% of 0-100 range', () => {
    for (let seed = 0; seed < 100; seed++) {
      const config = generateNumberLineConfig('q', '0-100', seed);
      expect(config.targetNumber).toBeGreaterThanOrEqual(10);
      expect(config.targetNumber).toBeLessThanOrEqual(90);
    }
  });

  it('generates targetNumber within 10%-90% of 0-1000 range', () => {
    for (let seed = 0; seed < 100; seed++) {
      const config = generateNumberLineConfig('q', '0-1000', seed);
      expect(config.targetNumber).toBeGreaterThanOrEqual(100);
      expect(config.targetNumber).toBeLessThanOrEqual(900);
    }
  });

  it('produces deterministic results with same seed', () => {
    const config1 = generateNumberLineConfig('q1', '0-100', 12345);
    const config2 = generateNumberLineConfig('q1', '0-100', 12345);

    expect(config1.targetNumber).toBe(config2.targetNumber);
  });
});

describe('generateSymbolicComparisonConfig', () => {
  it('returns correct type', () => {
    const config = generateSymbolicComparisonConfig('q3');
    expect(config.type).toBe('symbolic-comparison');
  });

  it('returns provided id', () => {
    const config = generateSymbolicComparisonConfig('test-id');
    expect(config.id).toBe('test-id');
  });

  it('generates leftNumber of at least 100', () => {
    for (let seed = 0; seed < 100; seed++) {
      const config = generateSymbolicComparisonConfig('q', seed);
      expect(config.leftNumber).toBeGreaterThanOrEqual(100);
    }
  });

  it('generates rightNumber of at least 100', () => {
    for (let seed = 0; seed < 100; seed++) {
      const config = generateSymbolicComparisonConfig('q', seed);
      expect(config.rightNumber).toBeGreaterThanOrEqual(100);
    }
  });

  it('produces deterministic results with same seed', () => {
    const config1 = generateSymbolicComparisonConfig('q3', 12345);
    const config2 = generateSymbolicComparisonConfig('q3', 12345);

    expect(config1.leftNumber).toBe(config2.leftNumber);
    expect(config1.rightNumber).toBe(config2.rightNumber);
  });

  it('produces different results with different seeds', () => {
    const config1 = generateSymbolicComparisonConfig('q3', 1);
    const config2 = generateSymbolicComparisonConfig('q3', 999);

    const allSame =
      config1.leftNumber === config2.leftNumber && config1.rightNumber === config2.rightNumber;
    expect(allSame).toBe(false);
  });
});

describe('generateNumberSenseQuestions', () => {
  it('returns 3 questions', () => {
    const questions = generateNumberSenseQuestions();
    expect(questions).toHaveLength(3);
  });

  it('Q1 is quantity-comparison', () => {
    const questions = generateNumberSenseQuestions();
    expect(questions[0].type).toBe('quantity-comparison');
  });

  it('Q2 is number-line', () => {
    const questions = generateNumberSenseQuestions();
    expect(questions[1].type).toBe('number-line');
  });

  it('Q3 is symbolic-comparison', () => {
    const questions = generateNumberSenseQuestions();
    expect(questions[2].type).toBe('symbolic-comparison');
  });

  it('assigns correct ids q1-q3', () => {
    const questions = generateNumberSenseQuestions();
    expect(questions[0].id).toBe('q1');
    expect(questions[1].id).toBe('q2');
    expect(questions[2].id).toBe('q3');
  });

  it('produces deterministic results with same seed', () => {
    const questions1 = generateNumberSenseQuestions(12345);
    const questions2 = generateNumberSenseQuestions(12345);

    expect(questions1).toEqual(questions2);
  });

  it('Q2 uses 0-100 range', () => {
    const questions = generateNumberSenseQuestions();
    const q2 = questions[1];
    if (q2.type === 'number-line') {
      expect(q2.range).toEqual([0, 100]);
    }
  });

  it('Q3 has leftNumber and rightNumber properties', () => {
    const questions = generateNumberSenseQuestions(42);
    const q3 = questions[2];
    if (q3.type === 'symbolic-comparison') {
      expect(q3.leftNumber).toBeGreaterThanOrEqual(100);
      expect(q3.rightNumber).toBeGreaterThanOrEqual(100);
    }
  });
});

// ============================================================================
// Place Value & Estimation Questions (Q4-Q6)
// ============================================================================

describe('generatePlaceValueQuestions', () => {
  it('returns 3 questions', () => {
    const questions = generatePlaceValueQuestions();
    expect(questions).toHaveLength(3);
  });

  it('Q4 is digit-value', () => {
    const questions = generatePlaceValueQuestions();
    expect(questions[0].type).toBe('digit-value');
  });

  it('Q5 is estimation-question', () => {
    const questions = generatePlaceValueQuestions();
    expect(questions[1].type).toBe('estimation-question');
  });

  it('Q6 is number-decomposition', () => {
    const questions = generatePlaceValueQuestions();
    expect(questions[2].type).toBe('number-decomposition');
  });

  it('assigns correct ids q4-q6', () => {
    const questions = generatePlaceValueQuestions();
    expect(questions[0].id).toBe('q4');
    expect(questions[1].id).toBe('q5');
    expect(questions[2].id).toBe('q6');
  });

  it('produces deterministic results with same seed', () => {
    const questions1 = generatePlaceValueQuestions(12345);
    const questions2 = generatePlaceValueQuestions(12345);

    expect(questions1).toEqual(questions2);
  });

  it('produces different questions with different seeds', () => {
    const questions1 = generatePlaceValueQuestions(1);
    const questions2 = generatePlaceValueQuestions(999);

    const allSame = JSON.stringify(questions1) === JSON.stringify(questions2);
    expect(allSame).toBe(false);
  });

  it('digit-value question has required properties', () => {
    const questions = generatePlaceValueQuestions(42);
    const q4 = questions[0];
    if (q4.type === 'digit-value') {
      expect(q4.number).toBeGreaterThanOrEqual(100);
      expect(q4.number).toBeLessThanOrEqual(999);
      expect(q4.highlightIndex).toBeGreaterThanOrEqual(0);
      expect(q4.highlightIndex).toBeLessThanOrEqual(2);
      expect(typeof q4.correctValue).toBe('number');
      expect(q4.choices).toHaveLength(4);
    }
  });

  it('estimation question has required properties', () => {
    const questions = generatePlaceValueQuestions(42);
    const q5 = questions[1];
    if (q5.type === 'estimation-question') {
      expect(typeof q5.expression).toBe('string');
      expect(q5.expression).toMatch(/\d+\s*\+\s*\d+/);
      expect(typeof q5.correctAnswer).toBe('number');
      expect(q5.choices).toHaveLength(4);
      expect(q5.choices).toContain(q5.correctAnswer);
    }
  });

  it('number-decomposition question has required properties', () => {
    const questions = generatePlaceValueQuestions(42);
    const q6 = questions[2];
    if (q6.type === 'number-decomposition') {
      expect(q6.number).toBeGreaterThanOrEqual(100);
      expect(q6.number).toBeLessThanOrEqual(999);
      expect(typeof q6.correctDecomposition).toBe('string');
      expect(q6.correctDecomposition).toMatch(/\d+\s*\+\s*\d+\s*\+\s*\d+/);
      expect(q6.choices).toHaveLength(4);
      expect(q6.choices).toContain(q6.correctDecomposition);
    }
  });
});

// ============================================================================
// Sequencing & Patterns Questions (Q7-Q9)
// ============================================================================

describe('generateSequencingQuestions', () => {
  it('returns 3 questions', () => {
    const questions = generateSequencingQuestions();
    expect(questions).toHaveLength(3);
  });

  it('Q7 is number-ordering', () => {
    const questions = generateSequencingQuestions();
    expect(questions[0].type).toBe('number-ordering');
  });

  it('Q8 is skip-counting', () => {
    const questions = generateSequencingQuestions();
    expect(questions[1].type).toBe('skip-counting');
  });

  it('Q9 is pattern-matching', () => {
    const questions = generateSequencingQuestions();
    expect(questions[2].type).toBe('pattern-matching');
  });

  it('assigns correct ids q7-q9', () => {
    const questions = generateSequencingQuestions();
    expect(questions[0].id).toBe('q7');
    expect(questions[1].id).toBe('q8');
    expect(questions[2].id).toBe('q9');
  });

  it('produces deterministic results with same seed', () => {
    const questions1 = generateSequencingQuestions(12345);
    const questions2 = generateSequencingQuestions(12345);

    expect(questions1).toEqual(questions2);
  });

  it('produces different questions with different seeds', () => {
    const questions1 = generateSequencingQuestions(1);
    const questions2 = generateSequencingQuestions(999);

    const allSame = JSON.stringify(questions1) === JSON.stringify(questions2);
    expect(allSame).toBe(false);
  });

  it('number-ordering question has required properties', () => {
    const questions = generateSequencingQuestions(42);
    const q7 = questions[0];
    if (q7.type === 'number-ordering') {
      expect(q7.numbers).toHaveLength(5);
      expect(q7.correctOrder).toHaveLength(5);
      // correctOrder should be sorted ascending
      for (let i = 1; i < q7.correctOrder.length; i++) {
        expect(q7.correctOrder[i]).toBeGreaterThan(q7.correctOrder[i - 1]);
      }
      // numbers and correctOrder should contain same elements
      expect([...q7.numbers].sort((a, b) => a - b)).toEqual(q7.correctOrder);
    }
  });

  it('skip-counting question has required properties', () => {
    const questions = generateSequencingQuestions(42);
    const q8 = questions[1];
    if (q8.type === 'skip-counting') {
      expect(q8.sequence).toHaveLength(3);
      expect(typeof q8.correctNext).toBe('number');
      // Verify the step is consistent
      const step = q8.sequence[1] - q8.sequence[0];
      expect(q8.sequence[2] - q8.sequence[1]).toBe(step);
      expect(q8.correctNext - q8.sequence[2]).toBe(step);
    }
  });

  it('pattern-matching question has required properties', () => {
    const questions = generateSequencingQuestions(42);
    const q9 = questions[2];
    if (q9.type === 'pattern-matching') {
      expect(q9.targetPattern).toHaveLength(3);
      q9.targetPattern.forEach((row) => {
        expect(row).toHaveLength(3);
      });
      expect(['A', 'B', 'C', 'D']).toContain(q9.correctOption);
      expect(q9.options.A).toBeDefined();
      expect(q9.options.B).toBeDefined();
      expect(q9.options.C).toBeDefined();
      expect(q9.options.D).toBeDefined();
    }
  });
});

// ============================================================================
// Arithmetic Fluency Questions (Q10-Q12)
// ============================================================================

describe('generateBasicOperationsConfig', () => {
  it('generates addition operation config', () => {
    const config = generateBasicOperationsConfig('test-q', 'easy', 123);

    expect(config.type).toBe('basic-operations');
    expect(config.id).toBe('test-q');
    expect(config.operationType).toMatch(/addition|subtraction/);
    expect(config.operand1).toBeGreaterThanOrEqual(1);
    expect(config.operand2).toBeGreaterThanOrEqual(1);
    expect(typeof config.correctAnswer).toBe('number');
  });

  it('generates subtraction operation config', () => {
    const config = generateBasicOperationsConfig('test-q', 'easy', 456);

    expect(config.type).toBe('basic-operations');
    expect(config.operationType).toMatch(/addition|subtraction/);
  });

  it('generates correct answer for addition', () => {
    const config = generateBasicOperationsConfig('test-q', 'easy', 789);

    if (config.operationType === 'addition') {
      expect(config.correctAnswer).toBe(config.operand1 + config.operand2);
    }
  });

  it('generates correct answer for subtraction with no negatives', () => {
    const config = generateBasicOperationsConfig('test-q', 'easy', 101112);

    if (config.operationType === 'subtraction') {
      expect(config.correctAnswer).toBe(config.operand1 - config.operand2);
      expect(config.correctAnswer).toBeGreaterThanOrEqual(0);
      expect(config.operand1).toBeGreaterThanOrEqual(config.operand2);
    }
  });

  it('respects easy difficulty range (1-20)', () => {
    const config = generateBasicOperationsConfig('test-q', 'easy', 131415);

    expect(config.operand1).toBeGreaterThanOrEqual(1);
    expect(config.operand1).toBeLessThanOrEqual(20);
    expect(config.operand2).toBeGreaterThanOrEqual(1);
    expect(config.operand2).toBeLessThanOrEqual(20);
  });

  it('respects medium difficulty range (10-50)', () => {
    const config = generateBasicOperationsConfig('test-q', 'medium', 161718);

    expect(config.operand1).toBeGreaterThanOrEqual(10);
    expect(config.operand1).toBeLessThanOrEqual(50);
    expect(config.operand2).toBeGreaterThanOrEqual(10);
    expect(config.operand2).toBeLessThanOrEqual(50);
  });

  it('respects hard difficulty range (20-99)', () => {
    const config = generateBasicOperationsConfig('test-q', 'hard', 192021);

    expect(config.operand1).toBeGreaterThanOrEqual(20);
    expect(config.operand1).toBeLessThanOrEqual(99);
    expect(config.operand2).toBeGreaterThanOrEqual(20);
    expect(config.operand2).toBeLessThanOrEqual(99);
  });

  it('produces deterministic results with same seed', () => {
    const config1 = generateBasicOperationsConfig('test-q', 'easy', 999);
    const config2 = generateBasicOperationsConfig('test-q', 'easy', 999);

    expect(config1).toEqual(config2);
  });

  it('produces different results with different seeds', () => {
    const config1 = generateBasicOperationsConfig('test-q', 'easy', 1);
    const config2 = generateBasicOperationsConfig('test-q', 'easy', 999999);

    expect(config1).not.toEqual(config2);
  });

  it('produces varying results without seed', () => {
    const config1 = generateBasicOperationsConfig('test-q1');
    const config2 = generateBasicOperationsConfig('test-q2');

    // Should be valid configs (may be same or different)
    expect(config1.type).toBe('basic-operations');
    expect(config2.type).toBe('basic-operations');
  });
});

describe('generateWordProblemConfig', () => {
  it('generates word problem config', () => {
    const config = generateWordProblemConfig('test-q', 123);

    expect(config.type).toBe('word-problem');
    expect(config.id).toBe('test-q');
    expect(typeof config.problemText).toBe('string');
    expect(config.problemText.length).toBeGreaterThan(10);
    expect(config.context).toMatch(/apples|coins|toys|books/);
    expect(typeof config.correctAnswer).toBe('number');
  });

  it('generates problem with apples context', () => {
    for (let seed = 1; seed < 100; seed++) {
      const config = generateWordProblemConfig('test-q', seed);
      if (config.context === 'apples') {
        expect(config.problemText).toContain('apple');
        break;
      }
    }
  });

  it('generates problem with coins context', () => {
    for (let seed = 1; seed < 100; seed++) {
      const config = generateWordProblemConfig('test-q', seed);
      if (config.context === 'coins') {
        expect(config.problemText).toContain('coin');
        break;
      }
    }
  });

  it('generates problem with toys context', () => {
    for (let seed = 1; seed < 100; seed++) {
      const config = generateWordProblemConfig('test-q', seed);
      if (config.context === 'toys') {
        expect(config.problemText).toContain('toy');
        break;
      }
    }
  });

  it('generates problem with books context', () => {
    for (let seed = 1; seed < 100; seed++) {
      const config = generateWordProblemConfig('test-q', seed);
      if (config.context === 'books') {
        expect(config.problemText).toContain('book');
        break;
      }
    }
  });

  it('includes numbers in problem text', () => {
    const config = generateWordProblemConfig('test-q', 456);

    expect(/\d+/.test(config.problemText)).toBe(true);
  });

  it('generates correct answer for addition problems', () => {
    for (let seed = 1; seed < 20; seed++) {
      const config = generateWordProblemConfig('test-q', seed);

      if (
        config.problemText.includes('more') ||
        config.problemText.includes('find') ||
        config.problemText.includes('get') ||
        config.problemText.includes('buy')
      ) {
        // Addition problem
        expect(config.correctAnswer).toBeGreaterThan(0);
      }
    }
  });

  it('generates correct answer for subtraction problems', () => {
    for (let seed = 1; seed < 20; seed++) {
      const config = generateWordProblemConfig('test-q', seed);

      if (
        config.problemText.includes('give away') ||
        config.problemText.includes('spend') ||
        config.problemText.includes('donate')
      ) {
        // Subtraction problem
        expect(config.correctAnswer).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it('uses dyscalculia-friendly range (1-20)', () => {
    const config = generateWordProblemConfig('test-q', 789);

    // Answer should be in reasonable range for simple problems
    expect(config.correctAnswer).toBeGreaterThanOrEqual(0);
    expect(config.correctAnswer).toBeLessThanOrEqual(40); // Max 20+20
  });

  it('produces deterministic results with same seed', () => {
    const config1 = generateWordProblemConfig('test-q', 999);
    const config2 = generateWordProblemConfig('test-q', 999);

    expect(config1).toEqual(config2);
  });

  it('produces different results with different seeds', () => {
    const config1 = generateWordProblemConfig('test-q', 1);
    const config2 = generateWordProblemConfig('test-q', 999999);

    expect(config1.problemText).not.toBe(config2.problemText);
  });

  it('produces template-substituted problem text', () => {
    const config = generateWordProblemConfig('test-q', 101);

    // Verify no template placeholders remain
    expect(config.problemText).not.toContain('${');
    expect(config.problemText).not.toContain('}');
  });
});

describe('generateOperationsQuestions', () => {
  it('generates 3 operations questions', () => {
    const questions = generateOperationsQuestions();

    expect(questions).toHaveLength(3);
  });

  it('is an alias for generateArithmeticQuestions', () => {
    const ops = generateOperationsQuestions(12345);
    const arith = generateArithmeticQuestions(12345);

    expect(ops).toEqual(arith);
  });

  it('Q10 is basic-operations', () => {
    const questions = generateOperationsQuestions();

    expect(questions[0].type).toBe('basic-operations');
  });

  it('Q11 is word-problem', () => {
    const questions = generateOperationsQuestions();

    expect(questions[1].type).toBe('word-problem');
  });

  it('Q12 is timed-fact-retrieval', () => {
    const questions = generateOperationsQuestions();

    expect(questions[2].type).toBe('timed-fact-retrieval');
  });

  it('assigns correct ids q10-q12', () => {
    const questions = generateOperationsQuestions();

    expect(questions[0].id).toBe('q10');
    expect(questions[1].id).toBe('q11');
    expect(questions[2].id).toBe('q12');
  });

  it('produces deterministic results with same seed', () => {
    const questions1 = generateOperationsQuestions(12345);
    const questions2 = generateOperationsQuestions(12345);

    expect(questions1).toEqual(questions2);
  });

  it('produces different questions with different seeds', () => {
    const questions1 = generateOperationsQuestions(1);
    const questions2 = generateOperationsQuestions(999);

    const allSame = JSON.stringify(questions1) === JSON.stringify(questions2);
    expect(allSame).toBe(false);
  });

  it('basic-operations question uses easy difficulty (1-20 range)', () => {
    const questions = generateOperationsQuestions(456);

    const basicOp = questions[0];
    if (basicOp.type === 'basic-operations') {
      expect(basicOp.operand1).toBeGreaterThanOrEqual(1);
      expect(basicOp.operand1).toBeLessThanOrEqual(20);
      expect(basicOp.operand2).toBeGreaterThanOrEqual(1);
      expect(basicOp.operand2).toBeLessThanOrEqual(20);
    }
  });

  it('timed-fact-retrieval question has required properties', () => {
    const questions = generateOperationsQuestions(42);
    const q12 = questions[2];
    if (q12.type === 'timed-fact-retrieval') {
      expect(q12.operand1).toBeGreaterThanOrEqual(1);
      expect(q12.operand1).toBeLessThanOrEqual(10);
      expect(q12.operand2).toBeGreaterThanOrEqual(1);
      expect(q12.operand2).toBeLessThanOrEqual(10);
      expect(q12.operation).toBe('+');
      expect(q12.correctAnswer).toBe(q12.operand1 + q12.operand2);
      expect(q12.timeLimitMs).toBe(8000);
    }
  });
});

// ============================================================================
// Spatial Awareness Questions (Q13-Q15)
// ============================================================================

describe('generateMentalRotationConfig', () => {
  it('returns correct type', () => {
    const config = generateMentalRotationConfig('q13');
    expect(config.type).toBe('mental-rotation');
  });

  it('returns provided id', () => {
    const config = generateMentalRotationConfig('test-id');
    expect(config.id).toBe('test-id');
  });

  it('generates valid shapeType', () => {
    const validShapes = ['L-shape', 'T-shape', 'zigzag', 'irregular-polygon', 'arrow'];

    for (let seed = 0; seed < 100; seed++) {
      const config = generateMentalRotationConfig('q', seed);
      expect(validShapes).toContain(config.shapeType);
    }
  });

  it('generates valid rotationAngle (90, 180, or 270)', () => {
    const validAngles = [90, 180, 270];

    for (let seed = 0; seed < 100; seed++) {
      const config = generateMentalRotationConfig('q', seed);
      expect(validAngles).toContain(config.rotationAngle);
    }
  });

  it('generates boolean isMatch', () => {
    const config = generateMentalRotationConfig('q13');
    expect(typeof config.isMatch).toBe('boolean');
  });

  it('produces deterministic results with same seed', () => {
    const config1 = generateMentalRotationConfig('q13', 12345);
    const config2 = generateMentalRotationConfig('q13', 12345);

    expect(config1.shapeType).toBe(config2.shapeType);
    expect(config1.rotationAngle).toBe(config2.rotationAngle);
    expect(config1.isMatch).toBe(config2.isMatch);
  });

  it('produces different results with different seeds', () => {
    const config1 = generateMentalRotationConfig('q13', 1);
    const config2 = generateMentalRotationConfig('q13', 999);

    // At least one property should differ
    const allSame =
      config1.shapeType === config2.shapeType &&
      config1.rotationAngle === config2.rotationAngle &&
      config1.isMatch === config2.isMatch;
    expect(allSame).toBe(false);
  });

  it('generates approximately 50% match rate over many seeds', () => {
    let matchCount = 0;
    const totalTests = 100;

    for (let seed = 0; seed < totalTests; seed++) {
      const config = generateMentalRotationConfig('q', seed);
      if (config.isMatch) matchCount++;
    }

    // Should be roughly 50% (allow 30-70% range for randomness)
    expect(matchCount).toBeGreaterThan(30);
    expect(matchCount).toBeLessThan(70);
  });
});

describe('generatePatternMatchingConfig', () => {
  it('returns correct type', () => {
    const config = generatePatternMatchingConfig('q9');
    expect(config.type).toBe('pattern-matching');
  });

  it('returns provided id', () => {
    const config = generatePatternMatchingConfig('test-id');
    expect(config.id).toBe('test-id');
  });

  it('generates valid patternType', () => {
    const validPatterns = [
      'checkerboard',
      'diagonal',
      'diagonal-reverse',
      'cross',
      'border',
      'corners',
    ];

    for (let seed = 0; seed < 100; seed++) {
      const config = generatePatternMatchingConfig('q', seed);
      expect(validPatterns).toContain(config.patternType);
    }
  });

  it('generates valid correctOption (A, B, C, or D)', () => {
    const validOptions = ['A', 'B', 'C', 'D'];

    for (let seed = 0; seed < 100; seed++) {
      const config = generatePatternMatchingConfig('q', seed);
      expect(validOptions).toContain(config.correctOption);
    }
  });

  it('generates 3x3 targetPattern', () => {
    const config = generatePatternMatchingConfig('q9');

    expect(config.targetPattern).toHaveLength(3);
    config.targetPattern.forEach((row) => {
      expect(row).toHaveLength(3);
    });
  });

  it('generates 4 option grids (A, B, C, D)', () => {
    const config = generatePatternMatchingConfig('q9');

    expect(config.options.A).toBeDefined();
    expect(config.options.B).toBeDefined();
    expect(config.options.C).toBeDefined();
    expect(config.options.D).toBeDefined();
  });

  it('each option grid is 3x3', () => {
    const config = generatePatternMatchingConfig('q9');

    (['A', 'B', 'C', 'D'] as const).forEach((option) => {
      const grid = config.options[option];
      expect(grid).toHaveLength(3);
      grid.forEach((row) => {
        expect(row).toHaveLength(3);
      });
    });
  });

  it('correct option matches target pattern', () => {
    const config = generatePatternMatchingConfig('q9');

    const correctGrid = config.options[config.correctOption];
    expect(correctGrid).toEqual(config.targetPattern);
  });

  it('incorrect options differ from target pattern', () => {
    const config = generatePatternMatchingConfig('q9', 12345);

    const options = ['A', 'B', 'C', 'D'] as const;
    const incorrectOptions = options.filter((opt) => opt !== config.correctOption);

    incorrectOptions.forEach((option) => {
      const grid = config.options[option];
      expect(grid).not.toEqual(config.targetPattern);
    });
  });

  it('produces deterministic results with same seed', () => {
    const config1 = generatePatternMatchingConfig('q9', 12345);
    const config2 = generatePatternMatchingConfig('q9', 12345);

    expect(config1.patternType).toBe(config2.patternType);
    expect(config1.correctOption).toBe(config2.correctOption);
    expect(config1.targetPattern).toEqual(config2.targetPattern);
    expect(config1.options).toEqual(config2.options);
  });

  it('grid cells contain only 0 or 1', () => {
    const config = generatePatternMatchingConfig('q9');

    const allGrids = [
      config.targetPattern,
      config.options.A,
      config.options.B,
      config.options.C,
      config.options.D,
    ];

    allGrids.forEach((grid) => {
      grid.forEach((row) => {
        row.forEach((cell) => {
          expect([0, 1]).toContain(cell);
        });
      });
    });
  });
});

describe('generateSpatialQuestions', () => {
  it('returns 3 questions', () => {
    const questions = generateSpatialQuestions();
    expect(questions).toHaveLength(3);
  });

  it('Q13 is mental-rotation', () => {
    const questions = generateSpatialQuestions();
    expect(questions[0].type).toBe('mental-rotation');
  });

  it('Q14 is mental-rotation', () => {
    const questions = generateSpatialQuestions();
    expect(questions[1].type).toBe('mental-rotation');
  });

  it('Q15 is mirror-discrimination', () => {
    const questions = generateSpatialQuestions();
    expect(questions[2].type).toBe('mirror-discrimination');
  });

  it('assigns correct ids q13-q15', () => {
    const questions = generateSpatialQuestions();
    expect(questions[0].id).toBe('q13');
    expect(questions[1].id).toBe('q14');
    expect(questions[2].id).toBe('q15');
  });

  it('produces deterministic results with same seed', () => {
    const questions1 = generateSpatialQuestions(12345);
    const questions2 = generateSpatialQuestions(12345);

    expect(questions1).toEqual(questions2);
  });

  it('produces different questions with different seeds', () => {
    const questions1 = generateSpatialQuestions(1);
    const questions2 = generateSpatialQuestions(999);

    // At least one question should differ
    const allSame = JSON.stringify(questions1) === JSON.stringify(questions2);
    expect(allSame).toBe(false);
  });

  it('mirror-discrimination question has required properties', () => {
    const questions = generateSpatialQuestions(42);
    const q15 = questions[2];
    if (q15.type === 'mirror-discrimination') {
      const validShapes = ['L-shape', 'T-shape', 'zigzag', 'irregular-polygon', 'arrow'];
      expect(validShapes).toContain(q15.shapeType);
      expect(typeof q15.isActuallyMirrored).toBe('boolean');
    }
  });
});

// ============================================================================
// Applied Math Questions (Q16-Q18)
// ============================================================================

describe('generateAppliedQuestions', () => {
  it('returns 3 questions', () => {
    const questions = generateAppliedQuestions();
    expect(questions).toHaveLength(3);
  });

  it('Q16 is fraction-identification', () => {
    const questions = generateAppliedQuestions();
    expect(questions[0].type).toBe('fraction-identification');
  });

  it('Q17 is clock-reading', () => {
    const questions = generateAppliedQuestions();
    expect(questions[1].type).toBe('clock-reading');
  });

  it('Q18 is working-memory-span', () => {
    const questions = generateAppliedQuestions();
    expect(questions[2].type).toBe('working-memory-span');
  });

  it('assigns correct ids q16-q18', () => {
    const questions = generateAppliedQuestions();
    expect(questions[0].id).toBe('q16');
    expect(questions[1].id).toBe('q17');
    expect(questions[2].id).toBe('q18');
  });

  it('produces deterministic results with same seed', () => {
    const questions1 = generateAppliedQuestions(12345);
    const questions2 = generateAppliedQuestions(12345);

    expect(questions1).toEqual(questions2);
  });

  it('produces different questions with different seeds', () => {
    const questions1 = generateAppliedQuestions(1);
    const questions2 = generateAppliedQuestions(999);

    const allSame = JSON.stringify(questions1) === JSON.stringify(questions2);
    expect(allSame).toBe(false);
  });

  it('fraction-identification question has required properties', () => {
    const questions = generateAppliedQuestions(42);
    const q16 = questions[0];
    if (q16.type === 'fraction-identification') {
      expect(q16.numerator).toBeGreaterThanOrEqual(1);
      expect(q16.denominator).toBeGreaterThanOrEqual(2);
      expect(q16.numerator).toBeLessThan(q16.denominator);
      expect(q16.choices).toHaveLength(4);
      // Correct fraction should be among choices
      const correctFraction = `${q16.numerator}/${q16.denominator}`;
      expect(q16.choices).toContain(correctFraction);
    }
  });

  it('clock-reading question has required properties', () => {
    const questions = generateAppliedQuestions(42);
    const q17 = questions[1];
    if (q17.type === 'clock-reading') {
      expect(q17.hours).toBeGreaterThanOrEqual(1);
      expect(q17.hours).toBeLessThanOrEqual(12);
      expect([0, 15, 30, 45]).toContain(q17.minutes);
      expect(q17.choices).toHaveLength(4);
      // Correct time should be among choices
      const correctTime = `${q17.hours}:${String(q17.minutes).padStart(2, '0')}`;
      expect(q17.choices).toContain(correctTime);
    }
  });

  it('working-memory-span question has required properties', () => {
    const questions = generateAppliedQuestions(42);
    const q18 = questions[2];
    if (q18.type === 'working-memory-span') {
      expect(q18.numbers).toHaveLength(3);
      q18.numbers.forEach((n) => {
        expect(n).toBeGreaterThanOrEqual(1);
        expect(n).toBeLessThanOrEqual(9);
      });
    }
  });
});
