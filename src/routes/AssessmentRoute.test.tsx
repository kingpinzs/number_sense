// AssessmentRoute tests
// Tests for full-page assessment route with 18-question flow across 6 domains

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import AssessmentRoute from './AssessmentRoute';

// Mock the SessionContext
const mockStartSession = vi.fn();
const mockEndSession = vi.fn();

vi.mock('@/context/SessionContext', () => ({
  useSession: () => ({
    startSession: mockStartSession,
    endSession: mockEndSession,
  }),
}));

// Mock react-router-dom navigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock the question generators (imported from content/questions in AssessmentRoute)
// All generators return quantity-comparison type questions for simplicity
vi.mock('@/features/assessment/content/questions', () => ({
  generateNumberSenseQuestions: () => [
    { type: 'quantity-comparison', id: 'q1', leftCount: 10, rightCount: 5 },
    { type: 'quantity-comparison', id: 'q2', leftCount: 8, rightCount: 12 },
    { type: 'quantity-comparison', id: 'q3', leftCount: 15, rightCount: 9 },
  ],
  generatePlaceValueQuestions: () => [
    { type: 'quantity-comparison', id: 'q4', leftCount: 7, rightCount: 3 },
    { type: 'quantity-comparison', id: 'q5', leftCount: 11, rightCount: 6 },
    { type: 'quantity-comparison', id: 'q6', leftCount: 14, rightCount: 2 },
  ],
  generateSequencingQuestions: () => [
    { type: 'quantity-comparison', id: 'q7', leftCount: 20, rightCount: 18 },
    { type: 'quantity-comparison', id: 'q8', leftCount: 13, rightCount: 16 },
    { type: 'quantity-comparison', id: 'q9', leftCount: 9, rightCount: 4 },
  ],
  generateArithmeticQuestions: () => [
    { type: 'quantity-comparison', id: 'q10', leftCount: 17, rightCount: 12 },
    { type: 'quantity-comparison', id: 'q11', leftCount: 6, rightCount: 19 },
    { type: 'quantity-comparison', id: 'q12', leftCount: 5, rightCount: 5 },
  ],
  generateSpatialQuestions: () => [
    { type: 'quantity-comparison', id: 'q13', leftCount: 8, rightCount: 3 },
    { type: 'quantity-comparison', id: 'q14', leftCount: 12, rightCount: 7 },
    { type: 'quantity-comparison', id: 'q15', leftCount: 18, rightCount: 11 },
  ],
  generateAppliedQuestions: () => [
    { type: 'quantity-comparison', id: 'q16', leftCount: 16, rightCount: 10 },
    { type: 'quantity-comparison', id: 'q17', leftCount: 4, rightCount: 20 },
    { type: 'quantity-comparison', id: 'q18', leftCount: 9, rightCount: 14 },
  ],
}));

// Mock the scoring service
vi.mock('@/services/assessment/scoring', () => ({
  calculateDomainScore: () => 3.33,
  ALL_DOMAINS: ['number_sense', 'place_value', 'sequencing', 'arithmetic', 'spatial', 'applied'],
}));

