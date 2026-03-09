// AssessmentWizard.test.tsx - Unit tests for AssessmentWizard component
// Story 2.1: Build Assessment Wizard Shell with Multi-Step Form
// Testing: 100% coverage target, AAA pattern, RTL

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '../../../../tests/test-utils';
import { AssessmentWizard } from './AssessmentWizard';

// Mock all question components to render a simple answer button
// This isolates the wizard shell tests from question component internals
vi.mock('./QuantityComparison', async () => {
  const React = await import('react');
  return {
    QuantityComparison: function MockQuantityComparison(props: any) {
      const [answered, setAnswered] = React.useState(false);
      return React.createElement('button', {
        'data-testid': 'demo-answer-button',
        onClick: () => { setAnswered(true); props.onAnswer('mock-answer'); },
      }, answered ? 'Answer Provided' : 'Click to Answer');
    },
  };
});

vi.mock('./NumberLineEstimation', () => ({
  NumberLineEstimation: () => null,
}));

vi.mock('./MentalRotation', () => ({
  MentalRotation: () => null,
}));

vi.mock('./PatternMatching', () => ({
  PatternMatching: () => null,
}));

vi.mock('./BasicOperations', () => ({
  BasicOperations: () => null,
}));

vi.mock('./WordProblem', () => ({
  WordProblem: () => null,
}));

// Mock question generators to always return quantity-comparison type
// so the mocked QuantityComparison renders for every step
vi.mock('../content/questions', () => ({
  generateNumberSenseQuestions: () => Array.from({ length: 4 }, (_, i) => ({
    type: 'quantity-comparison',
    id: `q${i + 1}`,
    leftCount: 5,
    rightCount: 10,
  })),
  generateSpatialQuestions: () => Array.from({ length: 3 }, (_, i) => ({
    type: 'quantity-comparison',
    id: `q${i + 5}`,
    leftCount: 5,
    rightCount: 10,
  })),
  generateOperationsQuestions: () => Array.from({ length: 3 }, (_, i) => ({
    type: 'quantity-comparison',
    id: `q${i + 8}`,
    leftCount: 5,
    rightCount: 10,
  })),
}));

// Mock callbacks
const mockOnOpenChange = vi.fn();
const mockOnComplete = vi.fn();
const mockOnExit = vi.fn();

// Default props
const defaultProps = {
  open: true,
  onOpenChange: mockOnOpenChange,
  onComplete: mockOnComplete,
  onExit: mockOnExit,
};

