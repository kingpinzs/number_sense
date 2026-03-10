// SelfDiscoverySummary.test.tsx - Component tests for combined insights summary
// Tests loading, no-data, checklist display, history display, dots performance, recommendations

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '../../../../tests/test-utils';
import userEvent from '@testing-library/user-event';
import SelfDiscoverySummary from './SelfDiscoverySummary';
import type { SymptomChecklistEntry, PersonalHistory } from '../types';

// Mock react-router-dom
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    useLocation: () => ({ pathname: '/self-discovery' }),
  };
});

// Mock db
let mockChecklist: SymptomChecklistEntry | undefined;
let mockHistory: PersonalHistory | undefined;
let mockDotsResults: Array<{ module: string; accuracy: number }>;

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
    drill_results: {
      where: () => ({
        equals: () => ({
          toArray: () => Promise.resolve(mockDotsResults),
        }),
      }),
    },
  },
}));

describe('SelfDiscoverySummary', () => {
  const mockOnBack = vi.fn();

  beforeEach(() => {
    mockChecklist = undefined;
    mockHistory = undefined;
    mockDotsResults = [];
    mockOnBack.mockClear();
  });

  // Test 1: Loading state
  it('shows loading state initially', () => {
    render(<SelfDiscoverySummary onBack={mockOnBack} />);

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  // Test 2: Header rendered
  it('renders summary header', async () => {
    render(<SelfDiscoverySummary onBack={mockOnBack} />);

    await waitFor(() => {
      expect(screen.getByText('Self-Discovery Summary')).toBeInTheDocument();
    });
  });

  // Test 3: No data message
  it('shows no-data message when nothing completed', async () => {
    render(<SelfDiscoverySummary onBack={mockOnBack} />);

    await waitFor(() => {
      expect(
        screen.getByText('Complete at least one tool to see your summary.')
      ).toBeInTheDocument();
    });
  });

  // Test 4: Back button
  it('renders back button', async () => {
    render(<SelfDiscoverySummary onBack={mockOnBack} />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Back to self-discovery' })).toBeInTheDocument();
    });
  });

  // Test 5: Back button calls onBack
  it('calls onBack when back button clicked', async () => {
    const user = userEvent.setup();
    render(<SelfDiscoverySummary onBack={mockOnBack} />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Back to self-discovery' })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: 'Back to self-discovery' }));
    expect(mockOnBack).toHaveBeenCalledOnce();
  });

  // Test 6: Done button
  it('renders Done button', async () => {
    render(<SelfDiscoverySummary onBack={mockOnBack} />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Done' })).toBeInTheDocument();
    });
  });

  // Test 7: Done button calls onBack
  it('calls onBack when Done button clicked', async () => {
    const user = userEvent.setup();
    render(<SelfDiscoverySummary onBack={mockOnBack} />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Done' })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: 'Done' }));
    expect(mockOnBack).toHaveBeenCalledOnce();
  });

  // Test 8: Shows checklist domain impact card
  it('shows Symptom Domain Impact card when checklist exists', async () => {
    mockChecklist = {
      timestamp: '2026-01-15T12:00:00Z',
      symptoms: [
        { symptomId: 'time_management', checked: true, severity: 2 },
      ],
      domainImpact: {
        numberSense: 0.1,
        placeValue: 0.05,
        sequencing: 0.3,
        arithmetic: 0.0,
        spatial: 0.0,
        applied: 0.4,
      },
    };

    render(<SelfDiscoverySummary onBack={mockOnBack} />);

    await waitFor(() => {
      expect(screen.getByText('Symptom Domain Impact')).toBeInTheDocument();
    });
  });

  // Test 9: Shows all 6 domain labels
  it('shows all 6 domain labels in impact chart', async () => {
    mockChecklist = {
      timestamp: '2026-01-15T12:00:00Z',
      symptoms: [],
      domainImpact: {
        numberSense: 0.1,
        placeValue: 0.05,
        sequencing: 0.3,
        arithmetic: 0.0,
        spatial: 0.25,
        applied: 0.4,
      },
    };

    render(<SelfDiscoverySummary onBack={mockOnBack} />);

    await waitFor(() => {
      expect(screen.getByText('Number Sense')).toBeInTheDocument();
    });
    expect(screen.getByText('Place Value')).toBeInTheDocument();
    expect(screen.getByText('Sequencing')).toBeInTheDocument();
    expect(screen.getByText('Arithmetic')).toBeInTheDocument();
    expect(screen.getByText('Spatial')).toBeInTheDocument();
    expect(screen.getByText('Applied Math')).toBeInTheDocument();
  });

  // Test 10: Shows domain percentages
  it('shows domain impact percentages', async () => {
    mockChecklist = {
      timestamp: '2026-01-15T12:00:00Z',
      symptoms: [],
      domainImpact: {
        numberSense: 0.1,
        placeValue: 0.05,
        sequencing: 0.3,
        arithmetic: 0.0,
        spatial: 0.25,
        applied: 0.4,
      },
    };

    render(<SelfDiscoverySummary onBack={mockOnBack} />);

    await waitFor(() => {
      expect(screen.getByText('40%')).toBeInTheDocument();
    });
    expect(screen.getByText('30%')).toBeInTheDocument();
    expect(screen.getByText('25%')).toBeInTheDocument();
  });

  // Test 11: Shows focus areas text
  it('shows focus areas for top domains', async () => {
    mockChecklist = {
      timestamp: '2026-01-15T12:00:00Z',
      symptoms: [],
      domainImpact: {
        numberSense: 0.1,
        placeValue: 0.05,
        sequencing: 0.3,
        arithmetic: 0.0,
        spatial: 0.25,
        applied: 0.4,
      },
    };

    render(<SelfDiscoverySummary onBack={mockOnBack} />);

    await waitFor(() => {
      expect(screen.getByText(/Focus areas:/)).toBeInTheDocument();
    });
  });

  // Test 12: No focus areas when all domains below threshold
  it('hides focus areas when no domains exceed threshold', async () => {
    mockChecklist = {
      timestamp: '2026-01-15T12:00:00Z',
      symptoms: [],
      domainImpact: {
        numberSense: 0.1,
        placeValue: 0.05,
        sequencing: 0.15,
        arithmetic: 0.0,
        spatial: 0.1,
        applied: 0.2,
      },
    };

    render(<SelfDiscoverySummary onBack={mockOnBack} />);

    await waitFor(() => {
      expect(screen.getByText('Symptom Domain Impact')).toBeInTheDocument();
    });

    expect(screen.queryByText(/Focus areas:/)).not.toBeInTheDocument();
  });

  // Test 13: No checklist card when no checklist
  it('hides checklist card when no checklist data', async () => {
    mockHistory = {
      timestamp: '2026-01-01T00:00:00Z',
      lastUpdated: '2026-01-02T00:00:00Z',
      completionStatus: 'completed',
      sections: {},
    };

    render(<SelfDiscoverySummary onBack={mockOnBack} />);

    await waitFor(() => {
      expect(screen.getByText('Personal History')).toBeInTheDocument();
    });

    expect(screen.queryByText('Symptom Domain Impact')).not.toBeInTheDocument();
  });

  // Test 14: Shows Personal History card
  it('shows Personal History card when history exists', async () => {
    mockHistory = {
      timestamp: '2026-01-01T00:00:00Z',
      lastUpdated: '2026-01-02T00:00:00Z',
      completionStatus: 'completed',
      sections: {
        medications: { completed: true, data: {} },
        sensory: { completed: true, data: {} },
        early_childhood: { completed: false, data: {} },
      },
    };

    render(<SelfDiscoverySummary onBack={mockOnBack} />);

    await waitFor(() => {
      expect(screen.getByText('Personal History')).toBeInTheDocument();
    });
  });

  // Test 15: Shows history completion status
  it('shows history completion status', async () => {
    mockHistory = {
      timestamp: '2026-01-01T00:00:00Z',
      lastUpdated: '2026-01-02T00:00:00Z',
      completionStatus: 'completed',
      sections: {},
    };

    render(<SelfDiscoverySummary onBack={mockOnBack} />);

    await waitFor(() => {
      expect(screen.getByText('completed')).toBeInTheDocument();
    });
  });

  // Test 16: Shows history sections completed count
  it('shows sections completed count', async () => {
    mockHistory = {
      timestamp: '2026-01-01T00:00:00Z',
      lastUpdated: '2026-01-02T00:00:00Z',
      completionStatus: 'in-progress',
      sections: {
        medications: { completed: true, data: {} },
        sensory: { completed: true, data: {} },
        early_childhood: { completed: false, data: {} },
      },
    };

    render(<SelfDiscoverySummary onBack={mockOnBack} />);

    await waitFor(() => {
      expect(screen.getByText('2/13')).toBeInTheDocument();
    });
  });

  // Test 17: No history card when no history
  it('hides history card when no history data', async () => {
    mockChecklist = {
      timestamp: '2026-01-15T12:00:00Z',
      symptoms: [],
      domainImpact: {
        numberSense: 0, placeValue: 0, sequencing: 0,
        arithmetic: 0, spatial: 0, applied: 0,
      },
    };

    render(<SelfDiscoverySummary onBack={mockOnBack} />);

    await waitFor(() => {
      expect(screen.getByText('Symptom Domain Impact')).toBeInTheDocument();
    });

    expect(screen.queryByText('Sections completed:')).not.toBeInTheDocument();
  });

  // Test 18: Shows Colored Dots Performance card
  it('shows Colored Dots Performance card when dots results exist', async () => {
    mockDotsResults = [
      { module: 'colored_dots', accuracy: 80 },
      { module: 'colored_dots', accuracy: 60 },
    ];

    render(<SelfDiscoverySummary onBack={mockOnBack} />);

    await waitFor(() => {
      expect(screen.getByText('Colored Dots Performance')).toBeInTheDocument();
    });
  });

  // Test 19: Shows games played count
  it('shows number of games played', async () => {
    mockDotsResults = [
      { module: 'colored_dots', accuracy: 80 },
      { module: 'colored_dots', accuracy: 60 },
      { module: 'colored_dots', accuracy: 90 },
    ];

    render(<SelfDiscoverySummary onBack={mockOnBack} />);

    await waitFor(() => {
      expect(screen.getByText('3')).toBeInTheDocument();
    });
  });

  // Test 20: Shows average accuracy
  it('shows average accuracy percentage', async () => {
    mockDotsResults = [
      { module: 'colored_dots', accuracy: 80 },
      { module: 'colored_dots', accuracy: 60 },
    ];

    render(<SelfDiscoverySummary onBack={mockOnBack} />);

    await waitFor(() => {
      expect(screen.getByText('70%')).toBeInTheDocument(); // (80+60)/2 = 70
    });
  });

  // Test 21: No dots card when no results
  it('hides dots card when no results exist', async () => {
    mockChecklist = {
      timestamp: '2026-01-15T12:00:00Z',
      symptoms: [],
      domainImpact: {
        numberSense: 0, placeValue: 0, sequencing: 0,
        arithmetic: 0, spatial: 0, applied: 0,
      },
    };
    mockDotsResults = [];

    render(<SelfDiscoverySummary onBack={mockOnBack} />);

    await waitFor(() => {
      expect(screen.getByText('Symptom Domain Impact')).toBeInTheDocument();
    });

    expect(screen.queryByText('Colored Dots Performance')).not.toBeInTheDocument();
  });

  // Test 22: Shows recommendations card
  it('shows recommendations card when top domains exist', async () => {
    mockChecklist = {
      timestamp: '2026-01-15T12:00:00Z',
      symptoms: [],
      domainImpact: {
        numberSense: 0.1,
        placeValue: 0.05,
        sequencing: 0.3,
        arithmetic: 0.0,
        spatial: 0.25,
        applied: 0.4,
      },
    };

    render(<SelfDiscoverySummary onBack={mockOnBack} />);

    await waitFor(() => {
      expect(screen.getByText('Recommendations')).toBeInTheDocument();
    });
    expect(screen.getByText(/these areas may benefit from focused practice/)).toBeInTheDocument();
    expect(screen.getByText(/training drills are already weighted/)).toBeInTheDocument();
  });

  // Test 23: No recommendations when no top domains
  it('hides recommendations when no domains above threshold', async () => {
    mockChecklist = {
      timestamp: '2026-01-15T12:00:00Z',
      symptoms: [],
      domainImpact: {
        numberSense: 0.1,
        placeValue: 0.05,
        sequencing: 0.15,
        arithmetic: 0.0,
        spatial: 0.1,
        applied: 0.2,
      },
    };

    render(<SelfDiscoverySummary onBack={mockOnBack} />);

    await waitFor(() => {
      expect(screen.getByText('Symptom Domain Impact')).toBeInTheDocument();
    });

    expect(screen.queryByText('Recommendations')).not.toBeInTheDocument();
  });

  // Test 24: All data present shows all cards
  it('shows all cards when all data sources have data', async () => {
    mockChecklist = {
      timestamp: '2026-01-15T12:00:00Z',
      symptoms: [],
      domainImpact: {
        numberSense: 0.1,
        placeValue: 0.05,
        sequencing: 0.3,
        arithmetic: 0.0,
        spatial: 0.25,
        applied: 0.4,
      },
    };

    mockHistory = {
      timestamp: '2026-01-01T00:00:00Z',
      lastUpdated: '2026-01-02T00:00:00Z',
      completionStatus: 'completed',
      sections: { medications: { completed: true, data: {} } },
    };

    mockDotsResults = [
      { module: 'colored_dots', accuracy: 90 },
    ];

    render(<SelfDiscoverySummary onBack={mockOnBack} />);

    await waitFor(() => {
      expect(screen.getByText('Symptom Domain Impact')).toBeInTheDocument();
    });
    expect(screen.getByText('Personal History')).toBeInTheDocument();
    expect(screen.getByText('Colored Dots Performance')).toBeInTheDocument();
    expect(screen.getByText('Recommendations')).toBeInTheDocument();
  });

  // Test 25: No "no-data" message when only dots data exists
  it('hides no-data message when only dots results exist', async () => {
    mockDotsResults = [
      { module: 'colored_dots', accuracy: 75 },
    ];

    render(<SelfDiscoverySummary onBack={mockOnBack} />);

    await waitFor(() => {
      expect(screen.getByText('Colored Dots Performance')).toBeInTheDocument();
    });

    expect(
      screen.queryByText('Complete at least one tool to see your summary.')
    ).not.toBeInTheDocument();
  });

  // Test 26: Top domains limited to 3
  it('limits focus areas to top 3 domains', async () => {
    mockChecklist = {
      timestamp: '2026-01-15T12:00:00Z',
      symptoms: [],
      domainImpact: {
        numberSense: 0.5,
        placeValue: 0.4,
        sequencing: 0.3,
        arithmetic: 0.25,
        spatial: 0.6,
        applied: 0.7,
      },
    };

    render(<SelfDiscoverySummary onBack={mockOnBack} />);

    await waitFor(() => {
      expect(screen.getByText(/Focus areas:/)).toBeInTheDocument();
    });

    // Focus areas should contain top 3 by impact (applied 0.7, spatial 0.6, numberSense 0.5)
    const focusText = screen.getByText(/Focus areas:/).textContent!;
    expect(focusText).toContain('Applied Math');
    expect(focusText).toContain('Spatial');
    expect(focusText).toContain('Number Sense');
    // Should NOT contain the 4th domain
    expect(focusText).not.toContain('Place Value');
  });

  // Test 27: Done button touch target
  it('Done button has minimum touch target size', async () => {
    render(<SelfDiscoverySummary onBack={mockOnBack} />);

    await waitFor(() => {
      const doneBtn = screen.getByRole('button', { name: 'Done' });
      expect(doneBtn.className).toContain('min-h-[44px]');
    });
  });

  // Test 28: History status and sections labels present
  it('shows Status and Sections completed labels', async () => {
    mockHistory = {
      timestamp: '2026-01-01T00:00:00Z',
      lastUpdated: '2026-01-02T00:00:00Z',
      completionStatus: 'in-progress',
      sections: {},
    };

    render(<SelfDiscoverySummary onBack={mockOnBack} />);

    await waitFor(() => {
      expect(screen.getByText('Status:')).toBeInTheDocument();
      expect(screen.getByText('Sections completed:')).toBeInTheDocument();
    });
  });

  // Test 29: Dots accuracy and count labels
  it('shows Games played and Average accuracy labels', async () => {
    mockDotsResults = [
      { module: 'colored_dots', accuracy: 100 },
    ];

    render(<SelfDiscoverySummary onBack={mockOnBack} />);

    await waitFor(() => {
      expect(screen.getByText('Games played:')).toBeInTheDocument();
      expect(screen.getByText('Average accuracy:')).toBeInTheDocument();
    });
  });
});
