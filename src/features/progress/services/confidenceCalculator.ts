// Confidence Calculator Service - Story 5.1
// Calculates domain-specific confidence scores from session data
// Architecture: Pure functions for confidence calculations

import type { Session, DrillResult } from '@/services/storage/schemas';

/**
 * Domain confidence scores on 1-5 scale
 */
export interface DomainConfidence {
  numberSense: number;
  spatial: number;
  operations: number;
}

/**
 * Maps drill module names to domain keys
 */
const DRILL_TO_DOMAIN: Record<string, keyof DomainConfidence> = {
  'number_line': 'numberSense',
  'spatial_rotation': 'spatial',
  'math_operations': 'operations',
};

/**
 * Calculates weighted confidence scores per domain from session data
 * Uses session's confidenceAfter weighted by which drills were in the session
 * Recent sessions are weighted more heavily (exponential decay)
 *
 * @param sessions - Array of training sessions (most recent first)
 * @param drillResults - Array of drill results for those sessions
 * @returns DomainConfidence with scores 1-5 per domain
 */
export function calculateDomainConfidence(
  sessions: Session[],
  drillResults: DrillResult[]
): DomainConfidence {
  // Initialize domain data: weighted sum and total weight
  const domainData: Record<keyof DomainConfidence, { weightedSum: number; totalWeight: number }> = {
    numberSense: { weightedSum: 0, totalWeight: 0 },
    spatial: { weightedSum: 0, totalWeight: 0 },
    operations: { weightedSum: 0, totalWeight: 0 },
  };

  // Process each session with recency weighting
  sessions.forEach((session, index) => {
    if (!session.confidenceAfter) return;

    // Exponential decay: most recent = 1.0, older sessions decay
    const recencyWeight = Math.pow(0.85, index);

    // Find drills for this session
    const sessionDrills = drillResults.filter(dr => dr.sessionId === session.id);

    // Get unique domains from this session's drills
    const sessionDomains = new Set<keyof DomainConfidence>();

    // Check drillQueue from session (if available)
    if (session.drillQueue && session.drillQueue.length > 0) {
      session.drillQueue.forEach(drillType => {
        const domain = DRILL_TO_DOMAIN[drillType];
        if (domain) sessionDomains.add(domain);
      });
    }

    // Also check actual drill results
    sessionDrills.forEach(drill => {
      const domain = DRILL_TO_DOMAIN[drill.module];
      if (domain) sessionDomains.add(domain);
    });

    // Apply session's confidence to each domain that was trained
    sessionDomains.forEach(domain => {
      domainData[domain].weightedSum += session.confidenceAfter! * recencyWeight;
      domainData[domain].totalWeight += recencyWeight;
    });
  });

  // Calculate final scores (default to 3.0 if no data)
  return {
    numberSense: domainData.numberSense.totalWeight > 0
      ? domainData.numberSense.weightedSum / domainData.numberSense.totalWeight
      : 3.0,
    spatial: domainData.spatial.totalWeight > 0
      ? domainData.spatial.weightedSum / domainData.spatial.totalWeight
      : 3.0,
    operations: domainData.operations.totalWeight > 0
      ? domainData.operations.weightedSum / domainData.operations.totalWeight
      : 3.0,
  };
}

/**
 * Gets baseline confidence from first session or assessment
 * Used for comparison in the radar chart
 *
 * @param sessions - Array of training sessions (oldest first for baseline)
 * @param drillResults - Array of drill results
 * @returns DomainConfidence baseline or null if no data
 */
export function getBaselineConfidence(
  sessions: Session[],
  drillResults: DrillResult[]
): DomainConfidence | null {
  if (sessions.length === 0) return null;

  // Find earliest session with confidence data
  const sortedByTimestamp = [...sessions].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  const firstSessionWithConfidence = sortedByTimestamp.find(s => s.confidenceAfter !== undefined);

  if (!firstSessionWithConfidence) return null;

  // Get domains from first session
  const baselineData: DomainConfidence = {
    numberSense: 3.0,
    spatial: 3.0,
    operations: 3.0,
  };

  // Find drills from first session
  const firstDrills = drillResults.filter(dr => dr.sessionId === firstSessionWithConfidence.id);

  // Set baseline for domains trained in first session
  const trainedDomains = new Set<keyof DomainConfidence>();

  if (firstSessionWithConfidence.drillQueue) {
    firstSessionWithConfidence.drillQueue.forEach(drillType => {
      const domain = DRILL_TO_DOMAIN[drillType];
      if (domain) trainedDomains.add(domain);
    });
  }

  firstDrills.forEach(drill => {
    const domain = DRILL_TO_DOMAIN[drill.module];
    if (domain) trainedDomains.add(domain);
  });

  // Apply first session's confidence to trained domains
  trainedDomains.forEach(domain => {
    baselineData[domain] = firstSessionWithConfidence.confidenceAfter!;
  });

  return baselineData;
}

/**
 * Calculates weighted average with exponential recency weighting
 * More recent values have higher weight
 *
 * @param values - Array of values (most recent first)
 * @param decayFactor - Decay factor per position (default 0.85)
 * @returns Weighted average
 */
export function calculateWeightedAverage(
  values: number[],
  decayFactor: number = 0.85
): number {
  if (values.length === 0) return 0;

  let weightedSum = 0;
  let totalWeight = 0;

  values.forEach((value, index) => {
    const weight = Math.pow(decayFactor, index);
    weightedSum += value * weight;
    totalWeight += weight;
  });

  return totalWeight > 0 ? weightedSum / totalWeight : 0;
}
