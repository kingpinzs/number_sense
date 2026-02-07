# Discalculas - Architecture Specification

**Author:** Jeremy
**Date:** 2025-11-09
**Version:** 1.0

---

## Executive Summary

Discalculas is a mobile-first Progressive Web App (PWA) for dyscalculia self-therapy, built as a Single Page Application using Vite + React 19 + TypeScript. The architecture prioritizes **offline-first operation**, **local-only data privacy**, **100% test coverage**, and **adaptive difficulty** across 5 core flows: Assessment, Training, Coach, Cognition, and Progress.

This architecture specification defines all technical decisions, patterns, and consistency rules to ensure multiple AI agents implement features cohesively without conflicts.

**Key Architectural Principles:**
- **Local-First Privacy:** All data stored on device (IndexedDB + LocalStorage), no external services
- **Offline-First PWA:** Service worker caching, background sync, installable on mobile
- **Feature-Based Organization:** Code organized by user flows (Assessment, Training, etc.)
- **100% Test Coverage:** Unit, component, integration, and E2E tests required for all code
- **Accessibility First:** WCAG 2.1 Level AA compliance mandatory
- **Performance Targets:** <2s load time, <100ms input latency, 60fps interactions

---

## Project Initialization

**First Implementation Story: Initialize Project with Vite Starter**

```bash
# Initialize Vite project
npm create vite@latest discalculas -- --template react-ts

# Install dependencies
cd discalculas
npm install

# Add core dependencies (versions verified 2025-11-09)
npm install vite-plugin-pwa@1.1.0 \
  dexie@4.2.1 \
  dexie-react-hooks@4.2.0 \
  react-router@7.9.5 \
  recharts@3.3.0 \
  framer-motion@12.23.24 \
  react-hook-form@7.66.0 \
  date-fns@4.0.0

# Add Tailwind CSS v4 + shadcn/ui
npm install -D tailwindcss@latest postcss@latest autoprefixer@latest
npx tailwindcss init -p
npx shadcn@latest init

# Add testing frameworks
npm install -D vitest@4.0.0 \
  @testing-library/react@16.3.0 \
  @testing-library/dom \
  @playwright/test@1.56.1

# Configure project
# - Set up vite.config.ts with PWA plugin
# - Configure tsconfig.json with @/ path alias
# - Set up tailwind.config.js with UX spec colors
# - Initialize shadcn/ui components
```

**This starter provides:**
- ✓ Vite 7.2 - Fast build tooling
- ✓ React 19.2 - Latest UI framework
- ✓ TypeScript 5.9 - Type safety
- ✓ Hot Module Replacement - Instant feedback during development
- ✓ Optimized production builds - Code splitting, tree shaking

---

## Decision Summary

| Category | Decision | Version | Affects Epics | Rationale |
| -------- | -------- | ------- | ------------- | --------- |
| **Build Tool** | Vite | 7.2 | All | Fast dev server, optimized builds, Vitest integration |
| **UI Framework** | React | 19.2 | All | Modern hooks, concurrent features, industry standard |
| **Language** | TypeScript | 5.9 | All | Type safety, better IDE support, catches bugs early |
| **PWA Infrastructure** | vite-plugin-pwa | 1.1.0 | All | Zero-config service worker, offline caching, install prompts |
| **Data Storage (Heavy)** | Dexie.js | 4.2.1 | All | IndexedDB wrapper for sessions, telemetry, assessments |
| **Data Storage (Light)** | LocalStorage | Built-in | All | Streaks, settings, quick access data |
| **State Management** | React Context + useReducer | Built-in React 19.2 | All | Sufficient complexity, no extra dependencies |
| **Code Organization** | Feature-Based | N/A | All | Matches 5 PRD flows, self-contained modules |
| **Unit/Integration Tests** | Vitest | 4.0 | All | Vite-native, fast, browser mode, visual regression |
| **Component Tests** | React Testing Library | 16.3.0 | All | User-centric testing, accessibility focus |
| **E2E Tests** | Playwright | 1.56.1 | All | Cross-browser, trace support, reliable |
| **Chart Library** | Recharts | 3.3.0 | Progress | Radar chart for Confidence x Time visualization |
| **Animation Library** | Framer Motion | 12.23.24 | Training, Progress | Confetti, timers, toasts, reduced-motion support |
| **Form Handling** | React Hook Form | 7.66.0 | Assessment, Training | Minimal re-renders, validation, TypeScript support |
| **Routing** | React Router | 7.9.5 | All | Deep linking, bottom nav, browser history, PWA-compatible |
| **Date Utilities** | date-fns | 4.0 | All | Lightweight, tree-shakable, timezone support |
| **Design System** | shadcn/ui + Tailwind CSS v4 | Latest | All | Mobile-first, customizable, accessible, lightweight |

