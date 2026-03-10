// SymptomResults.test.tsx - Component tests for symptom results display
// Tests loading state, no-data state, domain impact bars, guidance, notes, actions

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '../../../../tests/test-utils';
import userEvent from '@testing-library/user-event';
import SymptomResults from './SymptomResults';
import type { SymptomChecklistEntry } from '../types';

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({ pathname: '/self-discovery' }),
  };
});

// Mock getLatestSymptomChecklist
let mockChecklistData: SymptomChecklistEntry | undefined;
const mockGetLatestSymptomChecklist = vi.fn(() => Promise.resolve(mockChecklistData));

vi.mock('../services/symptomStorage', () => ({
  getLatestSymptomChecklist: () => mockGetLatestSymptomChecklist(),
}));

function makeChecklist(overrides?: Partial<SymptomChecklistEntry>): SymptomChecklistEntry {
  return {
    timestamp: '2026-01-15T12:00:00Z',
    symptoms: [
      { symptomId: 'time_management', checked: true, severity: 2 },
      { symptomId: 'analog_time', checked: true, severity: 3 },
      { symptomId: 'inconsistent_arithmetic', checked: false },
    ],
    domainImpact: {
      numberSense: 0.1,
      placeValue: 0.05,
      sequencing: 0.3,
      arithmetic: 0.0,
      spatial: 0.25,
      applied: 0.4,
    },
    ...overrides,
  };
}

