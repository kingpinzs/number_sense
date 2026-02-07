/**
 * Problem Generator Tests
 * Story 3.4: Math Operations Drill
 *
 * Tests for arithmetic problem generation with difficulty levels.
 */

import { describe, it, expect } from 'vitest';
import {
  generateAddition,
  generateSubtraction,
  generateMultiplication,
  generateProblem,
} from './problemGenerator';

describe('generateAddition', () => {
  describe('easy difficulty', () => {
    it('should generate single-digit addition problems', () => {
      for (let i = 0; i < 20; i++) {
        const { problem, answer } = generateAddition('easy');

        // Parse the problem string
        const [num1Str, , num2Str] = problem.split(' ');
        const num1 = parseInt(num1Str);
        const num2 = parseInt(num2Str);

        // Verify both numbers are single-digit (0-9)
        expect(num1).toBeGreaterThanOrEqual(0);
        expect(num1).toBeLessThanOrEqual(9);
        expect(num2).toBeGreaterThanOrEqual(0);
        expect(num2).toBeLessThanOrEqual(9);

        // Verify answer is correct
        expect(answer).toBe(num1 + num2);

        // Verify format
        expect(problem).toMatch(/^\d+ \+ \d+$/);
      }
    });
  });

  describe('medium difficulty', () => {
    it('should generate double-digit addition problems', () => {
      for (let i = 0; i < 20; i++) {
        const { problem, answer } = generateAddition('medium');

        const [num1Str, , num2Str] = problem.split(' ');
        const num1 = parseInt(num1Str);
        const num2 = parseInt(num2Str);

        // First number should be double-digit (10-99)
        expect(num1).toBeGreaterThanOrEqual(10);
        expect(num1).toBeLessThanOrEqual(99);

        // Second number should be 1-50
        expect(num2).toBeGreaterThanOrEqual(1);
        expect(num2).toBeLessThanOrEqual(50);

        // Verify answer is correct
        expect(answer).toBe(num1 + num2);
      }
    });
  });

  describe('hard difficulty', () => {
    it('should generate double-digit addition problems', () => {
      for (let i = 0; i < 20; i++) {
        const { problem, answer } = generateAddition('hard');

        const [num1Str, , num2Str] = problem.split(' ');
        const num1 = parseInt(num1Str);
        const num2 = parseInt(num2Str);

        // First number should be double-digit
        expect(num1).toBeGreaterThanOrEqual(10);
        expect(num1).toBeLessThanOrEqual(99);

        // Verify answer is correct
        expect(answer).toBe(num1 + num2);
      }
    });
  });
});

describe('generateSubtraction', () => {
  describe('easy difficulty', () => {
    it('should generate single-digit subtraction problems with no negatives', () => {
      for (let i = 0; i < 20; i++) {
        const { problem, answer } = generateSubtraction('easy');

        const [num1Str, , num2Str] = problem.split(' ');
        const num1 = parseInt(num1Str);
        const num2 = parseInt(num2Str);

        // Both numbers should be single-digit
        expect(num1).toBeGreaterThanOrEqual(0);
        expect(num1).toBeLessThanOrEqual(9);
        expect(num2).toBeGreaterThanOrEqual(0);
        expect(num2).toBeLessThanOrEqual(9);

        // No negative results
        expect(answer).toBeGreaterThanOrEqual(0);
        expect(answer).toBe(num1 - num2);

        // Verify format
        expect(problem).toMatch(/^\d+ - \d+$/);
      }
    });
  });

  describe('medium difficulty', () => {
    it('should generate double-digit subtraction problems with no negatives', () => {
      for (let i = 0; i < 20; i++) {
        const { problem, answer } = generateSubtraction('medium');

        const [num1Str, , num2Str] = problem.split(' ');
        const num1 = parseInt(num1Str);
        const num2 = parseInt(num2Str);

        // First number should be double-digit
        expect(num1).toBeGreaterThanOrEqual(10);
        expect(num1).toBeLessThanOrEqual(99);

        // No negative results
        expect(answer).toBeGreaterThanOrEqual(0);
        expect(answer).toBe(num1 - num2);
      }
    });
  });

  describe('hard difficulty', () => {
    it('should generate double-digit subtraction problems with no negatives', () => {
      for (let i = 0; i < 20; i++) {
        const { problem, answer } = generateSubtraction('hard');

        const [num1Str, , num2Str] = problem.split(' ');
        const num1 = parseInt(num1Str);
        const num2 = parseInt(num2Str);

        // First number should be double-digit
        expect(num1).toBeGreaterThanOrEqual(10);

        // No negative results
        expect(answer).toBeGreaterThanOrEqual(0);
        expect(answer).toBe(num1 - num2);
      }
    });
  });
});

