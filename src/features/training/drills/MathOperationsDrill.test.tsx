/**
 * MathOperationsDrill Component Tests
 * Story 3.4: Comprehensive test coverage for math operations drill
 *
 * Test Coverage:
 * - AC-1: UI rendering with problem display and number keypad
 * - AC-2: User interaction flow (input, submit, confidence)
 * - AC-3: Visual feedback for correct/incorrect answers
 * - AC-4: Confidence prompt after feedback
 * - AC-5: Drill result persistence to Dexie
 * - AC-6: Accessibility (ARIA labels, keyboard nav)
 * - AC-7: Duplicate problem prevention
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MathOperationsDrill from './MathOperationsDrill';
import { db } from '@/services/storage/db';
import * as problemGenerator from '@/services/training/problemGenerator';

// Mock Framer Motion to simplify testing
vi.mock('framer-motion', async () => {
  const actual = await vi.importActual<typeof import('framer-motion')>('framer-motion');
  return {
    ...actual,
    motion: {
      div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
      p: ({ children, ...props }: any) => <p {...props}>{children}</p>,
    },
    AnimatePresence: ({ children }: any) => <>{children}</>,
  };
});

// Mock database
vi.mock('@/services/storage/db', () => ({
  db: {
    drill_results: {
      add: vi.fn(),
    },
  },
}));

// Mock NumberKeypad component
vi.mock('@/shared/components/NumberKeypad', () => ({
  NumberKeypad: ({
    value,
    onChange,
    onSubmit,
    maxDigits,
    disabled,
    'data-testid': testId,
  }: any) => (
    <div data-testid={testId}>
      <input
        data-testid="keypad-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        maxLength={maxDigits}
        disabled={disabled}
      />
      <button data-testid="submit-button" onClick={onSubmit} disabled={disabled}>
        Submit
      </button>
    </div>
  ),
}));

describe('MathOperationsDrill', () => {
  const mockOnComplete = vi.fn();
  const mockSessionId = 123;

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock problem generator to return predictable problems
    vi.spyOn(problemGenerator, 'generateProblem').mockReturnValue({
      problem: '5 + 3',
      answer: 8,
      operation: 'addition',
    });
  });

  describe('AC-1: UI rendering', () => {
    it('should render the math problem prominently', () => {
      render(
        <MathOperationsDrill
          difficulty="easy"
          sessionId={mockSessionId}
          onComplete={mockOnComplete}
        />
      );

      expect(screen.getByText('5 + 3 = ?')).toBeInTheDocument();
    });

    it('should render the operation type label', () => {
      render(
        <MathOperationsDrill
          difficulty="easy"
          sessionId={mockSessionId}
          onComplete={mockOnComplete}
        />
      );

      expect(screen.getByText('Addition')).toBeInTheDocument();
    });

    it('should render the NumberKeypad component', () => {
      render(
        <MathOperationsDrill
          difficulty="easy"
          sessionId={mockSessionId}
          onComplete={mockOnComplete}
        />
      );

      expect(screen.getByTestId('math-operations-keypad')).toBeInTheDocument();
    });

    it('should display user input as they type', async () => {
      render(
        <MathOperationsDrill
          difficulty="easy"
          sessionId={mockSessionId}
          onComplete={mockOnComplete}
        />
      );

      const input = screen.getByTestId('keypad-input');
      await userEvent.type(input, '8');

      // Should show user's input
      await waitFor(() => {
        expect(screen.getByText('8')).toBeInTheDocument();
      });
    });
  });

  describe('AC-2: User interaction flow', () => {
    it('should submit answer when submit button is clicked', async () => {
      render(
        <MathOperationsDrill
          difficulty="easy"
          sessionId={mockSessionId}
          onComplete={mockOnComplete}
        />
      );

      const input = screen.getByTestId('keypad-input');
      const submitButton = screen.getByTestId('submit-button');

      await userEvent.type(input, '8');
      await userEvent.click(submitButton);

      // Should show feedback
      await waitFor(() => {
        expect(screen.getByText('+1')).toBeInTheDocument();
      });
    }, 10000);

    it('should not submit empty answer', async () => {
      render(
        <MathOperationsDrill
          difficulty="easy"
          sessionId={mockSessionId}
          onComplete={mockOnComplete}
        />
      );

      const submitButton = screen.getByTestId('submit-button');

      await userEvent.click(submitButton);

      // Should not show feedback - wait a bit to ensure nothing appears
      await waitFor(() => {
        expect(screen.queryByText('+1')).not.toBeInTheDocument();
      });
    }, 10000);

    it('should handle Enter key for submit', async () => {
      render(
        <MathOperationsDrill
          difficulty="easy"
          sessionId={mockSessionId}
          onComplete={mockOnComplete}
        />
      );

      const drill = screen.getByRole('application');
      const input = screen.getByTestId('keypad-input');

      await userEvent.type(input, '8');
      fireEvent.keyDown(drill, { key: 'Enter' });

      // Should show feedback
      await waitFor(() => {
        expect(screen.getByText('+1')).toBeInTheDocument();
      });
    }, 10000);
  });

  describe('AC-3: Visual feedback', () => {
    it('should show green checkmark and +1 animation for correct answer', async () => {
      render(
        <MathOperationsDrill
          difficulty="easy"
          sessionId={mockSessionId}
          onComplete={mockOnComplete}
        />
      );

      const input = screen.getByTestId('keypad-input');
      const submitButton = screen.getByTestId('submit-button');

      await userEvent.type(input, '8'); // Correct answer
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('+1')).toBeInTheDocument();
      });
    }, 10000);

    it('should show red X and correct answer for incorrect answer', async () => {
      render(
        <MathOperationsDrill
          difficulty="easy"
          sessionId={mockSessionId}
          onComplete={mockOnComplete}
        />
      );

      const input = screen.getByTestId('keypad-input');
      const submitButton = screen.getByTestId('submit-button');

      await userEvent.type(input, '7'); // Incorrect answer
      await userEvent.click(submitButton);

      await waitFor(() => {
        // Should show correct answer
        expect(screen.getByText('5 + 3 = 8')).toBeInTheDocument();
      });
    }, 10000);

    it('should auto-advance to confidence prompt after 1s for correct answers', async () => {
      render(
        <MathOperationsDrill
          difficulty="easy"
          sessionId={mockSessionId}
          onComplete={mockOnComplete}
        />
      );

      const input = screen.getByTestId('keypad-input');
      const submitButton = screen.getByTestId('submit-button');

      await userEvent.type(input, '8');
      await userEvent.click(submitButton);

      // Wait for confidence prompt to appear after 1s delay
      await waitFor(
        () => {
          expect(screen.getByText('How confident were you?')).toBeInTheDocument();
        },
        { timeout: 2000 }
      );
    }, 10000);

    it('should auto-advance to confidence prompt after 1.5s for incorrect answers', async () => {
      render(
        <MathOperationsDrill
          difficulty="easy"
          sessionId={mockSessionId}
          onComplete={mockOnComplete}
        />
      );

      const input = screen.getByTestId('keypad-input');
      const submitButton = screen.getByTestId('submit-button');

      await userEvent.type(input, '7'); // Incorrect
      await userEvent.click(submitButton);

      // Wait for confidence prompt to appear after 1.5s delay
      await waitFor(
        () => {
          expect(screen.getByText('How confident were you?')).toBeInTheDocument();
        },
        { timeout: 2500 }
      );
    }, 10000);
  });

  describe('AC-4: Confidence prompt', () => {
    it('should show confidence prompt after feedback', async () => {
      render(
        <MathOperationsDrill
          difficulty="easy"
          sessionId={mockSessionId}
          onComplete={mockOnComplete}
        />
      );

      const input = screen.getByTestId('keypad-input');
      const submitButton = screen.getByTestId('submit-button');

      await userEvent.type(input, '8');
      await userEvent.click(submitButton);

      await waitFor(
        () => {
          expect(screen.getByText('How confident were you?')).toBeInTheDocument();
          expect(screen.getByText('Guessed')).toBeInTheDocument();
          expect(screen.getByText('Unsure')).toBeInTheDocument();
          expect(screen.getByText('Confident')).toBeInTheDocument();
        },
        { timeout: 2000 }
      );
    }, 10000);

    it('should call onComplete with confidence when selected', async () => {
      render(
        <MathOperationsDrill
          difficulty="easy"
          sessionId={mockSessionId}
          onComplete={mockOnComplete}
        />
      );

      const input = screen.getByTestId('keypad-input');
      const submitButton = screen.getByTestId('submit-button');

      await userEvent.type(input, '8');
      await userEvent.click(submitButton);

      await waitFor(
        () => {
          expect(screen.getByText('Confident')).toBeInTheDocument();
        },
        { timeout: 2000 }
      );

      const confidentButton = screen.getByText('Confident');
      await userEvent.click(confidentButton);

      await waitFor(() => {
        expect(mockOnComplete).toHaveBeenCalledWith(
          expect.objectContaining({
            confidence: 'confident',
            isCorrect: true,
            userAnswer: 8,
            correctAnswer: 8,
            operation: 'addition',
            problem: '5 + 3',
          })
        );
      });
    }, 10000);
  });

  describe('AC-5: Drill result persistence', () => {
    it('should persist drill result to Dexie', async () => {
      render(
        <MathOperationsDrill
          difficulty="easy"
          sessionId={mockSessionId}
          onComplete={mockOnComplete}
        />
      );

      const input = screen.getByTestId('keypad-input');
      const submitButton = screen.getByTestId('submit-button');

      await userEvent.type(input, '8');
      await userEvent.click(submitButton);

      await waitFor(
        () => {
          expect(screen.getByText('Confident')).toBeInTheDocument();
        },
        { timeout: 2000 }
      );

      const confidentButton = screen.getByText('Confident');
      await userEvent.click(confidentButton);

      await waitFor(() => {
        expect(db.drill_results.add).toHaveBeenCalledWith(
          expect.objectContaining({
            sessionId: mockSessionId,
            module: 'math_operations',
            difficulty: 'easy',
            isCorrect: true,
            userAnswer: 8,
            correctAnswer: 8,
            operation: 'addition',
            problem: '5 + 3',
            confidence: 'confident',
          })
        );
      });
    }, 10000);

    it('should handle Dexie persistence errors with localStorage fallback', async () => {
      // Mock Dexie to throw error
      vi.mocked(db.drill_results.add).mockRejectedValueOnce(new Error('DB error'));

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const localStorageSpy = vi.spyOn(Storage.prototype, 'setItem');

      render(
        <MathOperationsDrill
          difficulty="easy"
          sessionId={mockSessionId}
          onComplete={mockOnComplete}
        />
      );

      const input = screen.getByTestId('keypad-input');
      const submitButton = screen.getByTestId('submit-button');

      await userEvent.type(input, '8');
      await userEvent.click(submitButton);

      await waitFor(
        () => {
          expect(screen.getByText('Unsure')).toBeInTheDocument();
        },
        { timeout: 2000 }
      );

      await userEvent.click(screen.getByText('Unsure'));

      await waitFor(() => {
        expect(localStorageSpy).toHaveBeenCalledWith(
          'discalculas:drillResultsBackup',
          expect.any(String)
        );
      });

      consoleSpy.mockRestore();
    }, 10000);
  });

  describe('AC-6: Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(
        <MathOperationsDrill
          difficulty="easy"
          sessionId={mockSessionId}
          onComplete={mockOnComplete}
        />
      );

      expect(screen.getByRole('application')).toHaveAttribute(
        'aria-label',
        'Math operations drill'
      );
    });

    it('should announce problem with aria-live', () => {
      render(
        <MathOperationsDrill
          difficulty="easy"
          sessionId={mockSessionId}
          onComplete={mockOnComplete}
        />
      );

      const problemElement = screen.getByText('5 + 3 = ?');
      expect(problemElement).toHaveAttribute('aria-live', 'polite');
    });

    it('should have screen reader announcements for feedback', async () => {
      render(
        <MathOperationsDrill
          difficulty="easy"
          sessionId={mockSessionId}
          onComplete={mockOnComplete}
        />
      );

      const input = screen.getByTestId('keypad-input');
      const submitButton = screen.getByTestId('submit-button');

      await userEvent.type(input, '8');
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Correct! You earned 1 point.')).toBeInTheDocument();
      });
    }, 10000);
  });

  describe('Difficulty levels', () => {
    it('should generate easy problems for easy difficulty', () => {
      vi.mocked(problemGenerator.generateProblem).mockReturnValue({
        problem: '3 + 4',
        answer: 7,
        operation: 'addition',
      });

      render(
        <MathOperationsDrill
          difficulty="easy"
          sessionId={mockSessionId}
          onComplete={mockOnComplete}
        />
      );

      expect(problemGenerator.generateProblem).toHaveBeenCalledWith('easy', undefined, undefined);
      expect(screen.getByText('3 + 4 = ?')).toBeInTheDocument();
    });

    it('should generate medium problems for medium difficulty', () => {
      vi.mocked(problemGenerator.generateProblem).mockReturnValue({
        problem: '15 + 7',
        answer: 22,
        operation: 'addition',
      });

      render(
        <MathOperationsDrill
          difficulty="medium"
          sessionId={mockSessionId}
          onComplete={mockOnComplete}
        />
      );

      expect(problemGenerator.generateProblem).toHaveBeenCalledWith('medium', undefined, undefined);
      expect(screen.getByText('15 + 7 = ?')).toBeInTheDocument();
    });

    it('should generate hard problems for hard difficulty', () => {
      vi.mocked(problemGenerator.generateProblem).mockReturnValue({
        problem: '8 × 9',
        answer: 72,
        operation: 'multiplication',
      });

      render(
        <MathOperationsDrill
          difficulty="hard"
          sessionId={mockSessionId}
          onComplete={mockOnComplete}
        />
      );

      expect(problemGenerator.generateProblem).toHaveBeenCalledWith('hard', undefined, undefined);
      expect(screen.getByText('8 × 9 = ?')).toBeInTheDocument();
    });
  });

  describe('AC-7: Duplicate problem prevention', () => {
    it('should pass usedProblems to generateProblem', () => {
      const usedProblems = new Set<string>();

      render(
        <MathOperationsDrill
          difficulty="easy"
          sessionId={mockSessionId}
          onComplete={mockOnComplete}
          usedProblems={usedProblems}
        />
      );

      expect(problemGenerator.generateProblem).toHaveBeenCalledWith('easy', undefined, usedProblems);
    });

    it('should work without usedProblems prop (backward compatible)', () => {
      render(
        <MathOperationsDrill
          difficulty="easy"
          sessionId={mockSessionId}
          onComplete={mockOnComplete}
        />
      );

      expect(problemGenerator.generateProblem).toHaveBeenCalledWith('easy', undefined, undefined);
    });
  });
});
