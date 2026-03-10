// NumberBondsDrill.test.tsx - Tests for number bonds drill
// Tests follow AAA pattern (Arrange, Act, Assert)

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '../../../../tests/test-utils';
import userEvent from '@testing-library/user-event';
import NumberBondsDrill from './NumberBondsDrill';

// Mock Dexie db
vi.mock('@/services/storage/db', () => ({
  db: {
    drill_results: {
      add: vi.fn().mockResolvedValue(1),
    },
  },
}));

// Mock framer-motion
vi.mock('framer-motion', async () => {
  const actual = await vi.importActual('framer-motion');
  return {
    ...actual,
    AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    motion: {
      div: ({ children, className, style, role, ...props }: Record<string, unknown>) => (
        <div className={className as string} style={style as React.CSSProperties} role={role as string} {...props}>
          {children as React.ReactNode}
        </div>
      ),
    },
  };
});

// Mock NumberKeypad since it's a shared component
vi.mock('@/shared/components/NumberKeypad', () => ({
  NumberKeypad: ({ value, onChange, onSubmit, disabled }: {
    value: string;
    onChange: (val: string) => void;
    onSubmit: () => void;
    disabled: boolean;
    maxDigits?: number;
  }) => (
    <div data-testid="number-keypad">
      <input
        data-testid="keypad-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        aria-label="Number input"
      />
      <button
        data-testid="keypad-submit"
        onClick={onSubmit}
        disabled={disabled}
      >
        Submit
      </button>
    </div>
  ),
}));

describe('NumberBondsDrill', () => {
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

  it('renders with "Number Bonds" label', () => {
    render(<NumberBondsDrill {...defaultProps} />);
    expect(screen.getByText('Number Bonds')).toBeInTheDocument();
  });

  it('has proper ARIA labels', () => {
    render(<NumberBondsDrill {...defaultProps} />);
    const app = screen.getByRole('application');
    expect(app).toHaveAttribute('aria-label', 'Number bonds drill');
  });

  it('displays a valid number bond problem', () => {
    render(<NumberBondsDrill {...defaultProps} />);

    // Should show the target sum (between 5 and 10 for easy)
    // The problem format is: targetSum = knownPart + ?
    const app = screen.getByRole('application');
    expect(app).toBeInTheDocument();

    // Should show question marks for the missing part (in equation and possibly bar model)
    const questionMarks = screen.getAllByText('?');
    expect(questionMarks.length).toBeGreaterThanOrEqual(1);
  });

  it('shows visual bar model for easy difficulty', () => {
    render(<NumberBondsDrill {...defaultProps} />);

    // Easy difficulty should show "Total: N" text from the bar model
    const totalLabel = screen.getByText(/^Total:/);
    expect(totalLabel).toBeInTheDocument();
  });

  it('does not show visual bar model for hard difficulty', () => {
    render(<NumberBondsDrill {...defaultProps} difficulty="hard" />);

    // Hard difficulty should NOT show "Total:" label
    expect(screen.queryByText(/^Total:/)).toBeNull();
  });

  it('shows number keypad for input', () => {
    render(<NumberBondsDrill {...defaultProps} />);
    expect(screen.getByTestId('number-keypad')).toBeInTheDocument();
  });

  it('calls onComplete with correct result on submit', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<NumberBondsDrill {...defaultProps} />);

    // Type an answer using the mocked keypad
    const input = screen.getByTestId('keypad-input');
    await user.clear(input);
    await user.type(input, '3');

    // Submit
    const submitButton = screen.getByTestId('keypad-submit');
    await user.click(submitButton);

    // Advance past feedback delay (1500ms)
    act(() => {
      vi.advanceTimersByTime(1600);
    });

    expect(mockOnComplete).toHaveBeenCalledOnce();
    const result = mockOnComplete.mock.calls[0][0];
    expect(result.module).toBe('number_bonds');
    expect(result.sessionId).toBe(1);
    expect(result.difficulty).toBe('easy');
    expect(typeof result.isCorrect).toBe('boolean');
    expect(typeof result.timeToAnswer).toBe('number');
    expect(result.problem).toMatch(/^\d+ = \d+ \+ \?$/);
  });

  it('does not allow double submission', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<NumberBondsDrill {...defaultProps} />);

    const input = screen.getByTestId('keypad-input');
    await user.type(input, '5');

    const submitButton = screen.getByTestId('keypad-submit');
    await user.click(submitButton);
    await user.click(submitButton); // Double click

    // Advance past feedback
    act(() => {
      vi.advanceTimersByTime(1600);
    });

    // Should only call onComplete once
    expect(mockOnComplete).toHaveBeenCalledOnce();
  });

  it('does not submit with empty input', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<NumberBondsDrill {...defaultProps} />);

    const submitButton = screen.getByTestId('keypad-submit');
    await user.click(submitButton);

    // Advance time
    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(mockOnComplete).not.toHaveBeenCalled();
  });
});

// Need to import act
import { act } from '../../../../tests/test-utils';
