// FractionsDrill.test.tsx - Tests for fractions drill
// Tests follow AAA pattern (Arrange, Act, Assert)

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '../../../../tests/test-utils';
import userEvent from '@testing-library/user-event';
import FractionsDrill from './FractionsDrill';

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

describe('FractionsDrill', () => {
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

  it('renders the fractions drill question', () => {
    render(<FractionsDrill {...defaultProps} />);
    expect(screen.getByTestId('fraction-question')).toHaveTextContent('What fraction is shaded?');
  });

  it('has proper ARIA label on the drill container', () => {
    render(<FractionsDrill {...defaultProps} />);
    expect(screen.getByRole('application')).toHaveAttribute('aria-label', 'Fractions drill');
  });

  it('renders a fraction shape (rectangle or circle)', () => {
    render(<FractionsDrill {...defaultProps} />);
    expect(screen.getByTestId('fraction-shape')).toBeInTheDocument();
  });

  it('renders 4 multiple-choice buttons', () => {
    render(<FractionsDrill {...defaultProps} />);
    const choices = screen.getByTestId('choices-container');
    expect(choices.querySelectorAll('button')).toHaveLength(4);
  });

  it('shaded SVG cells use CSS variable --primary (not hsl wrapper)', () => {
    render(<FractionsDrill {...defaultProps} />);
    const shape = screen.getByTestId('fraction-shape');
    // At least one shaded cell must use var(--primary), not hsl(var(...))
    const shadedCells = Array.from(shape.querySelectorAll('[fill="var(--primary)"]'));
    expect(shadedCells.length).toBeGreaterThanOrEqual(1);
  });

  it('unshaded SVG cells use CSS variable --muted instead of transparent', () => {
    render(<FractionsDrill {...defaultProps} />);
    const shape = screen.getByTestId('fraction-shape');
    // No cells should use transparent fill (invisible in dark mode)
    const transparentCells = Array.from(shape.querySelectorAll('[fill="transparent"]'));
    expect(transparentCells).toHaveLength(0);
    // Unshaded cells should use var(--muted)
    const mutedCells = Array.from(shape.querySelectorAll('[fill="var(--muted)"]'));
    expect(mutedCells.length).toBeGreaterThanOrEqual(1);
  });

  it('SVG strokes use CSS variable --border (not hsl wrapper)', () => {
    render(<FractionsDrill {...defaultProps} />);
    const shape = screen.getByTestId('fraction-shape');
    const cells = Array.from(shape.querySelectorAll('[stroke="var(--border)"]'));
    expect(cells.length).toBeGreaterThanOrEqual(1);
  });

  it('selects a choice and calls onComplete after feedback delay', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<FractionsDrill {...defaultProps} />);

    const firstChoice = screen.getByTestId('choice-0');
    await user.click(firstChoice);

    // All buttons become disabled after selection
    const choices = screen.getByTestId('choices-container');
    choices.querySelectorAll('button').forEach((btn) => {
      expect(btn).toBeDisabled();
    });

    // Advance past the 1500ms feedback timer
    vi.advanceTimersByTime(1600);
    expect(mockOnComplete).toHaveBeenCalledTimes(1);
  });

  it('shows feedback overlay after answering', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<FractionsDrill {...defaultProps} />);

    const firstChoice = screen.getByTestId('choice-0');
    await user.click(firstChoice);

    expect(screen.getByTestId('feedback-overlay')).toBeInTheDocument();
  });

  it('renders correctly with medium difficulty', () => {
    render(<FractionsDrill {...defaultProps} difficulty="medium" />);
    expect(screen.getByTestId('fraction-shape')).toBeInTheDocument();
    expect(screen.getByTestId('choices-container').querySelectorAll('button')).toHaveLength(4);
  });

  it('renders correctly with hard difficulty', () => {
    render(<FractionsDrill {...defaultProps} difficulty="hard" />);
    expect(screen.getByTestId('fraction-shape')).toBeInTheDocument();
  });
});
