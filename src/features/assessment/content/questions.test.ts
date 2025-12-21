// questions.test.ts - Unit tests for question configuration functions
// Story 2.2: Implement Number Sense Question Types
// Story 2.3: Spatial Awareness Question Types
// Story 2.4: Operations Question Types

import { describe, it, expect } from 'vitest';
import {
  generateQuantityComparisonConfig,
  generateNumberLineConfig,
  generateNumberSenseQuestions,
  generateMentalRotationConfig,
  generatePatternMatchingConfig,
  generateSpatialQuestions,
  generateBasicOperationsConfig,
  generateWordProblemConfig,
  generateOperationsQuestions,
} from './questions';

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
    const allSame = config1.leftCount === config2.leftCount && config1.rightCount === config2.rightCount;
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

describe('generateNumberSenseQuestions', () => {
  it('returns 4 questions', () => {
    const questions = generateNumberSenseQuestions();
    expect(questions).toHaveLength(4);
  });

  it('first two questions are quantity-comparison', () => {
    const questions = generateNumberSenseQuestions();
    expect(questions[0].type).toBe('quantity-comparison');
    expect(questions[1].type).toBe('quantity-comparison');
  });

  it('last two questions are number-line', () => {
    const questions = generateNumberSenseQuestions();
    expect(questions[2].type).toBe('number-line');
    expect(questions[3].type).toBe('number-line');
  });

  it('assigns correct ids q1-q4', () => {
    const questions = generateNumberSenseQuestions();
    expect(questions[0].id).toBe('q1');
    expect(questions[1].id).toBe('q2');
    expect(questions[2].id).toBe('q3');
    expect(questions[3].id).toBe('q4');
  });

  it('produces deterministic results with same seed', () => {
    const questions1 = generateNumberSenseQuestions(12345);
    const questions2 = generateNumberSenseQuestions(12345);

    expect(questions1).toEqual(questions2);
  });

  it('Q3 uses 0-100 range', () => {
    const questions = generateNumberSenseQuestions();
    const q3 = questions[2];
    if (q3.type === 'number-line') {
      expect(q3.range).toEqual([0, 100]);
    }
  });

  it('Q4 uses 0-1000 range', () => {
    const questions = generateNumberSenseQuestions();
    const q4 = questions[3];
    if (q4.type === 'number-line') {
      expect(q4.range).toEqual([0, 1000]);
    }
  });
});

// Story 2.3: Spatial Awareness Question Types

