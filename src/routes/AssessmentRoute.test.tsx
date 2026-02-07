// AssessmentRoute tests
// Tests for full-page assessment route with answer handling

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

// Mock the question components to simplify testing
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
  ResultsSummary: ({ domainScores, completionTime, onStartTraining }: any) => (
    <div data-testid="results-summary">
      <h1>Results Summary</h1>
      <div>Domain Scores: {JSON.stringify(domainScores)}</div>
      <div>Completion Time: {completionTime.minutes}m {completionTime.seconds}s</div>
      <button onClick={onStartTraining}>Start Training</button>
    </div>
  ),
  generateNumberSenseQuestions: () => [
    { type: 'quantity-comparison', id: 'q1', leftCount: 10, rightCount: 5 },
    { type: 'quantity-comparison', id: 'q2', leftCount: 8, rightCount: 12 },
    { type: 'number-line', id: 'q3', range: [0, 100], targetNumber: 50 },
    { type: 'number-line', id: 'q4', range: [0, 1000], targetNumber: 500 },
  ],
  generateSpatialQuestions: () => [
    { type: 'mental-rotation', id: 'q5', shapeType: 'L-shape', rotationAngle: 90, isMatch: true },
    { type: 'mental-rotation', id: 'q6', shapeType: 'T-shape', rotationAngle: 180, isMatch: false },
    { type: 'pattern-matching', id: 'q7', patternType: 'checkerboard', correctOption: 'A', targetPattern: [[1, 0], [0, 1]], options: { A: [[1, 0], [0, 1]], B: [[0, 1], [1, 0]], C: [[1, 1], [0, 0]], D: [[0, 0], [1, 1]] } },
  ],
  generateOperationsQuestions: () => [
    { type: 'basic-operations', id: 'q8', operationType: 'addition', operand1: 10, operand2: 5, correctAnswer: 15 },
    { type: 'basic-operations', id: 'q9', operationType: 'subtraction', operand1: 20, operand2: 8, correctAnswer: 12 },
    { type: 'word-problem', id: 'q10', problemText: 'Test problem', correctAnswer: 20, context: 'apples' },
  ],
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
    expect(screen.getByText('Question 1 of 10')).toBeInTheDocument();
    expect(screen.getByTestId('quantity-comparison')).toBeInTheDocument();
  });

  it('starts a session on mount', () => {
    render(
      <MemoryRouter>
        <AssessmentRoute />
      </MemoryRouter>
    );

    expect(mockStartSession).toHaveBeenCalledWith('assessment', expect.stringContaining('assessment-'));
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
      expect(screen.getByText('Question 2 of 10')).toBeInTheDocument();
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
      expect(screen.getByText('Question 2 of 10')).toBeInTheDocument();
    });

    // Click Previous
    await user.click(screen.getByTestId('previous-button'));

    // Should show question 1 again
    await waitFor(() => {
      expect(screen.getByText('Question 1 of 10')).toBeInTheDocument();
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

    // Answer all 10 questions
    for (let i = 0; i < 10; i++) {
      // Find and click the answer button (different for each question type)
      const answerButton = screen.getByRole('button', { name: /Answer/ });
      await user.click(answerButton);

      const nextButton = screen.getByTestId('next-button');

      if (i < 9) {
        // Click Next for questions 1-9
        await user.click(nextButton);
      } else {
        // On question 10, button should say "Complete"
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

    // Should have calculated domain scores
    expect(screen.getByText(/Domain Scores:/)).toBeInTheDocument();
    expect(screen.getByText(/Completion Time:/)).toBeInTheDocument();

    // Should have Start Training button
    expect(screen.getByText('Start Training')).toBeInTheDocument();
  });

  it('updates progress bar as questions are answered', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <AssessmentRoute />
      </MemoryRouter>
    );

    const progressBar = screen.getByTestId('progress-bar');

    // Initial progress (question 1 of 10 = 10%)
    expect(progressBar).toHaveAttribute('aria-label', 'Progress: 10% complete');

    // Answer and go to question 2
    await user.click(screen.getByText('Answer Left'));
    await user.click(screen.getByTestId('next-button'));

    // Progress should be 20%
    await waitFor(() => {
      expect(progressBar).toHaveAttribute('aria-label', 'Progress: 20% complete');
    });
  });

  it('handles different question types correctly', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <AssessmentRoute />
      </MemoryRouter>
    );

    // Q1: Quantity Comparison
    expect(screen.getByTestId('quantity-comparison')).toBeInTheDocument();
    await user.click(screen.getByText('Answer Left'));
    await user.click(screen.getByTestId('next-button'));

    // Q2: Quantity Comparison
    await waitFor(() => {
      expect(screen.getByText('Question 2 of 10')).toBeInTheDocument();
    });
    expect(screen.getByTestId('quantity-comparison')).toBeInTheDocument();
    await user.click(screen.getByText('Answer Left'));
    await user.click(screen.getByTestId('next-button'));

    // Q3: Number Line
    await waitFor(() => {
      expect(screen.getByTestId('number-line')).toBeInTheDocument();
    });
    await user.click(screen.getByText('Answer 50'));
    await user.click(screen.getByTestId('next-button'));

    // Q4: Number Line
    await waitFor(() => {
      expect(screen.getByText('Question 4 of 10')).toBeInTheDocument();
    });
    expect(screen.getByTestId('number-line')).toBeInTheDocument();
    await user.click(screen.getByText('Answer 50'));
    await user.click(screen.getByTestId('next-button'));

    // Q5: Mental Rotation
    await waitFor(() => {
      expect(screen.getByTestId('mental-rotation')).toBeInTheDocument();
    });
  });
});
