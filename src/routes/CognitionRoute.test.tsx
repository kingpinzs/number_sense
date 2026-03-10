// CognitionRoute.test.tsx - Component tests for cognition game selection screen

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

  // Test 2: Shows all 9 games as available
  it('shows all nine games as available with Play buttons', () => {
    render(<CognitionRoute />);

    expect(screen.getByText('Speed Math')).toBeInTheDocument();
    expect(screen.getByText('Number Rush')).toBeInTheDocument();
    expect(screen.getByText('Sequence Snap')).toBeInTheDocument();
    expect(screen.getByText('Estimate It')).toBeInTheDocument();
    expect(screen.getByText('Clock Challenge')).toBeInTheDocument();
    expect(screen.getByText('Pattern Match')).toBeInTheDocument();
    expect(screen.getByText('Spatial Flip')).toBeInTheDocument();
    expect(screen.getByText('Memory Grid')).toBeInTheDocument();
    expect(screen.getByText('Colored Dots')).toBeInTheDocument();

    const playButtons = screen.getAllByRole('button', { name: /play/i });
    expect(playButtons).toHaveLength(9);
    expect(screen.queryByText('Coming soon')).not.toBeInTheDocument();
  });

  // Test 3: Game descriptions are shown
  it('shows game descriptions', () => {
    render(<CognitionRoute />);

    expect(screen.getByText('Answer math facts in 60 seconds')).toBeInTheDocument();
    expect(screen.getByText('Tap the bigger number fast')).toBeInTheDocument();
    expect(screen.getByText('Complete number patterns')).toBeInTheDocument();
    expect(screen.getByText('Estimate math results quickly')).toBeInTheDocument();
    expect(screen.getByText('Read analog clock times')).toBeInTheDocument();
    expect(screen.getByText('Find matching symbol pairs')).toBeInTheDocument();
    expect(screen.getByText('Rotate and match shapes')).toBeInTheDocument();
    expect(screen.getByText('Remember and recall patterns')).toBeInTheDocument();
    expect(screen.getByText('Spot the most common color')).toBeInTheDocument();
  });

  // Test 4: Clicking a Play button shows game view and hides selection
  it('shows game view when Play is clicked and hides selection', async () => {
    const user = userEvent.setup();
    render(<CognitionRoute />);

    // Click the first Play button (Speed Math)
    const playButtons = screen.getAllByRole('button', { name: /play/i });
    await user.click(playButtons[0]);

    // Selection screen should be gone
    expect(screen.queryByText('Brain Games')).not.toBeInTheDocument();
    // Should show back button
    expect(screen.getByRole('button', { name: /back to games/i })).toBeInTheDocument();
  });

  // Test 5: Back button returns to game selection
  it('returns to game selection when back button is clicked', async () => {
    const user = userEvent.setup();
    render(<CognitionRoute />);

    // Navigate to a game
    const playButtons = screen.getAllByRole('button', { name: /play/i });
    await user.click(playButtons[0]);

    // Click back
    await user.click(screen.getByRole('button', { name: /back to games/i }));

    // Should show selection screen again
    expect(screen.getByText('Brain Games')).toBeInTheDocument();
    expect(screen.getByText('Speed Math')).toBeInTheDocument();
  });

  // Test 6: Pattern Match game launches correctly
  it('shows Pattern Match game when its Play button is clicked', async () => {
    const user = userEvent.setup();
    render(<CognitionRoute />);

    // Find Pattern Match's Play button (6th in order)
    const playButtons = screen.getAllByRole('button', { name: /play/i });
    await user.click(playButtons[5]); // Pattern Match is 6th

    // Selection screen should be gone
    expect(screen.queryByText('Brain Games')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /back to games/i })).toBeInTheDocument();
  });

  // Test 7: Spatial Flip game launches correctly
  it('shows Spatial Flip game when its Play button is clicked', async () => {
    const user = userEvent.setup();
    render(<CognitionRoute />);

    // Spatial Flip is 7th
    const playButtons = screen.getAllByRole('button', { name: /play/i });
    await user.click(playButtons[6]);

    // Should show Spatial Flip game content
    expect(screen.getByText('Reference')).toBeInTheDocument();
    expect(screen.getByText(/Which shape matches/)).toBeInTheDocument();
    expect(screen.queryByText('Brain Games')).not.toBeInTheDocument();
  });

  // Test 8: Back from Spatial Flip returns to selection
  it('returns to selection when back from Spatial Flip', async () => {
    const user = userEvent.setup();
    render(<CognitionRoute />);

    const playButtons = screen.getAllByRole('button', { name: /play/i });
    await user.click(playButtons[6]);

    await user.click(screen.getByRole('button', { name: /back to games/i }));

    expect(screen.getByText('Brain Games')).toBeInTheDocument();
  });

  // Test 9: Memory Grid game launches correctly
  it('shows Memory Grid game when its Play button is clicked', async () => {
    const user = userEvent.setup();
    render(<CognitionRoute />);

    // Memory Grid is 8th (last)
    const playButtons = screen.getAllByRole('button', { name: /play/i });
    await user.click(playButtons[7]);

    expect(screen.getByText('Memory Grid')).toBeInTheDocument();
    expect(screen.getByText('Round 1')).toBeInTheDocument();
    expect(screen.queryByText('Brain Games')).not.toBeInTheDocument();
  });

  // Test 10: Back from Memory Grid returns to selection
  it('returns to selection when back from Memory Grid', async () => {
    const user = userEvent.setup();
    render(<CognitionRoute />);

    const playButtons = screen.getAllByRole('button', { name: /play/i });
    await user.click(playButtons[7]);

    await user.click(screen.getByRole('button', { name: /back to games/i }));

    expect(screen.getByText('Brain Games')).toBeInTheDocument();
  });
});
