// IntakeSection.test.tsx - Component tests for generic intake section renderer
// Tests rendering of text, textarea, and checkbox fields; change handlers

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '../../../../tests/test-utils';
import userEvent from '@testing-library/user-event';
import IntakeSection from './IntakeSection';
import type { IntakeSection as IntakeSectionDef, HistorySectionData } from '../types';

// Mock react-router-dom
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    useLocation: () => ({ pathname: '/self-discovery' }),
  };
});

describe('IntakeSection', () => {
  const mockOnChange = vi.fn();

  const textareaSection: IntakeSectionDef = {
    id: 'test_section',
    title: 'Test Section Title',
    description: 'Test section description text',
    fields: [
      {
        key: 'field1',
        label: 'First Field',
        type: 'textarea',
        placeholder: 'Enter first field...',
      },
      {
        key: 'field2',
        label: 'Second Field',
        type: 'textarea',
        placeholder: 'Enter second field...',
      },
    ],
  };

  const textSection: IntakeSectionDef = {
    id: 'text_section',
    title: 'Text Section',
    description: 'Section with text inputs',
    fields: [
      {
        key: 'name',
        label: 'Your Name',
        type: 'text',
        placeholder: 'Enter name...',
      },
    ],
  };

  const checkboxSection: IntakeSectionDef = {
    id: 'checkbox_section',
    title: 'Checkbox Section',
    description: 'Section with checkbox inputs',
    fields: [
      {
        key: 'agree',
        label: 'Agreement',
        type: 'checkbox',
        placeholder: 'I agree to the terms',
      },
    ],
  };

  const mixedSection: IntakeSectionDef = {
    id: 'mixed_section',
    title: 'Mixed Section',
    description: 'Section with all field types',
    fields: [
      { key: 'text_field', label: 'Text Input', type: 'text', placeholder: 'Enter text...' },
      { key: 'textarea_field', label: 'Textarea Input', type: 'textarea', placeholder: 'Enter long text...' },
      { key: 'checkbox_field', label: 'Checkbox Input', type: 'checkbox', placeholder: 'Check this' },
    ],
  };

  const emptyData: HistorySectionData = { completed: false, data: {} };

  beforeEach(() => {
    mockOnChange.mockClear();
  });

  // Test 1: Renders section title
  it('renders section title', () => {
    render(<IntakeSection section={textareaSection} data={emptyData} onChange={mockOnChange} />);

    expect(screen.getByText('Test Section Title')).toBeInTheDocument();
  });

  // Test 2: Renders section description
  it('renders section description', () => {
    render(<IntakeSection section={textareaSection} data={emptyData} onChange={mockOnChange} />);

    expect(screen.getByText('Test section description text')).toBeInTheDocument();
  });

  // Test 3: Renders textarea fields
  it('renders textarea fields with labels', () => {
    render(<IntakeSection section={textareaSection} data={emptyData} onChange={mockOnChange} />);

    expect(screen.getByLabelText('First Field')).toBeInTheDocument();
    expect(screen.getByLabelText('Second Field')).toBeInTheDocument();
  });

  // Test 4: Textarea placeholders
  it('shows textarea placeholders', () => {
    render(<IntakeSection section={textareaSection} data={emptyData} onChange={mockOnChange} />);

    expect(screen.getByPlaceholderText('Enter first field...')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter second field...')).toBeInTheDocument();
  });

  // Test 5: Textarea with existing data
  it('pre-fills textarea with existing data', () => {
    const data: HistorySectionData = {
      completed: false,
      data: { field1: 'Existing value', field2: 'Another value' },
    };

    render(<IntakeSection section={textareaSection} data={data} onChange={mockOnChange} />);

    expect(screen.getByLabelText('First Field')).toHaveValue('Existing value');
    expect(screen.getByLabelText('Second Field')).toHaveValue('Another value');
  });

  // Test 6: Typing in textarea calls onChange
  it('calls onChange when textarea content changes', async () => {
    const user = userEvent.setup();
    render(<IntakeSection section={textareaSection} data={emptyData} onChange={mockOnChange} />);

    const field1 = screen.getByLabelText('First Field');
    await user.type(field1, 'A');

    expect(mockOnChange).toHaveBeenCalledWith({
      completed: false,
      data: { field1: 'A' },
    });
  });

  // Test 7: Renders text input fields
  it('renders text input fields', () => {
    render(<IntakeSection section={textSection} data={emptyData} onChange={mockOnChange} />);

    const textInput = screen.getByLabelText('Your Name');
    expect(textInput).toBeInTheDocument();
    expect(textInput.tagName).toBe('INPUT');
    expect(textInput).toHaveAttribute('type', 'text');
  });

  // Test 8: Text input placeholder
  it('shows text input placeholder', () => {
    render(<IntakeSection section={textSection} data={emptyData} onChange={mockOnChange} />);

    expect(screen.getByPlaceholderText('Enter name...')).toBeInTheDocument();
  });

  // Test 9: Text input with existing data
  it('pre-fills text input with existing data', () => {
    const data: HistorySectionData = {
      completed: false,
      data: { name: 'John Doe' },
    };

    render(<IntakeSection section={textSection} data={data} onChange={mockOnChange} />);

    expect(screen.getByLabelText('Your Name')).toHaveValue('John Doe');
  });

  // Test 10: Typing in text input calls onChange
  it('calls onChange when text input changes', async () => {
    const user = userEvent.setup();
    render(<IntakeSection section={textSection} data={emptyData} onChange={mockOnChange} />);

    const textInput = screen.getByLabelText('Your Name');
    await user.type(textInput, 'X');

    expect(mockOnChange).toHaveBeenCalledWith({
      completed: false,
      data: { name: 'X' },
    });
  });

  // Test 11: Renders checkbox fields
  it('renders checkbox fields', () => {
    render(<IntakeSection section={checkboxSection} data={emptyData} onChange={mockOnChange} />);

    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeInTheDocument();
    expect(checkbox).not.toBeChecked();
  });

  // Test 12: Checkbox placeholder text shown
  it('shows checkbox placeholder text as label', () => {
    render(<IntakeSection section={checkboxSection} data={emptyData} onChange={mockOnChange} />);

    expect(screen.getByText('I agree to the terms')).toBeInTheDocument();
  });

  // Test 13: Checkbox with existing true data
  it('pre-checks checkbox when data is "true"', () => {
    const data: HistorySectionData = {
      completed: false,
      data: { agree: 'true' },
    };

    render(<IntakeSection section={checkboxSection} data={data} onChange={mockOnChange} />);

    expect(screen.getByRole('checkbox')).toBeChecked();
  });

  // Test 14: Checkbox unchecked when data is "false"
  it('leaves checkbox unchecked when data is "false"', () => {
    const data: HistorySectionData = {
      completed: false,
      data: { agree: 'false' },
    };

    render(<IntakeSection section={checkboxSection} data={data} onChange={mockOnChange} />);

    expect(screen.getByRole('checkbox')).not.toBeChecked();
  });

  // Test 15: Clicking checkbox calls onChange with "true"
  it('calls onChange with "true" when checkbox checked', async () => {
    const user = userEvent.setup();
    render(<IntakeSection section={checkboxSection} data={emptyData} onChange={mockOnChange} />);

    await user.click(screen.getByRole('checkbox'));

    expect(mockOnChange).toHaveBeenCalledWith({
      completed: false,
      data: { agree: 'true' },
    });
  });

  // Test 16: Unchecking checkbox calls onChange with "false"
  it('calls onChange with "false" when checkbox unchecked', async () => {
    const data: HistorySectionData = {
      completed: false,
      data: { agree: 'true' },
    };

    const user = userEvent.setup();
    render(<IntakeSection section={checkboxSection} data={data} onChange={mockOnChange} />);

    await user.click(screen.getByRole('checkbox'));

    expect(mockOnChange).toHaveBeenCalledWith({
      completed: false,
      data: { agree: 'false' },
    });
  });

  // Test 17: Mixed section renders all field types
  it('renders all field types in a mixed section', () => {
    render(<IntakeSection section={mixedSection} data={emptyData} onChange={mockOnChange} />);

    // Text input
    const textInput = screen.getByLabelText('Text Input');
    expect(textInput.tagName).toBe('INPUT');

    // Textarea
    const textarea = screen.getByLabelText('Textarea Input');
    expect(textarea.tagName).toBe('TEXTAREA');

    // Checkbox
    expect(screen.getByRole('checkbox')).toBeInTheDocument();
  });

  // Test 18: Field IDs follow pattern
  it('fields have IDs following field-{key} pattern', () => {
    render(<IntakeSection section={textareaSection} data={emptyData} onChange={mockOnChange} />);

    expect(document.getElementById('field-field1')).toBeInTheDocument();
    expect(document.getElementById('field-field2')).toBeInTheDocument();
  });

  // Test 19: Empty data key defaults to empty string
  it('uses empty string for missing data keys', () => {
    render(<IntakeSection section={textareaSection} data={emptyData} onChange={mockOnChange} />);

    expect(screen.getByLabelText('First Field')).toHaveValue('');
  });

  // Test 20: onChange preserves existing data
  it('preserves existing data when a single field changes', async () => {
    const data: HistorySectionData = {
      completed: false,
      data: { field1: 'Existing value' },
    };

    const user = userEvent.setup();
    render(<IntakeSection section={textareaSection} data={data} onChange={mockOnChange} />);

    const field2 = screen.getByLabelText('Second Field');
    await user.type(field2, 'B');

    expect(mockOnChange).toHaveBeenCalledWith({
      completed: false,
      data: { field1: 'Existing value', field2: 'B' },
    });
  });

  // Test 21: Text input min-height for touch target
  it('text inputs have minimum touch target height', () => {
    render(<IntakeSection section={textSection} data={emptyData} onChange={mockOnChange} />);

    const textInput = screen.getByLabelText('Your Name');
    expect(textInput.className).toContain('min-h-[44px]');
  });

  // Test 22: Checkbox min-height for touch target
  it('checkbox label has minimum touch target height', () => {
    render(<IntakeSection section={checkboxSection} data={emptyData} onChange={mockOnChange} />);

    const checkbox = screen.getByRole('checkbox');
    const label = checkbox.closest('label');
    expect(label?.className).toContain('min-h-[44px]');
  });
});
