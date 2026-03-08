// Public API for coach - Story 6.1 + Data-Driven Coaching + Story 6.2 Quick Actions

export { default as CoachCard } from './components/CoachCard';
export { default as QuickActions } from './components/QuickActions';
export { useCoachGuidance } from './hooks/useCoachGuidance';
export { useQuickActions } from './hooks/useQuickActions';
export { getContextualGuidance } from './services/coachEngine';
export { selectQuickActions } from './services/actionSelector';
export { COACHING_INSIGHTS } from './content/coachingInsights';
export { REAL_WORLD_TIPS, selectRealWorldTip } from './content/realWorldTips';
export { ACTION_DEFINITIONS } from './content/actionDefinitions';
export type { CoachMessage, CoachUserState, ModulePerformance, ErrorPattern, QuickAction, QuickActionUserState } from './types';
export type { CoachingInsight } from './content/coachingInsights';
export type { RealWorldTip } from './content/realWorldTips';
