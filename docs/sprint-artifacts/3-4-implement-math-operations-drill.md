# Story 3.4: Implement Math Operations Drill

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **user in a training session**,
I want **math operations drills that reinforce basic arithmetic**,
so that **I build automaticity with addition, subtraction, and multiplication**.

## Acceptance Criteria

1. **AC-1: Problem Display** - Given a training session is active with Math Operations drill selected, when the MathOperationsDrill component renders, then the drill displays a large arithmetic problem (e.g., "12 + 7 = ?") with the operation type label ("Addition", "Subtraction", "Multiplication") and a number keypad (0-9, backspace, clear, submit). User's typed answer is displayed above keypad (minimum 24px font). [Source: docs/epics.md#Story-3.4]

2. **AC-2: User Interaction Flow** - Given the problem is displayed, when the user types an answer using the number keypad and taps "Submit" (or presses Enter), then:
   - Correct answer: Green checkmark animation, "+1" animation, 1 second delay before confidence prompt
   - Incorrect answer: Red X animation, show correct answer (e.g., "12 + 7 = 19"), 1.5 second delay before confidence prompt
   [Source: docs/epics.md#Story-3.4, docs/epic-3-tech-spec.md#Performance-Requirements]

3. **AC-3: Confidence Prompt** - After visual feedback, a confidence prompt appears: "How confident were you?" with 3 buttons: "Guessed", "Unsure", "Confident". Selecting confidence triggers onComplete callback with full DrillResult. **Note:** This is an enhancement beyond the original epic spec (epics.md Story 3.4 specifies auto-advance after 1.5s with no per-drill confidence). Story 3.6 defines session-level confidence prompts (before/after session). This per-drill confidence coexists with Story 3.6's session-level prompts — per-drill captures in-the-moment confidence while session-level captures overall session confidence. [Source: Implementation enhancement, relates to docs/epics.md#Story-3.6]

4. **AC-4: Difficulty Progression** - Problem generation follows these rules:
   - **Easy:** Addition (single-digit: 3+5) and subtraction (no negatives: 9-4, 12-7)
   - **Medium:** Double-digit addition/subtraction (23+17, 56-23) plus single-digit multiplication (3x4, 6x7)
   - **Hard:** Multiplication up to 12x12 times tables, with 70% multiplication focus
   [Source: docs/epics.md#Story-3.4]

5. **AC-5: No Repeating Problems** - No repeating problems within the same session. The problem generator tracks used problems via `usedProblems: Set<string>` parameter and regenerates if a duplicate is produced (max 10 retries). Session-level tracking maintained in TrainingSession via `useRef`. [Source: docs/epics.md#Story-3.4, line 948]

6. **AC-6: Drill Result Persistence** - DrillResult is persisted to Dexie `drill_results` table. On Dexie failure, fallback to localStorage using `STORAGE_KEYS.DRILL_RESULTS_BACKUP` (`discalculas:drillResultsBackup`). All data stored locally only — no PII collected, no network calls. Result fields: sessionId, timestamp (ISO 8601), module (`math_operations`), difficulty, isCorrect, timeToAnswer (ms), accuracy (0 or 100). Math Operations-specific fields (optional in shared schema, required for this drill): operation, problem, userAnswer, correctAnswer, confidence. [Source: docs/architecture.md#Data-Architecture, docs/architecture.md#Security-Privacy]

7. **AC-7: Accessibility** - WCAG 2.1 AA compliance mandatory per architecture.md: role="application" with aria-label, aria-live regions for problem display and feedback, keyboard navigation (Enter to submit), 44px minimum tap targets on all buttons, screen reader announcements for correct/incorrect feedback, respect `prefers-reduced-motion` media query. [Source: docs/architecture.md#Accessibility, ADR-006]

8. **AC-8: Performance** - Keypad button press feedback <50ms. General targets: <100ms input latency, 60fps interactions, <2s load time. [Source: docs/epic-3-tech-spec.md#Performance-Requirements, docs/architecture.md#Performance]

## Deferred Requirements

- **Visual aids for easy mode** (e.g., dot groups for addition) — mentioned as optional in epics.md:908. Not implemented. Consider for future enhancement.
- **Mixed operations in sequence** — epics.md:945 mentions "Mixed operations in sequence (not shown, but recorded)". Not implemented. Consider for hard difficulty enhancement.

## Cross-Story Dependencies

| Story | Relationship | Notes |
|-------|-------------|-------|
| **3.1** (Training Session Shell) | Prerequisite | TrainingSession.tsx manages drill queue. drillSelector.ts must support `math_operations` type. |
| **3.2** (Number Line Drill) | Sibling pattern | Established DrillProps interface and drill result persistence pattern. |
| **3.3** (Spatial Rotation Drill) | Direct prerequisite | Must be complete before 3.4. Established feedback animation pattern, localStorage fallback, keyboard nav. |
| **3.5** (Drill Session UI) | Forward dependency | Defines SessionFeedback component. Story 3.4 implements its own inline feedback (green check/red X) rather than using 3.5's shared component. No conflict — 3.5 adds progress bar, streak display, session-level UI around the drill. |
| **3.6** (Confidence Prompts) | Overlapping concern | Story 3.6 defines session-level confidence prompts (before first drill, after last drill). Story 3.4 adds per-drill confidence as an enhancement. Both coexist — per-drill captures immediate confidence, session-level captures overall. |
| **3.7** (Session Telemetry) | Overlapping concern | Story 3.7 handles session-level telemetry infrastructure. Story 3.4 implements drill-level persistence directly to Dexie. No conflict — 3.7 aggregates session data, 3.4 writes individual drill results. |

## Tasks / Subtasks

- [x] Task 1: Create Problem Generator Service (AC: #4)
  - [x] Subtask 1.1: Create `src/services/training/problemGenerator.ts`
  - [x] Subtask 1.2: Implement `generateAddition(difficulty)` — single-digit for easy, double-digit for medium/hard
  - [x] Subtask 1.3: Implement `generateSubtraction(difficulty)` — ensure no negative results
  - [x] Subtask 1.4: Implement `generateMultiplication(difficulty)` — 1-5 for easy fallback, 1-9 for medium, 1-12 for hard
  - [x] Subtask 1.5: Implement `generateProblem(difficulty)` — weighted random operation selection per difficulty

- [x] Task 1B: Implement Duplicate Problem Prevention (AC: #5)
  - [x] Subtask 1B.1: Add `usedProblems?: Set<string>` parameter to `generateProblem()` in `problemGenerator.ts`
  - [x] Subtask 1B.2: Check generated problem string against usedProblems set, regenerate if duplicate (max 10 retries then accept)
  - [x] Subtask 1B.3: Track usedProblems at session level in TrainingSession.tsx via `useRef`, pass as prop to MathOperationsDrill
  - [x] Subtask 1B.4: Add test: "should not generate duplicate problems when usedProblems set provided"

- [x] Task 2: Create MathOperationsDrill Component (AC: #1, #2, #3)
  - [x] Subtask 2.1: Create `src/features/training/drills/MathOperationsDrill.tsx`
  - [x] Subtask 2.2: Implement DrillProps interface: `{ difficulty, sessionId, onComplete, onSkip? }`
  - [x] Subtask 2.3: Reuse `NumberKeypad` from `src/shared/components/NumberKeypad.tsx`
  - [x] Subtask 2.4: Implement problem display with operation type label
  - [x] Subtask 2.5: Implement answer submission with Enter key support
  - [x] Subtask 2.6: Implement Framer Motion feedback animations (green check / red X)
  - [x] Subtask 2.7: Implement confidence prompt ("Guessed" / "Unsure" / "Confident")

- [x] Task 3: Implement Drill Result Persistence (AC: #6)
  - [x] Subtask 3.1: Persist DrillResult to Dexie `drill_results` table
  - [x] Subtask 3.2: Add localStorage fallback using `STORAGE_KEYS.DRILL_RESULTS_BACKUP`
  - [x] Subtask 3.3: Wrap JSON.parse in try-catch for corrupted backup recovery

- [x] Task 4: Implement Accessibility Features (AC: #7)
  - [x] Subtask 4.1: Add `role="application"` and `aria-label="Math operations drill"`
  - [x] Subtask 4.2: Add `aria-live="polite"` on problem display and answer display
  - [x] Subtask 4.3: Add `aria-live="assertive"` on feedback overlay
  - [x] Subtask 4.4: Add screen reader only text for feedback (`.sr-only` class)
  - [x] Subtask 4.5: Ensure all confidence buttons have descriptive aria-labels
  - [x] Subtask 4.6: Implement `prefers-reduced-motion` check for animations

- [x] Task 5: Integrate into TrainingSession (AC: #1)
  - [x] Subtask 5.1: Import MathOperationsDrill in TrainingSession.tsx
  - [x] Subtask 5.2: Add conditional rendering for `'math_operations'` drill type
  - [x] Subtask 5.3: Pass `key={`drill-${drillIndex}`}` to force new instances

- [x] Task 6: Write Tests (AC: #1-8)
  - [x] Subtask 6.1: Create `MathOperationsDrill.test.tsx` with AC-1 through AC-8 coverage
  - [x] Subtask 6.2: Mock Framer Motion, Dexie, NumberKeypad for deterministic testing
  - [x] Subtask 6.3: Test difficulty levels via mocked `problemGenerator.generateProblem`
  - [x] Subtask 6.4: Test Dexie fallback to localStorage on error
  - [x] Subtask 6.5: Test accessibility (ARIA labels, keyboard Enter submission, screen reader text)
  - [x] Subtask 6.6: Test duplicate problem prevention (AC: #5) — 2 tests in MathOperationsDrill.test.tsx + 4 tests in problemGenerator.test.ts

- [x] Task 7: Code Cleanup
  - [x] Subtask 7.1: Remove unused `setConfidence` state variable and its `setConfidence()` call in handleConfidenceSelect

## Definition of Done

Per architecture.md lines 386-393, ALL must be verified:

- [x] Component tests pass (`npm run test:quick`) — 23 tests pass in MathOperationsDrill.test.tsx
- [x] Unit tests pass (100% coverage target per ADR-005) — 22 tests pass in problemGenerator.test.ts
- [ ] Feature works in running dev server (`npm run dev`) — requires manual verification
- [ ] UI renders correctly on mobile viewport (320px) — requires manual verification
- [ ] Data flow verified: drill result appears in Dexie `drill_results` table — requires manual verification
- [ ] Manual verification: start training session, complete math drill, verify feedback + persistence
- [x] Duplicate problem prevention implemented and tested (AC: #5) — implemented with usedProblems tracking

## Dev Notes

### Architecture Compliance

- **Feature-Based Organization:** Component at `src/features/training/drills/MathOperationsDrill.tsx`, service at `src/services/training/problemGenerator.ts` [Source: docs/architecture.md#Project-Structure]
- **State Management:** Component-local state via `useState` hooks (no Context needed for drill-internal state) [Source: docs/architecture.md#State-Management]
- **Data Persistence:** Dexie `drill_results` table with localStorage fallback. Uses `STORAGE_KEYS.DRILL_RESULTS_BACKUP` for namespaced key [Source: docs/architecture.md#Data-Architecture]
- **Error Handling:** Try-catch around Dexie operations, JSON.parse wrapped in try-catch for corrupted backups. Console.error for technical errors, never exposed to user [Source: docs/architecture.md#Cross-Cutting-Concerns]
- **Security & Privacy:** All data local-only (IndexedDB + localStorage). No PII collected. No external network calls. User ID always `"local_user"`. [Source: docs/architecture.md#Security-Privacy]
- **Testing:** 100% coverage mandatory (ADR-005). WCAG 2.1 AA non-negotiable (ADR-006). [Source: docs/architecture.md#ADRs]

### Technical Requirements

- **DrillProps Interface:** `{ difficulty: 'easy' | 'medium' | 'hard'; sessionId: number; onComplete: (result: DrillResult) => void; onSkip?: () => void }` — defined in component, matches pattern from NumberLineDrill/SpatialRotationDrill
- **DrillResult Schema:** Shared interface across all drill types (schemas.ts:53-79). Math Operations-specific optional fields (`operation`, `problem`, `userAnswer`, `correctAnswer`, `confidence`) must be populated by this drill. Auto-increment `id` added by Dexie.
- **NumberKeypad Props:** `{ value, onChange, onSubmit, maxDigits: 4, disabled, 'data-testid'? }` — reused from `src/shared/components/NumberKeypad.tsx`
- **Input Validation:** Max 4 digits, non-negative only (handled by NumberKeypad component)
- **Timing:** `Date.now()` on mount for start time, `Date.now() - startTime` for timeToAnswer. Auto-advance: 1s delay (correct), 1.5s delay (incorrect) before confidence prompt

### Library & Framework Requirements

| Library | Version | Usage |
|---------|---------|-------|
| React | 19.2.0 | Component hooks (useState), JSX rendering |
| Framer Motion | 12.23.24 | AnimatePresence + motion.div for feedback animations |
| lucide-react | ^0.553.0 | Check and X icons for feedback |
| shadcn/ui Button | latest | Confidence prompt buttons |
| Dexie.js | 4.2.1 | `db.drill_results.add(result)` for persistence |
| Tailwind CSS | 4.1.17 | Utility classes for layout and responsive design |

### File Structure Requirements

```
src/
  features/
    training/
      drills/
        MathOperationsDrill.tsx          # Main component (~279 lines)
        MathOperationsDrill.test.tsx      # Tests (~550 lines)
  services/
    training/
      problemGenerator.ts                # Problem generation service (~154 lines)
  shared/
    components/
      NumberKeypad.tsx                    # Reusable keypad (from Epic 2)
  services/
    storage/
      db.ts                              # Dexie database (drill_results table)
      schemas.ts                         # DrillResult interface
      localStorage.ts                    # STORAGE_KEYS constants
```

### Testing Requirements

- **Framework:** Vitest 3.2.4 + React Testing Library 16.3.0
- **Coverage Target:** 100% (statements/branches/functions/lines) per ADR-005
- **Pattern:** AAA (Arrange, Act, Assert), co-located `.test.tsx` files
- **Mocking:** Mock Framer Motion (AnimatePresence, motion.div/p), Mock Dexie (`db.drill_results.add`), Mock NumberKeypad (simplified input + submit button), Mock `problemGenerator.generateProblem` for deterministic tests
- **Coverage Areas:**
  - AC-1: UI rendering (problem display, operation label, keypad)
  - AC-2: User interaction (submit button, Enter key, empty input guard)
  - AC-3: Visual feedback (green check for correct, red X for incorrect, auto-advance timing)
  - AC-3: Confidence prompt (3 buttons appear, onComplete receives confidence value)
  - AC-4: Difficulty levels (Easy/medium/hard each call `generateProblem` with correct difficulty)
  - AC-5: Duplicate prevention (usedProblems tracking — tested)
  - AC-6: Persistence (Dexie add called, localStorage fallback on error)
  - AC-7: Accessibility (ARIA role/labels, aria-live, screen reader text, prefers-reduced-motion)
  - AC-8: Performance (keypad press feedback latency)

### Previous Story Intelligence

**From Story 3.3 (Spatial Rotation Drill):**
- Established drill component pattern: useState for state, feedback overlay with AnimatePresence, auto-advance with setTimeout
- SVG shape library created at `src/features/training/content/shapes.ts`
- Feedback styling: green border for correct, yellow/warning for incorrect (differs from MathOperations which uses green check / red X)
- Keyboard navigation: `onKeyDown` handler on container with `role="application"` and `tabIndex={0}`
- localStorage fallback: Uses `STORAGE_KEYS.DRILL_RESULTS_BACKUP` with JSON.parse try-catch pattern
- Key integration pattern: `key={`drill-${drillIndex}`}` in TrainingSession to force component remount

**Key Learnings Applied:**
- Component uses `window.matchMedia('(prefers-reduced-motion: reduce)')` for animation control
- Problem generated once via `useState(() => generateProblem(difficulty))` lazy initializer (prevents regeneration on re-render)
- Confidence prompt replaces feedback overlay (sequential flow, not parallel)

### Git Intelligence

Recent commits show training drill implementation pattern:
- `6f6b9d5` Story 4.3: Implement Micro-Challenge Generation Engine (most recent)
- `59a4277` assessment is working
- `8b3701d` init commit (earliest)

Code patterns observed: Feature-based file organization, Framer Motion for animations, Dexie for persistence with localStorage fallback, shadcn/ui Button component, Tailwind utility classes.

### Project Structure Notes

- Component aligns with `src/features/training/drills/` convention
- Problem generator in `src/services/training/` aligns with service layer pattern
- Reuses NumberKeypad from `src/shared/components/` (Epic 2 artifact)
- Test file co-located per architecture convention
- No conflicts with unified project structure detected

### References

- [Source: docs/epics.md#Story-3.4] - User story, acceptance criteria, difficulty progression, technical notes
- [Source: docs/epics.md#Story-3.6] - Session-level confidence prompts (relates to AC-3 enhancement)
- [Source: docs/architecture.md#Project-Structure] - Feature-based file organization
- [Source: docs/architecture.md#Data-Architecture] - Dexie schema, localStorage keys
- [Source: docs/architecture.md#Cross-Cutting-Concerns] - Error handling, testing, accessibility
- [Source: docs/architecture.md#Implementation-Patterns] - Naming conventions, data formats
- [Source: docs/architecture.md#Security-Privacy] - Local-only storage, no PII
- [Source: docs/architecture.md#Performance] - <100ms latency, 60fps, <2s load
- [Source: docs/architecture.md#ADRs] - ADR-005 (100% coverage), ADR-006 (WCAG 2.1 AA)
- [Source: docs/PRD.md#Functional-Requirements] - Instrumentation, telemetry, test harness
- [Source: docs/sprint-artifacts/3-3-implement-spatial-rotation-drill.context.xml] - Previous story patterns
- [Source: docs/sprint-artifacts/3-4-implement-math-operations-drill.context.xml] - Existing context (generated 2025-11-23)
- [Source: docs/epic-3-tech-spec.md] - Performance requirements, drill interface patterns

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

### Completion Notes List

- Story 3.4 is already fully implemented with most code artifacts in place
- MathOperationsDrill.tsx (~275 lines) - fully functional with all ACs 1-8 met
- problemGenerator.ts (~164 lines) - all three operation generators plus weighted random selector with duplicate prevention
- MathOperationsDrill.test.tsx (~570 lines) - comprehensive test coverage for AC-1 through AC-8 including AC-5
- problemGenerator.test.ts (~320 lines) - 22 tests covering all operations, difficulties, and duplicate prevention
- Code review applied (2026-02-06): Fixed STORAGE_KEYS usage, JSON.parse try-catch, console.log removal
- Quality validation completed (2026-02-06): 14/21 checks passed, all improvements applied
- Task 1B completed (2026-02-06): Duplicate problem prevention via `usedProblems: Set<string>` with max 10 retries, session-level tracking in TrainingSession via useRef, passed as prop to MathOperationsDrill
- Task 7 completed (2026-02-06): Removed unused `setConfidence` state and its setter call
- Subtask 6.6 completed (2026-02-06): 6 new tests for duplicate prevention (4 in problemGenerator.test.ts, 2 in MathOperationsDrill.test.tsx)
- All 45 tests pass (23 MathOperationsDrill + 22 problemGenerator). No regressions (8 pre-existing failures in unrelated files unchanged)

### Change Log

- 2026-02-06: Task 1B — Added `usedProblems?: Set<string>` parameter to `generateProblem()` with retry loop (max 10 attempts) and auto-add to set
- 2026-02-06: Task 1B — Added `usedProblems` prop to DrillProps and MathOperationsDrill, wired to `generateProblem()` lazy initializer
- 2026-02-06: Task 1B — Added `usedProblemsRef` (useRef) to TrainingSession, reset on session start, passed to MathOperationsDrill
- 2026-02-06: Task 7 — Removed unused `setConfidence` state variable and its call in `handleConfidenceSelect`
- 2026-02-06: Subtask 6.6 — Added 4 duplicate prevention tests to problemGenerator.test.ts, 2 to MathOperationsDrill.test.tsx
- 2026-02-06: Updated difficulty level test expectations to match new `generateProblem` signature (3 args)

### File List

- `src/features/training/drills/MathOperationsDrill.tsx` (modified - added usedProblems prop, removed unused setConfidence)
- `src/features/training/drills/MathOperationsDrill.test.tsx` (modified - added AC-5 tests, updated difficulty assertions)
- `src/services/training/problemGenerator.ts` (modified - added usedProblems parameter with retry logic)
- `src/services/training/problemGenerator.test.ts` (modified - added 4 duplicate prevention tests)
- `src/features/training/components/TrainingSession.tsx` (modified - added usedProblemsRef tracking, passed to MathOperationsDrill)
- `src/shared/components/NumberKeypad.tsx` (reused from Epic 2 - unchanged)
- `src/services/storage/db.ts` (existing - unchanged)
- `src/services/storage/schemas.ts` (existing - unchanged)
- `src/services/storage/localStorage.ts` (existing - unchanged)
