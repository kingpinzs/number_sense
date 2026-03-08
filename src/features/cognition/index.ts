// Public API for cognition feature
// Story 6.3: Pattern Match Mini-Game
// Story 6.4: Spatial Flip Mini-Game
// Story 6.5: Memory Grid Mini-Game

export type {
  Tile,
  GameDifficulty,
  DifficultyConfig,
  GameResult,
  GamePhase,
  SymbolType,
  SpatialFlipChoice,
  SpatialFlipQuestion,
  SpatialFlipResult,
  MemoryGridPhase,
  MemoryGridResult,
} from './types';

export {
  DIFFICULTY_CONFIGS,
  SYMBOLS,
  SPATIAL_FLIP_ROTATION_ANGLES,
  SPATIAL_FLIP_SHAPES,
  SPATIAL_FLIP_TOTAL_QUESTIONS,
  SPATIAL_FLIP_TIME_LIMIT_MS,
  SPATIAL_FLIP_AUTO_ADVANCE_MS,
  MEMORY_GRID_SIZE,
  MEMORY_GRID_COLS,
  MEMORY_GRID_DISPLAY_MS,
  MEMORY_GRID_FEEDBACK_MS,
  MEMORY_GRID_INITIAL_LIVES,
  MEMORY_GRID_MAX_PATTERN,
} from './types';

export {
  shuffleArray,
  generateTilePairs,
  checkMatch,
  calculateAccuracy,
  getDifficultyConfig,
  getTotalTiles,
} from './utils/gameUtils';

export {
  generateQuestion,
  generateDistractors,
  getEncouragementMessage,
  getShapeSetForDifficulty,
  getRotationAnglesForDifficulty,
  CHOICE_LABELS,
} from './utils/spatialFlipUtils';

export {
  generatePattern,
  comparePatterns,
  getPatternLengthForRound,
  getEncouragementMessage as getMemoryGridEncouragement,
  indexToRowCol,
} from './utils/memoryGridUtils';
