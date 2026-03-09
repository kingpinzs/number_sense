import { describe, it, expect, vi, beforeEach, beforeAll, afterAll } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ExperimentDashboard from './ExperimentDashboard';
import { db } from '@/services/storage/db';
import { exportObservationsAsCSV } from '../utils/exportObservations';
import type { ExperimentObservation } from '@/services/storage/schemas';

// Suppress React act() warnings from async state updates in observation count effects
const originalConsoleError = console.error;
beforeAll(() => {
  console.error = (...args: unknown[]) => {
    const msg = String(args[0]);
    if (msg.includes('not wrapped in act(')) return;
    originalConsoleError(...args);
  };
});
afterAll(() => {
  console.error = originalConsoleError;
});

// ─── Mocks ───────────────────────────────────────────────────────────────────

// Mock Dexie — fluent chain: where().equals().toArray()
vi.mock('@/services/storage/db', () => ({
  db: {
    experiment_observations: {
      where: vi.fn().mockReturnThis(),
      equals: vi.fn().mockReturnThis(),
      toArray: vi.fn().mockResolvedValue([]),
      filter: vi.fn().mockReturnThis(),
    },
  },
}));

// Mock exportObservations to avoid DOM/Blob complexity in component tests
vi.mock('../utils/exportObservations', () => ({
  exportObservationsAsCSV: vi.fn(),
}));

// Mock Recharts to avoid canvas/SVG rendering issues in jsdom
vi.mock('recharts', () => ({
  BarChart: ({ children }: { children: React.ReactNode }) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  Legend: () => null,
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
}));

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const MOCK_TREATMENT_OBS: ExperimentObservation = {
  id: 1,
  experimentId: 'drill-timer-visibility',
  variantId: 'treatment',
  metric: 'drill_accuracy',
  value: 0.85,
  timestamp: '2026-03-08T10:00:00.000Z',
  userId: 'user-abc',
};

const MOCK_CONTROL_OBS: ExperimentObservation = {
  id: 2,
  experimentId: 'drill-timer-visibility',
  variantId: 'control',
  metric: 'drill_accuracy',
  value: 0.80,
  timestamp: '2026-03-08T10:01:00.000Z',
  userId: 'user-abc',
};

// ─── Setup ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
  // Default: no observations
  vi.mocked(db.experiment_observations.toArray).mockResolvedValue([]);
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('ExperimentDashboard — list view', () => {
  it('renders the dashboard heading', async () => {
    render(<ExperimentDashboard />);
    expect(screen.getByText('Experiment Dashboard')).toBeInTheDocument();
  });

  it('renders both experiments from the EXPERIMENTS fixture', async () => {
    render(<ExperimentDashboard />);
    // Both experiment names should be visible
    expect(screen.getByText('Drill Timer Visibility')).toBeInTheDocument();
    expect(screen.getByText('Confidence Prompt Scale')).toBeInTheDocument();
  });

  it('renders status badge for each experiment', async () => {
    render(<ExperimentDashboard />);
    // drill-timer-visibility is 'active', confidence-scale is 'draft'
    expect(screen.getByText('active')).toBeInTheDocument();
    expect(screen.getByText('draft')).toBeInTheDocument();
  });

  it('renders a "View Results" button for each experiment', async () => {
    render(<ExperimentDashboard />);
    const buttons = screen.getAllByText('View Results');
    expect(buttons).toHaveLength(2);
  });

  it('shows observation counts after loading', async () => {
    vi.mocked(db.experiment_observations.toArray)
      .mockResolvedValueOnce(new Array(5).fill(MOCK_TREATMENT_OBS)) // drill-timer-visibility
      .mockResolvedValueOnce([]); // confidence-scale

    render(<ExperimentDashboard />);

    await waitFor(() => {
      expect(screen.getByText('5 observations')).toBeInTheDocument();
    });
    expect(screen.getByText('0 observations')).toBeInTheDocument();
  });

  it('renders active experiment before draft experiment (sorted)', async () => {
    render(<ExperimentDashboard />);
    // The active experiment card should appear first in the DOM
    const activeCard = screen.getByTestId('experiment-card-drill-timer-visibility');
    const draftCard = screen.getByTestId('experiment-card-confidence-scale');
    expect(activeCard.compareDocumentPosition(draftCard)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING
    );
  });
});

