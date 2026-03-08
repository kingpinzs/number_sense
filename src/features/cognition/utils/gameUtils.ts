// Pure functional utilities for Pattern Match game
// Story 6.3: No side effects, no Dexie queries, no React hooks

import type { Tile, GameDifficulty, DifficultyConfig } from '../types';
import { DIFFICULTY_CONFIGS, SYMBOLS } from '../types';

/**
 * Fisher-Yates shuffle algorithm
 * Returns a new shuffled array (does not mutate input)
 */
export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Get difficulty configuration
 */
export function getDifficultyConfig(difficulty: GameDifficulty): DifficultyConfig {
  return DIFFICULTY_CONFIGS[difficulty];
}

/**
 * Generate tile pairs for a given difficulty
 * Each symbol appears exactly twice to form matching pairs
 */
export function generateTilePairs(difficulty: GameDifficulty): Tile[] {
  const config = getDifficultyConfig(difficulty);
  const symbolsNeeded = config.pairs;

  // Take the first N symbols for this difficulty
  const selectedSymbols = SYMBOLS.slice(0, symbolsNeeded);

  // Create pairs (each symbol appears exactly twice)
  const tilePairs: Tile[] = [];
  let id = 0;
  for (const symbol of selectedSymbols) {
    tilePairs.push({ id: id++, symbol, revealed: false, matched: false });
    tilePairs.push({ id: id++, symbol, revealed: false, matched: false });
  }

  return shuffleArray(tilePairs);
}

/**
 * Check if two tiles are a match (same symbol)
 */
export function checkMatch(tile1: Tile, tile2: Tile): boolean {
  return tile1.symbol === tile2.symbol && tile1.id !== tile2.id;
}

/**
 * Calculate accuracy percentage
 * Perfect play = pairs/pairs = 100%
 * More moves = lower accuracy
 *
 * @param totalPairs - Number of pairs in the game
 * @param moves - Number of pair attempts (2 tiles flipped = 1 move)
 * @returns Accuracy percentage (0-100), rounded to 1 decimal
 */
export function calculateAccuracy(totalPairs: number, moves: number): number {
  if (moves === 0) return 0;
  return Math.round((totalPairs / moves) * 1000) / 10;
}

/**
 * Get the total number of tiles for a difficulty
 */
export function getTotalTiles(difficulty: GameDifficulty): number {
  const config = getDifficultyConfig(difficulty);
  return config.pairs * 2;
}
