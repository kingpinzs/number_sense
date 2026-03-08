# Story 7.4: Implement Ambient Sync Indicator

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a user using the app,
I want to see my connection status,
so that I know if my data will sync when I go online.

## Acceptance Criteria

1. **SyncIndicator renders in fixed top-right position** — Always present in the layout at `fixed top-4 right-4 z-30` (above page content, below modals at z-50, below BottomNav at z-9999 which doesn't conflict since SyncIndicator is top-right)
2. **Online state** — Small green dot (16px, `w-4 h-4`, `bg-green-500 rounded-full`), no text, fully collapsed and unobtrusive. This is the default resting state when connected and no sync is pending.
3. **Offline state** — Expanded: amber dot + text "Offline - data saved locally". Triggered when `AppContext.state.onlineStatus` transitions to `false`.
4. **Syncing state** — Expanded: blue pulsing dot (Framer Motion pulse animation) + text "Syncing...". Triggered when `flushQueue()` is actively running after reconnect.
5. **Sync-complete state** — Expanded: green checkmark icon (Lucide `CheckCircle2`) + brief text, auto-hides back to online state after exactly **2000ms** via `setTimeout`. Triggered when `flushQueue()` resolves successfully.
6. **Framer Motion animation** — Use `AnimatePresence` + `motion.div` for text expand/collapse. Respect `useReducedMotion()` — skip animations when true. Entry: `{ opacity: 0, width: 0 }` → `{ opacity: 1, width: 'auto' }`. Exit: reverse.
7. **AppContext extended** — Add `pendingSyncCount: number` (initialized to `0`) to `AppState`. Add `SET_PENDING_SYNC_COUNT` action to `AppAction`. Add `setPendingSyncCount(count: number)` convenience method to `AppContextValue`. Provider reads initial queue size from `getQueueSize()` on mount.
8. **Sync queue service** (`src/services/pwa/syncQueue.ts`) — Pure functions (no React): `queueEvent(event: TelemetryEventPayload): void`, `flushQueue(): Promise<number>` (returns flushed count, imports `db` directly), `getQueueSize(): number`, `clearQueue(): void`. Max queue size: 100 events — if full, oldest event is dropped.
9. **Auto-flush on reconnect or startup** — The `useSyncIndicator` hook watches `AppContext.state.onlineStatus`. It flushes in two scenarios: (a) `false → true` transition AND queue is non-empty, (b) app mounts while already online AND queue contains events from a prior offline session. Both paths transition through `syncing` → `sync-complete` states.
10. **SYNC_QUEUE localStorage key** — Add `SYNC_QUEUE: 'discalculas:syncQueue'` to `STORAGE_KEYS` in `src/services/storage/localStorage.ts`.
11. **Accessibility** — `role="status"` on the indicator container, `aria-live="polite"` for state change announcements, `aria-label` describing current connection state. All interactive elements (if any) meet 44px touch target minimum.
12. **TypeScript clean** — `npx tsc --noEmit` returns zero errors.
13. **All existing tests pass** — `npm test` shows no regressions (1890+ tests passing).

## Tasks / Subtasks

- [x] **Task 1: Add SYNC_QUEUE storage key** (AC: #10)
  - [x] 1.1 Open `src/services/storage/localStorage.ts`
  - [x] 1.2 Add `// Story 7.4: PWA sync queue` comment and `SYNC_QUEUE: 'discalculas:syncQueue'` to `STORAGE_KEYS` object

- [x] **Task 2: Extend AppContext with pendingSyncCount** (AC: #7)
  - [x] 2.1 Open `src/context/AppContext.tsx`
  - [x] 2.2 Add `pendingSyncCount: number` to `AppState` interface (default `0`)
  - [x] 2.3 Add `| { type: 'SET_PENDING_SYNC_COUNT'; payload: number }` to `AppAction` union
  - [x] 2.4 Add `case 'SET_PENDING_SYNC_COUNT': return { ...state, pendingSyncCount: action.payload };` to appReducer
  - [x] 2.5 Initialize `pendingSyncCount: 0` in `createInitialState()` (will be updated after syncQueue loads)
  - [x] 2.6 Add `setPendingSyncCount(count: number) => void` to `AppContextValue` interface
  - [x] 2.7 Add the convenience method implementation in AppProvider
  - [x] 2.8 Include `setPendingSyncCount` in `value` object returned by AppProvider

- [x] **Task 3: Create syncQueue service** (AC: #8, #10)
  - [x] 3.1 Create `src/services/pwa/syncQueue.ts`
  - [x] 3.2 Import `STORAGE_KEYS` and the `db` (Dexie) and telemetry schema types
  - [x] 3.3 Define `TelemetryEventPayload` interface: `{ timestamp: string; event: string; module: string; data: Record<string, unknown>; userId: string }`
  - [x] 3.4 Implement `getQueueSize(): number` — parse `localStorage.getItem(STORAGE_KEYS.SYNC_QUEUE)`, return array length (0 if null/empty/invalid)
  - [x] 3.5 Implement `queueEvent(event: TelemetryEventPayload): void`: read queue, enforce 100-cap with FIFO drop, write back
  - [x] 3.6 Implement `flushQueue(): Promise<number>` — uses `db.telemetry_logs.bulkAdd()` (atomic), clears queue on success, throws on failure
  - [x] 3.7 Implement `clearQueue(): void` — `localStorage.removeItem(STORAGE_KEYS.SYNC_QUEUE)`

- [x] **Task 4: Create useSyncIndicator hook** (AC: #3, #4, #5, #9)
  - [x] 4.1 Create `src/services/pwa/useSyncIndicator.ts`
  - [x] 4.2 Import `useApp` from `@/context/AppContext`, `useState`, `useEffect`, `useCallback`, `useRef` from React
  - [x] 4.3 Import `flushQueue`, `getQueueSize` from `./syncQueue`
  - [x] 4.4 Define `SyncStatus = 'idle' | 'syncing' | 'complete'` type
  - [x] 4.5 Hook returns: `{ isOnline: boolean, syncStatus: SyncStatus, pendingSyncCount: number }`
  - [x] 4.6 Read `isOnline` from `useApp().state.onlineStatus` (DO NOT add new event listeners — AppContext already manages them)
  - [x] 4.7 Read `pendingSyncCount` from `useApp().state.pendingSyncCount`
  - [x] 4.8 Track previous `isOnline` value with `useRef<boolean>` to detect `false → true` transition
  - [x] 4.9 When `isOnline` transitions `false → true` and queue is non-empty: syncing → complete → idle (after 2000ms)
  - [x] 4.10 On mount: read `getQueueSize()` and dispatch `SET_PENDING_SYNC_COUNT(count)` to hydrate AppContext

- [x] **Task 5: Create SyncIndicator component** (AC: #1, #2, #3, #4, #5, #6, #11)
  - [x] 5.1 Create `src/shared/components/SyncIndicator.tsx`
  - [x] 5.2 Import `useSyncIndicator`, `useReducedMotion`, `motion`, `AnimatePresence` from framer-motion, `CheckCircle2` from lucide-react
  - [x] 5.3 Fixed container: `className="fixed top-4 right-4 z-30 flex items-center gap-2"`
  - [x] 5.4 Wrap in `role="status"` and `aria-live="polite"` outer div
  - [x] 5.5 Online state: green dot (`w-4 h-4 rounded-full bg-green-500`), no text
  - [x] 5.6 Offline state: amber dot (`bg-amber-500`) + animated text "Offline - data saved locally" via `<AnimatePresence>` + `<motion.span>`
  - [x] 5.7 Syncing state: blue pulsing dot (`bg-blue-500` + Framer Motion pulse loop animation on `scale`) + "Syncing..." text
  - [x] 5.8 Sync-complete state: green checkmark (`CheckCircle2` icon, `text-green-500`) + "Synced" text, exits via `AnimatePresence`
  - [x] 5.9 Derive `currentState` from `{ isOnline, syncStatus }`
  - [x] 5.10 Animation values conditional on `useReducedMotion()`: skip transitions when true

- [x] **Task 6: Mount SyncIndicator in App.tsx** (AC: #1)
  - [x] 6.1 Open `src/App.tsx`
  - [x] 6.2 Import `SyncIndicator` from `@/shared/components/SyncIndicator`
  - [x] 6.3 Add `<SyncIndicator />` inside the layout div alongside `<BottomNav />` and `<InstallPrompt />`
  - [x] 6.4 Position: it renders fixed top-right via its own CSS — no layout changes needed

- [x] **Task 7: Write unit tests** (AC: #12, #13)
  - [x] 7.1 Create `src/services/pwa/syncQueue.test.ts` — 10 tests covering all exported functions
  - [x] 7.2 Create `src/services/pwa/useSyncIndicator.test.ts` — 12 tests including fake timer test for 2s auto-transition
  - [x] 7.3 Create `src/shared/components/SyncIndicator.test.tsx` — 11 tests covering all states and accessibility

- [x] **Task 8: Build verification** (AC: #12, #13)
  - [x] 8.1 Run `npx tsc --noEmit` — zero errors ✓
  - [x] 8.2 Run `npm test` — 1933 passing, 2 skipped, 0 failures ✓
  - [x] 8.3 Run `npm run build` — production build succeeds ✓

- [ ] **Task 9: VERIFICATION: Manual Browser Testing** [MANDATORY - cannot be skipped]
  - [ ] 9.1 Run `npm run dev` — app loads without errors
  - [ ] 9.2 Verify SyncIndicator appears as a small green dot in top-right corner when online
  - [ ] 9.3 Open Chrome DevTools → Network → Offline → verify amber dot + "Offline - data saved locally" appears
  - [ ] 9.4 Re-enable network → verify "Syncing..." appears briefly, then sync-complete, then collapses
  - [ ] 9.5 Verify accessibility: `role="status"`, `aria-live="polite"` in DOM inspector
  - [ ] 9.6 Verify z-index: SyncIndicator stays below modals (test by opening a Dialog)
  - [ ] 9.7 Verify prefers-reduced-motion: enable in OS accessibility settings and confirm no animations
  - [ ] 9.8 Document verification results in Dev Agent Record

## Dev Notes

### Architecture

- **Component location:** `src/shared/components/SyncIndicator.tsx` — global UI, not feature-specific
- **Hook location:** `src/services/pwa/useSyncIndicator.ts` — alongside `useServiceWorker.ts` and `useInstallPrompt.ts` in PWA services
- **Service location:** `src/services/pwa/syncQueue.ts` — pure functions, no React imports
- **No new npm dependencies** — Framer Motion, Lucide, shadcn/ui all available

### CRITICAL: AppContext Already Has Online Detection — Do NOT Duplicate

**This is the most important gotcha for this story.** `AppContext.tsx` already:
1. Initializes `onlineStatus: typeof navigator !== 'undefined' ? navigator.onLine : true`
2. Registers `window.addEventListener('online', handleOnline)` and `window.addEventListener('offline', handleOffline)` in a `useEffect`
3. Exposes `updateOnlineStatus(isOnline: boolean)` convenience method

**The `useSyncIndicator` hook MUST read `useApp().state.onlineStatus` rather than adding its own event listeners.** Do NOT duplicate the online/offline listeners. Doing so would create race conditions and double-fire issues.

### AppContext Extension Pattern

Following the existing pattern in `src/context/AppContext.tsx`:

```typescript
// AppState (add):
export interface AppState {
  streak: number;
  onlineStatus: boolean;
  lastSyncTimestamp: string | null;
  pendingSyncCount: number;  // ← NEW
}

// AppAction (add to union):
export type AppAction =
  | { type: 'SET_STREAK'; payload: number }
  | { type: 'UPDATE_ONLINE_STATUS'; payload: boolean }
  | { type: 'SET_LAST_SYNC'; payload: string | null }
  | { type: 'SET_PENDING_SYNC_COUNT'; payload: number };  // ← NEW

// appReducer (add case):
case 'SET_PENDING_SYNC_COUNT':
  return { ...state, pendingSyncCount: action.payload };

// createInitialState (add field):
function createInitialState(): AppState {
  return {
    streak: getStreak(),
    onlineStatus: typeof navigator !== 'undefined' ? navigator.onLine : true,
    lastSyncTimestamp: null,
    pendingSyncCount: 0,  // ← NEW (hydrated by useSyncIndicator on mount)
  };
}

// AppContextValue (add):
interface AppContextValue {
  state: AppState;
  dispatch: Dispatch<AppAction>;
  setStreak: (streak: number) => void;
  updateOnlineStatus: (isOnline: boolean) => void;
  setLastSync: (timestamp: string | null) => void;
  setPendingSyncCount: (count: number) => void;  // ← NEW
}
```

### syncQueue.ts Pattern (Pure Functions)

```typescript
// src/services/pwa/syncQueue.ts
import { STORAGE_KEYS } from '@/services/storage/localStorage';
import { db } from '@/services/storage/db';

export interface TelemetryEventPayload {
  timestamp: string;
  event: string;
  module: string;
  data: Record<string, unknown>;
  userId: string;
}

const MAX_QUEUE_SIZE = 100;

export function getQueueSize(): number {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SYNC_QUEUE);
    if (!raw) return 0;
    const queue = JSON.parse(raw);
    return Array.isArray(queue) ? queue.length : 0;
  } catch {
    return 0;
  }
}

export function queueEvent(event: TelemetryEventPayload): void {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SYNC_QUEUE);
    const queue: TelemetryEventPayload[] = raw ? JSON.parse(raw) : [];
    if (queue.length >= MAX_QUEUE_SIZE) {
      queue.shift(); // Drop oldest event when full
    }
    queue.push(event);
    localStorage.setItem(STORAGE_KEYS.SYNC_QUEUE, JSON.stringify(queue));
  } catch {
    // localStorage unavailable — silently fail
  }
}

export async function flushQueue(): Promise<number> {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SYNC_QUEUE);
    if (!raw) return 0;
    const queue: TelemetryEventPayload[] = JSON.parse(raw);
    if (!Array.isArray(queue) || queue.length === 0) return 0;

    // bulkAdd wraps all inserts in a single IndexedDB transaction (atomic).
    // If any write fails, the entire batch rolls back — no partial writes,
    // no duplicate events on retry.
    await db.telemetry_logs.bulkAdd(queue);
    clearQueue();
    return queue.length;
  } catch (err) {
    // On failure, leave queue intact for next retry
    throw err;
  }
}

export function clearQueue(): void {
  localStorage.removeItem(STORAGE_KEYS.SYNC_QUEUE);
}
```

### useSyncIndicator Hook Pattern

```typescript
// src/services/pwa/useSyncIndicator.ts
import { useState, useEffect, useRef, useCallback } from 'react';
import { useApp } from '@/context/AppContext';
import { flushQueue, getQueueSize } from './syncQueue';

export type SyncStatus = 'idle' | 'syncing' | 'complete';

export function useSyncIndicator() {
  const { state, setPendingSyncCount } = useApp();
  const { onlineStatus } = state;
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const prevOnlineRef = useRef<boolean>(onlineStatus);
  const completeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Hydrate pendingSyncCount on mount
  useEffect(() => {
    setPendingSyncCount(getQueueSize());
  }, [setPendingSyncCount]);

  // Trigger flush when going online with a non-empty queue
  const triggerFlush = useCallback(async () => {
    const queueSize = getQueueSize();
    if (queueSize === 0) return;

    setSyncStatus('syncing');
    try {
      await flushQueue();
      setPendingSyncCount(0);
      setSyncStatus('complete');
      completeTimerRef.current = setTimeout(() => {
        setSyncStatus('idle');
      }, 2000);
    } catch {
      // Flush failed — reset to idle, queue preserved for next retry
      setSyncStatus('idle');
    }
  }, [setPendingSyncCount]);

  useEffect(() => {
    const wasOffline = !prevOnlineRef.current;
    const isNowOnline = onlineStatus;

    if (wasOffline && isNowOnline) {
      triggerFlush();
    }

    prevOnlineRef.current = onlineStatus;
  }, [onlineStatus, triggerFlush]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (completeTimerRef.current) {
        clearTimeout(completeTimerRef.current);
      }
    };
  }, []);

  return {
    isOnline: onlineStatus,
    syncStatus,
    pendingSyncCount: state.pendingSyncCount,
  };
}
```

### SyncIndicator State Machine

```
                        isOnline=false
                     ┌─────────────────┐
   idle (online) ────┤                 ├──► offline
                     │                 │
   idle (online) ◄───┤  isOnline=true  │◄── offline
                     │  queue empty    │
                     └─────────────────┘

   idle (online) ──► syncing ──► complete ──(2000ms)──► idle (online)
                    ↑ isOnline=true
                    │ queue non-empty
```

### Visual Specification

```
Online (collapsed):
  ● (green, 16px dot, w-4 h-4)

Offline (expanded):
  ● Offline - data saved locally (amber dot + text)

Syncing (expanded):
  ◉ Syncing...  (blue pulsing dot + text)

Sync-complete (expanded, exits after 2s):
  ✓ (green CheckCircle2 icon)
```

### Testing Gotchas

1. **`vi.useFakeTimers()` for 2s auto-hide** — The `setTimeout(2000)` in `useSyncIndicator` requires fake timers in tests. Pattern:
   ```typescript
   beforeEach(() => { vi.useFakeTimers(); });
   afterEach(() => { vi.useRealTimers(); vi.clearAllMocks(); });

   it('transitions to idle after 2 seconds', async () => {
     // ... set up flush mock to succeed ...
     act(() => { vi.advanceTimersByTime(2000); });
     expect(result.current.syncStatus).toBe('idle');
   });
   ```

2. **`vi.clearAllMocks()` clears mock implementations** — Re-apply `mockResolvedValue` in `beforeEach`, same pattern as Story 7.3's `db.sessions.count` issue.

3. **`useApp()` mock for hook tests** — Mock the `@/context/AppContext` module:
   ```typescript
   const mockDispatch = vi.fn();
   const mockSetPendingSyncCount = vi.fn();
   vi.mock('@/context/AppContext', () => ({
     useApp: vi.fn(() => ({
       state: { onlineStatus: true, pendingSyncCount: 0, streak: 0, lastSyncTimestamp: null },
       dispatch: mockDispatch,
       setPendingSyncCount: mockSetPendingSyncCount,
       // ... other methods ...
     })),
   }));
   ```
   Then in each test, override `onlineStatus` by calling `vi.mocked(useApp).mockReturnValue(...)`.

4. **Framer Motion mock** — Follow Story 7.3 pattern:
   ```typescript
   vi.mock('framer-motion', () => ({
     motion: { div: ({ children, ...props }: any) => <div {...props}>{children}</div>, span: ({ children, ...props }: any) => <span {...props}>{children}</span> },
     AnimatePresence: ({ children }: any) => <>{children}</>,
     useReducedMotion: () => false,
   }));
   ```

5. **`useEffect` timing** — Assertions depending on `useEffect` (e.g., mount-time `setPendingSyncCount(getQueueSize())`) need `waitFor()`:
   ```typescript
   await waitFor(() => expect(mockSetPendingSyncCount).toHaveBeenCalled());
   ```

6. **`prevOnlineRef` transition detection** — The hook uses a ref to track previous `onlineStatus`. To test the `offline → online` transition, render the hook with `onlineStatus: false` first, then change mock to return `true` and call `rerender()`.

### Z-Index Reference

| Layer | Z-index | Element |
|-------|---------|---------|
| BottomNav | 9999 (inline) | Fixed bottom navigation |
| Modals/Dialogs | 50 (Tailwind z-50) | shadcn/ui Dialog, Sheet |
| InstallPrompt | 40 (z-40) | Fixed bottom banner |
| SyncIndicator | 30 (z-30) | Fixed top-right indicator |
| Page content | < 20 | Normal content |

### localStorage Key Reference

Current `STORAGE_KEYS` (after this story):
- `SYNC_QUEUE: 'discalculas:syncQueue'` ← NEW (Story 7.4)
- `PWA_INSTALL_DISMISSED_COUNT: 'discalculas:pwaInstallDismissedCount'` (Story 7.3)
- `PWA_INSTALLED: 'discalculas:pwaInstalled'` (Story 7.3)
- (all others from previous stories)

### `navigator.onLine` Caveat

The epic mentions "Test actual connectivity: Ping endpoint or check network state." For this local-first app with **no backend server**, there is no endpoint to ping. `navigator.onLine` is the correct signal. **Known limitation**: `navigator.onLine` can return `true` even without internet connectivity (e.g., on a local WiFi with no internet — "captive portal" scenario). However, since all app data is local (Dexie/localStorage), this is not a functional problem — data persistence works regardless of actual internet connectivity. Document this known limitation in a code comment.

### Previous Story Intelligence (from Story 7.3)

- **`useRef` for DOM event refs, not `useState`** — non-serializable objects go in refs
- **`setSessionDismissed(true)` pattern** — reliable React state change > localStorage-only approaches
- **`vi.clearAllMocks()` in afterEach** clears `mockResolvedValue` — must re-apply db mocks in `beforeEach`
- **`act()` return value is void** — capture variables before/outside act, not from its return
- **Framer Motion mock** — must mock `motion.div`, `AnimatePresence`, and `useReducedMotion`
- **Hook cleanup** — always return cleanup from `useEffect` for `setTimeout` refs (prevents memory leaks and test flakiness)
- **Test for immediate state change** — don't just test side effects; test that state actually changes

### Project Structure Notes

```
src/services/pwa/
├── useServiceWorker.ts         ← EXISTING (Story 7.1)
├── useServiceWorker.test.ts    ← EXISTING
├── useInstallPrompt.ts         ← EXISTING (Story 7.3)
├── useInstallPrompt.test.ts    ← EXISTING
├── syncQueue.ts                ← NEW (Story 7.4 - pure functions)
├── syncQueue.test.ts           ← NEW
├── useSyncIndicator.ts         ← NEW (Story 7.4 - hook)
└── useSyncIndicator.test.ts    ← NEW

src/shared/components/
├── InstallPrompt.tsx            ← EXISTING (Story 7.3)
├── InstallPrompt.test.tsx       ← EXISTING
├── SyncIndicator.tsx            ← NEW (Story 7.4)
└── SyncIndicator.test.tsx       ← NEW

src/context/
└── AppContext.tsx               ← MODIFIED (add pendingSyncCount)

src/services/storage/
└── localStorage.ts             ← MODIFIED (add SYNC_QUEUE key)

src/
└── App.tsx                     ← MODIFIED (mount SyncIndicator)
```

### References

- [Source: docs/epics.md#Epic 7, Story 7.4] — Complete acceptance criteria, sync queue spec, component spec
- [Source: docs/architecture.md#PWA] — Service worker, offline-first, AppContext patterns
- [Source: docs/project-context.md] — Triple-check protocol, testing patterns, mock cleanup
- [Source: src/context/AppContext.tsx] — AppState shape, AppAction union, useReducer pattern, existing online/offline listeners (CRITICAL — do not duplicate)
- [Source: src/services/pwa/useServiceWorker.ts] — Hook pattern with useRef guards, toast integration
- [Source: src/services/pwa/useInstallPrompt.ts] — Hook pattern with useRef for DOM events, sessionDismissed state pattern
- [Source: src/shared/components/InstallPrompt.tsx] — Component pattern: AnimatePresence, useReducedMotion, fixed positioning
- [Source: src/services/storage/localStorage.ts#STORAGE_KEYS] — Key namespace: `discalculas:` prefix
- [Source: docs/stories/7-3-implement-install-prompt.md] — Previous story patterns, debug log, test structure

## Dev Agent Record

### Agent Model Used

Claude Sonnet 4.6

### Debug Log References

- Fixed TS error: Framer Motion `ease: 'easeInOut'` not assignable to `Easing` type when nested inside `animate` object — resolved by using separate `animate` + `transition` props on `motion.span`
- Fixed test timeout: `vi.useFakeTimers()` inside a test blocks `waitFor` (which uses `setTimeout` for polling). Solution: split the timer test into a synchronous assertion (for `syncing` state) + `await act(async () => { await Promise.resolve(); })` (for Promise microtask flushing) + fake timer advance. Added `vi.useRealTimers()` to `afterEach` as safety net to prevent timer state leaking to subsequent tests.

### Completion Notes List

- `useSyncIndicator` reads `onlineStatus` from AppContext (DO NOT duplicate online/offline event listeners — AppContext already owns them)
- `prevOnlineRef` pattern: tracks previous online value to detect `false→true` transition without adding to effect dependencies
- `isFirstRunRef` sentinel pattern: `useRef(true)` flag checked on first `useEffect` run to distinguish mount (startup flush) from subsequent renders (reconnect flush). Flag is set to `false` immediately so it only fires once. `prevOnlineRef` is already correctly initialized via `useRef(onlineStatus)` — no reassignment needed in the first-run branch.
- `vi.useFakeTimers()` must NOT be used globally in test files that also use `waitFor` — use locally per-test with explicit `vi.useRealTimers()` restore
- `setSyncStatus('syncing')` is synchronous (before first `await` in triggerFlush) — can be asserted without `waitFor` even with fake timers

### File List

- `src/services/storage/localStorage.ts` — Added `SYNC_QUEUE: 'discalculas:syncQueue'` key
- `src/context/AppContext.tsx` — Added `pendingSyncCount: number` to AppState, `SET_PENDING_SYNC_COUNT` action, `setPendingSyncCount` convenience method
- `src/context/AppContext.test.tsx` — Added `Pending Sync Count Management` test suite (3 tests)
- `src/services/pwa/syncQueue.ts` — NEW: Pure functions for offline telemetry queue
- `src/services/pwa/syncQueue.test.ts` — NEW: 10 unit tests
- `src/services/pwa/useSyncIndicator.ts` — NEW: Hook reading online status from AppContext
- `src/services/pwa/useSyncIndicator.test.ts` — NEW: 12 unit tests (+ 4 startup flush tests)
- `src/shared/components/SyncIndicator.tsx` — NEW: Fixed top-right ambient indicator (4 states)
- `src/shared/components/SyncIndicator.test.tsx` — NEW: 11 unit tests
- `src/App.tsx` — Added `<SyncIndicator />` import and mount

### Code Review Record

**Reviewer:** Claude Sonnet 4.6 (adversarial code review workflow)
**Date:** 2026-03-07

**Findings and Fixes Applied:**

| # | Severity | Finding | Fix Applied |
|---|----------|---------|-------------|
| 1 | HIGH | `flushQueue` used `Promise.all(queue.map(event => db.telemetry_logs.add(event)))` — non-atomic. Partial writes on failure leave already-persisted events in queue, causing duplicates on retry. | Replaced with `await db.telemetry_logs.bulkAdd(queue)` — single IndexedDB transaction, all-or-nothing. Updated `syncQueue.test.ts` mocks and assertions to match. |
| 2 | HIGH | Task checkboxes 1–8 left as `[ ]` despite all implementation tasks being complete. | Bulk-updated tasks 1–8 to `[x]`. Task 9 (manual browser testing) remains `[ ]` — requires human verification. |
| 3 | MEDIUM | `AppContext.test.tsx` not updated — new `pendingSyncCount` state and `setPendingSyncCount` method had zero unit test coverage. | Added `pending-sync-count` to `TestComponent`, added `Pending Sync Count Management` describe block with 3 tests (initial state, update, reset to 0). |
| 4 | LOW | Online-state dot used `w-3 h-3` (12px) vs. Task 5.5 spec requiring `w-4 h-4` (16px). | Changed all three indicator dots (online, offline, syncing) from `w-3 h-3` to `w-4 h-4`. |
| 5 | LOW | `makeEvent` timestamp template `` `2026-01-01T00:00:0${id}.000Z` `` generates invalid ISO 8601 for `id >= 10` (e.g., `T00:00:010`). | Fixed to `` `2026-01-01T00:00:${String(id % 60).padStart(2, '0')}.000Z` `` — always valid 2-digit seconds. |
| 6 | LOW | `bulkAdd` mock used `mockResolvedValue(undefined)` but Dexie's `bulkAdd` returns `Promise<IndexableType>` (number). TypeScript error in strict mode. | Changed to `mockResolvedValue(0)`. |

**Post-Fix Verification:**
- `npx tsc --noEmit` — zero errors ✓
- `npm test` — 1930 passing, 2 skipped, 0 failures ✓ (3 new AppContext tests added)

**Remaining:** Task 9 (manual browser verification) — requires human to run `npm run dev` and test all 4 indicator states in Chrome DevTools.

---

**2nd Code Review — Reviewer:** Claude Sonnet 4.6
**Date:** 2026-03-07

**Findings and Fixes Applied:**

| # | Severity | Finding | Fix Applied |
|---|----------|---------|-------------|
| 1 | HIGH | Task 9 MANDATORY browser verification still `[ ]` — cannot be automated. | Remains open — requires human. |
| 2 | HIGH | Queued events from previous offline sessions never flushed when app starts online. `useSyncIndicator` only triggered flush on `false→true` transition; `prevOnlineRef` initialized to current `onlineStatus`, so startup-online case was missed. | Added `isFirstRunRef` sentinel to `useSyncIndicator.ts` — on first run, if `onlineStatus && getQueueSize() > 0`, calls `triggerFlush()`. Added 4 new tests covering: startup flush with queue, no flush with empty queue, no flush while offline on mount, no re-flush on subsequent renders. |
| 3 | MEDIUM | Dev Notes code snippet still showed old `Promise.all` pattern — contradicted actual `bulkAdd` implementation. | Updated snippet to match actual implementation. |
| 4 | LOW | `CheckCircle2` icon on complete state used `w-3 h-3` (12px) — missed by first review's dot-size fix. | Changed to `w-4 h-4` — now consistent across all 4 indicator states. |
| 5 | LOW | AC #2 spec said "24px" but Task 5.5 and implementation use 16px (`w-4 h-4`). Internal inconsistency. | Corrected AC #2 to "16px (`w-4 h-4`)". |
| 6 | LOW | AC #8 listed `flushQueue(db: DexieDb)` but actual signature is `flushQueue()` — no db parameter. | Corrected AC #8 signature. |
| 7 | LOW | `AppContext.test.tsx` modified (code review Fix #3) but absent from story File List. | Added to File List. |

**Post-Fix Verification:**
- `npx tsc --noEmit` — zero errors ✓
- `npm test` — 1933 passing, 2 skipped, 0 failures ✓ (4 new startup flush tests added)

---

**3rd Code Review — Reviewer:** Claude Sonnet 4.6
**Date:** 2026-03-07

**Findings and Fixes Applied:**

| # | Severity | Finding | Fix Applied |
|---|----------|---------|-------------|
| 1 | HIGH | Task 9 MANDATORY browser verification still `[ ]` — cannot be automated. | Remains open — requires human. |
| 2 | MEDIUM | AC #9 only described `false→true` reconnect flush; omitted startup-online flush added in 2nd review Fix H2. | Added "(b) app mounts while already online AND queue contains events from a prior offline session" to AC #9. |
| 3 | LOW | `prevOnlineRef.current = onlineStatus` inside the first-run branch of `useSyncIndicator.ts` was a dead assignment — `useRef(onlineStatus)` already initializes it to the same value. | Removed the redundant assignment; added clarifying comment: "prevOnlineRef is already initialized to onlineStatus via useRef — no reassignment needed." |
| 4 | LOW | `SyncIndicator.test.tsx` has 11 tests but story tasks and File List claimed "10". | Updated Task 7.3 and File List to "11 unit tests". |
| 5 | LOW | "hydrates pendingSyncCount on mount via getQueueSize" test used `getQueueSize=3` + `onlineStatus=true` (default), silently exercising startup flush as an undocumented side effect. | Added `setMockOnlineStatus(false)` to isolate hydration test; added `expect(flushQueue).not.toHaveBeenCalled()` assertion. |
| 6 | LOW | `isFirstRunRef` sentinel pattern absent from Completion Notes despite being the key architectural addition of the 2nd review. | Added `isFirstRunRef` sentinel pattern explanation to Completion Notes. |

**Post-Fix Verification:**
- `npx tsc --noEmit` — zero errors ✓
- `npm test` — 1933 passing, 2 skipped, 0 failures ✓

**Remaining:** Task 9 (manual browser verification) — requires human to run `npm run dev` and test all 4 indicator states in Chrome DevTools.
