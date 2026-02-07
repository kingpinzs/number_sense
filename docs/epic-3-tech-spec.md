# Epic Technical Specification: Training & Drill Engine

Date: 2025-11-22
Author: Jeremy
Epic ID: 3
Status: Draft

---

## Overview

Epic 3 delivers the core value proposition of Discalculas: daily training sessions that build math confidence through targeted, personalized practice. Following Epic 2's assessment flow that identifies user weaknesses and generates training plan weights, Epic 3 implements three core drill types (Number Line, Spatial Rotation, Math Operations) within a guided session framework that adapts difficulty based on performance.

This epic transforms the assessment data into actionable practice by providing short (5-15 minute), mobile-first training sessions that focus on the user's specific weak areas. Each session records comprehensive telemetry (accuracy, speed, confidence deltas) to support future adaptive intelligence features in Epic 4 and progress tracking in Epic 5.

## Objectives and Scope

### In Scope

**Core Functionality:**
- Training session shell with state management (session start, drill queue, progress tracking)
- Three drill types fully implemented:
  - **Number Line Drill:** Visual number placement on 0-100 or 0-1000 range
  - **Spatial Rotation Drill:** Mental rotation/mirroring of 2D shapes
  - **Math Operations Drill:** Basic arithmetic (addition, subtraction, multiplication)
- Drill selection algorithm using training plan weights from Epic 2 assessment
- Difficulty progression within sessions (easy → medium → hard based on accuracy)
- Confidence prompts before and after sessions (5-point emoji scale)
- Comprehensive data persistence (sessions, drill_results, telemetry_logs tables in Dexie)
- Session UI components (progress bar, drill transitions, feedback animations, pause functionality)
- Streak counter integration with localStorage
- E2E test covering complete training session flow

**User Experience:**
- Mobile-first, thumb-friendly drill interfaces
- Visual and audio feedback for correct/incorrect answers
- Session completion summary with stats
- Accessibility support (keyboard navigation, WCAG 2.1 AA compliance)

### Out of Scope

**Deferred to Epic 4 (Adaptive Intelligence):**
- Magic Minute micro-challenges (60-second post-session sprints)
- Real-time adaptive difficulty adjustments with toast notifications
- Mistake analysis engine

**Deferred to Epic 5 (Progress Tracking):**
- Historical session analytics and insights
- Confidence x Time radar chart visualization
- Session history views

**Deferred to Epic 6 (Coach & Cognition):**
- Contextual guidance prompts during drills
- Mini-game cognition boosters

**Deferred to Epic 7 (PWA Infrastructure):**
- Offline-first service worker caching
- Background sync for session data

**Not Included:**
- Division operations (multiplication only up to 12×12)
- Multi-step word problems
- Advanced spatial reasoning (3D rotations deferred)
- Social features or multiplayer drills

## System Architecture Alignment

Epic 3 aligns with the feature-based architecture established in Epic 1 and directly consumes assessment data from Epic 2.

**Primary Feature Module:** `src/features/training/`
- `components/` - TrainingSession, ConfidencePrompt, SessionProgressBar, DrillTransition
- `drills/` - NumberLineDrill, SpatialRotationDrill, MathOperationsDrill
- `hooks/` - useTrainingSession, useDrillQueue
- `content/` - drillConfigs.ts, shapes.ts (SVG shape library)

**Supporting Services:** `src/services/`
- `training/` - drillSelector.ts (weighted random drill selection), streakManager.ts, problemGenerator.ts
- `storage/` - Dexie operations for sessions, drill_results tables
- `telemetry/` - logger.ts (session lifecycle event tracking)

**Routing:** `src/routes/TrainingRoute.tsx`
- Path: `/training`
- Renders TrainingSession component
- Protected route: Redirects to `/assessment` if no training plan weights exist

**State Management:**
- **SessionContext** (from Epic 1) extended with training-specific state:
  - `sessionType`, `drillQueue`, `currentDrillIndex`, `results`
  - Actions: `START_TRAINING_SESSION`, `NEXT_DRILL`, `END_TRAINING_SESSION`
- **UserSettingsContext** - Reads `soundEnabled`, `reducedMotion` preferences

**Data Layer:**
- **Dexie Tables:**
  - `sessions` - Session metadata (id, timestamp, module: 'training', accuracy, confidence deltas)
  - `drill_results` - Individual drill outcomes (module, accuracy, timeToAnswer)
  - `telemetry_logs` - Event tracking (session_start, drill_complete, session_end)
  - `assessments` - **Read-only dependency:** Loads latest assessment's training plan weights
- **LocalStorage:**
  - `STREAK`, `LAST_SESSION_DATE` - Updated by streakManager.ts

**Shared Components (from Epic 1):**
- `NumberKeypad` (reused in MathOperationsDrill)
- `StreakCounter` (displayed in session header)
- shadcn/ui primitives: Button, Card, Progress, Dialog

**Architecture Patterns:**
- **Drill Abstraction:** Each drill implements common interface `DrillProps { onComplete, difficulty, sessionId }`
- **Result Recording:** Each drill calls `onComplete(result: DrillResult)` → persisted via telemetry service
- **Progressive Difficulty:** Drills track accuracy within session, escalate difficulty when threshold met (>80%)

**Constraints:**
- Mobile-first: All drills must be thumb-operable on 320px width screens
- Performance: Drill transitions <100ms, 60fps animations
- Accessibility: WCAG 2.1 AA compliance mandatory (keyboard nav, screen reader support)
- Testing: New E2E philosophy applied - each story verifies integration in running dev server before marking done

## Detailed Design

### Services and Modules

