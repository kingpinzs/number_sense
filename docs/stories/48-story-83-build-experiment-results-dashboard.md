### Story 8.3: Build Experiment Results Dashboard

**As a** developer analyzing experiment results,
**I want** a dashboard showing experiment metrics and comparisons,
**So that** I can determine which variant performs better.

**Acceptance Criteria:**

**Given** variant assignment is operational (Story 8.2 complete)
**When** I navigate to `/research` (dev-only route)
**Then** the ExperimentDashboard displays all experiments:

**Dashboard Layout:**

* List of experiments (active first, then draft, then completed)
* Each experiment card shows:
  * Name and description
  * Status badge (active/draft/completed)
  * Variant split: "50% Control, 50% Treatment"
  * Observation count: "127 observations"
  * "View Results" button

**Experiment Results View:**

* Metric comparison table:
  | Metric | Control | Treatment | Difference | Significance |
  |--------|---------|-----------|------------|--------------|
  | Accuracy | 82.3% | 85.7% | +3.4% | 🟢 |
  | Speed | 3.2s | 2.9s | -0.3s | 🟢 |
  | Confidence | +1.8 | +2.1 | +0.3 | 🟡 |

* Visualization: Bar charts comparing variants (Recharts)

* Sample size: "63 control, 64 treatment"

* Duration: "Active for 15 days"

**Statistical Analysis:**

* Calculate mean and standard deviation per variant
* Difference: `treatment_mean - control_mean`
* Significance indicator:
  * 🟢 Green: Large difference (>10% or >0.5 SD)
  * 🟡 Yellow: Moderate difference (5-10%)
  * 🔴 Red: Minimal difference (<5%)
* Note: This is basic analysis, not rigorous statistical testing

**And** Export results:

* "Export as CSV" button downloads experiment data
* Includes all observations with timestamps, variants, metrics

**Prerequisites:** Story 8.2 (Variant assignment complete)

**Technical Notes:**

* Location: `src/features/research/components/ExperimentDashboard.tsx`
* Dev-only route: Add route guard checking `NODE_ENV === 'development'` or Research Mode enabled
* Query observations: `db.experiment_observations.where('experimentId').equals(id).toArray()`
* Stats calculation: `src/services/research/statsCalculator.ts`
  * Functions: `calculateMean()`, `calculateStdDev()`, `compareVariants()`
* Recharts: Bar chart for metric comparisons
* Test: Seed database with mock observations, verify calculations

***
