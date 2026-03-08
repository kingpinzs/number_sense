# Story 5.5: Build Data Export Functionality

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **user who wants to track my data externally**,
I want **to export my training data in CSV or JSON format**,
so that **I can analyze it in spreadsheets or back it up**.

## Acceptance Criteria

### AC-1: Export Format Buttons
**Given** I navigate to `/progress` route and scroll to the Data Export section (below Session History)
**When** the DataExport component renders
**Then** two export format buttons are displayed:
- "Export as CSV" (for spreadsheet apps like Excel/Sheets)
- "Export as JSON" (for technical users/backups)

### AC-2: Date Range Selector
**Given** the Data Export section is visible
**When** I interact with the date range selector
**Then** four options are available:
- "Last 7 days"
- "Last 30 days"
- "Last 90 days"
- "All time" (default)

### AC-3: Export Data Content
**Given** I select a date range and click an export button
**When** the export generates
**Then** the exported file includes:
- All sessions in the selected date range
- All drill results for those sessions
- Assessment results (if any exist)
- User settings and current streak data

### AC-4: CSV Format
**Given** I click "Export as CSV"
**Then** the CSV file contains two sections separated by a blank line:

**Section 1 - Sessions:**
```csv
Session ID,Date,Time,Module,Duration (ms),Drill Count,Accuracy,Confidence Before,Confidence After,Confidence Change
1,2026-02-07,10:00,training,600000,10,85,2,4,2
```

**Section 2 - Drill Results:**
```csv
Drill ID,Session ID,Timestamp,Module,Difficulty,Correct,Time (ms),Accuracy
1,1,2026-02-07T10:01:00Z,number_line,medium,true,2000,85
```

- Values containing commas or quotes are properly escaped (RFC 4180)
- Empty/undefined fields export as empty strings

### AC-5: JSON Format
**Given** I click "Export as JSON"
**Then** the JSON file has this structure:
```json
{
  "exportDate": "2026-02-07T14:30:00Z",
  "dateRange": "all_time",
  "sessions": [...],
  "drillResults": [...],
  "assessments": [...],
  "userSettings": {...},
  "streak": 5
}
```

### AC-6: Export Trigger and Download
**Given** I click an export button
**When** the export generates successfully
**Then:**
- File downloads immediately (no server call, all local)
- Filename format: `discalculas-export-YYYY-MM-DD.csv` or `.json`
- Toast notification: "Export complete! Check your downloads."

### AC-7: Data Privacy Notice
**Given** the Data Export section renders
**Then** text above the export buttons reads: "Your data stays on your device. Exports are created locally."

### AC-8: Empty State
**Given** no sessions exist in the database
**When** the Data Export section renders
**Then:**
- Both export buttons are disabled
- Message shows: "No data to export yet"

### AC-9: Empty Date Range
**Given** sessions exist but none match the selected date range
**When** I click an export button
**Then** a toast shows: "No sessions found in selected date range"
- No file download is triggered

### AC-10: Accessibility
- Export buttons meet 44px minimum touch target (`min-h-[44px]`)
- Date range selector is keyboard navigable
- Buttons have clear accessible names
- Privacy notice has semantic paragraph element
- Disabled buttons convey disabled state to screen readers (`aria-disabled`)

## Tasks / Subtasks

