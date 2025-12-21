// Scoring Algorithm Tests
// Story 2.5: Implement Scoring Algorithm and Weakness Identification
// Comprehensive unit tests with 100% coverage

import { describe, it, expect } from 'vitest';
import {
  calculateDomainScore,
  identifyWeaknesses,
  generateWeights,
  type QuestionForScoring,
  type DomainScores,
  type WeaknessCategories,
} from './scoring';

describe('calculateDomainScore', () => {
  describe('All Questions Correct', () => {
    it('should return 5.0 for number_sense with 4/4 correct', () => {
      const questions: QuestionForScoring[] = [
        { domain: 'number_sense', isCorrect: true },
        { domain: 'number_sense', isCorrect: true },
        { domain: 'number_sense', isCorrect: true },
        { domain: 'number_sense', isCorrect: true },
      ];

      const score = calculateDomainScore(questions, 'number_sense');
      expect(score).toBe(5.0);
    });

    it('should return 5.0 for spatial with 3/3 correct', () => {
      const questions: QuestionForScoring[] = [
        { domain: 'spatial', isCorrect: true },
        { domain: 'spatial', isCorrect: true },
        { domain: 'spatial', isCorrect: true },
      ];

      const score = calculateDomainScore(questions, 'spatial');
      expect(score).toBe(5.0);
    });

    it('should return 5.0 for operations with 3/3 correct', () => {
      const questions: QuestionForScoring[] = [
        { domain: 'operations', isCorrect: true },
        { domain: 'operations', isCorrect: true },
        { domain: 'operations', isCorrect: true },
      ];

      const score = calculateDomainScore(questions, 'operations');
      expect(score).toBe(5.0);
    });
  });

  describe('All Questions Incorrect', () => {
    it('should return 0.0 for number_sense with 0/4 correct', () => {
      const questions: QuestionForScoring[] = [
        { domain: 'number_sense', isCorrect: false },
        { domain: 'number_sense', isCorrect: false },
        { domain: 'number_sense', isCorrect: false },
        { domain: 'number_sense', isCorrect: false },
      ];

      const score = calculateDomainScore(questions, 'number_sense');
      expect(score).toBe(0.0);
    });

    it('should return 0.0 for spatial with 0/3 correct', () => {
      const questions: QuestionForScoring[] = [
        { domain: 'spatial', isCorrect: false },
        { domain: 'spatial', isCorrect: false },
        { domain: 'spatial', isCorrect: false },
      ];

      const score = calculateDomainScore(questions, 'spatial');
      expect(score).toBe(0.0);
    });

    it('should return 0.0 for operations with 0/3 correct', () => {
      const questions: QuestionForScoring[] = [
        { domain: 'operations', isCorrect: false },
        { domain: 'operations', isCorrect: false },
        { domain: 'operations', isCorrect: false },
      ];

      const score = calculateDomainScore(questions, 'operations');
      expect(score).toBe(0.0);
    });
  });

  describe('Partial Correct', () => {
    it('should return 2.5 for number_sense with 2/4 correct', () => {
      const questions: QuestionForScoring[] = [
        { domain: 'number_sense', isCorrect: true },
        { domain: 'number_sense', isCorrect: true },
        { domain: 'number_sense', isCorrect: false },
        { domain: 'number_sense', isCorrect: false },
      ];

      const score = calculateDomainScore(questions, 'number_sense');
      expect(score).toBe(2.5);
    });

    it('should return ~3.333 for spatial with 2/3 correct', () => {
      const questions: QuestionForScoring[] = [
        { domain: 'spatial', isCorrect: true },
        { domain: 'spatial', isCorrect: true },
        { domain: 'spatial', isCorrect: false },
      ];

      const score = calculateDomainScore(questions, 'spatial');
      expect(score).toBeCloseTo(3.333, 2);
    });

    it('should return ~1.667 for operations with 1/3 correct', () => {
      const questions: QuestionForScoring[] = [
        { domain: 'operations', isCorrect: true },
        { domain: 'operations', isCorrect: false },
        { domain: 'operations', isCorrect: false },
      ];

      const score = calculateDomainScore(questions, 'operations');
      expect(score).toBeCloseTo(1.667, 2);
    });

    it('should return 1.25 for number_sense with 1/4 correct', () => {
      const questions: QuestionForScoring[] = [
        { domain: 'number_sense', isCorrect: true },
        { domain: 'number_sense', isCorrect: false },
        { domain: 'number_sense', isCorrect: false },
        { domain: 'number_sense', isCorrect: false },
      ];

      const score = calculateDomainScore(questions, 'number_sense');
      expect(score).toBe(1.25);
    });

    it('should return 3.75 for number_sense with 3/4 correct', () => {
      const questions: QuestionForScoring[] = [
        { domain: 'number_sense', isCorrect: true },
        { domain: 'number_sense', isCorrect: true },
        { domain: 'number_sense', isCorrect: true },
        { domain: 'number_sense', isCorrect: false },
      ];

      const score = calculateDomainScore(questions, 'number_sense');
      expect(score).toBe(3.75);
    });
  });

  describe('Edge Cases', () => {
    it('should return 0.0 for empty questions array', () => {
      const questions: QuestionForScoring[] = [];

      const score = calculateDomainScore(questions, 'number_sense');
      expect(score).toBe(0.0);
    });

    it('should filter out questions from other domains', () => {
      const questions: QuestionForScoring[] = [
        { domain: 'number_sense', isCorrect: true },
        { domain: 'spatial', isCorrect: true }, // Should be ignored
        { domain: 'operations', isCorrect: true }, // Should be ignored
        { domain: 'number_sense', isCorrect: true },
        { domain: 'number_sense', isCorrect: false },
        { domain: 'number_sense', isCorrect: false },
      ];

      // Only 2/4 number_sense questions are correct
      const score = calculateDomainScore(questions, 'number_sense');
      expect(score).toBe(2.5);
    });

    it('should handle mixed questions and return correct score for each domain', () => {
      const questions: QuestionForScoring[] = [
        { domain: 'number_sense', isCorrect: true },
        { domain: 'number_sense', isCorrect: true },
        { domain: 'number_sense', isCorrect: true },
        { domain: 'number_sense', isCorrect: true },
        { domain: 'spatial', isCorrect: true },
        { domain: 'spatial', isCorrect: false },
        { domain: 'spatial', isCorrect: false },
        { domain: 'operations', isCorrect: false },
        { domain: 'operations', isCorrect: false },
        { domain: 'operations', isCorrect: false },
      ];

      expect(calculateDomainScore(questions, 'number_sense')).toBe(5.0);
      expect(calculateDomainScore(questions, 'spatial')).toBeCloseTo(1.667, 2);
      expect(calculateDomainScore(questions, 'operations')).toBe(0.0);
    });
  });
});