describe('ExperimentDashboard — results view', () => {
  it('transitions to results view on "View Results" click', async () => {
    const user = userEvent.setup();
    render(<ExperimentDashboard />);

    const viewButton = screen.getAllByText('View Results')[0];
    await user.click(viewButton);

    // Should now be in detail view — shows experiment name in header
    expect(screen.getByText('Drill Timer Visibility')).toBeInTheDocument();
    expect(screen.getByText('← Back')).toBeInTheDocument();
  });

  it('shows "No data collected yet" when experiment has no observations', async () => {
    const user = userEvent.setup();
    vi.mocked(db.experiment_observations.toArray).mockResolvedValue([]);

    render(<ExperimentDashboard />);
    await user.click(screen.getAllByText('View Results')[0]);

    await waitFor(() => {
      expect(screen.getByText('No data collected yet')).toBeInTheDocument();
    });
  });

  it('shows metric comparison table when observations exist', async () => {
    const user = userEvent.setup();
    vi.mocked(db.experiment_observations.toArray)
      .mockResolvedValueOnce([]) // initial count load for drill-timer-visibility
      .mockResolvedValueOnce([]) // initial count load for confidence-scale
      .mockResolvedValueOnce([MOCK_TREATMENT_OBS, MOCK_CONTROL_OBS]); // detail view load

    render(<ExperimentDashboard />);
    await user.click(screen.getAllByText('View Results')[0]);

    await waitFor(() => {
      expect(screen.getByText('Metric Comparison')).toBeInTheDocument();
    });
    expect(screen.getByText('drill_accuracy')).toBeInTheDocument();
  });

  it('shows significance emoji in the metric table', async () => {
    const user = userEvent.setup();
    // treatment=0.95, control=0.50 → 90% diff → 'high' → 🟢
    const highSigObs: ExperimentObservation[] = [
      { ...MOCK_TREATMENT_OBS, value: 0.95, variantId: 'treatment' },
      { ...MOCK_CONTROL_OBS, value: 0.50, variantId: 'control' },
    ];
    vi.mocked(db.experiment_observations.toArray)
      .mockResolvedValueOnce([]) // count load
      .mockResolvedValueOnce([]) // count load
      .mockResolvedValueOnce(highSigObs); // detail view

    render(<ExperimentDashboard />);
    await user.click(screen.getAllByText('View Results')[0]);

    await waitFor(() => {
      expect(screen.getByLabelText('significance: high')).toBeInTheDocument();
    });
    expect(screen.getByText('🟢')).toBeInTheDocument();
  });

  it('shows the Recharts bar chart when data exists', async () => {
    const user = userEvent.setup();
    vi.mocked(db.experiment_observations.toArray)
      .mockResolvedValueOnce([]) // count loads
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([MOCK_TREATMENT_OBS, MOCK_CONTROL_OBS]);

    render(<ExperimentDashboard />);
    await user.click(screen.getAllByText('View Results')[0]);

    await waitFor(() => {
      expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
    });
  });

  it('clicking "Export as CSV" calls exportObservationsAsCSV with experiment id and observations', async () => {
    const user = userEvent.setup();
    vi.mocked(db.experiment_observations.toArray)
      .mockResolvedValueOnce([]) // count load drill-timer-visibility
      .mockResolvedValueOnce([]) // count load confidence-scale
      .mockResolvedValueOnce([MOCK_TREATMENT_OBS, MOCK_CONTROL_OBS]); // detail view

    render(<ExperimentDashboard />);
    await user.click(screen.getAllByText('View Results')[0]);

    await waitFor(() => {
      expect(screen.getByText('Export as CSV')).toBeInTheDocument();
    });
    await user.click(screen.getByText('Export as CSV'));

    expect(vi.mocked(exportObservationsAsCSV)).toHaveBeenCalledWith(
      'drill-timer-visibility',
      [MOCK_TREATMENT_OBS, MOCK_CONTROL_OBS]
    );
  });

  it('omits single-variant metrics from table and shows incomplete metrics notice', async () => {
    const user = userEvent.setup();
    // Only control observations — treatment bucket stays empty → metric should be filtered out
    vi.mocked(db.experiment_observations.toArray)
      .mockResolvedValueOnce([]) // count loads
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ ...MOCK_CONTROL_OBS, metric: 'drill_speed' }]);

    render(<ExperimentDashboard />);
    await user.click(screen.getAllByText('View Results')[0]);

    await waitFor(() => {
      expect(screen.getByLabelText('incomplete metrics notice')).toBeInTheDocument();
    });
    // Notice names the incomplete metric
    expect(screen.getByLabelText('incomplete metrics notice')).toHaveTextContent('drill_speed');
  });

  it('"← Back" button returns to experiment list', async () => {
    const user = userEvent.setup();
    render(<ExperimentDashboard />);

    await user.click(screen.getAllByText('View Results')[0]);
    await user.click(screen.getByText('← Back'));

    // Back in list view
    expect(screen.getByText('Experiment Dashboard')).toBeInTheDocument();
    expect(screen.queryByText('← Back')).not.toBeInTheDocument();
  });
});
