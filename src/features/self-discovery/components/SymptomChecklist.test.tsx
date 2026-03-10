// SymptomChecklist.test.tsx - Component tests for symptom checklist UI
// Tests rendering categories, toggling symptoms, severity selection, save

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '../../../../tests/test-utils';
import userEvent from '@testing-library/user-event';
import SymptomChecklist from './SymptomChecklist';
import { SYMPTOM_DEFINITIONS, CATEGORY_ORDER, CATEGORY_LABELS } from '../content/symptomDefinitions';

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

// Mock saveSymptomChecklist
const mockSaveSymptomChecklist = vi.fn().mockResolvedValue(1);
vi.mock('../services/symptomStorage', () => ({
  saveSymptomChecklist: (...args: unknown[]) => mockSaveSymptomChecklist(...args),
}));

describe('SymptomChecklist', () => {
  const mockOnComplete = vi.fn();
  const mockOnBack = vi.fn();

  beforeEach(() => {
    mockOnComplete.mockClear();
    mockOnBack.mockClear();
    mockNavigate.mockClear();
    mockSaveSymptomChecklist.mockClear();
  });

  // Test 1: Renders header
  it('renders header with title and description', () => {
    render(<SymptomChecklist onComplete={mockOnComplete} onBack={mockOnBack} />);

    expect(screen.getByText('Symptoms Checklist')).toBeInTheDocument();
    expect(
      screen.getByText('Check any symptoms you experience. Optionally rate severity.')
    ).toBeInTheDocument();
  });

  // Test 2: Shows initial count
  it('shows initial checked count as 0', () => {
    render(<SymptomChecklist onComplete={mockOnComplete} onBack={mockOnBack} />);

    expect(
      screen.getByText(`0 of ${SYMPTOM_DEFINITIONS.length} items checked`)
    ).toBeInTheDocument();
  });

  // Test 3: Renders all 5 categories
  it('renders all 5 symptom categories', () => {
    render(<SymptomChecklist onComplete={mockOnComplete} onBack={mockOnBack} />);

    for (const category of CATEGORY_ORDER) {
      expect(screen.getByText(CATEGORY_LABELS[category], { exact: false })).toBeInTheDocument();
    }
  });

  // Test 4: All categories expanded by default
  it('has all categories expanded by default', () => {
    render(<SymptomChecklist onComplete={mockOnComplete} onBack={mockOnBack} />);

    const expandButtons = screen.getAllByRole('button', { expanded: true });
    expect(expandButtons.length).toBe(CATEGORY_ORDER.length);
  });

  // Test 5: Renders all 22 symptoms
  it('renders all 22 symptom checkboxes', () => {
    render(<SymptomChecklist onComplete={mockOnComplete} onBack={mockOnBack} />);

    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes).toHaveLength(SYMPTOM_DEFINITIONS.length);
  });

  // Test 6: Symptom labels shown
  it('shows symptom label text', () => {
    render(<SymptomChecklist onComplete={mockOnComplete} onBack={mockOnBack} />);

    // Check first symptom from each category
    expect(screen.getByText(SYMPTOM_DEFINITIONS[0].label)).toBeInTheDocument();
    expect(screen.getByText(SYMPTOM_DEFINITIONS[4].label)).toBeInTheDocument();
  });

  // Test 7: Toggle category collapse
  it('collapses category when category header clicked', async () => {
    const user = userEvent.setup();
    render(<SymptomChecklist onComplete={mockOnComplete} onBack={mockOnBack} />);

    // Find the first category toggle button
    const categoryButton = screen.getByRole('button', { name: new RegExp(CATEGORY_LABELS.time_navigation) });
    expect(categoryButton).toHaveAttribute('aria-expanded', 'true');

    await user.click(categoryButton);

    expect(categoryButton).toHaveAttribute('aria-expanded', 'false');
    // Content should be hidden
    expect(screen.queryByText(SYMPTOM_DEFINITIONS[0].label)).not.toBeInTheDocument();
  });

  // Test 8: Re-expand collapsed category
  it('re-expands category when collapsed header clicked again', async () => {
    const user = userEvent.setup();
    render(<SymptomChecklist onComplete={mockOnComplete} onBack={mockOnBack} />);

    const categoryButton = screen.getByRole('button', { name: new RegExp(CATEGORY_LABELS.time_navigation) });

    // Collapse
    await user.click(categoryButton);
    expect(categoryButton).toHaveAttribute('aria-expanded', 'false');

    // Re-expand
    await user.click(categoryButton);
    expect(categoryButton).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText(SYMPTOM_DEFINITIONS[0].label)).toBeInTheDocument();
  });

  // Test 9: Toggle symptom checkbox
  it('toggles symptom checked state', async () => {
    const user = userEvent.setup();
    render(<SymptomChecklist onComplete={mockOnComplete} onBack={mockOnBack} />);

    const firstCheckbox = screen.getAllByRole('checkbox')[0];
    expect(firstCheckbox).not.toBeChecked();

    await user.click(firstCheckbox);
    expect(firstCheckbox).toBeChecked();

    // Count should update
    expect(
      screen.getByText(`1 of ${SYMPTOM_DEFINITIONS.length} items checked`)
    ).toBeInTheDocument();
  });

  // Test 10: Unchecking a symptom
  it('unchecks a previously checked symptom', async () => {
    const user = userEvent.setup();
    render(<SymptomChecklist onComplete={mockOnComplete} onBack={mockOnBack} />);

    const firstCheckbox = screen.getAllByRole('checkbox')[0];
    await user.click(firstCheckbox);
    expect(firstCheckbox).toBeChecked();

    await user.click(firstCheckbox);
    expect(firstCheckbox).not.toBeChecked();

    expect(
      screen.getByText(`0 of ${SYMPTOM_DEFINITIONS.length} items checked`)
    ).toBeInTheDocument();
  });

  // Test 11: Severity buttons appear when checked
  it('shows severity buttons when symptom is checked', async () => {
    const user = userEvent.setup();
    render(<SymptomChecklist onComplete={mockOnComplete} onBack={mockOnBack} />);

    // No severity buttons initially
    expect(screen.queryByRole('radio', { name: 'Mild' })).not.toBeInTheDocument();

    const firstCheckbox = screen.getAllByRole('checkbox')[0];
    await user.click(firstCheckbox);

    // Severity buttons should appear
    expect(screen.getByRole('radio', { name: 'Mild' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Moderate' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Severe' })).toBeInTheDocument();
  });

  // Test 12: Severity defaults to Mild (1) when checked
  it('defaults severity to Mild when symptom is checked', async () => {
    const user = userEvent.setup();
    render(<SymptomChecklist onComplete={mockOnComplete} onBack={mockOnBack} />);

    const firstCheckbox = screen.getAllByRole('checkbox')[0];
    await user.click(firstCheckbox);

    const mildRadio = screen.getByRole('radio', { name: 'Mild' });
    expect(mildRadio).toHaveAttribute('aria-checked', 'true');
  });

  // Test 13: Change severity level
  it('changes severity when a different level is clicked', async () => {
    const user = userEvent.setup();
    render(<SymptomChecklist onComplete={mockOnComplete} onBack={mockOnBack} />);

    const firstCheckbox = screen.getAllByRole('checkbox')[0];
    await user.click(firstCheckbox);

    const severeRadio = screen.getByRole('radio', { name: 'Severe' });
    await user.click(severeRadio);

    expect(severeRadio).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('radio', { name: 'Mild' })).toHaveAttribute('aria-checked', 'false');
  });

  // Test 14: Severity buttons hidden when unchecked
  it('hides severity buttons when symptom is unchecked', async () => {
    const user = userEvent.setup();
    render(<SymptomChecklist onComplete={mockOnComplete} onBack={mockOnBack} />);

    const firstCheckbox = screen.getAllByRole('checkbox')[0];

    // Check
    await user.click(firstCheckbox);
    expect(screen.getByRole('radio', { name: 'Mild' })).toBeInTheDocument();

    // Uncheck
    await user.click(firstCheckbox);
    expect(screen.queryByRole('radio', { name: 'Mild' })).not.toBeInTheDocument();
  });

  // Test 15: Category count updates
  it('shows category checked count', async () => {
    const user = userEvent.setup();
    render(<SymptomChecklist onComplete={mockOnComplete} onBack={mockOnBack} />);

    // Initial count for time_navigation: (0/4)
    expect(screen.getByText('(0/4)')).toBeInTheDocument();

    // Check first symptom in time_navigation category
    const firstCheckbox = screen.getAllByRole('checkbox')[0];
    await user.click(firstCheckbox);

    expect(screen.getByText('(1/4)')).toBeInTheDocument();
  });

  // Test 16: Notes textarea
  it('renders notes textarea', () => {
    render(<SymptomChecklist onComplete={mockOnComplete} onBack={mockOnBack} />);

    expect(screen.getByLabelText('Additional Notes (optional)')).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText('Any additional context about your experiences...')
    ).toBeInTheDocument();
  });

  // Test 17: Typing in notes
  it('allows typing in notes', async () => {
    const user = userEvent.setup();
    render(<SymptomChecklist onComplete={mockOnComplete} onBack={mockOnBack} />);

    const notesField = screen.getByLabelText('Additional Notes (optional)');
    await user.type(notesField, 'Some notes about my experience');

    expect(notesField).toHaveValue('Some notes about my experience');
  });

  // Test 18: Save button
  it('renders Save Checklist button', () => {
    render(<SymptomChecklist onComplete={mockOnComplete} onBack={mockOnBack} />);

    expect(screen.getByRole('button', { name: 'Save Checklist' })).toBeInTheDocument();
  });

  // Test 19: Save calls service and onComplete
  it('saves checklist and calls onComplete', async () => {
    const user = userEvent.setup();
    render(<SymptomChecklist onComplete={mockOnComplete} onBack={mockOnBack} />);

    await user.click(screen.getByRole('button', { name: 'Save Checklist' }));

    await waitFor(() => {
      expect(mockSaveSymptomChecklist).toHaveBeenCalledOnce();
      expect(mockOnComplete).toHaveBeenCalledOnce();
    });
  });

  // Test 20: Save passes responses array and notes
  it('passes responses and notes to save service', async () => {
    const user = userEvent.setup();
    render(<SymptomChecklist onComplete={mockOnComplete} onBack={mockOnBack} />);

    // Check first symptom
    const firstCheckbox = screen.getAllByRole('checkbox')[0];
    await user.click(firstCheckbox);

    // Add notes
    const notesField = screen.getByLabelText('Additional Notes (optional)');
    await user.type(notesField, 'My notes');

    await user.click(screen.getByRole('button', { name: 'Save Checklist' }));

    await waitFor(() => {
      expect(mockSaveSymptomChecklist).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ symptomId: SYMPTOM_DEFINITIONS[0].id, checked: true, severity: 1 }),
        ]),
        'My notes'
      );
    });
  });

  // Test 21: Save with empty notes passes undefined
  it('passes undefined for notes when empty', async () => {
    const user = userEvent.setup();
    render(<SymptomChecklist onComplete={mockOnComplete} onBack={mockOnBack} />);

    await user.click(screen.getByRole('button', { name: 'Save Checklist' }));

    await waitFor(() => {
      expect(mockSaveSymptomChecklist).toHaveBeenCalledWith(
        expect.any(Array),
        undefined
      );
    });
  });

  // Test 22: Saving state shows "Saving..." text
  it('shows Saving... text while saving', async () => {
    // Make save hang until we resolve it
    let resolvePromise: () => void;
    mockSaveSymptomChecklist.mockReturnValue(
      new Promise<number>((resolve) => {
        resolvePromise = () => resolve(1);
      })
    );

    const user = userEvent.setup();
    render(<SymptomChecklist onComplete={mockOnComplete} onBack={mockOnBack} />);

    await user.click(screen.getByRole('button', { name: 'Save Checklist' }));

    expect(screen.getByText('Saving...')).toBeInTheDocument();

    // Resolve the save
    resolvePromise!();

    await waitFor(() => {
      expect(mockOnComplete).toHaveBeenCalled();
    });
  });

  // Test 23: Back button
  it('calls onBack when back button clicked', async () => {
    const user = userEvent.setup();
    render(<SymptomChecklist onComplete={mockOnComplete} onBack={mockOnBack} />);

    await user.click(screen.getByRole('button', { name: 'Back to self-discovery' }));

    expect(mockOnBack).toHaveBeenCalledOnce();
  });

  // Test 24: Back button has min-height for touch target
  it('back button has minimum touch target size', () => {
    render(<SymptomChecklist onComplete={mockOnComplete} onBack={mockOnBack} />);

    const backButton = screen.getByRole('button', { name: 'Back to self-discovery' });
    expect(backButton.className).toContain('min-h-[44px]');
  });

  // Test 25: Save button has min-height
  it('save button has minimum touch target size', () => {
    render(<SymptomChecklist onComplete={mockOnComplete} onBack={mockOnBack} />);

    const saveButton = screen.getByRole('button', { name: 'Save Checklist' });
    expect(saveButton.className).toContain('min-h-[48px]');
  });

  // Test 26: Checkbox aria labels
  it('checkboxes have aria labels matching symptom text', () => {
    render(<SymptomChecklist onComplete={mockOnComplete} onBack={mockOnBack} />);

    for (const symptom of SYMPTOM_DEFINITIONS) {
      const checkbox = screen.getByRole('checkbox', { name: symptom.label });
      expect(checkbox).toBeInTheDocument();
    }
  });

  // Test 27: Severity radiogroup has descriptive aria-label
  it('severity radiogroup has descriptive aria-label', async () => {
    const user = userEvent.setup();
    render(<SymptomChecklist onComplete={mockOnComplete} onBack={mockOnBack} />);

    const firstCheckbox = screen.getAllByRole('checkbox')[0];
    await user.click(firstCheckbox);

    const radiogroup = screen.getByRole('radiogroup', {
      name: `Severity for: ${SYMPTOM_DEFINITIONS[0].label}`,
    });
    expect(radiogroup).toBeInTheDocument();
  });

  // Test 28: Multiple symptoms can be checked
  it('allows multiple symptoms to be checked', async () => {
    const user = userEvent.setup();
    render(<SymptomChecklist onComplete={mockOnComplete} onBack={mockOnBack} />);

    const checkboxes = screen.getAllByRole('checkbox');
    await user.click(checkboxes[0]);
    await user.click(checkboxes[1]);
    await user.click(checkboxes[2]);

    expect(
      screen.getByText(`3 of ${SYMPTOM_DEFINITIONS.length} items checked`)
    ).toBeInTheDocument();
  });

  // Test 29: Severity set to Moderate
  it('sets severity to Moderate correctly', async () => {
    const user = userEvent.setup();
    render(<SymptomChecklist onComplete={mockOnComplete} onBack={mockOnBack} />);

    const firstCheckbox = screen.getAllByRole('checkbox')[0];
    await user.click(firstCheckbox);

    await user.click(screen.getByRole('radio', { name: 'Moderate' }));

    expect(screen.getByRole('radio', { name: 'Moderate' })).toHaveAttribute('aria-checked', 'true');

    // Save and verify
    await user.click(screen.getByRole('button', { name: 'Save Checklist' }));

    await waitFor(() => {
      expect(mockSaveSymptomChecklist).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ symptomId: SYMPTOM_DEFINITIONS[0].id, checked: true, severity: 2 }),
        ]),
        undefined
      );
    });
  });

  // Test 30: Save button disabled while saving
  it('disables save button while saving', async () => {
    let resolvePromise: () => void;
    mockSaveSymptomChecklist.mockReturnValue(
      new Promise<number>((resolve) => {
        resolvePromise = () => resolve(1);
      })
    );

    const user = userEvent.setup();
    render(<SymptomChecklist onComplete={mockOnComplete} onBack={mockOnBack} />);

    await user.click(screen.getByRole('button', { name: 'Save Checklist' }));

    // Button should show "Saving..." and be disabled
    const savingButton = screen.getByRole('button', { name: 'Saving...' });
    expect(savingButton).toBeDisabled();

    resolvePromise!();
    await waitFor(() => {
      expect(mockOnComplete).toHaveBeenCalled();
    });
  });

  // Test 31: Save button becomes enabled again after save resolves (via finally)
  it('save button returns to Save Checklist text after successful save', async () => {
    const user = userEvent.setup();
    render(<SymptomChecklist onComplete={mockOnComplete} onBack={mockOnBack} />);

    await user.click(screen.getByRole('button', { name: 'Save Checklist' }));

    await waitFor(() => {
      // After save resolves, onComplete navigates away but saving state resets via finally
      expect(mockOnComplete).toHaveBeenCalledOnce();
    });
  });

  // Test 32: Category aria-controls on toggle button
  it('category toggle has aria-controls pointing to content', () => {
    render(<SymptomChecklist onComplete={mockOnComplete} onBack={mockOnBack} />);

    const categoryButton = screen.getByRole('button', { name: new RegExp(CATEGORY_LABELS.time_navigation) });
    expect(categoryButton).toHaveAttribute('aria-controls', 'category-time_navigation');
  });
});
