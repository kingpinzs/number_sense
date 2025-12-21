// StreakCounter.test.tsx - Component tests demonstrating React Testing Library queries
// Tests follow AAA pattern (Arrange, Act, Assert)

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '../../../tests/test-utils';
import userEvent from '@testing-library/user-event';
import { StreakCounter } from './StreakCounter';

describe('StreakCounter', () => {
  // Test 1: Basic rendering with plural "Days"
  it('displays streak number with flame emoji and plural "Days"', () => {
    // Arrange
    const streak = 7;

    // Act
    render(<StreakCounter streak={streak} />);

    // Assert - Using getByRole for accessibility
    const button = screen.getByRole('button', { name: /current streak: 7 days/i });
    expect(button).toBeInTheDocument();

    // Assert - Using getByText for content verification
    expect(screen.getByText('🔥')).toBeInTheDocument();
    expect(screen.getByText('7')).toBeInTheDocument();
    expect(screen.getByText('Days')).toBeInTheDocument();
  });

  // Test 2: Singular "Day" when streak is 1
  it('shows singular "Day" when streak is 1', () => {
    // Arrange & Act
    render(<StreakCounter streak={1} />);

    // Assert - Using getByRole with aria-label
    const button = screen.getByRole('button', { name: /current streak: 1 day/i });
    expect(button).toBeInTheDocument();
    expect(screen.getByText('Day')).toBeInTheDocument();
  });

  // Test 3: Zero streak edge case
  it('displays 0 streak correctly', () => {
    // Arrange & Act
    render(<StreakCounter streak={0} />);

    // Assert
    expect(screen.getByText('0')).toBeInTheDocument();
    expect(screen.getByText('Days')).toBeInTheDocument(); // Plural for 0
  });

  // Test 4: Large streak numbers
  it('displays large streak numbers correctly', () => {
    // Arrange & Act
    render(<StreakCounter streak={365} />);

    // Assert
    expect(screen.getByText('365')).toBeInTheDocument();
  });

  // Test 5: onTap callback is called
  it('calls onTap callback when clicked', async () => {
    // Arrange
    const onTap = vi.fn();
    const user = userEvent.setup();
    render(<StreakCounter streak={5} onTap={onTap} />);

    // Act - Using getByRole for user-centric interaction
    const button = screen.getByRole('button');
    await user.click(button);

    // Assert
    expect(onTap).toHaveBeenCalledTimes(1);
  });

  // Test 6: Works without onTap callback (optional prop)
  it('renders without onTap callback', () => {
    // Arrange & Act - onTap is optional
    render(<StreakCounter streak={3} />);

    // Assert - Should render without errors
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  // Test 7: Multiple clicks call onTap multiple times
  it('handles multiple taps correctly', async () => {
    // Arrange
    const onTap = vi.fn();
    const user = userEvent.setup();
    render(<StreakCounter streak={10} onTap={onTap} />);

    // Act
    const button = screen.getByRole('button');
    await user.click(button);
    await user.click(button);
    await user.click(button);

    // Assert
    expect(onTap).toHaveBeenCalledTimes(3);
  });

  // Test 8: Custom className is applied
  it('applies custom className', () => {
    // Arrange
    const customClass = 'my-custom-class';

    // Act
    render(<StreakCounter streak={5} className={customClass} />);

    // Assert
    const button = screen.getByRole('button');
    expect(button).toHaveClass(customClass);
  });

  // Test 9: Accessible button with proper aria-label
  it('has proper accessibility labels', () => {
    // Arrange & Act
    render(<StreakCounter streak={14} />);

    // Assert - Using getByRole with name ensures button is accessible
    const button = screen.getByRole('button', { name: /current streak: 14 days/i });
    expect(button).toBeInTheDocument();

    // Assert - Fire emoji has role and aria-label
    const fireEmoji = screen.getByRole('img', { name: /fire emoji/i });
    expect(fireEmoji).toBeInTheDocument();
  });

  // Test 10: Reads streak from AppContext when no prop provided
  it('reads streak from AppContext when no streak prop provided', () => {
    // Arrange & Act
    // The test-utils wrapper provides AppContext with default streak of 0
    render(<StreakCounter />);

    // Assert - Should display the default streak from context (0)
    expect(screen.getByText('0')).toBeInTheDocument();
    expect(screen.getByText('Days')).toBeInTheDocument();
  });

  // Test 11: Prop overrides context value
  it('uses prop value when both prop and context are available', () => {
    // Arrange & Act
    // Context has default streak, but prop should override it
    render(<StreakCounter streak={42} />);

    // Assert - Should display the prop value, not context
    expect(screen.getByText('42')).toBeInTheDocument();
  });

  // Test 12: Works without streak prop (uses context)
  it('renders without streak prop using context value', () => {
    // Arrange & Act
    render(<StreakCounter />);

    // Assert - Should render without errors
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
  });
});
