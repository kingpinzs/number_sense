// BottomNav.test.tsx - Component tests for bottom navigation
// Tests follow AAA pattern (Arrange, Act, Assert)

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '../../../tests/test-utils';
import userEvent from '@testing-library/user-event';
import { BottomNav } from './BottomNav';

// Mock react-router-dom hooks
const mockNavigate = vi.fn();
let mockPathname = '/';

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({ pathname: mockPathname }),
  };
});

// Mock Dexie db for assessment gating
let mockAssessmentCount = 0;
vi.mock('@/services/storage/db', () => ({
  db: {
    assessments: {
      where: () => ({
        equals: () => ({
          count: () => Promise.resolve(mockAssessmentCount),
        }),
      }),
    },
  },
}));

describe('BottomNav', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    mockPathname = '/';
    mockAssessmentCount = 0;
  });

  // Test 1: Renders all 5 tabs with icons and labels
  it('renders 5 tabs with icons and labels', () => {
    // Arrange & Act
    render(<BottomNav />);

    // Assert - All 5 tab labels are present
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Training')).toBeInTheDocument();
    expect(screen.getByText('Games')).toBeInTheDocument();
    expect(screen.getByText('Progress')).toBeInTheDocument();
    expect(screen.getByText('Profile')).toBeInTheDocument();

    // Assert - All tabs are buttons
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(5);
  });

  // Test 2: Active state highlighting for Home tab
  it('highlights active tab with coral primary color', () => {
    // Arrange
    mockPathname = '/';

    // Act
    render(<BottomNav />);

    // Assert - Home tab should have aria-current="page"
    const homeButton = screen.getByRole('button', { name: /home/i });
    expect(homeButton).toHaveAttribute('aria-current', 'page');

    // Assert - Other tabs should not have aria-current
    const trainingButton = screen.getByRole('button', { name: /training/i });
    expect(trainingButton).not.toHaveAttribute('aria-current');
  });

  // Test 3: Active state for Training tab
  it('highlights Training tab when on /training path', () => {
    // Arrange
    mockPathname = '/training';

    // Act
    render(<BottomNav />);

    // Assert
    const trainingButton = screen.getByRole('button', { name: /training/i });
    expect(trainingButton).toHaveAttribute('aria-current', 'page');

    const homeButton = screen.getByRole('button', { name: /home/i });
    expect(homeButton).not.toHaveAttribute('aria-current');
  });

  // Test 4: Active state for Progress tab
  it('highlights Progress tab when on /progress path', () => {
    // Arrange
    mockPathname = '/progress';

    // Act
    render(<BottomNav />);

    // Assert
    const progressButton = screen.getByRole('button', { name: /progress/i });
    expect(progressButton).toHaveAttribute('aria-current', 'page');
  });

  // Test 5: Active state for Profile tab
  it('highlights Profile tab when on /profile path', () => {
    // Arrange
    mockPathname = '/profile';

    // Act
    render(<BottomNav />);

    // Assert
    const profileButton = screen.getByRole('button', { name: /profile/i });
    expect(profileButton).toHaveAttribute('aria-current', 'page');
  });

  // Test 5b: Active state for Games tab
  it('highlights Games tab when on /cognition path', () => {
    // Arrange
    mockPathname = '/cognition';

    // Act
    render(<BottomNav />);

    // Assert
    const gamesButton = screen.getByRole('button', { name: /games/i });
    expect(gamesButton).toHaveAttribute('aria-current', 'page');

    const homeButton = screen.getByRole('button', { name: /home/i });
    expect(homeButton).not.toHaveAttribute('aria-current');
  });

  // Test 6: Navigates on click (with assessment completed)
  it('navigates when tab is clicked and assessment is completed', async () => {
    // Arrange
    mockAssessmentCount = 1;
    const user = userEvent.setup();
    render(<BottomNav />);

    // Wait for assessment check to resolve
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /training/i })).not.toHaveAttribute('aria-disabled', 'true');
    });

    // Act
    const trainingButton = screen.getByRole('button', { name: /training/i });
    await user.click(trainingButton);

    // Assert
    expect(mockNavigate).toHaveBeenCalledWith('/training');
  });

  // Test 6b: Locked items redirect to assessment when no assessment completed
  it('redirects locked items to assessment when no assessment exists', async () => {
    // Arrange
    mockAssessmentCount = 0;
    const user = userEvent.setup();
    render(<BottomNav />);

    // Wait for assessment check to resolve
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /training/i })).toHaveAttribute('aria-disabled', 'true');
    });

    // Act
    const trainingButton = screen.getByRole('button', { name: /training/i });
    await user.click(trainingButton);

    // Assert — redirects to assessment
    expect(mockNavigate).toHaveBeenCalledWith('/assessment');
  });

  // Test 7: Navigates on Enter key press
  it('navigates when Enter key is pressed', async () => {
    // Arrange
    mockAssessmentCount = 1;
    const user = userEvent.setup();
    render(<BottomNav />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /progress/i })).not.toHaveAttribute('aria-disabled', 'true');
    });

    // Act
    const progressButton = screen.getByRole('button', { name: /progress/i });
    progressButton.focus();
    await user.keyboard('{Enter}');

    // Assert
    expect(mockNavigate).toHaveBeenCalledWith('/progress');
  });

  // Test 8: Navigates on Space key press
  it('navigates when Space key is pressed', async () => {
    // Arrange
    const user = userEvent.setup();
    render(<BottomNav />);

    // Act
    const profileButton = screen.getByRole('button', { name: /profile/i });
    profileButton.focus();
    await user.keyboard(' ');

    // Assert
    expect(mockNavigate).toHaveBeenCalledWith('/profile');
  });

  // Test 9: Has proper navigation role
  it('has navigation role with aria-label', () => {
    // Arrange & Act
    render(<BottomNav />);

    // Assert
    const nav = screen.getByRole('navigation', { name: /main navigation/i });
    expect(nav).toBeInTheDocument();
  });

  // Test 10: Tab navigation works (keyboard accessibility)
  it('supports keyboard tab navigation between buttons', async () => {
    // Arrange
    const user = userEvent.setup();
    render(<BottomNav />);

    // Act - Tab through buttons
    await user.tab();

    // Assert - First button should be focused
    const homeButton = screen.getByRole('button', { name: /home/i });
    expect(homeButton).toHaveFocus();

    // Tab to next button
    await user.tab();
    const trainingButton = screen.getByRole('button', { name: /training/i });
    expect(trainingButton).toHaveFocus();
  });

  // Test 11: Mobile-optimized tap targets (44px minimum)
  it('has minimum 44px tap targets for accessibility', () => {
    // Arrange & Act
    render(<BottomNav />);

    // Assert - Buttons should have min-w-[44px] and min-h-[44px] classes
    const buttons = screen.getAllByRole('button');
    buttons.forEach((button) => {
      expect(button).toHaveClass('min-w-[44px]');
      expect(button).toHaveClass('min-h-[44px]');
    });
  });

  // Test 12: Custom className is applied
  it('applies custom className to nav element', () => {
    // Arrange
    const customClass = 'my-custom-nav';

    // Act
    render(<BottomNav className={customClass} />);

    // Assert
    const nav = screen.getByRole('navigation');
    expect(nav).toHaveClass(customClass);
  });

  // Test 13: All navigation paths work (with assessment completed)
  it('navigates to all correct paths when assessment completed', async () => {
    // Arrange
    mockAssessmentCount = 1;
    const user = userEvent.setup();
    render(<BottomNav />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /training/i })).not.toHaveAttribute('aria-disabled', 'true');
    });

    // Act & Assert - Home
    await user.click(screen.getByRole('button', { name: /home/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/');

    // Act & Assert - Training
    await user.click(screen.getByRole('button', { name: /training/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/training');

    // Act & Assert - Games
    await user.click(screen.getByRole('button', { name: /games/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/cognition');

    // Act & Assert - Progress
    await user.click(screen.getByRole('button', { name: /progress/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/progress');

    // Act & Assert - Profile
    await user.click(screen.getByRole('button', { name: /profile/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/profile');
  });

  // Test 14: Hides on assessment route
  it('returns null when on /assessment path', () => {
    // Arrange
    mockPathname = '/assessment';

    // Act
    const { container } = render(<BottomNav />);

    // Assert
    expect(container.querySelector('nav')).toBeNull();
  });

  // Test 15: Shows lock icons on gated items pre-assessment
  it('shows lock indicators on gated items when no assessment', async () => {
    // Arrange
    mockAssessmentCount = 0;
    render(<BottomNav />);

    // Wait for assessment check
    await waitFor(() => {
      const trainingBtn = screen.getByRole('button', { name: /training/i });
      expect(trainingBtn).toHaveAttribute('aria-disabled', 'true');
    });

    // Assert - Progress should also be locked
    const progressBtn = screen.getByRole('button', { name: /progress/i });
    expect(progressBtn).toHaveAttribute('aria-disabled', 'true');

    // Assert - Home, Games, Profile should NOT be locked
    const homeBtn = screen.getByRole('button', { name: /home/i });
    expect(homeBtn).not.toHaveAttribute('aria-disabled');
  });
});
