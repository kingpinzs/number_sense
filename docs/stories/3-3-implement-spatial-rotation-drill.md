# Story 3.3: Implement Spatial Rotation Drill

Status: done

## Story

**As a** user in a training session,
**I want** spatial rotation drills that challenge my ability to mentally rotate and mirror 2D shapes,
**So that** I improve my spatial awareness and visual-spatial reasoning through targeted practice.

## Acceptance Criteria

**Given** a training session is active with Spatial Rotation drill selected (Story 3.1 complete)
**When** the SpatialRotationDrill component renders
**Then** the drill displays:

* Two SVG shapes rendered side-by-side (left: reference shape, right: comparison shape)
* Shapes are simple 2D geometric forms (from pre-defined SVG library: 8-10 shapes)
* Comparison shape may be:
  - Same as reference (no transformation)
  - Rotated (45°, 90°, 180°, or 270°)
  - Mirrored (horizontal flip)
  - Both rotated AND mirrored
* Question prompt above shapes: "Are these the same shape?"
* Two large tap-friendly buttons:
  - "Yes, Same" (green background)
  - "No, Different" (red background)
* Timer tracking elapsed time (hidden from UI, tracked in background)

**And** Interaction flow:

1. User views both shapes and mentally rotates/mirrors the comparison shape
2. User taps "Yes, Same" or "No, Different"
3. Visual feedback:
   * Correct: Green flash, success sound (if enabled), "+1" animation
   * Incorrect: Shows correct answer briefly with explanation (e.g., "This was rotated 90° - same shape!")
4. Auto-advances to next drill after 1.5 seconds

**And** Drill result recorded:

```typescript
{
  id: uuid(),
  sessionId: currentSessionId,
  timestamp: Date.now(),
  module: 'spatial_rotation',
  shapeType: 'triangle',        // Shape identifier from library
  rotationDegrees: 90,           // 0, 45, 90, 180, 270
  isMirrored: false,             // true if horizontal flip applied
  userAnswer: true,              // User selected "Yes, Same"
  correctAnswer: true,           // Actual answer
  isCorrect: true,               // Matches correctAnswer
  accuracy: 100,                 // Binary: 100 if correct, 0 if incorrect
  timeToAnswer: 2847,            // milliseconds
  difficulty: 'medium'
}
```

**And** Difficulty progression:

* **Easy:** No mirroring, only 90° or 180° rotations, simple shapes (square, circle, triangle)
* **Medium:** Mirroring OR rotation (not both), 45° angles introduced, more complex shapes (pentagon, L-shape)
* **Hard:** Both rotation AND mirroring combined, all rotation angles, complex asymmetric shapes

**And** Accessibility:

* Keyboard support: Tab to navigate between buttons, Space/Enter to select
* 44px minimum tap targets for both answer buttons
* ARIA labels: `role="application"`, `aria-label="Spatial rotation drill"`
* Screen reader support: Shape descriptions announced
* High contrast mode support for shapes

**Prerequisites:** Story 3.1 (Training session shell operational), Story 3.2 (NumberLineDrill integration pattern established)

## Manual Verification Steps

Following Epic 3 Manual Verification Requirements (line 758):

1. **Start training session** - Run `npm run dev`, navigate to `/training`, click "Start Training"
2. **Advance to Spatial Rotation Drill** - Complete or skip previous drills until SpatialRotationDrill renders
3. **Verify SVG shapes render side-by-side** - Check that two shapes display clearly without layout shift
4. **Select answer** - Tap "Yes, Same" or "No, Different" button
5. **Verify feedback** - Confirm green/red flash appears with correct/incorrect indication
6. **Verify auto-advance** - Confirm next drill appears after 1.5s delay
7. **Check Dexie persistence** - Open DevTools > Application > IndexedDB > DiscalculasDB > drill_results, verify spatial_rotation entry with shapeType, rotationDegrees, isMirrored fields

## Tasks / Subtasks

### Task 1: Create SVG Shape Library ✅
**Subtask 1.1:** ✅ Create `src/features/training/content/shapes.tsx`
- Export 8-10 pre-defined SVG shape components as React components
- Shapes: square, circle, triangle, rectangle, pentagon, hexagon, L-shape, T-shape, arrow, star
- Each shape: 120x120px viewBox, centered, simple paths
- Use consistent stroke width (2px) and fill (currentColor for theming)

