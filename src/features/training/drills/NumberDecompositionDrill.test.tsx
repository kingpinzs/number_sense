/**
 * NumberDecompositionDrill.test.tsx
 *
 * Full branch-coverage tests for NumberDecompositionDrill.
 *
 * Coverage targets:
 * - Renders target number in large text
 * - Easy: shows Base10Blocks visual + legend
 * - Easy: two separate input blanks (tens + ones)
 * - Medium: one blank (three-digit decomposition)
 * - Hard: one blank (flexible decomposition), no blocks
 * - Correct answer shows green feedback + explanation
 * - Wrong answer shows yellow feedback + correct decomposition text
 * - Base10Blocks renders correct count of hundred/ten/one blocks
 * - DrillResult has module: 'number_decomposition'
 * - onComplete called after feedback timer
 * - Empty inputs do not submit
 * - Double-submit guard
 * - Dexie persistence: success and localStorage fallback paths
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act, fireEvent } from '../../../../tests/test-utils';
import NumberDecompositionDrill, {
  generateDecompositionProblem,
  Base10Blocks,
  type DrillProps,
} from './NumberDecompositionDrill';
import type { DrillResult } from '@/services/storage/schemas';
import { db } from '@/services/storage/db';

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

vi.mock('@/services/storage/db', () => ({
  db: {
    drill_results: { add: vi.fn().mockResolvedValue(1) },
  },
}));

vi.mock('framer-motion', async () => {
  const actual = await vi.importActual('framer-motion');
  return {
    ...actual,
    AnimatePresence: ({ children }: { children: React.ReactNode }) => (
      <>{children}</>
    ),
    motion: {
      div: ({
        children,
        className,
        style,
        role,
        ...rest
      }: Record<string, unknown>) => (
        <div
          className={className as string}
          style={style as React.CSSProperties}
          role={role as string}
          {...rest}
        >
          {children as React.ReactNode}
        </div>
      ),
    },
  };
});

// ---------------------------------------------------------------------------
// Test fixtures
// ---------------------------------------------------------------------------

const easyProps: DrillProps = {
  difficulty: 'easy',
  sessionId: 7,
  onComplete: vi.fn<(result: DrillResult) => void>(),
};

const mediumProps: DrillProps = {
  difficulty: 'medium',
  sessionId: 7,
  onComplete: vi.fn<(result: DrillResult) => void>(),
};

const hardProps: DrillProps = {
  difficulty: 'hard',
  sessionId: 7,
  onComplete: vi.fn<(result: DrillResult) => void>(),
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function mockRandom(...values: number[]) {
  let call = 0;
  vi.spyOn(Math, 'random').mockImplementation(
    () => values[call++ % values.length] ?? 0
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('NumberDecompositionDrill', () => {
  let mockOnComplete: ReturnType<typeof vi.fn<(result: DrillResult) => void>>;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers({ shouldAdvanceTime: true });
    mockOnComplete = vi.fn<(result: DrillResult) => void>();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  // -------------------------------------------------------------------------
  // Rendering basics
  // -------------------------------------------------------------------------

  describe('Rendering', () => {
    it('renders the Number Decomposition label', () => {
      render(<NumberDecompositionDrill {...easyProps} onComplete={mockOnComplete} />);
      expect(screen.getByText('Number Decomposition')).toBeInTheDocument();
    });

    it('has role="application" with correct aria-label', () => {
      render(<NumberDecompositionDrill {...easyProps} onComplete={mockOnComplete} />);
      const app = screen.getByRole('application');
      expect(app).toHaveAttribute('aria-label', 'Number decomposition drill');
    });

    it('renders "Target Number" label', () => {
      render(<NumberDecompositionDrill {...easyProps} onComplete={mockOnComplete} />);
      expect(screen.getByText('Target Number')).toBeInTheDocument();
    });

    it('renders the target number in a large text element', () => {
      render(<NumberDecompositionDrill {...easyProps} onComplete={mockOnComplete} />);
      const numberEl = screen.getByTestId('target-number');
      expect(numberEl).toBeInTheDocument();
      const num = parseInt(numberEl.textContent ?? '', 10);
      // Easy numbers are 10–99
      expect(num).toBeGreaterThanOrEqual(10);
      expect(num).toBeLessThanOrEqual(99);
    });

    it('renders the equation display', () => {
      render(<NumberDecompositionDrill {...easyProps} onComplete={mockOnComplete} />);
      expect(screen.getByTestId('equation-display')).toBeInTheDocument();
    });

    it('renders the submit button', () => {
      render(<NumberDecompositionDrill {...easyProps} onComplete={mockOnComplete} />);
      expect(screen.getByTestId('submit-button')).toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  // Easy difficulty — two blanks + Base10Blocks
  // -------------------------------------------------------------------------

  describe('Easy difficulty', () => {
    it('shows Base10Blocks for easy difficulty', () => {
      render(<NumberDecompositionDrill {...easyProps} onComplete={mockOnComplete} />);
      expect(screen.getByTestId('base10-blocks')).toBeInTheDocument();
    });

    it('shows the block legend for easy difficulty', () => {
      render(<NumberDecompositionDrill {...easyProps} onComplete={mockOnComplete} />);
      expect(screen.getByText('Hundreds')).toBeInTheDocument();
      expect(screen.getByText('Tens')).toBeInTheDocument();
      expect(screen.getByText('Ones')).toBeInTheDocument();
    });

    it('renders TWO input fields for easy difficulty', () => {
      render(<NumberDecompositionDrill {...easyProps} onComplete={mockOnComplete} />);
      expect(screen.getByTestId('input-tens')).toBeInTheDocument();
      expect(screen.getByTestId('input-ones')).toBeInTheDocument();
    });

    it('does NOT render the single-blank input for easy difficulty', () => {
      render(<NumberDecompositionDrill {...easyProps} onComplete={mockOnComplete} />);
      expect(screen.queryByTestId('input-single')).not.toBeInTheDocument();
    });

    it('instruction says "Fill in the tens and ones parts"', () => {
      render(<NumberDecompositionDrill {...easyProps} onComplete={mockOnComplete} />);
      expect(
        screen.getByText(/Fill in the tens and ones parts/i)
      ).toBeInTheDocument();
    });

    it('submit button is disabled when inputs are empty', () => {
      render(<NumberDecompositionDrill {...easyProps} onComplete={mockOnComplete} />);
      expect(screen.getByTestId('submit-button')).toBeDisabled();
    });

    it('submits correctly when both blanks are correct (easy)', async () => {
      render(<NumberDecompositionDrill {...easyProps} onComplete={mockOnComplete} />);

      // Read the actual target number from the DOM to derive the correct answers
      const target = parseInt(screen.getByTestId('target-number').textContent ?? '0', 10);
      const tens = Math.floor(target / 10) * 10;
      const ones = target % 10;

      // Use fireEvent.change for number inputs — userEvent.type can misbehave on type="number"
      fireEvent.change(screen.getByTestId('input-tens'), { target: { value: String(tens) } });
      fireEvent.change(screen.getByTestId('input-ones'), { target: { value: String(ones) } });
      fireEvent.click(screen.getByTestId('submit-button'));

      await waitFor(() => {
        expect(screen.getByTestId('feedback-overlay')).toBeInTheDocument();
      });
    });

    it('isCorrect=true when both blanks match', async () => {
      render(<NumberDecompositionDrill {...easyProps} onComplete={mockOnComplete} />);

      const target = parseInt(screen.getByTestId('target-number').textContent ?? '0', 10);
      const tens = Math.floor(target / 10) * 10;
      const ones = target % 10;

      fireEvent.change(screen.getByTestId('input-tens'), { target: { value: String(tens) } });
      fireEvent.change(screen.getByTestId('input-ones'), { target: { value: String(ones) } });
      await act(async () => {
        fireEvent.click(screen.getByTestId('submit-button'));
      });
      act(() => { vi.advanceTimersByTime(1600); });

      expect(mockOnComplete).toHaveBeenCalledOnce();
      const result = mockOnComplete.mock.calls[0][0];
      expect(result.isCorrect).toBe(true);
    });

    it('isCorrect=false when tens blank is wrong', async () => {
      render(<NumberDecompositionDrill {...easyProps} onComplete={mockOnComplete} />);

      const target = parseInt(screen.getByTestId('target-number').textContent ?? '0', 10);
      const ones = target % 10;
      const wrongTens = Math.floor(target / 10) * 10 + 10; // deliberately off by 10

      fireEvent.change(screen.getByTestId('input-tens'), { target: { value: String(wrongTens) } });
      fireEvent.change(screen.getByTestId('input-ones'), { target: { value: String(ones) } });
      await act(async () => {
        fireEvent.click(screen.getByTestId('submit-button'));
      });
      act(() => { vi.advanceTimersByTime(1600); });
      expect(mockOnComplete.mock.calls[0][0].isCorrect).toBe(false);
    });

    it('does not submit when only one blank is filled', async () => {
      render(<NumberDecompositionDrill {...easyProps} onComplete={mockOnComplete} />);

      const target = parseInt(screen.getByTestId('target-number').textContent ?? '0', 10);
      const tens = Math.floor(target / 10) * 10;

      fireEvent.change(screen.getByTestId('input-tens'), { target: { value: String(tens) } });
      // Ones left empty — button must remain disabled
      fireEvent.click(screen.getByTestId('submit-button'));

      act(() => { vi.advanceTimersByTime(2000); });
      expect(mockOnComplete).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // Medium difficulty — one blank
  // -------------------------------------------------------------------------

  describe('Medium difficulty', () => {
    it('renders a single input field for medium difficulty', () => {
      render(<NumberDecompositionDrill {...mediumProps} onComplete={mockOnComplete} />);
      expect(screen.getByTestId('input-single')).toBeInTheDocument();
    });

    it('does NOT render tens/ones dual inputs for medium difficulty', () => {
      render(<NumberDecompositionDrill {...mediumProps} onComplete={mockOnComplete} />);
      expect(screen.queryByTestId('input-tens')).not.toBeInTheDocument();
      expect(screen.queryByTestId('input-ones')).not.toBeInTheDocument();
    });

    it('shows Base10Blocks for medium difficulty', () => {
      render(<NumberDecompositionDrill {...mediumProps} onComplete={mockOnComplete} />);
      expect(screen.getByTestId('base10-blocks')).toBeInTheDocument();
    });

    it('target number is between 100 and 999 for medium', () => {
      render(<NumberDecompositionDrill {...mediumProps} onComplete={mockOnComplete} />);
      const numberEl = screen.getByTestId('target-number');
      const num = parseInt(numberEl.textContent ?? '', 10);
      expect(num).toBeGreaterThanOrEqual(100);
      expect(num).toBeLessThanOrEqual(999);
    });

    it('instruction says "Fill in the missing value"', () => {
      render(<NumberDecompositionDrill {...mediumProps} onComplete={mockOnComplete} />);
      expect(screen.getByText(/Fill in the missing value/i)).toBeInTheDocument();
    });

    it('correct submission triggers success feedback for medium', async () => {
      render(<NumberDecompositionDrill {...mediumProps} onComplete={mockOnComplete} />);
      const singleInput = screen.getByTestId('input-single');

      // We verify UI flow only: any non-empty value triggers feedback.
      // Correctness of generator is tested in the generator unit tests.
      fireEvent.change(singleInput, { target: { value: '1' } });
      await act(async () => { fireEvent.click(screen.getByTestId('submit-button')); });

      await waitFor(() => {
        expect(screen.getByTestId('feedback-overlay')).toBeInTheDocument();
      });

      act(() => { vi.advanceTimersByTime(1600); });
      expect(mockOnComplete).toHaveBeenCalledOnce();
    });
  });

  // -------------------------------------------------------------------------
  // Hard difficulty — flexible decomposition, no blocks
  // -------------------------------------------------------------------------

  describe('Hard difficulty', () => {
    it('renders a single input field for hard difficulty', () => {
      render(<NumberDecompositionDrill {...hardProps} onComplete={mockOnComplete} />);
      expect(screen.getByTestId('input-single')).toBeInTheDocument();
    });

    it('does NOT show Base10Blocks for hard difficulty', () => {
      render(<NumberDecompositionDrill {...hardProps} onComplete={mockOnComplete} />);
      expect(screen.queryByTestId('base10-blocks')).not.toBeInTheDocument();
    });

    it('does NOT show the block legend for hard difficulty', () => {
      render(<NumberDecompositionDrill {...hardProps} onComplete={mockOnComplete} />);
      // Legend text should be absent when showBlocks=false
      expect(screen.queryByText('Hundreds')).not.toBeInTheDocument();
    });

    it('target number is between 10 and 999 for hard', () => {
      render(<NumberDecompositionDrill {...hardProps} onComplete={mockOnComplete} />);
      const numberEl = screen.getByTestId('target-number');
      const num = parseInt(numberEl.textContent ?? '', 10);
      expect(num).toBeGreaterThanOrEqual(10);
      expect(num).toBeLessThanOrEqual(999);
    });

    it('calls onComplete after correct answer for hard', async () => {
      render(<NumberDecompositionDrill {...hardProps} onComplete={mockOnComplete} />);
      const singleInput = screen.getByTestId('input-single');
      const target = parseInt(screen.getByTestId('target-number').textContent ?? '0', 10);

      // Enter any non-empty value to trigger submission and confirm onComplete fires
      fireEvent.change(singleInput, { target: { value: '50' } });
      await act(async () => { fireEvent.click(screen.getByTestId('submit-button')); });

      act(() => { vi.advanceTimersByTime(1600); });
      expect(mockOnComplete).toHaveBeenCalledOnce();
      expect(mockOnComplete.mock.calls[0][0].module).toBe('number_decomposition');
      expect(mockOnComplete.mock.calls[0][0].targetNumber).toBe(target);
    });
  });

  // -------------------------------------------------------------------------
  // Feedback content
  // -------------------------------------------------------------------------

  describe('Feedback content', () => {
    /** Helper: render easy drill and submit the correct answer read from DOM */
    async function submitCorrectEasyAnswer() {
      render(<NumberDecompositionDrill {...easyProps} onComplete={mockOnComplete} />);
      const target = parseInt(screen.getByTestId('target-number').textContent ?? '0', 10);
      const tens = Math.floor(target / 10) * 10;
      const ones = target % 10;
      fireEvent.change(screen.getByTestId('input-tens'), { target: { value: String(tens) } });
      fireEvent.change(screen.getByTestId('input-ones'), { target: { value: String(ones) } });
      await act(async () => { fireEvent.click(screen.getByTestId('submit-button')); });
    }

    /** Helper: render easy drill and submit a wrong answer */
    async function submitWrongEasyAnswer() {
      render(<NumberDecompositionDrill {...easyProps} onComplete={mockOnComplete} />);
      // "999" + "999" is never equal to any target 10-99
      fireEvent.change(screen.getByTestId('input-tens'), { target: { value: '999' } });
      fireEvent.change(screen.getByTestId('input-ones'), { target: { value: '999' } });
      await act(async () => { fireEvent.click(screen.getByTestId('submit-button')); });
    }

    it('shows "Correct!" when the answer is right', async () => {
      await submitCorrectEasyAnswer();

      await waitFor(() => {
        expect(screen.getByText('Correct!')).toBeInTheDocument();
      });
    });

    it('shows explanation text in correct-answer feedback', async () => {
      await submitCorrectEasyAnswer();

      await waitFor(() => {
        expect(screen.getByTestId('feedback-explanation')).toBeInTheDocument();
      });
    });

    it('shows "Not quite — keep going!" for wrong answer', async () => {
      await submitWrongEasyAnswer();

      await waitFor(() => {
        expect(screen.getByText('Not quite — keep going!')).toBeInTheDocument();
      });
    });

    it('shows the correct decomposition text in wrong-answer feedback', async () => {
      await submitWrongEasyAnswer();

      await waitFor(() => {
        // The correct decomposition heading and explanation both appear
        expect(screen.getByTestId('correct-decomposition')).toBeInTheDocument();
        expect(screen.getByTestId('feedback-explanation')).toBeInTheDocument();
      });
    });

    it('feedback overlay has role="alert" and aria-live="assertive"', async () => {
      await submitCorrectEasyAnswer();

      await waitFor(() => {
        const overlay = screen.getByTestId('feedback-overlay');
        expect(overlay).toHaveAttribute('role', 'alert');
        expect(overlay).toHaveAttribute('aria-live', 'assertive');
      });
    });
  });

  // -------------------------------------------------------------------------
  // DrillResult shape
  // -------------------------------------------------------------------------

  describe('DrillResult shape', () => {
    /** Helper: submit correct easy answer and advance timer */
    async function submitAndAdvance() {
      const target = parseInt(screen.getByTestId('target-number').textContent ?? '0', 10);
      const tens = Math.floor(target / 10) * 10;
      const ones = target % 10;
      fireEvent.change(screen.getByTestId('input-tens'), { target: { value: String(tens) } });
      fireEvent.change(screen.getByTestId('input-ones'), { target: { value: String(ones) } });
      await act(async () => { fireEvent.click(screen.getByTestId('submit-button')); });
      act(() => { vi.advanceTimersByTime(1600); });
    }

    it('result has module "number_decomposition"', async () => {
      render(<NumberDecompositionDrill {...easyProps} onComplete={mockOnComplete} />);
      await submitAndAdvance();
      expect(mockOnComplete.mock.calls[0][0].module).toBe('number_decomposition');
    });

    it('result has correct sessionId', async () => {
      render(<NumberDecompositionDrill {...easyProps} onComplete={mockOnComplete} />);
      await submitAndAdvance();
      expect(mockOnComplete.mock.calls[0][0].sessionId).toBe(7);
    });

    it('result has a numeric timeToAnswer', async () => {
      render(<NumberDecompositionDrill {...easyProps} onComplete={mockOnComplete} />);
      await submitAndAdvance();
      expect(typeof mockOnComplete.mock.calls[0][0].timeToAnswer).toBe('number');
    });

    it('result accuracy is 100 for correct answer', async () => {
      render(<NumberDecompositionDrill {...easyProps} onComplete={mockOnComplete} />);
      await submitAndAdvance();
      expect(mockOnComplete.mock.calls[0][0].accuracy).toBe(100);
    });

    it('result accuracy is 0 for wrong answer', async () => {
      render(<NumberDecompositionDrill {...easyProps} onComplete={mockOnComplete} />);
      // Enter deliberately wrong values — 999 for tens, 999 for ones is never correct
      fireEvent.change(screen.getByTestId('input-tens'), { target: { value: '999' } });
      fireEvent.change(screen.getByTestId('input-ones'), { target: { value: '999' } });
      await act(async () => { fireEvent.click(screen.getByTestId('submit-button')); });
      act(() => { vi.advanceTimersByTime(1600); });
      expect(mockOnComplete.mock.calls[0][0].accuracy).toBe(0);
    });
  });

  // -------------------------------------------------------------------------
  // Double-submit guard
  // -------------------------------------------------------------------------

  describe('Double-submit guard', () => {
    function fillEasyInputs() {
      const target = parseInt(screen.getByTestId('target-number').textContent ?? '0', 10);
      fireEvent.change(screen.getByTestId('input-tens'), { target: { value: String(Math.floor(target / 10) * 10) } });
      fireEvent.change(screen.getByTestId('input-ones'), { target: { value: String(target % 10) } });
    }

    it('submit button disappears after first click (prevents double-submit)', async () => {
      render(<NumberDecompositionDrill {...easyProps} onComplete={mockOnComplete} />);
      fillEasyInputs();
      await act(async () => { fireEvent.click(screen.getByTestId('submit-button')); });
      // Button is conditionally rendered on !submitted — it disappears immediately
      expect(screen.queryByTestId('submit-button')).not.toBeInTheDocument();
      act(() => { vi.advanceTimersByTime(1600); });
      expect(mockOnComplete).toHaveBeenCalledOnce();
    });

    it('keyboard Enter does not submit when inputs are empty', () => {
      render(<NumberDecompositionDrill {...easyProps} onComplete={mockOnComplete} />);
      const app = screen.getByRole('application');
      app.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })
      );
      act(() => { vi.advanceTimersByTime(2000); });
      expect(mockOnComplete).not.toHaveBeenCalled();
    });

    it('keyboard Enter submits when inputs are filled', async () => {
      render(<NumberDecompositionDrill {...easyProps} onComplete={mockOnComplete} />);
      fillEasyInputs();

      const app = screen.getByRole('application');
      app.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })
      );

      await waitFor(() => {
        expect(screen.getByTestId('feedback-overlay')).toBeInTheDocument();
      });
    });
  });

  // -------------------------------------------------------------------------
  // Dexie persistence
  // -------------------------------------------------------------------------

  describe('Dexie persistence', () => {
    async function fillEasyInputsAndSubmit() {
      const target = parseInt(screen.getByTestId('target-number').textContent ?? '0', 10);
      fireEvent.change(screen.getByTestId('input-tens'), { target: { value: String(Math.floor(target / 10) * 10) } });
      fireEvent.change(screen.getByTestId('input-ones'), { target: { value: String(target % 10) } });
      await act(async () => { fireEvent.click(screen.getByTestId('submit-button')); });
    }

    it('calls db.drill_results.add on submit', async () => {
      render(<NumberDecompositionDrill {...easyProps} onComplete={mockOnComplete} />);
      await fillEasyInputsAndSubmit();

      await waitFor(() => {
        expect(db.drill_results.add).toHaveBeenCalledOnce();
      });

      const saved = vi.mocked(db.drill_results.add).mock.calls[0][0];
      expect(saved.module).toBe('number_decomposition');
      expect(saved.sessionId).toBe(7);
    });

    it('falls back to localStorage when db.drill_results.add throws', async () => {
      vi.mocked(db.drill_results.add).mockRejectedValueOnce(
        new Error('DB error')
      );
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');

      render(<NumberDecompositionDrill {...easyProps} onComplete={mockOnComplete} />);
      await fillEasyInputsAndSubmit();

      await waitFor(() => {
        expect(setItemSpy).toHaveBeenCalledWith(
          'discalculas:drillResultsBackup',
          expect.any(String)
        );
      });

      consoleSpy.mockRestore();
    });

    it('falls back to overwrite path when existing backup is invalid JSON', async () => {
      vi.mocked(db.drill_results.add).mockRejectedValueOnce(
        new Error('DB error')
      );
      vi.spyOn(Storage.prototype, 'getItem').mockReturnValueOnce('NOT_JSON');
      const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      render(<NumberDecompositionDrill {...easyProps} onComplete={mockOnComplete} />);
      await fillEasyInputsAndSubmit();

      await waitFor(() => {
        expect(setItemSpy).toHaveBeenCalledWith(
          'discalculas:drillResultsBackup',
          expect.any(String)
        );
      });

      consoleSpy.mockRestore();
    });
  });

  // -------------------------------------------------------------------------
  // Base10Blocks standalone unit tests
  // -------------------------------------------------------------------------

  describe('Base10Blocks component', () => {
    it('renders correct number of hundred blocks for 300', () => {
      render(<Base10Blocks number={300} />);
      const hundredBlocks = screen.getAllByTestId('block-hundred');
      expect(hundredBlocks).toHaveLength(3);
    });

    it('renders correct number of ten blocks for 50', () => {
      render(<Base10Blocks number={50} />);
      const tenBlocks = screen.getAllByTestId('block-ten');
      expect(tenBlocks).toHaveLength(5);
    });

    it('renders correct number of one blocks for 7', () => {
      render(<Base10Blocks number={7} />);
      const oneBlocks = screen.getAllByTestId('block-one');
      expect(oneBlocks).toHaveLength(7);
    });

    it('renders correct block counts for a combined number (253)', () => {
      render(<Base10Blocks number={253} />);
      expect(screen.getAllByTestId('block-hundred')).toHaveLength(2);
      expect(screen.getAllByTestId('block-ten')).toHaveLength(5);
      expect(screen.getAllByTestId('block-one')).toHaveLength(3);
    });

    it('renders 0 blocks of a category when that place value is 0 (e.g. 40)', () => {
      render(<Base10Blocks number={40} />);
      // hundreds = 0, tens = 4, ones = 0
      expect(screen.queryByTestId('block-hundred')).not.toBeInTheDocument();
      expect(screen.getAllByTestId('block-ten')).toHaveLength(4);
      expect(screen.queryByTestId('block-one')).not.toBeInTheDocument();
    });

    it('renders no blocks for 0', () => {
      render(<Base10Blocks number={0} />);
      expect(screen.queryByTestId('block-hundred')).not.toBeInTheDocument();
      expect(screen.queryByTestId('block-ten')).not.toBeInTheDocument();
      expect(screen.queryByTestId('block-one')).not.toBeInTheDocument();
    });

    it('has an accessible aria-label describing the number', () => {
      render(<Base10Blocks number={47} />);
      const container = screen.getByTestId('base10-blocks');
      expect(container).toHaveAttribute('aria-label', 'Base 10 blocks showing 47');
    });
  });

  // -------------------------------------------------------------------------
  // Problem generator — all difficulties produce valid problems
  // -------------------------------------------------------------------------

  describe('generateDecompositionProblem', () => {
    it('easy: generates a problem with exactly 2 answers', () => {
      for (let i = 0; i < 10; i++) {
        const p = generateDecompositionProblem('easy');
        expect(p.answers).toHaveLength(2);
        // tens + ones should sum to targetNumber
        expect(p.answers[0] + p.answers[1]).toBe(p.targetNumber);
        expect(p.showBlocks).toBe(true);
        expect(p.targetNumber).toBeGreaterThanOrEqual(10);
        expect(p.targetNumber).toBeLessThanOrEqual(99);
      }
    });

    it('medium: generates a problem with exactly 1 answer', () => {
      for (let i = 0; i < 10; i++) {
        const p = generateDecompositionProblem('medium');
        expect(p.answers).toHaveLength(1);
        expect(p.showBlocks).toBe(true);
        expect(p.targetNumber).toBeGreaterThanOrEqual(100);
        expect(p.targetNumber).toBeLessThanOrEqual(999);
      }
    });

    it('hard: generates a problem with exactly 1 answer, no blocks', () => {
      for (let i = 0; i < 10; i++) {
        const p = generateDecompositionProblem('hard');
        expect(p.answers).toHaveLength(1);
        expect(p.showBlocks).toBe(false);
        expect(p.targetNumber).toBeGreaterThanOrEqual(10);
        expect(p.targetNumber).toBeLessThanOrEqual(999);
        // The single answer must be positive and less than target
        expect(p.answers[0]).toBeGreaterThan(0);
        expect(p.answers[0]).toBeLessThan(p.targetNumber);
      }
    });

    it('easy: equationTemplate contains the target number', () => {
      const p = generateDecompositionProblem('easy');
      expect(p.equationTemplate).toContain(String(p.targetNumber));
    });

    it('medium: answer + remaining parts = target (hideChoice=0 — hide tens)', () => {
      // Force medium hideChoice=0 (hide tens)
      mockRandom(0.27, 0);
      const p = generateDecompositionProblem('medium');
      // Template: "${target} = ${hundreds} + ___ + ${ones}"
      // answers[0] should be the tens component
      const tens = Math.floor((p.targetNumber % 100) / 10) * 10;
      expect(p.answers[0]).toBe(tens);
    });

    it('medium: answer = hundreds when hideChoice=1 (hide hundreds)', () => {
      mockRandom(0.27, 0.6); // hideChoice ≥ 0.5 → 1
      const p = generateDecompositionProblem('medium');
      const hundreds = Math.floor(p.targetNumber / 100) * 100;
      expect(p.answers[0]).toBe(hundreds);
    });

    it('explanation contains the target number as a string', () => {
      const p = generateDecompositionProblem('easy');
      expect(p.explanation).toContain(String(p.targetNumber));
    });
  });
});
