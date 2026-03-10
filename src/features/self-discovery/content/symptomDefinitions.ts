// Symptom definitions for dyscalculia self-discovery checklist
// 22 symptoms across 5 categories, each mapped to 1-3 training domains

import type { SymptomDefinition, SymptomCategory } from '../types';

/** Category display labels */
export const CATEGORY_LABELS: Record<SymptomCategory, string> = {
  time_navigation: 'Time & Navigation',
  numbers_arithmetic: 'Numbers & Arithmetic',
  memory_processing: 'Memory & Processing',
  spatial_motor: 'Spatial & Motor',
  emotional_practical: 'Emotional & Practical',
};

/** Category display order */
export const CATEGORY_ORDER: SymptomCategory[] = [
  'time_navigation',
  'numbers_arithmetic',
  'memory_processing',
  'spatial_motor',
  'emotional_practical',
];

/** All 22 symptom definitions */
export const SYMPTOM_DEFINITIONS: SymptomDefinition[] = [
  // Time & Navigation (4 items)
  {
    id: 'time_management',
    label: 'Difficulty with time management (chronically late, misjudging how long tasks take)',
    category: 'time_navigation',
    domains: ['applied', 'sequencing'],
  },
  {
    id: 'analog_time',
    label: 'Trouble telling time on analog clocks',
    category: 'time_navigation',
    domains: ['applied', 'spatial'],
  },
  {
    id: 'directional_confusion',
    label: 'Confusion with directions (left/right, north/south/east/west)',
    category: 'time_navigation',
    domains: ['spatial'],
  },
  {
    id: 'navigation_driving',
    label: 'Difficulty navigating or following driving directions',
    category: 'time_navigation',
    domains: ['spatial', 'sequencing'],
  },

  // Numbers & Arithmetic (7 items)
  {
    id: 'inconsistent_arithmetic',
    label: 'Inconsistent results when doing the same arithmetic problem multiple times',
    category: 'numbers_arithmetic',
    domains: ['arithmetic'],
  },
  {
    id: 'number_reversals',
    label: 'Frequently reversing or transposing numbers (e.g., 36 → 63)',
    category: 'numbers_arithmetic',
    domains: ['numberSense', 'placeValue'],
  },
  {
    id: 'slow_mental_math',
    label: 'Very slow at mental math compared to peers',
    category: 'numbers_arithmetic',
    domains: ['arithmetic', 'numberSense'],
  },
  {
    id: 'cant_retain_concepts',
    label: 'Difficulty retaining math concepts even after repeated practice',
    category: 'numbers_arithmetic',
    domains: ['arithmetic', 'applied'],
  },
  {
    id: 'finger_counting',
    label: 'Still relying on finger counting for basic arithmetic',
    category: 'numbers_arithmetic',
    domains: ['arithmetic', 'numberSense'],
  },
  {
    id: 'losing_track_counting',
    label: 'Losing track when counting items or money',
    category: 'numbers_arithmetic',
    domains: ['numberSense', 'sequencing'],
  },
  {
    id: 'numbers_feel_foreign',
    label: 'Numbers feel abstract or foreign — no intuitive sense of quantity',
    category: 'numbers_arithmetic',
    domains: ['numberSense'],
  },

  // Memory & Processing (6 items)
  {
    id: 'working_memory_issues',
    label: 'Trouble holding numbers in working memory (e.g., phone numbers, PINs)',
    category: 'memory_processing',
    domains: ['applied', 'arithmetic'],
  },
  {
    id: 'cant_visualize_clocks',
    label: 'Cannot visualize clock faces, maps, or geography from memory',
    category: 'memory_processing',
    domains: ['spatial', 'applied'],
  },
  {
    id: 'poor_spatial_memory',
    label: 'Poor spatial memory — frequently losing objects or forgetting layouts',
    category: 'memory_processing',
    domains: ['spatial'],
  },
  {
    id: 'brain_static',
    label: 'Brain feels "static" when looking at number lines, equations, or graphs',
    category: 'memory_processing',
    domains: ['numberSense', 'arithmetic', 'applied'],
  },
  {
    id: 'visual_overload',
    label: 'Difficulty processing more than 4-5 visual items at once',
    category: 'memory_processing',
    domains: ['numberSense', 'spatial'],
  },
  {
    id: 'needs_small_patterns',
    label: 'Needs information broken into very small patterns to understand',
    category: 'memory_processing',
    domains: ['placeValue', 'sequencing'],
  },

  // Spatial & Motor (3 items)
  {
    id: 'motor_sequencing',
    label: 'Difficulty with motor sequencing (dance steps, sports coordination)',
    category: 'spatial_motor',
    domains: ['spatial', 'sequencing'],
  },
  {
    id: 'music_difficulties',
    label: 'Struggled with music education (reading notes, rhythm, timing)',
    category: 'spatial_motor',
    domains: ['sequencing', 'spatial'],
  },
  {
    id: 'finger_sense',
    label: 'Poor finger awareness or fine motor difficulties with numbers',
    category: 'spatial_motor',
    domains: ['spatial', 'numberSense'],
  },

  // Emotional & Practical (2 items + math anxiety as global)
  {
    id: 'math_anxiety',
    label: 'Significant math anxiety — avoidance, dread, or panic around math tasks',
    category: 'emotional_practical',
    // Math anxiety is a general modifier affecting all domains
    domains: ['numberSense', 'placeValue', 'sequencing', 'arithmetic', 'spatial', 'applied'],
  },
  {
    id: 'financial_planning',
    label: 'Difficulty with financial planning (budgeting, bills, tipping, splitting checks)',
    category: 'emotional_practical',
    domains: ['arithmetic', 'applied'],
  },
];

/** Get symptoms grouped by category */
export function getSymptomsByCategory(): Map<SymptomCategory, SymptomDefinition[]> {
  const grouped = new Map<SymptomCategory, SymptomDefinition[]>();
  for (const category of CATEGORY_ORDER) {
    grouped.set(category, SYMPTOM_DEFINITIONS.filter(s => s.category === category));
  }
  return grouped;
}