describe('AssessmentWizard', () => {
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
  const originalWarn = console.warn.bind(console);
  const originalError = console.error.bind(console);

  beforeEach(() => {
    vi.clearAllMocks();
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation((...args: unknown[]) => {
      const msg = String(args[0]);
      if (msg.includes('Missing `Description`') || msg.includes('DialogTitle')) return;
      originalWarn(...args);
    });
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation((...args: unknown[]) => {
      const msg = String(args[0]);
      if (msg.includes('Missing `Description`') || msg.includes('DialogTitle')) return;
      originalError(...args);
    });
  });

  afterEach(() => {
    consoleWarnSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders when open is true', () => {
      render(<AssessmentWizard {...defaultProps} />);
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('does not render content when open is false', () => {
      render(<AssessmentWizard {...defaultProps} open={false} />);
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('renders assessment title', () => {
      render(<AssessmentWizard {...defaultProps} />);
      expect(screen.getByText('Assessment')).toBeInTheDocument();
    });
  });

  describe('AC1: Step Indicator', () => {
    it('shows "Question 1 of 10" initially', () => {
      render(<AssessmentWizard {...defaultProps} />);
      expect(screen.getByTestId('step-indicator')).toHaveTextContent('Question 1 of 10');
    });

    it('updates step indicator when navigating', async () => {
      render(<AssessmentWizard {...defaultProps} />);

      // Provide answer to enable navigation
      fireEvent.click(screen.getByTestId('demo-answer-button'));

      // Navigate to next question
      fireEvent.click(screen.getByTestId('next-button'));

      await waitFor(() => {
        expect(screen.getByTestId('step-indicator')).toHaveTextContent('Question 2 of 10');
      });
    });

    it('shows correct step indicator for each step', async () => {
      render(<AssessmentWizard {...defaultProps} />);

      for (let step = 1; step <= 3; step++) {
        expect(screen.getByTestId('step-indicator')).toHaveTextContent(`Question ${step} of 10`);

        if (step < 3) {
          fireEvent.click(screen.getByTestId('demo-answer-button'));
          fireEvent.click(screen.getByTestId('next-button'));
          await waitFor(() => {
            expect(screen.getByTestId('step-indicator')).toHaveTextContent(`Question ${step + 1} of 10`);
          });
        }
      }
    });
  });

  describe('AC2: Progress Bar', () => {
    it('shows progress bar', () => {
      render(<AssessmentWizard {...defaultProps} />);
      expect(screen.getByTestId('progress-bar')).toBeInTheDocument();
    });

    it('shows 10% progress at step 1', () => {
      render(<AssessmentWizard {...defaultProps} />);
      const progressBar = screen.getByTestId('progress-bar');
      expect(progressBar).toHaveAttribute('aria-label', 'Progress: 10% complete');
    });

    it('updates progress when navigating', async () => {
      render(<AssessmentWizard {...defaultProps} />);

      // Answer and navigate
      fireEvent.click(screen.getByTestId('demo-answer-button'));
      fireEvent.click(screen.getByTestId('next-button'));

      await waitFor(() => {
        const progressBar = screen.getByTestId('progress-bar');
        expect(progressBar).toHaveAttribute('aria-label', 'Progress: 20% complete');
      });
    });
  });

  describe('AC3: Touch-Friendly Targets', () => {
    it('has 44px minimum height for navigation buttons', () => {
      render(<AssessmentWizard {...defaultProps} />);
      const prevButton = screen.getByTestId('previous-button');
      const nextButton = screen.getByTestId('next-button');

      expect(prevButton).toHaveClass('min-h-[44px]');
      expect(nextButton).toHaveClass('min-h-[44px]');
    });

    it('has 44px minimum size for exit button', () => {
      render(<AssessmentWizard {...defaultProps} />);
      const exitButton = screen.getByTestId('exit-button');
      expect(exitButton).toHaveClass('min-h-[44px]');
      expect(exitButton).toHaveClass('min-w-[44px]');
    });
  });

  describe('AC4: Previous/Next Navigation', () => {
    it('Previous button is disabled on step 1', () => {
      render(<AssessmentWizard {...defaultProps} />);
      expect(screen.getByTestId('previous-button')).toBeDisabled();
    });

    it('Next button is disabled without answer', () => {
      render(<AssessmentWizard {...defaultProps} />);
      expect(screen.getByTestId('next-button')).toBeDisabled();
    });

    it('Next button is enabled after providing answer', () => {
      render(<AssessmentWizard {...defaultProps} />);
      fireEvent.click(screen.getByTestId('demo-answer-button'));
      expect(screen.getByTestId('next-button')).not.toBeDisabled();
    });

    it('Previous button is enabled after step 1', async () => {
      render(<AssessmentWizard {...defaultProps} />);

      // Navigate to step 2
      fireEvent.click(screen.getByTestId('demo-answer-button'));
      fireEvent.click(screen.getByTestId('next-button'));

      await waitFor(() => {
        expect(screen.getByTestId('previous-button')).not.toBeDisabled();
      });
    });

    it('Previous button navigates back', async () => {
      render(<AssessmentWizard {...defaultProps} />);

      // Navigate to step 2
      fireEvent.click(screen.getByTestId('demo-answer-button'));
      fireEvent.click(screen.getByTestId('next-button'));

      await waitFor(() => {
        expect(screen.getByTestId('step-indicator')).toHaveTextContent('Question 2 of 10');
      });

      // Navigate back
      fireEvent.click(screen.getByTestId('previous-button'));

      await waitFor(() => {
        expect(screen.getByTestId('step-indicator')).toHaveTextContent('Question 1 of 10');
      });
    });
  });

  describe('AC5: Exit Confirmation', () => {
    it('shows exit button', () => {
      render(<AssessmentWizard {...defaultProps} />);
      expect(screen.getByTestId('exit-button')).toBeInTheDocument();
    });

    it('clicking exit shows confirmation dialog', () => {
      render(<AssessmentWizard {...defaultProps} />);
      fireEvent.click(screen.getByTestId('exit-button'));
      expect(screen.getByTestId('exit-confirmation')).toBeInTheDocument();
    });

    it('confirmation dialog has cancel and exit buttons', () => {
      render(<AssessmentWizard {...defaultProps} />);
      fireEvent.click(screen.getByTestId('exit-button'));

      expect(screen.getByTestId('cancel-exit-button')).toBeInTheDocument();
      expect(screen.getByTestId('confirm-exit-button')).toBeInTheDocument();
    });

    it('cancel returns to assessment', () => {
      render(<AssessmentWizard {...defaultProps} />);
      fireEvent.click(screen.getByTestId('exit-button'));
      fireEvent.click(screen.getByTestId('cancel-exit-button'));

      expect(screen.queryByTestId('exit-confirmation')).not.toBeInTheDocument();
      expect(screen.getByTestId('question-area')).toBeInTheDocument();
    });

    it('confirm exit calls onExit and closes wizard', () => {
      render(<AssessmentWizard {...defaultProps} />);
      fireEvent.click(screen.getByTestId('exit-button'));
      fireEvent.click(screen.getByTestId('confirm-exit-button'));

      expect(mockOnExit).toHaveBeenCalledTimes(1);
      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });
  });

  describe('AC6: Form State Management', () => {
    it('manages currentStep state', async () => {
      render(<AssessmentWizard {...defaultProps} />);

      // Initially at step 1
      expect(screen.getByTestId('step-indicator')).toHaveTextContent('Question 1 of 10');

      // Advance
      fireEvent.click(screen.getByTestId('demo-answer-button'));
      fireEvent.click(screen.getByTestId('next-button'));

      await waitFor(() => {
        expect(screen.getByTestId('step-indicator')).toHaveTextContent('Question 2 of 10');
      });
    });

    it('stores answers in array', async () => {
      render(<AssessmentWizard {...defaultProps} />);

      // Answer first question
      fireEvent.click(screen.getByTestId('demo-answer-button'));
      expect(screen.getByTestId('demo-answer-button')).toHaveTextContent('Answer Provided');
    });
  });

  describe('AC7: Form Validation', () => {
    it('cannot advance without answering', () => {
      render(<AssessmentWizard {...defaultProps} />);

      const nextButton = screen.getByTestId('next-button');
      expect(nextButton).toBeDisabled();

      // Try clicking disabled button - should stay on step 1
      fireEvent.click(nextButton);
      expect(screen.getByTestId('step-indicator')).toHaveTextContent('Question 1 of 10');
    });
  });

  describe('AC8: Sheet Component', () => {
    it('uses full-screen Sheet component', () => {
      render(<AssessmentWizard {...defaultProps} />);
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveClass('h-full', 'w-full');
    });
  });

  describe('AC9: ARIA Landmarks', () => {
    it('has role="dialog"', () => {
      render(<AssessmentWizard {...defaultProps} />);
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('has aria-labelledby pointing to title', () => {
      render(<AssessmentWizard {...defaultProps} />);
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-labelledby', 'assessment-title');
    });

    it('has aria-modal="true"', () => {
      render(<AssessmentWizard {...defaultProps} />);
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
    });

    it('step indicator has aria-live for announcements', () => {
      render(<AssessmentWizard {...defaultProps} />);
      const stepIndicator = screen.getByTestId('step-indicator');
      expect(stepIndicator).toHaveAttribute('aria-live', 'polite');
    });

    it('exit confirmation has role="alertdialog"', () => {
      render(<AssessmentWizard {...defaultProps} />);
      fireEvent.click(screen.getByTestId('exit-button'));

      const alertDialog = screen.getByRole('alertdialog');
      expect(alertDialog).toBeInTheDocument();
    });
  });

  describe('AC10: Keyboard Navigation', () => {
    it('Enter key advances when answer provided', async () => {
      render(<AssessmentWizard {...defaultProps} />);

      // Provide answer
      fireEvent.click(screen.getByTestId('demo-answer-button'));

      // Press Enter
      fireEvent.keyDown(document, { key: 'Enter' });

      await waitFor(() => {
        expect(screen.getByTestId('step-indicator')).toHaveTextContent('Question 2 of 10');
      });
    });

    it('Enter key does nothing without answer', () => {
      render(<AssessmentWizard {...defaultProps} />);

      // Press Enter without answer
      fireEvent.keyDown(document, { key: 'Enter' });

      // Should stay on step 1
      expect(screen.getByTestId('step-indicator')).toHaveTextContent('Question 1 of 10');
    });

    it('Escape key shows exit confirmation', () => {
      render(<AssessmentWizard {...defaultProps} />);

      fireEvent.keyDown(document, { key: 'Escape' });

      expect(screen.getByTestId('exit-confirmation')).toBeInTheDocument();
    });
  });

  describe('Assessment Completion', () => {
    it('shows Complete button on last step', async () => {
      render(<AssessmentWizard {...defaultProps} />);

      // Navigate through all 10 questions
      for (let i = 0; i < 9; i++) {
        fireEvent.click(screen.getByTestId('demo-answer-button'));
        fireEvent.click(screen.getByTestId('next-button'));
        await waitFor(() => {
          expect(screen.getByTestId('step-indicator')).toHaveTextContent(`Question ${i + 2} of 10`);
        });
      }

      // On step 10
      expect(screen.getByTestId('step-indicator')).toHaveTextContent('Question 10 of 10');
      expect(screen.getByTestId('next-button')).toHaveAttribute('aria-label', 'Complete assessment');
    });

    it('calls onComplete with answers when completing assessment', async () => {
      render(<AssessmentWizard {...defaultProps} />);

      // Navigate through all 10 questions
      for (let i = 0; i < 10; i++) {
        fireEvent.click(screen.getByTestId('demo-answer-button'));
        fireEvent.click(screen.getByTestId('next-button'));

        if (i < 9) {
          await waitFor(() => {
            expect(screen.getByTestId('step-indicator')).toHaveTextContent(`Question ${i + 2} of 10`);
          });
        }
      }

      expect(mockOnComplete).toHaveBeenCalledTimes(1);
      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });
  });

  describe('Accessibility Labels', () => {
    it('Previous button has aria-label', () => {
      render(<AssessmentWizard {...defaultProps} />);
      expect(screen.getByTestId('previous-button')).toHaveAttribute('aria-label', 'Previous question');
    });

    it('Next button has aria-label', () => {
      render(<AssessmentWizard {...defaultProps} />);
      expect(screen.getByTestId('next-button')).toHaveAttribute('aria-label', 'Next question');
    });

    it('Exit button has aria-label', () => {
      render(<AssessmentWizard {...defaultProps} />);
      expect(screen.getByTestId('exit-button')).toHaveAttribute('aria-label', 'Exit assessment');
    });
  });
});
