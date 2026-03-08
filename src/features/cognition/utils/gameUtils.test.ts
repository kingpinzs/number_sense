// gameUtils.test.ts - Unit tests for Pattern Match game utilities
// Story 6.3: Pure functional utility tests

import { describe, it, expect } from 'vitest';
import {
  shuffleArray,
  generateTilePairs,
  checkMatch,
  calculateAccuracy,
  getDifficultyConfig,
  getTotalTiles,
} from './gameUtils';
import type { Tile } from '../types';

describe('shuffleArray', () => {
  it('returns array of same length', () => {
    const input = [1, 2, 3, 4, 5];
    const result = shuffleArray(input);
    expect(result).toHaveLength(input.length);
  });

  it('contains all original elements', () => {
    const input = [1, 2, 3, 4, 5];
    const result = shuffleArray(input);
    expect(result.sort()).toEqual(input.sort());
  });

  it('does not mutate the original array', () => {
    const input = [1, 2, 3, 4, 5];
    const copy = [...input];
    shuffleArray(input);
    expect(input).toEqual(copy);
  });

  it('produces different orderings (statistical)', () => {
    const input = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const results = new Set<string>();
    for (let i = 0; i < 20; i++) {
      results.add(JSON.stringify(shuffleArray(input)));
    }
    // With 10 elements and 20 trials, extremely unlikely to get all same
    expect(results.size).toBeGreaterThan(1);
  });
});

describe('getDifficultyConfig', () => {
  it('returns correct config for easy', () => {
    const config = getDifficultyConfig('easy');
    expect(config).toEqual({ cols: 4, rows: 3, pairs: 6 });
  });

  it('returns correct config for medium', () => {
    const config = getDifficultyConfig('medium');
    expect(config).toEqual({ cols: 4, rows: 4, pairs: 8 });
  });

  it('returns correct config for hard', () => {
    const config = getDifficultyConfig('hard');
    expect(config).toEqual({ cols: 5, rows: 4, pairs: 10 });
  });
});

describe('generateTilePairs', () => {
  it('generates 12 tiles for easy difficulty (6 pairs)', () => {
    const tiles = generateTilePairs('easy');
    expect(tiles).toHaveLength(12);
  });

  it('generates 16 tiles for medium difficulty (8 pairs)', () => {
    const tiles = generateTilePairs('medium');
    expect(tiles).toHaveLength(16);
  });

  it('generates 20 tiles for hard difficulty (10 pairs)', () => {
    const tiles = generateTilePairs('hard');
    expect(tiles).toHaveLength(20);
  });

  it('each symbol appears exactly twice (medium)', () => {
    const tiles = generateTilePairs('medium');
    const symbolCounts: Record<string, number> = {};
    tiles.forEach((t) => {
      symbolCounts[t.symbol] = (symbolCounts[t.symbol] || 0) + 1;
    });

    Object.values(symbolCounts).forEach((count) => {
      expect(count).toBe(2);
    });
    expect(Object.keys(symbolCounts)).toHaveLength(8);
  });

  it('each symbol appears exactly twice (easy)', () => {
    const tiles = generateTilePairs('easy');
    const symbolCounts: Record<string, number> = {};
    tiles.forEach((t) => {
      symbolCounts[t.symbol] = (symbolCounts[t.symbol] || 0) + 1;
    });

    Object.values(symbolCounts).forEach((count) => {
      expect(count).toBe(2);
    });
    expect(Object.keys(symbolCounts)).toHaveLength(6);
  });

  it('all tiles start face-down and unmatched', () => {
    const tiles = generateTilePairs('medium');
    tiles.forEach((tile) => {
      expect(tile.revealed).toBe(false);
      expect(tile.matched).toBe(false);
    });
  });

  it('all tiles have unique IDs', () => {
    const tiles = generateTilePairs('hard');
    const ids = tiles.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('checkMatch', () => {
  it('returns true for tiles with same symbol and different IDs', () => {
    const tile1: Tile = { id: 0, symbol: 'circle', revealed: true, matched: false };
    const tile2: Tile = { id: 1, symbol: 'circle', revealed: true, matched: false };
    expect(checkMatch(tile1, tile2)).toBe(true);
  });

  it('returns false for tiles with different symbols', () => {
    const tile1: Tile = { id: 0, symbol: 'circle', revealed: true, matched: false };
    const tile2: Tile = { id: 1, symbol: 'square', revealed: true, matched: false };
    expect(checkMatch(tile1, tile2)).toBe(false);
  });

  it('returns false for same tile (same ID)', () => {
    const tile: Tile = { id: 0, symbol: 'circle', revealed: true, matched: false };
    expect(checkMatch(tile, tile)).toBe(false);
  });
});

describe('calculateAccuracy', () => {
  it('returns 100 for perfect play (moves = pairs)', () => {
    expect(calculateAccuracy(8, 8)).toBe(100);
  });

  it('returns 66.7 for 8 pairs in 12 moves', () => {
    expect(calculateAccuracy(8, 12)).toBe(66.7);
  });

  it('returns 50 for 8 pairs in 16 moves', () => {
    expect(calculateAccuracy(8, 16)).toBe(50);
  });

  it('returns 0 when moves is 0', () => {
    expect(calculateAccuracy(8, 0)).toBe(0);
  });

  it('calculates correctly for easy difficulty', () => {
    expect(calculateAccuracy(6, 6)).toBe(100);
    expect(calculateAccuracy(6, 10)).toBe(60);
  });
});

describe('getTotalTiles', () => {
  it('returns 12 for easy', () => {
    expect(getTotalTiles('easy')).toBe(12);
  });

  it('returns 16 for medium', () => {
    expect(getTotalTiles('medium')).toBe(16);
  });

  it('returns 20 for hard', () => {
    expect(getTotalTiles('hard')).toBe(20);
  });
});
