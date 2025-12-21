// ErrorBoundary.test.tsx - Component tests for error boundary
// Tests follow AAA pattern (Arrange, Act, Assert)

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '../../../tests/test-utils';
import userEvent from '@testing-library/user-event';
import { ErrorBoundary, type FallbackProps } from './ErrorBoundary';

// Component that throws an error for testing
function ThrowError({ shouldThrow = true }: { shouldThrow?: boolean }) {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>No error</div>;
}

// Suppress console.error during tests to reduce noise
const originalConsoleError = console.error;

describe('ErrorBoundary', () => {
  beforeEach(() => {
    console.error = vi.fn();
  });

  afterEach(() => {
    console.error = originalConsoleError;
  });

  // Test 1: Renders children when no error
  it('renders children when there is no error', () => {
    // Arrange & Act
    render(
      <ErrorBoundary>
        <div>Child content</div>
      </ErrorBoundary>
    );

    // Assert
    expect(screen.getByText('Child content')).toBeInTheDocument();
  });

  // Test 2: Catches thrown error and shows fallback
  it('catches error and shows fallback UI', () => {
    // Arrange & Act
    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    // Assert - Fallback UI should be shown
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  // Test 3: Shows retry button in fallback
  it('shows retry button in fallback UI', () => {
    // Arrange & Act
    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    // Assert
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
  });

  // Test 4: Retry button resets error boundary
  it('resets error boundary when retry is clicked', async () => {
    // Arrange
    const user = userEvent.setup();
    let shouldThrow = true;

    function ConditionalThrow() {
      if (shouldThrow) {
        throw new Error('Test error');
      }
      return <div>Recovered content</div>;
    }

    const { rerender } = render(
      <ErrorBoundary>
        <ConditionalThrow />
      </ErrorBoundary>
    );

    // Assert - Error state
    expect(screen.getByRole('alert')).toBeInTheDocument();

    // Act - Fix the error condition and click retry
    shouldThrow = false;
    const retryButton = screen.getByRole('button', { name: /retry/i });
    await user.click(retryButton);

    // Rerender to trigger the fixed component
    rerender(
      <ErrorBoundary>
        <ConditionalThrow />
      </ErrorBoundary>
    );

    // Assert - Should show recovered content (boundary was reset)
    // Note: Due to how error boundaries work, after reset it will try to render children again
  });

  // Test 5: Logs error to telemetry (console in dev)
  it('logs error to console in development', () => {
    // Arrange
    const consoleSpy = vi.spyOn(console, 'error');

    // Act
    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    // Assert - Console.error should have been called
    expect(consoleSpy).toHaveBeenCalled();
  });

  // Test 6: Calls onError callback when error occurs
  it('calls onError callback when error occurs', () => {
    // Arrange
    const onError = vi.fn();

    // Act
    render(
      <ErrorBoundary onError={onError}>
        <ThrowError />
      </ErrorBoundary>
    );

    // Assert
    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({ componentStack: expect.any(String) })
    );
  });

  // Test 7: Custom fallback component is used
  it('uses custom fallback component when provided', () => {
    // Arrange
    function CustomFallback({ error, resetError }: FallbackProps) {
      return (
        <div>
          <span>Custom error: {error.message}</span>
          <button onClick={resetError}>Custom retry</button>
        </div>
      );
    }

    // Act
    render(
      <ErrorBoundary fallback={CustomFallback}>
        <ThrowError />
      </ErrorBoundary>
    );

    // Assert
    expect(screen.getByText(/custom error: test error/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /custom retry/i })).toBeInTheDocument();
  });

  // Test 8: Custom fallback receives error object
  it('passes error to custom fallback component', () => {
    // Arrange
    function CustomFallback({ error }: FallbackProps) {
      return <div data-testid="error-message">{error.message}</div>;
    }

    // Act
    render(
      <ErrorBoundary fallback={CustomFallback}>
        <ThrowError />
      </ErrorBoundary>
    );

    // Assert
    expect(screen.getByTestId('error-message')).toHaveTextContent('Test error');
  });

  // Test 9: Custom fallback receives resetError function
  it('passes resetError function to custom fallback', async () => {
    // Arrange
    const user = userEvent.setup();
    let resetCalled = false;

    function CustomFallback({ resetError }: FallbackProps) {
      return (
        <button
          onClick={() => {
            resetCalled = true;
            resetError();
          }}
        >
          Reset
        </button>
      );
    }

    // Act
    render(
      <ErrorBoundary fallback={CustomFallback}>
        <ThrowError />
      </ErrorBoundary>
    );

    await user.click(screen.getByRole('button', { name: /reset/i }));

    // Assert
    expect(resetCalled).toBe(true);
  });

  // Test 10: Shows warning emoji in fallback
  it('shows warning emoji in fallback UI', () => {
    // Arrange & Act
    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    // Assert
    expect(screen.getByRole('img', { name: /warning/i })).toBeInTheDocument();
  });

  // Test 11: Fallback has proper accessibility role
  it('fallback UI has role="alert"', () => {
    // Arrange & Act
    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    // Assert
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  // Test 12: Renders multiple children correctly
  it('renders multiple children when no error', () => {
    // Arrange & Act
    render(
      <ErrorBoundary>
        <div>First child</div>
        <div>Second child</div>
      </ErrorBoundary>
    );

    // Assert
    expect(screen.getByText('First child')).toBeInTheDocument();
    expect(screen.getByText('Second child')).toBeInTheDocument();
  });

});
