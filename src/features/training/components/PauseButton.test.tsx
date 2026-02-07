/**
 * PauseButton Component Tests
 * Story 3.5: Build Drill Session UI Components
 *
 * Test Coverage:
 * - AC: Pause button renders with 44px tap target
 * - AC: Pause modal opens with Resume and End Session buttons
 * - AC: Modal shows current progress "X of Y drills complete"
 * - AC: End Session requires two-step confirmation
 * - AC: Resume closes modal and calls onResume
 * - AC: End Session calls onEndSession
 * - AC: Accessibility (aria-label, button roles)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PauseButton from './PauseButton';

describe('PauseButton', () => {
  const mockOnResume = vi.fn();
  const mockOnEndSession = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Pause Button Rendering', () => {
    it('renders pause button', () => {
      render(
        <PauseButton
          currentDrill={3}
          totalDrills={6}
          onResume={mockOnResume}
          onEndSession={mockOnEndSession}
        />
      );

      const pauseButton = screen.getByTestId('pause-button');
      expect(pauseButton).toBeInTheDocument();
    });

    it('pause button has 44px minimum tap target', () => {
      render(
        <PauseButton
          currentDrill={3}
          totalDrills={6}
          onResume={mockOnResume}
          onEndSession={mockOnEndSession}
        />
      );

      const pauseButton = screen.getByTestId('pause-button');
      expect(pauseButton).toHaveClass('min-w-[44px]', 'min-h-[44px]');
    });

    it('pause button has correct aria-label', () => {
      render(
        <PauseButton
          currentDrill={3}
          totalDrills={6}
          onResume={mockOnResume}
          onEndSession={mockOnEndSession}
        />
      );

      const pauseButton = screen.getByLabelText('Pause session');
      expect(pauseButton).toBeInTheDocument();
    });

    it('modal is not visible initially', () => {
      render(
        <PauseButton
          currentDrill={3}
          totalDrills={6}
          onResume={mockOnResume}
          onEndSession={mockOnEndSession}
        />
      );

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  describe('Pause Modal', () => {
    it('opens modal when pause button is clicked', async () => {
      const user = userEvent.setup();

      render(
        <PauseButton
          currentDrill={3}
          totalDrills={6}
          onResume={mockOnResume}
          onEndSession={mockOnEndSession}
        />
      );

      const pauseButton = screen.getByTestId('pause-button');
      await user.click(pauseButton);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
    });

    it('shows "Session Paused" title', async () => {
      const user = userEvent.setup();

      render(
        <PauseButton
          currentDrill={3}
          totalDrills={6}
          onResume={mockOnResume}
          onEndSession={mockOnEndSession}
        />
      );

      await user.click(screen.getByTestId('pause-button'));

      await waitFor(() => {
        expect(screen.getByText('Session Paused')).toBeInTheDocument();
      });
    });

    it('shows progress "X of Y drills complete"', async () => {
      const user = userEvent.setup();

      render(
        <PauseButton
          currentDrill={3}
          totalDrills={6}
          onResume={mockOnResume}
          onEndSession={mockOnEndSession}
        />
      );

      await user.click(screen.getByTestId('pause-button'));

      await waitFor(() => {
        expect(screen.getByText('3 of 6 drills complete')).toBeInTheDocument();
      });
    });

    it('shows Resume button', async () => {
      const user = userEvent.setup();

      render(
        <PauseButton
          currentDrill={3}
          totalDrills={6}
          onResume={mockOnResume}
          onEndSession={mockOnEndSession}
        />
      );

      await user.click(screen.getByTestId('pause-button'));

      await waitFor(() => {
        expect(screen.getByTestId('resume-button')).toBeInTheDocument();
      });
    });

    it('shows End Session Early button', async () => {
      const user = userEvent.setup();

      render(
        <PauseButton
          currentDrill={3}
          totalDrills={6}
          onResume={mockOnResume}
          onEndSession={mockOnEndSession}
        />
      );

      await user.click(screen.getByTestId('pause-button'));

      await waitFor(() => {
        expect(screen.getByTestId('end-session-button')).toBeInTheDocument();
      });
    });
  });

  describe('Resume Functionality', () => {
    it('calls onResume when Resume button clicked', async () => {
      const user = userEvent.setup();

      render(
        <PauseButton
          currentDrill={3}
          totalDrills={6}
          onResume={mockOnResume}
          onEndSession={mockOnEndSession}
        />
      );

      await user.click(screen.getByTestId('pause-button'));

      await waitFor(() => {
        expect(screen.getByTestId('resume-button')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('resume-button'));

      expect(mockOnResume).toHaveBeenCalledTimes(1);
    });

    it('closes modal after Resume is clicked', async () => {
      const user = userEvent.setup();

      render(
        <PauseButton
          currentDrill={3}
          totalDrills={6}
          onResume={mockOnResume}
          onEndSession={mockOnEndSession}
        />
      );

      await user.click(screen.getByTestId('pause-button'));
      await waitFor(() => screen.getByTestId('resume-button'));
      await user.click(screen.getByTestId('resume-button'));

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
    });
  });

  describe('End Session Early - Two-Step Confirmation', () => {
    it('shows confirmation dialog when End Session Early is clicked', async () => {
      const user = userEvent.setup();

      render(
        <PauseButton
          currentDrill={3}
          totalDrills={6}
          onResume={mockOnResume}
          onEndSession={mockOnEndSession}
        />
      );

      await user.click(screen.getByTestId('pause-button'));
      await waitFor(() => screen.getByTestId('end-session-button'));
      await user.click(screen.getByTestId('end-session-button'));

      await waitFor(() => {
        expect(screen.getByText('End Session Early?')).toBeInTheDocument();
      });
    });

    it('shows warning message in confirmation dialog', async () => {
      const user = userEvent.setup();

      render(
        <PauseButton
          currentDrill={3}
          totalDrills={6}
          onResume={mockOnResume}
          onEndSession={mockOnEndSession}
        />
      );

      await user.click(screen.getByTestId('pause-button'));
      await waitFor(() => screen.getByTestId('end-session-button'));
      await user.click(screen.getByTestId('end-session-button'));

      await waitFor(() => {
        expect(
          screen.getByText(/Are you sure you want to end this session early/)
        ).toBeInTheDocument();
      });
    });

    it('shows "Yes, End Session" confirmation button', async () => {
      const user = userEvent.setup();

      render(
        <PauseButton
          currentDrill={3}
          totalDrills={6}
          onResume={mockOnResume}
          onEndSession={mockOnEndSession}
        />
      );

      await user.click(screen.getByTestId('pause-button'));
      await waitFor(() => screen.getByTestId('end-session-button'));
      await user.click(screen.getByTestId('end-session-button'));

      await waitFor(() => {
        expect(screen.getByTestId('confirm-end-session')).toBeInTheDocument();
      });
    });

    it('shows Cancel button in confirmation dialog', async () => {
      const user = userEvent.setup();

      render(
        <PauseButton
          currentDrill={3}
          totalDrills={6}
          onResume={mockOnResume}
          onEndSession={mockOnEndSession}
        />
      );

      await user.click(screen.getByTestId('pause-button'));
      await waitFor(() => screen.getByTestId('end-session-button'));
      await user.click(screen.getByTestId('end-session-button'));

      await waitFor(() => {
        expect(screen.getByTestId('cancel-end-session')).toBeInTheDocument();
      });
    });

    it('calls onEndSession when confirmed', async () => {
      const user = userEvent.setup();

      render(
        <PauseButton
          currentDrill={3}
          totalDrills={6}
          onResume={mockOnResume}
          onEndSession={mockOnEndSession}
        />
      );

      await user.click(screen.getByTestId('pause-button'));
      await waitFor(() => screen.getByTestId('end-session-button'));
      await user.click(screen.getByTestId('end-session-button'));
      await waitFor(() => screen.getByTestId('confirm-end-session'));
      await user.click(screen.getByTestId('confirm-end-session'));

      expect(mockOnEndSession).toHaveBeenCalledTimes(1);
    });

    it('closes modal after end session is confirmed', async () => {
      const user = userEvent.setup();

      render(
        <PauseButton
          currentDrill={3}
          totalDrills={6}
          onResume={mockOnResume}
          onEndSession={mockOnEndSession}
        />
      );

      await user.click(screen.getByTestId('pause-button'));
      await waitFor(() => screen.getByTestId('end-session-button'));
      await user.click(screen.getByTestId('end-session-button'));
      await waitFor(() => screen.getByTestId('confirm-end-session'));
      await user.click(screen.getByTestId('confirm-end-session'));

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
    });

    it('returns to pause modal when Cancel is clicked', async () => {
      const user = userEvent.setup();

      render(
        <PauseButton
          currentDrill={3}
          totalDrills={6}
          onResume={mockOnResume}
          onEndSession={mockOnEndSession}
        />
      );

      await user.click(screen.getByTestId('pause-button'));
      await waitFor(() => screen.getByTestId('end-session-button'));
      await user.click(screen.getByTestId('end-session-button'));
      await waitFor(() => screen.getByTestId('cancel-end-session'));
      await user.click(screen.getByTestId('cancel-end-session'));

      await waitFor(() => {
        expect(screen.getByText('Session Paused')).toBeInTheDocument();
        expect(screen.queryByText('End Session Early?')).not.toBeInTheDocument();
      });
    });

    it('does not call onEndSession when cancelled', async () => {
      const user = userEvent.setup();

      render(
        <PauseButton
          currentDrill={3}
          totalDrills={6}
          onResume={mockOnResume}
          onEndSession={mockOnEndSession}
        />
      );

      await user.click(screen.getByTestId('pause-button'));
      await waitFor(() => screen.getByTestId('end-session-button'));
      await user.click(screen.getByTestId('end-session-button'));
      await waitFor(() => screen.getByTestId('cancel-end-session'));
      await user.click(screen.getByTestId('cancel-end-session'));

      expect(mockOnEndSession).not.toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('handles first drill correctly', async () => {
      const user = userEvent.setup();

      render(
        <PauseButton
          currentDrill={1}
          totalDrills={6}
          onResume={mockOnResume}
          onEndSession={mockOnEndSession}
        />
      );

      await user.click(screen.getByTestId('pause-button'));

      await waitFor(() => {
        expect(screen.getByText('1 of 6 drills complete')).toBeInTheDocument();
      });
    });

    it('handles last drill correctly', async () => {
      const user = userEvent.setup();

      render(
        <PauseButton
          currentDrill={6}
          totalDrills={6}
          onResume={mockOnResume}
          onEndSession={mockOnEndSession}
        />
      );

      await user.click(screen.getByTestId('pause-button'));

      await waitFor(() => {
        expect(screen.getByText('6 of 6 drills complete')).toBeInTheDocument();
      });
    });
  });
});
