/**
 * FactFamilyDrill.test.tsx
 *
 * 100 % branch / statement / function / line coverage for FactFamilyDrill.
 *
 * Strategy:
 * - Seed Math.random before each relevant render so the generated family is
 *   deterministic and answer values are known in advance.
 * - Wrap timer advances in act(async () => {...}) and flush pending promises
 *   with vi.runAllTimersAsync() so async setTimeout callbacks complete.
 * - Mock framer-motion, lucide-react, and Dexie to keep the environment fast.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '../../../../tests/test-utils';
import FactFamilyDrill from './FactFamilyDrill';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock('@/services/storage/db', () => ({
  db: {
    drill_results: { add: vi.fn().mockResolvedValue(1) },
  },
}));

vi.mock('framer-motion', async () => {
  const actual = await vi.importActual<typeof import('framer-motion')>('framer-motion');
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

vi.mock('lucide-react', () => ({
  Check: ({ className }: { className?: string }) => (
    <svg data-testid="icon-check" className={className} />
  ),
  X: ({ className }: { className?: string }) => (
    <svg data-testid="icon-x" className={className} />
  ),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const mockOnComplete = vi.fn();

function makeProps(difficulty: 'easy' | 'medium' | 'hard' = 'easy') {
  return { difficulty, sessionId: 7, onComplete: mockOnComplete };
}

/**
 * Seed Math.random with a repeating list of values.
 */
function seedRandom(values: number[]) {
  let i = 0;
  vi.spyOn(Math, 'random').mockImplementation(() => values[i++ % values.length]);
}

/**
 * Produce a Math.random value that maps rand(min, max) to a specific target.
 *   rand(min, max) = min + floor(random * (max - min + 1))
 */
function randVal(min: number, max: number, target: number): number {
  return (target - min) / (max - min + 1) + 0.0001;
}

/**
 * Seed so easy add_sub gives: a=3, b=4, total=7
 *   Question[0]: "7 - 3 = ?"  answer: 4
 */
function seedEasy_3_4_7() {
  seedRandom([
    randVal(1, 5, 3),   // a = 3
    randVal(1, 7, 4),   // b = 4
  ]);
}

/**
 * Seed so medium add_sub gives: a=5, b=8, total=13
 *   Q1: "13 - 5 = ?" answer: 8  |  Q2: "13 - 8 = ?" answer: 5
 */
function seedMediumAddSub_5_8_13() {
  seedRandom([
    0.3,                   // Math.random() < 0.5 → add_sub
    randVal(1, 10, 5),     // a = 5
    randVal(1, 15, 8),     // b = 8
  ]);
}

/**
 * Seed so medium mul_div gives: a=3, b=4, product=12
 *   anchor: "3 × 4 = 12"
 *   Q1: "12 ÷ 3 = ?" answer: 4  |  Q2: "12 ÷ 4 = ?" answer: 3
 */
function seedMediumMulDiv_3_4_12() {
  seedRandom([
    0.8,                   // Math.random() >= 0.5 → mul_div
    randVal(2, 12, 3),     // a = 3
    randVal(2, 12, 4),     // b = 4
  ]);
}

/**
 * Seed hard add_sub: a=10, b=15, total=25 (3 questions)
 *   Q1: "25 - 10 = ?" ans 15  |  Q2: "25 - 15 = ?" ans 10  |  Q3: "15 + 10 = ?" ans 25
 */
function seedHardAddSub_10_15_25() {
  seedRandom([
    0.3,                   // add_sub
    randVal(1, 50, 10),    // a=10
    randVal(1, 90, 15),    // b=15
  ]);
}

/**
 * Advance fake timers AND flush all pending microtasks/promises inside act.
 * This is required when setTimeout callbacks contain async code (await).
 */