describe('identifyWeaknesses', () => {
  describe('Threshold Boundary Testing', () => {
    it('should classify score exactly 2.5 as weak (≤ 2.5)', () => {
      const scores: DomainScores = {
        number_sense: 2.5,
        spatial: 5.0,
        operations: 5.0,
      };

      const categories = identifyWeaknesses(scores);
      expect(categories.weaknesses).toContain('number_sense');
      expect(categories.weaknesses).toHaveLength(1);
    });

    it('should classify score 2.6 as moderate', () => {
      const scores: DomainScores = {
        number_sense: 2.6,
        spatial: 5.0,
        operations: 5.0,
      };

      const categories = identifyWeaknesses(scores);
      expect(categories.moderate).toContain('number_sense');
      expect(categories.moderate).toHaveLength(1);
    });

    it('should classify score exactly 3.5 as moderate (≤ 3.5)', () => {
      const scores: DomainScores = {
        number_sense: 3.5,
        spatial: 5.0,
        operations: 5.0,
      };

      const categories = identifyWeaknesses(scores);
      expect(categories.moderate).toContain('number_sense');
      expect(categories.moderate).toHaveLength(1);
    });

    it('should classify score 3.6 as strength (> 3.5)', () => {
      const scores: DomainScores = {
        number_sense: 3.6,
        spatial: 5.0,
        operations: 5.0,
      };

      const categories = identifyWeaknesses(scores);
      expect(categories.strengths).toContain('number_sense');
      expect(categories.strengths).toHaveLength(3);
    });

    it('should classify score 0.0 as weak', () => {
      const scores: DomainScores = {
        number_sense: 0.0,
        spatial: 5.0,
        operations: 5.0,
      };

      const categories = identifyWeaknesses(scores);
      expect(categories.weaknesses).toContain('number_sense');
    });

    it('should classify score 5.0 as strength', () => {
      const scores: DomainScores = {
        number_sense: 5.0,
        spatial: 5.0,
        operations: 5.0,
      };

      const categories = identifyWeaknesses(scores);
      expect(categories.strengths).toHaveLength(3);
    });
  });

  describe('All Domains Same Category', () => {
    it('should identify all domains as weak when all scores ≤ 2.5', () => {
      const scores: DomainScores = {
        number_sense: 1.0,
        spatial: 2.0,
        operations: 2.5,
      };

      const categories = identifyWeaknesses(scores);
      expect(categories.weaknesses).toEqual(
        expect.arrayContaining(['number_sense', 'spatial', 'operations'])
      );
      expect(categories.weaknesses).toHaveLength(3);
      expect(categories.moderate).toHaveLength(0);
      expect(categories.strengths).toHaveLength(0);
    });

    it('should identify all domains as moderate when all scores 2.6-3.5', () => {
      const scores: DomainScores = {
        number_sense: 2.6,
        spatial: 3.0,
        operations: 3.5,
      };

      const categories = identifyWeaknesses(scores);
      expect(categories.moderate).toEqual(
        expect.arrayContaining(['number_sense', 'spatial', 'operations'])
      );
      expect(categories.moderate).toHaveLength(3);
      expect(categories.weaknesses).toHaveLength(0);
      expect(categories.strengths).toHaveLength(0);
    });

    it('should identify all domains as strengths when all scores > 3.5', () => {
      const scores: DomainScores = {
        number_sense: 4.0,
        spatial: 4.5,
        operations: 5.0,
      };

      const categories = identifyWeaknesses(scores);
      expect(categories.strengths).toEqual(
        expect.arrayContaining(['number_sense', 'spatial', 'operations'])
      );
      expect(categories.strengths).toHaveLength(3);
      expect(categories.weaknesses).toHaveLength(0);
      expect(categories.moderate).toHaveLength(0);
    });
  });

  describe('Mixed Distribution', () => {
    it('should correctly categorize mixed scores', () => {
      const scores: DomainScores = {
        number_sense: 2.0, // weak
        spatial: 3.0, // moderate
        operations: 4.5, // strength
      };

      const categories = identifyWeaknesses(scores);
      expect(categories.weaknesses).toEqual(['number_sense']);
      expect(categories.moderate).toEqual(['spatial']);
      expect(categories.strengths).toEqual(['operations']);
    });

    it('should handle two weak, one strength', () => {
      const scores: DomainScores = {
        number_sense: 1.5,
        spatial: 2.5,
        operations: 4.0,
      };

      const categories = identifyWeaknesses(scores);
      expect(categories.weaknesses).toHaveLength(2);
      expect(categories.weaknesses).toContain('number_sense');
      expect(categories.weaknesses).toContain('spatial');
      expect(categories.strengths).toEqual(['operations']);
    });

    it('should handle one weak, two moderate', () => {
      const scores: DomainScores = {
        number_sense: 1.0,
        spatial: 3.0,
        operations: 3.5,
      };

      const categories = identifyWeaknesses(scores);
      expect(categories.weaknesses).toEqual(['number_sense']);
      expect(categories.moderate).toHaveLength(2);
      expect(categories.moderate).toContain('spatial');
      expect(categories.moderate).toContain('operations');
    });
  });
});

