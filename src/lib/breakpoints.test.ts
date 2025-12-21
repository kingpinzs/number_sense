import { describe, expect, it, vi } from 'vitest';
import { breakpointPixels, breakpointQueries, createMatchMediaForWidth, getActiveBreakpoint } from './breakpoints';

const installMatchMedia = (width: number) => {
  window.matchMedia = vi.fn(createMatchMediaForWidth(width)) as unknown as typeof window.matchMedia;
};

describe('responsive breakpoints', () => {
  it('activates sm, md, and lg queries at the right widths', () => {
    installMatchMedia(319);
    expect(window.matchMedia(breakpointQueries.sm).matches).toBe(false);

    installMatchMedia(breakpointPixels.sm);
    expect(window.matchMedia(breakpointQueries.sm).matches).toBe(true);

    installMatchMedia(breakpointPixels.md - 1);
    expect(window.matchMedia(breakpointQueries.md).matches).toBe(false);

    installMatchMedia(breakpointPixels.md);
    expect(window.matchMedia(breakpointQueries.md).matches).toBe(true);

    installMatchMedia(breakpointPixels.lg);
    expect(window.matchMedia(breakpointQueries.lg).matches).toBe(true);
  });

  it('maps widths to the expected breakpoint token', () => {
    expect(getActiveBreakpoint(200)).toBe('base');
    expect(getActiveBreakpoint(breakpointPixels.sm)).toBe('sm');
    expect(getActiveBreakpoint(breakpointPixels.md)).toBe('md');
    expect(getActiveBreakpoint(breakpointPixels.lg + 1)).toBe('lg');
  });
});