| Module | Responsibility | Inputs | Outputs | Owner |
|--------|---------------|--------|---------|-------|
| `TrainingSession.tsx` | Main session orchestrator, manages drill queue and session lifecycle | Training plan weights from Dexie | Session start/end events, drill completions | Story 3.1 |
| `drillSelector.ts` | Weighted random drill selection based on assessment results | `TrainingPlanWeights { numberSense, spatial, operations }` | `DrillQueue: DrillType[]` (6-12 drills) | Story 3.1 |
| `NumberLineDrill.tsx` | Number placement drill on visual number line | `{ difficulty, onComplete, sessionId }` | `DrillResult` (accuracy, time, correctness) | Story 3.2 |
| `SpatialRotationDrill.tsx` | Mental rotation/mirroring of 2D shapes | `{ difficulty, onComplete, sessionId }` | `DrillResult` (correctness, time) | Story 3.3 |
| `MathOperationsDrill.tsx` | Basic arithmetic (add, subtract, multiply) | `{ difficulty, onComplete, sessionId }` | `DrillResult` (correctness, time, operation type) | Story 3.4 |
| `SessionProgressBar.tsx` | Visual progress indicator | `{ currentIndex, totalDrills }` | Progress bar UI (0-100%) | Story 3.5 |
| `DrillTransition.tsx` | Smooth drill-to-drill animation | `{ nextDrillType }` | 0.5s transition UI with drill icon | Story 3.5 |
| `SessionFeedback.tsx` | Correct/incorrect visual and audio feedback | `{ isCorrect, correctAnswer }` | Feedback UI (checkmark/X, sound) | Story 3.5 |
| `ConfidencePromptBefore.tsx` | Pre-session confidence capture | User selection (1-5 emoji scale) | `confidenceBefore: number` | Story 3.6 |
| `ConfidencePromptAfter.tsx` | Post-session confidence capture | User selection (1-5 emoji scale) | `confidenceAfter: number` | Story 3.6 |
| `streakManager.ts` | Streak calculation and localStorage updates | `lastSessionDate`, `currentDate` | Updated streak count | Story 3.6 |
| `problemGenerator.ts` | Random arithmetic problem generation | `{ operation, difficulty }` | `{ problem: string, answer: number }` | Story 3.4 |
| `telemetry/logger.ts` | Session event logging to Dexie | `{ event, timestamp, module, data }` | Dexie write operations | Story 3.7 |
| `exportData.ts` | Session data export utility | `sessionId` | JSON bundle (session + drill results) | Story 3.7 |

### Data Models and Contracts

**Session Model** (Dexie `sessions` table):
```typescript
interface Session {
  id: string;                    // UUID
  timestamp: string;              // ISO 8601 session start time
  module: 'training';             // Module identifier
  status: 'in_progress' | 'completed' | 'abandoned';
  drillCount: number;             // Total drills completed
  accuracy: number;               // Overall accuracy percentage (0-100)
  confidenceBefore: number;       // Pre-session confidence (1-5)
  confidenceAfter: number;        // Post-session confidence (1-5)
  confidenceChange: number;       // Delta (after - before)
  duration: number;               // Session duration in milliseconds
  drillTypes: {                   // Drill type distribution
    number_line: number;
    spatial_rotation: number;
    math_operations: number;
  };
}
```

**DrillResult Model** (Dexie `drill_results` table):
```typescript
interface DrillResult {
  id: string;                     // UUID
  sessionId: string;              // Foreign key to sessions.id
  timestamp: string;              // ISO 8601 drill completion time
  module: 'number_line' | 'spatial_rotation' | 'math_operations';
  difficulty: 'easy' | 'medium' | 'hard';
  isCorrect: boolean;
  timeToAnswer: number;           // Milliseconds
  accuracy: number;               // Percentage (0-100)

  // Number Line specific
  targetNumber?: number;
  userAnswer?: number;
  correctAnswer?: number;

  // Spatial Rotation specific
  shapeType?: string;
  rotationDegrees?: number;
  isMirrored?: boolean;

  // Math Operations specific
  operation?: 'addition' | 'subtraction' | 'multiplication';
  problem?: string;               // e.g., "12 + 7"
}
```

**TelemetryLog Model** (Dexie `telemetry_logs` table):
```typescript
interface TelemetryLog {
  id: string;
  timestamp: string;
  event: 'session_start' | 'drill_complete' | 'session_end' | 'session_pause' | 'session_resume';
  module: string;
  data: Record<string, any>;      // Event-specific metadata
}
```

**Training Plan Weights** (from Epic 2 `assessments` table):
```typescript
interface TrainingPlanWeights {
  numberSense: number;            // 0.0 - 1.0 (sum = 1.0)
  spatial: number;
  operations: number;
}
```

**SessionContext State Extension**:
```typescript
interface TrainingSessionState {
  sessionId: string | null;
  sessionType: 'quick' | 'full';  // Quick = 6 drills, Full = 12 drills
  drillQueue: DrillType[];
  currentDrillIndex: number;
  sessionStartTime: string | null;
  results: DrillResult[];
  confidenceBefore: number | null;
  confidenceAfter: number | null;
}

type DrillType = 'number_line' | 'spatial_rotation' | 'math_operations';
```

### APIs and Interfaces

**Drill Interface** (contract for all drill components):
```typescript
interface DrillProps {
  difficulty: 'easy' | 'medium' | 'hard';
  sessionId: string;
  onComplete: (result: DrillResult) => void;
  onSkip?: () => void;            // Optional skip functionality
}

// All drill components must implement:
// - NumberLineDrill: React.FC<DrillProps>
// - SpatialRotationDrill: React.FC<DrillProps>
// - MathOperationsDrill: React.FC<DrillProps>
```

**Drill Selector Service**:
```typescript
// src/services/training/drillSelector.ts

async function selectDrills(
  weights: TrainingPlanWeights,
  count: number
): Promise<DrillType[]> {
  // Weighted random selection
  // Variety enforcement: max 3 consecutive drills of same type
  // Returns array of drill types to execute
}

async function getTrainingPlanWeights(): Promise<TrainingPlanWeights> {
  // Query latest assessment from Dexie
  // Extract trainingPlanWeights field
  // Fallback: { numberSense: 0.33, spatial: 0.33, operations: 0.34 } if no assessment
}
```

