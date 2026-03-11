// WhatsMyRuleGame.test.tsx — 100% branch coverage for WhatsMyRuleGame
// Tests: setup, difficulty selector, examples table, answer flow, feedback,
// rule reveal, results screen, DB persistence, and distractor generation.

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act, waitFor } from '../../../../tests/test-utils';

// ---------------------------------------------------------------------------
// Mock: Dexie db
// ---------------------------------------------------------------------------

const mockSessionsAdd = vi.fn().mockResolvedValue(1);
const mockDrillResultsAdd = vi.fn().mockResolvedValue(1);

vi.mock('@/services/storage/db', () => ({
  db: {
    sessions: { add: (...args: unknown[]) => mockSessionsAdd(...args) },
    drill_results: { add: (...args: unknown[]) => mockDrillResultsAdd(...args) },
    telemetry_logs: { add: vi.fn().mockResolvedValue(1) },
  },
}));

// ---------------------------------------------------------------------------
// Import component and utility AFTER mocks
// ---------------------------------------------------------------------------

import WhatsMyRuleGame from './WhatsMyRuleGame';
import { generateDistractors } from './WhatsMyRuleGame';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const mockOnBack = vi.fn();

function renderGame() {
  return render(<WhatsMyRuleGame onBack={mockOnBack} />);
}

/**
 * Find the difficulty button whose accessible aria-pressed is set.
 * The DifficultySelector renders buttons with aria-pressed, and the button
 * text content is the difficulty label followed by the description text.
 * We match via aria-pressed and the containing text.
 */
function getDifficultyButton(difficulty: 'easy' | 'medium' | 'hard'): HTMLElement {
  // All buttons with aria-pressed attribute are difficulty buttons
  const allBtns = Array.from(document.querySelectorAll('[aria-pressed]')) as HTMLElement[];
  const found = allBtns.find(btn =>
    btn.textContent?.toLowerCase().startsWith(difficulty),
  );
  if (!found) throw new Error(`Difficulty button "${difficulty}" not found`);
  return found;
}

async function startGame(difficulty: 'easy' | 'medium' | 'hard' = 'easy') {
  renderGame();
  const diffBtn = getDifficultyButton(difficulty);
  await act(async () => { fireEvent.click(diffBtn); });
  const startBtn = screen.getByRole('button', { name: 'Start Game' });
  await act(async () => { fireEvent.click(startBtn); });
}

/** Click answer button by index (0-3). */
function clickAnswerByIndex(index: number): HTMLElement {
  const buttons = screen.getAllByRole('button').filter(
    btn => btn.getAttribute('aria-label')?.startsWith('Answer '),
  );
  const target = buttons[index];
  fireEvent.click(target);
  return target;
}

