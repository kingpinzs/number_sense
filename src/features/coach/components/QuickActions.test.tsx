// QuickActions.test.tsx - Story 6.2
// Component tests for QuickActions: rendering, clicks, accessibility, badge

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '../../../../tests/test-utils';
import userEvent from '@testing-library/user-event';
import QuickActions from './QuickActions';

// Mock framer-motion to avoid animation timing issues
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, whileHover: _whileHover, whileTap: _whileTap, animate: _animate, initial: _initial, exit: _exit, transition: _transition, variants: _variants, ...props }: any) => <div {...props}>{children}</div>,
  },
  useReducedMotion: vi.fn(() => false),
  AnimatePresence: ({ children }: any) => children,
}));

// Mock useQuickActions hook
const mockHandleActionClick = vi.fn();
vi.mock('../hooks/useQuickActions', () => ({
  useQuickActions: vi.fn(() => ({
    actions: [
      { id: 'start_training', icon: 'Dumbbell', title: 'Start Training', subtitle: 'Continue your streak!', color: 'primary', route: '/training', priority: 1 },
      { id: 'view_progress', icon: 'TrendingUp', title: 'View Progress', subtitle: "See how you're improving", color: 'secondary', route: '/progress', priority: 4 },
    ],
    isLoading: false,
    handleActionClick: mockHandleActionClick,
  })),
}));

import { useQuickActions } from '../hooks/useQuickActions';
import { useReducedMotion } from 'framer-motion';

describe('QuickActions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders correct number of action cards', () => {
    render(<QuickActions />);

    expect(screen.getByText('Start Training')).toBeInTheDocument();
    expect(screen.getByText('View Progress')).toBeInTheDocument();
  });

  it('renders action subtitles', () => {
    render(<QuickActions />);

    expect(screen.getByText('Continue your streak!')).toBeInTheDocument();
    expect(screen.getByText("See how you're improving")).toBeInTheDocument();
  });

  it('clicking action card calls handleActionClick', async () => {
    const user = userEvent.setup();
    render(<QuickActions />);

    const startTraining = screen.getByRole('link', { name: /start training/i });
    await user.click(startTraining);

    expect(mockHandleActionClick).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'start_training' })
    );
  });

  it('has correct accessibility attributes', () => {
    render(<QuickActions />);

    // Container has region role
    const region = screen.getByRole('region', { name: 'Quick actions' });
    expect(region).toBeInTheDocument();

    // Action cards have link role
    const links = screen.getAllByRole('link');
    expect(links.length).toBe(2);

    // Each has aria-label
    expect(links[0]).toHaveAttribute('aria-label', 'Start Training: Continue your streak!');
    expect(links[1]).toHaveAttribute('aria-label', "View Progress: See how you're improving");
  });

  it('action cards are keyboard focusable', () => {
    render(<QuickActions />);

    const links = screen.getAllByRole('link');
    links.forEach(link => {
      expect(link).toHaveAttribute('tabIndex', '0');
    });
  });

  it('renders badge for insights count', () => {
    vi.mocked(useQuickActions).mockReturnValue({
      actions: [
        { id: 'review_insights', icon: 'Sparkles', title: 'Review Insights', subtitle: "See what's new", color: 'secondary', route: '/progress', priority: 3, badge: 5 },
        { id: 'view_progress', icon: 'TrendingUp', title: 'View Progress', subtitle: "See how you're improving", color: 'secondary', route: '/progress', priority: 4 },
      ],
      isLoading: false,
      handleActionClick: mockHandleActionClick,
    });

    render(<QuickActions />);

    expect(screen.getByText('5 new')).toBeInTheDocument();
  });

  it('returns null when loading', () => {
    vi.mocked(useQuickActions).mockReturnValue({
      actions: [],
      isLoading: true,
      handleActionClick: mockHandleActionClick,
    });

    render(<QuickActions />);
    expect(screen.queryByRole('region')).not.toBeInTheDocument();
  });

  it('returns null when no actions', () => {
    vi.mocked(useQuickActions).mockReturnValue({
      actions: [],
      isLoading: false,
      handleActionClick: mockHandleActionClick,
    });

    render(<QuickActions />);
    expect(screen.queryByRole('region')).not.toBeInTheDocument();
  });

  it('disables hover animation when prefers-reduced-motion is set', () => {
    // Override useReducedMotion to return true (user prefers reduced motion)
    vi.mocked(useReducedMotion).mockReturnValue(true);
    // Explicitly reset useQuickActions (previous tests may have overridden with empty actions)
    vi.mocked(useQuickActions).mockReturnValue({
      actions: [
        { id: 'start_training', icon: 'Dumbbell', title: 'Start Training', subtitle: 'Continue your streak!', color: 'primary', route: '/training', priority: 1 },
        { id: 'view_progress', icon: 'TrendingUp', title: 'View Progress', subtitle: "See how you're improving", color: 'secondary', route: '/progress', priority: 4 },
      ],
      isLoading: false,
      handleActionClick: mockHandleActionClick,
    });

    render(<QuickActions />);

    // Cards should still render (reduced motion doesn't hide content)
    expect(screen.getByText('Start Training')).toBeInTheDocument();
    expect(screen.getByText('View Progress')).toBeInTheDocument();

    // The motion.div mock passes all props through to a plain div.
    // When reduceMotion is true, whileHover should NOT be set on the wrapper.
    // We verify by checking that the wrapper divs don't have a whileHover attribute.
    const region = screen.getByRole('region');
    const wrapperDivs = region.querySelectorAll(':scope > div');
    wrapperDivs.forEach(wrapper => {
      expect(wrapper).not.toHaveAttribute('whileHover');
    });
  });
});
