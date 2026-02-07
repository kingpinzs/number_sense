// Test utilities - Custom render wrapper with context providers
// This file provides a custom render function that wraps components with all required providers

import { render } from '@testing-library/react';
import type { ReactElement, ReactNode } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AppProvider } from '@/context/AppContext';
import { SessionProvider } from '@/context/SessionContext';
import { UserSettingsProvider } from '@/context/UserSettingsContext';

// RenderOptions type for React 19 compatibility
interface CustomRenderOptions {
  container?: Element | DocumentFragment;
  baseElement?: Element | DocumentFragment;
  hydrate?: boolean;
  wrapper?: React.ComponentType<{ children: ReactNode }>;
}

/**
 * AllTheProviders - Wrapper component that includes all context providers
 * Provider order matches App.tsx: UserSettings → App → Session → Router
 */
function AllTheProviders({ children }: { children: ReactNode }) {
  return (
    <UserSettingsProvider>
      <AppProvider>
        <SessionProvider>
          <BrowserRouter>
            {children}
          </BrowserRouter>
        </SessionProvider>
      </AppProvider>
    </UserSettingsProvider>
  );
}

/**
 * Custom render function that wraps components with all providers
 * Use this instead of @testing-library/react's render for component tests
 *
 * @example
 * import { renderWithProviders } from '../tests/test-utils';
 *
 * test('component renders', () => {
 *   renderWithProviders(<MyComponent />);
 *   expect(screen.getByText('Hello')).toBeInTheDocument();
 * });
 */
function renderWithProviders(
  ui: ReactElement,
  options?: Omit<CustomRenderOptions, 'wrapper'>
) {
  return render(ui, { wrapper: AllTheProviders, ...options });
}

// Re-export everything from React Testing Library
export * from '@testing-library/react';

// Override the default render with our custom one
export { renderWithProviders as render };