describe('generateWeights', () => {
  describe('All Domains Same Category', () => {
    it('should normalize all weak domains to ~0.333 each', () => {
      const categories: WeaknessCategories = {
        weaknesses: ['number_sense', 'spatial', 'operations'],
        moderate: [],
        strengths: [],
      };

      const weights = generateWeights(categories);

      // Each should be 2.0 / 6.0 = 0.333...
      expect(weights.number_sense).toBeCloseTo(0.333, 2);
      expect(weights.spatial).toBeCloseTo(0.333, 2);
      expect(weights.operations).toBeCloseTo(0.333, 2);

      // Sum should be exactly 1.0
      const sum = weights.number_sense + weights.spatial + weights.operations;
      expect(sum).toBeCloseTo(1.0, 10);
    });

    it('should normalize all moderate domains to ~0.333 each', () => {
      const categories: WeaknessCategories = {
        weaknesses: [],
        moderate: ['number_sense', 'spatial', 'operations'],
        strengths: [],
      };

      const weights = generateWeights(categories);

      // Each should be 1.0 / 3.0 = 0.333...
      expect(weights.number_sense).toBeCloseTo(0.333, 2);
      expect(weights.spatial).toBeCloseTo(0.333, 2);
      expect(weights.operations).toBeCloseTo(0.333, 2);

      // Sum should be exactly 1.0
      const sum = weights.number_sense + weights.spatial + weights.operations;
      expect(sum).toBeCloseTo(1.0, 10);
    });

    it('should normalize all strength domains to ~0.333 each', () => {
      const categories: WeaknessCategories = {
        weaknesses: [],
        moderate: [],
        strengths: ['number_sense', 'spatial', 'operations'],
      };

      const weights = generateWeights(categories);

      // Each should be 0.5 / 1.5 = 0.333...
      expect(weights.number_sense).toBeCloseTo(0.333, 2);
      expect(weights.spatial).toBeCloseTo(0.333, 2);
      expect(weights.operations).toBeCloseTo(0.333, 2);

      // Sum should be exactly 1.0
      const sum = weights.number_sense + weights.spatial + weights.operations;
      expect(sum).toBeCloseTo(1.0, 10);
    });
  });

  describe('Mixed Categories Normalization', () => {
    it('should normalize mixed weights correctly (weak=2.0, moderate=1.0, strength=0.5)', () => {
      const categories: WeaknessCategories = {
        weaknesses: ['number_sense'], // 2.0
        moderate: ['operations'], // 1.0
        strengths: ['spatial'], // 0.5
      };

      const weights = generateWeights(categories);

      // Raw sum: 2.0 + 1.0 + 0.5 = 3.5
      // Normalized: [2.0/3.5, 0.5/3.5, 1.0/3.5] = [0.571, 0.143, 0.286]
      expect(weights.number_sense).toBeCloseTo(0.571, 2);
      expect(weights.spatial).toBeCloseTo(0.143, 2);
      expect(weights.operations).toBeCloseTo(0.286, 2);

      // Sum should be exactly 1.0
      const sum = weights.number_sense + weights.spatial + weights.operations;
      expect(sum).toBeCloseTo(1.0, 10);
    });

    it('should normalize two weak, one strength correctly', () => {
      const categories: WeaknessCategories = {
        weaknesses: ['number_sense', 'spatial'], // 2.0 each
        moderate: [],
        strengths: ['operations'], // 0.5
      };

      const weights = generateWeights(categories);

      // Raw sum: 2.0 + 2.0 + 0.5 = 4.5
      // Each weak: 2.0/4.5 = 0.444...
      // Strength: 0.5/4.5 = 0.111...
      expect(weights.number_sense).toBeCloseTo(0.444, 2);
      expect(weights.spatial).toBeCloseTo(0.444, 2);
      expect(weights.operations).toBeCloseTo(0.111, 2);

      const sum = weights.number_sense + weights.spatial + weights.operations;
      expect(sum).toBeCloseTo(1.0, 10);
    });

    it('should normalize one weak, two moderate correctly', () => {
      const categories: WeaknessCategories = {
        weaknesses: ['number_sense'], // 2.0
        moderate: ['spatial', 'operations'], // 1.0 each
        strengths: [],
      };

      const weights = generateWeights(categories);

      // Raw sum: 2.0 + 1.0 + 1.0 = 4.0
      // Weak: 2.0/4.0 = 0.5
      // Each moderate: 1.0/4.0 = 0.25
      expect(weights.number_sense).toBe(0.5);
      expect(weights.spatial).toBe(0.25);
      expect(weights.operations).toBe(0.25);

      const sum = weights.number_sense + weights.spatial + weights.operations;
      expect(sum).toBe(1.0);
    });
  });

  describe('Normalization Validation', () => {
    it('should always sum to 1.0 regardless of distribution', () => {
      const testCases: WeaknessCategories[] = [
        {
          weaknesses: ['number_sense', 'spatial', 'operations'],
          moderate: [],
          strengths: [],
        },
        {
          weaknesses: [],
          moderate: ['number_sense', 'spatial', 'operations'],
          strengths: [],
        },
        {
          weaknesses: [],
          moderate: [],
          strengths: ['number_sense', 'spatial', 'operations'],
        },
        {
          weaknesses: ['number_sense'],
          moderate: ['spatial'],
          strengths: ['operations'],
        },
        {
          weaknesses: ['number_sense', 'spatial'],
          moderate: [],
          strengths: ['operations'],
        },
        {
          weaknesses: ['number_sense'],
          moderate: [],
          strengths: ['spatial', 'operations'],
        },
      ];

      for (const categories of testCases) {
        const weights = generateWeights(categories);
        const sum = weights.number_sense + weights.spatial + weights.operations;
        expect(sum).toBeCloseTo(1.0, 10);
      }
    });

    it('should never produce negative weights', () => {
      const categories: WeaknessCategories = {
        weaknesses: ['number_sense'],
        moderate: ['spatial'],
        strengths: ['operations'],
      };

      const weights = generateWeights(categories);

      expect(weights.number_sense).toBeGreaterThanOrEqual(0);
      expect(weights.spatial).toBeGreaterThanOrEqual(0);
      expect(weights.operations).toBeGreaterThanOrEqual(0);
    });

    it('should never produce weights > 1.0', () => {
      const categories: WeaknessCategories = {
        weaknesses: ['number_sense'],
        moderate: ['spatial'],
        strengths: ['operations'],
      };

      const weights = generateWeights(categories);

      expect(weights.number_sense).toBeLessThanOrEqual(1.0);
      expect(weights.spatial).toBeLessThanOrEqual(1.0);
      expect(weights.operations).toBeLessThanOrEqual(1.0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle edge case where all categories are empty (fallback to equal weights)', () => {
      const categories: WeaknessCategories = {
        weaknesses: [],
        moderate: [],
        strengths: [],
      };

      const weights = generateWeights(categories);

      // Should fallback to equal distribution
      expect(weights.number_sense).toBeCloseTo(0.333, 2);
      expect(weights.spatial).toBeCloseTo(0.333, 2);
      expect(weights.operations).toBeCloseTo(0.333, 2);

      const sum = weights.number_sense + weights.spatial + weights.operations;
      expect(sum).toBeCloseTo(1.0, 10);
    });
  });
});
