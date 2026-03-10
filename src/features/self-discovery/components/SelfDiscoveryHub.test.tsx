// SelfDiscoveryHub.test.tsx - Component tests for self-discovery hub page
// Tests rendering, card display, navigation between views, and status labels

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '../../../../tests/test-utils';
import userEvent from '@testing-library/user-event';
import SelfDiscoveryHub from './SelfDiscoveryHub';
import type { SymptomChecklistEntry, PersonalHistory } from '../types';

// Mock react-router-dom hooks
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({ pathname: '/self-discovery' }),
  };
});

// Mock Dexie db
let mockChecklist: SymptomChecklistEntry | undefined;
let mockHistory: PersonalHistory | undefined;

vi.mock('@/services/storage/db', () => ({
  db: {
    symptom_checklists: {
      orderBy: () => ({
        reverse: () => ({
          first: () => Promise.resolve(mockChecklist),
        }),
      }),
    },
    personal_history: {
      orderBy: () => ({
        reverse: () => ({
          first: () => Promise.resolve(mockHistory),
        }),
      }),
    },
  },
}));

// Mock child components to isolate hub testing
vi.mock('./SymptomChecklist', () => ({
  default: ({ onComplete, onBack }: { onComplete: () => void; onBack: () => void }) => (
    <div data-testid="symptom-checklist">
      <button onClick={onComplete}>Complete Checklist</button>
      <button onClick={onBack}>Back from Checklist</button>
    </div>
  ),
}));

vi.mock('./SymptomResults', () => ({
  default: ({ onRetake, onBack }: { onRetake: () => void; onBack: () => void }) => (
    <div data-testid="symptom-results">
      <button onClick={onRetake}>Retake</button>
      <button onClick={onBack}>Back from Results</button>
    </div>
  ),
}));

vi.mock('./PersonalHistoryForm', () => ({
  default: ({ onBack }: { onBack: () => void }) => (
    <div data-testid="personal-history-form">
      <button onClick={onBack}>Back from History</button>
    </div>
  ),
}));

vi.mock('./ColoredDotsTest', () => ({
  default: ({ onBack }: { onBack: () => void }) => (
    <div data-testid="colored-dots-test">
      <button onClick={onBack}>Back from Dots</button>
    </div>
  ),
}));

vi.mock('./SelfDiscoverySummary', () => ({
  default: ({ onBack }: { onBack: () => void }) => (
    <div data-testid="self-discovery-summary">
      <button onClick={onBack}>Back from Summary</button>
    </div>
  ),
}));