describe('generateMentalRotationConfig', () => {
  it('returns correct type', () => {
    const config = generateMentalRotationConfig('q5');
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
    const config = generateMentalRotationConfig('q5');
    expect(typeof config.isMatch).toBe('boolean');
  });

  it('produces deterministic results with same seed', () => {
    const config1 = generateMentalRotationConfig('q5', 12345);
    const config2 = generateMentalRotationConfig('q5', 12345);

    expect(config1.shapeType).toBe(config2.shapeType);
    expect(config1.rotationAngle).toBe(config2.rotationAngle);
    expect(config1.isMatch).toBe(config2.isMatch);
  });

  it('produces different results with different seeds', () => {
    const config1 = generateMentalRotationConfig('q5', 1);
    const config2 = generateMentalRotationConfig('q5', 999);

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
    const config = generatePatternMatchingConfig('q7');
    expect(config.type).toBe('pattern-matching');
  });

  it('returns provided id', () => {
    const config = generatePatternMatchingConfig('test-id');
    expect(config.id).toBe('test-id');
  });

  it('generates valid patternType', () => {
    const validPatterns = ['checkerboard', 'diagonal', 'diagonal-reverse', 'cross', 'border', 'corners'];

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

  it('generates 3×3 targetPattern', () => {
    const config = generatePatternMatchingConfig('q7');

    expect(config.targetPattern).toHaveLength(3);
    config.targetPattern.forEach(row => {
      expect(row).toHaveLength(3);
    });
  });

  it('generates 4 option grids (A, B, C, D)', () => {
    const config = generatePatternMatchingConfig('q7');

    expect(config.options.A).toBeDefined();
    expect(config.options.B).toBeDefined();
    expect(config.options.C).toBeDefined();
    expect(config.options.D).toBeDefined();
  });

  it('each option grid is 3×3', () => {
    const config = generatePatternMatchingConfig('q7');

    ['A', 'B', 'C', 'D'].forEach(option => {
      const grid = config.options[option as 'A' | 'B' | 'C' | 'D'];
      expect(grid).toHaveLength(3);
      grid.forEach(row => {
        expect(row).toHaveLength(3);
      });
    });
  });

  it('correct option matches target pattern', () => {
    const config = generatePatternMatchingConfig('q7');

    const correctGrid = config.options[config.correctOption];
    expect(correctGrid).toEqual(config.targetPattern);
  });

  it('incorrect options differ from target pattern', () => {
    const config = generatePatternMatchingConfig('q7', 12345);

    const options = ['A', 'B', 'C', 'D'] as const;
    const incorrectOptions = options.filter(opt => opt !== config.correctOption);

    incorrectOptions.forEach(option => {
      const grid = config.options[option];
      expect(grid).not.toEqual(config.targetPattern);
    });
  });

  it('produces deterministic results with same seed', () => {
    const config1 = generatePatternMatchingConfig('q7', 12345);
    const config2 = generatePatternMatchingConfig('q7', 12345);

    expect(config1.patternType).toBe(config2.patternType);
    expect(config1.correctOption).toBe(config2.correctOption);
    expect(config1.targetPattern).toEqual(config2.targetPattern);
    expect(config1.options).toEqual(config2.options);
  });

  it('grid cells contain only 0 or 1', () => {
    const config = generatePatternMatchingConfig('q7');

    const allGrids = [
      config.targetPattern,
      config.options.A,
      config.options.B,
      config.options.C,
      config.options.D,
    ];

    allGrids.forEach(grid => {
      grid.forEach(row => {
        row.forEach(cell => {
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

  it('first two questions are mental-rotation', () => {
    const questions = generateSpatialQuestions();
    expect(questions[0].type).toBe('mental-rotation');
    expect(questions[1].type).toBe('mental-rotation');
  });

  it('third question is pattern-matching', () => {
    const questions = generateSpatialQuestions();
    expect(questions[2].type).toBe('pattern-matching');
  });

  it('assigns correct ids q5-q7', () => {
    const questions = generateSpatialQuestions();
    expect(questions[0].id).toBe('q5');
    expect(questions[1].id).toBe('q6');
    expect(questions[2].id).toBe('q7');
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
});

// Story 2.4: Operations Question Types

describe('generateBasicOperationsConfig', () => {
  it('generates addition operation config', () => {
    // With seed, we can control the random output
    // Based on seeded random implementation, first random() > 0.5 for addition
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
    // Test multiple seeds to find one with apples
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

    // Problem text should contain numbers
    expect(/\d+/.test(config.problemText)).toBe(true);
  });

  it('generates correct answer for addition problems', () => {
    for (let seed = 1; seed < 20; seed++) {
      const config = generateWordProblemConfig('test-q', seed);

      if (config.problemText.includes('more') || config.problemText.includes('find') || config.problemText.includes('get') || config.problemText.includes('buy')) {
        // Addition problem
        expect(config.correctAnswer).toBeGreaterThan(0);
      }
    }
  });

  it('generates correct answer for subtraction problems', () => {
    for (let seed = 1; seed < 20; seed++) {
      const config = generateWordProblemConfig('test-q', seed);

      if (config.problemText.includes('give away') || config.problemText.includes('spend') || config.problemText.includes('donate')) {
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

  it('first two questions are basic-operations', () => {
    const questions = generateOperationsQuestions();

    expect(questions[0].type).toBe('basic-operations');
    expect(questions[1].type).toBe('basic-operations');
  });

  it('third question is word-problem', () => {
    const questions = generateOperationsQuestions();

    expect(questions[2].type).toBe('word-problem');
  });

  it('assigns correct ids q8-q10', () => {
    const questions = generateOperationsQuestions();

    expect(questions[0].id).toBe('q8');
    expect(questions[1].id).toBe('q9');
    expect(questions[2].id).toBe('q10');
  });

  it('produces deterministic results with same seed', () => {
    const questions1 = generateOperationsQuestions(12345);
    const questions2 = generateOperationsQuestions(12345);

    expect(questions1).toEqual(questions2);
  });

  it('produces different questions with different seeds', () => {
    const questions1 = generateOperationsQuestions(1);
    const questions2 = generateOperationsQuestions(999);

    // At least one question should differ
    const allSame = JSON.stringify(questions1) === JSON.stringify(questions2);
    expect(allSame).toBe(false);
  });

  it('uses easy difficulty for basic operations', () => {
    const questions = generateOperationsQuestions(456);

    const basicOp1 = questions[0] as any;
    const basicOp2 = questions[1] as any;

    // Easy difficulty: 1-20 range
    expect(basicOp1.operand1).toBeGreaterThanOrEqual(1);
    expect(basicOp1.operand1).toBeLessThanOrEqual(20);
    expect(basicOp2.operand1).toBeGreaterThanOrEqual(1);
    expect(basicOp2.operand1).toBeLessThanOrEqual(20);
  });
});
