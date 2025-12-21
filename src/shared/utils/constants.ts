// Shared constants for the application

export const BREAKPOINTS = {
  mobile: 320,
  tablet: 768,
  desktop: 1024
} as const;

export type Breakpoint = keyof typeof BREAKPOINTS;
