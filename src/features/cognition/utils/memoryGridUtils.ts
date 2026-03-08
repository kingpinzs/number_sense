// Pure functional utilities for Memory Grid game
// Story 6.5: No side effects, no Dexie queries, no React hooks

import { MEMORY_GRID_MAX_PATTERN } from '../types';
import { shuffleArray } from './gameUtils';

/**
 * Generate a random pattern of square indices for the memory grid.
 * Returns sorted indices for consistent comparison.
 *
 * @param gridSize - Total number of squares in the grid (25 for 5x5)
 * @param patternLength - Number of squares to highlight
 * @returns Sorted array of square indices (0-based)
 */
export function generatePattern(gridSize: number, patternLength: number): number[] {
  if (patternLength <= 0 || patternLength > gridSize) {
    throw new Error(`Pattern length must be between 1 and ${gridSize}, got ${patternLength}`);
  }
  const indices = Array.from({ length: gridSize }, (_, i) => i);
  const shuffled = shuffleArray(indices);
  return shuffled.slice(0, patternLength).sort((a, b) => a - b);
}

/**
 * Compare user's selected squares against the original pattern.
 * Must be an exact match — same squares, no extras, no missing.
 *
 * @param original - The original pattern indices (sorted)
 * @param userSelection - User's selected indices (may be unsorted)
 * @returns true if exact match, false otherwise
 */
export function comparePatterns(original: number[], userSelection: number[]): boolean {
  if (original.length !== userSelection.length) return false;
  const sortedOriginal = [...original].sort((a, b) => a - b);
  const sortedUser = [...userSelection].sort((a, b) => a - b);
  return sortedOriginal.every((val, idx) => val === sortedUser[idx]);
}

/**
 * Get the pattern length for a given round number.
 * Difficulty increases as rounds progress.
 *
 * Rounds 1-3: 3 squares
 * Rounds 4-6: 5 squares
 * Round 7+:   7 + (round - 7), capped at MEMORY_GRID_MAX_PATTERN (12)
 *
 * @param round - Current round number (1-based)
 * @returns Number of squares to highlight
 */
export function getPatternLengthForRound(round: number): number {
  if (round <= 3) return 3;
  if (round <= 6) return 5;
  const length = 7 + (round - 7);
  return Math.min(length, MEMORY_GRID_MAX_PATTERN);
}

/**
 * Get encouragement message based on the round reached.
 * "Reached round X" means the player was on round X when the game ended,
 * regardless of whether they completed it.
 *
 * @param reachedRound - The round number the user reached (1-based)
 * @returns Encouragement string
 */
export function getEncouragementMessage(reachedRound: number): string {
  if (reachedRound >= 8) return 'Incredible memory!';
  if (reachedRound >= 5) return 'Great working memory!';
  if (reachedRound >= 3) return 'Good effort! Keep practicing.';
  return 'Memory improves with practice. Try again!';
}

/**
 * Convert a flat grid index to row and column (1-based, for aria-labels).
 *
 * @param index - 0-based grid index (0-24)
 * @param cols - Number of columns in the grid
 * @returns { row, col } 1-based
 */
export function indexToRowCol(index: number, cols: number): { row: number; col: number } {
  return {
    row: Math.floor(index / cols) + 1,
    col: (index % cols) + 1,
  };
}
