# Discalculas - Epic Breakdown

**Author:** Jeremy
**Date:** 2025-11-09
**Project Level:** 3
**Target Scale:** Single-user PWA with future community expansion

---

## Overview

This document provides the complete epic and story breakdown for Discalculas, decomposing the requirements from the [PRD](./PRD.md) into implementable stories.

### Epic Summary

**8 Epics Delivering Complete PWA:**

1. **Foundation & Core Refactor** - Modern tech stack, modular architecture, testing infrastructure
2. **Assessment & Onboarding Flow** - Discover weaknesses, personalized training plan
3. **Training & Drill Engine** - Daily practice sessions with multiple drill types
4. **Adaptive Intelligence** - Magic Minute sprints + adaptive difficulty engine
5. **Progress Tracking & Insights** - Confidence Radar, history, streaks, motivation
6. **Coach & Cognition Modules** - Guidance system + brain booster mini-games
7. **PWA & Offline Infrastructure** - Service worker, offline-first, installable
8. **Research Mode & Experimentation** - On-device A/B testing framework

**Sequencing:**
- Epic 1 establishes foundation (required first)
- Epics 2-3 deliver core value (Assessment → Training)
- Epic 4 adds adaptive intelligence
- Epics 5-6 add progress tracking and supporting features
- Epic 7 makes it production-ready (PWA)
- Epic 8 enables continuous improvement (Research Mode)

---

## Epic 1: Foundation & Core Refactor

**Goal:** Establish modern tech stack (Vite + React 19 + TypeScript) and break the 1,600-line monolithic `scripts/main.js` into modular, testable architecture. This epic creates the foundation that enables all subsequent development with confidence through automated testing and clear code organization.

**Business Value:** Transforms unmaintainable prototype into production-ready codebase that supports 100% test coverage requirement and enables safe iteration.

**Acceptance Criteria for Epic:**
- Vite project initialized with React 19, TypeScript 5.9, and all core dependencies
- Feature-based folder structure matches architecture spec
- Dexie database with schema v1 operational
- React Context providers working (AppContext, SessionContext, UserSettingsContext)
- Testing harness complete (Vitest, RTL, Playwright configured)
- CI pipeline runs tests on every commit
- 100% coverage threshold enforced

---

### Story 1.1: Initialize Vite Project with Core Dependencies

**As a** developer,
**I want** a modern Vite + React + TypeScript project initialized with all core dependencies,
**So that** I have a fast, type-safe development environment ready for feature implementation.

**Acceptance Criteria:**

**Given** I am starting a new development phase for Discalculas
**When** I run the project initialization commands from architecture.md
**Then** the following are successfully installed and configured:
- Vite 7.2 with React 19.2 and TypeScript 5.9
- vite-plugin-pwa 1.1.0 for PWA capabilities
- Dexie 4.2.1 and dexie-react-hooks 4.2.0 for storage
- React Router 7.9.5 for routing
- Recharts 3.3.0 for charts
- Framer Motion 12.23.24 for animations
- React Hook Form 7.66.0 for forms
- date-fns 4.0 for date handling
- Tailwind CSS v4 + postcss + autoprefixer
- Vitest 4.0, @testing-library/react 16.3.0, @testing-library/dom, Playwright 1.56.1

**And** `npm run dev` starts the development server successfully on port 5173
**And** `npm run build` creates optimized production build in `dist/` folder
**And** TypeScript compilation shows no errors

**Prerequisites:** None (first story)