describe('SelfDiscoveryHub', () => {
  beforeEach(() => {
    mockChecklist = undefined;
    mockHistory = undefined;
    mockNavigate.mockClear();
  });

  // Test 1: Renders hub header
  it('renders hub header and description', async () => {
    render(<SelfDiscoveryHub />);

    await waitFor(() => {
      expect(screen.getByText('Self-Discovery')).toBeInTheDocument();
    });
    expect(
      screen.getByText('Understand your unique number processing patterns')
    ).toBeInTheDocument();
  });

  // Test 2: Shows privacy notice
  it('shows privacy notice', async () => {
    render(<SelfDiscoveryHub />);

    await waitFor(() => {
      expect(
        screen.getByText(/All data stays 100% on your device/)
      ).toBeInTheDocument();
    });
  });

  // Test 3: Renders all 4 cards
  it('renders all 4 self-discovery tool cards', async () => {
    render(<SelfDiscoveryHub />);

    await waitFor(() => {
      expect(screen.getByText('Symptoms Checklist')).toBeInTheDocument();
    });
    expect(screen.getByText('Personal History')).toBeInTheDocument();
    expect(screen.getByText('Colored Dots Test')).toBeInTheDocument();
    expect(screen.getByText('Summary & Insights')).toBeInTheDocument();
  });

  // Test 4: Card descriptions
  it('shows card descriptions', async () => {
    render(<SelfDiscoveryHub />);

    await waitFor(() => {
      expect(
        screen.getByText('22 real-world symptoms mapped to your training domains')
      ).toBeInTheDocument();
    });
    expect(
      screen.getByText('13-section developmental, medical, and academic questionnaire')
    ).toBeInTheDocument();
    expect(
      screen.getByText('Visual processing test for subitizing and selective attention')
    ).toBeInTheDocument();
    expect(
      screen.getByText('Combined view of all your self-discovery results')
    ).toBeInTheDocument();
  });

  // Test 5: Default status — no data
  it('shows "Not started" when no checklist or history data', async () => {
    render(<SelfDiscoveryHub />);

    await waitFor(() => {
      const statuses = screen.getAllByText('Not started');
      expect(statuses).toHaveLength(2);
    });
  });

  // Test 6: Checklist button says "Start" when no data
  it('shows "Start" buttons when no checklist or history data', async () => {
    render(<SelfDiscoveryHub />);

    await waitFor(() => {
      const startButtons = screen.getAllByText('Start');
      expect(startButtons).toHaveLength(2);
    });
  });

  // Test 7: History button shows "Start" when no data
  it('shows "Start" buttons when no data exists', async () => {
    render(<SelfDiscoveryHub />);

    await waitFor(() => {
      const startButtons = screen.getAllByRole('button', { name: 'Start' });
      expect(startButtons).toHaveLength(2);
    });
  });

  // Test 8: Checklist completed shows "Retake" and "Completed"
  it('shows "Retake" and "Completed" when checklist data exists', async () => {
    mockChecklist = {
      timestamp: '2026-01-01T00:00:00Z',
      symptoms: [],
      domainImpact: { numberSense: 0, placeValue: 0, sequencing: 0, arithmetic: 0, spatial: 0, applied: 0 },
    };
    render(<SelfDiscoveryHub />);

    await waitFor(() => {
      expect(screen.getByText('Completed')).toBeInTheDocument();
      expect(screen.getByText('Retake')).toBeInTheDocument();
    });
  });

  // Test 9: History completed shows "Continue" and "Completed"
  it('shows "Continue" and "Completed" when history is completed', async () => {
    mockHistory = {
      timestamp: '2026-01-01T00:00:00Z',
      lastUpdated: '2026-01-01T00:00:00Z',
      completionStatus: 'completed',
      sections: {},
    };
    render(<SelfDiscoveryHub />);

    await waitFor(() => {
      expect(screen.getByText('Completed')).toBeInTheDocument();
      expect(screen.getByText('Continue')).toBeInTheDocument();
    });
  });

  // Test 10: History in-progress shows "In progress" and "Continue"
  it('shows "In progress" and "Continue" when history is in progress', async () => {
    mockHistory = {
      timestamp: '2026-01-01T00:00:00Z',
      lastUpdated: '2026-01-01T00:00:00Z',
      completionStatus: 'in-progress',
      sections: {},
    };
    render(<SelfDiscoveryHub />);

    await waitFor(() => {
      expect(screen.getByText('In progress')).toBeInTheDocument();
      expect(screen.getByText('Continue')).toBeInTheDocument();
    });
  });

  // Test 11: View Insights disabled when no data
  it('disables View Insights button when no data exists', async () => {
    render(<SelfDiscoveryHub />);

    await waitFor(() => {
      const insightsBtn = screen.getByRole('button', { name: 'View Insights' });
      expect(insightsBtn).toBeDisabled();
    });
  });

  // Test 12: View Insights enabled when checklist exists
  it('enables View Insights button when checklist data exists', async () => {
    mockChecklist = {
      timestamp: '2026-01-01T00:00:00Z',
      symptoms: [],
      domainImpact: { numberSense: 0, placeValue: 0, sequencing: 0, arithmetic: 0, spatial: 0, applied: 0 },
    };
    render(<SelfDiscoveryHub />);

    await waitFor(() => {
      const insightsBtn = screen.getByRole('button', { name: 'View Insights' });
      expect(insightsBtn).not.toBeDisabled();
    });
  });

  // Test 13: View Insights enabled when history exists
  it('enables View Insights button when history data exists', async () => {
    mockHistory = {
      timestamp: '2026-01-01T00:00:00Z',
      lastUpdated: '2026-01-01T00:00:00Z',
      completionStatus: 'completed',
      sections: {},
    };
    render(<SelfDiscoveryHub />);

    await waitFor(() => {
      const insightsBtn = screen.getByRole('button', { name: 'View Insights' });
      expect(insightsBtn).not.toBeDisabled();
    });
  });

  // Test 14: Navigate to checklist view
  it('navigates to checklist view when Start clicked', async () => {
    const user = userEvent.setup();
    render(<SelfDiscoveryHub />);

    await waitFor(() => {
      expect(screen.getByText('Symptoms Checklist')).toBeInTheDocument();
    });

    // First Start button is for Symptoms Checklist
    const startButtons = screen.getAllByRole('button', { name: 'Start' });
    await user.click(startButtons[0]);

    expect(screen.getByTestId('symptom-checklist')).toBeInTheDocument();
    expect(screen.queryByText('Self-Discovery')).not.toBeInTheDocument();
  });

  // Test 15: Navigate to history view
  it('navigates to history view when Start clicked', async () => {
    const user = userEvent.setup();
    render(<SelfDiscoveryHub />);

    await waitFor(() => {
      expect(screen.getByText('Personal History')).toBeInTheDocument();
    });

    // Second Start button is for Personal History
    const startButtons = screen.getAllByRole('button', { name: 'Start' });
    await user.click(startButtons[1]);

    expect(screen.getByTestId('personal-history-form')).toBeInTheDocument();
  });

  // Test 16: Navigate to colored dots test
  it('navigates to colored dots test when Take Test clicked', async () => {
    const user = userEvent.setup();
    render(<SelfDiscoveryHub />);

    await waitFor(() => {
      expect(screen.getByText('Colored Dots Test')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: 'Take Test' }));

    expect(screen.getByTestId('colored-dots-test')).toBeInTheDocument();
  });

  // Test 17: Navigate to summary view
  it('navigates to summary view when View Insights clicked', async () => {
    mockChecklist = {
      timestamp: '2026-01-01T00:00:00Z',
      symptoms: [],
      domainImpact: { numberSense: 0, placeValue: 0, sequencing: 0, arithmetic: 0, spatial: 0, applied: 0 },
    };
    const user = userEvent.setup();
    render(<SelfDiscoveryHub />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'View Insights' })).not.toBeDisabled();
    });

    await user.click(screen.getByRole('button', { name: 'View Insights' }));

    expect(screen.getByTestId('self-discovery-summary')).toBeInTheDocument();
  });

  // Test 18: Back from checklist returns to hub
  it('returns to hub when back from checklist', async () => {
    const user = userEvent.setup();
    render(<SelfDiscoveryHub />);

    await waitFor(() => {
      expect(screen.getByText('Symptoms Checklist')).toBeInTheDocument();
    });

    const startButtons = screen.getAllByRole('button', { name: 'Start' });
    await user.click(startButtons[0]);
    expect(screen.getByTestId('symptom-checklist')).toBeInTheDocument();

    await user.click(screen.getByText('Back from Checklist'));

    await waitFor(() => {
      expect(screen.getByText('Self-Discovery')).toBeInTheDocument();
    });
  });

  // Test 19: Completing checklist navigates to results
  it('navigates to results after checklist completion', async () => {
    const user = userEvent.setup();
    render(<SelfDiscoveryHub />);

    await waitFor(() => {
      expect(screen.getByText('Symptoms Checklist')).toBeInTheDocument();
    });

    const startButtons = screen.getAllByRole('button', { name: 'Start' });
    await user.click(startButtons[0]);

    await user.click(screen.getByText('Complete Checklist'));

    expect(screen.getByTestId('symptom-results')).toBeInTheDocument();
  });

  // Test 20: From results, retake goes back to checklist
  it('navigates to checklist from results via retake', async () => {
    const user = userEvent.setup();
    render(<SelfDiscoveryHub />);

    await waitFor(() => {
      expect(screen.getByText('Symptoms Checklist')).toBeInTheDocument();
    });

    // Go to checklist
    const startButtons = screen.getAllByRole('button', { name: 'Start' });
    await user.click(startButtons[0]);

    // Complete it -> results
    await user.click(screen.getByText('Complete Checklist'));
    expect(screen.getByTestId('symptom-results')).toBeInTheDocument();

    // Retake -> back to checklist
    await user.click(screen.getByText('Retake'));
    expect(screen.getByTestId('symptom-checklist')).toBeInTheDocument();
  });

  // Test 21: From results, back goes to hub
  it('returns to hub from results via back', async () => {
    const user = userEvent.setup();
    render(<SelfDiscoveryHub />);

    await waitFor(() => {
      expect(screen.getByText('Symptoms Checklist')).toBeInTheDocument();
    });

    const startButtons = screen.getAllByRole('button', { name: 'Start' });
    await user.click(startButtons[0]);
    await user.click(screen.getByText('Complete Checklist'));
    expect(screen.getByTestId('symptom-results')).toBeInTheDocument();

    await user.click(screen.getByText('Back from Results'));

    await waitFor(() => {
      expect(screen.getByText('Self-Discovery')).toBeInTheDocument();
    });
  });

  // Test 22: Back from history returns to hub
  it('returns to hub from personal history form', async () => {
    const user = userEvent.setup();
    render(<SelfDiscoveryHub />);

    await waitFor(() => {
      expect(screen.getByText('Personal History')).toBeInTheDocument();
    });

    const startButtons = screen.getAllByRole('button', { name: 'Start' });
    await user.click(startButtons[1]);
    expect(screen.getByTestId('personal-history-form')).toBeInTheDocument();

    await user.click(screen.getByText('Back from History'));

    await waitFor(() => {
      expect(screen.getByText('Self-Discovery')).toBeInTheDocument();
    });
  });

  // Test 23: Back from colored dots returns to hub
  it('returns to hub from colored dots test', async () => {
    const user = userEvent.setup();
    render(<SelfDiscoveryHub />);

    await waitFor(() => {
      expect(screen.getByText('Colored Dots Test')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: 'Take Test' }));
    expect(screen.getByTestId('colored-dots-test')).toBeInTheDocument();

    await user.click(screen.getByText('Back from Dots'));

    await waitFor(() => {
      expect(screen.getByText('Self-Discovery')).toBeInTheDocument();
    });
  });

  // Test 24: Back from summary returns to hub
  it('returns to hub from summary', async () => {
    mockChecklist = {
      timestamp: '2026-01-01T00:00:00Z',
      symptoms: [],
      domainImpact: { numberSense: 0, placeValue: 0, sequencing: 0, arithmetic: 0, spatial: 0, applied: 0 },
    };
    const user = userEvent.setup();
    render(<SelfDiscoveryHub />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'View Insights' })).not.toBeDisabled();
    });

    await user.click(screen.getByRole('button', { name: 'View Insights' }));
    expect(screen.getByTestId('self-discovery-summary')).toBeInTheDocument();

    await user.click(screen.getByText('Back from Summary'));

    await waitFor(() => {
      expect(screen.getByText('Self-Discovery')).toBeInTheDocument();
    });
  });
});
