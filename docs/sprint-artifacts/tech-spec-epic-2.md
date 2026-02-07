# Epic Technical Specification: Assessment & Onboarding Flow

Date: 2025-11-21
Author: Jeremy
Epic ID: 2
Status: Draft

---

## Overview

Epic 2 delivers the initial dyscalculia assessment experience that identifies user weaknesses in number sense, spatial awareness, and math operations. This 10-question wizard serves as the entry point for new users, establishing their personalized training plan weights that drive adaptive difficulty in subsequent epics. The assessment must feel supportive rather than evaluative, capturing both accuracy and self-reported confidence to build a comprehensive user profile.

This epic transforms the "first use" experience from blank slate to personalized learning path in under 5 minutes, setting the foundation for the Training & Drill Engine (Epic 3) and Adaptive Intelligence (Epic 4).

## Objectives and Scope

### In Scope
- 10-question assessment wizard with multi-step form (3-4 questions per domain)
- Three question type categories: Number Sense, Spatial Awareness, Operations
- Scoring algorithm that identifies weak areas with configurable thresholds
- Training plan weight generation (0.5x-2.0x multipliers by weakness)
- Results summary visualization with strengths/weaknesses display
- Full persistence to Dexie `assessments` table
- E2E test coverage for first-time user journey
- Mobile-first responsive design with 44px+ tap targets
- WCAG 2.1 AA accessibility compliance

### Out of Scope
- Re-assessment scheduling (deferred to Epic 5: Progress)
- Adaptive difficulty during assessment (Epic 4)
- Magic Minute integration (Epic 4)
- Multi-profile support (Vision phase)
- Clinical/diagnostic scoring or formal dyscalculia diagnosis
- Assessment export to external systems

## System Architecture Alignment

**Components Referenced:**
- `src/features/assessment/` - New feature module for wizard, questions, scoring
- `src/routes/AssessmentRoute.tsx` - Route component wrapping assessment feature
- `src/context/SessionContext.tsx` - Stores wizard state and training plan weights
- `src/services/storage/` - Dexie database layer (assessments table from Epic 1)

**Architecture Constraints:**
- Local-first: All assessment data stored in IndexedDB via Dexie (no server)
- Offline-capable: Assessment must complete fully offline
- 100% test coverage: All new code requires unit + component tests
- Performance: <100ms interaction latency, 60fps animations

**Epic 1 Dependencies (All Complete ✅):**
- Dexie database with `assessments` table schema
- React Context providers (AppContext, SessionContext)
- Shared components (LoadingSpinner, ErrorBoundary, BottomNav)
- Testing infrastructure (Vitest, RTL, Playwright)
- CI/CD pipeline with coverage enforcement

---

## Detailed Design

### Services and Modules

| Module | Responsibility | Inputs | Outputs |
|--------|---------------|--------|---------|
| `AssessmentWizard` | Multi-step form orchestration | User interactions, form state | Step navigation, form submission |
| `QuantityComparison` | Number sense Q1: Dot comparison | Question config | User answer, response time |
| `NumberLineEstimation` | Number sense Q2-3: Number placement | Target number, range | Estimated position, accuracy |
| `SpatialRotation` | Spatial Q1-2: Shape rotation matching | Shape configs | Selection, correctness |
| `MirrorRecognition` | Spatial Q3: Mirror image identification | Image pairs | Selection, correctness |
| `BasicOperations` | Operations Q1-2: Mental math | Problem config | User answer, correctness |
| `EstimationProblems` | Operations Q3-4: Approximate answers | Problem config | User answer, accuracy % |
| `ScoringService` | Algorithm to identify weaknesses | All answers | Domain scores, weakness flags |
| `ResultsSummary` | Visualization of strengths/weaknesses | Scoring output | Visual display, training weights |

### Data Models and Contracts

