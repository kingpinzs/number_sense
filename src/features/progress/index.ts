// Public API for progress feature - Story 5.1, 5.2, 5.3
// Exports: Components, Hooks, Services, Utils

// Components
export { default as ConfidenceRadar, ConfidenceRadarEmpty } from './components/ConfidenceRadar';
export { default as SessionCard } from './components/SessionCard';
export { default as SessionHistory } from './components/SessionHistory';
export { MilestoneModal } from './components/MilestoneModal';

// Hooks
export { useConfidenceData } from './hooks/useConfidenceData';
export type { UseConfidenceDataResult } from './hooks/useConfidenceData';
export { useSessionHistory } from './hooks/useSessionHistory';
export type { UseSessionHistoryResult, SessionWithDrills } from './hooks/useSessionHistory';

// Services
export {
  calculateDomainConfidence,
  getBaselineConfidence,
  calculateWeightedAverage,
} from './services/confidenceCalculator';
export type { DomainConfidence } from './services/confidenceCalculator';

// Utils
export {
  formatSessionDate,
  formatSessionTime,
  formatDuration,
  groupSessionsByDate,
} from './utils/dateFormatters';
