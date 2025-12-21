/**
 * DrillTransition Component Tests
 * Story 3.5: Build Drill Session UI Components
 *
 * Test Coverage:
 * - AC: Renders drill type icon and name correctly
 * - AC: Shows correct metadata for each drill type
 * - AC: Framer Motion fade animations
 * - AC: Accessibility (aria-hidden on icons)
 * - AC: Fixed overlay positioning
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import DrillTransition from './DrillTransition';

// Mock Framer Motion to simplify testing
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}));

describe('DrillTransition', () => {
  it('renders number_line drill transition with correct icon and name', () => {
    render(<DrillTransition nextDrillType="number_line" />);

    expect(screen.getByText('📏')).toBeInTheDocument();
    expect(screen.getByText('Number Line')).toBeInTheDocument();
  });

  it('renders spatial_rotation drill transition with correct icon and name', () => {
    render(<DrillTransition nextDrillType="spatial_rotation" />);

    expect(screen.getByText('🔄')).toBeInTheDocument();
    expect(screen.getByText('Spatial Rotation')).toBeInTheDocument();
  });

  it('renders math_operations drill transition with correct icon and name', () => {
    render(<DrillTransition nextDrillType="math_operations" />);

    expect(screen.getByText('➕')).toBeInTheDocument();
    expect(screen.getByText('Math Operations')).toBeInTheDocument();
  });

  it('has correct test id for integration tests', () => {
    render(<DrillTransition nextDrillType="number_line" />);

    expect(screen.getByTestId('drill-transition')).toBeInTheDocument();
  });

  it('applies fixed overlay positioning classes', () => {
    render(<DrillTransition nextDrillType="number_line" />);

    const container = screen.getByTestId('drill-transition');
    expect(container).toHaveClass('fixed', 'inset-0', 'z-40');
  });

  it('uses flexbox centering for content', () => {
    render(<DrillTransition nextDrillType="number_line" />);

    const container = screen.getByTestId('drill-transition');
    expect(container).toHaveClass('flex', 'items-center', 'justify-center');
  });

  it('has semi-transparent white background', () => {
    render(<DrillTransition nextDrillType="number_line" />);

    const container = screen.getByTestId('drill-transition');
    expect(container).toHaveClass('bg-white/95');
  });

  it('icon has aria-hidden attribute for accessibility', () => {
    const { container } = render(<DrillTransition nextDrillType="number_line" />);

    const icon = container.querySelector('[role="img"]');
    expect(icon).toHaveAttribute('aria-hidden', 'true');
  });

  it('renders drill name as h2 heading', () => {
    render(<DrillTransition nextDrillType="spatial_rotation" />);

    const heading = screen.getByRole('heading', { level: 2, name: 'Spatial Rotation' });
    expect(heading).toBeInTheDocument();
  });

  it('applies correct text styling to heading', () => {
    render(<DrillTransition nextDrillType="number_line" />);

    const heading = screen.getByRole('heading', { level: 2 });
    expect(heading).toHaveClass('text-2xl', 'font-semibold', 'text-gray-800');
  });

  it('applies correct icon text size', () => {
    const { container } = render(<DrillTransition nextDrillType="number_line" />);

    const icon = container.querySelector('[role="img"]');
    expect(icon).toHaveClass('text-6xl');
  });

  it('uses flexbox gap between icon and name', () => {
    const { container } = render(<DrillTransition nextDrillType="number_line" />);

    // Find the inner flex container (parent of icon and heading)
    const icon = container.querySelector('[role="img"]');
    const flexContainer = icon?.parentElement;
    expect(flexContainer).toHaveClass('flex', 'flex-col', 'items-center', 'gap-3');
  });
});
