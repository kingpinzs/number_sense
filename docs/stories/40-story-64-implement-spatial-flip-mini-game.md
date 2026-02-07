### Story 6.4: Implement Spatial Flip Mini-Game

**As a** user practicing spatial reasoning,
**I want** a shape rotation guessing game,
**So that** I strengthen my mental rotation abilities through repetition.

**Acceptance Criteria:**

**Given** Pattern Match game is complete (Story 6.3 done)
**When** I navigate to `/cognition` and select "Spatial Flip"
**Then** the SpatialFlipGame component renders:

**Game Mechanics:**

* Show a reference shape (L, T, irregular polygon)
* Show 4 comparison shapes (same shape with different rotations/mirrors)
* Objective: Identify which comparison shape matches the reference (after rotation/mirror)
* One correct answer, three distractors
* Time limit per question: 10 seconds (optional, can disable)
* 10 questions per game session

**Game UI:**

* Reference shape: Top center, labeled "Reference"
* 4 comparison shapes: 2×2 grid below, labeled A, B, C, D
* Tap shape → Submit answer immediately
* Feedback: Green border (correct) or red border (incorrect)
* Auto-advances after 1.5 seconds

**Difficulty Levels:**

* Easy: Simple shapes (L, T), 90° rotations only
* Medium: Irregular shapes, any rotation (90°, 180°, 270°)
* Hard: Complex shapes, rotation + mirroring

**Game Completion:**

* 10 questions answered → Show results
* Stats: "8/10 correct (80%)", "Avg time: 4.2s"
* Encouragement: "Strong spatial skills!" or "Keep practicing mental rotation!"
* Actions: "Play Again", "Try Harder Difficulty", "Back to Home"

**And** Game result saved to telemetry:

```typescript
await db.telemetry_logs.add({
  id: uuid(),
  timestamp: Date.now(),
  event: 'cognition_game_complete',
  module: 'spatial_flip',
  data: {
    difficulty: 'medium',
    correctCount: 8,
    totalQuestions: 10,
    accuracy: 80,
    avgTime: 4200
  }
});
```

**Prerequisites:** Story 6.3 (Pattern Match game complete)

**Technical Notes:**

* Location: `src/features/cognition/games/SpatialFlipGame.tsx`
* Reuse SVG shapes from Epic 3 (Story 3.3)
* Question generation: Pick random shape, create 3 distractors (wrong rotations/mirrors)
* Timer: Optional per-question countdown (10s default)
* Shapes: `src/features/training/content/shapes.ts` (shared with training drills)

***
