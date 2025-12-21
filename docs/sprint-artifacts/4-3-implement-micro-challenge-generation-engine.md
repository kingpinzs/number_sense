# Story 4.3: Implement Micro-Challenge Generation Engine

Status: done

## Story

As a **system creating Magic Minute challenges**,
I want **to generate targeted micro-challenges from user's recent mistakes**,
So that **the 60-second sprint focuses on exactly what the user needs to practice**.

## Acceptance Criteria

1. **GIVEN** Magic Minute timer is active (Story 4.2 complete)
   **WHEN** the 60-second countdown starts
   **THEN** the MicroChallengeGenerator creates challenges:
   - Analyzes last 10 drills for mistake patterns (uses MistakeAnalyzer)
   - Generates 10-15 micro-challenges (shorter than regular drills)
   - Prioritizes detected weakness areas (2x weight for mistake types)
   - Simplifies challenges slightly (reduce cognitive load under time pressure)

2. **Micro-Challenge Types - Number Line (Simplified):**
   - Smaller range (0-50 instead of 0-100)
   - Larger tolerance (±15% instead of ±10%)
   - Pre-positioned marker at 0, user drags to position
   - No "Submit" button - auto-submits after 2 seconds of no movement

3. **Micro-Challenge Types - Spatial Rotation (Simplified):**
   - Only asymmetric shapes: `'lshape'` and `'tshape'` (ShapeType values from shapes.tsx)
   - Only 90° or 180° rotations (no 270°, no mirroring)
   - Two options: "Same" or "Different" (no text input)

4. **Micro-Challenge Types - Math Operations (Simplified):**
   - Only single-digit operations
   - Number keypad with larger buttons (50px minimum)
   - Auto-submits after 2 digits typed (no explicit "Submit")

5. **Challenge Sequencing:**
   - Randomize order (avoid predictability)
   - Mix drill types (not all Number Line in a row)
   - Track used challenges (no duplicates within Magic Minute)

6. **Each micro-challenge result recorded:**
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

7. **Challenge difficulty adapts mid-Magic Minute:**
   - If 5 consecutive correct → increase difficulty slightly
   - If 3 consecutive incorrect → decrease difficulty
   - Maintains engagement (not too easy or too hard)

8. **Timeout handling:**
   - If user doesn't answer in 8 seconds → auto-skip (mark incorrect)

## Tasks / Subtasks