**Streak Manager Service**:
```typescript
// src/services/training/streakManager.ts

function updateStreak(): number {
  // Read LAST_SESSION_DATE from localStorage
  // Compare to today's date
  // Logic:
  //   - If last session = today: maintain streak (don't double-count)
  //   - If last session = yesterday: increment streak
  //   - If last session > 1 day ago: reset streak to 1
  // Update LAST_SESSION_DATE to today
  // Return new streak count
}

function getStreak(): number {
  // Read STREAK from localStorage
  // Default: 0 if not set
}
```

**Problem Generator Service**:
```typescript
// src/services/training/problemGenerator.ts

interface MathProblem {
  problem: string;
  answer: number;
  operation: 'addition' | 'subtraction' | 'multiplication';
}

function generateAddition(difficulty: 'easy' | 'medium' | 'hard'): MathProblem;
function generateSubtraction(difficulty: 'easy' | 'medium' | 'hard'): MathProblem;
function generateMultiplication(difficulty: 'easy' | 'medium' | 'hard'): MathProblem;

// Easy addition: Single-digit (3 + 5, 7 + 8)
// Medium addition: Double-digit (23 + 17, 45 + 38)
// Hard multiplication: Up to 12×12 times tables
```

**Telemetry Logger Service**:
```typescript
// src/services/telemetry/logger.ts

async function logSessionStart(sessionId: string, module: string): Promise<void>;
async function logDrillComplete(result: DrillResult): Promise<void>;
async function logSessionEnd(sessionId: string, summary: SessionSummary): Promise<void>;

// All functions write to Dexie telemetry_logs table
// Wrap in try-catch, fallback to localStorage backup on failure
```

### Workflows and Sequencing

**Training Session Flow** (User Journey):

```
1. User Navigation
   → Navigate to /training route
   → TrainingRoute component renders

2. Session Initialization
   → Load training plan weights from Dexie (latest assessment)
   → If no assessment exists: Redirect to /assessment with prompt
   → Generate drill queue using weighted random selection
   → SessionContext: Dispatch START_TRAINING_SESSION
   → Persist session to Dexie (status: 'in_progress')

3. Pre-Session Confidence Prompt
   → ConfidencePromptBefore modal displays
   → User selects emoji (1-5 scale)
   → Store confidenceBefore in SessionContext
   → Log telemetry: session_start event

4. Drill Loop (Repeat for each drill in queue)
   a. Drill Transition
      → DrillTransition component shows next drill type (0.5s)

   b. Drill Execution
      → Render drill component (NumberLine/SpatialRotation/MathOperations)
      → Drill presents challenge
      → User interacts and submits answer
      → Drill calculates result (accuracy, time, correctness)
      → SessionFeedback shows correct/incorrect UI

   c. Result Recording
      → Drill calls onComplete(result)
      → Result appended to SessionContext.results
      → Result persisted to Dexie drill_results table
      → Log telemetry: drill_complete event
      → SessionProgressBar updates (currentIndex++)

   d. Difficulty Adjustment (if applicable)
      → Calculate running accuracy for current drill type
      → If accuracy > 80% for 3+ drills: Escalate to next difficulty
      → Next drill of same type uses elevated difficulty

   e. Auto-Advance
      → Wait 1.5 seconds (allow user to see feedback)
      → SessionContext: Dispatch NEXT_DRILL
      → Loop to next drill or continue to completion

5. Post-Session Confidence Prompt
   → All drills complete: ConfidencePromptAfter modal displays
   → User selects emoji (1-5 scale)
   → Store confidenceAfter in SessionContext
   → Calculate confidenceChange = after - before

6. Session Completion
   → Calculate session summary:
     - accuracy = (correct drills / total drills) * 100
     - duration = Date.now() - sessionStartTime
     - drillTypes distribution
   → Update session in Dexie (status: 'completed', add metrics)
   → Update streak via streakManager.updateStreak()
   → Log telemetry: session_end event
   → Display SessionCompletionSummary with stats

7. User Next Steps
   → "View Progress" → Navigate to /progress
   → "Done" → Navigate to / (home)
   → SessionContext: Dispatch END_TRAINING_SESSION (cleanup)
```

**Pause Flow** (User interrupts session):
```
1. User taps Pause button
   → Pause modal displays with options
   → Log telemetry: session_pause event

2. Resume
   → Close modal, continue from currentDrillIndex
   → Log telemetry: session_resume event

3. End Early
   → Confirmation dialog: "You've completed X of Y drills. End anyway?"
   → If confirmed:
     - Update session in Dexie (status: 'abandoned', partial metrics)
     - Skip post-confidence prompt
     - Navigate to home
```

**Data Flow Diagram** (Key Interactions):
```
Assessment (Epic 2)
    ↓ (trainingPlanWeights)
DrillSelector
    ↓ (DrillType[])
TrainingSession
    ↓ (current drill type + difficulty)
Individual Drill Component
    ↓ (DrillResult)
Telemetry Logger → Dexie (drill_results table)
    ↓ (all results aggregated)
Session Completion
    ↓ (Session object)
Dexie (sessions table)
    ↓ (future)
Progress Tracking (Epic 5)
```

## Non-Functional Requirements

### Performance

**Target Metrics** (from [architecture.md](./architecture.md)):
- **Initial Route Load:** `/training` route must render within <2s on mid-tier phones
- **Drill Transitions:** <100ms transition time between drills (DrillTransition component)
- **Input Latency:** <100ms response to user input (tap, drag, keypad press)
- **Animations:** 60fps for all transitions, progress bars, and feedback animations
- **Bundle Size:** Training feature chunk <50 KB (gzipped)

