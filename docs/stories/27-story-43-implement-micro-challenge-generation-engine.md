### Story 4.3: Implement Micro-Challenge Generation Engine

**As a** system creating Magic Minute challenges,
**I want** to generate targeted micro-challenges from user's recent mistakes,
**So that** the 60-second sprint focuses on exactly what the user needs to practice.

**Acceptance Criteria:**

**Given** Magic Minute timer is active (Story 4.2 complete)
**When** the 60-second countdown starts
**Then** the MicroChallengeGenerator (`src/services/adaptiveDifficulty/microChallengeGenerator.ts`) creates challenges:

**Challenge Generation Logic:**

* Analyzes last 10 drills for mistake patterns (uses MistakeAnalyzer)
* Generates 10-15 micro-challenges (shorter than regular drills)
* Prioritizes detected weakness areas (2x weight for mistake types)
* Simplifies challenges slightly (reduce cognitive load under time pressure)

**Micro-Challenge Types:**

**Number Line (Simplified):**

* Smaller range (0-50 instead of 0-100)
* Larger tolerance (±15% instead of ±10%)
* Pre-positioned marker at 0, user drags to position
* No "Submit" button - auto-submits after 2 seconds of no movement

**Spatial Rotation (Simplified):**

* Only simple shapes (L, T - no irregular polygons)
* Only 90° or 180° rotations (no 270°, no mirroring)
* Same "Yes/No" buttons as regular drill

**Math Operations (Simplified):**

* Only single-digit operations
* Number keypad with larger buttons (50px minimum)
* Auto-submits after 2 digits typed (no explicit "Submit")

**Challenge Sequencing:**

* Randomize order (avoid predictability)
* Mix drill types (not all Number Line in a row)
* Track used challenges (no duplicates within Magic Minute)

**And** Each micro-challenge result recorded:

```typescript
{
  id: uuid(),
  magicMinuteSessionId: magicMinuteId,
  timestamp: Date.now(),
  challengeType: 'number_line',
  isCorrect: true,
  timeToAnswer: 3200,  // milliseconds
  mistakeTypeTargeted: 'overestimation'  // Which pattern this addresses
}
```

**And** Challenge difficulty adapts mid-Magic Minute:

* If 5 consecutive correct → increase difficulty slightly
* If 3 consecutive incorrect → decrease difficulty
* Maintains engagement (not too easy or too hard)

**Prerequisites:** Story 4.2 (Magic Minute timer component built)

**Technical Notes:**

* Location: `src/services/adaptiveDifficulty/microChallengeGenerator.ts`
* Challenge pool: Pre-generate all 10-15 challenges at start (avoid generation lag)
* Timeout handling: If user doesn't answer in 8 seconds → auto-skip (mark incorrect)
* Results: Store in Dexie `drill_results` table with `source: 'magic_minute'` flag
* Unit tests: Mock mistake patterns, verify appropriate challenges generated
* Export: `generateMicroChallenges(mistakePatterns, count) => Challenge[]`

***
