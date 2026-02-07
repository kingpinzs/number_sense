### Story 1.5: Set Up React Context Providers for State Management

**Status:** done

**As a** developer,
**I want** React Context providers (AppContext, SessionContext, UserSettingsContext),
**So that** global state is managed consistently across all components without prop drilling.

**Acceptance Criteria:**

**Given** the Dexie database is operational (Story 1.4 complete)
**When** I implement the Context providers
**Then** the following context providers are created:

**AppContext** (`src/context/AppContext.tsx`):

* State: `streak: number`, `onlineStatus: boolean`, `lastSyncTimestamp: string | null`
* Actions: `SET_STREAK`, `UPDATE_ONLINE_STATUS`, `SET_LAST_SYNC`
* useReducer pattern with AppReducer

**SessionContext** (`src/context/SessionContext.tsx`):

* State: `currentModule: string | null`, `sessionId: string | null`, `sessionStatus: SessionStatus`, `startTime: string | null`
* Actions: `START_SESSION`, `END_SESSION`, `PAUSE_SESSION`, `RESUME_SESSION`

**UserSettingsContext** (`src/context/UserSettingsContext.tsx`):

* State: `reducedMotion: boolean`, `soundEnabled: boolean`, `dailyGoalMinutes: number`, `researchModeEnabled: boolean`
* Actions: `UPDATE_SETTINGS`
* Persists to localStorage on every change

**And** `src/App.tsx` wraps the app with all three providers in correct order
**And** A test component successfully reads and dispatches to each context
**And** TypeScript types are fully defined for all state and actions

**Prerequisites:** Story 1.4 (Dexie database operational)

**Technical Notes:**

