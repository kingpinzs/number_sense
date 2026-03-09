import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '../../tests/test-utils';
import userEvent from '@testing-library/user-event';
import ProfileRoute from './ProfileRoute';

// ─── Mocks ───────────────────────────────────────────────────────────────────

let mockResearchModeEnabled = false;
const mockUpdateSettings = vi.fn();

// NOTE: uses importOriginal to preserve UserSettingsProvider (required by test-utils.tsx)
vi.mock('@/context/UserSettingsContext', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/context/UserSettingsContext')>();
  return {
    ...actual,
    useUserSettings: () => ({
      settings: {
        researchModeEnabled: mockResearchModeEnabled,
        reducedMotion: false,
        soundEnabled: true,
        dailyGoalMinutes: 60,
        showAdaptiveToasts: true,
        theme: 'system',
      },
      updateSettings: mockUpdateSettings,
    }),
  };
});

// ─── Setup ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
  mockResearchModeEnabled = false;
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('ProfileRoute — settings page', () => {
  it('renders the settings page heading', () => {
    render(<ProfileRoute />);
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  it('renders "Research & Experiments" section heading', () => {
    render(<ProfileRoute />);
    expect(screen.getByText('Research & Experiments')).toBeInTheDocument();
  });

  it('renders the research mode section description', () => {
    render(<ProfileRoute />);
    expect(
      screen.getByText(/Help improve Discalculas by participating in experiments/)
    ).toBeInTheDocument();
  });

  it('renders "Enable Research Mode" switch as unchecked when researchModeEnabled is false', () => {
    mockResearchModeEnabled = false;
    render(<ProfileRoute />);
    const toggle = screen.getByRole('switch', { name: 'Enable Research Mode' });
    expect(toggle).toBeInTheDocument();
    expect(toggle).toHaveAttribute('data-state', 'unchecked');
  });

  it('renders "Enable Research Mode" switch as checked when researchModeEnabled is true', () => {
    mockResearchModeEnabled = true;
    render(<ProfileRoute />);
    const toggle = screen.getByRole('switch', { name: 'Enable Research Mode' });
    expect(toggle).toHaveAttribute('data-state', 'checked');
  });
});

describe('ProfileRoute — consent dialog flow', () => {
  it('clicking the switch when OFF opens consent dialog with correct title', async () => {
    const user = userEvent.setup();
    render(<ProfileRoute />);

    await user.click(screen.getByRole('switch', { name: 'Enable Research Mode' }));

    expect(screen.getByText('About Research Mode')).toBeInTheDocument();
  });

  it('clicking the switch when OFF shows consent dialog description', async () => {
    const user = userEvent.setup();
    render(<ProfileRoute />);

    await user.click(screen.getByRole('switch', { name: 'Enable Research Mode' }));

    expect(
      screen.getByText(/experimental features that help us test improvements/)
    ).toBeInTheDocument();
  });

  it('clicking "Enable Research Mode" in dialog calls updateSettings({ researchModeEnabled: true })', async () => {
    const user = userEvent.setup();
    render(<ProfileRoute />);

    await user.click(screen.getByRole('switch', { name: 'Enable Research Mode' }));
    await user.click(screen.getByTestId('confirm-research-mode'));

    expect(mockUpdateSettings).toHaveBeenCalledWith({ researchModeEnabled: true });
    expect(mockUpdateSettings).toHaveBeenCalledTimes(1);
  });

  it('clicking "Cancel" does NOT call updateSettings', async () => {
    const user = userEvent.setup();
    render(<ProfileRoute />);

    await user.click(screen.getByRole('switch', { name: 'Enable Research Mode' }));
    await user.click(screen.getByText('Cancel'));

    expect(mockUpdateSettings).not.toHaveBeenCalled();
  });

  it('dialog closes after "Enable Research Mode" is confirmed', async () => {
    const user = userEvent.setup();
    render(<ProfileRoute />);

    await user.click(screen.getByRole('switch', { name: 'Enable Research Mode' }));
    expect(screen.getByTestId('research-consent-dialog')).toBeInTheDocument();

    await user.click(screen.getByTestId('confirm-research-mode'));

    expect(screen.queryByTestId('research-consent-dialog')).not.toBeInTheDocument();
  });

  it('dialog closes after "Cancel" is clicked', async () => {
    const user = userEvent.setup();
    render(<ProfileRoute />);

    await user.click(screen.getByRole('switch', { name: 'Enable Research Mode' }));
    await user.click(screen.getByText('Cancel'));

    expect(screen.queryByText('About Research Mode')).not.toBeInTheDocument();
  });

  it('clicking outside the dialog does NOT dismiss it', async () => {
    const user = userEvent.setup();
    render(<ProfileRoute />);

    await user.click(screen.getByRole('switch', { name: 'Enable Research Mode' }));
    expect(screen.getByTestId('research-consent-dialog')).toBeInTheDocument();

    // Simulate clicking outside dialog via raw pointerdown — userEvent.click is blocked
    // by the Dialog overlay's `pointer-events: none`, so we use fireEvent.pointerDown
    // to directly trigger Radix DismissableLayer's outside-click detection.
    fireEvent.pointerDown(document.body);

    expect(screen.getByTestId('research-consent-dialog')).toBeInTheDocument();
  });
});

describe('ProfileRoute — toggle OFF behavior', () => {
  it('clicking the switch when ON directly calls updateSettings({ researchModeEnabled: false }) without dialog', async () => {
    mockResearchModeEnabled = true;
    const user = userEvent.setup();
    render(<ProfileRoute />);

    await user.click(screen.getByRole('switch', { name: 'Enable Research Mode' }));

    expect(mockUpdateSettings).toHaveBeenCalledWith({ researchModeEnabled: false });
    expect(screen.queryByText('About Research Mode')).not.toBeInTheDocument();
  });
});
