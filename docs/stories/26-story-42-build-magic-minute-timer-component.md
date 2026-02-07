### Story 4.2: Build Magic Minute Timer Component

**As a** user in a training session,
**I want** surprise 60-second micro-challenges that appear mid-session,
**So that** I experience focused, high-energy sprints that break up regular practice.

**Acceptance Criteria:**

**Given** mistake analysis engine is operational (Story 4.1 complete)
**When** I am in a training session and have completed 6+ drills
**Then** the Magic Minute trigger logic activates:

* Random chance after drill 6, 9, or 12 (30% probability each)
* Alternative: Fixed after drill 8 (simpler, more predictable for MVP)
* Only triggers once per session
* Only if at least 3 mistakes detected (needs content for micro-challenges)

**When** Magic Minute triggers
**Then** the MagicMinuteTimer component renders:

**Timer UI:**

* Full-screen overlay (dim background, focus on timer)
* Large countdown: "60" → "59" → ... → "0" (72px font, coral color)
* Title: "⚡ Magic Minute! Answer as many as you can!"
* Instruction: "Quick challenges based on your recent mistakes"
* Progress: "X correct" counter (updates in real-time)
* No pause button (60 seconds is short, maintain urgency)

**Timer Behavior:**

* Countdown starts immediately (no "Start" button)
* Updates every second (not milliseconds - reduce pressure)
* At 0 seconds: Auto-ends, shows summary
* Keyboard accessible: Focus trap within Magic Minute modal

**Visual Design:**

* Pulsing border animation (Framer Motion)
* Coral accent color (#E87461) for urgency
* Larger fonts, higher contrast (readability under time pressure)
* Celebration animation at timer end (confetti burst)

**And** Magic Minute session created in Dexie:

```typescript
await db.magic_minute_sessions.add({
  id: uuid(),
  sessionId: currentSessionId,
  timestamp: Date.now(),
  correctCount: 0,  // Updated as user answers
  totalChallenges: 0,
  duration: 60000
});
```

**And** SessionContext state updated:

* `magicMinuteActive: boolean`
* `magicMinuteStartTime: number`
* `magicMinuteResults: Array<{ correct: boolean, timeToAnswer: number }>`

**Prerequisites:** Story 4.1 (Mistake analysis operational)

**Technical Notes:**

* Location: `src/features/magic-minute/components/MagicMinuteTimer.tsx`
* Timer implementation: `setInterval(() => setTimeLeft(prev => prev - 1), 1000)`
* Cleanup: `useEffect` cleanup clears interval on unmount
* State persistence: If user navigates away, Magic Minute cancelled (don't persist)
* Sound effects: Optional tick-tock sound (can be toggled off)
* Accessibility: `role="timer"`, `aria-live="polite"` for countdown announcements

***
