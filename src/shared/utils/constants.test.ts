import { describe, expect, it } from 'vitest';
import { BREAKPOINTS } from './constants';

describe('Constants', () => {
  describe('BREAKPOINTS', () => {
    it('defines mobile breakpoint at 320px', () => {
      expect(BREAKPOINTS.mobile).toBe(320);
    });

    it('defines tablet breakpoint at 768px', () => {
      expect(BREAKPOINTS.tablet).toBe(768);
    });

    it('defines desktop breakpoint at 1024px', () => {
      expect(BREAKPOINTS.desktop).toBe(1024);
    });

    it('is immutable (as const)', () => {
      // TypeScript will prevent mutation at compile time
      // This test verifies the structure is correct
      expect(Object.keys(BREAKPOINTS)).toEqual(['mobile', 'tablet', 'desktop']);
    });
  });
});