```typescript
// Assessment Record (Dexie storage)
interface Assessment {
  id: string;                    // UUID
  timestamp: string;             // ISO 8601
  status: 'in_progress' | 'completed' | 'abandoned';
  questions: QuestionResult[];   // All 10 question results
  domainScores: DomainScores;    // Aggregated by category
  trainingPlanWeights: TrainingWeights;
  totalDuration: number;         // milliseconds
  confidenceRatings: ConfidenceRatings;
}

// Individual Question Result
interface QuestionResult {
  questionId: string;
  domain: 'number_sense' | 'spatial' | 'operations';
  questionType: string;          // e.g., 'quantity_comparison', 'number_line'
  correct: boolean;
  responseTime: number;          // milliseconds
  userAnswer: string | number;
  expectedAnswer: string | number;
  difficulty: 1 | 2 | 3;         // Easy, Medium, Hard
  confidenceBefore?: number;     // 1-5 scale (optional per-question)
}

// Domain Score Aggregation
interface DomainScores {
  number_sense: {
    score: number;               // 0-100
    questionsCorrect: number;
    totalQuestions: number;
    averageResponseTime: number;
    isWeakness: boolean;         // score < 60
  };
  spatial: { /* same structure */ };
  operations: { /* same structure */ };
}

// Training Plan Weights
interface TrainingWeights {
  number_sense: number;          // 0.5 (strength) to 2.0 (weakness)
  spatial: number;
  operations: number;
  generatedAt: string;           // ISO 8601
}

// Confidence Ratings (Pre/Post Assessment)
interface ConfidenceRatings {
  preAssessment: {
    overallMathConfidence: number;  // 1-10
    spatialConfidence: number;
  };
  postAssessment: {
    overallMathConfidence: number;
    spatialConfidence: number;
    assessmentHelpfulness: number;  // 1-5
  };
}
```

### APIs and Interfaces

**No external APIs** - All local storage operations.

**Internal Service Interfaces:**

```typescript
// ScoringService
interface ScoringService {
  calculateDomainScore(results: QuestionResult[], domain: string): DomainScore;
  identifyWeaknesses(domainScores: DomainScores): string[];
  generateTrainingWeights(domainScores: DomainScores): TrainingWeights;
}

// AssessmentStorage (Dexie operations)
interface AssessmentStorage {
  createAssessment(): Promise<string>;              // Returns ID
  updateProgress(id: string, result: QuestionResult): Promise<void>;
  completeAssessment(id: string, finalData: Assessment): Promise<void>;
  getLatestAssessment(): Promise<Assessment | null>;
  getAssessmentHistory(): Promise<Assessment[]>;
}
```

### Workflows and Sequencing

**First-Time User Assessment Flow:**

```
1. User lands on /assessment (or redirected from Home if no assessment exists)
   ↓
2. AssessmentWizard mounts
   - Shows welcome screen with confidence pre-assessment (1-10 rating)
   - Creates assessment record in Dexie (status: in_progress)
   ↓
3. Question Loop (10 questions)
   For each question:
   a. Render question component based on domain/type
   b. User interacts (tap, drag, type)
   c. Capture answer + response time
   d. Save to SessionContext (batch to Dexie every 3 questions)
   e. Update progress bar
   f. Transition to next question
   ↓
4. Post-Assessment Confidence Prompt
   - Re-ask overall confidence (1-10)
   - Ask helpfulness rating (1-5)
   ↓
5. Calculate Scores
   - ScoringService.calculateDomainScore() for each domain
   - ScoringService.identifyWeaknesses()
   - ScoringService.generateTrainingWeights()
   ↓
6. Display Results
   - ResultsSummary shows strengths (green), weaknesses (orange/red)
   - Training plan weights stored in SessionContext
   - Full assessment record saved to Dexie (status: completed)
   ↓
7. Navigate to Home (or Training)
   - Training weights available for Epic 3
```

**Question Sequencing:**
- Questions 1-3: Number Sense (quantity comparison, number line x2)
- Questions 4-6: Spatial (rotation x2, mirror recognition)
- Questions 7-10: Operations (basic ops x2, estimation x2)

---

## Non-Functional Requirements

### Performance

| Metric | Target | Measurement |
|--------|--------|-------------|
| Question render time | <100ms | Time from navigation to interactive |
| Touch response | <50ms | Tap to visual feedback |
| Animation FPS | 60fps | Progress bar, transitions |
| Total assessment time | <5 min | 10 questions + intro + results |
| Dexie write latency | <50ms | Per question batch |

**PRD Reference:** "<100ms input latency" (NFR Performance)

### Security

- **Data Location:** All assessment data local-only (IndexedDB)
- **No PII:** User ID always `"local_user"`
- **No Transmission:** Assessment results never leave device
- **Clear Data:** User can delete all assessments from Profile

