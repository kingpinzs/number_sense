import { describe, it, expect } from 'vitest';
import {
  generatePattern,
  comparePatterns,
  getPatternLengthForRound,
  getEncouragementMessage,
  indexToRowCol,
} from './memoryGridUtils';
import { MEMORY_GRID_MAX_PATTERN } from '../types';

describe('generatePattern', () => {
  it('returns the correct number of indices', () => {
    const pattern = generatePattern(25, 5);
    expect(pattern).toHaveLength(5);
  });

  it('returns sorted indices', () => {
    const pattern = generatePattern(25, 7);
    for (let i = 1; i < pattern.length; i++) {
      expect(pattern[i]).toBeGreaterThan(pattern[i - 1]);
    }
  });

  it('returns indices within grid bounds (0-24)', () => {
    const pattern = generatePattern(25, 10);
    for (const idx of pattern) {
      expect(idx).toBeGreaterThanOrEqual(0);
      expect(idx).toBeLessThan(25);
    }
  });

  it('returns no duplicate indices', () => {
    const pattern = generatePattern(25, 12);
    const unique = new Set(pattern);
    expect(unique.size).toBe(pattern.length);
  });

  it('throws for patternLength <= 0', () => {
    expect(() => generatePattern(25, 0)).toThrow();
  });

  it('throws for patternLength > gridSize', () => {
    expect(() => generatePattern(25, 26)).toThrow();
  });

  it('works with patternLength equal to gridSize', () => {
    const pattern = generatePattern(25, 25);
    expect(pattern).toHaveLength(25);
  });

  it('generates different patterns on successive calls (randomness)', () => {
    const patterns = new Set<string>();
    for (let i = 0; i < 20; i++) {
      patterns.add(JSON.stringify(generatePattern(25, 5)));
    }
    // With 5 of 25 squares and 20 attempts, we should see at least 2 distinct patterns
    expect(patterns.size).toBeGreaterThan(1);
  });
});

describe('comparePatterns', () => {
  it('returns true for exact match (same order)', () => {
    expect(comparePatterns([1, 3, 5], [1, 3, 5])).toBe(true);
  });

  it('returns true for exact match (different order)', () => {
    expect(comparePatterns([1, 3, 5], [5, 1, 3])).toBe(true);
  });

  it('returns false when user has fewer selections', () => {
    expect(comparePatterns([1, 3, 5], [1, 3])).toBe(false);
  });

  it('returns false when user has extra selections', () => {
    expect(comparePatterns([1, 3, 5], [1, 3, 5, 7])).toBe(false);
  });

  it('returns false for completely wrong selection', () => {
    expect(comparePatterns([1, 3, 5], [2, 4, 6])).toBe(false);
  });

  it('returns false for partial overlap', () => {
    expect(comparePatterns([1, 3, 5], [1, 3, 6])).toBe(false);
  });

  it('returns true for empty arrays', () => {
    expect(comparePatterns([], [])).toBe(true);
  });
});

describe('getPatternLengthForRound', () => {
  it('returns 3 for rounds 1-3', () => {
    expect(getPatternLengthForRound(1)).toBe(3);
    expect(getPatternLengthForRound(2)).toBe(3);
    expect(getPatternLengthForRound(3)).toBe(3);
  });

  it('returns 5 for rounds 4-6', () => {
    expect(getPatternLengthForRound(4)).toBe(5);
    expect(getPatternLengthForRound(5)).toBe(5);
    expect(getPatternLengthForRound(6)).toBe(5);
  });

  it('returns 7 for round 7', () => {
    expect(getPatternLengthForRound(7)).toBe(7);
  });

  it('returns 8 for round 8', () => {
    expect(getPatternLengthForRound(8)).toBe(8);
  });

  it('returns 9 for round 9', () => {
    expect(getPatternLengthForRound(9)).toBe(9);
  });

  it('caps at MEMORY_GRID_MAX_PATTERN (12)', () => {
    expect(getPatternLengthForRound(20)).toBe(MEMORY_GRID_MAX_PATTERN);
    expect(getPatternLengthForRound(100)).toBe(MEMORY_GRID_MAX_PATTERN);
  });

  it('reaches max at round 12 (7 + 12 - 7 = 12)', () => {
    expect(getPatternLengthForRound(12)).toBe(12);
  });
});

describe('getEncouragementMessage', () => {
  it('returns incredible message for 8+ rounds', () => {
    expect(getEncouragementMessage(8)).toBe('Incredible memory!');
    expect(getEncouragementMessage(12)).toBe('Incredible memory!');
  });

  it('returns great message for 5-7 rounds', () => {
    expect(getEncouragementMessage(5)).toBe('Great working memory!');
    expect(getEncouragementMessage(7)).toBe('Great working memory!');
  });

  it('returns good effort message for 3-4 rounds', () => {
    expect(getEncouragementMessage(3)).toBe('Good effort! Keep practicing.');
    expect(getEncouragementMessage(4)).toBe('Good effort! Keep practicing.');
  });

  it('returns practice message for 0-2 rounds', () => {
    expect(getEncouragementMessage(0)).toBe('Memory improves with practice. Try again!');
    expect(getEncouragementMessage(1)).toBe('Memory improves with practice. Try again!');
    expect(getEncouragementMessage(2)).toBe('Memory improves with practice. Try again!');
  });
});

describe('indexToRowCol', () => {
  it('converts index 0 to row 1, col 1', () => {
    expect(indexToRowCol(0, 5)).toEqual({ row: 1, col: 1 });
  });

  it('converts index 4 to row 1, col 5', () => {
    expect(indexToRowCol(4, 5)).toEqual({ row: 1, col: 5 });
  });

  it('converts index 5 to row 2, col 1', () => {
    expect(indexToRowCol(5, 5)).toEqual({ row: 2, col: 1 });
  });

  it('converts index 24 to row 5, col 5', () => {
    expect(indexToRowCol(24, 5)).toEqual({ row: 5, col: 5 });
  });

  it('converts index 12 to row 3, col 3 (center)', () => {
    expect(indexToRowCol(12, 5)).toEqual({ row: 3, col: 3 });
  });
});
