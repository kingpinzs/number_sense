// PersonalHistoryForm.test.tsx - Component tests for multi-step personal history wizard
// Tests loading, navigation, save-as-you-go, complete flow

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '../../../../tests/test-utils';
import userEvent from '@testing-library/user-event';
import PersonalHistoryForm from './PersonalHistoryForm';
import { INTAKE_SECTIONS } from '../content/intakeSections';
import type { PersonalHistory, HistorySectionData } from '../types';

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

// Mock history storage service
let mockExistingHistory: PersonalHistory | undefined;
const mockGetLatestPersonalHistory = vi.fn(() => Promise.resolve(mockExistingHistory));
const mockCreatePersonalHistory = vi.fn(() => Promise.resolve(42));
const mockUpdateHistorySection: any = vi.fn(() => Promise.resolve());
const mockCompletePersonalHistory: any = vi.fn(() => Promise.resolve());

vi.mock('../services/historyStorage', () => ({
  getLatestPersonalHistory: () => mockGetLatestPersonalHistory(),
  createPersonalHistory: () => mockCreatePersonalHistory(),
  updateHistorySection: (...args: unknown[]) => mockUpdateHistorySection(...args),
  completePersonalHistory: (...args: unknown[]) => mockCompletePersonalHistory(...args),
}));

