// Types for cognition mini-games
// Story 6.3: Pattern Match Mini-Game
// Story 6.4: Spatial Flip Mini-Game

export interface Tile {
  id: number;
  symbol: string;
  revealed: boolean;
  matched: boolean;
}

export type GameDifficulty = 'easy' | 'medium' | 'hard';

export interface DifficultyConfig {
  cols: number;
  rows: number;
  pairs: number;
}

export const DIFFICULTY_CONFIGS: Record<GameDifficulty, DifficultyConfig> = {
  easy: { cols: 4, rows: 3, pairs: 6 },
  medium: { cols: 4, rows: 4, pairs: 8 },
  hard: { cols: 5, rows: 4, pairs: 10 },
} as const;

export const SYMBOLS = [
  'circle',
  'square',
  'triangle',
  'star',
  'diamond',
  'heart',
  'hexagon',
  'cross',
  'pentagon',
  'arrow',
] as const;

export type SymbolType = (typeof SYMBOLS)[number];

export interface GameResult {
  difficulty: GameDifficulty;
  moves: number;
  duration: number; // milliseconds
  accuracy: number; // percentage (0-100)
  pairs: number;
}

export type GamePhase = 'playing' | 'complete';

// Story 6.4: Spatial Flip types
import type { ShapeType } from '@/features/training/content/shapes';

export interface SpatialFlipChoice {
  id: number;            // 0-3 (A, B, C, D)
  shape: ShapeType;
  rotationDegrees: number;
  isMirrored: boolean;
  isCorrect: boolean;
}

export interface SpatialFlipQuestion {
  referenceShape: ShapeType;
  choices: SpatialFlipChoice[];
  correctIndex: number;  // Index of correct choice in shuffled array
}

export interface SpatialFlipResult {
  difficulty: GameDifficulty;
  correctCount: number;
  totalQuestions: number;
  accuracy: number;        // percentage (0-100)
  avgResponseTime: number; // milliseconds
}

// Rotation angles per difficulty (from SpatialRotationDrill)
export const SPATIAL_FLIP_ROTATION_ANGLES: Record<GameDifficulty, number[]> = {
  easy: [0, 90, 180, 270],
  medium: [0, 45, 90, 180, 270],
  hard: [0, 45, 90, 135, 180, 225, 270, 315],
};

// Shapes filtered for Spatial Flip: must produce visually distinct rotations
// All shapes are asymmetric so rotation is always visible.
// Circle excluded: infinite rotational symmetry (rotation never visible)
// Square excluded from easy: 4-fold symmetry (90° rotations identical with easy's angle set)
// Each difficulty needs 4+ shapes so distractors are always different shapes from the reference
// Includes polyomino-inspired shapes (Z, S, hook, U, F, W) for genuine spatial reasoning challenge
export const SPATIAL_FLIP_SHAPES: Record<GameDifficulty, ShapeType[]> = {
  easy: ['triangle', 'rectangle', 'lshape', 'tshape', 'hookshape', 'ushape'],
  medium: ['lshape', 'tshape', 'hookshape', 'ushape', 'zshape', 'sshape', 'arrow', 'rectangle', 'pentagon'],
  hard: ['lshape', 'tshape', 'hookshape', 'ushape', 'zshape', 'sshape', 'fshape', 'wshape', 'arrow', 'pentagon', 'hexagon', 'star'],
};

export const SPATIAL_FLIP_TOTAL_QUESTIONS = 10;
export const SPATIAL_FLIP_TIME_LIMIT_MS = 10000; // 10 seconds per question
export const SPATIAL_FLIP_AUTO_ADVANCE_MS = 1500; // 1.5 seconds feedback

// Story 6.5: Memory Grid types
export type MemoryGridPhase = 'displaying' | 'recalling' | 'feedback' | 'complete';

export interface MemoryGridResult {
  roundsCompleted: number;
  longestPattern: number;
  duration: number;       // milliseconds
  livesRemaining: number;
}

// Memory Grid constants
export const MEMORY_GRID_SIZE = 25;           // 5x5 grid
export const MEMORY_GRID_COLS = 5;
export const MEMORY_GRID_DISPLAY_MS = 2000;   // 2 seconds to memorize pattern
export const MEMORY_GRID_FEEDBACK_MS = 1500;  // 1.5 seconds feedback display
export const MEMORY_GRID_INITIAL_LIVES = 3;
export const MEMORY_GRID_MAX_PATTERN = 12;    // Cap at 12 (nearly half the grid)
