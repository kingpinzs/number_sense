// SpatialFlipGame.test.tsx - Component tests for Spatial Flip mini-game
// Story 6.4: Tests for gameplay, feedback, timer, accessibility, and telemetry

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, act } from '../../../../tests/test-utils';
import userEvent from '@testing-library/user-event';
import SpatialFlipGame, { getChoiceStyle } from './SpatialFlipGame';

// Mock framer-motion — capture animation props as data attributes for testing
let mockReducedMotion = false;
vi.mock('framer-motion', async () => {
  const React = await import('react');
  return {
    motion: {
      button: React.forwardRef(({
        children,
        animate,
        transition,
        whileTap,
        ...props
      }: any, ref: any) => (
        <button
          ref={ref}
          data-animate={JSON.stringify(animate)}
          data-transition={JSON.stringify(transition)}
          data-whiletap={JSON.stringify(whileTap)}
          {...props}
        >{children}</button>
      )),
      div: ({
        children,
        animate: _a,
        transition: _t,
        ...props
      }: any) => <div {...props}>{children}</div>,
    },
    useReducedMotion: () => mockReducedMotion,
    AnimatePresence: ({ children }: any) => children,
  };
});

// Mock Dexie db
const mockAdd = vi.fn().mockResolvedValue(1);
vi.mock('@/services/storage/db', () => ({
  db: {
    telemetry_logs: {
      add: (...args: any[]) => mockAdd(...args),
    },
  },
}));

// Mock localStorage
const mockStorage: Record<string, string> = {};
vi.spyOn(Storage.prototype, 'getItem').mockImplementation(
  (key) => mockStorage[key] ?? null
);
vi.spyOn(Storage.prototype, 'setItem').mockImplementation(
  (key, val) => {
    mockStorage[key] = val;
  }
);

// Mock spatialFlipUtils to return predictable questions
let mockQuestionCallCount = 0;
vi.mock('../utils/spatialFlipUtils', async () => {
  const actual = await vi.importActual('../utils/spatialFlipUtils');
  return {
    ...actual,
    generateQuestion: () => {
      mockQuestionCallCount++;
      return {
        referenceShape: 'lshape',
        choices: [
          { id: 0, shape: 'lshape', rotationDegrees: 90, isMirrored: false, isCorrect: false },
          { id: 1, shape: 'lshape', rotationDegrees: 180, isMirrored: false, isCorrect: true },
          { id: 2, shape: 'tshape', rotationDegrees: 270, isMirrored: false, isCorrect: false },
          { id: 3, shape: 'lshape', rotationDegrees: 45, isMirrored: true, isCorrect: false },
        ],
        correctIndex: 1,
      };
    },
  };
});

const mockOnBack = vi.fn();

function renderGame() {
  return render(<SpatialFlipGame onBack={mockOnBack} />);
}