**Technical Notes:**
- Follow exact commands from [architecture.md](./architecture.md#project-initialization)
- Use `npm create vite@latest discalculas -- --template react-ts`
- Verify all package versions match architecture spec (verified 2025-11-09)
- Configure `vite.config.ts` with `@/` path alias: `alias: { '@': path.resolve(__dirname, './src') }`
- Set up `tsconfig.json` with strict mode and path mappings
- Initialize git repository if not already present

---

### Story 1.2: Configure Tailwind CSS and shadcn/ui Design System

**As a** developer,
**I want** Tailwind CSS v4 and shadcn/ui configured with the Balanced Warmth color theme,
**So that** I can build mobile-first, accessible UI components matching the UX specification.

**Acceptance Criteria:**

**Given** the Vite project is initialized (Story 1.1 complete)
**When** I configure Tailwind and shadcn/ui
**Then** the following are successfully set up:
- Tailwind CSS v4 installed and PostCSS configured
- `tailwind.config.js` includes Balanced Warmth color palette:
  - Primary: `#E87461` (coral)
  - Secondary: `#A8E6CF` (mint)
  - Accent: `#FFD56F` (yellow)
  - Success: `#66BB6A`
  - Warning: `#FFB74D`
  - Error: `#EF5350`
- Responsive breakpoints configured: mobile (320px), tablet (768px), desktop (1024px)
- shadcn/ui initialized with `npx shadcn@latest init`
- Base components installed: button, card, sheet, toast, progress, form

**And** `src/styles/globals.css` includes Tailwind directives and custom theme variables
**And** A test component using `className="bg-primary text-white"` renders with coral background
**And** Dark mode setup prepared (CSS variables defined, implementation deferred)

**Prerequisites:** Story 1.1 (Vite project initialized)

**Technical Notes:**
- Follow [ux-design-specification.md](./ux-design-specification.md) color palette section
- Configure Tailwind with 8px spacing scale (`spacing: { 1: '8px', 2: '16px', ... }`)
- Set up Inter font family as primary typography
- shadcn/ui components should use `@/components/ui/` path
- Verify mobile-first responsive classes work (`sm:`, `md:`, `lg:` breakpoints)

---

### Story 1.3: Create Feature-Based Folder Structure

**As a** developer,
**I want** the complete feature-based folder structure from the architecture spec,
**So that** I know exactly where to place code for each epic and AI agents have clear boundaries.

**Acceptance Criteria:**

**Given** the project has Tailwind configured (Story 1.2 complete)
**When** I create the folder structure
**Then** the following directories exist with index placeholder files:
- `src/features/assessment/` (components/, hooks/, types/, index.ts)
- `src/features/training/` (components/, drills/, hooks/, types/, index.ts)
- `src/features/coach/` (components/, hooks/, content/, index.ts)
- `src/features/cognition/` (components/, games/, index.ts)
- `src/features/progress/` (components/, hooks/, types/, index.ts)
- `src/features/magic-minute/` (components/, hooks/, index.ts)
- `src/shared/` (components/, components/ui/, hooks/, utils/, types/)
- `src/services/` (storage/, telemetry/, pwa/, adaptiveDifficulty/, research/)
- `src/context/` (AppContext.tsx, SessionContext.tsx, UserSettingsContext.tsx)
- `src/routes/` (Home.tsx, AssessmentRoute.tsx, TrainingRoute.tsx, ProgressRoute.tsx, ProfileRoute.tsx)
- `tests/e2e/` and `tests/fixtures/`

**And** Each `index.ts` exports a placeholder comment: `// Public API for [feature-name]`
**And** `src/shared/utils/constants.ts` includes BREAKPOINTS constant from architecture
**And** All folder names match architecture.md exactly (PascalCase for components, camelCase for services)

**Prerequisites:** Story 1.2 (Tailwind configured)

**Technical Notes:**
- Follow [architecture.md](./architecture.md#project-structure) exactly
- Create empty `.gitkeep` files in empty directories for git tracking
- Add README.md in each feature folder explaining its purpose
- Verify import paths work: `import { Button } from '@/shared/components/ui/button'`

---

### Story 1.4: Implement Dexie Database Layer with Schema v1

**As a** developer,
**I want** Dexie.js configured with schema v1 for all tables,
**So that** I can persist sessions, telemetry, and user data locally with type-safe queries.

**Acceptance Criteria:**

**Given** the folder structure is in place (Story 1.3 complete)
**When** I implement the Dexie database layer
**Then** `src/services/storage/db.ts` exports a DiscalculasDB class with these tables:
- `sessions` (id, timestamp, module, [timestamp+module])
- `assessments` (id, timestamp, status)
- `drill_results` (id, sessionId, timestamp, module)
- `telemetry_logs` (id, timestamp, event, [timestamp+event])
- `magic_minute_sessions` (id, sessionId, timestamp)
- `difficulty_history` (id, sessionId, timestamp, module)
- `experiments` (id, status)
- `experiment_observations` (id, experimentId, variantId, timestamp)

**And** TypeScript interfaces defined in `src/services/storage/schemas.ts` for each table
**And** `src/services/storage/localStorage.ts` exports wrappers for STORAGE_KEYS:
  - `STREAK`, `LAST_SESSION_DATE`, `USER_SETTINGS`, `LAST_USED_MODULE`, `RESEARCH_MODE_ENABLED`
**And** A simple test successfully writes to and reads from `sessions` table
**And** `useLiveQuery()` from dexie-react-hooks works in a test React component

**Prerequisites:** Story 1.3 (Folder structure created)

**Technical Notes:**
- Follow [architecture.md](./architecture.md#dexie-schema) schema definition exactly
- Indexed queries on `timestamp`, `module`, compound index `[timestamp+module]`
- Schema versioning: `this.version(1).stores({ ... })`
- Export singleton: `export const db = new DiscalculasDB();`
- Prepare `migrations.ts` file for future schema changes (empty for v1)
- Test IndexedDB access in browser DevTools (Application tab)

---

### Story 1.5: Set Up React Context Providers for State Management

**As a** developer,
**I want** React Context providers (AppContext, SessionContext, UserSettingsContext),
**So that** global state is managed consistently across all components without prop drilling.

**Acceptance Criteria:**

**Given** the Dexie database is operational (Story 1.4 complete)
**When** I implement the Context providers
**Then** the following context providers are created:

**AppContext** (`src/context/AppContext.tsx`):
- State: `streak: number`, `onlineStatus: boolean`, `lastSyncTimestamp: string | null`
- Actions: `SET_STREAK`, `UPDATE_ONLINE_STATUS`, `SET_LAST_SYNC`
- useReducer pattern with AppReducer

**SessionContext** (`src/context/SessionContext.tsx`):
- State: `currentModule: string | null`, `sessionId: string | null`, `sessionStatus: SessionStatus`, `startTime: string | null`
- Actions: `START_SESSION`, `END_SESSION`, `PAUSE_SESSION`, `RESUME_SESSION`

**UserSettingsContext** (`src/context/UserSettingsContext.tsx`):
- State: `reducedMotion: boolean`, `soundEnabled: boolean`, `dailyGoalMinutes: number`, `researchModeEnabled: boolean`
- Actions: `UPDATE_SETTINGS`
- Persists to localStorage on every change

**And** `src/App.tsx` wraps the app with all three providers in correct order
**And** A test component successfully reads and dispatches to each context
**And** TypeScript types are fully defined for all state and actions

**Prerequisites:** Story 1.4 (Dexie database operational)

**Technical Notes:**
- Follow reducer pattern from [architecture.md](./architecture.md#communication-patterns)
- Context order: UserSettingsContext → AppContext → SessionContext → Router
- Export custom hooks: `useApp()`, `useSession()`, `useUserSettings()`
- UserSettingsContext loads from localStorage on mount
- Prepare for future WebSocket/sync in AppContext (commented placeholders)

---

### Story 1.6: Configure Testing Infrastructure (Vitest + RTL + Playwright)

**As a** developer,
**I want** complete testing infrastructure with 100% coverage enforcement,
**So that** every feature I build has automated tests preventing regressions.

**Acceptance Criteria:**

**Given** Context providers are set up (Story 1.5 complete)
**When** I configure the testing infrastructure
**Then** the following are operational:

**Vitest Configuration:**
- `vite.config.ts` includes Vitest setup with coverage provider (c8/v8)
- Coverage thresholds enforced: 100% (statements, branches, functions, lines)
- Browser mode disabled initially (can enable later for visual regression)
- Test command: `npm run test` runs all unit/integration tests
- UI mode: `npm run test:ui` launches Vitest UI

**React Testing Library:**
- `@testing-library/react@16.3.0` and `@testing-library/dom` installed
- Custom render function in `tests/test-utils.tsx` wraps components with providers
- Example test: `src/shared/components/StreakCounter.test.tsx` (create placeholder component first)
- Screen reader queries work: `getByRole`, `getByLabelText`, `getByText`

**Playwright E2E:**
- `playwright.config.ts` configured for Chromium, Firefox, WebKit
- Mobile viewport: 375×667 (iPhone SE)
- Base URL: `http://localhost:5173`
- Test command: `npm run test:e2e` runs E2E tests
- Trace on first retry enabled for debugging

**And** CI script runs: `npm run test && npm run test:e2e && npm run build`
**And** Coverage report generated in `coverage/` directory (HTML + lcov)
**And** Example test passes for all three frameworks

**Prerequisites:** Story 1.5 (Context providers set up)

**Technical Notes:**
- Follow [architecture.md](./architecture.md#testing) testing patterns
- Co-locate test files: `Component.test.tsx` next to `Component.tsx`
- AAA pattern mandatory: Arrange, Act, Assert
- Mock Dexie in tests using `dexie-export-import` for fixtures
- Playwright traces stored in `test-results/` (gitignored)

---

### Story 1.7: Create Shared Component Foundation

**As a** developer,
**I want** foundational shared components (BottomNav, StreakCounter, LoadingSpinner, ErrorBoundary),
**So that** all features can reuse consistent UI patterns and error handling.

**Acceptance Criteria:**

**Given** testing infrastructure is configured (Story 1.6 complete)
**When** I create the shared component foundation
**Then** the following components exist with tests:

**BottomNav** (`src/shared/components/BottomNav.tsx`):
- Four tabs: Home, Training, Progress, Profile (icons + labels)
- Active state highlighting (coral primary color)
- Mobile-optimized tap targets (44px minimum)
- Keyboard accessible (Tab navigation, Enter to select)
- ARIA roles: `navigation`, `button`, `aria-current="page"` for active
- Test: Renders 4 tabs, highlights active, navigates on click

**StreakCounter** (`src/shared/components/StreakCounter.tsx`):
- Displays current streak from AppContext
- Flame emoji (🔥) + number + "Days" text
- Tap animation (Framer Motion scale)
- Test: Shows streak number, animates on tap, handles 1 day singular

**LoadingSpinner** (`src/shared/components/LoadingSpinner.tsx`):
- Circular spinner using Tailwind animate-spin
- Accessible: `role="status"`, `aria-live="polite"`, screen reader text "Loading..."
- Size variants: small (24px), medium (40px), large (60px)
- Test: Renders with correct ARIA, accepts size prop

**ErrorBoundary** (`src/shared/components/ErrorBoundary.tsx`):
- React error boundary catching component crashes
- Fallback UI with friendly message + "Retry" button
- Logs error to telemetry service (stub for now)
- Test: Catches thrown error, shows fallback, retry resets boundary

**And** All components have 100% test coverage
**And** All components use Tailwind classes (no inline styles)
**And** Storybook placeholder prepared (optional, deferred to later epic)

**Prerequisites:** Story 1.6 (Testing infrastructure configured)

**Technical Notes:**
- BottomNav uses React Router's `useLocation()` and `useNavigate()`
- StreakCounter reads from `useApp()` context hook
- ErrorBoundary follows React 18+ pattern with `componentDidCatch`
- LoadingSpinner should respect `prefers-reduced-motion` (Tailwind handles this)
- All tests use custom render from `tests/test-utils.tsx`

---

### Story 1.8: Set Up CI/CD Pipeline with GitHub Actions

**As a** developer,
**I want** automated CI/CD pipeline running tests and builds on every commit,
**So that** code quality is enforced and broken builds are caught immediately.

**Acceptance Criteria:**

**Given** shared components are complete with tests (Story 1.7 complete)
**When** I set up the CI/CD pipeline
**Then** a GitHub Actions workflow file exists at `.github/workflows/ci.yml` with:
- Trigger: On push to `main` branch and all pull requests
- Node.js version: 20.x (matrix can include 22.x)
- Steps:
  1. Checkout code
  2. Install dependencies (`npm ci`)
  3. Run linter (`npm run lint`)
  4. Run type check (`npx tsc --noEmit`)
  5. Run unit/integration tests (`npm run test`)
  6. Run E2E tests (`npm run test:e2e`)
  7. Build production bundle (`npm run build`)
  8. Upload coverage report to artifact storage

**And** Coverage threshold enforced: Build fails if coverage < 100%
**And** Playwright installs browsers in CI environment
**And** Build artifacts cached to speed up subsequent runs
**And** Workflow badge added to README.md showing build status

**Prerequisites:** Story 1.7 (Shared components complete)

**Technical Notes:**
- Use `actions/checkout@v4`, `actions/setup-node@v4`, `actions/cache@v4`
- Playwright: `npx playwright install --with-deps chromium`
- Coverage report: Upload `coverage/` as GitHub artifact
- Consider adding Codecov integration later for coverage visualization
- Set up branch protection rules requiring CI to pass before merge

---

## Epic 2: Assessment & Onboarding Flow

**Goal:** Create initial 10-question assessment wizard that identifies user's math and spatial weaknesses, generates personalized training plan weights, and provides actionable results visualization. This is the entry point for new users and the foundation for adaptive training.

**Business Value:** Enables personalized training by discovering specific weakness areas, creating immediate user engagement and demonstrating app intelligence.

**Acceptance Criteria for Epic:**
- 10-question assessment wizard works on mobile (320px+)
- Three assessment domains covered: Number Sense, Spatial Awareness, Operations
- Scoring algorithm identifies weak areas accurately
- Results summary shows strengths and weaknesses with visual indicators
- Training plan weights generated based on results
- Assessment data persists to Dexie `assessments` table
- Full E2E test covers first-time user journey

---

### Story 2.1: Build Assessment Wizard Shell with Multi-Step Form

**As a** first-time user,
**I want** a guided assessment wizard that clearly shows my progress through questions,
**So that** I understand how far along I am and can complete it confidently.

**Acceptance Criteria:**

**Given** I am a new user who hasn't taken the assessment (Story 1.8 complete - foundation ready)
**When** I navigate to `/assessment` route
**Then** the AssessmentWizard component renders with:
- Step indicator showing "Question X of 10" at the top
- Progress bar (0-100%) showing completion
- Large, touch-friendly question area (minimum 44px tap targets)
- "Previous" and "Next" buttons (Previous disabled on Q1, Next enabled after answer)
- "Exit" button in top-right that confirms before abandoning

**And** Wizard state managed by React Hook Form:
- `currentStep` (1-10)
- `answers` array (stores answer for each question)
- `startTime` timestamp for duration tracking
- Form validation requires answer before advancing

**And** Wizard uses shadcn/ui Sheet component (full-screen modal on mobile)
**And** ARIA landmarks: `role="dialog"`, `aria-labelledby="assessment-title"`, focus trap active
**And** Keyboard navigation: Enter advances, Escape shows exit confirmation

**Prerequisites:** Epic 1 complete (foundation ready)

**Technical Notes:**
- Location: `src/features/assessment/components/AssessmentWizard.tsx`
- Use React Hook Form `useForm()` with controlled steps
- Progress bar: `<Progress value={(currentStep / 10) * 100} />`
- Store wizard state in SessionContext during assessment
- Mobile-first: Stack layout, large fonts (18px minimum)

---

### Story 2.2: Implement Number Sense Question Types

**As a** user taking the assessment,
**I want** number sense questions that test my understanding of quantities and comparisons,
**So that** the app can identify if I struggle with basic number comprehension.

**Acceptance Criteria:**

**Given** the assessment wizard shell is operational (Story 2.1 complete)
**When** I encounter number sense questions (Questions 1-4)
**Then** the following question types render correctly:

**Quantity Comparison** (Q1-Q2):
- Shows two groups of dots (5-20 dots each)
- Asks: "Which group has more dots?"
- Answer options: "Left" | "Right" | "Same"
- Records: `isCorrect`, `timeToAnswer` (milliseconds)

**Number Line Estimation** (Q3-Q4):
- Shows number line (0-100 or 0-1000 range)
- Asks: "Where is [target number] on this line?"
- User taps/clicks position on line
- Tolerance: ±10% considered correct
- Records: `userAnswer` (position), `correctAnswer`, `error` (absolute difference), `timeToAnswer`

**And** All questions rendered in `QuestionCard` component with consistent styling
**And** Visual feedback: Correct answers show subtle green checkmark (don't reveal during assessment)
**And** Questions randomize: Dot patterns and target numbers vary per session

**Prerequisites:** Story 2.1 (Assessment wizard shell)

**Technical Notes:**
- Location: `src/features/assessment/components/QuantityComparison.tsx`, `NumberLineEstimation.tsx`
- Dot rendering: SVG circles with random non-overlapping positions
- Number line: Horizontal div with click handler calculating percentage position
- Store question configs in `src/features/assessment/content/questions.ts`
- Performance: Record timestamps using `performance.now()`

---

### Story 2.3: Implement Spatial Awareness Question Types

**As a** user taking the assessment,
**I want** spatial questions that test my mental rotation and pattern recognition,
**So that** the app can identify if I struggle with spatial reasoning.

**Acceptance Criteria:**

**Given** number sense questions are implemented (Story 2.2 complete)
**When** I encounter spatial awareness questions (Questions 5-7)
**Then** the following question types render correctly:

**Mental Rotation** (Q5-Q6):
- Shows two 2D shapes (one rotated 90°, 180°, or 270°)
- Asks: "Are these the same shape?"
- Answer options: "Yes" | "No"
- Difficulty: Asymmetric shapes (L-shapes, irregular polygons)
- Records: `isCorrect`, `timeToAnswer`

**Pattern Matching** (Q7):
- Shows 3×3 grid with pattern (checkerboard, diagonal, etc.)
- Shows 4 options, one matches the pattern
- Asks: "Which grid matches this pattern?"
- Answer options: Four small grids (A, B, C, D)
- Records: `isCorrect`, `selectedOption`, `timeToAnswer`

**And** SVG-based rendering for crisp shapes on all screen sizes
**And** Touch targets: Minimum 60px for option buttons on mobile
**And** Shapes randomized per session (different combinations each time)

**Prerequisites:** Story 2.2 (Number sense questions implemented)

**Technical Notes:**
- Location: `src/features/assessment/components/MentalRotation.tsx`, `PatternMatching.tsx`
- SVG shapes: Use `<path>` elements for complex shapes, apply CSS `transform: rotate()`
- Pattern grids: 3×3 flexbox with colored cells
- Question configs: Define shapes and patterns in `questions.ts`
- Accessibility: Include text descriptions for screen readers

---

### Story 2.4: Implement Operations Question Types

**As a** user taking the assessment,
**I want** math operations questions that test my calculation abilities,
**So that** the app can identify if I struggle with addition, subtraction, or multiplication.

**Acceptance Criteria:**

**Given** spatial awareness questions are implemented (Story 2.3 complete)
**When** I encounter operations questions (Questions 8-10)
**Then** the following question types render correctly:

**Basic Operations** (Q8-Q9):
- Shows simple arithmetic problem: "12 + 7 = ?"
- Answer input: Number keypad (0-9, backspace, submit)
- Operations: Mix of addition and subtraction (single-digit and double-digit)
- Records: `userAnswer`, `correctAnswer`, `isCorrect`, `timeToAnswer`

**Word Problem** (Q10):
- Shows dyscalculia-friendly word problem (simple context, clear numbers)
- Example: "You have 8 apples. You give away 3. How many do you have now?"
- Answer input: Number keypad
- Records: `userAnswer`, `correctAnswer`, `isCorrect`, `timeToAnswer`

**And** Number keypad rendered using `setupCompactAndNumpad` pattern from existing codebase
**And** Input validation: Non-negative integers only, max 4 digits
**And** Visual: Large, clear numbers (24px font minimum) for readability
**And** Questions randomized: Numbers vary per session (avoid memorization)

**Prerequisites:** Story 2.3 (Spatial awareness questions implemented)

**Technical Notes:**
- Location: `src/features/assessment/components/BasicOperations.tsx`, `WordProblem.tsx`
- Number keypad: Reusable component in `src/shared/components/NumberKeypad.tsx`
- Question generation: Randomize numbers within difficulty ranges (e.g., 1-20 for addition)
- Word problems: Template strings with variable substitution
- Accessibility: Label inputs with question text, announce validation errors

---

### Story 2.5: Implement Scoring Algorithm and Weakness Identification

**As a** user who completed the assessment,
**I want** my results analyzed to identify specific weak areas,
**So that** I receive personalized training recommendations.

**Acceptance Criteria:**

**Given** all 10 questions are implemented (Story 2.4 complete)
**When** I submit the final assessment answer
**Then** the scoring algorithm (`src/services/assessment/scoring.ts`) executes:

**Accuracy Scoring per Domain:**
- Number Sense Score: (Q1-Q4 correct / 4) × 5 = 0-5 scale
- Spatial Awareness Score: (Q5-Q7 correct / 3) × 5 = 0-5 scale
- Operations Score: (Q8-Q10 correct / 3) × 5 = 0-5 scale

**Weakness Identification:**
- Score ≤ 2.5 = Weak area (needs priority training)
- Score 2.6-3.5 = Moderate (needs some focus)
- Score > 3.5 = Strength (occasional practice)

**Training Plan Weight Generation:**
- Weak areas get 2x weight
- Moderate areas get 1x weight
- Strengths get 0.5x weight
- Normalize weights to sum to 1.0

**And** Assessment record saved to Dexie `assessments` table with all fields
**And** Training plan weights stored in SessionContext for use by Training epic

**Prerequisites:** Story 2.4 (Operations questions implemented)

**Technical Notes:**
- Location: `src/services/assessment/scoring.ts`
- Pure functions: `calculateDomainScore()`, `identifyWeaknesses()`, `generateWeights()`
- Weight normalization: Ensure sum exactly equals 1.0 (avoid floating point errors)
- Persist weights to Dexie `plan` field in assessment record
- Unit tests: 100% coverage required (test all edge cases)

---

### Story 2.6: Build Results Summary Visualization

**As a** user who completed the assessment,
**I want** a clear visual summary of my strengths and weaknesses,
**So that** I understand what areas need focus and feel motivated to start training.

**Acceptance Criteria:**

**Given** the scoring algorithm is implemented (Story 2.5 complete)
**When** I complete the final assessment question
**Then** the ResultsSummary component renders:

**Header:**
- Title: "Your Number Sense Profile"
- Subtitle: "Here's what we discovered about your strengths"
- Completion time: "Completed in 5 minutes, 47 seconds"

**Domain Cards (3 cards):**
Each card shows:
- Domain name (Number Sense, Spatial Awareness, Operations)
- Score visualization: Horizontal bar (0-5 scale, filled to score level)
- Color coding:
  - Weak (≤2.5): Coral (#E87461) background, "Needs Focus" label
  - Moderate (2.6-3.5): Yellow (#FFD56F) background, "Growing" label
  - Strong (>3.5): Mint (#A8E6CF) background, "Strength" label
- Icon: 🎯 (weak), 🌱 (moderate), ✨ (strong)

**Action Button:**
- "Start Training" CTA (primary coral button)
- Navigates to `/training` with plan weights pre-loaded
- Button includes arrow icon →

**And** Results stored in Dexie before showing summary (guards against navigation away)
**And** Celebration animation: Confetti burst (Framer Motion) on summary render
**And** Share button (optional): "Export Results" → Downloads PDF/PNG (deferred to later)

**Prerequisites:** Story 2.5 (Scoring algorithm implemented)

**Technical Notes:**
- Location: `src/features/assessment/components/ResultsSummary.tsx`
- Use shadcn/ui Card components for domain cards
- Bar visualization: `<Progress>` component with custom colors
- Confetti: Framer Motion `motion.div` with particle animation
- Accessibility: Screen reader announces each domain score
- Navigation: Use React Router `useNavigate()` hook

---

### Story 2.7: E2E Test - First-Time User Assessment Journey

**As a** developer,
**I want** comprehensive E2E test covering the full assessment flow,
**So that** I can confidently deploy knowing the onboarding experience works end-to-end.

**Acceptance Criteria:**

**Given** all assessment stories are complete (Story 2.6 done)
**When** I run the E2E test suite
**Then** a Playwright test exists (`tests/e2e/assessment-flow.spec.ts`) that:

**Test Steps:**
1. Navigate to `/assessment`
2. Verify wizard renders with "Question 1 of 10"
3. Answer all 10 questions (using test data for consistent results)
4. Verify progress bar reaches 100%
5. Verify "Next" button changes to "Finish" on Q10
6. Click "Finish"
7. Wait for ResultsSummary to render
8. Verify all 3 domain cards present
9. Verify scores displayed correctly (based on test answers)
10. Verify "Start Training" button present
11. Click "Start Training"
12. Verify navigation to `/training`

**And** Test runs in mobile viewport (375×667)
**And** Test takes screenshots at: Q1, Q5, Q10, Results
**And** Test verifies IndexedDB contains assessment record
**And** Test completes in <30 seconds
**And** Test passes on Chromium, Firefox, WebKit

**Prerequisites:** Story 2.6 (Results summary visualization complete)

**Technical Notes:**
- Use Playwright's `page.locator()` with accessible selectors (`getByRole`, `getByLabel`)
- Mock `performance.now()` for consistent timing in tests
- Clear IndexedDB before test: `await page.evaluate(() => indexedDB.deleteDatabase('DiscalculasDB'))`
- Screenshot storage: `test-results/assessment-flow/`
- Run test in CI pipeline (already configured in Epic 1)

---

## Epic 3: Training & Drill Engine

**Goal:** Enable daily practice sessions with three core drill types (Number Line, Spatial Rotation, Math Operations) that use personalized training plan weights from assessment. This is the core value proposition - the daily training experience that builds math confidence through targeted, bite-sized practice.

**Business Value:** Delivers the main user value - daily practice that actually works because it focuses on user's specific weak areas. Sessions are short (5-15 minutes), mobile-first, and designed for consistency over intensity.

**Acceptance Criteria for Epic:**
- Training session shell manages drill selection based on plan weights
- Three drill types functional: Number Line, Spatial Rotation, Math Operations
- Each drill records accuracy, speed, and confidence data
- Confidence prompts before and after sessions
- Session data persists to Dexie (sessions, drill_results tables)
- Drills adapt within session (easy → medium → hard progression)
- E2E test covers complete training session

---

### Story 3.1: Build Training Session Shell and State Management

**As a** user starting a training session,
**I want** a guided session flow that selects appropriate drills for my needs,
**So that** I practice my weak areas without thinking about what to do next.

**Acceptance Criteria:**

**Given** I completed the assessment (Epic 2) with training plan weights stored
**When** I navigate to `/training` route
**Then** the TrainingSession component renders with:
- Session header showing today's date and current streak
- "Start Training" button (coral primary color)
- Optional: "Quick Session" (5 min) vs "Full Session" (15 min) toggle
- Session goal display: "Focus: Number Sense" (based on highest weight)

**And** SessionContext manages training state:
- `sessionId`: UUID generated on session start
- `sessionType`: 'training' | 'quick'
- `drillQueue`: Array of drill types selected by weights
- `currentDrillIndex`: Current position in queue
- `sessionStartTime`: Timestamp when "Start Training" clicked
- `results`: Array storing each drill result

**And** Drill selection algorithm (`src/services/training/drillSelector.ts`):
- Loads training plan weights from Dexie (from latest assessment)
- Generates weighted random selection of 6-12 drills
- Example: If Number Sense weight = 0.5, Spatial = 0.3, Operations = 0.2
  - 50% chance each drill is Number Line
  - 30% chance Spatial Rotation
  - 20% chance Math Operations
- No more than 3 consecutive drills of same type (variety enforcement)

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
- Location: `src/features/training/components/TrainingSession.tsx`
- Drill selector: `src/services/training/drillSelector.ts`
- Use SessionContext from Epic 1 for state management
- StreakCounter component from Epic 1 displays in header
- Session types: Quick (6 drills), Full (12 drills)
- Handle case where no assessment exists: Prompt user to take assessment first

---

### Story 3.2: Implement Number Line Drill

**As a** user in a training session,
**I want** number line placement drills that help me visualize quantities,
**So that** I improve my number sense through repeated practice.

**Acceptance Criteria:**

**Given** a training session is active with Number Line drill selected (Story 3.1 complete)
**When** the NumberLineDrill component renders
**Then** the drill displays:
- Horizontal number line spanning screen width (280px minimum, 90% viewport max)
- Range indicators: "0" on left, "100" on right (or "0" to "1000" for harder levels)
- Target number displayed above line: "Where is 47?"
- Draggable marker (🔴 red dot, 44px tap target) that user positions
- "Submit" button (disabled until marker positioned)
- Timer showing elapsed time (optional, can hide for reduced pressure)

**And** Interaction flow:
1. User taps/drags marker to position on number line
2. Position calculates as percentage: `(tapX - lineStartX) / lineWidth * range`
3. User clicks "Submit"
4. Visual feedback:
   - Correct (within ±10% tolerance): Green flash, success sound (if enabled), "+1" animation
   - Incorrect: Shows correct position briefly (gray marker), shows user's position (red marker)
5. Auto-advances to next drill after 1.5 seconds

**And** Drill result recorded:
```typescript
{
  id: uuid(),
  sessionId: currentSessionId,
  timestamp: Date.now(),
  module: 'number_line',
  targetNumber: 47,
  userAnswer: 45,  // User's placement
  correctAnswer: 47,
  accuracy: 95.7,  // Percentage (100 - error%)
  timeToAnswer: 3247,  // milliseconds
  difficulty: 'medium'
}
```

**And** Difficulty progression within session:
- First 2 drills: Easy (0-100 range, multiples of 10 as targets)
- Next 3 drills: Medium (0-100 range, any number)
- Remaining: Hard (0-1000 range) IF user accuracy > 80% on medium

**And** Accessibility: Keyboard support (arrow keys move marker, Enter submits)

**Prerequisites:** Story 3.1 (Training session shell operational)

**Technical Notes:**
- Location: `src/features/training/drills/NumberLineDrill.tsx`
- Number line: HTML div with click/touch handlers, not Canvas (better accessibility)
- Marker: Framer Motion `<motion.div>` with `drag="x"` constraint
- Tolerance calculation: `Math.abs(userAnswer - correctAnswer) / range <= 0.1`
- Success animation: Framer Motion spring animation + confetti burst (reuse from Epic 2)
- Store drill configs: `src/features/training/content/drillConfigs.ts`
- Reduced motion: Disable animations if `prefers-reduced-motion` active

---

### Story 3.3: Implement Spatial Rotation Drill

**As a** user in a training session,
**I want** spatial rotation drills that challenge my mental manipulation of shapes,
**So that** I strengthen my spatial reasoning abilities.

**Acceptance Criteria:**

**Given** a training session is active with Spatial Rotation drill selected (Story 3.2 complete)
**When** the SpatialRotationDrill component renders
**Then** the drill displays:
- Two 2D shapes side-by-side (left: reference shape, right: comparison shape)
- Shapes: L-shapes, T-shapes, irregular polygons (SVG rendered)
- Comparison shape rotated 90°, 180°, or 270° (or mirrored for hard mode)
- Question text: "Is the right shape the same as the left?"
- Two large buttons: "Yes, Same" (mint green) | "No, Different" (coral)
- Subtle grid background (optional, helps with rotation reasoning)

**And** Interaction flow:
1. User studies both shapes
2. User taps "Yes, Same" or "No, Different"
3. Visual feedback:
   - Correct: Green border flash, success sound, "+1" animation
   - Incorrect: Red border flash, show correct answer ("These are the same" or "These are different")
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
- Easy: Simple shapes (L, T), 90° or 180° rotation only, no mirroring
- Medium: Irregular shapes, any rotation, no mirroring
- Hard: Complex shapes, rotation + mirroring (requires detecting mirror vs rotation)

**And** Shape library: 8-10 pre-defined SVG shapes with varying complexity

**And** Randomization: Each drill pulls random shape + random transformation

**Prerequisites:** Story 3.2 (Number Line Drill implemented)

**Technical Notes:**
- Location: `src/features/training/drills/SpatialRotationDrill.tsx`
- SVG shapes: `src/features/training/content/shapes.ts` (export as SVG path strings)
- CSS transform for rotation: `transform: rotate(${degrees}deg) scaleX(${mirrored ? -1 : 1})`
- Answer buttons: Full-width on mobile, side-by-side on tablet+
- Timing: `performance.now()` on render and on answer for accurate `timeToAnswer`
- Test with dyscalculia users: Ensure shapes are clear and distinguishable

---

### Story 3.4: Implement Math Operations Drill

**As a** user in a training session,
**I want** math operations drills that reinforce basic arithmetic,
**So that** I build automaticity with addition, subtraction, and multiplication.

**Acceptance Criteria:**

**Given** a training session is active with Math Operations drill selected (Story 3.3 complete)
**When** the MathOperationsDrill component renders
**Then** the drill displays:
- Large arithmetic problem: "12 + 7 = ?"
- Number keypad (0-9, backspace, clear, submit) - reuse from Epic 2
- User's typed answer displayed above keypad (24px font minimum)
- Optional: Visual aids (e.g., dot groups for addition) for easy mode

**And** Interaction flow:
1. User types answer using number keypad
2. User taps "Submit" (or Enter key)
3. Visual feedback:
   - Correct: Green flash, success sound, "+1" animation
   - Incorrect: Red flash, show correct answer ("12 + 7 = 19")
4. Auto-advances after 1.5 seconds

**And** Drill result recorded:
```typescript
{
  id: uuid(),
  sessionId: currentSessionId,
  timestamp: Date.now(),
  module: 'math_operations',
  operation: 'addition',
  problem: '12 + 7',
  userAnswer: 19,
  correctAnswer: 19,
  isCorrect: true,
  timeToAnswer: 4521,
  difficulty: 'easy'
}
```

**And** Difficulty progression:
- Easy:
  - Addition (single-digit: 3 + 5, 7 + 8)
  - Subtraction (no negatives: 9 - 4, 12 - 7)
- Medium:
  - Addition (double-digit: 23 + 17, 45 + 38)
  - Subtraction (double-digit: 56 - 23, 82 - 47)
  - Multiplication (single-digit: 3 × 4, 6 × 7)
- Hard:
  - Multiplication (up to 12×12 times tables)
  - Mixed operations in sequence (not shown, but recorded)

**And** Problem generation randomized within difficulty ranges
**And** No repeating problems within same session (track used problems)

**Prerequisites:** Story 3.3 (Spatial Rotation Drill implemented)

**Technical Notes:**
- Location: `src/features/training/drills/MathOperationsDrill.tsx`
- Reuse NumberKeypad from `src/shared/components/NumberKeypad.tsx` (created in Epic 2)
- Problem generator: `src/services/training/problemGenerator.ts`
  - Functions: `generateAddition(difficulty)`, `generateSubtraction(difficulty)`, `generateMultiplication(difficulty)`
- Input validation: Max 4 digits, non-negative only
- Accessibility: Label keypad buttons with aria-label, announce correct/incorrect to screen readers

---

### Story 3.5: Build Drill Session UI Components

**As a** user in a training session,
**I want** clear visual feedback and progress indicators throughout my session,
**So that** I stay motivated and know how much I've completed.

**Acceptance Criteria:**

**Given** all three drill types are implemented (Story 3.4 complete)
**When** I am in an active training session
**Then** the following UI components are operational:

**SessionProgressBar** (`src/features/training/components/SessionProgressBar.tsx`):
- Shows "Drill X of Y" text (e.g., "Drill 3 of 12")
- Horizontal progress bar (0-100% filled, coral primary color)
- Animated fill as drills complete (Framer Motion transition)
- Positioned at top of training session view

**DrillTransition** (`src/features/training/components/DrillTransition.tsx`):
- Appears between drills for 0.5 seconds
- Shows next drill type icon + name:
  - 📏 "Number Line"
  - 🔄 "Spatial Rotation"
  - ➕ "Math Operations"
- Subtle fade-in/fade-out animation
- Prevents jarring instant switches between drill types

**SessionFeedback** (`src/features/training/components/SessionFeedback.tsx`):
- Correct answer feedback: Green checkmark ✓, "+1" floating animation
- Incorrect answer feedback: Red X ✗, show correct answer text
- Streak counter mini-animation: Flame 🔥 pulses when drill correct
- Success sound (if sound enabled in UserSettingsContext)

**PauseButton** (in session header):
- Icon button (⏸ pause symbol, 44px tap target)
- Opens pause modal with options:
  - "Resume" (coral button)
  - "End Session Early" (gray button, shows confirmation)
  - Shows current progress: "7 of 12 drills complete"

**And** All components use Tailwind classes, no inline styles
**And** All animations respect `prefers-reduced-motion` media query
**And** Sound effects use Web Audio API, respect UserSettingsContext.soundEnabled

**Prerequisites:** Story 3.4 (Math Operations Drill implemented)

**Technical Notes:**
- Progress bar: shadcn/ui `<Progress>` component with Framer Motion
- Drill icons: Use emoji or Lucide React icons
- Sound effects: Store in `public/sounds/` (success.mp3, incorrect.mp3, short files <50kb)
- Pause modal: shadcn/ui `<Dialog>` component
- Test pause functionality: Verify drill timer stops, session state preserved

---

### Story 3.6: Implement Confidence Prompt System

**As a** user completing a training session,
**I want** to log how confident I felt before and after the session,
**So that** the app can track my emotional progress alongside performance data.

**Acceptance Criteria:**

**Given** drill session UI components are complete (Story 3.5 done)
**When** I start a training session
**Then** the ConfidencePromptBefore component renders:
- Displayed as modal before first drill
- Question: "How confident do you feel about math right now?"
- 5 emoji options (44px tap targets):
  - 😟 "Not confident"
  - 😐 "A bit unsure"
  - 🙂 "Okay"
  - 😊 "Pretty good"
  - 🤩 "Very confident!"
- User selection required to continue
- Selected confidence stored in SessionContext as `confidenceBefore: 1-5`

**When** I complete all drills in the session
**Then** the ConfidencePromptAfter component renders:
- Displayed as modal after final drill
- Question: "How do you feel about math now?"
- Same 5 emoji options
- User selection required
- Selected confidence stored as `confidenceAfter: 1-5`

**And** Confidence delta calculated:
- `confidenceChange = confidenceAfter - confidenceBefore`
- Stored in session record
- Example: Started at 2 (😐), ended at 4 (😊) → +2 improvement

**And** Session completion summary shown after confidence prompt:
- "Session Complete! 🎉"
- Stats displayed:
  - "Drills completed: 12"
  - "Accuracy: 85%" (correct drills / total drills)
  - "Confidence boost: +2" (if positive) or "Confidence: No change" (if 0) or "Keep practicing!" (if negative)
- "View Progress" button → navigates to `/progress`
- "Done" button → navigates to `/` (home)

**And** Full session record saved to Dexie `sessions` table:
```typescript
{
  id: sessionId,
  timestamp: sessionStartTime,
  module: 'training',
  status: 'completed',
  drillCount: 12,
  accuracy: 85,
  confidenceBefore: 2,
  confidenceAfter: 4,
  confidenceChange: 2,
  duration: 647000  // milliseconds (10m 47s)
}
```

**And** Streak updated in localStorage:
- If last session date = yesterday → increment streak
- If last session date = today → maintain streak (don't double-count)
- If last session date > 1 day ago → reset streak to 1

**Prerequisites:** Story 3.5 (Drill session UI components complete)

**Technical Notes:**
- Location: `src/features/training/components/ConfidencePromptBefore.tsx`, `ConfidencePromptAfter.tsx`
- Use shadcn/ui `<Dialog>` component with `closeOnOutsideClick={false}` (force user selection)
- Emoji buttons: Large (60px), clear labels, accessible (role="button", aria-label)
- Streak logic: `src/services/training/streakManager.ts`
- Session completion: Trigger from SessionContext when `currentDrillIndex === drillQueue.length`
- Celebrate positive confidence change: Show confetti animation if `confidenceChange > 0`

---

### Story 3.7: Implement Session Telemetry and Data Persistence

**As a** developer,
**I want** comprehensive session and drill data persisted to Dexie,
**So that** future epics (Progress Tracking, Adaptive Intelligence) have rich data to analyze.

**Acceptance Criteria:**

**Given** confidence prompts are implemented (Story 3.6 complete)
**When** a user completes a training session
**Then** all data is successfully persisted to Dexie:

**Sessions Table:**
```typescript
await db.sessions.add({
  id: uuid(),
  timestamp: sessionStartTime,
  module: 'training',
  status: 'completed',
  drillCount: 12,
  accuracy: 85,
  confidenceBefore: 2,
  confidenceAfter: 4,
  confidenceChange: 2,
  duration: 647000,
  drillTypes: { number_line: 6, spatial_rotation: 3, math_operations: 3 }
});
```

**Drill Results Table:**
Each drill result saved individually:
```typescript
await db.drill_results.bulkAdd([
  {
    id: uuid(),
    sessionId: currentSessionId,
    timestamp: Date.now(),
    module: 'number_line',
    targetNumber: 47,
    userAnswer: 45,
    correctAnswer: 47,
    accuracy: 95.7,
    timeToAnswer: 3247,
    difficulty: 'medium',
    isCorrect: true
  },
  // ... all other drill results
]);
```

**Telemetry Logs Table:**
Session lifecycle events:
```typescript
await db.telemetry_logs.bulkAdd([
  { id: uuid(), timestamp: sessionStart, event: 'session_start', module: 'training', data: {} },
  { id: uuid(), timestamp: drillComplete, event: 'drill_complete', module: 'number_line', data: { accuracy: 95.7 } },
  { id: uuid(), timestamp: sessionEnd, event: 'session_end', module: 'training', data: { accuracy: 85, duration: 647000 } }
]);
```

**And** Error handling:
- Wrap all Dexie operations in try-catch
- If IndexedDB write fails: Log to console, show user toast notification
- Fallback: Store session data in localStorage as backup (retrieve on next launch)

**And** Data export utility (`src/services/storage/exportData.ts`):
- Function: `exportSessionData(sessionId) => JSON`
- For debugging and user data portability
- Bundles session + all drill results into single JSON object

**And** Database maintenance:
- Auto-delete sessions older than 365 days (configurable)
- Function: `cleanOldSessions()` runs on app launch
- Keeps database size manageable (<10MB typical)

**Prerequisites:** Story 3.6 (Confidence prompt system implemented)

**Technical Notes:**
- Dexie operations: Use `db.transaction()` for atomic multi-table writes
- Bulk insert: Use `bulkAdd()` for drill results (faster than individual `add()` calls)
- Telemetry service: `src/services/telemetry/logger.ts` wraps Dexie writes
- Test: Verify data persists after browser refresh (Dexie survives page reloads)
- Test: Verify IndexedDB quota (should be ~50MB minimum in modern browsers)
- localStorage fallback: `STORAGE_KEYS.SESSION_BACKUP` stores stringified session data

---

### Story 3.8: E2E Test - Complete Training Session Journey

**As a** developer,
**I want** comprehensive E2E test covering the full training session flow,
**So that** I can confidently deploy knowing the core training experience works end-to-end.

**Acceptance Criteria:**

**Given** all training stories are complete (Story 3.7 done)
**When** I run the E2E test suite
**Then** a Playwright test exists (`tests/e2e/training-flow.spec.ts`) that:

**Test Steps:**
1. Complete assessment (reuse assessment flow, fast-forward through questions)
2. Navigate to `/training`
3. Verify training session shell renders with "Start Training" button
4. Click "Start Training"
5. Verify ConfidencePromptBefore modal appears
6. Select confidence level (😊 "Pretty good")
7. Verify first drill renders (check for drill-specific elements)
8. Complete 6 drills (2 of each type):
   - Number Line: Simulate marker drag + submit
   - Spatial Rotation: Click "Yes, Same" or "No, Different"
   - Math Operations: Type answer with keypad + submit
9. Verify progress bar updates after each drill (e.g., "Drill 3 of 6")
10. Verify ConfidencePromptAfter modal appears after final drill
11. Select confidence level (🤩 "Very confident!")
12. Verify session completion summary shows:
    - "Session Complete!"
    - Accuracy percentage
    - Confidence change ("+2" or similar)
13. Verify IndexedDB contains:
    - Session record in `sessions` table
    - 6 drill result records in `drill_results` table
    - Telemetry logs in `telemetry_logs` table
14. Click "View Progress"
15. Verify navigation to `/progress`

**And** Test includes error scenarios:
- Pause and resume session (verify state preserved)
- End session early (verify partial data saved)

**And** Test runs in mobile viewport (375×667)
**And** Test takes screenshots at: Session start, Mid-session, Confidence prompt, Completion
**And** Test completes in <60 seconds
**And** Test passes on Chromium, Firefox, WebKit

**Prerequisites:** Story 3.7 (Session telemetry and data persistence complete)

**Technical Notes:**
- Reuse assessment completion from `assessment-flow.spec.ts` (create shared test helper)
- Simulate drill interactions with Playwright's `page.locator()` and `page.click()`
- Number Line drill: Use `page.mouse.move()` and `page.mouse.click()` for marker positioning
- IndexedDB verification: Use `page.evaluate(() => db.sessions.toArray())` to query Dexie
- Clear IndexedDB before test: `await page.evaluate(() => indexedDB.deleteDatabase('DiscalculasDB'))`
- Mock `performance.now()` for consistent timing
- Screenshot storage: `test-results/training-flow/`
- Run test in CI pipeline (already configured in Epic 1)

---

## Epic 4: Adaptive Intelligence

**Goal:** Implement the "Magic Minute" micro-sprint system and adaptive difficulty engine that analyzes user mistakes in real-time and automatically adjusts challenge levels. This is the secret sauce that makes training feel personalized and responsive.

**Business Value:** Creates the adaptive "magic" that differentiates this app from static drill apps. Users experience challenges that are always appropriately difficult - not too easy (boring), not too hard (frustrating). Magic Minute adds urgency and gamification.

**Acceptance Criteria for Epic:**
- Magic Minute timer triggers 60-second micro-challenges mid-session
- Mistake analysis engine identifies error patterns in real-time
- Adaptive difficulty engine adjusts drill parameters based on performance
- Micro-challenges generated from recent mistakes
- Transparency toasts explain why difficulty changed
- Adaptive history persists to Dexie `difficulty_history` table
- Magic Minute sessions tracked in `magic_minute_sessions` table

---

### Story 4.1: Implement Mistake Analysis Engine

**As a** system analyzing user performance,
**I want** to detect error patterns from drill results in real-time,
**So that** I can identify which specific skills need targeted practice.

**Acceptance Criteria:**

**Given** training session drill results are being recorded (Epic 3 complete)
**When** a user completes drills and makes mistakes
**Then** the MistakeAnalyzer service (`src/services/adaptiveDifficulty/mistakeAnalyzer.ts`) analyzes:

**Error Pattern Detection:**
- Number Line errors:
  - Consistent overestimation (user always places too high)
  - Consistent underestimation (user always places too low)
  - Magnitude errors (struggles with 100+ range but OK with 0-100)
  - Boundary errors (struggles near 0 or 100)
- Spatial Rotation errors:
  - Rotation confusion (can't distinguish 90° vs 180°)
  - Mirroring confusion (mistakes mirror for rotation)
  - Complexity threshold (struggles with irregular shapes but OK with simple)
- Math Operations errors:
  - Operation-specific weakness (good at addition, struggles with subtraction)
  - Magnitude threshold (OK with single-digit, struggles with double-digit)
  - Speed vs accuracy trade-off (fast but inaccurate vs slow but accurate)

**Mistake Categorization:**
Each mistake tagged with:
```typescript
{
  drillId: uuid(),
  mistakeType: 'overestimation' | 'rotation_confusion' | 'magnitude_error' | ...,
  severity: 'minor' | 'moderate' | 'severe',  // Based on error magnitude
  timestamp: Date.now(),
  drillContext: { module: 'number_line', difficulty: 'medium', ... }
}
```

**Real-Time Analysis:**
- Analyzer runs after every 3 drills (sliding window)
- Maintains session-level mistake buffer (last 10 drills)
- Identifies patterns: 2+ mistakes of same type = pattern detected

**And** Analysis results stored in SessionContext for use by adaptive engine
**And** Pure functions for testability: `analyzeDrillResult()`, `detectPattern()`, `categorizeMistake()`

**Prerequisites:** Epic 3 complete (drill results available)

**Technical Notes:**
- Location: `src/services/adaptiveDifficulty/mistakeAnalyzer.ts`
- Pattern detection: Simple frequency counting (e.g., 2 of last 5 = pattern)
- Severity calculation:
  - Number Line: Severe if error > 20%, Minor if < 5%
  - Spatial: Severe if wrong on simple shapes, Minor if wrong only on complex
  - Operations: Severe if basic facts wrong, Minor if only hard problems wrong
- Unit tests: Mock drill results, verify pattern detection accuracy
- Export TypeScript interfaces: `MistakePattern`, `AnalysisResult`

---

### Story 4.2: Build Magic Minute Timer Component

**As a** user in a training session,
**I want** surprise 60-second micro-challenges that appear mid-session,
**So that** I experience focused, high-energy sprints that break up regular practice.

**Acceptance Criteria:**

**Given** mistake analysis engine is operational (Story 4.1 complete)
**When** I am in a training session and have completed 6+ drills
**Then** the Magic Minute trigger logic activates:
- Random chance after drill 6, 9, or 12 (30% probability each)
- Alternative: Fixed after drill 8 (simpler, more predictable for MVP)
- Only triggers once per session
- Only if at least 3 mistakes detected (needs content for micro-challenges)

**When** Magic Minute triggers
**Then** the MagicMinuteTimer component renders:

**Timer UI:**
- Full-screen overlay (dim background, focus on timer)
- Large countdown: "60" → "59" → ... → "0" (72px font, coral color)
- Title: "⚡ Magic Minute! Answer as many as you can!"
- Instruction: "Quick challenges based on your recent mistakes"
- Progress: "X correct" counter (updates in real-time)
- No pause button (60 seconds is short, maintain urgency)

**Timer Behavior:**
- Countdown starts immediately (no "Start" button)
- Updates every second (not milliseconds - reduce pressure)
- At 0 seconds: Auto-ends, shows summary
- Keyboard accessible: Focus trap within Magic Minute modal

**Visual Design:**
- Pulsing border animation (Framer Motion)
- Coral accent color (#E87461) for urgency
- Larger fonts, higher contrast (readability under time pressure)
- Celebration animation at timer end (confetti burst)

**And** Magic Minute session created in Dexie:
```typescript
await db.magic_minute_sessions.add({
  id: uuid(),
  sessionId: currentSessionId,
  timestamp: Date.now(),
  correctCount: 0,  // Updated as user answers
  totalChallenges: 0,
  duration: 60000
});
```

**And** SessionContext state updated:
- `magicMinuteActive: boolean`
- `magicMinuteStartTime: number`
- `magicMinuteResults: Array<{ correct: boolean, timeToAnswer: number }>`

**Prerequisites:** Story 4.1 (Mistake analysis operational)

**Technical Notes:**
- Location: `src/features/magic-minute/components/MagicMinuteTimer.tsx`
- Timer implementation: `setInterval(() => setTimeLeft(prev => prev - 1), 1000)`
- Cleanup: `useEffect` cleanup clears interval on unmount
- State persistence: If user navigates away, Magic Minute cancelled (don't persist)
- Sound effects: Optional tick-tock sound (can be toggled off)
- Accessibility: `role="timer"`, `aria-live="polite"` for countdown announcements

---

### Story 4.3: Implement Micro-Challenge Generation Engine

**As a** system creating Magic Minute challenges,
**I want** to generate targeted micro-challenges from user's recent mistakes,
**So that** the 60-second sprint focuses on exactly what the user needs to practice.

**Acceptance Criteria:**

**Given** Magic Minute timer is active (Story 4.2 complete)
**When** the 60-second countdown starts
**Then** the MicroChallengeGenerator (`src/services/adaptiveDifficulty/microChallengeGenerator.ts`) creates challenges:

**Challenge Generation Logic:**
- Analyzes last 10 drills for mistake patterns (uses MistakeAnalyzer)
- Generates 10-15 micro-challenges (shorter than regular drills)
- Prioritizes detected weakness areas (2x weight for mistake types)
- Simplifies challenges slightly (reduce cognitive load under time pressure)

**Micro-Challenge Types:**

**Number Line (Simplified):**
- Smaller range (0-50 instead of 0-100)
- Larger tolerance (±15% instead of ±10%)
- Pre-positioned marker at 0, user drags to position
- No "Submit" button - auto-submits after 2 seconds of no movement

**Spatial Rotation (Simplified):**
- Only simple shapes (L, T - no irregular polygons)
- Only 90° or 180° rotations (no 270°, no mirroring)
- Same "Yes/No" buttons as regular drill

**Math Operations (Simplified):**
- Only single-digit operations
- Number keypad with larger buttons (50px minimum)
- Auto-submits after 2 digits typed (no explicit "Submit")

**Challenge Sequencing:**
- Randomize order (avoid predictability)
- Mix drill types (not all Number Line in a row)
- Track used challenges (no duplicates within Magic Minute)

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
- If 5 consecutive correct → increase difficulty slightly
- If 3 consecutive incorrect → decrease difficulty
- Maintains engagement (not too easy or too hard)

**Prerequisites:** Story 4.2 (Magic Minute timer component built)

**Technical Notes:**
- Location: `src/services/adaptiveDifficulty/microChallengeGenerator.ts`
- Challenge pool: Pre-generate all 10-15 challenges at start (avoid generation lag)
- Timeout handling: If user doesn't answer in 8 seconds → auto-skip (mark incorrect)
- Results: Store in Dexie `drill_results` table with `source: 'magic_minute'` flag
- Unit tests: Mock mistake patterns, verify appropriate challenges generated
- Export: `generateMicroChallenges(mistakePatterns, count) => Challenge[]`

---

### Story 4.4: Implement Adaptive Difficulty Engine

**As a** system managing drill difficulty,
**I want** to automatically adjust challenge parameters based on user performance,
**So that** users always work at their optimal challenge level (flow state).

**Acceptance Criteria:**

**Given** micro-challenge generation is operational (Story 4.3 complete)
**When** a user completes drills across multiple sessions
**Then** the AdaptiveDifficultyEngine (`src/services/adaptiveDifficulty/difficultyEngine.ts`) adjusts parameters:

**Performance Metrics Tracked:**
- Session accuracy (last 5 sessions average)
- Time to answer (median across last 20 drills per module)
- Consistency (standard deviation of accuracy - low = consistent, high = erratic)
- Confidence trend (before/after confidence over last 5 sessions)

**Difficulty Adjustment Rules:**

**Number Line:**
- Accuracy > 85% for 3 sessions → Increase range (100 → 1000) OR reduce tolerance (±10% → ±5%)
- Accuracy < 60% for 2 sessions → Decrease range (1000 → 100) OR increase tolerance (±5% → ±15%)
- Median time < 2 seconds → Add harder targets (non-round numbers like 347 instead of 350)

**Spatial Rotation:**
- Accuracy > 90% → Introduce irregular shapes OR add mirroring
- Accuracy < 65% → Simplify to L/T shapes only, no mirroring
- Consistent confusion on mirrors → Avoid mirrors for 5 sessions, focus on rotation only

**Math Operations:**
- Accuracy > 80% → Increase magnitude (single → double-digit) OR introduce multiplication
- Accuracy < 65% → Decrease magnitude, focus on mastered operation type
- Speed < 3 sec median → Introduce mixed operations

**Difficulty History Tracking:**
```typescript
await db.difficulty_history.add({
  id: uuid(),
  sessionId: currentSessionId,
  timestamp: Date.now(),
  module: 'number_line',
  previousDifficulty: 'medium',
  newDifficulty: 'hard',
  reason: 'accuracy_threshold_exceeded',  // Why adjustment happened
  performanceMetrics: {
    accuracy: 87,
    medianTime: 2800,
    consistency: 0.12
  }
});
```

**And** Difficulty changes are gradual:
- Only adjust one parameter per session (not all at once)
- Maximum one adjustment per module per session
- Cooldown: Wait 2 sessions before re-adjusting same parameter

**And** Initial difficulty (first session):
- Defaults to "easy" for all modules
- After assessment: Uses assessment scores to set initial level
  - Assessment score > 4 → Start at "medium"
  - Assessment score > 4.5 → Start at "hard"

**Prerequisites:** Story 4.3 (Micro-challenge generation complete)

**Technical Notes:**
- Location: `src/services/adaptiveDifficulty/difficultyEngine.ts`
- Runs: After each session completion (part of session end hook)
- Pure functions: `calculateMetrics()`, `determineAdjustment()`, `applyAdjustment()`
- Difficulty levels: Easy, Medium, Hard (enum with specific parameter sets)
- Unit tests: Mock performance data, verify adjustment logic
- Export difficulty configs: `DIFFICULTY_CONFIGS` object with all parameter sets

---

### Story 4.5: Build Transparency Toast Notifications

**As a** user experiencing difficulty changes,
**I want** clear explanations when the app adjusts my challenge level,
**So that** I understand why it happened and feel the app is working intelligently for me.

**Acceptance Criteria:**

**Given** adaptive difficulty engine is operational (Story 4.4 complete)
**When** difficulty adjusts after a session
**Then** a TransparencyToast component displays explaining the change:

**Toast Content Patterns:**

**Difficulty Increased:**
- "🎉 Great progress! We're increasing the challenge."
- "You've mastered [Number Line basics]! Time for [bigger numbers]."
- "Your accuracy is excellent - let's level up!"

**Difficulty Decreased:**
- "💪 Let's build confidence with [simpler challenges]."
- "We've adjusted to [easier shapes] so you can practice fundamentals."
- "Taking a step back to strengthen your foundation."

**Magic Minute Triggered:**
- "⚡ Magic Minute unlocked! We noticed you struggled with [number placement]."
- "Time for a quick sprint focusing on [rotation recognition]!"

**Pattern Detected:**
- "📊 We see you're improving at [addition] - keep it up!"
- "👀 We noticed some [overestimation] - let's practice that."

**Toast UI:**
- shadcn/ui Toast component (bottom-right on mobile, top-right on desktop)
- Auto-dismisses after 5 seconds (user can dismiss early with X button)
- Accessible: `role="status"`, `aria-live="polite"`
- Non-blocking: User can continue navigating while toast visible
- Max 1 toast per session end (don't spam multiple toasts)

**Toast Triggering Logic:**
- Difficulty change → Show explanation toast
- Magic Minute start → Show motivation toast
- Pattern detection (first time) → Show insight toast
- Good performance streak (5 sessions >85%) → Show celebration toast

**And** Toast messages personalized:
- Use module names: "Number Line", "Spatial Rotation", "Math Operations"
- Reference specific improvements: "Your [subtraction] is getting faster!"
- Avoid technical jargon: "We're adjusting" not "Adaptive engine recalibrated"

**And** Toast preferences in UserSettingsContext:
- `showAdaptiveToasts: boolean` (default: true)
- Users can disable in settings if they find them distracting

**Prerequisites:** Story 4.4 (Adaptive difficulty engine implemented)

**Technical Notes:**
- Location: `src/features/magic-minute/components/TransparencyToast.tsx`
- Toast provider: shadcn/ui Toaster component in App.tsx
- Message templates: `src/features/magic-minute/content/toastMessages.ts`
- Message selection: Map reason codes to user-friendly strings
- Animation: Slide-in from right (Framer Motion)
- Test: Verify toast appears after difficulty adjustment, auto-dismisses after 5s
- Accessibility: Ensure screen reader announces toast content

---

### Story 4.6: E2E Test - Adaptive Intelligence Flow

**As a** developer,
**I want** comprehensive E2E test covering adaptive difficulty and Magic Minute,
**So that** I can verify the adaptive intelligence works end-to-end.

**Acceptance Criteria:**

**Given** all adaptive intelligence stories are complete (Story 4.5 done)
**When** I run the E2E test suite
**Then** a Playwright test exists (`tests/e2e/adaptive-flow.spec.ts`) that:

**Test Scenario 1: Difficulty Increase**
1. Complete assessment with high scores (>85% accuracy)
2. Complete 3 training sessions with high accuracy
3. After 3rd session, verify difficulty_history table shows increase
4. Start 4th session
5. Verify drills are harder (check drill parameters)
6. Verify transparency toast displayed explaining increase

**Test Scenario 2: Magic Minute Trigger**
1. Complete assessment
2. Start training session, intentionally answer 4 drills incorrectly (same mistake type)
3. Complete drills 5, 6, 7 correctly
4. After drill 8, verify Magic Minute triggers
5. Verify timer displays "60" and counts down
6. Complete 3 micro-challenges (correct answers)
7. Verify timer reaches 0, shows completion summary
8. Verify magic_minute_sessions table contains record

**Test Scenario 3: Mistake Pattern Detection**
1. Complete training session with 5 Number Line drills, all with overestimation errors
2. Verify SessionContext contains detected pattern: 'overestimation'
3. Start new session
4. Verify drill selection weights favor Number Line (to address weakness)

**Test Scenario 4: Difficulty Decrease**
1. Manually set difficulty to "hard" in Dexie
2. Complete session with <60% accuracy
3. Complete another session with <60% accuracy
4. Verify difficulty_history shows decrease to "medium"
5. Verify transparency toast explains adjustment

**And** Test includes IndexedDB verification:
- Query `difficulty_history` table for adjustment records
- Query `magic_minute_sessions` table for Magic Minute records
- Verify performance metrics stored correctly

**And** Test runs in mobile viewport (375×667)
**And** Test takes screenshots at key moments: Difficulty change, Magic Minute start, Toast display
**And** Test completes in <90 seconds
**And** Test passes on Chromium, Firefox, WebKit

**Prerequisites:** Story 4.5 (Transparency toasts implemented)

**Technical Notes:**
- Use Playwright's `page.evaluate()` to manipulate Dexie data directly
- Mock performance: Simulate high/low accuracy by providing correct/incorrect answers
- Timer verification: Use `page.locator('text=/^[0-9]+$/')` to find countdown
- Toast verification: `await expect(page.locator('[role="status"]')).toBeVisible()`
- Pattern detection: Manually insert drill results with same mistake type
- Screenshot storage: `test-results/adaptive-flow/`
- Run test in CI pipeline (already configured in Epic 1)

---

## Epic 5: Progress Tracking & Insights

**Goal:** Visualize user progress through the Confidence Radar chart, session history, streak tracking, and generated insights. This epic makes progress tangible and motivating, showing users they're improving even when it doesn't feel obvious.

**Business Value:** Progress visualization is crucial for retention. Users need to see they're making progress to stay motivated. The Confidence Radar is the signature visualization that shows multi-dimensional growth.

**Acceptance Criteria for Epic:**
- Confidence Radar chart displays 3 domains with historical trend lines
- Session history view shows past training sessions with key metrics
- Streak counter integrated into home screen
- Insights engine generates personalized observations from data
- Data export functionality (CSV/JSON) for user portability
- Progress route accessible from bottom navigation

---

### Story 5.1: Build Confidence Radar Chart Component

**As a** user reviewing my progress,
**I want** a visual chart showing my confidence across all three domains over time,
**So that** I can see which areas are improving and which need more focus.

**Acceptance Criteria:**

**Given** I have completed multiple training sessions with confidence data (Epics 3-4 complete)
**When** I navigate to `/progress` route
**Then** the ConfidenceRadar component renders:

**Chart Visualization:**
- Radar/spider chart with 3 axes (Recharts RadarChart component):
  - Number Sense (top axis, 0° position)
  - Spatial Awareness (bottom-right, 120° position)
  - Math Operations (bottom-left, 240° position)
- Scale: 1-5 on each axis (matching confidence prompt scale)
- Current confidence values plotted as filled area (coral color, 50% opacity)
- Historical baseline (first session) plotted as dashed line (gray)
- Gridlines at 1, 2, 3, 4, 5 intervals

**Data Calculation:**
- Queries last 10 sessions from Dexie `sessions` table
- Calculates average `confidenceAfter` per domain (weighted by recent sessions)
- Baseline: Uses first assessment confidence scores (or first session if no assessment)
- Updates in real-time after each session completion

**Visual Design:**
- Chart size: 280px × 280px on mobile, 400px × 400px on tablet+
- Domain labels: 18px font, positioned outside chart perimeter
- Legend: "Current" (coral fill) vs "Starting Point" (gray dashed)
- Accessible: Alt text describes current confidence levels

**And** Chart interaction (optional for MVP, nice-to-have):
- Tap domain label to highlight that axis
- Show tooltip on hover with exact confidence value
- Animate chart fill on initial render (Framer Motion)

**And** Empty state handling:
- If <3 sessions completed: Show placeholder chart with message
  - "Complete 3 training sessions to see your Confidence Radar!"
  - Gray outline chart, no filled area

**Prerequisites:** Epics 3-4 complete (session data with confidence prompts available)

**Technical Notes:**
- Location: `src/features/progress/components/ConfidenceRadar.tsx`
- Recharts: `<RadarChart>`, `<PolarGrid>`, `<PolarAngleAxis>`, `<Radar>`
- Data query: `db.sessions.where('module').equals('training').reverse().limit(10).toArray()`
- Calculation service: `src/features/progress/services/confidenceCalculator.ts`
  - Function: `calculateDomainConfidence(sessions) => { numberSense, spatial, operations }`
- Responsive: Use Recharts `<ResponsiveContainer>` wrapper
- Test: Mock session data, verify chart renders with correct values

---

### Story 5.2: Build Session History View

**As a** user reviewing my past practice,
**I want** a chronological list of all my training sessions with key metrics,
**So that** I can see my consistency and spot patterns in my performance.

**Acceptance Criteria:**

**Given** Confidence Radar is implemented (Story 5.1 complete)
**When** I scroll down on the `/progress` route below the Confidence Radar
**Then** the SessionHistory component renders:

**History List:**
- Card-based layout, one card per session (shadcn/ui Card)
- Chronological order: Most recent first
- Each session card displays:
  - **Date**: "Today", "Yesterday", or "Mon, Nov 4" (date-fns format)
  - **Time**: "2:30 PM" (12-hour format)
  - **Duration**: "12 minutes" (formatted from milliseconds)
  - **Drill Count**: "12 drills" with breakdown (e.g., "6 Number Line, 3 Spatial, 3 Operations")
  - **Accuracy**: "85%" with colored badge (green >80%, yellow 60-80%, coral <60%)
  - **Confidence Change**: "+2" with 😊 emoji (or "No change" or "-1" with appropriate emoji)

**Visual Design:**
- Cards: 8px margin between, 16px padding, subtle shadow
- Accuracy badge: Pill shape, 24px height, colored background
- Confidence change: Inline with icon, mint color for positive, coral for negative
- Date header: Sticky when scrolling ("Today", "This Week", "Earlier")

**Interaction:**
- Tap session card → Expands to show drill-by-drill breakdown (accordion)
- Expanded view shows:
  - List of all drills with module icons (📏 🔄 ➕)
  - Each drill: Correct/incorrect icon (✓/✗), time taken
  - Magic Minute indicator if session included Magic Minute

**Data Loading:**
- Loads 30 most recent sessions initially (pagination for performance)
- "Load More" button at bottom (loads next 30 sessions)
- Query: `db.sessions.where('module').equals('training').reverse().limit(30).toArray()`

**Empty State:**
- If no sessions: "No training sessions yet. Start your first session!"
- Button: "Start Training" → navigates to `/training`

**Prerequisites:** Story 5.1 (Confidence Radar complete)

**Technical Notes:**
- Location: `src/features/progress/components/SessionHistory.tsx`
- Use shadcn/ui Accordion for expandable cards
- Date formatting: `date-fns` library (`format`, `formatDistanceToNow`, `isToday`, `isYesterday`)
- Pagination: Track `offset` state, increment by 30 on "Load More"
- Drill breakdown: Join `sessions` with `drill_results` on `sessionId`
- Performance: Virtualize list if >100 sessions (react-window or Recharts optimization)

---

### Story 5.3: Integrate Streak Counter on Home Screen

**As a** user opening the app daily,
**I want** to see my current streak prominently displayed on the home screen,
**So that** I'm motivated to maintain my practice habit.

**Acceptance Criteria:**

**Given** Session history view is complete (Story 5.2 done)
**When** I navigate to `/` (home route)
**Then** the home screen displays the streak counter:

**Streak Display:**
- Large flame emoji 🔥 (60px size)
- Current streak number (48px font, coral color)
- Label: "Day Streak" (18px font, gray)
- Positioned prominently at top of home screen
- Subtle animation on page load (flame flickers - Framer Motion)

**Streak Calculation Logic:**
- Reads `LAST_SESSION_DATE` from localStorage (set in Epic 3)
- Compares with today's date:
  - Last session = today → Maintain current streak
  - Last session = yesterday → Already incremented, show current
  - Last session > 1 day ago → Streak broken, reset to 0
- Reads `STREAK` from localStorage (current streak value)

**Streak Milestones:**
- Celebrate milestones with modal on achievement:
  - 7 days: "🎉 One Week Streak!"
  - 30 days: "🔥 One Month Streak!"
  - 100 days: "💯 Century Streak!"
- Milestone modal includes confetti animation + encouraging message
- Milestone triggered once per achievement (store in `STREAK_MILESTONES_SHOWN` localStorage)

**Tap Interaction:**
- Tap streak counter → Navigates to `/progress` (view full progress)
- Tap animation: Subtle scale bounce (Framer Motion)

**Edge Cases:**
- Streak = 0: Show "0 Day Streak" with dimmed flame (gray)
- First-time user (no sessions): Show "Start your streak today!" message
- Multiple sessions same day: Don't increment multiple times

**Prerequisites:** Story 5.2 (Session history complete, streak logic available)

**Technical Notes:**
- Location: `src/routes/Home.tsx` (add StreakCounter at top)
- Reuse StreakCounter component from Epic 1 (Story 1.7), enhance with milestones
- Streak manager: `src/services/training/streakManager.ts` (already created in Epic 3)
  - Function: `getCurrentStreak() => number`
  - Function: `checkMilestone(streak) => Milestone | null`
- Milestone modal: shadcn/ui Dialog with celebration animation
- localStorage keys: `STREAK`, `LAST_SESSION_DATE`, `STREAK_MILESTONES_SHOWN`

---

### Story 5.4: Implement Insights Generation Engine

**As a** user reviewing my progress,
**I want** personalized insights about my performance patterns,
**So that** I understand what I'm doing well and where to focus next.

**Acceptance Criteria:**

**Given** streak counter is integrated on home screen (Story 5.3 complete)
**When** I navigate to `/progress` route
**Then** the Insights section appears below the Confidence Radar:

**Insight Generation Logic:**
`InsightsEngine` (`src/features/progress/services/insightsEngine.ts`) analyzes:

**Pattern Detection:**
- **Consistency patterns**:
  - "You've trained X days this week - great consistency!" (if >4 sessions/week)
  - "Try to train more regularly - only X sessions this week" (if <3 sessions/week)
- **Performance trends**:
  - "Your Number Line accuracy improved 15% this month!" (if upward trend)
  - "Spatial Rotation is getting easier for you" (if confidence increasing)
  - "Math Operations accuracy dipped this week - let's focus there" (if downward trend)
- **Time patterns**:
  - "You're fastest at Number Line drills (avg 2.8s)" (if significantly faster than others)
  - "Taking your time on Spatial Rotation - accuracy is high!" (if slower but accurate)
- **Confidence insights**:
  - "Your confidence is growing! +8 points this month" (if confidenceChange trending positive)
  - "Practice is building confidence - you're up to 4.2/5 on average!" (if high confidence)

**Insight Display:**
- 2-3 insights shown at a time (most relevant first)
- Card-based layout (shadcn/ui Card with icon)
- Icons: 📈 (trend up), 📊 (stats), ⚡ (speed), 💪 (improvement), 🎯 (focus)
- Refreshes after each session (new insights based on updated data)

**Insight Priority:**
1. Milestone celebrations (streak, accuracy achievements)
2. Concerning trends (accuracy drop, low consistency)
3. Positive trends (improvements, speed gains)
4. General observations (patterns, preferences)

**And** Insights are actionable:
- Each insight includes suggestion: "Keep up the great work!" or "Try a training session today"
- Insights link to relevant actions: "Start Training" button, "View History" link

**And** Insights storage (optional for MVP):
- Save generated insights to `insights` localStorage key (JSON array)
- Prevents regenerating same insight repeatedly
- Max 10 stored insights, rotate out oldest

**Prerequisites:** Story 5.3 (Streak counter integrated, full progress data available)

**Technical Notes:**
- Location: `src/features/progress/services/insightsEngine.ts`
- Functions:
  - `generateInsights(sessions, drillResults) => Insight[]`
  - `detectTrend(values) => 'improving' | 'stable' | 'declining'`
  - `calculateWeeklyConsistency(sessions) => number`
- Trend detection: Linear regression on last 10 sessions per domain
- Insights component: `src/features/progress/components/InsightsPanel.tsx`
- Test: Mock session data with known patterns, verify correct insights generated

---

### Story 5.5: Build Data Export Functionality

**As a** user who wants to track my data externally,
**I want** to export my training data in CSV or JSON format,
**So that** I can analyze it in spreadsheets or back it up.

**Acceptance Criteria:**

**Given** insights engine is operational (Story 5.4 complete)
**When** I navigate to `/progress` route and scroll to the bottom
**Then** the Data Export section provides export options:

**Export Functionality:**
- Two export format buttons:
  - "Export as CSV" (for spreadsheet apps like Excel/Sheets)
  - "Export as JSON" (for technical users/backups)
- Date range selector (optional):
  - "Last 7 days", "Last 30 days", "Last 90 days", "All time" (default)
- Export includes:
  - All sessions in selected date range
  - All drill results for those sessions
  - Assessment results (if any)
  - User settings and streak data

**CSV Format:**
```csv
Session ID,Date,Time,Module,Duration,Drill Count,Accuracy,Confidence Before,Confidence After,Confidence Change
uuid-123,2025-11-09,14:30,training,647000,12,85,2,4,2
...

Drill ID,Session ID,Timestamp,Module,Target,User Answer,Correct Answer,Accuracy,Time
uuid-456,uuid-123,1699545600000,number_line,47,45,47,95.7,3247
...
```

**JSON Format:**
```json
{
  "exportDate": "2025-11-09T14:30:00Z",
  "dateRange": "all_time",
  "sessions": [...],
  "drillResults": [...],
  "assessments": [...],
  "userSettings": {...},
  "streak": 5
}
```

**Export Trigger:**
- Click export button → Generates file immediately (no server call)
- Browser download triggered with filename: `discalculas-export-2025-11-09.csv`
- Toast notification: "Export complete! Check your downloads."

**And** Data privacy notice:
- Text above export buttons: "Your data stays on your device. Exports are created locally."
- Reassures users about privacy (no data sent to server)

**And** Export validation:
- If no data to export: Disable export buttons, show message "No data to export yet"
- If date range selected has no data: Show toast "No sessions found in selected date range"

**Prerequisites:** Story 5.4 (Insights engine complete, full data model available)

**Technical Notes:**
- Location: `src/features/progress/components/DataExport.tsx`
- CSV generation: Use `papaparse` library or custom CSV serializer
  - Function: `generateCSV(sessions, drillResults) => string`
- JSON generation: `JSON.stringify(exportData, null, 2)`
- File download: Create Blob, trigger download via `<a download>` element
- Example:
  ```typescript
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `discalculas-export-${date}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  ```
- Export service: `src/services/storage/exportData.ts` (started in Epic 3, expand here)
- Test: Verify exported file contains correct data, proper formatting

---

### Story 5.6: E2E Test - Progress Tracking Flow

**As a** developer,
**I want** comprehensive E2E test covering the progress tracking features,
**So that** I can verify progress visualization and data export work correctly.

**Acceptance Criteria:**

**Given** all progress tracking stories are complete (Story 5.5 done)
**When** I run the E2E test suite
**Then** a Playwright test exists (`tests/e2e/progress-flow.spec.ts`) that:

**Test Scenario 1: Confidence Radar Display**
1. Seed database with 5 completed training sessions (varying confidence scores)
2. Navigate to `/progress`
3. Verify Confidence Radar chart renders
4. Verify 3 domain labels visible (Number Sense, Spatial Awareness, Math Operations)
5. Verify filled area corresponds to expected confidence values
6. Verify legend shows "Current" and "Starting Point"

**Test Scenario 2: Session History**
1. Navigate to `/progress`
2. Scroll down to Session History section
3. Verify 5 session cards displayed (matching seeded data)
4. Verify most recent session appears first
5. Click first session card to expand
6. Verify drill-by-drill breakdown appears
7. Verify drill count, accuracy, and confidence change match expected values

**Test Scenario 3: Streak Counter and Milestones**
1. Set streak to 6 in localStorage
2. Set last session date to yesterday
3. Navigate to `/` (home)
4. Verify streak counter shows "6"
5. Complete a training session (session 7)
6. Verify streak increments to 7
7. Verify milestone modal appears: "One Week Streak!"
8. Dismiss modal
9. Verify streak counter shows "7"

**Test Scenario 4: Insights Generation**
1. Seed database with 10 sessions showing upward accuracy trend
2. Navigate to `/progress`
3. Scroll to Insights section
4. Verify at least 2 insights displayed
5. Verify insight mentions improvement (e.g., "accuracy improved")
6. Verify insight includes actionable suggestion

**Test Scenario 5: Data Export**
1. Navigate to `/progress`
2. Scroll to Data Export section
3. Click "Export as CSV"
4. Verify download triggered (check Downloads folder or page.on('download'))
5. Read downloaded file contents
6. Verify CSV contains session data
7. Verify CSV format is valid (headers + rows)

**And** Test includes IndexedDB verification:
- Query `sessions` table, verify data matches chart display
- Query `drill_results` table, verify drill breakdown accuracy

**And** Test runs in mobile viewport (375×667)
**And** Test takes screenshots at: Confidence Radar, Session History, Streak Milestone, Insights
**And** Test completes in <60 seconds
**And** Test passes on Chromium, Firefox, WebKit

**Prerequisites:** Story 5.5 (Data export complete)

**Technical Notes:**
- Use Playwright's `page.evaluate()` to seed Dexie with test data
- Chart verification: Check for SVG elements (`page.locator('svg')`), verify `<Radar>` components
- Download testing: Use `page.on('download')` to intercept file download
  - `const download = await downloadPromise; const path = await download.path();`
  - Read file with Node.js `fs.readFileSync(path, 'utf-8')`
- Streak testing: Manipulate localStorage before test
- Screenshot storage: `test-results/progress-flow/`
- Run test in CI pipeline (already configured in Epic 1)

---

## Epic 6: Coach & Cognition Modules

**Goal:** Implement the Coach guidance system (contextual tips and quick actions) and three Cognition mini-games (Pattern Match, Spatial Flip, Memory Grid) that strengthen cognitive skills through playful practice. These modules provide variety and address broader cognitive patterns beyond just math drills.

**Business Value:** Coach provides intelligent guidance that helps users navigate the app and stay motivated. Cognition mini-games offer fun, low-pressure skill-building that keeps users engaged and rounds out the training experience.

**Acceptance Criteria for Epic:**
- Coach guidance component displays contextual tips based on user progress
- Quick actions surface relevant next steps
- Three Cognition mini-games functional (Pattern Match, Spatial Flip, Memory Grid)
- Mini-games tracked separately in telemetry
- Coach module accessible from home screen
- Cognition module accessible from bottom navigation

---

### Story 6.1: Build Coach Guidance System

**As a** user navigating the app,
**I want** helpful tips and guidance that appear at the right moments,
**So that** I understand what to do next and stay motivated.

**Acceptance Criteria:**

**Given** progress tracking is complete (Epic 5 done)
**When** I interact with different parts of the app
**Then** the Coach component provides contextual guidance:

**Coach Guidance Triggers:**
- **First launch**: "Welcome! Let's start with a quick assessment to personalize your training."
- **After assessment**: "Great! You're ready to start training. Your first session focuses on [weak area]."
- **Before first training session**: "Tip: Training sessions take 5-15 minutes. Find a quiet spot and let's begin!"
- **After 3 sessions**: "You're building consistency! Try to practice every day for best results."
- **Streak broken**: "Don't worry! Every practice counts. Start a new streak today."
- **High accuracy (>85%)**: "Excellent work! We're increasing the challenge to keep you growing."
- **Low consistency (<2 sessions/week)**: "Try setting a daily reminder to help build your practice habit."

**Coach UI:**
- Card component (shadcn/ui Card)
- Coach icon: 💬 or 🎓 (speech bubble or graduation cap)
- Title: "Coach" or "Tip"
- Message text: 2-3 sentences, encouraging tone
- Optional action button: "Start Assessment", "Begin Training", etc.
- Dismissible: X button in top-right corner

**Coach Context Algorithm** (`src/features/coach/services/coachEngine.ts`):
- Checks user state: sessions completed, streak status, last session date, accuracy trends
- Selects most relevant guidance from priority list
- Stores dismissed tips in localStorage (don't repeat immediately)
- Refreshes guidance after each session completion

**And** Coach placement:
- Home screen: Top of page (after streak counter)
- Progress screen: After insights section
- Profile screen: Optional encouragement based on overall progress

**Prerequisites:** Epic 5 complete (progress data available for context)

**Technical Notes:**
- Location: `src/features/coach/components/CoachGuidance.tsx`
- Coach engine: `src/features/coach/services/coachEngine.ts`
  - Function: `getContextualGuidance() => CoachMessage | null`
- Message templates: `src/features/coach/content/messages.ts`
- localStorage key: `DISMISSED_COACH_TIPS` (array of message IDs)
- Test: Mock user states, verify correct guidance appears

---

### Story 6.2: Implement Quick Actions Component

**As a** user on the home screen,
**I want** quick access to relevant actions,
**So that** I can jump directly to what I need to do next.

**Acceptance Criteria:**

**Given** Coach guidance is operational (Story 6.1 complete)
**When** I view the home screen
**Then** the QuickActions component displays 2-4 action cards:

**Quick Action Options:**
- **Start Training**: If no session today → coral button, "Continue your streak!"
- **View Progress**: If 3+ sessions completed → mint button, "See how you're improving"
- **Take Assessment**: If no assessment yet → yellow button, "Discover your strengths"
- **Try Cognition Games**: If user has trained 5+ times → secondary button, "Take a brain break"
- **Review Insights**: If new insights available → secondary button, badge showing count

**Action Card Design:**
- Grid layout: 2 columns on mobile, 4 columns on tablet+
- Each card: Icon (64px), title, subtitle, button
- Hover effect: Subtle lift (Framer Motion)
- Priority order: Most relevant action first (top-left)

**Dynamic Action Selection:**
- Algorithm prioritizes based on user state:
  1. No session today + streak active → "Start Training" (prevent break)
  2. No assessment → "Take Assessment" (onboarding)
  3. New insights → "Review Insights" (discovery)
  4. Default → "Start Training" + "View Progress"

**And** Action tracking:
- Log to telemetry when quick action clicked
- Track which actions users engage with most
- Data: `{ event: 'quick_action_clicked', action: 'start_training', source: 'home' }`

**Prerequisites:** Story 6.1 (Coach guidance complete)

**Technical Notes:**
- Location: `src/features/coach/components/QuickActions.tsx`
- Action selector: `src/features/coach/services/actionSelector.ts`
  - Function: `selectQuickActions(userState) => Action[]`
- Icons: Use Lucide React icons or emoji
- Navigation: React Router `useNavigate()` hook
- Test: Mock user states, verify correct actions displayed

---

### Story 6.3: Implement Pattern Match Mini-Game

**As a** user wanting a brain break from training,
**I want** a pattern matching game that exercises my visual processing,
**So that** I strengthen cognitive skills in a fun, low-pressure way.

**Acceptance Criteria:**

**Given** quick actions are implemented (Story 6.2 complete)
**When** I navigate to `/cognition` and select "Pattern Match"
**Then** the PatternMatchGame component renders:

**Game Mechanics:**
- Grid of tiles (4×4 = 16 tiles)
- Each tile shows a symbol: ●, ■, ▲, ★, ♦ (5 symbols, 3-4 of each)
- Objective: Find all matching pairs of symbols
- Click tile → reveals symbol → click second tile → if match, tiles stay revealed
- If no match, tiles flip back after 1 second
- Goal: Match all pairs in minimum moves

**Game UI:**
- Timer: Shows elapsed time (optional, can hide to reduce pressure)
- Move counter: "Moves: 8"
- Progress: "6/8 pairs matched"
- Tile size: 70px × 70px, 8px gap between
- Tile animation: Flip animation (Framer Motion)
- Success feedback: Green border flash + success sound

**Difficulty Levels:**
- Easy: 4×3 grid (12 tiles, 6 pairs)
- Medium: 4×4 grid (16 tiles, 8 pairs)
- Hard: 5×4 grid (20 tiles, 10 pairs)

**Game Completion:**
- All pairs matched → Show completion modal
- Stats: "Completed in 24 moves, 1m 47s"
- Encouragement: "Great visual memory!" or "Excellent pattern recognition!"
- Actions: "Play Again" button, "Back to Home" button

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
- Location: `src/features/cognition/games/PatternMatchGame.tsx`
- Tile state: Array of objects `{ id, symbol, revealed, matched }`
- Shuffle algorithm: Fisher-Yates shuffle for random tile placement
- Match detection: Store first clicked tile, compare with second, clear if no match
- Timer: `useEffect` with `setInterval`, cleanup on unmount
- Symbols: Unicode characters or SVG icons for crisp rendering

---

### Story 6.4: Implement Spatial Flip Mini-Game

**As a** user practicing spatial reasoning,
**I want** a shape rotation guessing game,
**So that** I strengthen my mental rotation abilities through repetition.

**Acceptance Criteria:**

**Given** Pattern Match game is complete (Story 6.3 done)
**When** I navigate to `/cognition` and select "Spatial Flip"
**Then** the SpatialFlipGame component renders:

**Game Mechanics:**
- Show a reference shape (L, T, irregular polygon)
- Show 4 comparison shapes (same shape with different rotations/mirrors)
- Objective: Identify which comparison shape matches the reference (after rotation/mirror)
- One correct answer, three distractors
- Time limit per question: 10 seconds (optional, can disable)
- 10 questions per game session

**Game UI:**
- Reference shape: Top center, labeled "Reference"
- 4 comparison shapes: 2×2 grid below, labeled A, B, C, D
- Tap shape → Submit answer immediately
- Feedback: Green border (correct) or red border (incorrect)
- Auto-advances after 1.5 seconds

**Difficulty Levels:**
- Easy: Simple shapes (L, T), 90° rotations only
- Medium: Irregular shapes, any rotation (90°, 180°, 270°)
- Hard: Complex shapes, rotation + mirroring

**Game Completion:**
- 10 questions answered → Show results
- Stats: "8/10 correct (80%)", "Avg time: 4.2s"
- Encouragement: "Strong spatial skills!" or "Keep practicing mental rotation!"
- Actions: "Play Again", "Try Harder Difficulty", "Back to Home"

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
- Location: `src/features/cognition/games/SpatialFlipGame.tsx`
- Reuse SVG shapes from Epic 3 (Story 3.3)
- Question generation: Pick random shape, create 3 distractors (wrong rotations/mirrors)
- Timer: Optional per-question countdown (10s default)
- Shapes: `src/features/training/content/shapes.ts` (shared with training drills)

---

### Story 6.5: Implement Memory Grid Mini-Game

**As a** user training working memory,
**I want** a visual memory game that challenges me to remember patterns,
**So that** I strengthen my short-term memory through practice.

**Acceptance Criteria:**

**Given** Spatial Flip game is complete (Story 6.4 done)
**When** I navigate to `/cognition` and select "Memory Grid"
**Then** the MemoryGridGame component renders:

**Game Mechanics:**
- 5×5 grid of squares (25 total)
- Pattern appears: 3-7 squares light up (coral color) for 2 seconds
- Pattern disappears: All squares return to gray
- User recreates pattern: Click squares to light them up
- Submit: Check if user's pattern matches original
- Score: +1 for correct, next round with longer pattern

**Game UI:**
- Grid: 60px × 60px squares, 4px gap
- Pattern display phase: Highlighted squares pulse (Framer Motion)
- Recall phase: Click to toggle square on/off
- Buttons: "Submit" (enabled when user has selected squares), "Give Up"
- Score: "Round 5, Pattern length: 7"
- Lives: 3 lives, lose 1 per incorrect answer

**Difficulty Progression:**
- Round 1-3: 3 squares (easy)
- Round 4-6: 5 squares (medium)
- Round 7+: 7+ squares (hard, increases by 1 each round)
- Game ends: When lives reach 0 or user gives up

**Game Completion:**
- Game over → Show results
- Stats: "Reached round 8", "Longest pattern: 9 squares"
- Encouragement: "Great memory!" or "Practice makes perfect!"
- Actions: "Play Again", "Back to Home"

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
- Location: `src/features/cognition/games/MemoryGridGame.tsx`
- Pattern generation: Random selection of N squares from 25-square grid
- Pattern comparison: Check if user's selected squares match original pattern exactly
- Timer: 2-second display, then hide pattern
- State: `{ pattern: number[], userSelection: number[], lives: 3, round: 1 }`
- Visual feedback: Confetti on correct answer, shake animation on incorrect

---

## Epic 7: PWA & Offline Infrastructure

**Goal:** Transform the app into a production-ready Progressive Web App (PWA) with offline support, installability, and background sync. This makes the app feel native and ensures users can practice even without internet connectivity.

**Business Value:** PWA capabilities enable mobile-like experience, offline access (crucial for consistent practice), and app installation (increases engagement and retention).

**Acceptance Criteria for Epic:**
- vite-plugin-pwa configured with service worker
- App installable on mobile and desktop
- Core functionality works offline (training, progress viewing)
- Background sync queues data when offline
- Ambient sync indicator shows connection status
- PWA audit scores >90 on all metrics

---

### Story 7.1: Configure vite-plugin-pwa and Service Worker

**As a** developer deploying the app,
**I want** service worker configured for offline support,
**So that** users can access the app even without internet connectivity.

**Acceptance Criteria:**

**Given** all previous epics are complete (Epics 1-6 done)
**When** I configure vite-plugin-pwa in the build process
**Then** the service worker is generated and registered:

**PWA Configuration** (`vite.config.ts`):
```typescript
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'robots.txt', 'icons/*.png'],
      manifest: {
        name: 'Discalculas - Dyscalculia Self-Therapy',
        short_name: 'Discalculas',
        description: 'Personalized math training for dyscalculia',
        theme_color: '#E87461',  // Coral primary
        background_color: '#FFFFFF',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icons/icon-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 }
            }
          }
        ]
      }
    })
  ]
});
```

**Caching Strategy:**
- Static assets: Cache-first (HTML, CSS, JS, images)
- API calls: Network-first with cache fallback (n/a for this app - local-only data)
- Runtime caching: Google Fonts, external resources

**Service Worker Registration:**
- Auto-registers on app load
- Shows update notification when new version available
- Toast: "New version available! Refresh to update."

**Prerequisites:** Epics 1-6 complete (all features ready for production)

**Technical Notes:**
- vite-plugin-pwa already installed in Epic 1 (Story 1.1)
- Service worker generated at build time: `npm run build`
- SW file: `dist/sw.js` (auto-generated)
- Registration: Auto-imported by plugin in `index.html`
- Test: Build production bundle, serve with `npm run preview`, verify SW registered
- Verify: Chrome DevTools > Application > Service Workers

---

### Story 7.2: Create App Icons and Manifest

**As a** user installing the PWA,
**I want** proper app icons and branding,
**So that** the app looks professional on my home screen.

**Acceptance Criteria:**

**Given** vite-plugin-pwa is configured (Story 7.1 complete)
**When** I generate app icons
**Then** all required icon sizes are created:

**Icon Requirements:**
- Base icon design: Coral (#E87461) background, white "D" symbol or flame emoji 🔥
- Icon sizes:
  - `icon-192.png` (192×192) - Android, Chrome
  - `icon-512.png` (512×512) - Android, splash screen
  - `icon-maskable.png` (512×512) - Android adaptive icon
  - `favicon.ico` (32×32, 16×16) - Browser tab
  - `apple-touch-icon.png` (180×180) - iOS home screen

**Maskable Icon:**
- Safe zone: Keep important content within center 80%
- Padding: Extra space around logo for Android adaptive icons
- Background: Solid coral color

**Manifest Updates** (`manifest.webmanifest`):
```json
{
  "name": "Discalculas - Dyscalculia Self-Therapy",
  "short_name": "Discalculas",
  "description": "Personalized math training for dyscalculia",
  "start_url": "/",
  "scope": "/",
  "display": "standalone",
  "orientation": "portrait",
  "theme_color": "#E87461",
  "background_color": "#FFFFFF",
  "icons": [...]
}
```

**And** Meta tags in `index.html`:
```html
<meta name="theme-color" content="#E87461">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
```

**Prerequisites:** Story 7.1 (PWA config complete)

**Technical Notes:**
- Icon generation tool: Use Figma/Inkscape or online PWA icon generator
- Store icons in `public/icons/` directory
- Favicon: Multi-resolution `.ico` file (16px, 32px, 48px)
- Verify: Test installation on Android (Chrome) and iOS (Safari)
- Lighthouse audit: Check "Installable" criteria passes

---

### Story 7.3: Implement Install Prompt

**As a** user visiting the app,
**I want** a prompt to install the app on my device,
**So that** I can access it easily from my home screen.

**Acceptance Criteria:**

**Given** app icons and manifest are ready (Story 7.2 complete)
**When** I visit the app on a supported browser
**Then** the InstallPrompt component appears:

**Install Prompt UI:**
- Banner at bottom of screen (non-intrusive)
- Message: "Install Discalculas for quick access and offline use"
- Actions: "Install" button (coral), "Not Now" button (gray text)
- Dismissible: X button, auto-hides after "Not Now"

**Install Trigger Logic:**
- Browser fires `beforeinstallprompt` event (Chrome, Edge, Android)
- App captures event and stores reference
- Shows prompt after user completes first session (not immediately on first visit)
- Respects user preference: Don't show again if dismissed 3 times

**Install Flow:**
1. User clicks "Install" button
2. Browser shows native install dialog
3. User confirms installation
4. App installed to home screen
5. Hide install prompt permanently (store in localStorage)

**Platform-Specific Handling:**
- **Android/Chrome**: Native prompt works automatically
- **iOS/Safari**: Custom instructions modal (Safari doesn't support `beforeinstallprompt`)
  - Message: "To install: Tap Share → Add to Home Screen"
  - Include screenshots/animation showing steps
- **Desktop**: Standard install prompt (smaller banner in corner)

**And** Installation tracking:
```typescript
await db.telemetry_logs.add({
  id: uuid(),
  timestamp: Date.now(),
  event: 'pwa_installed',
  data: {
    platform: 'android',
    promptShownCount: 2
  }
});
```

**Prerequisites:** Story 7.2 (Icons and manifest ready)

**Technical Notes:**
- Location: `src/shared/components/InstallPrompt.tsx`
- Listen for `beforeinstallprompt`: `window.addEventListener('beforeinstallprompt', ...)`
- Store event: `deferredPrompt = e; e.preventDefault();`
- Trigger install: `deferredPrompt.prompt(); const { outcome } = await deferredPrompt.userChoice;`
- localStorage key: `PWA_INSTALL_DISMISSED_COUNT`
- Detect standalone mode: `window.matchMedia('(display-mode: standalone)').matches`

---

### Story 7.4: Implement Ambient Sync Indicator

**As a** user using the app,
**I want** to see my connection status,
**So that** I know if my data will sync when I go online.

**Acceptance Criteria:**

**Given** install prompt is implemented (Story 7.3 complete)
**When** my network connection changes
**Then** the SyncIndicator component updates:

**Indicator States:**
- **Online**: Green dot, no text (default, unobtrusive)
- **Offline**: Amber dot + text "Offline - data saved locally"
- **Syncing**: Blue pulse + text "Syncing..."
- **Sync complete**: Green checkmark, auto-hides after 2 seconds

**Indicator Placement:**
- Top-right corner of screen (fixed position)
- Small, non-intrusive (24px dot + text)
- Expands on offline/syncing, collapses when online
- Z-index above content but below modals

**Connection Detection:**
- Listen to `window.addEventListener('online'/'offline')` events
- Detect: `navigator.onLine` property
- Test actual connectivity: Ping endpoint or check network state
- Handle false positives: `navigator.onLine` can be true without internet

**Background Sync Queue:**
- Queue telemetry writes when offline (store in localStorage)
- On reconnect: Flush queue to Dexie (batch write)
- Retry logic: Exponential backoff if sync fails
- Max queue size: 100 events (prevent overflow)

**And** Sync status accessible:
- AppContext tracks: `{ onlineStatus: boolean, pendingSyncCount: number }`
- Components can read sync state and react accordingly

**Prerequisites:** Story 7.3 (Install prompt complete)

**Technical Notes:**
- Location: `src/shared/components/SyncIndicator.tsx`
- Online/offline events: `window.addEventListener('online', handleOnline)`
- Sync queue: `src/services/pwa/syncQueue.ts`
  - Functions: `queueEvent(event)`, `flushQueue()`, `getQueueSize()`
- localStorage key: `SYNC_QUEUE` (array of events)
- Visual: Framer Motion pulse animation for syncing state
- Test: Use Chrome DevTools > Network > Offline to simulate offline mode

---

## Epic 8: Research Mode & Experimentation

**Goal:** Enable on-device A/B testing framework for experimenting with features, UI variations, and training parameters. This allows continuous improvement and evidence-based optimization without server-side infrastructure.

**Business Value:** Research Mode enables rapid iteration and data-driven decision-making. Developers can test hypotheses locally, and users can opt into experiments to help improve the app.

**Acceptance Criteria for Epic:**
- Experiment manager creates and manages experiments
- Variant assignment deterministic per user
- Metrics collection tracks experiment outcomes
- Baseline comparison shows experiment results
- Research Mode toggle in user settings
- Experiments tracked in Dexie `experiments` and `experiment_observations` tables

---

### Story 8.1: Build Experiment Manager

**As a** developer testing new features,
**I want** an experiment management system,
**So that** I can run A/B tests on-device without backend infrastructure.

**Acceptance Criteria:**

**Given** PWA infrastructure is complete (Epic 7 done)
**When** I define a new experiment
**Then** the ExperimentManager handles experiment lifecycle:

**Experiment Definition** (`src/services/research/experiments.ts`):
```typescript
const EXPERIMENTS: Experiment[] = [
  {
    id: 'drill-timer-visibility',
    name: 'Drill Timer Visibility',
    description: 'Test if showing/hiding timer affects accuracy',
    status: 'active',
    startDate: '2025-11-09',
    endDate: '2025-12-09',
    variants: [
      { id: 'control', name: 'Timer Visible', weight: 0.5 },
      { id: 'treatment', name: 'Timer Hidden', weight: 0.5 }
    ],
    metrics: ['drill_accuracy', 'drill_speed', 'user_confidence']
  },
  {
    id: 'confidence-scale',
    name: 'Confidence Prompt Scale',
    description: 'Test 5-point vs 3-point confidence scale',
    status: 'draft',
    variants: [
      { id: 'control', name: '5-point (current)', weight: 0.5 },
      { id: 'treatment', name: '3-point (simplified)', weight: 0.5 }
    ],
    metrics: ['prompt_completion_rate', 'confidence_change']
  }
];
```

**Experiment Manager** (`src/services/research/experimentManager.ts`):
- `getActiveExperiments() => Experiment[]` - Returns active experiments
- `assignVariant(experimentId, userId) => Variant` - Assigns user to variant (deterministic)
- `getAssignedVariant(experimentId) => Variant | null` - Gets user's assigned variant
- `recordObservation(experimentId, metric, value) => void` - Records experiment outcome

**Variant Assignment:**
- Deterministic: Based on hash of (userId + experimentId)
- Consistent: Same user always gets same variant for same experiment
- Weighted: Respects variant weights (e.g., 50/50 split)

**Storage:**
```typescript
await db.experiments.add({
  id: experimentId,
  variantId: assignedVariant.id,
  assignedAt: Date.now(),
  status: 'active'
});
```

**Prerequisites:** Epic 7 complete (PWA ready for production)

**Technical Notes:**
- Location: `src/services/research/experimentManager.ts`
- User ID: Generate UUID on first launch, store in localStorage (`USER_ID`)
- Hash function: Simple hash (`userId.charCodeAt() % 100 < variant.weight * 100`)
- Active experiments: Only experiments with `status: 'active'` and within date range
- Test: Verify same user gets consistent variant across sessions

---

### Story 8.2: Implement Variant Assignment and Feature Flags

**As a** developer implementing experiment variants,
**I want** feature flags that conditionally render UI based on variant assignment,
**So that** I can test different implementations easily.

**Acceptance Criteria:**

**Given** experiment manager is operational (Story 8.1 complete)
**When** I use the feature flag hook
**Then** components render variant-specific UI:

**Feature Flag Hook** (`src/services/research/useExperiment.ts`):
```typescript
export function useExperiment(experimentId: string) {
  const variant = experimentManager.getAssignedVariant(experimentId);

  return {
    variant: variant?.id ?? 'control',
    isControl: variant?.id === 'control',
    isTreatment: variant?.id === 'treatment',
    recordMetric: (metric, value) => experimentManager.recordObservation(experimentId, metric, value)
  };
}
```

**Usage Example:**
```typescript
function NumberLineDrill() {
  const { variant, recordMetric } = useExperiment('drill-timer-visibility');
  const showTimer = variant === 'control';  // Control: show timer, Treatment: hide timer

  return (
    <div>
      {showTimer && <Timer />}
      <NumberLine onComplete={(result) => {
        recordMetric('drill_accuracy', result.accuracy);
        recordMetric('drill_speed', result.timeToAnswer);
      }} />
    </div>
  );
}
```

**Feature Flag Patterns:**
- **UI Visibility**: Show/hide components based on variant
- **Parameter Tuning**: Adjust values (e.g., timer duration, tolerance)
- **Flow Changes**: Alter user flows (e.g., skip vs require steps)
- **Design Variations**: Test different colors, layouts, copy

**And** Experiment guard:
- If Research Mode disabled: Always return 'control' variant
- If experiment inactive/expired: Return 'control' variant
- Fallback: Default to control if any error

**Prerequisites:** Story 8.1 (Experiment manager complete)

**Technical Notes:**
- Hook location: `src/services/research/useExperiment.ts`
- React hook: Uses `useState` to cache variant assignment
- Assignment happens once per user per experiment (stored in Dexie)
- Experiment status check: Verify `status === 'active'` and within date range
- Test: Verify control vs treatment render different UI

---

### Story 8.3: Build Experiment Results Dashboard

**As a** developer analyzing experiment results,
**I want** a dashboard showing experiment metrics and comparisons,
**So that** I can determine which variant performs better.

**Acceptance Criteria:**

**Given** variant assignment is operational (Story 8.2 complete)
**When** I navigate to `/research` (dev-only route)
**Then** the ExperimentDashboard displays all experiments:

**Dashboard Layout:**
- List of experiments (active first, then draft, then completed)
- Each experiment card shows:
  - Name and description
  - Status badge (active/draft/completed)
  - Variant split: "50% Control, 50% Treatment"
  - Observation count: "127 observations"
  - "View Results" button

**Experiment Results View:**
- Metric comparison table:
  | Metric | Control | Treatment | Difference | Significance |
  |--------|---------|-----------|------------|--------------|
  | Accuracy | 82.3% | 85.7% | +3.4% | 🟢 |
  | Speed | 3.2s | 2.9s | -0.3s | 🟢 |
  | Confidence | +1.8 | +2.1 | +0.3 | 🟡 |

- Visualization: Bar charts comparing variants (Recharts)
- Sample size: "63 control, 64 treatment"
- Duration: "Active for 15 days"

**Statistical Analysis:**
- Calculate mean and standard deviation per variant
- Difference: `treatment_mean - control_mean`
- Significance indicator:
  - 🟢 Green: Large difference (>10% or >0.5 SD)
  - 🟡 Yellow: Moderate difference (5-10%)
  - 🔴 Red: Minimal difference (<5%)
- Note: This is basic analysis, not rigorous statistical testing

**And** Export results:
- "Export as CSV" button downloads experiment data
- Includes all observations with timestamps, variants, metrics

**Prerequisites:** Story 8.2 (Variant assignment complete)

**Technical Notes:**
- Location: `src/features/research/components/ExperimentDashboard.tsx`
- Dev-only route: Add route guard checking `NODE_ENV === 'development'` or Research Mode enabled
- Query observations: `db.experiment_observations.where('experimentId').equals(id).toArray()`
- Stats calculation: `src/services/research/statsCalculator.ts`
  - Functions: `calculateMean()`, `calculateStdDev()`, `compareVariants()`
- Recharts: Bar chart for metric comparisons
- Test: Seed database with mock observations, verify calculations

---

### Story 8.4: Implement Research Mode Settings Toggle

**As a** user interested in helping improve the app,
**I want** the option to enable Research Mode and participate in experiments,
**So that** I can contribute to app development.

**Acceptance Criteria:**

**Given** experiment results dashboard exists (Story 8.3 complete)
**When** I navigate to `/profile` (settings)
**Then** the Research Mode settings section appears:

**Settings UI:**
- Section header: "Research & Experiments"
- Description: "Help improve Discalculas by participating in experiments. Your data stays on your device."
- Toggle switch: "Enable Research Mode" (off by default)
- Info icon: Tooltip explaining what Research Mode does

**Research Mode Effects:**
- When enabled:
  - User is automatically enrolled in active experiments
  - Experiment metrics collected and stored locally
  - Optional: Badge on home screen "Research Mode Active"
- When disabled:
  - User sees control variants only (no experimentation)
  - No experiment data collected
  - Existing experiment assignments remain (don't reset)

**Informed Consent:**
- Modal on first toggle: "About Research Mode"
- Explanation: "You'll see experimental features that help us test improvements. All data stays on your device. You can disable this anytime."
- Actions: "Enable Research Mode" or "Cancel"

**And** Research Mode state:
- Stored in UserSettingsContext: `researchModeEnabled: boolean`
- Persisted to localStorage: `USER_SETTINGS.researchModeEnabled`
- Affects experiment manager: Checks this setting before assigning variants

**Prerequisites:** Story 8.3 (Experiment dashboard complete)

**Technical Notes:**
- Location: `src/routes/ProfileRoute.tsx` (add Research Mode section)
- Toggle: shadcn/ui Switch component
- Modal: shadcn/ui Dialog with informed consent text
- Context update: `updateSettings({ researchModeEnabled: true })`
- Experiment manager: Check `userSettings.researchModeEnabled` before variant assignment
- Default: Disabled for all users (opt-in only)

---

_For implementation: Use the `create-story` workflow to generate individual story implementation plans from this epic breakdown._

