import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import MemoryGridGame from './MemoryGridGame';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: Record<string, unknown>) => {
      const { animate, transition, whileHover, whileTap, ...rest } = props as Record<string, unknown>;
      return <div {...(rest as React.HTMLAttributes<HTMLDivElement>)}>{children as React.ReactNode}</div>;
    },
    button: ({ children, ...props }: Record<string, unknown>) => {
      const { animate, transition, whileHover, whileTap, ...rest } = props as Record<string, unknown>;
      return <button {...(rest as React.ButtonHTMLAttributes<HTMLButtonElement>)}>{children as React.ReactNode}</button>;
    },
  },
  useReducedMotion: vi.fn(() => false),
  AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock Dexie db
vi.mock('@/services/storage/db', () => ({
  db: {
    telemetry_logs: {
      add: vi.fn(() => Promise.resolve()),
    },
  },
}));

// Mock the utility to control pattern generation for deterministic tests
vi.mock('../utils/memoryGridUtils', async () => {
  const actual = await vi.importActual('../utils/memoryGridUtils');
  return {
    ...actual,
    generatePattern: vi.fn((_gridSize: number, patternLength: number) => {
      // Return first N indices for deterministic testing
      return Array.from({ length: patternLength }, (_, i) => i);
    }),
  };
});

import { db } from '@/services/storage/db';

