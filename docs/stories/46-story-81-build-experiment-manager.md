### Story 8.1: Build Experiment Manager

**As a** developer testing new features,
**I want** an experiment management system,
**So that** I can run A/B tests on-device without backend infrastructure.

**Acceptance Criteria:**

**Given** PWA infrastructure is complete (Epic 7 done)
**When** I define a new experiment
**Then** the ExperimentManager handles experiment lifecycle:

**Experiment Definition** (`src/services/research/experiments.ts`):

```typescript
const EXPERIMENTS: Experiment[] = [
  {
    id: 'drill-timer-visibility',
    name: 'Drill Timer Visibility',
    description: 'Test if showing/hiding timer affects accuracy',
    status: 'active',
    startDate: '2025-11-09',
    endDate: '2025-12-09',
    variants: [
      { id: 'control', name: 'Timer Visible', weight: 0.5 },
      { id: 'treatment', name: 'Timer Hidden', weight: 0.5 }
    ],
    metrics: ['drill_accuracy', 'drill_speed', 'user_confidence']
  },
  {
    id: 'confidence-scale',
    name: 'Confidence Prompt Scale',
    description: 'Test 5-point vs 3-point confidence scale',
    status: 'draft',
    variants: [
      { id: 'control', name: '5-point (current)', weight: 0.5 },
      { id: 'treatment', name: '3-point (simplified)', weight: 0.5 }
    ],
    metrics: ['prompt_completion_rate', 'confidence_change']
  }
];
```

**Experiment Manager** (`src/services/research/experimentManager.ts`):

* `getActiveExperiments() => Experiment[]` - Returns active experiments
* `assignVariant(experimentId, userId) => Variant` - Assigns user to variant (deterministic)
* `getAssignedVariant(experimentId) => Variant | null` - Gets user's assigned variant
* `recordObservation(experimentId, metric, value) => void` - Records experiment outcome

**Variant Assignment:**

* Deterministic: Based on hash of (userId + experimentId)
* Consistent: Same user always gets same variant for same experiment
* Weighted: Respects variant weights (e.g., 50/50 split)

**Storage:**

```typescript
await db.experiments.add({
  id: experimentId,
  variantId: assignedVariant.id,
  assignedAt: Date.now(),
  status: 'active'
});
```

**Prerequisites:** Epic 7 complete (PWA ready for production)

**Technical Notes:**

* Location: `src/services/research/experimentManager.ts`
* User ID: Generate UUID on first launch, store in localStorage (`USER_ID`)
* Hash function: Simple hash (`userId.charCodeAt() % 100 < variant.weight * 100`)
* Active experiments: Only experiments with `status: 'active'` and within date range
* Test: Verify same user gets consistent variant across sessions

***
