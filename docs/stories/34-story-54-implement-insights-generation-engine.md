### Story 5.4: Implement Insights Generation Engine

**As a** user reviewing my progress,
**I want** personalized insights about my performance patterns,
**So that** I understand what I'm doing well and where to focus next.

**Acceptance Criteria:**

**Given** streak counter is integrated on home screen (Story 5.3 complete)
**When** I navigate to `/progress` route
**Then** the Insights section appears below the Confidence Radar:

**Insight Generation Logic:**
`InsightsEngine` (`src/features/progress/services/insightsEngine.ts`) analyzes:

**Pattern Detection:**

* **Consistency patterns**:
  * "You've trained X days this week - great consistency!" (if >4 sessions/week)
  * "Try to train more regularly - only X sessions this week" (if <3 sessions/week)
* **Performance trends**:
  * "Your Number Line accuracy improved 15% this month!" (if upward trend)
  * "Spatial Rotation is getting easier for you" (if confidence increasing)
  * "Math Operations accuracy dipped this week - let's focus there" (if downward trend)
* **Time patterns**:
  * "You're fastest at Number Line drills (avg 2.8s)" (if significantly faster than others)
  * "Taking your time on Spatial Rotation - accuracy is high!" (if slower but accurate)
* **Confidence insights**:
  * "Your confidence is growing! +8 points this month" (if confidenceChange trending positive)
  * "Practice is building confidence - you're up to 4.2/5 on average!" (if high confidence)

**Insight Display:**

* 2-3 insights shown at a time (most relevant first)
* Card-based layout (shadcn/ui Card with icon)
* Icons: 📈 (trend up), 📊 (stats), ⚡ (speed), 💪 (improvement), 🎯 (focus)
* Refreshes after each session (new insights based on updated data)

**Insight Priority:**

1. Milestone celebrations (streak, accuracy achievements)
2. Concerning trends (accuracy drop, low consistency)
3. Positive trends (improvements, speed gains)
4. General observations (patterns, preferences)

**And** Insights are actionable:

* Each insight includes suggestion: "Keep up the great work!" or "Try a training session today"
* Insights link to relevant actions: "Start Training" button, "View History" link

**And** Insights storage (optional for MVP):

* Save generated insights to `insights` localStorage key (JSON array)
* Prevents regenerating same insight repeatedly
* Max 10 stored insights, rotate out oldest

**Prerequisites:** Story 5.3 (Streak counter integrated, full progress data available)

**Technical Notes:**

* Location: `src/features/progress/services/insightsEngine.ts`
* Functions:
  * `generateInsights(sessions, drillResults) => Insight[]`
  * `detectTrend(values) => 'improving' | 'stable' | 'declining'`
  * `calculateWeeklyConsistency(sessions) => number`
* Trend detection: Linear regression on last 10 sessions per domain
* Insights component: `src/features/progress/components/InsightsPanel.tsx`
* Test: Mock session data with known patterns, verify correct insights generated

***