**Specific Requirements:**
- **Number Line Drill:**
  - Drag response must be immediate (<16ms frame time)
  - Marker position calculation on every touchmove/mousemove event
  - No jank during marker dragging (use `transform` CSS, not `left`/`top`)

- **Spatial Rotation Drill:**
  - SVG shapes must render without layout shift
  - CSS transforms preferred over JavaScript transformations
  - Shapes pre-loaded, no lazy loading during drill

- **Math Operations Drill:**
  - Keypad button press feedback <50ms
  - Reuse NumberKeypad component from Epic 2 (already optimized)

- **Session State Management:**
  - SessionContext updates must not trigger full-tree re-renders
  - Use React.memo() on drill components to prevent unnecessary re-renders
  - Dexie writes must not block UI thread (use async/await properly)

**Optimization Strategies:**
- Code splitting: Training feature lazy-loaded via React Router
- Framer Motion: Respect `prefers-reduced-motion` media query (disable animations)
- Sound files: <50 KB each, pre-loaded on session start
- IndexedDB queries: Use indexed fields (`timestamp`, `sessionId`) for fast lookups

### Security

**Local-Only Data Storage:**
- All session and drill data persists in browser IndexedDB (Dexie.js)
- No external API calls, no cloud sync (deferred to Epic 7 PWA infrastructure)
- No PII collected beyond session timestamps and performance metrics

**Data Privacy:**
- User ID remains `"local_user"` in all telemetry logs
- No third-party analytics or tracking scripts
- No session recording or fingerprinting

**Input Validation:**
- **Number Line Drill:** Validate marker position is within line bounds (0-100% of line width)
- **Math Operations Drill:**
  - Max 4 digits for user input (prevent overflow)
  - Non-negative integers only
  - Sanitize before display (prevent XSS via user input)

**XSS Prevention:**
- All user input rendered via React (automatic escaping)
- Problem strings from problemGenerator.ts are programmatically generated, not user-sourced
- No dangerouslySetInnerHTML usage

**IndexedDB Security:**
- Browser sandboxing enforced (origin-based isolation)
- No access to IndexedDB from other origins
- Future: Encryption for exported session data (deferred to Epic 5)

### Reliability/Availability

**Session Persistence:**
- Sessions survive browser refresh (Dexie persists across page reloads)
- If session interrupted (browser crash, tab close): Next launch detects `in_progress` session and offers "Resume" or "Start Fresh"
- All drill results written immediately after completion (no batching that risks data loss)

**Error Handling:**
- **Dexie Write Failures:**
  - Wrap all `db.*.add()` and `db.*.bulkAdd()` in try-catch
  - On failure: Log to console, show user toast ("Session data not saved")
  - Fallback: Store session summary in localStorage as backup (`STORAGE_KEYS.SESSION_BACKUP`)
  - On next launch: Attempt to restore from localStorage backup

- **Missing Assessment Data:**
  - If no assessment exists when starting training: Redirect to `/assessment` with message "Take assessment first to personalize training"
  - If assessment lacks `trainingPlanWeights`: Use default equal weights (0.33, 0.33, 0.34)

- **Component Errors:**
  - Drill components wrapped in React Error Boundary
  - If drill crashes: Log error, show fallback UI ("This drill encountered an error"), auto-advance after 3 seconds

**Data Integrity:**
- Atomic session writes: Use `db.transaction()` for multi-table writes (sessions + drill_results)
- Validate drill results before persistence (check required fields: `sessionId`, `module`, `isCorrect`)
- No partial writes that would corrupt data

**Offline Support (Epic 3 Baseline):**
- Training session works without internet (all assets bundled)
- Dexie operations are local-only (no network dependency)
- Future: Service worker caching (Epic 7) will make `/training` fully offline-capable

**Database Maintenance:**
- Auto-delete sessions older than 365 days on app launch (`cleanOldSessions()`)
- Prevents IndexedDB quota exhaustion (<10MB typical database size)
- User can manually export and clear data (Epic 5 feature)

### Observability

**Telemetry Events Logged:**

| Event | Module | Data Captured | Purpose |
|-------|--------|---------------|---------|
| `session_start` | training | `sessionType`, `drillCount`, `timestamp` | Track session frequency |
| `drill_complete` | number_line / spatial_rotation / math_operations | `accuracy`, `timeToAnswer`, `difficulty`, `isCorrect` | Analyze drill performance |
| `session_pause` | training | `currentDrillIndex`, `timestamp` | Understand interruption patterns |
| `session_resume` | training | `timestamp` | Track resume behavior |
| `session_end` | training | `accuracy`, `duration`, `confidenceChange`, `drillCount` | Measure session outcomes |

**Structured Logging:**
- All telemetry entries include:
  - `id`: UUID for unique identification
  - `timestamp`: ISO 8601 string for temporal analysis
  - `event`: Enum string for filtering
  - `module`: Training drill type or 'training' for session events
  - `data`: JSON object with event-specific metrics

**Performance Metrics:**
- Track drill completion times (`timeToAnswer` in milliseconds)
- Session duration (from `session_start` to `session_end`)
- Identify slow drills for UX optimization

**Error Logging:**
- Console errors logged for:
  - Dexie write failures
  - Component crashes (via Error Boundary)
  - Missing assessment data
- Future: Aggregate error logs in telemetry table (Epic 5)

**User Progress Signals:**
- Confidence deltas (`confidenceChange`) track emotional progress
- Accuracy trends across sessions (analyzed in Epic 5)
- Streak counter provides immediate feedback on consistency

**Debugging Support:**
- `exportSessionData(sessionId)` utility exports full session as JSON
- Browser DevTools IndexedDB inspector shows all Dexie tables
- React DevTools shows SessionContext state in real-time

## Dependencies and Integrations