- [x] Task 1: Create MicroChallengeGenerator service (AC: #1)
  - [x] 1.1 Create `src/services/adaptiveDifficulty/microChallengeGenerator.ts`
  - [x] 1.2 Implement `mapMistakeTypeToDrillType(mistakeType)` - maps all 10 MistakeTypes to 3 drill types
  - [x] 1.3 Implement `generateMicroChallenges(mistakePatterns, count)` function
  - [x] 1.4 Add weighting logic (2x weight for detected mistake types)
  - [x] 1.5 Pre-generate 10-15 challenges pool at Magic Minute start

- [x] Task 2: Define MicroChallenge types (AC: #6)
  - [x] 2.1 Create `src/features/magic-minute/types/microChallenge.types.ts`
  - [x] 2.2 Define `MicroChallenge` interface
  - [x] 2.3 Define `MicroChallengeResult` interface
  - [x] 2.4 Define simplified drill config types

- [x] Task 3: Create MicroNumberLineDrill component (AC: #2)
  - [x] 3.1 Create `src/features/magic-minute/components/MicroNumberLineDrill.tsx`
  - [x] 3.2 Use 0-50 range with ±15% tolerance
  - [x] 3.3 Implement auto-submit after 2 seconds idle
  - [x] 3.4 Remove Submit button, use drag-based interaction only

- [x] Task 4: Create MicroSpatialDrill component (AC: #3)
  - [x] 4.1 Create `src/features/magic-minute/components/MicroSpatialDrill.tsx`
  - [x] 4.2 Import `SHAPES` from `@/features/training/content/shapes`, use only `'lshape'` and `'tshape'`
  - [x] 4.3 Only 90° and 180° rotations, no mirroring
  - [x] 4.4 Use two large buttons: "Same" / "Different"

- [x] Task 5: Create MicroMathDrill component (AC: #4)
  - [x] 5.1 Create `src/features/magic-minute/components/MicroMathDrill.tsx`
  - [x] 5.2 Single-digit operations only (e.g., 3 + 5, 9 - 4)
  - [x] 5.3 50px minimum button size on keypad
  - [x] 5.4 Auto-submit after 2 digits typed

- [x] Task 6: Implement challenge sequencer (AC: #5)
  - [x] 6.1 Create shuffle/randomize logic
  - [x] 6.2 Ensure no consecutive same drill types
  - [x] 6.3 Track used challenges to prevent duplicates

- [x] Task 7: Implement mid-session difficulty adaptation (AC: #7)
  - [x] 7.1 Track consecutive correct/incorrect streak
  - [x] 7.2 After 5 correct: slightly harder challenges
  - [x] 7.3 After 3 incorrect: slightly easier challenges

- [x] Task 8: Implement timeout handling (AC: #8)
  - [x] 8.1 Add 8-second timeout per challenge
  - [x] 8.2 Auto-skip and mark incorrect on timeout
  - [x] 8.3 Show visual countdown indicator

- [x] Task 9: Integrate with MagicMinuteTimer (AC: #1)
  - [x] 9.1 Modify `MagicMinuteTimerProps` to add `renderChallenge` prop (see Dev Notes)
  - [x] 9.2 Import MicroChallengeGenerator in MagicMinuteTimer
  - [x] 9.3 Generate challenges when timer starts, store in state
  - [x] 9.4 Expose `_recordChallengeResult` to child components via render prop
  - [x] 9.5 Track `currentIndex` and advance on challenge completion

- [x] Task 10: Persist results to Dexie (AC: #6)
  - [x] 10.1 Store results in `magic_minute_sessions.challengeResults` array (DrillResult schema lacks source field)
  - [x] 10.2 Update `magic_minute_sessions` with `challengesCompleted` and `successRate`

- [x] Task 11: Write unit tests
  - [x] 11.1 Test challenge generation with various mistake patterns
  - [x] 11.2 Test weighting favors detected weaknesses
  - [x] 11.3 Test no duplicate challenges generated
  - [x] 11.4 Test timeout auto-skip functionality
  - [x] 11.5 Test mid-session difficulty adaptation

### Review Follow-ups (AI-Review)
- [ ] [AI-Review][HIGH] Add RTL component tests for MicroNumberLineDrill.tsx
- [ ] [AI-Review][HIGH] Add RTL component tests for MicroSpatialDrill.tsx
- [ ] [AI-Review][HIGH] Add RTL component tests for MicroMathDrill.tsx

## Dev Notes

### Architecture Patterns and Constraints

**File Locations (MANDATORY):**
- Generator: `src/services/adaptiveDifficulty/microChallengeGenerator.ts`
- Types: `src/features/magic-minute/types/microChallenge.types.ts`
- Components: `src/features/magic-minute/components/Micro*.tsx`
- Tests: Co-located with `.test.ts` / `.test.tsx` suffix

**Required Imports (EXACT PATHS):**
```typescript
// microChallengeGenerator.ts
import { v4 as uuidv4 } from 'uuid';
import type { MistakePattern, MistakeType } from '@/services/adaptiveDifficulty/mistakeAnalyzer';
import type { MicroChallenge, MicroChallengeType } from '@/features/magic-minute/types/microChallenge.types';

// Micro-drill components - shape imports
import { SHAPES, type ShapeType } from '@/features/training/content/shapes';
// Available shapes: 'lshape', 'tshape' (asymmetric, good for rotation tests)

// Math problem generation
import { generateProblem } from '@/services/training/problemGenerator';
```

**Export Pattern:**
```typescript
// microChallengeGenerator.ts
export function generateMicroChallenges(
  mistakePatterns: MistakePattern[],
  count: number
): MicroChallenge[];
```

### Story 4.1 & 4.2 Integration

**MistakeAnalyzer API** (from `src/services/adaptiveDifficulty/mistakeAnalyzer.ts`):
```typescript
import {
  type MistakePattern,
  type MistakeType,
  detectPattern,
  analyzeSession
} from '@/services/adaptiveDifficulty/mistakeAnalyzer';

// MistakePattern structure:
interface MistakePattern {
  patternType: MistakeType;  // 'overestimation', 'rotation_confusion', etc.
  occurrences: number;
  recentDrills: number;
  confidence: number;  // 0-1
  detectedAt: number;
}
```

**Story 4.2 Integration Point:**
The MagicMinuteTimer component (from Story 4.2) must be extended to:
1. Call `generateMicroChallenges(mistakePatterns, 12)` when timer starts
2. Render challenges using a child component pattern
3. Track results via `_recordChallengeResult` (currently private, needs exposure)

**CRITICAL: MagicMinuteTimer Modification Required**
The existing `_recordChallengeResult` function in MagicMinuteTimer.tsx (line 153) is private.
Story 4.3 must refactor to use a render prop or children pattern:

```typescript
// Updated MagicMinuteTimerProps (modify existing)
export interface MagicMinuteTimerProps {
  mistakePatterns: MistakePattern[];
  sessionId: number;
  onComplete: (results: MagicMinuteSummary) => void;
  onChallengeComplete?: (result: MagicMinuteResult) => void;
  // NEW: Render prop for micro-challenges
  renderChallenge?: (props: {
    challenge: MicroChallenge;
    onResult: (result: MicroChallengeResult) => void;
    timeRemaining: number;
  }) => React.ReactNode;
}

// In MagicMinuteTimer.tsx, add challenge state and rendering:
const [challenges, setChallenges] = useState<MicroChallenge[]>([]);
const [currentIndex, setCurrentIndex] = useState(0);

useEffect(() => {
  const generated = generateMicroChallenges(mistakePatterns, 12);
  setChallenges(generated);
}, [mistakePatterns]);

// Expose the record function to children via render prop
{renderChallenge && challenges[currentIndex] && renderChallenge({
  challenge: challenges[currentIndex],
  onResult: (result) => {
    _recordChallengeResult({ correct: result.correct, timeToAnswer: result.timeToAnswer });
    setCurrentIndex(prev => prev + 1);
  },
  timeRemaining: timeLeft
})}
```

### Existing Drill Implementation Patterns

**NumberLineDrill pattern** (`src/features/training/drills/NumberLineDrill.tsx`):
```typescript
// Drill configs structure:
const drillConfigs: Record<'easy' | 'medium' | 'hard', DrillConfig> = {
  easy: {
    range: { min: 0, max: 100 },
    generateTarget: () => Math.floor(Math.random() * 10) * 10,
  },
  // ...
};

// Tolerance check:
const isWithinTolerance = (userAnswer: number, target: number): boolean => {
  const tolerance = range * 0.1;  // 10% tolerance
  return Math.abs(userAnswer - target) <= tolerance;
};
```

**For Micro-challenges, adapt to:**
```typescript
const microConfig = {
  range: { min: 0, max: 50 },  // Smaller range
  tolerance: 0.15,             // 15% tolerance (more forgiving)
  autoSubmitDelay: 2000,       // 2 seconds idle = auto-submit
};
```

**SpatialRotationDrill pattern** (`src/features/training/drills/SpatialRotationDrill.tsx`):
```typescript
import { SHAPES, type ShapeType } from '@/features/training/content/shapes';

// Actual shape sets from shapes.tsx:
// EASY_SHAPES = ['square', 'circle', 'triangle']
// MEDIUM_SHAPES = ['square', 'circle', 'triangle', 'rectangle', 'pentagon', 'lshape']
// HARD_SHAPES = [...all shapes including 'tshape', 'arrow', 'star']

// For micro-challenges, use asymmetric shapes (best for rotation detection):
const MICRO_SHAPES: ShapeType[] = ['lshape', 'tshape'];
const MICRO_ROTATIONS = [90, 180] as const;  // No 270°, no mirroring

// Render shape:
const ShapeComponent = SHAPES[shapeType];  // e.g., SHAPES['lshape']
```

**MathOperationsDrill pattern** (`src/features/training/drills/MathOperationsDrill.tsx`):
```typescript
import { generateProblem } from '@/services/training/problemGenerator';

// For micro-challenges, create simplified generator:
function generateMicroProblem(): { problem: string; answer: number } {
  const a = Math.floor(Math.random() * 9) + 1;  // 1-9
  const b = Math.floor(Math.random() * 9) + 1;  // 1-9
  // Addition only for micro (simplest)
  return { problem: `${a} + ${b}`, answer: a + b };
}
```

### MicroChallenge Type Definitions

```typescript
// src/features/magic-minute/types/microChallenge.types.ts

import type { MistakeType } from '@/services/adaptiveDifficulty/mistakeAnalyzer';
import type { MagicMinuteResult } from './magicMinute.types';

export type MicroChallengeType = 'number_line' | 'spatial' | 'math';

export interface MicroChallenge {
  id: string;                          // uuidv4()
  type: MicroChallengeType;
  targetMistakeType: MistakeType;      // Which pattern this addresses
  difficulty: 'micro';                 // Always simplified
  params: MicroNumberLineParams | MicroSpatialParams | MicroMathParams;
}

export interface MicroNumberLineParams {
  target: number;       // 0-50
  range: { min: 0; max: 50 };
  tolerance: 0.15;      // 15%
}

export interface MicroSpatialParams {
  shape: 'lshape' | 'tshape';  // ShapeType values from shapes.tsx
  rotation: 90 | 180;
  isSame: boolean;      // Correct answer
}

export interface MicroMathParams {
  problem: string;      // "3 + 5"
  answer: number;       // 8
}

// Extends existing MagicMinuteResult with challenge-specific fields
export interface MicroChallengeResult extends MagicMinuteResult {
  challengeId: string;
  challengeType: MicroChallengeType;
  mistakeTypeTargeted: MistakeType;
  timedOut: boolean;              // True if 8s timeout triggered
}
// Note: MagicMinuteResult already has: correct (boolean), timeToAnswer (number)
```

### Challenge Generation Algorithm

```typescript
// src/services/adaptiveDifficulty/microChallengeGenerator.ts

import { v4 as uuidv4 } from 'uuid';
import type { MistakePattern, MistakeType } from '@/services/adaptiveDifficulty/mistakeAnalyzer';
import type { MicroChallenge, MicroChallengeType } from '@/features/magic-minute/types/microChallenge.types';

/**
 * CRITICAL: Maps MistakeType to MicroChallengeType
 * All 10 mistake types must map to one of 3 drill types
 */
export function mapMistakeTypeToDrillType(mistakeType: MistakeType): MicroChallengeType {
  const mapping: Record<MistakeType, MicroChallengeType> = {
    // Number line mistakes → number_line drills
    overestimation: 'number_line',
    underestimation: 'number_line',
    magnitude_error: 'number_line',
    boundary_error: 'number_line',
    // Spatial rotation mistakes → spatial drills
    rotation_confusion: 'spatial',
    mirror_confusion: 'spatial',
    complexity_threshold: 'spatial',
    // Math operation mistakes → math drills
    operation_weakness: 'math',
    magnitude_threshold: 'math',
    speed_accuracy_tradeoff: 'math',
  };
  return mapping[mistakeType];
}

interface WeightedEntry {
  type: MicroChallengeType;
  weight: number;
}

export function generateMicroChallenges(
  mistakePatterns: MistakePattern[],
  count: number = 12
): MicroChallenge[] {
  const challenges: MicroChallenge[] = [];
  const pool = buildWeightedPool(mistakePatterns);
  let lastType: MicroChallengeType | null = null;

  for (let i = 0; i < count; i++) {
    const challenge = selectFromPool(pool, lastType);
    challenges.push(challenge);
    lastType = challenge.type;
  }

  return shuffleArray(challenges);
}

function buildWeightedPool(patterns: MistakePattern[]): WeightedEntry[] {
  const baseWeights: Record<MicroChallengeType, number> = {
    number_line: 1,
    spatial: 1,
    math: 1
  };

  // Apply 2x weight for detected weakness areas
  for (const pattern of patterns) {
    const drillType = mapMistakeTypeToDrillType(pattern.patternType);
    baseWeights[drillType] *= 2;
  }

  return Object.entries(baseWeights).map(([type, weight]) => ({
    type: type as MicroChallengeType,
    weight
  }));
}

function selectFromPool(pool: WeightedEntry[], excludeType: MicroChallengeType | null): MicroChallenge {
  // Filter out excluded type to prevent consecutive same types
  const filtered = excludeType
    ? pool.filter(e => e.type !== excludeType)
    : pool;

  // Weighted random selection
  const totalWeight = filtered.reduce((sum, e) => sum + e.weight, 0);
  let random = Math.random() * totalWeight;

  for (const entry of filtered) {
    random -= entry.weight;
    if (random <= 0) {
      return createChallenge(entry.type);
    }
  }

  return createChallenge(filtered[0].type);
}

function createChallenge(type: MicroChallengeType): MicroChallenge {
  // Implementation in Task 1.2 - creates challenge with appropriate params
  return {
    id: uuidv4(),
    type,
    targetMistakeType: 'overestimation', // Set based on context
    difficulty: 'micro',
    params: generateParamsForType(type)
  };
}

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
```

### Auto-Submit Implementation Pattern

**Number Line (2 seconds idle):**
```typescript
const [lastMoveTime, setLastMoveTime] = useState(Date.now());

useEffect(() => {
  const timeout = setTimeout(() => {
    if (Date.now() - lastMoveTime >= 2000) {
      handleAutoSubmit();
    }
  }, 2000);
  return () => clearTimeout(timeout);
}, [lastMoveTime]);

const handleDrag = () => {
  setLastMoveTime(Date.now());
};
```

**Math (auto-submit after 2 digits):**
```typescript
useEffect(() => {
  if (userInput.length >= 2) {
    handleAutoSubmit();
  }
}, [userInput]);
```

### 8-Second Timeout Implementation

```typescript
const CHALLENGE_TIMEOUT = 8000;  // 8 seconds

const [timeRemaining, setTimeRemaining] = useState(8);

useEffect(() => {
  const timer = setInterval(() => {
    setTimeRemaining(prev => {
      if (prev <= 1) {
        handleTimeout();
        return 0;
      }
      return prev - 1;
    });
  }, 1000);

  return () => clearInterval(timer);
}, []);

const handleTimeout = () => {
  onComplete({
    correct: false,
    timedOut: true,
    timeToAnswer: CHALLENGE_TIMEOUT
  });
};
```

### Mid-Session Difficulty Adaptation

```typescript
interface AdaptiveState {
  consecutiveCorrect: number;
  consecutiveIncorrect: number;
  difficultyModifier: -1 | 0 | 1;  // -1 = easier, 0 = normal, 1 = harder
}

function updateAdaptiveState(state: AdaptiveState, isCorrect: boolean): AdaptiveState {
  if (isCorrect) {
    const newCorrect = state.consecutiveCorrect + 1;
    return {
      consecutiveCorrect: newCorrect,
      consecutiveIncorrect: 0,
      difficultyModifier: newCorrect >= 5 ? 1 : state.difficultyModifier
    };
  } else {
    const newIncorrect = state.consecutiveIncorrect + 1;
    return {
      consecutiveCorrect: 0,
      consecutiveIncorrect: newIncorrect,
      difficultyModifier: newIncorrect >= 3 ? -1 : state.difficultyModifier
    };
  }
}
```

### UI Component Patterns (Larger Touch Targets)

```tsx
// Math keypad with 50px minimum buttons
<div className="grid grid-cols-3 gap-3">
  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map(num => (
    <Button
      key={num}
      className="min-h-[50px] min-w-[50px] text-2xl font-bold"
      onClick={() => handleDigit(num)}
    >
      {num}
    </Button>
  ))}
</div>

// Spatial Same/Different buttons
<div className="flex gap-4">
  <Button
    className="flex-1 min-h-[60px] text-xl"
    onClick={() => handleAnswer(true)}
  >
    Same
  </Button>
  <Button
    className="flex-1 min-h-[60px] text-xl"
    onClick={() => handleAnswer(false)}
  >
    Different
  </Button>
</div>
```

### Database Persistence

**IMPORTANT:** The `DrillResult` schema does NOT have a `source` field. Store Magic Minute results using the existing `magic_minute_sessions` table structure.

**Option 1 (Recommended): Store in magic_minute_sessions**
```typescript
// MagicMinuteSession schema already has challengesCompleted and successRate
// Store detailed results in a separate approach or update session on completion:
await db.magic_minute_sessions.update(sessionId, {
  challengesCompleted: completedCount,
  challengesGenerated: totalChallenges,
  successRate: completedCount > 0 ? correctCount / completedCount : 0
});
```

**Option 2: Associate via magicMinuteSessionId**
```typescript
// Store in drill_results but use existing fields to identify
// The result's sessionId can link back to the training session
// The timestamp range during Magic Minute identifies these results
const result: DrillResult = {
  sessionId,  // Training session ID
  timestamp: new Date().toISOString(),
  module: challengeType === 'number_line' ? 'number_line' :
          challengeType === 'spatial' ? 'spatial_rotation' : 'math_operations',
  difficulty: 'easy',  // Micro-challenges are simplified
  isCorrect,
  timeToAnswer,
  accuracy: isCorrect ? 100 : 0,
  // ...module-specific fields
};
await db.drill_results.add(result);
```

### Testing Strategy

**Test Fixtures (Use in all tests):**
```typescript
// src/features/magic-minute/__tests__/fixtures.ts
import type { MistakePattern, MistakeType } from '@/services/adaptiveDifficulty/mistakeAnalyzer';

export const MOCK_PATTERNS: MistakePattern[] = [
  { patternType: 'overestimation', occurrences: 3, recentDrills: 5, confidence: 0.6, detectedAt: Date.now() },
  { patternType: 'rotation_confusion', occurrences: 2, recentDrills: 5, confidence: 0.4, detectedAt: Date.now() },
];

export const MOCK_EMPTY_PATTERNS: MistakePattern[] = [];

export const ALL_MISTAKE_TYPES: MistakeType[] = [
  'overestimation', 'underestimation', 'magnitude_error', 'boundary_error',
  'rotation_confusion', 'mirror_confusion', 'complexity_threshold',
  'operation_weakness', 'magnitude_threshold', 'speed_accuracy_tradeoff'
];
```

**Unit Tests (Vitest):**
1. `generateMicroChallenges` produces correct count
2. `mapMistakeTypeToDrillType` maps all 10 types correctly
3. Weighting favors detected mistake patterns (2x for detected)
4. No consecutive same drill types
5. No duplicate challenges in pool
6. Timeout triggers after 8 seconds
7. Auto-submit triggers correctly
8. Difficulty adaptation logic correct

**Component Tests (RTL):**
1. MicroNumberLineDrill renders and accepts input
2. MicroSpatialDrill shows shapes (`'lshape'`, `'tshape'`) and accepts Same/Different
3. MicroMathDrill shows problem and keypad works
4. Timeout indicator displays correctly
5. 8-second timeout auto-skips and marks incorrect

### Performance Requirements

- Challenge generation must complete in <50ms
- Pre-generate all challenges before timer starts
- No generation lag during 60-second sprint
- Components should be lightweight (no complex animations)

### Accessibility Requirements (WCAG 2.1 AA)

- Large touch targets (50px minimum for all interactive elements)
- High contrast colors for time-pressured readability
- `aria-label` on all buttons
- `aria-live="assertive"` for timeout warnings
- Keyboard navigation support

### References

- [Story 4.2: Magic Minute Timer](docs/sprint-artifacts/4-2-build-magic-minute-timer-component.md) - Prerequisite
- [Story 4.1: Mistake Analyzer](src/services/adaptiveDifficulty/mistakeAnalyzer.ts) - API integration
- [NumberLineDrill](src/features/training/drills/NumberLineDrill.tsx) - Adaptation pattern
- [SpatialRotationDrill](src/features/training/drills/SpatialRotationDrill.tsx) - Adaptation pattern
- [MathOperationsDrill](src/features/training/drills/MathOperationsDrill.tsx) - Adaptation pattern
- [shapes.tsx](src/features/training/content/shapes.tsx) - Shape definitions
- [problemGenerator.ts](src/services/training/problemGenerator.ts) - Math problem generation

## Dev Agent Record

### Agent Model Used

Implementation: Unknown (not recorded by original dev agent)
Code Review: Claude Opus 4.5 (claude-opus-4-5-20251101) - 2025-12-21

### Debug Log References

- Code review performed: All 8 ACs verified as implemented
- Unit tests: 21/21 passing (microChallengeGenerator.test.ts)

### Completion Notes List

- [x] All Acceptance Criteria verified as implemented
- [x] MicroChallengeGenerator properly maps all 10 MistakeTypes to 3 drill types
- [x] 2x weighting applied for detected weakness areas
- [x] MicroNumberLineDrill: 0-50 range, 15% tolerance, auto-submit after 2s idle
- [x] MicroSpatialDrill: lshape/tshape only, 90/180 rotations, Same/Different buttons
- [x] MicroMathDrill: single-digit ops, 50px buttons, auto-submit after 2 digits
- [x] 8-second timeout implemented in all micro-drill components
- [x] Mid-session difficulty adaptation (5 correct -> harder, 3 incorrect -> easier)
- [x] MagicMinuteTimer integration with renderChallenge prop pattern
- [ ] **REVIEW FINDING:** Component-level tests (RTL) for Micro* components not found

### File List

**Created:**
- `src/services/adaptiveDifficulty/microChallengeGenerator.ts` - Main challenge generation service
- `src/services/adaptiveDifficulty/microChallengeGenerator.test.ts` - Unit tests (21 tests)
- `src/features/magic-minute/types/microChallenge.types.ts` - Type definitions
- `src/features/magic-minute/components/MicroNumberLineDrill.tsx` - Number line micro-drill
- `src/features/magic-minute/components/MicroSpatialDrill.tsx` - Spatial rotation micro-drill
- `src/features/magic-minute/components/MicroMathDrill.tsx` - Math operations micro-drill

**Modified:**
- `src/features/magic-minute/components/MagicMinuteTimer.tsx` - Added micro-challenge integration
- `src/features/magic-minute/types/magicMinute.types.ts` - Extended MagicMinuteTimerProps