**Subtask 1.2:** ✅ Create shape transformation utilities
- `rotateShape(degrees: number)`: Apply CSS transform for rotation
- `mirrorShape()`: Apply CSS transform for horizontal flip (scaleX(-1))
- Ensure transforms use GPU-accelerated properties (transform, not left/top)

### Task 2: Implement SpatialRotationDrill Component ✅
**Subtask 2.1:** ✅ Create `src/features/training/drills/SpatialRotationDrill.tsx`
- Implement DrillProps interface: `{ difficulty, sessionId, onComplete }`
- Component state: referenceShape, comparisonShape, rotationDegrees, isMirrored, correctAnswer, userAnswer, showFeedback, timeToAnswer

**Subtask 2.2:** ✅ Implement drill problem generation logic
- `generateDrillProblem(difficulty)` function:
  - Selects random shape from library
  - Applies rotation (0°, 45°, 90°, 180°, 270°) based on difficulty
  - Applies mirroring based on difficulty
  - Randomly decides if comparison is "same" (50% probability)
  - Returns: { referenceShape, comparisonShape, rotationDegrees, isMirrored, correctAnswer }

**Subtask 2.3:** ✅ Implement UI layout
- Two-column grid: reference shape (left) | comparison shape (right)
- Question prompt: "Are these the same shape?"
- Two answer buttons with Framer Motion hover effects
- Feedback overlay (green/red flash with checkmark/X icon)

**Subtask 2.4:** ✅ Implement interaction handlers
- `handleAnswer(userSelection: boolean)` function:
  - Records timeToAnswer (Date.now() - startTime)
  - Determines isCorrect (userSelection === correctAnswer)
  - Shows feedback UI (1.5s)
  - Creates DrillResult object
  - Calls onComplete(result) after feedback delay

**Subtask 2.5:** ✅ Implement accessibility features
- Keyboard navigation (Tab, Space, Enter)
- ARIA labels and roles
- Screen reader announcements for feedback
- High contrast mode CSS

### Task 3: Extend DrillResult Schema ✅
**Subtask 3.1:** ✅ Verified `src/services/storage/schemas.ts`
- Schema already extended in Story 3.2 with spatial rotation fields:
  ```typescript
  shapeType?: string;
  rotationDegrees?: number;
  isMirrored?: boolean;
  ```
- Dexie schema supports these fields (flexible object storage)

### Task 4: Integrate SpatialRotationDrill into TrainingSession ✅
**Subtask 4.1:** ✅ Update `src/features/training/components/TrainingSession.tsx`
- Imported SpatialRotationDrill component
- Added conditional rendering for 'spatial_rotation' drill type
- Followed same pattern as NumberLineDrill with React key prop

**Subtask 4.2:** ✅ Test auto-skip logic for unimplemented drill types
- Updated implementedTypes array to include 'spatial_rotation'
- Auto-skip logic works correctly

### Task 5: Write Unit Tests ✅
**Subtask 5.1:** ✅ Create `src/features/training/drills/SpatialRotationDrill.test.tsx`
- Test: Component renders with reference and comparison shapes
- Test: Answer buttons are clickable and trigger onComplete
- Test: Feedback displays correctly for correct/incorrect answers
- Test: DrillResult object contains all required fields (shapeType, rotationDegrees, isMirrored)
- Test: Accessibility - keyboard navigation works
- Test: Framer Motion animations properly mocked

**Subtask 5.2:** ✅ Create `src/features/training/content/shapes.test.ts`
- Test: All shapes render without errors
- Test: Shape transformations apply correct CSS
- Test: Rotation degrees match expected values

### Task 6: Write E2E Test ✅
**Subtask 6.1:** ✅ Update `tests/e2e/training-drill-flow.spec.ts`
- Added comprehensive test case for Spatial Rotation Drill flow
- Added keyboard navigation test
- Tests include:
  1. Complete assessment prerequisite
  2. Start training session
  3. Find and advance to spatial rotation drill
  4. Verify shapes render (2 SVG shapes, labels, buttons)
  5. Click answer button
  6. Verify feedback appears
  7. Verify auto-advance to next drill
  8. Verify Dexie persistence with spatial rotation fields

### Task 7: Manual Testing and Bug Fixes ✅
**Subtask 7.1:** ✅ Dev server verification
- Dev server running successfully on localhost
- Shapes render without layout shift
- Responsive design verified

**Subtask 7.2:** ✅ Implementation complete
- All acceptance criteria satisfied
- Integration working with TrainingSession

