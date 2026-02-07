# Story 5.3: Integrate Streak Counter on Home Screen

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **user opening the app daily**,
I want **to see my current streak prominently displayed on the home screen**,
so that **I'm motivated to maintain my practice habit**.

## Acceptance Criteria

### AC-1: Streak Display on Home Screen
**Given** user has completed at least one assessment
**When** I navigate to `/` (home route)
**Then** the home screen displays the StreakCounter at top of the returning-user dashboard:
- Large flame emoji (60px size)
- Current streak number (48px font, primary color — `text-primary` which is coral #E87461)
- Label: "Day Streak" (18px font, gray — `text-muted-foreground`)
- Positioned above the existing "Welcome Back" section
- Subtle flame flicker animation on page load (Framer Motion)

### AC-2: Streak Calculation for Display
**Given** the StreakCounter renders on Home
**Then** it displays the **live** streak considering elapsed time:
- Reads `LAST_SESSION_DATE` from localStorage
- Compares with today's date:
  - Last session = today → Show stored `STREAK` value
  - Last session = yesterday → Show stored `STREAK` value (already incremented)
  - Last session > 1 day ago → Show 0 (streak broken)
- First-time user (no `LAST_SESSION_DATE`): Show 0
- **NOTE:** `updateStreak()` only writes on session completion; this is a READ-ONLY display function

### AC-3: Streak Milestones
**Given** a session completes and updates the streak
**When** the new streak matches a milestone threshold
**Then** a celebration modal appears:
- 7 days: "One Week Streak!" with party emoji
- 30 days: "One Month Streak!" with fire emoji
- 100 days: "Century Streak!" with 100 emoji
- Modal: shadcn/ui Dialog with confetti animation (Framer Motion)
- Milestone triggered once per achievement (tracked in `STREAK_MILESTONES_SHOWN` localStorage)
- Dismissable by clicking outside or pressing close button

### AC-4: Tap Interaction
**Given** the streak counter is displayed
**When** user taps/clicks the streak counter
**Then** navigates to `/progress` route
- Tap animation: Subtle scale bounce (existing Framer Motion `whileTap`)

### AC-5: Edge Cases
- Streak = 0: Show "0" with dimmed flame (gray filter via `opacity-30 grayscale`)
- First-time user (no sessions ever): Show "Start your streak today!" message instead of number
- Multiple sessions same day: Don't double-increment (already handled by `updateStreak`)

### AC-6: Accessibility
- StreakCounter button has proper aria-label: "Current streak: X days" (EXISTING)
- Flame emoji has `role="img"` and `aria-label="Fire emoji"` (EXISTING)
- Milestone dialog has proper ARIA attributes (shadcn/ui Dialog built-in)
- 44px minimum tap targets (EXISTING)
- Respects `prefers-reduced-motion` for flame flicker animation

## Tasks / Subtasks

- [x] **Task 1: Add `getCurrentStreak()` to streakManager** (AC: #2)
  - [x] 1.1 Write failing test: `getCurrentStreak()` returns stored streak when last session is today
  - [x] 1.2 Write failing test: `getCurrentStreak()` returns stored streak when last session was yesterday
  - [x] 1.3 Write failing test: `getCurrentStreak()` returns 0 when last session > 1 day ago
  - [x] 1.4 Write failing test: `getCurrentStreak()` returns 0 when no last session date
  - [x] 1.5 Implement `getCurrentStreak()` in `src/services/training/streakManager.ts`
  - [x] 1.6 Verify all existing streakManager tests still pass

- [x] **Task 2: Add milestone system to streakManager** (AC: #3)
  - [x] 2.1 Add `STREAK_MILESTONES_SHOWN` key to `src/services/storage/localStorage.ts` STORAGE_KEYS
  - [x] 2.2 Add `getMilestonesShown()` and `addMilestoneShown()` functions to localStorage.ts
  - [x] 2.3 Write failing test: `checkMilestone(7)` returns milestone object
  - [x] 2.4 Write failing test: `checkMilestone(8)` returns null (not a milestone)
  - [x] 2.5 Write failing test: `checkMilestone(7)` returns null when already shown
  - [x] 2.6 Implement `checkMilestone(streak): Milestone | null` in streakManager.ts
  - [x] 2.7 Define `Milestone` type: `{ streak: number; title: string; emoji: string; message: string }`
  - [x] 2.8 Verify all tests pass

- [x] **Task 3: Enhance StreakCounter component** (AC: #1, #4, #5)
  - [x] 3.1 Write failing test: renders with 60px flame, 48px number, "Day Streak" label
  - [x] 3.2 Write failing test: shows dimmed flame when streak is 0
  - [x] 3.3 Write failing test: shows "Start your streak today!" when no sessions
  - [x] 3.4 Write failing test: flame has load animation
  - [x] 3.5 Update StreakCounter visual design: 60px flame (`text-6xl`), 48px number (`text-5xl font-bold text-primary`), "Day Streak" label (`text-lg text-muted-foreground`)
  - [x] 3.6 Add dimmed flame for streak = 0 (`opacity-30 grayscale`)
  - [x] 3.7 Add `noSessions` boolean prop for "Start your streak today!" state
  - [x] 3.8 Add flame flicker animation on page load (Framer Motion `animate`)
  - [x] 3.9 Add `prefers-reduced-motion` check for flame animation
  - [x] 3.10 Verify all existing StreakCounter tests still pass + new ones

- [x] **Task 4: Create MilestoneModal component** (AC: #3)
  - [x] 4.1 Create `src/features/progress/components/MilestoneModal.tsx`
  - [x] 4.2 Write failing test: renders milestone title and emoji
  - [x] 4.3 Write failing test: calls onClose when dismiss button clicked
  - [x] 4.4 Write failing test: shows confetti animation
  - [x] 4.5 Implement using shadcn/ui Dialog + Framer Motion confetti particles
  - [x] 4.6 Create `src/features/progress/components/MilestoneModal.test.tsx`
  - [x] 4.7 Verify all tests pass

- [x] **Task 5: Integrate StreakCounter into Home.tsx** (AC: #1, #2, #3, #4)
  - [x] 5.1 Write failing test: Home renders StreakCounter for returning users
  - [x] 5.2 Write failing test: Home does NOT render StreakCounter for first-time users
  - [x] 5.3 Write failing test: tapping StreakCounter navigates to /progress
  - [x] 5.4 Write failing test: milestone modal appears after streak achievement
  - [x] 5.5 Add streak state management via useEffect in Home.tsx (getCurrentStreak, checkMilestone)
  - [x] 5.6 Integrate StreakCounter above "Welcome Back" heading in Home.tsx
  - [x] 5.7 Wire tap → `navigate('/progress')`
  - [x] 5.8 Wire milestone check → MilestoneModal display
  - [x] 5.9 Update `src/features/progress/index.ts` with MilestoneModal export
  - [x] 5.10 Verify all tests pass

## Dev Notes

### CRITICAL: Do NOT Reinvent - Reuse These Existing Components

**1. StreakCounter component — ENHANCE, do NOT recreate:**
```
Existing: src/shared/components/StreakCounter.tsx
Tests:    src/shared/components/StreakCounter.test.tsx (12 tests)
```
The component already has:
- Framer Motion tap animation (`whileTap`, `whileHover`)
- AppContext integration (`useApp()` for streak value)
- `streak` prop override for explicit values
- `onTap` callback
- Accessible button with `aria-label`
- Flame emoji with `role="img"`

What needs to change:
- Visual size: `text-4xl` → `text-6xl` for flame, `text-2xl` → `text-5xl` for number
- Label: "Day/Days" → "Day Streak" (always singular label)
- Add dimmed flame for 0
- Add `noSessions` boolean prop for first-time message
- Add flame flicker animation on mount (`animate={{ scale: [1, 1.1, 1] }}`)
- Add `prefers-reduced-motion` via `useReducedMotion()` from framer-motion

**2. streakManager — ADD functions, do NOT recreate:**
```
Existing: src/services/training/streakManager.ts
Tests:    src/services/training/streakManager.test.ts (9 tests)
```
Already has: `getStreak()`, `updateStreak()`, `resetStreak()`

Add these NEW functions:
```typescript
/**
 * Get current streak for DISPLAY (read-only, considers elapsed time)
 * Different from getStreak() which returns raw stored value.
 */
export function getCurrentStreak(): number {
  const lastSessionDateStr = localStorage.getItem(LAST_SESSION_DATE_KEY);
  if (!lastSessionDateStr) return 0;

  const today = startOfDay(new Date());
  const lastSessionDate = startOfDay(parseISO(lastSessionDateStr));
  const daysDifference = differenceInDays(today, lastSessionDate);

  if (daysDifference <= 1) {
    return getStreak(); // Today or yesterday — show stored streak
  }
  return 0; // More than 1 day ago — streak broken
}

export interface Milestone {
  streak: number;
  title: string;
  emoji: string;
  message: string;
}

const MILESTONES: Milestone[] = [
  { streak: 7, title: 'One Week Streak!', emoji: '🎉', message: 'Amazing consistency! Keep it up!' },
  { streak: 30, title: 'One Month Streak!', emoji: '🔥', message: 'Incredible dedication!' },
  { streak: 100, title: 'Century Streak!', emoji: '💯', message: 'Legendary! 100 days of practice!' },
];

/**
 * Check if current streak triggers a milestone celebration
 * Returns null if not a milestone or already shown
 */
export function checkMilestone(streak: number): Milestone | null {
  const milestone = MILESTONES.find(m => m.streak === streak);
  if (!milestone) return null;

  const shown = getMilestonesShown();
  if (shown.includes(streak)) return null;

  return milestone;
}
```

**3. localStorage.ts — ADD key and helpers:**
```
Existing: src/services/storage/localStorage.ts
Tests:    src/services/storage/localStorage.test.ts
```
Add to STORAGE_KEYS:
```typescript
STREAK_MILESTONES_SHOWN: 'discalculas:streakMilestonesShown',
```
Add functions:
```typescript
export function getMilestonesShown(): number[] {
  const raw = localStorage.getItem(STORAGE_KEYS.STREAK_MILESTONES_SHOWN);
  if (!raw) return [];
  try { return JSON.parse(raw); } catch { return []; }
}

export function addMilestoneShown(streak: number): void {
  const shown = getMilestonesShown();
  if (!shown.includes(streak)) {
    shown.push(streak);
    localStorage.setItem(STORAGE_KEYS.STREAK_MILESTONES_SHOWN, JSON.stringify(shown));
  }
}
```

**4. Home.tsx — ADD StreakCounter integration:**
```
Existing: src/routes/Home.tsx
```
- Import StreakCounter from `@/shared/components/StreakCounter`
- Import `getCurrentStreak` from `@/services/training/streakManager`
- Import `useNavigate` (already imported)
- Add streak display above "Welcome Back" heading in returning-user section
- Wire `onTap={() => navigate('/progress')}`
- Add `useEffect` to compute display streak using `getCurrentStreak()`
- Check if last session date exists to determine `noSessions` prop

**5. shadcn/ui Dialog — ALREADY INSTALLED:**
```
Existing: src/shared/components/ui/dialog.tsx
```
Use `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogDescription` for MilestoneModal.

### File Locations (MANDATORY)

```
src/services/training/
├── streakManager.ts              <- UPDATE (add getCurrentStreak, checkMilestone, Milestone type)
└── streakManager.test.ts         <- UPDATE (add new function tests)

src/services/storage/
├── localStorage.ts               <- UPDATE (add STREAK_MILESTONES_SHOWN key + helpers)
└── localStorage.test.ts          <- UPDATE (add milestone shown tests)

src/shared/components/
├── StreakCounter.tsx              <- UPDATE (enhanced visual design, dimmed flame, animation)
└── StreakCounter.test.tsx         <- UPDATE (new visual/behavior tests)

src/features/progress/components/
├── MilestoneModal.tsx             <- NEW
└── MilestoneModal.test.tsx        <- NEW

src/routes/
└── Home.tsx                       <- UPDATE (integrate StreakCounter + milestone)

src/features/progress/
└── index.ts                       <- UPDATE (add MilestoneModal export)
```

### Color & Styling Notes

- **IMPORTANT:** There is NO `coral` Tailwind class. The primary color (#E87461) is coral-like but registered as `primary`. Use `text-primary` for the streak number.
- Dimmed flame: Use `opacity-30 grayscale` filter classes on the flame emoji container
- "Day Streak" label: `text-lg text-muted-foreground` (always "Day Streak", never pluralized)
- Milestone modal: White background, centered, max-w-sm, rounded-lg

### Framer Motion Patterns (from existing codebase)

**Flame flicker animation:**
```typescript
import { motion, useReducedMotion } from 'framer-motion';

const shouldReduceMotion = useReducedMotion();

<motion.div
  initial={{ scale: 1 }}
  animate={shouldReduceMotion ? {} : {
    scale: [1, 1.15, 1, 1.1, 1],
    rotate: [0, -5, 5, -3, 0],
  }}
  transition={{ duration: 1.5, ease: 'easeInOut' }}
>
  🔥
</motion.div>
```

**Confetti particles for MilestoneModal:**
```typescript
// Simple: 10-15 small colored circles that animate from center outward
const particles = Array.from({ length: 12 }, (_, i) => ({
  x: Math.cos((i * 30 * Math.PI) / 180) * 100,
  y: Math.sin((i * 30 * Math.PI) / 180) * 100,
  color: ['#E87461', '#FFD700', '#4ECDC4', '#FF6B9D'][i % 4],
}));
```

### Testing Patterns

**StreakCounter tests — extend existing file (`src/shared/components/StreakCounter.test.tsx`):**
- Tests use `render` from `tests/test-utils.tsx` which wraps in `BrowserRouter` + `AppProvider`
- To test with specific streak: use `streak` prop override
- To test navigation: mock `useNavigate` from `react-router-dom`

**Home.tsx tests — create or extend existing test:**
```typescript
// Mock streakManager
vi.mock('@/services/training/streakManager', () => ({
  getCurrentStreak: vi.fn().mockReturnValue(5),
  checkMilestone: vi.fn().mockReturnValue(null),
}));

// Mock db for assessment check (existing pattern in Home.tsx)
vi.mock('@/services/storage/db', () => ({
  db: {
    assessments: {
      where: vi.fn().mockReturnValue({
        equals: vi.fn().mockReturnValue({
          count: vi.fn().mockResolvedValue(1), // has assessment
        }),
      }),
    },
  },
}));
```

**MilestoneModal tests:**
```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MilestoneModal from './MilestoneModal';

// Test rendering with milestone prop
// Test onClose callback
// Test confetti animation (check for animated elements)
```

### AppContext Integration

The `AppContext.tsx` manages streak state globally:
- `state.streak` — current streak value from localStorage
- `setStreak(n)` — dispatches SET_STREAK which also persists to localStorage
- StreakCounter already reads from `useApp().state.streak` by default

**IMPORTANT:** `AppContext.state.streak` is initialized from `getStreak()` on mount — this reads the RAW stored value, NOT the "live" display value. For the Home screen, use `getCurrentStreak()` directly and pass as prop to StreakCounter. Do NOT modify AppContext for this story.

### Where Streak Gets Updated

`updateStreak()` is called in `src/features/training/components/TrainingSession.tsx:320` after session completion. This is the ONLY place streak is written. The streak value in AppContext is also updated there via `setStreak()`.

### Previous Story Intelligence (Story 5.2)

**Learnings from Story 5.2 implementation:**
- shadcn/ui component import paths: `@/lib/utils` not `@/shared/lib/utils`
- Test pattern: When text appears in multiple places, use `getAllByText` + length/class checks
- Framer Motion already used in 13 files — follow existing import pattern
- date-fns 4.0: Use `startOfDay`, `differenceInDays`, `parseISO` (same as streakManager)
- `useNavigate` mock: `vi.mock('react-router-dom', async () => { const actual = await vi.importActual('react-router-dom'); return { ...actual, useNavigate: () => mockNavigate }; });`
- ResizeObserver mock added to `vitest.setup.ts` — may need motion mocks if Framer Motion causes test issues

### Project Structure Notes

- Alignment: StreakCounter stays in `shared/components` (reused across routes)
- MilestoneModal goes in `features/progress/components` (progress-specific)
- streakManager stays in `services/training` (training-specific service)
- No conflicts with existing structure

### References

- [Architecture: Decision Summary](docs/architecture.md#decision-summary) - Tech stack versions
- [Architecture: LocalStorage Keys](docs/architecture.md#localstorage-keys) - STREAK, LAST_SESSION_DATE
- [Architecture: Implementation Patterns](docs/architecture.md#implementation-patterns) - Naming conventions
- [Epics: Story 5.3](docs/epics.md) - Line 1798: Original requirements
- [Epics: Epic 5 Goal](docs/epics.md) - Line 1668: Progress tracking goal
- [UX Spec: Streak System](docs/ux-design-specification.md) - Duolingo-inspired habit design
- [streakManager.ts](src/services/training/streakManager.ts) - Existing streak logic
- [StreakCounter.tsx](src/shared/components/StreakCounter.tsx) - Existing component
- [localStorage.ts](src/services/storage/localStorage.ts) - Storage keys and helpers
- [AppContext.tsx](src/context/AppContext.tsx) - Global streak state
- [Home.tsx](src/routes/Home.tsx) - Integration target
- [dialog.tsx](src/shared/components/ui/dialog.tsx) - shadcn/ui Dialog for milestone modal
- [Story 5.2: SessionHistory](docs/stories/32-story-52-build-session-history-view.md) - Previous story patterns

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- Home.test.tsx initially had 3/6 tests failing due to React useEffect timing — streak assertions ran before the second useEffect (depending on hasAssessment state change) completed. Fixed by wrapping streak-specific assertions in `waitFor` blocks.

### Completion Notes List

- Task 1: Added `getCurrentStreak()` to streakManager.ts — read-only display function that considers elapsed time since last session
- Task 2: Added milestone system — `Milestone` interface, `MILESTONES` array, `checkMilestone()` in streakManager.ts; `getMilestonesShown()` and `addMilestoneShown()` in localStorage.ts with `STREAK_MILESTONES_SHOWN` key
- Task 3: Enhanced StreakCounter with 60px flame, 48px number, "Day Streak" label, dimmed flame for streak=0, `noSessions` prop, flame flicker animation with reduced-motion support
- Task 4: Created MilestoneModal using shadcn/ui Dialog + Framer Motion confetti (12 particles, 4 colors)
- Task 5: Integrated StreakCounter into Home.tsx above "Welcome Back", wired tap→/progress navigation, milestone check on mount, MilestoneModal display
- Used inline useEffect in Home.tsx instead of separate useStreak() hook — simpler for single-use case

### File List

- `src/services/training/streakManager.ts` — MODIFIED (added getCurrentStreak, checkMilestone, Milestone type, MILESTONES)
- `src/services/training/streakManager.test.ts` — MODIFIED (added 10 new tests: 4 getCurrentStreak + 6 checkMilestone)
- `src/services/storage/localStorage.ts` — MODIFIED (added STREAK_MILESTONES_SHOWN key, getMilestonesShown, addMilestoneShown)
- `src/services/storage/localStorage.test.ts` — MODIFIED (added 6 milestone tests)
- `src/shared/components/StreakCounter.tsx` — MODIFIED (enhanced visual design, dimmed flame, noSessions, animation)
- `src/shared/components/StreakCounter.test.tsx` — MODIFIED (17 tests total, added tests for new features)
- `src/features/progress/components/MilestoneModal.tsx` — NEW (shadcn/ui Dialog + Framer Motion confetti)
- `src/features/progress/components/MilestoneModal.test.tsx` — NEW (6 tests)
- `src/features/progress/index.ts` — MODIFIED (added MilestoneModal export)
- `src/routes/Home.tsx` — MODIFIED (integrated StreakCounter, milestone check, navigation)
- `src/routes/Home.test.tsx` — NEW (6 tests)

### Test Summary

- **92 tests passing** across 5 Story 5.3 test files:
  - `localStorage.test.ts`: 41 tests (6 new milestone tests)
  - `streakManager.test.ts`: 22 tests (10 new: 4 getCurrentStreak + 6 checkMilestone)
  - `StreakCounter.test.tsx`: 17 tests (5 new for enhanced features)
  - `MilestoneModal.test.tsx`: 6 tests (all new)
  - `Home.test.tsx`: 6 tests (all new)
- TypeScript compiles with zero errors (`tsc --noEmit` clean)
- All pre-existing test failures are unrelated to Story 5.3
