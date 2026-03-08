// CognitionRoute.test.tsx - Component tests for cognition game selection screen
// Story 6.3: Implement Pattern Match Mini-Game
// Story 6.4: Implement Spatial Flip Mini-Game
// Story 6.5: Implement Memory Grid Mini-Game

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '../../tests/test-utils';
import userEvent from '@testing-library/user-event';
import CognitionRoute from './CognitionRoute';

// Mock react-router-dom hooks
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({ pathname: '/cognition' }),
  };
});

describe('CognitionRoute', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  // Test 1: Renders game selection screen with header
  it('renders game selection screen with header', () => {
    render(<CognitionRoute />);

    expect(screen.getByText('Brain Games')).toBeInTheDocument();
    expect(screen.getByText('Quick exercises to strengthen cognitive skills')).toBeInTheDocument();
  });

  // Test 2: Shows Pattern Match as available game
  it('shows Pattern Match game card with Play button', () => {
    render(<CognitionRoute />);

    expect(screen.getByText('Pattern Match')).toBeInTheDocument();
    expect(screen.getByText('Find matching symbol pairs')).toBeInTheDocument();
    const playButtons = screen.getAllByRole('button', { name: /play/i });
    expect(playButtons.length).toBeGreaterThanOrEqual(1);
  });

  // Test 3: All three games are available (no Coming Soon)
  it('shows all three games as available with Play buttons', () => {
    render(<CognitionRoute />);

    expect(screen.getByText('Spatial Flip')).toBeInTheDocument();
    expect(screen.getByText('Memory Grid')).toBeInTheDocument();

    // All 3 games have Play buttons, no Coming Soon
    const playButtons = screen.getAllByRole('button', { name: /play/i });
    expect(playButtons).toHaveLength(3);
    expect(screen.queryByText('Coming soon')).not.toBeInTheDocument();
  });

  // Test 4: Clicking Pattern Match Play shows game view with back button
  it('shows game view with back button when Play is clicked', async () => {
    const user = userEvent.setup();
    render(<CognitionRoute />);

    const playButtons = screen.getAllByRole('button', { name: /play/i });
    await user.click(playButtons[0]); // First Play = Pattern Match

    // Should show back button
    expect(screen.getByRole('button', { name: /back to games/i })).toBeInTheDocument();
    // Selection screen should be gone
    expect(screen.queryByText('Brain Games')).not.toBeInTheDocument();
  });

  // Test 5: Back button returns to game selection
  it('returns to game selection when back button is clicked', async () => {
    const user = userEvent.setup();
    render(<CognitionRoute />);

    // Navigate to game (first Play = Pattern Match)
    const playButtons = screen.getAllByRole('button', { name: /play/i });
    await user.click(playButtons[0]);

    // Click back
    await user.click(screen.getByRole('button', { name: /back to games/i }));

    // Should show selection screen again
    expect(screen.getByText('Brain Games')).toBeInTheDocument();
    expect(screen.getByText('Pattern Match')).toBeInTheDocument();
  });

  // Test 6: Spatial Flip card shows Play button (available)
  it('shows Spatial Flip card with Play button', () => {
    render(<CognitionRoute />);

    expect(screen.getByText('Spatial Flip')).toBeInTheDocument();
    expect(screen.getByText('Rotate and match shapes')).toBeInTheDocument();

    // Should have 3 Play buttons (Pattern Match + Spatial Flip + Memory Grid)
    const playButtons = screen.getAllByRole('button', { name: /play/i });
    expect(playButtons).toHaveLength(3);
  });

  // Test 7: Clicking Spatial Flip Play navigates to game
  it('shows Spatial Flip game when its Play button is clicked', async () => {
    const user = userEvent.setup();
    render(<CognitionRoute />);

    // Click the second Play button (Spatial Flip)
    const playButtons = screen.getAllByRole('button', { name: /play/i });
    await user.click(playButtons[1]);

    // Should show Spatial Flip game content
    expect(screen.getByText('Reference')).toBeInTheDocument();
    expect(screen.getByText(/Which shape matches/)).toBeInTheDocument();
    // Selection screen should be gone
    expect(screen.queryByText('Brain Games')).not.toBeInTheDocument();
  });

  // Test 8: Back from Spatial Flip returns to selection
  it('returns to selection when back from Spatial Flip', async () => {
    const user = userEvent.setup();
    render(<CognitionRoute />);

    // Navigate to Spatial Flip
    const playButtons = screen.getAllByRole('button', { name: /play/i });
    await user.click(playButtons[1]);

    // Click Back to Games
    await user.click(screen.getByRole('button', { name: /back to games/i }));

    // Should show selection screen
    expect(screen.getByText('Brain Games')).toBeInTheDocument();
  });

  // Test 9: Clicking Memory Grid Play shows game view
  it('shows Memory Grid game when its Play button is clicked', async () => {
    const user = userEvent.setup();
    render(<CognitionRoute />);

    // Click the third Play button (Memory Grid)
    const playButtons = screen.getAllByRole('button', { name: /play/i });
    await user.click(playButtons[2]);

    // Should show Memory Grid game content
    expect(screen.getByText('Memory Grid')).toBeInTheDocument();
    expect(screen.getByText('Round 1')).toBeInTheDocument();
    // Selection screen should be gone
    expect(screen.queryByText('Brain Games')).not.toBeInTheDocument();
  });

  // Test 10: Back from Memory Grid returns to selection
  it('returns to selection when back from Memory Grid', async () => {
    const user = userEvent.setup();
    render(<CognitionRoute />);

    // Navigate to Memory Grid
    const playButtons = screen.getAllByRole('button', { name: /play/i });
    await user.click(playButtons[2]);

    // Click Back to Games
    await user.click(screen.getByRole('button', { name: /back to games/i }));

    // Should show selection screen
    expect(screen.getByText('Brain Games')).toBeInTheDocument();
  });
});
