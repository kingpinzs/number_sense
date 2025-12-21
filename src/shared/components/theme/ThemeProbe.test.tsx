import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import tailwindConfig from '../../../../tailwind.config';
import { ThemeProbe } from './ThemeProbe';

const theme = tailwindConfig.theme ?? {};
const colors = (theme.extend?.colors ?? {}) as Record<string, any>;
const primaryHex: string = colors.primary?.DEFAULT ?? '#E87461';

const hexToRgb = (hex: string) => {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return `rgb(${r}, ${g}, ${b})`;
};

describe('ThemeProbe', () => {
  let styleElement: HTMLStyleElement;

  beforeEach(() => {
    styleElement = document.createElement('style');
    styleElement.innerHTML = `
      .bg-primary { background-color: ${primaryHex}; }
      .text-white { color: #ffffff; }
    `;
    document.head.append(styleElement);
  });

  afterEach(() => {
    styleElement.remove();
  });

  it('renders with the Balanced Warmth primary color', () => {
    render(<ThemeProbe />);
    const probe = screen.getByTestId('theme-probe');
    expect(getComputedStyle(probe).backgroundColor).toBe(hexToRgb(primaryHex));
  });
});
