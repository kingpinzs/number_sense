// SelfDiscoveryRoute.test.tsx - Component tests for self-discovery route
// Tests that route renders the SelfDiscoveryHub component

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '../../tests/test-utils';
import SelfDiscoveryRoute from './SelfDiscoveryRoute';

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

// Mock Dexie db (used by SelfDiscoveryHub on mount)
vi.mock('@/services/storage/db', () => ({
  db: {
    symptom_checklists: {
      orderBy: () => ({
        reverse: () => ({
          first: () => Promise.resolve(undefined),
        }),
      }),
    },
    personal_history: {
      orderBy: () => ({
        reverse: () => ({
          first: () => Promise.resolve(undefined),
        }),
      }),
    },
  },
}));

describe('SelfDiscoveryRoute', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  // Test 1: Renders the SelfDiscoveryHub
  it('renders the Self-Discovery hub page', async () => {
    render(<SelfDiscoveryRoute />);

    await waitFor(() => {
      expect(screen.getByText('Self-Discovery')).toBeInTheDocument();
    });
  });

  // Test 2: Shows all tool cards through hub
  it('shows all self-discovery tool cards', async () => {
    render(<SelfDiscoveryRoute />);

    await waitFor(() => {
      expect(screen.getByText('Symptoms Checklist')).toBeInTheDocument();
    });
    expect(screen.getByText('Personal History')).toBeInTheDocument();
    expect(screen.getByText('Colored Dots Test')).toBeInTheDocument();
    expect(screen.getByText('Summary & Insights')).toBeInTheDocument();
  });

  // Test 3: Shows hub description
  it('shows hub description text', async () => {
    render(<SelfDiscoveryRoute />);

    await waitFor(() => {
      expect(
        screen.getByText('Understand your unique number processing patterns')
      ).toBeInTheDocument();
    });
  });

  // Test 4: Privacy notice displayed
  it('shows privacy notice', async () => {
    render(<SelfDiscoveryRoute />);

    await waitFor(() => {
      expect(
        screen.getByText(/All data stays 100% on your device/)
      ).toBeInTheDocument();
    });
  });

  // Test 5: Default state with no data
  it('shows default state with Start buttons and disabled insights', async () => {
    render(<SelfDiscoveryRoute />);

    await waitFor(() => {
      const startButtons = screen.getAllByRole('button', { name: 'Start' });
      expect(startButtons).toHaveLength(2);
    });

    expect(screen.getByRole('button', { name: 'View Insights' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Take Test' })).toBeInTheDocument();
  });
});
