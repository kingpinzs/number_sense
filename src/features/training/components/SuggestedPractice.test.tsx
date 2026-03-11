/**
 * SuggestedPractice Component Tests
 *
 * Test Coverage:
 * 1. Loading state: skeleton cards with animate-pulse
 * 2. Empty state (result=null): "not enough data" message
 * 3. Empty state (hasEnoughData=false): "not enough data" message
 * 4. Insights section: renders InsightCards, "Your Insights" heading, Sparkles icon
 * 5. Suggested drills: correct names, domain badges, difficulty badges, reason text
 * 6. onDrillSelect callback when suggested drill card is clicked
 * 7. Domain progress: progress bars for domains with drills
 * 8. Skips domains with 0 drills in domain progress
 * 9. Trend arrows: up (green), down (red), neutral (gray)
 * 10. All 18 drill types rendered in "All Drills" grid
 * 11. onDrillSelect callback when "All Drills" card is clicked
 * 12. Highlights drills that are in suggestedDrills (star icon)
 * 13. data-testid="suggested-practice" on wrapper in all states
 * 14. All interactive elements have min-h-[44px]
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import SuggestedPractice from './SuggestedPractice';
import type {
  InsightEngineResult,
  Insight,
  SuggestedDrill,
  DomainPerformance,
} from '@/services/training/insightTypes';
import { DRILL_LABELS } from '@/services/training/insightTypes';

// Mock Framer Motion to simplify testing (same pattern as InsightCards.test.tsx)
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => {
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
    section: ({ children, ...props }: any) => {
      const {
        variants: _v,
        initial: _i,
        animate: _a,
        exit: _e,
        whileHover: _wh,
        whileTap: _wt,
        transition: _tr,
        ...htmlProps
      } = props;
      return <section {...htmlProps}>{children}</section>;
    },
  },
}));

// Mock the Progress component since it uses Radix primitives
vi.mock('@/shared/components/ui/progress', () => ({
  Progress: ({ value, ...props }: any) => (
    <div role="progressbar" aria-valuenow={value} {...props} />
  ),
}));

// ─── Test fixtures ────────────────────────────────────────────────────────────

function createInsight(overrides: Partial<Insight> = {}): Insight {
  return {
    id: 'insight-1',
    type: 'strength',
    confidence: 0.85,
    domain: 'arithmetic',
    title: 'Strong in Arithmetic',
    message: 'You are excelling at arithmetic drills.',
    priority: 10,
    variables: ['domain_accuracy'],
    generatedAt: '2026-03-10T10:00:00Z',
    ...overrides,
  };
}

function createSuggestedDrill(overrides: Partial<SuggestedDrill> = {}): SuggestedDrill {
  return {
    drillType: 'number_bonds',
    name: 'Number Bonds',
    reason: 'Strengthens arithmetic foundation',
    domain: 'arithmetic',
    difficulty: 'medium',
    priority: 8,
    ...overrides,
  };
}

function createDomainPerformance(overrides: Partial<DomainPerformance> = {}): DomainPerformance {
  return {
    domain: 'arithmetic',
    domainLabel: 'Arithmetic',
    recentAccuracy: 75,
    previousAccuracy: 68,
    trend: 7,
    totalDrills: 25,
    avgResponseTime: 3200,
    currentDifficulty: 'medium',
    ...overrides,
  };
}

function createEngineResult(overrides: Partial<InsightEngineResult> = {}): InsightEngineResult {
  return {
    analyzedAt: '2026-03-10T10:00:00Z',
    dataPointCount: 50,
    hasEnoughData: true,
    insights: [
      createInsight({ id: 'i1', type: 'strength', title: 'Strong Arithmetic', message: 'Great job on arithmetic.' }),
      createInsight({ id: 'i2', type: 'weakness', title: 'Weak Place Value', message: 'Needs improvement.' }),
      createInsight({ id: 'i3', type: 'trend', title: 'Upward Trend', message: 'Improving steadily.' }),
    ],
    suggestedDrills: [
      createSuggestedDrill({ drillType: 'place_value', name: 'Place Value', domain: 'placeValue', difficulty: 'easy', priority: 10 }),
      createSuggestedDrill({ drillType: 'number_bonds', name: 'Number Bonds', domain: 'arithmetic', difficulty: 'medium', priority: 8 }),
      createSuggestedDrill({ drillType: 'estimation', name: 'Estimation', domain: 'placeValue', difficulty: 'hard', priority: 6 }),
    ],
    domainPerformance: [
      createDomainPerformance({ domain: 'arithmetic', domainLabel: 'Arithmetic', recentAccuracy: 82, trend: 5, totalDrills: 25 }),
      createDomainPerformance({ domain: 'placeValue', domainLabel: 'Place Value', recentAccuracy: 45, trend: -3, totalDrills: 12 }),
      createDomainPerformance({ domain: 'sequencing', domainLabel: 'Sequencing', recentAccuracy: 60, trend: 0, totalDrills: 8 }),
    ],
    contextAnalysis: [],
    ...overrides,
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('SuggestedPractice', () => {
  let mockOnDrillSelect: ReturnType<typeof vi.fn<(drillType: string, difficulty: 'easy' | 'medium' | 'hard') => void>>;

  beforeEach(() => {
    mockOnDrillSelect = vi.fn<(drillType: string, difficulty: 'easy' | 'medium' | 'hard') => void>();
  });

  // ── 1. Loading State ────────────────────────────────────────────────────

  describe('Loading State', () => {
    it('shows loading skeleton when loading=true', () => {
      render(<SuggestedPractice result={null} loading={true} />);

      const skeletons = screen.getAllByTestId('skeleton-card');
      expect(skeletons).toHaveLength(3);
    });

    it('skeleton cards have animate-pulse class', () => {
      render(<SuggestedPractice result={null} loading={true} />);

      const skeletons = screen.getAllByTestId('skeleton-card');
      skeletons.forEach((skeleton) => {
        expect(skeleton).toHaveClass('animate-pulse');
      });
    });

    it('has data-testid on wrapper when loading', () => {
      render(<SuggestedPractice result={null} loading={true} />);

      expect(screen.getByTestId('suggested-practice')).toBeInTheDocument();
    });

    it('does not render section headings when loading', () => {
      render(<SuggestedPractice result={null} loading={true} />);

      expect(screen.queryByText('Your Insights')).not.toBeInTheDocument();
      expect(screen.queryByText('Suggested For You')).not.toBeInTheDocument();
      expect(screen.queryByText('Domain Progress')).not.toBeInTheDocument();
      expect(screen.queryByText('All Drills')).not.toBeInTheDocument();
    });
  });

  // ── 2. Not Enough Data (result is null) ─────────────────────────────────

  describe('Empty State - result is null', () => {
    it('shows "not enough data" banner when result is null', () => {
      render(<SuggestedPractice result={null} />);

      expect(
        screen.getByText('Complete more drills to unlock personalized suggestions'),
      ).toBeInTheDocument();
    });

    it('still shows All Drills grid when result is null', () => {
      render(<SuggestedPractice result={null} />);

      expect(screen.getByTestId('all-drills-section')).toBeInTheDocument();
      expect(screen.getAllByTestId('all-drill-card')).toHaveLength(18);
    });

    it('does not show insights or suggested drills when result is null', () => {
      render(<SuggestedPractice result={null} />);

      expect(screen.queryByTestId('insights-section')).not.toBeInTheDocument();
      expect(screen.queryByTestId('suggested-drills-section')).not.toBeInTheDocument();
    });

    it('has data-testid on wrapper when result is null', () => {
      render(<SuggestedPractice result={null} />);

      expect(screen.getByTestId('suggested-practice')).toBeInTheDocument();
    });
  });

  // ── 3. Not Enough Data (hasEnoughData is false) ─────────────────────────

  describe('Empty State - hasEnoughData is false', () => {
    it('shows "not enough data" banner when hasEnoughData is false', () => {
      const result = createEngineResult({ hasEnoughData: false });
      render(<SuggestedPractice result={result} />);

      expect(
        screen.getByText('Complete more drills to unlock personalized suggestions'),
      ).toBeInTheDocument();
    });

    it('still shows All Drills grid when hasEnoughData is false', () => {
      const result = createEngineResult({ hasEnoughData: false });
      render(<SuggestedPractice result={result} />);

      expect(screen.getByTestId('all-drills-section')).toBeInTheDocument();
      expect(screen.getAllByTestId('all-drill-card')).toHaveLength(18);
    });

    it('does not show not-enough-data banner when hasEnoughData is true', () => {
      const result = createEngineResult({ hasEnoughData: true });
      render(<SuggestedPractice result={result} />);

      expect(screen.queryByTestId('not-enough-data')).not.toBeInTheDocument();
    });
  });

  // ── 4. Insights Section ─────────────────────────────────────────────────

  describe('Insights Section', () => {
    it('renders insights section with InsightCards when insights exist', () => {
      const result = createEngineResult();
      render(<SuggestedPractice result={result} />);

      expect(screen.getByTestId('insights-section')).toBeInTheDocument();
      // InsightCards renders insight-cards wrapper
      expect(screen.getByTestId('insight-cards')).toBeInTheDocument();
    });

    it('shows "Your Insights" heading', () => {
      const result = createEngineResult();
      render(<SuggestedPractice result={result} />);

      expect(screen.getByText('Your Insights')).toBeInTheDocument();
    });

    it('renders top 3 insight cards', () => {
      const result = createEngineResult();
      render(<SuggestedPractice result={result} />);

      const cards = screen.getAllByTestId('insight-card');
      expect(cards).toHaveLength(3);
    });

    it('does not render insights section when no insights exist', () => {
      const result = createEngineResult({ insights: [] });
      render(<SuggestedPractice result={result} />);

      expect(screen.queryByTestId('insights-section')).not.toBeInTheDocument();
      expect(screen.queryByText('Your Insights')).not.toBeInTheDocument();
    });
  });

  // ── 5. Suggested Drills Section ─────────────────────────────────────────

  describe('Suggested Drills Section', () => {
    it('renders suggested drills with correct names and badges', () => {
      const result = createEngineResult();
      render(<SuggestedPractice result={result} />);

      expect(screen.getByTestId('suggested-drills-section')).toBeInTheDocument();

      // Drill cards
      const drillCards = screen.getAllByTestId('suggested-drill-card');
      expect(drillCards).toHaveLength(3);
    });

    it('shows "Suggested For You" heading with Target icon', () => {
      const result = createEngineResult();
      render(<SuggestedPractice result={result} />);

      expect(screen.getByText('Suggested For You')).toBeInTheDocument();
    });

    it('shows domain badges on drill cards', () => {
      const result = createEngineResult();
      render(<SuggestedPractice result={result} />);

      const domainBadges = screen.getAllByTestId('domain-badge');
      // 3 suggested drills, each with a domain badge
      expect(domainBadges.length).toBeGreaterThanOrEqual(3);
    });

    it('shows difficulty badges with correct colors', () => {
      const result = createEngineResult();
      render(<SuggestedPractice result={result} />);

      const diffBadges = screen.getAllByTestId('difficulty-badge');
      expect(diffBadges.length).toBeGreaterThanOrEqual(3);

      // Check easy badge
      const easyBadge = screen.getByText('easy');
      expect(easyBadge).toHaveClass('bg-green-500/10', 'text-green-500');

      // Check medium badge
      const mediumBadge = screen.getByText('medium');
      expect(mediumBadge).toHaveClass('bg-yellow-500/10', 'text-yellow-500');

      // Check hard badge
      const hardBadge = screen.getByText('hard');
      expect(hardBadge).toHaveClass('bg-red-500/10', 'text-red-500');
    });

    it('shows reason text on drill cards', () => {
      const result = createEngineResult({
        suggestedDrills: [
          createSuggestedDrill({ drillType: 'place_value', name: 'Place Value', reason: 'Your weakest domain needs work', priority: 10 }),
        ],
      });
      render(<SuggestedPractice result={result} />);

      expect(screen.getByText('Your weakest domain needs work')).toBeInTheDocument();
    });

    it('limits to 5 suggestions', () => {
      const drills = Array.from({ length: 8 }, (_, i) =>
        createSuggestedDrill({
          drillType: `drill_${i}`,
          name: `Drill ${i}`,
          priority: 8 - i,
        }),
      );
      const result = createEngineResult({ suggestedDrills: drills });
      render(<SuggestedPractice result={result} />);

      const drillCards = screen.getAllByTestId('suggested-drill-card');
      expect(drillCards).toHaveLength(5);
    });

    it('sorts suggested drills by priority descending (weakness-first)', () => {
      const drills = [
        createSuggestedDrill({ drillType: 'a', name: 'Low Priority', priority: 2 }),
        createSuggestedDrill({ drillType: 'b', name: 'High Priority', priority: 10 }),
        createSuggestedDrill({ drillType: 'c', name: 'Mid Priority', priority: 5 }),
      ];
      const result = createEngineResult({ suggestedDrills: drills });
      render(<SuggestedPractice result={result} />);

      const cards = screen.getAllByTestId('suggested-drill-card');
      expect(cards[0]).toHaveTextContent('High Priority');
      expect(cards[1]).toHaveTextContent('Mid Priority');
      expect(cards[2]).toHaveTextContent('Low Priority');
    });

    it('does not render suggested drills section when suggestedDrills is empty', () => {
      const result = createEngineResult({ suggestedDrills: [] });
      render(<SuggestedPractice result={result} />);

      expect(screen.queryByTestId('suggested-drills-section')).not.toBeInTheDocument();
    });
  });

  // ── 6. onDrillSelect for suggested drills ───────────────────────────────

  describe('onDrillSelect for Suggested Drills', () => {
    it('calls onDrillSelect when a suggested drill card is clicked', () => {
      const result = createEngineResult({
        suggestedDrills: [
          createSuggestedDrill({ drillType: 'number_bonds', name: 'Number Bonds', difficulty: 'medium' }),
        ],
      });
      render(
        <SuggestedPractice result={result} onDrillSelect={mockOnDrillSelect} />,
      );

      fireEvent.click(screen.getByTestId('suggested-drill-card'));
      expect(mockOnDrillSelect).toHaveBeenCalledWith('number_bonds', 'medium');
    });

    it('handles missing onDrillSelect callback gracefully', () => {
      const result = createEngineResult({
        suggestedDrills: [createSuggestedDrill()],
      });
      render(<SuggestedPractice result={result} />);

      // Should not throw when clicked without onDrillSelect
      expect(() => {
        fireEvent.click(screen.getByTestId('suggested-drill-card'));
      }).not.toThrow();
    });
  });

  // ── 7. Domain Progress Section ──────────────────────────────────────────

  describe('Domain Progress Section', () => {
    it('renders domain progress bars for domains with drills', () => {
      const result = createEngineResult();
      render(<SuggestedPractice result={result} />);

      expect(screen.getByTestId('domain-progress-section')).toBeInTheDocument();

      // Check progress items rendered
      const progressItems = screen.getAllByTestId('domain-progress-item');
      expect(progressItems).toHaveLength(3);
    });

    it('shows "Domain Progress" heading with BarChart3 icon', () => {
      const result = createEngineResult();
      render(<SuggestedPractice result={result} />);

      expect(screen.getByText('Domain Progress')).toBeInTheDocument();
    });

    it('shows domain names in progress section', () => {
      const result = createEngineResult();
      render(<SuggestedPractice result={result} />);

      const section = screen.getByTestId('domain-progress-section');
      expect(section).toHaveTextContent('Arithmetic');
      expect(section).toHaveTextContent('Place Value');
      expect(section).toHaveTextContent('Sequencing');
    });

    it('shows accuracy percentages', () => {
      const result = createEngineResult();
      render(<SuggestedPractice result={result} />);

      const section = screen.getByTestId('domain-progress-section');
      expect(section).toHaveTextContent('82%');
      expect(section).toHaveTextContent('45%');
      expect(section).toHaveTextContent('60%');
    });

    it('renders Progress component with correct value', () => {
      const result = createEngineResult({
        domainPerformance: [
          createDomainPerformance({ domain: 'arithmetic', recentAccuracy: 82, totalDrills: 10 }),
        ],
      });
      render(<SuggestedPractice result={result} />);

      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuenow', '82');
    });

    it('shows "X drills completed" text', () => {
      const result = createEngineResult({
        domainPerformance: [
          createDomainPerformance({ domain: 'arithmetic', domainLabel: 'Arithmetic', totalDrills: 25 }),
        ],
      });
      render(<SuggestedPractice result={result} />);

      expect(screen.getByText('25 drills completed')).toBeInTheDocument();
    });

    it('uses singular "drill" for 1 drill completed', () => {
      const result = createEngineResult({
        domainPerformance: [
          createDomainPerformance({ domain: 'arithmetic', domainLabel: 'Arithmetic', totalDrills: 1 }),
        ],
      });
      render(<SuggestedPractice result={result} />);

      expect(screen.getByText('1 drill completed')).toBeInTheDocument();
    });
  });

  // ── 8. Skips domains with 0 drills ──────────────────────────────────────

  describe('Domain Progress - Skips Zero-Drill Domains', () => {
    it('skips domains with 0 drills in domain progress', () => {
      const result = createEngineResult({
        domainPerformance: [
          createDomainPerformance({ domain: 'arithmetic', domainLabel: 'Arithmetic', totalDrills: 15 }),
          createDomainPerformance({ domain: 'placeValue', domainLabel: 'Place Value', totalDrills: 0 }),
          createDomainPerformance({ domain: 'sequencing', domainLabel: 'Sequencing', totalDrills: 10 }),
        ],
      });
      render(<SuggestedPractice result={result} />);

      const progressItems = screen.getAllByTestId('domain-progress-item');
      // Only 2 items should render (arithmetic and sequencing), not placeValue
      expect(progressItems).toHaveLength(2);

      // Check that the items do not include Place Value
      const itemTexts = progressItems.map((item) => item.textContent);
      const hasPlaceValueItem = itemTexts.some((text) => text?.includes('Place Value'));
      expect(hasPlaceValueItem).toBe(false);
    });

    it('does not render domain progress section when all domains have 0 drills', () => {
      const result = createEngineResult({
        domainPerformance: [
          createDomainPerformance({ domain: 'arithmetic', totalDrills: 0 }),
          createDomainPerformance({ domain: 'placeValue', totalDrills: 0 }),
        ],
      });
      render(<SuggestedPractice result={result} />);

      expect(screen.queryByTestId('domain-progress-section')).not.toBeInTheDocument();
    });

    it('does not render domain progress section when domainPerformance is empty', () => {
      const result = createEngineResult({ domainPerformance: [] });
      render(<SuggestedPractice result={result} />);

      expect(screen.queryByTestId('domain-progress-section')).not.toBeInTheDocument();
    });
  });

  // ── 9. Trend Arrows ────────────────────────────────────────────────────

  describe('Trend Arrows', () => {
    it('shows upward trend arrow (green) for positive trend', () => {
      const result = createEngineResult({
        domainPerformance: [
          createDomainPerformance({ domain: 'arithmetic', domainLabel: 'Arithmetic', trend: 5, totalDrills: 10 }),
        ],
      });
      render(<SuggestedPractice result={result} />);

      expect(screen.getByTestId('trend-up')).toBeInTheDocument();
      expect(screen.getByLabelText('Improving')).toBeInTheDocument();
    });

    it('shows downward trend arrow (red) for negative trend', () => {
      const result = createEngineResult({
        domainPerformance: [
          createDomainPerformance({ domain: 'placeValue', domainLabel: 'Place Value', trend: -3, totalDrills: 10 }),
        ],
      });
      render(<SuggestedPractice result={result} />);

      expect(screen.getByTestId('trend-down')).toBeInTheDocument();
      expect(screen.getByLabelText('Declining')).toBeInTheDocument();
    });

    it('shows neutral trend indicator (gray) for zero trend', () => {
      const result = createEngineResult({
        domainPerformance: [
          createDomainPerformance({ domain: 'sequencing', domainLabel: 'Sequencing', trend: 0, totalDrills: 10 }),
        ],
      });
      render(<SuggestedPractice result={result} />);

      expect(screen.getByTestId('trend-neutral')).toBeInTheDocument();
      expect(screen.getByLabelText('Stable')).toBeInTheDocument();
    });
  });

  // ── 10. All Drills Section - 18 drill types ─────────────────────────────

  describe('All Drills Section', () => {
    it('renders all 18 drill types in "All Drills" grid', () => {
      const result = createEngineResult();
      render(<SuggestedPractice result={result} />);

      const drillCards = screen.getAllByTestId('all-drill-card');
      expect(drillCards).toHaveLength(18);
    });

    it('shows "All Drills" heading with Grid3X3 icon', () => {
      const result = createEngineResult();
      render(<SuggestedPractice result={result} />);

      expect(screen.getByText('All Drills')).toBeInTheDocument();
    });

    it('shows drill names on all drill cards', () => {
      const result = createEngineResult();
      render(<SuggestedPractice result={result} />);

      const section = screen.getByTestId('all-drills-section');
      // Check a sampling of drill names from different domains
      expect(section).toHaveTextContent('Number Line');
      expect(section).toHaveTextContent('Subitizing');
      expect(section).toHaveTextContent('Fact Fluency');
      expect(section).toHaveTextContent('Spatial Rotation');
      expect(section).toHaveTextContent('Fractions');
      expect(section).toHaveTextContent('Everyday Math');
    });

    it('shows domain labels on all drill cards', () => {
      const result = createEngineResult();
      render(<SuggestedPractice result={result} />);

      const section = screen.getByTestId('all-drills-section');
      expect(section).toHaveTextContent('Number Sense');
      expect(section).toHaveTextContent('Arithmetic');
      expect(section).toHaveTextContent('Spatial');
      expect(section).toHaveTextContent('Applied Math');
    });

    it('renders all drill names from DRILL_LABELS', () => {
      const result = createEngineResult();
      render(<SuggestedPractice result={result} />);

      const section = screen.getByTestId('all-drills-section');
      const allLabels = Object.values(DRILL_LABELS);
      for (const label of allLabels) {
        expect(section).toHaveTextContent(label);
      }
    });

    it('uses responsive grid: 2 cols mobile, 3 on md+', () => {
      const result = createEngineResult();
      const { container } = render(<SuggestedPractice result={result} />);

      const grid = container.querySelector('.grid');
      expect(grid).toHaveClass('grid-cols-2', 'md:grid-cols-3');
    });
  });

  // ── 11. onDrillSelect for All Drills ────────────────────────────────────

  describe('onDrillSelect for All Drills', () => {
    it('calls onDrillSelect when an "All Drills" card is clicked', () => {
      const result = createEngineResult({ domainPerformance: [] });
      render(
        <SuggestedPractice result={result} onDrillSelect={mockOnDrillSelect} />,
      );

      const numberLineButton = screen.getByLabelText('Start Number Line');
      fireEvent.click(numberLineButton);
      expect(mockOnDrillSelect).toHaveBeenCalledWith('number_line', 'easy');
    });

    it('uses domain currentDifficulty when available', () => {
      const result = createEngineResult({
        domainPerformance: [
          createDomainPerformance({ domain: 'arithmetic', currentDifficulty: 'hard', totalDrills: 10 }),
        ],
      });
      render(
        <SuggestedPractice result={result} onDrillSelect={mockOnDrillSelect} />,
      );

      // Click an arithmetic drill (math_operations is in the arithmetic domain)
      const mathOpsButton = screen.getByLabelText('Start Math Operations');
      fireEvent.click(mathOpsButton);
      expect(mockOnDrillSelect).toHaveBeenCalledWith('math_operations', 'hard');
    });

    it('defaults to easy difficulty when no domain performance available', () => {
      const result = createEngineResult({ domainPerformance: [] });
      render(
        <SuggestedPractice result={result} onDrillSelect={mockOnDrillSelect} />,
      );

      const numberLineButton = screen.getByLabelText('Start Number Line');
      fireEvent.click(numberLineButton);
      expect(mockOnDrillSelect).toHaveBeenCalledWith('number_line', 'easy');
    });

    it('drill cards have aria-label for accessibility', () => {
      const result = createEngineResult();
      render(<SuggestedPractice result={result} />);

      expect(screen.getByLabelText('Start Number Line')).toBeInTheDocument();
      expect(screen.getByLabelText('Start Subitizing')).toBeInTheDocument();
      expect(screen.getByLabelText('Start Fractions')).toBeInTheDocument();
    });
  });

  // ── 12. Highlights drills in suggestedDrills ────────────────────────────

  describe('Suggested Drill Highlighting in All Drills', () => {
    it('highlights drills that are in suggestedDrills with a star', () => {
      const result = createEngineResult({
        suggestedDrills: [
          createSuggestedDrill({ drillType: 'number_line', name: 'Number Line', domain: 'numberSense' }),
          createSuggestedDrill({ drillType: 'fact_fluency', name: 'Fact Fluency', domain: 'arithmetic' }),
        ],
      });
      render(<SuggestedPractice result={result} />);

      const stars = screen.getAllByTestId('suggested-star');
      expect(stars).toHaveLength(2);
    });

    it('suggested drills have ring highlight in All Drills grid', () => {
      const result = createEngineResult({
        suggestedDrills: [
          createSuggestedDrill({ drillType: 'number_line', name: 'Number Line', domain: 'numberSense' }),
        ],
      });
      render(<SuggestedPractice result={result} />);

      // Scope to the All Drills section to avoid matching the suggested drill card
      const allDrillsSection = screen.getByTestId('all-drills-section');
      const numberLineCards = allDrillsSection.querySelectorAll('[aria-label="Start Number Line"]');
      expect(numberLineCards).toHaveLength(1);
      expect(numberLineCards[0]).toHaveClass('ring-1', 'ring-primary/50');
    });

    it('non-suggested drills do not have star or ring highlight', () => {
      const result = createEngineResult({
        suggestedDrills: [
          createSuggestedDrill({ drillType: 'number_line', name: 'Number Line', domain: 'numberSense' }),
        ],
      });
      render(<SuggestedPractice result={result} />);

      // Subitizing is NOT in suggested drills
      const subitizingCard = screen.getByLabelText('Start Subitizing');
      expect(subitizingCard).not.toHaveClass('ring-1');
    });

    it('does not show stars when no drills are suggested', () => {
      const result = createEngineResult({ suggestedDrills: [] });
      render(<SuggestedPractice result={result} />);

      expect(screen.queryByTestId('suggested-star')).not.toBeInTheDocument();
    });
  });

  // ── 13. data-testid on wrapper ──────────────────────────────────────────

  describe('Wrapper data-testid', () => {
    it('has data-testid="suggested-practice" on wrapper when loading', () => {
      render(<SuggestedPractice result={null} loading={true} />);
      expect(screen.getByTestId('suggested-practice')).toBeInTheDocument();
    });

    it('has data-testid="suggested-practice" on wrapper when result is null', () => {
      render(<SuggestedPractice result={null} />);
      expect(screen.getByTestId('suggested-practice')).toBeInTheDocument();
    });

    it('has data-testid="suggested-practice" on wrapper with full data', () => {
      const result = createEngineResult();
      render(<SuggestedPractice result={result} />);
      expect(screen.getByTestId('suggested-practice')).toBeInTheDocument();
    });
  });

  // ── 14. Touch Targets ──────────────────────────────────────────────────

  describe('Touch Targets - min-h-[44px]', () => {
    it('all suggested drill cards have min-h-[44px]', () => {
      const result = createEngineResult();
      render(<SuggestedPractice result={result} />);

      const drillCards = screen.getAllByTestId('suggested-drill-card');
      drillCards.forEach((card) => {
        expect(card).toHaveClass('min-h-[44px]');
      });
    });

    it('all "All Drills" cards have min-h-[44px]', () => {
      const result = createEngineResult();
      render(<SuggestedPractice result={result} />);

      const cards = screen.getAllByTestId('all-drill-card');
      cards.forEach((card) => {
        expect(card).toHaveClass('min-h-[44px]');
      });
    });

    it('all "All Drills" cards have focus-visible ring for keyboard navigation', () => {
      const result = createEngineResult();
      render(<SuggestedPractice result={result} />);

      const cards = screen.getAllByTestId('all-drill-card');
      cards.forEach((card) => {
        expect(card).toHaveClass('focus-visible:ring-2');
      });
    });
  });

  // ── Edge Cases ─────────────────────────────────────────────────────────

  describe('Edge Cases', () => {
    it('loading=true takes priority over result data', () => {
      const result = createEngineResult();
      render(<SuggestedPractice result={result} loading={true} />);

      // Should show skeletons, not the actual data
      expect(screen.getAllByTestId('skeleton-card')).toHaveLength(3);
      expect(screen.queryByText('Your Insights')).not.toBeInTheDocument();
    });

    it('loading defaults to false', () => {
      const result = createEngineResult();
      render(<SuggestedPractice result={result} />);

      // Should render data, not skeletons
      expect(screen.queryByTestId('skeleton-card')).not.toBeInTheDocument();
      expect(screen.getByText('Your Insights')).toBeInTheDocument();
    });

    it('renders all 4 sections when data is complete', () => {
      const result = createEngineResult();
      render(<SuggestedPractice result={result} />);

      expect(screen.getByTestId('insights-section')).toBeInTheDocument();
      expect(screen.getByTestId('suggested-drills-section')).toBeInTheDocument();
      expect(screen.getByTestId('domain-progress-section')).toBeInTheDocument();
      expect(screen.getByTestId('all-drills-section')).toBeInTheDocument();
    });

    it('renders only All Drills when insights and suggestions and performance are empty', () => {
      const result = createEngineResult({
        insights: [],
        suggestedDrills: [],
        domainPerformance: [],
      });
      render(<SuggestedPractice result={result} />);

      expect(screen.queryByTestId('insights-section')).not.toBeInTheDocument();
      expect(screen.queryByTestId('suggested-drills-section')).not.toBeInTheDocument();
      expect(screen.queryByTestId('domain-progress-section')).not.toBeInTheDocument();
      expect(screen.getByTestId('all-drills-section')).toBeInTheDocument();
    });
  });
});
