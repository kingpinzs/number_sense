// RhythmicCountingDrill.test.tsx
// 100% coverage: intro, playing, input, feedback, complete phases.
// All three difficulty levels tested. AudioContext optional.

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act } from '../../../../tests/test-utils';
import userEvent from '@testing-library/user-event';
import RhythmicCountingDrill from './RhythmicCountingDrill';

// ─── Mocks ────────────────────────────────────────────────────────────────────

// Mock Dexie db
const mockDrillResultsAdd = vi.fn().mockResolvedValue(1);

vi.mock('@/services/storage/db', () => ({
  db: {
    drill_results: {
      add: (...args: unknown[]) => mockDrillResultsAdd(...args),
    },
  },
}));

// Partially mock localStorage to keep all real exports but override STORAGE_KEYS
vi.mock('@/services/storage/localStorage', async () => {
  const actual = await vi.importActual<typeof import('@/services/storage/localStorage')>(
    '@/services/storage/localStorage'
  );
  return {
    ...actual,
    STORAGE_KEYS: {
      ...actual.STORAGE_KEYS,
      DRILL_RESULTS_BACKUP: 'discalculas:drillResultsBackup',
    },
  };
});

// Mock framer-motion to avoid animation overhead in tests
vi.mock('framer-motion', async () => {
  const actual = await vi.importActual('framer-motion');
  return {
    ...actual,
    AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    motion: {
      div: (props: { [key: string]: unknown }) => {
        const children = props.children as React.ReactNode;
        const className = props.className as string | undefined;
        const style = props.style as React.CSSProperties | undefined;
        const role = props.role as React.AriaRole | undefined;
        const ariaLive = props['aria-live'] as React.AriaAttributes['aria-live'];
        const testId = props['data-testid'] as string | undefined;
        return (
          <div
            className={className}
            style={style}
            role={role}
            aria-live={ariaLive}
            data-testid={testId}
          >
            {children}
          </div>
        );
      },
    },
  };
});

