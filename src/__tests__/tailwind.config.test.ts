import { describe, expect, it } from 'vitest';
import tailwindConfig from '../../tailwind.config';

const theme = tailwindConfig.theme ?? {};
const colors = (theme.extend?.colors ?? {}) as Record<string, any>;
const screens = (theme.screens ?? {}) as Record<string, string>;
const spacing = (theme.spacing ?? {}) as Record<string, string>;

describe('tailwind config', () => {
  it('defines the Balanced Warmth palette', () => {
    expect(colors.primary?.DEFAULT).toBe('#E87461');
    expect(colors.secondary?.DEFAULT).toBe('#A8E6CF');
    expect(colors.accent?.DEFAULT).toBe('#FFD56F');
    expect(colors.success?.DEFAULT).toBe('#66BB6A');
    expect(colors.warning?.DEFAULT).toBe('#FFB74D');
    expect(colors.error?.DEFAULT).toBe('#EF5350');
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
    const sans = theme.extend?.fontFamily?.sans;
    expect(sans?.[0]).toBe('Inter');
  });
});
