# Story 5.2: Build Session History View

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **user reviewing my past practice**,
I want **a chronological list of all my training sessions with key metrics**,
so that **I can see my consistency and spot patterns in my performance**.

## Acceptance Criteria

### AC-1: Session Card List
**Given** Confidence Radar is implemented (Story 5.1 complete)
**When** I scroll down on the `/progress` route below the Confidence Radar
**Then** the SessionHistory component renders a card-based list with:
- One card per training session (shadcn/ui Card)
- Chronological order: most recent first
- Each session card displays:
  - **Date**: "Today", "Yesterday", or "Mon, Nov 4" (date-fns format)
  - **Time**: "2:30 PM" (12-hour format)
  - **Duration**: "12 minutes" (formatted from session.duration milliseconds)
  - **Drill Count**: "12 drills" with module breakdown (e.g., "6 Number Line, 3 Spatial, 3 Operations")
  - **Accuracy**: "85%" with colored badge (green >80%, yellow 60-80%, red <60%)
  - **Confidence Change**: "+2" with emoji (or "No change" or "-1" with appropriate emoji)

### AC-2: Visual Design
**Given** the session cards render
**Then** visual requirements are met:
- Cards: 8px margin between (`gap-2`), 16px padding (`p-4`), subtle shadow (`shadow-sm`)
- Accuracy badge: Pill shape (`rounded-full`), 24px height, colored background
- Confidence change: Inline with icon, mint color for positive, coral for negative
- Date header groups: Sticky when scrolling ("Today", "This Week", "Earlier")

### AC-3: Expandable Drill Breakdown (Accordion)
**Given** a session card is displayed
**When** the user taps/clicks a session card
**Then** the card expands (accordion) to show drill-by-drill breakdown:
- List of all drills with module icons (number_line, spatial_rotation, math_operations)
- Each drill shows: Correct/incorrect icon, time taken (formatted)
- Magic Minute indicator if session included Magic Minute

### AC-4: Pagination
**Given** session data exists in Dexie
**When** SessionHistory component renders
**Then** data loading follows:
- Loads 30 most recent sessions initially
- "Load More" button at bottom loads next 30 sessions
- Query uses Dexie indexed field for performance
- Loading state shown during data fetch

### AC-5: Empty State
**Given** no training sessions exist
**When** SessionHistory renders
**Then** an empty state appears:
- Message: "No training sessions yet. Start your first session!"
- Button: "Start Training" navigates to `/training`

### AC-6: Accessibility
**Given** SessionHistory renders
**Then** accessibility requirements are met:
- All cards are keyboard navigable
- Accordion has proper ARIA attributes (aria-expanded, aria-controls)
- Screen reader announces session summary
- Color badges have text labels (not color-only)
- 44px minimum tap targets

## Tasks / Subtasks

