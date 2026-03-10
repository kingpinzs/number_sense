// Self-Discovery feature types
// Symptoms checklist, personal history intake, colored dots test

/** The 6 training domains used across the app */
export type Domain = 'numberSense' | 'placeValue' | 'sequencing' | 'arithmetic' | 'spatial' | 'applied';

/** Severity level for a symptom (1 = mild, 2 = moderate, 3 = severe) */
export type SymptomSeverity = 1 | 2 | 3;

/** A single symptom response in the checklist */
export interface SymptomResponse {
  symptomId: string;
  checked: boolean;
  severity?: SymptomSeverity;
}

/** Stored symptom checklist entry (Dexie table: symptom_checklists) */
export interface SymptomChecklistEntry {
  id?: number;
  timestamp: string;
  symptoms: SymptomResponse[];
  domainImpact: Record<Domain, number>; // 0-1 normalized per domain
  notes?: string;
}

/** Personal history completion status */
export type HistoryCompletionStatus = 'in-progress' | 'completed';

/** A single section's saved data in personal history */
export interface HistorySectionData {
  completed: boolean;
  data: Record<string, string>;
}

/** Stored personal history entry (Dexie table: personal_history) */
export interface PersonalHistory {
  id?: number;
  timestamp: string;
  lastUpdated: string;
  completionStatus: HistoryCompletionStatus;
  sections: Record<string, HistorySectionData>;
}

/** Symptom category grouping */
export type SymptomCategory =
  | 'time_navigation'
  | 'numbers_arithmetic'
  | 'memory_processing'
  | 'spatial_motor'
  | 'emotional_practical';

/** A symptom definition with domain mappings */
export interface SymptomDefinition {
  id: string;
  label: string;
  category: SymptomCategory;
  domains: Domain[];
}

/** Intake section field type */
export type IntakeFieldType = 'textarea' | 'checkbox' | 'text';

/** A single field in an intake section */
export interface IntakeField {
  key: string;
  label: string;
  type: IntakeFieldType;
  placeholder?: string;
}

/** An intake section definition */
export interface IntakeSection {
  id: string;
  title: string;
  description: string;
  fields: IntakeField[];
}

/** Colored dots difficulty configuration */
export interface ColoredDotsDifficulty {
  label: string;
  colorCount: 2 | 3 | 4;
  minDots: number;
  maxDots: number;
  displayTimeMs: number;
}

/** Dot size category */
export type DotSize = 'small' | 'normal' | 'large';

/** Size mode for a round */
export type SizeMode = 'uniform' | 'varied' | 'biased';

/** A single dot in the colored dots test */
export interface ColoredDot {
  x: number;
  y: number;
  color: string;
  colorName: string;
  radius: number;
  size: DotSize;
}

/** Size statistics for a single color in a round */
export interface ColorSizeStats {
  total: number;
  small: number;
  normal: number;
  large: number;
}

/** Result of a single colored dots round */
export interface ColoredDotsRoundResult {
  correctColor: string;
  phase1Answer: string | null;
  phase2Answer: string | null;
  phase1Correct: boolean;
  phase2Correct: boolean;
  phase1ResponseTimeMs: number;
  phase2ResponseTimeMs: number;
  dotCounts: Record<string, number>;
  sizeStats: Record<string, ColorSizeStats>;
  sizeMode: SizeMode;
  largestDotColor: string;
  pickedLargestDotColor: boolean;
  difficulty: string;
}