describe('SymptomResults', () => {
  const mockOnRetake = vi.fn();
  const mockOnBack = vi.fn();

  beforeEach(() => {
    mockChecklistData = undefined;
    mockOnRetake.mockClear();
    mockOnBack.mockClear();
    mockNavigate.mockClear();
    // Reset to default implementation (must use mockImplementation, not mockClear)
    mockGetLatestSymptomChecklist.mockImplementation(() => Promise.resolve(mockChecklistData));
  });

  // Test 1: Loading state
  it('shows loading state initially', () => {
    mockChecklistData = undefined;
    // Don't resolve immediately
    mockGetLatestSymptomChecklist.mockReturnValue(new Promise(() => {}));

    render(<SymptomResults onRetake={mockOnRetake} onBack={mockOnBack} />);

    expect(screen.getByText('Loading results...')).toBeInTheDocument();
  });

  // Test 2: No data state
  it('shows no-data message when no checklist found', async () => {
    mockChecklistData = undefined;

    render(<SymptomResults onRetake={mockOnRetake} onBack={mockOnBack} />);

    await waitFor(() => {
      expect(screen.getByText('No checklist results found.')).toBeInTheDocument();
    });
  });

  // Test 3: No-data state shows Take Checklist button
  it('shows Take Checklist button in no-data state', async () => {
    mockChecklistData = undefined;

    render(<SymptomResults onRetake={mockOnRetake} onBack={mockOnBack} />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Take Checklist' })).toBeInTheDocument();
    });
  });

  // Test 4: Take Checklist button calls onRetake
  it('calls onRetake when Take Checklist clicked', async () => {
    mockChecklistData = undefined;
    const user = userEvent.setup();

    render(<SymptomResults onRetake={mockOnRetake} onBack={mockOnBack} />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Take Checklist' })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: 'Take Checklist' }));
    expect(mockOnRetake).toHaveBeenCalledOnce();
  });

  // Test 5: Renders header with data
  it('renders header with symptom count and flagged domains', async () => {
    mockChecklistData = makeChecklist();

    render(<SymptomResults onRetake={mockOnRetake} onBack={mockOnBack} />);

    await waitFor(() => {
      expect(screen.getByText('Your Symptom Profile')).toBeInTheDocument();
    });
    // 2 checked symptoms, domains > 0.2: sequencing, spatial, applied = 3
    expect(screen.getByText('2 symptoms identified across 3 domains')).toBeInTheDocument();
  });

  // Test 6: Shows Domain Impact card
  it('renders Domain Impact card title', async () => {
    mockChecklistData = makeChecklist();

    render(<SymptomResults onRetake={mockOnRetake} onBack={mockOnBack} />);

    await waitFor(() => {
      expect(screen.getByText('Domain Impact')).toBeInTheDocument();
    });
  });

  // Test 7: Shows all 6 domain labels
  it('shows all 6 domain labels in impact chart', async () => {
    mockChecklistData = makeChecklist();

    render(<SymptomResults onRetake={mockOnRetake} onBack={mockOnBack} />);

    await waitFor(() => {
      expect(screen.getByText('Number Sense')).toBeInTheDocument();
    });
    expect(screen.getByText('Place Value')).toBeInTheDocument();
    expect(screen.getByText('Sequencing')).toBeInTheDocument();
    expect(screen.getByText('Arithmetic')).toBeInTheDocument();
    expect(screen.getByText('Spatial')).toBeInTheDocument();
    expect(screen.getByText('Applied Math')).toBeInTheDocument();
  });

  // Test 8: Shows domain percentages
  it('shows domain impact percentages', async () => {
    mockChecklistData = makeChecklist();

    render(<SymptomResults onRetake={mockOnRetake} onBack={mockOnBack} />);

    await waitFor(() => {
      expect(screen.getByText('40%')).toBeInTheDocument(); // applied
    });
    expect(screen.getByText('30%')).toBeInTheDocument(); // sequencing
    expect(screen.getByText('25%')).toBeInTheDocument(); // spatial
    expect(screen.getByText('10%')).toBeInTheDocument(); // numberSense
    expect(screen.getByText('5%')).toBeInTheDocument(); // placeValue
    expect(screen.getByText('0%')).toBeInTheDocument(); // arithmetic
  });

  // Test 9: Progress bars have proper aria attributes
  it('progress bars have aria-valuenow and aria-label', async () => {
    mockChecklistData = makeChecklist();

    render(<SymptomResults onRetake={mockOnRetake} onBack={mockOnBack} />);

    await waitFor(() => {
      const appliedBar = screen.getByRole('progressbar', { name: 'Applied Math: 40%' });
      expect(appliedBar).toHaveAttribute('aria-valuenow', '40');
      expect(appliedBar).toHaveAttribute('aria-valuemin', '0');
      expect(appliedBar).toHaveAttribute('aria-valuemax', '100');
    });
  });

  // Test 10: Domains sorted by impact (highest first)
  it('sorts domains by impact from highest to lowest', async () => {
    mockChecklistData = makeChecklist();

    render(<SymptomResults onRetake={mockOnRetake} onBack={mockOnBack} />);

    await waitFor(() => {
      expect(screen.getByText('Applied Math')).toBeInTheDocument();
    });

    const progressBars = screen.getAllByRole('progressbar');
    expect(progressBars[0]).toHaveAttribute('aria-label', 'Applied Math: 40%');
    expect(progressBars[1]).toHaveAttribute('aria-label', 'Sequencing: 30%');
    expect(progressBars[2]).toHaveAttribute('aria-label', 'Spatial: 25%');
  });

  // Test 11: Shows guidance for flagged domains
  it('shows guidance section for domains above 0.2 threshold', async () => {
    mockChecklistData = makeChecklist();

    render(<SymptomResults onRetake={mockOnRetake} onBack={mockOnBack} />);

    await waitFor(() => {
      expect(screen.getByText('What This Means')).toBeInTheDocument();
    });

    // Should show guidance for sequencing, spatial, and applied (all > 0.2)
    expect(screen.getByText(/Sequencing drills can improve/)).toBeInTheDocument();
    expect(screen.getByText(/Spatial exercises can strengthen/)).toBeInTheDocument();
    expect(screen.getByText(/Applied math practice/)).toBeInTheDocument();
  });

  // Test 12: No guidance when no flagged domains
  it('hides guidance section when no domains exceed threshold', async () => {
    mockChecklistData = makeChecklist({
      domainImpact: {
        numberSense: 0.1,
        placeValue: 0.05,
        sequencing: 0.15,
        arithmetic: 0.0,
        spatial: 0.1,
        applied: 0.2,
      },
    });

    render(<SymptomResults onRetake={mockOnRetake} onBack={mockOnBack} />);

    await waitFor(() => {
      expect(screen.getByText('Domain Impact')).toBeInTheDocument();
    });

    expect(screen.queryByText('What This Means')).not.toBeInTheDocument();
  });

  // Test 13: Notes displayed when present
  it('shows notes section when checklist has notes', async () => {
    mockChecklistData = makeChecklist({ notes: 'My personal experience notes' });

    render(<SymptomResults onRetake={mockOnRetake} onBack={mockOnBack} />);

    await waitFor(() => {
      expect(screen.getByText('Your Notes')).toBeInTheDocument();
    });
    expect(screen.getByText('My personal experience notes')).toBeInTheDocument();
  });

  // Test 14: Notes hidden when absent
  it('hides notes section when checklist has no notes', async () => {
    mockChecklistData = makeChecklist(); // no notes

    render(<SymptomResults onRetake={mockOnRetake} onBack={mockOnBack} />);

    await waitFor(() => {
      expect(screen.getByText('Domain Impact')).toBeInTheDocument();
    });

    expect(screen.queryByText('Your Notes')).not.toBeInTheDocument();
  });

  // Test 15: Retake button
  it('renders Retake button', async () => {
    mockChecklistData = makeChecklist();

    render(<SymptomResults onRetake={mockOnRetake} onBack={mockOnBack} />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Retake/ })).toBeInTheDocument();
    });
  });

  // Test 16: Retake calls onRetake
  it('calls onRetake when Retake button clicked', async () => {
    mockChecklistData = makeChecklist();
    const user = userEvent.setup();

    render(<SymptomResults onRetake={mockOnRetake} onBack={mockOnBack} />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Retake/ })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /Retake/ }));
    expect(mockOnRetake).toHaveBeenCalledOnce();
  });

  // Test 17: Done button
  it('renders Done button', async () => {
    mockChecklistData = makeChecklist();

    render(<SymptomResults onRetake={mockOnRetake} onBack={mockOnBack} />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Done' })).toBeInTheDocument();
    });
  });

  // Test 18: Done calls onBack
  it('calls onBack when Done button clicked', async () => {
    mockChecklistData = makeChecklist();
    const user = userEvent.setup();

    render(<SymptomResults onRetake={mockOnRetake} onBack={mockOnBack} />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Done' })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: 'Done' }));
    expect(mockOnBack).toHaveBeenCalledOnce();
  });

  // Test 19: Back button
  it('calls onBack when back button clicked', async () => {
    mockChecklistData = makeChecklist();
    const user = userEvent.setup();

    render(<SymptomResults onRetake={mockOnRetake} onBack={mockOnBack} />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Back to self-discovery' })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: 'Back to self-discovery' }));
    expect(mockOnBack).toHaveBeenCalledOnce();
  });

  // Test 20: All zero impacts
  it('handles all-zero domain impacts correctly', async () => {
    mockChecklistData = makeChecklist({
      symptoms: [],
      domainImpact: {
        numberSense: 0,
        placeValue: 0,
        sequencing: 0,
        arithmetic: 0,
        spatial: 0,
        applied: 0,
      },
    });

    render(<SymptomResults onRetake={mockOnRetake} onBack={mockOnBack} />);

    await waitFor(() => {
      expect(screen.getByText('Domain Impact')).toBeInTheDocument();
    });

    // All should show 0%
    const zeroPercents = screen.getAllByText('0%');
    expect(zeroPercents).toHaveLength(6);

    // No guidance since all are 0
    expect(screen.queryByText('What This Means')).not.toBeInTheDocument();
  });

  // Test 21: Flagged domains header text with correct count
  it('shows correct flagged domain count in header', async () => {
    // Only 1 domain above threshold
    mockChecklistData = makeChecklist({
      symptoms: [{ symptomId: 'time_management', checked: true, severity: 2 }],
      domainImpact: {
        numberSense: 0.1,
        placeValue: 0.05,
        sequencing: 0.1,
        arithmetic: 0.0,
        spatial: 0.0,
        applied: 0.5,
      },
    });

    render(<SymptomResults onRetake={mockOnRetake} onBack={mockOnBack} />);

    await waitFor(() => {
      expect(screen.getByText('1 symptoms identified across 1 domains')).toBeInTheDocument();
    });
  });

  // Test 22: Touch target sizes on action buttons
  it('action buttons have minimum touch target size', async () => {
    mockChecklistData = makeChecklist();

    render(<SymptomResults onRetake={mockOnRetake} onBack={mockOnBack} />);

    await waitFor(() => {
      const retakeBtn = screen.getByRole('button', { name: /Retake/ });
      expect(retakeBtn.className).toContain('min-h-[44px]');
    });

    const doneBtn = screen.getByRole('button', { name: 'Done' });
    expect(doneBtn.className).toContain('min-h-[44px]');
  });
});
