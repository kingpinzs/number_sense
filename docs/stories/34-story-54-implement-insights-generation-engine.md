# Story 5.4: Implement Insights Generation Engine

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **user reviewing my progress**,
I want **personalized insights about my performance patterns**,
so that **I understand what I'm doing well and where to focus next**.

## Acceptance Criteria

### AC-1: Insights Engine Service
**Given** the user has completed training sessions with confidence and accuracy data (Epics 3-4 complete)
**When** `generateInsights(sessions, drillResults)` is called
**Then** the `InsightsEngine` service returns an array of prioritized `Insight` objects analyzing:

**Pattern Detection:**
- **Consistency patterns**:
  - "You've trained X days this week - great consistency!" (if >= 4 sessions in last 7 days)
  - "Try to train more regularly - only X sessions this week" (if < 3 sessions in last 7 days)
- **Performance trends** (per domain using `detectTrend()` on last 10 sessions):
  - "Your Number Line accuracy improved 15% this month!" (if upward trend in accuracy)
  - "Spatial Rotation is getting easier for you" (if confidence increasing for spatial drills)
  - "Math Operations accuracy dipped this week - let's focus there" (if downward trend)
- **Time patterns** (from `drillResults.timeToAnswer`):
  - "You're fastest at Number Line drills (avg 2.8s)" (if significantly faster than other modules)
  - "Taking your time on Spatial Rotation - accuracy is high!" (if slower but high accuracy)
- **Confidence insights** (from `session.confidenceChange`):
  - "Your confidence is growing! +X points this month" (if positive trend)
  - "Practice is building confidence - you're up to X/5 on average!" (if avg > 3.5)

### AC-2: Trend Detection via Linear Regression
**Given** an array of numeric values (accuracy/confidence per session, ordered chronologically)
**When** `detectTrend(values)` is called
**Then** it returns:
- `'improving'` — if slope of simple linear regression is > 0.05
- `'declining'` — if slope is < -0.05
- `'stable'` — if slope is between -0.05 and 0.05
- Requires minimum 3 data points; returns `'stable'` if fewer

### AC-3: Insight Display on Progress Route
**Given** I navigate to `/progress` route
**When** the Insights section renders below the Confidence Radar and above Session History
**Then** the `InsightsPanel` component displays:
- 2-3 insights at a time (most relevant first, by priority)
- Card-based layout using shadcn/ui `Card` component
- Each insight card shows:
  - Emoji icon (left side): `📈` `📊` `⚡` `💪` `🎯`
  - Title text (bold, `text-foreground`)
  - Message text (`text-muted-foreground`)
  - Optional action link/button (e.g., "Start Training" or "View History")
- Refreshes on mount (new insights based on current data)

### AC-4: Insight Priority System
**Given** multiple insights are generated
**When** displayed to user
**Then** insights are sorted by priority (lower number = higher priority):
1. **Priority 1**: Milestone celebrations (streak achievements, accuracy milestones)
2. **Priority 2**: Concerning trends (accuracy drops, low weekly consistency)
3. **Priority 3**: Positive trends (improvements, speed gains, confidence growth)
4. **Priority 4**: General observations (time patterns, module preferences)

### AC-5: Actionable Insights
**Given** an insight is displayed
**Then** each insight includes:
- A suggestion message: "Keep up the great work!" or "Try a training session today"
- Optionally an action link: "Start Training" button (`/training`), "View History" link (`/progress`)
- Only 1 action per insight card (if applicable)

### AC-6: Empty State
**Given** user has fewer than 3 completed training sessions
**When** InsightsPanel renders
**Then** show: "Complete a few more sessions to unlock personalized insights!"
- No insight cards rendered
- Encouraging tone, no alarming language

### AC-7: Accessibility
- Insight cards have proper semantic structure (`article` or `section` with heading)
- Emoji icons have `role="img"` and `aria-label` describing their meaning
- Action buttons meet 44px minimum touch target
- Text contrast meets WCAG 2.1 AA (4.5:1 ratio)
- Respects `prefers-reduced-motion` if any animations added

## Tasks / Subtasks

