import type { Config } from 'tailwindcss';

const spacingScale = Object.fromEntries(
  Array.from({ length: 20 }, (_, index) => {
    const step = index + 1;
    return [step.toString(), `${step * 8}px`];
  })
) as Record<string, string>;

// All colors use CSS custom properties so [data-theme='dark'] switching is
// respected by every Tailwind utility (bg-*, text-*, border-*, ring-*, etc.)
const designTokens = {
  // Surface / layout
  background:               'var(--background)',
  foreground:               'var(--foreground)',
  card:                     'var(--card)',
  'card-foreground':        'var(--card-foreground)',
  popover:                  'var(--popover)',
  'popover-foreground':     'var(--popover-foreground)',
  muted:                    'var(--muted)',
  'muted-foreground':       'var(--muted-foreground)',
  border:                   'var(--border)',
  input:                    'var(--input)',
  ring:                     'var(--ring)',
  // Brand
  primary:                  'var(--primary)',
  'primary-foreground':     'var(--primary-foreground)',
  secondary:                'var(--secondary)',
  'secondary-foreground':   'var(--secondary-foreground)',
  accent:                   'var(--accent)',
  'accent-foreground':      'var(--accent-foreground)',
  // Status
  destructive:              'var(--destructive)',
  'destructive-foreground': 'var(--destructive-foreground)',
  success:                  'var(--success)',
  'success-foreground':     'var(--success-foreground)',
  warning:                  'var(--warning)',
  'warning-foreground':     'var(--warning-foreground)',
  error:                    'var(--error)',
  'error-foreground':       'var(--error-foreground)',
  info:                     'var(--info)',
  'info-foreground':        'var(--info-foreground)',
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
      colors: designTokens,
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif']
      }
    }
  },
  plugins: []
};

export default config;