**PRD Reference:** "Data remains local unless explicitly exported" (NFR Security)

### Reliability/Availability

- **Offline Support:** Full assessment completable without connectivity
- **Session Recovery:** If browser closes mid-assessment, resume from last saved question (batched every 3)
- **Data Integrity:** Dexie transactions ensure atomic writes
- **Error Handling:** ErrorBoundary catches component crashes, offers retry

**PRD Reference:** "Telemetry queues survive browser restarts" (NFR Reliability)

### Observability

| Signal | Type | Purpose |
|--------|------|---------|
| `assessment_started` | Event | Track assessment initiation |
| `question_answered` | Event | Per-question logging |
| `assessment_completed` | Event | Completion rate tracking |
| `assessment_abandoned` | Event | Drop-off analysis |
| `domain_score` | Metric | Score distribution |
| `response_time` | Metric | Per-question timing |

**Implementation:** Logged to Dexie `telemetry_logs` table (existing from Epic 1).

---

## Dependencies and Integrations

### Runtime Dependencies (from package.json)

| Package | Version | Usage |
|---------|---------|-------|
| `react` | 19.2.0 | UI framework |
| `react-hook-form` | ^7.66.0 | Wizard form state management |
| `@hookform/resolvers` | ^5.2.2 | Zod validation integration |
| `zod` | ^3.25.76 | Schema validation for answers |
| `dexie` | 4.2.1 | IndexedDB storage |
| `dexie-react-hooks` | 4.2.0 | React integration |
| `framer-motion` | 12.23.24 | Progress bar, transitions |
| `recharts` | 3.3.0 | Results visualization |
| `lucide-react` | ^0.553.0 | Icons for question types |

### Dev Dependencies

| Package | Version | Usage |
|---------|---------|-------|
| `vitest` | ^3.2.4 | Unit/integration tests |
| `@testing-library/react` | 16.3.0 | Component tests |
| `@playwright/test` | 1.56.1 | E2E tests |
| `fake-indexeddb` | ^6.2.5 | Dexie mocking in tests |

### Internal Dependencies (Epic 1)

- `SessionContext` - Stores wizard progress, training weights
- `AppContext` - App-level state (streak, settings)
- `db.assessments` - Dexie table (schema defined in Epic 1)
- `LoadingSpinner` - Shared loading state
- `ErrorBoundary` - Error recovery

---

## Acceptance Criteria (Authoritative)

1. **AC-2.1:** AssessmentWizard renders with step indicator ("Question X of 10"), progress bar (0-100%), and 44px+ tap targets
2. **AC-2.2:** Pre-assessment confidence prompt captures 1-10 rating before questions begin
3. **AC-2.3:** Number sense questions (quantity comparison, number line estimation) render with visual manipulatives
4. **AC-2.4:** Spatial questions (rotation, mirror) use visual shape displays with clear selection states
5. **AC-2.5:** Operations questions (basic math, estimation) support numeric keyboard entry
6. **AC-2.6:** Each question records: correctness, response time, user answer, expected answer
7. **AC-2.7:** Progress persists: browser close and reopen resumes from last saved question
8. **AC-2.8:** Scoring algorithm calculates domain scores (0-100) with weakness threshold < 60
9. **AC-2.9:** Training weights generated: 2.0x for weaknesses, 0.5x for strengths, normalized to sum=1.0
10. **AC-2.10:** Results summary displays strengths (green checkmark) and weaknesses (orange warning) with domain labels
11. **AC-2.11:** Post-assessment confidence prompt captures updated rating and helpfulness (1-5)
12. **AC-2.12:** Assessment record saved to Dexie with status='completed' and all fields populated
13. **AC-2.13:** Training weights stored in SessionContext for Epic 3 consumption
14. **AC-2.14:** E2E test completes full first-time user flow: /assessment → 10 questions → results → navigate
15. **AC-2.15:** All components meet WCAG 2.1 AA: focus order, 4.5:1 contrast, ARIA labels
16. **AC-2.16:** 100% test coverage for all new code (enforced by CI)

---

## Traceability Mapping

