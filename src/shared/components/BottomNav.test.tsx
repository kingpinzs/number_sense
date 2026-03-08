// BottomNav.test.tsx - Component tests for bottom navigation
// Tests follow AAA pattern (Arrange, Act, Assert)

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '../../../tests/test-utils';
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

describe('BottomNav', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    mockPathname = '/';
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

  // Test 6: Navigates on click
  it('navigates when tab is clicked', async () => {
    // Arrange
    const user = userEvent.setup();
    render(<BottomNav />);

    // Act
    const trainingButton = screen.getByRole('button', { name: /training/i });
    await user.click(trainingButton);

    // Assert
    expect(mockNavigate).toHaveBeenCalledWith('/training');
  });

  // Test 7: Navigates on Enter key press
  it('navigates when Enter key is pressed', async () => {
    // Arrange
    const user = userEvent.setup();
    render(<BottomNav />);

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

  // Test 13: All navigation paths work
  it('navigates to all correct paths', async () => {
    // Arrange
    const user = userEvent.setup();
    render(<BottomNav />);

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
});