### External Dependencies

**From package.json** (Epic 3 specific usage):

| Dependency | Version | Usage in Epic 3 | Critical Path |
|------------|---------|-----------------|---------------|
| `react` | 19.2.0 | All drill components, session state management | Yes |
| `react-dom` | 19.2.0 | Rendering training UI components | Yes |
| `dexie` | 4.2.1 | Persisting sessions, drill_results, telemetry_logs | Yes |
| `dexie-react-hooks` | 4.2.0 | `useLiveQuery()` for reactive Dexie queries | No (nice-to-have) |
| `framer-motion` | 12.23.24 | Drill transitions, feedback animations, confetti | Yes |
| `react-router-dom` | 7.9.5 | `/training` route navigation | Yes |
| `date-fns` | 4.0.0 | Streak calculation (date comparisons) | Yes |
| `lucide-react` | ^0.553.0 | Icons for drill types, pause button | No (emoji fallback) |
| `tailwind-merge` | ^3.4.0 | Conditional Tailwind class merging | No |
| `tailwindcss` | 4.1.17 | Styling all drill components | Yes |

**Dev Dependencies:**
| Dependency | Version | Usage |
|------------|---------|-------|
| `@playwright/test` | 1.56.1 | E2E testing (Story 3.8) |
| `@testing-library/react` | 16.3.0 | Component testing for drills |
| `vitest` | ^3.2.4 | Unit testing services (drillSelector, problemGenerator, streakManager) |
| `fake-indexeddb` | ^6.2.5 | Mock Dexie in tests |

### Internal Dependencies (Epic-to-Epic)

**Epic 1 (Foundation):**
- `src/context/SessionContext.tsx` - Extended with training-specific state
- `src/context/UserSettingsContext.tsx` - Read `soundEnabled`, `reducedMotion`
- `src/services/storage/db.ts` - Dexie database instance
- `src/shared/components/NumberKeypad.tsx` - Reused in MathOperationsDrill
- `src/shared/components/StreakCounter.tsx` - Displayed in session header
- shadcn/ui components: Button, Card, Progress, Dialog

**Epic 2 (Assessment):**
- **Critical Dependency:** `assessments` table in Dexie
  - Epic 3 reads latest assessment's `trainingPlanWeights` field
  - Format: `{ numberSense: number, spatial: number, operations: number }`
  - If missing: Use default equal weights (0.33, 0.33, 0.34)
- **Routing Dependency:** If no assessment exists, redirect to `/assessment`

### Integration Points

**Browser APIs:**
- `IndexedDB` (via Dexie) - Session and drill result persistence
- `localStorage` - Streak counter, last session date
- `performance.now()` - Drill timing measurements
- `Web Audio API` - Sound effects (success, incorrect)
- `matchMedia('(prefers-reduced-motion)')` - Accessibility animation toggle

**React Context:**
- **SessionContext:** Training session state (drillQueue, currentDrillIndex, results)
- **UserSettingsContext:** Sound and motion preferences
- **AppContext:** Streak counter updates

**Future Integration Points (Deferred):**
- Epic 4: Magic Minute micro-challenges consume `drill_results` data
- Epic 5: Progress tracking queries `sessions` and `drill_results` tables
- Epic 7: Service worker caches training route assets

### API Contracts (Between Components)

**TrainingSession ↔ Drill Components:**
```typescript
// TrainingSession provides:
interface DrillProps {
  difficulty: 'easy' | 'medium' | 'hard';
  sessionId: string;
  onComplete: (result: DrillResult) => void;
}

// Drill component calls onComplete with:
interface DrillResult {
  id: string;
  sessionId: string;
  module: 'number_line' | 'spatial_rotation' | 'math_operations';
  accuracy: number;
  timeToAnswer: number;
  isCorrect: boolean;
  // ... drill-specific fields
}
```

**DrillSelector ↔ Dexie:**
```typescript
// Query latest assessment:
const assessment = await db.assessments
  .orderBy('timestamp')
  .reverse()
  .first();

const weights = assessment?.trainingPlanWeights || {
  numberSense: 0.33,
  spatial: 0.33,
  operations: 0.34
};
```

**StreakManager ↔ localStorage:**
```typescript
const STORAGE_KEYS = {
  STREAK: 'discalculas:streak',
  LAST_SESSION_DATE: 'discalculas:lastSessionDate'
};

// Read/write patterns:
const streak = parseInt(localStorage.getItem(STORAGE_KEYS.STREAK) || '0');
localStorage.setItem(STORAGE_KEYS.STREAK, newStreak.toString());
```

## Acceptance Criteria (Authoritative)

**Epic-Level Acceptance Criteria** (from [epics.md](./epics.md)):

1. **AC-1:** Training session shell manages drill selection based on plan weights
   - Loads training plan weights from Epic 2 assessment
   - Generates weighted random drill queue (6-12 drills)
   - Enforces variety (max 3 consecutive drills of same type)

2. **AC-2:** Three drill types fully functional
   - Number Line Drill: Visual number placement (0-100 or 0-1000 range)
   - Spatial Rotation Drill: Mental rotation/mirroring of 2D shapes
   - Math Operations Drill: Basic arithmetic (addition, subtraction, multiplication)

3. **AC-3:** Each drill records comprehensive data
   - Accuracy percentage (0-100)
   - Time to answer (milliseconds)
   - Correctness (boolean)
   - Difficulty level
   - Drill-specific metadata (target number, shape type, operation, etc.)

4. **AC-4:** Confidence prompts before and after sessions
   - Pre-session confidence captured (1-5 emoji scale)
   - Post-session confidence captured (1-5 emoji scale)
   - Confidence delta calculated and stored

5. **AC-5:** Session data persists to Dexie
   - `sessions` table: Session metadata, accuracy, confidence deltas, duration
   - `drill_results` table: Individual drill outcomes
   - `telemetry_logs` table: Session lifecycle events