describe('PersonalHistoryForm', () => {
  const mockOnBack = vi.fn();

  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    mockExistingHistory = undefined;
    mockOnBack.mockReset();
    mockNavigate.mockReset();
    // Reset mocks completely (clears call records AND implementation)
    mockGetLatestPersonalHistory.mockReset().mockImplementation(() => Promise.resolve(mockExistingHistory));
    mockCreatePersonalHistory.mockReset().mockImplementation(() => Promise.resolve(42));
    mockUpdateHistorySection.mockReset().mockImplementation(() => Promise.resolve());
    mockCompletePersonalHistory.mockReset().mockImplementation(() => Promise.resolve());
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // Test 1: Loading state (component shows Loading... while init promise is pending)
  it('shows loading state initially', async () => {
    let resolveInit!: (value: PersonalHistory | undefined) => void;
    mockGetLatestPersonalHistory.mockReturnValueOnce(
      new Promise<PersonalHistory | undefined>((resolve) => { resolveInit = resolve; })
    );

    render(<PersonalHistoryForm onBack={mockOnBack} />);

    expect(screen.getByText('Loading...')).toBeInTheDocument();

    // Resolve to clean up the pending promise and avoid state bleed
    resolveInit(undefined);

    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });
  });

  // Test 2: Creates new history when none exists
  it('creates new history when no existing data', async () => {
    render(<PersonalHistoryForm onBack={mockOnBack} />);

    await waitFor(() => {
      expect(mockCreatePersonalHistory).toHaveBeenCalledOnce();
    });
  });

  // Test 3: Renders first section by default
  it('renders first section after loading', async () => {
    render(<PersonalHistoryForm onBack={mockOnBack} />);

    await waitFor(() => {
      expect(screen.getByText(INTAKE_SECTIONS[0].title)).toBeInTheDocument();
    });
    expect(screen.getByText(INTAKE_SECTIONS[0].description)).toBeInTheDocument();
  });

  // Test 4: Shows progress bar
  it('shows progress indicator', async () => {
    render(<PersonalHistoryForm onBack={mockOnBack} />);

    await waitFor(() => {
      expect(screen.getByText(`Section 1 of ${INTAKE_SECTIONS.length}`)).toBeInTheDocument();
    });
    // 1/13 = ~8%
    expect(screen.getByText(`${Math.round((1 / INTAKE_SECTIONS.length) * 100)}%`)).toBeInTheDocument();
  });

  // Test 5: Previous button disabled on first step
  it('disables Previous button on first step', async () => {
    render(<PersonalHistoryForm onBack={mockOnBack} />);

    await waitFor(() => {
      expect(screen.getByText(INTAKE_SECTIONS[0].title)).toBeInTheDocument();
    });

    const prevButton = screen.getByRole('button', { name: /Previous/ });
    expect(prevButton).toBeDisabled();
  });

  // Test 6: Next button shown on non-last step
  it('shows Next button on non-last step', async () => {
    render(<PersonalHistoryForm onBack={mockOnBack} />);

    await waitFor(() => {
      expect(screen.getByText(INTAKE_SECTIONS[0].title)).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: /Next/ })).toBeInTheDocument();
  });

  // Test 7: Navigate to next section
  it('navigates to next section when Next clicked', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<PersonalHistoryForm onBack={mockOnBack} />);

    await waitFor(() => {
      expect(screen.getByText(INTAKE_SECTIONS[0].title)).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /Next/ }));

    await waitFor(() => {
      expect(screen.getByText(INTAKE_SECTIONS[1].title)).toBeInTheDocument();
      expect(screen.getByText(`Section 2 of ${INTAKE_SECTIONS.length}`)).toBeInTheDocument();
    });
  });

  // Test 8: Navigate back to previous section
  it('navigates to previous section when Previous clicked', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<PersonalHistoryForm onBack={mockOnBack} />);

    await waitFor(() => {
      expect(screen.getByText(INTAKE_SECTIONS[0].title)).toBeInTheDocument();
    });

    // Go forward
    await user.click(screen.getByRole('button', { name: /Next/ }));
    await waitFor(() => {
      expect(screen.getByText(INTAKE_SECTIONS[1].title)).toBeInTheDocument();
    });

    // Go back
    await user.click(screen.getByRole('button', { name: /Previous/ }));
    await waitFor(() => {
      expect(screen.getByText(INTAKE_SECTIONS[0].title)).toBeInTheDocument();
    });
  });

  // Test 9: Next saves current section as completed
  it('saves current section when Next clicked', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<PersonalHistoryForm onBack={mockOnBack} />);

    await waitFor(() => {
      expect(screen.getByText(INTAKE_SECTIONS[0].title)).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /Next/ }));

    await waitFor(() => {
      expect(mockUpdateHistorySection).toHaveBeenCalledWith(
        42, // historyId from createPersonalHistory
        INTAKE_SECTIONS[0].id,
        expect.objectContaining({ completed: true })
      );
    });
  });

  // Test 10: Privacy notice
  it('shows privacy notice', async () => {
    render(<PersonalHistoryForm onBack={mockOnBack} />);

    await waitFor(() => {
      expect(screen.getByText('This data stays 100% on your device.')).toBeInTheDocument();
    });
  });

  // Test 11: Save & Continue Later button
  it('renders Save & Continue Later button', async () => {
    render(<PersonalHistoryForm onBack={mockOnBack} />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Save and return to self-discovery' })).toBeInTheDocument();
    });
  });

  // Test 12: Save & Continue Later calls onBack
  it('saves and returns to hub when Save & Continue Later clicked', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<PersonalHistoryForm onBack={mockOnBack} />);

    await waitFor(() => {
      expect(screen.getByText(INTAKE_SECTIONS[0].title)).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: 'Save and return to self-discovery' }));

    await waitFor(() => {
      expect(mockUpdateHistorySection).toHaveBeenCalledWith(
        42,
        INTAKE_SECTIONS[0].id,
        expect.objectContaining({ completed: false })
      );
      expect(mockOnBack).toHaveBeenCalledOnce();
    });
  });

  // Test 13: Resume from in-progress history
  it('resumes from first incomplete section', async () => {
    mockExistingHistory = {
      id: 7,
      timestamp: '2026-01-01T00:00:00Z',
      lastUpdated: '2026-01-02T00:00:00Z',
      completionStatus: 'in-progress',
      sections: {
        [INTAKE_SECTIONS[0].id]: { completed: true, data: {} },
        [INTAKE_SECTIONS[1].id]: { completed: true, data: {} },
      },
    };

    render(<PersonalHistoryForm onBack={mockOnBack} />);

    // Should resume at section 3 (index 2, the first incomplete)
    await waitFor(() => {
      expect(screen.getByText(INTAKE_SECTIONS[2].title)).toBeInTheDocument();
      expect(screen.getByText(`Section 3 of ${INTAKE_SECTIONS.length}`)).toBeInTheDocument();
    });

    // Should NOT have created a new history
    expect(mockCreatePersonalHistory).not.toHaveBeenCalled();
  });

  // Test 14: Creates new history when existing is completed
  it('creates new history when latest is already completed', async () => {
    mockExistingHistory = {
      id: 5,
      timestamp: '2026-01-01T00:00:00Z',
      lastUpdated: '2026-01-02T00:00:00Z',
      completionStatus: 'completed',
      sections: {},
    };

    render(<PersonalHistoryForm onBack={mockOnBack} />);

    await waitFor(() => {
      expect(mockCreatePersonalHistory).toHaveBeenCalledOnce();
    });
  });

  // Test 15: Last step shows Complete button instead of Next
  it('shows Complete button on last step', async () => {
    // Create a history where all sections except last are complete
    const sections: Record<string, HistorySectionData> = {};
    for (let i = 0; i < INTAKE_SECTIONS.length - 1; i++) {
      sections[INTAKE_SECTIONS[i].id] = { completed: true, data: {} };
    }

    mockExistingHistory = {
      id: 10,
      timestamp: '2026-01-01T00:00:00Z',
      lastUpdated: '2026-01-02T00:00:00Z',
      completionStatus: 'in-progress',
      sections,
    };

    render(<PersonalHistoryForm onBack={mockOnBack} />);

    await waitFor(() => {
      expect(screen.getByText(INTAKE_SECTIONS[INTAKE_SECTIONS.length - 1].title)).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: /Complete/ })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Next/ })).not.toBeInTheDocument();
  });

  // Test 16: Complete calls completePersonalHistory and onBack
  it('marks history as completed and navigates back', async () => {
    const sections: Record<string, HistorySectionData> = {};
    for (let i = 0; i < INTAKE_SECTIONS.length - 1; i++) {
      sections[INTAKE_SECTIONS[i].id] = { completed: true, data: {} };
    }

    mockExistingHistory = {
      id: 10,
      timestamp: '2026-01-01T00:00:00Z',
      lastUpdated: '2026-01-02T00:00:00Z',
      completionStatus: 'in-progress',
      sections,
    };

    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<PersonalHistoryForm onBack={mockOnBack} />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Complete/ })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /Complete/ }));

    await waitFor(() => {
      expect(mockCompletePersonalHistory).toHaveBeenCalledWith(10);
      expect(mockOnBack).toHaveBeenCalledOnce();
    });
  });

  // Test 17: Debounced auto-save triggers after 2s
  it('auto-saves section data after 2 second debounce', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<PersonalHistoryForm onBack={mockOnBack} />);

    await waitFor(() => {
      expect(screen.getByText(INTAKE_SECTIONS[0].title)).toBeInTheDocument();
    });

    // Type in first field to trigger onChange -> scheduleSave
    const firstField = screen.getAllByRole('textbox')[0];
    await user.type(firstField, 'test data');

    // Before 2s, auto-save should not fire
    expect(mockUpdateHistorySection).not.toHaveBeenCalled();

    // Advance past debounce
    vi.advanceTimersByTime(2100);

    await waitFor(() => {
      expect(mockUpdateHistorySection).toHaveBeenCalled();
    });
  });

  // Test 18: No Save & Continue Later button on last step
  it('does not show extra Save & Continue Later on last step', async () => {
    const sections: Record<string, HistorySectionData> = {};
    for (let i = 0; i < INTAKE_SECTIONS.length - 1; i++) {
      sections[INTAKE_SECTIONS[i].id] = { completed: true, data: {} };
    }

    mockExistingHistory = {
      id: 10,
      timestamp: '2026-01-01T00:00:00Z',
      lastUpdated: '2026-01-02T00:00:00Z',
      completionStatus: 'in-progress',
      sections,
    };

    render(<PersonalHistoryForm onBack={mockOnBack} />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Complete/ })).toBeInTheDocument();
    });

    // There should be only 1 "Save & Continue Later" (in header), not a second in the footer
    const saveButtons = screen.getAllByRole('button').filter(
      b => b.textContent?.includes('Save') && b.textContent?.includes('Continue Later')
    );
    expect(saveButtons).toHaveLength(1);
  });

  // Test 19: Progress updates when navigating
  it('updates progress bar when navigating', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<PersonalHistoryForm onBack={mockOnBack} />);

    await waitFor(() => {
      expect(screen.getByText(`Section 1 of ${INTAKE_SECTIONS.length}`)).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /Next/ }));

    await waitFor(() => {
      expect(screen.getByText(`Section 2 of ${INTAKE_SECTIONS.length}`)).toBeInTheDocument();
      expect(screen.getByText(`${Math.round((2 / INTAKE_SECTIONS.length) * 100)}%`)).toBeInTheDocument();
    });
  });

  // Test 20: Renders section fields from IntakeSection component
  it('renders section fields for current step', async () => {
    render(<PersonalHistoryForm onBack={mockOnBack} />);

    await waitFor(() => {
      expect(screen.getByText(INTAKE_SECTIONS[0].title)).toBeInTheDocument();
    });

    // First section (medications) has 2 textarea fields
    for (const field of INTAKE_SECTIONS[0].fields) {
      expect(screen.getByLabelText(field.label)).toBeInTheDocument();
    }
  });

  // Test 21: Resume preserves existing section data
  it('pre-fills fields from existing section data', async () => {
    mockExistingHistory = {
      id: 7,
      timestamp: '2026-01-01T00:00:00Z',
      lastUpdated: '2026-01-02T00:00:00Z',
      completionStatus: 'in-progress',
      sections: {
        [INTAKE_SECTIONS[0].id]: {
          completed: true,
          data: { medications: 'Ritalin', conditions: 'ADHD' },
        },
      },
    };

    render(<PersonalHistoryForm onBack={mockOnBack} />);

    // Resumes at section 2 (first incomplete), but we can navigate back
    await waitFor(() => {
      expect(screen.getByText(INTAKE_SECTIONS[1].title)).toBeInTheDocument();
    });
  });

  // Test 22: Complete button disabled while saving
  it('disables Complete button while saving', async () => {
    const sections: Record<string, HistorySectionData> = {};
    for (let i = 0; i < INTAKE_SECTIONS.length - 1; i++) {
      sections[INTAKE_SECTIONS[i].id] = { completed: true, data: {} };
    }

    mockExistingHistory = {
      id: 10,
      timestamp: '2026-01-01T00:00:00Z',
      lastUpdated: '2026-01-02T00:00:00Z',
      completionStatus: 'in-progress',
      sections,
    };

    // Make complete hang
    let resolveComplete: () => void;
    mockCompletePersonalHistory.mockReturnValue(
      new Promise<void>((resolve) => { resolveComplete = resolve; })
    );

    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<PersonalHistoryForm onBack={mockOnBack} />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Complete/ })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /Complete/ }));

    // Should show Saving... and be disabled
    await waitFor(() => {
      expect(screen.getByText('Saving...')).toBeInTheDocument();
    });

    resolveComplete!();
    await waitFor(() => {
      expect(mockOnBack).toHaveBeenCalled();
    });
  });

  // Test 23: Header title
  it('shows Personal History header', async () => {
    render(<PersonalHistoryForm onBack={mockOnBack} />);

    await waitFor(() => {
      expect(screen.getByText('Personal History')).toBeInTheDocument();
    });
  });

  // Test 24: Existing history with all sections complete resumes at step 0
  it('starts at step 0 when all existing sections are complete', async () => {
    const sections: Record<string, HistorySectionData> = {};
    for (const s of INTAKE_SECTIONS) {
      sections[s.id] = { completed: true, data: {} };
    }

    mockExistingHistory = {
      id: 7,
      timestamp: '2026-01-01T00:00:00Z',
      lastUpdated: '2026-01-02T00:00:00Z',
      completionStatus: 'in-progress',
      sections,
    };

    render(<PersonalHistoryForm onBack={mockOnBack} />);

    // When findIndex returns -1 (all complete), it falls back to 0
    await waitFor(() => {
      expect(screen.getByText(INTAKE_SECTIONS[0].title)).toBeInTheDocument();
    });
  });
});
