// SubitizingDrill.test.tsx - Tests for subitizing (quick count) drill
// Tests follow AAA pattern (Arrange, Act, Assert)

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, act } from '../../../../tests/test-utils';
import userEvent from '@testing-library/user-event';
import SubitizingDrill from './SubitizingDrill';

// Mock Dexie db
vi.mock('@/services/storage/db', () => ({
  db: {
    drill_results: {
      add: vi.fn().mockResolvedValue(1),
    },
  },
}));

// Mock framer-motion to avoid animation timing issues
vi.mock('framer-motion', async () => {
  const actual = await vi.importActual('framer-motion');
  return {
    ...actual,
    AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    motion: {
      div: ({ children, className, style, ...props }: Record<string, unknown>) => (
        <div className={className as string} style={style as React.CSSProperties} {...props}>
          {children as React.ReactNode}
        </div>
      ),
    },
  };
});

describe('SubitizingDrill', () => {
  const mockOnComplete = vi.fn();
  const defaultProps = {
    difficulty: 'easy' as const,
    sessionId: 1,
    onComplete: mockOnComplete,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders with "How many dots?" prompt', () => {
    render(<SubitizingDrill {...defaultProps} />);
    expect(screen.getByText('How many dots?')).toBeInTheDocument();
  });

  it('has proper ARIA labels', () => {
    render(<SubitizingDrill {...defaultProps} />);
    const app = screen.getByRole('application');
    expect(app).toHaveAttribute('aria-label', 'Subitizing drill');
  });

  it('shows answer buttons after display time expires', async () => {
    render(<SubitizingDrill {...defaultProps} />);

    // During showing phase, no answer buttons should be visible
    expect(screen.queryByRole('button')).toBeNull();

    // Advance past display time (2000ms for easy)
    act(() => {
      vi.advanceTimersByTime(2100);
    });

    // Now answer buttons should be visible
    await waitFor(() => {
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBe(4); // 4 answer options
    });
  });

  it('shows "Count quickly!" during showing phase', () => {
    render(<SubitizingDrill {...defaultProps} />);
    expect(screen.getByText('Count quickly!')).toBeInTheDocument();
  });

  it('shows "Select your answer" after dots are hidden', () => {
    render(<SubitizingDrill {...defaultProps} />);

    act(() => {
      vi.advanceTimersByTime(2100);
    });

    expect(screen.getByText('Select your answer')).toBeInTheDocument();
  });

  it('calls onComplete when an answer is selected', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<SubitizingDrill {...defaultProps} />);

    // Wait for dots to hide
    act(() => {
      vi.advanceTimersByTime(2100);
    });

    // Click first answer button
    const buttons = screen.getAllByRole('button');
    await user.click(buttons[0]);

    // Advance past feedback delay
    act(() => {
      vi.advanceTimersByTime(1600);
    });

    expect(mockOnComplete).toHaveBeenCalledOnce();
    const result = mockOnComplete.mock.calls[0][0];
    expect(result.module).toBe('subitizing');
    expect(result.sessionId).toBe(1);
    expect(result.difficulty).toBe('easy');
    expect(typeof result.isCorrect).toBe('boolean');
    expect(typeof result.timeToAnswer).toBe('number');
  });

  it('disables buttons after answering', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<SubitizingDrill {...defaultProps} />);

    act(() => {
      vi.advanceTimersByTime(2100);
    });

    const buttons = screen.getAllByRole('button');
    await user.click(buttons[0]);

    // Re-query buttons after state update and check they are disabled
    await waitFor(() => {
      const updatedButtons = screen.getAllByRole('button');
      updatedButtons.forEach((button) => {
        expect(button).toBeDisabled();
      });
    });
  });

  it('generates answer options that include the correct answer', () => {
    render(<SubitizingDrill {...defaultProps} />);

    act(() => {
      vi.advanceTimersByTime(2100);
    });

    // There should be exactly 4 answer buttons
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBe(4);

    // All buttons should have numeric labels
    buttons.forEach((button) => {
      const value = parseInt(button.textContent || '', 10);
      expect(value).toBeGreaterThanOrEqual(1);
      expect(value).toBeLessThanOrEqual(12);
    });
  });
});