6. **AC-6:** Drills adapt within session (easy → medium → hard progression)
   - Initial drills start at easy difficulty
   - If accuracy > 80% for 3+ drills of same type: Escalate to next difficulty level
   - Progression: Easy → Medium → Hard

7. **AC-7:** E2E test covers complete training session
   - Navigate to `/training` route
   - Complete full session (confidence prompts + drills + completion summary)
   - Verify data persisted to Dexie
   - Cross-browser testing (Chromium, Firefox, WebKit)

## Traceability Mapping

| AC | Spec Section | Component(s) / API(s) | Test Idea | Story |
|----|--------------|----------------------|-----------|-------|
| AC-1 | Detailed Design > Services and Modules | `drillSelector.ts`, `TrainingSession.tsx`, SessionContext | Unit test: `selectDrills()` generates correct distribution for given weights. Integration test: Session loads weights from Dexie. | 3.1 |
| AC-2.1 | Detailed Design > APIs and Interfaces | `NumberLineDrill.tsx`, DrillProps interface | Component test: Drill renders with target number, accepts user input, calculates accuracy. Visual regression test: Number line layout on mobile. | 3.2 |
| AC-2.2 | Detailed Design > APIs and Interfaces | `SpatialRotationDrill.tsx`, SVG shapes library | Component test: Shapes render correctly, rotation/mirroring applied, user answer validated. | 3.3 |
| AC-2.3 | Detailed Design > APIs and Interfaces | `MathOperationsDrill.tsx`, `problemGenerator.ts` | Unit test: Problem generator creates valid problems per difficulty. Component test: Keypad input works, answer validation correct. | 3.4 |
| AC-3 | Detailed Design > Data Models | `DrillResult` interface, `drill_results` table in Dexie | Integration test: Drill completion persists result to Dexie with all required fields. Query test: Verify indexed fields (`sessionId`, `module`) enable fast lookups. | 3.7 |
| AC-4 | Detailed Design > APIs and Interfaces | `ConfidencePromptBefore.tsx`, `ConfidencePromptAfter.tsx` | Component test: Prompts render, require user selection, store values in SessionContext. Integration test: Confidence delta calculated correctly. | 3.6 |
| AC-5 | Detailed Design > Data Models, NFR > Reliability | Dexie `sessions`, `drill_results`, `telemetry_logs` tables | Integration test: Session creation, drill result adds, telemetry logging all succeed. Test error handling: Dexie write failure falls back to localStorage. | 3.7 |
| AC-6 | Detailed Design > Workflows and Sequencing | TrainingSession difficulty progression logic | Integration test: Run session with mock drill results achieving >80% accuracy, verify next drill of same type has elevated difficulty. Edge case: Verify progression caps at "hard". | 3.1, 3.5 |
| AC-7 | Test Strategy Summary | E2E test `training-flow.spec.ts` | E2E test: Full user journey from `/training` to completion summary. Verify DOM elements, Dexie persistence, streak update. Cross-browser: Run on Chromium, Firefox, WebKit. | 3.8 |

### Story-to-AC Mapping

| Story | Primary ACs Addressed | Notes |
|-------|----------------------|-------|
| 3.1: Training Session Shell | AC-1, AC-6 | Drill selection algorithm, session state management, difficulty progression |
| 3.2: Number Line Drill | AC-2.1, AC-3 | Visual drill implementation, result recording |
| 3.3: Spatial Rotation Drill | AC-2.2, AC-3 | SVG-based drill, rotation/mirroring logic |
| 3.4: Math Operations Drill | AC-2.3, AC-3 | Arithmetic problem generation, keypad input |
| 3.5: Drill Session UI | AC-6 (partial) | Progress bar, transitions, feedback - supports difficulty progression UX |
| 3.6: Confidence Prompts | AC-4 | Pre/post confidence capture, delta calculation |
| 3.7: Session Telemetry | AC-3, AC-5 | Dexie persistence, telemetry logging, data integrity |
| 3.8: E2E Test | AC-7 | Full integration validation |

### Manual Verification Requirements (from Epic 2 Retrospective)

**CRITICAL:** Each story must include manual verification in running dev server per new DoD:

| Story | Manual Verification Steps |
|-------|---------------------------|
| 3.1 | 1. Run `npm run dev` and navigate to `/training`<br>2. Verify TrainingSession renders with "Start Training" button<br>3. Verify SessionContext populates drillQueue<br>4. Verify redirect to `/assessment` if no training plan exists |
| 3.2 | 1. Start training session in dev server<br>2. Verify Number Line Drill renders with number line, marker, target number<br>3. Drag marker and submit answer<br>4. Verify visual feedback (correct/incorrect)<br>5. Verify result persists to Dexie (check DevTools Application tab) |
| 3.3 | 1. Start training session, advance to Spatial Rotation Drill<br>2. Verify SVG shapes render side-by-side<br>3. Select "Yes, Same" or "No, Different"<br>4. Verify feedback and auto-advance |
| 3.4 | 1. Start training session, advance to Math Operations Drill<br>2. Verify arithmetic problem displays<br>3. Use keypad to enter answer<br>4. Verify feedback and result persistence |
| 3.5 | 1. Start training session<br>2. Verify SessionProgressBar updates as drills complete<br>3. Verify DrillTransition appears between drills<br>4. Verify SessionFeedback shows checkmark/X<br>5. Tap Pause button, verify pause modal works |
| 3.6 | 1. Start training session<br>2. Verify ConfidencePromptBefore displays before first drill<br>3. Select confidence emoji<br>4. Complete all drills<br>5. Verify ConfidencePromptAfter displays<br>6. Verify SessionCompletionSummary shows stats |
| 3.7 | 1. Complete full training session<br>2. Open DevTools > Application > IndexedDB > DiscalculasDB<br>3. Verify `sessions` table has new entry with correct data<br>4. Verify `drill_results` table has all drill entries<br>5. Verify `telemetry_logs` has session events<br>6. Check localStorage for updated streak |
| 3.8 | 1. Run `npm run test:e2e`<br>2. Verify test passes on first run (no integration gaps)<br>3. If test fails: Identify which story verification was insufficient |