// Mock the question components to simplify testing
// All questions are quantity-comparison, so only QuantityComparison mock is needed
vi.mock('@/features/assessment', () => ({
  QuantityComparison: ({ onAnswer }: any) => (
    <div data-testid="quantity-comparison">
      <button onClick={() => onAnswer({ answer: 'left', isCorrect: true, timeToAnswer: 1000, leftCount: 10, rightCount: 5 })}>
        Answer Left
      </button>
    </div>
  ),
  NumberLineEstimation: ({ onAnswer }: any) => (
    <div data-testid="number-line">
      <button onClick={() => onAnswer({ userAnswer: 50, isCorrect: true, timeToAnswer: 1000, targetNumber: 50, range: [0, 100] })}>
        Answer 50
      </button>
    </div>
  ),
  MentalRotation: ({ onAnswer }: any) => (
    <div data-testid="mental-rotation">
      <button onClick={() => onAnswer({ answer: 'yes', isCorrect: true, timeToAnswer: 1000, shapeType: 'L-shape', rotationAngle: 90, isMatch: true })}>
        Answer Yes
      </button>
    </div>
  ),
  PatternMatching: ({ onAnswer }: any) => (
    <div data-testid="pattern-matching">
      <button onClick={() => onAnswer({ selectedOption: 'A', isCorrect: true, timeToAnswer: 1000, patternType: 'checkerboard', correctOption: 'A' })}>
        Answer A
      </button>
    </div>
  ),
  BasicOperations: ({ onAnswer }: any) => (
    <div data-testid="basic-operations">
      <button onClick={() => onAnswer({ userAnswer: 15, isCorrect: true, timeToAnswer: 1000, operationType: 'addition', operand1: 10, operand2: 5, correctAnswer: 15 })}>
        Answer 15
      </button>
    </div>
  ),
  WordProblem: ({ onAnswer }: any) => (
    <div data-testid="word-problem">
      <button onClick={() => onAnswer({ userAnswer: 20, isCorrect: true, timeToAnswer: 1000, problemText: 'Test problem', correctAnswer: 20 })}>
        Answer 20
      </button>
    </div>
  ),
  SymbolicComparison: ({ onAnswer }: any) => (
    <div data-testid="symbolic-comparison">
      <button onClick={() => onAnswer({ answer: 'left', isCorrect: true, timeToAnswer: 1000 })}>
        Answer Left
      </button>
    </div>
  ),
  DigitValue: ({ onAnswer }: any) => (
    <div data-testid="digit-value">
      <button onClick={() => onAnswer({ userAnswer: 300, isCorrect: true, timeToAnswer: 1000 })}>
        Answer 300
      </button>
    </div>
  ),
  EstimationQuestion: ({ onAnswer }: any) => (
    <div data-testid="estimation-question">
      <button onClick={() => onAnswer({ userAnswer: 85, isCorrect: true, timeToAnswer: 1000 })}>
        Answer 85
      </button>
    </div>
  ),
  NumberDecomposition: ({ onAnswer }: any) => (
    <div data-testid="number-decomposition">
      <button onClick={() => onAnswer({ userAnswer: '300 + 50 + 7', isCorrect: true, timeToAnswer: 1000 })}>
        Answer Decomposition
      </button>
    </div>
  ),
  NumberOrdering: ({ onAnswer }: any) => (
    <div data-testid="number-ordering">
      <button onClick={() => onAnswer({ order: [1, 2, 3], isCorrect: true, timeToAnswer: 1000 })}>
        Answer Order
      </button>
    </div>
  ),
  SkipCounting: ({ onAnswer }: any) => (
    <div data-testid="skip-counting">
      <button onClick={() => onAnswer({ userAnswer: 15, isCorrect: true, timeToAnswer: 1000 })}>
        Answer 15
      </button>
    </div>
  ),
  TimedFactRetrieval: ({ onAnswer }: any) => (
    <div data-testid="timed-fact-retrieval">
      <button onClick={() => onAnswer({ userAnswer: 12, isCorrect: true, timeToAnswer: 1000 })}>
        Answer 12
      </button>
    </div>
  ),
  MirrorDiscrimination: ({ onAnswer }: any) => (
    <div data-testid="mirror-discrimination">
      <button onClick={() => onAnswer({ answer: 'mirrored', isCorrect: true, timeToAnswer: 1000 })}>
        Answer Mirrored
      </button>
    </div>
  ),
  FractionIdentification: ({ onAnswer }: any) => (
    <div data-testid="fraction-identification">
      <button onClick={() => onAnswer({ userAnswer: '1/2', isCorrect: true, timeToAnswer: 1000 })}>
        Answer 1/2
      </button>
    </div>
  ),
  ClockReading: ({ onAnswer }: any) => (
    <div data-testid="clock-reading">
      <button onClick={() => onAnswer({ userAnswer: '3:15', isCorrect: true, timeToAnswer: 1000 })}>
        Answer 3:15
      </button>
    </div>
  ),
  WorkingMemorySpan: ({ onAnswer }: any) => (
    <div data-testid="working-memory-span">
      <button onClick={() => onAnswer({ userAnswer: 15, isCorrect: true, timeToAnswer: 1000 })}>
        Answer 15
      </button>
    </div>
  ),
  ResultsSummary: ({ domainScores, completionTime, onStartTraining }: any) => (
    <div data-testid="results-summary">
      <h1>Results Summary</h1>
      <div>Domain Scores: {JSON.stringify(domainScores)}</div>
      <div>Completion Time: {completionTime.minutes}m {completionTime.seconds}s</div>
      <button onClick={onStartTraining}>Start Training</button>
    </div>
  ),
}));

