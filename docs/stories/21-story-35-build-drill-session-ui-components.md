### Story 3.5: Build Drill Session UI Components

**Status:** ready-for-dev

**As a** user in a training session,
**I want** clear visual feedback and progress indicators throughout my session,
**So that** I stay motivated and know how much I've completed.

**Acceptance Criteria:**

**Given** all three drill types are implemented (Story 3.4 complete)
**When** I am in an active training session
**Then** the following UI components are operational:

**SessionProgressBar** (`src/features/training/components/SessionProgressBar.tsx`):

* Shows "Drill X of Y" text (e.g., "Drill 3 of 12")
* Horizontal progress bar (0-100% filled, coral primary color)
* Animated fill as drills complete (Framer Motion transition)
* Positioned at top of training session view

**DrillTransition** (`src/features/training/components/DrillTransition.tsx`):

* Appears between drills for 0.5 seconds
* Shows next drill type icon + name:
  * 📏 "Number Line"
  * 🔄 "Spatial Rotation"
  * ➕ "Math Operations"
* Subtle fade-in/fade-out animation
* Prevents jarring instant switches between drill types

**SessionFeedback** (`src/features/training/components/SessionFeedback.tsx`):

* Correct answer feedback: Green checkmark ✓, "+1" floating animation
* Incorrect answer feedback: Red X ✗, show correct answer text
* Streak counter mini-animation: Flame 🔥 pulses when drill correct
* Success sound (if sound enabled in UserSettingsContext)

**PauseButton** (in session header):

* Icon button (⏸ pause symbol, 44px tap target)
* Opens pause modal with options:
  * "Resume" (coral button)
  * "End Session Early" (gray button, shows confirmation)
  * Shows current progress: "7 of 12 drills complete"

**And** All components use Tailwind classes, no inline styles
**And** All animations respect `prefers-reduced-motion` media query
**And** Sound effects use Web Audio API, respect UserSettingsContext.soundEnabled

**Prerequisites:** Story 3.4 (Math Operations Drill implemented)

**Technical Notes:**

* Progress bar: shadcn/ui `<Progress>` component with Framer Motion
* Drill icons: Use emoji or Lucide React icons
* Sound effects: Store in `public/sounds/` (success.mp3, incorrect.mp3, short files <50kb)
* Pause modal: shadcn/ui `<Dialog>` component
* Test pause functionality: Verify drill timer stops, session state preserved

***

**Dev Agent Record:**

**Context Reference:**
* `docs/sprint-artifacts/3-5-build-drill-session-ui-components.context.xml`

***
