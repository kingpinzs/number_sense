// MilestoneModal.test.tsx - Story 5.3
// Tests for milestone celebration dialog

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '../../../../tests/test-utils';
import userEvent from '@testing-library/user-event';
import { MilestoneModal } from './MilestoneModal';
import type { Milestone } from '@/services/training/streakManager';

const mockMilestone: Milestone = {
  streak: 7,
  title: 'One Week Streak!',
  emoji: '🎉',
  message: 'Amazing consistency! Keep it up!',
};

describe('MilestoneModal', () => {
  it('renders milestone title and emoji when open', () => {
    render(
      <MilestoneModal milestone={mockMilestone} open={true} onClose={vi.fn()} />
    );

    expect(screen.getByText('One Week Streak!')).toBeInTheDocument();
    expect(screen.getByText('🎉')).toBeInTheDocument();
    expect(screen.getByText('Amazing consistency! Keep it up!')).toBeInTheDocument();
    expect(screen.getByText('7 Days')).toBeInTheDocument();
  });

  it('does not render content when closed', () => {
    render(
      <MilestoneModal milestone={mockMilestone} open={false} onClose={vi.fn()} />
    );

    expect(screen.queryByText('One Week Streak!')).not.toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();

    render(
      <MilestoneModal milestone={mockMilestone} open={true} onClose={onClose} />
    );

    const closeButton = screen.getByRole('button', { name: /close/i });
    await user.click(closeButton);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('shows confetti particles', () => {
    render(
      <MilestoneModal milestone={mockMilestone} open={true} onClose={vi.fn()} />
    );

    const particles = screen.getAllByTestId('confetti-particle');
    expect(particles.length).toBe(12);
  });

  it('renders 30-day milestone correctly', () => {
    const thirtyDayMilestone: Milestone = {
      streak: 30,
      title: 'One Month Streak!',
      emoji: '🔥',
      message: 'Incredible dedication!',
    };

    render(
      <MilestoneModal milestone={thirtyDayMilestone} open={true} onClose={vi.fn()} />
    );

    expect(screen.getByText('One Month Streak!')).toBeInTheDocument();
    expect(screen.getByText('🔥')).toBeInTheDocument();
    expect(screen.getByText('30 Days')).toBeInTheDocument();
  });

  it('renders 100-day milestone correctly', () => {
    const centuryMilestone: Milestone = {
      streak: 100,
      title: 'Century Streak!',
      emoji: '💯',
      message: 'Legendary! 100 days of practice!',
    };

    render(
      <MilestoneModal milestone={centuryMilestone} open={true} onClose={vi.fn()} />
    );

    expect(screen.getByText('Century Streak!')).toBeInTheDocument();
    expect(screen.getByText('💯')).toBeInTheDocument();
    expect(screen.getByText('100 Days')).toBeInTheDocument();
  });
});
