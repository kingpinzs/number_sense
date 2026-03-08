# Story 8.1: Build Experiment Manager

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a developer testing new features,
I want an experiment management system,
so that I can run A/B tests on-device without backend infrastructure.

## Acceptance Criteria

1. **`ExperimentDefinition` type defined** — Interface includes: `id: string`, `name: string`, `description: string`, `status: 'active' | 'draft' | 'completed'`, `startDate: string` (ISO YYYY-MM-DD), `endDate?: string`, `variants: Variant[]`, `metrics: string[]`
2. **`Variant` type defined** — Interface: `{ id: string; name: string; weight: number }` where `weight` is 0–1 and all variant weights sum to 1.0
3. **`EXPERIMENTS` constant defined** — Array of `ExperimentDefinition` in `src/services/research/experiments.ts` with 2 sample experiments (see Dev Notes for correct dates)
4. **`getActiveExperiments()` implemented** — Returns only experiments with `status: 'active'` AND within date range (startDate ≤ today ≤ endDate if endDate provided)
5. **`USER_ID` in localStorage** — `getUserId()` returns a UUID string; generates `crypto.randomUUID()` on first call and persists to `STORAGE_KEYS.USER_ID`; same ID returned on all subsequent calls
6. **`assignVariant(experimentId)` implemented** — Returns deterministic `Variant` for the current user; assignment stored in `STORAGE_KEYS.EXPERIMENT_ASSIGNMENTS` (JSON map); same variant always returned for same user+experimentId
7. **`getAssignedVariant(experimentId)` implemented** — Returns `Variant | null`; reads from localStorage assignments map; returns `null` if experiment unknown or user not yet assigned
8. **`recordObservation(experimentId, metric, value)` implemented** — Async; writes to `db.experiment_observations` table with `{ experimentId, variantId, timestamp, metric, value, userId }`
9. **`ExperimentObservation.experimentId` updated to `string`** — Change type in `schemas.ts` from `number` to `string` (no DB version bump required — the Dexie index definition is unchanged, table is empty)
10. **Two new `STORAGE_KEYS` added** — `USER_ID: 'discalculas:userId'` and `EXPERIMENT_ASSIGNMENTS: 'discalculas:experimentAssignments'`
11. **All functions are pure / side-effect-free except async DB write** — No React imports in either service file; follows `syncQueue.ts` pattern
12. **TypeScript clean** — `npx tsc --noEmit` returns zero errors
13. **All existing tests pass + new tests added** — `npm test` shows no regressions; experimentManager.test.ts covers all exported functions

## Tasks / Subtasks

