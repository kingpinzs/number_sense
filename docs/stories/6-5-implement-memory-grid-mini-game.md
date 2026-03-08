# Story 6.5: Implement Memory Grid Mini-Game

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a user training working memory,
I want a visual memory game that challenges me to remember patterns,
So that I strengthen my short-term memory through practice.

## Acceptance Criteria

1. **MemoryGridGame accessible from CognitionRoute** — When user navigates to `/cognition` and selects "Memory Grid", the MemoryGridGame component renders. The existing "Coming soon" placeholder on the Memory Grid card is replaced with a functional "Play" button. CognitionRoute already imports `LayoutGrid` icon for this card.

2. **5x5 grid of 25 squares renders** — A grid of 60px x 60px squares with 4px gap displays. All squares start in inactive/gray state (`bg-muted`). Grid is centered in the viewport.

3. **Pattern display phase works correctly:**
   - A random pattern of N squares highlights in coral color (`bg-primary` or `#E87461`) for 2 seconds
   - Highlighted squares pulse subtly via Framer Motion (respect `prefers-reduced-motion`)
   - Pattern length N follows difficulty progression (see AC #6)
   - After 2 seconds, all squares return to gray (pattern hidden)
   - User CANNOT interact with the grid during display phase

4. **Recall phase works correctly:**
   - After pattern disappears, user clicks squares to toggle them on/off (coral when selected, gray when not)
   - "Submit" button enabled only when user has selected at least 1 square
   - "Give Up" button always available during recall phase
   - User can deselect squares by clicking again (toggle behavior)

5. **Answer evaluation works correctly:**
   - On submit: compare user's selected squares to original pattern
   - **Correct:** User's selection matches original pattern exactly (same squares, no extras, no missing)
   - **Correct feedback:** Green border flash on grid, confetti-style celebration (subtle, per UX spec), +1 round, advance to next round with longer pattern
   - **Incorrect feedback:** Gold/amber border flash (`border-yellow-500`, NOT red — reduces anxiety per UX spec), -1 life, show the correct pattern briefly (1.5s) before next round
   - "Give Up" counts as incorrect (lose 1 life, show correct pattern)

6. **Difficulty progression within a game:**
   - Round 1-3: 3 squares highlighted (easy)
   - Round 4-6: 5 squares highlighted (medium)
   - Round 7+: 7+ squares highlighted (increases by 1 each round beyond 7)
   - Maximum pattern length: 12 squares (almost half the grid — very challenging)
   - Game ends when lives reach 0 or user gives up

7. **Lives system:**
   - Start with 3 lives, displayed as hearts or dots
   - Lose 1 life per incorrect answer or give up
   - Display: "Lives: ❤️❤️❤️" or 3 filled circles that empty as lives are lost
   - Game over when lives = 0

8. **Game UI displays live stats:**
   - Round counter: "Round 5"
   - Pattern length: "Pattern: 7 squares"
   - Lives remaining: visual indicator (3 hearts/dots)
   - Score: rounds completed successfully

9. **Game completion (game over) modal** appears when lives = 0 or user gives up:
   - Stats: "Reached round X", "Longest pattern: Y squares"
   - Encouragement message based on performance:
     - Reached round 8+: "Incredible memory!"
     - Reached round 5-7: "Great working memory!"
     - Reached round 3-4: "Good effort! Keep practicing."
     - Reached round 1-2: "Memory improves with practice. Try again!"
   - Buttons: "Play Again" (primary), "Back to Games" (secondary, navigates to CognitionRoute game selection)

10. **Game result saved to telemetry** on completion:
    ```typescript
    db.telemetry_logs.add({
      timestamp: new Date().toISOString(),
      event: 'cognition_game_complete',
      module: 'memory_grid',
      data: {
        roundsCompleted: 8,
        longestPattern: 9,
        duration: 180000,  // milliseconds
        livesRemaining: 1,
      },
      userId: 'local_user',
    }).catch(err => console.error('Failed to log telemetry:', err));
    ```

11. **Accessibility requirements met:**
    - All 25 grid squares are keyboard-navigable (arrow keys with roving tabindex pattern, Enter/Space to toggle)
    - `aria-label` on each square describing position (e.g., "Square row 1, column 3")
    - During display phase: `aria-label` updates to include "highlighted" state
    - During recall phase: `aria-label` updates to include "selected" / "not selected"
    - `aria-live="polite"` region for round counter, pattern length, lives
    - `aria-live="assertive"` for answer feedback (correct/incorrect — time-sensitive)
    - Visible focus indicators (`focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2`)
    - All animations respect `prefers-reduced-motion` (use `useReducedMotion()` from framer-motion)
    - 60px square size exceeds 44px minimum touch target

12. **Unit tests** cover: pattern generation (correct count, no duplicates, within grid bounds), pattern comparison (exact match, partial match = fail, extras = fail), difficulty progression (pattern length per round), encouragement message selection, game state transitions (display → recall → feedback → next round / game over).

13. **Component tests** verify: grid rendering (25 squares), pattern display phase (squares highlight then hide), recall phase (click to toggle), submit button enable/disable, correct answer feedback + round advance, incorrect answer feedback + life loss, game over modal with stats, telemetry logging, lives display, Play Again / Back to Games buttons, keyboard navigation, accessibility attributes, reduced-motion behavior, give up functionality.

## Tasks / Subtasks

- [x] Task 1: Create MemoryGrid game types and utilities (AC: #3, #5, #6, #7, #12)
  - [x] 1.1 Add MemoryGrid types to `src/features/cognition/types.ts`: `MemoryGridGameState`, `MemoryGridResult`, `MemoryGridPhase` ('displaying' | 'recalling' | 'feedback' | 'complete'), pattern length constants per round
  - [x] 1.2 Create `src/features/cognition/utils/memoryGridUtils.ts` — pure functions: `generatePattern(gridSize, patternLength)` returns array of square indices, `comparePatterns(original, userSelection)` returns boolean, `getPatternLengthForRound(round)` returns number, `getEncouragementMessage(roundsCompleted)` returns string
  - [x] 1.3 Create `src/features/cognition/utils/memoryGridUtils.test.ts` — ~15 tests: pattern generation returns correct count with no duplicates and all indices within 0-24, pattern comparison exact match = true / partial = false / extras = false, pattern length for rounds 1-3 = 3 / 4-6 = 5 / 7 = 7 / 8 = 8 / max cap at 12, encouragement messages for each bracket

- [x] Task 2: Build MemoryGridGame component (AC: #2, #3, #4, #5, #6, #7, #8, #9, #11)
  - [x] 2.1 Create `src/features/cognition/games/MemoryGridGame.tsx` with props `{ onBack: () => void }`
  - [x] 2.2 Implement 5x5 grid layout using CSS grid (`grid-template-columns: repeat(5, 60px)`, gap 4px)
  - [x] 2.3 Implement pattern display phase: highlight N random squares in coral for 2 seconds, disable grid interaction, pulse animation (Framer Motion with `useReducedMotion()`)
  - [x] 2.4 Implement recall phase: click to toggle squares on/off, Submit button (enabled when selection.length > 0), Give Up button
  - [x] 2.5 Implement answer evaluation: compare user selection to original pattern, correct = green flash + advance, incorrect = gold flash + show correct pattern for 1.5s + lose life
  - [x] 2.6 Implement lives system: 3 lives displayed as filled/empty circles, game over at 0 lives
  - [x] 2.7 Implement round progression with difficulty scaling (pattern length increases per round)
  - [x] 2.8 Implement game over modal (shadcn/ui Dialog) with stats, encouragement, Play Again / Back to Games buttons
  - [x] 2.9 Implement accessibility: roving tabindex for 5x5 grid (arrow key navigation), aria-labels on all squares with phase-appropriate state, aria-live regions for stats and feedback, focus-visible rings, `useReducedMotion()`
  - [x] 2.10 Track game duration: start timer on round 1 display, stop on game over
  - [x] 2.11 Add timeout cleanup refs for pattern display (2s) and feedback display (1.5s) — prevent memory leaks on unmount (learned from Story 6.4 code review M1)

- [x] Task 3: Implement telemetry logging (AC: #10)
  - [x] 3.1 On game completion (lives = 0 or give up), log result to `db.telemetry_logs` — fire-and-forget with `.catch()` error handling
  - [x] 3.2 Track: roundsCompleted, longestPattern (max pattern length successfully recalled), duration (ms), livesRemaining

- [x] Task 4: Write MemoryGridGame component tests (AC: #13)
  - [x] 4.1 Create `src/features/cognition/games/MemoryGridGame.test.tsx`
  - [x] 4.2 Test grid renders 25 squares with correct aria-labels
  - [x] 4.3 Test pattern display phase: squares highlight, interaction disabled
  - [x] 4.4 Test pattern disappears after 2 seconds (use `vi.useFakeTimers()` — isolate to this test only, NOT global beforeEach)
  - [x] 4.5 Test recall phase: clicking squares toggles selection
  - [x] 4.6 Test Submit button disabled when no squares selected, enabled when >= 1 selected
  - [x] 4.7 Test correct answer: green feedback, round advances, pattern length increases
  - [x] 4.8 Test incorrect answer: gold feedback, life lost, correct pattern shown briefly
  - [x] 4.9 Test game over modal appears when lives = 0
  - [x] 4.10 Test game over modal stats (rounds completed, longest pattern)
  - [x] 4.11 Test telemetry logged on game over
  - [x] 4.12 Test Play Again resets game state (lives, round, score)
  - [x] 4.13 Test Back to Games calls onBack
  - [x] 4.14 Test Give Up: loses life, shows correct pattern
  - [x] 4.15 Test keyboard navigation: arrow keys move focus in 5x5 grid, Enter/Space toggles
  - [x] 4.16 Test accessibility: aria-labels update per phase, aria-live announcements
  - [x] 4.17 Test reduced-motion: pulse animation disabled when `useReducedMotion()` returns true

- [x] Task 5: Integrate into CognitionRoute and update exports (AC: #1)
  - [x] 5.1 Modify `src/routes/CognitionRoute.tsx` — import MemoryGridGame, change Memory Grid card `available` to `true`, add `onPlay` handler `() => setSelectedGame('memory-grid')`, add game view case `if (selectedGame === 'memory-grid') return <MemoryGridGame onBack={() => setSelectedGame(null)} />;`
  - [x] 5.2 Update `src/features/cognition/index.ts` — export new types and utility functions
  - [x] 5.3 Update `src/routes/CognitionRoute.test.tsx` — add test for Memory Grid card availability and game launch (handle 3 Play buttons with `getAllByRole`)
  - [x] 5.4 Run `npx tsc --noEmit` — zero errors
  - [x] 5.5 Run `npx vitest run` — full suite passes, no regressions

- [x] **VERIFICATION: Manual Browser Testing** [MANDATORY - cannot be skipped]
  - [x] Run dev server (`npm run dev`) and navigate to `/cognition`
  - [x] Verify Memory Grid card shows "Play" button (not "Coming soon")
  - [x] Play a full game: watch pattern display, recall from memory, submit answer
  - [x] Verify correct answer = green feedback + next round with longer pattern
  - [x] Verify incorrect answer = gold/amber feedback + life lost + correct pattern shown
  - [x] Verify game over modal appears when lives = 0 with accurate stats
  - [x] Verify Play Again resets everything, Back to Games returns to selection
  - [x] Verify accessibility: keyboard nav through grid, focus indicators visible
  - [x] Verify pattern display phase prevents interaction (clicking should do nothing)
  - [x] Document verification results in Dev Agent Record

## Dev Notes

### Architecture & Design Patterns

- **Pure functional utilities:** `memoryGridUtils.ts` MUST be pure functions — pattern generation, pattern comparison, difficulty progression, encouragement selection. No side effects, no Dexie queries, no React hooks. Follow the exact pattern of `gameUtils.ts` (Story 6.3) and `spatialFlipUtils.ts` (Story 6.4).
- **Feature-based folder structure:** All code lives under `src/features/cognition/`. Reuse existing types from `types.ts` (`GameDifficulty` is already shared, but this game uses round-based progression, not difficulty tabs).
- **Local-first storage:** Game results logged to Dexie `telemetry_logs` table. No server calls. No custom table — use the existing telemetry system.
- **Component pattern:** Follow `PatternMatchGame.tsx` and `SpatialFlipGame.tsx` structure — same `onBack` prop pattern, same shadcn/ui Dialog for completion modal, same telemetry logging approach.

### CRITICAL: Epic Spec Corrections

The epic stub has **two errors** in the telemetry example:
1. `id: uuid()` — **WRONG.** TelemetryLog.id is auto-increment. Do NOT provide an id.
2. `timestamp: Date.now()` — **WRONG.** TelemetryLog.timestamp is an ISO 8601 string. Use `new Date().toISOString()`.

**Correct telemetry logging pattern** (from Stories 6.3 & 6.4):
```typescript
db.telemetry_logs.add({
  timestamp: new Date().toISOString(),
  event: 'cognition_game_complete',
  module: 'memory_grid',
  data: {
    roundsCompleted: 8,
    longestPattern: 9,
    duration: 180000,
    livesRemaining: 1,
  },
  userId: 'local_user',
}).catch(err => console.error('Failed to log telemetry:', err));
```

### CRITICAL: Incorrect Feedback Color

The app uses **gold/amber** (`border-yellow-500`) for incorrect feedback, NOT red. Red triggers math anxiety in dyscalculia users. Follow the same pattern as PatternMatchGame and SpatialFlipGame.

### Memory Grid is NOT a Difficulty-Tab Game

Unlike Pattern Match (Easy/Medium/Hard tabs) and Spatial Flip (Easy/Medium/Hard tabs), Memory Grid uses **round-based difficulty progression** within a single game session. There are NO difficulty selector tabs. The challenge increases automatically as the player succeeds.

**Difficulty progression algorithm:**
```typescript
function getPatternLengthForRound(round: number): number {
  if (round <= 3) return 3;    // Rounds 1-3: 3 squares
  if (round <= 6) return 5;    // Rounds 4-6: 5 squares
  const length = 7 + (round - 7); // Round 7: 7, Round 8: 8, etc.
  return Math.min(length, 12); // Cap at 12 (nearly half the 25-square grid)
}
```

### Game State Machine

```
START → DISPLAYING (show pattern 2s) → RECALLING (user selects) → FEEDBACK
                                                                    ↓
                                              correct: advance round → DISPLAYING
                                              incorrect: lose life
                                                ↓                     ↓
                                          lives > 0 → DISPLAYING   lives = 0 → COMPLETE
```

**Game phases:**
- `displaying`: Pattern shown, grid non-interactive, 2-second timer
- `recalling`: Pattern hidden, user clicks to select squares, Submit/Give Up buttons
- `feedback`: Brief feedback display (correct=green, incorrect=gold + show answer), 1.5s then auto-advance
- `complete`: Game over, show results modal

### Pattern Generation Algorithm

```typescript
function generatePattern(gridSize: number, patternLength: number): number[] {
  // gridSize = 25 (5x5 grid), patternLength = 3-12
  const indices = Array.from({ length: gridSize }, (_, i) => i);
  const shuffled = shuffleArray(indices); // Reuse from gameUtils.ts
  return shuffled.slice(0, patternLength).sort((a, b) => a - b);
}
```

**Important:** Sort the pattern indices for consistent comparison. `comparePatterns` should compare sorted arrays.

### Pattern Comparison

```typescript
function comparePatterns(original: number[], userSelection: number[]): boolean {
  if (original.length !== userSelection.length) return false;
  const sortedOriginal = [...original].sort((a, b) => a - b);
  const sortedUser = [...userSelection].sort((a, b) => a - b);
  return sortedOriginal.every((val, idx) => val === sortedUser[idx]);
}
```

**Must be exact match:** Same squares selected, no extras, no missing. Partial matches are incorrect.

### Game UI Layout

```
[Round 5]           [Pattern: 7 squares]           [Lives: ●●○]

        ┌────┬────┬────┬────┬────┐
        │    │ ██ │    │    │ ██ │    (coral = highlighted)
        ├────┼────┼────┼────┼────┤
        │    │    │ ██ │    │    │
        ├────┼────┼────┼────┼────┤
        │ ██ │    │    │    │ ██ │
        ├────┼────┼────┼────┼────┤
        │    │    │    │ ██ │    │
        ├────┼────┼────┼────┼────┤
        │    │ ██ │    │    │    │
        └────┴────┴────┴────┴────┘

        [Submit]                [Give Up]
```

### Square Visual States

| State | Class | When |
|-------|-------|------|
| Inactive | `bg-muted border border-border` | Default, display phase (not highlighted) |
| Highlighted (display) | `bg-primary border-primary` | Display phase, part of pattern |
| Selected (recall) | `bg-primary border-primary` | Recall phase, user-selected |
| Unselected (recall) | `bg-muted border border-border cursor-pointer hover:bg-muted/80` | Recall phase, not selected |
| Correct feedback | `border-2 border-green-500` | Entire grid border on correct answer |
| Incorrect feedback | `border-2 border-yellow-500` | Entire grid border on incorrect answer |
| Correct pattern reveal | `bg-primary/50` | Showing correct answer after incorrect (semi-transparent coral) |

### Existing APIs to Consume (DO NOT reinvent)

**Database** (`src/services/storage/db.ts`):
```typescript
db.telemetry_logs.add({ timestamp, event, module, data, userId })  // Log game result
```

**Schemas** (`src/services/storage/schemas.ts`):
```typescript
interface TelemetryLog {
  id?: number;           // Auto-increment — do NOT provide
  timestamp: string;     // ISO 8601
  event: string;         // 'cognition_game_complete'
  module: string;        // 'memory_grid'
  data: Record<string, any>;
  userId: string;        // Always 'local_user'
}
```

**Existing utilities to reuse:**
```typescript
// From cognition feature (Story 6.3)
import { shuffleArray } from '../utils/gameUtils';  // Fisher-Yates shuffle — reuse for pattern generation

// shadcn/ui components
import { Button } from '@/shared/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/shared/components/ui/dialog';
```

### CognitionRoute Integration

Current `CognitionRoute.tsx` has the Memory Grid card with `LayoutGrid` icon and `available={false}`. Changes needed:
```tsx
// Import MemoryGridGame
import MemoryGridGame from '@/features/cognition/games/MemoryGridGame';

// Change available to true and wire up onPlay
<GameCard
  title="Memory Grid"
  description="Remember and recall patterns"
  icon={LayoutGrid}
  available={true}  // was: false
  onPlay={() => setSelectedGame('memory-grid')}  // was: () => {}
/>

// Add game view case (after spatial-flip case)
if (selectedGame === 'memory-grid') {
  return <MemoryGridGame onBack={() => setSelectedGame(null)} />;
}
```

### Testing Requirements

**Framework:** Vitest + React Testing Library (RTL)

**Test patterns from project-context.md:**
- `useEffect` timing: wrap assertions in `await waitFor(() => { ... })`
- Mock cleanup: `vi.clearAllMocks()` in `beforeEach` (preserves factories)
- Mock Dexie: `vi.mock('@/services/storage/db')`
- Mock Framer Motion: `vi.mock('framer-motion', () => ({ motion: { div: 'div', span: 'span', button: 'button' }, useReducedMotion: vi.fn(() => false), AnimatePresence: ({ children }) => children }))`
- `vi.useFakeTimers()` for timer tests — isolate to specific tests (NOT global `beforeEach`). Always `vi.useRealTimers()` in cleanup.
- **Timer testing gotcha from Story 6.3:** Global `vi.useFakeTimers()` in `beforeEach` conflicted with userEvent. Isolate fake timers to only timer-specific tests with `{ shouldAdvanceTime: true }`.
- **Radix Dialog aria-hidden gotcha from Story 6.3:** When shadcn/ui Dialog opens, it applies `aria-hidden="true"` to underlying content. Use `document.querySelectorAll()` for DOM queries behind the modal, NOT `screen.getAllByRole()`.
- **Timeout cleanup refs from Story 6.4 code review:** Track all setTimeout IDs with refs. Add unmount cleanup effect to clear pending timeouts. Prevents memory leaks if component unmounts during pattern display or feedback phases.

**Expected test count:** ~35 tests total
- `memoryGridUtils.test.ts`: ~15 tests (pattern generation, comparison, difficulty progression, encouragement)
- `MemoryGridGame.test.tsx`: ~17 tests (rendering, phases, interaction, feedback, game over, telemetry, a11y)
- `CognitionRoute.test.tsx`: ~3 additional tests (Memory Grid card available, game launch, 3 Play buttons)

**TypeScript verification:** Run `npx tsc --noEmit` before marking complete.

### Previous Story Intelligence (Story 6.4 - Spatial Flip)

**What worked well:**
- Pure functional `spatialFlipUtils.ts` — clean, testable, composable. Follow same pattern for `memoryGridUtils.ts`.
- `SpatialFlipGame.tsx` component structure with `onBack` prop, state machine phases, shadcn/ui Dialog for completion modal.
- Timeout cleanup refs pattern (added in code review) — apply from the start.
- `getChoiceStyle` export with branch tests — keep utility functions testable.

**Code review findings applied proactively:**
- **M1 from Story 6.4:** setTimeout IDs tracked with refs + unmount cleanup — apply to pattern display (2s) and feedback (1.5s) timeouts.
- **L4 from Story 6.4:** Reset all state variables in resetGame — don't forget pattern, userSelection, lives, round, etc.
- **H1 from Story 6.3:** Roving tabindex grid navigation — implement from the start for 5x5 grid.
- **M2 from Story 6.3:** Include stats in aria-live announcements — announce round and pattern length.
- **M3 from Story 6.3:** No no-op assertions — every test must have real assertions.
- **L2 from Story 6.3/6.4:** Shape/square visibility — use `border border-border` on squares to prevent invisible edges.

**Debugging gotchas resolved in Stories 6.3/6.4:**
- `vi.useFakeTimers()` in global `beforeEach` breaks `userEvent` — isolate to specific tests only.
- Radix Dialog `aria-hidden` blocks `screen.getAllByRole()` — use `document.querySelectorAll()` behind modals.
- Multiple Play buttons in CognitionRoute after enabling games — use `getAllByRole('button', { name: /play/i })` with index.

### Project Structure Notes

- Alignment with unified project structure: all files under `src/features/cognition/` following established pattern
- New utility file `memoryGridUtils.ts` follows existing `gameUtils.ts` and `spatialFlipUtils.ts` naming convention
- No new localStorage keys needed — this game doesn't have a timer toggle (no timer feature)
- Cross-feature import of `shuffleArray` from `gameUtils.ts` is the intended reuse pattern

### File Structure

**Files to CREATE:**
```
src/features/cognition/utils/memoryGridUtils.ts       # Pure functions: pattern gen, comparison, progression, encouragement
src/features/cognition/utils/memoryGridUtils.test.ts   # Utility tests (~15)
src/features/cognition/games/MemoryGridGame.tsx        # Main game component
src/features/cognition/games/MemoryGridGame.test.tsx   # Component tests (~17)
```

**Files to MODIFY:**
```
src/features/cognition/types.ts                         # Add MemoryGrid types
src/features/cognition/index.ts                         # Export new public API
src/routes/CognitionRoute.tsx                           # Enable Memory Grid card, add game view
src/routes/CognitionRoute.test.tsx                      # Add Memory Grid tests (handle 3 Play buttons)
```

### References

- [Source: docs/epics.md#Story 6.5] — User story, ACs, game mechanics, difficulty progression, telemetry
- [Source: docs/project-context.md] — Testing patterns, coding conventions, triple-check protocol
- [Source: src/features/cognition/types.ts] — Existing cognition types (Tile, GameDifficulty, etc.)
- [Source: src/features/cognition/utils/gameUtils.ts] — shuffleArray (reuse), pure function pattern
- [Source: src/features/cognition/games/PatternMatchGame.tsx] — Component structure, telemetry, completion modal pattern
- [Source: src/features/cognition/games/SpatialFlipGame.tsx] — Component structure, timeout cleanup refs, state machine pattern
- [Source: src/routes/CognitionRoute.tsx] — GameCard component, selectedGame state, Memory Grid card placeholder
- [Source: src/services/storage/schemas.ts] — TelemetryLog interface (id auto-increment, timestamp ISO string)
- [Source: src/services/storage/db.ts] — Dexie database telemetry_logs table
- [Source: docs/stories/6-4-implement-spatial-flip-mini-game.md] — Previous story debug log, code review findings
- [Source: docs/stories/6-3-implement-pattern-match-mini-game.md] — Foundational game patterns, code review findings

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (claude-opus-4-6)

### Debug Log References

- **TypeScript unused variable errors** in MemoryGridGame.tsx: Removed dead `row`, `col`, `isFirstInRow`, `isLastInRow` variables from grid rendering loop (leftover from initial row-wrapping plan).
- **TypeScript unused import errors** in MemoryGridGame.test.tsx: Removed unused `userEvent` and `generatePattern` imports.
- **Export name conflict** in index.ts: Both `spatialFlipUtils` and `memoryGridUtils` export `getEncouragementMessage`. Aliased the memoryGridUtils version as `getMemoryGridEncouragement`.

### Completion Notes List

- All 13 acceptance criteria met
- TypeScript: zero errors (`npx tsc --noEmit`)
- Test suite: 98/98 files passing, 1853/1853 tests (31 memoryGridUtils + 28 MemoryGridGame + 10 CognitionRoute tests)
- Browser verification: All 6 game phases visually confirmed via Playwright screenshots
- Gold/amber feedback color used for incorrect answers (not red) — anxiety-reducing for dyscalculia users
- Timeout cleanup refs implemented from the start (learned from Story 6.4 code review M1)
- Roving tabindex keyboard navigation for 5x5 grid with arrow keys + Enter/Space
- Framer Motion pulse animation with `useReducedMotion()` support

### Code Review Fixes Applied

- **H1**: Fixed difficulty progression formula — `7 + (round - 7)` for Round 7+ (was `5 + (round - 6)` producing 6 for round 7, AC requires 7)
- **M1**: Changed header back button text from "← Back" to "← Back to Games" for consistency with PatternMatch and SpatialFlip
- **M2**: Added 2 CognitionRoute tests: Memory Grid game launch (`playButtons[2]`) and back navigation
- **M3**: Blocked Game Over dialog dismiss via Escape/outside-click (added `onPointerDownOutside` + `onEscapeKeyDown` prevention, matching PatternMatchGame pattern)
- **L1**: Changed encouragement message to use `round` (reached round) instead of `roundsCompleted` to match AC #9 semantics
- **L2**: Fixed Dev Notes algorithm comment to match corrected formula

### File List

**Files CREATED:**
- `src/features/cognition/utils/memoryGridUtils.ts` — Pure utility functions (generatePattern, comparePatterns, getPatternLengthForRound, getEncouragementMessage, indexToRowCol)
- `src/features/cognition/utils/memoryGridUtils.test.ts` — 31 unit tests
- `src/features/cognition/games/MemoryGridGame.tsx` — Main game component (~458 lines)
- `src/features/cognition/games/MemoryGridGame.test.tsx` — 28 component tests

**Files MODIFIED:**
- `src/features/cognition/types.ts` — Added MemoryGridPhase, MemoryGridResult, MEMORY_GRID_* constants
- `src/features/cognition/index.ts` — Added Memory Grid type/constant/utility exports
- `src/routes/CognitionRoute.tsx` — Enabled Memory Grid card, added game view case
- `src/routes/CognitionRoute.test.tsx` — Updated for 3 Play buttons, no Coming Soon text, added Memory Grid launch + back tests