---

## Technology Stack Details

### Core Technologies

**Frontend Stack:**
- **Vite 7.2** - Build tool with instant HMR, optimized production builds
- **React 19.2** - UI framework with hooks, concurrent rendering
- **TypeScript 5.9** - Type-safe JavaScript with IDE support

**PWA Layer:**
- **vite-plugin-pwa 1.1.0** - Service worker generation, offline caching, install prompts

**Data Persistence:**
- **Dexie.js 4.2.1** - IndexedDB wrapper for structured data (sessions, telemetry)
- **LocalStorage** - Simple key-value storage (streak, settings)

**State Management:**
- **React Context API** - Global state (AppContext, SessionContext, UserSettingsContext)

**Routing:**
- **React Router v7.9.5** - Client-side routing with deep linking support

**UI & Styling:**
- **shadcn/ui** - Component library (Button, Card, Sheet, Toast, Progress, Form)
- **Tailwind CSS v4** - Utility-first CSS with custom theme

**Charts & Visualizations:**
- **Recharts 3.3.0** - React chart library for Confidence Radar

**Animations:**
- **Framer Motion 12.23.24** - Animation library with reduced-motion support

**Forms:**
- **React Hook Form 7.66.0** - Form state management with validation

**Date Handling:**
- **date-fns 4.0** - Date utility library with timezone support

**Testing:**
- **Vitest 4.0** - Unit & integration tests with browser mode
- **React Testing Library 16.3.0** - Component tests with accessibility focus
- **Playwright 1.56.1** - E2E tests with cross-browser support

---

## Project Structure

```
discalculas/
├── public/                           # Static assets
│   ├── icons/                        # PWA icons
│   └── manifest.json                 # PWA manifest
│
├── src/
│   ├── features/                     # Feature modules
│   │   ├── assessment/               # Assessment wizard
│   │   ├── training/                 # Training drills
│   │   ├── coach/                    # Guidance system
│   │   ├── cognition/                # Mini-games
│   │   ├── progress/                 # Stats & charts
│   │   └── magic-minute/             # 60s sprints
│   │
│   ├── shared/                       # Reusable code
│   │   ├── components/               # Shared UI
│   │   ├── hooks/                    # Reusable hooks
│   │   ├── utils/                    # Helper functions
│   │   └── types/                    # Shared types
│   │
│   ├── services/                     # Business logic
│   │   ├── storage/                  # Dexie + LocalStorage
│   │   ├── telemetry/                # Logging
│   │   ├── pwa/                      # Service worker
│   │   ├── adaptiveDifficulty/       # Difficulty engine
│   │   └── research/                 # Research mode
│   │
│   ├── context/                      # React Context
│   │   ├── AppContext.tsx
│   │   ├── SessionContext.tsx
│   │   └── UserSettingsContext.tsx
│   │
│   ├── routes/                       # Route components
│   │   ├── Home.tsx
│   │   ├── AssessmentRoute.tsx
│   │   ├── TrainingRoute.tsx
│   │   ├── ProgressRoute.tsx
│   │   └── ProfileRoute.tsx
│   │
│   ├── App.tsx
│   ├── main.tsx
│   ├── router.tsx
│   └── styles/
│
├── tests/                            # E2E tests
│   └── e2e/
│
├── index.html
├── vite.config.ts
├── tsconfig.json
├── tailwind.config.js
├── playwright.config.ts
└── package.json
```