- [x] **Task 1: Add new STORAGE_KEYS** (AC: #10)
  - [x] 1.1 Open `src/services/storage/localStorage.ts`
  - [x] 1.2 Add `USER_ID: 'discalculas:userId'` to `STORAGE_KEYS` with comment `// Story 8.1: Experiment user identity`
  - [x] 1.3 Add `EXPERIMENT_ASSIGNMENTS: 'discalculas:experimentAssignments'` to `STORAGE_KEYS` with comment `// Story 8.1: Cached variant assignments map`

- [x] **Task 2: Fix ExperimentObservation schema** (AC: #9)
  - [x] 2.1 Open `src/services/storage/schemas.ts`
  - [x] 2.2 Change `experimentId: number` to `experimentId: string` in `ExperimentObservation` interface
  - [x] 2.3 Add comment: `// Story 8.1: String experiment key (e.g., 'drill-timer-visibility')`
  - [x] 2.4 DO NOT bump DB version — the Dexie index `'++id, experimentId, variantId, timestamp'` works with string values; the table is empty in prod

- [x] **Task 3: Create experiment definitions file** (AC: #1, #2, #3)
  - [x] 3.1 Create directory `src/services/research/`
  - [x] 3.2 Create `src/services/research/experiments.ts`
  - [x] 3.3 Define `Variant` interface: `{ id: string; name: string; weight: number }`
  - [x] 3.4 Define `ExperimentDefinition` interface with all required fields (see Dev Notes)
  - [x] 3.5 Define `EXPERIMENTS: ExperimentDefinition[]` with 2 sample experiments using dates from 2026-03-07 onward (update the epics' expired 2025 dates)

- [x] **Task 4: Create experimentManager service** (AC: #4, #5, #6, #7, #8, #11)
  - [x] 4.1 Create `src/services/research/experimentManager.ts`
  - [x] 4.2 Import only from `@/services/storage/localStorage` and `@/services/storage/db` — NO React imports
  - [x] 4.3 Implement `getUserId(): string` — lazy UUID generation with localStorage persistence
  - [x] 4.4 Implement `deterministicHash(userId: string, experimentId: string): number` — returns 0–99 (see Dev Notes for algorithm)
  - [x] 4.5 Implement `getActiveExperiments(): ExperimentDefinition[]` — filters by status + date range
  - [x] 4.6 Implement `assignVariant(experimentId: string): Variant` — deterministic, cached to localStorage
  - [x] 4.7 Implement `getAssignedVariant(experimentId: string): Variant | null` — reads from cache, no auto-assign
  - [x] 4.8 Implement `recordObservation(experimentId: string, metric: string, value: number): Promise<void>` — writes to Dexie
  - [x] 4.9 Implement `clearAssignmentsForTesting(): void` — clears localStorage assignments map (used only in tests)

- [x] **Task 5: Write unit tests** (AC: #12, #13)
  - [x] 5.1 Create `src/services/research/experimentManager.test.ts`
  - [x] 5.2 Mock `localStorage` using `vi.spyOn(Storage.prototype, ...)` pattern from project-context.md
  - [x] 5.3 Mock `@/services/storage/db` for `experiment_observations.add` calls
  - [x] 5.4 Test `getUserId()` — generates UUID on first call, returns same ID on second call
  - [x] 5.5 Test `deterministicHash()` — same inputs always produce same output; output in [0, 99]
  - [x] 5.6 Test `getActiveExperiments()` — only returns 'active' status AND date in range
  - [x] 5.7 Test `assignVariant()` — deterministic (same result on multiple calls); respects variant weights
  - [x] 5.8 Test `getAssignedVariant()` — returns null before assignment, correct variant after
  - [x] 5.9 Test `recordObservation()` — calls `db.experiment_observations.add` with correct fields

- [x] **Task 6: Build verification** (AC: #12, #13)
  - [x] 6.1 Run `npx tsc --noEmit` — zero errors ✓
  - [x] 6.2 Run `npm test` — 1962 passing, 2 skipped, 0 failures ✓ (29 new tests)
  - [x] 6.3 Run `npm run build` — production build succeeds ✓

- [ ] **Task 7: VERIFICATION: Manual Browser Testing** [MANDATORY - cannot be skipped]
  - [ ] 7.1 Run dev server (`npm run dev`) and open app in browser
  - [ ] 7.2 Open DevTools → Application → Local Storage → verify `discalculas:userId` is set on load
  - [ ] 7.3 In DevTools Console: `import('/src/services/research/experimentManager.ts').then(m => { console.log(m.getUserId()); console.log(m.getActiveExperiments()); })`
  - [ ] 7.4 Verify `getActiveExperiments()` returns experiments with status 'active' and in-range dates
  - [ ] 7.5 Call `assignVariant('drill-timer-visibility')` twice — verify same variant returned both times
  - [ ] 7.6 Reload page — verify same userId and variant assignment persisted
  - [ ] 7.7 Verify accessibility: No UI changes in this story — purely backend service
  - [ ] 7.8 Document verification results in Dev Agent Record

## Dev Notes

### Architecture Decision: Experiments as Code Constants, Not Dexie Records

**CRITICAL:** The epics file's storage snippet is misleading. Do NOT store experiment definitions in `db.experiments`. Instead:

```
┌─────────────────────────────────────────────────────────────────┐
│  Experiment Definitions  →  CODE CONSTANTS in experiments.ts    │
│  (ExperimentDefinition[])   Never persisted to Dexie            │
├─────────────────────────────────────────────────────────────────┤
│  Variant Assignments     →  localStorage (JSON map)             │
│  (experimentId → variantId)  STORAGE_KEYS.EXPERIMENT_ASSIGNMENTS│
├─────────────────────────────────────────────────────────────────┤
│  Metric Observations     →  Dexie db.experiment_observations    │
│  (one row per observation)   Already correctly defined          │
└─────────────────────────────────────────────────────────────────┘
```

**Why not Dexie for assignments?** Assignments are user-device-specific, simple key-value data. localStorage is simpler, synchronous (no async), and perfectly suited. Dexie `experiments` table has structural mismatch (schema v2 has `variants: string[]`, epics want `variants: Variant[]`).

### CRITICAL: Schema Mismatch Between DB and Epics

The existing `Experiment` interface in `schemas.ts` does NOT match the epics spec:

| `schemas.ts` (current) | Epics spec (what we actually need) |
|---|---|
| `id?: number` (auto-increment) | `id: string` ('drill-timer-visibility') |
| `variants: string[]` | `variants: Variant[]` with id/name/weight |
| No `metrics` field | `metrics: string[]` |

**Resolution for this story:** Create a separate `ExperimentDefinition` type in `src/services/research/experiments.ts`. The Dexie `Experiment` table is left unchanged — it will be repurposed in Story 8.3 (dashboard) if needed, or renamed then. For Story 8.1, we only write to `experiment_observations`.

### `ExperimentObservation` Schema Fix

Only one change needed in `schemas.ts`:

```typescript
// BEFORE (wrong):
export interface ExperimentObservation {
  experimentId: number;  // ← was expecting FK to auto-increment experiments
  ...
}

// AFTER (correct):
export interface ExperimentObservation {
  experimentId: string;  // Story 8.1: String experiment key (e.g., 'drill-timer-visibility')
  ...
}
```

No `db.ts` change needed. The Dexie v2 schema index `'++id, experimentId, variantId, timestamp'` works with string values.

### File Structure to Create

```
src/services/research/
├── experiments.ts           ← ExperimentDefinition + Variant types + EXPERIMENTS constant
├── experimentManager.ts     ← Core service functions (pure, no React)
└── experimentManager.test.ts
```

Follow the `syncQueue.ts` pure-functions pattern:
```typescript
// ✅ DO — pure functions with localStorage/DB side effects only
import { STORAGE_KEYS } from '@/services/storage/localStorage';
import { db } from '@/services/storage/db';

// ❌ DO NOT
import { useState } from 'react'; // No React in service files
```

### TypeScript Types (experiments.ts)

```typescript
// src/services/research/experiments.ts

export interface Variant {
  id: string;       // e.g., 'control', 'treatment'
  name: string;     // e.g., 'Timer Visible', 'Timer Hidden'
  weight: number;   // 0–1, all variants in an experiment must sum to 1.0
}

export interface ExperimentDefinition {
  id: string;                                      // Unique string key
  name: string;                                    // Human-readable name
  description: string;                             // What is being tested
  status: 'active' | 'draft' | 'completed';
  startDate: string;                               // ISO YYYY-MM-DD
  endDate?: string;                                // ISO YYYY-MM-DD (optional)
  variants: Variant[];                             // At least 2 variants
  metrics: string[];                               // Metrics to track
}

// Update experiment dates — the epics file's 2025 dates are expired!
export const EXPERIMENTS: ExperimentDefinition[] = [
  {
    id: 'drill-timer-visibility',
    name: 'Drill Timer Visibility',
    description: 'Test if showing/hiding timer affects accuracy',
    status: 'active',
    startDate: '2026-03-07',
    endDate: '2026-06-07',
    variants: [
      { id: 'control', name: 'Timer Visible', weight: 0.5 },
      { id: 'treatment', name: 'Timer Hidden', weight: 0.5 },
    ],
    metrics: ['drill_accuracy', 'drill_speed', 'user_confidence'],
  },
  {
    id: 'confidence-scale',
    name: 'Confidence Prompt Scale',
    description: 'Test 5-point vs 3-point confidence scale',
    status: 'draft',     // Not active yet — won't be returned by getActiveExperiments()
    startDate: '2026-06-01',
    variants: [
      { id: 'control', name: '5-point (current)', weight: 0.5 },
      { id: 'treatment', name: '3-point (simplified)', weight: 0.5 },
    ],
    metrics: ['prompt_completion_rate', 'confidence_change'],
  },
];
```

### experimentManager.ts Implementation Guide

```typescript
// src/services/research/experimentManager.ts
// Pure service — no React imports.

import { STORAGE_KEYS } from '@/services/storage/localStorage';
import { db } from '@/services/storage/db';
import { EXPERIMENTS, type ExperimentDefinition, type Variant } from './experiments';

// ─── User Identity ────────────────────────────────────────────────────────────

export function getUserId(): string {
  const stored = localStorage.getItem(STORAGE_KEYS.USER_ID);
  if (stored) return stored;
  // crypto.randomUUID() is available in all modern browsers (Chrome 92+, Firefox 95+)
  const newId = crypto.randomUUID();
  localStorage.setItem(STORAGE_KEYS.USER_ID, newId);
  return newId;
}

// ─── Deterministic Hash ───────────────────────────────────────────────────────

/**
 * Produces a stable integer 0–99 from two strings.
 * Same userId + experimentId always produces the same hash (no randomness at query time).
 * Uses djb2-style polynomial hash for good distribution.
 */
export function deterministicHash(userId: string, experimentId: string): number {
  const input = userId + ':' + experimentId;
  let hash = 5381;
  for (let i = 0; i < input.length; i++) {
    hash = ((hash << 5) + hash + input.charCodeAt(i)) & 0xffffffff;
  }
  return Math.abs(hash) % 100;
}

// ─── Active Experiments ───────────────────────────────────────────────────────

export function getActiveExperiments(): ExperimentDefinition[] {
  const today = new Date().toISOString().slice(0, 10); // 'YYYY-MM-DD'
  return EXPERIMENTS.filter(exp => {
    if (exp.status !== 'active') return false;
    if (exp.startDate > today) return false;
    if (exp.endDate && exp.endDate < today) return false;
    return true;
  });
}

// ─── Variant Assignment ───────────────────────────────────────────────────────

function loadAssignments(): Record<string, string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.EXPERIMENT_ASSIGNMENTS);
    return raw ? (JSON.parse(raw) as Record<string, string>) : {};
  } catch {
    return {};
  }
}

function saveAssignments(assignments: Record<string, string>): void {
  localStorage.setItem(STORAGE_KEYS.EXPERIMENT_ASSIGNMENTS, JSON.stringify(assignments));
}

export function assignVariant(experimentId: string): Variant {
  const exp = EXPERIMENTS.find(e => e.id === experimentId);
  if (!exp) throw new Error(`Unknown experiment: ${experimentId}`);

  // Return cached assignment if it exists
  const assignments = loadAssignments();
  if (assignments[experimentId]) {
    const cached = exp.variants.find(v => v.id === assignments[experimentId]);
    if (cached) return cached;
  }

  // Deterministic assignment based on userId + experimentId hash
  const userId = getUserId();
  const hash = deterministicHash(userId, experimentId);

  // Weighted selection: iterate variants, accumulate weights
  let cumulative = 0;
  let selected = exp.variants[exp.variants.length - 1]; // Fallback to last
  for (const variant of exp.variants) {
    cumulative += variant.weight * 100;
    if (hash < cumulative) {
      selected = variant;
      break;
    }
  }

  // Cache the assignment
  assignments[experimentId] = selected.id;
  saveAssignments(assignments);
  return selected;
}

export function getAssignedVariant(experimentId: string): Variant | null {
  const assignments = loadAssignments();
  const variantId = assignments[experimentId];
  if (!variantId) return null;

  const exp = EXPERIMENTS.find(e => e.id === experimentId);
  return exp?.variants.find(v => v.id === variantId) ?? null;
}

// ─── Observation Recording ────────────────────────────────────────────────────

export async function recordObservation(
  experimentId: string,
  metric: string,
  value: number
): Promise<void> {
  const variant = getAssignedVariant(experimentId);
  await db.experiment_observations.add({
    experimentId,               // string (Story 8.1: updated from number to string)
    variantId: variant?.id ?? 'control',
    timestamp: new Date().toISOString(),
    metric,
    value,
    userId: getUserId(),
  });
}

// ─── Test Utilities ───────────────────────────────────────────────────────────

/** Clears assignment cache — FOR TESTING ONLY */
export function clearAssignmentsForTesting(): void {
  localStorage.removeItem(STORAGE_KEYS.EXPERIMENT_ASSIGNMENTS);
}
```

### Hash Algorithm: Why djb2 Over The Epics' Simple Version

The epics suggest `userId.charCodeAt() % 100` — this only looks at the first character of userId, producing heavily biased assignments (first character of UUIDs is always a hex digit: 0–9 or a–f, giving only 16 distinct values).

The djb2-style hash (`hash << 5 + hash + charCode`) provides uniform distribution across 0–99 for any string input.

**Test the hash determinism:**
```typescript
// Same inputs → always same output
expect(deterministicHash('user-abc', 'drill-timer-visibility'))
  .toBe(deterministicHash('user-abc', 'drill-timer-visibility')); // ✓

// Different inputs → different outputs (not guaranteed but expected)
expect(deterministicHash('user-abc', 'drill-timer-visibility'))
  .not.toBe(deterministicHash('user-xyz', 'drill-timer-visibility')); // likely ✓
```

### Testing Patterns (experimentManager.test.ts)

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  getUserId, deterministicHash, getActiveExperiments,
  assignVariant, getAssignedVariant, recordObservation, clearAssignmentsForTesting
} from './experimentManager';

// ─── Mocks ────────────────────────────────────────────────────────────────────

// localStorage mock — from project-context.md pattern
const mockStorage: Record<string, string> = {};
vi.spyOn(Storage.prototype, 'getItem').mockImplementation(key => mockStorage[key] ?? null);
vi.spyOn(Storage.prototype, 'setItem').mockImplementation((key, val) => { mockStorage[key] = String(val); });
vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(key => { delete mockStorage[key]; });

// DB mock — avoid real IndexedDB
vi.mock('@/services/storage/db', () => ({
  db: {
    experiment_observations: {
      add: vi.fn().mockResolvedValue(1),
    },
  },
}));

import { db } from '@/services/storage/db';

// ─── crypto.randomUUID mock ───────────────────────────────────────────────────
// JSDOM doesn't provide crypto.randomUUID in some vitest configs
const mockUUID = 'test-uuid-1234-5678-abcd-ef0123456789';
vi.spyOn(crypto, 'randomUUID').mockReturnValue(mockUUID as `${string}-${string}-${string}-${string}-${string}`);

beforeEach(() => {
  // Clear mock storage between tests
  Object.keys(mockStorage).forEach(k => delete mockStorage[k]);
  vi.clearAllMocks();
  // Re-apply after clearAllMocks wipes mockResolvedValue
  vi.mocked(db.experiment_observations.add).mockResolvedValue(1);
  vi.mocked(crypto.randomUUID).mockReturnValue(mockUUID as `${string}-${string}-${string}-${string}-${string}`);
});

afterEach(() => {
  vi.clearAllMocks();
});
```

**Key test scenarios:**
```typescript
describe('getUserId', () => {
  it('generates a UUID on first call and stores it', () => {
    const id = getUserId();
    expect(id).toBe(mockUUID);
    expect(mockStorage['discalculas:userId']).toBe(mockUUID);
  });

  it('returns same ID on subsequent calls without generating new UUID', () => {
    getUserId(); // first call
    vi.mocked(crypto.randomUUID).mockReturnValue('different-uuid' as any);
    const id = getUserId(); // should return stored, not new
    expect(id).toBe(mockUUID);
    expect(crypto.randomUUID).toHaveBeenCalledTimes(1); // only called once
  });
});

describe('deterministicHash', () => {
  it('returns the same value for the same inputs', () => {
    const h1 = deterministicHash('user-a', 'exp-x');
    const h2 = deterministicHash('user-a', 'exp-x');
    expect(h1).toBe(h2);
  });

  it('returns a value in range [0, 99]', () => {
    expect(deterministicHash('user-a', 'exp-x')).toBeGreaterThanOrEqual(0);
    expect(deterministicHash('user-a', 'exp-x')).toBeLessThan(100);
  });
});

describe('getActiveExperiments', () => {
  it('returns only active experiments within date range', () => {
    const active = getActiveExperiments();
    expect(active.every(e => e.status === 'active')).toBe(true);
    const today = new Date().toISOString().slice(0, 10);
    active.forEach(e => {
      expect(e.startDate <= today).toBe(true);
      if (e.endDate) expect(e.endDate >= today).toBe(true);
    });
  });

  it('excludes draft experiments', () => {
    const active = getActiveExperiments();
    expect(active.some(e => e.status === 'draft')).toBe(false);
  });
});
```

### STORAGE_KEYS to Add

```typescript
// In src/services/storage/localStorage.ts:
// Story 8.1: Research mode experiment infrastructure
USER_ID: 'discalculas:userId',
EXPERIMENT_ASSIGNMENTS: 'discalculas:experimentAssignments',
```

Note: `RESEARCH_MODE_ENABLED: 'discalculas:researchModeEnabled'` already exists — do NOT duplicate it.

### `crypto.randomUUID()` in Vitest/JSDOM

JSDOM (used by Vitest) may not expose `crypto.randomUUID()`. Mock it:
```typescript
vi.spyOn(crypto, 'randomUUID').mockReturnValue('test-uuid-...' as \`${string}-${string}-${string}-${string}-${string}\`);
```

The template literal type `\`${string}-${string}-${string}-${string}-${string}\`` is required by TypeScript for `crypto.randomUUID()` return type.

### Date Range for Active Experiments

The epics file uses dates from 2025-11-09 to 2025-12-09 — **these are already expired** (current date: 2026-03-07). Update `EXPERIMENTS` to use current dates:
- `drill-timer-visibility`: `startDate: '2026-03-07'`, `endDate: '2026-06-07'`
- `confidence-scale`: keep `status: 'draft'` (won't appear in active experiments)

### Previous Story Intelligence (from Story 7.4)

- **`vi.clearAllMocks()` clears mock implementations** — Re-apply `mockResolvedValue` in `beforeEach` (critical pattern)
- **Pure functions in services** — No React imports; follows `syncQueue.ts` pattern exactly
- **localStorage mocking** — Use `vi.spyOn(Storage.prototype, ...)` not `vi.stubGlobal('localStorage', ...)` for most reliable results
- **TypeScript strict mode** — `mockResolvedValue(1)` not `mockResolvedValue(undefined)` for Dexie `.add()` which returns `Promise<IndexableType>` (number)
- **`waitFor` for async assertions** — DB writes (`recordObservation`) need `await act()` or `await waitFor()` in tests

### Project Structure Notes

```
src/services/
├── pwa/                          ← EXISTING (Story 7.x)
│   ├── syncQueue.ts              ← Pattern to follow for experimentManager.ts
│   └── useSyncIndicator.ts
├── research/                     ← NEW (Story 8.1)
│   ├── experiments.ts            ← Types + constants
│   ├── experimentManager.ts      ← Service functions
│   └── experimentManager.test.ts ← Unit tests
└── storage/
    ├── db.ts                     ← Read but DON'T modify DB version
    ├── localStorage.ts           ← Add 2 new STORAGE_KEYS
    └── schemas.ts                ← Change ExperimentObservation.experimentId: number → string
```

**Do NOT create:**
- Any React components in this story (Story 8.3 handles the dashboard UI)
- Any routes or navigation changes (Story 8.4 handles the settings toggle)
- Any hooks (`useExperiment` is Story 8.2)

### References

- [Source: docs/epics.md#Story 8.1] — Experiment definitions, manager API, storage spec
- [Source: src/services/storage/schemas.ts] — Existing `Experiment` and `ExperimentObservation` types (mismatch documented above)
- [Source: src/services/storage/db.ts] — DB singleton, `experiment_observations` index definition
- [Source: src/services/storage/localStorage.ts] — `STORAGE_KEYS`, `getUserSettings()`, existing `researchModeEnabled` key
- [Source: src/services/pwa/syncQueue.ts] — Pure-function service pattern to follow
- [Source: docs/project-context.md] — localStorage mock pattern, `vi.clearAllMocks()` gotcha, Triple-Check protocol

## Dev Agent Record

### Agent Model Used

Claude Sonnet 4.6

### Debug Log References

| Issue | File | Fix Applied |
|---|---|---|
| `ExperimentObservation.experimentId` changed from `number` to `string` in schemas.ts caused 3 TypeScript errors in schemas.test.ts | `src/services/storage/schemas.test.ts` lines 285, 303, 311 | Updated 3 test fixtures: `experimentId: 42` → `'drill-timer-visibility'`, `experimentId: 123` → `'drill-timer-visibility'`, `experimentId: 1` → `'confidence-scale'` |
| `vi.clearAllMocks()` wipes `mockResolvedValue` and `mockReturnValue` on all mocked functions | `src/services/research/experimentManager.test.ts` | Re-applied `vi.mocked(db.experiment_observations.add).mockResolvedValue(1)` and `vi.mocked(crypto.randomUUID).mockReturnValue(...)` in `beforeEach` after `clearAllMocks()` |
| `crypto.randomUUID()` TypeScript return type is branded template literal `` `${string}-${string}-${string}-${string}-${string}` `` not plain `string` | `src/services/research/experimentManager.test.ts` | Mock value cast with `as \`${string}-${string}-${string}-${string}-${string}\`` |

### Completion Notes List

- **Architecture: experiments as code constants** — Experiment definitions live in `EXPERIMENTS[]` constant in `experiments.ts`, NOT in Dexie. The Dexie `experiments` table has a structural mismatch (auto-increment `id`, `variants: string[]`) with the epics spec (`id: string`, `variants: Variant[]`). Assignments are cached in localStorage (synchronous, key-value, device-specific). Observations go to `db.experiment_observations` (already correctly indexed).
- **djb2 hash instead of epics' naive approach** — The epics suggested `userId.charCodeAt() % 100` (only first character of UUID → only 16 distinct values for hex chars 0–9, a–f). djb2-style rolling hash over the full `userId + ':' + experimentId` string produces uniform 0–99 distribution.
- **No DB version bump** — Changing `ExperimentObservation.experimentId` from `number` to `string` required no Dexie schema version bump. The Dexie index `'++id, experimentId, variantId, timestamp'` works with both types; the table is empty in production.
- **31 tests in experimentManager.test.ts** — After code review fixes (see below), final count is 1964 total. Tests cover all 7 exported functions including edge cases. Code review added 2 net tests: removed 2 vacuous status-check tests, added 4 substantive ones (3 date-frozen, 1 weight-boundary).
- **Task 7 (manual browser testing) deferred** — This task requires Jeremy to run `npm run dev` and verify via DevTools Console that `discalculas:userId` is written, `getActiveExperiments()` returns `drill-timer-visibility`, and `assignVariant()` is consistent across page reloads.

### File List

| File | Status | Notes |
|---|---|---|
| `src/services/storage/localStorage.ts` | Modified | Added `USER_ID` and `EXPERIMENT_ASSIGNMENTS` keys to `STORAGE_KEYS` |
| `src/services/storage/schemas.ts` | Modified | Changed `ExperimentObservation.experimentId: number` → `string` |
| `src/services/storage/schemas.test.ts` | Modified | Fixed 3 test fixtures to use string experimentId values |
| `src/services/research/experiments.ts` | Created | `Variant` + `ExperimentDefinition` types; `EXPERIMENTS` constant with 2 experiments |
| `src/services/research/experimentManager.ts` | Created | `getUserId`, `deterministicHash`, `getActiveExperiments`, `assignVariant`, `getAssignedVariant`, `recordObservation`, `clearAssignmentsForTesting` |
| `src/services/research/experimentManager.test.ts` | Created | 31 unit tests across 7 describe blocks (after code review fixes) |
| `src/services/research/experimentManager.ts` | Modified (code review) | Added structural validation to `loadAssignments()` |

## Code Review Record

### 1st Code Review

**Reviewer:** Claude Sonnet 4.6
**Findings:** 1 High, 3 Medium, 3 Low
**Resolution:** All issues auto-fixed
**Post-fix verification:** tsc zero errors, 1964 passing (+2 vs pre-review), 0 failures

| # | Severity | Finding | File | Fix Applied |
|---|---|---|---|---|
| H1 | HIGH | Two `deterministicHash` tests named "produces different values" only asserted `typeof result === 'number'` — would pass even if function returned a constant | `experimentManager.test.ts:101-114` | Changed assertions to `expect(h1).not.toBe(h2)` |
| M1 | MEDIUM | `getActiveExperiments()` date-range test used live `new Date()` and iterated results — if experiments expired, `forEach` passed vacuously on empty array | `experimentManager.test.ts:140-154` | Replaced with 3 time-frozen tests using `vi.useFakeTimers()` + `vi.setSystemTime()` |
| M2 | MEDIUM | Draft/completed exclusion tests scanned `active.some(e => e.status === 'draft')` — vacuously false since no completed experiments exist in `EXPERIMENTS` | `experimentManager.test.ts:130-138` | Replaced with named-ID test: `expect(ids).not.toContain('confidence-scale')` |
| M3 | MEDIUM | No test verified that the weighted selection algorithm maps hash buckets to correct variants (the core of `assignVariant`) | `experimentManager.test.ts` | Added: computes `deterministicHash(MOCK_UUID, ...)`, derives expected variant, asserts match |
| L1 | LOW | Redundant `afterEach(() => vi.clearAllMocks())` — `beforeEach` already calls it at start of every test | `experimentManager.test.ts:59-61` | Removed `afterEach` block, added explanatory comment |
| L2 | LOW | `loadAssignments()` cast `JSON.parse(raw)` directly to `Record<string,string>` without structural validation — corrupt non-object data would silently pass | `experimentManager.ts:72-79` | Added `typeof`/`null`/`Array.isArray` checks before cast |
| L3 | LOW | Task 7 (manual browser testing) unchecked — triple-check protocol not complete | Story file | Cannot be auto-fixed — requires human browser verification |
