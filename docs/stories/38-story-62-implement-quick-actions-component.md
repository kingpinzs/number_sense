### Story 6.2: Implement Quick Actions Component

**As a** user on the home screen,
**I want** quick access to relevant actions,
**So that** I can jump directly to what I need to do next.

**Acceptance Criteria:**

**Given** Coach guidance is operational (Story 6.1 complete)
**When** I view the home screen
**Then** the QuickActions component displays 2-4 action cards:

**Quick Action Options:**

* **Start Training**: If no session today → coral button, "Continue your streak!"
* **View Progress**: If 3+ sessions completed → mint button, "See how you're improving"
* **Take Assessment**: If no assessment yet → yellow button, "Discover your strengths"
* **Try Cognition Games**: If user has trained 5+ times → secondary button, "Take a brain break"
* **Review Insights**: If new insights available → secondary button, badge showing count

**Action Card Design:**

* Grid layout: 2 columns on mobile, 4 columns on tablet+
* Each card: Icon (64px), title, subtitle, button
* Hover effect: Subtle lift (Framer Motion)
* Priority order: Most relevant action first (top-left)

**Dynamic Action Selection:**

* Algorithm prioritizes based on user state:
  1. No session today + streak active → "Start Training" (prevent break)
  2. No assessment → "Take Assessment" (onboarding)
  3. New insights → "Review Insights" (discovery)
  4. Default → "Start Training" + "View Progress"

**And** Action tracking:

* Log to telemetry when quick action clicked
* Track which actions users engage with most
* Data: `{ event: 'quick_action_clicked', action: 'start_training', source: 'home' }`

**Prerequisites:** Story 6.1 (Coach guidance complete)

**Technical Notes:**

* Location: `src/features/coach/components/QuickActions.tsx`
* Action selector: `src/features/coach/services/actionSelector.ts`
  * Function: `selectQuickActions(userState) => Action[]`
* Icons: Use Lucide React icons or emoji
* Navigation: React Router `useNavigate()` hook
* Test: Mock user states, verify correct actions displayed

***
