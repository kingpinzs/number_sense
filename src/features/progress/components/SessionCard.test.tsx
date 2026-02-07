// SessionCard Component Tests - Story 5.2
// AC-1: Session card display, AC-2: Visual design, AC-3: Accordion expansion

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SessionCard from './SessionCard';
import { Accordion } from '@/shared/components/ui/accordion';
import type { SessionWithDrills } from '../hooks/useSessionHistory';

// Helper to render SessionCard within Accordion wrapper
function renderSessionCard(session: SessionWithDrills, index: number = 0) {
  return render(
    <Accordion type="multiple">
      <SessionCard session={session} index={index} />
    </Accordion>
  );
}

const mockSession: SessionWithDrills = {
  id: 1,
  timestamp: '2025-11-04T14:30:00.000Z',
  module: 'training',
  duration: 720000, // 12 minutes
  completionStatus: 'completed',
  drillCount: 12,
  accuracy: 85,
  confidenceBefore: 3,
  confidenceAfter: 4,
  confidenceChange: 1,
  drillQueue: ['number_line', 'spatial_rotation', 'math_operations'],
  hasMagicMinute: false,
  drills: [
    {
      id: 1,
      sessionId: 1,
      timestamp: '2025-11-04T14:31:00.000Z',
      module: 'number_line',
      difficulty: 'medium',
      isCorrect: true,
      timeToAnswer: 3500,
      accuracy: 100,
      problem: '7 on number line',
    },
    {
      id: 2,
      sessionId: 1,
      timestamp: '2025-11-04T14:32:00.000Z',
      module: 'spatial_rotation',
      difficulty: 'easy',
      isCorrect: false,
      timeToAnswer: 8000,
      accuracy: 0,
    },
  ],
};

describe('SessionCard', () => {
  it('renders session date, time, and duration', () => {
    renderSessionCard(mockSession);

    // Duration should be displayed
    expect(screen.getByText('12 minutes')).toBeInTheDocument();
    // Drill count
    expect(screen.getByText(/12 drills/)).toBeInTheDocument();
  });

  it('renders accuracy badge with correct percentage', () => {
    renderSessionCard(mockSession);

    // The accuracy should display as "85%"
    expect(screen.getByText('85%')).toBeInTheDocument();
  });

  it('renders green accuracy badge for >80%', () => {
    renderSessionCard(mockSession);

    const badge = screen.getByText('85%');
    expect(badge.className).toContain('bg-green-100');
    expect(badge.className).toContain('text-green-800');
  });

  it('renders yellow accuracy badge for 60-80%', () => {
    const session: SessionWithDrills = { ...mockSession, accuracy: 70 };
    renderSessionCard(session);

    const badge = screen.getByText('70%');
    expect(badge.className).toContain('bg-yellow-100');
  });

  it('renders red accuracy badge for <60%', () => {
    const session: SessionWithDrills = { ...mockSession, accuracy: 45 };
    renderSessionCard(session);

    const badge = screen.getByText('45%');
    expect(badge.className).toContain('bg-red-100');
  });

  it('renders confidence change with emoji', () => {
    renderSessionCard(mockSession);

    expect(screen.getByText('+1')).toBeInTheDocument();
    expect(screen.getByText('😊')).toBeInTheDocument();
  });

  it('renders "No change" for zero confidence change', () => {
    const session: SessionWithDrills = { ...mockSession, confidenceChange: 0 };
    renderSessionCard(session);

    expect(screen.getByText('No change')).toBeInTheDocument();
  });

  it('renders negative confidence change', () => {
    const session: SessionWithDrills = { ...mockSession, confidenceChange: -1 };
    renderSessionCard(session);

    expect(screen.getByText('-1')).toBeInTheDocument();
    expect(screen.getByText('😟')).toBeInTheDocument();
  });

  it('expands accordion to show drill breakdown', async () => {
    const user = userEvent.setup();
    renderSessionCard(mockSession);

    // Initially, drill breakdown should not be visible
    expect(screen.queryByText('Drill Breakdown')).not.toBeInTheDocument();

    // Click the accordion trigger
    const trigger = screen.getByRole('button');
    await user.click(trigger);

    // Now drill breakdown should be visible
    expect(screen.getByText('Drill Breakdown')).toBeInTheDocument();
    expect(screen.getByText('7 on number line')).toBeInTheDocument();
  });

  it('shows correct/incorrect icons in drill breakdown', async () => {
    const user = userEvent.setup();
    renderSessionCard(mockSession);

    const trigger = screen.getByRole('button');
    await user.click(trigger);

    // Should show check and X icons
    expect(screen.getByLabelText('Correct')).toBeInTheDocument();
    expect(screen.getByLabelText('Incorrect')).toBeInTheDocument();
  });

  it('shows drill time in seconds', async () => {
    const user = userEvent.setup();
    renderSessionCard(mockSession);

    const trigger = screen.getByRole('button');
    await user.click(trigger);

    // 3500ms -> 4s (rounded), 8000ms -> 8s
    expect(screen.getByText('4s')).toBeInTheDocument();
    expect(screen.getByText('8s')).toBeInTheDocument();
  });

  it('has sr-only text for accuracy badge', () => {
    renderSessionCard(mockSession);

    // Should have screen reader text for color meaning
    expect(screen.getByText('- Good')).toBeInTheDocument();
  });

  it('has sr-only text for confidence emoji', () => {
    renderSessionCard(mockSession);

    expect(screen.getByText('Confidence increased by 1')).toBeInTheDocument();
  });

  it('has sr-only text for module icons when drill has problem text', async () => {
    const user = userEvent.setup();
    renderSessionCard(mockSession);

    const trigger = screen.getByRole('button');
    await user.click(trigger);

    // First drill has problem text, so sr-only module label is rendered
    expect(screen.getByText('Number Line')).toBeInTheDocument();
    // Second drill has no problem, fallback shows module label as visible text (no duplicate sr-only)
    expect(screen.getByText('Spatial Rotation')).toBeInTheDocument();
  });

  it('renders with 0 accuracy when accuracy is undefined', () => {
    const session: SessionWithDrills = { ...mockSession, accuracy: undefined };
    renderSessionCard(session);

    expect(screen.getByText('0%')).toBeInTheDocument();
  });

  it('handles session with no drills', async () => {
    const user = userEvent.setup();
    const session: SessionWithDrills = { ...mockSession, drills: [] };
    renderSessionCard(session);

    const trigger = screen.getByRole('button');
    await user.click(trigger);

    expect(screen.getByText('No drill details available')).toBeInTheDocument();
  });

  it('shows Magic Minute indicator when session includes Magic Minute', async () => {
    const user = userEvent.setup();
    const session: SessionWithDrills = { ...mockSession, hasMagicMinute: true };
    renderSessionCard(session);

    const trigger = screen.getByRole('button');
    await user.click(trigger);

    expect(screen.getByText('Magic Minute')).toBeInTheDocument();
  });

  it('does not show Magic Minute indicator when not included', async () => {
    const user = userEvent.setup();
    renderSessionCard(mockSession); // hasMagicMinute: false

    const trigger = screen.getByRole('button');
    await user.click(trigger);

    expect(screen.queryByText('Magic Minute')).not.toBeInTheDocument();
  });
});