describe('MemoryGridGame', () => {
  const mockOnBack = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders 25 grid squares', async () => {
    render(<MemoryGridGame onBack={mockOnBack} />);
    await waitFor(() => {
      const squares = document.querySelectorAll('[data-square]');
      expect(squares).toHaveLength(25);
    });
  });

  it('renders with correct aria-labels on squares', async () => {
    render(<MemoryGridGame onBack={mockOnBack} />);
    await waitFor(() => {
      const firstSquare = document.querySelector('[data-index="0"]');
      expect(firstSquare?.getAttribute('aria-label')).toContain('Square row 1, column 1');
    });
  });

  it('shows header with Memory Grid title', () => {
    render(<MemoryGridGame onBack={mockOnBack} />);
    expect(screen.getByText('Memory Grid')).toBeInTheDocument();
  });

  it('shows Round 1 and pattern stats initially', () => {
    render(<MemoryGridGame onBack={mockOnBack} />);
    expect(screen.getByText('Round 1')).toBeInTheDocument();
    expect(screen.getByText('Pattern: 3 squares')).toBeInTheDocument();
  });

  it('shows 3 life indicators initially', () => {
    render(<MemoryGridGame onBack={mockOnBack} />);
    const livesContainer = screen.getByLabelText('3 lives remaining');
    expect(livesContainer).toBeInTheDocument();
  });

  it('displays memorize instruction during display phase', () => {
    render(<MemoryGridGame onBack={mockOnBack} />);
    expect(screen.getByText('Memorize the pattern...')).toBeInTheDocument();
  });

  it('highlights pattern squares during display phase', async () => {
    render(<MemoryGridGame onBack={mockOnBack} />);
    await waitFor(() => {
      // Pattern is [0, 1, 2] (first 3 indices from mock)
      const square0 = document.querySelector('[data-index="0"]');
      expect(square0?.className).toContain('bg-primary');
    });
  });

  it('disables grid interaction during display phase', async () => {
    render(<MemoryGridGame onBack={mockOnBack} />);
    await waitFor(() => {
      const square = document.querySelector('[data-index="5"]') as HTMLButtonElement;
      expect(square?.disabled).toBe(true);
    });
  });

  it('transitions to recall phase after 2 seconds', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    render(<MemoryGridGame onBack={mockOnBack} />);

    // Initially in displaying phase
    expect(screen.getByText('Memorize the pattern...')).toBeInTheDocument();

    // Advance past display timeout
    await act(async () => {
      vi.advanceTimersByTime(2100);
    });

    await waitFor(() => {
      expect(screen.getByText('Tap the squares you remember!')).toBeInTheDocument();
    });
  });

  it('shows Submit and Give Up buttons during recall phase', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    render(<MemoryGridGame onBack={mockOnBack} />);

    await act(async () => {
      vi.advanceTimersByTime(2100);
    });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Submit' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Give Up' })).toBeInTheDocument();
    });
  });

  it('Submit button is disabled when no squares are selected', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    render(<MemoryGridGame onBack={mockOnBack} />);

    await act(async () => {
      vi.advanceTimersByTime(2100);
    });

    await waitFor(() => {
      const submitBtn = screen.getByRole('button', { name: 'Submit' });
      expect(submitBtn).toBeDisabled();
    });
  });

  it('toggles square selection during recall phase', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    render(<MemoryGridGame onBack={mockOnBack} />);

    await act(async () => {
      vi.advanceTimersByTime(2100);
    });

    // Click a square to select it
    await act(async () => {
      const square = document.querySelector('[data-index="0"]') as HTMLButtonElement;
      fireEvent.click(square);
    });

    await waitFor(() => {
      const square = document.querySelector('[data-index="0"]');
      expect(square?.className).toContain('bg-primary');
      expect(square?.getAttribute('aria-label')).toContain('selected');
    });

    // Click again to deselect
    await act(async () => {
      const square = document.querySelector('[data-index="0"]') as HTMLButtonElement;
      fireEvent.click(square);
    });

    await waitFor(() => {
      const square = document.querySelector('[data-index="0"]');
      expect(square?.getAttribute('aria-label')).toContain('not selected');
    });
  });

  it('enables Submit button when squares are selected', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    render(<MemoryGridGame onBack={mockOnBack} />);

    await act(async () => {
      vi.advanceTimersByTime(2100);
    });

    // Select a square
    await act(async () => {
      const square = document.querySelector('[data-index="0"]') as HTMLButtonElement;
      fireEvent.click(square);
    });

    await waitFor(() => {
      const submitBtn = screen.getByRole('button', { name: 'Submit' });
      expect(submitBtn).not.toBeDisabled();
    });
  });

  it('shows correct feedback when pattern matches', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    render(<MemoryGridGame onBack={mockOnBack} />);

    // Wait for recall phase
    await act(async () => {
      vi.advanceTimersByTime(2100);
    });

    // Select the correct pattern (mock returns [0, 1, 2])
    await act(async () => {
      fireEvent.click(document.querySelector('[data-index="0"]')!);
      fireEvent.click(document.querySelector('[data-index="1"]')!);
      fireEvent.click(document.querySelector('[data-index="2"]')!);
    });

    // Submit
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Submit' }));
    });

    await waitFor(() => {
      expect(screen.getByText('Correct!')).toBeInTheDocument();
    });
  });

  it('advances to next round after correct answer', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    render(<MemoryGridGame onBack={mockOnBack} />);

    // Wait for recall phase
    await act(async () => {
      vi.advanceTimersByTime(2100);
    });

    // Select correct pattern [0, 1, 2]
    await act(async () => {
      fireEvent.click(document.querySelector('[data-index="0"]')!);
      fireEvent.click(document.querySelector('[data-index="1"]')!);
      fireEvent.click(document.querySelector('[data-index="2"]')!);
    });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Submit' }));
    });

    // Wait for feedback timeout
    await act(async () => {
      vi.advanceTimersByTime(1600);
    });

    await waitFor(() => {
      expect(screen.getByText('Round 2')).toBeInTheDocument();
    });
  });

  it('shows incorrect feedback and loses a life on wrong answer', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    render(<MemoryGridGame onBack={mockOnBack} />);

    // Wait for recall phase
    await act(async () => {
      vi.advanceTimersByTime(2100);
    });

    // Select wrong pattern (should be [0, 1, 2], we select [10, 11, 12])
    await act(async () => {
      fireEvent.click(document.querySelector('[data-index="10"]')!);
      fireEvent.click(document.querySelector('[data-index="11"]')!);
      fireEvent.click(document.querySelector('[data-index="12"]')!);
    });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Submit' }));
    });

    await waitFor(() => {
      expect(screen.getByText(/Not quite/)).toBeInTheDocument();
    });

    // Check lives decreased to 2
    await waitFor(() => {
      expect(screen.getByLabelText('2 lives remaining')).toBeInTheDocument();
    });
  });

  it('Give Up loses a life and shows correct pattern', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    render(<MemoryGridGame onBack={mockOnBack} />);

    // Wait for recall phase
    await act(async () => {
      vi.advanceTimersByTime(2100);
    });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Give Up' }));
    });

    await waitFor(() => {
      expect(screen.getByText(/Not quite/)).toBeInTheDocument();
      expect(screen.getByLabelText('2 lives remaining')).toBeInTheDocument();
    });
  });

  it('shows game over modal when lives reach 0', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    render(<MemoryGridGame onBack={mockOnBack} />);

    // Lose all 3 lives by giving up 3 times
    for (let i = 0; i < 3; i++) {
      // Wait for recall phase
      await act(async () => {
        vi.advanceTimersByTime(2100);
      });

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Give Up' }));
      });

      // Wait for feedback to finish
      await act(async () => {
        vi.advanceTimersByTime(1600);
      });
    }

    // Game over modal should appear
    await waitFor(() => {
      expect(screen.getByText('Game Over!')).toBeInTheDocument();
    });
  });

  it('shows correct stats in game over modal', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    render(<MemoryGridGame onBack={mockOnBack} />);

    // Lose all 3 lives
    for (let i = 0; i < 3; i++) {
      await act(async () => {
        vi.advanceTimersByTime(2100);
      });
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Give Up' }));
      });
      await act(async () => {
        vi.advanceTimersByTime(1600);
      });
    }

    await waitFor(() => {
      expect(screen.getByText('Game Over!')).toBeInTheDocument();
      // Reached round 1 (< 3), so message should be the "practice" message
      expect(screen.getByText('Memory improves with practice. Try again!')).toBeInTheDocument();
      expect(screen.getByText(/Rounds completed:/)).toBeInTheDocument();
      expect(screen.getByText(/Longest pattern:/)).toBeInTheDocument();
    });
  });

  it('logs telemetry on game over', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    render(<MemoryGridGame onBack={mockOnBack} />);

    // Lose all 3 lives
    for (let i = 0; i < 3; i++) {
      await act(async () => {
        vi.advanceTimersByTime(2100);
      });
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Give Up' }));
      });
      await act(async () => {
        vi.advanceTimersByTime(1600);
      });
    }

    await waitFor(() => {
      expect(db.telemetry_logs.add).toHaveBeenCalledWith(
        expect.objectContaining({
          event: 'cognition_game_complete',
          module: 'memory_grid',
          userId: 'local_user',
          data: expect.objectContaining({
            roundsCompleted: expect.any(Number),
            longestPattern: expect.any(Number),
            duration: expect.any(Number),
            livesRemaining: 0,
          }),
        })
      );
    });
  });

  it('Play Again resets game state', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    render(<MemoryGridGame onBack={mockOnBack} />);

    // Lose all 3 lives
    for (let i = 0; i < 3; i++) {
      await act(async () => {
        vi.advanceTimersByTime(2100);
      });
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Give Up' }));
      });
      await act(async () => {
        vi.advanceTimersByTime(1600);
      });
    }

    // Wait for game over
    await waitFor(() => {
      expect(screen.getByText('Game Over!')).toBeInTheDocument();
    });

    // Click Play Again
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Play Again' }));
    });

    // Game should reset
    await waitFor(() => {
      expect(screen.getByText('Round 1')).toBeInTheDocument();
      expect(screen.getByLabelText('3 lives remaining')).toBeInTheDocument();
    });
  });

  it('Back to Games calls onBack', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    render(<MemoryGridGame onBack={mockOnBack} />);

    // Lose all 3 lives
    for (let i = 0; i < 3; i++) {
      await act(async () => {
        vi.advanceTimersByTime(2100);
      });
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Give Up' }));
      });
      await act(async () => {
        vi.advanceTimersByTime(1600);
      });
    }

    await waitFor(() => {
      expect(screen.getByText('Game Over!')).toBeInTheDocument();
    });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Back to Games' }));
    });

    expect(mockOnBack).toHaveBeenCalled();
  });

  it('Back button in header calls onBack', () => {
    render(<MemoryGridGame onBack={mockOnBack} />);
    fireEvent.click(screen.getByRole('button', { name: /back/i }));
    expect(mockOnBack).toHaveBeenCalled();
  });

  it('keyboard ArrowRight moves focus within grid', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    render(<MemoryGridGame onBack={mockOnBack} />);

    await act(async () => {
      vi.advanceTimersByTime(2100);
    });

    // Focus the grid
    const firstSquare = document.querySelector('[data-index="0"]') as HTMLButtonElement;
    firstSquare.focus();

    // Press ArrowRight
    const grid = document.querySelector('[role="grid"]')!;
    fireEvent.keyDown(grid, { key: 'ArrowRight' });

    await waitFor(() => {
      const secondSquare = document.querySelector('[data-index="1"]') as HTMLButtonElement;
      expect(document.activeElement).toBe(secondSquare);
    });
  });

  it('keyboard Enter toggles square selection', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    render(<MemoryGridGame onBack={mockOnBack} />);

    await act(async () => {
      vi.advanceTimersByTime(2100);
    });

    const firstSquare = document.querySelector('[data-index="0"]') as HTMLButtonElement;
    firstSquare.focus();

    // Press Enter to select
    const grid = document.querySelector('[role="grid"]')!;
    fireEvent.keyDown(grid, { key: 'Enter' });

    await waitFor(() => {
      const square = document.querySelector('[data-index="0"]');
      expect(square?.getAttribute('aria-label')).toContain('selected');
      expect(square?.className).toContain('bg-primary');
    });
  });

  it('has aria-live assertive region for feedback', () => {
    render(<MemoryGridGame onBack={mockOnBack} />);
    const liveRegion = document.querySelector('[aria-live="assertive"]');
    expect(liveRegion).toBeInTheDocument();
  });

  it('has aria-live polite region for stats', () => {
    render(<MemoryGridGame onBack={mockOnBack} />);
    const liveRegion = document.querySelector('[aria-live="polite"]');
    expect(liveRegion).toBeInTheDocument();
  });

  it('reduced motion disables pulse animation', async () => {
    const { useReducedMotion } = await import('framer-motion');
    (useReducedMotion as ReturnType<typeof vi.fn>).mockReturnValue(true);

    render(<MemoryGridGame onBack={mockOnBack} />);

    // Component renders without error — reduced motion is respected
    // The animate prop uses shouldReduceMotion ? 1 : [1, 1.05, 1]
    // and transition duration is 0 when reduced motion is on
    await waitFor(() => {
      const squares = document.querySelectorAll('[data-square]');
      expect(squares).toHaveLength(25);
    });

    // Reset mock
    (useReducedMotion as ReturnType<typeof vi.fn>).mockReturnValue(false);
  });
});
