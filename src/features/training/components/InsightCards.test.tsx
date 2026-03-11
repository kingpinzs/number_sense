/**
 * InsightCards Component Tests
 *
 * Test Coverage:
 * - Empty state: shows encouraging message when no insights
 * - Renders correct number of cards (respects maxCards)
 * - Each card shows icon, title, message
 * - Action button renders when insight.action exists
 * - Action button does not render when insight.action is absent
 * - Colored left border based on insight type
 * - Staggered Framer Motion animation
 * - Accessibility: data-testid on wrapper and each card
 * - Default maxCards is 3
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import InsightCards from './InsightCards';
import type { Insight } from '@/services/training/insightTypes';

// Mock Framer Motion to simplify testing
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => {
      // Strip framer-motion-specific props to avoid React warnings
      const {
        variants: _variants,
        initial: _initial,
        animate: _animate,
        exit: _exit,
        whileHover: _whileHover,
        whileTap: _whileTap,
        transition: _transition,
        ...htmlProps
      } = props;
      return <div {...htmlProps}>{children}</div>;
    },
  },
}));

// ─── Test fixtures ────────────────────────────────────────────────────────────

function createInsight(overrides: Partial<Insight> = {}): Insight {
  return {
    id: 'insight-1',
    type: 'strength',
    confidence: 0.85,
    domain: 'arithmetic',
    title: 'Strong in Arithmetic',
    message: 'You are excelling at arithmetic drills with 92% accuracy.',
    priority: 10,
    variables: ['domain_accuracy'],
    generatedAt: '2026-03-10T10:00:00Z',
    ...overrides,
  };
}

const mockInsights: Insight[] = [
  createInsight({
    id: 'insight-strength',
    type: 'strength',
    title: 'Strong in Arithmetic',
    message: 'Your arithmetic accuracy is 92%.',
  }),
  createInsight({
    id: 'insight-weakness',
    type: 'weakness',
    title: 'Focus on Place Value',
    message: 'Place value accuracy is below 50%.',
    action: { label: 'Practice Place Value', drillType: 'place_value', difficulty: 'easy' },
  }),
  createInsight({
    id: 'insight-trend',
    type: 'trend',
    title: 'Improving Over Time',
    message: 'Your overall accuracy improved by 12% this week.',
  }),
  createInsight({
    id: 'insight-recommendation',
    type: 'recommendation',
    title: 'Try Number Bonds',
    message: 'Number bonds practice could strengthen your arithmetic foundation.',
    action: { label: 'Start Number Bonds', drillType: 'number_bonds', difficulty: 'medium' },
  }),
  createInsight({
    id: 'insight-discovery',
    type: 'discovery',
    title: 'Morning Performer',
    message: 'You score 15% higher in morning sessions.',
  }),
];

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('InsightCards', () => {
  describe('Empty State', () => {
    it('shows encouraging message when insights array is empty', () => {
      render(<InsightCards insights={[]} />);

      expect(screen.getByText('Keep practicing to unlock insights')).toBeInTheDocument();
    });

    it('has data-testid on wrapper when empty', () => {
      render(<InsightCards insights={[]} />);

      expect(screen.getByTestId('insight-cards')).toBeInTheDocument();
    });
  });

  describe('Card Rendering', () => {
    it('renders the correct number of cards (default maxCards=3)', () => {
      render(<InsightCards insights={mockInsights} />);

      const cards = screen.getAllByTestId('insight-card');
      expect(cards).toHaveLength(3);
    });

    it('renders all cards when count is less than maxCards', () => {
      render(<InsightCards insights={[mockInsights[0]]} />);

      const cards = screen.getAllByTestId('insight-card');
      expect(cards).toHaveLength(1);
    });

    it('respects custom maxCards prop', () => {
      render(<InsightCards insights={mockInsights} maxCards={5} />);

      const cards = screen.getAllByTestId('insight-card');
      expect(cards).toHaveLength(5);
    });

    it('respects maxCards=1', () => {
      render(<InsightCards insights={mockInsights} maxCards={1} />);

      const cards = screen.getAllByTestId('insight-card');
      expect(cards).toHaveLength(1);
    });

    it('has data-testid on wrapper', () => {
      render(<InsightCards insights={mockInsights} />);

      expect(screen.getByTestId('insight-cards')).toBeInTheDocument();
    });
  });

  describe('Card Content', () => {
    it('displays insight title in bold', () => {
      render(<InsightCards insights={[mockInsights[0]]} maxCards={1} />);

      const title = screen.getByText('Strong in Arithmetic');
      expect(title).toBeInTheDocument();
      expect(title).toHaveClass('font-bold');
    });

    it('displays insight message', () => {
      render(<InsightCards insights={[mockInsights[0]]} maxCards={1} />);

      expect(screen.getByText('Your arithmetic accuracy is 92%.')).toBeInTheDocument();
    });

    it('message has muted foreground styling', () => {
      render(<InsightCards insights={[mockInsights[0]]} maxCards={1} />);

      const message = screen.getByText('Your arithmetic accuracy is 92%.');
      expect(message).toHaveClass('text-muted-foreground');
    });
  });

  describe('Action Button', () => {
    it('renders action button when insight.action exists', () => {
      render(<InsightCards insights={[mockInsights[1]]} maxCards={1} />);

      const button = screen.getByTestId('insight-action-button');
      expect(button).toBeInTheDocument();
      expect(button).toHaveTextContent('Practice Place Value');
    });

    it('does not render action button when insight.action is undefined', () => {
      render(<InsightCards insights={[mockInsights[0]]} maxCards={1} />);

      expect(screen.queryByTestId('insight-action-button')).not.toBeInTheDocument();
    });

    it('action button has outline variant styling', () => {
      render(<InsightCards insights={[mockInsights[1]]} maxCards={1} />);

      const button = screen.getByTestId('insight-action-button');
      // The button should have the outline variant class from shadcn/ui
      expect(button).toHaveClass('border-2');
    });

    it('action button meets 44px touch target', () => {
      render(<InsightCards insights={[mockInsights[1]]} maxCards={1} />);

      const button = screen.getByTestId('insight-action-button');
      expect(button).toHaveClass('min-h-[44px]');
    });
  });

  describe('Colored Left Border', () => {
    it('strength insight has green left border', () => {
      render(<InsightCards insights={[createInsight({ id: 'str', type: 'strength' })]} maxCards={1} />);

      const card = screen.getByTestId('insight-card');
      expect(card).toHaveClass('border-l-green-500');
    });

    it('weakness insight has yellow left border', () => {
      render(<InsightCards insights={[createInsight({ id: 'wk', type: 'weakness' })]} maxCards={1} />);

      const card = screen.getByTestId('insight-card');
      expect(card).toHaveClass('border-l-yellow-500');
    });

    it('trend insight has blue left border', () => {
      render(<InsightCards insights={[createInsight({ id: 'tr', type: 'trend' })]} maxCards={1} />);

      const card = screen.getByTestId('insight-card');
      expect(card).toHaveClass('border-l-blue-500');
    });

    it('recommendation insight has primary left border', () => {
      render(<InsightCards insights={[createInsight({ id: 'rec', type: 'recommendation' })]} maxCards={1} />);

      const card = screen.getByTestId('insight-card');
      expect(card).toHaveClass('border-l-primary');
    });

    it('discovery insight has purple left border', () => {
      render(<InsightCards insights={[createInsight({ id: 'disc', type: 'discovery' })]} maxCards={1} />);

      const card = screen.getByTestId('insight-card');
      expect(card).toHaveClass('border-l-purple-500');
    });

    it('milestone insight has yellow left border', () => {
      render(<InsightCards insights={[createInsight({ id: 'ms', type: 'milestone' })]} maxCards={1} />);

      const card = screen.getByTestId('insight-card');
      expect(card).toHaveClass('border-l-yellow-500');
    });
  });

  describe('Card Styling', () => {
    it('cards have proper layout classes', () => {
      render(<InsightCards insights={[mockInsights[0]]} maxCards={1} />);

      const card = screen.getByTestId('insight-card');
      expect(card).toHaveClass('rounded-lg', 'border', 'border-l-4', 'bg-card', 'p-3', 'shadow-sm');
    });

    it('wrapper has flex column layout with gap', () => {
      render(<InsightCards insights={mockInsights} />);

      const wrapper = screen.getByTestId('insight-cards');
      expect(wrapper).toHaveClass('flex', 'flex-col', 'gap-3');
    });
  });

  describe('Icon Rendering', () => {
    it('renders an icon inside each card', () => {
      const { container } = render(
        <InsightCards insights={[mockInsights[0]]} maxCards={1} />
      );

      // lucide-react renders SVG elements
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('icon has muted foreground color', () => {
      const { container } = render(
        <InsightCards insights={[mockInsights[0]]} maxCards={1} />
      );

      const svg = container.querySelector('svg');
      expect(svg).toHaveClass('text-muted-foreground');
    });
  });

  describe('Multiple Insights', () => {
    it('renders titles for all visible insights', () => {
      render(<InsightCards insights={mockInsights} maxCards={3} />);

      expect(screen.getByText('Strong in Arithmetic')).toBeInTheDocument();
      expect(screen.getByText('Focus on Place Value')).toBeInTheDocument();
      expect(screen.getByText('Improving Over Time')).toBeInTheDocument();
    });

    it('does not render insights beyond maxCards', () => {
      render(<InsightCards insights={mockInsights} maxCards={2} />);

      expect(screen.getByText('Strong in Arithmetic')).toBeInTheDocument();
      expect(screen.getByText('Focus on Place Value')).toBeInTheDocument();
      expect(screen.queryByText('Improving Over Time')).not.toBeInTheDocument();
    });

    it('renders multiple action buttons when multiple insights have actions', () => {
      render(<InsightCards insights={mockInsights} maxCards={4} />);

      const buttons = screen.getAllByTestId('insight-action-button');
      expect(buttons).toHaveLength(2);
    });
  });
});
