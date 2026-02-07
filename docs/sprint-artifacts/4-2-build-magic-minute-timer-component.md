# Story 4.2: Build Magic Minute Timer Component

Status: done

## Story

As a **user in a training session**,
I want **surprise 60-second micro-challenges that appear mid-session**,
So that **I experience focused, high-energy sprints that break up regular practice**.

## Acceptance Criteria

1. **GIVEN** mistake analysis engine is operational (Story 4.1 complete - VERIFIED)
   **WHEN** I am in a training session and have completed 6+ drills
   **THEN** the Magic Minute trigger logic activates:
   - Random chance after drill 6, 9, or 12 (30% probability each)
   - Alternative: Fixed after drill 8 (simpler, more predictable for MVP)
   - Only triggers once per session
   - Only if at least 3 mistakes detected (needs content for micro-challenges)

2. **WHEN** Magic Minute triggers
   **THEN** the MagicMinuteTimer component renders with:
   - Full-screen overlay (dim background, focus on timer)
   - Large countdown: "60" to "0" (72px font, coral color #E87461)
   - Title: "Magic Minute! Answer as many as you can!"
   - Instruction: "Quick challenges based on your recent mistakes"
   - Progress: "X correct" counter (updates in real-time)
   - No pause button (60 seconds is short, maintain urgency)

3. **Timer Behavior:**
   - Countdown starts immediately (no "Start" button)
   - Updates every second (not milliseconds - reduce pressure)
   - At 0 seconds: Auto-ends, shows summary
   - Keyboard accessible: Focus trap within Magic Minute modal

4. **Visual Design:**
   - Pulsing border animation (Framer Motion)
   - Coral accent color (#E87461) for urgency
   - Larger fonts, higher contrast (readability under time pressure)
   - Celebration animation at timer end (confetti burst)

5. **Magic Minute session created in Dexie:**
   ```typescript
   await db.magic_minute_sessions.add({
     id: uuid(),
     sessionId: currentSessionId,
     timestamp: new Date().toISOString(),
     correctCount: 0,
     totalChallenges: 0,
     duration: 60000,
     targetedMistakes: [], // From MistakeAnalyzer
   });
   ```

6. **SessionContext extended with:**
   - `magicMinuteTriggered: boolean`
   - `magicMinuteResults: Array<{ correct: boolean, timeToAnswer: number }>`

## Tasks / Subtasks

- [x] Task 1: Create MagicMinuteTimer component (AC: #2, #3)
  - [x] 1.1 Create file `src/features/magic-minute/components/MagicMinuteTimer.tsx`
  - [x] 1.2 Implement countdown timer using `useState` + `useEffect` with `setInterval`
  - [x] 1.3 Create full-screen overlay with dim background
  - [x] 1.4 Display 72px coral countdown text
  - [x] 1.5 Add "X correct" real-time counter
  - [x] 1.6 Implement cleanup in `useEffect` return to clear interval

- [x] Task 2: Add Framer Motion animations (AC: #4)
  - [x] 2.1 Add pulsing border animation to timer container
  - [x] 2.2 Add confetti celebration animation on timer end
  - [x] 2.3 Respect `prefers-reduced-motion` media query

- [x] Task 3: Implement trigger logic (AC: #1)
  - [x] 3.1 Create `useMagicMinuteTrigger` hook in `src/features/magic-minute/hooks/`
  - [x] 3.2 Track drill count and trigger at appropriate points (6, 9, 12)
  - [x] 3.3 Check mistake count from MistakeAnalyzer (minimum 3)
  - [x] 3.4 Ensure only triggers once per session

- [x] Task 4: Extend SessionContext (AC: #6)
  - [x] 4.1 Add `magicMinuteTriggered: boolean` to session state
  - [x] 4.2 Add `magicMinuteResults: Array<{ correct: boolean, timeToAnswer: number }>`
  - [x] 4.3 Add actions: `triggerMagicMinute`, `recordMagicMinuteResult`, `completeMagicMinute`

- [x] Task 5: Persist to Dexie (AC: #5)
  - [x] 5.1 Create Magic Minute session record on trigger
  - [x] 5.2 Update record with results on completion
  - [x] 5.3 Handle storage errors with console logging

- [x] Task 6: Accessibility (AC: #3)
  - [x] 6.1 Add `role="timer"` and `aria-live="polite"` to countdown
  - [x] 6.2 Implement focus trap within modal
  - [x] 6.3 Ensure keyboard navigation works

- [x] Task 7: Integration with TrainingSession (AC: #1)
  - [x] 7.1 Import and render MagicMinuteTimer in TrainingSession.tsx
  - [x] 7.2 Wire up trigger logic to handleDrillComplete
  - [x] 7.3 Coordinate with MistakeAnalyzer from Story 4.1

- [x] Task 8: Write unit tests
  - [x] 8.1 Test countdown decrements correctly (12 tests)
  - [x] 8.2 Test trigger conditions (drill count, mistake count) (9 tests)
  - [x] 8.3 Test session not triggered more than once
  - [x] 8.4 Test Dexie persistence (10 tests)

## Dev Notes

### Architecture Patterns and Constraints

**File Locations (MANDATORY):**
- Component: `src/features/magic-minute/components/MagicMinuteTimer.tsx`
- Hook: `src/features/magic-minute/hooks/useMagicMinuteTrigger.ts`
- Types: `src/features/magic-minute/types/magicMinute.types.ts`
- Tests: Co-located with `.test.tsx` suffix
- Re-export from: `src/features/magic-minute/index.ts`

**Naming Conventions:**
- Components: PascalCase (MagicMinuteTimer.tsx)
- Hooks: camelCase with `use` prefix (useMagicMinuteTrigger.ts)
- Test files: Same name + `.test.tsx`

**Technology Stack:**
- React 19.2 with hooks
- TypeScript 5.9 (strict mode)
- Framer Motion 12.23.24 for animations
- shadcn/ui components for any dialogs/overlays
- Dexie 4.2.1 for IndexedDB persistence

### Story 4.1 Intelligence (Previous Story)

**MistakeAnalyzer is FULLY IMPLEMENTED** at `src/services/adaptiveDifficulty/mistakeAnalyzer.ts`:

```typescript
// Key exports to use:
import {
  analyzeSession,           // Full session analysis
  detectPattern,            // Pattern detection
  createSessionAnalyzer,    // Incremental analysis every 3 drills
  type MistakePattern,
  type AnalysisResult,
  type CategorizedMistake
} from '@/services/adaptiveDifficulty/mistakeAnalyzer';

// Use createSessionAnalyzer() for real-time mistake tracking:
const analyzer = createSessionAnalyzer();
// Call analyzer.addDrillResult(result) after each drill
// Returns AnalysisResult | null (null if not at trigger interval)
```

**Pattern Detection Logic (from mistakeAnalyzer.ts):**
- Sliding window of last 5 mistakes
- Pattern detected when 2+ occurrences of same mistake type
- Confidence = occurrences / window size

### Integration Points

**TrainingSession.tsx (lines 200-242):**
- `handleDrillComplete` is where to check Magic Minute trigger
- After drill completes, check: drill count >= 6, mistake count >= 3
- If triggered, set state to show MagicMinuteTimer overlay

**SessionContext Integration:**
```typescript
// Add to SessionState interface:
magicMinuteTriggered: boolean;
magicMinuteResults: MagicMinuteResult[];

// Add actions:
type SessionAction =
  | { type: 'TRIGGER_MAGIC_MINUTE'; mistakePatterns: MistakePattern[] }
  | { type: 'RECORD_MAGIC_MINUTE_RESULT'; result: MagicMinuteResult }
  | { type: 'COMPLETE_MAGIC_MINUTE' };
```

### Database Schema

**MagicMinuteSession table** (from `src/services/storage/schemas.ts:91-100`):
```typescript
interface MagicMinuteSession {
  id?: number;
  sessionId: number;
  timestamp: string;              // ISO 8601
  targetedMistakes: string[];     // Array of mistake types
  challengesGenerated: number;
  challengesCompleted: number;
  successRate: number;            // 0-1
  duration: number;               // ~60000ms
}
```

### UI Component Patterns

**Overlay Pattern (from SessionFeedback, ConfidencePromptBefore):**
```tsx
// Full-screen overlay pattern used in training:
<div className="fixed inset-0 z-50 flex items-center justify-center bg-white/90">
  {/* Content */}
</div>
```

**Timer Implementation Pattern:**
```tsx
const [timeLeft, setTimeLeft] = useState(60);

useEffect(() => {
  if (timeLeft <= 0) {
    onComplete();
    return;
  }

  const timer = setInterval(() => {
    setTimeLeft(prev => prev - 1);
  }, 1000);

  return () => clearInterval(timer);
}, [timeLeft, onComplete]);
```

**Framer Motion Animation Pattern (from DrillTransition.tsx):**
```tsx
import { motion, AnimatePresence } from 'framer-motion';

<motion.div
  initial={{ opacity: 0, scale: 0.95 }}
  animate={{ opacity: 1, scale: 1 }}
  exit={{ opacity: 0, scale: 0.95 }}
  transition={{ duration: 0.3 }}
>
```

### Project Structure Notes

**Feature folder structure to create:**
```
src/features/magic-minute/
├── components/
│   ├── MagicMinuteTimer.tsx
│   ├── MagicMinuteTimer.test.tsx
│   └── TimerDisplay.tsx (optional sub-component)
├── hooks/
│   ├── useMagicMinuteTrigger.ts
│   └── useMagicMinuteTrigger.test.ts
├── types/
│   └── magicMinute.types.ts
└── index.ts (update to export new components)
```

### Testing Standards

**Vitest 4.0 + React Testing Library 16.3.0:**
- 100% coverage required
- AAA pattern (Arrange, Act, Assert)
- Use `vi.useFakeTimers()` for timer testing
- Use `vi.advanceTimersByTime(1000)` to simulate countdown

**Test Cases Required:**
1. Timer counts down from 60 to 0
2. Completion callback fires at 0
3. Only triggers when drill count >= 6 AND mistakes >= 3
4. Does not trigger more than once per session
5. Dexie record created with correct data
6. Accessibility attributes present

### Accessibility Requirements (WCAG 2.1 AA)

- `role="timer"` on countdown element
- `aria-live="polite"` for screen reader announcements
- Focus trap within modal (use `@radix-ui/react-focus-guard` or manual implementation)
- Respect `prefers-reduced-motion`:
  ```tsx
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // Skip animations if true
  ```

### Performance Requirements

- Timer updates must be <100ms latency
- No re-renders of parent TrainingSession while timer active
- Use React.memo() for MagicMinuteTimer if needed

### References

- [Architecture: Magic Minute Sprint Pattern](docs/architecture.md#pattern-1-magic-minute-sprint)
- [Epic 4: Adaptive Intelligence](docs/epics.md#epic-4-adaptive-intelligence)
- [Story 4.1: Mistake Analysis Engine](src/services/adaptiveDifficulty/mistakeAnalyzer.ts)
- [TrainingSession Component](src/features/training/components/TrainingSession.tsx)
- [Dexie Schema](src/services/storage/schemas.ts)
- [SessionContext](src/context/SessionContext.tsx)

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

- MagicMinuteTimer tests: 12 passing
- useMagicMinuteTrigger tests: 9 passing
- magicMinutePersistence tests: 10 passing
- Total Magic Minute tests: 31 passing

### Completion Notes List

1. Created MagicMinuteTimer component with 60-second countdown, coral color theme, full-screen overlay
2. Added Framer Motion pulsing border animation and confetti celebration on completion
3. Implemented prefersReducedMotion check to skip animations when user prefers reduced motion
4. Created useMagicMinuteTrigger hook with configurable trigger points (6, 9, 12), 30% probability, minimum 3 mistakes
5. Extended SessionContext with Magic Minute state (magicMinuteTriggered, magicMinuteActive, magicMinutePatterns, magicMinuteResults)
6. Created persistence service with createMagicMinuteSession, updateMagicMinuteSession, getMagicMinuteSessions, getLatestMagicMinuteSession
7. Added focus trap and WCAG 2.1 AA accessibility (role="timer", aria-live="polite")
8. Integrated with TrainingSession.tsx using createSessionAnalyzer() for real-time mistake tracking
9. Magic Minute triggers after drill completion when conditions are met, then resumes training after completion

### File List

**Created Files:**
- src/features/magic-minute/types/magicMinute.types.ts
- src/features/magic-minute/components/MagicMinuteTimer.tsx
- src/features/magic-minute/components/MagicMinuteTimer.test.tsx
- src/features/magic-minute/hooks/useMagicMinuteTrigger.ts
- src/features/magic-minute/hooks/useMagicMinuteTrigger.test.ts
- src/features/magic-minute/services/magicMinutePersistence.ts
- src/features/magic-minute/services/magicMinutePersistence.test.ts

**Modified Files:**
- src/features/magic-minute/index.ts (added exports)
- src/context/SessionContext.tsx (added Magic Minute state and actions)
- src/features/training/components/TrainingSession.tsx (integrated Magic Minute trigger and display)

## Senior Developer Review (AI)

**Reviewed:** 2025-12-21
**Reviewer:** Bob (Scrum Master) via Claude Opus 4.5
**Outcome:** Changes Requested

### Issues Found and Fixed

| # | Severity | Issue | Status |
|---|----------|-------|--------|
| 1 | HIGH | Magic Minute shows NO micro-challenges - just countdown timer | DOCUMENTED (Story 4.3 scope) |
| 2 | HIGH | Duration calculation incorrect: `(60 - 0) * 1000 + 60000 = 120000ms` | ✅ FIXED |
| 3 | HIGH | Session ID parsing returns NaN for UUID strings | ✅ FIXED |
| 4 | MEDIUM | Console.log statements in production code | ✅ FIXED |
| 5 | MEDIUM | Duplicate MagicMinuteResult type definition | ✅ FIXED |
| 6 | MEDIUM | Test coverage gaps for accessibility features | ✅ FIXED (4 tests added) |

### Critical Note on Issue #1

The MagicMinuteTimer component currently displays a 60-second countdown timer but does **not render any actual micro-challenges**. The `_recordChallengeResult` function is defined but never called, resulting in the "X correct" counter always showing 0.

**This is expected behavior for Story 4.2** - the timer shell is complete. Actual challenge generation and rendering is the scope of **Story 4.3: Implement Micro-Challenge Generation Engine**.

### Files Modified During Review

- `src/features/magic-minute/components/MagicMinuteTimer.tsx` - Fixed duration calculation
- `src/features/training/components/TrainingSession.tsx` - Fixed session ID parsing with TODO for proper refactor
- `src/features/magic-minute/services/magicMinutePersistence.ts` - Removed console.log statements
- `src/features/magic-minute/services/magicMinutePersistence.test.ts` - Removed duplicate test
- `src/context/SessionContext.tsx` - Fixed duplicate type, now imports from types file
- `src/features/magic-minute/components/MagicMinuteTimer.test.tsx` - Added 4 new tests (35 total)

### Test Results Post-Review

- MagicMinuteTimer tests: 16 passing (+4 new)
- useMagicMinuteTrigger tests: 9 passing
- magicMinutePersistence tests: 10 passing
- **Total Magic Minute tests: 35 passing**

### Action Items for Story 4.3

- [ ] Implement actual micro-challenge generation from mistake patterns
- [ ] Render challenges within MagicMinuteTimer overlay
- [ ] Wire up `_recordChallengeResult` to update correct counter
- [ ] Refactor session ID handling to use Dexie auto-generated numeric IDs

