### Story 3.3: Implement Spatial Rotation Drill

**As a** user in a training session,
**I want** spatial rotation drills that challenge my mental manipulation of shapes,
**So that** I strengthen my spatial reasoning abilities.

**Acceptance Criteria:**

**Given** a training session is active with Spatial Rotation drill selected (Story 3.2 complete)
**When** the SpatialRotationDrill component renders
**Then** the drill displays:

* Two 2D shapes side-by-side (left: reference shape, right: comparison shape)
* Shapes: L-shapes, T-shapes, irregular polygons (SVG rendered)
* Comparison shape rotated 90°, 180°, or 270° (or mirrored for hard mode)
* Question text: "Is the right shape the same as the left?"
* Two large buttons: "Yes, Same" (mint green) | "No, Different" (coral)
* Subtle grid background (optional, helps with rotation reasoning)

**And** Interaction flow:

1. User studies both shapes
2. User taps "Yes, Same" or "No, Different"
3. Visual feedback:
   * Correct: Green border flash, success sound, "+1" animation
   * Incorrect: Red border flash, show correct answer ("These are the same" or "These are different")
4. Auto-advances after 1.5 seconds

**And** Drill result recorded:

```typescript
{
  id: uuid(),
  sessionId: currentSessionId,
  timestamp: Date.now(),
  module: 'spatial_rotation',
  shapeType: 'L-shape',
  rotationDegrees: 180,
  isMirrored: false,
  userAnswer: 'same',
  correctAnswer: 'same',
  isCorrect: true,
  timeToAnswer: 5432,
  difficulty: 'medium'
}
```

**And** Difficulty progression:

* Easy: Simple shapes (L, T), 90° or 180° rotation only, no mirroring
* Medium: Irregular shapes, any rotation, no mirroring
* Hard: Complex shapes, rotation + mirroring (requires detecting mirror vs rotation)

**And** Shape library: 8-10 pre-defined SVG shapes with varying complexity

**And** Randomization: Each drill pulls random shape + random transformation

**Prerequisites:** Story 3.2 (Number Line Drill implemented)

**Technical Notes:**

* Location: `src/features/training/drills/SpatialRotationDrill.tsx`
* SVG shapes: `src/features/training/content/shapes.ts` (export as SVG path strings)
* CSS transform for rotation: `transform: rotate(${degrees}deg) scaleX(${mirrored ? -1 : 1})`
* Answer buttons: Full-width on mobile, side-by-side on tablet+
* Timing: `performance.now()` on render and on answer for accurate `timeToAnswer`
* Test with dyscalculia users: Ensure shapes are clear and distinguishable

***
