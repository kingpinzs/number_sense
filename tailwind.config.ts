import type { Config } from 'tailwindcss';

const spacingScale = Object.fromEntries(
  Array.from({ length: 20 }, (_, index) => {
    const step = index + 1;
    return [step.toString(), `${step * 8}px`];
  })
) as Record<string, string>;

const surfaceColors = {
  background: 'var(--background)',
  foreground: 'var(--foreground)',
  card: 'var(--card)',
  'card-foreground': 'var(--card-foreground)',
  popover: 'var(--popover)',
  'popover-foreground': 'var(--popover-foreground)',
  muted: 'var(--muted)',
  'muted-foreground': 'var(--muted-foreground)',
  accent: 'var(--accent)',
  'accent-foreground': 'var(--accent-foreground)',
  border: 'var(--border)',
  input: 'var(--input)',
  ring: 'var(--ring)',
  destructive: 'var(--destructive)',
  'destructive-foreground': 'var(--destructive-foreground)',
  success: {
    DEFAULT: '#66BB6A',
    foreground: '#042612'
  },
  warning: {
    DEFAULT: '#FFB74D',
    foreground: '#4A2500'
  },
  error: {
    DEFAULT: '#EF5350',
    foreground: '#3F0402'
  }
};

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    screens: {
      sm: '320px',
      md: '768px',
      lg: '1024px'
    },
    extend: {
      spacing: spacingScale,
      colors: {
        ...surfaceColors,
        primary: {
          DEFAULT: '#E87461',
          foreground: '#FFFFFF'
        },
        secondary: {
          DEFAULT: '#A8E6CF',
          foreground: '#052E1A'
        },
        accent: {
          DEFAULT: '#FFD56F',
          foreground: '#3B2B00'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif']
      }
    }
  },
  plugins: []
};

export default config;