- [x] **Task 0: Install shadcn/ui Accordion** (AC: #3)
  - [x] 0.1 Run `npx shadcn@latest add accordion` to install component
  - [x] 0.2 Verify `src/shared/components/ui/accordion.tsx` exists

- [x] **Task 1: Create useSessionHistory hook** (AC: #1, #4)
  - [x] 1.1 Create `src/features/progress/hooks/useSessionHistory.ts`
  - [x] 1.2 Write failing test for hook returning loading state initially
  - [x] 1.3 Write failing test for hook returning session data with drill results
  - [x] 1.4 Implement Dexie query: `db.sessions.where('module').equals('training').reverse().limit(PAGE_SIZE).toArray()`
  - [x] 1.5 Implement drill results join: `db.drill_results.where('sessionId').anyOf(sessionIds).toArray()`
  - [x] 1.6 Write failing test for loadMore pagination (offset by PAGE_SIZE)
  - [x] 1.7 Implement loadMore with offset tracking
  - [x] 1.8 Write failing test for hasMore flag (false when fewer results than PAGE_SIZE returned)
  - [x] 1.9 Implement hasMore detection
  - [x] 1.10 Verify all hook tests pass

- [x] **Task 2: Create date formatting utilities** (AC: #1)
  - [x] 2.1 Create `src/features/progress/utils/dateFormatters.ts`
  - [x] 2.2 Write failing tests for formatSessionDate ("Today", "Yesterday", "Mon, Nov 4")
  - [x] 2.3 Implement using date-fns: `isToday()`, `isYesterday()`, `format(date, 'EEE, MMM d')`
  - [x] 2.4 Write failing test for formatSessionTime ("2:30 PM")
  - [x] 2.5 Implement using date-fns: `format(date, 'h:mm a')`
  - [x] 2.6 Write failing test for formatDuration ("12 minutes", "1 minute", "< 1 minute")
  - [x] 2.7 Implement duration formatting from milliseconds
  - [x] 2.8 Write failing test for groupSessionsByDate (returns "Today", "This Week", "Earlier" groups)
  - [x] 2.9 Implement date grouping logic
  - [x] 2.10 Verify all tests pass

- [x] **Task 3: Create SessionCard component** (AC: #1, #2, #3)
  - [x] 3.1 Create `src/features/progress/components/SessionCard.tsx`
  - [x] 3.2 Write failing test: card renders with session date/time/duration
  - [x] 3.3 Implement card header with formatted date, time, duration
  - [x] 3.4 Write failing test: card shows drill count with module breakdown
  - [x] 3.5 Implement drill count and module breakdown display
  - [x] 3.6 Write failing test: accuracy badge renders with correct color (green/yellow/red)
  - [x] 3.7 Implement accuracy badge with conditional color classes
  - [x] 3.8 Write failing test: confidence change displays with emoji
  - [x] 3.9 Implement confidence change indicator
  - [x] 3.10 Write failing test: accordion expands to show drill breakdown
  - [x] 3.11 Implement Accordion-based expansion with drill-by-drill list
  - [x] 3.12 Verify all tests pass

- [x] **Task 4: Create SessionHistory component** (AC: #1, #2, #4, #5)
  - [x] 4.1 Create `src/features/progress/components/SessionHistory.tsx`
  - [x] 4.2 Write failing test: renders loading state
  - [x] 4.3 Implement loading spinner display
  - [x] 4.4 Write failing test: renders empty state when no sessions
  - [x] 4.5 Implement empty state with "Start Training" button navigating to `/training`
  - [x] 4.6 Write failing test: renders list of SessionCards grouped by date
  - [x] 4.7 Implement date-grouped session card list with sticky headers
  - [x] 4.8 Write failing test: "Load More" button appears when hasMore is true
  - [x] 4.9 Implement "Load More" button calling hook's loadMore function
  - [x] 4.10 Write failing test: "Load More" button hidden when hasMore is false
  - [x] 4.11 Verify all tests pass

- [x] **Task 5: Add accessibility** (AC: #6)
  - [x] 5.1 Keyboard navigable via Radix Accordion (built-in Tab/Enter/Space)
  - [x] 5.2 Accordion has ARIA attributes via Radix (aria-expanded, aria-controls)
  - [x] 5.3 ARIA labels on AccordionTrigger, aria-hidden on decorative emojis
  - [x] 5.4 Accuracy badge has sr-only text label (Good/Fair/Needs work)
  - [x] 5.5 All accessibility tests pass (included in Tasks 3-4)

- [x] **Task 6: Integrate with ProgressRoute** (AC: #1)
  - [x] 6.1 Update `src/routes/ProgressRoute.tsx` to import and render SessionHistory below ConfidenceRadar
  - [x] 6.2 SessionHistory component self-contained with own data fetching
  - [x] 6.3 Update `src/features/progress/index.ts` with new exports
  - [x] 6.4 All tests pass
  - [x] 6.5 Manual verification pending

## Dev Notes

### File Locations (MANDATORY)

```
src/features/progress/
├── components/
│   ├── ConfidenceRadar.tsx          (EXISTING - Story 5.1)
│   ├── ConfidenceRadar.test.tsx     (EXISTING)
│   ├── SessionCard.tsx              <- NEW (this story)
│   ├── SessionCard.test.tsx         <- NEW (tests)
│   ├── SessionHistory.tsx           <- NEW (this story)
│   └── SessionHistory.test.tsx      <- NEW (tests)
├── hooks/
│   ├── useConfidenceData.ts         (EXISTING - Story 5.1)
│   ├── useConfidenceData.test.ts    (EXISTING)
│   ├── useSessionHistory.ts         <- NEW (data hook)
│   └── useSessionHistory.test.ts    <- NEW (tests)
├── utils/
│   ├── dateFormatters.ts            <- NEW (date utilities)
│   └── dateFormatters.test.ts       <- NEW (tests)
├── services/
│   └── confidenceCalculator.ts      (EXISTING - Story 5.1)
└── index.ts                         <- UPDATE (add exports)

src/routes/
└── ProgressRoute.tsx                <- UPDATE (integrate SessionHistory)

src/shared/components/ui/
└── accordion.tsx                    <- NEW (shadcn/ui install)
```

### CRITICAL: Do NOT Reinvent - Reuse These Existing Patterns

**1. Data fetching hook pattern - Clone `useConfidenceData.ts` and extend with:**
```typescript
// SAME foundation as useConfidenceData (useState, useCallback, useEffect, try/catch/finally)
// ADD these differences for useSessionHistory:

// 1. Pagination state (NEW - not in useConfidenceData)
const offsetRef = useRef(0);
const PAGE_SIZE = 30;
const [hasMore, setHasMore] = useState(true);

// 2. Query chain includes .offset() (NEW - not used in useConfidenceData)
const results = await db.sessions
  .where('module').equals('training')
  .reverse()
  .offset(offset)        // <-- NEW for pagination
  .limit(PAGE_SIZE)
  .toArray();

// 3. Filter completed sessions only (NEW)
const completed = results.filter(s => s.completionStatus === 'completed');

// 4. Join drill results (SAME pattern as useConfidenceData)
const sessionIds = completed.map(s => s.id!).filter(Boolean);
const drillResults = await db.drill_results.where('sessionId').anyOf(sessionIds).toArray();

// 5. Map sessions with their drills (NEW)
const sessionsWithDrills = completed.map(s => ({
  ...s,
  drills: drillResults.filter(dr => dr.sessionId === s.id),
}));

// 6. loadMore function: increment offsetRef, append to existing sessions
// 7. hasMore: set false when results.length < PAGE_SIZE
```

**2. Dexie query patterns from `db.ts`:**
```typescript
// Sessions query (uses 'module' index)
db.sessions.where('module').equals('training').reverse().offset(offset).limit(30).toArray()

// Drill results join (uses 'sessionId' index)
db.drill_results.where('sessionId').anyOf(sessionIds).toArray()
```
**NOTE on `completionStatus`:** Sessions can be `"completed" | "abandoned" | "paused"`. Only show `"completed"` sessions in the history. After the Dexie query, filter: `results.filter(s => s.completionStatus === 'completed')`. This prevents showing incomplete/abandoned sessions that would confuse users.

**3. Database indexes available (from db.ts schema v2):**
```
sessions: '++id, timestamp, module, [timestamp+module]'
drill_results: '++id, sessionId, timestamp, module, [sessionId+module]'
```

**4. UI component reuse:**
- `Card, CardHeader, CardContent` from `@/shared/components/ui/card`
- `Button` from `@/shared/components/ui/button`
- `LoadingSpinner` from `@/shared/components/LoadingSpinner`
- `Accordion, AccordionItem, AccordionTrigger, AccordionContent` from `@/shared/components/ui/accordion` (install first!)

### Session & DrillResult Interfaces (from schemas.ts)

```typescript
// Session fields relevant to this story:
interface Session {
  id?: number;
  timestamp: string;          // ISO 8601 - use for date/time display
  module: string;             // Filter by 'training'
  duration: number;           // Milliseconds - format as "X minutes"
  completionStatus: "completed" | "abandoned" | "paused";
  drillQueue?: string[];      // Array of drill type names for breakdown
  confidenceBefore?: number;  // 1-5 scale
  confidenceAfter?: number;   // 1-5 scale
  confidenceChange?: number;  // Computed difference
  drillCount?: number;        // Total drills in session
  accuracy?: number;          // 0-100 percentage
}

// DrillResult fields relevant to this story:
interface DrillResult {
  id?: number;
  sessionId: number;          // FK to sessions.id for join
  module: 'number_line' | 'spatial_rotation' | 'math_operations';
  difficulty: 'easy' | 'medium' | 'hard';
  isCorrect: boolean;
  timeToAnswer: number;       // Milliseconds
  problem?: string;           // Display in breakdown
  operation?: string;         // For math operations
}
```

### date-fns Functions (ALREADY INSTALLED v4.0.0)

```typescript
import { format, isToday, isYesterday, isThisWeek } from 'date-fns';

// Date display: "Today", "Yesterday", or "Mon, Nov 4"
function formatSessionDate(timestamp: string): string {
  const date = new Date(timestamp);
  if (isToday(date)) return 'Today';
  if (isYesterday(date)) return 'Yesterday';
  return format(date, 'EEE, MMM d');
}

// Time display: "2:30 PM"
function formatSessionTime(timestamp: string): string {
  return format(new Date(timestamp), 'h:mm a');
}

// Duration display: "12 minutes"
function formatDuration(ms: number): string {
  const minutes = Math.round(ms / 60000);
  if (minutes < 1) return '< 1 minute';
  if (minutes === 1) return '1 minute';
  return `${minutes} minutes`;
}

// Group sessions by date category for sticky headers
function groupSessionsByDate(sessions: Session[]): Map<string, Session[]> {
  // "Today", "This Week", "Earlier"
}
```

### Module Display Mapping

```typescript
const MODULE_DISPLAY: Record<string, { label: string; icon: string }> = {
  'number_line':       { label: 'Number Line',       icon: '📏' },
  'spatial_rotation':  { label: 'Spatial Rotation',   icon: '🔄' },
  'math_operations':   { label: 'Math Operations',    icon: '➕' },
};

// Render emoji with accessibility: hide from screen readers, use label as text
// <span aria-hidden="true">{icon}</span>
// <span className="sr-only">{label}</span>
```

### Accuracy Badge Color Logic

```typescript
function getAccuracyColor(accuracy: number): string {
  if (accuracy >= 80) return 'bg-green-100 text-green-800';      // Green (>80%)
  if (accuracy >= 60) return 'bg-yellow-100 text-yellow-800';    // Yellow (60-80%)
  return 'bg-red-100 text-red-800';                               // Red (<60%)
}
// IMPORTANT: There is NO 'coral' color in the Tailwind config.
// The primary color (#E87461) is coral-like but registered as 'primary'.
// Use 'bg-red-100 text-red-800' for <60% accuracy badges.
```

### Confidence Change Display

```typescript
function formatConfidenceChange(change: number | undefined): { text: string; emoji: string; color: string } {
  if (!change || change === 0) return { text: 'No change', emoji: '😐', color: 'text-gray-500' };
  if (change > 0) return { text: `+${change}`, emoji: '😊', color: 'text-emerald-600' };
  return { text: `${change}`, emoji: '😟', color: 'text-red-500' };
}
```

### Testing Patterns (from Story 5.1)

**IMPORTANT: `.offset()` is a NEW Dexie chain method not used in existing codebase tests.**
The existing `useConfidenceData.test.ts` mock chain does NOT include `.offset()`. You MUST add it for pagination tests. Follow this updated pattern:

**Mock Dexie for hook tests (use chain-style mocks like `useConfidenceData.test.ts`):**
```typescript
vi.mock('@/services/storage/db', () => ({
  db: {
    sessions: { where: vi.fn() },
    drill_results: { where: vi.fn() },
  },
}));

import { db } from '@/services/storage/db';

// In each test, build the chain mock:
const sessionsChain = {
  equals: vi.fn().mockReturnThis(),
  reverse: vi.fn().mockReturnThis(),
  offset: vi.fn().mockReturnThis(),   // NEW: required for pagination
  limit: vi.fn().mockReturnThis(),
  toArray: vi.fn().mockResolvedValue(mockSessions),
};
vi.mocked(db.sessions.where).mockReturnValue(sessionsChain as any);

const drillsChain = {
  anyOf: vi.fn().mockReturnThis(),
  toArray: vi.fn().mockResolvedValue(mockDrillResults),
};
vi.mocked(db.drill_results.where).mockReturnValue(drillsChain as any);
```

**Mock session data fixture:**
```typescript
const mockSessions: Session[] = [
  {
    id: 1,
    timestamp: new Date().toISOString(),  // Today
    module: 'training',
    duration: 720000,  // 12 minutes
    completionStatus: 'completed',
    drillCount: 12,
    accuracy: 85,
    confidenceBefore: 3,
    confidenceAfter: 4,
    confidenceChange: 1,
    drillQueue: ['number_line', 'spatial_rotation', 'math_operations'],
  },
  // ... more sessions
];

const mockDrillResults: DrillResult[] = [
  {
    id: 1,
    sessionId: 1,
    timestamp: new Date().toISOString(),
    module: 'number_line',
    difficulty: 'easy',
    isCorrect: true,
    timeToAnswer: 3500,
    accuracy: 100,
  },
  // ... more drill results
];
```

**Mock react-router-dom for navigation (MUST use `react-router-dom`, not `react-router`):**
```typescript
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});
```
**Component test wrappers:** Use `MemoryRouter` from `react-router-dom` or the project's existing `tests/test-utils.tsx` which provides a custom render with `BrowserRouter`:
```typescript
import { MemoryRouter } from 'react-router-dom';
render(<MemoryRouter><SessionHistory /></MemoryRouter>);
```

### Previous Story Intelligence (Story 5.1)

**Learnings from Story 5.1 implementation:**
- Added ResizeObserver mock to `vitest.setup.ts` for Recharts testing
- Fixed test for weighted average calculation (test expectation was incorrect)
- Used `React.memo()` for chart component performance
- Used `useCallback` for data fetching to prevent unnecessary re-fetches
- `useEffect` cleanup not needed for Dexie queries (they resolve quickly)
- ConfidenceRadar renders inside `ProgressRoute.tsx` with loading/error/empty state pattern

**Files created/modified in 5.1:**
- `src/features/progress/services/confidenceCalculator.ts` (calculation logic)
- `src/features/progress/components/ConfidenceRadar.tsx` (chart component)
- `src/features/progress/hooks/useConfidenceData.ts` (data hook)
- `src/routes/ProgressRoute.tsx` (integration)
- `src/features/progress/index.ts` (exports)

### Performance Considerations

- Use `React.memo()` on SessionCard to prevent unnecessary re-renders
- Use `useMemo` for date grouping calculations
- Dexie `.offset()` + `.limit()` for pagination (NOT loading all records)
- Consider `react-window` only if user reports >100 sessions (not needed for MVP)

### Accessibility Requirements (WCAG 2.1 AA)

- Cards must be keyboard navigable (tab/Enter to expand)
- Accordion uses shadcn/ui built-in ARIA support
- Accuracy badges: include sr-only text for color meaning (e.g., `<span className="sr-only">Good</span>`)
- Confidence emoji: use `aria-hidden="true"` on emoji span + separate `sr-only` label
- Module icons (emoji): use `aria-hidden="true"` on emoji + `sr-only` text with module label
- Empty state button: proper focus management
- 44px minimum tap targets for all interactive elements

### Project Structure Notes

- **Path alignment:** All files follow feature-based organization (`features/progress/`)
- **Naming convention:** PascalCase components, camelCase hooks/services/utils
- **Test co-location:** Tests alongside source files (`.test.tsx` / `.test.ts`)
- **Index exports:** Update `features/progress/index.ts` with public API

### Test Utilities

- **`tests/test-utils.tsx`**: Existing custom render wrapper with `BrowserRouter`. Can simplify component tests:
```typescript
import { render } from '../../tests/test-utils';
// Automatically wraps in BrowserRouter
```

### References

- [Architecture: Decision Summary](docs/architecture.md#decision-summary) - Tech stack versions
- [Architecture: Dexie Schema](docs/architecture.md#dexie-schema) - Database indexes
- [Architecture: Project Structure](docs/architecture.md#project-structure) - Feature-based organization
- [Epics: Story 5.2](docs/epics.md#story-52-build-session-history-view) - Original requirements
- [Schema: Session interface](src/services/storage/schemas.ts) - Session fields
- [Schema: DrillResult interface](src/services/storage/schemas.ts) - DrillResult fields
- [DB: Compound indexes](src/services/storage/db.ts) - Query optimization
- [Story 5.1: ConfidenceRadar](docs/stories/31-story-51-build-confidence-radar-chart-component.md) - Previous story patterns
- [ProgressRoute](src/routes/ProgressRoute.tsx) - Integration target

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (claude-opus-4-6)

### Debug Log References

- Fixed shadcn accordion import: `@/shared/lib/utils` → `@/lib/utils` (shadcn installer generated wrong path)
- Fixed `formatDuration` rounding: Changed `Math.round` to `Math.floor` so 30s returns "< 1 minute" not "1 minute"
- Fixed SessionCard test: "Spatial Rotation" appears in both sr-only span and fallback text span when drill has no `problem` field; used `getAllByText` with class check
- Fixed SessionHistory test: "Today" appears in both date group header and SessionCard date display; used `getAllByText`
- Made `groupSessionsByDate` generic (`<T extends Session>`) so it preserves `SessionWithDrills` type through the grouping

**Code Review Fixes:**
- H1: Implemented Magic Minute indicator (AC-3) — added `hasMagicMinute` flag to `SessionWithDrills`, queried `db.magic_minute_sessions` via `Promise.all`, added amber badge in SessionCard drill breakdown
- M1: Added explanatory comment to pagination `hasMore` about pre-filter count trade-off
- M2: Fixed duplicate sr-only text for drills without `problem` field — conditional rendering
- M3: Removed dead `within` import from SessionHistory.test.tsx
- L2: Added NaN guard to `formatConfidenceChange` using `Number.isFinite()`

### Completion Notes List

- **Task 0**: Installed shadcn/ui Accordion. Fixed import path from `@/shared/lib/utils` to `@/lib/utils`.
- **Task 1**: Created useSessionHistory hook with Dexie pagination (PAGE_SIZE=30), completionStatus filter, drill results join, Magic Minute detection. All 9 tests pass.
- **Task 2**: Created date formatting utilities with formatSessionDate, formatSessionTime, formatDuration, groupSessionsByDate. All 14 tests pass.
- **Task 3**: Created SessionCard component with Accordion expansion, accuracy badges (green/yellow/red), confidence change with emoji, drill-by-drill breakdown, Magic Minute indicator. React.memo for performance. All 18 tests pass.
- **Task 4**: Created SessionHistory component with loading/error/empty states, date-grouped cards with sticky headers, "Load More" pagination button. All 9 tests pass.
- **Task 5**: Accessibility already built into Tasks 3-4: sr-only text for badges/emojis/icons, aria-hidden on decorative elements, aria-label on triggers, 44px min tap targets, keyboard navigation via Radix Accordion.
- **Task 6**: Updated ProgressRoute to render SessionHistory below ConfidenceRadar. Updated progress/index.ts with all new exports.

### File List

**Created:**
- src/shared/components/ui/accordion.tsx (shadcn/ui install)
- src/features/progress/hooks/useSessionHistory.ts
- src/features/progress/hooks/useSessionHistory.test.ts
- src/features/progress/utils/dateFormatters.ts
- src/features/progress/utils/dateFormatters.test.ts
- src/features/progress/components/SessionCard.tsx
- src/features/progress/components/SessionCard.test.tsx
- src/features/progress/components/SessionHistory.tsx
- src/features/progress/components/SessionHistory.test.tsx

**Updated:**
- src/features/progress/index.ts (new exports)
- src/routes/ProgressRoute.tsx (SessionHistory integration)

### Test Summary

- **50 new tests** added across 4 test files (47 original + 3 from code review)
- All new tests passing (50/50)
- Full test suite: 1228 passing, 34 pre-existing failures unrelated to this story