---

## Epic to Architecture Mapping

| Epic | Components | Storage | Key Patterns |
|------|-----------|---------|--------------|
| **Assessment** | `features/assessment/`, `routes/AssessmentRoute.tsx` | `assessments` table (Dexie) | Multi-step wizard, React Hook Form |
| **Training** | `features/training/`, `routes/TrainingRoute.tsx` | `sessions`, `drill_results` (Dexie) | Adaptive difficulty, Magic Minute |
| **Coach** | `features/coach/` | Static content + telemetry | Contextual help drawer |
| **Cognition** | `features/cognition/` | `cognition_scores` (Dexie) | Mini-games, scoring |
| **Progress** | `features/progress/`, `routes/ProgressRoute.tsx` | Queries all tables | Radar chart, insights |
| **Magic Minute** | `features/magic-minute/` | `magic_minute_sessions` (Dexie) | Mistake analysis, timer |
| **Research Mode** | `services/research/` | `experiments` (Dexie) | A/B testing, baseline comparison |

---

## Novel Pattern Designs

### Pattern 1: Magic Minute Sprint

**Purpose:** 60-second micro-challenge targeting today's mistakes

**Architecture:**
```
MagicMinuteTimer
├── Countdown Timer (Framer Motion circular progress)
├── MicroChallenge (Dynamic drill)
└── CompletionCelebration
```

**Data Flow:**
1. Training session completes → analyze mistakes
2. Generate 1-3 micro-drills (one level easier)
3. 60-second countdown starts
4. Log results, show celebration
5. Return to Home

**Storage:**
```typescript
interface MagicMinuteSession {
  id: string;
  sessionId: string;
  timestamp: string;
  targetedMistakes: string[];
  challenges: MicroChallenge[];
  results: MicroChallengeResult[];
  correctionsCount: number;
}
```

---

### Pattern 2: Confidence x Time Radar

**Purpose:** 5-axis visualization of session impact

**5 Axes:**
- Duration (0-30 min)
- Confidence Delta (-5 to +5)
- Cognitive Load (1-5)
- Accuracy (0-100%)
- Anxiety Level (1-5, inverted)

**Implementation:**
- Recharts `<RadarChart>` component
- Normalize all values to 0-100 scale
- Current session (coral fill) + past sessions (gray overlays)
- Auto-generated insights

---

### Pattern 3: Adaptive Difficulty

**Purpose:** Transparent real-time difficulty adjustment

**Triggers:**
- **Decrease:** 2+ incorrect OR confidence ≤2 OR <40% accuracy
- **Increase:** 5+ correct AND confidence ≥4 AND >80% accuracy

**UI:** Toast with explanation + user override option

**Messages:**
- Decrease: "This is tough - let's build confidence 🌱"
- Increase: "You're crushing this! 💪"

---

### Pattern 4: Research Mode

**Purpose:** On-device A/B testing with baseline comparison

**Features:**
- Define experiments (drill variants, question order, timing)
- Collect metrics locally
- Compare to baseline research automatically
- Recommend: Adopt / Continue / Re-run research

**Privacy:** All local, anonymized, opt-in only

---

## Implementation Patterns

### Naming Conventions

**Files:**
- Components: `PascalCase.tsx` (e.g., `StreakCounter.tsx`)
- Hooks: `camelCase.ts` with `use` prefix (e.g., `useAdaptiveDifficulty.ts`)
- Services: `camelCase.ts` (e.g., `telemetry.ts`)
- Tests: Same + `.test.tsx`
- Types: `camelCase.types.ts`

**Variables:**
- Components: `PascalCase`
- Functions/variables: `camelCase`
- Constants: `SCREAMING_SNAKE_CASE`
- Interfaces: `PascalCase` (no `I` prefix)

**Database:**
- Tables: `snake_case`, plural
- Columns: `snake_case`

