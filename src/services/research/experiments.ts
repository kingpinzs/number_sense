// experiments.ts - A/B experiment definitions
// Story 8.1: Build Experiment Manager
//
// Experiment definitions live as code constants — NOT stored in Dexie.
// The Dexie experiments table is reserved for future admin use (Story 8.3).
// Assignments are cached in localStorage; observations go to db.experiment_observations.

export interface Variant {
  id: string;      // e.g., 'control', 'treatment'
  name: string;    // e.g., 'Timer Visible', 'Timer Hidden'
  weight: number;  // 0–1, variants in an experiment must sum to 1.0
}

export interface ExperimentDefinition {
  id: string;                                      // Unique string key
  name: string;                                    // Human-readable name
  description: string;                             // What is being tested
  status: 'active' | 'draft' | 'completed';
  startDate: string;                               // ISO YYYY-MM-DD
  endDate?: string;                                // ISO YYYY-MM-DD (optional, open-ended if absent)
  variants: Variant[];                             // At least 2 variants, weights sum to 1.0
  metrics: string[];                               // Metric names tracked via recordObservation
}

export const EXPERIMENTS: ExperimentDefinition[] = [
  {
    id: 'drill-timer-visibility',
    name: 'Drill Timer Visibility',
    description: 'Test if showing/hiding the countdown timer affects drill accuracy',
    status: 'active',
    startDate: '2026-03-07',
    endDate: '2026-06-07',
    variants: [
      { id: 'control', name: 'Timer Visible', weight: 0.5 },
      { id: 'treatment', name: 'Timer Hidden', weight: 0.5 },
    ],
    metrics: ['drill_accuracy', 'drill_speed', 'user_confidence'],
  },
  {
    id: 'confidence-scale',
    name: 'Confidence Prompt Scale',
    description: 'Test whether a simplified 3-point confidence scale improves prompt completion vs the current 5-point scale',
    status: 'draft',  // Not yet active — excluded from getActiveExperiments()
    startDate: '2026-06-01',
    variants: [
      { id: 'control', name: '5-point (current)', weight: 0.5 },
      { id: 'treatment', name: '3-point (simplified)', weight: 0.5 },
    ],
    metrics: ['prompt_completion_rate', 'confidence_change'],
  },
];
