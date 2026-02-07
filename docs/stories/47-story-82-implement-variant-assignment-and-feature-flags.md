### Story 8.2: Implement Variant Assignment and Feature Flags

**As a** developer implementing experiment variants,
**I want** feature flags that conditionally render UI based on variant assignment,
**So that** I can test different implementations easily.

**Acceptance Criteria:**

**Given** experiment manager is operational (Story 8.1 complete)
**When** I use the feature flag hook
**Then** components render variant-specific UI:

**Feature Flag Hook** (`src/services/research/useExperiment.ts`):

```typescript
export function useExperiment(experimentId: string) {
  const variant = experimentManager.getAssignedVariant(experimentId);

  return {
    variant: variant?.id ?? 'control',
    isControl: variant?.id === 'control',
    isTreatment: variant?.id === 'treatment',
    recordMetric: (metric, value) => experimentManager.recordObservation(experimentId, metric, value)
  };
}
```

**Usage Example:**

```typescript
function NumberLineDrill() {
  const { variant, recordMetric } = useExperiment('drill-timer-visibility');
  const showTimer = variant === 'control';  // Control: show timer, Treatment: hide timer

  return (
    <div>
      {showTimer && <Timer />}
      <NumberLine onComplete={(result) => {
        recordMetric('drill_accuracy', result.accuracy);
        recordMetric('drill_speed', result.timeToAnswer);
      }} />
    </div>
  );
}
```

**Feature Flag Patterns:**

* **UI Visibility**: Show/hide components based on variant
* **Parameter Tuning**: Adjust values (e.g., timer duration, tolerance)
* **Flow Changes**: Alter user flows (e.g., skip vs require steps)
* **Design Variations**: Test different colors, layouts, copy

**And** Experiment guard:

* If Research Mode disabled: Always return 'control' variant
* If experiment inactive/expired: Return 'control' variant
* Fallback: Default to control if any error

**Prerequisites:** Story 8.1 (Experiment manager complete)

**Technical Notes:**

* Hook location: `src/services/research/useExperiment.ts`
* React hook: Uses `useState` to cache variant assignment
* Assignment happens once per user per experiment (stored in Dexie)
* Experiment status check: Verify `status === 'active'` and within date range
* Test: Verify control vs treatment render different UI

***
