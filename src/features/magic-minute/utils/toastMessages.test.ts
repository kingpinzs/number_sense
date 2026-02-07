/**
 * Tests for Toast Message Templates
 * Story 4.5: Build Transparency Toast Notifications
 *
 * Testing: Message generation, module name substitution, fallback handling
 */

import { describe, it, expect } from 'vitest';
import type { AdjustmentResult, PerformanceMetrics } from '@/services/adaptiveDifficulty/difficultyEngine';
import {
  MODULE_FRIENDLY_NAMES,
  TOAST_MESSAGES,
  getToastMessage,
  getToastMessageDeterministic,
} from './toastMessages';

// Helper to create test AdjustmentResult
function createAdjustment(
  overrides: Partial<AdjustmentResult> = {}
): AdjustmentResult {
  const defaultMetrics: PerformanceMetrics = {
    averageAccuracy: 75,
    medianTimeMs: 3000,
    consistencyScore: 10,
    confidenceTrend: 0.5,
    sessionCount: 5,
    drillCount: 20,
  };

  return {
    module: 'number_line',
    previousLevel: 5,
    newLevel: 6,
    reason: 'accuracy_high',
    timestamp: new Date().toISOString(),
    metrics: defaultMetrics,
    ...overrides,
  };
}

describe('MODULE_FRIENDLY_NAMES', () => {
  it('maps number_line to "Number Line"', () => {
    expect(MODULE_FRIENDLY_NAMES.number_line).toBe('Number Line');
  });

  it('maps spatial_rotation to "Spatial Rotation"', () => {
    expect(MODULE_FRIENDLY_NAMES.spatial_rotation).toBe('Spatial Rotation');
  });

  it('maps math_operations to "Math Operations"', () => {
    expect(MODULE_FRIENDLY_NAMES.math_operations).toBe('Math Operations');
  });

  it('has mappings for all module types', () => {
    const modules: Array<keyof typeof MODULE_FRIENDLY_NAMES> = [
      'number_line',
      'spatial_rotation',
      'math_operations',
    ];

    modules.forEach((module) => {
      expect(MODULE_FRIENDLY_NAMES[module]).toBeDefined();
      expect(typeof MODULE_FRIENDLY_NAMES[module]).toBe('string');
    });
  });
});

describe('TOAST_MESSAGES', () => {
  it('has emoji for accuracy_high', () => {
    expect(TOAST_MESSAGES.accuracy_high.emoji).toBe('🎉');
  });

  it('has emoji for accuracy_low', () => {
    expect(TOAST_MESSAGES.accuracy_low.emoji).toBe('💪');
  });

  it('has emoji for speed_fast', () => {
    expect(TOAST_MESSAGES.speed_fast.emoji).toBe('⚡');
  });

  it('has emoji for mirror_confusion', () => {
    expect(TOAST_MESSAGES.mirror_confusion.emoji).toBe('🔄');
  });

  it('has templates for all reason codes', () => {
    const reasons = [
      'accuracy_high',
      'accuracy_low',
      'speed_fast',
      'mirror_confusion',
      'optimal',
      'initial',
    ] as const;

    reasons.forEach((reason) => {
      expect(TOAST_MESSAGES[reason]).toBeDefined();
      expect(TOAST_MESSAGES[reason].emoji).toBeDefined();
      expect(TOAST_MESSAGES[reason].templates.length).toBeGreaterThan(0);
    });
  });

  it('has at least one template with {module} placeholder for accuracy_high', () => {
    const hasModulePlaceholder = TOAST_MESSAGES.accuracy_high.templates.some(
      (t) => t.includes('{module}')
    );
    expect(hasModulePlaceholder).toBe(true);
  });

  it('has at least one template with {module} placeholder for accuracy_low', () => {
    const hasModulePlaceholder = TOAST_MESSAGES.accuracy_low.templates.some(
      (t) => t.includes('{module}')
    );
    expect(hasModulePlaceholder).toBe(true);
  });
});

