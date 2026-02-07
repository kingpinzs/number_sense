// Vitest setup file
// Configure test environment for IndexedDB support and custom matchers

import 'fake-indexeddb/auto';
import '@testing-library/jest-dom/vitest';

// Mock window.matchMedia for accessibility tests
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Clear browser storage between tests to prevent state leakage
beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});

// Mock ResizeObserver for Recharts ResponsiveContainer (Story 5.1)
global.ResizeObserver = class ResizeObserver {
  callback: ResizeObserverCallback;
  constructor(callback: ResizeObserverCallback) {
    this.callback = callback;
  }
  observe() {
    // Trigger callback with mock entry
    this.callback([{
      contentRect: { width: 400, height: 280 },
      target: document.body,
      borderBoxSize: [],
      contentBoxSize: [],
      devicePixelContentBoxSize: [],
    } as unknown as ResizeObserverEntry], this);
  }
  unobserve() {}
  disconnect() {}
};
