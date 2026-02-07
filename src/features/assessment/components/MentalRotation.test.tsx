// MentalRotation.test.tsx - Unit tests for MentalRotation component
// Story 2.3: Implement Spatial Awareness Question Types
// AC1-AC4: Two shapes, rotation, Yes/No options, timing

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '../../../../tests/test-utils';
import { MentalRotation } from './MentalRotation';
import type { MentalRotationResult } from './MentalRotation';

describe('MentalRotation', () => {
  const mockOnAnswer = vi.fn();

  const defaultProps = {
    shapeType: 'L-shape',
    rotationAngle: 90 as const,
    isMatch: true,
    onAnswer: mockOnAnswer,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders two shape groups', () => {
      render(<MentalRotation {...defaultProps} />);

      expect(screen.getByTestId('left-shape')).toBeInTheDocument();
      expect(screen.getByTestId('right-shape')).toBeInTheDocument();
    });

    it('renders SVG shapes with path elements', () => {
      render(<MentalRotation {...defaultProps} />);

      expect(screen.getByTestId('left-shape-path')).toBeInTheDocument();
      expect(screen.getByTestId('right-shape-path')).toBeInTheDocument();
    });

    it('applies rotation to right shape', () => {
      render(<MentalRotation {...defaultProps} />);

      const rightShape = screen.getByTestId('right-shape');
      const svg = rightShape.querySelector('svg');
      expect(svg).toHaveStyle({ transform: 'rotate(90deg)' });
    });

    it('applies 180 degree rotation correctly', () => {
      render(<MentalRotation {...defaultProps} rotationAngle={180} />);

      const rightShape = screen.getByTestId('right-shape');
      const svg = rightShape.querySelector('svg');
      expect(svg).toHaveStyle({ transform: 'rotate(180deg)' });
    });

    it('applies 270 degree rotation correctly', () => {
      render(<MentalRotation {...defaultProps} rotationAngle={270} />);

      const rightShape = screen.getByTestId('right-shape');
      const svg = rightShape.querySelector('svg');
      expect(svg).toHaveStyle({ transform: 'rotate(270deg)' });
    });

    it('renders question prompt', () => {
      render(<MentalRotation {...defaultProps} />);

      expect(screen.getByTestId('question-prompt')).toHaveTextContent('Are these the same shape?');
    });

    it('renders Yes/No answer buttons', () => {
      render(<MentalRotation {...defaultProps} />);

      expect(screen.getByTestId('answer-yes')).toBeInTheDocument();
      expect(screen.getByTestId('answer-no')).toBeInTheDocument();
    });

    it('renders accessible button labels', () => {
      render(<MentalRotation {...defaultProps} />);

      expect(screen.getByLabelText('Yes, these are the same shape')).toBeInTheDocument();
      expect(screen.getByLabelText('No, these are different shapes')).toBeInTheDocument();
    });

    it('renders shape with appropriate aria labels', () => {
      render(<MentalRotation {...defaultProps} />);

      expect(screen.getByLabelText('Left L-shape shape')).toBeInTheDocument();
      expect(screen.getByLabelText('Right L-shape shape rotated 90 degrees')).toBeInTheDocument();
    });
  });

  describe('Answer Selection', () => {
    it('calls onAnswer with "yes" when Yes button clicked', () => {
      render(<MentalRotation {...defaultProps} />);

      fireEvent.click(screen.getByTestId('answer-yes'));

      expect(mockOnAnswer).toHaveBeenCalledOnce();
      const result: MentalRotationResult = mockOnAnswer.mock.calls[0][0];
      expect(result.answer).toBe('yes');
    });

    it('calls onAnswer with "no" when No button clicked', () => {
      render(<MentalRotation {...defaultProps} />);

      fireEvent.click(screen.getByTestId('answer-no'));

      expect(mockOnAnswer).toHaveBeenCalledOnce();
      const result: MentalRotationResult = mockOnAnswer.mock.calls[0][0];
      expect(result.answer).toBe('no');
    });

    it('marks answer correct when user says "yes" and shapes match', () => {
      render(<MentalRotation {...defaultProps} isMatch={true} />);

      fireEvent.click(screen.getByTestId('answer-yes'));

      const result: MentalRotationResult = mockOnAnswer.mock.calls[0][0];
      expect(result.isCorrect).toBe(true);
    });

    it('marks answer incorrect when user says "yes" but shapes do not match', () => {
      render(<MentalRotation {...defaultProps} isMatch={false} />);

      fireEvent.click(screen.getByTestId('answer-yes'));

      const result: MentalRotationResult = mockOnAnswer.mock.calls[0][0];
      expect(result.isCorrect).toBe(false);
    });

    it('marks answer correct when user says "no" and shapes do not match', () => {
      render(<MentalRotation {...defaultProps} isMatch={false} />);

      fireEvent.click(screen.getByTestId('answer-no'));

      const result: MentalRotationResult = mockOnAnswer.mock.calls[0][0];
      expect(result.isCorrect).toBe(true);
    });

    it('marks answer incorrect when user says "no" but shapes match', () => {
      render(<MentalRotation {...defaultProps} isMatch={true} />);

      fireEvent.click(screen.getByTestId('answer-no'));

      const result: MentalRotationResult = mockOnAnswer.mock.calls[0][0];
      expect(result.isCorrect).toBe(false);
    });
  });

  describe('Timing', () => {
    it('records time to answer in milliseconds', () => {
      render(<MentalRotation {...defaultProps} />);

      fireEvent.click(screen.getByTestId('answer-yes'));

      const result: MentalRotationResult = mockOnAnswer.mock.calls[0][0];
      expect(result.timeToAnswer).toBeGreaterThan(0);
      expect(result.timeToAnswer).toBeLessThan(1000); // Reasonable test execution time
    });

    it('includes all required result fields', () => {
      render(<MentalRotation {...defaultProps} />);

      fireEvent.click(screen.getByTestId('answer-yes'));

      const result: MentalRotationResult = mockOnAnswer.mock.calls[0][0];
      expect(result).toHaveProperty('answer');
      expect(result).toHaveProperty('isCorrect');
      expect(result).toHaveProperty('timeToAnswer');
      expect(result).toHaveProperty('shapeType');
      expect(result).toHaveProperty('rotationAngle');
      expect(result).toHaveProperty('isMatch');
    });

    it('passes through shape configuration to result', () => {
      render(<MentalRotation {...defaultProps} />);

      fireEvent.click(screen.getByTestId('answer-yes'));

      const result: MentalRotationResult = mockOnAnswer.mock.calls[0][0];
      expect(result.shapeType).toBe('L-shape');
      expect(result.rotationAngle).toBe(90);
      expect(result.isMatch).toBe(true);
    });
  });

  describe('State Management', () => {
    it('disables buttons after answering', () => {
      render(<MentalRotation {...defaultProps} />);

      fireEvent.click(screen.getByTestId('answer-yes'));

      expect(screen.getByTestId('answer-yes')).toBeDisabled();
      expect(screen.getByTestId('answer-no')).toBeDisabled();
    });

    it('prevents multiple answers', () => {
      render(<MentalRotation {...defaultProps} />);

      fireEvent.click(screen.getByTestId('answer-yes'));
      fireEvent.click(screen.getByTestId('answer-no'));

      expect(mockOnAnswer).toHaveBeenCalledOnce();
    });

    it('resets state when question changes', () => {
      const { rerender } = render(<MentalRotation {...defaultProps} />);

      fireEvent.click(screen.getByTestId('answer-yes'));
      expect(screen.getByTestId('answer-yes')).toBeDisabled();

      // Change question
      rerender(<MentalRotation {...defaultProps} rotationAngle={180} />);

      expect(screen.getByTestId('answer-yes')).not.toBeDisabled();
      expect(screen.getByTestId('answer-no')).not.toBeDisabled();
    });
  });

  describe('Accessibility', () => {
    it('has 60px minimum height for touch targets', () => {
      render(<MentalRotation {...defaultProps} />);

      const yesButton = screen.getByTestId('answer-yes');
      const noButton = screen.getByTestId('answer-no');

      expect(yesButton).toHaveClass('min-h-[60px]');
      expect(noButton).toHaveClass('min-h-[60px]');
    });

    it('provides descriptive aria labels for shapes', () => {
      render(<MentalRotation {...defaultProps} shapeType="T-shape" rotationAngle={180} />);

      expect(screen.getByLabelText('Left T-shape shape')).toBeInTheDocument();
      expect(screen.getByLabelText('Right T-shape shape rotated 180 degrees')).toBeInTheDocument();
    });

    it('uses semantic SVG role for images', () => {
      render(<MentalRotation {...defaultProps} />);

      const svgs = screen.getAllByRole('img');
      expect(svgs).toHaveLength(2);
    });
  });

  describe('Different Shape Types', () => {
    it('renders L-shape correctly', () => {
      render(<MentalRotation {...defaultProps} shapeType="L-shape" />);

      const path = screen.getByTestId('left-shape-path');
      expect(path).toHaveAttribute('d');
    });

    it('renders T-shape correctly', () => {
      render(<MentalRotation {...defaultProps} shapeType="T-shape" />);

      const path = screen.getByTestId('left-shape-path');
      expect(path).toHaveAttribute('d');
    });

    it('renders zigzag correctly', () => {
      render(<MentalRotation {...defaultProps} shapeType="zigzag" />);

      const path = screen.getByTestId('left-shape-path');
      expect(path).toHaveAttribute('d');
    });

    it('renders irregular-polygon correctly', () => {
      render(<MentalRotation {...defaultProps} shapeType="irregular-polygon" />);

      const path = screen.getByTestId('left-shape-path');
      expect(path).toHaveAttribute('d');
    });

    it('renders arrow correctly', () => {
      render(<MentalRotation {...defaultProps} shapeType="arrow" />);

      const path = screen.getByTestId('left-shape-path');
      expect(path).toHaveAttribute('d');
    });

    it('falls back to L-shape for unknown shape type', () => {
      render(<MentalRotation {...defaultProps} shapeType="unknown-shape" />);

      const path = screen.getByTestId('left-shape-path');
      expect(path).toHaveAttribute('d');
    });
  });

  describe('QuestionCard Integration', () => {
    it('renders within QuestionCard wrapper', () => {
      render(<MentalRotation {...defaultProps} />);

      expect(screen.getByTestId('mental-rotation')).toBeInTheDocument();
      expect(screen.getByTestId('question-prompt')).toBeInTheDocument();
      expect(screen.getByTestId('question-footer')).toBeInTheDocument();
    });
  });
});
