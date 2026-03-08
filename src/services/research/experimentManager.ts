// experimentManager.ts - On-device A/B experiment management service
// Story 8.1: Build Experiment Manager
//
// Pure service — no React imports. Follows syncQueue.ts pattern.
//
// Architecture:
//   Experiment definitions → code constants in experiments.ts (not Dexie)
//   Variant assignments    → localStorage (STORAGE_KEYS.EXPERIMENT_ASSIGNMENTS)
//   Metric observations    → Dexie db.experiment_observations

import { STORAGE_KEYS } from '@/services/storage/localStorage';
import { db } from '@/services/storage/db';
import { EXPERIMENTS, type ExperimentDefinition, type Variant } from './experiments';

// ─── User Identity ─────────────────────────────────────────────────────────────

/**
 * Returns the persistent user ID for this device.
 * Generates a UUID via crypto.randomUUID() on first call and caches to localStorage.
 * The same ID is returned on all subsequent calls.
 */
export function getUserId(): string {
  const stored = localStorage.getItem(STORAGE_KEYS.USER_ID);
  if (stored) return stored;
  // crypto.randomUUID() is available in all modern browsers (Chrome 92+, Firefox 95+, Safari 15.4+)
  const newId = crypto.randomUUID();
  localStorage.setItem(STORAGE_KEYS.USER_ID, newId);
  return newId;
}

// ─── Deterministic Hash ────────────────────────────────────────────────────────

/**
 * Produces a stable integer in [0, 99] from two string inputs.
 * Uses djb2-style polynomial rolling hash for good distribution.
 *
 * Same userId + experimentId always produces the same output (no randomness at query time).
 * This ensures users stay in the same variant across sessions and page reloads.
 *
 * Note: The epics suggest `userId.charCodeAt() % 100` which only inspects the
 * first character — this implementation uses all characters for uniform distribution.
 */
export function deterministicHash(userId: string, experimentId: string): number {
  const input = userId + ':' + experimentId;
  let hash = 5381;
  for (let i = 0; i < input.length; i++) {
    hash = ((hash << 5) + hash + input.charCodeAt(i)) & 0xffffffff;
  }
  return Math.abs(hash) % 100;
}

// ─── Active Experiments ────────────────────────────────────────────────────────

/**
 * Returns experiments that are currently active:
 *   - status === 'active'
 *   - startDate ≤ today
 *   - endDate ≥ today (or no endDate)
 */
export function getActiveExperiments(): ExperimentDefinition[] {
  const today = new Date().toISOString().slice(0, 10); // 'YYYY-MM-DD'
  return EXPERIMENTS.filter(exp => {
    if (exp.status !== 'active') return false;
    if (exp.startDate > today) return false;
    if (exp.endDate && exp.endDate < today) return false;
    return true;
  });
}

// ─── Variant Assignment ────────────────────────────────────────────────────────

function loadAssignments(): Record<string, string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.EXPERIMENT_ASSIGNMENTS);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    // Validate structure — reject arrays and non-objects (corrupted storage)
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return {};
    return parsed as Record<string, string>;
  } catch {
    return {};
  }
}

function saveAssignments(assignments: Record<string, string>): void {
  localStorage.setItem(STORAGE_KEYS.EXPERIMENT_ASSIGNMENTS, JSON.stringify(assignments));
}

/**
 * Returns the deterministic variant for the current user in the given experiment.
 * Assignment is cached to localStorage to ensure consistency across sessions.
 *
 * Weighted selection: iterates variants in order, accumulates weights.
 * For a 50/50 split: hash < 50 → first variant, hash >= 50 → second variant.
 *
 * @throws Error if experimentId is not found in EXPERIMENTS
 */
export function assignVariant(experimentId: string): Variant {
  const exp = EXPERIMENTS.find(e => e.id === experimentId);
  if (!exp) throw new Error(`Unknown experiment: "${experimentId}"`);

  // Return cached assignment if present (ensures consistency)
  const assignments = loadAssignments();
  if (assignments[experimentId]) {
    const cached = exp.variants.find(v => v.id === assignments[experimentId]);
    if (cached) return cached;
  }

  // Deterministic assignment: hash of userId + experimentId
  const userId = getUserId();
  const hash = deterministicHash(userId, experimentId);

  // Weighted cumulative selection
  let cumulative = 0;
  let selected = exp.variants[exp.variants.length - 1]; // Fallback to last variant
  for (const variant of exp.variants) {
    cumulative += variant.weight * 100;
    if (hash < cumulative) {
      selected = variant;
      break;
    }
  }

  // Persist the assignment
  assignments[experimentId] = selected.id;
  saveAssignments(assignments);
  return selected;
}

/**
 * Returns the currently assigned variant for the given experiment, or null if
 * the user has not yet been assigned (i.e., assignVariant has not been called).
 * Does NOT auto-assign — call assignVariant() explicitly when enrolling a user.
 */
export function getAssignedVariant(experimentId: string): Variant | null {
  const assignments = loadAssignments();
  const variantId = assignments[experimentId];
  if (!variantId) return null;

  const exp = EXPERIMENTS.find(e => e.id === experimentId);
  return exp?.variants.find(v => v.id === variantId) ?? null;
}

// ─── Observation Recording ─────────────────────────────────────────────────────

/**
 * Records a metric observation for an experiment to Dexie.
 * Used to track outcomes (e.g., drill_accuracy) after a user completes an action.
 * If the user has no assignment for this experiment, records with variantId='control'.
 */
export async function recordObservation(
  experimentId: string,
  metric: string,
  value: number
): Promise<void> {
  const variant = getAssignedVariant(experimentId);
  await db.experiment_observations.add({
    experimentId,                        // string key (Story 8.1: updated from number to string)
    variantId: variant?.id ?? 'control',
    timestamp: new Date().toISOString(),
    metric,
    value,
    userId: getUserId(),
  });
}

// ─── Test Utilities ────────────────────────────────────────────────────────────

/**
 * Clears the cached variant assignments from localStorage.
 * FOR TESTING ONLY — do not call in production code.
 */
export function clearAssignmentsForTesting(): void {
  localStorage.removeItem(STORAGE_KEYS.EXPERIMENT_ASSIGNMENTS);
}