**Routes:** lowercase, hyphen-separated

---

### Data Formats

**Dates:** Always ISO 8601 strings in storage

**Telemetry:**
```typescript
{
  event: 'drill_completed',  // snake_case
  timestamp: '2025-11-09T14:30:00.000Z',
  module: 'number-line',
  data: { accuracy: 0.8, duration_ms: 45000 }
}
```

**Errors:**
```typescript
// User-facing
{ title: 'Storage Full', message: 'Please clear old sessions' }

// Technical
{ code: 'STORAGE_ERROR', message: '...', stack: '...' }
```

---

### Cross-Cutting Concerns

**Error Handling:**
- React Error Boundaries for component crashes
- Try-catch around Dexie operations
- Toast notifications for user errors
- Never show technical details to users

**Logging:**
- Structured telemetry in Dexie
- INFO: Sessions, user actions
- WARN: Recoverable errors
- ERROR: Crashes, data loss

**Date/Time:**
- Store as ISO 8601
- Display relative ("2 hours ago") or absolute ("Nov 8, 2025")
- Use date-fns for all formatting

**Testing:**
- Co-located test files
- AAA pattern (Arrange, Act, Assert)
- 100% coverage required

**E2E Testing Philosophy:**

End-to-end tests serve as the **final guarantee** that an entire epic flow works cohesively, not as the primary integration verification mechanism.

**Key Principles:**
1. **Incremental Verification:** Each story must verify its own integration points (routing, UI rendering, data flow) before being marked 'done'
2. **E2E as Safety Net:** E2E tests should pass on first run if all component stories properly verified their integrations
3. **Failure Signal:** If an E2E test fails, it indicates gaps in per-story integration verification, not a normal part of the development process
4. **Manual Verification Required:** All stories involving routing, UI, or integration must include manual browser testing (`npm run dev`) as part of Definition of Done

**Definition of Done (Integration Stories):**
- Component tests pass ✓
- Unit tests pass ✓
- **Feature works in running dev server (`npm run dev`)** ✓
- Route accessible (if applicable) ✓
- UI renders correctly (if applicable) ✓
- Data flow verified (if applicable) ✓
- Manual verification steps completed ✓

**E2E Test Structure:**
- Epic-level E2E tests validate complete user journey (e.g., "First-time user completes assessment")
- Should exercise all component integrations in sequence
- Must run fast (<30s per epic test)
- Cross-browser coverage (Chromium, Firefox, WebKit)

**Example Epic 2 Flow:**
- Story 2.1: ✓ `/assessment` route verified → Wizard renders
- Story 2.2: ✓ Number sense questions verified → Display correctly
- Story 2.3: ✓ Spatial questions verified → Work correctly
- Story 2.4: ✓ Operations questions verified → Work correctly
- Story 2.5: ✓ Scoring verified → Calculates correctly
- Story 2.6: ✓ Results verified → Display correctly
- Story 2.7 (E2E): ✓ **Full journey passes on first run** → All integrations confirmed

This philosophy ensures "done" means "works in the browser", not just "tests pass".

**Accessibility:**
- WCAG 2.1 AA mandatory
- ARIA labels on all interactive elements
- Keyboard navigation throughout
- Respect `prefers-reduced-motion`

**Performance:**
- Code splitting per route
- React.memo() for expensive components
- Debounce auto-save (500ms)
- Target: <2s load, <100ms latency, 60fps

---

## Data Architecture

### Dexie Schema

```typescript
class DiscalculasDB extends Dexie {
  sessions!: Table<Session>;
  assessments!: Table<Assessment>;
  drill_results!: Table<DrillResult>;
  telemetry_logs!: Table<TelemetryLog>;
  magic_minute_sessions!: Table<MagicMinuteSession>;
  difficulty_history!: Table<DifficultyHistoryEntry>;
  experiments!: Table<ExperimentRecord>;
  experiment_observations!: Table<ExperimentObservation>;

  constructor() {
    super('DiscalculasDB');
    this.version(1).stores({
      sessions: 'id, timestamp, module, [timestamp+module]',
      assessments: 'id, timestamp, status',
      drill_results: 'id, sessionId, timestamp, module',
      telemetry_logs: 'id, timestamp, event, [timestamp+event]',
      magic_minute_sessions: 'id, sessionId, timestamp',
      difficulty_history: 'id, sessionId, timestamp, module',
      experiments: 'id, status',
      experiment_observations: 'id, experimentId, variantId, timestamp'
    });
  }
}
```

