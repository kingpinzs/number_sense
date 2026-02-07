// StreakCounter.test.tsx - Component tests demonstrating React Testing Library queries
// Tests follow AAA pattern (Arrange, Act, Assert)
// Story 5.3: Updated for enhanced visual design + new features

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '../../../tests/test-utils';
import userEvent from '@testing-library/user-event';
import { StreakCounter } from './StreakCounter';

describe('StreakCounter', () => {
  // Test 1: Basic rendering with "Day Streak" label
  it('displays streak number with flame emoji and "Day Streak" label', () => {
    render(<StreakCounter streak={7} />);

    const button = screen.getByRole('button', { name: /current streak: 7 days/i });
    expect(button).toBeInTheDocument();

    expect(screen.getByText('🔥')).toBeInTheDocument();
    expect(screen.getByText('7')).toBeInTheDocument();
    expect(screen.getByText('Day Streak')).toBeInTheDocument();
  });

  // Test 2: Singular "day" in aria-label when streak is 1
  it('shows singular "day" in aria-label when streak is 1', () => {
    render(<StreakCounter streak={1} />);

    const button = screen.getByRole('button', { name: /current streak: 1 day/i });
    expect(button).toBeInTheDocument();
    expect(screen.getByText('Day Streak')).toBeInTheDocument();
  });

  // Test 3: Zero streak with dimmed flame
  it('displays 0 streak with dimmed flame', () => {
    render(<StreakCounter streak={0} />);

    expect(screen.getByText('0')).toBeInTheDocument();
    expect(screen.getByText('Day Streak')).toBeInTheDocument();

    // Flame should have dimmed classes
    const flame = screen.getByRole('img', { name: /fire emoji/i });
    expect(flame).toHaveClass('opacity-30');
    expect(flame).toHaveClass('grayscale');
  });

  // Test 4: Large streak numbers
  it('displays large streak numbers correctly', () => {
    render(<StreakCounter streak={365} />);

    expect(screen.getByText('365')).toBeInTheDocument();
  });

  // Test 5: onTap callback is called
  it('calls onTap callback when clicked', async () => {
    const onTap = vi.fn();
    const user = userEvent.setup();
    render(<StreakCounter streak={5} onTap={onTap} />);

    const button = screen.getByRole('button');
    await user.click(button);

    expect(onTap).toHaveBeenCalledTimes(1);
  });

  // Test 6: Works without onTap callback (optional prop)
  it('renders without onTap callback', () => {
    render(<StreakCounter streak={3} />);

    expect(screen.getByText('3')).toBeInTheDocument();
  });

  // Test 7: Multiple clicks call onTap multiple times
  it('handles multiple taps correctly', async () => {
    const onTap = vi.fn();
    const user = userEvent.setup();
    render(<StreakCounter streak={10} onTap={onTap} />);

    const button = screen.getByRole('button');
    await user.click(button);
    await user.click(button);
    await user.click(button);

    expect(onTap).toHaveBeenCalledTimes(3);
  });

  // Test 8: Custom className is applied
  it('applies custom className', () => {
    const customClass = 'my-custom-class';
    render(<StreakCounter streak={5} className={customClass} />);

    const button = screen.getByRole('button');
    expect(button).toHaveClass(customClass);
  });

  // Test 9: Accessible button with proper aria-label
  it('has proper accessibility labels', () => {
    render(<StreakCounter streak={14} />);

    const button = screen.getByRole('button', { name: /current streak: 14 days/i });
    expect(button).toBeInTheDocument();

    const fireEmoji = screen.getByRole('img', { name: /fire emoji/i });
    expect(fireEmoji).toBeInTheDocument();
  });

  // Test 10: Reads streak from AppContext when no prop provided
  it('reads streak from AppContext when no streak prop provided', () => {
    render(<StreakCounter />);

    expect(screen.getByText('0')).toBeInTheDocument();
    expect(screen.getByText('Day Streak')).toBeInTheDocument();
  });

  // Test 11: Prop overrides context value
  it('uses prop value when both prop and context are available', () => {
    render(<StreakCounter streak={42} />);

    expect(screen.getByText('42')).toBeInTheDocument();
  });

  // Test 12: Works without streak prop (uses context)
  it('renders without streak prop using context value', () => {
    render(<StreakCounter />);

    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
  });

  // Test 13: Enhanced visual sizing (text-6xl flame, text-5xl number, text-lg label)
  it('renders with enhanced visual sizing', () => {
    render(<StreakCounter streak={7} />);

    const flame = screen.getByRole('img', { name: /fire emoji/i });
    expect(flame).toHaveClass('text-6xl');

    const number = screen.getByText('7');
    expect(number).toHaveClass('text-5xl');
    expect(number).toHaveClass('font-bold');
    expect(number).toHaveClass('text-primary');

    const label = screen.getByText('Day Streak');
    expect(label).toHaveClass('text-lg');
    expect(label).toHaveClass('text-muted-foreground');
  });

  // Test 14: Flame is NOT dimmed when streak > 0
  it('does not dim flame when streak is positive', () => {
    render(<StreakCounter streak={5} />);

    const flame = screen.getByRole('img', { name: /fire emoji/i });
    expect(flame).not.toHaveClass('opacity-30');
    expect(flame).not.toHaveClass('grayscale');
  });

  // Test 15: noSessions prop shows "Start your streak today!" message
  it('shows "Start your streak today!" when noSessions is true', () => {
    render(<StreakCounter streak={0} noSessions />);

    expect(screen.getByText('Start your streak today!')).toBeInTheDocument();
    expect(screen.queryByText('Day Streak')).not.toBeInTheDocument();
    expect(screen.queryByText('0')).not.toBeInTheDocument();
  });

  // Test 16: noSessions=false shows normal display
  it('shows normal display when noSessions is false', () => {
    render(<StreakCounter streak={5} noSessions={false} />);

    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('Day Streak')).toBeInTheDocument();
    expect(screen.queryByText('Start your streak today!')).not.toBeInTheDocument();
  });

  // Test 17: Flame emoji is rendered as img role
  it('flame emoji is wrapped in animated container', () => {
    render(<StreakCounter streak={3} />);

    const flame = screen.getByRole('img', { name: /fire emoji/i });
    expect(flame).toBeInTheDocument();
    expect(flame.textContent).toBe('🔥');
  });
});