- [x] **Task 1: Create CSV formatter utility** (AC: #4)
  - [x] 1.1 Define `DateRange` type and `ExportData` interface in `csvFormatter.ts`
  - [x] 1.2 Write failing test: `formatSessionsCSV()` returns correct header + data rows
  - [x] 1.3 Write failing test: `formatDrillResultsCSV()` returns correct header + data rows
  - [x] 1.4 Write failing test: `generateFullCSV()` combines sessions + drills separated by blank line
  - [x] 1.5 Write failing test: CSV values with commas/quotes are properly escaped (RFC 4180)
  - [x] 1.6 Write failing test: empty/undefined fields export as empty strings
  - [x] 1.7 Implement `csvFormatter.ts` with all formatter functions
  - [x] 1.8 Verify all tests pass (21/21)

- [x] **Task 2: Create `useDataExport` hook** (AC: #2, #3, #6, #8, #9)
  - [x] 2.1 Write failing test: hook returns initial state with `dateRange='all_time'` and `isExporting=false`
  - [x] 2.2 Write failing test: `hasData` is false when no sessions exist
  - [x] 2.3 Write failing test: `hasData` is true when sessions exist
  - [x] 2.4 Write failing test: `exportCSV()` calls `downloadCSVData` with CSV content and correct filename
  - [x] 2.5 Write failing test: `exportJSON()` calls `downloadExportedData` with JSON content and correct filename
  - [x] 2.6 Write failing test: `setDateRange()` updates date range and re-checks data availability
  - [x] 2.7 Write failing test: export shows toast "No sessions found in selected date range" when range is empty
  - [x] 2.8 Implement `useDataExport` hook
  - [x] 2.9 Verify all tests pass (9/9)

- [x] **Task 3: Build `DataExport` component** (AC: #1, #2, #7, #8, #10)
  - [x] 3.1 Write failing test: renders "Export Your Data" heading
  - [x] 3.2 Write failing test: renders privacy notice text
  - [x] 3.3 Write failing test: renders date range selector with 4 options
  - [x] 3.4 Write failing test: renders "Export as CSV" and "Export as JSON" buttons
  - [x] 3.5 Write failing test: disables buttons when `hasData` is false
  - [x] 3.6 Write failing test: shows "No data to export yet" in empty state
  - [x] 3.7 Write failing test: clicking CSV button calls `exportCSV()`
  - [x] 3.8 Write failing test: clicking JSON button calls `exportJSON()`
  - [x] 3.9 Write failing test: buttons have `min-h-[44px]` for touch target
  - [x] 3.10 Implement `DataExport` component
  - [x] 3.11 Verify all tests pass (14/14)

- [x] **Task 4: Integrate into ProgressRoute** (AC: #1)
  - [x] 4.1 Write failing test: ProgressRoute renders DataExport section after SessionHistory
  - [x] 4.2 Add DataExport below SessionHistory in `ProgressRoute.tsx`
  - [x] 4.3 Update `src/features/progress/index.ts` with new exports
  - [x] 4.4 Verify all tests pass (50/50), TypeScript clean (`tsc --noEmit`)

## Dev Notes

### CRITICAL: Do NOT Reinvent - Reuse These Existing Components

**1. exportData.ts -- REUSE download/export functions (DO NOT recreate):**
```
Existing: src/services/storage/exportData.ts
```
- `downloadExportedData(data, filename)` -- creates Blob, triggers `<a download>`, cleans up URL
- `createDownloadUrl(data, filename)` -- creates Blob URL from JSON data
- `exportAllTrainingData()` -- returns `{ sessions, drillResults, telemetryLogs, exportedAt }`
- `exportSessionsInRange(startDate, endDate)` -- filters sessions by date range
- **EXTEND** this file for CSV download: add `downloadCSVData(csvString, filename)` that creates Blob with `text/csv` MIME type
- **IMPORT** `downloadExportedData` for JSON export -- do NOT write a new download helper

**2. Dexie database queries -- REUSE existing patterns:**
```
Existing: src/services/storage/db.ts
```
- `db.sessions.where('timestamp').between(start, end).toArray()` -- date range query
- `db.drill_results.where('sessionId').anyOf(ids).toArray()` -- join drills to sessions
- `db.assessments.toArray()` -- get all assessments
- Use compound index `[timestamp+module]` for efficient session queries

**3. localStorage utilities -- REUSE for settings and streak:**
```
Existing: src/services/storage/localStorage.ts
```
- `getUserSettings()` -- returns `UserSettings` with defaults
- `getStreak()` -- returns current streak count
- `STORAGE_KEYS` -- all namespaced storage keys
- **IMPORT** these for JSON export's `userSettings` and `streak` fields

**4. Toast notifications -- Use Sonner directly:**
```
import { toast } from 'sonner';
```
- `toast.success('Export complete! Check your downloads.')` -- success toast
- `toast('No sessions found in selected date range')` -- info toast
- **Do NOT** import from `@/shared/components/ui/toast` -- use `sonner` directly (project convention)

**5. shadcn/ui components -- ALREADY INSTALLED:**
```
Existing: src/shared/components/ui/
```
- `Card`, `CardContent`, `CardHeader`, `CardTitle` -- for section wrapper
- `Button` -- for export buttons
- `Select`, `SelectContent`, `SelectItem`, `SelectTrigger`, `SelectValue` -- for date range dropdown
- **Check** if Select is installed: `src/shared/components/ui/select.tsx`
- If Select is NOT installed, use a simple `<select>` element or radio button group with Tailwind styling

**6. date-fns 4.0 -- Use for date calculations:**
```typescript
import { subDays, format, parseISO } from 'date-fns';
```
- `subDays(new Date(), 7)` for "Last 7 days" filter
- `format(new Date(), 'yyyy-MM-dd')` for filename date
- `format(parseISO(timestamp), 'yyyy-MM-dd')` for CSV date column
- `format(parseISO(timestamp), 'HH:mm')` for CSV time column

**7. schemas.ts -- Use these exact types:**
```
Existing: src/services/storage/schemas.ts
```
Key types for export:
- `Session`: `id?`, `timestamp`, `module`, `duration`, `completionStatus`, `confidenceBefore?`, `confidenceAfter?`, `confidenceChange?`, `accuracy?`, `drillCount?`
- `DrillResult`: `id?`, `sessionId`, `timestamp`, `module`, `difficulty`, `isCorrect`, `timeToAnswer`, `accuracy`, `targetNumber?`, `userAnswer?`, `correctAnswer?`
- `Assessment`: `id?`, `timestamp`, `status`, `totalQuestions`, `correctAnswers`, `weaknesses`, `strengths`, `recommendations`
- Module types: `'number_line' | 'spatial_rotation' | 'math_operations'`

### NO papaparse -- Use Custom CSV Serializer

The `papaparse` library is NOT installed. Do NOT add it. Write a simple custom CSV formatter:
- Escape values containing commas by wrapping in double quotes
- Escape double quotes by doubling them (`"` -> `""`)
- Handle undefined/null as empty string
- This is ~30 lines of code, no library needed

### File Locations (MANDATORY)

```
src/features/progress/utils/
├── csvFormatter.ts               <- NEW (CSV generation utilities)
└── csvFormatter.test.ts          <- NEW (unit tests)

src/features/progress/hooks/
├── useDataExport.ts              <- NEW (export logic hook)
└── useDataExport.test.ts         <- NEW (hook tests)

src/features/progress/components/
├── DataExport.tsx                <- NEW (UI component)
└── DataExport.test.tsx           <- NEW (component tests)

src/features/progress/
└── index.ts                      <- UPDATE (add DataExport, useDataExport exports)

src/services/storage/
└── exportData.ts                 <- UPDATE (add downloadCSVData function)

src/routes/
├── ProgressRoute.tsx             <- UPDATE (add DataExport below SessionHistory)
└── ProgressRoute.test.tsx        <- UPDATE (add DataExport render test)
```

### Type Definitions

Define in `csvFormatter.ts` (co-located with CSV logic):

```typescript
export type DateRange = 'last_7_days' | 'last_30_days' | 'last_90_days' | 'all_time';

export const DATE_RANGE_OPTIONS: { value: DateRange; label: string }[] = [
  { value: 'last_7_days', label: 'Last 7 days' },
  { value: 'last_30_days', label: 'Last 30 days' },
  { value: 'last_90_days', label: 'Last 90 days' },
  { value: 'all_time', label: 'All time' },
];

// Maps DateRange to number of days (0 = all time)
export const DATE_RANGE_DAYS: Record<DateRange, number> = {
  last_7_days: 7,
  last_30_days: 30,
  last_90_days: 90,
  all_time: 0,
};
```

Define in `useDataExport.ts`:

```typescript
export interface ExportPayload {
  exportDate: string;
  dateRange: DateRange;
  sessions: Session[];
  drillResults: DrillResult[];
  assessments: Assessment[];
  userSettings: UserSettings;
  streak: number;
}

export interface UseDataExportResult {
  dateRange: DateRange;
  setDateRange: (range: DateRange) => void;
  hasData: boolean;
  isExporting: boolean;
  exportCSV: () => Promise<void>;
  exportJSON: () => Promise<void>;
}
```

### Implementation Guidance

**`csvFormatter.ts` -- CSV generation:**
```typescript
// Escape a single CSV value per RFC 4180
function escapeCSV(value: unknown): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

// Convert array of objects to CSV rows using column config
function toCSVRows(headers: string[], rows: unknown[][]): string {
  const headerLine = headers.join(',');
  const dataLines = rows.map(row => row.map(escapeCSV).join(','));
  return [headerLine, ...dataLines].join('\n');
}

// Session CSV columns:
// Session ID, Date, Time, Module, Duration (ms), Drill Count, Accuracy,
// Confidence Before, Confidence After, Confidence Change

// Drill Result CSV columns:
// Drill ID, Session ID, Timestamp, Module, Difficulty, Correct, Time (ms), Accuracy
```

**`useDataExport` hook pattern:**
```typescript
// Same hook pattern as useInsights/useConfidenceData:
// 1. useState for dateRange, hasData, isExporting
// 2. useEffect to check hasData on mount and dateRange change
// 3. useCallback for exportCSV/exportJSON
// 4. Query Dexie for sessions in range
// 5. Join drill results by sessionId
// 6. Get assessments, userSettings, streak from respective sources
// 7. Format and trigger download
// 8. Show toast on success or empty range
```

**Download CSV pattern (add to exportData.ts):**
```typescript
export function downloadCSVData(csvString: string, filename: string): void {
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
```

**DataExport component structure:**
```tsx
<Card data-testid="data-export">
  <CardHeader>
    <CardTitle>Export Your Data</CardTitle>
  </CardHeader>
  <CardContent>
    {/* Privacy notice */}
    <p className="text-sm text-muted-foreground mb-4">
      Your data stays on your device. Exports are created locally.
    </p>

    {/* Date range selector */}
    <div className="mb-4">
      <Select value={dateRange} onValueChange={setDateRange}>
        ...DATE_RANGE_OPTIONS.map(...)
      </Select>
    </div>

    {/* Empty state */}
    {!hasData && (
      <p data-testid="export-empty" className="text-muted-foreground text-center py-4">
        No data to export yet
      </p>
    )}

    {/* Export buttons */}
    <div className="flex gap-3">
      <Button
        variant="outline"
        className="min-h-[44px] flex-1"
        disabled={!hasData || isExporting}
        onClick={exportCSV}
      >
        Export as CSV
      </Button>
      <Button
        variant="outline"
        className="min-h-[44px] flex-1"
        disabled={!hasData || isExporting}
        onClick={exportJSON}
      >
        Export as JSON
      </Button>
    </div>
  </CardContent>
</Card>
```

### Testing Patterns

**csvFormatter.test.ts -- Pure unit tests:**
```typescript
import { describe, it, expect } from 'vitest';
import { formatSessionsCSV, formatDrillResultsCSV, generateFullCSV, escapeCSV } from './csvFormatter';
import type { Session, DrillResult } from '@/services/storage/schemas';

// Test CSV header correctness
// Test data row correctness
// Test comma/quote escaping
// Test undefined/null handling
// Test combined output format
```

**useDataExport.test.ts -- Hook tests with Dexie mocks:**
```typescript
// Mock pattern (same as useInsights.test.ts):
vi.mock('@/services/storage/db', () => ({
  db: {
    sessions: { where: vi.fn(), toArray: vi.fn() },
    drill_results: { where: vi.fn() },
    assessments: { toArray: vi.fn() },
  },
}));

vi.mock('@/services/storage/localStorage', () => ({
  getUserSettings: vi.fn(),
  getStreak: vi.fn(),
}));

vi.mock('@/services/storage/exportData', () => ({
  downloadExportedData: vi.fn(),
  downloadCSVData: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn() },
}));
```

**DataExport.test.tsx -- Component tests with mocked hook:**
```typescript
vi.mock('../hooks/useDataExport', () => ({
  useDataExport: vi.fn(),
}));

// Test rendering states: loading, empty, with data
// Test button interactions
// Test date range selector changes
// Test accessibility attributes
```

**ProgressRoute.test.tsx -- Update existing test:**
```typescript
// Add mock for DataExport
vi.mock('@/features/progress/components/DataExport', () => ({
  default: () => <div data-testid="data-export-mock">Export</div>,
}));

// Add test: DataExport renders after SessionHistory
```

### Color & Styling Notes

- **Card**: Default shadcn/ui Card (bg-card, border)
- **Privacy text**: `text-sm text-muted-foreground`
- **Export buttons**: `Button` variant `"outline"` with `min-h-[44px]` and `flex-1` for equal width
- **Button gap**: `flex gap-3` between CSV and JSON buttons
- **Empty state**: `text-muted-foreground text-center py-4`
- **Date range selector**: Full width, shadcn/ui Select or native `<select>` with Tailwind
- **Section spacing**: `mb-6` on the Card (consistent with other cards in ProgressRoute)

### Previous Story Intelligence (Story 5.4)

**Learnings from Story 5.4 implementation:**
- Hook return type must include `refetch` if exposing refetch capability
- `min-h-[44px]` on Buttons for 44px touch target (code review catch)
- Test helpers: Use `Omit<HookResult, 'fnProp'>` pattern when mocking hooks that have function properties
- Dexie query chain mocks: `where().equals().reverse().limit().toArray()` -- each returns object with next method
- `parseISO()` from date-fns for timestamp parsing (not `new Date()`)
- ProgressRoute integration tests: Mock child components to isolate, verify ordering via `data-testid` indices
- All types co-located with services (NOT in separate types/ folder)
- `tsc --noEmit` after all changes to catch TypeScript errors
- InsightsPanel test pattern: Mock hook with `vi.mock()` above import, then use `vi.mocked()` for type-safe mock setup

**Learnings from Story 5.2 (Session History):**
- `SessionWithDrills` join pattern: query sessions -> extract IDs -> query drill_results
- Pagination with `useRef` offset
- `useSessionHistory` returns `{ sessions, isLoading, error, loadMore, hasMore }`
- Date grouping utility: `groupSessionsByDate()` in dateFormatters.ts

**Learnings from Story 5.1 (Confidence Radar):**
- Dexie chain mock: `where().equals().reverse().limit().toArray()`
- `MIN_SESSIONS_REQUIRED = 3` for empty state threshold
- ResizeObserver mock already in vitest.setup.ts
- date-fns: `format`, `isToday`, `isYesterday`, `formatDistanceToNow`

### Project Structure Notes

- `csvFormatter.ts` goes in `features/progress/utils/` (co-located with dateFormatters)
- `DataExport.tsx` goes in `features/progress/components/` (co-located with InsightsPanel, SessionHistory)
- `useDataExport.ts` goes in `features/progress/hooks/` (co-located with useInsights, useSessionHistory)
- Types defined inline in their respective files -- do NOT create separate types file
- `downloadCSVData` function added to existing `src/services/storage/exportData.ts` -- do NOT create new download utility
- Update `features/progress/index.ts` with new exports following existing pattern

### References

- [Architecture: Data Architecture](docs/architecture.md#data-architecture) - Dexie schema, IndexedDB tables
- [Architecture: Implementation Patterns](docs/architecture.md#implementation-patterns) - Code conventions, testing standards
- [Epics: Story 5.5](docs/epics.md) - Line 1920: Original requirements with CSV/JSON format specs
- [Epics: Story 5.6](docs/epics.md) - Line 2052: E2E test scenario for data export verification
- [Epics: Epic 5 Goal](docs/epics.md) - Line 1668: Data export as part of progress tracking
- [exportData.ts](src/services/storage/exportData.ts) - Existing download/export service (reuse, extend)
- [localStorage.ts](src/services/storage/localStorage.ts) - getUserSettings(), getStreak(), STORAGE_KEYS
- [schemas.ts](src/services/storage/schemas.ts) - Session, DrillResult, Assessment, UserSettings types
- [db.ts](src/services/storage/db.ts) - Dexie database class with indices
- [ProgressRoute.tsx](src/routes/ProgressRoute.tsx) - Integration target (add DataExport at bottom)
- [ProgressRoute.test.tsx](src/routes/ProgressRoute.test.tsx) - Existing integration tests to extend
- [InsightsPanel.tsx](src/features/progress/components/InsightsPanel.tsx) - Component pattern reference
- [useInsights.ts](src/features/progress/hooks/useInsights.ts) - Hook pattern reference
- [dateFormatters.ts](src/features/progress/utils/dateFormatters.ts) - Date utility reference
- [Story 5.4](docs/stories/34-story-54-implement-insights-generation-engine.md) - Previous story learnings

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- Timezone issue: `parseISO()` converts UTC timestamps to local time, causing CSV time column to show wrong hour. Fixed by using direct string slicing (`timestamp.slice(0, 10)` for date, `.slice(11, 16)` for time) instead of date-fns parsing.
- `vi.restoreAllMocks()` in `afterEach` clears `mockReturnValue` set by `vi.mock` factories. Fixed by re-establishing localStorage mocks in `setupMocks` helper.
- shadcn/ui `CardTitle` renders `<div>` not a heading element — test uses `getByText` instead of `getByRole('heading')`.
- Code review fix (HIGH): `hasData` was incorrectly filtered by date range via `fetchSessions(dateRange)`. Changed to global `db.sessions.toArray()` check so buttons stay enabled when sessions exist but selected range is empty (AC-8 vs AC-9 distinction).
- Code review fix (MEDIUM): Added `isLoading` state to prevent empty-state flash on mount. Component now shows empty state only when `!isLoading && !hasData`.
- Code review fix (MEDIUM): Extracted shared `fetchExportData()` helper to eliminate duplicate code between `exportCSV` and `exportJSON`.
- Code review fix (MEDIUM): Added error path test verifying `toast.error` is called when DB query fails during export.

### Completion Notes List

- All 4 tasks complete with 53 total tests passing (21 + 11 + 15 + 6) after code review fixes
- TypeScript compiles cleanly (`tsc --noEmit`)
- No new dependencies added (custom CSV serializer, no papaparse)
- shadcn/ui Select not installed — used native `<select>` with Tailwind styling
- Reused existing `downloadExportedData` from exportData.ts, added `downloadCSVData`
- Toast convention: `import { toast } from 'sonner'` (not from ui/toast)
- Code review passed: 4 HIGH/MEDIUM issues found and fixed, 2 LOW issues accepted

### File List

**Created:**
- `src/features/progress/utils/csvFormatter.ts` — DateRange type, CSV generation utilities
- `src/features/progress/utils/csvFormatter.test.ts` — 21 unit tests
- `src/features/progress/hooks/useDataExport.ts` — Export logic hook
- `src/features/progress/hooks/useDataExport.test.ts` — 11 hook tests (9 + 2 from code review)
- `src/features/progress/components/DataExport.tsx` — UI component
- `src/features/progress/components/DataExport.test.tsx` — 15 component tests (14 + 1 from code review)

**Modified:**
- `src/services/storage/exportData.ts` — Added `downloadCSVData` function
- `src/routes/ProgressRoute.tsx` — Added DataExport below SessionHistory
- `src/routes/ProgressRoute.test.tsx` — Added DataExport mock and ordering test
- `src/features/progress/index.ts` — Added DataExport, useDataExport, csvFormatter exports
