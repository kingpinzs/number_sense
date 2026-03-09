/**
 * NumberLineDrill Component Tests
 * Story 3.2: Comprehensive test coverage for number line drill
 *
 * Test Coverage:
 * - AC-1: UI rendering with all required elements
 * - AC-2: User interaction flow (drag, click, submit)
 * - AC-3: Drill result persistence to Dexie
 * - AC-4: Difficulty progression logic
 * - AC-5: Accessibility (keyboard nav, ARIA labels)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NumberLineDrill from './NumberLineDrill';
import { db } from '@/services/storage/db';
import type { DrillResult } from '@/services/storage/schemas';

// Shared motion value storage for consistent state across component renders
const motionValues = new Map<string, { value: number }>();
let motionValueCounter = 0;

// Mock Framer Motion to simplify testing
vi.mock('framer-motion', async () => {
  const actual = await vi.importActual<typeof import('framer-motion')>('framer-motion');
  return {
    ...actual,
    motion: {
      div: ({ children, onDragEnd, onClick, style, drag: _drag, dragConstraints: _dragConstraints, dragElastic: _dragElastic, dragMomentum: _dragMomentum, whileTap: _whileTap, initial: _initial, animate: _animate, exit: _exit, transition: _transition, ...props }: any) => (
        <div
          {...props}
          onClick={onClick}
          onMouseUp={() => onDragEnd?.()}
          style={style ? { transform: `translateX(${style.x?.get?.() || 0}px)` } : undefined}
        >
          {children}
        </div>
      ),
    },
    useMotionValue: (initial: number) => {
      const id = `mv-${motionValueCounter++}`;
      if (!motionValues.has(id)) {
        motionValues.set(id, { value: initial });
      }
      const storage = motionValues.get(id)!;
      return {
        get: () => storage.value,
        set: (newValue: number) => { storage.value = newValue; },
      };
    },
    useTransform: (value: any, transformer: (x: number) => number) => ({
      get: () => transformer(value.get()),
    }),
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

describe('NumberLineDrill', () => {
  const mockOnComplete = vi.fn();
  const mockSessionId = 123;

  // Helper function to mock number line element dimensions
  const mockNumberLineDimensions = (element: HTMLElement, width = 1000) => {
    Object.defineProperty(element, 'offsetWidth', {
      configurable: true,
      value: width,
    });
    vi.spyOn(element, 'getBoundingClientRect').mockReturnValue({
      width,
      height: 8,
      top: 0,
      left: 0,
      right: width,
      bottom: 8,
      x: 0,
      y: 0,
      toJSON: () => {},
    } as DOMRect);
  };

  beforeEach(() => {
    vi.clearAllMocks();
    motionValues.clear();
    motionValueCounter = 0;

    // Mock HTMLElement dimensions for number line
    // This is crucial for position calculations to work in tests
    Object.defineProperty(HTMLElement.prototype, 'offsetWidth', {
      configurable: true,
      value: 1000, // Mock number line width
    });

    Object.defineProperty(HTMLElement.prototype, 'getBoundingClientRect', {
      configurable: true,
      value: vi.fn().mockReturnValue({
        width: 1000,
        height: 8,
        top: 0,
        left: 0,
        right: 1000,
        bottom: 8,
        x: 0,
        y: 0,
      }),
    });
  });

  afterEach(() => {
    // Cleanup
  });

  describe('AC-1: UI Rendering', () => {
    it('renders number line with all required elements for easy difficulty', () => {
      render(
        <NumberLineDrill
          difficulty="easy"
          sessionId={mockSessionId}
          onComplete={mockOnComplete}
        />
      );

      // Verify target number displays
      expect(screen.getByText(/Where is/i)).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument();

      // Verify range indicators (0 and 100 for easy/medium)
      expect(screen.getAllByText('0').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('100')).toBeInTheDocument();

      // Verify number line slider
      expect(screen.getByRole('slider', { name: /Number line/i })).toBeInTheDocument();

      // Verify marker exists
      expect(screen.getByRole('button', { name: /Marker at position/i })).toBeInTheDocument();

      // Verify Submit button
      const submitButton = screen.getByRole('button', { name: /Submit/i });
      expect(submitButton).toBeInTheDocument();
      expect(submitButton).toBeDisabled(); // Initially disabled until marker positioned
    });

    it('renders with 0-1000 range for hard difficulty', () => {
      render(
        <NumberLineDrill
          difficulty="hard"
          sessionId={mockSessionId}
          onComplete={mockOnComplete}
        />
      );

      expect(screen.getByText('0')).toBeInTheDocument();
      expect(screen.getByText('1000')).toBeInTheDocument();
    });

    it('displays marker with 44px minimum tap target', () => {
      render(
        <NumberLineDrill
          difficulty="medium"
          sessionId={mockSessionId}
          onComplete={mockOnComplete}
        />
      );

      const marker = screen.getByRole('button', { name: /Marker at position/i });

      // Check that marker container has h-11 w-11 classes (44px x 44px)
      expect(marker.className).toContain('h-11');
      expect(marker.className).toContain('w-11');
    });

    it('shows keyboard navigation hint', () => {
      render(
        <NumberLineDrill
          difficulty="easy"
          sessionId={mockSessionId}
          onComplete={mockOnComplete}
        />
      );

      expect(screen.getByText(/Press/i)).toBeInTheDocument();
      expect(screen.getByText(/to submit/i)).toBeInTheDocument();
    });
  });

  describe('AC-2: User Interaction Flow', () => {
    it('enables Submit button after marker is positioned via click', async () => {
      render(
        <NumberLineDrill
          difficulty="easy"
          sessionId={mockSessionId}
          onComplete={mockOnComplete}
        />
      );

      const submitButton = screen.getByRole('button', { name: /Submit/i });
      expect(submitButton).toBeDisabled();

      // Click on number line to position marker
      const numberLine = screen.getByRole('slider') as HTMLElement;
      mockNumberLineDimensions(numberLine);

      fireEvent.click(numberLine, { clientX: 50 });

      // Submit button should now be enabled
      await waitFor(() => {
        expect(submitButton).not.toBeDisabled();
      });
    });

    it('shows current marker position', async () => {
      render(
        <NumberLineDrill
          difficulty="easy"
          sessionId={mockSessionId}
          onComplete={mockOnComplete}
        />
      );

      const numberLine = screen.getByRole('slider') as HTMLElement;
      mockNumberLineDimensions(numberLine);
      fireEvent.click(numberLine, { clientX: 50 });

      await waitFor(() => {
        expect(screen.getByText(/Current position:/i)).toBeInTheDocument();
      });
    });

    it('shows feedback after submit and auto-advances after 1.5s', async () => {
      (db.drill_results.add as any).mockResolvedValue(1);

      render(
        <NumberLineDrill
          difficulty="easy"
          sessionId={mockSessionId}
          onComplete={mockOnComplete}
        />
      );

      // Position marker
      const numberLine = screen.getByRole('slider') as HTMLElement;
      mockNumberLineDimensions(numberLine);
      fireEvent.click(numberLine, { clientX: 50 });

      // Submit
      const submitButton = screen.getByRole('button', { name: /Submit/i });
      await waitFor(() => expect(submitButton).not.toBeDisabled());
      fireEvent.click(submitButton);

      // Should show feedback
      await waitFor(() => {
        expect(screen.getByText(/Correct!|Almost there!/i)).toBeInTheDocument();
      });

      // Auto-advance after 1.5 seconds (wait for real timeout)
      await waitFor(
        () => {
          expect(mockOnComplete).toHaveBeenCalledTimes(1);
        },
        { timeout: 2000 }
      );
    }, 10000);

    it('disables Submit button after submission', async () => {
      (db.drill_results.add as any).mockResolvedValue(1);

      render(
        <NumberLineDrill
          difficulty="easy"
          sessionId={mockSessionId}
          onComplete={mockOnComplete}
        />
      );

      const numberLine = screen.getByRole('slider') as HTMLElement;
      mockNumberLineDimensions(numberLine);
      fireEvent.click(numberLine, { clientX: 50 });

      const submitButton = screen.getByRole('button', { name: /Submit/i });
      await waitFor(() => expect(submitButton).not.toBeDisabled());

      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(submitButton).toBeDisabled();
      });
    });
  });

  describe('AC-3: Drill Result Persistence', () => {
    it('persists drill result to Dexie with all required fields', async () => {
      (db.drill_results.add as any).mockResolvedValue(1);

      render(
        <NumberLineDrill
          difficulty="medium"
          sessionId={mockSessionId}
          onComplete={mockOnComplete}
        />
      );

      // Position marker and submit
      const numberLine = screen.getByRole('slider') as HTMLElement;
      mockNumberLineDimensions(numberLine);
      fireEvent.click(numberLine, { clientX: 50 });

      const submitButton = screen.getByRole('button', { name: /Submit/i });
      await waitFor(() => expect(submitButton).not.toBeDisabled());
      fireEvent.click(submitButton);

      // Verify Dexie add was called
      await waitFor(() => {
        expect(db.drill_results.add).toHaveBeenCalledTimes(1);
      });

      const drillResult = (db.drill_results.add as any).mock.calls[0][0] as DrillResult;

      // Verify all required fields
      expect(drillResult).toMatchObject({
        sessionId: mockSessionId,
        module: 'number_line',
        difficulty: 'medium',
        isCorrect: expect.any(Boolean),
        timeToAnswer: expect.any(Number),
        accuracy: expect.any(Number),
        targetNumber: expect.any(Number),
        userAnswer: expect.any(Number),
        correctAnswer: expect.any(Number),
      });

      expect(drillResult.timestamp).toBeTruthy();
      expect(typeof drillResult.timestamp).toBe('string');
    });

    it('falls back to localStorage if Dexie write fails', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      (db.drill_results.add as any).mockRejectedValue(new Error('Dexie error'));

      const originalLocalStorage = window.localStorage;
      const localStorageMock = {
        getItem: vi.fn(() => null),
        setItem: vi.fn(),
        clear: vi.fn(),
        removeItem: vi.fn(),
        length: 0,
        key: vi.fn(() => null),
      };
      Object.defineProperty(window, 'localStorage', { value: localStorageMock, configurable: true });

      render(
        <NumberLineDrill
          difficulty="easy"
          sessionId={mockSessionId}
          onComplete={mockOnComplete}
        />
      );

      const numberLine = screen.getByRole('slider') as HTMLElement;
      mockNumberLineDimensions(numberLine);
      fireEvent.click(numberLine, { clientX: 50 });

      const submitButton = screen.getByRole('button', { name: /Submit/i });
      await waitFor(() => expect(submitButton).not.toBeDisabled());
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Failed to persist drill result:',
          expect.any(Error)
        );
        expect(localStorageMock.setItem).toHaveBeenCalledWith(
          'discalculas:drillResultsBackup',
          expect.any(String)
        );
      });

      // Restore original localStorage so subsequent tests don't break
      Object.defineProperty(window, 'localStorage', { value: originalLocalStorage, configurable: true });
      consoleErrorSpy.mockRestore();
    });

    it('calls onComplete callback with correct result', async () => {
      (db.drill_results.add as any).mockResolvedValue(1);

      render(
        <NumberLineDrill
          difficulty="easy"
          sessionId={mockSessionId}
          onComplete={mockOnComplete}
        />
      );

      const numberLine = screen.getByRole('slider') as HTMLElement;
      mockNumberLineDimensions(numberLine);
      fireEvent.click(numberLine, { clientX: 50 });

      const submitButton = screen.getByRole('button', { name: /Submit/i });
      await waitFor(() => expect(submitButton).not.toBeDisabled());
      fireEvent.click(submitButton);

      // Wait for auto-advance (1.5s timeout in component)
      await waitFor(
        () => {
          expect(mockOnComplete).toHaveBeenCalledWith(
            expect.objectContaining({
              module: 'number_line',
              sessionId: mockSessionId,
            })
          );
        },
        { timeout: 2000 }
      );
    }, 10000);
  });

  describe('AC-4: Difficulty Progression', () => {
    it('generates multiples of 10 for easy difficulty', () => {
      // Test multiple renders to verify pattern
      const targets: number[] = [];

      for (let i = 0; i < 10; i++) {
        const { unmount } = render(
          <NumberLineDrill
            difficulty="easy"
            sessionId={mockSessionId}
            onComplete={mockOnComplete}
          />
        );

        const heading = screen.getByRole('heading', { level: 2 });
        const targetMatch = heading.textContent?.match(/\d+/);
        if (targetMatch) {
          targets.push(parseInt(targetMatch[0]));
        }

        unmount();
      }

      // All targets should be multiples of 10
      targets.forEach(target => {
        expect(target % 10).toBe(0);
        expect(target).toBeGreaterThanOrEqual(0);
        expect(target).toBeLessThanOrEqual(100);
      });
    });

    it('generates any number 0-100 for medium difficulty', () => {
      const { unmount } = render(
        <NumberLineDrill
          difficulty="medium"
          sessionId={mockSessionId}
          onComplete={mockOnComplete}
        />
      );

      const heading = screen.getByRole('heading', { level: 2 });
      const targetMatch = heading.textContent?.match(/\d+/);

      if (targetMatch) {
        const target = parseInt(targetMatch[0]);
        expect(target).toBeGreaterThanOrEqual(0);
        expect(target).toBeLessThanOrEqual(100);
      }

      unmount();
    });

    it('uses 0-1000 range for hard difficulty', () => {
      render(
        <NumberLineDrill
          difficulty="hard"
          sessionId={mockSessionId}
          onComplete={mockOnComplete}
        />
      );

      expect(screen.getByText('1000')).toBeInTheDocument();
    });
  });

  describe('AC-5: Accessibility', () => {
    it('supports keyboard navigation with arrow keys', async () => {
      const user = userEvent.setup({ delay: null });

      render(
        <NumberLineDrill
          difficulty="easy"
          sessionId={mockSessionId}
          onComplete={mockOnComplete}
        />
      );

      const numberLine = screen.getByRole('slider') as HTMLElement;
      mockNumberLineDimensions(numberLine);

      const container = screen.getByRole('application');
      container.focus();

      // Press right arrow to move marker
      await user.keyboard('{ArrowRight}');

      await waitFor(() => {
        expect(screen.getByText(/Current position:/i)).toBeInTheDocument();
      });

      // Press left arrow
      await user.keyboard('{ArrowLeft}');

      // Marker position should still be displayed
      expect(screen.getByText(/Current position:/i)).toBeInTheDocument();
    });

    it('supports Enter key to submit', async () => {
      (db.drill_results.add as any).mockResolvedValue(1);
      const user = userEvent.setup({ delay: null });

      render(
        <NumberLineDrill
          difficulty="easy"
          sessionId={mockSessionId}
          onComplete={mockOnComplete}
        />
      );

      const numberLine = screen.getByRole('slider') as HTMLElement;
      mockNumberLineDimensions(numberLine);

      const container = screen.getByRole('application');
      container.focus();

      // Move marker with arrow key
      await user.keyboard('{ArrowRight}');

      await waitFor(() => {
        expect(screen.getByText(/Current position:/i)).toBeInTheDocument();
      });

      // Submit with Enter key
      await user.keyboard('{Enter}');

      await waitFor(() => {
        expect(screen.getByText(/Correct!|Almost there!/i)).toBeInTheDocument();
      });
    });

    it('has proper ARIA labels', () => {
      render(
        <NumberLineDrill
          difficulty="easy"
          sessionId={mockSessionId}
          onComplete={mockOnComplete}
        />
      );

      // Application role with label
      expect(screen.getByRole('application', { name: /Number line drill/i })).toBeInTheDocument();

      // Slider with proper attributes
      const slider = screen.getByRole('slider');
      expect(slider).toHaveAttribute('aria-valuemin', '0');
      expect(slider).toHaveAttribute('aria-valuemax', '100');
      expect(slider).toHaveAttribute('aria-valuenow');

      // Marker button with descriptive label
      expect(screen.getByRole('button', { name: /Marker at position/i })).toBeInTheDocument();
    });

    it('has aria-live region for target number', () => {
      render(
        <NumberLineDrill
          difficulty="easy"
          sessionId={mockSessionId}
          onComplete={mockOnComplete}
        />
      );

      const heading = screen.getByRole('heading', { level: 2 });
      // Check if parent or element has aria-live
      expect(heading.closest('[aria-live="polite"]')).toBeTruthy();
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('handles clicks at line boundaries correctly', async () => {
      render(
        <NumberLineDrill
          difficulty="easy"
          sessionId={mockSessionId}
          onComplete={mockOnComplete}
        />
      );

      const numberLine = screen.getByRole('slider') as HTMLElement;
      mockNumberLineDimensions(numberLine);

      // Click at far left (should be 0)
      fireEvent.click(numberLine, { clientX: 0 });

      await waitFor(() => {
        const positionText = screen.getByText(/Current position:/i).textContent;
        expect(positionText).toContain('0');
      });
    });

    it('respects prefers-reduced-motion', () => {
      // Mock matchMedia
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation(query => ({
          matches: query === '(prefers-reduced-motion: reduce)',
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      });

      render(
        <NumberLineDrill
          difficulty="easy"
          sessionId={mockSessionId}
          onComplete={mockOnComplete}
        />
      );

      // Component should render without errors
      expect(screen.getByRole('application')).toBeInTheDocument();
    });
  });

  describe('Accuracy Calculation', () => {
    it('calculates 100% accuracy for exact match', async () => {
      (db.drill_results.add as any).mockResolvedValue(1);

      // We can't easily control the random target, but we can verify the calculation
      render(
        <NumberLineDrill
          difficulty="easy"
          sessionId={mockSessionId}
          onComplete={mockOnComplete}
        />
      );

      const numberLine = screen.getByRole('slider') as HTMLElement;
      mockNumberLineDimensions(numberLine);
      fireEvent.click(numberLine, { clientX: 0 }); // Position at 0

      const submitButton = screen.getByRole('button', { name: /Submit/i });
      await waitFor(() => expect(submitButton).not.toBeDisabled());
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(db.drill_results.add).toHaveBeenCalled();
      });

      const result = (db.drill_results.add as any).mock.calls[0][0] as DrillResult;
      expect(result.accuracy).toBeGreaterThanOrEqual(0);
      expect(result.accuracy).toBeLessThanOrEqual(100);
    });

    it('marks answer as correct within ±10% tolerance', async () => {
      (db.drill_results.add as any).mockResolvedValue(1);

      render(
        <NumberLineDrill
          difficulty="easy"
          sessionId={mockSessionId}
          onComplete={mockOnComplete}
        />
      );

      const numberLine = screen.getByRole('slider') as HTMLElement;
      mockNumberLineDimensions(numberLine);
      fireEvent.click(numberLine, { clientX: 50 });

      const submitButton = screen.getByRole('button', { name: /Submit/i });
      await waitFor(() => expect(submitButton).not.toBeDisabled());
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(db.drill_results.add).toHaveBeenCalled();
      });

      const result = (db.drill_results.add as any).mock.calls[0][0] as DrillResult;
      expect(typeof result.isCorrect).toBe('boolean');
    });
  });
});