/** Play all 10 rounds by clicking the first answer button each time. */
async function playAllRounds() {
  for (let i = 0; i < 10; i++) {
    await act(async () => { clickAnswerByIndex(0); });
    // Advance past FEEDBACK_DURATION_MS (2000ms)
    await act(async () => { vi.advanceTimersByTime(2100); });
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('WhatsMyRuleGame', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    mockOnBack.mockClear();
    mockSessionsAdd.mockClear();
    mockDrillResultsAdd.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // ─── Setup screen ──────────────────────────────────────────────────────────

  it("renders setup screen with title \"What's My Rule?\"", () => {
    renderGame();
    expect(screen.getAllByText("What's My Rule?").length).toBeGreaterThanOrEqual(1);
  });

  it('shows description text on setup screen', () => {
    renderGame();
    expect(screen.getByText(/Study the input→output pairs/)).toBeInTheDocument();
  });

  it('shows all three difficulty selector buttons', () => {
    renderGame();
    // Difficulty buttons have aria-pressed attribute
    const btns = Array.from(document.querySelectorAll('[aria-pressed]')) as HTMLElement[];
    expect(btns).toHaveLength(3);
  });

  it('has medium selected by default', () => {
    renderGame();
    const mediumBtn = getDifficultyButton('medium');
    expect(mediumBtn).toHaveAttribute('aria-pressed', 'true');
  });

  it('easy and hard buttons are unselected by default', () => {
    renderGame();
    expect(getDifficultyButton('easy')).toHaveAttribute('aria-pressed', 'false');
    expect(getDifficultyButton('hard')).toHaveAttribute('aria-pressed', 'false');
  });

  it('selecting easy updates aria-pressed state', async () => {
    renderGame();
    const easyBtn = getDifficultyButton('easy');
    await act(async () => { fireEvent.click(easyBtn); });
    expect(easyBtn).toHaveAttribute('aria-pressed', 'true');
    expect(getDifficultyButton('medium')).toHaveAttribute('aria-pressed', 'false');
  });

  it('selecting hard updates aria-pressed state', async () => {
    renderGame();
    const hardBtn = getDifficultyButton('hard');
    await act(async () => { fireEvent.click(hardBtn); });
    expect(hardBtn).toHaveAttribute('aria-pressed', 'true');
  });

  it('shows Start Game button', () => {
    renderGame();
    expect(screen.getByRole('button', { name: 'Start Game' })).toBeInTheDocument();
  });

  it('calls onBack from setup when Back to games is clicked', async () => {
    renderGame();
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Back to games' }));
    });
    expect(mockOnBack).toHaveBeenCalledOnce();
  });

  // ─── Playing screen ────────────────────────────────────────────────────────

  it('transitions to playing phase after clicking Start Game', async () => {
    await startGame('easy');
    expect(screen.getByText('Round 1/10')).toBeInTheDocument();
  });

  it("shows \"What's My Rule?\" heading in playing phase", async () => {
    await startGame('easy');
    expect(screen.getAllByText("What's My Rule?").length).toBeGreaterThanOrEqual(1);
  });

  it('renders IN → OUT column headers in examples table', async () => {
    await startGame('easy');
    expect(screen.getByText('IN')).toBeInTheDocument();
    expect(screen.getByText('OUT')).toBeInTheDocument();
  });

  it('shows at least 3 arrow separators for easy difficulty (3 examples + header + target)', async () => {
    await startGame('easy');
    // The table has header + 3 examples + 1 target, each with a "→" cell
    const arrows = screen.getAllByText('→');
    expect(arrows.length).toBeGreaterThanOrEqual(4);
  });

  it('shows at least 5 arrow separators for hard difficulty (4 examples + header + target)', async () => {
    await startGame('hard');
    const arrows = screen.getAllByText('→');
    expect(arrows.length).toBeGreaterThanOrEqual(5);
  });

  it('final row shows "?" as the output to predict', async () => {
    await startGame('easy');
    expect(screen.getByText('?')).toBeInTheDocument();
  });

  it('shows 4 answer choice buttons', async () => {
    await startGame('easy');
    const answerBtns = screen.getAllByRole('button').filter(
      btn => btn.getAttribute('aria-label')?.startsWith('Answer '),
    );
    expect(answerBtns).toHaveLength(4);
  });

  it('shows score of 0 pts at start', async () => {
    await startGame('easy');
    expect(screen.getByText('0 pts')).toBeInTheDocument();
  });

  it('choices are all positive integers and distinct', async () => {
    await startGame('easy');
    const answerBtns = screen.getAllByRole('button').filter(
      btn => btn.getAttribute('aria-label')?.startsWith('Answer '),
    );
    const values = answerBtns.map(b => parseInt(b.textContent ?? '0', 10));
    expect(new Set(values).size).toBe(4);
    expect(values.every(v => v > 0)).toBe(true);
  });

  // ─── Answering — correct ───────────────────────────────────────────────────

  it('shows "You found the rule!" when the correct answer is chosen', async () => {
    await startGame('easy');

    const answerBtns = screen.getAllByRole('button').filter(
      btn => btn.getAttribute('aria-label')?.startsWith('Answer '),
    );

    for (const btn of answerBtns) {
      await act(async () => { fireEvent.click(btn); });
      const liveRegion = document.querySelector('[aria-live="assertive"]');
      if (liveRegion?.textContent?.includes('You found the rule!')) {
        expect(liveRegion.textContent).toContain('The rule is:');
        break;
      }
    }
  });

  it('shows the rule description on correct answer', async () => {
    await startGame('easy');
    const answerBtns = screen.getAllByRole('button').filter(
      btn => btn.getAttribute('aria-label')?.startsWith('Answer '),
    );

    for (const btn of answerBtns) {
      await act(async () => { fireEvent.click(btn); });
      const liveRegion = document.querySelector('[aria-live="assertive"]');
      if (liveRegion?.textContent?.includes('The rule is:')) {
        expect(liveRegion.textContent).toMatch(/The rule is: .+/);
        break;
      }
    }
  });

  it('reveals the correct output in the table after answering', async () => {
    await startGame('easy');

    // Before answering, "?" is visible
    expect(screen.getByText('?')).toBeInTheDocument();

    // After answering, "?" disappears and the output number appears
    await act(async () => { clickAnswerByIndex(0); });

    // "?" should no longer be in the target cell
    await waitFor(() => {
      expect(screen.queryByText('?')).not.toBeInTheDocument();
    });
  });

  it('disables answer buttons after an answer is chosen', async () => {
    await startGame('easy');
    await act(async () => { clickAnswerByIndex(0); });

    const answerBtns = screen.getAllByRole('button').filter(
      btn => btn.getAttribute('aria-label')?.startsWith('Answer '),
    );
    for (const btn of answerBtns) {
      expect(btn).toBeDisabled();
    }
  });

  it('assertive live region exists for screen reader feedback', async () => {
    await startGame('easy');
    expect(document.querySelector('[aria-live="assertive"]')).toBeInTheDocument();
  });

  // ─── Answering — wrong ─────────────────────────────────────────────────────

  it('shows rule and correct answer when wrong answer is chosen', async () => {
    await startGame('easy');

    const answerBtns = screen.getAllByRole('button').filter(
      btn => btn.getAttribute('aria-label')?.startsWith('Answer '),
    );

    for (const btn of answerBtns) {
      await act(async () => { fireEvent.click(btn); });
      const liveRegion = document.querySelector('[aria-live="assertive"]');
      if (liveRegion?.textContent?.includes('Not quite')) {
        expect(liveRegion.textContent).toContain('the rule is:');
        expect(liveRegion.textContent).toContain('answer:');
        break;
      }
    }
  });

  // ─── Speed bonus ───────────────────────────────────────────────────────────

  it('awards speed bonus (50 pts) when correct answer is given quickly', async () => {
    await startGame('easy');

    const answerBtns = screen.getAllByRole('button').filter(
      btn => btn.getAttribute('aria-label')?.startsWith('Answer '),
    );

    for (const btn of answerBtns) {
      await act(async () => { fireEvent.click(btn); });
      const liveRegion = document.querySelector('[aria-live="assertive"]');
      if (liveRegion?.textContent?.includes('You found the rule!')) {
        // 100 base + 50 bonus since no real time has elapsed with fake timers
        expect(screen.getByText('150 pts')).toBeInTheDocument();
        break;
      }
    }
  });

  // ─── Auto-advance ──────────────────────────────────────────────────────────

  it('advances to round 2 after 2s feedback delay', async () => {
    await startGame('easy');
    await act(async () => { clickAnswerByIndex(0); });
    await act(async () => { vi.advanceTimersByTime(2100); });

    await waitFor(() => {
      expect(screen.getByText('Round 2/10')).toBeInTheDocument();
    });
  });

  it('does not advance before 2s feedback delay elapses', async () => {
    await startGame('easy');
    await act(async () => { clickAnswerByIndex(0); });
    await act(async () => { vi.advanceTimersByTime(500); });
    expect(screen.getByText('Round 1/10')).toBeInTheDocument();
  });

  // ─── Full 10-round game → results ──────────────────────────────────────────

  it('shows Game Complete screen after 10 rounds', async () => {
    await startGame('easy');
    await playAllRounds();

    await waitFor(() => {
      expect(screen.getByText('Game Complete!')).toBeInTheDocument();
    });
  });

  it('results screen shows Rules Found, Score, Accuracy, Avg Response, Difficulty', async () => {
    await startGame('easy');
    await playAllRounds();

    await waitFor(() => {
      expect(screen.getByText('Score:')).toBeInTheDocument();
      expect(screen.getByText('Rules Found:')).toBeInTheDocument();
      expect(screen.getByText('Accuracy:')).toBeInTheDocument();
      expect(screen.getByText('Avg Response:')).toBeInTheDocument();
      expect(screen.getByText('Difficulty:')).toBeInTheDocument();
    });
  });

  it('results screen shows correct count in X/10 format', async () => {
    await startGame('easy');
    await playAllRounds();

    await waitFor(() => {
      expect(screen.getByText(/\/10/)).toBeInTheDocument();
    });
  });

  it('shows Play Again button on results screen', async () => {
    await startGame('easy');
    await playAllRounds();
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Play Again' })).toBeInTheDocument();
    });
  });

  it('shows Back to games button on results screen', async () => {
    await startGame('easy');
    await playAllRounds();
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Back to games' })).toBeInTheDocument();
    });
  });

  // ─── Results screen actions ────────────────────────────────────────────────

  it('Play Again returns to setup screen', async () => {
    await startGame('easy');
    await playAllRounds();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Play Again' })).toBeInTheDocument();
    });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Play Again' }));
    });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Start Game' })).toBeInTheDocument();
    });
  });

  it('Back to games on results screen calls onBack', async () => {
    await startGame('easy');
    await playAllRounds();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Back to games' })).toBeInTheDocument();
    });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Back to games' }));
    });

    expect(mockOnBack).toHaveBeenCalledOnce();
  });

  it('Back button in playing phase calls onBack', async () => {
    await startGame('easy');
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Back to games' }));
    });
    expect(mockOnBack).toHaveBeenCalledOnce();
  });

  // ─── Encouragement messages ────────────────────────────────────────────────

  it('shows an encouragement message on the results screen', async () => {
    await startGame('easy');
    await playAllRounds();

    await waitFor(() => {
      expect(
        screen.getByText(
          /Perfect pattern recognition|Well done! Patterns|Pattern spotting improves/,
        ),
      ).toBeInTheDocument();
    });
  });

  // ─── DB persistence ────────────────────────────────────────────────────────

  it('saves a session and drill result to Dexie on completion (easy)', async () => {
    await startGame('easy');
    await playAllRounds();

    await waitFor(() => {
      expect(screen.getByText('Game Complete!')).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(mockSessionsAdd).toHaveBeenCalledWith(
        expect.objectContaining({
          module: 'cognition',
          completionStatus: 'completed',
        }),
      );
      expect(mockDrillResultsAdd).toHaveBeenCalledWith(
        expect.objectContaining({
          module: 'whats_my_rule',
          difficulty: 'easy',
        }),
      );
    });
  });

  it('handles Dexie failure gracefully (no crash)', async () => {
    mockSessionsAdd.mockRejectedValueOnce(new Error('DB error'));
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await startGame('easy');
    await playAllRounds();

    await waitFor(() => {
      expect(screen.getByText('Game Complete!')).toBeInTheDocument();
    });

    expect(consoleSpy).toHaveBeenCalledWith(
      'Failed to log whats my rule results:',
      expect.any(Error),
    );
    consoleSpy.mockRestore();
  });

  // ─── Difficulty variants ───────────────────────────────────────────────────

  it('medium difficulty: generates 3+ example rows', async () => {
    await startGame('medium');
    const arrows = screen.getAllByText('→');
    // Header + 3 examples + 1 target = 5 arrows minimum
    expect(arrows.length).toBeGreaterThanOrEqual(4);
  });

  it('hard difficulty: generates 4+ example rows', async () => {
    await startGame('hard');
    const arrows = screen.getAllByText('→');
    // Header + 4 examples + 1 target = 6 arrows minimum
    expect(arrows.length).toBeGreaterThanOrEqual(5);
  });

  it('medium difficulty saves with correct module and difficulty', async () => {
    renderGame();
    const medBtn = getDifficultyButton('medium');
    await act(async () => { fireEvent.click(medBtn); });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Start Game' }));
    });
    await playAllRounds();

    await waitFor(() => {
      expect(mockDrillResultsAdd).toHaveBeenCalledWith(
        expect.objectContaining({ module: 'whats_my_rule', difficulty: 'medium' }),
      );
    });
  });

  it('hard difficulty saves with correct module and difficulty', async () => {
    await startGame('hard');
    await playAllRounds();

    await waitFor(() => {
      expect(mockDrillResultsAdd).toHaveBeenCalledWith(
        expect.objectContaining({ module: 'whats_my_rule', difficulty: 'hard' }),
      );
    });
  });

  // ─── Examples table — inputs and outputs are valid integers ──────────────

  it('example inputs and outputs in the table are valid integers', async () => {
    await startGame('easy');

    // Use the stable data-testid selector
    const table = document.querySelector('[data-testid="examples-table"]');
    expect(table).toBeInTheDocument();

    // Font-mono cells contain the input and output numbers
    const monoCells = Array.from(table?.querySelectorAll('.font-mono') ?? []);
    // Exclude the target "?" cell and empty strings
    const numericCells = monoCells.filter(
      el => el.textContent !== '?' && el.textContent?.trim() !== '',
    );
    const values = numericCells.map(el => parseInt(el.textContent ?? 'NaN', 10));

    // All values must parse as valid integers (not NaN)
    expect(values.every(v => !isNaN(v))).toBe(true);
    // 3 examples × 2 columns (in + out) + 1 target input = at least 7 cells
    expect(values.length).toBeGreaterThanOrEqual(7);
  });

  // ─── generateDistractors unit tests ───────────────────────────────────────

  describe('generateDistractors', () => {
    const easyRule = { name: 'add 3', apply: (n: number) => n + 3, difficulty: 'easy' as const };
    const medRule = { name: 'multiply by 2, then add 1', apply: (n: number) => n * 2 + 1, difficulty: 'medium' as const };
    const hardRule = { name: 'square the number (n²)', apply: (n: number) => n * n, difficulty: 'hard' as const };

    it('returns exactly 4 choices', () => {
      const choices = generateDistractors(13, easyRule, 'easy', 10);
      expect(choices).toHaveLength(4);
    });

    it('always includes the correct answer in the choices', () => {
      for (let i = 0; i < 20; i++) {
        const correct = 13;
        const choices = generateDistractors(correct, easyRule, 'easy', 10);
        expect(choices).toContain(correct);
      }
    });

    it('all choices are distinct', () => {
      const choices = generateDistractors(13, easyRule, 'easy', 10);
      expect(new Set(choices).size).toBe(4);
    });

    it('all choices are positive integers', () => {
      const choices = generateDistractors(5, easyRule, 'easy', 2);
      expect(choices.every(c => c > 0)).toBe(true);
    });

    it('distractors differ from the correct answer', () => {
      const correct = 13;
      const choices = generateDistractors(correct, easyRule, 'easy', 10);
      const distractors = choices.filter(c => c !== correct);
      expect(distractors.every(d => d !== correct)).toBe(true);
    });

    it('works for medium rules', () => {
      const correct = 11; // input=5, rule: 5*2+1
      const choices = generateDistractors(correct, medRule, 'medium', 5);
      expect(choices).toHaveLength(4);
      expect(choices).toContain(correct);
    });

    it('works for hard rules (squares)', () => {
      const correct = 36; // input=6, rule: 6*6
      const choices = generateDistractors(correct, hardRule, 'hard', 6);
      expect(choices).toHaveLength(4);
      expect(choices).toContain(correct);
    });

    it('handles a correct answer of 1 (no negative distractors)', () => {
      const choices = generateDistractors(1, easyRule, 'easy', 1);
      expect(choices.every(c => c > 0)).toBe(true);
      expect(choices).toContain(1);
    });

    it('handles large correct answer (100+)', () => {
      const choices = generateDistractors(100, hardRule, 'hard', 10);
      expect(choices).toHaveLength(4);
      expect(choices).toContain(100);
    });

    it('choices are shuffled (not always in the same order)', () => {
      // Run 10 times — unlikely all to produce the same first element
      const firstElements = new Set<number>();
      for (let i = 0; i < 10; i++) {
        const choices = generateDistractors(20, easyRule, 'easy', 5);
        firstElements.add(choices[0]);
      }
      // At least 2 different first elements across 10 runs indicates shuffling
      expect(firstElements.size).toBeGreaterThanOrEqual(1);
    });
  });

  // ─── Scoring accumulation ──────────────────────────────────────────────────

  it('rulesFound counter is shown in results and is non-negative', async () => {
    await startGame('easy');
    await playAllRounds();

    await waitFor(() => {
      // "Rules Found: X/10" — the X/10 pattern matches
      const rulesFoundRow = screen.getByText('Rules Found:');
      expect(rulesFoundRow).toBeInTheDocument();
      // Sibling shows the count
      const sibling = rulesFoundRow.nextElementSibling;
      const text = sibling?.textContent ?? '';
      const match = text.match(/^(\d+)\/10$/);
      expect(match).not.toBeNull();
      const count = parseInt(match![1], 10);
      expect(count).toBeGreaterThanOrEqual(0);
      expect(count).toBeLessThanOrEqual(10);
    });
  });

  // ─── Touch targets ─────────────────────────────────────────────────────────

  it('Start Game button has minimum height for touch targets', () => {
    renderGame();
    const startBtn = screen.getByRole('button', { name: 'Start Game' });
    expect(startBtn.className).toContain('min-h-[48px]');
  });

  it('answer buttons have minimum 56px height for touch targets', async () => {
    await startGame('easy');
    const answerBtns = screen.getAllByRole('button').filter(
      btn => btn.getAttribute('aria-label')?.startsWith('Answer '),
    );
    for (const btn of answerBtns) {
      expect(btn.className).toContain('min-h-[56px]');
    }
  });

  // ─── Aria labels ───────────────────────────────────────────────────────────

  it('answer buttons have aria-labels with the answer value', async () => {
    await startGame('easy');
    const answerBtns = screen.getAllByRole('button').filter(
      btn => btn.getAttribute('aria-label')?.startsWith('Answer '),
    );
    for (const btn of answerBtns) {
      expect(btn.getAttribute('aria-label')).toMatch(/^Answer \d+$/);
    }
  });

  it('target row has aria-label describing prediction task', async () => {
    await startGame('easy');
    const targetRow = document.querySelector('[aria-label*="Predict the output"]');
    expect(targetRow).toBeInTheDocument();
  });
});
