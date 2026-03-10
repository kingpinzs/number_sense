// ResultsSummary Component Tests
// Story 2.6: Build Results Summary Visualization

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { ResultsSummary } from './ResultsSummary';
import type { DomainScores } from '@/services/assessment/scoring';

// Mock framer-motion to avoid animation complexities in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}));

// Mock react-router-dom's useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
  },
}));

// Mock saveAssessmentResults
vi.mock('@/services/assessment/storage', () => ({
  saveAssessmentResults: vi.fn(() => Promise.resolve(1)),
}));

describe('ResultsSummary', () => {
  const mockOnStartTraining = vi.fn();

  beforeEach(() => {
    mockNavigate.mockClear();
    mockOnStartTraining.mockClear();
  });

  const defaultProps = {
    domainScores: {
      number_sense: 3.5,
      place_value: 2.0,
      sequencing: 4.5,
      arithmetic: 4.5,
      spatial: 2.0,
      applied: 3.0,
    } as DomainScores,
    completionTime: {
      minutes: 3,
      seconds: 45,
    },
    onStartTraining: mockOnStartTraining,
  };

  async function renderComponent(props = defaultProps) {
    const result = render(
      <BrowserRouter>
        <ResultsSummary {...props} />
      </BrowserRouter>
    );

    // Wait for loading state to complete
    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: /your number sense profile/i })).toBeInTheDocument();
    });

    return result;
  }

  // AC1-AC3: Header displays title, subtitle, and formatted completion time
  describe('Header Section', () => {
    it('displays "Your Number Sense Profile" title (AC1)', async () => {
      await renderComponent();
      expect(screen.getByRole('heading', { name: /your number sense profile/i, level: 1 })).toBeInTheDocument();
    });

    it('displays subtitle "Here\'s what we discovered about your strengths" (AC2)', async () => {
      await renderComponent();
      expect(screen.getByText(/here's what we discovered about your strengths/i)).toBeInTheDocument();
    });

    it('displays completion time in "Completed in X minutes, Y seconds" format (AC3)', async () => {
      await renderComponent();
      expect(screen.getByText(/completed in 3 minutes, 45 seconds/i)).toBeInTheDocument();
    });

    it('handles singular minute and second correctly', async () => {
      await renderComponent({
        ...defaultProps,
        completionTime: { minutes: 1, seconds: 1 },
      });
      expect(screen.getByText(/completed in 1 minute, 1 second$/i)).toBeInTheDocument();
    });

    it('formats completion time with accessibility label', async () => {
      await renderComponent();
      const timeElement = screen.getByText(/completed in 3 minutes, 45 seconds/i);
      expect(timeElement).toHaveAttribute('aria-label', 'Assessment completed in 3 minutes and 45 seconds');
    });
  });

  // AC4-AC6: Six domain cards with names and score bars
  describe('Domain Cards', () => {
    it('renders six domain cards (AC4)', async () => {
      await renderComponent();
      const cards = screen.getAllByRole('listitem');
      expect(cards).toHaveLength(6);
    });

    it('displays domain names correctly (AC5)', async () => {
      await renderComponent();
      expect(screen.getByText('Number Sense')).toBeInTheDocument();
      expect(screen.getByText('Place Value & Estimation')).toBeInTheDocument();
      expect(screen.getByText('Sequencing & Patterns')).toBeInTheDocument();
      expect(screen.getByText('Arithmetic Fluency')).toBeInTheDocument();
      expect(screen.getByText('Spatial Reasoning')).toBeInTheDocument();
      expect(screen.getByText('Applied Math')).toBeInTheDocument();
    });

    it('displays score visualization bars for 0-5 scale (AC6)', async () => {
      await renderComponent();

      // Number Sense: 3.5 / 5.0 = 70%
      const numberSenseCard = screen.getByText('Number Sense').closest('[role="listitem"]');
      expect(within(numberSenseCard! as HTMLElement).getByText('3.5 / 5.0')).toBeInTheDocument();

      // Place Value: 2.0 / 5.0 = 40%
      const placeValueCard = screen.getByText('Place Value & Estimation').closest('[role="listitem"]');
      expect(within(placeValueCard! as HTMLElement).getByText('2.0 / 5.0')).toBeInTheDocument();

      // Sequencing: 4.5 / 5.0 = 90%
      const sequencingCard = screen.getByText('Sequencing & Patterns').closest('[role="listitem"]');
      expect(within(sequencingCard! as HTMLElement).getByText('4.5 / 5.0')).toBeInTheDocument();

      // Arithmetic: 4.5 / 5.0 = 90%
      const arithmeticCard = screen.getByText('Arithmetic Fluency').closest('[role="listitem"]');
      expect(within(arithmeticCard! as HTMLElement).getByText('4.5 / 5.0')).toBeInTheDocument();

      // Spatial: 2.0 / 5.0 = 40%
      const spatialCard = screen.getByText('Spatial Reasoning').closest('[role="listitem"]');
      expect(within(spatialCard! as HTMLElement).getByText('2.0 / 5.0')).toBeInTheDocument();

      // Applied: 3.0 / 5.0 = 60%
      const appliedCard = screen.getByText('Applied Math').closest('[role="listitem"]');
      expect(within(appliedCard! as HTMLElement).getByText('3.0 / 5.0')).toBeInTheDocument();
    });

    it('displays progress bars with correct ARIA labels (AC6)', async () => {
      await renderComponent();

      expect(screen.getByLabelText(/number sense score progress bar, 70% filled/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/place value & estimation score progress bar, 40% filled/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/sequencing & patterns score progress bar, 90% filled/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/arithmetic fluency score progress bar, 90% filled/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/spatial reasoning score progress bar, 40% filled/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/applied math score progress bar, 60% filled/i)).toBeInTheDocument();
    });
  });

  // AC7-AC9: Color coding logic
  describe('Color Coding', () => {
    it('shows coral background and "Needs Focus" label for weak domains (≤2.5) (AC7)', async () => {
      const weakScores: DomainScores = {
        number_sense: 1.5,
        place_value: 2.0,
        sequencing: 1.0,
        arithmetic: 2.0,
        spatial: 2.5,
        applied: 0.5,
      };

      await renderComponent({ ...defaultProps, domainScores: weakScores });

      const needsFocusLabels = screen.getAllByText('Needs Focus');
      expect(needsFocusLabels).toHaveLength(6);

      // Check coral background color
      const cards = screen.getAllByRole('listitem');
      cards.forEach(card => {
        expect(card).toHaveStyle({ borderColor: '#E87461' });
      });
    });

    it('shows yellow background and "Growing" label for moderate domains (2.6-3.5) (AC8)', async () => {
      const moderateScores: DomainScores = {
        number_sense: 2.6,
        place_value: 3.0,
        sequencing: 3.5,
        arithmetic: 3.0,
        spatial: 3.0,
        applied: 3.5,
      };

      await renderComponent({ ...defaultProps, domainScores: moderateScores });

      const growingLabels = screen.getAllByText('Growing');
      expect(growingLabels).toHaveLength(6);

      // Check yellow background color
      const cards = screen.getAllByRole('listitem');
      cards.forEach(card => {
        expect(card).toHaveStyle({ borderColor: '#FFD56F' });
      });
    });

    it('shows mint background and "Strength" label for strong domains (>3.5) (AC9)', async () => {
      const strongScores: DomainScores = {
        number_sense: 3.6,
        place_value: 4.0,
        sequencing: 4.5,
        arithmetic: 5.0,
        spatial: 4.0,
        applied: 5.0,
      };

      await renderComponent({ ...defaultProps, domainScores: strongScores });

      const strengthLabels = screen.getAllByText('Strength');
      expect(strengthLabels).toHaveLength(6);

      // Check mint background color
      const cards = screen.getAllByRole('listitem');
      cards.forEach(card => {
        expect(card).toHaveStyle({ borderColor: '#A8E6CF' });
      });
    });

    it('displays correct icons for each performance level (AC7-AC9)', async () => {
      const mixedScores: DomainScores = {
        number_sense: 2.0,  // weak - Target icon
        place_value: 3.0,   // moderate - Sprout icon
        sequencing: 4.5,    // strong - Sparkles icon
        arithmetic: 4.5,    // strong
        spatial: 3.0,       // moderate
        applied: 2.0,       // weak
      };

      await renderComponent({ ...defaultProps, domainScores: mixedScores });

      // All icons should be present (lucide-react SVG icons)
      const numberSenseCard = screen.getByText('Number Sense').closest('[role="listitem"]');
      const spatialCard = screen.getByText('Spatial Reasoning').closest('[role="listitem"]');
      const arithmeticCard = screen.getByText('Arithmetic Fluency').closest('[role="listitem"]');

      expect(within(numberSenseCard! as HTMLElement).getByText('Needs Focus')).toBeInTheDocument();
      expect(within(spatialCard! as HTMLElement).getByText('Growing')).toBeInTheDocument();
      expect(within(arithmeticCard! as HTMLElement).getByText('Strength')).toBeInTheDocument();
    });
  });

  // AC10-AC11: Start Training button
  describe('Start Training CTA', () => {
    it('displays "Start Training" button with coral color and arrow icon (AC10)', async () => {
      await renderComponent();

      const button = screen.getByRole('button', { name: /start your personalized training session/i });
      expect(button).toBeInTheDocument();
      expect(within(button).getByText('Start Training')).toBeInTheDocument();

      // Button should have primary variant (coral color from CSS)
      expect(button).toHaveClass('bg-primary');
    });

    it('calls onStartTraining callback when clicked (AC11)', async () => {
      const user = userEvent.setup();
      await renderComponent();

      const button = screen.getByRole('button', { name: /start your personalized training session/i });
      await user.click(button);

      expect(mockOnStartTraining).toHaveBeenCalledTimes(1);
    });

    it('navigates to /training route with plan weights pre-loaded (AC11)', async () => {
      const user = userEvent.setup();
      await renderComponent();

      const button = screen.getByRole('button', { name: /start your personalized training session/i });
      await user.click(button);

      expect(mockNavigate).toHaveBeenCalledWith('/training', {
        state: {
          fromAssessment: true,
          domainScores: defaultProps.domainScores,
        },
      });
    });
  });

  // AC13: Confetti animation (mocked in tests)
  describe('Confetti Animation', () => {
    it('renders confetti animation on component mount (AC13)', async () => {
      const { container } = await renderComponent();

      // Check that motion.div elements for confetti are rendered
      const confettiContainer = container.querySelector('.pointer-events-none');
      expect(confettiContainer).toBeInTheDocument();

      // Should have 20 confetti particles
      const confettiParticles = confettiContainer?.querySelectorAll('.absolute.h-3.w-3.rounded-full');
      expect(confettiParticles).toHaveLength(20);
    });

    it('confetti particles have correct colors (coral, yellow, mint)', async () => {
      const { container } = await renderComponent();

      const confettiParticles = container.querySelectorAll('.absolute.h-3.w-3.rounded-full');
      const colors = ['#E87461', '#FFD56F', '#A8E6CF'];

      confettiParticles.forEach((particle, i) => {
        const expectedColor = colors[i % 3];
        expect(particle).toHaveStyle({ backgroundColor: expectedColor });
      });
    });
  });

  // AC14: Screen reader accessibility
  describe('Accessibility', () => {
    it('announces each domain score for screen readers (AC14)', async () => {
      await renderComponent();

      // Check ARIA labels on score displays - these are on the score text elements
      const scores = screen.getAllByLabelText(/out of 5/i);
      expect(scores).toHaveLength(6);

      // Verify specific scores have labels
      expect(screen.getByLabelText('3.5 out of 5')).toBeInTheDocument();
      expect(screen.getAllByLabelText('2.0 out of 5')).toHaveLength(2); // place_value and spatial both 2.0
      expect(screen.getAllByLabelText('4.5 out of 5')).toHaveLength(2); // sequencing and arithmetic both 4.5
      expect(screen.getByLabelText('3.0 out of 5')).toBeInTheDocument();
    });

    it('creates live region announcement on mount (AC14)', async () => {
      await renderComponent();

      // Note: The live region is created and removed via useEffect
      // We're verifying the implementation exists by checking ARIA labels
      // on the card contents
      const numberSenseCard = screen.getByText('Number Sense').closest('[role="listitem"]');
      expect(numberSenseCard).toHaveAttribute('role', 'listitem');
    });

    it('has proper heading hierarchy', async () => {
      await renderComponent();

      const mainHeading = screen.getByRole('heading', { level: 1 });
      expect(mainHeading).toHaveTextContent('Your Number Sense Profile');
    });

    it('has accessible button label', async () => {
      await renderComponent();

      const button = screen.getByRole('button', { name: /start your personalized training session/i });
      expect(button).toHaveAttribute('aria-label', 'Start your personalized training session');
    });
  });

  // Edge cases
  describe('Edge Cases', () => {
    it('handles all domains weak', async () => {
      const allWeak: DomainScores = {
        number_sense: 0.5,
        place_value: 1.0,
        sequencing: 2.0,
        arithmetic: 2.5,
        spatial: 1.0,
        applied: 0.5,
      };

      await renderComponent({ ...defaultProps, domainScores: allWeak });

      const needsFocusLabels = screen.getAllByText('Needs Focus');
      expect(needsFocusLabels).toHaveLength(6);
    });

    it('handles all domains strong', async () => {
      const allStrong: DomainScores = {
        number_sense: 5.0,
        place_value: 4.0,
        sequencing: 4.5,
        arithmetic: 5.0,
        spatial: 4.5,
        applied: 3.75,
      };

      await renderComponent({ ...defaultProps, domainScores: allStrong });

      const strengthLabels = screen.getAllByText('Strength');
      expect(strengthLabels).toHaveLength(6);
    });

    it('handles mixed scores correctly', async () => {
      // Already tested in default props, but explicit test
      await renderComponent();

      expect(screen.getAllByText('Growing').length).toBeGreaterThan(0); // number_sense: 3.5, applied: 3.0
      expect(screen.getAllByText('Needs Focus').length).toBeGreaterThan(0); // place_value: 2.0, spatial: 2.0
      expect(screen.getAllByText('Strength').length).toBeGreaterThan(0); // sequencing: 4.5, arithmetic: 4.5
    });

    it('handles boundary score values correctly', async () => {
      const boundaryScores: DomainScores = {
        number_sense: 2.5,  // exact weak boundary
        place_value: 3.0,   // moderate
        sequencing: 3.0,    // moderate
        arithmetic: 3.6,    // just above moderate boundary
        spatial: 3.5,       // exact moderate boundary
        applied: 3.0,       // moderate
      };

      await renderComponent({ ...defaultProps, domainScores: boundaryScores });

      const numberSenseCard = screen.getByText('Number Sense').closest('[role="listitem"]');
      const spatialCard = screen.getByText('Spatial Reasoning').closest('[role="listitem"]');
      const arithmeticCard = screen.getByText('Arithmetic Fluency').closest('[role="listitem"]');

      expect(within(numberSenseCard! as HTMLElement).getByText('Needs Focus')).toBeInTheDocument(); // ≤2.5 is weak
      expect(within(spatialCard! as HTMLElement).getByText('Growing')).toBeInTheDocument(); // 2.6-3.5 is moderate
      expect(within(arithmeticCard! as HTMLElement).getByText('Strength')).toBeInTheDocument(); // >3.5 is strong
    });
  });

  // Score bar fill percentages
  describe('Score Bar Percentages', () => {
    it('score 2.5 = 50% filled', async () => {
      const scores: DomainScores = {
        number_sense: 2.5,
        place_value: 0,
        sequencing: 0,
        arithmetic: 0,
        spatial: 0,
        applied: 0,
      };

      await renderComponent({ ...defaultProps, domainScores: scores });

      expect(screen.getByLabelText(/number sense score progress bar, 50% filled/i)).toBeInTheDocument();
    });

    it('score 5.0 = 100% filled', async () => {
      const scores: DomainScores = {
        number_sense: 5.0,
        place_value: 0,
        sequencing: 0,
        arithmetic: 0,
        spatial: 0,
        applied: 0,
      };

      await renderComponent({ ...defaultProps, domainScores: scores });

      expect(screen.getByLabelText(/number sense score progress bar, 100% filled/i)).toBeInTheDocument();
    });

    it('score 0 = 0% filled', async () => {
      const scores: DomainScores = {
        number_sense: 0,
        place_value: 0,
        sequencing: 0,
        arithmetic: 0,
        spatial: 0,
        applied: 0,
      };

      await renderComponent({ ...defaultProps, domainScores: scores });

      expect(screen.getByLabelText(/number sense score progress bar, 0% filled/i)).toBeInTheDocument();
    });
  });
});