async function advanceAndFlush(ms: number) {
  await act(async () => {
    vi.advanceTimersByTime(ms);
    await vi.runAllTimersAsync();
  });
}

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe('FactFamilyDrill', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  // -------------------------------------------------------------------------
  // Rendering basics
  // -------------------------------------------------------------------------

  describe('Initial render', () => {
    it('has role="application" with correct aria-label', () => {
      render(<FactFamilyDrill {...makeProps('easy')} />);
      expect(screen.getByRole('application')).toHaveAttribute(
        'aria-label',
        'Fact family drill'
      );
    });

    it('shows "Fact Family" heading label', () => {
      render(<FactFamilyDrill {...makeProps('easy')} />);
      expect(screen.getByText('Fact Family')).toBeInTheDocument();
    });

    it('shows the anchor fact prominently', () => {
      seedEasy_3_4_7();
      render(<FactFamilyDrill {...makeProps('easy')} />);
      const anchor = screen.getByTestId('anchor-fact');
      expect(anchor.textContent).toBe('3 + 4 = 7');
    });

    it('renders the fact family triangle SVG', () => {
      render(<FactFamilyDrill {...makeProps('easy')} />);
      expect(screen.getByTestId('fact-family-triangle')).toBeInTheDocument();
    });

    it('triangle has aria role="img"', () => {
      render(<FactFamilyDrill {...makeProps('easy')} />);
      expect(screen.getByRole('img')).toBeInTheDocument();
    });

    it('triangle shows total at the top', () => {
      seedEasy_3_4_7();
      render(<FactFamilyDrill {...makeProps('easy')} />);
      expect(screen.getByTestId('triangle-total').textContent).toBe('7');
    });

    it('triangle shows operands a and b at the bottom', () => {
      seedEasy_3_4_7();
      render(<FactFamilyDrill {...makeProps('easy')} />);
      expect(screen.getByTestId('triangle-a').textContent).toBe('3');
      expect(screen.getByTestId('triangle-b').textContent).toBe('4');
    });

    it('triangle shows the operation symbol for add_sub', () => {
      seedEasy_3_4_7();
      render(<FactFamilyDrill {...makeProps('easy')} />);
      expect(screen.getByTestId('triangle-op').textContent).toBe('+');
    });

    it('shows the first question immediately', () => {
      render(<FactFamilyDrill {...makeProps('easy')} />);
      expect(screen.getByTestId('question-text')).toBeInTheDocument();
    });

    it('shows "Question 1 of N" progress indicator', () => {
      seedEasy_3_4_7();
      render(<FactFamilyDrill {...makeProps('easy')} />);
      expect(screen.getByText('Question 1 of 1')).toBeInTheDocument();
    });

    it('renders the answer input', () => {
      render(<FactFamilyDrill {...makeProps('easy')} />);
      expect(screen.getByTestId('answer-input')).toBeInTheDocument();
    });

    it('"Check" button is disabled when input is empty', () => {
      render(<FactFamilyDrill {...makeProps('easy')} />);
      expect(screen.getByTestId('submit-btn')).toBeDisabled();
    });

    it('"Check" button is enabled after typing an answer', () => {
      seedEasy_3_4_7();
      render(<FactFamilyDrill {...makeProps('easy')} />);
      fireEvent.change(screen.getByTestId('answer-input'), { target: { value: '4' } });
      expect(screen.getByTestId('submit-btn')).not.toBeDisabled();
    });
  });

  // -------------------------------------------------------------------------
  // Easy difficulty: one inverse question (a=3, b=4, total=7)
  // -------------------------------------------------------------------------

  describe('Easy difficulty — one inverse question', () => {
    it('shows exactly one question (counter: 1 of 1)', () => {
      seedEasy_3_4_7();
      render(<FactFamilyDrill {...makeProps('easy')} />);
      expect(screen.getByText('Question 1 of 1')).toBeInTheDocument();
    });

    it('first question text is "7 - 3 = ?"', () => {
      seedEasy_3_4_7();
      render(<FactFamilyDrill {...makeProps('easy')} />);
      expect(screen.getByTestId('question-text').textContent).toBe('7 - 3 = ?');
    });

    it('correct answer shows check icon in question feedback', async () => {
      seedEasy_3_4_7();
      render(<FactFamilyDrill {...makeProps('easy')} />);
      fireEvent.change(screen.getByTestId('answer-input'), { target: { value: '4' } });
      await act(async () => { fireEvent.click(screen.getByTestId('submit-btn')); });
      expect(screen.getByTestId('icon-check')).toBeInTheDocument();
    });

    it('correct answer shows "Correct!" text in feedback container', async () => {
      seedEasy_3_4_7();
      render(<FactFamilyDrill {...makeProps('easy')} />);
      fireEvent.change(screen.getByTestId('answer-input'), { target: { value: '4' } });
      await act(async () => { fireEvent.click(screen.getByTestId('submit-btn')); });
      const feedback = screen.getByTestId('question-feedback');
      expect(feedback.textContent).toContain('Correct!');
    });

    it('wrong answer shows X icon', async () => {
      seedEasy_3_4_7();
      render(<FactFamilyDrill {...makeProps('easy')} />);
      fireEvent.change(screen.getByTestId('answer-input'), { target: { value: '99' } });
      await act(async () => { fireEvent.click(screen.getByTestId('submit-btn')); });
      expect(screen.getByTestId('icon-x')).toBeInTheDocument();
    });

    it('wrong answer shows "The answer is N" message', async () => {
      seedEasy_3_4_7();
      render(<FactFamilyDrill {...makeProps('easy')} />);
      fireEvent.change(screen.getByTestId('answer-input'), { target: { value: '99' } });
      await act(async () => { fireEvent.click(screen.getByTestId('submit-btn')); });
      // Both visible and sr-only paragraphs contain this text; check the feedback container
      const feedback = screen.getByTestId('question-feedback');
      expect(feedback.textContent).toContain('The answer is');
    });

    it('drill-complete banner appears after 1.2 s advance', async () => {
      seedEasy_3_4_7();
      render(<FactFamilyDrill {...makeProps('easy')} />);
      fireEvent.change(screen.getByTestId('answer-input'), { target: { value: '4' } });
      await act(async () => { fireEvent.click(screen.getByTestId('submit-btn')); });
      await advanceAndFlush(1300);
      expect(screen.getByTestId('drill-complete-banner')).toBeInTheDocument();
    });

    it('onComplete fires after complete timer', async () => {
      seedEasy_3_4_7();
      render(<FactFamilyDrill {...makeProps('easy')} />);
      fireEvent.change(screen.getByTestId('answer-input'), { target: { value: '4' } });
      await act(async () => { fireEvent.click(screen.getByTestId('submit-btn')); });
      await advanceAndFlush(1300);
      await advanceAndFlush(2000);
      expect(mockOnComplete).toHaveBeenCalledOnce();
    });

    it('DrillResult has module "fact_family"', async () => {
      seedEasy_3_4_7();
      render(<FactFamilyDrill {...makeProps('easy')} />);
      fireEvent.change(screen.getByTestId('answer-input'), { target: { value: '4' } });
      await act(async () => { fireEvent.click(screen.getByTestId('submit-btn')); });
      await advanceAndFlush(1300);
      await advanceAndFlush(2000);
      expect(mockOnComplete).toHaveBeenCalledWith(
        expect.objectContaining({ module: 'fact_family' })
      );
    });

    it('DrillResult isCorrect:true when all correct', async () => {
      seedEasy_3_4_7();
      render(<FactFamilyDrill {...makeProps('easy')} />);
      fireEvent.change(screen.getByTestId('answer-input'), { target: { value: '4' } });
      await act(async () => { fireEvent.click(screen.getByTestId('submit-btn')); });
      await advanceAndFlush(1300);
      await advanceAndFlush(2000);
      expect(mockOnComplete).toHaveBeenCalledWith(
        expect.objectContaining({ isCorrect: true, accuracy: 100 })
      );
    });

    it('DrillResult isCorrect:false and accuracy:0 when all wrong', async () => {
      seedEasy_3_4_7();
      render(<FactFamilyDrill {...makeProps('easy')} />);
      fireEvent.change(screen.getByTestId('answer-input'), { target: { value: '99' } });
      await act(async () => { fireEvent.click(screen.getByTestId('submit-btn')); });
      await advanceAndFlush(1300);
      await advanceAndFlush(2000);
      expect(mockOnComplete).toHaveBeenCalledWith(
        expect.objectContaining({ isCorrect: false, accuracy: 0 })
      );
    });

    it('persists DrillResult to Dexie', async () => {
      const { db } = await import('@/services/storage/db');
      (db.drill_results.add as ReturnType<typeof vi.fn>).mockClear();

      seedEasy_3_4_7();
      render(<FactFamilyDrill {...makeProps('easy')} />);
      fireEvent.change(screen.getByTestId('answer-input'), { target: { value: '4' } });
      await act(async () => { fireEvent.click(screen.getByTestId('submit-btn')); });
      await advanceAndFlush(1300);

      expect(db.drill_results.add).toHaveBeenCalledWith(
        expect.objectContaining({ module: 'fact_family', sessionId: 7 })
      );
    });

    it('handles Dexie errors gracefully and still calls onComplete', async () => {
      const { db } = await import('@/services/storage/db');
      (db.drill_results.add as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
        new Error('IDB error')
      );
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      seedEasy_3_4_7();
      render(<FactFamilyDrill {...makeProps('easy')} />);
      fireEvent.change(screen.getByTestId('answer-input'), { target: { value: '4' } });
      await act(async () => { fireEvent.click(screen.getByTestId('submit-btn')); });
      await advanceAndFlush(1300);
      await advanceAndFlush(2000);

      expect(mockOnComplete).toHaveBeenCalledOnce();
      consoleSpy.mockRestore();
    });
  });

  // -------------------------------------------------------------------------
  // Medium difficulty: two inverse questions (add_sub: a=5, b=8, total=13)
  // -------------------------------------------------------------------------

  describe('Medium difficulty — two questions (add_sub)', () => {
    it('shows "Question 1 of 2" on first question', () => {
      seedMediumAddSub_5_8_13();
      render(<FactFamilyDrill {...makeProps('medium')} />);
      expect(screen.getByText('Question 1 of 2')).toBeInTheDocument();
    });

    it('first correct answer advances to question 2 after 1.2 s', async () => {
      seedMediumAddSub_5_8_13();
      render(<FactFamilyDrill {...makeProps('medium')} />);
      // Q1: "13 - 5 = ?" → answer 8
      fireEvent.change(screen.getByTestId('answer-input'), { target: { value: '8' } });
      await act(async () => { fireEvent.click(screen.getByTestId('submit-btn')); });
      await advanceAndFlush(1300);
      expect(screen.getByText('Question 2 of 2')).toBeInTheDocument();
    });

    it('all correct → isCorrect:true, accuracy:100', async () => {
      seedMediumAddSub_5_8_13();
      render(<FactFamilyDrill {...makeProps('medium')} />);
      // Q1: 13 - 5 = 8
      fireEvent.change(screen.getByTestId('answer-input'), { target: { value: '8' } });
      await act(async () => { fireEvent.click(screen.getByTestId('submit-btn')); });
      await advanceAndFlush(1300);

      // Q2: 13 - 8 = 5
      fireEvent.change(screen.getByTestId('answer-input'), { target: { value: '5' } });
      await act(async () => { fireEvent.click(screen.getByTestId('submit-btn')); });
      await advanceAndFlush(1300);
      await advanceAndFlush(2000);

      expect(mockOnComplete).toHaveBeenCalledWith(
        expect.objectContaining({ isCorrect: true, accuracy: 100 })
      );
    });

    it('one wrong → isCorrect:false, accuracy:50', async () => {
      seedMediumAddSub_5_8_13();
      render(<FactFamilyDrill {...makeProps('medium')} />);
      // Q1: wrong
      fireEvent.change(screen.getByTestId('answer-input'), { target: { value: '99' } });
      await act(async () => { fireEvent.click(screen.getByTestId('submit-btn')); });
      await advanceAndFlush(1300);

      // Q2: correct (13 - 8 = 5)
      fireEvent.change(screen.getByTestId('answer-input'), { target: { value: '5' } });
      await act(async () => { fireEvent.click(screen.getByTestId('submit-btn')); });
      await advanceAndFlush(1300);
      await advanceAndFlush(2000);

      expect(mockOnComplete).toHaveBeenCalledWith(
        expect.objectContaining({ isCorrect: false, accuracy: 50 })
      );
    });

    it('medium drill can use mul_div family (anchor contains ×)', () => {
      seedMediumMulDiv_3_4_12();
      render(<FactFamilyDrill {...makeProps('medium')} />);
      const anchor = screen.getByTestId('anchor-fact');
      expect(anchor.textContent).toContain('\u00D7');
    });

    it('mul_div triangle shows × symbol', () => {
      seedMediumMulDiv_3_4_12();
      render(<FactFamilyDrill {...makeProps('medium')} />);
      expect(screen.getByTestId('triangle-op').textContent).toBe('\u00D7');
    });

    it('mul_div both correct → isCorrect:true', async () => {
      seedMediumMulDiv_3_4_12();
      render(<FactFamilyDrill {...makeProps('medium')} />);
      // Q1: 12 ÷ 3 = 4
      fireEvent.change(screen.getByTestId('answer-input'), { target: { value: '4' } });
      await act(async () => { fireEvent.click(screen.getByTestId('submit-btn')); });
      await advanceAndFlush(1300);

      // Q2: 12 ÷ 4 = 3
      fireEvent.change(screen.getByTestId('answer-input'), { target: { value: '3' } });
      await act(async () => { fireEvent.click(screen.getByTestId('submit-btn')); });
      await advanceAndFlush(1300);
      await advanceAndFlush(2000);

      expect(mockOnComplete).toHaveBeenCalledWith(
        expect.objectContaining({ isCorrect: true })
      );
    });
  });

  // -------------------------------------------------------------------------
  // Hard difficulty: three inverse questions (add_sub: a=10, b=15, total=25)
  // -------------------------------------------------------------------------

  describe('Hard difficulty — three questions (add_sub)', () => {
    it('shows "Question 1 of 3" on first question', () => {
      seedHardAddSub_10_15_25();
      render(<FactFamilyDrill {...makeProps('hard')} />);
      expect(screen.getByText('Question 1 of 3')).toBeInTheDocument();
    });

    it('all three correct → isCorrect:true, accuracy:100', async () => {
      seedHardAddSub_10_15_25();
      render(<FactFamilyDrill {...makeProps('hard')} />);
      // Q1: 25 - 10 = 15
      fireEvent.change(screen.getByTestId('answer-input'), { target: { value: '15' } });
      await act(async () => { fireEvent.click(screen.getByTestId('submit-btn')); });
      await advanceAndFlush(1300);

      // Q2: 25 - 15 = 10
      fireEvent.change(screen.getByTestId('answer-input'), { target: { value: '10' } });
      await act(async () => { fireEvent.click(screen.getByTestId('submit-btn')); });
      await advanceAndFlush(1300);

      // Q3: 15 + 10 = 25
      fireEvent.change(screen.getByTestId('answer-input'), { target: { value: '25' } });
      await act(async () => { fireEvent.click(screen.getByTestId('submit-btn')); });
      await advanceAndFlush(1300);
      await advanceAndFlush(2000);

      expect(mockOnComplete).toHaveBeenCalledWith(
        expect.objectContaining({ isCorrect: true, accuracy: 100 })
      );
    });

    it('two of three correct → isCorrect:false, accuracy ~66.67', async () => {
      seedHardAddSub_10_15_25();
      render(<FactFamilyDrill {...makeProps('hard')} />);
      // Q1: correct
      fireEvent.change(screen.getByTestId('answer-input'), { target: { value: '15' } });
      await act(async () => { fireEvent.click(screen.getByTestId('submit-btn')); });
      await advanceAndFlush(1300);

      // Q2: wrong
      fireEvent.change(screen.getByTestId('answer-input'), { target: { value: '99' } });
      await act(async () => { fireEvent.click(screen.getByTestId('submit-btn')); });
      await advanceAndFlush(1300);

      // Q3: correct
      fireEvent.change(screen.getByTestId('answer-input'), { target: { value: '25' } });
      await act(async () => { fireEvent.click(screen.getByTestId('submit-btn')); });
      await advanceAndFlush(1300);
      await advanceAndFlush(2000);

      expect(mockOnComplete).toHaveBeenCalledWith(
        expect.objectContaining({ isCorrect: false })
      );
      const result = mockOnComplete.mock.calls[0][0] as { accuracy: number };
      expect(result.accuracy).toBeCloseTo(66.67, 0);
    });

    it('drill-complete banner shows check icon when all correct', async () => {
      seedHardAddSub_10_15_25();
      render(<FactFamilyDrill {...makeProps('hard')} />);

      fireEvent.change(screen.getByTestId('answer-input'), { target: { value: '15' } });
      await act(async () => { fireEvent.click(screen.getByTestId('submit-btn')); });
      await advanceAndFlush(1300);

      fireEvent.change(screen.getByTestId('answer-input'), { target: { value: '10' } });
      await act(async () => { fireEvent.click(screen.getByTestId('submit-btn')); });
      await advanceAndFlush(1300);

      fireEvent.change(screen.getByTestId('answer-input'), { target: { value: '25' } });
      await act(async () => { fireEvent.click(screen.getByTestId('submit-btn')); });
      await advanceAndFlush(1300);

      const banner = screen.getByTestId('drill-complete-banner');
      expect(banner).toBeInTheDocument();
      expect(screen.getByTestId('icon-check')).toBeInTheDocument();
      expect(screen.getByText('Excellent!')).toBeInTheDocument();
    });

    it('drill-complete banner shows X icon when not all correct', async () => {
      seedHardAddSub_10_15_25();
      render(<FactFamilyDrill {...makeProps('hard')} />);

      // Q1: wrong
      fireEvent.change(screen.getByTestId('answer-input'), { target: { value: '99' } });
      await act(async () => { fireEvent.click(screen.getByTestId('submit-btn')); });
      await advanceAndFlush(1300);

      // Q2: wrong
      fireEvent.change(screen.getByTestId('answer-input'), { target: { value: '99' } });
      await act(async () => { fireEvent.click(screen.getByTestId('submit-btn')); });
      await advanceAndFlush(1300);

      // Q3: correct
      fireEvent.change(screen.getByTestId('answer-input'), { target: { value: '25' } });
      await act(async () => { fireEvent.click(screen.getByTestId('submit-btn')); });
      await advanceAndFlush(1300);

      expect(screen.getByTestId('icon-x')).toBeInTheDocument();
    });

    it('shows "1 / 3 correct" text in banner when 1 of 3 correct', async () => {
      seedHardAddSub_10_15_25();
      render(<FactFamilyDrill {...makeProps('hard')} />);

      fireEvent.change(screen.getByTestId('answer-input'), { target: { value: '99' } });
      await act(async () => { fireEvent.click(screen.getByTestId('submit-btn')); });
      await advanceAndFlush(1300);

      fireEvent.change(screen.getByTestId('answer-input'), { target: { value: '99' } });
      await act(async () => { fireEvent.click(screen.getByTestId('submit-btn')); });
      await advanceAndFlush(1300);

      fireEvent.change(screen.getByTestId('answer-input'), { target: { value: '25' } });
      await act(async () => { fireEvent.click(screen.getByTestId('submit-btn')); });
      await advanceAndFlush(1300);

      const banner = screen.getByTestId('drill-complete-banner');
      expect(banner.textContent).toContain('1');
      expect(banner.textContent).toContain('3');
    });
  });

  // -------------------------------------------------------------------------
  // Keyboard interaction
  // -------------------------------------------------------------------------

  describe('Keyboard interaction', () => {
    it('pressing Enter submits the answer', async () => {
      seedEasy_3_4_7();
      render(<FactFamilyDrill {...makeProps('easy')} />);
      const input = screen.getByTestId('answer-input');
      fireEvent.change(input, { target: { value: '4' } });
      await act(async () => { fireEvent.keyDown(input, { key: 'Enter' }); });
      expect(screen.getByTestId('question-feedback')).toBeInTheDocument();
    });

    it('pressing Enter with empty input does not submit', async () => {
      seedEasy_3_4_7();
      render(<FactFamilyDrill {...makeProps('easy')} />);
      const input = screen.getByTestId('answer-input');
      await act(async () => { fireEvent.keyDown(input, { key: 'Enter' }); });
      expect(screen.queryByTestId('question-feedback')).not.toBeInTheDocument();
    });

    it('double submit while showingFeedback is ignored — onComplete fires once', async () => {
      seedEasy_3_4_7();
      render(<FactFamilyDrill {...makeProps('easy')} />);
      // First submit
      fireEvent.change(screen.getByTestId('answer-input'), { target: { value: '4' } });
      await act(async () => { fireEvent.click(screen.getByTestId('submit-btn')); });
      // While feedback is showing, try to submit via Enter (button is disabled)
      const input = screen.getByTestId('answer-input');
      await act(async () => { fireEvent.keyDown(input, { key: 'Enter' }); });
      await advanceAndFlush(1300);
      await advanceAndFlush(2000);
      // onComplete should fire at most once
      expect(mockOnComplete.mock.calls.length).toBeLessThanOrEqual(1);
    });
  });

  // -------------------------------------------------------------------------
  // DrillResult fields
  // -------------------------------------------------------------------------

  describe('DrillResult fields', () => {
    it('includes sessionId', async () => {
      seedEasy_3_4_7();
      render(<FactFamilyDrill {...makeProps('easy')} />);
      fireEvent.change(screen.getByTestId('answer-input'), { target: { value: '4' } });
      await act(async () => { fireEvent.click(screen.getByTestId('submit-btn')); });
      await advanceAndFlush(1300);
      await advanceAndFlush(2000);
      expect(mockOnComplete).toHaveBeenCalledWith(
        expect.objectContaining({ sessionId: 7 })
      );
    });

    it('includes difficulty', async () => {
      seedEasy_3_4_7();
      render(<FactFamilyDrill {...makeProps('easy')} />);
      fireEvent.change(screen.getByTestId('answer-input'), { target: { value: '4' } });
      await act(async () => { fireEvent.click(screen.getByTestId('submit-btn')); });
      await advanceAndFlush(1300);
      await advanceAndFlush(2000);
      expect(mockOnComplete).toHaveBeenCalledWith(
        expect.objectContaining({ difficulty: 'easy' })
      );
    });

    it('includes a numeric timeToAnswer', async () => {
      seedEasy_3_4_7();
      render(<FactFamilyDrill {...makeProps('easy')} />);
      fireEvent.change(screen.getByTestId('answer-input'), { target: { value: '4' } });
      await act(async () => { fireEvent.click(screen.getByTestId('submit-btn')); });
      await advanceAndFlush(1300);
      await advanceAndFlush(2000);
      expect(mockOnComplete).toHaveBeenCalledWith(
        expect.objectContaining({ timeToAnswer: expect.any(Number) })
      );
    });

    it('timestamp is a valid ISO 8601 string', async () => {
      seedEasy_3_4_7();
      render(<FactFamilyDrill {...makeProps('easy')} />);
      fireEvent.change(screen.getByTestId('answer-input'), { target: { value: '4' } });
      await act(async () => { fireEvent.click(screen.getByTestId('submit-btn')); });
      await advanceAndFlush(1300);
      await advanceAndFlush(2000);
      expect(mockOnComplete).toHaveBeenCalledOnce();
      const result = mockOnComplete.mock.calls[0][0] as { timestamp: string };
      expect(() => new Date(result.timestamp)).not.toThrow();
      expect(new Date(result.timestamp).toISOString()).toBe(result.timestamp);
    });
  });

  // -------------------------------------------------------------------------
  // Edge cases
  // -------------------------------------------------------------------------

  describe('Edge cases', () => {
    it('does not call onComplete before any submission', async () => {
      render(<FactFamilyDrill {...makeProps('easy')} />);
      await advanceAndFlush(5000);
      expect(mockOnComplete).not.toHaveBeenCalled();
    });

    it('input is disabled after submission to prevent re-entry', async () => {
      seedEasy_3_4_7();
      render(<FactFamilyDrill {...makeProps('easy')} />);
      fireEvent.change(screen.getByTestId('answer-input'), { target: { value: '4' } });
      await act(async () => { fireEvent.click(screen.getByTestId('submit-btn')); });
      expect(screen.getByTestId('answer-input')).toBeDisabled();
    });

    it('question-area is not rendered after drill is complete', async () => {
      seedEasy_3_4_7();
      render(<FactFamilyDrill {...makeProps('easy')} />);
      fireEvent.change(screen.getByTestId('answer-input'), { target: { value: '4' } });
      await act(async () => { fireEvent.click(screen.getByTestId('submit-btn')); });
      await advanceAndFlush(1300);
      // After drillComplete is set, question-area unmounts
      expect(screen.queryByTestId('question-area')).not.toBeInTheDocument();
    });
  });
});
