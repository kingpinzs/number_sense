// PatternMatchGame.test.tsx - Component tests for Pattern Match mini-game
// Story 6.3: Tests for gameplay mechanics, UI, accessibility, and telemetry

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, act } from '../../../../tests/test-utils';
import userEvent from '@testing-library/user-event';
import PatternMatchGame from './PatternMatchGame';

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

// Mock framer-motion (forwardRef on button to support tileRefs for arrow key nav)
let mockReducedMotion = false;
vi.mock('framer-motion', async () => {
  const React = await import('react');
  return {
    motion: {
      button: React.forwardRef(({
        children,
        animate: _a,
        transition: _t,
        style: _s,
        ...props
      }: any, ref: any) => <button ref={ref} {...props}>{children}</button>),
      div: ({
        children,
        animate: _a,
        transition: _t,
        style: _s,
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

// Mock gameUtils to control tile generation for predictable testing
vi.mock('../utils/gameUtils', async () => {
  const actual = await vi.importActual('../utils/gameUtils');
  return {
    ...actual,
    generateTilePairs: (difficulty: string) => {
      if (difficulty === 'easy') {
        // 6 pairs, 12 tiles — pairs adjacent for easy testing
        return [
          { id: 0, symbol: 'circle', revealed: false, matched: false },
          { id: 1, symbol: 'circle', revealed: false, matched: false },
          { id: 2, symbol: 'square', revealed: false, matched: false },
          { id: 3, symbol: 'square', revealed: false, matched: false },
          { id: 4, symbol: 'triangle', revealed: false, matched: false },
          { id: 5, symbol: 'triangle', revealed: false, matched: false },
          { id: 6, symbol: 'star', revealed: false, matched: false },
          { id: 7, symbol: 'star', revealed: false, matched: false },
          { id: 8, symbol: 'diamond', revealed: false, matched: false },
          { id: 9, symbol: 'diamond', revealed: false, matched: false },
          { id: 10, symbol: 'heart', revealed: false, matched: false },
          { id: 11, symbol: 'heart', revealed: false, matched: false },
        ];
      }
      if (difficulty === 'hard') {
        const symbols = [
          'circle', 'square', 'triangle', 'star', 'diamond',
          'heart', 'hexagon', 'cross', 'pentagon', 'arrow',
        ];
        const tiles: any[] = [];
        let id = 0;
        symbols.forEach((s) => {
          tiles.push({ id: id++, symbol: s, revealed: false, matched: false });
          tiles.push({ id: id++, symbol: s, revealed: false, matched: false });
        });
        return tiles;
      }
      // Medium (default): circle matches at (0,2), square at (1,4)
      return [
        { id: 0, symbol: 'circle', revealed: false, matched: false },
        { id: 1, symbol: 'square', revealed: false, matched: false },
        { id: 2, symbol: 'circle', revealed: false, matched: false },
        { id: 3, symbol: 'triangle', revealed: false, matched: false },
        { id: 4, symbol: 'square', revealed: false, matched: false },
        { id: 5, symbol: 'star', revealed: false, matched: false },
        { id: 6, symbol: 'triangle', revealed: false, matched: false },
        { id: 7, symbol: 'diamond', revealed: false, matched: false },
        { id: 8, symbol: 'star', revealed: false, matched: false },
        { id: 9, symbol: 'heart', revealed: false, matched: false },
        { id: 10, symbol: 'diamond', revealed: false, matched: false },
        { id: 11, symbol: 'hexagon', revealed: false, matched: false },
        { id: 12, symbol: 'heart', revealed: false, matched: false },
        { id: 13, symbol: 'cross', revealed: false, matched: false },
        { id: 14, symbol: 'hexagon', revealed: false, matched: false },
        { id: 15, symbol: 'cross', revealed: false, matched: false },
      ];
    },
  };
});

describe('PatternMatchGame', () => {
  const mockOnBack = vi.fn();

  beforeEach(() => {
    mockNavigate.mockClear();
    mockOnBack.mockClear();
    mockAdd.mockClear();
    mockReducedMotion = false;
    Object.keys(mockStorage).forEach((key) => delete mockStorage[key]);
  });

  // Test 1: Renders correct number of tiles for medium (default)
  it('renders 16 tiles for medium difficulty', async () => {
    render(<PatternMatchGame onBack={mockOnBack} />);

    await waitFor(() => {
      const tileButtons = screen.getAllByRole('button').filter((b) =>
        b.getAttribute('aria-label')?.startsWith('Tile')
      );
      expect(tileButtons).toHaveLength(16);
    });
  });

  // Test 2: All tiles start face down
  it('all tiles start face down', () => {
    render(<PatternMatchGame onBack={mockOnBack} />);

    const faceDownTiles = screen.getAllByRole('button').filter((b) =>
      b.getAttribute('aria-label')?.includes('face down')
    );
    expect(faceDownTiles).toHaveLength(16);
  });

  // Test 3: Clicking a tile reveals its symbol
  it('reveals symbol when tile is clicked', async () => {
    const user = userEvent.setup();
    render(<PatternMatchGame onBack={mockOnBack} />);

    const firstTile = screen.getByLabelText('Tile row 1, column 1: face down');
    await user.click(firstTile);

    expect(
      screen.getByLabelText('Tile row 1, column 1: circle')
    ).toBeInTheDocument();
  });

  // Test 4: Matching tiles stay revealed
  it('matched tiles stay revealed', async () => {
    const user = userEvent.setup();
    render(<PatternMatchGame onBack={mockOnBack} />);

    // Click first circle (id=0, row 1 col 1)
    await user.click(screen.getByLabelText('Tile row 1, column 1: face down'));
    // Click second circle (id=2, row 1 col 3)
    await user.click(screen.getByLabelText('Tile row 1, column 3: face down'));

    await waitFor(() => {
      expect(
        screen.getByLabelText('Tile row 1, column 1: matched circle')
      ).toBeInTheDocument();
      expect(
        screen.getByLabelText('Tile row 1, column 3: matched circle')
      ).toBeInTheDocument();
    });
  });

  // Test 5: Unmatched tiles flip back after 1 second
  it('unmatched tiles flip back after 1 second', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

    render(<PatternMatchGame onBack={mockOnBack} />);

    // Click circle (id=0, row1 col1) then square (id=1, row1 col2) — no match
    await user.click(screen.getByLabelText('Tile row 1, column 1: face down'));
    await user.click(screen.getByLabelText('Tile row 1, column 2: face down'));

    // Both should be revealed briefly
    expect(screen.getByLabelText('Tile row 1, column 1: circle')).toBeInTheDocument();
    expect(screen.getByLabelText('Tile row 1, column 2: square')).toBeInTheDocument();

    // Advance past the 1s mismatch delay
    act(() => {
      vi.advanceTimersByTime(1100);
    });

    await waitFor(() => {
      expect(
        screen.getByLabelText('Tile row 1, column 1: face down')
      ).toBeInTheDocument();
      expect(
        screen.getByLabelText('Tile row 1, column 2: face down')
      ).toBeInTheDocument();
    });

    vi.useRealTimers();
  });

  // Test 6: Move counter increments after each pair attempt
  it('increments move counter after pair attempt', async () => {
    const user = userEvent.setup();
    render(<PatternMatchGame onBack={mockOnBack} />);

    expect(screen.getByText('Moves: 0')).toBeInTheDocument();

    // Click two tiles (matching pair)
    await user.click(screen.getByLabelText('Tile row 1, column 1: face down'));
    await user.click(screen.getByLabelText('Tile row 1, column 3: face down'));

    expect(screen.getByText('Moves: 1')).toBeInTheDocument();
  });

  // Test 7: Pairs counter updates on match
  it('updates pairs counter when match found', async () => {
    const user = userEvent.setup();
    render(<PatternMatchGame onBack={mockOnBack} />);

    expect(screen.getByText('0/8 pairs')).toBeInTheDocument();

    // Match the circles
    await user.click(screen.getByLabelText('Tile row 1, column 1: face down'));
    await user.click(screen.getByLabelText('Tile row 1, column 3: face down'));

    await waitFor(() => {
      expect(screen.getByText('1/8 pairs')).toBeInTheDocument();
    });
  });

  // Test 8: Cannot click matched tiles
  it('cannot click already matched tiles', async () => {
    const user = userEvent.setup();
    render(<PatternMatchGame onBack={mockOnBack} />);

    // Match circles
    await user.click(screen.getByLabelText('Tile row 1, column 1: face down'));
    await user.click(screen.getByLabelText('Tile row 1, column 3: face down'));

    await waitFor(() => {
      expect(screen.getByText('1/8 pairs')).toBeInTheDocument();
    });

    const matchedTile = screen.getByLabelText('Tile row 1, column 1: matched circle');
    expect(matchedTile).toBeDisabled();
  });

  // Test 9: Difficulty switching regenerates grid
  it('switches difficulty and regenerates grid', async () => {
    const user = userEvent.setup();
    render(<PatternMatchGame onBack={mockOnBack} />);

    // Default medium: 16 tiles
    let tileButtons = screen.getAllByRole('button').filter((b) =>
      b.getAttribute('aria-label')?.startsWith('Tile')
    );
    expect(tileButtons).toHaveLength(16);

    // Switch to easy
    await user.click(screen.getByRole('tab', { name: 'Easy' }));

    tileButtons = screen.getAllByRole('button').filter((b) =>
      b.getAttribute('aria-label')?.startsWith('Tile')
    );
    expect(tileButtons).toHaveLength(12);
  });

  // Test 10: Accessibility - tiles have proper aria-labels
  it('tiles have descriptive aria-labels with row and column', () => {
    render(<PatternMatchGame onBack={mockOnBack} />);

    expect(screen.getByLabelText('Tile row 1, column 1: face down')).toBeInTheDocument();
    expect(screen.getByLabelText('Tile row 1, column 4: face down')).toBeInTheDocument();
    expect(screen.getByLabelText('Tile row 4, column 4: face down')).toBeInTheDocument();
  });

  // Test 11: Accessibility - aria-live region exists
  it('has aria-live region for announcements', () => {
    render(<PatternMatchGame onBack={mockOnBack} />);

    const liveRegion = document.querySelector('[aria-live="polite"]');
    expect(liveRegion).toBeInTheDocument();
  });

  // Test 12: Accessibility - focus indicators
  it('interactive elements have focus-visible ring classes', () => {
    render(<PatternMatchGame onBack={mockOnBack} />);

    const backButton = screen.getByRole('button', { name: /back to games/i });
    expect(backButton.className).toContain('focus-visible:ring-2');

    const tileButton = screen.getByLabelText('Tile row 1, column 1: face down');
    expect(tileButton.className).toContain('focus-visible:ring-2');
  });

  // Test 13: Timer toggle visibility
  it('toggles timer visibility', async () => {
    const user = userEvent.setup();
    render(<PatternMatchGame onBack={mockOnBack} />);

    // Timer hidden by default
    expect(screen.queryByText('0:00')).not.toBeInTheDocument();

    // Show timer
    await user.click(screen.getByLabelText('Show timer'));
    expect(screen.getByText('0:00')).toBeInTheDocument();

    // Hide timer
    await user.click(screen.getByLabelText('Hide timer'));
    expect(screen.queryByText('0:00')).not.toBeInTheDocument();
  });

  // Test 14: Timer preference persists
  it('saves timer visibility preference to localStorage', async () => {
    const user = userEvent.setup();
    render(<PatternMatchGame onBack={mockOnBack} />);

    await user.click(screen.getByLabelText('Show timer'));
    expect(mockStorage['discalculas:gameTimerVisible']).toBe('true');
  });

  // Test 15: Back button
  it('calls onBack when back button clicked', async () => {
    const user = userEvent.setup();
    render(<PatternMatchGame onBack={mockOnBack} />);

    await user.click(screen.getByRole('button', { name: /back to games/i }));
    expect(mockOnBack).toHaveBeenCalledOnce();
  });

  // Test 16: Reduced motion
  it('renders correctly when reduced motion is preferred', () => {
    mockReducedMotion = true;
    render(<PatternMatchGame onBack={mockOnBack} />);

    const tileButtons = screen.getAllByRole('button').filter((b) =>
      b.getAttribute('aria-label')?.startsWith('Tile')
    );
    expect(tileButtons).toHaveLength(16);
  });

  // Test 17: Difficulty tabs selected state
  it('shows correct difficulty tab as selected', async () => {
    const user = userEvent.setup();
    render(<PatternMatchGame onBack={mockOnBack} />);

    const mediumTab = screen.getByRole('tab', { name: 'Medium' });
    expect(mediumTab).toHaveAttribute('aria-selected', 'true');

    await user.click(screen.getByRole('tab', { name: 'Hard' }));

    expect(screen.getByRole('tab', { name: 'Hard' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: 'Medium' })).toHaveAttribute('aria-selected', 'false');
  });

  // Test 18: Full game completion with telemetry
  it('shows completion modal and logs telemetry when all pairs matched', async () => {
    const user = userEvent.setup();
    render(<PatternMatchGame onBack={mockOnBack} />);

    // Switch to easy (6 pairs, adjacent layout for easy matching)
    await user.click(screen.getByRole('tab', { name: 'Easy' }));

    // Match all 6 pairs (easy mock has adjacent pairs: 0-1, 2-3, 4-5, 6-7, 8-9, 10-11)
    // Easy grid is 4 cols × 3 rows
    const pairPositions = [
      // [tile1 row, tile1 col, tile2 row, tile2 col]
      [1, 1, 1, 2], // ids 0,1 → circles
      [1, 3, 1, 4], // ids 2,3 → squares
      [2, 1, 2, 2], // ids 4,5 → triangles
      [2, 3, 2, 4], // ids 6,7 → stars
      [3, 1, 3, 2], // ids 8,9 → diamonds
      [3, 3, 3, 4], // ids 10,11 → hearts
    ];

    for (const [r1, c1, r2, c2] of pairPositions) {
      await user.click(
        screen.getByLabelText(`Tile row ${r1}, column ${c1}: face down`)
      );
      await user.click(
        screen.getByLabelText(`Tile row ${r2}, column ${c2}: face down`)
      );

      // Wait for match to register (use DOM query — Radix Dialog hides game board via aria-hidden)
      await waitFor(() => {
        const matched = document.querySelectorAll('button[aria-label*="matched"]');
        expect(matched.length).toBeGreaterThan(0);
      });
    }

    // Completion modal should appear
    await waitFor(() => {
      expect(screen.getByText('Game Complete!')).toBeInTheDocument();
    });

    // Check stats
    expect(screen.getByText(/Completed in 6 moves/)).toBeInTheDocument();
    expect(screen.getByText(/Accuracy: 100%/)).toBeInTheDocument();
    expect(
      screen.getByText('Perfect memory! Not a single wrong guess!')
    ).toBeInTheDocument();

    // Telemetry logged
    expect(mockAdd).toHaveBeenCalledWith(
      expect.objectContaining({
        event: 'cognition_game_complete',
        module: 'pattern_match',
        data: expect.objectContaining({
          difficulty: 'easy',
          moves: 6,
          accuracy: 100,
        }),
      })
    );
  });

  // Test 19: Grid role
  it('game board has grid role', () => {
    render(<PatternMatchGame onBack={mockOnBack} />);

    expect(
      screen.getByRole('grid', { name: 'Pattern Match game board' })
    ).toBeInTheDocument();
  });

  // Helper: Complete an easy game (6 pairs, adjacent layout)
  async function completeEasyGame(user: ReturnType<typeof userEvent.setup>) {
    await user.click(screen.getByRole('tab', { name: 'Easy' }));

    const pairPositions = [
      [1, 1, 1, 2], [1, 3, 1, 4], [2, 1, 2, 2],
      [2, 3, 2, 4], [3, 1, 3, 2], [3, 3, 3, 4],
    ];

    for (const [r1, c1, r2, c2] of pairPositions) {
      await user.click(
        screen.getByLabelText(`Tile row ${r1}, column ${c1}: face down`)
      );
      await user.click(
        screen.getByLabelText(`Tile row ${r2}, column ${c2}: face down`)
      );
      // Use DOM query — Radix Dialog hides game board via aria-hidden on last pair
      await waitFor(() => {
        const matched = document.querySelectorAll('button[aria-label*="matched"]');
        expect(matched.length).toBeGreaterThan(0);
      });
    }

    await waitFor(() => {
      expect(screen.getByText('Game Complete!')).toBeInTheDocument();
    });
  }

  // Test 20: Play Again resets the game
  it('Play Again button resets the game', async () => {
    const user = userEvent.setup();
    render(<PatternMatchGame onBack={mockOnBack} />);

    await completeEasyGame(user);

    await user.click(screen.getByRole('button', { name: /play again/i }));

    expect(screen.queryByText('Game Complete!')).not.toBeInTheDocument();
    expect(screen.getByText('Moves: 0')).toBeInTheDocument();
    expect(screen.getByText('0/6 pairs')).toBeInTheDocument();
  });

  // Test 21: Back to Home navigates to root
  it('Back to Home navigates to root', async () => {
    const user = userEvent.setup();
    render(<PatternMatchGame onBack={mockOnBack} />);

    await completeEasyGame(user);

    await user.click(screen.getByRole('button', { name: /back to home/i }));

    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  // Test 22: Arrow key navigation between tiles
  it('supports arrow key navigation between tiles', async () => {
    const user = userEvent.setup();
    render(<PatternMatchGame onBack={mockOnBack} />);

    // Focus first tile
    const firstTile = screen.getByLabelText('Tile row 1, column 1: face down');
    firstTile.focus();

    // Arrow right → column 2
    await user.keyboard('{ArrowRight}');
    expect(screen.getByLabelText('Tile row 1, column 2: face down')).toHaveFocus();

    // Arrow down → row 2, column 2
    await user.keyboard('{ArrowDown}');
    expect(screen.getByLabelText('Tile row 2, column 2: face down')).toHaveFocus();

    // Arrow left → row 2, column 1
    await user.keyboard('{ArrowLeft}');
    expect(screen.getByLabelText('Tile row 2, column 1: face down')).toHaveFocus();

    // Arrow up → row 1, column 1
    await user.keyboard('{ArrowUp}');
    expect(screen.getByLabelText('Tile row 1, column 1: face down')).toHaveFocus();
  });

  // Test 23: ARIA grid structure has rows and gridcells
  it('grid has proper ARIA row and gridcell structure', () => {
    render(<PatternMatchGame onBack={mockOnBack} />);

    const grid = screen.getByRole('grid');
    expect(grid).toBeInTheDocument();

    const rows = screen.getAllByRole('row');
    expect(rows).toHaveLength(4); // 4×4 medium = 4 rows

    const gridcells = screen.getAllByRole('gridcell');
    expect(gridcells).toHaveLength(16); // 16 tiles
  });
});