* Follow reducer pattern from [architecture.md](./architecture.md#communication-patterns)
* Context order: UserSettingsContext → AppContext → SessionContext → Router
* Export custom hooks: `useApp()`, `useSession()`, `useUserSettings()`
* UserSettingsContext loads from localStorage on mount
* Prepare for future WebSocket/sync in AppContext (commented placeholders)

---

## Tasks/Subtasks

- [x] Implement AppContext with reducer pattern (useReducer with AppReducer)
- [x] Implement SessionContext with session management (START_SESSION, END_SESSION, PAUSE_SESSION, RESUME_SESSION)
- [x] Implement UserSettingsContext with localStorage persistence
- [x] Wrap App.tsx with all three providers in correct order (UserSettingsContext → AppContext → SessionContext)
- [x] Create test component to verify reading and dispatching to each context
- [x] Define TypeScript types for all state and actions
- [x] Write comprehensive tests for all contexts (29 tests total)
- [x] Validate all acceptance criteria

---

## Dev Agent Record

### Context Reference
- [1-5-set-up-react-context-providers-for-state-management.context.xml](./1-5-set-up-react-context-providers-for-state-management.context.xml)

### Debug Log

**Implementation Approach:**
- Discovered localStorage service already implemented in Story 1.4 (no changes needed)
- Implemented AppContext with useReducer pattern, streak persistence, and online/offline event listeners
- Implemented SessionContext with state machine validation (warns on invalid transitions)
- Implemented UserSettingsContext with immediate localStorage persistence on every update
- Wrapped App.tsx with providers in architecture-specified order
- Created ContextTestComponent for manual verification
- Wrote 29 comprehensive tests covering all contexts (9 AppContext, 9 SessionContext, 11 UserSettingsContext)
- Fixed test issues: lazy initializer for AppContext state, updated module-exports and path-alias tests

**Technical Decisions:**
- Used createInitialState() function instead of const to ensure fresh state on each provider mount (fixes test isolation)
- Added navigator.onLine check with typeof guard for SSR compatibility
- Included TODO comments for future WebSocket/sync integration as per architecture spec
- SessionContext includes state validation with console.warn for invalid transitions (e.g., pause when not active)

### Completion Notes

✅ **All acceptance criteria met:**
- AppContext implemented with useReducer, streak persistence, and 3 actions
- SessionContext implemented with 4 lifecycle actions and state validation
- UserSettingsContext implemented with localStorage persistence
- App.tsx wrapped with providers in correct order (UserSettingsProvider → AppProvider → SessionProvider)
- Test component created and verifies all contexts working
- TypeScript types fully defined and exported
- 162 total tests passing (29 new context tests)

**Key Features:**
- All three contexts export custom hooks (useApp, useSession, useUserSettings) - raw contexts not exported per architecture
- AppContext persists streak to localStorage on every update
- UserSettingsContext loads from localStorage on mount and persists on every change
- SessionContext validates state transitions and logs warnings for invalid actions
- Prepared for future WebSocket/sync with TODO placeholders

### File List

**New Files:**
- `src/context/AppContext.tsx` - App-level state management (135 lines)
- `src/context/SessionContext.tsx` - Session lifecycle management (162 lines)
- `src/context/UserSettingsContext.tsx` - User preferences with persistence (76 lines)
- `src/context/AppContext.test.tsx` - AppContext tests (9 tests, 193 lines)
- `src/context/SessionContext.test.tsx` - SessionContext tests (9 tests, 179 lines)
- `src/context/UserSettingsContext.test.tsx` - UserSettingsContext tests (11 tests, 172 lines)
- `src/shared/components/ContextTestComponent.tsx` - Manual verification component (106 lines)

**Modified Files:**
- `src/App.tsx` - Added context provider wrapping
- `src/__tests__/module-exports.test.ts` - Updated to check for full implementations
- `src/__tests__/path-alias.test.ts` - Updated to import exported functions

### Change Log

- **2025-11-10:** Story 1.5 completed - All three React Context providers implemented with comprehensive tests (162/162 passing)
- **2025-11-10:** Senior Developer Review completed - Changes requested (3 issues found)
- **2025-11-10:** Bug fixes completed - All 3 review issues resolved, tests updated and passing (162/162)

***

## Senior Developer Review (AI)

**Reviewer:** Jeremy
**Date:** 2025-11-10
**Outcome:** ⚠️ **CHANGES REQUESTED**

### Summary

Story 1.5 delivers a fundamentally sound and complete implementation of all three React Context providers with excellent test coverage (162/162 tests passing). All acceptance criteria are fully implemented with proper TypeScript types, localStorage persistence, and architecture compliance. However, the review identified **3 bugs** that should be fixed:

1. **[HIGH]** Memory leak in AppContext due to missing event listener cleanup
2. **[MED]** Incorrect localStorage persistence pattern in UserSettingsContext
3. **[MED]** Unnecessary double-render from redundant useEffect

These issues don't block core functionality but represent quality concerns that should be addressed before marking the story done.

### Key Findings

#### HIGH SEVERITY

**🔴 H1: Memory Leak - Event Listeners Never Cleaned Up (AppContext)**
- **Location:** [src/context/AppContext.tsx:100-105](src/context/AppContext.tsx#L100-L105)
- **Issue:** Event listeners for 'online' and 'offline' are added directly in the component body without cleanup
- **Impact:** Every time AppProvider remounts, new event listeners are added without removing old ones, causing memory leaks
- **Evidence:**
  ```typescript
  // Lines 100-105 - NO useEffect, NO cleanup
  if (typeof window !== 'undefined') {
    window.addEventListener('online', () => updateOnlineStatus(true));
    window.addEventListener('offline', () => updateOnlineStatus(false));
  }
  ```
- **Required Fix:** Wrap in useEffect with cleanup function:
  ```typescript
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const handleOnline = () => updateOnlineStatus(true);
      const handleOffline = () => updateOnlineStatus(false);

      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
  }, [updateOnlineStatus]);
  ```

#### MEDIUM SEVERITY

**🟡 M1: Incorrect localStorage Persistence - Partial Instead of Full Settings (UserSettingsContext)**
- **Location:** [src/context/UserSettingsContext.tsx:37-44](src/context/UserSettingsContext.tsx#L37-L44)
- **Issue:** Line 41 persists `partial` (incomplete settings) instead of `updated` (full merged settings)
- **Impact:** If a user updates multiple settings sequentially, only the most recent partial update is persisted, losing previous changes
- **Evidence:**
  ```typescript
  const updateSettings = (partial: Partial<UserSettings>) => {
    setSettings((current) => {
      const updated = { ...current, ...partial };  // Merges correctly
      setUserSettings(partial);  // ❌ BUG: Should be setUserSettings(updated)
      return updated;
    });
  };
  ```
- **Required Fix:** Change line 41 from `setUserSettings(partial)` to `setUserSettings(updated)`
- **Test Gap:** Current tests use spies that only verify the function was called, not that correct arguments were passed

**🟡 M2: Redundant useEffect Causing Double-Render (UserSettingsContext)**
- **Location:** [src/context/UserSettingsContext.tsx:46-50](src/context/UserSettingsContext.tsx#L46-L50)
- **Issue:** Settings are loaded twice: once in useState initializer (line 29) and again in useEffect (lines 47-49)
- **Impact:** Unnecessary re-render on every mount, slight performance degradation
- **Evidence:**
  ```typescript
  // Line 29 - Already loads settings
  const [settings, setSettings] = useState<UserSettings>(() => getUserSettings());

  // Lines 46-50 - Redundant second load
  useEffect(() => {
    const loadedSettings = getUserSettings();
    setSettings(loadedSettings);
  }, []);
  ```
- **Required Fix:** Remove the useEffect block (lines 46-50) since useState initializer already loads settings

### Acceptance Criteria Coverage

| AC# | Description | Status | Evidence (file:line) |
|-----|-------------|--------|---------------------|
| AC1 | AppContext with state (streak, onlineStatus, lastSyncTimestamp) | ✅ IMPLEMENTED | [AppContext.tsx:10-14](src/context/AppContext.tsx#L10-L14) |
| AC1.1 | AppContext with actions (SET_STREAK, UPDATE_ONLINE_STATUS, SET_LAST_SYNC) | ✅ IMPLEMENTED | [AppContext.tsx:19-22](src/context/AppContext.tsx#L19-L22) |
| AC1.2 | AppContext uses useReducer pattern | ✅ IMPLEMENTED | [AppContext.tsx:44-59](src/context/AppContext.tsx#L44-L59), [AppContext.tsx:85](src/context/AppContext.tsx#L85) |
| AC2 | SessionContext with state (currentModule, sessionId, sessionStatus, startTime) | ✅ IMPLEMENTED | [SessionContext.tsx:15-20](src/context/SessionContext.tsx#L15-L20) |
| AC2.1 | SessionContext with actions (START_SESSION, END_SESSION, PAUSE_SESSION, RESUME_SESSION) | ✅ IMPLEMENTED | [SessionContext.tsx:25-29](src/context/SessionContext.tsx#L25-L29) |
| AC3 | UserSettingsContext with state (reducedMotion, soundEnabled, dailyGoalMinutes, researchModeEnabled) | ✅ IMPLEMENTED | [localStorage.ts:18-23](src/services/storage/localStorage.ts#L18-L23), [UserSettingsContext.tsx:29](src/context/UserSettingsContext.tsx#L29) |
| AC3.1 | UserSettingsContext persists to localStorage on every change | ✅ IMPLEMENTED | [UserSettingsContext.tsx:37-44](src/context/UserSettingsContext.tsx#L37-L44) |
| AC4 | App.tsx wraps app with all three providers in correct order | ✅ IMPLEMENTED | [App.tsx:190-202](src/App.tsx#L190-L202) |
| AC5 | Test component successfully reads and dispatches to each context | ✅ IMPLEMENTED | [ContextTestComponent.tsx](src/shared/components/ContextTestComponent.tsx) |
| AC6 | TypeScript types fully defined for all state and actions | ✅ IMPLEMENTED | All types exported in respective context files |

**Summary:** ✅ **10 of 10 acceptance criteria fully implemented**

### Task Completion Validation

| Task | Marked As | Verified As | Evidence (file:line) |
|------|-----------|-------------|---------------------|
| Implement AppContext with reducer pattern | [x] Complete | ✅ VERIFIED | [AppContext.tsx:44-59, 85](src/context/AppContext.tsx#L44-L59) |
| Implement SessionContext with session management | [x] Complete | ✅ VERIFIED | [SessionContext.tsx:49-90](src/context/SessionContext.tsx#L49-L90) |
| Implement UserSettingsContext with localStorage persistence | [x] Complete | ✅ VERIFIED | [UserSettingsContext.tsx:27-58](src/context/UserSettingsContext.tsx#L27-L58) |
| Wrap App.tsx with all three providers | [x] Complete | ✅ VERIFIED | [App.tsx:195-198](src/App.tsx#L195-L198) |
| Create test component to verify contexts | [x] Complete | ✅ VERIFIED | [ContextTestComponent.tsx](src/shared/components/ContextTestComponent.tsx) |
| Define TypeScript types | [x] Complete | ✅ VERIFIED | All types defined and exported |
| Write comprehensive tests | [x] Complete | ✅ VERIFIED | 29 new tests, 162 total passing |
| Validate all acceptance criteria | [x] Complete | ✅ VERIFIED | All ACs implemented |

**Summary:** ✅ **8 of 8 completed tasks verified, 0 questionable, 0 falsely marked complete**

### Test Coverage and Gaps

**Test Coverage:**
- ✅ 29 new tests added (9 AppContext + 9 SessionContext + 11 UserSettingsContext)
- ✅ 162 total tests passing (100% pass rate)
- ✅ Tests cover: state management, localStorage persistence, convenience methods, error handling
- ✅ Proper test isolation with beforeEach cleanup

**Test Gaps:**
- 🟡 UserSettingsContext persistence tests use spies that don't verify correct arguments
  - Tests check that `setUserSettings` was called, but not that the full merged settings object was passed
  - This allowed the partial-vs-updated bug to pass tests
- 💡 Consider adding integration tests that verify localStorage persistence without mocks
  - Write settings, clear state, reload provider, verify settings restored correctly

### Architectural Alignment

✅ **Fully Compliant with Tech Spec and Architecture:**
- Provider nesting order matches architecture spec: UserSettings → App → Session → Router
- Custom hooks pattern followed correctly (raw contexts not exported)
- useReducer pattern used for AppContext and SessionContext ✓
- TypeScript discriminated unions for actions ✓
- localStorage integration with validation and fallbacks ✓
- Error handling with helpful error messages ✓
- SSR-safe with `typeof navigator` checks ✓
- Prepared for future WebSocket/sync with TODO placeholders ✓

### Security Notes

✅ **No Security Issues Found**
- localStorage validated with fallback to defaults on corrupt data
- Type safety prevents injection via state updates
- No sensitive data stored (only app state and user preferences)
- Context hooks properly throw errors when used outside providers

### Best-Practices and References

**React 19 Context API:**
- ✅ Following React 19 Context + useReducer best practices
- ✅ Proper TypeScript typing throughout
- ⚠️ Event listeners should be in useEffect with cleanup (React docs: [Effects with Cleanup](https://react.dev/reference/react/useEffect#useeffect))

**localStorage Patterns:**
- ✅ Validation and fallback for corrupt data
- ⚠️ Should persist full merged state, not partial updates

**Testing:**
- ✅ Good use of React Testing Library user-centric patterns
- ✅ Proper test isolation with beforeEach
- 💡 Consider testing actual localStorage integration without mocks for critical paths

### Action Items

#### Code Changes Required:

- [x] [High] Fix memory leak: Wrap event listeners in useEffect with cleanup (AC #1) [file: src/context/AppContext.tsx:100-105] ✅ **FIXED**
- [x] [Med] Fix localStorage persistence: Change line 41 from `setUserSettings(partial)` to `setUserSettings(updated)` (AC #3.1) [file: src/context/UserSettingsContext.tsx:41] ✅ **FIXED**
- [x] [Med] Remove redundant useEffect that causes double-render (AC #3) [file: src/context/UserSettingsContext.tsx:46-50] ✅ **FIXED**

#### Test Improvements (Optional):

- [x] [Low] Enhance UserSettingsContext tests to verify correct arguments passed to setUserSettings [file: src/context/UserSettingsContext.test.tsx] ✅ **DONE**
- [ ] [Low] Add integration test for localStorage persistence without mocks [file: src/context/UserSettingsContext.test.tsx]

#### Advisory Notes:

- Note: Consider documenting the Context provider nesting order in architecture.md for future developers
- Note: Excellent TypeScript type safety and comprehensive test coverage - well done!
- Note: SessionContext state machine validation with console.warn is a nice UX touch

***
