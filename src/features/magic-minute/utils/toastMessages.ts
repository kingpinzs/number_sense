/**
 * Toast Message Templates for Transparency Toast Notifications
 * Story 4.5: Build Transparency Toast Notifications
 *
 * Purpose: Map adjustment reasons to user-friendly messages with module name personalization
 * AC-2: Toast content by reason
 * AC-4: Module name personalization
 */

import type { AdjustmentResult, AdjustmentReason, DifficultyModule } from '@/services/adaptiveDifficulty/difficultyEngine';

/**
 * Module codes to user-friendly display names (AC-4)
 */
export const MODULE_FRIENDLY_NAMES: Record<DifficultyModule, string> = {
  number_line: 'Number Line',
  spatial_rotation: 'Spatial Rotation',
  math_operations: 'Math Operations',
  subitizing: 'Quick Count',
  number_bonds: 'Number Bonds',
};

/**
 * Toast message configuration per reason code (AC-2)
 */
export const TOAST_MESSAGES: Record<AdjustmentReason, { emoji: string; templates: string[] }> = {
  accuracy_high: {
    emoji: '🎉',
    templates: [
      "Great progress! We're increasing the challenge.",
      "You've mastered {module}! Time for harder problems.",
      "Your accuracy is excellent - let's level up!",
    ],
  },
  accuracy_low: {
    emoji: '💪',
    templates: [
      "Let's build confidence with simpler challenges.",
      "We've adjusted to easier {module} so you can practice fundamentals.",
      'Taking a step back to strengthen your foundation.',
    ],
  },
  speed_fast: {
    emoji: '⚡',
    templates: [
      "You're answering quickly - increasing the challenge!",
      "Great speed! Let's try something harder.",
    ],
  },
  mirror_confusion: {
    emoji: '🔄',
    templates: [
      "We noticed some mirror confusion - simplifying shapes.",
      'Focusing on non-mirrored shapes for now.',
      "We've adjusted to easier shapes so you can practice fundamentals.",
    ],
  },
  optimal: {
    emoji: '👍',
    templates: [
      "You're performing at just the right level!",
      'Keep up the great work!',
    ],
  },
  initial: {
    emoji: '🚀',
    templates: [
      "Let's get started with your first challenge!",
      'Welcome! Starting at the right level for you.',
    ],
  },
};

/**
 * Toast content returned by getToastMessage
 */
export interface ToastContent {
  emoji: string;
  message: string;
}

/**
 * Get user-friendly toast message for a difficulty adjustment
 * Maps adjustment reason to appropriate message with module name substitution
 *
 * @param adjustment - The AdjustmentResult from the difficulty engine
 * @returns ToastContent with emoji and message
 */
export function getToastMessage(adjustment: AdjustmentResult): ToastContent {
  const config = TOAST_MESSAGES[adjustment.reason];

  // Fallback for unknown reason codes
  if (!config) {
    return {
      emoji: '📊',
      message: 'Difficulty adjusted based on your performance.',
    };
  }

  // Select a random template from available options
  const templateIndex = Math.floor(Math.random() * config.templates.length);
  const template = config.templates[templateIndex];

  // Substitute {module} placeholder with friendly module name
  const moduleName = MODULE_FRIENDLY_NAMES[adjustment.module] || adjustment.module;
  const message = template.replace('{module}', moduleName);

  return {
    emoji: config.emoji,
    message,
  };
}

/**
 * Get toast message with deterministic template selection (for testing)
 *
 * @param adjustment - The AdjustmentResult from the difficulty engine
 * @param templateIndex - Specific template index to use
 * @returns ToastContent with emoji and message
 */
export function getToastMessageDeterministic(
  adjustment: AdjustmentResult,
  templateIndex: number = 0
): ToastContent {
  const config = TOAST_MESSAGES[adjustment.reason];

  if (!config) {
    return {
      emoji: '📊',
      message: 'Difficulty adjusted based on your performance.',
    };
  }

  const safeIndex = Math.min(templateIndex, config.templates.length - 1);
  const template = config.templates[safeIndex];
  const moduleName = MODULE_FRIENDLY_NAMES[adjustment.module] || adjustment.module;
  const message = template.replace('{module}', moduleName);

  return {
    emoji: config.emoji,
    message,
  };
}