describe('getToastMessage', () => {
  it('returns emoji and message for accuracy_high', () => {
    const adjustment = createAdjustment({ reason: 'accuracy_high' });
    const result = getToastMessage(adjustment);

    expect(result.emoji).toBe('🎉');
    expect(result.message).toBeTruthy();
    expect(typeof result.message).toBe('string');
  });

  it('returns emoji and message for accuracy_low', () => {
    const adjustment = createAdjustment({ reason: 'accuracy_low' });
    const result = getToastMessage(adjustment);

    expect(result.emoji).toBe('💪');
    expect(result.message).toBeTruthy();
  });

  it('returns emoji and message for speed_fast', () => {
    const adjustment = createAdjustment({ reason: 'speed_fast' });
    const result = getToastMessage(adjustment);

    expect(result.emoji).toBe('⚡');
    expect(result.message).toBeTruthy();
  });

  it('returns emoji and message for mirror_confusion', () => {
    const adjustment = createAdjustment({ reason: 'mirror_confusion' });
    const result = getToastMessage(adjustment);

    expect(result.emoji).toBe('🔄');
    expect(result.message).toBeTruthy();
  });

  it('returns fallback for unknown reason', () => {
    const adjustment = createAdjustment({ reason: 'unknown_reason' as any });
    const result = getToastMessage(adjustment);

    expect(result.emoji).toBe('📊');
    expect(result.message).toBe('Difficulty adjusted based on your performance.');
  });

  it('substitutes module name in message', () => {
    // Use deterministic version to get predictable template
    const adjustment = createAdjustment({
      module: 'number_line',
      reason: 'accuracy_high',
    });

    // Template index 1 has {module} placeholder
    const result = getToastMessageDeterministic(adjustment, 1);

    expect(result.message).toContain('Number Line');
    expect(result.message).not.toContain('{module}');
  });

  it('substitutes spatial_rotation correctly', () => {
    const adjustment = createAdjustment({
      module: 'spatial_rotation',
      reason: 'accuracy_low',
    });

    // Template index 1 has {module} placeholder
    const result = getToastMessageDeterministic(adjustment, 1);

    expect(result.message).toContain('Spatial Rotation');
    expect(result.message).not.toContain('{module}');
  });

  it('substitutes math_operations correctly', () => {
    const adjustment = createAdjustment({
      module: 'math_operations',
      reason: 'accuracy_low',
    });

    const result = getToastMessageDeterministic(adjustment, 1);

    expect(result.message).toContain('Math Operations');
    expect(result.message).not.toContain('{module}');
  });
});

describe('getToastMessageDeterministic', () => {
  it('selects first template with index 0', () => {
    const adjustment = createAdjustment({ reason: 'accuracy_high' });
    const result = getToastMessageDeterministic(adjustment, 0);

    expect(result.message).toBe("Great progress! We're increasing the challenge.");
  });

  it('selects second template with index 1', () => {
    const adjustment = createAdjustment({
      reason: 'accuracy_high',
      module: 'number_line',
    });
    const result = getToastMessageDeterministic(adjustment, 1);

    expect(result.message).toBe("You've mastered Number Line! Time for harder problems.");
  });

  it('clamps to last template if index exceeds length', () => {
    const adjustment = createAdjustment({ reason: 'speed_fast' });
    const result = getToastMessageDeterministic(adjustment, 999);

    // speed_fast has 2 templates, so index 999 should clamp to index 1
    expect(result.message).toBe("Great speed! Let's try something harder.");
  });

  it('returns fallback for unknown reason', () => {
    const adjustment = createAdjustment({ reason: 'some_invalid_reason' as any });
    const result = getToastMessageDeterministic(adjustment, 0);

    expect(result.emoji).toBe('📊');
    expect(result.message).toBe('Difficulty adjusted based on your performance.');
  });
});

describe('All reason codes produce valid messages', () => {
  const testCases: Array<{ reason: AdjustmentResult['reason']; expectedEmoji: string }> = [
    { reason: 'accuracy_high', expectedEmoji: '🎉' },
    { reason: 'accuracy_low', expectedEmoji: '💪' },
    { reason: 'speed_fast', expectedEmoji: '⚡' },
    { reason: 'mirror_confusion', expectedEmoji: '🔄' },
    { reason: 'optimal', expectedEmoji: '👍' },
    { reason: 'initial', expectedEmoji: '🚀' },
  ];

  testCases.forEach(({ reason, expectedEmoji }) => {
    it(`${reason} returns correct emoji ${expectedEmoji}`, () => {
      const adjustment = createAdjustment({ reason });
      const result = getToastMessage(adjustment);

      expect(result.emoji).toBe(expectedEmoji);
    });

    it(`${reason} returns non-empty message`, () => {
      const adjustment = createAdjustment({ reason });
      const result = getToastMessage(adjustment);

      expect(result.message.length).toBeGreaterThan(0);
    });
  });
});

describe('Module name substitution for all modules', () => {
  const modules: Array<{ code: AdjustmentResult['module']; name: string }> = [
    { code: 'number_line', name: 'Number Line' },
    { code: 'spatial_rotation', name: 'Spatial Rotation' },
    { code: 'math_operations', name: 'Math Operations' },
  ];

  modules.forEach(({ code, name }) => {
    it(`substitutes ${code} as "${name}"`, () => {
      const adjustment = createAdjustment({
        module: code,
        reason: 'accuracy_high',
      });

      // Use template index 1 which contains {module}
      const result = getToastMessageDeterministic(adjustment, 1);

      expect(result.message).toContain(name);
    });
  });
});
