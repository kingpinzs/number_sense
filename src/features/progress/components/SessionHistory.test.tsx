// SessionHistory Component Tests - Story 5.2
// AC-1: Session card list, AC-2: Visual design, AC-4: Pagination, AC-5: Empty state

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import SessionHistory from './SessionHistory';
import type { UseSessionHistoryResult, SessionWithDrills } from '../hooks/useSessionHistory';

// Mock the useSessionHistory hook
const mockLoadMore = vi.fn();

const defaultHookResult: UseSessionHistoryResult = {
  isLoading: false,
  sessions: [],
  hasMore: false,
  error: null,
  loadMore: mockLoadMore,
};

let mockHookReturn = { ...defaultHookResult };

vi.mock('../hooks/useSessionHistory', () => ({
  useSessionHistory: () => mockHookReturn,
}));

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

function renderSessionHistory() {
  return render(
    <MemoryRouter>
      <SessionHistory />
    </MemoryRouter>
  );
}

const makeSession = (overrides: Partial<SessionWithDrills> = {}): SessionWithDrills => ({
  id: 1,
  timestamp: new Date().toISOString(),
  module: 'training',
  duration: 720000,
  completionStatus: 'completed',
  drillCount: 12,
  accuracy: 85,
  confidenceBefore: 3,
  confidenceAfter: 4,
  confidenceChange: 1,
  drillQueue: ['number_line', 'spatial_rotation'],
  hasMagicMinute: false,
  drills: [
    {
      id: 1,
      sessionId: 1,
      timestamp: new Date().toISOString(),
      module: 'number_line',
      difficulty: 'medium',
      isCorrect: true,
      timeToAnswer: 3500,
      accuracy: 100,
      problem: '7 on number line',
    },
  ],
  ...overrides,
});

describe('SessionHistory', () => {
  beforeEach(() => {
    mockHookReturn = { ...defaultHookResult };
    mockLoadMore.mockClear();
    mockNavigate.mockClear();
  });

  it('renders loading state', () => {
    mockHookReturn = { ...defaultHookResult, isLoading: true };
    renderSessionHistory();

    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('renders empty state when no sessions', () => {
    mockHookReturn = { ...defaultHookResult, sessions: [] };
    renderSessionHistory();

    expect(screen.getByText('No training sessions yet. Start your first session!')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /start training/i })).toBeInTheDocument();
  });

  it('empty state button navigates to /training', async () => {
    const user = userEvent.setup();
    mockHookReturn = { ...defaultHookResult, sessions: [] };
    renderSessionHistory();

    await user.click(screen.getByRole('button', { name: /start training/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/training');
  });

  it('renders session cards grouped by date', () => {
    const today = new Date().toISOString();
    const lastWeek = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
    const longAgo = new Date('2025-01-15T10:00:00Z').toISOString();

    mockHookReturn = {
      ...defaultHookResult,
      sessions: [
        makeSession({ id: 1, timestamp: today }),
        makeSession({ id: 2, timestamp: lastWeek }),
        makeSession({ id: 3, timestamp: longAgo }),
      ],
    };
    renderSessionHistory();

    // Should have date group headers ("Today" appears as header + in card)
    const todayElements = screen.getAllByText('Today');
    expect(todayElements.length).toBeGreaterThanOrEqual(2); // header + card date
    // Should render session cards (accordion items)
    const buttons = screen.getAllByRole('button');
    // At least 3 accordion triggers (one per session)
    expect(buttons.length).toBeGreaterThanOrEqual(3);
  });

  it('renders "Load More" button when hasMore is true', () => {
    mockHookReturn = {
      ...defaultHookResult,
      sessions: [makeSession()],
      hasMore: true,
    };
    renderSessionHistory();

    expect(screen.getByRole('button', { name: /load more/i })).toBeInTheDocument();
  });

  it('"Load More" button calls loadMore', async () => {
    const user = userEvent.setup();
    mockHookReturn = {
      ...defaultHookResult,
      sessions: [makeSession()],
      hasMore: true,
    };
    renderSessionHistory();

    await user.click(screen.getByRole('button', { name: /load more/i }));
    expect(mockLoadMore).toHaveBeenCalledTimes(1);
  });

  it('hides "Load More" button when hasMore is false', () => {
    mockHookReturn = {
      ...defaultHookResult,
      sessions: [makeSession()],
      hasMore: false,
    };
    renderSessionHistory();

    expect(screen.queryByRole('button', { name: /load more/i })).not.toBeInTheDocument();
  });

  it('renders error state', () => {
    mockHookReturn = {
      ...defaultHookResult,
      error: 'Failed to load session history',
    };
    renderSessionHistory();

    expect(screen.getByText('Failed to load session history')).toBeInTheDocument();
  });

  it('has section heading for session history', () => {
    mockHookReturn = {
      ...defaultHookResult,
      sessions: [makeSession()],
    };
    renderSessionHistory();

    expect(screen.getByText('Session History')).toBeInTheDocument();
  });
});
