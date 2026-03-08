# Validation Report

**Document:** docs/stories/7-1-configure-vite-plugin-pwa-and-service-worker.md
**Checklist:** _bmad/bmm/workflows/4-implementation/create-story/checklist.md
**Date:** 2026-02-28

## Summary
- Overall: 22/25 passed (88%)
- Critical Issues: 2
- Enhancements: 3

## Section Results

### 2.1 Epics and Stories Analysis
Pass Rate: 5/5 (100%)

[✓] Epic objectives and business value extracted
Evidence: Story file references Epic 7 goal (PWA, offline, installability) in Architecture section (line 77-82)

[✓] All stories in epic identified for cross-story context
Evidence: Gotcha #4 (line 206): "Icon files don't exist yet — Story 7.2 creates them" shows cross-story awareness

[✓] Story acceptance criteria extracted from epic spec
Evidence: 11 ACs on lines 13-23 match epics.md Story 7.1 spec verbatim

[✓] Technical requirements and constraints captured
Evidence: Dev Notes section (lines 73-218) covers architecture, implementation details, testing, gotchas

[✓] Dependencies on other stories/epics identified
Evidence: AC references Story 7.2 dependency for icon files (line 15, 206)

### 2.2 Architecture Deep-Dive
Pass Rate: 4/5 (80%)

[✓] Technical stack with versions documented
Evidence: Line 77: "vite-plugin-pwa@1.1.0 already installed"

[✓] Code structure and organization patterns specified
Evidence: Lines 211-218: Project Structure Notes with exact file paths

[✓] Testing standards and frameworks included
Evidence: Lines 161-198: Complete mock patterns for virtual:pwa-register/react and toast

[✓] Integration patterns documented
Evidence: Lines 80-81: Toaster integration via main.tsx, toast() import path

[⚠] PARTIAL — Sonner `toast()` action type mismatch risk
Evidence: Story specifies `action: { label: 'Refresh', onClick: ... }` (line 145). Validation confirms Sonner's `Action` type uses `label: React.ReactNode` and `onClick: (event) => void` which matches. However, the story does NOT mention that Sonner also accepts `action?: Action | React.ReactNode` — if the dev agent passes a ReactNode instead of Action object, the onClick won't fire. Story should clarify this is an `Action` object, not ReactNode.
Impact: Dev agent could accidentally pass wrong action format. LOW risk since code example is correct.

### 2.3 Previous Story Intelligence
Pass Rate: 3/3 (100%)

[✓] Dev notes and learnings from previous story extracted
Evidence: Lines 201-209: 7 gotchas referencing patterns from previous stories (useEffect timing, mock cleanup, deprecated syntax)

[✓] Code review patterns applied proactively
Evidence: Gotcha #1 (line 203): "Do NOT create ReloadPrompt" prevents common web tutorial pattern; Gotcha #7 (line 209): useEffect timing from project-context.md

[✓] File patterns and naming conventions documented
Evidence: Lines 211-218: Consistent naming (useServiceWorker.ts, .test.ts, pwa.d.ts)

### 2.4 Git History Analysis
Pass Rate: 1/1 (100%)

[✓] Recent work patterns analyzed
Evidence: References section (line 227) cites Story 6.5 code review patterns

### 2.5 Latest Technical Research
Pass Rate: 2/2 (100%)

[✓] Library versions and API documented
Evidence: Line 77: vite-plugin-pwa@1.1.0, Lines 124-152: useRegisterSW hook API with destructured return type

[✓] Best practices included
Evidence: Gotcha #6 (line 208): `purpose: 'any maskable'` deprecated, separate into distinct entries per web standards

### 3.1 Reinvention Prevention
Pass Rate: 2/2 (100%)

[✓] Existing solutions identified for reuse
Evidence: Lines 80-81: Existing Sonner toast, existing Toaster mount — no new toast system needed

[✓] Code reuse explicitly stated
Evidence: Gotcha #1 (line 203): "Do NOT create a separate ReloadPrompt component" prevents reinventing

### 3.2 Technical Specification Disasters
Pass Rate: 2/3 (67%)

[✓] Library versions and compatibility verified
Evidence: Line 77: Version explicitly stated, line 204: registerType kept per spec not web research suggestion