### LocalStorage Keys

```typescript
const STORAGE_KEYS = {
  STREAK: 'discalculas:streak',
  LAST_SESSION_DATE: 'discalculas:lastSessionDate',
  USER_SETTINGS: 'discalculas:settings',
  LAST_USED_MODULE: 'discalculas:lastModule',
  RESEARCH_MODE_ENABLED: 'discalculas:researchMode'
};
```

---

## Security & Privacy

**Local-Only Storage:**
- All data in browser (IndexedDB + LocalStorage)
- No external databases or cloud sync
- No tracking or analytics services
- User can export/delete all data

**Telemetry:**
- No PII collected
- User ID always `"local_user"`
- No session recording or fingerprinting

**Research Mode:**
- Opt-in only
- Anonymized exports
- No external submission

---

## Performance

**Bundle Size:**
- Initial: <150 KB (gzipped)
- Route chunks: <50 KB each
- Service worker cache: <500 KB total

**Optimization:**
- Code splitting per route
- Tree shaking (import only what you use)
- React.memo() for charts
- Indexed Dexie queries
- Batch operations

**Metrics:**
- Initial load: <2s
- Input latency: <100ms
- Interactions: 60fps

---

## Deployment

**Build:**
```bash
npm run build
```

**Hosting:** Static (Netlify, Vercel, GitHub Pages)
- No server needed
- Automatic HTTPS
- CDN distribution

**vite.config.ts:**
```typescript
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Discalculas',
        short_name: 'Discalculas',
        theme_color: '#E87461',
        display: 'standalone'
      }
    })
  ],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') }
  }
});
```

---

## Development Environment

**Prerequisites:**
- Node.js 20.19+ or 22.12+
- npm 10+
- Git

**Commands:**
```bash
npm run dev      # Development server
npm run test     # Vitest tests
npm run test:e2e # Playwright E2E
npm run build    # Production build
npm run preview  # Preview build
```

---

## Architecture Decision Records

**ADR-001: Vite over CRA**
- Vite is 10-20x faster, actively maintained, better TypeScript support

**ADR-002: React Context over Redux**
- Built-in, sufficient complexity, beginner-friendly

**ADR-003: Hybrid Storage**
- IndexedDB for complex queries, LocalStorage for fast access

**ADR-004: Feature-Based Organization**
- Matches PRD flows, self-contained, easy to test

**ADR-005: 100% Coverage Mandatory**
- PRD requirement, safety nets for refactoring

**ADR-006: WCAG 2.1 AA Non-Negotiable**
- Target users need cognitive accessibility

---

## Next Steps

**Phase 1: Foundation**
1. Initialize Vite project
2. Set up Dexie + Context
3. Configure Tailwind + shadcn/ui
4. Create shared components

**Phase 2: Assessment Flow**
1. Build wizard
2. Wire up storage
3. Write tests

**Phase 3: Training Flow**
1. Build drills
2. Implement adaptive difficulty
3. Add Magic Minute

**Phase 4: Progress**
1. Implement radar chart
2. Build dashboard
3. Add insights

**Phase 5: PWA & Polish**
1. Configure service worker
2. Optimize performance
3. Accessibility audit

---

## References

- [PRD.md](./PRD.md)
- [UX Design Spec](./ux-design-specification.md)
- [Domain Research](./research-domain-2025-11-08.md)

---

_Architecture v1.0 - Generated with BMad Method on 2025-11-09_

_This document is the consistency contract for all AI agents implementing Discalculas._
