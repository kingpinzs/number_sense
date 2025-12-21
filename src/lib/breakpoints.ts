type ScreenName = 'sm' | 'md' | 'lg';

export const breakpointPixels: Record<ScreenName, number> = {
  sm: 320,
  md: 768,
  lg: 1024
};

export const breakpointQueries: Record<ScreenName, string> = {
  sm: '(min-width: 320px)',
  md: '(min-width: 768px)',
  lg: '(min-width: 1024px)'
};

export type ActiveBreakpoint = 'base' | ScreenName;

export const getActiveBreakpoint = (width: number): ActiveBreakpoint => {
  if (width >= breakpointPixels.lg) {
    return 'lg';
  }
  if (width >= breakpointPixels.md) {
    return 'md';
  }
  if (width >= breakpointPixels.sm) {
    return 'sm';
  }

  return 'base';
};

export const createMatchMediaForWidth = (width: number): typeof window.matchMedia => {
  return (query: string) => {
    const minWidthMatch = query.match(/min-width:\s*(\d+)px/);
    const minWidth = minWidthMatch ? Number(minWidthMatch[1]) : 0;
    const matches = width >= minWidth;

    return {
      matches,
      media: query,
      onchange: null,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      addListener: () => undefined,
      removeListener: () => undefined,
      dispatchEvent: () => false
    };
  };
};
