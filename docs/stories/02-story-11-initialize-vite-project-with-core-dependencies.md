### Story 1.1: Initialize Vite Project with Core Dependencies

**As a** developer,
**I want** a modern Vite + React + TypeScript project initialized with all core dependencies,
**So that** I have a fast, type-safe development environment ready for feature implementation.

**Acceptance Criteria:**

**Given** I am starting a new development phase for Discalculas
**When** I run the project initialization commands from architecture.md
**Then** the following are successfully installed and configured:

* Vite 7.2 with React 19.2 and TypeScript 5.9
* vite-plugin-pwa 1.1.0 for PWA capabilities
* Dexie 4.2.1 and dexie-react-hooks 4.2.0 for storage
* React Router 7.9.5 for routing
* Recharts 3.3.0 for charts
* Framer Motion 12.23.24 for animations
* React Hook Form 7.66.0 for forms
* date-fns 4.0 for date handling
* Tailwind CSS v4 + postcss + autoprefixer
* Vitest 4.0, @testing-library/react 16.3.0, @testing-library/dom, Playwright 1.56.1

**And** `npm run dev` starts the development server successfully on port 5173
**And** `npm run build` creates optimized production build in `dist/` folder
**And** TypeScript compilation shows no errors

**Prerequisites:** None (first story)

**Technical Notes:**

* Follow exact commands from [architecture.md](./architecture.md#project-initialization)
* Use `npm create vite@latest discalculas -- --template react-ts`
* Verify all package versions match architecture spec (verified 2025-11-09)
* Configure `vite.config.ts` with `@/` path alias: `alias: { '@': path.resolve(__dirname, './src') }`
* Set up `tsconfig.json` with strict mode and path mappings
* Initialize git repository if not already present

***
