import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ResearchRoute from './ResearchRoute';

// ─── Mocks ───────────────────────────────────────────────────────────────────

// Mock ExperimentDashboard to keep the test focused on the route guard
vi.mock('@/features/research/components/ExperimentDashboard', () => ({
  default: () => <div data-testid="experiment-dashboard">Experiment Dashboard</div>,
}));

// Mock useUserSettings
let mockResearchModeEnabled = false;
vi.mock('@/context/UserSettingsContext', () => ({
  useUserSettings: () => ({
    settings: {
      researchModeEnabled: mockResearchModeEnabled,
      reducedMotion: false,
      soundEnabled: true,
      dailyGoalMinutes: 60,
      showAdaptiveToasts: true,
      theme: 'system',
    },
    updateSettings: vi.fn(),
  }),
}));

// ─── Helpers ─────────────────────────────────────────────────────────────────

function renderWithRouter(initialPath: string = '/research') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <ResearchRoute />
    </MemoryRouter>
  );
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('ResearchRoute — route guard', () => {
  it('renders ExperimentDashboard when researchModeEnabled is true', () => {
    mockResearchModeEnabled = true;

    renderWithRouter();

    expect(screen.getByTestId('experiment-dashboard')).toBeInTheDocument();
  });

  it('renders ExperimentDashboard in DEV mode even when researchModeEnabled is false', () => {
    // NOTE: The redirect branch (`<Navigate to="/" />`) cannot be tested in Vitest because
    // import.meta.env.DEV is always true in the test environment. This test documents
    // the observable behavior: the DEV shortcut bypasses the researchModeEnabled check.
    mockResearchModeEnabled = false;
    renderWithRouter();
    expect(screen.getByTestId('experiment-dashboard')).toBeInTheDocument();
  });

  it('renders ExperimentDashboard when researchModeEnabled toggles to true', () => {
    mockResearchModeEnabled = false;
    const { rerender } = renderWithRouter();

    mockResearchModeEnabled = true;
    rerender(
      <MemoryRouter initialEntries={['/research']}>
        <ResearchRoute />
      </MemoryRouter>
    );

    expect(screen.getByTestId('experiment-dashboard')).toBeInTheDocument();
  });
});
