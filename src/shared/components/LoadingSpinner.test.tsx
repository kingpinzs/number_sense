// LoadingSpinner.test.tsx - Component tests for loading spinner
// Tests follow AAA pattern (Arrange, Act, Assert)

import { describe, it, expect } from 'vitest';
import { render, screen } from '../../../tests/test-utils';
import { LoadingSpinner } from './LoadingSpinner';

describe('LoadingSpinner', () => {
  // Test 1: Renders with default medium size
  it('renders with default medium size', () => {
    // Arrange & Act
    render(<LoadingSpinner />);

    // Assert - Has status role
    const spinner = screen.getByRole('status');
    expect(spinner).toBeInTheDocument();
  });

  // Test 2: Has correct ARIA attributes
  it('has role="status" and aria-live="polite"', () => {
    // Arrange & Act
    render(<LoadingSpinner />);

    // Assert
    const spinner = screen.getByRole('status');
    expect(spinner).toHaveAttribute('aria-live', 'polite');
  });

  // Test 3: Has screen reader text
  it('has screen reader text "Loading..."', () => {
    // Arrange & Act
    render(<LoadingSpinner />);

    // Assert - Screen reader only text
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  // Test 4: Accepts custom label
  it('accepts custom label for screen readers', () => {
    // Arrange
    const customLabel = 'Fetching data...';

    // Act
    render(<LoadingSpinner label={customLabel} />);

    // Assert
    expect(screen.getByText(customLabel)).toBeInTheDocument();
  });

  // Test 5: Small size variant
  it('renders small size variant (24px)', () => {
    // Arrange & Act
    render(<LoadingSpinner size="small" />);

    // Assert
    const spinner = screen.getByRole('status');
    const svg = spinner.querySelector('svg');
    expect(svg).toHaveStyle({ width: '24px', height: '24px' });
  });

  // Test 6: Medium size variant (default)
  it('renders medium size variant (40px)', () => {
    // Arrange & Act
    render(<LoadingSpinner size="medium" />);

    // Assert
    const spinner = screen.getByRole('status');
    const svg = spinner.querySelector('svg');
    expect(svg).toHaveStyle({ width: '40px', height: '40px' });
  });

  // Test 7: Large size variant
  it('renders large size variant (60px)', () => {
    // Arrange & Act
    render(<LoadingSpinner size="large" />);

    // Assert
    const spinner = screen.getByRole('status');
    const svg = spinner.querySelector('svg');
    expect(svg).toHaveStyle({ width: '60px', height: '60px' });
  });

  // Test 8: Custom className is applied
  it('applies custom className', () => {
    // Arrange
    const customClass = 'my-custom-spinner';

    // Act
    render(<LoadingSpinner className={customClass} />);

    // Assert
    const spinner = screen.getByRole('status');
    expect(spinner).toHaveClass(customClass);
  });

  // Test 9: SVG is hidden from screen readers
  it('has aria-hidden on SVG element', () => {
    // Arrange & Act
    render(<LoadingSpinner />);

    // Assert
    const spinner = screen.getByRole('status');
    const svg = spinner.querySelector('svg');
    expect(svg).toHaveAttribute('aria-hidden', 'true');
  });

  // Test 10: Has motion-safe animate-spin class for reduced motion support
  it('has motion-safe animate-spin class for reduced motion support', () => {
    // Arrange & Act
    render(<LoadingSpinner />);

    // Assert
    const spinner = screen.getByRole('status');
    const svg = spinner.querySelector('svg');
    expect(svg).toHaveClass('motion-safe:animate-spin');
  });

  // Test 11: Screen reader text is visually hidden
  it('has sr-only class on screen reader text', () => {
    // Arrange & Act
    render(<LoadingSpinner />);

    // Assert - The text should be in a sr-only span
    const srText = screen.getByText('Loading...');
    expect(srText).toHaveClass('sr-only');
  });

  // Test 12: Default size is medium when size prop is omitted
  it('defaults to medium size when size prop is omitted', () => {
    // Arrange & Act
    render(<LoadingSpinner />);

    // Assert
    const spinner = screen.getByRole('status');
    const svg = spinner.querySelector('svg');
    expect(svg).toHaveStyle({ width: '40px', height: '40px' });
  });
});
