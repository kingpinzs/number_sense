### Story 7.3: Implement Install Prompt

**As a** user visiting the app,
**I want** a prompt to install the app on my device,
**So that** I can access it easily from my home screen.

**Acceptance Criteria:**

**Given** app icons and manifest are ready (Story 7.2 complete)
**When** I visit the app on a supported browser
**Then** the InstallPrompt component appears:

**Install Prompt UI:**

* Banner at bottom of screen (non-intrusive)
* Message: "Install Discalculas for quick access and offline use"
* Actions: "Install" button (coral), "Not Now" button (gray text)
* Dismissible: X button, auto-hides after "Not Now"

**Install Trigger Logic:**

* Browser fires `beforeinstallprompt` event (Chrome, Edge, Android)
* App captures event and stores reference
* Shows prompt after user completes first session (not immediately on first visit)
* Respects user preference: Don't show again if dismissed 3 times

**Install Flow:**

1. User clicks "Install" button
2. Browser shows native install dialog
3. User confirms installation
4. App installed to home screen
5. Hide install prompt permanently (store in localStorage)

**Platform-Specific Handling:**

* **Android/Chrome**: Native prompt works automatically
* **iOS/Safari**: Custom instructions modal (Safari doesn't support `beforeinstallprompt`)
  * Message: "To install: Tap Share → Add to Home Screen"
  * Include screenshots/animation showing steps
* **Desktop**: Standard install prompt (smaller banner in corner)

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

* Location: `src/shared/components/InstallPrompt.tsx`
* Listen for `beforeinstallprompt`: `window.addEventListener('beforeinstallprompt', ...)`
* Store event: `deferredPrompt = e; e.preventDefault();`
* Trigger install: `deferredPrompt.prompt(); const { outcome } = await deferredPrompt.userChoice;`
* localStorage key: `PWA_INSTALL_DISMISSED_COUNT`
* Detect standalone mode: `window.matchMedia('(display-mode: standalone)').matches`

***