[✗] FAIL — Missing `tsconfig.json` update guidance
Evidence: Validation found tsconfig.json has `"types": ["vite/client", "vitest/globals"]` but does NOT include PWA types. Story mentions creating `src/pwa.d.ts` with `/// <reference types="vite-plugin-pwa/react" />` (line 157-158) BUT does not verify whether this triple-slash directive alone is sufficient or if `tsconfig.json` types array also needs updating. If tsc doesn't pick up the .d.ts file, TypeScript compilation will fail on `virtual:pwa-register/react` import.
Impact: **CRITICAL** — Could cause `npx tsc --noEmit` to fail (AC #10), blocking story completion. The dev agent may waste time debugging TypeScript resolution.

[✓] API contracts specified correctly
Evidence: Lines 129-152: Hook API with exact destructured types matches vite-plugin-pwa's useRegisterSW signature

### 3.3 File Structure Disasters
Pass Rate: 2/2 (100%)

[✓] File locations follow project conventions
Evidence: Lines 211-218: Hook in services/pwa/, test alongside, types in src root

[✓] Integration points specified
Evidence: Line 218: "App.tsx modification (add useServiceWorker() call)"

### 3.4 Regression Disasters
Pass Rate: 2/2 (100%)

[✓] Breaking changes prevented
Evidence: AC #11 (line 23): "All existing tests pass — npm test shows no regressions (1853+ tests)"

[✓] UX requirements specified
Evidence: AC #6 (line 18): Exact toast message specified, Gotcha #7 confirms duration: Infinity for user interaction time

### 3.5 Implementation Disasters
Pass Rate: 2/2 (100%)

[✓] Acceptance criteria are specific and verifiable
Evidence: 11 ACs with exact values (color codes, strings, glob patterns, test counts)

[✓] Scope boundaries defined
Evidence: Gotchas 1-3 (lines 203-205): Explicit "Do NOT" instructions prevent scope creep

### 4 LLM-Dev-Agent Optimization
Pass Rate: 2/3 (67%)

[✓] Code examples are actionable and copy-pasteable
Evidence: Lines 87-120 (config), 124-152 (hook), 164-198 (test mocks) — all production-ready

[✓] Structure is scannable with clear headings
Evidence: Architecture, Key Implementation Details, Testing Approach, Gotchas, Project Structure, References — well-organized

[⚠] PARTIAL — Missing explicit guidance on test file coverage exclusion
Evidence: Story specifies tests must achieve 100% coverage (Gotcha #5, line 207). However, the coverage exclude list in vite.config.ts is `['tests/**', '**/*.test.tsx', '**/*.config.ts', '**/index.ts']`. The new test file is `useServiceWorker.test.ts` (not .test.tsx), which WOULD be excluded by the glob pattern `**/*.test.tsx` only if it had .tsx extension. Since it's .ts, need to verify coverage exclude also covers `**/*.test.ts`. Current exclude pattern does NOT cover .ts test files.
Impact: Build could fail if the test file itself gets included in coverage calculations and has uncovered branches. Dev agent should verify this.

## Failed Items

### [✗] Missing tsconfig.json update guidance (Section 3.2)
**Recommendation:** Add a subtask or note clarifying whether `src/pwa.d.ts` with `/// <reference types="vite-plugin-pwa/react" />` is auto-discovered by tsc, or whether `tsconfig.json` needs `"include": ["src/pwa.d.ts"]` or adding `"vite-plugin-pwa/react"` to the `types` array. The current tsconfig has `"include": ["src"]` which should auto-include `src/pwa.d.ts`, but this should be explicitly stated to prevent debugging.

### [✗] Coverage exclude pattern may not cover .test.ts files (Section 4)
**Recommendation:** Verify that the vite.config.ts coverage exclude pattern `'**/*.test.tsx'` also covers `.test.ts` files. If not, either rename the test to `.test.tsx` or add `'**/*.test.ts'` to the exclude array. This could cause a false coverage failure.

## Partial Items

### [⚠] Sonner action type clarity (Section 2.2)
**What's missing:** Explicit note that the `action` option must be an `Action` object `{ label: string, onClick: fn }`, not a React component. The code example is correct but the textual AC #6 just says "action button" without clarifying the type.

### [⚠] Coverage exclude pattern for .ts test files (Section 4)
**What's missing:** Explicit check that `**/*.test.ts` files are excluded from coverage calculations.

## Recommendations

### 1. Must Fix (Critical)
1. **Add tsconfig.json verification note** — Clarify in Dev Notes that `src/pwa.d.ts` is auto-discovered because `tsconfig.json` has `"include": ["src"]`, so no tsconfig changes needed. This prevents the dev agent from wasting time on TypeScript resolution errors.

2. **Verify coverage exclude pattern** — Check if `**/*.test.tsx` also catches `.test.ts` files in the Vitest coverage config. If not, add subtask to extend the exclude pattern to `['**/*.test.tsx', '**/*.test.ts']` or use `'**/*.test.{ts,tsx}'`.

### 2. Should Improve (Enhancement)
3. **Add `fonts.gstatic.com` runtime caching** — While the epic spec only mentions `fonts.googleapis.com`, the CSS responses from googleapis.com reference font files hosted on `fonts.gstatic.com`. Without caching gstatic, fonts may fail to load offline even though the CSS is cached. Consider adding a second runtime caching entry for `fonts.gstatic.com` with CacheFirst strategy.

4. **Clarify useServiceWorker integration location in App.tsx** — Story says "call useServiceWorker() at top level" but App.tsx wraps everything in `<ErrorBoundary>`. The hook should be called INSIDE the function body before the return. Add a note that the hook must go before the JSX return, not inside a provider.

5. **Add test for cleanup/unmount** — Story has 6 test cases but none test that the hook cleans up properly when the component unmounts (no stale toast after unmount). With `duration: Infinity`, the toast persists — verify this is intentional and doesn't cause issues on route changes.

### 3. Consider (Nice to Have)
6. **Add `cacheableResponse` to Google Fonts caching** — The workbox runtime caching for Google Fonts doesn't include `cacheableResponse: { statuses: [0, 200] }`. Adding this ensures only successful responses are cached (prevents caching error responses). The `0` status handles opaque responses from CORS.