describe('generateMultiplication', () => {
  describe('easy difficulty', () => {
    it('should generate simple multiplication problems', () => {
      for (let i = 0; i < 20; i++) {
        const { problem, answer } = generateMultiplication('easy');

        const [num1Str, , num2Str] = problem.split(' ');
        const num1 = parseInt(num1Str);
        const num2 = parseInt(num2Str);

        // Should be small numbers (1-5)
        expect(num1).toBeGreaterThanOrEqual(1);
        expect(num1).toBeLessThanOrEqual(5);
        expect(num2).toBeGreaterThanOrEqual(1);
        expect(num2).toBeLessThanOrEqual(5);

        // Verify answer
        expect(answer).toBe(num1 * num2);

        // Verify format (using × symbol)
        expect(problem).toMatch(/^\d+ × \d+$/);
      }
    });
  });

  describe('medium difficulty', () => {
    it('should generate single-digit multiplication problems (1-9)', () => {
      for (let i = 0; i < 20; i++) {
        const { problem, answer } = generateMultiplication('medium');

        const [num1Str, , num2Str] = problem.split(' ');
        const num1 = parseInt(num1Str);
        const num2 = parseInt(num2Str);

        // Both should be 1-9
        expect(num1).toBeGreaterThanOrEqual(1);
        expect(num1).toBeLessThanOrEqual(9);
        expect(num2).toBeGreaterThanOrEqual(1);
        expect(num2).toBeLessThanOrEqual(9);

        // Verify answer
        expect(answer).toBe(num1 * num2);
      }
    });
  });

  describe('hard difficulty', () => {
    it('should generate 12×12 times tables only', () => {
      for (let i = 0; i < 20; i++) {
        const { problem, answer } = generateMultiplication('hard');

        const [num1Str, , num2Str] = problem.split(' ');
        const num1 = parseInt(num1Str);
        const num2 = parseInt(num2Str);

        // Both should be 1-12 (times tables)
        expect(num1).toBeGreaterThanOrEqual(1);
        expect(num1).toBeLessThanOrEqual(12);
        expect(num2).toBeGreaterThanOrEqual(1);
        expect(num2).toBeLessThanOrEqual(12);

        // Verify answer
        expect(answer).toBe(num1 * num2);
      }
    });
  });
});

describe('generateProblem', () => {
  describe('easy difficulty', () => {
    it('should only generate addition and subtraction', () => {
      const operations = new Set<string>();
      for (let i = 0; i < 50; i++) {
        const result = generateProblem('easy');
        operations.add(result.operation);
      }

      // Should only have addition and subtraction
      expect(operations.has('addition') || operations.has('subtraction')).toBe(true);
      expect(operations.has('multiplication')).toBe(false);
    });

    it('should include operation type in result', () => {
      const result = generateProblem('easy');
      expect(result).toHaveProperty('operation');
      expect(result).toHaveProperty('problem');
      expect(result).toHaveProperty('answer');
      expect(['addition', 'subtraction']).toContain(result.operation);
    });
  });

  describe('medium difficulty', () => {
    it('should generate all three operations', () => {
      const operations = new Set<string>();
      for (let i = 0; i < 100; i++) {
        const result = generateProblem('medium');
        operations.add(result.operation);
      }

      // Should have all three operations eventually
      expect(operations.size).toBe(3);
      expect(operations.has('addition')).toBe(true);
      expect(operations.has('subtraction')).toBe(true);
      expect(operations.has('multiplication')).toBe(true);
    });
  });

  describe('hard difficulty', () => {
    it('should primarily generate multiplication (70% chance)', () => {
      const operations: string[] = [];
      for (let i = 0; i < 100; i++) {
        const result = generateProblem('hard');
        operations.push(result.operation);
      }

      const multiplicationCount = operations.filter((op) => op === 'multiplication').length;

      // Should be roughly 70% multiplication (allow for randomness)
      expect(multiplicationCount).toBeGreaterThan(50);
    });
  });

  describe('with operation type specified', () => {
    it('should force specific operation when provided', () => {
      for (let i = 0; i < 10; i++) {
        const addResult = generateProblem('medium', 'addition');
        expect(addResult.operation).toBe('addition');

        const subResult = generateProblem('medium', 'subtraction');
        expect(subResult.operation).toBe('subtraction');

        const mulResult = generateProblem('medium', 'multiplication');
        expect(mulResult.operation).toBe('multiplication');
      }
    });
  });

  describe('with usedProblems tracking', () => {
    it('should not generate duplicate problems when usedProblems set provided', () => {
      const usedProblems = new Set<string>();
      const generated: string[] = [];

      for (let i = 0; i < 15; i++) {
        const result = generateProblem('medium', undefined, usedProblems);
        generated.push(result.problem);
      }

      // All problems should be unique
      const uniqueProblems = new Set(generated);
      expect(uniqueProblems.size).toBe(generated.length);
    });

    it('should add generated problem to usedProblems set', () => {
      const usedProblems = new Set<string>();
      const result = generateProblem('easy', undefined, usedProblems);
      expect(usedProblems.has(result.problem)).toBe(true);
    });

    it('should accept duplicate after max retries when problem space exhausted', () => {
      // Pre-fill usedProblems with all possible easy addition/subtraction problems
      const usedProblems = new Set<string>();
      for (let i = 0; i <= 9; i++) {
        for (let j = 0; j <= 9; j++) {
          usedProblems.add(`${i} + ${j}`);
        }
        for (let j = 0; j <= i; j++) {
          usedProblems.add(`${i} - ${j}`);
        }
      }

      // Should still return a result (accepts duplicate after max retries)
      const result = generateProblem('easy', undefined, usedProblems);
      expect(result).toHaveProperty('problem');
      expect(result).toHaveProperty('answer');
      expect(result).toHaveProperty('operation');
    });

    it('should work without usedProblems parameter (backward compatible)', () => {
      const result = generateProblem('easy');
      expect(result).toHaveProperty('problem');
      expect(result).toHaveProperty('answer');
      expect(result).toHaveProperty('operation');
    });
  });
});
