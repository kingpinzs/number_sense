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
    it('should return 5.0 for number_sense with 3/3 correct', () => {
      const questions: QuestionForScoring[] = [
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

    it('should return 5.0 for arithmetic with 3/3 correct', () => {
      const questions: QuestionForScoring[] = [
        { domain: 'arithmetic', isCorrect: true },
        { domain: 'arithmetic', isCorrect: true },
        { domain: 'arithmetic', isCorrect: true },
      ];

      const score = calculateDomainScore(questions, 'arithmetic');
      expect(score).toBe(5.0);
    });
  });

  describe('All Questions Incorrect', () => {
    it('should return 0.0 for number_sense with 0/3 correct', () => {
      const questions: QuestionForScoring[] = [
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

    it('should return 0.0 for arithmetic with 0/3 correct', () => {
      const questions: QuestionForScoring[] = [
        { domain: 'arithmetic', isCorrect: false },
        { domain: 'arithmetic', isCorrect: false },
        { domain: 'arithmetic', isCorrect: false },
      ];

      const score = calculateDomainScore(questions, 'arithmetic');
      expect(score).toBe(0.0);
    });
  });

  describe('Partial Correct', () => {
    it('should return ~3.333 for number_sense with 2/3 correct', () => {
      const questions: QuestionForScoring[] = [
        { domain: 'number_sense', isCorrect: true },
        { domain: 'number_sense', isCorrect: true },
        { domain: 'number_sense', isCorrect: false },
      ];

      const score = calculateDomainScore(questions, 'number_sense');
      expect(score).toBeCloseTo(3.333, 2);
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

    it('should return ~1.667 for arithmetic with 1/3 correct', () => {
      const questions: QuestionForScoring[] = [
        { domain: 'arithmetic', isCorrect: true },
        { domain: 'arithmetic', isCorrect: false },
        { domain: 'arithmetic', isCorrect: false },
      ];

      const score = calculateDomainScore(questions, 'arithmetic');
      expect(score).toBeCloseTo(1.667, 2);
    });

    it('should return ~1.667 for number_sense with 1/3 correct', () => {
      const questions: QuestionForScoring[] = [
        { domain: 'number_sense', isCorrect: true },
        { domain: 'number_sense', isCorrect: false },
        { domain: 'number_sense', isCorrect: false },
      ];

      const score = calculateDomainScore(questions, 'number_sense');
      expect(score).toBeCloseTo(1.667, 2);
    });

    it('should return ~3.333 for number_sense with 2/3 correct (high partial)', () => {
      const questions: QuestionForScoring[] = [
        { domain: 'number_sense', isCorrect: true },
        { domain: 'number_sense', isCorrect: true },
        { domain: 'number_sense', isCorrect: false },
      ];

      const score = calculateDomainScore(questions, 'number_sense');
      expect(score).toBeCloseTo(3.333, 2);
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
        { domain: 'arithmetic', isCorrect: true }, // Should be ignored
        { domain: 'number_sense', isCorrect: true },
        { domain: 'number_sense', isCorrect: false },
      ];

      // 2/3 number_sense questions are correct
      const score = calculateDomainScore(questions, 'number_sense');
      expect(score).toBeCloseTo(3.333, 2);
    });

    it('should handle mixed questions and return correct score for each domain', () => {
      const questions: QuestionForScoring[] = [
        { domain: 'number_sense', isCorrect: true },
        { domain: 'number_sense', isCorrect: true },
        { domain: 'number_sense', isCorrect: true },
        { domain: 'spatial', isCorrect: true },
        { domain: 'spatial', isCorrect: false },
        { domain: 'spatial', isCorrect: false },
        { domain: 'arithmetic', isCorrect: false },
        { domain: 'arithmetic', isCorrect: false },
        { domain: 'arithmetic', isCorrect: false },
      ];

      expect(calculateDomainScore(questions, 'number_sense')).toBe(5.0);
      expect(calculateDomainScore(questions, 'spatial')).toBeCloseTo(1.667, 2);
      expect(calculateDomainScore(questions, 'arithmetic')).toBe(0.0);
    });
  });
});

describe('identifyWeaknesses', () => {
  describe('Threshold Boundary Testing', () => {
    it('should classify score exactly 2.5 as weak (≤ 2.5)', () => {
      const scores: DomainScores = {
        number_sense: 2.5,
        place_value: 5.0,
        sequencing: 5.0,
        arithmetic: 5.0,
        spatial: 5.0,
        applied: 5.0,
      };

      const categories = identifyWeaknesses(scores);
      expect(categories.weaknesses).toContain('number_sense');
      expect(categories.weaknesses).toHaveLength(1);
    });

    it('should classify score 2.6 as moderate', () => {
      const scores: DomainScores = {
        number_sense: 2.6,
        place_value: 5.0,
        sequencing: 5.0,
        arithmetic: 5.0,
        spatial: 5.0,
        applied: 5.0,
      };

      const categories = identifyWeaknesses(scores);
      expect(categories.moderate).toContain('number_sense');
      expect(categories.moderate).toHaveLength(1);
    });

    it('should classify score exactly 3.5 as moderate (≤ 3.5)', () => {
      const scores: DomainScores = {
        number_sense: 3.5,
        place_value: 5.0,
        sequencing: 5.0,
        arithmetic: 5.0,
        spatial: 5.0,
        applied: 5.0,
      };

      const categories = identifyWeaknesses(scores);
      expect(categories.moderate).toContain('number_sense');
      expect(categories.moderate).toHaveLength(1);
    });

    it('should classify score 3.6 as strength (> 3.5)', () => {
      const scores: DomainScores = {
        number_sense: 3.6,
        place_value: 5.0,
        sequencing: 5.0,
        arithmetic: 5.0,
        spatial: 5.0,
        applied: 5.0,
      };

      const categories = identifyWeaknesses(scores);
      expect(categories.strengths).toContain('number_sense');
      expect(categories.strengths).toHaveLength(6);
    });

    it('should classify score 0.0 as weak', () => {
      const scores: DomainScores = {
        number_sense: 0.0,
        place_value: 5.0,
        sequencing: 5.0,
        arithmetic: 5.0,
        spatial: 5.0,
        applied: 5.0,
      };

      const categories = identifyWeaknesses(scores);
      expect(categories.weaknesses).toContain('number_sense');
    });

    it('should classify score 5.0 as strength', () => {
      const scores: DomainScores = {
        number_sense: 5.0,
        place_value: 5.0,
        sequencing: 5.0,
        arithmetic: 5.0,
        spatial: 5.0,
        applied: 5.0,
      };

      const categories = identifyWeaknesses(scores);
      expect(categories.strengths).toHaveLength(6);
    });
  });

  describe('All Domains Same Category', () => {
    it('should identify all domains as weak when all scores ≤ 2.5', () => {
      const scores: DomainScores = {
        number_sense: 1.0,
        place_value: 1.5,
        sequencing: 2.0,
        arithmetic: 2.5,
        spatial: 2.0,
        applied: 1.0,
      };

      const categories = identifyWeaknesses(scores);
      expect(categories.weaknesses).toEqual(
        expect.arrayContaining(['number_sense', 'place_value', 'sequencing', 'arithmetic', 'spatial', 'applied'])
      );
      expect(categories.weaknesses).toHaveLength(6);
      expect(categories.moderate).toHaveLength(0);
      expect(categories.strengths).toHaveLength(0);
    });

    it('should identify all domains as moderate when all scores 2.6-3.5', () => {
      const scores: DomainScores = {
        number_sense: 2.6,
        place_value: 2.8,
        sequencing: 3.0,
        arithmetic: 3.5,
        spatial: 3.0,
        applied: 3.2,
      };

      const categories = identifyWeaknesses(scores);
      expect(categories.moderate).toEqual(
        expect.arrayContaining(['number_sense', 'place_value', 'sequencing', 'arithmetic', 'spatial', 'applied'])
      );
      expect(categories.moderate).toHaveLength(6);
      expect(categories.weaknesses).toHaveLength(0);
      expect(categories.strengths).toHaveLength(0);
    });

    it('should identify all domains as strengths when all scores > 3.5', () => {
      const scores: DomainScores = {
        number_sense: 4.0,
        place_value: 4.2,
        sequencing: 4.5,
        arithmetic: 5.0,
        spatial: 4.5,
        applied: 3.8,
      };

      const categories = identifyWeaknesses(scores);
      expect(categories.strengths).toEqual(
        expect.arrayContaining(['number_sense', 'place_value', 'sequencing', 'arithmetic', 'spatial', 'applied'])
      );
      expect(categories.strengths).toHaveLength(6);
      expect(categories.weaknesses).toHaveLength(0);
      expect(categories.moderate).toHaveLength(0);
    });
  });

  describe('Mixed Distribution', () => {
    it('should correctly categorize mixed scores', () => {
      const scores: DomainScores = {
        number_sense: 2.0, // weak
        place_value: 2.5, // weak
        sequencing: 3.0, // moderate
        arithmetic: 4.5, // strength
        spatial: 3.0, // moderate
        applied: 4.0, // strength
      };

      const categories = identifyWeaknesses(scores);
      expect(categories.weaknesses).toEqual(expect.arrayContaining(['number_sense', 'place_value']));
      expect(categories.weaknesses).toHaveLength(2);
      expect(categories.moderate).toEqual(expect.arrayContaining(['sequencing', 'spatial']));
      expect(categories.moderate).toHaveLength(2);
      expect(categories.strengths).toEqual(expect.arrayContaining(['arithmetic', 'applied']));
      expect(categories.strengths).toHaveLength(2);
    });

    it('should handle two weak, two moderate, two strengths', () => {
      const scores: DomainScores = {
        number_sense: 1.5, // weak
        place_value: 2.5, // weak
        sequencing: 3.0, // moderate
        arithmetic: 4.0, // strength
        spatial: 2.8, // moderate
        applied: 4.5, // strength
      };

      const categories = identifyWeaknesses(scores);
      expect(categories.weaknesses).toHaveLength(2);
      expect(categories.weaknesses).toContain('number_sense');
      expect(categories.weaknesses).toContain('place_value');
      expect(categories.moderate).toHaveLength(2);
      expect(categories.moderate).toContain('sequencing');
      expect(categories.moderate).toContain('spatial');
      expect(categories.strengths).toHaveLength(2);
      expect(categories.strengths).toContain('arithmetic');
      expect(categories.strengths).toContain('applied');
    });

    it('should handle one weak, three moderate, two strengths', () => {
      const scores: DomainScores = {
        number_sense: 1.0, // weak
        place_value: 3.0, // moderate
        sequencing: 3.5, // moderate
        arithmetic: 4.0, // strength
        spatial: 3.0, // moderate
        applied: 4.5, // strength
      };

      const categories = identifyWeaknesses(scores);
      expect(categories.weaknesses).toEqual(['number_sense']);
      expect(categories.moderate).toHaveLength(3);
      expect(categories.moderate).toContain('place_value');
      expect(categories.moderate).toContain('sequencing');
      expect(categories.moderate).toContain('spatial');
      expect(categories.strengths).toHaveLength(2);
      expect(categories.strengths).toContain('arithmetic');
      expect(categories.strengths).toContain('applied');
    });
  });
});

describe('generateWeights', () => {
  describe('All Domains Same Category', () => {
    it('should normalize all weak domains to ~0.167 each', () => {
      const categories: WeaknessCategories = {
        weaknesses: ['number_sense', 'place_value', 'sequencing', 'arithmetic', 'spatial', 'applied'],
        moderate: [],
        strengths: [],
      };

      const weights = generateWeights(categories);

      // Each should be 2.0 / 12.0 = 0.1667...
      expect(weights.number_sense).toBeCloseTo(0.167, 2);
      expect(weights.place_value).toBeCloseTo(0.167, 2);
      expect(weights.sequencing).toBeCloseTo(0.167, 2);
      expect(weights.arithmetic).toBeCloseTo(0.167, 2);
      expect(weights.spatial).toBeCloseTo(0.167, 2);
      expect(weights.applied).toBeCloseTo(0.167, 2);

      // Sum should be exactly 1.0
      const sum = weights.number_sense + weights.place_value + weights.sequencing +
        weights.arithmetic + weights.spatial + weights.applied;
      expect(sum).toBeCloseTo(1.0, 10);
    });

    it('should normalize all moderate domains to ~0.167 each', () => {
      const categories: WeaknessCategories = {
        weaknesses: [],
        moderate: ['number_sense', 'place_value', 'sequencing', 'arithmetic', 'spatial', 'applied'],
        strengths: [],
      };

      const weights = generateWeights(categories);

      // Each should be 1.0 / 6.0 = 0.1667...
      expect(weights.number_sense).toBeCloseTo(0.167, 2);
      expect(weights.place_value).toBeCloseTo(0.167, 2);
      expect(weights.sequencing).toBeCloseTo(0.167, 2);
      expect(weights.arithmetic).toBeCloseTo(0.167, 2);
      expect(weights.spatial).toBeCloseTo(0.167, 2);
      expect(weights.applied).toBeCloseTo(0.167, 2);

      // Sum should be exactly 1.0
      const sum = weights.number_sense + weights.place_value + weights.sequencing +
        weights.arithmetic + weights.spatial + weights.applied;
      expect(sum).toBeCloseTo(1.0, 10);
    });

    it('should normalize all strength domains to ~0.167 each', () => {
      const categories: WeaknessCategories = {
        weaknesses: [],
        moderate: [],
        strengths: ['number_sense', 'place_value', 'sequencing', 'arithmetic', 'spatial', 'applied'],
      };

      const weights = generateWeights(categories);

      // Each should be 0.5 / 3.0 = 0.1667...
      expect(weights.number_sense).toBeCloseTo(0.167, 2);
      expect(weights.place_value).toBeCloseTo(0.167, 2);
      expect(weights.sequencing).toBeCloseTo(0.167, 2);
      expect(weights.arithmetic).toBeCloseTo(0.167, 2);
      expect(weights.spatial).toBeCloseTo(0.167, 2);
      expect(weights.applied).toBeCloseTo(0.167, 2);

      // Sum should be exactly 1.0
      const sum = weights.number_sense + weights.place_value + weights.sequencing +
        weights.arithmetic + weights.spatial + weights.applied;
      expect(sum).toBeCloseTo(1.0, 10);
    });
  });

  describe('Mixed Categories Normalization', () => {
    it('should normalize mixed weights correctly (weak=2.0, moderate=1.0, strength=0.5)', () => {
      const categories: WeaknessCategories = {
        weaknesses: ['number_sense'], // 2.0
        moderate: ['arithmetic'], // 1.0
        strengths: ['spatial', 'place_value', 'sequencing', 'applied'], // 0.5 each
      };

      const weights = generateWeights(categories);

      // Raw sum: 2.0 + 1.0 + 0.5*4 = 5.0
      // Normalized: number_sense=2.0/5.0=0.4, arithmetic=1.0/5.0=0.2, each strength=0.5/5.0=0.1
      expect(weights.number_sense).toBeCloseTo(0.4, 2);
      expect(weights.arithmetic).toBeCloseTo(0.2, 2);
      expect(weights.spatial).toBeCloseTo(0.1, 2);
      expect(weights.place_value).toBeCloseTo(0.1, 2);
      expect(weights.sequencing).toBeCloseTo(0.1, 2);
      expect(weights.applied).toBeCloseTo(0.1, 2);

      // Sum should be exactly 1.0
      const sum = weights.number_sense + weights.place_value + weights.sequencing +
        weights.arithmetic + weights.spatial + weights.applied;
      expect(sum).toBeCloseTo(1.0, 10);
    });

    it('should normalize two weak, four strengths correctly', () => {
      const categories: WeaknessCategories = {
        weaknesses: ['number_sense', 'spatial'], // 2.0 each
        moderate: [],
        strengths: ['arithmetic', 'place_value', 'sequencing', 'applied'], // 0.5 each
      };

      const weights = generateWeights(categories);

      // Raw sum: 2.0 + 2.0 + 0.5*4 = 6.0
      // Each weak: 2.0/6.0 = 0.333...
      // Each strength: 0.5/6.0 = 0.0833...
      expect(weights.number_sense).toBeCloseTo(0.333, 2);
      expect(weights.spatial).toBeCloseTo(0.333, 2);
      expect(weights.arithmetic).toBeCloseTo(0.083, 2);
      expect(weights.place_value).toBeCloseTo(0.083, 2);
      expect(weights.sequencing).toBeCloseTo(0.083, 2);
      expect(weights.applied).toBeCloseTo(0.083, 2);

      const sum = weights.number_sense + weights.place_value + weights.sequencing +
        weights.arithmetic + weights.spatial + weights.applied;
      expect(sum).toBeCloseTo(1.0, 10);
    });

    it('should normalize one weak, two moderate, three strengths correctly', () => {
      const categories: WeaknessCategories = {
        weaknesses: ['number_sense'], // 2.0
        moderate: ['spatial', 'arithmetic'], // 1.0 each
        strengths: ['place_value', 'sequencing', 'applied'], // 0.5 each
      };

      const weights = generateWeights(categories);

      // Raw sum: 2.0 + 1.0 + 1.0 + 0.5*3 = 5.5
      // Weak: 2.0/5.5 = 0.3636...
      // Each moderate: 1.0/5.5 = 0.1818...
      // Each strength: 0.5/5.5 = 0.0909...
      expect(weights.number_sense).toBeCloseTo(0.364, 2);
      expect(weights.spatial).toBeCloseTo(0.182, 2);
      expect(weights.arithmetic).toBeCloseTo(0.182, 2);
      expect(weights.place_value).toBeCloseTo(0.091, 2);
      expect(weights.sequencing).toBeCloseTo(0.091, 2);
      expect(weights.applied).toBeCloseTo(0.091, 2);

      const sum = weights.number_sense + weights.place_value + weights.sequencing +
        weights.arithmetic + weights.spatial + weights.applied;
      expect(sum).toBeCloseTo(1.0, 10);
    });
  });

  describe('Normalization Validation', () => {
    it('should always sum to 1.0 regardless of distribution', () => {
      const testCases: WeaknessCategories[] = [
        {
          weaknesses: ['number_sense', 'place_value', 'sequencing', 'arithmetic', 'spatial', 'applied'],
          moderate: [],
          strengths: [],
        },
        {
          weaknesses: [],
          moderate: ['number_sense', 'place_value', 'sequencing', 'arithmetic', 'spatial', 'applied'],
          strengths: [],
        },
        {
          weaknesses: [],
          moderate: [],
          strengths: ['number_sense', 'place_value', 'sequencing', 'arithmetic', 'spatial', 'applied'],
        },
        {
          weaknesses: ['number_sense'],
          moderate: ['place_value'],
          strengths: ['sequencing', 'arithmetic', 'spatial', 'applied'],
        },
        {
          weaknesses: ['number_sense', 'spatial'],
          moderate: ['place_value', 'sequencing'],
          strengths: ['arithmetic', 'applied'],
        },
        {
          weaknesses: ['number_sense'],
          moderate: ['place_value', 'sequencing'],
          strengths: ['arithmetic', 'spatial', 'applied'],
        },
      ];

      for (const categories of testCases) {
        const weights = generateWeights(categories);
        const sum = weights.number_sense + weights.place_value + weights.sequencing +
          weights.arithmetic + weights.spatial + weights.applied;
        expect(sum).toBeCloseTo(1.0, 10);
      }
    });

    it('should never produce negative weights', () => {
      const categories: WeaknessCategories = {
        weaknesses: ['number_sense'],
        moderate: ['place_value', 'sequencing'],
        strengths: ['arithmetic', 'spatial', 'applied'],
      };

      const weights = generateWeights(categories);

      expect(weights.number_sense).toBeGreaterThanOrEqual(0);
      expect(weights.place_value).toBeGreaterThanOrEqual(0);
      expect(weights.sequencing).toBeGreaterThanOrEqual(0);
      expect(weights.arithmetic).toBeGreaterThanOrEqual(0);
      expect(weights.spatial).toBeGreaterThanOrEqual(0);
      expect(weights.applied).toBeGreaterThanOrEqual(0);
    });

    it('should never produce weights > 1.0', () => {
      const categories: WeaknessCategories = {
        weaknesses: ['number_sense'],
        moderate: ['place_value', 'sequencing'],
        strengths: ['arithmetic', 'spatial', 'applied'],
      };

      const weights = generateWeights(categories);

      expect(weights.number_sense).toBeLessThanOrEqual(1.0);
      expect(weights.place_value).toBeLessThanOrEqual(1.0);
      expect(weights.sequencing).toBeLessThanOrEqual(1.0);
      expect(weights.arithmetic).toBeLessThanOrEqual(1.0);
      expect(weights.spatial).toBeLessThanOrEqual(1.0);
      expect(weights.applied).toBeLessThanOrEqual(1.0);
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

      // Should fallback to equal distribution: 1/6 each
      expect(weights.number_sense).toBeCloseTo(0.167, 2);
      expect(weights.place_value).toBeCloseTo(0.167, 2);
      expect(weights.sequencing).toBeCloseTo(0.167, 2);
      expect(weights.arithmetic).toBeCloseTo(0.167, 2);
      expect(weights.spatial).toBeCloseTo(0.167, 2);
      expect(weights.applied).toBeCloseTo(0.167, 2);

      const sum = weights.number_sense + weights.place_value + weights.sequencing +
        weights.arithmetic + weights.spatial + weights.applied;
      expect(sum).toBeCloseTo(1.0, 10);
    });
  });
});
