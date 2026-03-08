// InsightsPanel Component Tests - Story 5.4
// Tests for insights display component
// Pattern: Mock useInsights hook, test rendering states

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import InsightsPanel from './InsightsPanel';
import type { UseInsightsResult } from '../hooks/useInsights';
import type { Insight } from '../services/insightsEngine';

// Mock the useInsights hook
vi.mock('../hooks/useInsights', () => ({
  useInsights: vi.fn(),
}));

import { useInsights } from '../hooks/useInsights';

// Mock navigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Helper to set mock return value (auto-adds refetch stub)
function mockUseInsights(result: Omit<UseInsightsResult, 'refetch'>) {
  vi.mocked(useInsights).mockReturnValue({
    ...result,
    refetch: vi.fn(),
  });
}

// Sample insights for testing
const mockInsights: Insight[] = [
  {
    id: 'consistency-high-week',
    category: 'positive',
    icon: '💪',
    title: 'Great Consistency!',
    message: "You've trained 5 days this week - great consistency!",
    priority: 3,
  },
  {
    id: 'performance-improving-number_line',
    category: 'positive',
    icon: '📈',
    title: 'Number Line Improving!',
    message: 'Your Number Line accuracy improved 15% recently!',
    priority: 3,
  },
  {
    id: 'consistency-low-week',
    category: 'concern',
    icon: '🎯',
    title: 'Train More Regularly',
    message: 'Try to train more regularly - only 1 sessions this week',
    action: { label: 'Start Training', route: '/training' },
    priority: 2,
  },
];

function renderPanel() {
  return render(
    <MemoryRouter>
      <InsightsPanel />
    </MemoryRouter>
  );
}

describe('InsightsPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state', () => {
    mockUseInsights({
      isLoading: true,
      insights: [],
      hasEnoughData: false,
      error: null,
    });

    renderPanel();

    expect(screen.getByText('Insights')).toBeInTheDocument();
    // LoadingSpinner should be present
    expect(screen.getByTestId('insights-panel')).toBeInTheDocument();
  });

  it('renders empty state when not enough data (AC-6)', () => {
    mockUseInsights({
      isLoading: false,
      insights: [],
      hasEnoughData: false,
      error: null,
    });

    renderPanel();

    expect(screen.getByText('Complete a few more sessions to unlock personalized insights!')).toBeInTheDocument();
    expect(screen.getByTestId('insights-empty')).toBeInTheDocument();
  });

  it('renders insight cards with icon, title, and message (AC-3)', () => {
    mockUseInsights({
      isLoading: false,
      insights: mockInsights.slice(0, 2),
      hasEnoughData: true,
      error: null,
    });

    renderPanel();

    // Check first insight
    expect(screen.getByText('Great Consistency!')).toBeInTheDocument();
    expect(screen.getByText("You've trained 5 days this week - great consistency!")).toBeInTheDocument();

    // Check second insight
    expect(screen.getByText('Number Line Improving!')).toBeInTheDocument();
    expect(screen.getByText('Your Number Line accuracy improved 15% recently!')).toBeInTheDocument();
  });

  it('renders emoji icons with role="img" and aria-label (AC-7)', () => {
    mockUseInsights({
      isLoading: false,
      insights: [mockInsights[0]],
      hasEnoughData: true,
      error: null,
    });

    renderPanel();

    const emojiIcon = screen.getByRole('img', { name: 'Strong' });
    expect(emojiIcon).toBeInTheDocument();
    expect(emojiIcon).toHaveTextContent('💪');
  });

  it('renders action button when insight has action (AC-5)', () => {
    mockUseInsights({
      isLoading: false,
      insights: [mockInsights[2]], // The one with action
      hasEnoughData: true,
      error: null,
    });

    renderPanel();

    const actionButton = screen.getByRole('button', { name: 'Start Training' });
    expect(actionButton).toBeInTheDocument();
  });

  it('navigates when action button is clicked (AC-5)', async () => {
    const user = userEvent.setup();

    mockUseInsights({
      isLoading: false,
      insights: [mockInsights[2]], // The one with action
      hasEnoughData: true,
      error: null,
    });

    renderPanel();

    const actionButton = screen.getByRole('button', { name: 'Start Training' });
    await user.click(actionButton);

    expect(mockNavigate).toHaveBeenCalledWith('/training');
  });

  it('does not render action button when insight has no action', () => {
    mockUseInsights({
      isLoading: false,
      insights: [mockInsights[0]], // No action
      hasEnoughData: true,
      error: null,
    });

    renderPanel();

    expect(screen.queryByRole('button', { name: 'Start Training' })).not.toBeInTheDocument();
  });

  it('renders error state', () => {
    mockUseInsights({
      isLoading: false,
      insights: [],
      hasEnoughData: false,
      error: 'Failed to generate insights',
    });

    renderPanel();

    expect(screen.getByText('Failed to generate insights')).toBeInTheDocument();
  });

  it('renders insight cards as article elements for semantics (AC-7)', () => {
    mockUseInsights({
      isLoading: false,
      insights: mockInsights.slice(0, 2),
      hasEnoughData: true,
      error: null,
    });

    renderPanel();

    const articles = screen.getAllByRole('article');
    expect(articles.length).toBe(2);
  });

  it('renders heading in each insight card (AC-7)', () => {
    mockUseInsights({
      isLoading: false,
      insights: [mockInsights[0]],
      hasEnoughData: true,
      error: null,
    });

    renderPanel();

    const heading = screen.getByRole('heading', { name: 'Great Consistency!' });
    expect(heading).toBeInTheDocument();
  });

  it('action button has 44px minimum touch target (AC-7)', () => {
    mockUseInsights({
      isLoading: false,
      insights: [mockInsights[2]], // The one with action
      hasEnoughData: true,
      error: null,
    });

    renderPanel();

    const actionButton = screen.getByRole('button', { name: 'Start Training' });
    expect(actionButton.className).toContain('min-h-[44px]');
  });
});
