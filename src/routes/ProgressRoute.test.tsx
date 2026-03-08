// ProgressRoute Integration Tests - Story 5.4, 5.5
// Verifies component ordering: Radar > InsightsPanel > SessionHistory > DataExport

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ProgressRoute from './ProgressRoute';
import { useCoachGuidance } from '@/features/coach/hooks/useCoachGuidance';

// Mock child components to isolate ProgressRoute
vi.mock('@/features/progress/hooks/useConfidenceData', () => ({
  useConfidenceData: vi.fn().mockReturnValue({
    isLoading: false,
    current: null,
    baseline: null,
    hasEnoughData: false,
    error: null,
  }),
}));

vi.mock('@/features/progress/components/ConfidenceRadar', () => ({
  default: () => <div data-testid="confidence-radar-mock">Radar</div>,
  ConfidenceRadarEmpty: () => <div data-testid="confidence-radar-empty-mock">Empty Radar</div>,
}));

vi.mock('@/features/progress/components/InsightsPanel', () => ({
  default: () => <div data-testid="insights-panel-mock">Insights</div>,
}));

vi.mock('@/features/progress/components/SessionHistory', () => ({
  default: () => <div data-testid="session-history-mock">History</div>,
}));

vi.mock('@/features/progress/components/DataExport', () => ({
  default: () => <div data-testid="data-export-mock">Export</div>,
}));

vi.mock('@/features/coach/hooks/useCoachGuidance', () => ({
  useCoachGuidance: vi.fn().mockReturnValue({
    guidance: null,
    isLoading: false,
    dismiss: vi.fn(),
  }),
}));

vi.mock('@/features/coach/components/CoachCard', () => ({
  default: ({ guidance }: any) => guidance ? <div data-testid="coach-card">{guidance.title}</div> : null,
}));

function renderRoute() {
  return render(
    <MemoryRouter>
      <ProgressRoute />
    </MemoryRouter>
  );
}

describe('ProgressRoute', () => {
  it('renders the page header', () => {
    renderRoute();

    expect(screen.getByRole('heading', { name: 'Your Progress' })).toBeInTheDocument();
  });

  it('renders InsightsPanel section (AC-3)', () => {
    renderRoute();

    expect(screen.getByTestId('insights-panel-mock')).toBeInTheDocument();
  });

  it('renders SessionHistory section', () => {
    renderRoute();

    expect(screen.getByTestId('session-history-mock')).toBeInTheDocument();
  });

  it('renders Confidence Radar section', () => {
    renderRoute();

    expect(screen.getByText('Confidence Radar')).toBeInTheDocument();
  });

  it('renders DataExport section (Story 5.5)', () => {
    renderRoute();

    expect(screen.getByTestId('data-export-mock')).toBeInTheDocument();
  });

  it('renders sections in correct order: Radar > Insights > History > Export', () => {
    const { container } = renderRoute();

    const allTestIds = Array.from(container.querySelectorAll('[data-testid]'))
      .map(el => el.getAttribute('data-testid'));

    const radarIdx = allTestIds.indexOf('confidence-radar-empty-mock');
    const insightsIdx = allTestIds.indexOf('insights-panel-mock');
    const historyIdx = allTestIds.indexOf('session-history-mock');
    const exportIdx = allTestIds.indexOf('data-export-mock');

    expect(insightsIdx).toBeGreaterThan(radarIdx);
    expect(insightsIdx).toBeLessThan(historyIdx);
    expect(historyIdx).toBeLessThan(exportIdx);
  });

  it('renders CoachCard when guidance is available (AC #2)', () => {
    vi.mocked(useCoachGuidance).mockReturnValue({
      guidance: {
        id: 'after-3-sessions',
        triggerId: 'after-3-sessions',
        title: 'Great Progress!',
        message: "You're building consistency!",
        icon: '🎓',
        priority: 4,
      },
      isLoading: false,
      dismiss: vi.fn(),
    });

    renderRoute();

    expect(screen.getByTestId('coach-card')).toBeInTheDocument();
    expect(screen.getByText('Great Progress!')).toBeInTheDocument();
  });
});