## Risks, Assumptions, Open Questions

### Risks

**RISK-1: Insufficient Assessment Data**
- **Risk:** User starts training without completing assessment
- **Impact:** Training plan weights unavailable → default weights used → training not personalized
- **Mitigation:**
  - Protected route: Redirect to `/assessment` if no assessment exists
  - Fallback weights (0.33, 0.33, 0.34) for edge cases
  - Toast notification: "Take assessment to personalize training"
- **Owner:** Story 3.1

**RISK-2: Drill Difficulty Too Aggressive**
- **Risk:** Difficulty progression escalates too quickly → user frustration → abandoned sessions
- **Impact:** Negative confidence deltas, reduced streak retention
- **Mitigation:**
  - Conservative threshold: Require >80% accuracy for 3+ drills before escalation
  - Manual testing with target users (Epic 2 retrospective lesson applied)
  - Future: Adaptive difficulty engine in Epic 4 will fine-tune thresholds
- **Owner:** Story 3.1, 3.5

**RISK-3: Dexie Write Failures**
- **Risk:** IndexedDB quota exceeded or browser storage disabled → session data lost
- **Impact:** User loses progress, streak broken, analytics unavailable
- **Mitigation:**
  - Wrap all Dexie writes in try-catch
  - Fallback: localStorage backup for session summary
  - Database maintenance: Auto-delete sessions >365 days old
  - Toast notification on write failure with user guidance
- **Owner:** Story 3.7

**RISK-4: Mobile Performance Degradation**
- **Risk:** Animations/transitions jank on low-end devices → poor UX
- **Impact:** Frustration, perceived low quality, user abandonment
- **Mitigation:**
  - Performance budget: Training chunk <50 KB
  - Use CSS transforms (GPU-accelerated) not JavaScript animations
  - Respect `prefers-reduced-motion` media query
  - Test on mid-tier device (not just flagship phones)
- **Owner:** Stories 3.2, 3.3, 3.4, 3.5

**RISK-5: E2E Test Fails Due to Incomplete Story Integration**
- **Risk:** E2E test (Story 3.8) fails because earlier stories didn't verify integration
- **Impact:** Regression to Epic 2 pattern where stories marked "done" but not actually working
- **Mitigation:** **NEW DoD PROCESS FROM EPIC 2 RETROSPECTIVE**
  - Each story MUST include manual verification in running dev server
  - Code review MUST include browser testing, not just test coverage review
  - E2E test should pass on first run if all stories followed new DoD
- **Owner:** All stories, enforced by code review process

### Assumptions

**ASSUMPTION-1: Epic 2 Assessment Schema Stable**
- **Assumption:** `assessments` table includes `trainingPlanWeights` field with format `{ numberSense, spatial, operations }`
- **Validation:** Read Epic 2 tech spec and story 2.5 implementation
- **If Invalid:** Add migration logic in drillSelector.ts to handle old assessment format

**ASSUMPTION-2: Epic 1 Context Providers Operational**
- **Assumption:** SessionContext, UserSettingsContext, AppContext are fully functional from Epic 1
- **Validation:** Epic 1 marked "done" in sprint-status.yaml with 8/8 stories complete
- **If Invalid:** May need to extend context providers in Epic 3 stories

**ASSUMPTION-3: Sound Files Available**
- **Assumption:** Sound files (success.mp3, incorrect.mp3) are <50 KB and royalty-free
- **Validation:** Source sound files from free library (e.g., freesound.org)
- **If Invalid:** Use silent mode only, defer sound to Epic 6 (Coach & Cognition)

**ASSUMPTION-4: SVG Shape Library Complexity Appropriate**
- **Assumption:** 8-10 pre-defined SVG shapes are sufficient for spatial rotation drill variety
- **Validation:** Manual testing with target users
- **If Invalid:** Expand shape library in future iteration, or add procedural shape generation

**ASSUMPTION-5: Streak Logic Meets User Expectations**
- **Assumption:** Streak resets if user misses >1 day (no grace period)
- **Validation:** User testing and feedback
- **If Invalid:** Add "freeze streak" feature in Epic 5 (Progress Tracking)

### Open Questions

**QUESTION-1: Should drills be skippable?**
- **Context:** DrillProps interface includes optional `onSkip` prop
- **Decision Needed:** Can users skip drills they find too difficult or frustrating?
- **Impact:** If yes: Session accuracy calculation needs adjustment (skip ≠ incorrect)
- **Resolution:** Defer skip functionality to Epic 4 (Adaptive Intelligence) for now
- **Owner:** Product Owner (Jeremy)

**QUESTION-2: What happens to interrupted sessions?**
- **Context:** User closes browser mid-session → Dexie shows session with status `in_progress`
- **Decision Needed:** On next launch, offer "Resume" or treat as abandoned?
- **Current Approach:** Story 3.7 includes basic resume detection
- **Future Enhancement:** Epic 7 (PWA) may add beforeunload prompt
- **Owner:** Story 3.7

**QUESTION-3: Should confidence prompts be optional?**
- **Context:** Some users may find constant emotional check-ins intrusive
- **Decision Needed:** Make prompts dismissible or always required?
- **Current Approach:** Required for MVP (critical for measuring efficacy)
- **Future:** UserSettingsContext could include `enableConfidencePrompts` toggle
- **Owner:** Product Owner (Jeremy)

