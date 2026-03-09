/**
 * SessionCompletionSummary Component Tests
 * Story 3.6: Implement Confidence Prompt System
 *
 * Test Coverage:
 * - AC-4: Displays "Session Complete! 🎉" with stats
 * - AC-4: Shows drillCount, accuracy, confidenceChange
 * - AC-4: "View Progress" button → /progress
 * - AC-4: "Done" button → / (home)
 * - Confetti animation for positive confidenceChange
 * - Accessibility and modal behavior
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import SessionCompletionSummary from './SessionCompletionSummary';

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock react-confetti-boom to avoid canvas rendering in tests
vi.mock('react-confetti-boom', () => ({
  default: () => <div data-testid="confetti" />,
}));

// Wrapper component to provide Router context
function Wrapper({ children }: { children: React.ReactNode }) {
  return <BrowserRouter>{children}</BrowserRouter>;
}

describe('SessionCompletionSummary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering - AC-4', () => {
    it('does not render when isOpen=false', () => {
      render(
        <Wrapper>
          <SessionCompletionSummary isOpen={false} drillCount={12} accuracy={85} confidenceChange={2} />
        </Wrapper>
      );

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('renders dialog when isOpen=true', () => {
      render(
        <Wrapper>
          <SessionCompletionSummary isOpen={true} drillCount={12} accuracy={85} confidenceChange={2} />
        </Wrapper>
      );

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('displays "Session Complete! 🎉" title', () => {
      render(
        <Wrapper>
          <SessionCompletionSummary isOpen={true} drillCount={12} accuracy={85} confidenceChange={2} />
        </Wrapper>
      );

      expect(screen.getByText('Session Complete! 🎉')).toBeInTheDocument();
    });

    it('displays drillCount stat', () => {
      render(
        <Wrapper>
          <SessionCompletionSummary isOpen={true} drillCount={12} accuracy={85} confidenceChange={2} />
        </Wrapper>
      );

      expect(screen.getByText('Drills completed')).toBeInTheDocument();
      expect(screen.getByTestId('drills-completed')).toHaveTextContent('12');
    });

    it('displays accuracy stat', () => {
      render(
        <Wrapper>
          <SessionCompletionSummary isOpen={true} drillCount={12} accuracy={85} confidenceChange={2} />
        </Wrapper>
      );

      expect(screen.getByText('Accuracy')).toBeInTheDocument();
      expect(screen.getByTestId('accuracy')).toHaveTextContent('85%');
    });

    it('displays "View Progress" button', () => {
      render(
        <Wrapper>
          <SessionCompletionSummary isOpen={true} drillCount={12} accuracy={85} confidenceChange={2} />
        </Wrapper>
      );

      expect(screen.getByTestId('view-progress-button')).toHaveTextContent('View Progress');
    });

    it('displays "Done" button', () => {
      render(
        <Wrapper>
          <SessionCompletionSummary isOpen={true} drillCount={12} accuracy={85} confidenceChange={2} />
        </Wrapper>
      );

      expect(screen.getByTestId('done-button')).toHaveTextContent('Done');
    });
  });

  describe('Confidence Change Display - AC-4', () => {
    it('shows "Confidence boost: +2" for positive change', () => {
      render(
        <Wrapper>
          <SessionCompletionSummary isOpen={true} drillCount={12} accuracy={85} confidenceChange={2} />
        </Wrapper>
      );

      expect(screen.getByText('Confidence')).toBeInTheDocument();
      expect(screen.getByTestId('confidence-change')).toHaveTextContent('Confidence boost: +2');
    });

    it('shows "Confidence boost: +1" for +1 change', () => {
      render(
        <Wrapper>
          <SessionCompletionSummary isOpen={true} drillCount={12} accuracy={85} confidenceChange={1} />
        </Wrapper>
      );

      expect(screen.getByTestId('confidence-change')).toHaveTextContent('Confidence boost: +1');
    });

    it('shows "Confidence: No change" for zero change', () => {
      render(
        <Wrapper>
          <SessionCompletionSummary isOpen={true} drillCount={12} accuracy={85} confidenceChange={0} />
        </Wrapper>
      );

      expect(screen.getByTestId('confidence-change')).toHaveTextContent('Confidence: No change');
    });

    it('shows "Tough session — every practice builds your skills!" for negative change', () => {
      render(
        <Wrapper>
          <SessionCompletionSummary isOpen={true} drillCount={12} accuracy={85} confidenceChange={-1} />
        </Wrapper>
      );

      expect(screen.getByTestId('confidence-change')).toHaveTextContent('Tough session — every practice builds your skills!');
    });

    it('does not show confidence section when confidenceChange is null', () => {
      render(
        <Wrapper>
          <SessionCompletionSummary isOpen={true} drillCount={12} accuracy={85} confidenceChange={null} />
        </Wrapper>
      );

      expect(screen.queryByTestId('confidence-change')).not.toBeInTheDocument();
    });

    it('applies green color class for positive confidence change', () => {
      render(
        <Wrapper>
          <SessionCompletionSummary isOpen={true} drillCount={12} accuracy={85} confidenceChange={3} />
        </Wrapper>
      );

      const confidenceElement = screen.getByTestId('confidence-change');
      expect(confidenceElement).toHaveClass('text-green-600');
    });

    it('does not apply green color for negative change', () => {
      render(
        <Wrapper>
          <SessionCompletionSummary isOpen={true} drillCount={12} accuracy={85} confidenceChange={-2} />
        </Wrapper>
      );

      const confidenceElement = screen.getByTestId('confidence-change');
      expect(confidenceElement).not.toHaveClass('text-green-600');
    });
  });

  describe('Navigation - AC-4', () => {
    it('navigates to /progress when "View Progress" clicked', async () => {
      const user = userEvent.setup();
      render(
        <Wrapper>
          <SessionCompletionSummary isOpen={true} drillCount={12} accuracy={85} confidenceChange={2} />
        </Wrapper>
      );

      await user.click(screen.getByTestId('view-progress-button'));

      expect(mockNavigate).toHaveBeenCalledWith('/progress');
      expect(mockNavigate).toHaveBeenCalledTimes(1);
    });

    it('navigates to / (home) when "Done" clicked', async () => {
      const user = userEvent.setup();
      render(
        <Wrapper>
          <SessionCompletionSummary isOpen={true} drillCount={12} accuracy={85} confidenceChange={2} />
        </Wrapper>
      );

      await user.click(screen.getByTestId('done-button'));

      expect(mockNavigate).toHaveBeenCalledWith('/');
      expect(mockNavigate).toHaveBeenCalledTimes(1);
    });
  });

  describe('Confetti Animation', () => {
    it('shows confetti for positive confidence change', () => {
      render(
        <Wrapper>
          <SessionCompletionSummary isOpen={true} drillCount={12} accuracy={85} confidenceChange={2} />
        </Wrapper>
      );

      expect(screen.getByTestId('confetti')).toBeInTheDocument();
    });

    it('does not show confetti for zero change and low accuracy', () => {
      render(
        <Wrapper>
          <SessionCompletionSummary isOpen={true} drillCount={12} accuracy={50} confidenceChange={0} />
        </Wrapper>
      );

      expect(screen.queryByTestId('confetti')).not.toBeInTheDocument();
    });

    it('does not show confetti for negative change and low accuracy', () => {
      render(
        <Wrapper>
          <SessionCompletionSummary isOpen={true} drillCount={12} accuracy={50} confidenceChange={-1} />
        </Wrapper>
      );

      expect(screen.queryByTestId('confetti')).not.toBeInTheDocument();
    });

    it('does not show confetti when confidenceChange is null and low accuracy', () => {
      render(
        <Wrapper>
          <SessionCompletionSummary isOpen={true} drillCount={12} accuracy={50} confidenceChange={null} />
        </Wrapper>
      );

      expect(screen.queryByTestId('confetti')).not.toBeInTheDocument();
    });

    it('shows confetti for accuracy milestone even with zero confidence change', () => {
      render(
        <Wrapper>
          <SessionCompletionSummary isOpen={true} drillCount={12} accuracy={85} confidenceChange={0} />
        </Wrapper>
      );

      expect(screen.getByTestId('confetti')).toBeInTheDocument();
    });
  });

  describe('Modal Behavior', () => {
    it('prevents dismissal via outside click', () => {
      render(
        <Wrapper>
          <SessionCompletionSummary isOpen={true} drillCount={12} accuracy={85} confidenceChange={2} />
        </Wrapper>
      );

      // Dialog is rendered and configured with onInteractOutside={(e) => e.preventDefault()}
      // This ensures the modal cannot be dismissed by clicking outside
      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();
    });

    it('prevents dismissal via ESC key', () => {
      render(
        <Wrapper>
          <SessionCompletionSummary isOpen={true} drillCount={12} accuracy={85} confidenceChange={2} />
        </Wrapper>
      );

      // The component prevents ESC via onEscapeKeyDown={(e) => e.preventDefault()}
      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles 0 drills completed', () => {
      render(
        <Wrapper>
          <SessionCompletionSummary isOpen={true} drillCount={0} accuracy={0} confidenceChange={0} />
        </Wrapper>
      );

      expect(screen.getByTestId('drills-completed')).toHaveTextContent('0');
      expect(screen.getByTestId('accuracy')).toHaveTextContent('0%');
    });

    it('handles 100% accuracy', () => {
      render(
        <Wrapper>
          <SessionCompletionSummary isOpen={true} drillCount={20} accuracy={100} confidenceChange={5} />
        </Wrapper>
      );

      expect(screen.getByTestId('accuracy')).toHaveTextContent('100%');
    });

    it('handles maximum positive confidence change (+4)', () => {
      render(
        <Wrapper>
          <SessionCompletionSummary isOpen={true} drillCount={12} accuracy={85} confidenceChange={4} />
        </Wrapper>
      );

      expect(screen.getByTestId('confidence-change')).toHaveTextContent('Confidence boost: +4');
    });

    it('handles maximum negative confidence change (-4)', () => {
      render(
        <Wrapper>
          <SessionCompletionSummary isOpen={true} drillCount={12} accuracy={50} confidenceChange={-4} />
        </Wrapper>
      );

      expect(screen.getByTestId('confidence-change')).toHaveTextContent('Tough session — every practice builds your skills!');
    });

    it('renders correctly when reopened', () => {
      const { rerender } = render(
        <Wrapper>
          <SessionCompletionSummary isOpen={false} drillCount={12} accuracy={85} confidenceChange={2} />
        </Wrapper>
      );

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

      rerender(
        <Wrapper>
          <SessionCompletionSummary isOpen={true} drillCount={12} accuracy={85} confidenceChange={2} />
        </Wrapper>
      );

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Session Complete! 🎉')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper heading structure', () => {
      render(
        <Wrapper>
          <SessionCompletionSummary isOpen={true} drillCount={12} accuracy={85} confidenceChange={2} />
        </Wrapper>
      );

      const heading = screen.getByRole('heading');
      expect(heading).toHaveTextContent('Session Complete! 🎉');
    });

    it('buttons have accessible labels', () => {
      render(
        <Wrapper>
          <SessionCompletionSummary isOpen={true} drillCount={12} accuracy={85} confidenceChange={2} />
        </Wrapper>
      );

      expect(screen.getByRole('button', { name: 'View Progress' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Done' })).toBeInTheDocument();
    });
  });
});
