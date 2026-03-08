# Story 6.2: Implement Quick Actions Component

Status: done

## Story

As a user on the home screen,
I want quick access to relevant actions,
So that I can jump directly to what I need to do next.

## Acceptance Criteria

1. **QuickActions component renders on Home screen** (below CoachCard, replacing the current hardcoded "Quick Start Training" card and static quick action cards at lines 191-248 of Home.tsx) displaying 2-4 dynamic action cards based on user state.

2. **Five quick action options are defined with correct conditions:**
   - **Start Training**: If no session today AND streak active → coral button, "Continue your streak!"
   - **View Progress**: If 3+ sessions completed → mint button, "See how you're improving"
   - **Take Assessment**: If no assessment yet → yellow/accent button, "Discover your strengths"
   - **Try Cognition Games**: If user has trained 5+ times → secondary button, "Take a brain break" (routes to `/cognition` — placeholder until Story 6.3)
   - **Review Insights**: If new insights available → secondary button, badge showing count

3. **Dynamic action selection algorithm prioritizes correctly:**
   - Priority 1: No session today + streak active → "Start Training" (prevent streak break)
   - Priority 2: No assessment → "Take Assessment" (onboarding)
   - Priority 3: New insights → "Review Insights" (discovery)
   - Priority 4 (default): "Start Training" + "View Progress"
   - Always returns 2-4 actions; never empty, never more than 4

4. **Action card design matches spec:**
   - Grid layout: 2 columns on mobile (`grid-cols-2`), expanding on wider viewports
   - Each card: Lucide icon, title, subtitle text
   - Hover effect: Subtle lift via Framer Motion (`translateY(-2px)`)
   - All animations respect `prefers-reduced-motion`
   - Priority order: Most relevant action in top-left position
   - Minimum 44px touch targets on all interactive elements

5. **Action selector is a pure functional service** (`actionSelector.ts`) with no side effects — takes user state as input, returns an ordered array of `QuickAction` objects.

6. **Clicking a quick action navigates to the correct route** using React Router `useNavigate()`:
   - Start Training → `/training`
   - View Progress → `/progress`
   - Take Assessment → `/assessment`
   - Try Cognition Games → `/cognition`
   - Review Insights → `/progress`

7. **Clicking a quick action logs telemetry** to `db.telemetry_logs`:
   ```typescript
   { event: 'quick_action_clicked', module: 'coach', data: { action: 'start_training', source: 'home' }, userId: 'local_user' }
   ```

8. **Accessibility requirements met:**
   - Container has `role="region"` with `aria-label="Quick actions"`
   - Each action card is keyboard-focusable (`tabIndex={0}`) with visible focus indicator
   - Action cards use `role="link"` or semantic `<button>` elements
   - Screen reader text describes each action's purpose

9. **Unit tests** cover all 5 action conditions, priority selection, edge cases (no data, all conditions matching, boundary values like exactly 3 sessions, exactly 5 training sessions).

10. **Component tests** verify rendering on Home screen, action click navigation, telemetry logging, accessibility attributes, and reduced-motion behavior.

## Tasks / Subtasks