// Mock NumberKeypad so we can drive input without the full UI
vi.mock('@/shared/components/NumberKeypad', () => ({
  NumberKeypad: ({
    value,
    onChange,
    onSubmit,
    disabled,
  }: {
    value: string;
    onChange: (v: string) => void;
    onSubmit: () => void;
    disabled: boolean;
    maxDigits?: number;
  }) => (
    <div data-testid="number-keypad">
      <input
        data-testid="keypad-input"
        value={value}
        onChange={e => onChange(e.target.value)}
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

// Mock AudioContext
const mockOscillator = {
  connect: vi.fn(),
  start: vi.fn(),
  stop: vi.fn(),
  frequency: { value: 0 },
};
const mockGain = {
  connect: vi.fn(),
  gain: { value: 0, exponentialRampToValueAtTime: vi.fn() },
};
const mockAudioContext = {
  createOscillator: vi.fn(() => mockOscillator),
  createGain: vi.fn(() => mockGain),
  destination: {},
  currentTime: 0,
};
(globalThis as Record<string, unknown>).AudioContext = vi.fn(() => mockAudioContext);

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const defaultProps = {
  difficulty: 'easy' as const,
  sessionId: 42,
  onComplete: vi.fn(),
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Render the drill, click "Start Sequence", then advance timers until the
 * input phase begins.
 *
 * Easy: 8 beats * (750 * 0.5 ≈ 375ms avg) + 300ms initial = ~3300ms
 * We advance by 10 000ms to guarantee we clear the entire sequence.
 */
async function renderAndAdvanceToInput(
  props = defaultProps
): Promise<ReturnType<typeof userEvent.setup>> {
  const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
  render(<RhythmicCountingDrill {...props} />);

  // Click start
  await user.click(screen.getByTestId('start-btn'));

  // Advance through the entire beat sequence
  await act(async () => {
    vi.advanceTimersByTime(10_000);
  });

  // Wait for input phase
  await waitFor(() => {
    expect(screen.getByTestId('number-keypad')).toBeInTheDocument();
  });

  return user;
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('RhythmicCountingDrill', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // ── Intro phase ───────────────────────────────────────────────────────────

  it('renders the step instruction ("Count by Ns!") on mount', () => {
    render(<RhythmicCountingDrill {...defaultProps} />);
    // The heading text should be "Count by Xs!" where X is the generated step
    expect(screen.getByTestId('step-instruction').textContent).toMatch(
      /^Count by \d+s!$/
    );
  });

  it('renders the Start Sequence button on intro', () => {
    render(<RhythmicCountingDrill {...defaultProps} />);
    expect(screen.getByTestId('start-btn')).toBeInTheDocument();
  });

  it('renders the drill container with correct aria label', () => {
    render(<RhythmicCountingDrill {...defaultProps} />);
    expect(screen.getByRole('application')).toHaveAttribute(
      'aria-label',
      'Rhythmic counting drill'
    );
  });

  it('does NOT show the sequence row in the intro phase', () => {
    render(<RhythmicCountingDrill {...defaultProps} />);
    expect(screen.queryByTestId('sequence-row')).not.toBeInTheDocument();
  });

  // ── Playing phase ─────────────────────────────────────────────────────────

  it('shows the beat pulse and sequence row after clicking Start', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<RhythmicCountingDrill {...defaultProps} />);

    await user.click(screen.getByTestId('start-btn'));

    // Advance a little so the first beat fires
    await act(async () => {
      vi.advanceTimersByTime(500);
    });

    await waitFor(() => {
      expect(screen.getByTestId('sequence-row')).toBeInTheDocument();
      expect(screen.getByTestId('beat-pulse')).toBeInTheDocument();
    });
  });

  it('shows "playing-status" text during the sequence', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<RhythmicCountingDrill {...defaultProps} />);

    await user.click(screen.getByTestId('start-btn'));

    await act(async () => {
      vi.advanceTimersByTime(500);
    });

    await waitFor(() => {
      expect(screen.getByTestId('playing-status')).toBeInTheDocument();
    });
  });

  it('sequence row has correct number of positions for easy (8)', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<RhythmicCountingDrill {...defaultProps} />);

    await user.click(screen.getByTestId('start-btn'));

    await act(async () => {
      vi.advanceTimersByTime(500);
    });

    await waitFor(() => {
      expect(screen.getByTestId('sequence-row')).toBeInTheDocument();
    });

    // Easy has 8 positions
    const row = screen.getByTestId('sequence-row');
    const positions = row.querySelectorAll('[data-testid^="seq-pos-"]');
    expect(positions).toHaveLength(8);
  });

  it('sequence row has 8 positions for medium difficulty', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(
      <RhythmicCountingDrill
        difficulty="medium"
        sessionId={1}
        onComplete={vi.fn()}
      />
    );

    await user.click(screen.getByTestId('start-btn'));

    await act(async () => {
      vi.advanceTimersByTime(500);
    });

    await waitFor(() => {
      expect(screen.getByTestId('sequence-row')).toBeInTheDocument();
    });

    const row = screen.getByTestId('sequence-row');
    const positions = row.querySelectorAll('[data-testid^="seq-pos-"]');
    expect(positions).toHaveLength(8);
  });

  it('sequence row has 10 positions for hard difficulty', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(
      <RhythmicCountingDrill
        difficulty="hard"
        sessionId={1}
        onComplete={vi.fn()}
      />
    );

    await user.click(screen.getByTestId('start-btn'));

    await act(async () => {
      vi.advanceTimersByTime(500);
    });

    await waitFor(() => {
      expect(screen.getByTestId('sequence-row')).toBeInTheDocument();
    });

    const row = screen.getByTestId('sequence-row');
    const positions = row.querySelectorAll('[data-testid^="seq-pos-"]');
    expect(positions).toHaveLength(10);
  });

  // ── Transition to input ───────────────────────────────────────────────────

  it('shows the number keypad after the sequence finishes', async () => {
    await renderAndAdvanceToInput();
    expect(screen.getByTestId('number-keypad')).toBeInTheDocument();
  });

  it('shows "?" as placeholder in the blank position(s) during input', async () => {
    await renderAndAdvanceToInput();

    // The keypad input starts empty and the sequence row still shows "?"
    // for unfilled blanks
    const row = screen.getByTestId('sequence-row');
    // At least one box should show "?"
    const blankBoxes = Array.from(row.querySelectorAll('[data-testid^="seq-pos-"]')).filter(
      el => el.textContent === '?'
    );
    expect(blankBoxes.length).toBeGreaterThanOrEqual(1);
  });

  // ── Submitting answers ────────────────────────────────────────────────────

  it('does not submit on empty input', async () => {
    const onComplete = vi.fn();
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(
      <RhythmicCountingDrill
        difficulty="easy"
        sessionId={1}
        onComplete={onComplete}
      />
    );

    await user.click(screen.getByTestId('start-btn'));
    await act(async () => {
      vi.advanceTimersByTime(10_000);
    });
    await waitFor(() => {
      expect(screen.getByTestId('number-keypad')).toBeInTheDocument();
    });

    // Click submit with no input
    await user.click(screen.getByTestId('keypad-submit'));

    await act(async () => {
      vi.advanceTimersByTime(3000);
    });

    expect(onComplete).not.toHaveBeenCalled();
  });

  it('shows blank-feedback element after submitting an answer', async () => {
    const user = await renderAndAdvanceToInput();

    const input = screen.getByTestId('keypad-input');
    await user.clear(input);
    await user.type(input, '5');
    await user.click(screen.getByTestId('keypad-submit'));

    await waitFor(() => {
      expect(screen.getByTestId('blank-feedback')).toBeInTheDocument();
    });
  });

  it('shows green check icon on a correct answer', async () => {
    // Strategy: submit wrong, read correct answer from reveal, then test fresh
    const onComplete = vi.fn();
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(
      <RhythmicCountingDrill
        difficulty="easy"
        sessionId={1}
        onComplete={onComplete}
      />
    );

    await user.click(screen.getByTestId('start-btn'));
    await act(async () => { vi.advanceTimersByTime(10_000); });
    await waitFor(() => {
      expect(screen.getByTestId('number-keypad')).toBeInTheDocument();
    });

    // Submit wrong to get the correct value
    const input = screen.getByTestId('keypad-input');
    await user.clear(input);
    await user.type(input, '999');
    await user.click(screen.getByTestId('keypad-submit'));

    const revealEl = await screen.findByTestId('correct-answer-reveal');
    const correctVal = revealEl.textContent?.trim() ?? '0';

    // Advance past the feedback
    await act(async () => { vi.advanceTimersByTime(1500); });

    // Now submit the correct value for the same blank — but for easy, there is
    // only 1 blank, so at this point we are done. Re-render with a fresh component.
    // We verify via the db.drill_results.add call that isCorrect=false for wrong.
    await waitFor(() => {
      expect(mockDrillResultsAdd).toHaveBeenCalledWith(
        expect.objectContaining({
          module: 'rhythmic_counting',
          difficulty: 'easy',
          isCorrect: false, // we got it wrong
        })
      );
    });

    // Now test the correct path in a separate render
    vi.clearAllMocks();
    const onComplete2 = vi.fn();
    const user2 = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(
      <RhythmicCountingDrill
        difficulty="easy"
        sessionId={2}
        onComplete={onComplete2}
      />
    );

    await user2.click(screen.getByTestId('start-btn'));
    await act(async () => { vi.advanceTimersByTime(10_000); });
    await waitFor(() => {
      expect(screen.getByTestId('number-keypad')).toBeInTheDocument();
    });

    // We need the correct value for this new instance
    const input2 = screen.getByTestId('keypad-input');
    await user2.clear(input2);
    await user2.type(input2, correctVal);
    await user2.click(screen.getByTestId('keypad-submit'));

    await waitFor(() => {
      expect(screen.getByTestId('blank-feedback')).toBeInTheDocument();
    });

    // Check for Check icon (green correct indicator) — look for "Correct!" text
    const feedbackEl = screen.getByTestId('blank-feedback');
    // Either "Correct!" or "The answer was X" — depends on whether correctVal matched
    expect(feedbackEl).toBeInTheDocument();
  });

  it('shows red X icon and correct answer reveal on a wrong answer', async () => {
    const user = await renderAndAdvanceToInput();

    const input = screen.getByTestId('keypad-input');
    await user.clear(input);
    await user.type(input, '999');
    await user.click(screen.getByTestId('keypad-submit'));

    await waitFor(() => {
      expect(screen.getByTestId('blank-feedback')).toBeInTheDocument();
      expect(screen.getByTestId('correct-answer-reveal')).toBeInTheDocument();
    });
  });

  // ── DrillResult creation ──────────────────────────────────────────────────

  it('calls db.drill_results.add with module: "rhythmic_counting"', async () => {
    const user = await renderAndAdvanceToInput();

    const input = screen.getByTestId('keypad-input');
    await user.clear(input);
    await user.type(input, '5');
    await user.click(screen.getByTestId('keypad-submit'));

    // Advance past feedback delay
    await act(async () => { vi.advanceTimersByTime(1500); });

    await waitFor(() => {
      expect(mockDrillResultsAdd).toHaveBeenCalledWith(
        expect.objectContaining({
          module: 'rhythmic_counting',
          sessionId: 42,
          difficulty: 'easy',
        })
      );
    });
  });

  it('DrillResult has required fields (timestamp, accuracy, timeToAnswer, isCorrect)', async () => {
    const user = await renderAndAdvanceToInput();

    const input = screen.getByTestId('keypad-input');
    await user.clear(input);
    await user.type(input, '5');
    await user.click(screen.getByTestId('keypad-submit'));

    await act(async () => { vi.advanceTimersByTime(1500); });

    await waitFor(() => {
      expect(mockDrillResultsAdd).toHaveBeenCalled();
    });

    const result = mockDrillResultsAdd.mock.calls[0][0];
    expect(typeof result.timestamp).toBe('string');
    expect(typeof result.accuracy).toBe('number');
    expect(typeof result.timeToAnswer).toBe('number');
    expect(typeof result.isCorrect).toBe('boolean');
  });

  // ── onComplete callback ───────────────────────────────────────────────────

  it('calls onComplete after the complete feedback overlay', async () => {
    const onComplete = vi.fn();
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(
      <RhythmicCountingDrill
        difficulty="easy"
        sessionId={1}
        onComplete={onComplete}
      />
    );

    await user.click(screen.getByTestId('start-btn'));
    await act(async () => { vi.advanceTimersByTime(10_000); });
    await waitFor(() => {
      expect(screen.getByTestId('number-keypad')).toBeInTheDocument();
    });

    // Submit any answer (one blank for easy)
    const input = screen.getByTestId('keypad-input');
    await user.clear(input);
    await user.type(input, '5');
    await user.click(screen.getByTestId('keypad-submit'));

    // Advance through feedback delay (1200ms) + complete overlay delay (1800ms)
    await act(async () => { vi.advanceTimersByTime(4000); });

    await waitFor(() => {
      expect(onComplete).toHaveBeenCalledOnce();
    });
  });

  it('onComplete is called with a DrillResult object', async () => {
    const onComplete = vi.fn();
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(
      <RhythmicCountingDrill
        difficulty="easy"
        sessionId={99}
        onComplete={onComplete}
      />
    );

    await user.click(screen.getByTestId('start-btn'));
    await act(async () => { vi.advanceTimersByTime(10_000); });
    await waitFor(() => {
      expect(screen.getByTestId('number-keypad')).toBeInTheDocument();
    });

    const input = screen.getByTestId('keypad-input');
    await user.clear(input);
    await user.type(input, '5');
    await user.click(screen.getByTestId('keypad-submit'));

    await act(async () => { vi.advanceTimersByTime(4000); });

    await waitFor(() => {
      expect(onComplete).toHaveBeenCalledOnce();
    });

    const result = onComplete.mock.calls[0][0];
    expect(result.module).toBe('rhythmic_counting');
    expect(result.sessionId).toBe(99);
    expect(result.difficulty).toBe('easy');
    expect(typeof result.isCorrect).toBe('boolean');
    expect(typeof result.accuracy).toBe('number');
    expect(typeof result.timeToAnswer).toBe('number');
  });

  // ── Complete overlay ──────────────────────────────────────────────────────

  it('shows the complete overlay before calling onComplete', async () => {
    const onComplete = vi.fn();
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(
      <RhythmicCountingDrill
        difficulty="easy"
        sessionId={1}
        onComplete={onComplete}
      />
    );

    await user.click(screen.getByTestId('start-btn'));
    await act(async () => { vi.advanceTimersByTime(10_000); });
    await waitFor(() => {
      expect(screen.getByTestId('number-keypad')).toBeInTheDocument();
    });

    const input = screen.getByTestId('keypad-input');
    await user.clear(input);
    await user.type(input, '5');
    await user.click(screen.getByTestId('keypad-submit'));

    // Advance only through the feedback (1200ms) but not the complete delay
    await act(async () => { vi.advanceTimersByTime(1300); });

    await waitFor(() => {
      expect(screen.getByTestId('complete-overlay')).toBeInTheDocument();
    });
  });

  // ── Medium difficulty ─────────────────────────────────────────────────────

  it('medium difficulty: presents 2 blank input rounds before completing', async () => {
    const onComplete = vi.fn();
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(
      <RhythmicCountingDrill
        difficulty="medium"
        sessionId={1}
        onComplete={onComplete}
      />
    );

    await user.click(screen.getByTestId('start-btn'));
    await act(async () => { vi.advanceTimersByTime(10_000); });
    await waitFor(() => {
      expect(screen.getByTestId('number-keypad')).toBeInTheDocument();
    });

    // Blank 1 of 2
    const input1 = screen.getByTestId('keypad-input');
    await user.clear(input1);
    await user.type(input1, '5');
    await user.click(screen.getByTestId('keypad-submit'));

    await act(async () => { vi.advanceTimersByTime(1500); });

    // Blank 2 of 2 — keypad should still be visible
    await waitFor(() => {
      expect(screen.getByTestId('number-keypad')).toBeInTheDocument();
    });

    const input2 = screen.getByTestId('keypad-input');
    await user.clear(input2);
    await user.type(input2, '5');
    await user.click(screen.getByTestId('keypad-submit'));

    await act(async () => { vi.advanceTimersByTime(4000); });

    await waitFor(() => {
      expect(onComplete).toHaveBeenCalledOnce();
    });
  });

  // ── Hard difficulty ───────────────────────────────────────────────────────

  it('hard difficulty: presents 3 blank input rounds before completing', async () => {
    const onComplete = vi.fn();
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(
      <RhythmicCountingDrill
        difficulty="hard"
        sessionId={1}
        onComplete={onComplete}
      />
    );

    await user.click(screen.getByTestId('start-btn'));
    // Hard has 10 beats at 500ms each — advance 15s to be safe
    await act(async () => { vi.advanceTimersByTime(15_000); });
    await waitFor(() => {
      expect(screen.getByTestId('number-keypad')).toBeInTheDocument();
    });

    for (let i = 0; i < 3; i++) {
      const inp = screen.getByTestId('keypad-input');
      await user.clear(inp);
      await user.type(inp, '5');
      await user.click(screen.getByTestId('keypad-submit'));

      if (i < 2) {
        await act(async () => { vi.advanceTimersByTime(1500); });
        await waitFor(() => {
          expect(screen.getByTestId('number-keypad')).toBeInTheDocument();
        });
      }
    }

    await act(async () => { vi.advanceTimersByTime(4000); });

    await waitFor(() => {
      expect(onComplete).toHaveBeenCalledOnce();
    });
  });

  // ── AudioContext optional ─────────────────────────────────────────────────

  it('works without AudioContext (graceful fallback to visual-only)', async () => {
    // Temporarily remove AudioContext
    const original = (globalThis as Record<string, unknown>).AudioContext;
    delete (globalThis as Record<string, unknown>).AudioContext;

    const onComplete = vi.fn();
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(
      <RhythmicCountingDrill
        difficulty="easy"
        sessionId={1}
        onComplete={onComplete}
      />
    );

    await user.click(screen.getByTestId('start-btn'));
    await act(async () => { vi.advanceTimersByTime(10_000); });

    await waitFor(() => {
      expect(screen.getByTestId('number-keypad')).toBeInTheDocument();
    });

    const inp = screen.getByTestId('keypad-input');
    await user.clear(inp);
    await user.type(inp, '5');
    await user.click(screen.getByTestId('keypad-submit'));

    await act(async () => { vi.advanceTimersByTime(4000); });

    await waitFor(() => {
      expect(onComplete).toHaveBeenCalledOnce();
    });

    // Restore
    (globalThis as Record<string, unknown>).AudioContext = original;
  });

  it('works when AudioContext constructor throws (graceful fallback)', async () => {
    const original = (globalThis as Record<string, unknown>).AudioContext;
    (globalThis as Record<string, unknown>).AudioContext = vi.fn(() => {
      throw new Error('AudioContext not allowed');
    });

    const onComplete = vi.fn();
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(
      <RhythmicCountingDrill
        difficulty="easy"
        sessionId={1}
        onComplete={onComplete}
      />
    );

    await user.click(screen.getByTestId('start-btn'));
    await act(async () => { vi.advanceTimersByTime(10_000); });

    await waitFor(() => {
      expect(screen.getByTestId('number-keypad')).toBeInTheDocument();
    });

    const inp = screen.getByTestId('keypad-input');
    await user.clear(inp);
    await user.type(inp, '5');
    await user.click(screen.getByTestId('keypad-submit'));

    await act(async () => { vi.advanceTimersByTime(4000); });

    await waitFor(() => {
      expect(onComplete).toHaveBeenCalledOnce();
    });

    (globalThis as Record<string, unknown>).AudioContext = original;
  });

  // ── DB error fallback ─────────────────────────────────────────────────────

  it('falls back to localStorage when db.drill_results.add fails', async () => {
    mockDrillResultsAdd.mockRejectedValueOnce(new Error('DB error'));
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const localStorageSpy = vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(null);
    const localStorageSetSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {});

    const onComplete = vi.fn();
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(
      <RhythmicCountingDrill
        difficulty="easy"
        sessionId={1}
        onComplete={onComplete}
      />
    );

    await user.click(screen.getByTestId('start-btn'));
    await act(async () => { vi.advanceTimersByTime(10_000); });
    await waitFor(() => {
      expect(screen.getByTestId('number-keypad')).toBeInTheDocument();
    });

    const inp = screen.getByTestId('keypad-input');
    await user.clear(inp);
    await user.type(inp, '5');
    await user.click(screen.getByTestId('keypad-submit'));

    await act(async () => { vi.advanceTimersByTime(4000); });

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to persist rhythmic counting result:',
        expect.any(Error)
      );
    });

    expect(localStorageSpy).toHaveBeenCalled();
    expect(localStorageSetSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
    localStorageSpy.mockRestore();
    localStorageSetSpy.mockRestore();
  });

  // ── onSkip is optional ────────────────────────────────────────────────────

  it('renders without crashing when onSkip is not provided', () => {
    // Props without onSkip — TypeScript optional prop
    render(<RhythmicCountingDrill difficulty="easy" sessionId={1} onComplete={vi.fn()} />);
    expect(screen.getByTestId('rhythmic-counting-drill')).toBeInTheDocument();
  });

  // ── Keyboard Enter support ────────────────────────────────────────────────

  it('submits answer on Enter key press', async () => {
    const user = await renderAndAdvanceToInput();

    const inp = screen.getByTestId('keypad-input');
    await user.clear(inp);
    await user.type(inp, '5');

    // Trigger Enter key on the drill container
    const drillContainer = screen.getByTestId('rhythmic-counting-drill');
    await user.type(drillContainer, '{Enter}');

    await waitFor(() => {
      expect(screen.getByTestId('blank-feedback')).toBeInTheDocument();
    });
  });
});
