// DataExport Component Tests - Story 5.5
// Tests for data export UI component
// Pattern: Mock useDataExport hook, test rendering states (same as InsightsPanel.test.tsx)

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DataExport from './DataExport';
import type { UseDataExportResult } from '../hooks/useDataExport';

// Mock the useDataExport hook
vi.mock('../hooks/useDataExport', () => ({
  useDataExport: vi.fn(),
}));

// Must import after vi.mock
import { useDataExport } from '../hooks/useDataExport';

// Helper to set mock return value
function mockUseDataExport(overrides: Partial<UseDataExportResult> = {}) {
  const defaults: UseDataExportResult = {
    dateRange: 'all_time',
    setDateRange: vi.fn(),
    hasData: true,
    isLoading: false,
    isExporting: false,
    exportCSV: vi.fn(),
    exportJSON: vi.fn(),
  };
  vi.mocked(useDataExport).mockReturnValue({ ...defaults, ...overrides });
  return { ...defaults, ...overrides };
}

describe('DataExport', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders "Export Your Data" heading', () => {
    mockUseDataExport();
    render(<DataExport />);

    expect(screen.getByText('Export Your Data')).toBeInTheDocument();
  });

  it('renders privacy notice text', () => {
    mockUseDataExport();
    render(<DataExport />);

    expect(
      screen.getByText('Your data stays on your device. Exports are created locally.')
    ).toBeInTheDocument();
  });

  it('renders date range selector with 4 options', () => {
    mockUseDataExport();
    render(<DataExport />);

    const select = screen.getByRole('combobox', { name: /date range/i });
    expect(select).toBeInTheDocument();

    const options = select.querySelectorAll('option');
    expect(options.length).toBe(4);
    expect(options[0].textContent).toBe('Last 7 days');
    expect(options[1].textContent).toBe('Last 30 days');
    expect(options[2].textContent).toBe('Last 90 days');
    expect(options[3].textContent).toBe('All time');
  });

  it('renders "Export as CSV" and "Export as JSON" buttons', () => {
    mockUseDataExport();
    render(<DataExport />);

    expect(screen.getByRole('button', { name: 'Export as CSV' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Export as JSON' })).toBeInTheDocument();
  });

  it('disables buttons when hasData is false', () => {
    mockUseDataExport({ hasData: false });
    render(<DataExport />);

    expect(screen.getByRole('button', { name: 'Export as CSV' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Export as JSON' })).toBeDisabled();
  });

  it('shows "No data to export yet" in empty state', () => {
    mockUseDataExport({ hasData: false, isLoading: false });
    render(<DataExport />);

    expect(screen.getByText('No data to export yet')).toBeInTheDocument();
    expect(screen.getByTestId('export-empty')).toBeInTheDocument();
  });

  it('does not show empty state when hasData is true', () => {
    mockUseDataExport({ hasData: true, isLoading: false });
    render(<DataExport />);

    expect(screen.queryByTestId('export-empty')).not.toBeInTheDocument();
  });

  it('does not show empty state while loading', () => {
    mockUseDataExport({ hasData: false, isLoading: true });
    render(<DataExport />);

    expect(screen.queryByTestId('export-empty')).not.toBeInTheDocument();
  });

  it('clicking CSV button calls exportCSV()', async () => {
    const user = userEvent.setup();
    const mocks = mockUseDataExport();

    render(<DataExport />);

    await user.click(screen.getByRole('button', { name: 'Export as CSV' }));
    expect(mocks.exportCSV).toHaveBeenCalledTimes(1);
  });

  it('clicking JSON button calls exportJSON()', async () => {
    const user = userEvent.setup();
    const mocks = mockUseDataExport();

    render(<DataExport />);

    await user.click(screen.getByRole('button', { name: 'Export as JSON' }));
    expect(mocks.exportJSON).toHaveBeenCalledTimes(1);
  });

  it('buttons have min-h-[44px] for touch target (AC-10)', () => {
    mockUseDataExport();
    render(<DataExport />);

    const csvButton = screen.getByRole('button', { name: 'Export as CSV' });
    const jsonButton = screen.getByRole('button', { name: 'Export as JSON' });

    expect(csvButton.className).toContain('min-h-[44px]');
    expect(jsonButton.className).toContain('min-h-[44px]');
  });

  it('disables buttons while exporting', () => {
    mockUseDataExport({ isExporting: true });
    render(<DataExport />);

    expect(screen.getByRole('button', { name: 'Export as CSV' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Export as JSON' })).toBeDisabled();
  });

  it('date range selector calls setDateRange on change', async () => {
    const user = userEvent.setup();
    const mocks = mockUseDataExport();

    render(<DataExport />);

    const select = screen.getByRole('combobox', { name: /date range/i });
    await user.selectOptions(select, 'last_7_days');

    expect(mocks.setDateRange).toHaveBeenCalledWith('last_7_days');
  });

  it('privacy notice uses semantic paragraph element', () => {
    mockUseDataExport();
    render(<DataExport />);

    const notice = screen.getByText('Your data stays on your device. Exports are created locally.');
    expect(notice.tagName).toBe('P');
  });

  it('renders data-testid="data-export" on card', () => {
    mockUseDataExport();
    render(<DataExport />);

    expect(screen.getByTestId('data-export')).toBeInTheDocument();
  });
});
