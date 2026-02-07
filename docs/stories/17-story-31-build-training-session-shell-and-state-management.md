### Story 3.1: Build Training Session Shell and State Management

**As a** user starting a training session,
**I want** a guided session flow that selects appropriate drills for my needs,
**So that** I practice my weak areas without thinking about what to do next.

**Acceptance Criteria:**

**Given** I completed the assessment (Epic 2) with training plan weights stored
**When** I navigate to `/training` route
**Then** the TrainingSession component renders with:

* Session header showing today's date and current streak
* "Start Training" button (coral primary color)
* Optional: "Quick Session" (5 min) vs "Full Session" (15 min) toggle
* Session goal display: "Focus: Number Sense" (based on highest weight)

**And** SessionContext manages training state:

* `sessionId`: UUID generated on session start
* `sessionType`: 'training' | 'quick'
* `drillQueue`: Array of drill types selected by weights
* `currentDrillIndex`: Current position in queue
* `sessionStartTime`: Timestamp when "Start Training" clicked
* `results`: Array storing each drill result

**And** Drill selection algorithm (`src/services/training/drillSelector.ts`):

* Loads training plan weights from Dexie (from latest assessment)
* Generates weighted random selection of 6-12 drills
* Example: If Number Sense weight = 0.5, Spatial = 0.3, Operations = 0.2
  * 50% chance each drill is Number Line
  * 30% chance Spatial Rotation
  * 20% chance Math Operations
* No more than 3 consecutive drills of same type (variety enforcement)

**And** Session persists to Dexie `sessions` table on start:

```typescript
{
  id: uuid(),
  timestamp: Date.now(),
  module: 'training',
  status: 'in_progress'
}
```

**Prerequisites:** Epic 2 complete (assessment provides training plan weights)

**Technical Notes:**

* Location: `src/features/training/components/TrainingSession.tsx`
* Drill selector: `src/services/training/drillSelector.ts`
* Use SessionContext from Epic 1 for state management
* StreakCounter component from Epic 1 displays in header
* Session types: Quick (6 drills), Full (12 drills)
* Handle case where no assessment exists: Prompt user to take assessment first

***
