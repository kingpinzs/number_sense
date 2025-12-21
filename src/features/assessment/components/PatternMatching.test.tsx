// PatternMatching.test.tsx - Unit tests for PatternMatching component
// Story 2.3: Implement Spatial Awareness Question Types
// AC5-AC8: 3×3 grid, 4 options, selection, timing

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '../../../../tests/test-utils';
import { PatternMatching, PatternMatchingResult } from './PatternMatching';

describe('PatternMatching', () => {
  const mockOnAnswer = vi.fn();

  const checkerboardPattern = [
    [1, 0, 1],
    [0, 1, 0],
    [1, 0, 1],
  ];

  const diagonalPattern = [
    [1, 0, 0],
    [0, 1, 0],
    [0, 0, 1],
  ];

  const defaultProps = {
    patternType: 'checkerboard',
    correctOption: 'B' as const,
    targetPattern: checkerboardPattern,
    options: {
      A: diagonalPattern,
      B: checkerboardPattern,
      C: [[1, 1, 1], [0, 0, 0], [1, 1, 1]],
      D: [[0, 0, 0], [0, 1, 0], [0, 0, 0]],
    },
    onAnswer: mockOnAnswer,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders target pattern', () => {
      render(<PatternMatching {...defaultProps} />);

      expect(screen.getByTestId('target-pattern')).toBeInTheDocument();
    });

    it('renders 3×3 target grid with 9 cells', () => {
      render(<PatternMatching {...defaultProps} />);

      const targetGrid = screen.getByTestId('target-pattern');
      const cells = targetGrid.querySelectorAll('[data-testid^="target-pattern-cell"]');
      expect(cells).toHaveLength(9);
    });

    it('renders target pattern cells with correct states', () => {
      render(<PatternMatching {...defaultProps} />);

      // Check first row: [1, 0, 1]
      expect(screen.getByTestId('target-pattern-cell-0-0')).toHaveStyle({ backgroundColor: '#E87461' });
      expect(screen.getByTestId('target-pattern-cell-0-1')).toHaveStyle({ backgroundColor: '#ffffff' });
      expect(screen.getByTestId('target-pattern-cell-0-2')).toHaveStyle({ backgroundColor: '#E87461' });
    });

    it('renders question prompt', () => {
      render(<PatternMatching {...defaultProps} />);

      expect(screen.getByTestId('question-prompt')).toHaveTextContent('Which grid matches this pattern?');
    });

    it('renders instruction text', () => {
      render(<PatternMatching {...defaultProps} />);

      expect(screen.getByTestId('instruction-text')).toHaveTextContent('Tap the grid that matches the pattern above');
    });

    it('renders all 4 option buttons (A, B, C, D)', () => {
      render(<PatternMatching {...defaultProps} />);

      expect(screen.getByTestId('option-A')).toBeInTheDocument();
      expect(screen.getByTestId('option-B')).toBeInTheDocument();
      expect(screen.getByTestId('option-C')).toBeInTheDocument();
      expect(screen.getByTestId('option-D')).toBeInTheDocument();
    });

    it('renders 3×3 grid for each option', () => {
      render(<PatternMatching {...defaultProps} />);

      ['A', 'B', 'C', 'D'].forEach(option => {
        const grid = screen.getByTestId(`option-${option}-grid`);
        const cells = grid.querySelectorAll('[data-testid^="option-' + option + '-grid-cell"]');
        expect(cells).toHaveLength(9);
      });
    });

    it('renders option grids with correct patterns', () => {
      render(<PatternMatching {...defaultProps} />);

      // Option B should match checkerboard pattern
      expect(screen.getByTestId('option-B-grid-cell-0-0')).toHaveStyle({ backgroundColor: '#E87461' });
      expect(screen.getByTestId('option-B-grid-cell-0-1')).toHaveStyle({ backgroundColor: '#ffffff' });
      expect(screen.getByTestId('option-B-grid-cell-0-2')).toHaveStyle({ backgroundColor: '#E87461' });

      // Option A should match diagonal pattern
      expect(screen.getByTestId('option-A-grid-cell-0-0')).toHaveStyle({ backgroundColor: '#E87461' });
      expect(screen.getByTestId('option-A-grid-cell-0-1')).toHaveStyle({ backgroundColor: '#ffffff' });
      expect(screen.getByTestId('option-A-grid-cell-1-1')).toHaveStyle({ backgroundColor: '#E87461' });
    });

    it('renders option button labels', () => {
      render(<PatternMatching {...defaultProps} />);

      expect(screen.getByLabelText('Option A')).toBeInTheDocument();
      expect(screen.getByLabelText('Option B')).toBeInTheDocument();
      expect(screen.getByLabelText('Option C')).toBeInTheDocument();
      expect(screen.getByLabelText('Option D')).toBeInTheDocument();
    });
  });

  describe('Answer Selection', () => {
    it('calls onAnswer when option A selected', () => {
      render(<PatternMatching {...defaultProps} />);

      fireEvent.click(screen.getByTestId('option-A'));

      expect(mockOnAnswer).toHaveBeenCalledOnce();
      const result: PatternMatchingResult = mockOnAnswer.mock.calls[0][0];
      expect(result.selectedOption).toBe('A');
    });

    it('calls onAnswer when option B selected', () => {
      render(<PatternMatching {...defaultProps} />);

      fireEvent.click(screen.getByTestId('option-B'));

      expect(mockOnAnswer).toHaveBeenCalledOnce();
      const result: PatternMatchingResult = mockOnAnswer.mock.calls[0][0];
      expect(result.selectedOption).toBe('B');
    });

    it('calls onAnswer when option C selected', () => {
      render(<PatternMatching {...defaultProps} />);

      fireEvent.click(screen.getByTestId('option-C'));

      expect(mockOnAnswer).toHaveBeenCalledOnce();
      const result: PatternMatchingResult = mockOnAnswer.mock.calls[0][0];
      expect(result.selectedOption).toBe('C');
    });

    it('calls onAnswer when option D selected', () => {
      render(<PatternMatching {...defaultProps} />);

      fireEvent.click(screen.getByTestId('option-D'));

      expect(mockOnAnswer).toHaveBeenCalledOnce();
      const result: PatternMatchingResult = mockOnAnswer.mock.calls[0][0];
      expect(result.selectedOption).toBe('D');
    });

    it('marks answer correct when correct option selected', () => {
      render(<PatternMatching {...defaultProps} correctOption="B" />);

      fireEvent.click(screen.getByTestId('option-B'));

      const result: PatternMatchingResult = mockOnAnswer.mock.calls[0][0];
      expect(result.isCorrect).toBe(true);
    });

    it('marks answer incorrect when wrong option selected', () => {
      render(<PatternMatching {...defaultProps} correctOption="B" />);

      fireEvent.click(screen.getByTestId('option-A'));

      const result: PatternMatchingResult = mockOnAnswer.mock.calls[0][0];
      expect(result.isCorrect).toBe(false);
    });

    it('works correctly with different correct options', () => {
      const { rerender } = render(<PatternMatching {...defaultProps} correctOption="A" />);

      fireEvent.click(screen.getByTestId('option-A'));
      expect(mockOnAnswer.mock.calls[0][0].isCorrect).toBe(true);

      vi.clearAllMocks();
      rerender(<PatternMatching {...defaultProps} correctOption="D" />);

      fireEvent.click(screen.getByTestId('option-D'));
      expect(mockOnAnswer.mock.calls[0][0].isCorrect).toBe(true);
    });
  });

  describe('Timing', () => {
    it('records time to answer in milliseconds', () => {
      render(<PatternMatching {...defaultProps} />);

      fireEvent.click(screen.getByTestId('option-B'));

      const result: PatternMatchingResult = mockOnAnswer.mock.calls[0][0];
      expect(result.timeToAnswer).toBeGreaterThan(0);
      expect(result.timeToAnswer).toBeLessThan(1000); // Reasonable test execution time
    });

    it('includes all required result fields', () => {
      render(<PatternMatching {...defaultProps} />);

      fireEvent.click(screen.getByTestId('option-B'));

      const result: PatternMatchingResult = mockOnAnswer.mock.calls[0][0];
      expect(result).toHaveProperty('selectedOption');
      expect(result).toHaveProperty('isCorrect');
      expect(result).toHaveProperty('timeToAnswer');
      expect(result).toHaveProperty('patternType');
      expect(result).toHaveProperty('correctOption');
    });

    it('passes through pattern configuration to result', () => {
      render(<PatternMatching {...defaultProps} />);

      fireEvent.click(screen.getByTestId('option-B'));

      const result: PatternMatchingResult = mockOnAnswer.mock.calls[0][0];
      expect(result.patternType).toBe('checkerboard');
      expect(result.correctOption).toBe('B');
    });
  });

  describe('State Management', () => {
    it('disables all buttons after answering', () => {
      render(<PatternMatching {...defaultProps} />);

      fireEvent.click(screen.getByTestId('option-B'));

      expect(screen.getByTestId('option-A')).toBeDisabled();
      expect(screen.getByTestId('option-B')).toBeDisabled();
      expect(screen.getByTestId('option-C')).toBeDisabled();
      expect(screen.getByTestId('option-D')).toBeDisabled();
    });

    it('prevents multiple answers', () => {
      render(<PatternMatching {...defaultProps} />);

      fireEvent.click(screen.getByTestId('option-B'));
      fireEvent.click(screen.getByTestId('option-A'));

      expect(mockOnAnswer).toHaveBeenCalledOnce();
    });

    it('updates instruction text after answering', () => {
      render(<PatternMatching {...defaultProps} />);

      expect(screen.getByTestId('instruction-text')).toHaveTextContent('Tap the grid that matches the pattern above');

      fireEvent.click(screen.getByTestId('option-B'));

      expect(screen.getByTestId('instruction-text')).toHaveTextContent('Answer recorded');
    });

    it('resets state when question changes', () => {
      const { rerender } = render(<PatternMatching {...defaultProps} />);

      fireEvent.click(screen.getByTestId('option-B'));
      expect(screen.getByTestId('option-A')).toBeDisabled();

      // Change question
      rerender(<PatternMatching {...defaultProps} correctOption="C" />);

      expect(screen.getByTestId('option-A')).not.toBeDisabled();
      expect(screen.getByTestId('instruction-text')).toHaveTextContent('Tap the grid that matches the pattern above');
    });
  });

  describe('Accessibility', () => {
    it('has 140px minimum height for option buttons (large touch targets)', () => {
      render(<PatternMatching {...defaultProps} />);

      ['A', 'B', 'C', 'D'].forEach(option => {
        const button = screen.getByTestId(`option-${option}`);
        expect(button).toHaveClass('min-h-[140px]');
      });
    });

    it('has 120px minimum width for option buttons', () => {
      render(<PatternMatching {...defaultProps} />);

      ['A', 'B', 'C', 'D'].forEach(option => {
        const button = screen.getByTestId(`option-${option}`);
        expect(button).toHaveClass('min-w-[120px]');
      });
    });

    it('provides descriptive aria labels for grids', () => {
      render(<PatternMatching {...defaultProps} />);

      expect(screen.getByLabelText('Target grid pattern')).toBeInTheDocument();
      expect(screen.getByLabelText('Option A grid pattern')).toBeInTheDocument();
      expect(screen.getByLabelText('Option B grid pattern')).toBeInTheDocument();
    });

    it('provides aria labels for grid cells', () => {
      render(<PatternMatching {...defaultProps} />);

      const filledCell = screen.getByTestId('target-pattern-cell-0-0');
      expect(filledCell).toHaveAttribute('aria-label', 'Filled');

      const emptyCell = screen.getByTestId('target-pattern-cell-0-1');
      expect(emptyCell).toHaveAttribute('aria-label', 'Empty');
    });
  });

  describe('Grid Component', () => {
    it('renders grid with correct structure', () => {
      render(<PatternMatching {...defaultProps} />);

      const grid = screen.getByTestId('target-pattern');
      // Grid contains 3 rows, each with 3 cells = 9 total cells
      const cells = grid.querySelectorAll('[data-testid^="target-pattern-cell"]');
      expect(cells).toHaveLength(9); // 3 rows × 3 cells
    });

    it('renders cells with correct styling based on value', () => {
      render(<PatternMatching {...defaultProps} />);

      // Filled cell (value = 1)
      const filledCell = screen.getByTestId('target-pattern-cell-0-0');
      expect(filledCell).toHaveStyle({ backgroundColor: '#E87461' });

      // Empty cell (value = 0)
      const emptyCell = screen.getByTestId('target-pattern-cell-0-1');
      expect(emptyCell).toHaveStyle({ backgroundColor: '#ffffff' });
    });

    it('renders cells with consistent dimensions', () => {
      render(<PatternMatching {...defaultProps} />);

      const cell = screen.getByTestId('target-pattern-cell-0-0');
      expect(cell).toHaveClass('w-8');
      expect(cell).toHaveClass('h-8');
    });
  });

  describe('QuestionCard Integration', () => {
    it('renders within QuestionCard wrapper', () => {
      render(<PatternMatching {...defaultProps} />);

      expect(screen.getByTestId('pattern-matching')).toBeInTheDocument();
      expect(screen.getByTestId('question-prompt')).toBeInTheDocument();
    });
  });

  describe('Different Pattern Types', () => {
    it('handles different pattern configurations', () => {
      const crossPattern = [
        [0, 1, 0],
        [1, 1, 1],
        [0, 1, 0],
      ];

      render(
        <PatternMatching
          {...defaultProps}
          patternType="cross"
          targetPattern={crossPattern}
          options={{
            A: crossPattern,
            B: checkerboardPattern,
            C: diagonalPattern,
            D: [[0, 0, 0], [0, 0, 0], [0, 0, 0]],
          }}
          correctOption="A"
        />
      );

      // Verify cross pattern renders correctly
      expect(screen.getByTestId('target-pattern-cell-0-0')).toHaveStyle({ backgroundColor: '#ffffff' });
      expect(screen.getByTestId('target-pattern-cell-0-1')).toHaveStyle({ backgroundColor: '#E87461' });
      expect(screen.getByTestId('target-pattern-cell-1-1')).toHaveStyle({ backgroundColor: '#E87461' });
    });
  });
});
