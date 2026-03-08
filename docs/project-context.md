# Project Context - Discalculas

Critical rules, patterns, and conventions that AI agents must follow when implementing code.

---

## Triple-Check Protocol

Every story implementation MUST follow this verification sequence before marking complete:

1. **Implement** - Write code and tests following red-green-refactor cycle
2. **Visual Verify** - Run `npm run dev`, open in browser, verify every AC visually
3. **Edge Case Verify** - Test empty states, error states, boundary values in the running app

This protocol is **mandatory** and cannot be skipped. The dev-story workflow enforces this as Step 9.5.

**Why:** Epic 4 and Epic 5 retrospectives identified that dev agents consistently skip visual verification, causing HIGH-severity bugs caught only in code review (4/6 stories in Epic 5).

---

## Testing Patterns & Gotchas

### useEffect Timing
RTL tests with components using `useEffect` require `waitFor` blocks:
```tsx
// WRONG - test reads stale state
render(<MyComponent />);
expect(screen.getByText('loaded')).toBeInTheDocument();

// CORRECT - wait for effect to complete
render(<MyComponent />);
await waitFor(() => {
  expect(screen.getByText('loaded')).toBeInTheDocument();
});
```

### Mock Cleanup
- Use `vi.clearAllMocks()` in `afterEach` when you need mock factories preserved
- `vi.restoreAllMocks()` clears mock factories — only use when you want to fully reset
- Always clean up fake timers: `vi.useRealTimers()` in `afterEach`

### Duplicate Text in DOM
When multiple elements contain the same text:
```tsx
// WRONG - throws "found multiple elements"
screen.getByText('Start');

// CORRECT - use getAllByText with index
screen.getAllByText('Start')[0];
// or use a more specific query
screen.getByRole('button', { name: 'Start' });
```

### Date/Time Handling
- Store all dates as UTC ISO 8601 strings internally
- `parseISO()` from date-fns returns UTC — be careful with local timezone display
- Convert to local timezone only at the display layer
- Use `vi.useFakeTimers()` and `vi.setSystemTime()` for deterministic date tests

### Mock Patterns
```tsx
// localStorage mock
const mockStorage: Record<string, string> = {};
vi.spyOn(Storage.prototype, 'getItem').mockImplementation(key => mockStorage[key] ?? null);
vi.spyOn(Storage.prototype, 'setItem').mockImplementation((key, val) => { mockStorage[key] = val; });

// Framer Motion - disable animations in tests
vi.mock('framer-motion', () => ({
  motion: { div: 'div', span: 'span', button: 'button' },
  AnimatePresence: ({ children }: any) => children,
}));
```

---

## Coding Conventions

### Architecture
- **Pure functional services** — No side effects in calculation/formatting functions (e.g., `insightsEngine`, `confidenceCalculator`, `csvFormatter`)
- **Feature-based folder structure** — `src/features/{feature}/components/`, `hooks/`, `services/`, `utils/`
- **Local-first storage** — Dexie IndexedDB (`DiscalculasDB`), no server calls
- **Session IDs** — Always numeric (Dexie auto-increment), never UUID strings

### UI Components
- **shadcn/ui** — Import from `@/shared/components/ui/*` (e.g., `@/shared/components/ui/button`)
- **44px minimum touch targets** — All interactive elements for accessibility
- **`prefers-reduced-motion` support** — All Framer Motion animations must respect this
- **WCAG 2.1 AA compliance** — `aria-label`, `role="img"`, `sr-only` text on all custom components

### TypeScript
- Run `npx tsc --noEmit` to verify type safety before completing any story
- Use `as const` for literal type arrays
- Prefer explicit types over `any` — use `Record<string, unknown>` instead of `Record<string, any>`

### Testing
- **Framework:** Vitest + React Testing Library (RTL) for unit/component tests
- **E2E:** Playwright across Chromium, Firefox, WebKit (375x667 mobile viewport)
- **Pattern:** AAA (Arrange, Act, Assert)
- **Coverage:** Every story should include unit tests for business logic and component tests for UI behavior

---

## Known Patterns from Past Epics

### Recharts
- RadarChart renders SVG `<path>` elements (not `<polygon>`)
- Use `aria-label` parsing for testing chart values, not SVG inspection
- Responsive sizing via `ResponsiveContainer`

### Playwright (E2E)
- WebKit: `keyboard.press()` unreliable for divs with `onKeyDown` — use button clicks instead
- Resource contention: Use `--workers=2` for cross-browser parallel tests
- Mobile viewport: Set `{ width: 375, height: 667 }` in Playwright config

### Framer Motion
- Always wrap animated components with `prefers-reduced-motion` check
- In tests, mock `framer-motion` to prevent animation timing issues

---

## Data Model Quick Reference

| Table | Primary Key | Key Foreign Keys |
|-------|------------|-----------------|
| sessions | id (auto-increment number) | — |
| drillResults | id (auto-increment number) | sessionId → sessions.id |
| magicMinuteSessions | id (auto-increment number) | sessionId → sessions.id |
| difficultyHistory | id (auto-increment number) | sessionId → sessions.id |

Session modules: `"assessment"`, `"training"`, `"cognition"`, `"coach"`
Drill modules: `"number_line"`, `"spatial_rotation"`, `"math_operations"`
