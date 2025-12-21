// NumberLineEstimation.test.tsx - Unit tests for NumberLineEstimation component
// Story 2.2: Implement Number Sense Question Types
// AC4-AC7: Number line range, position click, tolerance, recording

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '../../../../tests/test-utils';
import { NumberLineEstimation, NumberLineResult } from './NumberLineEstimation';

describe('NumberLineEstimation', () => {
  const mockOnAnswer = vi.fn();

  const defaultProps = {
    range: [0, 100] as [number, number],
    targetNumber: 25,
    onAnswer: mockOnAnswer,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders number line', () => {
      render(<NumberLineEstimation {...defaultProps} />);

      expect(screen.getByTestId('number-line')).toBeInTheDocument();
    });

    it('renders line track', () => {
      render(<NumberLineEstimation {...defaultProps} />);

      expect(screen.getByTestId('line-track')).toBeInTheDocument();
    });

    it('renders range labels', () => {
      render(<NumberLineEstimation {...defaultProps} range={[0, 100]} />);

      expect(screen.getByTestId('range-min')).toHaveTextContent('0');
      expect(screen.getByTestId('range-max')).toHaveTextContent('100');
    });

    it('renders question with target number', () => {
      render(<NumberLineEstimation {...defaultProps} targetNumber={42} />);

      expect(screen.getByTestId('question-prompt')).toHaveTextContent('Where is 42 on this line?');
    });

    it('renders instruction text', () => {
      render(<NumberLineEstimation {...defaultProps} />);

      expect(screen.getByTestId('instruction-text')).toHaveTextContent(
        'Tap or click on the line to mark your answer'
      );
    });
  });

  describe('Range Support', () => {
    it('supports 0-100 range', () => {
      render(<NumberLineEstimation {...defaultProps} range={[0, 100]} />);

      expect(screen.getByTestId('range-min')).toHaveTextContent('0');
      expect(screen.getByTestId('range-max')).toHaveTextContent('100');
    });

    it('supports 0-1000 range', () => {
      render(<NumberLineEstimation {...defaultProps} range={[0, 1000]} targetNumber={500} />);

      expect(screen.getByTestId('range-min')).toHaveTextContent('0');
      expect(screen.getByTestId('range-max')).toHaveTextContent('1000');
    });
  });

  describe('Click Handling', () => {
    it('calls onAnswer when line is clicked', () => {
      render(<NumberLineEstimation {...defaultProps} />);

      const line = screen.getByTestId('number-line');

      // Mock getBoundingClientRect
      vi.spyOn(line, 'getBoundingClientRect').mockReturnValue({
        left: 0,
        right: 100,
        width: 100,
        top: 0,
        bottom: 50,
        height: 50,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      });

      fireEvent.click(line, { clientX: 50, clientY: 25 });

      expect(mockOnAnswer).toHaveBeenCalledTimes(1);
    });

    it('calculates percentage position correctly', () => {
      render(<NumberLineEstimation {...defaultProps} />);

      const line = screen.getByTestId('number-line');

      vi.spyOn(line, 'getBoundingClientRect').mockReturnValue({
        left: 0,
        right: 100,
        width: 100,
        top: 0,
        bottom: 50,
        height: 50,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      });

      // Click at 50% position
      fireEvent.click(line, { clientX: 50, clientY: 25 });

      const result: NumberLineResult = mockOnAnswer.mock.calls[0][0];
      expect(result.userAnswer).toBe(50);
    });

    it('clamps position to 0-100 range', () => {
      render(<NumberLineEstimation {...defaultProps} />);

      const line = screen.getByTestId('number-line');

      vi.spyOn(line, 'getBoundingClientRect').mockReturnValue({
        left: 0,
        right: 100,
        width: 100,
        top: 0,
        bottom: 50,
        height: 50,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      });

      // Click beyond right edge
      fireEvent.click(line, { clientX: 150, clientY: 25 });

      const result: NumberLineResult = mockOnAnswer.mock.calls[0][0];
      expect(result.userAnswer).toBe(100);
    });
  });

  describe('Tolerance Calculation', () => {
    it('isCorrect=true when within ±10% tolerance', () => {
      render(<NumberLineEstimation {...defaultProps} targetNumber={25} />);

      const line = screen.getByTestId('number-line');

      vi.spyOn(line, 'getBoundingClientRect').mockReturnValue({
        left: 0,
        right: 100,
        width: 100,
        top: 0,
        bottom: 50,
        height: 50,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      });

      // Click at 30% (within 10% of 25%)
      fireEvent.click(line, { clientX: 30, clientY: 25 });

      const result: NumberLineResult = mockOnAnswer.mock.calls[0][0];
      expect(result.isCorrect).toBe(true);
      expect(result.error).toBe(5);
    });

    it('isCorrect=false when outside ±10% tolerance', () => {
      render(<NumberLineEstimation {...defaultProps} targetNumber={25} />);

      const line = screen.getByTestId('number-line');

      vi.spyOn(line, 'getBoundingClientRect').mockReturnValue({
        left: 0,
        right: 100,
        width: 100,
        top: 0,
        bottom: 50,
        height: 50,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      });

      // Click at 50% (25% away from 25%)
      fireEvent.click(line, { clientX: 50, clientY: 25 });

      const result: NumberLineResult = mockOnAnswer.mock.calls[0][0];
      expect(result.isCorrect).toBe(false);
      expect(result.error).toBe(25);
    });

    it('supports custom tolerance', () => {
      render(<NumberLineEstimation {...defaultProps} targetNumber={25} tolerance={5} />);

      const line = screen.getByTestId('number-line');

      vi.spyOn(line, 'getBoundingClientRect').mockReturnValue({
        left: 0,
        right: 100,
        width: 100,
        top: 0,
        bottom: 50,
        height: 50,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      });

      // Click at 32% (7% away from 25%, outside 5% tolerance)
      fireEvent.click(line, { clientX: 32, clientY: 25 });

      const result: NumberLineResult = mockOnAnswer.mock.calls[0][0];
      expect(result.isCorrect).toBe(false);
    });
  });

  describe('Recording Fields', () => {
    it('records userAnswer as percentage', () => {
      render(<NumberLineEstimation {...defaultProps} />);

      const line = screen.getByTestId('number-line');

      vi.spyOn(line, 'getBoundingClientRect').mockReturnValue({
        left: 0,
        right: 100,
        width: 100,
        top: 0,
        bottom: 50,
        height: 50,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      });

      fireEvent.click(line, { clientX: 75, clientY: 25 });

      const result: NumberLineResult = mockOnAnswer.mock.calls[0][0];
      expect(result.userAnswer).toBe(75);
    });

    it('records correctAnswer as percentage', () => {
      render(<NumberLineEstimation {...defaultProps} range={[0, 100]} targetNumber={25} />);

      const line = screen.getByTestId('number-line');

      vi.spyOn(line, 'getBoundingClientRect').mockReturnValue({
        left: 0,
        right: 100,
        width: 100,
        top: 0,
        bottom: 50,
        height: 50,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      });

      fireEvent.click(line, { clientX: 50, clientY: 25 });

      const result: NumberLineResult = mockOnAnswer.mock.calls[0][0];
      expect(result.correctAnswer).toBe(25);
    });

    it('records error as absolute difference', () => {
      render(<NumberLineEstimation {...defaultProps} range={[0, 100]} targetNumber={25} />);

      const line = screen.getByTestId('number-line');

      vi.spyOn(line, 'getBoundingClientRect').mockReturnValue({
        left: 0,
        right: 100,
        width: 100,
        top: 0,
        bottom: 50,
        height: 50,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      });

      // Click at 40%
      fireEvent.click(line, { clientX: 40, clientY: 25 });

      const result: NumberLineResult = mockOnAnswer.mock.calls[0][0];
      expect(result.error).toBe(15); // |40 - 25| = 15
    });

    it('records timeToAnswer in milliseconds', () => {
      render(<NumberLineEstimation {...defaultProps} />);

      const line = screen.getByTestId('number-line');

      vi.spyOn(line, 'getBoundingClientRect').mockReturnValue({
        left: 0,
        right: 100,
        width: 100,
        top: 0,
        bottom: 50,
        height: 50,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      });

      fireEvent.click(line, { clientX: 50, clientY: 25 });

      const result: NumberLineResult = mockOnAnswer.mock.calls[0][0];
      expect(typeof result.timeToAnswer).toBe('number');
      expect(result.timeToAnswer).toBeGreaterThanOrEqual(0);
    });

    it('records targetNumber and range', () => {
      render(<NumberLineEstimation {...defaultProps} range={[0, 1000]} targetNumber={500} />);

      const line = screen.getByTestId('number-line');

      vi.spyOn(line, 'getBoundingClientRect').mockReturnValue({
        left: 0,
        right: 100,
        width: 100,
        top: 0,
        bottom: 50,
        height: 50,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      });

      fireEvent.click(line, { clientX: 50, clientY: 25 });

      const result: NumberLineResult = mockOnAnswer.mock.calls[0][0];
      expect(result.targetNumber).toBe(500);
      expect(result.range).toEqual([0, 1000]);
    });
  });

  describe('Answer State', () => {
    it('shows position marker after clicking', () => {
      render(<NumberLineEstimation {...defaultProps} />);

      const line = screen.getByTestId('number-line');

      vi.spyOn(line, 'getBoundingClientRect').mockReturnValue({
        left: 0,
        right: 100,
        width: 100,
        top: 0,
        bottom: 50,
        height: 50,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      });

      // Before click, no marker
      expect(screen.queryByTestId('position-marker')).not.toBeInTheDocument();

      fireEvent.click(line, { clientX: 50, clientY: 25 });

      // After click, marker visible
      expect(screen.getByTestId('position-marker')).toBeInTheDocument();
    });

    it('updates instruction text after answering', () => {
      render(<NumberLineEstimation {...defaultProps} />);

      const line = screen.getByTestId('number-line');

      vi.spyOn(line, 'getBoundingClientRect').mockReturnValue({
        left: 0,
        right: 100,
        width: 100,
        top: 0,
        bottom: 50,
        height: 50,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      });

      fireEvent.click(line, { clientX: 50, clientY: 25 });

      expect(screen.getByTestId('instruction-text')).toHaveTextContent('Answer recorded');
    });

    it('only allows one answer', () => {
      render(<NumberLineEstimation {...defaultProps} />);

      const line = screen.getByTestId('number-line');

      vi.spyOn(line, 'getBoundingClientRect').mockReturnValue({
        left: 0,
        right: 100,
        width: 100,
        top: 0,
        bottom: 50,
        height: 50,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      });

      fireEvent.click(line, { clientX: 50, clientY: 25 });
      fireEvent.click(line, { clientX: 75, clientY: 25 }); // Should be ignored

      expect(mockOnAnswer).toHaveBeenCalledTimes(1);
    });
  });

  describe('Accessibility', () => {
    it('has slider role', () => {
      render(<NumberLineEstimation {...defaultProps} />);

      const line = screen.getByTestId('number-line');
      expect(line).toHaveAttribute('role', 'slider');
    });

    it('has aria-label with instructions', () => {
      render(<NumberLineEstimation {...defaultProps} range={[0, 100]} targetNumber={25} />);

      const line = screen.getByTestId('number-line');
      expect(line).toHaveAttribute(
        'aria-label',
        'Number line from 0 to 100. Find where 25 should be.'
      );
    });

    it('has aria-valuemin and aria-valuemax', () => {
      render(<NumberLineEstimation {...defaultProps} range={[0, 100]} />);

      const line = screen.getByTestId('number-line');
      expect(line).toHaveAttribute('aria-valuemin', '0');
      expect(line).toHaveAttribute('aria-valuemax', '100');
    });

    it('is focusable before answering', () => {
      render(<NumberLineEstimation {...defaultProps} />);

      const line = screen.getByTestId('number-line');
      expect(line).toHaveAttribute('tabIndex', '0');
    });

    it('removes focus after answering', () => {
      render(<NumberLineEstimation {...defaultProps} />);

      const line = screen.getByTestId('number-line');

      vi.spyOn(line, 'getBoundingClientRect').mockReturnValue({
        left: 0,
        right: 100,
        width: 100,
        top: 0,
        bottom: 50,
        height: 50,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      });

      fireEvent.click(line, { clientX: 50, clientY: 25 });

      expect(line).toHaveAttribute('tabIndex', '-1');
    });
  });

  describe('Keyboard Support', () => {
    it('Enter key places answer at center for keyboard users', () => {
      render(<NumberLineEstimation {...defaultProps} />);

      const line = screen.getByTestId('number-line');
      fireEvent.keyDown(line, { key: 'Enter' });

      expect(mockOnAnswer).toHaveBeenCalledTimes(1);
      const result: NumberLineResult = mockOnAnswer.mock.calls[0][0];
      expect(result.userAnswer).toBe(50);
    });

    it('Space key places answer at center for keyboard users', () => {
      render(<NumberLineEstimation {...defaultProps} />);

      const line = screen.getByTestId('number-line');
      fireEvent.keyDown(line, { key: ' ' });

      expect(mockOnAnswer).toHaveBeenCalledTimes(1);
      const result: NumberLineResult = mockOnAnswer.mock.calls[0][0];
      expect(result.userAnswer).toBe(50);
    });
  });
});
