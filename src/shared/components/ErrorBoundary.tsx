// ErrorBoundary - React error boundary for catching component crashes
// Follows React 18+ pattern with componentDidCatch

import { Component, type ReactNode, type ErrorInfo } from 'react';
import { Button } from '@/shared/components/ui/button';

/**
 * Props for custom fallback component
 */
export interface FallbackProps {
  error: Error;
  resetError: () => void;
}

export interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: React.ComponentType<FallbackProps>;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Default fallback UI component
 * Shows friendly error message with retry button
 */
function DefaultFallback({ error, resetError }: FallbackProps) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center p-8 text-center bg-background rounded-lg border border-destructive/20"
    >
      <div className="text-4xl mb-4" role="img" aria-label="Warning">
        ⚠️
      </div>
      <h2 className="text-xl font-semibold text-foreground mb-2">
        Something went wrong
      </h2>
      <p className="text-muted-foreground mb-4 max-w-md">
        We're sorry, but something unexpected happened. Please try again.
      </p>
      {import.meta.env.DEV && (
        <details className="mb-4 text-left w-full max-w-md">
          <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
            Error details
          </summary>
          <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto">
            {error.message}
          </pre>
        </details>
      )}
      <Button onClick={resetError} variant="default">
        Retry
      </Button>
    </div>
  );
}

/**
 * Stub telemetry logger - logs errors for debugging
 * TODO: Replace with actual telemetry service when backend is ready
 */
function logErrorToTelemetry(error: Error, errorInfo: ErrorInfo): void {
  // In development, log to console
  console.error('ErrorBoundary caught an error:', error);
  console.error('Component stack:', errorInfo.componentStack);

  // TODO: Send to telemetry service
  // telemetryService.logError({
  //   error: error.message,
  //   stack: error.stack,
  //   componentStack: errorInfo.componentStack,
  //   timestamp: new Date().toISOString(),
  // });
}

/**
 * ErrorBoundary component - Catches JavaScript errors in child components
 * Features:
 * - Catches errors during rendering, lifecycle methods, and constructors
 * - Shows fallback UI with friendly message and retry button
 * - Logs errors to telemetry service (stub for now)
 * - Supports custom fallback component
 * - Supports onError callback for additional error handling
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Update state so the next render shows the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log error to telemetry service
    logErrorToTelemetry(error, errorInfo);

    // Call optional onError callback
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  resetError = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError && this.state.error) {
      const FallbackComponent = this.props.fallback || DefaultFallback;
      return (
        <FallbackComponent
          error={this.state.error}
          resetError={this.resetError}
        />
      );
    }

    return this.props.children;
  }
}
