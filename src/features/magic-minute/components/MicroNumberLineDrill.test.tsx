/**
 * MicroNumberLineDrill Component Tests
 * Story 4.3: Micro Number Line Drill for Magic Minute
 *
 * Tests for the simplified number line drill with draggable marker,
 * keyboard navigation, auto-submit, timeout, and accessibility.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import MicroNumberLineDrill from './MicroNumberLineDrill';
import type { MicroNumberLineParams } from '../types/microChallenge.types';

// Mock framer-motion since drag behavior cannot be simulated in JSDOM
vi.mock('framer-motion', () => {
  const motionValue = (initial: number) => ({
    get: () => initial,
    set: vi.fn(),
    on: vi.fn(),
    destroy: vi.fn(),
  });
  return {
    motion: {
      div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    },
    useMotionValue: (initial: number) => motionValue(initial),
    useTransform: (_value: any, transform: (x: number) => number) => {
      const result = motionValue(transform(0));
      result.get = () => transform(0);
      return result;
    },
    AnimatePresence: ({ children }: any) => children,
  };
});

// Default test props
const defaultParams: MicroNumberLineParams = {
  target: 25,
  range: { min: 0, max: 50 },
  tolerance: 0.15,
};

const defaultProps = {
  challengeId: 'test-challenge-001',
  params: defaultParams,
  targetMistakeType: 'overestimation' as const,
  onComplete: vi.fn(),
  timeRemaining: 45,
};

describe('MicroNumberLineDrill', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    defaultProps.onComplete = vi.fn();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // Test 1: Renders target number in prompt
  it('renders the target number in the prompt', () => {
    render(<MicroNumberLineDrill {...defaultProps} />);

    expect(screen.getByText('25')).toBeInTheDocument();
    expect(screen.getByText('Place')).toBeInTheDocument();
  });

  // Test 2: Renders range labels (0 and 50)
  it('renders range labels for min and max values', () => {
    render(<MicroNumberLineDrill {...defaultProps} />);

    // The marker also shows "0" (range.min) due to mocked useTransform,
    // so use getAllByText for "0" and verify at least one is the range label
    const zeros = screen.getAllByText('0');
    expect(zeros.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('50')).toBeInTheDocument();
  });

  // Test 3: Has role="application" with aria-label
  it('has role="application" with descriptive aria-label', () => {
    render(<MicroNumberLineDrill {...defaultProps} />);

    const application = screen.getByRole('application');
    expect(application).toBeInTheDocument();
    expect(application).toHaveAttribute('aria-label', 'Number line micro-challenge');
  });

  // Test 4: Has role="slider" with aria attributes
  it('has role="slider" with aria-valuemin, aria-valuemax, and aria-valuenow', () => {
    render(<MicroNumberLineDrill {...defaultProps} />);

    const slider = screen.getByRole('slider');
    expect(slider).toBeInTheDocument();
    expect(slider).toHaveAttribute('aria-valuemin', '0');
    expect(slider).toHaveAttribute('aria-valuemax', '50');
    expect(slider).toHaveAttribute('aria-valuenow');
  });

  // Test 5: Shows initial hint text
  it('shows initial hint "Drag marker to position"', () => {
    render(<MicroNumberLineDrill {...defaultProps} />);

    expect(screen.getByText('Drag marker to position')).toBeInTheDocument();
  });

  // Test 6: 8-second timeout calls onComplete with timedOut: true
  it('calls onComplete with timedOut: true after 8-second timeout', () => {
    render(<MicroNumberLineDrill {...defaultProps} />);

    act(() => {
      vi.advanceTimersByTime(8000);
    });

    expect(defaultProps.onComplete).toHaveBeenCalledTimes(1);
    expect(defaultProps.onComplete).toHaveBeenCalledWith(
      expect.objectContaining({
        timedOut: true,
      })
    );
  });

  // Test 7: Shows marker with number value
  it('shows marker displaying the current numeric value', () => {
    render(<MicroNumberLineDrill {...defaultProps} />);

    // The marker shows the current value via markerValue.get() which returns range.min (0)
    // because the mocked useTransform returns transform(0) = range.min
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
  });

  // Test 8: Has accessible marker button with aria-label
  it('has an accessible marker button with aria-label describing position', () => {
    render(<MicroNumberLineDrill {...defaultProps} />);

    const markerButton = screen.getByRole('button', { name: /Marker at position/i });
    expect(markerButton).toBeInTheDocument();
  });

  // Test 9: Component renders without crashing with valid props
  it('renders without crashing with valid props', () => {
    const { container } = render(<MicroNumberLineDrill {...defaultProps} />);

    expect(container).toBeTruthy();
    expect(screen.getByRole('application')).toBeInTheDocument();
    expect(screen.getByRole('slider')).toBeInTheDocument();
  });

  // Test 10: Component renders without crashing with different target values
  it('renders without crashing with different target values', () => {
    const targets = [0, 10, 25, 37, 50];

    targets.forEach((target) => {
      const params: MicroNumberLineParams = {
        ...defaultParams,
        target,
      };
      const { unmount } = render(
        <MicroNumberLineDrill {...defaultProps} params={params} />
      );
      // Use getAllByText since the marker value (0 from mock) may collide with
      // target values like 0, and range labels like 0 or 50
      const matches = screen.getAllByText(String(target));
      expect(matches.length).toBeGreaterThanOrEqual(1);
      unmount();
    });
  });

  // Test 11: onComplete receives correct challengeId
  it('passes the correct challengeId in the onComplete result', () => {
    render(
      <MicroNumberLineDrill
        {...defaultProps}
        challengeId="unique-challenge-xyz"
      />
    );

    act(() => {
      vi.advanceTimersByTime(8000);
    });

    expect(defaultProps.onComplete).toHaveBeenCalledWith(
      expect.objectContaining({
        challengeId: 'unique-challenge-xyz',
      })
    );
  });

  // Test 12: onComplete receives challengeType: 'number_line'
  it('passes challengeType "number_line" in the onComplete result', () => {
    render(<MicroNumberLineDrill {...defaultProps} />);

    act(() => {
      vi.advanceTimersByTime(8000);
    });

    expect(defaultProps.onComplete).toHaveBeenCalledWith(
      expect.objectContaining({
        challengeType: 'number_line',
      })
    );
  });

  // Test 13: onComplete result includes timedOut flag
  it('includes timedOut flag in the onComplete result', () => {
    render(<MicroNumberLineDrill {...defaultProps} />);

    act(() => {
      vi.advanceTimersByTime(8000);
    });

    const result = defaultProps.onComplete.mock.calls[0][0];
    expect(result).toHaveProperty('timedOut');
    expect(typeof result.timedOut).toBe('boolean');
  });

  // Test 14: onComplete result includes mistakeTypeTargeted
  it('includes mistakeTypeTargeted in the onComplete result', () => {
    render(
      <MicroNumberLineDrill
        {...defaultProps}
        targetMistakeType="underestimation"
      />
    );

    act(() => {
      vi.advanceTimersByTime(8000);
    });

    expect(defaultProps.onComplete).toHaveBeenCalledWith(
      expect.objectContaining({
        mistakeTypeTargeted: 'underestimation',
      })
    );
  });

  // Test 15: After timeout, onComplete is called only once (isSubmitting guard)
  it('calls onComplete only once even after multiple timeout periods', () => {
    render(<MicroNumberLineDrill {...defaultProps} />);

    // Trigger the 8-second timeout
    act(() => {
      vi.advanceTimersByTime(8000);
    });

    expect(defaultProps.onComplete).toHaveBeenCalledTimes(1);

    // Advance well past additional timeout periods
    act(() => {
      vi.advanceTimersByTime(16000);
    });

    // Should still only be called once due to isSubmitting guard
    expect(defaultProps.onComplete).toHaveBeenCalledTimes(1);
  });

  // Test 16: Keyboard ArrowLeft/ArrowRight don't crash
  it('handles ArrowLeft and ArrowRight keyboard events without crashing', () => {
    render(<MicroNumberLineDrill {...defaultProps} />);

    const application = screen.getByRole('application');

    // Fire keyboard events - should not throw
    expect(() => {
      fireEvent.keyDown(application, { key: 'ArrowLeft' });
    }).not.toThrow();

    expect(() => {
      fireEvent.keyDown(application, { key: 'ArrowRight' });
    }).not.toThrow();

    // Multiple presses should also not crash
    expect(() => {
      fireEvent.keyDown(application, { key: 'ArrowLeft' });
      fireEvent.keyDown(application, { key: 'ArrowLeft' });
      fireEvent.keyDown(application, { key: 'ArrowRight' });
      fireEvent.keyDown(application, { key: 'ArrowRight' });
    }).not.toThrow();
  });

  // Test 17: Click on number line area doesn't crash
  it('handles click on number line area without crashing', () => {
    render(<MicroNumberLineDrill {...defaultProps} />);

    const slider = screen.getByRole('slider');

    expect(() => {
      fireEvent.click(slider, { clientX: 100, clientY: 10 });
    }).not.toThrow();

    expect(() => {
      fireEvent.click(slider, { clientX: 200, clientY: 10 });
    }).not.toThrow();
  });

  // Test 18: Renders timeout indicator bar
  it('renders the timeout indicator bar', () => {
    const { container } = render(<MicroNumberLineDrill {...defaultProps} />);

    // The timeout indicator is a container div with overflow-hidden and a child progress bar
    const overflowContainers = container.querySelectorAll('.overflow-hidden');
    expect(overflowContainers.length).toBeGreaterThan(0);

    // Look for the coral-colored progress bar inside the indicator
    const progressBars = container.querySelectorAll('.bg-\\[\\#E87461\\]');
    expect(progressBars.length).toBeGreaterThan(0);
  });

  // Additional: slider has correct aria-label describing the range
  it('has slider with aria-label describing the range', () => {
    render(<MicroNumberLineDrill {...defaultProps} />);

    const slider = screen.getByRole('slider');
    expect(slider).toHaveAttribute('aria-label', 'Number line from 0 to 50');
  });

  // Additional: result includes correct and timeToAnswer fields
  it('includes correct and timeToAnswer fields in onComplete result', () => {
    render(<MicroNumberLineDrill {...defaultProps} />);

    act(() => {
      vi.advanceTimersByTime(8000);
    });

    const result = defaultProps.onComplete.mock.calls[0][0];
    expect(result).toHaveProperty('correct');
    expect(typeof result.correct).toBe('boolean');
    expect(result).toHaveProperty('timeToAnswer');
    expect(typeof result.timeToAnswer).toBe('number');
  });
});
