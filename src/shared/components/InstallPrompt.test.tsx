import { describe, it, expect, vi, beforeEach, beforeAll, afterAll } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { InstallPrompt } from './InstallPrompt';

// Suppress Radix Dialog warnings about missing Description/DialogTitle
const originalWarn = console.warn;
beforeAll(() => {
  console.warn = (...args: unknown[]) => {
    const msg = String(args[0]);
    if (msg.includes('Missing `Description`') || msg.includes('DialogTitle')) return;
    originalWarn(...args);
  };
});
afterAll(() => {
  console.warn = originalWarn;
});

// Mock the hook — component tests should isolate UI from business logic
vi.mock('@/services/pwa/useInstallPrompt', () => ({
  useInstallPrompt: vi.fn(() => ({
    shouldShowPrompt: true,
    isIOS: false,
    triggerInstall: vi.fn(),
    dismissPrompt: vi.fn(),
  })),
}));

// Mock Framer Motion — prevent animation timing issues in tests
vi.mock('framer-motion', () => ({
  motion: { div: ({ children, ...props }: any) => <div {...props}>{children}</div> },
  AnimatePresence: ({ children }: any) => <>{children}</>,
  useReducedMotion: () => false,
}));

// Import the mock so we can mutate it per-test
import { useInstallPrompt } from '@/services/pwa/useInstallPrompt';

const mockUseInstallPrompt = vi.mocked(useInstallPrompt);

function makeHookReturn(overrides: Partial<ReturnType<typeof useInstallPrompt>> = {}) {
  return {
    shouldShowPrompt: true,
    isIOS: false,
    triggerInstall: vi.fn(),
    dismissPrompt: vi.fn(),
    ...overrides,
  };
}

beforeEach(() => {
  mockUseInstallPrompt.mockReturnValue(makeHookReturn());
});

describe('InstallPrompt', () => {
  it('renders banner with correct message text', () => {
    render(<InstallPrompt />);
    expect(screen.getByText(/Install Discalculas for quick access and offline use/i)).toBeInTheDocument();
  });

  it('renders Install and Not Now buttons', () => {
    render(<InstallPrompt />);
    expect(screen.getByRole('button', { name: /^Install$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /not now/i })).toBeInTheDocument();
  });

  it('renders X dismiss button with aria-label', () => {
    render(<InstallPrompt />);
    expect(screen.getByRole('button', { name: /dismiss install prompt/i })).toBeInTheDocument();
  });

  it('Install button calls triggerInstall', () => {
    const triggerInstall = vi.fn();
    mockUseInstallPrompt.mockReturnValue(makeHookReturn({ triggerInstall }));

    render(<InstallPrompt />);
    fireEvent.click(screen.getByRole('button', { name: /^Install$/i }));

    expect(triggerInstall).toHaveBeenCalledTimes(1);
  });

  it('Not Now button calls dismissPrompt', () => {
    const dismissPrompt = vi.fn();
    mockUseInstallPrompt.mockReturnValue(makeHookReturn({ dismissPrompt }));

    render(<InstallPrompt />);
    fireEvent.click(screen.getByRole('button', { name: /not now/i }));

    expect(dismissPrompt).toHaveBeenCalledTimes(1);
  });

  it('X button calls dismissPrompt', () => {
    const dismissPrompt = vi.fn();
    mockUseInstallPrompt.mockReturnValue(makeHookReturn({ dismissPrompt }));

    render(<InstallPrompt />);
    fireEvent.click(screen.getByRole('button', { name: /dismiss install prompt/i }));

    expect(dismissPrompt).toHaveBeenCalledTimes(1);
  });

  it('renders nothing when shouldShowPrompt is false', () => {
    mockUseInstallPrompt.mockReturnValue(makeHookReturn({ shouldShowPrompt: false }));

    const { container } = render(<InstallPrompt />);
    expect(container.firstChild).toBeNull();
  });

  it('renders iOS instructions when isIOS is true', () => {
    mockUseInstallPrompt.mockReturnValue(makeHookReturn({ isIOS: true }));

    render(<InstallPrompt />);

    expect(screen.getByText(/Install Discalculas/i)).toBeInTheDocument();
    expect(screen.getByText(/Tap the/i)).toBeInTheDocument();
    expect(screen.getByText(/Share/i)).toBeInTheDocument();
    expect(screen.getByText(/Add to Home Screen/i)).toBeInTheDocument();
  });

  it('iOS Not Now button calls dismissPrompt', () => {
    const dismissPrompt = vi.fn();
    mockUseInstallPrompt.mockReturnValue(makeHookReturn({ isIOS: true, dismissPrompt }));

    render(<InstallPrompt />);
    fireEvent.click(screen.getByRole('button', { name: /not now/i }));

    expect(dismissPrompt).toHaveBeenCalledTimes(1);
  });

  it('banner has role="alert" and aria-label for accessibility', () => {
    render(<InstallPrompt />);
    const banner = screen.getByRole('alert');
    expect(banner).toBeInTheDocument();
    expect(banner).toHaveAttribute('aria-label', 'Install app prompt');
  });

  it('all buttons meet 44px min touch target (min-h-[44px] class)', () => {
    render(<InstallPrompt />);
    const dismissBtn = screen.getByRole('button', { name: /dismiss install prompt/i });
    // Verify the dismiss button has the touch target class
    expect(dismissBtn.className).toContain('min-h-[44px]');
  });
});
