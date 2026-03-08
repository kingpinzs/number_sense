// Public API for progress feature - Story 5.1, 5.2, 5.3, 5.4, 5.5
// Exports: Components, Hooks, Services, Utils

// Components
export { default as ConfidenceRadar, ConfidenceRadarEmpty } from './components/ConfidenceRadar';
export { default as SessionCard } from './components/SessionCard';
export { default as SessionHistory } from './components/SessionHistory';
export { default as InsightsPanel } from './components/InsightsPanel';
export { MilestoneModal } from './components/MilestoneModal';
export { default as DataExport } from './components/DataExport';

// Hooks
export { useConfidenceData } from './hooks/useConfidenceData';
export type { UseConfidenceDataResult } from './hooks/useConfidenceData';
export { useSessionHistory } from './hooks/useSessionHistory';
export type { UseSessionHistoryResult, SessionWithDrills } from './hooks/useSessionHistory';
export { useInsights } from './hooks/useInsights';
export type { UseInsightsResult } from './hooks/useInsights';
export { useDataExport } from './hooks/useDataExport';
export type { UseDataExportResult, ExportPayload } from './hooks/useDataExport';

// Services
export {
  calculateDomainConfidence,
  getBaselineConfidence,
  calculateWeightedAverage,
} from './services/confidenceCalculator';
export type { DomainConfidence } from './services/confidenceCalculator';
export {
  generateInsights,
  detectTrend,
  calculateWeeklyConsistency,
} from './services/insightsEngine';
export type { Insight, InsightCategory, TrendDirection } from './services/insightsEngine';

// Utils
export {
  formatSessionDate,
  formatSessionTime,
  formatDuration,
  groupSessionsByDate,
} from './utils/dateFormatters';
export {
  escapeCSV,
  formatSessionsCSV,
  formatDrillResultsCSV,
  generateFullCSV,
  DATE_RANGE_OPTIONS,
  DATE_RANGE_DAYS,
} from './utils/csvFormatter';
export type { DateRange } from './utils/csvFormatter';