**QUESTION-4: Cross-browser testing scope?**
- **Context:** Playwright E2E test (Story 3.8) can test Chromium, Firefox, WebKit
- **Decision Needed:** Test all three browsers or just Chromium for speed?
- **Current Approach:** Test all three (aligned with Epic 2 E2E test precedent)
- **Trade-off:** Slower CI builds vs broader coverage
- **Owner:** Story 3.8

## Test Strategy Summary

### Testing Levels

**Unit Tests** (Vitest):
- **Services:**
  - `drillSelector.ts`: Weighted random selection, variety enforcement
  - `problemGenerator.ts`: Arithmetic problem generation per difficulty
  - `streakManager.ts`: Streak calculation logic (today, yesterday, >1 day ago cases)
  - `exportData.ts`: Session data export utility
- **Test Coverage:** 100% required per architecture spec
- **Mocking:** Use `fake-indexeddb` for Dexie operations

**Component Tests** (React Testing Library):
- **Drill Components:**
  - `NumberLineDrill.tsx`: Rendering, user interaction (drag marker), accuracy calculation
  - `SpatialRotationDrill.tsx`: SVG rendering, rotation/mirroring logic, answer validation
  - `MathOperationsDrill.tsx`: Keypad input, problem display, answer checking
- **UI Components:**
  - `SessionProgressBar.tsx`: Progress calculation, visual update
  - `DrillTransition.tsx`: Animation timing, drill type display
  - `SessionFeedback.tsx`: Correct/incorrect feedback rendering
  - `ConfidencePromptBefore/After.tsx`: Emoji selection, value storage
- **Accessibility:** Test keyboard navigation, aria-labels, screen reader announcements

**Integration Tests** (Vitest + React Testing Library):
- **Session Flow:**
  - Start session → drillQueue populated from Dexie weights
  - Complete drill → result persisted to `drill_results` table
  - Complete session → `sessions` table updated with summary
  - Streak updated in localStorage
- **Error Handling:**
  - Dexie write failure → fallback to localStorage backup
  - Missing assessment → redirect to `/assessment`
  - Component crash → Error Boundary catches, shows fallback UI
- **Difficulty Progression:**
  - Mock drill results with >80% accuracy → verify next drill difficulty escalates
  - Verify progression caps at "hard"

**End-to-End Tests** (Playwright):
- **Training Flow** (`training-flow.spec.ts`):
  1. Navigate to `/training` route
  2. Pre-session confidence prompt displays and accepts input
  3. Drills execute in sequence (Number Line, Spatial, Math Operations)
  4. Progress bar updates
  5. Post-session confidence prompt displays
  6. Session completion summary shows accurate stats
  7. Verify Dexie persistence:
     - `sessions` table has new entry
     - `drill_results` table has all drill entries
     - `telemetry_logs` has lifecycle events
  8. Verify streak updated in localStorage
  9. Navigate to `/` (home) via "Done" button
- **Cross-Browser:** Chromium, Firefox, WebKit
- **Performance:** E2E test completes in <30 seconds
- **NEW REQUIREMENT:** Test should pass on first run (no integration gaps)

**Visual Regression Tests** (Optional, deferred):
- Drill layouts on mobile (320px), tablet (768px), desktop (1024px)
- Animation snapshots (if Playwright screenshot diffs enabled)

### Coverage Targets

**Per Architecture Spec:**
- **100% coverage required** for:
  - Unit tests (statements, branches, functions, lines)
  - Component tests (all drill and UI components)
- **Integration tests:** All critical paths (session start, drill completion, persistence)
- **E2E tests:** Complete user journey (confidence prompts → drills → completion)

**Edge Cases to Test:**
- Empty drill queue (should never happen, but handle gracefully)
- User closes browser mid-session (resume detection)
- IndexedDB quota exceeded (localStorage fallback)
- `prefers-reduced-motion` enabled (animations disabled)
- Sound disabled in UserSettingsContext (no audio playback)

### Test Execution

**Local Development:**
```bash
npm run test              # Unit + component tests
npm run test:watch        # Watch mode for TDD
npm run test:e2e          # Playwright E2E tests
npm run test:coverage     # Generate coverage report
```

**CI Pipeline** (from Epic 1):
- All tests run on every commit
- Coverage threshold enforced (100%)
- E2E tests run in headless mode
- Build fails if any test fails

### Manual Testing (NEW REQUIREMENT)

**Per Epic 2 Retrospective:**
- Each story MUST include manual verification in running dev server before marking "done"
- Code reviewers MUST run `npm run dev` and test feature in browser
- Manual verification steps documented in "Traceability Mapping" section above

**Test Device Matrix:**
- **Mobile:** iPhone 12 (iOS 15), Samsung Galaxy S21 (Android 12)
- **Tablet:** iPad Air
- **Desktop:** Chrome, Firefox, Safari (macOS), Edge (Windows)
- **Accessibility:** VoiceOver (iOS), TalkBack (Android), NVDA (Windows)

### Test Data

**Mock Training Plan Weights:**
```typescript
const mockWeights = {
  balanced: { numberSense: 0.33, spatial: 0.33, operations: 0.34 },
  numberSenseFocus: { numberSense: 0.6, spatial: 0.2, operations: 0.2 },
  spatialFocus: { numberSense: 0.2, spatial: 0.6, operations: 0.2 }
};
```

**Mock Drill Results:**
- Correct: `{ isCorrect: true, accuracy: 95, timeToAnswer: 3000 }`
- Incorrect: `{ isCorrect: false, accuracy: 20, timeToAnswer: 8000 }`
- Fast: `{ timeToAnswer: 1500 }` (< 2 seconds)
- Slow: `{ timeToAnswer: 12000 }` (> 10 seconds)

### Test Reporting

- **Coverage Report:** HTML report in `coverage/` directory
- **E2E Traces:** Playwright traces for failed tests (screenshots, network logs)
- **CI Summary:** Test results posted to PR comments (GitHub Actions)
