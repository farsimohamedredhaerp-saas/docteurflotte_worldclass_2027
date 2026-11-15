// Généré automatiquement depuis tokens.json — NE PAS ÉDITER
import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class', '[data-theme="dark"]'],
  content: ['./src/**/*.{ts,tsx,mdx}', './app/**/*.{ts,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        canvas: 'var(--df-bg-base)',
        surface: {
          1: 'var(--df-bg-surface1)',
          2: 'var(--df-bg-surface2)',
          3: 'var(--df-bg-surface3)',
        },
        border: {
          hairline: 'var(--df-border-hairline)',
          subtle: 'var(--df-border-subtle)',
          medium: 'var(--df-border-medium)',
          highlight: 'var(--df-border-highlight)',
        },
        foreground: {
          primary: 'var(--df-text-primary)',
          secondary: 'var(--df-text-secondary)',
          muted: 'var(--df-text-muted)',
          faint: 'var(--df-text-faint)',
          onBrand: 'var(--df-text-on-brand)',
        },
        brand: {
          primary: 'var(--df-brand-primary)',
          'primary-hover': 'var(--df-brand-primary-hover)',
          glow: 'var(--df-brand-glow)',
        },
        telemetry: {
          cyan: 'var(--df-telemetry-cyan)',
          'cyan-subtle': 'var(--df-telemetry-cyan-subtle)',
        },
        status: {
          nominal: 'var(--df-status-nominal)',
          'nominal-bg': 'var(--df-status-nominal-bg)',
          warning: 'var(--df-status-warning)',
          'warning-bg': 'var(--df-status-warning-bg)',
          critical: 'var(--df-status-critical)',
          'critical-bg': 'var(--df-status-critical-bg)',
          neutral: 'var(--df-status-neutral)',
          'neutral-bg': 'var(--df-status-neutral-bg)',
        },
      },
      borderRadius: {
        xs: '4px',
        sm: '6px',
        md: '8px',
        lg: '10px',
        xl: '14px',
        full: '9999px'
      },
      spacing: {
        '0': '0',
        '1': '0.25rem',
        '2': '0.5rem',
        '3': '0.75rem',
        '4': '1rem',
        '5': '1.25rem',
        '6': '1.5rem',
        '8': '2rem',
        '10': '2.5rem',
        '12': '3rem',
        '16': '4rem',
        '20': '5rem'
      },
      zIndex: {
        base: '0',
        sticky: '10',
        dropdown: '100',
        overlay: '200',
        modal: '300',
        popover: '400',
        toast: '500',
        command: '600'
      },
      borderWidth: {
        hairline: '1px',
        medium: '1.5px',
        thick: '2px'
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Geist Mono', 'ui-monospace', 'SFMono-Regular', 'monospace'],
        arabic: ['Noto Sans Arabic', 'IBM Plex Sans Arabic', 'sans-serif'],
      },
      fontSize: {
        xs: '0.6875rem',
        sm: '0.75rem',
        base: '0.8125rem',
        lg: '0.9375rem',
        xl: '1.375rem',
        '2xl': '2rem'
      },
      boxShadow: {
        card: 'var(--df-shadow-card)',
        dropdown: 'var(--df-shadow-dropdown)',
        modal: 'var(--df-shadow-modal)',
        focus: 'var(--df-shadow-focus)',
      },
      transitionTimingFunction: {
        'out-quint': 'cubic-bezier(0.22, 1, 0.36, 1)',
        'in-out': 'cubic-bezier(0.65, 0, 0.35, 1)',
        spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)'
      },
      transitionDuration: {
        fast: '120ms',
        base: '200ms',
        slow: '320ms',
        xslow: '480ms'
      },
    },
  },
  plugins: [],
};

export default config;
