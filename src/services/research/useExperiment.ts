// useExperiment.ts - React hook for A/B experiment feature flags
// Story 8.2: Implement Variant Assignment and Feature Flags
//
// Bridges the pure experimentManager service with React component trees.
// Provides: variant assignment, guard logic (Research Mode + active check), and recordMetric.
//
// Architecture:
//   Guard 1: Research Mode must be enabled (user consent, from UserSettingsContext)
//   Guard 2: Experiment must be currently active (status=active + in date range)
//   On pass:  assignVariant() enrolls user deterministically (cached to localStorage)
//   Fallback: Any error silently returns 'control' to never break the UI

import { useState, useEffect, useCallback } from 'react';
import { useUserSettings } from '@/context/UserSettingsContext';
import { getActiveExperiments, assignVariant, recordObservation } from './experimentManager';

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface UseExperimentResult {
  /** The assigned variant ID (e.g., 'control', 'treatment'). Defaults to 'control'. */
  variant: string;
  /** Convenience: true when variant === 'control' */
  isControl: boolean;
  /** Convenience: true when assigned to any non-control group (works for binary and multi-variant experiments) */
  isTreatment: boolean;
  /** Record a metric observation for this experiment */
  recordMetric: (metric: string, value: number) => Promise<void>;
}

// ─── Hook ──────────────────────────────────────────────────────────────────────

/**
 * Feature flag hook for A/B experiment variant assignment.
 *
 * Returns the user's assigned variant for the given experiment, with guard logic:
 * - If Research Mode is disabled → always returns 'control' (no enrollment)
 * - If experiment is not active/expired → returns 'control' (no enrollment)
 * - On error in assignVariant → silently falls back to 'control'
 *
 * @param experimentId - The experiment ID (must match a key in EXPERIMENTS)
 * @returns UseExperimentResult with variant, convenience flags, and recordMetric
 *
 * @example
 * function NumberLineDrill() {
 *   const { variant, recordMetric } = useExperiment('drill-timer-visibility');
 *   const showTimer = variant === 'control';  // Control: show timer, Treatment: hide
 *
 *   return (
 *     <div>
 *       {showTimer && <Timer />}
 *       <NumberLine onComplete={(r) => recordMetric('drill_accuracy', r.accuracy)} />
 *     </div>
 *   );
 * }
 */
export function useExperiment(experimentId: string): UseExperimentResult {
  const { settings } = useUserSettings();
  const [variantId, setVariantId] = useState<string>('control');

  useEffect(() => {
    // Guard 1: Research Mode must be enabled (user has explicitly opted in)
    if (!settings.researchModeEnabled) {
      setVariantId('control');
      return;
    }

    // Guard 2: Experiment must be currently active (status=active + in date window)
    const activeExperiments = getActiveExperiments();
    if (!activeExperiments.find(e => e.id === experimentId)) {
      setVariantId('control');
      return;
    }

    // Assign/retrieve variant — deterministic via hash, cached to localStorage
    try {
      const variant = assignVariant(experimentId);
      setVariantId(variant.id);
    } catch {
      // Silently fall back to control — never crash the consuming component
      setVariantId('control');
    }
  }, [experimentId, settings.researchModeEnabled]);

  const recordMetric = useCallback(
    (metric: string, value: number): Promise<void> => {
      return recordObservation(experimentId, metric, value);
    },
    [experimentId]
  );

  return {
    variant: variantId,
    isControl: variantId === 'control',
    isTreatment: variantId !== 'control',  // true for any non-control group (robust for multi-variant experiments)
    recordMetric,
  };
}
