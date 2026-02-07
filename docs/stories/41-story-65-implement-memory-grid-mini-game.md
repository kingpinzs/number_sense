### Story 6.5: Implement Memory Grid Mini-Game

**As a** user training working memory,
**I want** a visual memory game that challenges me to remember patterns,
**So that** I strengthen my short-term memory through practice.

**Acceptance Criteria:**

**Given** Spatial Flip game is complete (Story 6.4 done)
**When** I navigate to `/cognition` and select "Memory Grid"
**Then** the MemoryGridGame component renders:

**Game Mechanics:**

* 5×5 grid of squares (25 total)
* Pattern appears: 3-7 squares light up (coral color) for 2 seconds
* Pattern disappears: All squares return to gray
* User recreates pattern: Click squares to light them up
* Submit: Check if user's pattern matches original
* Score: +1 for correct, next round with longer pattern

**Game UI:**

* Grid: 60px × 60px squares, 4px gap
* Pattern display phase: Highlighted squares pulse (Framer Motion)
* Recall phase: Click to toggle square on/off
* Buttons: "Submit" (enabled when user has selected squares), "Give Up"
* Score: "Round 5, Pattern length: 7"
* Lives: 3 lives, lose 1 per incorrect answer

**Difficulty Progression:**

* Round 1-3: 3 squares (easy)
* Round 4-6: 5 squares (medium)
* Round 7+: 7+ squares (hard, increases by 1 each round)
* Game ends: When lives reach 0 or user gives up

**Game Completion:**

* Game over → Show results
* Stats: "Reached round 8", "Longest pattern: 9 squares"
* Encouragement: "Great memory!" or "Practice makes perfect!"
* Actions: "Play Again", "Back to Home"

**And** Game result saved to telemetry:

```typescript
await db.telemetry_logs.add({
  id: uuid(),
  timestamp: Date.now(),
  event: 'cognition_game_complete',
  module: 'memory_grid',
  data: {
    roundsCompleted: 8,
    longestPattern: 9,
    duration: 180000,  // milliseconds
    livesRemaining: 1
  }
});
```

**Prerequisites:** Story 6.4 (Spatial Flip game complete)

**Technical Notes:**

* Location: `src/features/cognition/games/MemoryGridGame.tsx`
* Pattern generation: Random selection of N squares from 25-square grid
* Pattern comparison: Check if user's selected squares match original pattern exactly
* Timer: 2-second display, then hide pattern
* State: `{ pattern: number[], userSelection: number[], lives: 3, round: 1 }`
* Visual feedback: Confetti on correct answer, shake animation on incorrect

***
