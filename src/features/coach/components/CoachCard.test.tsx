// CoachCard component tests - Story 6.1
// Tests rendering, dismiss, action navigation, null state, accessibility

import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import CoachCard from './CoachCard';
import type { CoachMessage } from '../types';

// Mock framer-motion to avoid animation timing issues
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, initial: _initial, animate: _animate, exit: _exit, transition: _transition, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => children,
  useReducedMotion: vi.fn(() => false),
}));

// Mock react-router-dom navigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const mockGuidance: CoachMessage = {
  id: 'test-tip',
  triggerId: 'test-trigger',
  title: 'Coach Tip',
  message: 'This is a helpful tip for you.',
  icon: '🎓',
  priority: 1,
  action: {
    label: 'Start Training',
    route: '/training',
  },
};

const mockGuidanceNoAction: CoachMessage = {
  id: 'no-action-tip',
  triggerId: 'no-action',
  title: 'Simple Tip',
  message: 'Just a simple message.',
  icon: '💬',
  priority: 2,
};

function renderCoachCard(guidance: CoachMessage | null, onDismiss = vi.fn()) {
  return render(
    <MemoryRouter>
      <CoachCard guidance={guidance} onDismiss={onDismiss} />
    </MemoryRouter>
  );
}

describe('CoachCard', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders coach card with title, message, and icon', () => {
    renderCoachCard(mockGuidance);

    expect(screen.getByText('Coach Tip')).toBeInTheDocument();
    expect(screen.getByText('This is a helpful tip for you.')).toBeInTheDocument();
    expect(screen.getByText('🎓')).toBeInTheDocument();
  });

  it('renders action button and navigates on click', () => {
    renderCoachCard(mockGuidance);

    const actionButton = screen.getByRole('button', { name: 'Start Training' });
    expect(actionButton).toBeInTheDocument();

    fireEvent.click(actionButton);
    expect(mockNavigate).toHaveBeenCalledWith('/training');
  });

  it('does not render action button when guidance has no action', () => {
    renderCoachCard(mockGuidanceNoAction);

    expect(screen.queryByRole('button', { name: 'Start Training' })).not.toBeInTheDocument();
    expect(screen.getByText('Simple Tip')).toBeInTheDocument();
  });

  it('calls onDismiss when dismiss button clicked', () => {
    const onDismiss = vi.fn();
    renderCoachCard(mockGuidance, onDismiss);

    const dismissButton = screen.getByLabelText('Dismiss coach tip');
    fireEvent.click(dismissButton);

    expect(onDismiss).toHaveBeenCalledOnce();
  });

  it('renders nothing when guidance is null', () => {
    const { container } = renderCoachCard(null);
    expect(container.innerHTML).toBe('');
  });

  it('has correct accessibility attributes', () => {
    renderCoachCard(mockGuidance);

    // Card has role="region" with aria-label
    const region = screen.getByRole('region', { name: 'Coach guidance' });
    expect(region).toBeInTheDocument();

    // Dismiss button has aria-label
    const dismissButton = screen.getByLabelText('Dismiss coach tip');
    expect(dismissButton).toBeInTheDocument();

    // Action button is focusable
    const actionButton = screen.getByRole('button', { name: 'Start Training' });
    expect(actionButton).toBeInTheDocument();
  });

  it('uses reduced motion when preference is set', async () => {
    const { useReducedMotion } = await import('framer-motion');
    vi.mocked(useReducedMotion).mockReturnValue(true);

    renderCoachCard(mockGuidance);

    // Component should still render (motion is mocked)
    expect(screen.getByText('Coach Tip')).toBeInTheDocument();
  });
});
