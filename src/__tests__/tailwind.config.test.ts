import { describe, expect, it } from 'vitest';
import tailwindConfig from '../../tailwind.config';

const theme = tailwindConfig.theme ?? {};
const colors = (theme.extend?.colors ?? {}) as Record<string, any>;
const screens = (theme.screens ?? {}) as Record<string, string>;
const spacing = (theme.extend?.spacing ?? {}) as Record<string, string>;

describe('tailwind config', () => {
  it('defines the Balanced Warmth palette via CSS custom properties', () => {
    // Tokens reference CSS vars so dark mode works correctly at runtime.
    // The source-of-truth for hex values is globals.css :root / [data-theme='dark'].
    expect(colors.primary).toBe('var(--primary)');
    expect(colors.secondary).toBe('var(--secondary)');
    expect(colors.accent).toBe('var(--accent)');
    expect(colors.success).toBe('var(--success)');
    expect(colors.warning).toBe('var(--warning)');
    expect(colors.error).toBe('var(--error)');
  });

  it('configures responsive breakpoints', () => {
    expect(screens).toMatchObject({
      sm: '320px',
      md: '768px',
      lg: '1024px'
    });
  });

  it('implements the 8px spacing scale from 1 to 20', () => {
    expect(spacing['1']).toBe('8px');
    expect(spacing['10']).toBe('80px');
    expect(spacing['20']).toBe('160px');
    expect(Object.keys(spacing)).toHaveLength(20);
  });

  it('enforces Inter as the sans-serif family', () => {
    const fontFamily = theme.extend?.fontFamily as Record<string, string[]> | undefined;
    expect(fontFamily?.sans?.[0]).toBe('Inter');
  });
});
