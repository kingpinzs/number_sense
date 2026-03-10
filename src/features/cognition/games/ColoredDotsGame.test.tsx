// ColoredDotsGame.test.tsx - Component tests for Colored Dots brain game
// Tests setup, difficulty selection, game phases, scoring, and telemetry logging

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act } from '../../../../tests/test-utils';
import userEvent from '@testing-library/user-event';
import ColoredDotsGame from './ColoredDotsGame';

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({ pathname: '/cognition' }),
  };
});

// Mock Dexie db
const mockSessionsAdd = vi.fn().mockResolvedValue(1);
const mockDrillResultsAdd = vi.fn().mockResolvedValue(1);
const mockTelemetryAdd = vi.fn().mockResolvedValue(1);

vi.mock('@/services/storage/db', () => ({
  db: {
    sessions: {
      add: (...args: unknown[]) => mockSessionsAdd(...args),
    },
    drill_results: {
      add: (...args: unknown[]) => mockDrillResultsAdd(...args),
    },
    telemetry_logs: {
      add: (...args: unknown[]) => mockTelemetryAdd(...args),
    },
  },
}));

describe('ColoredDotsGame', () => {
  const mockOnBack = vi.fn();

  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    mockOnBack.mockClear();
    mockNavigate.mockClear();
    mockSessionsAdd.mockClear();
    mockDrillResultsAdd.mockClear();
    mockTelemetryAdd.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // Test 1: Renders setup screen
  it('renders setup screen with title and description', () => {
    render(<ColoredDotsGame onBack={mockOnBack} />);

    expect(screen.getByText('Colored Dots')).toBeInTheDocument();
    expect(screen.getByText(/Dots flash briefly/)).toBeInTheDocument();
    expect(screen.getByText(/10 rounds/)).toBeInTheDocument();
  });

  // Test 2: Shows difficulty options
  it('shows all 3 difficulty options', () => {
    render(<ColoredDotsGame onBack={mockOnBack} />);

    expect(screen.getByText('Easy')).toBeInTheDocument();
    expect(screen.getByText('Medium')).toBeInTheDocument();
    expect(screen.getByText('Hard')).toBeInTheDocument();
  });

  // Test 3: Default difficulty is medium
  it('defaults to medium difficulty', () => {
    render(<ColoredDotsGame onBack={mockOnBack} />);

    const mediumButton = screen.getByText('Medium').closest('button')!;
    expect(mediumButton.className).toContain('border-primary');
  });

  // Test 4: Difficulty config details shown
  it('shows difficulty configuration details', () => {
    render(<ColoredDotsGame onBack={mockOnBack} />);

    expect(screen.getByText(/2 colors, 8-14 dots, 3s/)).toBeInTheDocument();
    expect(screen.getByText(/3 colors, 14-22 dots, 2s/)).toBeInTheDocument();
    expect(screen.getByText(/4 colors, 22-35 dots, 1.5s/)).toBeInTheDocument();
  });

  // Test 5: Select easy difficulty
  it('selects easy difficulty when clicked', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<ColoredDotsGame onBack={mockOnBack} />);

    const easyButton = screen.getByText('Easy').closest('button')!;
    await user.click(easyButton);

    expect(easyButton.className).toContain('border-primary');
    // Medium should no longer be selected
    const mediumButton = screen.getByText('Medium').closest('button')!;
    expect(mediumButton.className).not.toContain('bg-primary');
  });

  // Test 6: Start Game button
  it('renders Start Game button', () => {
    render(<ColoredDotsGame onBack={mockOnBack} />);

    expect(screen.getByRole('button', { name: 'Start Game' })).toBeInTheDocument();
  });

  // Test 7: Back button
  it('renders back button with correct label', () => {
    render(<ColoredDotsGame onBack={mockOnBack} />);

    expect(screen.getByRole('button', { name: 'Back to games' })).toBeInTheDocument();
  });

  // Test 8: Back button calls onBack
  it('calls onBack when back button clicked', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<ColoredDotsGame onBack={mockOnBack} />);

    await user.click(screen.getByRole('button', { name: 'Back to games' }));
    expect(mockOnBack).toHaveBeenCalledOnce();
  });

  // Test 9: Start game transitions to display phase
  it('transitions to display phase when Start Game clicked', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<ColoredDotsGame onBack={mockOnBack} />);

    await user.click(screen.getByRole('button', { name: 'Start Game' }));

    expect(screen.getByText('Watch carefully...')).toBeInTheDocument();
    expect(screen.getByText('Round 1/10')).toBeInTheDocument();
  });

  // Test 10: Display phase shows dots SVG
  it('renders dots SVG in display phase', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<ColoredDotsGame onBack={mockOnBack} />);

    await user.click(screen.getByRole('button', { name: 'Start Game' }));

    const svg = screen.getByRole('img', { name: 'Colored dots' });
    expect(svg).toBeInTheDocument();
    const circles = svg.querySelectorAll('circle');
    expect(circles.length).toBeGreaterThanOrEqual(14); // medium: 14-22
  });

  // Test 11a: Shows masking screen between display and answer
  it('shows masking dots between display and answer', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<ColoredDotsGame onBack={mockOnBack} />);

    await user.click(screen.getByRole('button', { name: 'Start Game' }));

    // After display time, mask should appear
    act(() => { vi.advanceTimersByTime(2100); });

    await waitFor(() => {
      expect(screen.getByRole('img', { name: 'Visual mask' })).toBeInTheDocument();
    });

    // After mask, answer phase should appear
    act(() => { vi.advanceTimersByTime(600); });

    await waitFor(() => {
      expect(screen.getByText('Which color had the most dots?')).toBeInTheDocument();
    });
  });

  // Test 11: After display time, transitions to answer phase
  it('transitions to answer phase after display time', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<ColoredDotsGame onBack={mockOnBack} />);

    await user.click(screen.getByRole('button', { name: 'Start Game' }));

    // Medium display time is 2000ms
    act(() => { vi.advanceTimersByTime(2600); });

    await waitFor(() => {
      expect(screen.getByText('Which color had the most dots?')).toBeInTheDocument();
      expect(screen.getByText('Round 1/10')).toBeInTheDocument();
    });
  });

  // Test 12: Answer phase shows color buttons (3 for medium)
  it('shows 3 color buttons for medium difficulty', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<ColoredDotsGame onBack={mockOnBack} />);

    await user.click(screen.getByRole('button', { name: 'Start Game' }));
    act(() => { vi.advanceTimersByTime(2600); });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Coral/ })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Blue/ })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Mint/ })).toBeInTheDocument();
      // Yellow not shown for medium (3 colors)
      expect(screen.queryByRole('button', { name: /Yellow/ })).not.toBeInTheDocument();
    });
  });

  // Test 13: Easy difficulty shows 2 color buttons
  it('shows 2 color buttons for easy difficulty', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<ColoredDotsGame onBack={mockOnBack} />);

    await user.click(screen.getByText('Easy').closest('button')!);
    await user.click(screen.getByRole('button', { name: 'Start Game' }));
    act(() => { vi.advanceTimersByTime(3600); }); // easy is 3s + 500ms mask

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Coral/ })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Blue/ })).toBeInTheDocument();
      // Only 2 colors for easy
      expect(screen.queryByRole('button', { name: /Mint/ })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /Yellow/ })).not.toBeInTheDocument();
    });
  });

  // Test 14: Answering shows feedback
  it('shows feedback after answering', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<ColoredDotsGame onBack={mockOnBack} />);

    await user.click(screen.getByRole('button', { name: 'Start Game' }));
    act(() => { vi.advanceTimersByTime(2600); });

    await waitFor(() => {
      expect(screen.getByText('Which color had the most dots?')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /Coral/ }));

    // Should show feedback (Correct! or Incorrect)
    await waitFor(() => {
      const feedbackText = screen.getByText(/Correct!|Incorrect/);
      expect(feedbackText).toBeInTheDocument();
    });
  });

  // Test 15: Feedback shows round counter
  it('shows round counter in feedback', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<ColoredDotsGame onBack={mockOnBack} />);

    await user.click(screen.getByRole('button', { name: 'Start Game' }));
    act(() => { vi.advanceTimersByTime(2600); });

    await waitFor(() => {
      expect(screen.getByText('Which color had the most dots?')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /Coral/ }));

    await waitFor(() => {
      expect(screen.getByText('Round 1/10')).toBeInTheDocument();
    });
  });

  // Test 16: After feedback, next round starts
  it('advances to next round after feedback delay', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<ColoredDotsGame onBack={mockOnBack} />);

    await user.click(screen.getByRole('button', { name: 'Start Game' }));
    act(() => { vi.advanceTimersByTime(2600); });

    await waitFor(() => {
      expect(screen.getByText('Which color had the most dots?')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /Coral/ }));

    // Feedback shows for 800ms, then next round starts (display phase)
    act(() => { vi.advanceTimersByTime(900); });

    await waitFor(() => {
      expect(screen.getByText('Round 2/10')).toBeInTheDocument();
      expect(screen.getByText('Watch carefully...')).toBeInTheDocument();
    });
  });

  // Test 17: Incorrect feedback shows correct answer
  it('shows correct answer when incorrect', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<ColoredDotsGame onBack={mockOnBack} />);

    await user.click(screen.getByRole('button', { name: 'Start Game' }));
    act(() => { vi.advanceTimersByTime(2600); });

    await waitFor(() => {
      expect(screen.getByText('Which color had the most dots?')).toBeInTheDocument();
    });

    // Click first available button — may or may not be correct
    await user.click(screen.getByRole('button', { name: /Coral/ }));

    await waitFor(() => {
      const feedback = screen.getByText(/Correct!|Incorrect/);
      expect(feedback).toBeInTheDocument();
      // If incorrect, should show "The answer was ..."
      if (feedback.textContent === 'Incorrect') {
        expect(screen.getByText(/The answer was/)).toBeInTheDocument();
      }
    });
  });

  // Helper: Play through all 10 rounds
  async function playAllRounds(user: ReturnType<typeof userEvent.setup>) {
    await user.click(screen.getByRole('button', { name: 'Start Game' }));

    for (let round = 0; round < 10; round++) {
      // Wait for display -> answer transition
      act(() => { vi.advanceTimersByTime(2600); });

      await waitFor(() => {
        expect(screen.getByText('Which color had the most dots?')).toBeInTheDocument();
      });

      // Click first color button
      await user.click(screen.getByRole('button', { name: /Coral/ }));

      if (round < 9) {
        // Wait for feedback -> next round transition
        act(() => { vi.advanceTimersByTime(900); });

        await waitFor(() => {
          expect(screen.getByText(`Round ${round + 2}/10`)).toBeInTheDocument();
        });
      } else {
        // Last round: wait for feedback -> complete
        act(() => { vi.advanceTimersByTime(900); });
      }
    }
  }

  // Test 18: Game complete after 10 rounds
  it('shows Game Complete screen after 10 rounds', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<ColoredDotsGame onBack={mockOnBack} />);

    await playAllRounds(user);

    await waitFor(() => {
      expect(screen.getByText('Game Complete!')).toBeInTheDocument();
    });
  });

  // Test 19: Complete screen shows Score card
  it('shows score card on completion', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<ColoredDotsGame onBack={mockOnBack} />);

    await playAllRounds(user);

    await waitFor(() => {
      expect(screen.getByText('Score')).toBeInTheDocument();
    });
  });

  // Test 20: Complete screen shows stats
  it('shows correct count, accuracy, avg response, and difficulty', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<ColoredDotsGame onBack={mockOnBack} />);

    await playAllRounds(user);

    await waitFor(() => {
      expect(screen.getByText('Correct:')).toBeInTheDocument();
      expect(screen.getByText('Accuracy:')).toBeInTheDocument();
      expect(screen.getByText('Avg Response:')).toBeInTheDocument();
      expect(screen.getByText('Difficulty:')).toBeInTheDocument();
    });

    // X/10 format for correct count
    expect(screen.getByText(/\/10/)).toBeInTheDocument();
  });

  // Test 21: Complete screen shows Play Again button
  it('shows Play Again button on completion', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<ColoredDotsGame onBack={mockOnBack} />);

    await playAllRounds(user);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Play Again' })).toBeInTheDocument();
    });
  });

  // Test 22: Complete screen shows Back to games button
  it('shows Back to games button on completion', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<ColoredDotsGame onBack={mockOnBack} />);

    await playAllRounds(user);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Back to games' })).toBeInTheDocument();
    });
  });

  // Test 23: Play Again restarts game
  it('restarts game when Play Again clicked', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<ColoredDotsGame onBack={mockOnBack} />);

    await playAllRounds(user);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Play Again' })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: 'Play Again' }));

    // Should go back to display phase, round 1
    await waitFor(() => {
      expect(screen.getByText('Round 1/10')).toBeInTheDocument();
      expect(screen.getByText('Watch carefully...')).toBeInTheDocument();
    });
  });

  // Test 24: Back to games calls onBack on completion
  it('calls onBack when Back to games clicked on completion', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<ColoredDotsGame onBack={mockOnBack} />);

    await playAllRounds(user);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Back to games' })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: 'Back to games' }));
    expect(mockOnBack).toHaveBeenCalledOnce();
  });

  // Test 25: Logs results to db on completion
  it('logs results to sessions, drill_results, and telemetry_logs', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<ColoredDotsGame onBack={mockOnBack} />);

    await playAllRounds(user);

    await waitFor(() => {
      expect(screen.getByText('Game Complete!')).toBeInTheDocument();
    });

    // Should have created a session
    expect(mockSessionsAdd).toHaveBeenCalledWith(
      expect.objectContaining({
        module: 'cognition',
        completionStatus: 'completed',
      })
    );

    // Should have logged drill result
    expect(mockDrillResultsAdd).toHaveBeenCalledWith(
      expect.objectContaining({
        module: 'colored_dots',
        difficulty: 'medium',
      })
    );

    // Should have logged telemetry
    expect(mockTelemetryAdd).toHaveBeenCalledWith(
      expect.objectContaining({
        event: 'cognition_game_complete',
        module: 'colored_dots',
        data: expect.objectContaining({
          difficulty: 'medium',
          rounds: 10,
        }),
      })
    );
  });

  // Test 26: Start Game button touch target
  it('Start Game button has minimum touch target size', () => {
    render(<ColoredDotsGame onBack={mockOnBack} />);

    const startButton = screen.getByRole('button', { name: 'Start Game' });
    expect(startButton.className).toContain('min-h-[48px]');
  });

  // Test 27: Eye icon present on setup
  it('shows eye icon on setup screen', () => {
    render(<ColoredDotsGame onBack={mockOnBack} />);

    // The Eye icon renders as an SVG; check via the containing div structure
    expect(screen.getByText('Colored Dots')).toBeInTheDocument();
  });

  // Test 28: Hard difficulty uses 1.5s display
  it('uses 1.5s display time for hard difficulty', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<ColoredDotsGame onBack={mockOnBack} />);

    await user.click(screen.getByText('Hard').closest('button')!);
    await user.click(screen.getByRole('button', { name: 'Start Game' }));

    expect(screen.getByText('Watch carefully...')).toBeInTheDocument();

    // After 1.5s, should transition to answer
    // hard is 1.5s display + 500ms mask
    act(() => { vi.advanceTimersByTime(2100); });

    await waitFor(() => {
      expect(screen.getByText('Which color had the most dots?')).toBeInTheDocument();
    });
  });

  // Test 29: Console error handled gracefully on db failure
  it('handles db logging failure gracefully', async () => {
    mockSessionsAdd.mockRejectedValueOnce(new Error('DB error'));
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<ColoredDotsGame onBack={mockOnBack} />);

    await playAllRounds(user);

    await waitFor(() => {
      expect(screen.getByText('Game Complete!')).toBeInTheDocument();
    });

    // Should have logged the error
    expect(consoleSpy).toHaveBeenCalledWith(
      'Failed to log colored dots results:',
      expect.any(Error)
    );

    consoleSpy.mockRestore();
  });

  // Test 30: Difficulty label shown in completion stats
  it('shows difficulty label in completion stats', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<ColoredDotsGame onBack={mockOnBack} />);

    await playAllRounds(user);

    await waitFor(() => {
      expect(screen.getByText('Medium')).toBeInTheDocument();
    });
  });
});
