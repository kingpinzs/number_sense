// QuantityComparison.test.tsx - Unit tests for QuantityComparison component
// Story 2.2: Implement Number Sense Question Types
// AC1-AC3: Two groups of dots, answer options, recording

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '../../../../tests/test-utils';
import { QuantityComparison } from './QuantityComparison';
import type { QuantityComparisonResult } from './QuantityComparison';

describe('QuantityComparison', () => {
  const mockOnAnswer = vi.fn();

  const defaultProps = {
    leftCount: 7,
    rightCount: 10,
    onAnswer: mockOnAnswer,
    seed: 12345, // Deterministic for tests
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders two dot groups', () => {
      render(<QuantityComparison {...defaultProps} />);

      expect(screen.getByTestId('left-group')).toBeInTheDocument();
      expect(screen.getByTestId('right-group')).toBeInTheDocument();
    });

    it('renders correct number of dots in left group', () => {
      render(<QuantityComparison {...defaultProps} />);

      const leftGroup = screen.getByTestId('left-group');
      const dots = leftGroup.querySelectorAll('circle');
      expect(dots).toHaveLength(7);
    });

    it('renders correct number of dots in right group', () => {
      render(<QuantityComparison {...defaultProps} />);

      const rightGroup = screen.getByTestId('right-group');
      const dots = rightGroup.querySelectorAll('circle');
      expect(dots).toHaveLength(10);
    });

    it('renders question prompt', () => {
      render(<QuantityComparison {...defaultProps} />);

      expect(screen.getByTestId('question-prompt')).toHaveTextContent('Which group has more dots?');
    });

    it('renders three answer buttons', () => {
      render(<QuantityComparison {...defaultProps} />);

      expect(screen.getByTestId('answer-left')).toBeInTheDocument();
      expect(screen.getByTestId('answer-right')).toBeInTheDocument();
      expect(screen.getByTestId('answer-same')).toBeInTheDocument();
    });
  });

  describe('Dot Range', () => {
    it('accepts 5 dots (minimum)', () => {
      render(<QuantityComparison {...defaultProps} leftCount={5} rightCount={5} />);

      const leftGroup = screen.getByTestId('left-group');
      const dots = leftGroup.querySelectorAll('circle');
      expect(dots).toHaveLength(5);
    });

    it('accepts 20 dots (maximum)', () => {
      render(<QuantityComparison {...defaultProps} leftCount={20} rightCount={20} />);

      const leftGroup = screen.getByTestId('left-group');
      const dots = leftGroup.querySelectorAll('circle');
      expect(dots).toHaveLength(20);
    });
  });

  describe('Answer Selection', () => {
    it('calls onAnswer with "left" when left button clicked', () => {
      render(<QuantityComparison {...defaultProps} />);

      fireEvent.click(screen.getByTestId('answer-left'));

      expect(mockOnAnswer).toHaveBeenCalledTimes(1);
      const result: QuantityComparisonResult = mockOnAnswer.mock.calls[0][0];
      expect(result.answer).toBe('left');
    });

    it('calls onAnswer with "right" when right button clicked', () => {
      render(<QuantityComparison {...defaultProps} />);

      fireEvent.click(screen.getByTestId('answer-right'));

      expect(mockOnAnswer).toHaveBeenCalledTimes(1);
      const result: QuantityComparisonResult = mockOnAnswer.mock.calls[0][0];
      expect(result.answer).toBe('right');
    });

    it('calls onAnswer with "same" when same button clicked', () => {
      render(<QuantityComparison {...defaultProps} leftCount={8} rightCount={8} />);

      fireEvent.click(screen.getByTestId('answer-same'));

      expect(mockOnAnswer).toHaveBeenCalledTimes(1);
      const result: QuantityComparisonResult = mockOnAnswer.mock.calls[0][0];
      expect(result.answer).toBe('same');
    });
  });

  describe('Correctness Calculation', () => {
    it('isCorrect=true when right has more and "right" selected', () => {
      render(<QuantityComparison {...defaultProps} leftCount={5} rightCount={10} />);

      fireEvent.click(screen.getByTestId('answer-right'));

      const result: QuantityComparisonResult = mockOnAnswer.mock.calls[0][0];
      expect(result.isCorrect).toBe(true);
    });

    it('isCorrect=true when left has more and "left" selected', () => {
      render(<QuantityComparison {...defaultProps} leftCount={15} rightCount={8} />);

      fireEvent.click(screen.getByTestId('answer-left'));

      const result: QuantityComparisonResult = mockOnAnswer.mock.calls[0][0];
      expect(result.isCorrect).toBe(true);
    });

    it('isCorrect=true when equal and "same" selected', () => {
      render(<QuantityComparison {...defaultProps} leftCount={10} rightCount={10} />);

      fireEvent.click(screen.getByTestId('answer-same'));

      const result: QuantityComparisonResult = mockOnAnswer.mock.calls[0][0];
      expect(result.isCorrect).toBe(true);
    });

    it('isCorrect=false when wrong answer selected', () => {
      render(<QuantityComparison {...defaultProps} leftCount={5} rightCount={10} />);

      fireEvent.click(screen.getByTestId('answer-left')); // Wrong - right has more

      const result: QuantityComparisonResult = mockOnAnswer.mock.calls[0][0];
      expect(result.isCorrect).toBe(false);
    });
  });

  describe('Recording Fields', () => {
    it('records timeToAnswer in milliseconds', () => {
      render(<QuantityComparison {...defaultProps} />);

      fireEvent.click(screen.getByTestId('answer-right'));

      const result: QuantityComparisonResult = mockOnAnswer.mock.calls[0][0];
      expect(typeof result.timeToAnswer).toBe('number');
      expect(result.timeToAnswer).toBeGreaterThanOrEqual(0);
    });

    it('records leftCount and rightCount', () => {
      render(<QuantityComparison {...defaultProps} leftCount={7} rightCount={12} />);

      fireEvent.click(screen.getByTestId('answer-right'));

      const result: QuantityComparisonResult = mockOnAnswer.mock.calls[0][0];
      expect(result.leftCount).toBe(7);
      expect(result.rightCount).toBe(12);
    });
  });

  describe('Answer State', () => {
    it('disables buttons after answering', () => {
      render(<QuantityComparison {...defaultProps} />);

      fireEvent.click(screen.getByTestId('answer-right'));

      expect(screen.getByTestId('answer-left')).toBeDisabled();
      expect(screen.getByTestId('answer-right')).toBeDisabled();
      expect(screen.getByTestId('answer-same')).toBeDisabled();
    });

    it('only allows one answer', () => {
      render(<QuantityComparison {...defaultProps} />);

      fireEvent.click(screen.getByTestId('answer-right'));
      fireEvent.click(screen.getByTestId('answer-left')); // Should be ignored

      expect(mockOnAnswer).toHaveBeenCalledTimes(1);
    });
  });

  describe('Accessibility', () => {
    it('buttons have minimum 44px tap target', () => {
      render(<QuantityComparison {...defaultProps} />);

      const leftButton = screen.getByTestId('answer-left');
      expect(leftButton).toHaveClass('min-h-[44px]');
    });

    it('SVGs have aria-labels', () => {
      render(<QuantityComparison {...defaultProps} leftCount={7} rightCount={10} />);

      const leftGroup = screen.getByTestId('left-group');
      const rightGroup = screen.getByTestId('right-group');

      expect(leftGroup).toHaveAttribute('aria-label', 'Left group with 7 dots');
      expect(rightGroup).toHaveAttribute('aria-label', 'Right group with 10 dots');
    });
  });

  describe('Deterministic Rendering', () => {
    it('produces same dot positions with same seed', () => {
      const { rerender } = render(<QuantityComparison {...defaultProps} seed={42} />);
      const firstDot = screen.getByTestId('left-group').querySelector('circle');
      const firstCx = firstDot?.getAttribute('cx');

      rerender(<QuantityComparison {...defaultProps} seed={42} />);
      const secondDot = screen.getByTestId('left-group').querySelector('circle');
      const secondCx = secondDot?.getAttribute('cx');

      expect(firstCx).toBe(secondCx);
    });
  });
});
