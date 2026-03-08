// Coach feature type definitions
// Story 6.1: Coach Guidance System
// Story 6.2: Quick Actions Component
// Extended: Data-driven coaching with per-module performance

export interface CoachMessage {
  id: string;
  triggerId: string;
  title: string;
  message: string;
  icon: string;
  priority: number;
  detail?: string;
  action?: {
    label: string;
    route: string;
  };
}

export interface ModulePerformance {
  recentAccuracy: number | null;
  drillCount: number;
  trend: 'improving' | 'stable' | 'declining' | null;
  avgResponseTime: number | null;
}

export interface ErrorPattern {
  module: string;
  mistakeType: string;
  frequency: number;
}

export interface QuickAction {
  id: string;
  icon: string;
  title: string;
  subtitle: string;
  color: 'primary' | 'secondary' | 'accent';
  route: string;
  priority: number;
  badge?: number;
}

export interface QuickActionUserState {
  hasAssessment: boolean;
  hasSessionToday: boolean;
  streakActive: boolean;
  trainingSessionCount: number;
  newInsightsCount: number;
}

export interface CoachUserState {
  hasAssessment: boolean;
  trainingSessionCount: number;
  currentStreak: number;
  previousStreak: number;
  weeklySessionCount: number;
  recentAccuracy: number | null;
  weakestModule: string | null;
  dismissedTipIds: string[];
  modulePerformance: Record<string, ModulePerformance> | null;
  errorPatterns: ErrorPattern[];
  spacingQuality: 'excellent' | 'good-spacing' | 'clustered' | 'infrequent' | null;
  confidenceAfter: number | null;
  shownRealWorldTipIds: string[];
}
