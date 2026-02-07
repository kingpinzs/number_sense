# Epic Technical Specification: Foundation & Core Refactor

Date: 2025-11-09
Author: Jeremy
Epic ID: 1
Status: Draft

---

## Overview

Epic 1 establishes the modern technical foundation for Discalculas by migrating from a 1,600-line monolithic JavaScript prototype to a production-ready Vite + React 19 + TypeScript architecture. This epic directly supports the PRD's Functional Requirement FR1 (Modular Codebase) and FR6 (Testing Harness), transforming an unmaintainable brownfield prototype into a greenfield codebase with 100% automated test coverage enforcement. The epic delivers a feature-based folder structure, Dexie IndexedDB layer for offline-first local storage, React Context state management, and comprehensive CI/CD pipeline that blocks merges when quality thresholds slip. Without this foundation, subsequent epics cannot deliver the mobile-first responsive UX, PWA capabilities, or adaptive intelligence features specified in the PRD.

## Objectives and Scope

**In Scope:**
- Initialize Vite 7.2 project with React 19.2, TypeScript 5.9, and all core dependencies (Dexie, React Router, Recharts, Framer Motion, Tailwind v4)
- Configure Tailwind CSS v4 with Balanced Warmth color theme (#E87461 coral, #A8E6CF mint, #FFD56F yellow) and shadcn/ui design system
- Create feature-based folder structure matching architecture specification (assessment/, training/, coach/, cognition/, progress/, magic-minute/, shared/, services/, context/, routes/)
- Implement Dexie database layer with schema v1 (8 tables: sessions, assessments, drill_results, telemetry_logs, magic_minute_sessions, difficulty_history, experiments, experiment_observations)
- Set up React Context providers (AppContext for app-level state, SessionContext for active sessions, UserSettingsContext for persisted preferences)
- Configure Vitest + React Testing Library + Playwright testing infrastructure with 100% coverage threshold enforcement
- Create shared component foundation (BottomNav, StreakCounter, LoadingSpinner, ErrorBoundary) with full test coverage
- Establish GitHub Actions CI/CD pipeline running linting, type checking, tests, and builds on every commit

**Out of Scope:**
- Feature implementation (Epics 2-8 implement Assessment, Training, Progress, etc.)
- Migration of existing prototype code (existing code archived, not refactored)
- Storybook visual regression testing (deferred to future epic)
- Performance optimization beyond Vite defaults (Epic 7 adds PWA optimization)
- Backend services or cloud sync (architecture is local-first only)

**Constraints:**
- Must achieve 100% test coverage (statements, branches, functions, lines) before Epic 1 completion
- All package versions must match architecture specification exactly (verified 2025-11-09)
- Folder structure must match architecture.md to prevent AI agent confusion
- Mobile-first design: breakpoints at 320px (mobile), 768px (tablet), 1024px (desktop)

## System Architecture Alignment

This epic implements ADR-001 (Technology Stack), ADR-002 (State Management), ADR-004 (Project Organization), and ADR-005 (Testing Strategy) from the architecture document. Key alignments:

**Technology Stack (ADR-001):**
- Vite 7.2 selected for instant HMR and optimized builds (<2s load time NFR)
- React 19.2 provides server components foundation for future optimization
- TypeScript 5.9 enforces type safety across 48 stories
- Dependencies: Dexie 4.2.1 (IndexedDB), React Router 7.9.5, Recharts 3.3.0, Framer Motion 12.23.24, React Hook Form 7.66.0, date-fns 4.0
- Design system: Tailwind CSS v4 + shadcn/ui (mobile-first responsive utilities)

**State Management (ADR-002):**
- React Context chosen over Redux for simplicity and local-first architecture
- Three context providers: AppContext (global app state), SessionContext (active training session), UserSettingsContext (persisted preferences)
- LocalStorage keys: STREAK, LAST_SESSION_DATE, USER_SETTINGS, LAST_USED_MODULE, RESEARCH_MODE_ENABLED

**Project Organization (ADR-004):**
- Feature-based folders (assessment/, training/, coach/, cognition/, progress/) prevent code sprawl
- Each feature exports public API via index.ts
- Shared utilities in src/shared/ (components, hooks, utils, types)
- Services layer (storage/, telemetry/, pwa/, adaptiveDifficulty/, research/) isolates cross-cutting concerns

**Testing Strategy (ADR-005):**
- Vitest for unit/integration tests (fast, Vite-native)
- React Testing Library for component tests (user-centric queries)
- Playwright for E2E tests (Chromium, Firefox, WebKit; mobile viewport 375×667)
- 100% coverage threshold enforced in CI (c8 coverage provider)
- Co-located test files (Component.test.tsx next to Component.tsx)
- AAA pattern mandatory (Arrange, Act, Assert)

**NFR Support:**
- Performance: Vite code splitting + lazy loading routes → <2s initial load (NFR)
- Reliability: Dexie persistence + LocalStorage ensures telemetry survives restarts (NFR)
- Accessibility: shadcn/ui WCAG 2.1 AA compliant, 44px+ touch targets (ADR-006)
- Testability: 100% coverage gates prevent shipping untested code (NFR)

**Constraints Applied:**
- No external databases (local-first architecture)
- User ID always "local_user" (privacy by design)
- IndexedDB + LocalStorage only (no cloud services)
- Bundle targets: <150KB initial, <50KB per route chunk

## Detailed Design

### Services and Modules

| Module/Service | Responsibility | Key Inputs | Key Outputs | Owner Story |
|----------------|----------------|------------|-------------|-------------|
| **Vite Project** | Build tooling, dev server, HMR, production bundling | source files (src/), config (vite.config.ts) | Optimized bundles (dist/), dev server on :5173 | Story 1.1 |
| **Tailwind + shadcn/ui** | Design system, responsive utilities, accessible components | theme config (tailwind.config.js), UX spec colors | CSS classes, UI components (Button, Card, Sheet, Toast, Progress, Form) | Story 1.2 |
| **Folder Structure** | Code organization, module boundaries, import paths | Architecture specification | Feature folders (assessment/, training/, etc.), shared utilities | Story 1.3 |
| **Dexie Database Service** (`src/services/storage/db.ts`) | IndexedDB abstraction, type-safe queries, schema versioning | TypeScript interfaces (schemas.ts) | Singleton `db` instance, table accessors, migrations | Story 1.4 |
| **LocalStorage Service** (`src/services/storage/localStorage.ts`) | Key-value persistence for settings/streak | STORAGE_KEYS constants | Get/set wrappers for typed access | Story 1.4 |
| **AppContext** (`src/context/AppContext.tsx`) | Global app state (streak, online status, sync timestamp) | User actions (SET_STREAK, UPDATE_ONLINE_STATUS) | Context value via useApp() hook | Story 1.5 |
| **SessionContext** (`src/context/SessionContext.tsx`) | Active training session state (module, sessionId, status, startTime) | Session actions (START_SESSION, END_SESSION, PAUSE_SESSION) | Context value via useSession() hook | Story 1.5 |
| **UserSettingsContext** (`src/context/UserSettingsContext.tsx`) | User preferences (reducedMotion, soundEnabled, dailyGoalMinutes, researchModeEnabled) | Settings updates (UPDATE_SETTINGS) | Persisted settings via useUserSettings() hook | Story 1.5 |
| **Testing Infrastructure** | Test execution, coverage enforcement, E2E automation | Test files (*.test.tsx), Playwright specs | Coverage reports (HTML/lcov), E2E traces | Story 1.6 |
| **BottomNav** (`src/shared/components/BottomNav.tsx`) | Primary navigation, mobile-optimized tabs | Current route (useLocation) | Navigation actions (useNavigate) | Story 1.7 |
| **StreakCounter** (`src/shared/components/StreakCounter.tsx`) | Display current streak, celebration animation | Streak value from AppContext | Visual streak display with tap animation | Story 1.7 |
| **LoadingSpinner** (`src/shared/components/LoadingSpinner.tsx`) | Loading states, accessible progress indicator | Size prop (small/medium/large) | Animated spinner with ARIA labels | Story 1.7 |
| **ErrorBoundary** (`src/shared/components/ErrorBoundary.tsx`) | React error catching, fallback UI, telemetry logging | React component errors | Fallback UI with retry button | Story 1.7 |
| **CI/CD Pipeline** (`.github/workflows/ci.yml`) | Automated testing, linting, building, coverage enforcement | Git commits/PRs | Build status, coverage reports, artifacts | Story 1.8 |

### Data Models and Contracts

**Dexie Schema v1** (from architecture.md):

```typescript
// src/services/storage/schemas.ts

export interface Session {
  id?: number;           // Primary key (auto-increment)
  timestamp: string;     // ISO 8601 (indexed)
  module: string;        // "assessment" | "training" | "cognition" | "coach"
  duration: number;      // milliseconds
  completionStatus: "completed" | "abandoned" | "paused";
  confidencePre?: number;   // 1-10 scale
  confidencePost?: number;  // 1-10 scale
  anxietyLevel?: number;    // 1-10 scale
}

export interface Assessment {
  id?: number;
  timestamp: string;
  status: "in-progress" | "completed";
  totalQuestions: number;
  correctAnswers: number;
  weaknesses: string[];     // e.g., ["number-sense", "spatial-rotation"]
  strengths: string[];
  recommendations: string[];
  userId: string;          // Always "local_user"
}

export interface DrillResult {
  id?: number;
  sessionId: number;       // Foreign key to sessions table
  timestamp: string;
  module: string;          // "number-line" | "spatial-rotation" | "math-operations"
  drillType: string;
  correctAnswers: number;
  totalQuestions: number;
  averageResponseTime: number;  // milliseconds
  difficultyLevel: number;      // 1-10
}

export interface TelemetryLog {
  id?: number;
  timestamp: string;       // Indexed
  event: string;          // Indexed (e.g., "drill_completed", "session_started")
  module: string;
  data: Record<string, any>;  // JSON payload
  userId: string;         // Always "local_user"
}

export interface MagicMinuteSession {
  id?: number;
  sessionId: number;
  timestamp: string;
  targetedMistakes: string[];   // Array of mistake types from session
  challengesGenerated: number;
  challengesCompleted: number;
  successRate: number;          // 0-1
  duration: number;             // milliseconds (should be ~60000)
}

export interface DifficultyHistory {
  id?: number;
  sessionId: number;
  timestamp: string;
  module: string;
  previousDifficulty: number;   // 1-10
  newDifficulty: number;        // 1-10
  reason: string;               // "too_easy" | "too_hard" | "optimal"
  userAccepted: boolean;        // Did user accept adjustment?
}

export interface Experiment {
  id?: number;
  name: string;
  description: string;
  status: "active" | "paused" | "completed";
  startDate: string;
  endDate?: string;
  variants: string[];           // e.g., ["control", "variant_a", "variant_b"]
}

export interface ExperimentObservation {
  id?: number;
  experimentId: number;
  variantId: string;
  timestamp: string;
  metric: string;               // e.g., "completion_rate", "confidence_delta"
  value: number;
  userId: string;               // Always "local_user"
}
```

**Dexie Schema Definition** (Story 1.4 implementation):

```typescript
// src/services/storage/db.ts
import Dexie, { Table } from 'dexie';
import type { Session, Assessment, DrillResult, TelemetryLog,
               MagicMinuteSession, DifficultyHistory, Experiment,
               ExperimentObservation } from './schemas';

export class DiscalculasDB extends Dexie {
  sessions!: Table<Session, number>;
  assessments!: Table<Assessment, number>;
  drill_results!: Table<DrillResult, number>;
  telemetry_logs!: Table<TelemetryLog, number>;
  magic_minute_sessions!: Table<MagicMinuteSession, number>;
  difficulty_history!: Table<DifficultyHistory, number>;
  experiments!: Table<Experiment, number>;
  experiment_observations!: Table<ExperimentObservation, number>;

  constructor() {
    super('DiscalculasDB');

    this.version(1).stores({
      sessions: '++id, timestamp, module, [timestamp+module]',
      assessments: '++id, timestamp, status',
      drill_results: '++id, sessionId, timestamp, module',
      telemetry_logs: '++id, timestamp, event, [timestamp+event]',
      magic_minute_sessions: '++id, sessionId, timestamp',
      difficulty_history: '++id, sessionId, timestamp, module',
      experiments: '++id, status',
      experiment_observations: '++id, experimentId, variantId, timestamp'
    });
  }
}

export const db = new DiscalculasDB();
```

**LocalStorage Keys** (Story 1.4 implementation):

```typescript
// src/services/storage/localStorage.ts
export const STORAGE_KEYS = {
  STREAK: 'discalculas:streak',
  LAST_SESSION_DATE: 'discalculas:lastSessionDate',
  USER_SETTINGS: 'discalculas:userSettings',
  LAST_USED_MODULE: 'discalculas:lastUsedModule',
  RESEARCH_MODE_ENABLED: 'discalculas:researchModeEnabled'
} as const;

export interface UserSettings {
  reducedMotion: boolean;
  soundEnabled: boolean;
  dailyGoalMinutes: number;
  researchModeEnabled: boolean;
}
```

**React Context State Contracts** (Story 1.5 implementation):

```typescript
// src/context/AppContext.tsx
export interface AppState {
  streak: number;
  onlineStatus: boolean;
  lastSyncTimestamp: string | null;
}

export type AppAction =
  | { type: 'SET_STREAK'; payload: number }
  | { type: 'UPDATE_ONLINE_STATUS'; payload: boolean }
  | { type: 'SET_LAST_SYNC'; payload: string | null };

// src/context/SessionContext.tsx
export type SessionStatus = 'idle' | 'active' | 'paused' | 'completed';

export interface SessionState {
  currentModule: string | null;
  sessionId: string | null;
  sessionStatus: SessionStatus;
  startTime: string | null;
}

export type SessionAction =
  | { type: 'START_SESSION'; payload: { module: string; sessionId: string } }
  | { type: 'END_SESSION' }
  | { type: 'PAUSE_SESSION' }
  | { type: 'RESUME_SESSION' };
```

### APIs and Interfaces

**Note:** Epic 1 does not implement APIs or backend interfaces (local-first architecture). This section documents internal React interfaces and component props contracts.

**Component Props Interfaces** (Story 1.7):

```typescript
// src/shared/components/BottomNav.tsx
export interface BottomNavProps {
  className?: string;
}

// src/shared/components/StreakCounter.tsx
export interface StreakCounterProps {
  streak: number;
  onTap?: () => void;
  className?: string;
}

// src/shared/components/LoadingSpinner.tsx
export type SpinnerSize = 'small' | 'medium' | 'large';

export interface LoadingSpinnerProps {
  size?: SpinnerSize;
  className?: string;
  label?: string;  // Screen reader text (default: "Loading...")
}

// src/shared/components/ErrorBoundary.tsx
export interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; resetError: () => void }>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}
```

**Custom Hooks Interfaces** (Story 1.5):

```typescript
// src/context/AppContext.tsx
export function useApp(): {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  setStreak: (streak: number) => void;
  updateOnlineStatus: (isOnline: boolean) => void;
  setLastSync: (timestamp: string | null) => void;
}

// src/context/SessionContext.tsx
export function useSession(): {
  state: SessionState;
  dispatch: React.Dispatch<SessionAction>;
  startSession: (module: string, sessionId: string) => void;
  endSession: () => void;
  pauseSession: () => void;
  resumeSession: () => void;
}

// src/context/UserSettingsContext.tsx
export function useUserSettings(): {
  settings: UserSettings;
  updateSettings: (partial: Partial<UserSettings>) => void;
}
```

**Dexie Query Interfaces** (Story 1.4):

```typescript
// Common query patterns (no explicit API, using Dexie native methods)

// Get all sessions from last 7 days
const recentSessions = await db.sessions
  .where('timestamp')
  .above(sevenDaysAgo)
  .toArray();

// Get drill results for specific session
const drillResults = await db.drill_results
  .where('sessionId')
  .equals(sessionId)
  .toArray();

// Live query with React hooks (dexie-react-hooks)
import { useLiveQuery } from 'dexie-react-hooks';

const sessions = useLiveQuery(() =>
  db.sessions.orderBy('timestamp').reverse().limit(10).toArray()
);
```

### Workflows and Sequencing

**Epic 1 Story Sequencing** (Linear dependency chain):

```
Story 1.1 (Vite Init)
    ↓
Story 1.2 (Tailwind + shadcn/ui)
    ↓
Story 1.3 (Folder Structure)
    ↓
Story 1.4 (Dexie Database)
    ↓
Story 1.5 (React Context)
    ↓
Story 1.6 (Testing Infrastructure)
    ↓
Story 1.7 (Shared Components)
    ↓
Story 1.8 (CI/CD Pipeline)
```

**Component Initialization Flow** (Story 1.5, executed in src/App.tsx):

```typescript
// Context provider wrapping order (outer to inner):
<UserSettingsContextProvider>      // 1. Load persisted settings first
  <AppContextProvider>              // 2. Initialize app-level state
    <SessionContextProvider>        // 3. Manage active sessions
      <BrowserRouter>               // 4. Enable routing
        <Routes>                    // 5. Render app content
          <Route path="/" element={<HomePage />} />
          <Route path="/assessment" element={<AssessmentRoute />} />
          <Route path="/training" element={<TrainingRoute />} />
          <Route path="/progress" element={<ProgressRoute />} />
          <Route path="/profile" element={<ProfileRoute />} />
        </Routes>
      </BrowserRouter>
    </SessionContextProvider>
  </AppContextProvider>
</UserSettingsContextProvider>
```

**Testing Workflow Sequence** (Story 1.6):

```
1. Developer writes feature code (Component.tsx)
   ↓
2. Developer writes co-located test (Component.test.tsx)
   ↓
3. Run unit tests locally: npm run test
   ↓
4. Vitest executes tests, generates coverage report
   ↓
5. Coverage threshold check: Must be 100% (statements, branches, functions, lines)
   ↓ (if coverage < 100%)
6. CI pipeline FAILS, blocks merge
   ↓ (if coverage = 100%)
7. CI pipeline continues to E2E tests
   ↓
8. Playwright runs E2E specs (npm run test:e2e)
   ↓
9. Build production bundle (npm run build)
   ↓
10. All steps pass → merge allowed
```

**CI/CD Pipeline Sequence** (Story 1.8, `.github/workflows/ci.yml`):

```yaml
# High-level flow (detailed YAML in Story 1.8 implementation):
on: [push, pull_request]

jobs:
  test-and-build:
    runs-on: ubuntu-latest
    steps:
      1. Checkout code (actions/checkout@v4)
      2. Setup Node.js 20.x (actions/setup-node@v4)
      3. Cache dependencies (actions/cache@v4)
      4. Install dependencies (npm ci)
      5. Lint code (npm run lint)
      6. Type check (npx tsc --noEmit)
      7. Run unit/integration tests (npm run test)
         └─> Coverage threshold enforced: fail if < 100%
      8. Run E2E tests (npm run test:e2e)
         └─> Install Playwright browsers (npx playwright install --with-deps chromium)
      9. Build production bundle (npm run build)
      10. Upload coverage report as artifact
```

**Development Workflow (Typical developer experience)**:

```
1. Developer runs: npm run dev
   └─> Vite dev server starts on http://localhost:5173
   └─> Hot Module Replacement (HMR) enabled

2. Developer edits Component.tsx
   └─> Browser auto-refreshes (<200ms)

3. Developer writes Component.test.tsx
   └─> Runs: npm run test (or test:ui for interactive mode)
   └─> Vitest executes tests, shows coverage

4. Developer commits changes
   └─> Git hook runs linter (optional, not in Epic 1)

5. Developer pushes to GitHub
   └─> CI pipeline triggers
   └─> GitHub Actions runs full test suite
   └─> Coverage gates enforce 100% threshold

6. All checks pass
   └─> PR approved for merge
   └─> Main branch updated
```

## Non-Functional Requirements

### Performance

**Targets from PRD:**
- Initial load: <2 seconds on mid-tier phones
- Interaction latency: <100ms
- Frame rate: 60 fps sustained
- Service worker payload: <500 KB

**Epic 1 Implementation:**

| Metric | Target | Implementation Strategy | Verification Method |
|--------|--------|-------------------------|---------------------|
| **Initial Bundle Size** | <150 KB (gzip) | Vite tree-shaking, code splitting at route level | Verify in Story 1.8: `npm run build` output |
| **Route Chunk Size** | <50 KB per route | Lazy loading with React.lazy() and Suspense | Bundle analyzer in CI |
| **Dev Server Start** | <2 seconds | Vite native speed (no bundling on start) | Manual test in Story 1.1 |
| **HMR Update** | <200ms | Vite instant HMR | Developer experience verification |
| **TypeScript Compile** | <5 seconds for full project | tsconfig with strict mode, incremental builds | Story 1.1: `npx tsc --noEmit` |
| **Test Execution** | <10 seconds for unit tests | Vitest parallel execution, smart re-run | Story 1.6: `npm run test` time |
| **Build Time** | <30 seconds | Vite production build optimization | Story 1.8 CI pipeline timing |

**Code Splitting Strategy** (prepared in Epic 1, utilized in Epics 2+):
```typescript
// src/App.tsx
const AssessmentRoute = lazy(() => import('./routes/AssessmentRoute'));
const TrainingRoute = lazy(() => import('./routes/TrainingRoute'));
const ProgressRoute = lazy(() => import('./routes/ProgressRoute'));
const ProfileRoute = lazy(() => import('./routes/ProfileRoute'));
```

**Vite Configuration** (Story 1.1):
```typescript
// vite.config.ts
export default defineConfig({
  build: {
    target: 'es2020',
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'dexie-vendor': ['dexie', 'dexie-react-hooks'],
          'ui-vendor': ['framer-motion', 'recharts']
        }
      }
    },
    chunkSizeWarningLimit: 600
  }
});
```

**Performance Budget** (enforced in Story 1.8 CI):
- Fail build if initial bundle >150 KB
- Warn if route chunk >50 KB
- Lighthouse performance score >90

### Security

**Threat Model:**
Epic 1 establishes a **local-first, client-only** application with no backend, eliminating most traditional web security threats (XSS from server, SQL injection, auth bypass). Primary security concerns are:
1. Client-side data tampering (low risk: affects only local user)
2. XSS from user-generated content (mitigated by React escaping)
3. Dependency vulnerabilities (mitigated by automated scanning)

**Security Measures:**

| Concern | Mitigation | Implementation |
|---------|------------|----------------|
| **XSS (Cross-Site Scripting)** | React auto-escapes JSX, strict TypeScript types | Story 1.1: React 19.2 default behavior, TypeScript strict mode |
| **Dependency Vulnerabilities** | Automated npm audit in CI pipeline | Story 1.8: Add `npm audit --audit-level=high` to CI |
| **Data Privacy** | All data stored locally (IndexedDB + LocalStorage), no external services | Story 1.4: Architecture enforces, no backend dependencies |
| **User ID Tracking** | User ID always "local_user" (no unique identifiers) | Story 1.4: Hardcoded in schemas, validated in tests |
| **LocalStorage Access** | Namespaced keys (`discalculas:*`) prevent collisions | Story 1.4: STORAGE_KEYS constants |
| **Content Security Policy** | Prepared for Epic 7 (PWA) | Deferred: `index.html` meta CSP tag in Story 7.2 |

**Data Handling** (Story 1.4 implementation):
```typescript
// src/services/storage/localStorage.ts
export function getUserSettings(): UserSettings {
  const raw = localStorage.getItem(STORAGE_KEYS.USER_SETTINGS);
  if (!raw) return DEFAULT_SETTINGS;

  try {
    const parsed = JSON.parse(raw);
    // Validate structure to prevent injection
    return validateUserSettings(parsed);
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function validateUserSettings(obj: any): UserSettings {
  return {
    reducedMotion: Boolean(obj.reducedMotion),
    soundEnabled: Boolean(obj.soundEnabled),
    dailyGoalMinutes: Number(obj.dailyGoalMinutes) || 60,
    researchModeEnabled: Boolean(obj.researchModeEnabled)
  };
}
```

**CI Security Checks** (Story 1.8):
```yaml
- name: Security Audit
  run: npm audit --audit-level=high

- name: Dependency Check
  run: npx npm-check-updates --target minor
```

**Future Considerations** (out of scope for Epic 1):
- Subresource Integrity (SRI) for CDN assets (Epic 7)
- Content Security Policy headers (Epic 7 PWA)
- HTTPS enforcement (deployment concern, not app code)

### Reliability/Availability

**Availability Target:** 100% local availability (offline-first architecture)

**Reliability Measures:**

| Component | Failure Mode | Mitigation | Owner Story |
|-----------|--------------|------------|-------------|
| **IndexedDB** | Browser quota exceeded | Graceful degradation: warn user, offer data export | Future (not Epic 1) |
| **IndexedDB** | Corrupted database | Dexie auto-repair, manual reset option | Story 1.4: Dexie handles internally |
| **LocalStorage** | Disabled by user | Fallback to in-memory storage, warn on page load | Story 1.4: Detect and fallback |
| **React Components** | Unhandled errors | ErrorBoundary catches crashes, shows fallback UI with retry | Story 1.7 |
| **Network** | Offline state | App fully functional offline (local-first) | Architecture guarantee |
| **Browser Compatibility** | Older browsers lack IndexedDB | Detect and show upgrade message | Future (Readiness Report HIGH-003) |

**Data Persistence Guarantees** (Story 1.4):

```typescript
// src/services/storage/db.ts
export async function ensureDBHealth(): Promise<boolean> {
  try {
    // Test write
    await db.telemetry_logs.add({
      timestamp: new Date().toISOString(),
      event: 'health_check',
      module: 'system',
      data: {},
      userId: 'local_user'
    });

    // Test read
    const count = await db.telemetry_logs.count();

    return count > 0;
  } catch (error) {
    console.error('DB health check failed:', error);
    return false;
  }
}
```

**Recovery Mechanisms:**

1. **React Error Boundary** (Story 1.7):
   - Catches component crashes
   - Displays friendly error message
   - Provides "Retry" button to reset boundary
   - Logs error to telemetry for debugging

2. **Dexie Error Handling** (Story 1.4):
   - `db.on('error', handler)` catches database errors
   - Dexie auto-repairs corrupted databases
   - Schema migrations tracked with version numbers

3. **Context State Recovery** (Story 1.5):
   - UserSettingsContext loads from LocalStorage on mount
   - Invalid data falls back to defaults
   - Corrupt JSON handled gracefully

**Telemetry Survival** (PRD NFR: "Telemetry queues survive browser restarts"):
- IndexedDB persists through browser restarts (OS-level persistence)
- Dexie transactions ensure atomic writes (no partial data)
- Epic 7 adds background sync for eventual upload (deferred)

**Testing Reliability** (Story 1.6):
- ErrorBoundary test: Throw error from child, verify fallback renders
- Dexie test: Write 1000 records, close browser, reopen, verify all present
- LocalStorage test: Write settings, manually clear, verify fallback to defaults

### Observability

**Logging Strategy:**

| Log Level | Use Case | Implementation | Storage |
|-----------|----------|----------------|---------|
| **ERROR** | Component crashes, database errors, unexpected failures | ErrorBoundary, try/catch blocks | Dexie telemetry_logs table |
| **INFO** | Session start/end, drill completion, assessment completion | Explicit telemetry calls | Dexie telemetry_logs table |
| **DEBUG** | Development-only context state changes, query execution | console.debug (stripped in production) | Browser console only |

**Telemetry Events Defined** (Story 1.4, used by Epics 2+):

```typescript
// src/services/telemetry/events.ts
export const TELEMETRY_EVENTS = {
  // Session lifecycle
  SESSION_STARTED: 'session_started',
  SESSION_ENDED: 'session_ended',
  SESSION_PAUSED: 'session_paused',

  // User actions
  DRILL_COMPLETED: 'drill_completed',
  ASSESSMENT_COMPLETED: 'assessment_completed',
  MAGIC_MINUTE_STARTED: 'magic_minute_started',

  // System events
  APP_LOADED: 'app_loaded',
  ERROR_OCCURRED: 'error_occurred',
  SETTINGS_CHANGED: 'settings_changed',

  // Research Mode (Epic 8)
  EXPERIMENT_ASSIGNED: 'experiment_assigned',
  VARIANT_OBSERVED: 'variant_observed'
} as const;

export async function logTelemetry(
  event: keyof typeof TELEMETRY_EVENTS,
  module: string,
  data: Record<string, any>
): Promise<void> {
  await db.telemetry_logs.add({
    timestamp: new Date().toISOString(),
    event,
    module,
    data,
    userId: 'local_user'
  });
}
```

**Metrics Captured** (for future analysis in Epic 5 Progress Tracking):

| Metric | Capture Point | Purpose |
|--------|---------------|---------|
| **Session Duration** | SessionContext END_SESSION | Track engagement, identify optimal session length |
| **Drill Accuracy** | DrillResult table | Measure learning progress |
| **Confidence Delta** | Pre/post session prompts | Validate therapeutic efficacy (PRD success criteria) |
| **Streak Count** | AppContext, updated daily | Gamification effectiveness |
| **Difficulty Adjustments** | difficulty_history table | Adaptive difficulty transparency |
| **Module Usage** | telemetry_logs count by module | Identify most/least used features |

**Query Performance Monitoring** (Story 1.4):

```typescript
// src/services/storage/db.ts
export async function queryWithTiming<T>(
  queryFn: () => Promise<T>,
  queryName: string
): Promise<T> {
  const start = performance.now();
  const result = await queryFn();
  const duration = performance.now() - start;

  if (duration > 100) {
    console.warn(`Slow query: ${queryName} took ${duration}ms`);
  }

  return result;
}
```

**Development Tools:**

| Tool | Purpose | Availability |
|------|---------|--------------|
| **React DevTools** | Inspect component tree, context values | Browser extension |
| **Dexie DevTools** | Inspect IndexedDB tables, run queries | Browser DevTools → Application tab |
| **Vitest UI** | Interactive test runner, coverage visualization | `npm run test:ui` |
| **Playwright Traces** | E2E test recordings with network/DOM snapshots | `test-results/` directory |

**Error Tracking** (Story 1.7 ErrorBoundary):

```typescript
// src/shared/components/ErrorBoundary.tsx
componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
  // Log to telemetry
  logTelemetry('error_occurred', 'system', {
    error: error.message,
    stack: error.stack,
    componentStack: errorInfo.componentStack
  });

  // Log to console (development)
  console.error('ErrorBoundary caught:', error, errorInfo);
}
```

**Coverage Reports** (Story 1.6):
- HTML report: `coverage/index.html` (visualize uncovered lines)
- lcov format: `coverage/lcov.info` (CI/CD integration)
- Console output: Summary of coverage percentages

**CI/CD Observability** (Story 1.8):
- GitHub Actions logs show all test output
- Coverage reports uploaded as artifacts
- Build time metrics tracked
- Failure notifications via GitHub PR checks

## Dependencies and Integrations

**Production Dependencies** (from architecture.md, verified 2025-11-09):

| Package | Version | Purpose | Owner Story |
|---------|---------|---------|-------------|
| **react** | 19.2 | UI library, component rendering | Story 1.1 |
| **react-dom** | 19.2 | React DOM rendering | Story 1.1 |
| **react-router-dom** | 7.9.5 | Client-side routing | Story 1.1 |
| **dexie** | 4.2.1 | IndexedDB wrapper with TypeScript support | Story 1.4 |
| **dexie-react-hooks** | 7.0.1 | React hooks for live queries | Story 1.4 |
| **recharts** | 3.3.0 | Data visualization (radar charts, line charts) | Story 1.1 (used in Epic 5) |
| **framer-motion** | 12.23.24 | Animation library for UI transitions | Story 1.1 (used in Epic 2+) |
| **react-hook-form** | 7.66.0 | Form state management, validation | Story 1.1 (used in Epic 2) |
| **date-fns** | 4.0 | Date manipulation utilities | Story 1.1 (used in Epic 3+) |
| **clsx** | latest | Conditional className utility | Story 1.2 |
| **tailwind-merge** | latest | Merge Tailwind classes (shadcn/ui dependency) | Story 1.2 |
| **class-variance-authority** | latest | Type-safe variant API for components | Story 1.2 |

**Development Dependencies:**

| Package | Version | Purpose | Owner Story |
|---------|---------|---------|-------------|
| **vite** | 7.2 | Build tool, dev server, HMR | Story 1.1 |
| **typescript** | 5.9 | Type checking, compile-time safety | Story 1.1 |
| **@vitejs/plugin-react** | latest | React Fast Refresh, JSX transform | Story 1.1 |
| **vitest** | latest | Unit/integration test runner | Story 1.6 |
| **@testing-library/react** | latest | React component testing utilities | Story 1.6 |
| **@testing-library/jest-dom** | latest | Custom jest matchers for DOM | Story 1.6 |
| **@testing-library/user-event** | latest | Simulate user interactions | Story 1.6 |
| **playwright** | latest | E2E testing framework | Story 1.6 |
| **@playwright/test** | latest | Playwright test runner | Story 1.6 |
| **tailwindcss** | ^4.0.0 | Utility-first CSS framework | Story 1.2 |
| **postcss** | latest | CSS transformations | Story 1.2 |
| **autoprefixer** | latest | CSS vendor prefixing | Story 1.2 |
| **eslint** | latest | Code linting, style enforcement | Story 1.1 |
| **@typescript-eslint/parser** | latest | TypeScript ESLint parser | Story 1.1 |
| **@typescript-eslint/eslint-plugin** | latest | TypeScript ESLint rules | Story 1.1 |
| **eslint-plugin-react-hooks** | latest | React Hooks linting rules | Story 1.1 |
| **@vitest/ui** | latest | Interactive test UI | Story 1.6 |
| **@vitest/coverage-v8** | latest | Code coverage provider | Story 1.6 |

**shadcn/ui Components** (installed via CLI in Story 1.2):
- Button
- Card
- Sheet (mobile drawer)
- Toast (notifications)
- Progress (bars, radial)
- Form (React Hook Form integration)
- Input, Label, Select (form controls)
- Tabs (navigation)
- Badge (status indicators)

**Integration Points** (all local, no external services):

| Integration | Type | Direction | Implementation |
|-------------|------|-----------|----------------|
| **IndexedDB** | Browser API | Bidirectional | Dexie ORM wraps IndexedDB, no external network calls |
| **LocalStorage** | Browser API | Bidirectional | Direct browser API for settings/streak persistence |
| **React Router** | Internal | Component → Router | Client-side routing, no server interaction |
| **Framer Motion** | Internal | Component → Animation library | CSS/JS animations, no external dependencies |
| **Recharts** | Internal | Data → SVG charts | Pure client-side rendering |

**No External Integrations:**
- No backend API (local-first architecture)
- No authentication service (userId always "local_user")
- No CDN dependencies (all assets bundled)
- No analytics service (telemetry stored locally)
- No crash reporting (ErrorBoundary logs to IndexedDB)

**Version Constraints:**
- Node.js: >=20.x (for Vite 7 compatibility)
- Browser targets: Chrome 90+, Firefox 88+, Safari 14+ (defined in vite.config.ts)
- TypeScript: strict mode enabled (all stories must pass `tsc --noEmit`)

**Dependency Update Policy** (enforced in Story 1.8 CI):
- Major updates: Manual review required
- Minor updates: Allowed if tests pass
- Patch updates: Auto-applied weekly via Dependabot
- Security updates: Immediate application required

## Acceptance Criteria (Authoritative)

**Epic-Level Acceptance Criteria** (from epics.md):

1. **AC-1.1: Project Initialization**
   - Vite project initialized with React 19.2, TypeScript 5.9, and all core dependencies specified in architecture.md
   - `npm run dev` starts dev server on port 5173
   - `npm run build` creates optimized production build
   - TypeScript compilation passes with strict mode enabled

2. **AC-1.2: Folder Structure Compliance**
   - Feature-based folder structure matches architecture.md exactly
   - All required directories exist: features/, shared/, services/, context/, routes/
   - Public API exports defined for each feature via index.ts files

3. **AC-1.3: Database Operational**
   - Dexie database with schema v1 operational with all 8 tables
   - TypeScript interfaces defined for all table schemas
   - LocalStorage service wraps all STORAGE_KEYS constants
   - IndexedDB accessible via browser DevTools for manual inspection

4. **AC-1.4: Context Providers Working**
   - React Context providers operational: AppContext, SessionContext, UserSettingsContext
   - All providers use useReducer pattern with TypeScript-typed actions
   - Custom hooks exported: useApp(), useSession(), useUserSettings()
   - UserSettingsContext persists to localStorage on every change

5. **AC-1.5: Testing Infrastructure Complete**
   - Vitest configured with 100% coverage threshold enforcement
   - React Testing Library configured with custom render wrapper
   - Playwright configured for E2E tests (Chromium, Firefox, WebKit)
   - Mobile viewport tests (375×667) pass
   - Coverage report generated in HTML and lcov formats

6. **AC-1.6: CI Pipeline Active**
   - GitHub Actions workflow (`.github/workflows/ci.yml`) triggers on push/PR
   - Pipeline runs: lint → type-check → unit tests → E2E tests → build
   - Build fails if coverage < 100%
   - Playwright browsers install correctly in CI environment

7. **AC-1.7: Shared Components Implemented**
   - BottomNav component: 4 tabs, active highlighting, keyboard accessible, WCAG 2.1 AA compliant
   - StreakCounter component: Displays streak from AppContext, Framer Motion tap animation
   - LoadingSpinner component: 3 size variants, ARIA labels, accessible
   - ErrorBoundary component: Catches React errors, shows fallback UI, logs to telemetry

8. **AC-1.8: Design System Configured**
   - Tailwind CSS v4 configured with Balanced Warmth color palette
   - shadcn/ui initialized with base components (button, card, sheet, toast, progress, form)
   - Responsive breakpoints work: mobile (320px), tablet (768px), desktop (1024px)
   - Mobile-first classes render correctly

9. **AC-1.9: Coverage Enforcement**
   - 100% code coverage threshold enforced for: statements, branches, functions, lines
   - All tests pass with AAA pattern (Arrange, Act, Assert)
   - Co-located test files (*.test.tsx) exist for every component
   - CI blocks merges if coverage threshold not met

10. **AC-1.10: TypeScript Strict Mode**
    - All files compile with TypeScript strict mode enabled
    - No `any` types in production code (only in test mocks if necessary)
    - Path aliases (`@/*`) work correctly
    - `npx tsc --noEmit` passes with zero errors

**Story-Level Traceability:**

| Story | Key Deliverables | Verification Method |
|-------|------------------|---------------------|
| 1.1 | Vite project + dependencies | `npm run dev` succeeds, all packages installed |
| 1.2 | Tailwind + shadcn/ui | Coral primary color renders, responsive breakpoints work |
| 1.3 | Folder structure | All directories exist, index.ts files export placeholders |
| 1.4 | Dexie database | Write/read test passes, useLiveQuery() works |
| 1.5 | Context providers | Test component reads/dispatches to all contexts |
| 1.6 | Testing infrastructure | Coverage report shows 100%, E2E test passes |
| 1.7 | Shared components | All 4 components render, tests achieve 100% coverage |
| 1.8 | CI/CD pipeline | GitHub Actions workflow runs successfully on push |

## Traceability Mapping

**Mapping: Acceptance Criteria → Spec Sections → Components → Test Strategy**

| AC ID | Spec Section(s) | Component(s) / API(s) | Test Idea |
|-------|-----------------|----------------------|-----------|
| **AC-1.1** | Dependencies, Services (Vite Project) | `vite.config.ts`, `package.json`, `tsconfig.json` | **Unit:** Verify package.json contains all required dependencies with correct versions. **E2E:** Run `npm run dev` and verify server starts on port 5173. |
| **AC-1.2** | Services (Folder Structure), Architecture Alignment | All feature folders, `src/routes/`, `src/context/` | **Integration:** Verify all directories exist via `fs.existsSync()`. Check each index.ts exports placeholder. |
| **AC-1.3** | Data Models, Services (Dexie Database) | `src/services/storage/db.ts`, `schemas.ts`, `localStorage.ts` | **Unit:** Write record to `sessions` table, read it back, verify structure. **Integration:** Test `useLiveQuery()` reacts to DB changes. |
| **AC-1.4** | Services (React Context), Data Models (Context State) | `AppContext.tsx`, `SessionContext.tsx`, `UserSettingsContext.tsx` | **Unit:** Dispatch actions to each context, verify state updates. **Integration:** Verify UserSettingsContext persists to localStorage. |
| **AC-1.5** | NFRs (Observability), Services (Testing Infrastructure) | `vitest.config.ts`, `playwright.config.ts`, `tests/test-utils.tsx` | **Meta:** Run test suite, verify coverage report generated. Verify Playwright can launch browsers. |
| **AC-1.6** | Services (CI/CD Pipeline), NFRs (Reliability) | `.github/workflows/ci.yml` | **E2E:** Trigger CI on push, verify all steps pass. Verify build fails if coverage < 100%. |
| **AC-1.7** | Services (Shared Components), APIs (Component Props) | `BottomNav.tsx`, `StreakCounter.tsx`, `LoadingSpinner.tsx`, `ErrorBoundary.tsx` | **Unit:** Each component renders correctly, accepts props, handles events. **Accessibility:** Test keyboard navigation, ARIA labels. |
| **AC-1.8** | Services (Tailwind + shadcn/ui), NFRs (Accessibility) | `tailwind.config.js`, `globals.css`, shadcn/ui components | **Unit:** Render component with `bg-primary`, verify CSS color matches #E87461. **Responsive:** Test breakpoints at 320px, 768px, 1024px. |
| **AC-1.9** | NFRs (Observability), Test Strategy | All `*.test.tsx` files, `vitest.config.ts` coverage thresholds | **Meta:** Run `npm run test`, verify exit code 1 if coverage < 100%. |
| **AC-1.10** | Services (Vite Project), NFRs (Security) | `tsconfig.json`, all TypeScript files | **Meta:** Run `npx tsc --noEmit`, verify zero errors. Use ESLint to flag any `any` types. |

**Upstream Traceability (to PRD/Architecture):**

| Epic 1 AC | PRD Requirement | Architecture Decision |
|-----------|-----------------|----------------------|
| AC-1.1 | FR1 (Modular Codebase), FR6 (Testing Harness) | ADR-001 (Tech Stack: Vite, React, TypeScript) |
| AC-1.2 | FR1 (Modular Codebase) | ADR-004 (Project Organization: Feature-based folders) |
| AC-1.3 | FR2 (Local-First Storage) | ADR-003 (Data Persistence: Dexie + LocalStorage) |
| AC-1.4 | FR1 (Modular Codebase) | ADR-002 (State Management: React Context) |
| AC-1.5, AC-1.9 | FR6 (Testing Harness: 100% coverage) | ADR-005 (Testing Strategy: Vitest + RTL + Playwright) |
| AC-1.6 | FR6 (Testing Harness: CI enforcement) | ADR-005 (CI/CD: GitHub Actions) |
| AC-1.7, AC-1.8 | FR5 (Mobile-First UX) | ADR-006 (Accessibility: WCAG 2.1 AA, Tailwind utilities) |
| AC-1.10 | FR1 (Modular Codebase: Type safety) | ADR-001 (TypeScript strict mode) |

**Downstream Traceability (to Future Epics):**

| Epic 1 Deliverable | Consumed By Epic(s) | Purpose |
|--------------------|---------------------|---------|
| Dexie schema v1 | Epics 2-8 | All features persist data to IndexedDB |
| Context providers | Epics 2-3, 5 | Assessment, Training, Progress modules read/write state |
| Shared components | Epics 2-7 | BottomNav used everywhere, LoadingSpinner for async ops |
| Testing infrastructure | Epics 2-8 | All stories must achieve 100% coverage |
| CI/CD pipeline | Epics 2-8 | Quality gates enforce test coverage on every commit |
| Tailwind + shadcn/ui | Epics 2-7 | All UI features use design system |
| Folder structure | Epics 2-8 | AI agents know where to place code for each feature |

## Risks, Assumptions, Open Questions

### Risks

| Risk ID | Description | Likelihood | Impact | Mitigation Strategy | Owner Story |
|---------|-------------|------------|--------|---------------------|-------------|
| **R-1.1** | **RISK:** Vite 7.2 and React 19.2 are cutting-edge versions; documentation may be sparse or APIs may change. | Medium | Medium | Pin exact versions in package.json. Monitor official release notes. Allocate extra time for troubleshooting. | Story 1.1 |
| **R-1.2** | **RISK:** 100% coverage threshold is very aggressive and may slow development velocity. | High | Low | Allow exemptions for trivial code (e.g., constants files). Use `/* istanbul ignore */` sparingly with justification. | Story 1.6 |
| **R-1.3** | **RISK:** IndexedDB quota limits (~50-100 MB depending on browser) could be exceeded if user generates excessive telemetry. | Low | Medium | Implement telemetry pruning (delete logs older than 90 days). Warn user if quota nearing limit. | Story 1.4 (deferred to Epic 5) |
| **R-1.4** | **RISK:** Playwright E2E tests may be flaky in CI environment due to timing issues or browser version mismatches. | Medium | Medium | Use `waitFor` helpers consistently. Enable trace on first retry. Pin Playwright version. | Story 1.6, 1.8 |
| **R-1.5** | **RISK:** Tailwind CSS v4 is in beta (as of 2025-11-09); breaking changes may occur before stable release. | Medium | Low | Monitor Tailwind v4 changelog. Consider fallback to v3 if blockers emerge. Pin version in package.json. | Story 1.2 |
| **R-1.6** | **RISK:** shadcn/ui components may need customization beyond defaults, increasing complexity. | Low | Low | Leverage shadcn/ui as starting point, not strict library. Components are copied into project (not imported), allowing full customization. | Story 1.2 |
| **R-1.7** | **RISK:** GitHub Actions CI minutes quota may be exceeded if tests run on every push (free tier: 2,000 min/month). | Low | Low | Optimize test execution speed. Cache dependencies. Consider skipping E2E tests on draft PRs. | Story 1.8 |
| **R-1.8** | **RISK:** TypeScript strict mode may cause issues with third-party libraries lacking type definitions. | Low | Medium | Use `@types/*` packages where available. Create custom `.d.ts` files for libraries lacking types. Use `skipLibCheck: true` as last resort. | Story 1.1 |

### Assumptions

| Assumption ID | Description | Validation Method | Impact if Invalid |
|---------------|-------------|-------------------|-------------------|
| **A-1.1** | **ASSUMPTION:** All target browsers support IndexedDB and LocalStorage (Chrome 90+, Firefox 88+, Safari 14+). | Test on minimum browser versions manually. Use caniuse.com. | **High:** App unusable without IndexedDB. Must implement browser compatibility check and graceful degradation. |
| **A-1.2** | **ASSUMPTION:** Users will not disable JavaScript (PWA requires JS to function). | No validation needed (industry standard). | **Critical:** App is non-functional without JS. Document as requirement. |
| **A-1.3** | **ASSUMPTION:** Node.js 20.x is available in all development and CI environments. | Verify in `.github/workflows/ci.yml` and document in README.md. | **Medium:** Switch to Node 18.x LTS if compatibility issues arise. |
| **A-1.4** | **ASSUMPTION:** React Context will provide sufficient performance for global state (no need for Redux). | Monitor performance in Epic 2-3 implementations. Profile with React DevTools. | **Low:** If performance issues emerge, migrate to Zustand (lighter than Redux). |
| **A-1.5** | **ASSUMPTION:** 100% test coverage is achievable without excessive mocking or trivial tests. | Review coverage reports in Stories 1.7 and 1.8. | **Medium:** If coverage enforcement blocks progress, reduce threshold to 95% with documented exemptions. |
| **A-1.6** | **ASSUMPTION:** GitHub Actions is sufficient for CI/CD (no need for Jenkins, CircleCI, etc.). | Monitor CI performance and reliability through Epic 1. | **Low:** GitHub Actions has proven reliability for open-source projects. |
| **A-1.7** | **ASSUMPTION:** Vite's default code splitting will meet bundle size targets (<150 KB initial). | Verify in Story 1.8 build step. Use bundle analyzer. | **Medium:** Implement manual chunk splitting or lazy loading if targets missed. |
| **A-1.8** | **ASSUMPTION:** ErrorBoundary will catch most React errors (no need for global error handler yet). | Test by intentionally throwing errors in components. | **Low:** If uncaught errors occur, add `window.onerror` global handler in Epic 7. |

### Open Questions

| Question ID | Description | Target Resolution | Blocker For |
|-------------|-------------|-------------------|-------------|
| **Q-1.1** | Should we implement Storybook for component visual regression testing, or defer to later epic? | Story 1.7 decision point | Not a blocker; deferred to future epic per current spec |
| **Q-1.2** | What is the strategy for pruning old telemetry data (age-based vs. size-based vs. manual)? | Epic 5 (Progress Tracking) when data export is implemented | Not a blocker for Epic 1 |
| **Q-1.3** | Should dark mode be implemented in Epic 1 or deferred to later epic? | Story 1.2 decision point | **DECISION:** Prepare CSS variables in Epic 1, implement toggle in Epic 6 (Coach module) |
| **Q-1.4** | How should we handle browser compatibility warnings (polyfills vs. hard block vs. soft warning)? | Story 1.8 or Epic 7 (PWA) | Not a blocker; document minimum browser versions in README |
| **Q-1.5** | Should we use Dependabot or Renovate for automated dependency updates? | Story 1.8 decision point | **DECISION:** Use GitHub Dependabot (native integration, simpler setup) |
| **Q-1.6** | What is the maximum acceptable IndexedDB database size before warning user? | Epic 5 (Progress Tracking) when data export is implemented | Not a blocker for Epic 1 |
| **Q-1.7** | Should we implement service worker in Epic 1 for early testing, or defer to Epic 7? | Epic 1 scope decision | **DECISION:** Defer to Epic 7 (PWA & Offline Infrastructure) per current epic breakdown |
| **Q-1.8** | How should we handle TypeScript errors in third-party libraries (skipLibCheck vs. custom .d.ts files)? | Story 1.1 implementation | Resolve case-by-case; prefer `@types/*` packages, use skipLibCheck only if no alternative |

**Resolution Summary:**
- **Q-1.3 RESOLVED:** Dark mode CSS variables prepared in Epic 1, implementation deferred to Epic 6
- **Q-1.5 RESOLVED:** GitHub Dependabot selected for dependency updates
- **Q-1.7 RESOLVED:** Service worker deferred to Epic 7 per PRD epic sequencing

## Test Strategy Summary

### Testing Philosophy

Epic 1 establishes a **test-first, coverage-enforced** culture where every line of code must be covered by automated tests. This ensures that the foundation is rock-solid before feature development begins in Epics 2-8.

**Core Principles:**
1. **100% Coverage Mandatory** - No exceptions without documented justification
2. **AAA Pattern** - Arrange, Act, Assert for readability
3. **Co-Located Tests** - `Component.test.tsx` next to `Component.tsx`
4. **Test Pyramid** - Many unit tests, fewer integration tests, minimal E2E tests
5. **Accessibility First** - Test with screen reader queries (`getByRole`, `getByLabelText`)

### Test Levels and Coverage

| Test Level | Framework | Target Coverage | Execution Speed | Owner Stories |
|------------|-----------|-----------------|-----------------|---------------|
| **Unit Tests** | Vitest + React Testing Library | 80-90% of total tests | <10 seconds | Stories 1.4, 1.5, 1.7 |
| **Integration Tests** | Vitest + React Testing Library | 10-15% of total tests | <30 seconds | Stories 1.5, 1.6 |
| **E2E Tests** | Playwright | 5-10% of total tests (critical paths only) | <60 seconds | Story 1.6, 1.8 |
| **Accessibility Tests** | RTL + jest-axe (future) | All components | Included in unit tests | Story 1.7 |

### Test Coverage Targets by Component Type

| Component Type | Unit Test Coverage | Integration Test Coverage | E2E Test Coverage |
|----------------|-------------------|---------------------------|-------------------|
| **React Components** | 100% (render, props, events, conditional rendering) | Context integration | Critical user flows only |
| **React Context** | 100% (all actions, state transitions) | Provider wrapping order | N/A |
| **Dexie Services** | 100% (CRUD operations, queries, error handling) | Multi-table transactions | N/A |
| **LocalStorage Services** | 100% (get, set, fallbacks, validation) | Persistence across reloads | N/A |
| **Utility Functions** | 100% (all branches, edge cases) | N/A | N/A |
| **Configuration Files** | Static analysis (TypeScript, ESLint) | Build process verification | Full build in CI |

### Test Execution Strategy

**Local Development:**
```bash
# Run tests in watch mode (developer workflow)
npm run test

# Run tests with UI (interactive debugging)
npm run test:ui

# Run E2E tests (manual before commit)
npm run test:e2e

# Generate coverage report
npm run test:coverage
```

**CI/CD Pipeline (Story 1.8):**
```yaml
# .github/workflows/ci.yml sequence
1. Lint (ESLint) - Fast fail on style issues
2. Type Check (tsc --noEmit) - Fast fail on type errors
3. Unit + Integration Tests (Vitest) - 100% coverage enforced
4. E2E Tests (Playwright) - Critical paths only
5. Build (Vite) - Verify production bundle
```

### Test Patterns and Examples

**Unit Test Pattern (Story 1.7 - StreakCounter):**
```typescript
// src/shared/components/StreakCounter.test.tsx
describe('StreakCounter', () => {
  it('displays streak number with flame emoji', () => {
    // Arrange
    const streak = 7;

    // Act
    render(<StreakCounter streak={streak} />);

    // Assert
    expect(screen.getByText('🔥')).toBeInTheDocument();
    expect(screen.getByText('7')).toBeInTheDocument();
    expect(screen.getByText('Days')).toBeInTheDocument();
  });

  it('shows singular "Day" when streak is 1', () => {
    render(<StreakCounter streak={1} />);
    expect(screen.getByText('Day')).toBeInTheDocument();
  });

  it('animates on tap', async () => {
    const onTap = vi.fn();
    render(<StreakCounter streak={5} onTap={onTap} />);

    await userEvent.click(screen.getByRole('button'));
    expect(onTap).toHaveBeenCalledTimes(1);
  });
});
```

**Integration Test Pattern (Story 1.5 - Context):**
```typescript
// src/context/AppContext.test.tsx
describe('AppContext', () => {
  it('updates streak and persists to localStorage', () => {
    // Arrange
    const TestComponent = () => {
      const { state, setStreak } = useApp();
      return (
        <div>
          <span data-testid="streak">{state.streak}</span>
          <button onClick={() => setStreak(10)}>Set Streak</button>
        </div>
      );
    };

    // Act
    render(<AppContextProvider><TestComponent /></AppContextProvider>);
    fireEvent.click(screen.getByText('Set Streak'));

    // Assert
    expect(screen.getByTestId('streak')).toHaveTextContent('10');
    expect(localStorage.getItem('discalculas:streak')).toBe('10');
  });
});
```

**E2E Test Pattern (Story 1.6 - Navigation):**
```typescript
// tests/e2e/navigation.spec.ts
test('bottom navigation works across all routes', async ({ page }) => {
  // Arrange
  await page.goto('http://localhost:5173');

  // Act & Assert - Home
  await expect(page.locator('nav')).toBeVisible();
  await expect(page.locator('[aria-current="page"]')).toContainText('Home');

  // Act & Assert - Training
  await page.click('text=Training');
  await expect(page).toHaveURL(/.*training/);
  await expect(page.locator('[aria-current="page"]')).toContainText('Training');

  // Act & Assert - Progress
  await page.click('text=Progress');
  await expect(page).toHaveURL(/.*progress/);
});
```

### Accessibility Testing Strategy

**Keyboard Navigation Tests (Story 1.7 - BottomNav):**
- Tab through all navigation items
- Verify focus indicators visible
- Enter/Space activates navigation
- Focus trap within modals/sheets

**Screen Reader Tests (Story 1.7 - All Components):**
- All interactive elements have ARIA labels
- Images have alt text
- Form inputs have associated labels
- Error messages announced to screen readers

**Visual Accessibility Tests (Story 1.2 - Design System):**
- Color contrast meets WCAG 2.1 AA (4.5:1 for text)
- Touch targets minimum 44×44px (mobile)
- Text resizable up to 200% without breaking layout
- Focus indicators visible for keyboard users

### Coverage Enforcement

**Vitest Configuration (Story 1.6):**
```typescript
// vite.config.ts
export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      thresholds: {
        statements: 100,
        branches: 100,
        functions: 100,
        lines: 100
      },
      exclude: [
        'tests/**',
        '**/*.test.tsx',
        '**/*.config.ts',
        '**/index.ts' // Re-export files
      ]
    }
  }
});
```

**CI Enforcement (Story 1.8):**
- Build fails if any coverage threshold < 100%
- Coverage report uploaded as GitHub artifact
- PR comments show coverage diff
- Merge blocked until all tests pass

### Edge Cases and Error Conditions

**Database Error Handling (Story 1.4):**
- Test IndexedDB quota exceeded
- Test corrupted database recovery
- Test concurrent write conflicts

**Network/Offline Scenarios (Deferred to Epic 7):**
- Epic 1 is local-only (no network calls)
- Network error handling tested in Epic 7 (PWA)

**Browser Compatibility (Story 1.8):**
- Test on minimum supported browser versions
- Verify graceful degradation if IndexedDB unavailable

### Test Maintenance Strategy

1. **Review Coverage Weekly** - Identify uncovered edge cases
2. **Refactor Flaky Tests** - If test fails intermittently, fix immediately
3. **Update Tests with Code Changes** - Never skip test updates
4. **Remove Obsolete Tests** - Delete tests for removed features
5. **Document Complex Test Scenarios** - Add comments for non-obvious assertions

### Success Criteria for Epic 1 Testing

- ✅ All unit tests pass with 100% coverage
- ✅ All integration tests pass
- ✅ All E2E tests pass on CI (Chromium, Firefox, WebKit)
- ✅ Coverage report shows zero uncovered lines
- ✅ CI pipeline runs in <5 minutes (stretch goal: <3 minutes)
- ✅ All components meet WCAG 2.1 AA accessibility standards
- ✅ TypeScript compilation has zero errors
- ✅ ESLint shows zero warnings
