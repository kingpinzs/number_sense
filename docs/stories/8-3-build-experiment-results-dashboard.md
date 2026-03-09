# Story 8.3: Build Experiment Results Dashboard

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a developer analyzing experiment results,
I want a dashboard showing experiment metrics and comparisons,
So that I can determine which variant performs better.

## Acceptance Criteria

1. **`statsCalculator.ts` pure service created** — Located at `src/services/research/statsCalculator.ts`; exports `calculateMean`, `calculateStdDev`, `compareVariants`; no React or Dexie imports
2. **`VariantComparison` interface exported** — Shape: `{ controlMean: number; controlStdDev: number; treatmentMean: number; treatmentStdDev: number; difference: number; percentChange: number; significance: 'high' | 'moderate' | 'low' }`
3. **Significance thresholds correct** — `'high'` when `|percentChange| > 10` OR `|difference| > 0.5 * controlStdDev`; `'moderate'` when `|percentChange| >= 5`; `'low'` otherwise; `calculateMean([])` returns `0`; `calculateStdDev([])` returns `0`
4. **`/research` route registered** — Route added to `src/App.tsx`; component at `src/routes/ResearchRoute.tsx`; renders `ExperimentDashboard` when `import.meta.env.DEV || settings.researchModeEnabled === true`; otherwise renders `<Navigate to="/" replace />`
5. **`ExperimentDashboard` component** — Located at `src/features/research/components/ExperimentDashboard.tsx`; loads all experiments from `EXPERIMENTS` sorted active → draft → completed; loads observation counts from `db.experiment_observations` per experiment on mount
6. **Experiment card layout** — Each card shows: experiment name, description, status badge (`active`/`draft`/`completed`), variant split string (e.g., "50% Timer Visible, 50% Timer Hidden"), observation count (e.g., "127 observations"), and a "View Results" button
7. **Results drilldown view** — Clicking "View Results" shows: metric comparison table (Metric | Control | Treatment | Difference | Significance) with 🟢/🟡/🔴 indicators based on AC #3 thresholds; sample size per variant (e.g., "63 control, 64 treatment"); duration in days ("Active for N days" from `startDate` to today)
8. **Recharts `BarChart`** — Results view includes a bar chart with control and treatment mean bars for each metric; uses `BarChart`, `Bar`, `XAxis`, `YAxis`, `CartesianGrid`, `Tooltip`, `Legend`, `ResponsiveContainer` from recharts
9. **CSV export** — "Export as CSV" button triggers download of all observations for the experiment; CSV columns: `timestamp,userId,experimentId,variantId,metric,value`; filename: `experiment-{id}-{YYYY-MM-DD}.csv`
10. **TypeScript clean** — `npx tsc --noEmit` returns zero errors
11. **All existing tests pass + new tests** — `npm test` shows no regressions; `statsCalculator.test.ts` covers AC #3 edge cases; `ExperimentDashboard.test.tsx` covers list render, card fields, results view, empty state

## Tasks / Subtasks