describe('SpatialFlipGame', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockReducedMotion = false;
    mockQuestionCallCount = 0;
    Object.keys(mockStorage).forEach(key => delete mockStorage[key]);
  });

  // Test 1: Game renders reference shape and 4 choices
  it('renders reference shape and 4 choice buttons', () => {
    renderGame();

    expect(screen.getByText('Reference')).toBeInTheDocument();
    expect(screen.getByLabelText(/Reference shape:/)).toBeInTheDocument();

    // 4 choices labeled A, B, C, D
    expect(screen.getByText('A')).toBeInTheDocument();
    expect(screen.getByText('B')).toBeInTheDocument();
    expect(screen.getByText('C')).toBeInTheDocument();
    expect(screen.getByText('D')).toBeInTheDocument();
  });

  // Test 2: Shows question progress
  it('shows question progress "Question 1 of 10"', () => {
    renderGame();
    expect(screen.getByText('Question 1 of 10')).toBeInTheDocument();
  });

  // Test 3: Shows difficulty tabs
  it('renders difficulty selector tabs', () => {
    renderGame();
    expect(screen.getByText('easy')).toBeInTheDocument();
    expect(screen.getByText('medium')).toBeInTheDocument();
    expect(screen.getByText('hard')).toBeInTheDocument();
  });

  // Test 4: Medium tab is selected by default
  it('has medium difficulty selected by default', () => {
    renderGame();
    const mediumBtn = screen.getByText('medium');
    expect(mediumBtn).toHaveAttribute('aria-pressed', 'true');
  });

  // Test 5: Choosing correct answer shows green feedback
  it('shows green feedback when correct choice is selected', async () => {
    renderGame();
    const user = userEvent.setup();

    // Choice B (index 1) is correct
    const choiceB = screen.getByLabelText(/Choice B:/);
    await user.click(choiceB);

    // Verify aria-live announces correct
    await waitFor(() => {
      const liveRegion = document.querySelector('[aria-live="assertive"]');
      expect(liveRegion?.textContent).toContain('Correct!');
    });
  });

  // Test 6: Choosing incorrect answer shows gold feedback
  it('shows incorrect feedback when wrong choice is selected', async () => {
    renderGame();
    const user = userEvent.setup();

    // Choice A (index 0) is incorrect
    const choiceA = screen.getByLabelText(/Choice A:/);
    await user.click(choiceA);

    await waitFor(() => {
      const liveRegion = document.querySelector('[aria-live="assertive"]');
      expect(liveRegion?.textContent).toContain('Incorrect');
    });
  });

  // Test 7: Cannot click another choice while feedback is showing
  it('disables choices while feedback is showing', async () => {
    renderGame();
    const user = userEvent.setup();

    const choiceA = screen.getByLabelText(/Choice A:/);
    await user.click(choiceA);

    // All choice buttons should now be disabled
    const allChoiceButtons = screen.getAllByRole('button').filter(
      btn => btn.getAttribute('aria-label')?.startsWith('Choice')
    );
    for (const btn of allChoiceButtons) {
      expect(btn).toBeDisabled();
    }
  });

  // Test 8: Auto-advance to next question after 1.5s
  it('advances to next question after auto-advance delay', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    try {
      renderGame();

      // Click a choice
      const choiceA = screen.getByLabelText(/Choice A:/);
      await act(async () => {
        choiceA.click();
      });

      // Advance past 1.5s auto-advance
      await act(async () => {
        vi.advanceTimersByTime(1600);
      });

      // Should now show Question 2
      await waitFor(() => {
        expect(screen.getByText('Question 2 of 10')).toBeInTheDocument();
      });
    } finally {
      vi.useRealTimers();
    }
  });

  // Test 9: Completion modal appears after 10 questions
  it('shows completion modal after 10 questions', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    try {
      renderGame();

      // Answer 10 questions
      for (let i = 0; i < 10; i++) {
        const choiceB = screen.getByLabelText(/Choice B:/);
        await act(async () => {
          choiceB.click();
        });
        await act(async () => {
          vi.advanceTimersByTime(1600);
        });
      }

      // Completion modal should appear
      await waitFor(() => {
        expect(screen.getByText('Game Complete!')).toBeInTheDocument();
      });
    } finally {
      vi.useRealTimers();
    }
  });

  // Test 10: Completion modal shows correct stats
  it('shows correct stats in completion modal', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    try {
      renderGame();

      // Answer all 10 questions correctly (choice B is correct)
      for (let i = 0; i < 10; i++) {
        const choiceB = screen.getByLabelText(/Choice B:/);
        await act(async () => {
          choiceB.click();
        });
        await act(async () => {
          vi.advanceTimersByTime(1600);
        });
      }

      await waitFor(() => {
        expect(screen.getByText(/10\/10 correct \(100%\)/)).toBeInTheDocument();
      });
      expect(screen.getByText(/Avg response time:/)).toBeInTheDocument();
      expect(screen.getByText('Excellent spatial reasoning!')).toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  // Test 11: Telemetry logged on completion
  it('logs telemetry on game completion', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    try {
      renderGame();

      for (let i = 0; i < 10; i++) {
        const choiceB = screen.getByLabelText(/Choice B:/);
        await act(async () => {
          choiceB.click();
        });
        await act(async () => {
          vi.advanceTimersByTime(1600);
        });
      }

      await waitFor(() => {
        expect(mockAdd).toHaveBeenCalledWith(
          expect.objectContaining({
            event: 'cognition_game_complete',
            module: 'spatial_flip',
            userId: 'local_user',
            data: expect.objectContaining({
              correctCount: 10,
              totalQuestions: 10,
              accuracy: 100,
            }),
          })
        );
      });
    } finally {
      vi.useRealTimers();
    }
  });

  // Test 12: Difficulty switching resets game
  it('resets game when difficulty is changed', async () => {
    renderGame();
    const user = userEvent.setup();

    // Click a choice to advance past question 1
    const choiceA = screen.getByLabelText(/Choice A:/);
    await user.click(choiceA);

    // Switch to easy difficulty
    const easyBtn = screen.getByText('easy');
    await user.click(easyBtn);

    // Should reset to Question 1
    expect(screen.getByText('Question 1 of 10')).toBeInTheDocument();
    expect(easyBtn).toHaveAttribute('aria-pressed', 'true');
  });

  // Test 13: Play Again resets game
  it('resets game when Play Again is clicked', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    try {
      renderGame();

      // Complete 10 questions
      for (let i = 0; i < 10; i++) {
        const choiceB = screen.getByLabelText(/Choice B:/);
        await act(async () => {
          choiceB.click();
        });
        await act(async () => {
          vi.advanceTimersByTime(1600);
        });
      }

      await waitFor(() => {
        expect(screen.getByText('Game Complete!')).toBeInTheDocument();
      });

      // Click Play Again
      const playAgain = screen.getByRole('button', { name: 'Play Again' });
      await act(async () => {
        playAgain.click();
      });

      // Should be back to Question 1
      await waitFor(() => {
        expect(screen.getByText('Question 1 of 10')).toBeInTheDocument();
      });
    } finally {
      vi.useRealTimers();
    }
  });

  // Test 14: Back to Games calls onBack
  it('calls onBack when Back to Games is clicked', async () => {
    renderGame();
    const user = userEvent.setup();

    const backBtn = screen.getByRole('button', { name: 'Back to Games' });
    await user.click(backBtn);

    expect(mockOnBack).toHaveBeenCalledOnce();
  });

  // Test 15: Timer hidden by default
  it('hides timer by default', () => {
    renderGame();
    // Timer should NOT be visible (EyeOff icon shown)
    expect(screen.getByLabelText('Show timer')).toBeInTheDocument();
    expect(screen.queryByLabelText(/seconds remaining/)).not.toBeInTheDocument();
  });

  // Test 16: Timer toggle shows/hides countdown
  it('shows countdown when timer is toggled on', async () => {
    renderGame();
    const user = userEvent.setup();

    const toggleBtn = screen.getByLabelText('Show timer');
    await user.click(toggleBtn);

    // Timer should now be visible
    await waitFor(() => {
      expect(screen.getByLabelText(/seconds remaining/)).toBeInTheDocument();
    });

    // Toggle should persist in localStorage
    expect(mockStorage['discalculas:gameTimerVisible']).toBe('true');
  });

  // Test 17: Timer expiry marks incorrect
  it('marks answer as incorrect when timer expires', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    try {
      renderGame();

      // Advance past 10s timer
      await act(async () => {
        vi.advanceTimersByTime(10100);
      });

      // Should show incorrect feedback
      await waitFor(() => {
        const liveRegion = document.querySelector('[aria-live="assertive"]');
        expect(liveRegion?.textContent).toContain('Incorrect');
      });
    } finally {
      vi.useRealTimers();
    }
  });

  // Test 18: Accessibility - aria-labels on choices
  it('has aria-labels on all choice buttons', () => {
    renderGame();

    expect(screen.getByLabelText(/Choice A:/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Choice B:/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Choice C:/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Choice D:/)).toBeInTheDocument();
  });

  // Test 19: Accessibility - reference shape has aria-label
  it('has aria-label on reference shape', () => {
    renderGame();
    expect(screen.getByLabelText('Reference shape: lshape')).toBeInTheDocument();
  });

  // Test 20: Reduced motion - verifies animation props use duration: 0
  it('sets animation duration to 0 when reduced motion is preferred', () => {
    mockReducedMotion = true;
    renderGame();

    // All choice buttons should have transition.duration = 0
    const choiceButtons = screen.getAllByRole('button').filter(
      btn => btn.getAttribute('aria-label')?.startsWith('Choice')
    );
    expect(choiceButtons.length).toBe(4);
    for (const btn of choiceButtons) {
      const transition = JSON.parse(btn.getAttribute('data-transition') || '{}');
      expect(transition.duration).toBe(0);
    }
  });

  // Test 20b: Normal motion uses 0.3s duration
  it('uses 0.3s animation duration when reduced motion is not preferred', () => {
    mockReducedMotion = false;
    renderGame();

    const choiceButtons = screen.getAllByRole('button').filter(
      btn => btn.getAttribute('aria-label')?.startsWith('Choice')
    );
    for (const btn of choiceButtons) {
      const transition = JSON.parse(btn.getAttribute('data-transition') || '{}');
      expect(transition.duration).toBe(0.3);
    }
  });

  // Test 21: Shows "Which shape matches the reference?" prompt
  it('shows game prompt text', () => {
    renderGame();
    expect(screen.getByText('Which shape matches the reference?')).toBeInTheDocument();
  });

  // Test 22: Keyboard navigation - ArrowRight moves focus
  it('moves focus right with ArrowRight key', async () => {
    renderGame();
    const user = userEvent.setup();

    // Focus choice A (index 0)
    const choiceA = screen.getByLabelText(/Choice A:/);
    choiceA.focus();

    // Press ArrowRight → should move focus to choice B (index 1)
    await user.keyboard('{ArrowRight}');

    const choiceB = screen.getByLabelText(/Choice B:/);
    expect(document.activeElement).toBe(choiceB);
  });

  // Test 23: Keyboard navigation - ArrowDown moves focus
  it('moves focus down with ArrowDown key', async () => {
    renderGame();
    const user = userEvent.setup();

    // Focus choice A (index 0)
    const choiceA = screen.getByLabelText(/Choice A:/);
    choiceA.focus();

    // Press ArrowDown → should move focus to choice C (index 2)
    await user.keyboard('{ArrowDown}');

    const choiceC = screen.getByLabelText(/Choice C:/);
    expect(document.activeElement).toBe(choiceC);
  });

  // Test 24: Keyboard navigation - ArrowLeft at left edge stays
  it('does not move focus left when already at left edge', async () => {
    renderGame();
    const user = userEvent.setup();

    // Focus choice A (index 0, left edge)
    const choiceA = screen.getByLabelText(/Choice A:/);
    choiceA.focus();

    // Press ArrowLeft → should stay on A
    await user.keyboard('{ArrowLeft}');

    expect(document.activeElement).toBe(choiceA);
  });

  // Test 25: Keyboard navigation disabled during feedback
  it('disables keyboard navigation while feedback is showing', async () => {
    renderGame();
    const user = userEvent.setup();

    // Click a choice to trigger feedback
    const choiceA = screen.getByLabelText(/Choice A:/);
    await user.click(choiceA);

    // Focus choice A and try to navigate
    choiceA.focus();
    await user.keyboard('{ArrowRight}');

    // Should NOT move (feedback is showing)
    expect(document.activeElement).toBe(choiceA);
  });

  // Test 26: Escape key dismisses completion dialog
  it('resets game when Escape is pressed on completion dialog', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    try {
      renderGame();

      // Complete 10 questions
      for (let i = 0; i < 10; i++) {
        const choiceB = screen.getByLabelText(/Choice B:/);
        await act(async () => {
          choiceB.click();
        });
        await act(async () => {
          vi.advanceTimersByTime(1600);
        });
      }

      await waitFor(() => {
        expect(screen.getByText('Game Complete!')).toBeInTheDocument();
      });

      // Press Escape to dismiss dialog
      vi.useRealTimers();
      const user = userEvent.setup();
      await user.keyboard('{Escape}');

      // Should reset to Question 1
      await waitFor(() => {
        expect(screen.getByText('Question 1 of 10')).toBeInTheDocument();
      });
    } finally {
      vi.useRealTimers();
    }
  });
});

// getChoiceStyle unit tests (L3 fix)
describe('getChoiceStyle', () => {
  it('returns rotateAndMirrorShape result when mirrored with rotation > 0', () => {
    const style = getChoiceStyle({ rotationDegrees: 90, isMirrored: true });
    expect(style).toHaveProperty('transform');
    expect(style.transform).toContain('rotate');
    expect(style.transform).toContain('scaleX(-1)');
  });

  it('returns mirrorShape result when mirrored with rotation = 0', () => {
    const style = getChoiceStyle({ rotationDegrees: 0, isMirrored: true });
    expect(style).toHaveProperty('transform');
    expect(style.transform).toContain('scaleX(-1)');
  });

  it('returns rotateShape result when not mirrored with rotation > 0', () => {
    const style = getChoiceStyle({ rotationDegrees: 180, isMirrored: false });
    expect(style).toHaveProperty('transform');
    expect(style.transform).toContain('rotate');
  });

  it('returns empty object when no rotation and no mirror', () => {
    const style = getChoiceStyle({ rotationDegrees: 0, isMirrored: false });
    expect(style).toEqual({});
  });
});
