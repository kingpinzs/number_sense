### Story 1.3: Create Feature-Based Folder Structure

**As a** developer,
**I want** the complete feature-based folder structure from the architecture spec,
**So that** I know exactly where to place code for each epic and AI agents have clear boundaries.

**Acceptance Criteria:**

**Given** the project has Tailwind configured (Story 1.2 complete)
**When** I create the folder structure
**Then** the following directories exist with index placeholder files:

* `src/features/assessment/` (components/, hooks/, types/, index.ts)
* `src/features/training/` (components/, drills/, hooks/, types/, index.ts)
* `src/features/coach/` (components/, hooks/, content/, index.ts)
* `src/features/cognition/` (components/, games/, index.ts)
* `src/features/progress/` (components/, hooks/, types/, index.ts)
* `src/features/magic-minute/` (components/, hooks/, index.ts)
* `src/shared/` (components/, components/ui/, hooks/, utils/, types/)
* `src/services/` (storage/, telemetry/, pwa/, adaptiveDifficulty/, research/)
* `src/context/` (AppContext.tsx, SessionContext.tsx, UserSettingsContext.tsx)
* `src/routes/` (Home.tsx, AssessmentRoute.tsx, TrainingRoute.tsx, ProgressRoute.tsx, ProfileRoute.tsx)
* `tests/e2e/` and `tests/fixtures/`

**And** Each `index.ts` exports a placeholder comment: `// Public API for [feature-name]`
**And** `src/shared/utils/constants.ts` includes BREAKPOINTS constant from architecture
**And** All folder names match architecture.md exactly (PascalCase for components, camelCase for services)

**Prerequisites:** Story 1.2 (Tailwind configured)

**Technical Notes:**

* Follow [architecture.md](./architecture.md#project-structure) exactly
* Create empty `.gitkeep` files in empty directories for git tracking
* Add README.md in each feature folder explaining its purpose
* Verify import paths work: `import { Button } from '@/shared/components/ui/button'`

***
