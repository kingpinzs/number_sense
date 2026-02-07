### Story 7.4: Implement Ambient Sync Indicator

**As a** user using the app,
**I want** to see my connection status,
**So that** I know if my data will sync when I go online.

**Acceptance Criteria:**

**Given** install prompt is implemented (Story 7.3 complete)
**When** my network connection changes
**Then** the SyncIndicator component updates:

**Indicator States:**

* **Online**: Green dot, no text (default, unobtrusive)
* **Offline**: Amber dot + text "Offline - data saved locally"
* **Syncing**: Blue pulse + text "Syncing..."
* **Sync complete**: Green checkmark, auto-hides after 2 seconds

**Indicator Placement:**

* Top-right corner of screen (fixed position)
* Small, non-intrusive (24px dot + text)
* Expands on offline/syncing, collapses when online
* Z-index above content but below modals

**Connection Detection:**

* Listen to `window.addEventListener('online'/'offline')` events
* Detect: `navigator.onLine` property
* Test actual connectivity: Ping endpoint or check network state
* Handle false positives: `navigator.onLine` can be true without internet

**Background Sync Queue:**

* Queue telemetry writes when offline (store in localStorage)
* On reconnect: Flush queue to Dexie (batch write)
* Retry logic: Exponential backoff if sync fails
* Max queue size: 100 events (prevent overflow)

**And** Sync status accessible:

* AppContext tracks: `{ onlineStatus: boolean, pendingSyncCount: number }`
* Components can read sync state and react accordingly

**Prerequisites:** Story 7.3 (Install prompt complete)

**Technical Notes:**

* Location: `src/shared/components/SyncIndicator.tsx`
* Online/offline events: `window.addEventListener('online', handleOnline)`
* Sync queue: `src/services/pwa/syncQueue.ts`
  * Functions: `queueEvent(event)`, `flushQueue()`, `getQueueSize()`
* localStorage key: `SYNC_QUEUE` (array of events)
* Visual: Framer Motion pulse animation for syncing state
* Test: Use Chrome DevTools > Network > Offline to simulate offline mode

***