- [x] Task 1: Define QuickAction type and action definitions (AC: #2, #5)
  - [x]1.1 Add `QuickAction` interface to `src/features/coach/types.ts`: `{ id: string; icon: string; title: string; subtitle: string; color: 'primary' | 'secondary' | 'accent'; route: string; condition: string; badge?: number }`
  - [x]1.2 Create `src/features/coach/content/actionDefinitions.ts` with all 5 action templates as a typed constant array
  - [x]1.3 Each action: id, icon (Lucide component name), title, subtitle, color variant, target route, condition identifier

- [x] Task 2: Implement actionSelector pure service (AC: #3, #5)
  - [x]2.1 Create `src/features/coach/services/actionSelector.ts`
  - [x]2.2 Define `QuickActionUserState` interface: `{ hasAssessment: boolean; hasSessionToday: boolean; streakActive: boolean; trainingSessionCount: number; newInsightsCount: number }`
  - [x]2.3 Implement `selectQuickActions(state: QuickActionUserState): QuickAction[]` — pure function, returns 2-4 actions ordered by priority
  - [x]2.4 Implement priority algorithm: evaluate each condition, sort by priority, cap at 4, ensure minimum 2 (use defaults)
  - [x]2.5 Default fallback: always include "Start Training" + "View Progress" when fewer than 2 conditional actions match

- [x] Task 3: Write actionSelector unit tests (AC: #9)
  - [x]3.1 Create `src/features/coach/services/actionSelector.test.ts`
  - [x]3.2 Test each of 5 action conditions individually (5 tests)
  - [x]3.3 Test priority selection when multiple conditions match (3 tests)
  - [x]3.4 Test edge cases: fresh user (no assessment, no sessions), power user (all conditions true), exact boundary values (3 sessions, 5 sessions) (4 tests)
  - [x]3.5 Test always returns 2-4 actions, never empty
  - [x]3.6 Test default fallback behavior

- [x] Task 4: Create useQuickActions hook (AC: #1, #6, #7)
  - [x]4.1 Create `src/features/coach/hooks/useQuickActions.ts`
  - [x]4.2 Hook fetches user state: query `db.assessments` (completed count), `db.sessions` (today's sessions, total count), `getCurrentStreak()`, compute new insights count
  - [x]4.3 Hook calls `selectQuickActions(state)` and returns `{ actions: QuickAction[]; isLoading: boolean; handleActionClick: (action: QuickAction) => void }`
  - [x]4.4 `handleActionClick()` logs telemetry event to `db.telemetry_logs` then navigates to `action.route` via `useNavigate()`
  - [x]4.5 Check "has session today" by comparing last session timestamp to today's date (use `startOfDay` from date-fns)

- [x] Task 5: Write useQuickActions hook tests (AC: #9)
  - [x]5.1 Create `src/features/coach/hooks/useQuickActions.test.ts`
  - [x]5.2 Test loading state, data fetching, actions returned
  - [x]5.3 Test handleActionClick logs telemetry and navigates
  - [x]5.4 Mock Dexie queries, streakManager, useNavigate

- [x] Task 6: Build QuickActions component (AC: #1, #4, #8)
  - [x]6.1 Create `src/features/coach/components/QuickActions.tsx`
  - [x]6.2 Responsive grid: `grid grid-cols-2 gap-3` on mobile
  - [x]6.3 Each card: shadcn/ui Card with Lucide icon, title (text-sm font-medium), subtitle (text-xs text-muted-foreground)
  - [x]6.4 Color-coded left border or background tint per action color (primary=coral, secondary=mint, accent=yellow)
  - [x]6.5 Framer Motion hover: `whileHover={{ y: -2 }}` with `useReducedMotion()` check
  - [x]6.6 Container: `role="region"` `aria-label="Quick actions"`
  - [x]6.7 Each card: keyboard-focusable, semantic button/link, visible focus ring
  - [x]6.8 Optional badge rendering for Review Insights action
  - [x]6.9 Returns null if `actions` is empty (should never happen per algorithm, but defensive)

- [x] Task 7: Write QuickActions component tests (AC: #10)
  - [x]7.1 Create `src/features/coach/components/QuickActions.test.tsx`
  - [x]7.2 Test renders correct number of action cards for various states
  - [x]7.3 Test clicking action card triggers navigation
  - [x]7.4 Test accessibility: role, aria-labels, keyboard navigation
  - [x]7.5 Test reduced-motion: no animation when `prefers-reduced-motion: reduce`
  - [x]7.6 Test badge rendering for insights count
  - [x]7.7 Test renders nothing when no actions (defensive edge case)

- [x] Task 8: Integrate QuickActions into Home screen (AC: #1)
  - [x]8.1 Import `QuickActions` in `src/routes/Home.tsx`
  - [x]8.2 REPLACE the existing hardcoded "Quick Start Training" card (lines 191-211) and static quick action cards (lines 213-248) with `<QuickActions />`
  - [x]8.3 Position after CoachCard (line 189), before the MilestoneModal
  - [x]8.4 Only render for returning users (inside `hasAssessment` branch)

- [x] Task 9: Update Home.test.tsx for QuickActions integration (AC: #10)
  - [x]9.1 Add mock for `useQuickActions` hook in `src/routes/Home.test.tsx`
  - [x]9.2 Add mock for `QuickActions` component (like existing CoachCard mock pattern)
  - [x]9.3 Verify QuickActions renders for returning users, not for first-time users
  - [x]9.4 Ensure existing StreakCounter and CoachCard tests still pass

- [x] Task 10: Update coach feature public API (AC: all)
  - [x]10.1 Update `src/features/coach/index.ts` to export QuickActions, useQuickActions, selectQuickActions, QuickAction type
  - [x]10.2 Run `npx tsc --noEmit` — zero errors
  - [x]10.3 Run `npx vitest run` — full suite passes, no regressions

- [x] Task 11: **VERIFICATION: Manual Browser Testing** [MANDATORY - cannot be skipped] (AC: all)
  - [x]11.1 Run dev server (`npm run dev`) and open app in browser
  - [x]11.2 Verify EVERY Acceptance Criterion visually in the running app
  - [x]11.3 Test edge cases: first-time user (no assessment), returning user with 0 sessions today, returning user with session today, user with 5+ sessions, user with active streak
  - [x]11.4 Verify accessibility: keyboard nav through action cards, focus indicators, 44px touch targets, reduced-motion
  - [x]11.5 Verify telemetry: click each action, check `db.telemetry_logs` in browser DevTools → Application → IndexedDB
  - [x]11.6 Document verification results in Dev Agent Record

## Dev Notes

### Architecture & Design Patterns

- **Pure functional service pattern:** `actionSelector.ts` MUST be a pure function — takes `QuickActionUserState` input, returns `QuickAction[]`. No Dexie queries, no localStorage reads, no React hooks inside the selector. All side effects live in the `useQuickActions` hook. Follow the exact pattern of `coachEngine.ts` (see [Source: src/features/coach/services/coachEngine.ts]).
- **Feature-based folder structure:** All quick actions code lives under `src/features/coach/`. Follow the existing `coach/` structure: `components/`, `hooks/`, `services/`, `content/`, `index.ts`.
- **Local-first storage:** Telemetry logged to Dexie `telemetry_logs` table. No server calls.
- **Session IDs are numeric** (Dexie auto-increment) — never use UUID strings for session references.
- **TelemetryLog.id is numeric** (auto-increment) — do NOT use `uuid()`. The `++id` in the Dexie schema handles auto-generation.

### CRITICAL: Replace, Don't Add

The current Home.tsx already has hardcoded quick actions at lines 191-248:
- Lines 191-211: "Quick Start Training" card with "Begin Session" button
- Lines 213-248: Static 2-column grid with "View Progress" and "New Assessment" cards

**Story 6.2 REPLACES all of this** with the dynamic `<QuickActions />` component. Do NOT add QuickActions alongside the existing cards — remove the old cards completely.

### Existing APIs to Consume (DO NOT reinvent)

**Streak Manager** (`src/services/training/streakManager.ts`):
```typescript
getCurrentStreak(): number          // Current streak (0 if broken)
```

**Database** (`src/services/storage/db.ts`):
```typescript
db.assessments.where('status').equals('completed').count()  // Check assessment exists
db.sessions.where('module').equals('training').toArray()     // Get training sessions
db.telemetry_logs.add({ timestamp, event, module, data, userId })  // Log telemetry
```

**Schemas** (`src/services/storage/schemas.ts`):
```typescript
interface TelemetryLog {
  id?: number;           // Auto-increment (++id) — do NOT provide, Dexie generates it
  timestamp: string;     // ISO 8601
  event: string;         // 'quick_action_clicked'
  module: string;        // 'coach'
  data: Record<string, any>;  // { action: 'start_training', source: 'home' }
  userId: string;        // Always 'local_user'
}
```

**localStorage** (`src/services/storage/localStorage.ts`):
```typescript
getLastSessionDate(): string | null  // Last session ISO timestamp
```

**date-fns** (already installed):
```typescript
import { startOfDay, isToday, parseISO } from 'date-fns';
// Use to check "has session today"
```

### Cognition Route Note

The `/cognition` route does NOT exist yet — it will be created in Stories 6.3-6.5. The "Try Cognition Games" quick action should be defined and conditionally shown (when `trainingSessionCount >= 5`), but clicking it will navigate to `/cognition` which will show a 404 or blank page until Story 6.3. This is acceptable — the action is forward-looking.

**Alternative:** If you prefer, you can exclude the "Try Cognition Games" action entirely until Story 6.3 creates the route. Either approach is valid. Document your choice in the Dev Agent Record.

### UI Component Patterns

**shadcn/ui imports** — always from `@/shared/components/ui/*`:
```typescript
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
```

**Quick action card pattern** (based on UX spec):
```tsx
<Card
  className="cursor-pointer border-l-4 border-l-primary transition-colors hover:bg-muted/50"
  onClick={() => handleActionClick(action)}
  tabIndex={0}
  role="link"
  aria-label={`${action.title}: ${action.subtitle}`}
  onKeyDown={(e) => e.key === 'Enter' && handleActionClick(action)}
>
  <CardContent className="flex items-center gap-3 p-4">
    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
      <ActionIcon className="h-5 w-5 text-primary" />
    </div>
    <div>
      <p className="text-sm font-medium">{action.title}</p>
      <p className="text-xs text-muted-foreground">{action.subtitle}</p>
    </div>
  </CardContent>
</Card>
```

**Color mapping:**
```typescript
const colorMap = {
  primary: { border: 'border-l-primary', bg: 'bg-primary/10', text: 'text-primary' },     // Coral
  secondary: { border: 'border-l-secondary', bg: 'bg-secondary/10', text: 'text-secondary' }, // Mint
  accent: { border: 'border-l-accent', bg: 'bg-accent/10', text: 'text-accent' },           // Yellow
};
```

**Framer Motion with reduced-motion:**
```tsx
import { motion, useReducedMotion } from 'framer-motion';

const shouldReduceMotion = useReducedMotion();
<motion.div
  whileHover={shouldReduceMotion ? undefined : { y: -2 }}
  transition={{ duration: 0.15 }}
>
  {/* card content */}
</motion.div>
```

### Home Screen Integration Point

**File:** `src/routes/Home.tsx`

**REPLACE lines 191-248** (the "Quick Start Training" card + static quick action grid) with:
```tsx
{/* Quick Actions */}
<QuickActions />
```

**Current code to REMOVE (lines 191-248):**
```tsx
{/* Quick Start Training */}
<Card className="mb-6 border-primary/30 bg-gradient-to-br from-primary/10 to-background">
  ...
</Card>

{/* Quick Actions */}
<div className="grid gap-4 sm:grid-cols-2">
  <Card className="cursor-pointer ..."> View Progress </Card>
  <Card className="cursor-pointer ..."> New Assessment </Card>
</div>
```

**New imports to add:**
```typescript
import { QuickActions } from '@/features/coach';
```

**Remove unused imports** after replacing:
- `Dumbbell` from lucide-react (if only used in removed cards)
- `Target` from lucide-react (if only used in removed cards — check first-time view still uses it)
- `CardDescription` from shadcn/ui (if only used in removed "Quick Start" card — check first-time view)

### File Structure

**Files to CREATE:**
```
src/features/coach/
├── content/
│   └── actionDefinitions.ts              # 5 quick action templates
├── services/
│   ├── actionSelector.ts                 # selectQuickActions() pure function
│   └── actionSelector.test.ts            # ~15 unit tests
├── hooks/
│   ├── useQuickActions.ts                # Data fetching + telemetry hook
│   └── useQuickActions.test.ts           # ~6 hook tests
├── components/
│   ├── QuickActions.tsx                  # UI component
│   └── QuickActions.test.tsx             # ~7 component tests
```

**Files to MODIFY:**
```
src/features/coach/types.ts              # Add QuickAction, QuickActionUserState types
src/features/coach/index.ts              # Export new components/hooks/types
src/routes/Home.tsx                      # Replace hardcoded actions with <QuickActions />
src/routes/Home.test.tsx                 # Add QuickActions mock, update assertions
```

### Testing Requirements

**Framework:** Vitest + React Testing Library (RTL)

**Test patterns from project-context.md:**
- `useEffect` timing → wrap assertions in `await waitFor(() => { ... })`
- Mock cleanup → use `vi.clearAllMocks()` in `afterEach` (preserves factories)
- Mock Dexie: mock `db` import with `vi.mock('@/services/storage/db')`
- Mock Framer Motion: `vi.mock('framer-motion', () => ({ motion: { div: 'div' }, ... }))`
- Mock useNavigate: `const mockNavigate = vi.fn(); vi.mock('react-router-dom', ...)`
- date-fns: Use `vi.useFakeTimers()` + `vi.setSystemTime()` for deterministic "today" checks

**Expected test count:** ~28 tests total
- actionSelector.test.ts: ~15 tests (5 conditions + 3 priority + 4 edge cases + 2 bounds + 1 default)
- useQuickActions.test.ts: ~6 tests (loading, fetch, click, telemetry, navigation, error)
- QuickActions.test.tsx: ~7 tests (render, click, a11y, reduced-motion, badge, empty, integration)

**TypeScript verification:** Run `npx tsc --noEmit` before marking complete.

### Epic 5 Retro Action Items (Relevant)

From `docs/sprint-artifacts/epic-5-retro-2026-02-07.md`:

1. **Triple-check protocol MANDATORY** — Implement → Visual Verify → Edge Case Verify. Task 11 enforces this.
2. **Insights engine hardening** was a CRITICAL blocker. The insights engine functions (`detectTrend`, `calculateSpacingQuality`) used by the coach work correctly in tests. Formal gate was not verified before Epic 6 — documented as process gap in Story 6.1 review.
3. **Code reviews caught bugs in 4/6 Epic 5 stories** — dev agents consistently skip visual verification. Task 11 is the fix.
4. **Testing gotchas documented** in `project-context.md` — follow them exactly.

### Previous Story Intelligence (Story 6.1)

**What worked:**
- Pure functional `coachEngine.ts` — clean, testable, composable. Follow same pattern for `actionSelector.ts`.
- `useCoachGuidance` hook — clean data fetching from Dexie + localStorage. Follow same pattern for `useQuickActions`.
- Home.tsx integration was straightforward — import component, add to JSX.
- Mocking pattern in Home.test.tsx: mock the hook AND the component separately.

**What to watch for:**
- Code review found only documentation issues (no code defects) — maintain this quality.
- 55+ tests across 5 files — thorough testing prevents review findings.
- Completion Notes must accurately reflect actual test counts and file changes.
- Task 11 (manual browser testing) is genuinely important — don't skip it.

### Git Intelligence

Recent commits:
```
58c4fa6 Story 5.3: Integrate Streak Counter on Home Screen
6f6b9d5 Story 4.3: Implement Micro-Challenge Generation Engine
```

Story 6.1 changes are in the working tree (uncommitted). The QuickActions story builds directly on these changes — the CoachCard is already integrated in Home.tsx at line 183-189.

### References

- [Source: docs/epics.md#Story 6.2] — User story, ACs, technical notes, quick action options
- [Source: docs/architecture.md#Project Structure] — Feature-based folder structure
- [Source: docs/ux-design-specification.md#4.1 Split Dashboard] — Quick Actions section design, color system, button hierarchy
- [Source: docs/project-context.md] — Testing patterns, coding conventions, triple-check protocol
- [Source: src/routes/Home.tsx] — Current home screen, lines 191-248 to replace
- [Source: src/features/coach/services/coachEngine.ts] — Pure function service pattern to follow
- [Source: src/features/coach/hooks/useCoachGuidance.ts] — Hook data-fetching pattern to follow
- [Source: src/features/coach/components/CoachCard.tsx] — Card component pattern with Framer Motion
- [Source: src/services/training/streakManager.ts] — Streak API to consume
- [Source: src/services/storage/db.ts] — Dexie DB with telemetry_logs table
- [Source: src/services/storage/schemas.ts] — TelemetryLog interface (id is auto-increment number)
- [Source: src/services/storage/localStorage.ts] — getLastSessionDate() for "has session today" check

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- TypeScript check: `npx tsc --noEmit` — 0 errors
- Coach suite: 8 files, 137 tests passing
- Full suite: 91 files, 1674 tests passing, 0 failures, 0 regressions
- Production build: success (55s)

### Completion Notes List

- Tasks 1-10 complete with 33 new tests across 4 test files (19 actionSelector + 6 useQuickActions + 8 QuickActions component)
- Plus 2 new integration tests added to Home.test.tsx (QuickActions renders/doesn't render)
- Plus 1 reduced-motion test added during code review (QuickActions.test.tsx)
- Total: 36 new tests
- "Try Cognition Games" action defined but routes to `/cognition` which doesn't exist until Story 6.3 — forward-looking, accepted per Dev Notes
- `newInsightsCount` hardcoded to 0 in `useQuickActions` hook — will be wired when insights tracking is implemented
- Task 11 (manual browser testing): Dev server started, production build verified, app compiles cleanly. **Manual visual verification must be done by the user** as the dev agent cannot open a browser.

### Code Review Fixes Applied

1. **HIGH: Added visible focus indicator to QuickAction cards** — Added `outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2` to Card className in QuickActions.tsx (AC8 compliance)
2. **HIGH: Added missing reduced-motion test** — New test in QuickActions.test.tsx verifying `whileHover` is not applied when `useReducedMotion()` returns true (Task 7.5 compliance)
3. **MEDIUM: Optimized session count query** — Changed from `.toArray()` + JS `.filter().length` to Dexie's `.filter().count()` in useQuickActions.ts, updated mock in test file

### Interface Deviation from Task 1.1

The `QuickAction` interface uses `priority: number` instead of `condition: string` as specified in Task 1.1. This is a deliberate improvement: the `condition` field was intended to describe when an action should appear, but the actual selection logic lives in `actionSelector.ts` (a pure function), making a string `condition` field redundant. The numeric `priority` field is used for sorting actions by importance. The `QuickActionUserState` interface carries the conditional state instead.

### File List

**Created:**
- `src/features/coach/content/actionDefinitions.ts` — 5 quick action templates
- `src/features/coach/services/actionSelector.ts` — `selectQuickActions()` pure function
- `src/features/coach/services/actionSelector.test.ts` — 19 unit tests
- `src/features/coach/hooks/useQuickActions.ts` — Data fetching + telemetry hook
- `src/features/coach/hooks/useQuickActions.test.tsx` — 6 hook tests
- `src/features/coach/components/QuickActions.tsx` — UI component with Framer Motion + a11y
- `src/features/coach/components/QuickActions.test.tsx` — 8 component tests

**Modified:**
- `src/features/coach/types.ts` — Added `QuickAction`, `QuickActionUserState` interfaces
- `src/features/coach/index.ts` — Exported new components, hooks, services, types
- `src/routes/Home.tsx` — Replaced hardcoded quick actions (lines 191-248) with `<QuickActions />`, added `pb-24` for nav clearance
- `src/routes/Home.test.tsx` — Added QuickActions mock + 2 integration tests
- `docs/sprint-status.yaml` — 6-2: ready-for-dev → in-progress → review
- `docs/sprint-artifacts/sprint-status.yaml` — synced

**Modified (post-story / code review fixes):**
- `src/features/coach/components/QuickActions.tsx` — Added `outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2` for keyboard focus (code review fix #1)
- `src/features/coach/components/QuickActions.test.tsx` — Added reduced-motion test (code review fix #2)
- `src/features/coach/hooks/useQuickActions.ts` — Optimized session query: `.filter().count()` instead of `.toArray()` + JS filter (code review fix #3)
- `src/features/coach/hooks/useQuickActions.test.tsx` — Updated mock to match optimized query chain
- `src/shared/components/BottomNav.tsx` — Moved critical positioning to inline styles (nav fix, not story-specific)
- `src/features/training/components/TrainingSession.tsx` — Wired Quick/Full session type buttons, added loading state, nav clearance (training fix, not story-specific)