describe('AssessmentRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders assessment header and first question', () => {
    render(
      <MemoryRouter>
        <AssessmentRoute />
      </MemoryRouter>
    );

    expect(screen.getByText('Assessment')).toBeInTheDocument();
    expect(screen.getByText('Question 1 of 18')).toBeInTheDocument();
    expect(screen.getByTestId('quantity-comparison')).toBeInTheDocument();
  });

  it('starts a session on mount', () => {
    render(
      <MemoryRouter>
        <AssessmentRoute />
      </MemoryRouter>
    );

    expect(mockStartSession).toHaveBeenCalledWith('assessment', expect.any(Number));
  });

  it('disables Next button when no answer is provided', () => {
    render(
      <MemoryRouter>
        <AssessmentRoute />
      </MemoryRouter>
    );

    const nextButton = screen.getByTestId('next-button');
    expect(nextButton).toBeDisabled();
  });

  it('enables and styles Next button when answer is provided', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <AssessmentRoute />
      </MemoryRouter>
    );

    // Answer the question
    const answerButton = screen.getByText('Answer Left');
    await user.click(answerButton);

    // Next button should be enabled and have success styling
    const nextButton = screen.getByTestId('next-button');
    expect(nextButton).not.toBeDisabled();
    expect(nextButton).toHaveClass('bg-success');
  });

  it('navigates to next question when Next is clicked', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <AssessmentRoute />
      </MemoryRouter>
    );

    // Answer first question
    await user.click(screen.getByText('Answer Left'));

    // Click Next
    await user.click(screen.getByTestId('next-button'));

    // Should show question 2
    await waitFor(() => {
      expect(screen.getByText('Question 2 of 18')).toBeInTheDocument();
    });
  });

  it('navigates to previous question when Previous is clicked', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <AssessmentRoute />
      </MemoryRouter>
    );

    // Answer first question and go to second
    await user.click(screen.getByText('Answer Left'));
    await user.click(screen.getByTestId('next-button'));

    await waitFor(() => {
      expect(screen.getByText('Question 2 of 18')).toBeInTheDocument();
    });

    // Click Previous
    await user.click(screen.getByTestId('previous-button'));

    // Should show question 1 again
    await waitFor(() => {
      expect(screen.getByText('Question 1 of 18')).toBeInTheDocument();
    });
  });

  it('disables Previous button on first question', () => {
    render(
      <MemoryRouter>
        <AssessmentRoute />
      </MemoryRouter>
    );

    const previousButton = screen.getByTestId('previous-button');
    expect(previousButton).toBeDisabled();
  });

  it('shows exit confirmation when exit button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <AssessmentRoute />
      </MemoryRouter>
    );

    // Click exit button
    await user.click(screen.getByTestId('exit-button'));

    // Should show confirmation dialog
    expect(screen.getByText('Exit Assessment?')).toBeInTheDocument();
    expect(screen.getByText('Your progress will be lost. Are you sure you want to exit?')).toBeInTheDocument();
  });

  it('cancels exit when Cancel is clicked', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <AssessmentRoute />
      </MemoryRouter>
    );

    // Show exit confirmation
    await user.click(screen.getByTestId('exit-button'));
    expect(screen.getByText('Exit Assessment?')).toBeInTheDocument();

    // Click Cancel
    await user.click(screen.getByTestId('cancel-exit-button'));

    // Should return to question
    await waitFor(() => {
      expect(screen.queryByText('Exit Assessment?')).not.toBeInTheDocument();
      expect(screen.getByTestId('quantity-comparison')).toBeInTheDocument();
    });
  });

  it('confirms exit and navigates home when Exit is clicked', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <AssessmentRoute />
      </MemoryRouter>
    );

    // Show exit confirmation
    await user.click(screen.getByTestId('exit-button'));

    // Click Exit
    await user.click(screen.getByTestId('confirm-exit-button'));

    // Should end session and navigate home
    expect(mockEndSession).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  it('completes assessment and shows ResultsSummary on last question', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <AssessmentRoute />
      </MemoryRouter>
    );

    // Answer all 18 questions
    for (let i = 0; i < 18; i++) {
      // Find and click the answer button (all are quantity-comparison type)
      const answerButton = screen.getByRole('button', { name: /Answer/ });
      await user.click(answerButton);

      const nextButton = screen.getByTestId('next-button');

      if (i < 17) {
        // Click Next for questions 1-17
        await user.click(nextButton);
      } else {
        // On question 18, button should say "Complete"
        expect(nextButton).toHaveTextContent('Complete');
        await user.click(nextButton);
      }
    }

    // Should end session and show ResultsSummary
    expect(mockEndSession).toHaveBeenCalled();

    // Should show ResultsSummary with domain scores
    await waitFor(() => {
      expect(screen.getByTestId('results-summary')).toBeInTheDocument();
      expect(screen.getByText('Results Summary')).toBeInTheDocument();
    });

    // Should have calculated domain scores for all 6 domains
    expect(screen.getByText(/Domain Scores:/)).toBeInTheDocument();
    expect(screen.getByText(/Completion Time:/)).toBeInTheDocument();

    // Should have Start Training button
    expect(screen.getByText('Start Training')).toBeInTheDocument();
  }, 30000);

  it('updates progress bar as questions are answered', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <AssessmentRoute />
      </MemoryRouter>
    );

    const progressBar = screen.getByTestId('progress-bar');

    // Initial progress (question 1 of 18 = 6%)
    expect(progressBar).toHaveAttribute('aria-label', 'Progress: 6% complete');

    // Answer and go to question 2
    await user.click(screen.getByText('Answer Left'));
    await user.click(screen.getByTestId('next-button'));

    // Progress should be 11% (2/18 = 11.11%, rounded to 11%)
    await waitFor(() => {
      expect(progressBar).toHaveAttribute('aria-label', 'Progress: 11% complete');
    });
  });

  it('renders all 18 questions as quantity-comparison (mocked)', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <AssessmentRoute />
      </MemoryRouter>
    );

    // All 18 questions should render as quantity-comparison
    for (let i = 0; i < 18; i++) {
      expect(screen.getByText(`Question ${i + 1} of 18`)).toBeInTheDocument();
      expect(screen.getByTestId('quantity-comparison')).toBeInTheDocument();

      // Answer and advance (except on last question)
      await user.click(screen.getByText('Answer Left'));

      if (i < 17) {
        await user.click(screen.getByTestId('next-button'));
        await waitFor(() => {
          expect(screen.getByText(`Question ${i + 2} of 18`)).toBeInTheDocument();
        });
      }
    }
  }, 30000);

  it('navigates to training when Start Training is clicked on results', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <AssessmentRoute />
      </MemoryRouter>
    );

    // Complete all 18 questions
    for (let i = 0; i < 18; i++) {
      await user.click(screen.getByRole('button', { name: /Answer/ }));
      await user.click(screen.getByTestId('next-button'));
    }

    // Wait for results to show
    await waitFor(() => {
      expect(screen.getByTestId('results-summary')).toBeInTheDocument();
    });

    // Click Start Training
    await user.click(screen.getByText('Start Training'));
    expect(mockNavigate).toHaveBeenCalledWith('/training');
  }, 30000);
});
