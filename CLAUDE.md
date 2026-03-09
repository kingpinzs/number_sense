# Discalculas - Project Context

Offline-first PWA for dyscalculia self-therapy. Built with React 19 + TypeScript + Vite + Dexie (IndexedDB).

## Architecture

- **Feature-based structure**: `src/features/{assessment,training,progress,coach,cognition,magic-minute,research}`
- **Services layer**: `src/services/{storage,assessment,training,adaptiveDifficulty,pwa,research,telemetry}`
- **State**: React Context + useReducer (AppContext, SessionContext, UserSettingsContext)
- **Data**: Dexie for IndexedDB (8 tables), localStorage for settings/streak
- **Styling**: Tailwind CSS v4 + shadcn/ui components + Framer Motion
- **Routing**: React Router v7 with lazy-loaded routes

## Key Conventions

- Path alias: `@/` maps to `src/`
- All routes use default exports (required for React.lazy)
- shadcn/ui components live in `src/shared/components/ui/`
- Custom hooks follow `use{Feature}` naming in feature `hooks/` dirs
- Tests co-located with source files (`*.test.ts(x)`)
- E2E tests in `tests/e2e/*.spec.ts` (Playwright)
- Mobile-first design: primary breakpoint 320px (sm), then 768px (md), 1024px (lg)
- Touch targets: minimum 44px height
- Theme: `data-theme="dark"` on `<html>` for dark mode, CSS custom properties

## Quality Gates

- TypeScript strict mode — zero errors required
- ESLint with `--max-warnings=0`
- Vitest coverage thresholds: 100% (statements, branches, functions, lines)
- Playwright E2E across Chromium, Firefox, WebKit (mobile viewport 375x667)

## Commands

- `npm run dev` — Start dev server
- `npm run build` — Type-check + production build
- `npm test` — Type-check + run all unit/integration tests
- `npm run test:quick` — Tests without type-check
- `npm run test:e2e` — Playwright E2E tests
- `npm run lint` — ESLint check

## Database

Dexie v2 schema with 8 tables: sessions, assessments, drill_results, telemetry_logs, magic_minute_sessions, difficulty_history, experiments, experiment_observations.

DB maintenance (cleanOldSessions) runs on AppContext mount — 365-day retention.

## Important Patterns

- Assessment generates training plan weights stored in Dexie → drills use weights for selection
- Adaptive difficulty engine adjusts after each session (one adjustment per session max)
- Magic Minute triggers from mistake patterns detected in last 10 drills
- Streak tracked in localStorage, milestones at 3/7/14/30/100 days
- Research mode: on-device A/B testing with deterministic hash-based variant assignment
