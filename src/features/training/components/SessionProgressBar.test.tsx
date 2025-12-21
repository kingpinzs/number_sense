/**
 * SessionProgressBar Component Tests
 * Story 3.5: Build Drill Session UI Components
 *
 * Test Coverage:
 * - AC: Renders "Drill X of Y" text correctly
 * - AC: Shows progress bar with correct percentage
 * - AC: Converts 0-based index to 1-based display
 * - AC: Handles edge cases (0 drills, 100% completion)
 * - AC: Accessibility (ARIA labels)
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import SessionProgressBar from './SessionProgressBar';

describe('SessionProgressBar', () => {
  it('renders drill count text with 1-based indexing', () => {
    render(<SessionProgressBar currentIndex={0} totalDrills={6} />);

    expect(screen.getByText('Drill 1 of 6')).toBeInTheDocument();
  });

  it('renders correct drill count at middle of session', () => {
    render(<SessionProgressBar currentIndex={3} totalDrills={6} />);

    expect(screen.getByText('Drill 4 of 6')).toBeInTheDocument();
  });

  it('renders correct drill count at end of session', () => {
    render(<SessionProgressBar currentIndex={5} totalDrills={6} />);

    expect(screen.getByText('Drill 6 of 6')).toBeInTheDocument();
  });

  it('calculates progress percentage correctly at start', () => {
    const { container } = render(<SessionProgressBar currentIndex={0} totalDrills={6} />);

    // First drill (1/6) = ~17%
    const progressBar = container.querySelector('[role="progressbar"]');
    expect(progressBar).toHaveAttribute('aria-valuenow', '16.666666666666664');
  });

  it('calculates progress percentage correctly at middle', () => {
    const { container } = render(<SessionProgressBar currentIndex={2} totalDrills={6} />);

    // Third drill (3/6) = 50%
    const progressBar = container.querySelector('[role="progressbar"]');
    expect(progressBar).toHaveAttribute('aria-valuenow', '50');
  });

  it('calculates progress percentage correctly at end', () => {
    const { container } = render(<SessionProgressBar currentIndex={5} totalDrills={6} />);

    // Last drill (6/6) = 100%
    const progressBar = container.querySelector('[role="progressbar"]');
    expect(progressBar).toHaveAttribute('aria-valuenow', '100');
  });

  it('handles edge case of 0 total drills', () => {
    const { container } = render(<SessionProgressBar currentIndex={0} totalDrills={0} />);

    expect(screen.getByText('Drill 1 of 0')).toBeInTheDocument();

    const progressBar = container.querySelector('[role="progressbar"]');
    expect(progressBar).toHaveAttribute('aria-valuenow', '0');
  });

  it('has correct accessibility attributes', () => {
    const { container } = render(<SessionProgressBar currentIndex={2} totalDrills={6} />);

    // Check region role
    const region = screen.getByRole('region', { name: 'Training session progress' });
    expect(region).toBeInTheDocument();

    // Check progressbar attributes
    const progressBar = container.querySelector('[role="progressbar"]');
    expect(progressBar).toHaveAttribute('aria-valuemin', '0');
    expect(progressBar).toHaveAttribute('aria-valuemax', '100');
    expect(progressBar).toHaveAttribute('aria-label', '50% complete');
  });

  it('has correct test id for integration tests', () => {
    render(<SessionProgressBar currentIndex={0} totalDrills={6} />);

    expect(screen.getByTestId('session-progress-bar')).toBeInTheDocument();
  });

  it('applies correct CSS classes', () => {
    const { container } = render(<SessionProgressBar currentIndex={0} totalDrills={6} />);

    const wrapper = screen.getByTestId('session-progress-bar');
    expect(wrapper).toHaveClass('w-full', 'space-y-2');
  });
});
