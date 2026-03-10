// Coach message templates
// Story 6.1: All 7 contextual guidance messages
// Priority: lower number = higher priority

import type { CoachMessage } from '../types';

const MODULE_DISPLAY_NAMES: Record<string, string> = {
  'number_line': 'Number Line',
  'spatial_rotation': 'Spatial Rotation',
  'math_operations': 'Math Operations',
  'subitizing': 'Quick Count',
  'number_bonds': 'Number Bonds',
  'magnitude_comparison': 'Number Comparison',
  'place_value': 'Place Value',
  'estimation': 'Estimation',
  'sequencing': 'Sequencing',
  'fact_fluency': 'Fact Fluency',
  'fractions': 'Fractions',
  'time_measurement': 'Time & Measurement',
  'working_memory': 'Working Memory',
};

export function getModuleDisplayName(module: string | null): string {
  if (!module) return 'your weakest area';
  return MODULE_DISPLAY_NAMES[module] ?? module;
}

export const COACH_MESSAGES: CoachMessage[] = [
  {
    id: 'first-launch',
    triggerId: 'first-launch',
    title: 'Welcome!',
    message: "Welcome! Let's start with a quick assessment to personalize your training.",
    icon: '🎓',
    priority: 1,
    action: {
      label: 'Start Assessment',
      route: '/assessment',
    },
  },
  {
    id: 'streak-broken',
    triggerId: 'streak-broken',
    title: "Let's Get Back on Track",
    message: "Don't worry! Every practice counts. Start a new streak today.",
    icon: '💬',
    priority: 2,
    action: {
      label: 'Begin Training',
      route: '/training',
    },
  },
  {
    id: 'low-consistency',
    triggerId: 'low-consistency',
    title: 'Build Your Habit',
    message: 'Try setting a daily reminder to help build your practice habit.',
    icon: '📅',
    priority: 3,
    action: {
      label: 'Begin Training',
      route: '/training',
    },
  },
  {
    id: 'after-3-sessions',
    triggerId: 'after-3-sessions',
    title: 'Great Progress!',
    message: "You're building consistency! Try to practice every day for best results.",
    icon: '🎓',
    priority: 4,
  },
  {
    id: 'high-accuracy',
    triggerId: 'high-accuracy',
    title: 'Excellent Work!',
    message: "Excellent work! We're increasing the challenge to keep you growing.",
    icon: '🌟',
    priority: 5,
  },
  {
    id: 'after-assessment',
    triggerId: 'after-assessment',
    title: 'Ready to Train!',
    message: "Great! You're ready to start training. Your first session focuses on [weak area].",
    icon: '🎓',
    priority: 6,
    action: {
      label: 'Begin Training',
      route: '/training',
    },
  },
  {
    id: 'before-first-training',
    triggerId: 'before-first-training',
    title: 'Tip',
    message: "Tip: Training sessions take 5-15 minutes. Find a quiet spot and let's begin!",
    icon: '💬',
    priority: 7,
    action: {
      label: 'Begin Training',
      route: '/training',
    },
  },
];
