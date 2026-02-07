### Story 6.1: Build Coach Guidance System

**As a** user navigating the app,
**I want** helpful tips and guidance that appear at the right moments,
**So that** I understand what to do next and stay motivated.

**Acceptance Criteria:**

**Given** progress tracking is complete (Epic 5 done)
**When** I interact with different parts of the app
**Then** the Coach component provides contextual guidance:

**Coach Guidance Triggers:**

* **First launch**: "Welcome! Let's start with a quick assessment to personalize your training."
* **After assessment**: "Great! You're ready to start training. Your first session focuses on \[weak area]."
* **Before first training session**: "Tip: Training sessions take 5-15 minutes. Find a quiet spot and let's begin!"
* **After 3 sessions**: "You're building consistency! Try to practice every day for best results."
* **Streak broken**: "Don't worry! Every practice counts. Start a new streak today."
* **High accuracy (>85%)**: "Excellent work! We're increasing the challenge to keep you growing."
* **Low consistency (<2 sessions/week)**: "Try setting a daily reminder to help build your practice habit."

**Coach UI:**

* Card component (shadcn/ui Card)
* Coach icon: 💬 or 🎓 (speech bubble or graduation cap)
* Title: "Coach" or "Tip"
* Message text: 2-3 sentences, encouraging tone
* Optional action button: "Start Assessment", "Begin Training", etc.
* Dismissible: X button in top-right corner

**Coach Context Algorithm** (`src/features/coach/services/coachEngine.ts`):

* Checks user state: sessions completed, streak status, last session date, accuracy trends
* Selects most relevant guidance from priority list
* Stores dismissed tips in localStorage (don't repeat immediately)
* Refreshes guidance after each session completion

**And** Coach placement:

* Home screen: Top of page (after streak counter)
* Progress screen: After insights section
* Profile screen: Optional encouragement based on overall progress

**Prerequisites:** Epic 5 complete (progress data available for context)

**Technical Notes:**

* Location: `src/features/coach/components/CoachGuidance.tsx`
* Coach engine: `src/features/coach/services/coachEngine.ts`
  * Function: `getContextualGuidance() => CoachMessage | null`
* Message templates: `src/features/coach/content/messages.ts`
* localStorage key: `DISMISSED_COACH_TIPS` (array of message IDs)
* Test: Mock user states, verify correct guidance appears

***