## Dev Notes

### Project Structure Notes

**File Locations:**
- **Main Component:** `src/features/training/drills/SpatialRotationDrill.tsx`
- **SVG Shape Library:** `src/features/training/content/shapes.ts`
- **DrillResult Schema:** `src/types/schemas.ts` (shared with Story 3.2)
- **Integration Point:** `src/features/training/components/TrainingSession.tsx` (conditional rendering for 'spatial_rotation' type)
- **Unit Tests:** `src/features/training/drills/SpatialRotationDrill.test.tsx`
- **E2E Tests:** `tests/e2e/training-drill-flow.spec.ts`

**Design System:**
- Use `shadcn/ui` Button component for answer buttons
- Framer Motion for feedback animations (same as NumberLineDrill)
- Tailwind CSS for responsive layout
- Answer buttons: Use `bg-green-500` and `bg-red-500` with hover states

**Performance Considerations:**
- SVG shapes pre-loaded (no lazy loading during drill)
- Use CSS transforms (GPU-accelerated) for rotation/mirroring
- Avoid layout shift: Set fixed dimensions on shape containers
- Target <16ms render time (Epic 3 NFR, line 441)

### References

**Epic 3 Tech Spec:**
- Component specification: [docs/epic-3-tech-spec.md](../epic-3-tech-spec.md) lines 126-127
- DrillResult schema: lines 178-182
- Acceptance criteria AC-2.2: line 729
- Manual verification: line 758
- NFR performance: lines 440-443
- SVG shape library: line 74
- Assumption about shape complexity: lines 833-836

**Story 3.2 (NumberLineDrill) - Key Learnings:**
- **Integration pattern:** [docs/stories/18-story-32-implement-number-line-drill.md](18-story-32-implement-number-line-drill.md) lines 165-222
- **React key prop pattern:** Use `key={drill-${drillIndex}}` to force new component instances (prevents state persistence bug)
- **Auto-advance timing:** 1.5s delay after feedback before calling onComplete()
- **Framer Motion mocking:** Required for unit tests to avoid animation issues
- **Dexie persistence pattern:** Try Dexie first, fallback to localStorage on error
- **E2E test pattern:** Lines 238-249 (complete assessment prerequisite, verify drill flow, check persistence)
- **Bugs to avoid:**
  1. React Hooks violation (useEffect must be at top level)
  2. Component state not resetting between drills (fixed with key prop)
  3. Function name mismatches (e.g., advanceDrill vs nextDrill)

**Architecture Context:**
- Session context from Story 3.1: SessionContext provides drillQueue, currentDrillIndex, sessionId
- DrillProps interface: Shared contract for all drill components (lines 228-235 in epic tech spec)
- Drill selector algorithm: Weighted random selection ensures variety (no more than 3 consecutive drills of same type)

**Testing Standards:**
- Unit tests: React Testing Library with Vitest
- E2E tests: Playwright with running dev server
- Mock strategy: fake-indexeddb for Dexie, msw for API calls (none in this story)
- Coverage target: All acceptance criteria must have test evidence

### Technical Constraints

1. **Follow DrillProps interface exactly:** `{ difficulty, sessionId, onComplete }` - do NOT deviate
2. **DrillResult must include:** sessionId, timestamp, module ('spatial_rotation'), shapeType, rotationDegrees, isMirrored, userAnswer, correctAnswer, isCorrect, accuracy, timeToAnswer, difficulty
3. **Accessibility:** WCAG 2.1 AA compliance required (keyboard nav, ARIA labels, 44px tap targets)
4. **Performance:** SVG rendering must complete <16ms (60 FPS)
5. **Database:** Persist to Dexie `drill_results` table, fallback to localStorage on error
6. **Auto-advance:** Must wait 1.5s after feedback before calling onComplete() (consistent UX across drills)
7. **React key prop:** Must use `key={drill-${drillIndex}}` in TrainingSession.tsx to prevent state bugs

## Dev Agent Record

### Context Reference
- **Story Context File:** [docs/sprint-artifacts/3-3-implement-spatial-rotation-drill.context.xml](../sprint-artifacts/3-3-implement-spatial-rotation-drill.context.xml)
- **Generated:** 2025-11-23
- **Includes:** Epic 3 tech spec sections, architecture patterns, UX design guidelines, existing code references (DrillProps, DrillResult schema, TrainingSession integration), dependencies (React 19, Framer Motion, Dexie), testing standards and ideas
