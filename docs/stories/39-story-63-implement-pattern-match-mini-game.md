### Story 6.3: Implement Pattern Match Mini-Game

**As a** user wanting a brain break from training,
**I want** a pattern matching game that exercises my visual processing,
**So that** I strengthen cognitive skills in a fun, low-pressure way.

**Acceptance Criteria:**

**Given** quick actions are implemented (Story 6.2 complete)
**When** I navigate to `/cognition` and select "Pattern Match"
**Then** the PatternMatchGame component renders:

**Game Mechanics:**

* Grid of tiles (4×4 = 16 tiles)
* Each tile shows a symbol: ●, ■, ▲, ★, ♦ (5 symbols, 3-4 of each)
* Objective: Find all matching pairs of symbols
* Click tile → reveals symbol → click second tile → if match, tiles stay revealed
* If no match, tiles flip back after 1 second
* Goal: Match all pairs in minimum moves

**Game UI:**

* Timer: Shows elapsed time (optional, can hide to reduce pressure)
* Move counter: "Moves: 8"
* Progress: "6/8 pairs matched"
* Tile size: 70px × 70px, 8px gap between
* Tile animation: Flip animation (Framer Motion)
* Success feedback: Green border flash + success sound

**Difficulty Levels:**

* Easy: 4×3 grid (12 tiles, 6 pairs)
* Medium: 4×4 grid (16 tiles, 8 pairs)
* Hard: 5×4 grid (20 tiles, 10 pairs)

**Game Completion:**

* All pairs matched → Show completion modal
* Stats: "Completed in 24 moves, 1m 47s"
* Encouragement: "Great visual memory!" or "Excellent pattern recognition!"
* Actions: "Play Again" button, "Back to Home" button

**And** Game result saved to telemetry:

```typescript
await db.telemetry_logs.add({
  id: uuid(),
  timestamp: Date.now(),
  event: 'cognition_game_complete',
  module: 'pattern_match',
  data: {
    difficulty: 'medium',
    moves: 24,
    duration: 107000,  // milliseconds
    accuracy: 66.7  // (pairs / moves) * 100
  }
});
```

**Prerequisites:** Story 6.2 (Quick actions complete, Cognition route ready)

**Technical Notes:**

* Location: `src/features/cognition/games/PatternMatchGame.tsx`
* Tile state: Array of objects `{ id, symbol, revealed, matched }`
* Shuffle algorithm: Fisher-Yates shuffle for random tile placement
* Match detection: Store first clicked tile, compare with second, clear if no match
* Timer: `useEffect` with `setInterval`, cleanup on unmount
* Symbols: Unicode characters or SVG icons for crisp rendering

***
