/**
 * MicroMathDrill Component Tests
 * Story 4.3: Simplified math operations drill for Magic Minute
 *
 * Tests for the math micro-challenge component including:
 * - Rendering of math problems and keypad
 * - Digit input via buttons and keyboard
 * - Backspace behavior
 * - Submit behavior (manual and auto-submit after 2 digits)
 * - 8-second timeout
 * - Submission guard (no double-submit)
 * - Accessibility and hint text
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import MicroMathDrill from './MicroMathDrill';
import type { MicroMathParams } from '../types/microChallenge.types';

// Mock framer-motion to avoid animation side effects in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: 'div',
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock window.matchMedia for prefersReducedMotion
beforeEach(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
});

// Default test props
const defaultParams: MicroMathParams = {
  problem: '3 + 5',
  answer: 8,
  operation: 'addition',
};

const defaultProps = {
  challengeId: 'test-challenge-1',
  params: defaultParams,
  targetMistakeType: 'operation_weakness' as const,
  onComplete: vi.fn(),
  timeRemaining: 45,
};

describe('MicroMathDrill', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    defaultProps.onComplete = vi.fn();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // =========================================================================
  // Rendering Tests
  // =========================================================================

  it('renders math problem correctly', () => {
    render(<MicroMathDrill {...defaultProps} />);

    // The problem is rendered as "3 + 5 = ?" in the component
    expect(screen.getByText(/3 \+ 5/)).toBeInTheDocument();
    expect(screen.getByText('?')).toBeInTheDocument();
  });

  it('shows empty answer display initially with placeholder text', () => {
    render(<MicroMathDrill {...defaultProps} />);

    expect(screen.getByText('Type answer...')).toBeInTheDocument();
    expect(screen.getByLabelText('Your answer: empty')).toBeInTheDocument();
  });

  // =========================================================================
  // Digit Button Input Tests
  // =========================================================================

  it('digit button click updates answer display', () => {
    render(<MicroMathDrill {...defaultProps} />);

    const button5 = screen.getByRole('button', { name: '5' });
    fireEvent.click(button5);

    expect(screen.getByLabelText('Your answer: 5')).toBeInTheDocument();
    // Placeholder should be gone
    expect(screen.queryByText('Type answer...')).not.toBeInTheDocument();
  });

  it('multiple digit clicks build answer string', () => {
    // Use a subtraction problem so auto-submit result is still testable
    render(<MicroMathDrill {...defaultProps} />);

    const button1 = screen.getByRole('button', { name: '1' });
    fireEvent.click(button1);

    // After first digit, answer display shows "1"
    expect(screen.getByLabelText('Your answer: 1')).toBeInTheDocument();

    // After second digit, answer will auto-submit after 200ms delay,
    // but the display should show "12" momentarily
    const button2 = screen.getByRole('button', { name: '2' });
    fireEvent.click(button2);

    expect(screen.getByLabelText('Your answer: 12')).toBeInTheDocument();
  });

  // =========================================================================
  // Backspace Tests
  // =========================================================================

  it('backspace removes last digit', () => {
    render(<MicroMathDrill {...defaultProps} />);

    // Type a digit
    const button7 = screen.getByRole('button', { name: '7' });
    fireEvent.click(button7);
    expect(screen.getByLabelText('Your answer: 7')).toBeInTheDocument();

    // Click backspace
    const backspaceButton = screen.getByLabelText('Backspace');
    fireEvent.click(backspaceButton);

    // Back to empty
    expect(screen.getByLabelText('Your answer: empty')).toBeInTheDocument();
    expect(screen.getByText('Type answer...')).toBeInTheDocument();
  });

  it('backspace button is disabled when answer is empty', () => {
    render(<MicroMathDrill {...defaultProps} />);

    const backspaceButton = screen.getByLabelText('Backspace');
    expect(backspaceButton).toBeDisabled();
  });

  // =========================================================================
  // Submit Behavior Tests
  // =========================================================================

  it('correct answer calls onComplete with correct: true', () => {
    render(<MicroMathDrill {...defaultProps} />);

    // Type "8" which is the correct answer for 3 + 5
    const button8 = screen.getByRole('button', { name: '8' });
    fireEvent.click(button8);

    // Submit manually
    const submitButton = screen.getByLabelText('Submit answer');
    fireEvent.click(submitButton);

    expect(defaultProps.onComplete).toHaveBeenCalledTimes(1);
    const result = defaultProps.onComplete.mock.calls[0][0];
    expect(result.correct).toBe(true);
    expect(result.challengeId).toBe('test-challenge-1');
    expect(result.challengeType).toBe('math');
    expect(result.mistakeTypeTargeted).toBe('operation_weakness');
    expect(result.timedOut).toBe(false);
    expect(typeof result.timeToAnswer).toBe('number');
  });

  it('incorrect answer calls onComplete with correct: false', () => {
    render(<MicroMathDrill {...defaultProps} />);

    // Type "3" which is incorrect for 3 + 5 = 8
    const button3 = screen.getByRole('button', { name: '3' });
    fireEvent.click(button3);

    // Submit manually
    const submitButton = screen.getByLabelText('Submit answer');
    fireEvent.click(submitButton);

    expect(defaultProps.onComplete).toHaveBeenCalledTimes(1);
    const result = defaultProps.onComplete.mock.calls[0][0];
    expect(result.correct).toBe(false);
    expect(result.timedOut).toBe(false);
  });

  it('auto-submits after 2 digits typed', () => {
    render(<MicroMathDrill {...defaultProps} />);

    // Type two digits: "12"
    fireEvent.click(screen.getByRole('button', { name: '1' }));
    fireEvent.click(screen.getByRole('button', { name: '2' }));

    // Auto-submit happens after 200ms delay
    act(() => {
      vi.advanceTimersByTime(200);
    });

    expect(defaultProps.onComplete).toHaveBeenCalledTimes(1);
    const result = defaultProps.onComplete.mock.calls[0][0];
    expect(result.timedOut).toBe(false);
    expect(result.challengeType).toBe('math');
  });

  it('submit button calls onComplete', () => {
    render(<MicroMathDrill {...defaultProps} />);

    // Type a digit first
    fireEvent.click(screen.getByRole('button', { name: '5' }));

    // Click the submit button
    const submitButton = screen.getByLabelText('Submit answer');
    fireEvent.click(submitButton);

    expect(defaultProps.onComplete).toHaveBeenCalledTimes(1);
  });

  it('submit button is disabled when answer is empty', () => {
    render(<MicroMathDrill {...defaultProps} />);

    const submitButton = screen.getByLabelText('Submit answer');
    expect(submitButton).toBeDisabled();
  });

  // =========================================================================
  // Timeout Test
  // =========================================================================

  it('8-second timeout calls onComplete with timedOut: true', () => {
    render(<MicroMathDrill {...defaultProps} />);

    // Advance past the 8-second timeout
    act(() => {
      vi.advanceTimersByTime(8000);
    });

    expect(defaultProps.onComplete).toHaveBeenCalledTimes(1);
    const result = defaultProps.onComplete.mock.calls[0][0];
    expect(result.timedOut).toBe(true);
    expect(result.correct).toBe(false);
    expect(result.challengeId).toBe('test-challenge-1');
    expect(result.challengeType).toBe('math');
  });

  // =========================================================================
  // Keyboard Input Tests
  // =========================================================================

  it('keyboard digit input updates answer', () => {
    render(<MicroMathDrill {...defaultProps} />);

    fireEvent.keyDown(window, { key: '4' });

    expect(screen.getByLabelText('Your answer: 4')).toBeInTheDocument();
  });

  it('keyboard backspace removes digit', () => {
    render(<MicroMathDrill {...defaultProps} />);

    // Type a digit via keyboard
    fireEvent.keyDown(window, { key: '6' });
    expect(screen.getByLabelText('Your answer: 6')).toBeInTheDocument();

    // Press backspace via keyboard
    fireEvent.keyDown(window, { key: 'Backspace' });
    expect(screen.getByLabelText('Your answer: empty')).toBeInTheDocument();
  });

  it('keyboard Enter submits answer', () => {
    render(<MicroMathDrill {...defaultProps} />);

    // Type a digit first
    fireEvent.keyDown(window, { key: '8' });

    // Press Enter to submit
    fireEvent.keyDown(window, { key: 'Enter' });

    expect(defaultProps.onComplete).toHaveBeenCalledTimes(1);
    const result = defaultProps.onComplete.mock.calls[0][0];
    expect(result.correct).toBe(true);
    expect(result.timedOut).toBe(false);
  });

  // =========================================================================
  // Submission Guard Tests
  // =========================================================================

  it('cannot interact after submission (isSubmitting guard)', () => {
    render(<MicroMathDrill {...defaultProps} />);

    // Type and submit
    fireEvent.click(screen.getByRole('button', { name: '8' }));
    const submitButton = screen.getByLabelText('Submit answer');
    fireEvent.click(submitButton);

    expect(defaultProps.onComplete).toHaveBeenCalledTimes(1);

    // Try to interact again via keyboard -- should be blocked by isSubmitting
    fireEvent.keyDown(window, { key: '5' });
    fireEvent.keyDown(window, { key: 'Enter' });

    // onComplete should NOT be called again
    expect(defaultProps.onComplete).toHaveBeenCalledTimes(1);
  });

  // =========================================================================
  // Max Digits Test
  // =========================================================================

  it('digit buttons are disabled after reaching max digits (2)', () => {
    render(<MicroMathDrill {...defaultProps} />);

    // Type two digits
    fireEvent.click(screen.getByRole('button', { name: '1' }));
    fireEvent.click(screen.getByRole('button', { name: '2' }));

    // All digit buttons should be disabled since we have reached MATH_AUTO_SUBMIT_DIGITS
    const digitButton3 = screen.getByRole('button', { name: '3' });
    expect(digitButton3).toBeDisabled();

    const digitButton0 = screen.getByRole('button', { name: '0' });
    expect(digitButton0).toBeDisabled();
  });

  // =========================================================================
  // Auto-Submit Hint Text
  // =========================================================================

  it('shows auto-submit hint text', () => {
    render(<MicroMathDrill {...defaultProps} />);

    expect(screen.getByText(/Auto-submits after 2 digits/)).toBeInTheDocument();
  });

  // =========================================================================
  // Additional Edge Case Tests
  // =========================================================================

  it('keyboard Enter does not submit when answer is empty', () => {
    render(<MicroMathDrill {...defaultProps} />);

    // Press Enter with no input
    fireEvent.keyDown(window, { key: 'Enter' });

    expect(defaultProps.onComplete).not.toHaveBeenCalled();
  });

  it('renders all 12 keypad buttons (digits 0-9, backspace, submit)', () => {
    render(<MicroMathDrill {...defaultProps} />);

    // Check all digit buttons exist
    for (let i = 0; i <= 9; i++) {
      expect(screen.getByRole('button', { name: String(i) })).toBeInTheDocument();
    }

    // Backspace and submit buttons
    expect(screen.getByLabelText('Backspace')).toBeInTheDocument();
    expect(screen.getByLabelText('Submit answer')).toBeInTheDocument();
  });

  it('has correct aria-label on the application container', () => {
    render(<MicroMathDrill {...defaultProps} />);

    expect(screen.getByRole('application', { name: 'Math micro-challenge' })).toBeInTheDocument();
  });

  it('timeout does not fire if already submitted', () => {
    render(<MicroMathDrill {...defaultProps} />);

    // Submit manually before timeout
    fireEvent.click(screen.getByRole('button', { name: '8' }));
    fireEvent.click(screen.getByLabelText('Submit answer'));

    expect(defaultProps.onComplete).toHaveBeenCalledTimes(1);

    // Advance past timeout
    act(() => {
      vi.advanceTimersByTime(8000);
    });

    // Should still only have been called once
    expect(defaultProps.onComplete).toHaveBeenCalledTimes(1);
  });

  it('renders subtraction problems correctly', () => {
    const subtractionParams: MicroMathParams = {
      problem: '9 - 4',
      answer: 5,
      operation: 'subtraction',
    };

    render(
      <MicroMathDrill
        {...defaultProps}
        params={subtractionParams}
      />
    );

    expect(screen.getByText(/9 - 4/)).toBeInTheDocument();
    expect(screen.getByText('?')).toBeInTheDocument();
  });
});
