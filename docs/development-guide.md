# Development Guide

The legacy single-file SPA now lives inside `legacy-spa/`. The active codebase runs on Vite 7, React 19, and strict TypeScript with Tailwind CSS v4 and shadcn/ui. Every command below assumes the repository root (`discalculas/`).

## Prerequisites

- Node.js 20.x (use `nvm use` – `.nvmrc` pins the required major)
- npm ^10 (bundled with Node 20)
- Modern Chromium/WebKit/Firefox browser with IndexedDB + Service Worker support
- Optional: Playwright browsers for E2E (`npx playwright install` when you are ready to author tests)

## Setup

```bash
git clone <repo-url>
cd discalculas
nvm use          # ensures Node 20.x
npm install      # installs runtime + tooling dependencies and generates package-lock.json
```

The install step pulls in Vite, React, Dexie, shadcn/ui CLI, Vitest, Playwright, and the Tailwind v4 toolchain so that later stories can immediately scaffold features without re-running bootstrap commands.

## Running the Vite Dev Server (AC‑3)

```bash
npm run dev -- --host 0.0.0.0 --port 5173
```

- Vite prints the local URL (http://127.0.0.1:5173 by default) and enables Fast Refresh + HMR.
- Stop the server with `Ctrl+C`. If you need headless verification in CI, spawn the command in the background and collect the log (see `dev-server` log referenced in Story 1.1 Dev Notes).

## Building + Previewing Production Assets (AC‑4)

```bash
npm run build        # runs `tsc --noEmit` then `vite build` with the VitePWA plugin
npm run preview      # serves the contents of dist/ to double-check production bundles
```

The build step emits `dist/manifest.webmanifest`, `dist/sw.js`, and hashed JS/CSS chunks plus PWA helper files so later PWA stories can extend the manifest rather than wiring it from scratch.

## Testing + Type Safety Baselines (AC‑5)

```bash
npx tsc --noEmit                                # strict TS config validation
npm run test -- --passWithNoTests --coverage    # Vitest + RTL (coverage gate = 100%)
npm run test:e2e                                # Playwright (kept for future stories)
```

- `vite.config.ts` enforces 100% statements/branches/functions/lines via c8 when suites exist.
- `passWithNoTests` is enabled so Story 1.1 can prove the harness boots clean before specs land.
- Story 1.6 and beyond will replace the placeholder tests with real component + service suites; keep using the AAA (Arrange/Act/Assert) structure from the tech spec.

## Directory Notes

- `src/` currently contains `App.tsx`, `main.tsx`, `index.css`, and shadcn's utility helpers. Story 1.3 introduces the feature-based folders (assessment/, training/, etc.) but the `@/` alias is already wired via `tsconfig.json` and `vite.config.ts`.
- `legacy-spa/` archives the original `index.html`, `scripts/main.js`, and `styles/styles.css`. You can run the historical build by serving that directory separately if you need to compare behavior.
- `docs/` stores PRD, architecture, tech specs, and BMAD workflow outputs. Keep this folder in sync whenever you add new developer notes or coverage evidence.

## Deployment

```bash
npm run build
rsync -av dist/ <host>:/var/www/discalculas
```

Any static host (Netlify, Vercel, GitHub Pages, S3, Azure Static Web Apps) can serve the generated `dist/` folder. The VitePWA plugin already registers an `autoUpdate` service worker so you do **not** need an extra workbox step.

## Legacy Prototype Access

If you still need the former plain-JS wizard for reference or regression testing:

```bash
cd legacy-spa
npx serve . -l 4173
```

All localStorage behavior remains untouched, so you can keep exporting/importing the old `ns-suite-v2` payload for historical comparisons while new React modules roll out incrementally.
