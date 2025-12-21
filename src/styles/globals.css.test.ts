import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const css = readFileSync(resolve(__dirname, './globals.css'), 'utf-8');

describe('globals.css', () => {
  it('includes tailwind directives and plugins', () => {
    expect(css).toContain("@import 'tailwindcss'");
    expect(css).toContain("@plugin 'tailwindcss-animate'");
  });

  it('defines Balanced Warmth CSS variables', () => {
    expect(css).toContain('--primary: #e87461');
    expect(css).toContain('--secondary: #a8e6cf');
    expect(css).toContain('--accent: #ffd56f');
    expect(css).toContain('--success: #66bb6a');
    expect(css).toContain('--warning: #ffb74d');
    expect(css).toContain('--error: #ef5350');
  });

  it('prepares a dark theme token set', () => {
    expect(css).toContain('[data-theme=\'dark\']');
    expect(css).toContain('--background: #0d0f12');
    expect(css).toContain('--foreground: #f4f6fb');
  });
});