| AC | Spec Section | Components/Services | Test Idea |
|----|--------------|---------------------|-----------|
| AC-2.1 | Workflows | `AssessmentWizard`, `Progress` | Render wizard, verify step/progress display |
| AC-2.2 | Data Models | `ConfidencePrompt` | Submit rating, verify stored |
| AC-2.3 | Services/Modules | `QuantityComparison`, `NumberLineEstimation` | Render questions, interact, verify recording |
| AC-2.4 | Services/Modules | `SpatialRotation`, `MirrorRecognition` | Shape selection, state feedback |
| AC-2.5 | Services/Modules | `BasicOperations`, `EstimationProblems` | Keyboard input, answer validation |
| AC-2.6 | Data Models | `QuestionResult` interface | Verify all fields populated after answer |
| AC-2.7 | Reliability | `AssessmentStorage` | Simulate browser close, verify resume |
| AC-2.8 | Services/Modules | `ScoringService` | Unit test scoring algorithm |
| AC-2.9 | Data Models | `TrainingWeights` | Unit test weight generation |
| AC-2.10 | Services/Modules | `ResultsSummary` | Render with mock scores, verify visual |
| AC-2.11 | Data Models | `ConfidenceRatings` | Post-assessment prompt capture |
| AC-2.12 | Data Models | `Assessment` interface | Verify Dexie record after completion |
| AC-2.13 | APIs/Interfaces | `SessionContext` | Verify weights accessible after assessment |
| AC-2.14 | E2E Test | Full flow | Playwright: /assessment → complete → verify |
| AC-2.15 | NFR Accessibility | All components | axe accessibility audit |
| AC-2.16 | NFR Testability | All code | Coverage report ≥100% |

---

## Risks, Assumptions, Open Questions

### Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Question difficulty calibration may not accurately identify dyscalculia weaknesses | Medium | High | Start with research-backed question types from domain research; iterate based on self-reported feedback |
| Users may abandon 10-question assessment as too long | Medium | Medium | Show clear progress; design questions to complete in <30s each; total <5 min |
| Scoring thresholds (60% weakness) may be arbitrary | Low | Medium | Make thresholds configurable; gather data for adjustment in Epic 8 Research Mode |

### Assumptions

- **A1:** Users will complete assessment in single session (no multi-day assessments)
- **A2:** 10 questions provides sufficient signal for initial weakness identification
- **A3:** Self-reported confidence correlates with actual dyscalculia challenges
- **A4:** Mobile-first design (320px+) covers all target devices
- **A5:** Randomizing question variants prevents memorization on re-assessment

### Open Questions

- **Q1:** Should we offer "skip assessment" for returning users who want to jump to training?
  - *Recommendation:* No for MVP; assessment required for personalized training
- **Q2:** How often should re-assessment be prompted? Weekly? After N sessions?
  - *Recommendation:* Defer to Epic 5 (Progress tracking)
- **Q3:** Should question difficulty vary within assessment based on early answers?
  - *Recommendation:* No for MVP; fixed difficulty provides consistent baseline (adaptive in Epic 4)

---

## Test Strategy Summary

### Test Levels

| Level | Framework | Coverage Target | Scope |
|-------|-----------|-----------------|-------|
| Unit | Vitest | 100% | ScoringService, utilities, helpers |
| Component | RTL + Vitest | 100% | All question components, wizard, results |
| Integration | Vitest + fake-indexeddb | 100% | Dexie operations, context integration |
| E2E | Playwright | Critical paths | Full assessment journey |

### Key Test Cases

**Unit Tests:**
- `ScoringService.calculateDomainScore()` - Correct calculation with various inputs
- `ScoringService.generateTrainingWeights()` - Weight normalization, weakness detection
- Date formatting, response time calculations

**Component Tests:**
- `AssessmentWizard` - Step navigation, progress updates, form submission
- `QuantityComparison` - Tap selection, correct/incorrect states
- `NumberLineEstimation` - Drag interaction, accuracy calculation
- `SpatialRotation` - Shape selection, rotation display
- `ResultsSummary` - Strength/weakness rendering, training weights display

**Integration Tests:**
- Assessment create → update → complete cycle in Dexie
- SessionContext training weights persistence
- Browser storage/resume functionality

**E2E Tests (Story 2.7):**
- Complete first-time user journey
- All question types interactable
- Results displayed correctly
- Data persisted after completion

### Coverage Enforcement

- 100% statement/branch/function/line coverage required
- CI blocks merge if coverage drops
- Existing infrastructure from Epic 1 enforces thresholds
