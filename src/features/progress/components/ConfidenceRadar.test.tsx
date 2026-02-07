// ConfidenceRadar Component Tests - Story 5.1
// Tests for radar chart visualization of domain confidence

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import ConfidenceRadar, { ConfidenceRadarEmpty } from './ConfidenceRadar';
import type { DomainConfidence } from '../services/confidenceCalculator';

// Mock data for tests
const mockCurrentConfidence: DomainConfidence = {
  numberSense: 3.5,
  spatial: 4.0,
  operations: 2.8,
};

const mockBaselineConfidence: DomainConfidence = {
  numberSense: 2.0,
  spatial: 2.5,
  operations: 2.0,
};

describe('ConfidenceRadar', () => {
  it('renders without crashing', () => {
    render(
      <ConfidenceRadar
        current={mockCurrentConfidence}
        baseline={mockBaselineConfidence}
      />
    );

    // Component should render
    expect(screen.getByRole('img')).toBeInTheDocument();
  });

  it('renders with mock data - 3 domains', () => {
    render(
      <ConfidenceRadar
        current={mockCurrentConfidence}
        baseline={mockBaselineConfidence}
      />
    );

    // Should render domain labels
    expect(screen.getByText('Number Sense')).toBeInTheDocument();
    expect(screen.getByText('Spatial Awareness')).toBeInTheDocument();
    expect(screen.getByText('Math Operations')).toBeInTheDocument();
  });

  it('renders current values as coral filled area', () => {
    const { container } = render(
      <ConfidenceRadar
        current={mockCurrentConfidence}
        baseline={mockBaselineConfidence}
      />
    );

    // Check for coral colored element (current values)
    const coralPath = container.querySelector('[fill="#E87461"]');
    expect(coralPath).toBeInTheDocument();
  });

  it('renders baseline as dashed gray line', () => {
    const { container } = render(
      <ConfidenceRadar
        current={mockCurrentConfidence}
        baseline={mockBaselineConfidence}
      />
    );

    // Check for dashed stroke element (baseline)
    const dashedPath = container.querySelector('[stroke-dasharray="5 5"]');
    expect(dashedPath).toBeInTheDocument();
  });

  it('renders legend with Current and Starting Point labels', () => {
    render(
      <ConfidenceRadar
        current={mockCurrentConfidence}
        baseline={mockBaselineConfidence}
      />
    );

    // Legend items should be visible
    expect(screen.getByText('Current')).toBeInTheDocument();
    expect(screen.getByText('Starting Point')).toBeInTheDocument();
  });

  it('handles null baseline gracefully', () => {
    render(
      <ConfidenceRadar
        current={mockCurrentConfidence}
        baseline={null}
      />
    );

    // Should still render current data
    expect(screen.getByRole('img')).toBeInTheDocument();
    expect(screen.getByText('Number Sense')).toBeInTheDocument();
  });
});

describe('ConfidenceRadar - Responsive Sizing (AC-3)', () => {
  let matchMediaMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    matchMediaMock = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('uses mobile size (280px) on narrow viewport', () => {
    // Mock mobile viewport (< 768px)
    matchMediaMock.mockImplementation((query: string) => ({
      matches: false, // Below 768px threshold
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));
    window.matchMedia = matchMediaMock;

    const { container } = render(
      <ConfidenceRadar
        current={mockCurrentConfidence}
        baseline={mockBaselineConfidence}
      />
    );

    // ResponsiveContainer should be rendered
    const chartContainer = container.querySelector('[data-testid="confidence-radar"]');
    expect(chartContainer).toBeInTheDocument();
  });

  it('uses tablet size (400px) on wide viewport', () => {
    // Mock tablet viewport (>= 768px)
    matchMediaMock.mockImplementation((query: string) => ({
      matches: query.includes('768px'), // Above threshold
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));
    window.matchMedia = matchMediaMock;

    const { container } = render(
      <ConfidenceRadar
        current={mockCurrentConfidence}
        baseline={mockBaselineConfidence}
      />
    );

    // ResponsiveContainer should be rendered
    const chartContainer = container.querySelector('[data-testid="confidence-radar"]');
    expect(chartContainer).toBeInTheDocument();
  });
});

describe('ConfidenceRadar - Accessibility (AC-3)', () => {
  beforeEach(() => {
    // Restore matchMedia mock for accessibility tests
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  it('has accessible alt text with confidence levels', () => {
    render(
      <ConfidenceRadar
        current={mockCurrentConfidence}
        baseline={mockBaselineConfidence}
      />
    );

    const chart = screen.getByRole('img');
    expect(chart).toHaveAttribute(
      'aria-label',
      expect.stringContaining('Number Sense 3.5')
    );
    expect(chart).toHaveAttribute(
      'aria-label',
      expect.stringContaining('Spatial Awareness 4.0')
    );
    expect(chart).toHaveAttribute(
      'aria-label',
      expect.stringContaining('Math Operations 2.8')
    );
  });

  it('has role="img" on chart container', () => {
    render(
      <ConfidenceRadar
        current={mockCurrentConfidence}
        baseline={mockBaselineConfidence}
      />
    );

    expect(screen.getByRole('img')).toBeInTheDocument();
  });
});

describe('ConfidenceRadarEmpty - Empty State (AC-4)', () => {
  beforeEach(() => {
    // Set up matchMedia mock
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  it('shows placeholder message when sessions < 3', () => {
    render(<ConfidenceRadarEmpty />);

    expect(screen.getByText(/Complete 3 training sessions/i)).toBeInTheDocument();
  });

  it('renders gray outline chart', () => {
    const { container } = render(<ConfidenceRadarEmpty />);

    // Check for dashed gray stroke (empty state indicator)
    const dashedPath = container.querySelector('[stroke-dasharray="3 3"]');
    expect(dashedPath).toBeInTheDocument();
  });

  it('has test id for empty state', () => {
    render(<ConfidenceRadarEmpty />);

    expect(screen.getByTestId('confidence-radar-empty')).toBeInTheDocument();
  });
});