- [x] **Task 1: Create `Insight` type and `InsightsEngine` service** (AC: #1, #2, #4)
  - [x] 1.1 Define `Insight` interface and `InsightCategory` type in `insightsEngine.ts`
  - [x] 1.2 Write failing test: `detectTrend([1,2,3,4,5])` returns `'improving'`
  - [x] 1.3 Write failing test: `detectTrend([5,4,3,2,1])` returns `'declining'`
  - [x] 1.4 Write failing test: `detectTrend([3,3,3,3,3])` returns `'stable'`
  - [x] 1.5 Write failing test: `detectTrend([1])` returns `'stable'` (too few points)
  - [x] 1.6 Implement `detectTrend(values)` using simple linear regression slope
  - [x] 1.7 Write failing test: `calculateWeeklyConsistency(sessions)` returns count of sessions in last 7 days
  - [x] 1.8 Implement `calculateWeeklyConsistency(sessions)`
  - [x] 1.9 Verify all tests pass

- [x] **Task 2: Implement insight generators** (AC: #1, #4, #5)
  - [x] 2.1 Write failing test: `generateInsights()` returns consistency insight when 5 sessions this week
  - [x] 2.2 Write failing test: `generateInsights()` returns concern insight when only 1 session this week
  - [x] 2.3 Write failing test: `generateInsights()` returns performance trend insight (improving accuracy)
  - [x] 2.4 Write failing test: `generateInsights()` returns declining trend concern insight
  - [x] 2.5 Write failing test: `generateInsights()` returns time pattern insight (fastest module)
  - [x] 2.6 Write failing test: `generateInsights()` returns confidence insight (positive trend)
  - [x] 2.7 Write failing test: insights are sorted by priority (milestone > concern > positive > general)
  - [x] 2.8 Write failing test: max 3 insights returned
  - [x] 2.9 Implement `generateInsights(sessions, drillResults)` composing all pattern detectors
  - [x] 2.10 Verify all tests pass

- [x] **Task 3: Build `InsightsPanel` component** (AC: #3, #5, #6, #7)
  - [x] 3.1 Write failing test: renders insight cards with icon, title, message
  - [x] 3.2 Write failing test: renders empty state when fewer than 3 sessions
  - [x] 3.3 Write failing test: renders action button when insight has action
  - [x] 3.4 Write failing test: emoji icons have `role="img"` and `aria-label`
  - [x] 3.5 Implement `InsightsPanel` component with shadcn/ui `Card` layout
  - [x] 3.6 Create `useInsights` hook to query Dexie sessions/drills and call `generateInsights()`
  - [x] 3.7 Verify all tests pass

- [x] **Task 4: Integrate InsightsPanel into ProgressRoute** (AC: #3)
  - [x] 4.1 Write failing test: ProgressRoute renders InsightsPanel section
  - [x] 4.2 Add InsightsPanel between Confidence Radar card and SessionHistory in `ProgressRoute.tsx`
  - [x] 4.3 Update `src/features/progress/index.ts` with new exports
  - [x] 4.4 Verify all tests pass, TypeScript clean (`tsc --noEmit`)

## Dev Notes

### CRITICAL: Do NOT Reinvent - Reuse These Existing Components

**1. confidenceCalculator.ts — REUSE domain mapping and weighted average:**
```
Existing: src/features/progress/services/confidenceCalculator.ts
```
- `DRILL_TO_DOMAIN` mapping: `{ number_line: 'numberSense', spatial_rotation: 'spatial', math_operations: 'operations' }`
- `calculateWeightedAverage(values, decayFactor)` — pure function for weighted calculations
- `DomainConfidence` type: `{ numberSense: number; spatial: number; operations: number }`
- **IMPORT** `calculateWeightedAverage` and `DomainConfidence` — do NOT recreate these

**2. useConfidenceData hook — REUSE query pattern for sessions:**
```
Existing: src/features/progress/hooks/useConfidenceData.ts
```
- Queries last 10 training sessions from Dexie: `db.sessions.where('module').equals('training').reverse().limit(10).toArray()`
- Joins drill results: `db.drill_results.where('sessionId').anyOf(sessionIds).toArray()`
- Returns `{ isLoading, current, baseline, sessionCount, hasEnoughData, error, refetch }`
- **CLONE query pattern** for `useInsights` hook — same Dexie query shape but may need more sessions

**3. useSessionHistory hook — REUSE session+drill join pattern:**
```
Existing: src/features/progress/hooks/useSessionHistory.ts
```
- `SessionWithDrills` type adds `drills[]` and `hasMagicMinute` to Session
- Join pattern: query sessions → extract IDs → query drill_results by sessionId

**4. dateFormatters.ts — REUSE date utilities:**
```
Existing: src/features/progress/utils/dateFormatters.ts
```
- `formatSessionDate()`, `formatSessionTime()`, `formatDuration()`
- `groupSessionsByDate()` for temporal grouping

**5. schemas.ts — Use these exact types:**
```
Existing: src/services/storage/schemas.ts
```
Key fields for insights:
- `Session`: `timestamp`, `module`, `duration`, `confidenceBefore`, `confidenceAfter`, `confidenceChange`, `accuracy`, `drillCount`, `completionStatus`
- `DrillResult`: `sessionId`, `module`, `isCorrect`, `timeToAnswer`, `accuracy`, `difficulty`
- Module values: `'number_line' | 'spatial_rotation' | 'math_operations'`

**6. ProgressRoute.tsx — MODIFY, do NOT recreate:**
```
Existing: src/routes/ProgressRoute.tsx
```
Currently renders: Header -> Confidence Radar Card -> SessionHistory
Add InsightsPanel **between** Confidence Radar Card and SessionHistory

**7. shadcn/ui Card — ALREADY INSTALLED:**
```
Existing: src/shared/components/ui/card.tsx
```
Use `Card`, `CardContent`, `CardHeader`, `CardTitle` for insight cards

### File Locations (MANDATORY)

```
src/features/progress/services/
├── insightsEngine.ts              <- NEW (InsightsEngine service + Insight types)
└── insightsEngine.test.ts         <- NEW (unit tests for all insight generators)

src/features/progress/components/
├── InsightsPanel.tsx              <- NEW (display component)
└── InsightsPanel.test.tsx         <- NEW (component tests)

src/features/progress/hooks/
├── useInsights.ts                 <- NEW (hook to fetch data + generate insights)
└── useInsights.test.ts            <- NEW (hook tests)

src/features/progress/
└── index.ts                       <- UPDATE (add InsightsPanel, useInsights exports)

src/routes/
└── ProgressRoute.tsx              <- UPDATE (add InsightsPanel between Radar and History)
```

### Type Definitions

Define ALL types in `insightsEngine.ts` (co-located with the service):

```typescript
export type InsightCategory = 'milestone' | 'concern' | 'positive' | 'general';

export interface Insight {
  id: string;                    // Unique identifier (e.g., 'consistency-high-week')
  category: InsightCategory;
  icon: string;                  // Emoji: '📈' | '📊' | '⚡' | '💪' | '🎯'
  title: string;                 // Bold heading (e.g., "Great Consistency!")
  message: string;               // Detail (e.g., "You've trained 5 days this week")
  action?: {                     // Optional CTA
    label: string;               // Button text (e.g., "Start Training")
    route: string;               // Navigation target (e.g., "/training")
  };
  priority: number;              // 1=highest (milestone), 4=lowest (general)
}

export type TrendDirection = 'improving' | 'stable' | 'declining';
```

### Implementation Guidance

**`detectTrend(values: number[]): TrendDirection`**

Simple linear regression slope calculation:
```typescript
// Slope formula: n*sum(xi*yi) - sum(xi)*sum(yi) / n*sum(xi^2) - (sum(xi))^2
// Where xi = index (0,1,2,...), yi = value
// Threshold: |slope| > 0.05 -> improving/declining, else stable
// Return 'stable' if values.length < 3
```

**`calculateWeeklyConsistency(sessions: Session[]): number`**
```typescript
// Count unique dates in last 7 days from sessions[].timestamp
// Use date-fns: isWithinInterval, startOfDay, subDays
// Return count (0-7)
```

**`generateInsights(sessions: Session[], drillResults: DrillResult[]): Insight[]`**
```typescript
// 1. Run all pattern detectors -> collect insights array
// 2. Sort by priority (ascending)
// 3. Return top 3 insights only
// Pattern detectors:
//   - detectConsistencyInsights(sessions)
//   - detectPerformanceTrends(sessions, drillResults)
//   - detectTimePatterns(drillResults)
//   - detectConfidenceInsights(sessions)
```

**`useInsights()` hook pattern:**
```typescript
// Same pattern as useConfidenceData:
// 1. useState for isLoading, insights, error
// 2. useEffect to query Dexie on mount
// 3. Query: db.sessions.where('module').equals('training').reverse().limit(30).toArray()
//    (need more sessions than confidence -- 30 for trend analysis)
// 4. Join drill results by sessionId
// 5. Call generateInsights(sessions, drillResults)
// 6. Set state
```

### Testing Patterns

**insightsEngine.test.ts — Pure unit tests:**
```typescript
import { describe, it, expect } from 'vitest';
import { detectTrend, calculateWeeklyConsistency, generateInsights } from './insightsEngine';
import type { Session, DrillResult } from '@/services/storage/schemas';

// Create mock sessions with known patterns
const mockSessions: Session[] = [
  {
    timestamp: new Date().toISOString(),
    module: 'training',
    duration: 600000,
    completionStatus: 'completed',
    confidenceAfter: 4,
    confidenceChange: 1,
    accuracy: 85,
    drillCount: 10,
  },
  // ... more sessions with specific patterns
];
```

**InsightsPanel.test.tsx — Component tests:**
```typescript
// Mock the useInsights hook:
vi.mock('../hooks/useInsights', () => ({
  useInsights: vi.fn(),
}));

import { useInsights } from '../hooks/useInsights';

// Test renders insight cards
// Test empty state when no insights
// Test action buttons navigate correctly
// Test emoji accessibility attributes
```

**useInsights.test.ts — Hook tests:**
```typescript
// Mock Dexie db (same pattern as useConfidenceData.test.ts)
vi.mock('@/services/storage/db', () => ({
  db: {
    sessions: { where: vi.fn()... },
    drill_results: { where: vi.fn()... },
  },
}));
```

### Color & Styling Notes

- **Card background**: Default shadcn/ui Card (white/dark mode compatible)
- **Icon size**: `text-2xl` for emoji icons
- **Title**: `text-sm font-semibold text-foreground`
- **Message**: `text-sm text-muted-foreground`
- **Action button**: shadcn/ui `Button` variant `"outline"` size `"sm"`
- **Card layout**: Horizontal — icon on left, text+action on right (flex row)
- **Empty state text**: `text-muted-foreground text-center py-8`
- **IMPORTANT**: No `coral` Tailwind class exists. Use `text-primary` for accent colors.

### Domain Module Name Mapping

The `DrillResult.module` field uses these exact string values:
- `'number_line'` — Number Sense domain
- `'spatial_rotation'` — Spatial Awareness domain
- `'math_operations'` — Math Operations domain

Map to display names for insights:
```typescript
const MODULE_DISPLAY_NAMES: Record<string, string> = {
  'number_line': 'Number Line',
  'spatial_rotation': 'Spatial Rotation',
  'math_operations': 'Math Operations',
};
```

### date-fns 4.0 Functions Needed

```typescript
import { subDays, startOfDay, isWithinInterval, parseISO } from 'date-fns';
```
- `subDays(new Date(), 7)` — 7 days ago for weekly consistency
- `startOfDay()` — normalize dates for unique-day counting
- `isWithinInterval()` — check if session within date range
- `parseISO()` — parse ISO 8601 timestamp strings

### Previous Story Intelligence (Story 5.3)

**Learnings from Story 5.3 implementation:**
- React useEffect timing: When state changes trigger cascading useEffects, test assertions MUST use `waitFor` blocks
- Mock pattern for streakManager: `vi.mock('@/services/training/streakManager', () => ({ getCurrentStreak: vi.fn()... }))`
- `useReducedMotion()` from framer-motion: All animations must check this
- shadcn/ui Dialog import paths: `@/shared/components/ui/dialog`
- `tests/test-utils.tsx` wraps in `BrowserRouter` + `AppProvider` — use for all component rendering
- Framer Motion mock pattern used in MilestoneModal.test.tsx if animation causes test issues:
  ```typescript
  vi.mock('framer-motion', async () => {
    const actual = await vi.importActual<typeof import('framer-motion')>('framer-motion');
    return { ...actual, useReducedMotion: vi.fn().mockReturnValue(false) };
  });
  ```

**Learnings from Story 5.1/5.2:**
- Dexie chain mock pattern: `where().equals().reverse().limit().toArray()` — each returns object with next method
- `useConfidenceData` hook has `MIN_SESSIONS_REQUIRED = 3` — mirror this for InsightsPanel empty state
- `ResizeObserver` mock already in `vitest.setup.ts` — no additional setup needed
- date-fns functions: Use `format`, `isToday`, `isYesterday`, `formatDistanceToNow` for display

### Project Structure Notes

- `insightsEngine.ts` goes in `features/progress/services/` (co-located with confidenceCalculator)
- `InsightsPanel.tsx` goes in `features/progress/components/` (co-located with ConfidenceRadar, SessionHistory)
- `useInsights.ts` goes in `features/progress/hooks/` (co-located with useConfidenceData, useSessionHistory)
- All types defined inline in `insightsEngine.ts` — do NOT create separate type file (types/ has only .gitkeep)
- Update `features/progress/index.ts` with new exports following existing pattern

### References

- [Architecture: Decision Summary](docs/architecture.md#decision-summary) - Tech stack versions
- [Architecture: Data Architecture](docs/architecture.md#data-architecture) - Dexie schema, table structures
- [Architecture: Implementation Patterns](docs/architecture.md#implementation-patterns) - Naming conventions, testing standards
- [Epics: Story 5.4](docs/epics.md) - Line 1855: Original requirements with insight categories
- [Epics: Epic 5 Goal](docs/epics.md) - Line 1668: Progress tracking epic goal
- [PRD: Success Criteria](docs/PRD.md) - Self-reported confidence ratings, instrumentation
- [PRD: Innovation Patterns](docs/PRD.md) - Confidence x Time radar view
- [UX Spec: Progress Dashboard](docs/ux-design-specification.md) - Insight cards design
- [confidenceCalculator.ts](src/features/progress/services/confidenceCalculator.ts) - Domain confidence, weighted average
- [useConfidenceData.ts](src/features/progress/hooks/useConfidenceData.ts) - Dexie query pattern, min sessions
- [useSessionHistory.ts](src/features/progress/hooks/useSessionHistory.ts) - Session+drill join pattern
- [dateFormatters.ts](src/features/progress/utils/dateFormatters.ts) - Date formatting utilities
- [schemas.ts](src/services/storage/schemas.ts) - Session, DrillResult, all data interfaces
- [db.ts](src/services/storage/db.ts) - Dexie database class with indexed fields
- [ProgressRoute.tsx](src/routes/ProgressRoute.tsx) - Integration target (add InsightsPanel)
- [Story 5.3](docs/stories/33-story-53-integrate-streak-counter-on-home-screen.md) - Previous story learnings

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

### Completion Notes List

- All 4 tasks implemented with red-green-refactor cycle
- insightsEngine.ts: Linear regression trend detection, 5 pattern detectors (milestone, consistency, performance, time, confidence), priority sorting, max 3 insights
- useInsights hook: Queries last 30 training sessions from Dexie, joins drill results, generates insights, exposes refetch()
- InsightsPanel component: shadcn/ui Card layout with emoji icons (role="img" + aria-label), action buttons with 44px min touch target, empty state, loading/error states
- Integrated into ProgressRoute between Confidence Radar and Session History
- ProgressRoute integration test verifies correct component ordering
- TypeScript clean (`tsc --noEmit` passes with zero errors)
- 46 new tests (23 service + 8 hook + 11 component + 5 route), 136 total progress feature tests passing

**Code Review Fixes Applied (8 issues):**
- [HIGH] Marked all task checkboxes as [x] (were all [ ])
- [HIGH] Added `min-h-[44px]` to action buttons for AC-7 touch target compliance
- [MEDIUM] Added `detectMilestoneInsights()` for AC-4 Priority 1 session-count milestones (5, 10, 25, 50)
- [MEDIUM] Created `ProgressRoute.test.tsx` with 5 integration tests (Task 4.1)
- [MEDIUM] Added `refetch` function to `useInsights` hook (consistent with useConfidenceData API)
- [LOW] Fixed improvement message bug when improvement === 0 (was producing "improved % recently!")
- [LOW] Changed `new Date()` to `parseISO()` in detectPerformanceTrends for consistency
- [LOW] Updated InsightsPanel test helper to use `Omit<UseInsightsResult, 'refetch'>` pattern

### File List

**Created:**
- `src/features/progress/services/insightsEngine.ts` — Insights engine service with types, trend detection, pattern generators
- `src/features/progress/services/insightsEngine.test.ts` — 23 unit tests for insights engine
- `src/features/progress/hooks/useInsights.ts` — Hook to fetch data + generate insights + refetch
- `src/features/progress/hooks/useInsights.test.ts` — 8 hook tests with Dexie mocks
- `src/features/progress/components/InsightsPanel.tsx` — Display component with insight cards
- `src/features/progress/components/InsightsPanel.test.tsx` — 11 component tests
- `src/routes/ProgressRoute.test.tsx` — 5 integration tests for ProgressRoute

**Modified:**
- `src/routes/ProgressRoute.tsx` — Added InsightsPanel between Confidence Radar and Session History
- `src/features/progress/index.ts` — Added InsightsPanel, useInsights, insightsEngine exports
