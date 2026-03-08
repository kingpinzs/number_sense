import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SyncIndicator } from './SyncIndicator';

// Mock useSyncIndicator hook — isolates UI from business logic
vi.mock('@/services/pwa/useSyncIndicator', () => ({
  useSyncIndicator: vi.fn(() => ({
    isOnline: true,
    syncStatus: 'idle' as const,
    pendingSyncCount: 0,
  })),
}));

// Mock Framer Motion — follow Story 7.3 pattern
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => <div {...props}>{children}</div>,
    span: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => <span {...props}>{children}</span>,
  },
  AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>,
  useReducedMotion: () => false,
}));

import { useSyncIndicator } from '@/services/pwa/useSyncIndicator';
import type { SyncStatus } from '@/services/pwa/useSyncIndicator';

function setMockState(isOnline: boolean, syncStatus: SyncStatus, pendingSyncCount = 0) {
  vi.mocked(useSyncIndicator).mockReturnValue({ isOnline, syncStatus, pendingSyncCount });
}

beforeEach(() => {
  setMockState(true, 'idle');
});

afterEach(() => {
  vi.clearAllMocks();
  setMockState(true, 'idle');
});

describe('SyncIndicator', () => {
  describe('accessibility', () => {
    it('has role="status" on the container', () => {
      render(<SyncIndicator />);
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('has aria-live="polite" on the container', () => {
      render(<SyncIndicator />);
      expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'polite');
    });

    it('has aria-label "Connected" when online and idle', () => {
      setMockState(true, 'idle');
      render(<SyncIndicator />);
      expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Connected');
    });

    it('has aria-label "Offline - data saved locally" when offline', () => {
      setMockState(false, 'idle');
      render(<SyncIndicator />);
      expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Offline - data saved locally');
    });

    it('has aria-label "Syncing data" when syncing', () => {
      setMockState(true, 'syncing');
      render(<SyncIndicator />);
      expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Syncing data');
    });

    it('has aria-label "Sync complete" when complete', () => {
      setMockState(true, 'complete');
      render(<SyncIndicator />);
      expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Sync complete');
    });
  });

  describe('online state (default)', () => {
    it('renders without text when online and idle', () => {
      setMockState(true, 'idle');
      render(<SyncIndicator />);
      expect(screen.queryByText('Offline - data saved locally')).not.toBeInTheDocument();
      expect(screen.queryByText('Syncing...')).not.toBeInTheDocument();
      expect(screen.queryByText('Synced')).not.toBeInTheDocument();
    });
  });

  describe('offline state', () => {
    it('renders "Offline - data saved locally" text', () => {
      setMockState(false, 'idle');
      render(<SyncIndicator />);
      expect(screen.getByText('Offline - data saved locally')).toBeInTheDocument();
    });
  });

  describe('syncing state', () => {
    it('renders "Syncing..." text', () => {
      setMockState(true, 'syncing');
      render(<SyncIndicator />);
      expect(screen.getByText('Syncing...')).toBeInTheDocument();
    });
  });

  describe('sync-complete state', () => {
    it('renders "Synced" text', () => {
      setMockState(true, 'complete');
      render(<SyncIndicator />);
      expect(screen.getByText('Synced')).toBeInTheDocument();
    });
  });

  describe('positioning', () => {
    it('has fixed top-4 right-4 z-30 classes', () => {
      render(<SyncIndicator />);
      const container = screen.getByRole('status');
      expect(container.className).toContain('fixed');
      expect(container.className).toContain('top-4');
      expect(container.className).toContain('right-4');
      expect(container.className).toContain('z-30');
    });
  });
});
