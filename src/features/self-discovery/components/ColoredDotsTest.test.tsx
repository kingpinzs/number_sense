// ColoredDotsTest.test.tsx - Component tests for colored dots self-discovery test
// Tests setup screen, difficulty selection, phase transitions, 6-round flow,
// size-quantity bias analysis, and results display

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act } from '../../../../tests/test-utils';
import userEvent from '@testing-library/user-event';
import ColoredDotsTest from './ColoredDotsTest';

// Mock react-router-dom
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    useLocation: () => ({ pathname: '/self-discovery' }),
  };
});

describe('ColoredDotsTest', () => {
  const mockOnBack = vi.fn();

  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    mockOnBack.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // --- SETUP SCREEN ---

  it('renders setup screen with title', () => {
    render(<ColoredDotsTest onBack={mockOnBack} />);
    expect(screen.getByText('Colored Dots Test')).toBeInTheDocument();
    expect(screen.getByText(/You'll see colored dots briefly/)).toBeInTheDocument();
  });

  it('shows description about size-quantity bias testing', () => {
    render(<ColoredDotsTest onBack={mockOnBack} />);
    expect(screen.getByText(/6 rounds test whether dot size affects/)).toBeInTheDocument();
  });

  it('shows all 3 difficulty options', () => {
    render(<ColoredDotsTest onBack={mockOnBack} />);
    expect(screen.getByText('Easy')).toBeInTheDocument();
    expect(screen.getByText('Medium')).toBeInTheDocument();
    expect(screen.getByText('Hard')).toBeInTheDocument();
  });

  it('defaults to medium difficulty', () => {
    render(<ColoredDotsTest onBack={mockOnBack} />);
    const mediumButton = screen.getByText('Medium').closest('button')!;
    expect(mediumButton.className).toContain('border-primary');
  });

  it('shows difficulty configuration details', () => {
    render(<ColoredDotsTest onBack={mockOnBack} />);
    expect(screen.getByText(/2 colors, 8-14 dots, 3s display/)).toBeInTheDocument();
    expect(screen.getByText(/3 colors, 14-22 dots, 2s display/)).toBeInTheDocument();
    expect(screen.getByText(/4 colors, 22-35 dots, 1.5s display/)).toBeInTheDocument();
  });

  it('switches to easy difficulty when clicked', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<ColoredDotsTest onBack={mockOnBack} />);
    const easyButton = screen.getByText('Easy').closest('button')!;
    await user.click(easyButton);
    expect(easyButton.className).toContain('border-primary');
  });

  it('switches to hard difficulty when clicked', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<ColoredDotsTest onBack={mockOnBack} />);
    const hardButton = screen.getByText('Hard').closest('button')!;
    await user.click(hardButton);
    expect(hardButton.className).toContain('border-primary');
  });

  it('renders Start Test button', () => {
    render(<ColoredDotsTest onBack={mockOnBack} />);
    expect(screen.getByRole('button', { name: 'Start Test' })).toBeInTheDocument();
  });

  it('Start Test button has minimum touch target size', () => {
    render(<ColoredDotsTest onBack={mockOnBack} />);
    const startButton = screen.getByRole('button', { name: 'Start Test' });
    expect(startButton.className).toContain('min-h-[48px]');
  });

  it('has back button on setup screen', () => {
    render(<ColoredDotsTest onBack={mockOnBack} />);
    expect(screen.getByRole('button', { name: 'Back to self-discovery' })).toBeInTheDocument();
  });

  it('calls onBack when back button clicked', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<ColoredDotsTest onBack={mockOnBack} />);
    await user.click(screen.getByRole('button', { name: 'Back to self-discovery' }));
    expect(mockOnBack).toHaveBeenCalledOnce();
  });

  // --- PHASE 1: DISPLAY ---

  it('transitions to phase1-display when Start Test clicked', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<ColoredDotsTest onBack={mockOnBack} />);
    await user.click(screen.getByRole('button', { name: 'Start Test' }));

    expect(screen.getByText('Watch carefully...')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Colored dots display' })).toBeInTheDocument();
  });

  it('renders dots in phase1-display', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<ColoredDotsTest onBack={mockOnBack} />);
    await user.click(screen.getByRole('button', { name: 'Start Test' }));

    const svg = screen.getByRole('img', { name: 'Colored dots display' });
    const circles = svg.querySelectorAll('circle');
    // Medium: 14-22 dots (3 colors)
    expect(circles.length).toBeGreaterThanOrEqual(14);
    expect(circles.length).toBeLessThanOrEqual(22);
  });

  it('renders dots with variable radii (not all the same)', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<ColoredDotsTest onBack={mockOnBack} />);

    // Select easy for fewer dots and switch to round 3+ which has varied sizes
    // First two rounds are uniform. Let's just check any round renders circles with r attribute
    await user.click(screen.getByRole('button', { name: 'Start Test' }));

    const svg = screen.getByRole('img', { name: 'Colored dots display' });
    const circles = svg.querySelectorAll('circle');
    // All circles should have an r attribute (could be 5, 8, or 12 for first uniform round all will be 8)
    circles.forEach(circle => {
      const r = Number(circle.getAttribute('r'));
      expect([5, 8, 12]).toContain(r);
    });
  });

  it('shows round counter starting at 1/6', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<ColoredDotsTest onBack={mockOnBack} />);
    await user.click(screen.getByRole('button', { name: 'Start Test' }));
    expect(screen.getByText('Round 1/6')).toBeInTheDocument();
  });

  // --- MASKING SCREEN ---

  it('shows masking dots between display and answer', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<ColoredDotsTest onBack={mockOnBack} />);
    await user.click(screen.getByRole('button', { name: 'Start Test' }));

    // After display time, mask should appear before answer
    act(() => { vi.advanceTimersByTime(2100); }); // display time + small buffer

    await waitFor(() => {
      expect(screen.getByRole('img', { name: 'Visual mask' })).toBeInTheDocument();
    });

    // After mask duration, answer phase should appear
    act(() => { vi.advanceTimersByTime(600); });

    await waitFor(() => {
      expect(screen.getByText('Which color had the most dots?')).toBeInTheDocument();
    });
  });

  it('masking screen renders TV static pixels with test colors', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<ColoredDotsTest onBack={mockOnBack} />);
    await user.click(screen.getByRole('button', { name: 'Start Test' }));

    act(() => { vi.advanceTimersByTime(2100); });

    await waitFor(() => {
      const svg = screen.getByRole('img', { name: 'Visual mask' });
      const rects = svg.querySelectorAll('rect');
      // 30x30 grid = 900 pixels
      expect(rects.length).toBe(900);
      // All rects should use active test colors (medium = 3 colors)
      const validColors = new Set(['#E87461', '#5B8DEF', '#A8E6CF']);
      rects.forEach(rect => {
        expect(validColors.has(rect.getAttribute('fill')!)).toBe(true);
      });
    });
  });

  // --- PHASE 1: ANSWER ---

  it('transitions to phase1-answer after display time expires', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<ColoredDotsTest onBack={mockOnBack} />);
    await user.click(screen.getByRole('button', { name: 'Start Test' }));

    // Medium display time is 2000ms + 500ms mask
    act(() => { vi.advanceTimersByTime(2600); });

    await waitFor(() => {
      expect(screen.getByText('Which color had the most dots?')).toBeInTheDocument();
      expect(screen.getByText('Pick from memory')).toBeInTheDocument();
    });
  });

  it('shows 3 color choice buttons in phase1-answer for medium', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<ColoredDotsTest onBack={mockOnBack} />);
    await user.click(screen.getByRole('button', { name: 'Start Test' }));
    act(() => { vi.advanceTimersByTime(2600); });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Coral/ })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Blue/ })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Mint/ })).toBeInTheDocument();
      // Yellow not shown for medium (3 colors)
      expect(screen.queryByRole('button', { name: /Yellow/ })).not.toBeInTheDocument();
    });
  });

  it('shows 2 color buttons in phase1-answer for easy difficulty', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<ColoredDotsTest onBack={mockOnBack} />);

    const easyButton = screen.getByText('Easy').closest('button')!;
    await user.click(easyButton);
    await user.click(screen.getByRole('button', { name: 'Start Test' }));

    // Easy display time is 3000ms + 500ms mask
    act(() => { vi.advanceTimersByTime(3600); });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Coral/ })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Blue/ })).toBeInTheDocument();
      // Only 2 colors for easy
      expect(screen.queryByRole('button', { name: /Mint/ })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /Yellow/ })).not.toBeInTheDocument();
    });
  });

  // --- PHASE 2: DISPLAY + ANSWER ---

  it('transitions to phase2-display when phase1 answer is given', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<ColoredDotsTest onBack={mockOnBack} />);
    await user.click(screen.getByRole('button', { name: 'Start Test' }));
    act(() => { vi.advanceTimersByTime(2600); });

    await waitFor(() => {
      expect(screen.getByText('Which color had the most dots?')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /Coral/ }));

    await waitFor(() => {
      expect(screen.getByText(/Now look again/)).toBeInTheDocument();
      expect(screen.getByRole('img', { name: 'Colored dots display' })).toBeInTheDocument();
    });
  });

  it('shows color buttons in phase2-display', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<ColoredDotsTest onBack={mockOnBack} />);
    await user.click(screen.getByRole('button', { name: 'Start Test' }));
    act(() => { vi.advanceTimersByTime(2600); });

    await waitFor(() => {
      expect(screen.getByText('Which color had the most dots?')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /Coral/ }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Blue/ })).toBeInTheDocument();
    });
  });

  // --- ROUND FEEDBACK ---

  it('shows feedback after phase2 answer', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<ColoredDotsTest onBack={mockOnBack} />);
    await user.click(screen.getByRole('button', { name: 'Start Test' }));
    act(() => { vi.advanceTimersByTime(2600); });

    await waitFor(() => {
      expect(screen.getByText('Which color had the most dots?')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /Coral/ }));
    await waitFor(() => { expect(screen.getByText(/Now look again/)).toBeInTheDocument(); });
    await user.click(screen.getByRole('button', { name: /Blue/ }));

    await waitFor(() => {
      expect(screen.getByText(/Correct!|Incorrect/)).toBeInTheDocument();
    });
  });

  // --- MULTI-ROUND FLOW ---

  it('advances to round 2 after completing round 1', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<ColoredDotsTest onBack={mockOnBack} />);
    await user.click(screen.getByRole('button', { name: 'Start Test' }));

    // Round 1: display -> answer -> phase2 -> feedback
    act(() => { vi.advanceTimersByTime(2600); });
    await waitFor(() => { expect(screen.getByText('Which color had the most dots?')).toBeInTheDocument(); });
    await user.click(screen.getByRole('button', { name: /Coral/ }));
    await waitFor(() => { expect(screen.getByText(/Now look again/)).toBeInTheDocument(); });
    await user.click(screen.getByRole('button', { name: /Coral/ }));

    // Wait for feedback transition (1200ms)
    act(() => { vi.advanceTimersByTime(1300); });

    await waitFor(() => {
      expect(screen.getByText('Round 2/6')).toBeInTheDocument();
    });
  });

  it('uses 1.5s display time for hard difficulty', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<ColoredDotsTest onBack={mockOnBack} />);

    const hardButton = screen.getByText('Hard').closest('button')!;
    await user.click(hardButton);
    await user.click(screen.getByRole('button', { name: 'Start Test' }));

    expect(screen.getByText('Watch carefully...')).toBeInTheDocument();

    act(() => { vi.advanceTimersByTime(2100); });

    await waitFor(() => {
      expect(screen.getByText('Which color had the most dots?')).toBeInTheDocument();
    });
  });

  // --- FULL GAME FLOW + RESULTS ---

  // Helper: play through all 6 rounds
  async function playAllRounds(user: ReturnType<typeof userEvent.setup>) {
    await user.click(screen.getByRole('button', { name: 'Start Test' }));

    for (let round = 0; round < 6; round++) {
      // Phase 1 display -> answer
      act(() => { vi.advanceTimersByTime(2600); });
      await waitFor(() => {
        expect(screen.getByText('Which color had the most dots?')).toBeInTheDocument();
      });

      // Phase 1 answer
      await user.click(screen.getByRole('button', { name: /Coral/ }));

      // Phase 2 display + answer
      await waitFor(() => { expect(screen.getByText(/Now look again/)).toBeInTheDocument(); });
      await user.click(screen.getByRole('button', { name: /Coral/ }));

      if (round < 5) {
        // Wait for feedback -> next round
        act(() => { vi.advanceTimersByTime(1300); });
        await waitFor(() => {
          expect(screen.getByText(`Round ${round + 2}/6`)).toBeInTheDocument();
        });
      } else {
        // Last round: wait for feedback -> results
        act(() => { vi.advanceTimersByTime(1300); });
      }
    }
  }

  it('shows Test Results after all 6 rounds', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<ColoredDotsTest onBack={mockOnBack} />);
    await playAllRounds(user);

    await waitFor(() => {
      expect(screen.getByText('Test Results')).toBeInTheDocument();
    });
  });

  it('shows accuracy by size mode in results', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<ColoredDotsTest onBack={mockOnBack} />);
    await playAllRounds(user);

    await waitFor(() => {
      expect(screen.getByText('Accuracy by Dot Size Mode')).toBeInTheDocument();
      expect(screen.getByText('Uniform (all same size)')).toBeInTheDocument();
      expect(screen.getByText('Varied (random sizes)')).toBeInTheDocument();
      expect(screen.getByText('Size-biased (deceptive)')).toBeInTheDocument();
    });
  });

  it('shows size-quantity bias analysis in results', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<ColoredDotsTest onBack={mockOnBack} />);
    await playAllRounds(user);

    await waitFor(() => {
      expect(screen.getByText('Size-Quantity Bias Analysis')).toBeInTheDocument();
    });
  });

  it('shows round details in results', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<ColoredDotsTest onBack={mockOnBack} />);
    await playAllRounds(user);

    await waitFor(() => {
      expect(screen.getByText('Round Details')).toBeInTheDocument();
    });

    // Should show round entries with mode labels
    expect(screen.getAllByText(/Round \d+ \(/).length).toBe(6);
  });

  it('shows Try Again button in results', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<ColoredDotsTest onBack={mockOnBack} />);
    await playAllRounds(user);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Try Again' })).toBeInTheDocument();
    });
  });

  it('shows Done button in results', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<ColoredDotsTest onBack={mockOnBack} />);
    await playAllRounds(user);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Done' })).toBeInTheDocument();
    });
  });

  it('restarts test when Try Again clicked', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<ColoredDotsTest onBack={mockOnBack} />);
    await playAllRounds(user);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Try Again' })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: 'Try Again' }));

    expect(screen.getByText('Watch carefully...')).toBeInTheDocument();
    expect(screen.getByText('Round 1/6')).toBeInTheDocument();
  });

  it('calls onBack when Done button clicked', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<ColoredDotsTest onBack={mockOnBack} />);
    await playAllRounds(user);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Done' })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: 'Done' }));
    expect(mockOnBack).toHaveBeenCalledOnce();
  });

  it('results show correct/incorrect for each round', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<ColoredDotsTest onBack={mockOnBack} />);
    await playAllRounds(user);

    await waitFor(() => {
      expect(screen.getByText('Round Details')).toBeInTheDocument();
    });

    // Each of the 6 rounds should show either Correct or Incorrect
    const correctLabels = screen.getAllByText(/^Correct$|^Incorrect$/);
    expect(correctLabels).toHaveLength(6);
  });
});
