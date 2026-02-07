### Story 8.4: Implement Research Mode Settings Toggle

**As a** user interested in helping improve the app,
**I want** the option to enable Research Mode and participate in experiments,
**So that** I can contribute to app development.

**Acceptance Criteria:**

**Given** experiment results dashboard exists (Story 8.3 complete)
**When** I navigate to `/profile` (settings)
**Then** the Research Mode settings section appears:

**Settings UI:**

* Section header: "Research & Experiments"
* Description: "Help improve Discalculas by participating in experiments. Your data stays on your device."
* Toggle switch: "Enable Research Mode" (off by default)
* Info icon: Tooltip explaining what Research Mode does

**Research Mode Effects:**

* When enabled:
  * User is automatically enrolled in active experiments
  * Experiment metrics collected and stored locally
  * Optional: Badge on home screen "Research Mode Active"
* When disabled:
  * User sees control variants only (no experimentation)
  * No experiment data collected
  * Existing experiment assignments remain (don't reset)

**Informed Consent:**

* Modal on first toggle: "About Research Mode"
* Explanation: "You'll see experimental features that help us test improvements. All data stays on your device. You can disable this anytime."
* Actions: "Enable Research Mode" or "Cancel"

**And** Research Mode state:

* Stored in UserSettingsContext: `researchModeEnabled: boolean`
* Persisted to localStorage: `USER_SETTINGS.researchModeEnabled`
* Affects experiment manager: Checks this setting before assigning variants

**Prerequisites:** Story 8.3 (Experiment dashboard complete)

**Technical Notes:**

* Location: `src/routes/ProfileRoute.tsx` (add Research Mode section)
* Toggle: shadcn/ui Switch component
* Modal: shadcn/ui Dialog with informed consent text
* Context update: `updateSettings({ researchModeEnabled: true })`
* Experiment manager: Check `userSettings.researchModeEnabled` before variant assignment
* Default: Disabled for all users (opt-in only)

***

*For implementation: Use the `create-story` workflow to generate individual story implementation plans from this epic breakdown.*
