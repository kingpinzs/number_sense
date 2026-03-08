// Quick Action Definitions - Story 6.2
// Static action templates used by actionSelector to build dynamic action lists

import type { QuickAction } from '../types';

/**
 * All available quick action templates.
 * The actionSelector evaluates user state against each action's condition
 * and returns an ordered subset of these.
 *
 * Icon values are Lucide icon component names (resolved in the UI component).
 */
export const ACTION_DEFINITIONS: readonly QuickAction[] = [
  {
    id: 'start_training',
    icon: 'Dumbbell',
    title: 'Start Training',
    subtitle: 'Continue your streak!',
    color: 'primary',
    route: '/training',
    priority: 1,
  },
  {
    id: 'take_assessment',
    icon: 'Target',
    title: 'Take Assessment',
    subtitle: 'Discover your strengths',
    color: 'accent',
    route: '/assessment',
    priority: 2,
  },
  {
    id: 'review_insights',
    icon: 'Sparkles',
    title: 'Review Insights',
    subtitle: 'See what\'s new',
    color: 'secondary',
    route: '/progress',
    priority: 3,
  },
  {
    id: 'view_progress',
    icon: 'TrendingUp',
    title: 'View Progress',
    subtitle: 'See how you\'re improving',
    color: 'secondary',
    route: '/progress',
    priority: 4,
  },
  {
    id: 'try_cognition',
    icon: 'Brain',
    title: 'Try Cognition Games',
    subtitle: 'Take a brain break',
    color: 'secondary',
    route: '/cognition',
    priority: 5,
  },
] as const;
