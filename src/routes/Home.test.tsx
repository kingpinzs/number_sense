// Home.test.tsx - Story 5.3
// Tests for streak counter integration on Home screen

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '../../tests/test-utils';
import userEvent from '@testing-library/user-event';
import Home from './Home';

// Mock streakManager
vi.mock('@/services/training/streakManager', () => ({
  getCurrentStreak: vi.fn().mockReturnValue(5),
  checkMilestone: vi.fn().mockReturnValue(null),
}));

// Mock localStorage functions
vi.mock('@/services/storage/localStorage', async () => {
  const actual = await vi.importActual<typeof import('@/services/storage/localStorage')>('@/services/storage/localStorage');
  return {
    ...actual,
    getLastSessionDate: vi.fn().mockReturnValue('2026-02-07T00:00:00.000Z'),
    addMilestoneShown: vi.fn(),
  };
});

// Mock db
vi.mock('@/services/storage/db', () => ({
  db: {
    assessments: {
      where: vi.fn().mockReturnValue({
        equals: vi.fn().mockReturnValue({
          count: vi.fn().mockResolvedValue(1),
        }),
      }),
    },
  },
}));

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Access mocked modules
import { getCurrentStreak, checkMilestone } from '@/services/training/streakManager';
import { getLastSessionDate } from '@/services/storage/localStorage';
import { db } from '@/services/storage/db';

describe('Home - Streak Counter Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: returning user with assessment
    vi.mocked(db.assessments.where).mockReturnValue({
      equals: vi.fn().mockReturnValue({
        count: vi.fn().mockResolvedValue(1),
      }),
    } as any);
    vi.mocked(getCurrentStreak).mockReturnValue(5);
    vi.mocked(checkMilestone).mockReturnValue(null);
    vi.mocked(getLastSessionDate).mockReturnValue('2026-02-07T00:00:00.000Z');
  });

  it('renders StreakCounter for returning users', async () => {
    render(<Home />);

    await waitFor(() => {
      expect(screen.getByText('Welcome Back')).toBeInTheDocument();
    });

    // Wait for streak useEffect to fire after hasAssessment changes
    await waitFor(() => {
      expect(screen.getByText('5')).toBeInTheDocument();
    });

    expect(screen.getByText('Day Streak')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /current streak: 5 days/i })).toBeInTheDocument();
  });

  it('does NOT render StreakCounter for first-time users', async () => {
    // No assessments completed
    vi.mocked(db.assessments.where).mockReturnValue({
      equals: vi.fn().mockReturnValue({
        count: vi.fn().mockResolvedValue(0),
      }),
    } as any);

    render(<Home />);

    await waitFor(() => {
      expect(screen.getByText('Welcome to Discalculas')).toBeInTheDocument();
    });

    // Should NOT show streak counter
    expect(screen.queryByText('Day Streak')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /current streak/i })).not.toBeInTheDocument();
  });

  it('tapping StreakCounter navigates to /progress', async () => {
    const user = userEvent.setup();
    render(<Home />);

    // Wait for streak to render (depends on hasAssessment useEffect)
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /current streak: 5 days/i })).toBeInTheDocument();
    });

    const streakButton = screen.getByRole('button', { name: /current streak: 5 days/i });
    await user.click(streakButton);

    expect(mockNavigate).toHaveBeenCalledWith('/progress');
  });

  it('shows milestone modal when milestone is triggered', async () => {
    vi.mocked(getCurrentStreak).mockReturnValue(7);
    vi.mocked(checkMilestone).mockReturnValue({
      streak: 7,
      title: 'One Week Streak!',
      emoji: '🎉',
      message: 'Amazing consistency! Keep it up!',
    });

    render(<Home />);

    await waitFor(() => {
      expect(screen.getByText('One Week Streak!')).toBeInTheDocument();
    });

    expect(screen.getByText('🎉')).toBeInTheDocument();
    expect(screen.getByText('Amazing consistency! Keep it up!')).toBeInTheDocument();
  });

  it('shows noSessions message when no session date exists', async () => {
    vi.mocked(getCurrentStreak).mockReturnValue(0);
    vi.mocked(getLastSessionDate).mockReturnValue(null);

    render(<Home />);

    await waitFor(() => {
      expect(screen.getByText('Welcome Back')).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText('Start your streak today!')).toBeInTheDocument();
    });
  });

  it('shows 0 streak with dimmed flame when streak is broken', async () => {
    vi.mocked(getCurrentStreak).mockReturnValue(0);
    vi.mocked(getLastSessionDate).mockReturnValue('2026-01-01T00:00:00.000Z');

    render(<Home />);

    await waitFor(() => {
      expect(screen.getByText('Welcome Back')).toBeInTheDocument();
    });

    // Wait for streak useEffect to complete - 0 is both initial and final,
    // but Day Streak label confirms StreakCounter rendered with noSessions=false
    await waitFor(() => {
      expect(screen.getByText('Day Streak')).toBeInTheDocument();
    });

    expect(screen.getByText('0')).toBeInTheDocument();

    const flame = screen.getByRole('img', { name: /fire emoji/i });
    expect(flame).toHaveClass('opacity-30');
    expect(flame).toHaveClass('grayscale');
  });
});
