/**
 * MagicMinuteTimer Component Tests
 * Story 4.2: Build Magic Minute Timer Component
 *
 * Tests for the 60-second countdown timer with visual feedback,
 * accessibility, and completion callback.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import MagicMinuteTimer from './MagicMinuteTimer';
import type { MistakePattern } from '@/services/adaptiveDifficulty/mistakeAnalyzer';

// Mock mistake patterns for testing
const mockMistakePatterns: MistakePattern[] = [
  {
    patternType: 'overestimation',
    occurrences: 3,
    recentDrills: 5,
    confidence: 0.6,
    detectedAt: Date.now(),
  },
];

describe('MagicMinuteTimer', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // Task 1.1: Component renders
  it('renders the timer component', () => {
    const onComplete = vi.fn();
    render(
      <MagicMinuteTimer
        mistakePatterns={mockMistakePatterns}
        sessionId={1}
        onComplete={onComplete}
      />
    );

    expect(screen.getByRole('timer')).toBeInTheDocument();
  });

  // Task 1.2: Timer starts at 60 seconds
  it('displays initial countdown of 60 seconds', () => {
    const onComplete = vi.fn();
    render(
      <MagicMinuteTimer
        mistakePatterns={mockMistakePatterns}
        sessionId={1}
        onComplete={onComplete}
      />
    );

    expect(screen.getByText('60')).toBeInTheDocument();
  });

  // Task 1.2: Timer decrements every second
  it('decrements timer every second', async () => {
    const onComplete = vi.fn();
    render(
      <MagicMinuteTimer
        mistakePatterns={mockMistakePatterns}
        sessionId={1}
        onComplete={onComplete}
      />
    );

    expect(screen.getByText('60')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(screen.getByText('59')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(screen.getByText('58')).toBeInTheDocument();
  });

  // Task 1.3: Full-screen overlay renders
  it('renders full-screen overlay with dim background', () => {
    const onComplete = vi.fn();
    render(
      <MagicMinuteTimer
        mistakePatterns={mockMistakePatterns}
        sessionId={1}
        onComplete={onComplete}
      />
    );

    const overlay = screen.getByTestId('magic-minute-overlay');
    expect(overlay).toBeInTheDocument();
    expect(overlay).toHaveClass('fixed', 'inset-0');
  });

  // Task 1.4: Coral color countdown text
  it('displays countdown in coral color (#E87461)', () => {
    const onComplete = vi.fn();
    render(
      <MagicMinuteTimer
        mistakePatterns={mockMistakePatterns}
        sessionId={1}
        onComplete={onComplete}
      />
    );

    const countdown = screen.getByTestId('countdown-display');
    expect(countdown).toHaveStyle({ color: '#E87461' });
  });

  // Task 1.5: Correct counter displays
  it('displays correct counter starting at 0', () => {
    const onComplete = vi.fn();
    render(
      <MagicMinuteTimer
        mistakePatterns={mockMistakePatterns}
        sessionId={1}
        onComplete={onComplete}
      />
    );

    // Text is split across elements: <span>0</span> correct
    // Use a function matcher to find text content
    expect(
      screen.getByText((_content, element) => {
        return element?.textContent === '0 correct';
      })
    ).toBeInTheDocument();
  });

  // Timer calls onComplete at 0
  it('calls onComplete when timer reaches 0', () => {
    const onComplete = vi.fn();
    render(
      <MagicMinuteTimer
        mistakePatterns={mockMistakePatterns}
        sessionId={1}
        onComplete={onComplete}
      />
    );

    // Advance timer to 0
    act(() => {
      vi.advanceTimersByTime(60000);
    });

    // onComplete is called after a setTimeout delay for celebration animation
    // Advance timers to trigger the delayed callback
    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onComplete).toHaveBeenCalledWith(
      expect.objectContaining({
        duration: expect.any(Number),
        successRate: expect.any(Number),
      })
    );
  });

  // Task 1.6: Cleanup clears interval
  it('clears interval on unmount', () => {
    const clearIntervalSpy = vi.spyOn(global, 'clearInterval');
    const onComplete = vi.fn();

    const { unmount } = render(
      <MagicMinuteTimer
        mistakePatterns={mockMistakePatterns}
        sessionId={1}
        onComplete={onComplete}
      />
    );

    unmount();

    expect(clearIntervalSpy).toHaveBeenCalled();
    clearIntervalSpy.mockRestore();
  });

  // Title displays correctly
  it('displays Magic Minute title', () => {
    const onComplete = vi.fn();
    render(
      <MagicMinuteTimer
        mistakePatterns={mockMistakePatterns}
        sessionId={1}
        onComplete={onComplete}
      />
    );

    expect(screen.getByText(/Magic Minute/i)).toBeInTheDocument();
  });

  // Instruction text displays (only visible when no challenge is active)
  it('displays instruction text about challenges', () => {
    const onComplete = vi.fn();
    render(
      <MagicMinuteTimer
        mistakePatterns={mockMistakePatterns}
        sessionId={1}
        onComplete={onComplete}
        enableChallenges={false}
      />
    );

    expect(screen.getByText(/Quick challenges based on your recent mistakes/i)).toBeInTheDocument();
  });

  // Accessibility: role="timer"
  it('has role="timer" for accessibility', () => {
    const onComplete = vi.fn();
    render(
      <MagicMinuteTimer
        mistakePatterns={mockMistakePatterns}
        sessionId={1}
        onComplete={onComplete}
      />
    );

    expect(screen.getByRole('timer')).toBeInTheDocument();
  });

  // Accessibility: aria-live for countdown
  it('has aria-live="polite" for screen reader updates', () => {
    const onComplete = vi.fn();
    render(
      <MagicMinuteTimer
        mistakePatterns={mockMistakePatterns}
        sessionId={1}
        onComplete={onComplete}
      />
    );

    const timer = screen.getByRole('timer');
    expect(timer).toHaveAttribute('aria-live', 'polite');
  });

  // Focus trap: overlay should be focusable
  it('has focusable overlay container for focus trap', () => {
    const onComplete = vi.fn();
    render(
      <MagicMinuteTimer
        mistakePatterns={mockMistakePatterns}
        sessionId={1}
        onComplete={onComplete}
      />
    );

    const overlay = screen.getByTestId('magic-minute-overlay');
    expect(overlay).toHaveAttribute('tabindex', '-1');
  });

  // Reduced motion: component respects prefers-reduced-motion
  it('renders without animations when reduced motion is preferred', () => {
    // Mock window.matchMedia to return true for reduced motion
    const originalMatchMedia = window.matchMedia;
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: query === '(prefers-reduced-motion: reduce)',
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    const onComplete = vi.fn();
    render(
      <MagicMinuteTimer
        mistakePatterns={mockMistakePatterns}
        sessionId={1}
        onComplete={onComplete}
      />
    );

    // Component should render (without crashing due to animation logic)
    expect(screen.getByRole('timer')).toBeInTheDocument();

    // Restore original matchMedia
    window.matchMedia = originalMatchMedia;
  });

  // onChallengeComplete callback
  it('accepts optional onChallengeComplete callback prop', () => {
    const onComplete = vi.fn();
    const onChallengeComplete = vi.fn();

    // Should render without error when callback is provided
    render(
      <MagicMinuteTimer
        mistakePatterns={mockMistakePatterns}
        sessionId={1}
        onComplete={onComplete}
        onChallengeComplete={onChallengeComplete}
      />
    );

    expect(screen.getByRole('timer')).toBeInTheDocument();
  });

  // Timer displays aria-label for screen readers
  it('displays aria-label with remaining seconds', () => {
    const onComplete = vi.fn();
    render(
      <MagicMinuteTimer
        mistakePatterns={mockMistakePatterns}
        sessionId={1}
        onComplete={onComplete}
      />
    );

    const timer = screen.getByRole('timer');
    expect(timer).toHaveAttribute('aria-label', '60 seconds remaining');
  });
});