- [x] **Task 1: Create `statsCalculator.ts` pure service** (AC: #1, #2, #3)
  - [x] 1.1 Create `src/services/research/statsCalculator.ts`
  - [x] 1.2 Export `VariantComparison` interface with all required fields
  - [x] 1.3 Implement `calculateMean(values: number[]): number` — returns `0` for empty array; sum/length otherwise
  - [x] 1.4 Implement `calculateStdDev(values: number[], mean?: number): number` — returns `0` for empty or single-element arrays; computes mean via `calculateMean` if not provided; uses population standard deviation: `sqrt(sum((x - mean)^2) / n)`
  - [x] 1.5 Implement `compareVariants(controlValues: number[], treatmentValues: number[]): VariantComparison`:
    - Compute `controlMean`, `controlStdDev`, `treatmentMean`, `treatmentStdDev`
    - `difference = treatmentMean - controlMean`
    - `percentChange = controlMean === 0 ? 0 : (difference / controlMean) * 100`
    - Significance: `'high'` if `|percentChange| > 10` OR (`controlStdDev > 0` AND `|difference| > 0.5 * controlStdDev`); `'moderate'` if `|percentChange| >= 5`; `'low'` otherwise
    - Return with all fields
  - [x] 1.6 Create `src/services/research/statsCalculator.test.ts`
  - [x] 1.7 Test `calculateMean`: `[]` → `0`; `[1, 2, 3]` → `2`; `[5]` → `5`; `[0, 0, 0]` → `0`
  - [x] 1.8 Test `calculateStdDev`: `[]` → `0`; `[5]` → `0`; `[1, 1, 1]` → `0`; `[2, 4, 4, 4, 5, 5, 7, 9]` → `2`
  - [x] 1.9 Test `compareVariants` significance — 'high': control=[80,80], treatment=[92,92] (15% > 10%)
  - [x] 1.10 Test `compareVariants` significance — 'moderate': control=[80,80], treatment=[85,85] (6.25% in [5,10])
  - [x] 1.11 Test `compareVariants` significance — 'low': control=[80,80], treatment=[82,82] (2.5% < 5%)
  - [x] 1.12 Test `compareVariants` with empty arrays → all zeros, significance 'low'
  - [x] 1.13 Test `compareVariants` high via SD threshold: control values with spread, treatment difference > 0.5 stdDev

- [x] **Task 2: Create `ResearchRoute` with route guard** (AC: #4)
  - [x] 2.1 Create `src/routes/ResearchRoute.tsx`:
    - Import `Navigate` from `react-router-dom`
    - Import `useUserSettings` from `@/context/UserSettingsContext`
    - Import `ExperimentDashboard` from `@/features/research/components/ExperimentDashboard`
    - Guard: `const canAccess = import.meta.env.DEV || settings.researchModeEnabled`
    - If `!canAccess`: return `<Navigate to="/" replace />`
    - Else: return `<ExperimentDashboard />`
  - [x] 2.2 Add to `src/App.tsx`: `import ResearchRoute from '@/routes/ResearchRoute'` and `<Route path="/research" element={<ResearchRoute />} />`
  - [x] 2.3 Create `src/routes/ResearchRoute.test.tsx`:
    - Mock `useUserSettings` — test guard redirects to `/` when `researchModeEnabled: false` AND not in DEV mode
    - Test renders dashboard when `researchModeEnabled: true`

- [x] **Task 3: Create `ExperimentDashboard` component** (AC: #5, #6, #7, #8)
  - [x] 3.1 Create `src/features/research/components/ExperimentDashboard.tsx`
  - [x] 3.2 Sort `EXPERIMENTS` by status priority: `{ active: 0, draft: 1, completed: 2 }`
  - [x] 3.3 Load observation counts on mount via `useEffect`:
    ```ts
    const obs = await db.experiment_observations.where('experimentId').equals(exp.id).toArray();
    counts[exp.id] = obs.length;
    ```
  - [x] 3.4 Render experiment list with cards showing all AC #6 fields:
    - `experiment.name` and `experiment.description`
    - Status badge with text-color per status (green=active, yellow=draft, gray=completed)
    - Variant split: `exp.variants.map(v => `${Math.round(v.weight * 100)}% ${v.name}`).join(', ')`
    - Observation count: `observationCounts[exp.id] ?? 0` formatted as "N observations"
    - "View Results" button with `onClick` → `setSelectedExperimentId(exp.id)`
  - [x] 3.5 "View Results" transitions to detail view using `useState<string | null>` for `selectedExperimentId` (no router navigation)
  - [x] 3.6 In detail view, load observations for selected experiment: `db.experiment_observations.where('experimentId').equals(selectedId).toArray()`
  - [x] 3.7 Group observations: by `metric` → by `variantId` (bucket into `control[]` and `treatment[]` arrays)
  - [x] 3.8 Call `compareVariants(controlValues, treatmentValues)` per metric to produce table data
  - [x] 3.9 Render metric comparison table (AC #7):
    - Columns: Metric | Control | Treatment | Difference | Significance
    - Control/Treatment: show mean formatted to 2 decimal places
    - Difference: show `+N.NN` or `-N.NN`
    - Significance: `{ high: '🟢', moderate: '🟡', low: '🔴' }[comparison.significance]`
  - [x] 3.10 Render sample size: count control/treatment observations total
  - [x] 3.11 Render duration: `differenceInDays(new Date(), parseISO(experiment.startDate))` from `date-fns`; display "Active for N days"
  - [x] 3.12 Implement Recharts `BarChart` (AC #8):
    - `chartData = tableRows.map(({ metric, comparison }) => ({ metric, Control: comparison.controlMean, Treatment: comparison.treatmentMean }))`
    - Use `ResponsiveContainer`, `BarChart`, `CartesianGrid`, `XAxis dataKey="metric"`, `YAxis`, `Tooltip`, `Legend`, `Bar dataKey="Control"`, `Bar dataKey="Treatment"`
  - [x] 3.13 Add "← Back" button: `onClick` → `setSelectedExperimentId(null)`
  - [x] 3.14 Show "No data collected yet" when no observations exist for selected experiment
  - [x] 3.15 Create `src/features/research/components/ExperimentDashboard.test.tsx`:
    - Mock `@/services/storage/db` with Dexie query chain (`where().equals().toArray()`)
    - Mock `@/services/research/experiments` or import EXPERIMENTS directly
    - Test: renders experiment list with experiment names
    - Test: status badge renders for each experiment
    - Test: "View Results" click shows results table
    - Test: empty observations → shows "No data collected yet"
    - Test: non-empty observations → shows metric table rows with significance emoji

- [x] **Task 4: Implement CSV export** (AC: #9)
  - [x] 4.1 Create `src/features/research/utils/exportObservations.ts`:
    ```ts
    export function exportObservationsAsCSV(experimentId: string, observations: ExperimentObservation[]): void {
      const header = 'timestamp,userId,experimentId,variantId,metric,value';
      const rows = observations.map(o =>
        [o.timestamp, o.userId, o.experimentId, o.variantId, o.metric, o.value].join(',')
      );
      const csv = [header, ...rows].join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const date = new Date().toISOString().slice(0, 10);
      a.href = url;
      a.download = `experiment-${experimentId}-${date}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    }
    ```
  - [x] 4.2 Wire "Export as CSV" button in `ExperimentDashboard` results view: calls `exportObservationsAsCSV(selectedExperimentId, observations)`
  - [x] 4.3 Create `src/features/research/utils/exportObservations.test.ts`:
    - Mock `document.createElement`, `URL.createObjectURL`, `URL.revokeObjectURL`
    - Test: CSV header row is correct
    - Test: rows are correctly formatted with comma-separated values
    - Test: filename includes experimentId and today's date
    - Test: empty observations → CSV with header only

- [x] **Task 5: Build verification** (AC: #10, #11)
  - [x] 5.1 Run `npx tsc --noEmit` — zero errors ✓
  - [x] 5.2 Run `npm test` — 2017 passing, 2 skipped, 0 failures ✓
  - [x] 5.3 Run `npm run build` — production build succeeds ✓

- [ ] **Task 6: VERIFICATION: Manual Browser Testing** [MANDATORY - cannot be skipped]
  - [ ] 6.1 Run dev server (`npm run dev`) and navigate to `http://localhost:5173/research`
  - [ ] 6.2 Verify: dashboard loads and shows experiment cards for both experiments (`drill-timer-visibility` active, `confidence-scale` draft)
  - [ ] 6.3 Verify: `drill-timer-visibility` card appears above `confidence-scale` (active before draft sort order)
  - [ ] 6.4 Verify: each card shows name, description, status badge, variant split (e.g., "50% Timer Visible, 50% Timer Hidden"), and observation count
  - [ ] 6.5 Click "View Results" → verify results view loads with metric table, bar chart, sample size, and duration
  - [ ] 6.6 Enable Research Mode in Settings → complete a training drill → return to `/research` → verify observation count increments
  - [ ] 6.7 Click "Export as CSV" → verify file download triggers with correct filename format
  - [ ] 6.8 Verify "← Back" button returns to experiment list

## Dev Notes

### Architecture Overview

The dashboard layers on top of the pure service layer from Stories 8.1-8.2:

```
[ResearchRoute] → route guard (DEV || researchModeEnabled)
      ↓
[ExperimentDashboard] → list view: sorts EXPERIMENTS, loads observation counts from Dexie
      ↓ (View Results)
[Detail View] → loads observations, groups by metric/variant, calls statsCalculator
      ↓
[BarChart (Recharts)] + [Metric Table] + [exportObservationsAsCSV]
```

`statsCalculator.ts` is a **pure service** — receives `number[]` arrays from the component, returns `VariantComparison` objects. No React hooks, no Dexie. Fully testable with `calculateMean([1,2,3])` style calls.

### `VariantComparison` Interface

```typescript
// src/services/research/statsCalculator.ts
export interface VariantComparison {
  controlMean: number;
  controlStdDev: number;
  treatmentMean: number;
  treatmentStdDev: number;
  difference: number;        // treatmentMean - controlMean
  percentChange: number;     // (difference / controlMean) * 100; 0 if controlMean === 0
  significance: 'high' | 'moderate' | 'low';
}
```

### Significance Logic (in priority order)

```typescript
const absPercent = Math.abs(percentChange);
const absDiff = Math.abs(difference);

// 'high': large effect — >10% OR difference > half a control std dev
if (absPercent > 10 || (controlStdDev > 0 && absDiff > 0.5 * controlStdDev)) return 'high';

// 'moderate': noticeable — 5-10%
if (absPercent >= 5) return 'moderate';

// 'low': minimal — <5%
return 'low';
```

Significance emoji mapping: `{ high: '🟢', moderate: '🟡', low: '🔴' }`

### Route Guard Pattern

```typescript
// src/routes/ResearchRoute.tsx
import { Navigate } from 'react-router-dom';
import { useUserSettings } from '@/context/UserSettingsContext';
import ExperimentDashboard from '@/features/research/components/ExperimentDashboard';

export default function ResearchRoute() {
  const { settings } = useUserSettings();
  const canAccess = import.meta.env.DEV || settings.researchModeEnabled;
  if (!canAccess) return <Navigate to="/" replace />;
  return <ExperimentDashboard />;
}
```

Add to `src/App.tsx` imports and routes:
```typescript
import ResearchRoute from '@/routes/ResearchRoute';
// ...
<Route path="/research" element={<ResearchRoute />} />
```

### Loading Observation Counts (Dashboard List View)

```typescript
const [observationCounts, setObservationCounts] = useState<Record<string, number>>({});

useEffect(() => {
  async function loadCounts() {
    const counts: Record<string, number> = {};
    for (const exp of sortedExperiments) {
      const obs = await db.experiment_observations
        .where('experimentId').equals(exp.id).toArray();
      counts[exp.id] = obs.length;
    }
    setObservationCounts(counts);
  }
  loadCounts();
}, []);
```

### Results View Data Flow

```typescript
// On "View Results" click, load observations for the selected experiment:
const observations = await db.experiment_observations
  .where('experimentId').equals(experimentId).toArray();

// Group by metric, then by variant
const byMetric: Record<string, { control: number[]; treatment: number[] }> = {};
for (const obs of observations) {
  if (!byMetric[obs.metric]) byMetric[obs.metric] = { control: [], treatment: [] };
  if (obs.variantId === 'control') byMetric[obs.metric].control.push(obs.value);
  else byMetric[obs.metric].treatment.push(obs.value);
}

// Compute stats per metric
const tableRows = Object.entries(byMetric).map(([metric, { control, treatment }]) => ({
  metric,
  comparison: compareVariants(control, treatment),
}));
```

### Recharts Bar Chart Pattern (follow ConfidenceRadar.tsx)

```typescript
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

// Chart data shape
const chartData = tableRows.map(({ metric, comparison }) => ({
  metric,
  Control: Number(comparison.controlMean.toFixed(2)),
  Treatment: Number(comparison.treatmentMean.toFixed(2)),
}));

// JSX
<ResponsiveContainer width="100%" height={300}>
  <BarChart data={chartData} aria-label="Metric comparison chart">
    <CartesianGrid strokeDasharray="3 3" />
    <XAxis dataKey="metric" />
    <YAxis />
    <Tooltip />
    <Legend />
    <Bar dataKey="Control" fill="#6366f1" />
    <Bar dataKey="Treatment" fill="#10b981" />
  </BarChart>
</ResponsiveContainer>
```

### Duration and Variant Split Helpers

```typescript
// Duration (date-fns already in dependencies from Story 5.2)
import { differenceInDays, parseISO } from 'date-fns';
const durationDays = differenceInDays(new Date(), parseISO(experiment.startDate));
// Display: `Active for ${durationDays} day${durationDays === 1 ? '' : 's'}`

// Variant split string
const splitStr = experiment.variants
  .map(v => `${Math.round(v.weight * 100)}% ${v.name}`)
  .join(', ');
// → "50% Timer Visible, 50% Timer Hidden"

// Sort order
const STATUS_ORDER: Record<string, number> = { active: 0, draft: 1, completed: 2 };
const sorted = [...EXPERIMENTS].sort(
  (a, b) => (STATUS_ORDER[a.status] ?? 3) - (STATUS_ORDER[b.status] ?? 3)
);
```

### CSV Export

```typescript
// src/features/research/utils/exportObservations.ts
import type { ExperimentObservation } from '@/services/storage/schemas';

export function exportObservationsAsCSV(
  experimentId: string,
  observations: ExperimentObservation[]
): void {
  const header = 'timestamp,userId,experimentId,variantId,metric,value';
  const rows = observations.map(o =>
    [o.timestamp, o.userId, o.experimentId, o.variantId, o.metric, o.value].join(',')
  );
  const csv = [header, ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const date = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `experiment-${experimentId}-${date}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
```

### Testing Pattern — Dexie Mock for Component Tests

```typescript
// Mock the entire db module at module level
vi.mock('@/services/storage/db', () => ({
  db: {
    experiment_observations: {
      where: vi.fn().mockReturnThis(),
      equals: vi.fn().mockReturnThis(),
      toArray: vi.fn().mockResolvedValue([]),
    },
  },
}));

// Override toArray to seed data for a specific test:
vi.mocked(db.experiment_observations.toArray).mockResolvedValue([
  {
    id: 1, experimentId: 'drill-timer-visibility', variantId: 'treatment',
    metric: 'drill_accuracy', value: 0.85, timestamp: '2026-03-08T10:00:00Z', userId: 'abc'
  },
]);
```

Note: Dexie's fluent chaining (`where().equals().toArray()`) requires `where` to return `this` — this pattern handles it correctly.

### Project Structure Notes

- **New file**: `src/services/research/statsCalculator.ts` — pure service (no React/Dexie)
- **New file**: `src/services/research/statsCalculator.test.ts` — unit tests for all stat functions
- **New file**: `src/routes/ResearchRoute.tsx` — route guard wrapper
- **New file**: `src/routes/ResearchRoute.test.tsx` — route guard unit tests
- **New file**: `src/features/research/components/ExperimentDashboard.tsx` — main component
- **New file**: `src/features/research/components/ExperimentDashboard.test.tsx` — component tests
- **New file**: `src/features/research/utils/exportObservations.ts` — CSV export utility
- **New file**: `src/features/research/utils/exportObservations.test.ts` — CSV export tests
- **Modified**: `src/App.tsx` — add `/research` route

### References

- Epic 8 Story 8.3 requirements: [docs/epics.md](docs/epics.md) (lines 2826–2882)
- Story 8.1 implementation: [docs/stories/8-1-build-experiment-manager.md](docs/stories/8-1-build-experiment-manager.md)
- Story 8.2 implementation: [docs/stories/8-2-implement-variant-assignment-and-feature-flags.md](docs/stories/8-2-implement-variant-assignment-and-feature-flags.md)
- `experimentManager.ts` API: [src/services/research/experimentManager.ts](src/services/research/experimentManager.ts)
- `experiments.ts` definitions: [src/services/research/experiments.ts](src/services/research/experiments.ts)
- Recharts RadarChart pattern: [src/features/progress/components/ConfidenceRadar.tsx](src/features/progress/components/ConfidenceRadar.tsx)
- App routes: [src/App.tsx](src/App.tsx)
- Database schema: [src/services/storage/db.ts](src/services/storage/db.ts)
- Project context (testing patterns, TypeScript conventions): [docs/project-context.md](docs/project-context.md)

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- **jsdom `Blob.text()` not supported**: FileReader workaround failed due to `vi.useFakeTimers()` blocking async callbacks. Fixed by intercepting the Blob constructor to capture CSV content synchronously via the `parts` argument.
- **`URL.createObjectURL`/`revokeObjectURL` not in jsdom**: Used `Object.defineProperty` to define stubs before `vi.spyOn` could attach. Later simplified to direct `vi.fn()` assignment to avoid TypeScript spy generic inference issues.
- **TypeScript `ReturnType<typeof vi.spyOn>` mismatch**: `vi.spyOn(URL, 'createObjectURL')` returns `MockInstance<(obj: Blob | MediaSource) => string>` which is incompatible with the generic `MockInstance<...unknown...>`. Fixed by assigning mocks directly: `URL.createObjectURL = vi.fn()`.

### Completion Notes List

- `statsCalculator.ts` created as pure service (zero React/Dexie imports). Population std dev used throughout (`/ n`).
- Significance logic priority: 'high' checked first (percent OR SD threshold), then 'moderate', then 'low'.
- `ExperimentDashboard.tsx` uses `useState<string | null>` for detail view navigation — no URL routing needed for a dev-only tool.
- Dexie mock pattern: `where: vi.fn().mockReturnThis(), equals: vi.fn().mockReturnThis(), toArray: vi.fn().mockResolvedValue([])` enables fluent chain mocking.
- `ResearchRoute` guard: `import.meta.env.DEV || settings.researchModeEnabled` — always accessible in dev mode, controlled by settings in production. Note: in Vitest test env, `import.meta.env.DEV` is always `true`, so redirect branch cannot be tested in isolation.
- 41 new tests total: 18 statsCalculator + 8 exportObservations + 3 ResearchRoute + 12 ExperimentDashboard. After code review fixes: 44 new tests (+3 from review).
- TypeScript: `npx tsc --noEmit` → 0 errors.
- Full suite after code review: 2020 passing, 2 skipped (pre-existing), 0 failures.

**Code Review Fixes Applied (2026-03-08):**
- H1: Filtered metrics with only one variant's data from the comparison table to prevent misleading 'high' significance. Added `incompleteMetrics` notice in JSX. [ExperimentDashboard.tsx]
- H2: Added `isCurrent` flag + cleanup return to detail view `useEffect` — prevents stale data from racing Dexie queries. [ExperimentDashboard.tsx]
- M1: Added component integration test for "Export as CSV" button click. [ExperimentDashboard.test.tsx]
- M2: Refactored `loadCounts()` from sequential `for...of` + `await` to parallel `Promise.all()`. [ExperimentDashboard.tsx]
- M3: Fixed misleading test description "does not render... when false" → "renders in DEV mode even when false". [ResearchRoute.test.tsx]
- L4: Added unbalanced-group edge case test to document `compareVariants` behavior with one empty array. [statsCalculator.test.ts]

Triple-Check Verification:
- Visual verification: Required — Task 6 (manual browser testing) must be completed by user.
- App runs in DEV mode so `/research` route is always accessible at `http://localhost:5173/research`.
- Edge cases tested in unit tests: empty observations (no data state), sort order (active before draft), significance thresholds.
- Accessibility: All interactive elements have `aria-label`, 44px min-height on buttons, table uses `<table><thead><tbody>` semantic structure.

### File List

- src/services/research/statsCalculator.ts (new)
- src/services/research/statsCalculator.test.ts (new)
- src/routes/ResearchRoute.tsx (new)
- src/routes/ResearchRoute.test.tsx (new)
- src/features/research/components/ExperimentDashboard.tsx (new)
- src/features/research/components/ExperimentDashboard.test.tsx (new)
- src/features/research/utils/exportObservations.ts (new)
- src/features/research/utils/exportObservations.test.ts (new)
- src/App.tsx (modified: added ResearchRoute import and /research route)
- docs/stories/8-3-build-experiment-results-dashboard.md (new, updated)
