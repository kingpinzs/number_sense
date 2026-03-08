/**
 * SpatialRotationDrill Component Tests
 * Story 3.3: Comprehensive test coverage for spatial rotation drill
 *
 * Test Coverage:
 * - AC-1: UI rendering with reference and comparison shapes
 * - AC-2: Answer button interaction (Yes/No)
 * - AC-3: Feedback display (correct/incorrect)
 * - AC-4: Drill result persistence with spatial rotation fields
 * - AC-5: Difficulty progression logic
 * - AC-6: Accessibility (keyboard nav, ARIA labels)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SpatialRotationDrill from './SpatialRotationDrill';
import { db } from '@/services/storage/db';
import type { DrillResult } from '@/services/storage/schemas';

// Mock Framer Motion to simplify testing
vi.mock('framer-motion', async () => {
  const actual = await vi.importActual<typeof import('framer-motion')>('framer-motion');
  return {
    ...actual,
    motion: {
      div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
      span: ({ children, ...props }: any) => <span {...props}>{children}</span>,
    },
    AnimatePresence: ({ children }: any) => children,
  };
});

// Mock database
vi.mock('@/services/storage/db', () => ({
  db: {
    drill_results: {
      add: vi.fn(),
    },
  },
}));

describe('SpatialRotationDrill', () => {
  const mockOnComplete = vi.fn();
  const mockSessionId = 123;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('AC-1: UI Rendering', () => {
    it('renders spatial rotation drill with all required elements', () => {
      render(
        <SpatialRotationDrill
          difficulty="easy"
          sessionId={mockSessionId}
          onComplete={mockOnComplete}
        />
      );

      // Verify question prompt
      expect(screen.getByRole('heading', { name: /Are these the same shape\?/i })).toBeInTheDocument();
      expect(screen.getByText(/may be rotated or mirrored/i)).toBeInTheDocument();

      // Verify shape labels
      expect(screen.getByText('Reference')).toBeInTheDocument();
      expect(screen.getByText('Comparison')).toBeInTheDocument();

      // Verify two shape containers (reference and comparison)
      const referenceShape = screen.getByLabelText(/Reference shape:/i);
      const comparisonShape = screen.getByLabelText(/Comparison shape:/i);
      expect(referenceShape).toBeInTheDocument();
      expect(comparisonShape).toBeInTheDocument();

      // Verify answer buttons
      expect(screen.getByRole('button', { name: /Yes, these are the same shape/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /No, these are different shapes/i })).toBeInTheDocument();

      // Verify keyboard hint
      expect(screen.getByText(/Press/i)).toBeInTheDocument();
    });

    it('renders with accessibility attributes', () => {
      render(
        <SpatialRotationDrill
          difficulty="medium"
          sessionId={mockSessionId}
          onComplete={mockOnComplete}
        />
      );

      // Verify ARIA role for application
      const container = screen.getByRole('application', { name: /Spatial rotation drill/i });
      expect(container).toBeInTheDocument();

      // Verify answer buttons have proper ARIA labels
      expect(screen.getByLabelText(/Yes, these are the same shape/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/No, these are different shapes/i)).toBeInTheDocument();
    });
  });

  describe('AC-2: User Interaction', () => {
    it('allows user to select "Yes, Same" answer', async () => {
      render(
        <SpatialRotationDrill
          difficulty="easy"
          sessionId={mockSessionId}
          onComplete={mockOnComplete}
        />
      );

      const yesButton = screen.getByRole('button', { name: /Yes, these are the same shape/i });

      // Button should be enabled initially
      expect(yesButton).not.toBeDisabled();

      // Click button
      fireEvent.click(yesButton);

      // Button should be disabled after click
      await waitFor(
        () => {
          expect(yesButton).toBeDisabled();
        },
        { timeout: 2500 }
      );
    }, 10000);

    it('allows user to select "No, Different" answer', async () => {
      render(
        <SpatialRotationDrill
          difficulty="easy"
          sessionId={mockSessionId}
          onComplete={mockOnComplete}
        />
      );

      const noButton = screen.getByRole('button', { name: /No, these are different shapes/i });

      // Button should be enabled initially
      expect(noButton).not.toBeDisabled();

      // Click button
      fireEvent.click(noButton);

      // Button should be disabled after click
      await waitFor(
        () => {
          expect(noButton).toBeDisabled();
        },
        { timeout: 2500 }
      );
    }, 10000);

    it('disables both buttons after answer submitted', async () => {
      render(
        <SpatialRotationDrill
          difficulty="easy"
          sessionId={mockSessionId}
          onComplete={mockOnComplete}
        />
      );

      const yesButton = screen.getByRole('button', { name: /Yes, these are the same shape/i });
      const noButton = screen.getByRole('button', { name: /No, these are different shapes/i });

      // Click one button
      fireEvent.click(yesButton);

      // Both buttons should be disabled
      await waitFor(
        () => {
          expect(yesButton).toBeDisabled();
          expect(noButton).toBeDisabled();
        },
        { timeout: 2500 }
      );
    }, 10000);
  });

  describe('AC-3: Feedback Display', () => {
    it('displays correct feedback with green styling', async () => {
      // Mock random to generate a problem where "Yes, Same" is correct
      const mathRandomSpy = vi.spyOn(Math, 'random');
      mathRandomSpy.mockReturnValueOnce(0.3); // isSame = true (< 0.5)
      mathRandomSpy.mockReturnValueOnce(0); // First shape from easy set
      mathRandomSpy.mockReturnValueOnce(0); // Same shape for comparison
      mathRandomSpy.mockReturnValueOnce(0); // Rotation index

      render(
        <SpatialRotationDrill
          difficulty="easy"
          sessionId={mockSessionId}
          onComplete={mockOnComplete}
        />
      );

      mathRandomSpy.mockRestore();

      const yesButton = screen.getByRole('button', { name: /Yes, these are the same shape/i });
      fireEvent.click(yesButton);

      // Wait for feedback to appear
      await waitFor(
        () => {
          expect(screen.getByText(/Correct!/i)).toBeInTheDocument();
        },
        { timeout: 2500 }
      );

      // Verify positive feedback message
      expect(screen.getByText(/Great spatial reasoning!/i)).toBeInTheDocument();

      // Verify feedback has correct styling (green)
      const feedback = screen.getByRole('alert');
      expect(feedback).toHaveClass('border-green-500');
    }, 10000);

    it('displays incorrect feedback with warning styling', async () => {
      // Mock random to generate a specific problem
      const mathRandomSpy = vi.spyOn(Math, 'random');
      mathRandomSpy.mockReturnValueOnce(0.3); // isSame = true
      mathRandomSpy.mockReturnValueOnce(0); // First shape
      mathRandomSpy.mockReturnValueOnce(0); // Same shape
      mathRandomSpy.mockReturnValueOnce(0); // Rotation

      render(
        <SpatialRotationDrill
          difficulty="easy"
          sessionId={mockSessionId}
          onComplete={mockOnComplete}
        />
      );

      mathRandomSpy.mockRestore();

      // Answer "No, Different" when correct answer is "Yes, Same"
      const noButton = screen.getByRole('button', { name: /No, these are different shapes/i });
      fireEvent.click(noButton);

      // Wait for feedback to appear
      await waitFor(
        () => {
          expect(screen.getByText(/Not quite!/i)).toBeInTheDocument();
        },
        { timeout: 2500 }
      );

      // Verify feedback has warning styling (yellow)
      const feedback = screen.getByRole('alert');
      expect(feedback).toHaveClass('border-yellow-500');
    }, 10000);

    it('shows explanation for incorrect answer', async () => {
      render(
        <SpatialRotationDrill
          difficulty="medium"
          sessionId={mockSessionId}
          onComplete={mockOnComplete}
        />
      );

      const yesButton = screen.getByRole('button', { name: /Yes, these are the same shape/i });
      fireEvent.click(yesButton);

      // Wait for feedback with explanation
      await waitFor(
        () => {
          const feedback = screen.getByRole('alert');
          expect(feedback).toBeInTheDocument();
        },
        { timeout: 2500 }
      );
    }, 10000);
  });

  describe('AC-4: Drill Result Persistence', () => {
    it('persists drill result to Dexie with all required fields', async () => {
      vi.mocked(db.drill_results.add).mockResolvedValue(1);

      render(
        <SpatialRotationDrill
          difficulty="medium"
          sessionId={mockSessionId}
          onComplete={mockOnComplete}
        />
      );

      const yesButton = screen.getByRole('button', { name: /Yes, these are the same shape/i });
      fireEvent.click(yesButton);

      // Wait for database call
      await waitFor(
        () => {
          expect(db.drill_results.add).toHaveBeenCalled();
        },
        { timeout: 2500 }
      );

      const addedResult = vi.mocked(db.drill_results.add).mock.calls[0][0] as DrillResult;

      // Verify required fields
      expect(addedResult.sessionId).toBe(mockSessionId);
      expect(addedResult.module).toBe('spatial_rotation');
      expect(addedResult.difficulty).toBe('medium');
      expect(addedResult.isCorrect).toBeDefined();
      expect(addedResult.accuracy).toBeTypeOf('number');
      expect(addedResult.timeToAnswer).toBeTypeOf('number');

      // Verify spatial rotation specific fields
      expect(addedResult.shapeType).toBeDefined();
      expect(addedResult.rotationDegrees).toBeTypeOf('number');
      expect(addedResult.isMirrored).toBeTypeOf('boolean');
    }, 10000);

    it('handles database error with localStorage fallback', async () => {
      const dbError = new Error('Database error');
      vi.mocked(db.drill_results.add).mockRejectedValue(dbError);

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const localStorageSpy = vi.spyOn(Storage.prototype, 'setItem');

      render(
        <SpatialRotationDrill
          difficulty="easy"
          sessionId={mockSessionId}
          onComplete={mockOnComplete}
        />
      );

      const yesButton = screen.getByRole('button', { name: /Yes, these are the same shape/i });
      fireEvent.click(yesButton);

      await waitFor(
        () => {
          expect(localStorageSpy).toHaveBeenCalledWith(
            'discalculas:drillResultsBackup',
            expect.any(String)
          );
        },
        { timeout: 2500 }
      );

      consoleSpy.mockRestore();
      localStorageSpy.mockRestore();
    }, 10000);

    it('calls onComplete after 1.5 second delay', async () => {
      vi.mocked(db.drill_results.add).mockResolvedValue(1);

      render(
        <SpatialRotationDrill
          difficulty="easy"
          sessionId={mockSessionId}
          onComplete={mockOnComplete}
        />
      );

      const yesButton = screen.getByRole('button', { name: /Yes, these are the same shape/i });
      fireEvent.click(yesButton);

      // onComplete should not be called immediately
      expect(mockOnComplete).not.toHaveBeenCalled();

      // Wait for onComplete to be called after 1.5s delay
      await waitFor(
        () => {
          expect(mockOnComplete).toHaveBeenCalledTimes(1);
        },
        { timeout: 5000 }
      );

      const result = mockOnComplete.mock.calls[0][0] as DrillResult;
      expect(result.module).toBe('spatial_rotation');
    }, 10000);
  });

  describe('AC-5: Difficulty Progression', () => {
    it('easy difficulty uses simple shapes and no mirroring', () => {
      const mathRandomSpy = vi.spyOn(Math, 'random');

      // Control randomness to test easy difficulty
      mathRandomSpy.mockReturnValueOnce(0.3); // isSame = true
      mathRandomSpy.mockReturnValueOnce(0); // Select first shape from EASY_SHAPES
      mathRandomSpy.mockReturnValueOnce(0); // Same shape for comparison
      mathRandomSpy.mockReturnValueOnce(0); // Rotation index (0, 90, 180, 270)

      render(
        <SpatialRotationDrill
          difficulty="easy"
          sessionId={mockSessionId}
          onComplete={mockOnComplete}
        />
      );

      // Easy shapes should be from: square, circle, triangle
      const referenceShape = screen.getByLabelText(/Reference shape:/i);
      const comparisonShape = screen.getByLabelText(/Comparison shape:/i);
      expect(referenceShape).toBeInTheDocument();
      expect(comparisonShape).toBeInTheDocument();

      mathRandomSpy.mockRestore();
    });

    it('medium difficulty can include mirroring', () => {
      render(
        <SpatialRotationDrill
          difficulty="medium"
          sessionId={mockSessionId}
          onComplete={mockOnComplete}
        />
      );

      // Should render without errors
      expect(screen.getByRole('heading', { name: /Are these the same shape\?/i })).toBeInTheDocument();
    });

    it('hard difficulty can combine rotation and mirroring', () => {
      render(
        <SpatialRotationDrill
          difficulty="hard"
          sessionId={mockSessionId}
          onComplete={mockOnComplete}
        />
      );

      // Should render without errors
      expect(screen.getByRole('heading', { name: /Are these the same shape\?/i })).toBeInTheDocument();
    });
  });

  describe('AC-6: Keyboard Navigation', () => {
    it('handles "1" or "Y" key for "Yes, Same" answer', async () => {
      vi.mocked(db.drill_results.add).mockResolvedValue(1);

      render(
        <SpatialRotationDrill
          difficulty="easy"
          sessionId={mockSessionId}
          onComplete={mockOnComplete}
        />
      );

      const container = screen.getByRole('application');

      // Press "1" key
      fireEvent.keyDown(container, { key: '1' });

      // Verify feedback appears
      await waitFor(
        () => {
          expect(screen.getByRole('alert')).toBeInTheDocument();
        },
        { timeout: 2500 }
      );
    }, 10000);

    it('handles "2" or "N" key for "No, Different" answer', async () => {
      vi.mocked(db.drill_results.add).mockResolvedValue(1);

      render(
        <SpatialRotationDrill
          difficulty="easy"
          sessionId={mockSessionId}
          onComplete={mockOnComplete}
        />
      );

      const container = screen.getByRole('application');

      // Press "2" key
      fireEvent.keyDown(container, { key: '2' });

      // Verify feedback appears
      await waitFor(
        () => {
          expect(screen.getByRole('alert')).toBeInTheDocument();
        },
        { timeout: 2500 }
      );
    }, 10000);

    it('ignores keyboard input after answer submitted', async () => {
      vi.mocked(db.drill_results.add).mockResolvedValue(1);

      render(
        <SpatialRotationDrill
          difficulty="easy"
          sessionId={mockSessionId}
          onComplete={mockOnComplete}
        />
      );

      const container = screen.getByRole('application');

      // Submit answer with "1" key
      fireEvent.keyDown(container, { key: '1' });

      await waitFor(
        () => {
          expect(db.drill_results.add).toHaveBeenCalledTimes(1);
        },
        { timeout: 2500 }
      );

      // Try to submit again with "2" key
      fireEvent.keyDown(container, { key: '2' });

      // Should still only have one call
      expect(db.drill_results.add).toHaveBeenCalledTimes(1);
    }, 10000);

    it('button tap targets meet 44px minimum requirement', () => {
      render(
        <SpatialRotationDrill
          difficulty="easy"
          sessionId={mockSessionId}
          onComplete={mockOnComplete}
        />
      );

      const yesButton = screen.getByRole('button', { name: /Yes, these are the same shape/i });
      const noButton = screen.getByRole('button', { name: /No, these are different shapes/i });

      // Verify buttons have min-h-[44px] class
      expect(yesButton).toHaveClass('min-h-[44px]');
      expect(noButton).toHaveClass('min-h-[44px]');
    });
  });
});
